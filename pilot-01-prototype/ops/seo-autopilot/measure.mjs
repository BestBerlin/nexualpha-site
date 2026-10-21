import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { searchAnalytics, inspectUrl, isoDay } from '../../../ops/newsroom/measure/gsc.mjs';
import { isStrikingRow } from '../../scripts/striking-distance-lib.mjs';
import { computeRouteSeo } from '../../src/data/seo-injection.js';
export const defaultDir = '/Volumes/致态2TB/nx-agents/seo-autopilot/reports';
const origin = 'https://nexualpha.com';
const day = 86400000;
export function windows(date) {
  const now = Date.parse(`${date}T00:00:00Z`), end = now - 3 * day;
  return { current: { startDate: isoDay(end - 6 * day), endDate: isoDay(end) }, previous: { startDate: isoDay(end - 13 * day), endDate: isoDay(end - 7 * day) }, month: { startDate: isoDay(end - 27 * day), endDate: isoDay(end) } };
}
export function selectTargets(rows) {
  const excluded = [], best = new Map();
  for (const row of rows) {
    const query = String(row.keys?.[0] || '');
    const reason = /nexu|opusdte/i.test(query) ? 'brand-collision' : /\b(?:site|inbody):|["“”]/i.test(query) ? 'operator-query' : !/\s/.test(query.trim()) && row.position > 80 ? 'head-noise' : null;
    if (reason) { excluded.push({ query, reason, position: row.position }); continue; }
    if (!isStrikingRow(row, { minPosition: 8, maxPosition: 70, minImpressions: 2 })) continue;
    const previous = best.get(query);
    if (!previous || row.position < previous.position || (row.position === previous.position && row.impressions > previous.impressions)) best.set(query, { query, page: row.keys[1], position: row.position, impressions: row.impressions, clicks: row.clicks || 0 });
  }
  return { targets: [...best.values()].sort((a, b) => b.impressions - a.impressions), excluded };
}
export function pageDecay(current, previous) {
  const now = new Map(current.map((r) => [r.keys[0], r.impressions]));
  return previous.filter((r) => r.impressions >= 20 && (now.get(r.keys[0]) || 0) <= r.impressions / 2).map((r) => ({ page: r.keys[0], before: r.impressions, after: now.get(r.keys[0]) || 0 }));
}
export function proposal(target, html) {
  const url = new URL(target.page), pathname = url.pathname;
  const seo = computeRouteSeo({ url: url.href });
  const title = html?.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || seo.title || '';
  const h1 = html?.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>/g, ' ') || '';
  const tokens = target.query.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const missing = (text) => tokens.some((t) => !text.toLowerCase().includes(t));
  const locale = pathname.startsWith('/zh-hans/') ? 'zh-hans' : seo.locale === 'en' ? 'en' : null;
  const contentPath = pathname.replace(/^\/zh-hans(?=\/)/, '');
  const eligible = Boolean(!url.search && locale && seo.status === 200 && !/\bnoindex\b/.test(seo.robots) && /^(?:\/exchanges\/[^/]+|\/compare\/[^/]+|\/news(?:\/page\/\d+|\/category\/[^/]+)?|\/data\/[^/]+|\/liquidations|\/funding-rates)$/.test(contentPath));
  const brand = 'NexuAlpha';
  const description = seo.description || '';
  const action = html === null ? 'none' : missing(title) ? 'title' : missing(h1) ? 'answer-first' : missing(description) ? 'description' : 'none';
  // Reuse observed query language; no synthesized claims or amounts.
  return { ...target, pathname, locale, eligible, brand, currentTitle: title, currentDescription: description, proposedDescription: `${target.query}: ${description}${description.includes(brand) ? '' : ` | ${brand}`}`, action, proposedTitle: `${target.query} | ${brand}`, evidence: html === null ? 'page-fetch-unavailable' : 'live-title-h1' };
}
// Explicit radar unmatched intents remain editorial hints, not publication authority.
export function unmatchedTopics(radar) {
  return radar.filter((r) => typeof r.query === 'string' && !r.url && /new[- ]article/i.test(r.action || '') && !/nexu|opusdte|\b(?:site|inbody):|["“”]/i.test(r.query)).map((r) => ({ query: r.query, locale: r.market || 'en', action: 'new-article', source: 'radar-unmatched-hint', requiresEditorialReview: true }));
}
export async function fetchText(url) {
  const parsed = new URL(url);
  if (parsed.origin !== origin) throw new Error('Non-site URL rejected');
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'error' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}
async function bing(warnings) {
  try {
    const env = await readFile(process.env.BING_API_ENV || `${os.homedir()}/.codex/private/bing-webmaster-api.env`, 'utf8');
    const key = env.match(/^BING_WEBMASTER_API_KEY\s*=\s*["']?([^\s"']+)/m)?.[1];
    if (!key) throw new Error('missing key');
    const result = {};
    for (const method of ['GetQueryStats', 'GetCrawlStats']) {
      const response = await fetch(`https://ssl.bing.com/webmaster/api.svc/json/${method}?siteUrl=${encodeURIComponent(`${origin}/`)}&apikey=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      result[method] = await response.json();
    }
    return result;
  } catch { warnings.push('Bing unavailable (credentials, HTTP error or timeout); no key or response body logged.'); return null; }
}
export async function saveReport(report, dir) {
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${report.date}.json`), `${JSON.stringify(report, null, 2)}\n`);
  const jsonBlock = (value) => `\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n`;
  const markdown = [`# SEO autopilot ${report.date}`, '## Windows and metrics', jsonBlock({ periods: report.periods, ...report.metrics }), '## Top proposals', proposalTable(report.targets), '## Page decay', jsonBlock(report.pageDecay), '## Index health', jsonBlock({ notIndexed: report.notIndexed, unknown: report.inspectionUnknown, urls: report.indexHealth }), '## Verification', jsonBlock(report.verified || []), '## Application', jsonBlock(report.application || {}), '## Warnings', ...report.warnings.map((s) => `- ${s}`)].join('\n\n');
  await writeFile(path.join(dir, `${report.date}.md`), `${markdown}\n`);
}
export function proposalTable(targets) {
  const cell = (s) => String(s ?? '').replace(/[|\r\n]/g, ' ');
  return ['| query | page | pos | imp | action | proposed title |', '|---|---|---:|---:|---|---|', ...targets.slice(0, 10).map((p) => `| ${[p.query, p.pathname, p.position, p.impressions, p.action, p.proposedTitle].map(cell).join(' | ')} |`)].join('\n');
}
export async function measure({ date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }), dir = process.env.SEO_AUTOPILOT_DIR || defaultDir, query = searchAnalytics, inspect = inspectUrl } = {}) {
  const periods = windows(date), warnings = [];
  const pull = (period, dimensions) => query({ ...period, dimensions, dataState: 'final' });
  const [current, previous, countries, devices, rows, currentPages, previousPages, previousCountries, previousDevices] = await Promise.all([
    pull(periods.current, []), pull(periods.previous, []), pull(periods.current, ['country']), pull(periods.current, ['device']), pull(periods.month, ['query', 'page']), pull(periods.current, ['page']), pull(periods.previous, ['page']), pull(periods.previous, ['country']), pull(periods.previous, ['device']),
  ]);
  const selected = selectTargets(rows), targets = [];
  const protectedPages = new Set([...currentPages, ...rows.map((r) => ({ ...r, keys: [r.keys[1]] }))].filter((r) => r.position <= 8).map((r) => r.keys[0]));
  for (const target of selected.targets.slice(0, 100)) {
    let html = null;
    try { html = await fetchText(target.page); } catch { warnings.push(`Page unavailable: ${target.page}`); }
    const item = proposal(target, html);
    if (protectedPages.has(target.page)) { item.eligible = false; item.protection = "page-already-top-eight"; }
    targets.push(item);
  }
  if (selected.targets.length > 100) warnings.push('Live page analysis capped at 100 targets; remaining candidates retained in strikingDistance.');
  warnings.push('Inbound-link analysis skipped: no complete built HTML graph; no internal-link claims made.');
  let radar = [], indexHealth = [];
  try { radar = JSON.parse(await readFile(process.env.SEO_RADAR_FILE || '/Volumes/致态2TB/nx-agents/keywords/radar/latest.json', 'utf8')).top || []; } catch { warnings.push('Keyword radar unavailable.'); }
  try {
    const feed = JSON.parse(await fetchText(`${origin}/content/news-feed-summary.json`));
    // Sample articles published 3-10 days ago: Google needs days to index a new page, so inspecting the newest ten
    // (2026-10-21: 0/10, all "Discovered - currently not indexed") measured crawl lag, not the indexing rate.
    const ageDays = (a) => (Date.now() - Date.parse(a.publishedAt || a.updatedAt)) / 86400e3;
    const settled = (feed.articles || []).filter((a) => a.status === 'PUBLISHED' && ageDays(a) >= 3 && ageDays(a) <= 10).sort((a, b) => Date.parse(b.publishedAt || b.updatedAt) - Date.parse(a.publishedAt || a.updatedAt));
    const step = Math.max(1, Math.floor(settled.length / 10));
    const articles = settled.filter((_, i) => i % step === 0).slice(0, 10);
    for (const a of articles) {
      const url = `${origin}/news/${encodeURIComponent(a.slug)}`;
      try { indexHealth.push({ url, ...await inspect(url) }); } catch { indexHealth.push({ url, error: 'inspection unavailable', verdict: null }); warnings.push(`Inspection unavailable: ${url}`); }
    }
  } catch { warnings.push('Newest article feed unavailable.'); }
  const report = { date, periods, metrics: { current: current[0] || null, previous: previous[0] || null, countries: countries.sort((a, b) => b.impressions - a.impressions).slice(0, 5), devices, previousCountries: previousCountries.sort((a, b) => b.impressions - a.impressions).slice(0, 5), previousDevices }, strikingDistance: selected.targets, excluded: selected.excluded, targets, pageDecay: pageDecay(currentPages, previousPages), indexHealth, notIndexed: indexHealth.filter((s) => s.verdict && s.verdict !== 'PASS').length, inspectionUnknown: indexHealth.filter((s) => !s.verdict).length, bing: await bing(warnings), radar, topicHints: unmatchedTopics(radar), warnings, verified: [] };
  if (report.topicHints.length) {
    const file = process.env.SEO_AUTOPILOT_TOPICS_FILE || '/Volumes/致态2TB/nx-agents/keywords/radar/autopilot-topics.json';
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, `${JSON.stringify({ date, topics: report.topicHints }, null, 2)}\n`);
  } else warnings.push('No explicit unmatched radar intents; no new-article hints emitted.');
  await saveReport(report, dir);
  return report;
}
