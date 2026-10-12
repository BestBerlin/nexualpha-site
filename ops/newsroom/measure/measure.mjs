#!/usr/bin/env node
// T9 newsroom measurement loop (DESIGN §9). Runs once a day (Claude scheduled task "nexualpha-newsroom-measure", 09:10
// Asia/Shanghai) from the internal-disk install in ~/.codex/private/newsroom-measure (see install.sh):
//   (a) GSC URL Inspection of every article at +24 h and again at +7 d (daily budget, default 400 of the 2,000 quota)
//   (b) per-article impressions / clicks (GSC Search Analytics, 14-day window, every locale URL of the slug)
//   (c) writes the inspection result back into the content lane ledger (states.indexed, states.gsc), backup first
//   (d) the ramp gate: 7-day indexation rate, impressions per article (14 d vs previous 14 d), stage 0/1/2
//   (e) a short Chinese daily report: <REPORT_DIR>/YYYY-MM-DD.md (copy in <STATE_DIR>/reports)
// Flags: --dry-run (no ledger write, no report), --budget N, --no-clicks, --now ISO.
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GSC_SITE, inspectUrl, isoDay, newsUrlParts, searchAnalytics } from "./gsc.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = os.homedir();
const arg = (name, fallback = null) => { const index = process.argv.indexOf(`--${name}`); return index > 0 ? process.argv[index + 1] : fallback; };
const flag = (name) => process.argv.includes(`--${name}`);

export const CONFIG = {
  feedUrl: process.env.NEWS_FEED_URL || "https://nexualpha.com/content/news-feed-summary.json",
  ledger: process.env.NEWSROOM_LEDGER || `${HOME}/Documents/AEO Crypto Factory/deployment/nexualpha-content-engine/state/claude-daily-ledger.jsonl`,
  stateDir: process.env.NEWSROOM_MEASURE_DIR || `${HOME}/.codex/private/newsroom-measure`,
  reportDir: process.env.NEWSROOM_REPORT_DIR || "/Volumes/致态2TB/nx-agents/newsroom/reports",
  thinList: process.env.NEWSROOM_THIN_LIST || path.join(HERE, "thin-noindex.json"),
  dailyBudget: Number(arg("budget", process.env.GSC_INSPECT_BUDGET || 400)),
  origin: "https://nexualpha.com",
};

const DAY = 864e5;
const RAMP = [
  { stage: 0, cap: 24 },
  { stage: 1, cap: 30, needDays: 7 },
  { stage: 2, cap: 40, needDays: 14 },
];
const RATE_UP = 0.6, RATE_DOWN = 0.4, DOWN_DAYS = 5;

const readJson = (file, fallback) => { try { return JSON.parse(readFileSync(file, "utf8")); } catch { return fallback; } };
const writeJsonAtomic = (file, value) => { const tmp = `${file}.tmp`; writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`); renameSync(tmp, file); };
const articleUrl = (slug) => `${CONFIG.origin}/news/${slug}`;
const pct = (value) => (value === null || value === undefined ? "—" : `${Math.round(value * 1000) / 10}%`);
const zhCoverage = (state) => ({
  "Submitted and indexed": "已收录（站点地图提交）",
  "Indexed, not submitted in sitemap": "已收录（未在站点地图）",
  "Discovered - currently not indexed": "已发现，未收录",
  "Crawled - currently not indexed": "已抓取，未收录",
  "URL is unknown to Google": "Google 尚不知道此网址",
  "Excluded by ‘noindex’ tag": "被 noindex 排除",
  "Alternate page with proper canonical tag": "规范网址指向其他页面",
  "Duplicate, Google chose different canonical than user": "重复页，Google 另选规范网址",
}[state] || state || "未知");

export function indexedVerdict(result) {
  if (!result) return null;
  if (result.verdict === "PASS" || /indexed/i.test(result.coverageState || "") && !/not indexed/i.test(result.coverageState || "")) return "indexed";
  if (/unknown to Google/i.test(result.coverageState || "")) return "unknown_to_google";
  return "not_indexed";
}

/** Which URLs to inspect today, most valuable first, within the budget. */
export function planInspections(articles, state, nowMs, budget, flagged = new Set()) {
  const due7 = [], due24 = [];
  for (const article of articles) {
    if (flagged.has(article.slug)) continue;
    const published = Date.parse(article.publishedAt);
    if (!Number.isFinite(published)) continue;
    const age = nowMs - published;
    const record = state.inspections[article.slug] || {};
    if (age >= 7 * DAY && age < 21 * DAY && !record.d7) due7.push({ slug: article.slug, check: "d7", published });
    else if (age >= DAY && age < 7 * DAY && !record.h24) due24.push({ slug: article.slug, check: "h24", published });
  }
  due7.sort((a, b) => a.published - b.published);
  due24.sort((a, b) => a.published - b.published);
  return [...due7, ...due24].slice(0, Math.max(0, budget));
}

/** Ramp gate from the daily history (DESIGN §9). Pure: history rows are { date, rate7, imprPerArticle14, imprPerArticlePrev14 }. */
export function computeRamp(history, previousStage = 0) {
  const rows = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const streak = (test) => { let n = 0; for (let i = rows.length - 1; i >= 0 && test(rows[i]); i -= 1) n += 1; return n; };
  const upDays = streak((row) => row.rate7 !== null && row.rate7 >= RATE_UP && !(row.imprPerArticle14 < row.imprPerArticlePrev14));
  const downDays = streak((row) => row.rate7 !== null && row.rate7 < RATE_DOWN);
  let stage = previousStage;
  if (stage > 0 && downDays >= DOWN_DAYS) stage -= 1;
  else if (stage < RAMP.length - 1 && upDays >= RAMP[stage + 1].needDays) stage += 1;
  return { stage, cap: RAMP[stage].cap, upDays, downDays, nextNeedDays: RAMP[stage + 1]?.needDays ?? null };
}

/** Ledger lines with states.indexed resolved from the inspection state; untouched lines are returned byte-identical. */
export function backfillLedgerLines(lines, inspections) {
  let changed = 0;
  const out = lines.map((line) => {
    if (!line.trim()) return line;
    let row;
    try { row = JSON.parse(line); } catch { return line; }
    const record = inspections[row.slug];
    const latest = record?.d7 || record?.h24 || record?.backfill;
    if (!latest || !row.states || typeof row.states !== "object") return line;
    const verdict = indexedVerdict(latest);
    if (row.states.indexed === verdict && row.states.gsc?.inspectedAt === latest.inspectedAt) return line;
    row.states.indexed = verdict;
    row.states.gsc = { coverageState: latest.coverageState, verdict: latest.verdict, lastCrawlTime: latest.lastCrawlTime, inspectedAt: latest.inspectedAt, check: record?.d7 ? "d7" : record?.h24 ? "h24" : "backfill" };
    changed += 1;
    return JSON.stringify(row);
  });
  return { lines: out, changed };
}

async function fetchFeed() {
  const response = await fetch(`${CONFIG.feedUrl}?ts=${Date.now()}`, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`feed ${response.status}`);
  const json = await response.json();
  return (json.articles || []).filter((article) => article?.status === "PUBLISHED" && article.slug);
}

async function perArticleMetrics(endMs, days) {
  const end = isoDay(endMs - 2 * DAY); // GSC data lags ~2 days
  const start = isoDay(endMs - (days + 1) * DAY);
  const rows = await searchAnalytics({ startDate: start, endDate: end, dimensions: ["page"] });
  const bySlug = new Map();
  for (const row of rows) {
    const parts = newsUrlParts(row.keys[0]);
    if (!parts) continue;
    const item = bySlug.get(parts.slug) || { impressions: 0, clicks: 0 };
    item.impressions += row.impressions; item.clicks += row.clicks;
    bySlug.set(parts.slug, item);
  }
  return { start, end, bySlug };
}

// /go + site clicks per article from the BaoTa click log (counts only; never raw events). Optional.
function clickCounts(sinceMs) {
  try {
    const knownHosts = path.join(CONFIG.stateDir, "known_hosts");
    const script = `import json,re,collections,sys\nc=collections.Counter()\nfor line in open('/data/private/nexualpha/clicks/go-clicks.jsonl',errors='ignore'):\n  try: e=json.loads(line)\n  except Exception: continue\n  if str(e.get('t',''))[:10] < '${isoDay(sinceMs)}': continue\n  m=re.search(r'/news/([a-z0-9-]+)',str(e.get('ref') or '')+' '+str(e.get('path') or ''))\n  if m: c[m.group(1)]+=1\nprint(json.dumps(c))`;
    const out = execFileSync("ssh", ["-i", `${HOME}/.ssh/nexualpha_gh_deploy`, "-p", "56724", "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes", "-o", `UserKnownHostsFile=${knownHosts}`, "-o", "ConnectTimeout=15", "root@103.250.172.210", "python3", "-"], { input: script, encoding: "utf8", timeout: 60_000 });
    return JSON.parse(out.trim() || "{}");
  } catch { return null; }
}

function writeReport(dateKey, text) {
  const targets = [CONFIG.reportDir, path.join(CONFIG.stateDir, "reports")];
  const written = [];
  for (const dir of targets) {
    try { mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, `${dateKey}.md`), text); written.push(path.join(dir, `${dateKey}.md`)); } catch { /* volume not mounted */ }
  }
  return written;
}

export function renderReport(model) {
  const { dateKey, published24, published7d, inspected, rate7, sample7, ramp, metrics, metricsPrev, top, clicks, ledger, thinCount, canonicalCount, quotaUsed, errors, thinSample } = model;
  const lines = [
    `# 新闻室日报 ${dateKey}`,
    "",
    `- 发布：过去 24 小时 ${published24} 篇，过去 7 天 ${published7d} 篇。`,
    `- 收录（7 天检查）：${sample7 ? `${rate7.indexed}/${sample7} = ${pct(rate7.rate)}` : "暂无满 7 天的新文章样本"}。目标 ≥60% 连续 7 天才放量。`,
    `- 放量阶段：Stage ${ramp.stage}（每天上限 ${ramp.cap} 篇）。达标连续 ${ramp.upDays} 天${ramp.nextNeedDays ? `，需要 ${ramp.nextNeedDays} 天升级` : ""}；低于 40% 连续 ${ramp.downDays} 天。`,
    `- 展示/点击（14 天，每篇平均）：${metrics.perArticle.toFixed(2)} 次展示，前 14 天 ${metricsPrev.perArticle.toFixed(2)}；共 ${metrics.impressions} 次展示、${metrics.clicks} 次点击。`,
    `- 今日 URL 检查：${inspected.length} 个（配额今日已用 ${quotaUsed}/${CONFIG.dailyBudget}）。`,
    `- 账本回填：${ledger.changed} 行更新，仍待定 ${ledger.pending} 行。`,
    `- T10 清理：${thinCount} 篇模板页 noindex，${canonicalCount} 篇重复页 canonical。${thinSample ? `抽查：${thinSample}` : ""}`,
    `- 文章带来的 /go 点击（7 天）：${clicks === null ? "无法读取（服务器未连上）" : Object.values(clicks).reduce((s, n) => s + n, 0)}。`,
  ];
  if (inspected.length) {
    lines.push("", "## 今日检查结果", "", "| 文章 | 检查 | 状态 |", "|---|---|---|");
    for (const row of inspected.slice(0, 15)) lines.push(`| ${row.slug.slice(0, 70)} | ${row.check === "d7" ? "+7 天" : "+24 小时"} | ${zhCoverage(row.coverageState)} |`);
    if (inspected.length > 15) lines.push(`| …另 ${inspected.length - 15} 篇 | | |`);
  }
  if (top.length) {
    lines.push("", "## 展示最多的文章（14 天）", "");
    for (const row of top) lines.push(`- ${row.slug}：${row.impressions} 次展示，${row.clicks} 次点击`);
  }
  if (errors.length) lines.push("", "## 问题", "", ...errors.map((error) => `- ${error}`));
  lines.push("", `_自动生成：ops/newsroom/measure/measure.mjs，站点 ${GSC_SITE}。_`, "");
  return lines.join("\n");
}

async function main() {
  const nowMs = arg("now") ? Date.parse(arg("now")) : Date.now();
  const dateKey = new Date(nowMs + 8 * 3600_000).toISOString().slice(0, 10); // Asia/Shanghai date
  mkdirSync(CONFIG.stateDir, { recursive: true });
  const statePath = path.join(CONFIG.stateDir, "state.json");
  const state = readJson(statePath, { inspections: {}, quota: {}, history: [], stage: 0 });
  state.inspections ||= {}; state.quota ||= {}; state.history ||= []; state.stage ||= 0;
  const errors = [];
  const thin = readJson(CONFIG.thinList, { noindex: [], canonical: [] });
  const flagged = new Set([...(thin.noindex || []).map((row) => row.slug), ...(thin.canonical || []).map((row) => row.slug)]);

  const articles = await fetchFeed();
  const quotaToday = state.quota[dateKey] || 0;
  let budget = Math.max(0, CONFIG.dailyBudget - quotaToday);

  // (c) ledger rows still pending and ≥ 24 h old get a one-off inspection (the 52 rows the audit found).
  const ledgerText = existsSync(CONFIG.ledger) ? readFileSync(CONFIG.ledger, "utf8") : "";
  const ledgerRows = ledgerText.split("\n").filter((line) => line.trim()).map((line) => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
  const publishedBySlug = new Map(articles.map((article) => [article.slug, Date.parse(article.publishedAt)]));
  const backfill = [...new Set(ledgerRows.filter((row) => row.states?.indexed === "pending" && row.slug).map((row) => row.slug))]
    .filter((slug) => !state.inspections[slug]?.h24 && !state.inspections[slug]?.d7 && !state.inspections[slug]?.backfill)
    .filter((slug) => nowMs - (publishedBySlug.get(slug) ?? nowMs) >= DAY);

  // (a) +24 h / +7 d plan, then ledger backfill with what is left of the budget.
  const plan = planInspections(articles, state, nowMs, budget, flagged);
  const queue = [...plan, ...backfill.filter((slug) => !plan.some((item) => item.slug === slug)).map((slug) => ({ slug, check: "backfill" }))].slice(0, budget);
  const inspected = [];
  for (const item of queue) {
    if (flag("dry-run")) break;
    try {
      const result = { ...(await inspectUrl(articleUrl(item.slug))), inspectedAt: new Date().toISOString() };
      state.inspections[item.slug] = { ...(state.inspections[item.slug] || {}), [item.check]: result };
      inspected.push({ ...item, ...result });
      state.quota[dateKey] = (state.quota[dateKey] || 0) + 1;
    } catch (error) {
      errors.push(`URL 检查失败 ${item.slug}: ${error.message}`);
      if (error.status === 429) break;
    }
  }
  // A small daily sample of T10 noindexed pages (rotating) to see Google pick up the tag.
  let thinSample = "";
  if (!flag("dry-run") && thin.noindex?.length && (state.quota[dateKey] || 0) < CONFIG.dailyBudget) {
    const offset = (state.thinCursor || 0) % thin.noindex.length;
    const picks = thin.noindex.slice(offset, offset + 3);
    state.thinCursor = offset + picks.length;
    const states = [];
    for (const row of picks) {
      try { const result = await inspectUrl(articleUrl(row.slug)); states.push(zhCoverage(result.coverageState)); state.quota[dateKey] = (state.quota[dateKey] || 0) + 1; } catch { /* sample only */ }
    }
    if (states.length) thinSample = states.join("；");
  }

  // (b) metrics: 14 d and the 14 d before it.
  const metricsNow = await perArticleMetrics(nowMs, 14);
  const metricsPrevRaw = await perArticleMetrics(nowMs - 14 * DAY, 14);
  const inWindow = (startMs, endMs) => articles.filter((article) => { const t = Date.parse(article.publishedAt); return t >= startMs && t < endMs && !flagged.has(article.slug); });
  const summarize = (bySlug, pool) => {
    const impressions = pool.reduce((sum, article) => sum + (bySlug.get(article.slug)?.impressions || 0), 0);
    const clicks = pool.reduce((sum, article) => sum + (bySlug.get(article.slug)?.clicks || 0), 0);
    return { impressions, clicks, perArticle: pool.length ? impressions / pool.length : 0 };
  };
  const metrics = summarize(metricsNow.bySlug, inWindow(nowMs - 14 * DAY, nowMs));
  const metricsPrev = summarize(metricsPrevRaw.bySlug, inWindow(nowMs - 28 * DAY, nowMs - 14 * DAY));
  const top = [...metricsNow.bySlug.entries()].map(([slug, value]) => ({ slug, ...value })).sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks).slice(0, 5);

  // (d) 7-day indexation rate: articles published 7–14 days ago (not T10-flagged) with a +7 d inspection.
  const cohort = inWindow(nowMs - 14 * DAY, nowMs - 7 * DAY).filter((article) => state.inspections[article.slug]?.d7);
  const indexed7 = cohort.filter((article) => indexedVerdict(state.inspections[article.slug].d7) === "indexed").length;
  const rate7 = { indexed: indexed7, rate: cohort.length ? indexed7 / cohort.length : null };
  state.history = [...state.history.filter((row) => row.date !== dateKey), { date: dateKey, rate7: rate7.rate, sample: cohort.length, imprPerArticle14: metrics.perArticle, imprPerArticlePrev14: metricsPrev.perArticle }].slice(-120);
  const ramp = computeRamp(state.history, state.stage);
  state.stage = ramp.stage;

  // (c) ledger write-back (backup first; re-read just before writing so a concurrent append is kept).
  let ledger = { changed: 0, pending: ledgerRows.filter((row) => row.states?.indexed === "pending").length };
  if (!flag("dry-run") && existsSync(CONFIG.ledger)) {
    const backupDir = path.join(CONFIG.stateDir, "ledger-backups");
    mkdirSync(backupDir, { recursive: true });
    const current = readFileSync(CONFIG.ledger, "utf8");
    const { lines, changed } = backfillLedgerLines(current.split("\n"), state.inspections);
    if (changed) {
      copyFileSync(CONFIG.ledger, path.join(backupDir, `claude-daily-ledger.${new Date().toISOString().replace(/[:.]/g, "")}.jsonl`));
      const tmp = `${CONFIG.ledger}.measure-tmp`;
      writeFileSync(tmp, lines.join("\n"));
      if (readFileSync(CONFIG.ledger, "utf8") === current) renameSync(tmp, CONFIG.ledger);
      else errors.push("账本在写回时被内容任务改动，本次跳过写回（下次运行会补上）。");
    }
    const after = readFileSync(CONFIG.ledger, "utf8").split("\n").filter((line) => line.trim()).map((line) => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
    ledger = { changed, pending: after.filter((row) => row.states?.indexed === "pending").length };
  }

  const clicks = flag("no-clicks") ? null : clickCounts(nowMs - 7 * DAY);
  const report = renderReport({
    dateKey,
    published24: articles.filter((article) => nowMs - Date.parse(article.publishedAt) < DAY).length,
    published7d: articles.filter((article) => nowMs - Date.parse(article.publishedAt) < 7 * DAY).length,
    inspected, rate7, sample7: cohort.length, ramp, metrics, metricsPrev, top, clicks, ledger,
    thinCount: (thin.noindex || []).length, canonicalCount: (thin.canonical || []).length,
    quotaUsed: state.quota[dateKey] || 0, errors, thinSample,
  });
  for (const key of Object.keys(state.quota)) if (key < isoDay(nowMs - 30 * DAY)) delete state.quota[key];
  if (flag("dry-run")) { console.log(report); return; }
  writeJsonAtomic(statePath, state);
  const written = writeReport(dateKey, report);
  console.log(JSON.stringify({ dateKey, inspected: inspected.length, ledgerChanged: ledger.changed, ledgerPending: ledger.pending, stage: ramp.stage, rate7: rate7.rate, reports: written, errors: errors.length }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
}
