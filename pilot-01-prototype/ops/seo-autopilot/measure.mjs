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
  const decode = (value) => String(value || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const title = decode(html?.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || seo.title);
  const h1 = decode(html?.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>/g, ' '));
  const tokens = target.query.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const missing = (text) => tokens.some((t) => !text.toLowerCase().includes(t));
  const locale = pathname.startsWith('/zh-hans/') ? 'zh-hans' : seo.locale === 'en' ? 'en' : null;
  const contentPath = pathname.replace(/^\/zh-hans(?=\/)/, '');
  const eligible = Boolean(!url.search && locale && seo.status === 200 && !/\bnoindex\b/.test(seo.robots) && /^(?:\/exchanges\/[^/]+|\/compare\/[^/]+|\/news(?:\/page\/\d+|\/category\/[^/]+)?|\/data\/[^/]+|\/liquidations|\/funding-rates)$/.test(contentPath));
  const brand = 'NexuAlpha';
  const descriptionTag = [...String(html || '').matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => tag).find((tag) => /\bname\s*=\s*["']description["']/i.test(tag));
  const description = decode(descriptionTag?.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i)?.slice(1).find((value) => value !== undefined) ?? seo.description);
  const action = html === null ? 'none' : missing(title) ? 'title' : missing(h1) ? 'answer-first' : missing(description) ? 'description' : 'none';
  // Reuse observed query language; no synthesized claims or amounts.
  return { ...target, pathname, locale, eligible, brand, currentTitle: title, currentDescription: description, proposedDescription: `${target.query}: ${description}${description.includes(brand) ? '' : ` | ${brand}`}`, action, proposedTitle: `${target.query} | ${brand}`, evidence: html === null ? 'page-fetch-unavailable' : 'live-title-h1' };
}
// Explicit radar unmatched intents remain editorial hints, not publication authority.
export function unmatchedTopics(radar) {
  return radar.filter((r) => typeof r.query === 'string' && !r.url && /new[- ]article/i.test(r.action || '') && !/nexu|opusdte|\b(?:site|inbody):|["“”]/i.test(r.query)).map((r) => ({ query: r.query, locale: r.market || 'en', action: 'new-article', source: 'radar-unmatched-hint', requiresEditorialReview: true }));
}
export function contextualInboundLinks(fetchedPages = []) {
  const decode = (value) => String(value || '').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&#x27;/gi, "'");
  const attribute = (tag, name) => decode(tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find((value) => value !== undefined));
  const normalize = (value, base = origin) => {
    try {
      const url = new URL(decode(value), base);
      if (url.origin !== origin) return null;
      return origin + (url.pathname.replace(/\/+$/, '') || '/');
    } catch { return null; }
  };
  const sources = new Set(), inlinks = new Map();
  for (const page of fetchedPages) {
    if (!normalize(page.url)) continue;
    const html = String(page.html || '');
    const head = html.split(/<\/head>/i)[0];
    const robots = [...head.matchAll(/<meta\b[^>]*>/gi)].filter(([tag]) => attribute(tag, 'name').toLowerCase() === 'robots').map(([tag]) => attribute(tag, 'content'));
    if (robots.some((value) => value.split(/[\s,]+/).some((token) => token.toLowerCase() === 'noindex'))) continue;
    const canonical = [...head.matchAll(/<link\b[^>]*>/gi)].find(([tag]) => attribute(tag, 'rel').toLowerCase().split(/\s+/).includes('canonical'));
    const source = normalize(canonical ? attribute(canonical[0], 'href') : page.url, page.url);
    if (!source) continue;
    sources.add(source);
    const body = html.replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '').match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '';
    for (const [anchor, , text] of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
      if (!text.replace(/<[^>]*>/g, '').trim()) continue;
      const href = attribute(anchor, 'href');
      if (!href) continue;
      const target = normalize(href, source);
      if (!target || target === source) continue;
      if (!inlinks.has(target)) inlinks.set(target, new Set());
      inlinks.get(target).add(source);
    }
  }
  return { coverage: 'gsc-target-sample', complete: false, successfulFetches: fetchedPages.length, pages: sources.size, sourceUrls: [...sources].sort(), observedLowerBoundInlinks: [...inlinks].sort(([a], [b]) => a.localeCompare(b)).map(([url, referring]) => ({ url, count: referring.size, sourceUrls: [...referring].sort() })) };
}
export async function fetchText(url, { fetchPage = fetch } = {}) {
  // GSC retains retired query-locale and factbook URLs. Their canonical redirects are
  // healthy pages, not outages. Validate every hop before fetching it.
  let current = new URL(url);
  const seen = new Set();
  for (let hop = 0; hop <= 5; hop += 1) {
    if (current.origin !== origin) throw new Error('Non-site URL rejected');
    if (seen.has(current.href)) throw new Error('Redirect loop');
    seen.add(current.href);
    const response = await fetchPage(current.href, { signal: AbortSignal.timeout(20000), redirect: 'manual' });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirect missing location');
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }
  throw new Error('Too many redirects');
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
  const markdown = [`# SEO autopilot ${report.date}`, '## Windows and metrics', jsonBlock({ periods: report.periods, ...report.metrics }), '## Top proposals', proposalTable(report.targets), '## Inbound links (GSC target sample only)', jsonBlock(report.inboundLinks || { coverage: 'unavailable', complete: false }), '## Page decay', jsonBlock(report.pageDecay), '## Index health', jsonBlock({ notIndexed: report.notIndexed, unknown: report.inspectionUnknown, urls: report.indexHealth }), '## Verification', jsonBlock(report.verified || []), '## Application', jsonBlock(report.application || {}), '## Notes', ...(report.notes || []).map((s) => `- ${s}`), '## Warnings', ...report.warnings.map((s) => `- ${s}`)].join('\n\n');
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
  const selected = selectTargets(rows), targets = [], fetchedPages = [];
  const protectedPages = new Set([...currentPages, ...rows.map((r) => ({ ...r, keys: [r.keys[1]] }))].filter((r) => r.position <= 8).map((r) => r.keys[0]));
  for (const target of selected.targets.slice(0, 100)) {
    let html = null;
    try { html = await fetchText(target.page); fetchedPages.push({ url: target.page, html }); } catch { if (!warnings.includes(`Page unavailable: ${target.page}`)) warnings.push(`Page unavailable: ${target.page}`); }
    const item = proposal(target, html);
    if (protectedPages.has(target.page)) { item.eligible = false; item.protection = "page-already-top-eight"; }
    targets.push(item);
  }
  if (selected.targets.length > 100) warnings.push('Live page analysis capped at 100 targets; remaining candidates retained in strikingDistance.');
  const inboundLinks = contextualInboundLinks(fetchedPages);
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
  const report = { date, periods, metrics: { current: current[0] || null, previous: previous[0] || null, countries: countries.sort((a, b) => b.impressions - a.impressions).slice(0, 5), devices, previousCountries: previousCountries.sort((a, b) => b.impressions - a.impressions).slice(0, 5), previousDevices }, strikingDistance: selected.targets, excluded: selected.excluded, targets, inboundLinks, pageDecay: pageDecay(currentPages, previousPages), indexHealth, notIndexed: indexHealth.filter((s) => s.verdict && s.verdict !== 'PASS').length, inspectionUnknown: indexHealth.filter((s) => !s.verdict).length, bing: await bing(warnings), radar, topicHints: unmatchedTopics(radar), warnings, notes: [], verified: [] };
  if (report.topicHints.length) {
    const file = process.env.SEO_AUTOPILOT_TOPICS_FILE || '/Volumes/致态2TB/nx-agents/keywords/radar/autopilot-topics.json';
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, `${JSON.stringify({ date, topics: report.topicHints }, null, 2)}\n`);
  } else report.notes.push('No explicit unmatched radar intents; no new-article hints emitted.');
  await saveReport(report, dir);
  return report;
}
