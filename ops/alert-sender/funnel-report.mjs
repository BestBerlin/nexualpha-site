// Daily funnel report for the owner (2026-10-10). Reads the click log written by the site
// (/go/<partner>?src=… redirects and the /api/cta-click beacon, one JSON object per line:
// {t, partner, src, ref, kind?, experiment?, variant?}) and turns the last 24 h / 7 d into one Telegram DM.
// experiment/variant (home hero copy A/B, scorecard X5) are present only while that experiment runs; the report then
// adds one line that splits the clicks by variant.
// Pure functions only; alert-sender.mjs schedules and sends it. No row carries an IP or user id.
const DAY = 24 * 3600e3;

export function parseClickLines(text) {
  const rows = [];
  for (const line of String(text || "").split("\n")) {
    if (!line.trim()) continue;
    let row;
    try { row = JSON.parse(line); } catch { continue; }
    const t = Date.parse(row?.t);
    if (!Number.isFinite(t) || typeof row.partner !== "string") continue;
    const experiment = typeof row.experiment === "string" && /^[a-z0-9_]{1,60}$/.test(row.experiment) ? row.experiment : null;
    const variant = experiment && typeof row.variant === "string" && /^[a-z0-9_-]{1,20}$/.test(row.variant) ? row.variant : null;
    rows.push({ t, partner: row.partner, src: typeof row.src === "string" && row.src ? row.src : "unknown", kind: row.kind === "site" ? "site" : "go",
      ...(experiment && variant ? { experiment, variant } : {}) });
  }
  return rows;
}

// Source groups: the beacon marks website clicks kind "site"; Telegram traffic arrives through /go with tg-* sources.
export function sourceGroup(row) {
  if (row.kind === "site") return "site";
  if (/^tg-/.test(row.src)) return "telegram";
  return "other";
}

function countBy(rows, key) {
  const counts = new Map();
  for (const r of rows) counts.set(key(r), (counts.get(key(r)) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

// {experiment: {variant: clicks}} for rows recorded while an experiment ran (site beacon and /go alike).
export function splitByVariant(rows) {
  const out = {};
  for (const r of rows) {
    if (!r.experiment || !r.variant) continue;
    const bucket = (out[r.experiment] ||= {});
    bucket[r.variant] = (bucket[r.variant] || 0) + 1;
  }
  return out;
}

function window_(rows, from, to) { return rows.filter((r) => r.t >= from && r.t < to); }

export function summarizeClicks(rows, now = Date.now()) {
  const summarize = (slice) => ({
    total: slice.length,
    groups: Object.fromEntries(["site", "telegram", "other"].map((g) => [g, slice.filter((r) => sourceGroup(r) === g).length])),
    partners: countBy(slice, (r) => r.partner),
    placements: countBy(slice.filter((r) => r.kind === "site"), (r) => r.src).slice(0, 5),
    tgSources: countBy(slice.filter((r) => sourceGroup(r) === "telegram"), (r) => r.src).slice(0, 5),
    experiments: splitByVariant(slice),
  });
  const day = summarize(window_(rows, now - DAY, now));
  const previousDay = window_(rows, now - 2 * DAY, now - DAY).length;
  return { day, week: summarize(window_(rows, now - 7 * DAY, now)), previousDay, deltaDay: day.total - previousDay };
}

export function countSubscribers(subs) {
  const users = subs && typeof subs === "object" ? subs.users : null;
  return users && typeof users === "object" ? Object.keys(users).length : 0;
}

const T = {
  zh: { title: "📈 NexuAlpha 每日转化漏斗", day: "过去 24 小时", week: "过去 7 天", clicks: "点击", site: "网站按钮", tg: "Telegram", other: "其他", partners: "按交易所", placements: "网站位置 Top 5", tgSources: "Telegram 来源 Top 5", subs: "告警订阅用户", none: "暂无点击", ab: "A/B 点击（7 天）", vsYesterday: (d, p) => (d === 0 ? `与前一日持平（${p}）` : `较前一日 ${d > 0 ? "+" : ""}${d}（前一日 ${p}）`), noFile: "点击日志不可读：CLICK_EVENT_FILE 未挂载或为空" },
  en: { title: "📈 NexuAlpha daily funnel", day: "Last 24 h", week: "Last 7 d", clicks: "clicks", site: "site buttons", tg: "Telegram", other: "other", partners: "By partner", placements: "Top 5 site placements", tgSources: "Top 5 Telegram sources", subs: "Alert subscribers", none: "no clicks yet", ab: "A/B clicks (7 d)", vsYesterday: (d, p) => (d === 0 ? `flat vs previous day (${p})` : `${d > 0 ? "+" : ""}${d} vs previous day (${p})`), noFile: "Click log unreadable: CLICK_EVENT_FILE not mounted or empty" },
};

export function funnelReportMessage({ summary, subscribers, lang = "zh", fileReadable = true, date = new Date().toISOString().slice(0, 10) }) {
  const t = T[lang] || T.zh;
  const list = (pairs) => (pairs.length ? pairs.map(([k, n]) => `${k} ${n}`).join(" · ") : t.none);
  const block = (label, s) => [
    `<b>${label}</b>: ${s.total} ${t.clicks} (${t.site} ${s.groups.site} / ${t.tg} ${s.groups.telegram} / ${t.other} ${s.groups.other})`,
    `${t.partners}: ${list(s.partners)}`,
  ];
  const lines = [`<b>${t.title}</b> ${date}`, ""];
  if (!fileReadable) lines.push(`⚠️ ${t.noFile}`, "");
  lines.push(...block(t.day, summary.day), t.vsYesterday(summary.deltaDay, summary.previousDay), "");
  lines.push(...block(t.week, summary.week), "");
  lines.push(`${t.placements}: ${list(summary.week.placements)}`, `${t.tgSources}: ${list(summary.week.tgSources)}`, "");
  for (const [experiment, variants] of Object.entries(summary.week.experiments || {})) {
    lines.push(`${t.ab} ${experiment}: ${Object.keys(variants).sort().map((v) => `${v} ${variants[v]}`).join(" · ")}`);
  }
  lines.push(`${t.subs}: ${subscribers}`);
  return lines.join("\n");
}
