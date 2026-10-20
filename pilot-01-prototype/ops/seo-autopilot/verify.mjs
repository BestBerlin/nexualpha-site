import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { searchAnalytics } from '../../../ops/newsroom/measure/gsc.mjs';
import { windows } from './measure.mjs';
export async function verify(report, overrides, { dir, query = searchAnalytics } = {}) {
  const history = [];
  if (dir) for (const file of await readdir(dir)) {
    if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(file) || file.slice(0, 10) >= report.date) continue;
    try { history.push(JSON.parse(await readFile(path.join(dir, file), 'utf8'))); } catch { /* incomplete history never proves regression */ }
  }
  const verified = [], next = structuredClone(overrides);
  for (const [pathname, entry] of Object.entries(overrides)) {
    if (!Number.isFinite(Date.parse(entry.since)) || Date.parse(report.date) - Date.parse(entry.since) < 7 * 86400000) continue;
    const rows = await query({ ...windows(report.date).current, dimensions: ['query', 'page'], dataState: 'final', filters: [{ dimension: 'query', operator: 'equals', expression: entry.query }, { dimension: 'page', operator: 'equals', expression: `https://nexualpha.com${pathname}` }] });
    const after = rows[0] ? { position: rows[0].position, impressions: rows[0].impressions } : null;
    const delta = after ? after.position - entry.baselinePos : null;
    const verdict = delta === null || Math.abs(delta) < 1 ? 'same' : delta < 0 ? 'better' : 'worse';
    const item = { pathname, query: entry.query, since: entry.since, before: { position: entry.baselinePos, impressions: entry.baselineImpressions ?? null }, after, delta, verdict, ...(after ? {} : { note: 'No observations; same means inconclusive, not stable rank.' }) };
    // Require 14 consecutive dated observations for this exact experiment, ending today.
    const worseDays = new Set(history.filter((r) => r.verified?.some((v) => v.pathname === pathname && v.query === entry.query && v.since === entry.since && v.verdict === 'worse' && v.after)).map((r) => r.date));
    worseDays.add(report.date);
    if (verdict === 'worse' && Array.from({ length: 14 }, (_, i) => new Date(Date.parse(report.date) - i * 86400000).toISOString().slice(0, 10)).every((d) => worseDays.has(d))) { next[pathname].revert = true; item.revert = true; }
    verified.push(item);
  }
  report.verified = verified;
  return next;
}
