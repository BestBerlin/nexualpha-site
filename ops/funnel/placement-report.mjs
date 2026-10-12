import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clickMetadata } from '../../pilot-01-prototype/server/click-metadata.mjs';
import { parseClickLines } from '../alert-sender/funnel-report.mjs';
import { knownPlacementDiscovery } from './known-placements.mjs';

const DAY = 86_400_000;
const compare = (a, b) => b.clicks - a.clicks || JSON.stringify(a).localeCompare(JSON.stringify(b));

export function placementReport(text, { now = Date.now(), placements = [] } = {}) {
  if (!Number.isFinite(now)) throw new Error('Invalid report time');
  const rows = parseClickLines(text, clickMetadata);
  const windows = {};
  for (const days of [1, 7, 28]) {
    const groups = new Map();
    for (const row of rows) {
      if (row.t < now - days * DAY || row.t >= now) continue;
      const dimensions = { venue: row.partner, src: row.src, locale: row.locale ?? null, path: row.path ?? null, country: row.country ?? null };
      const key = JSON.stringify(dimensions);
      const bucket = groups.get(key) || { ...dimensions, clicks: 0 };
      bucket.clicks++;
      groups.set(key, bucket);
    }
    const aggregated = [...groups.values()].sort(compare);
    windows[days] = { total: aggregated.reduce((n, r) => n + r.clicks, 0), rows: aggregated };
  }
  const active = new Set(windows[7].rows.map((r) => r.src));
  return {
    generatedAt: new Date(now).toISOString(),
    windowDefinition: '[now - days, now), rolling UTC durations',
    windows,
    zeroClickPlacements7d: [...new Set(placements)].filter((src) => !active.has(src)).sort(),
  };
}

const cell = (value) => value == null ? 'unknown' : String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '&#124;').replace(/[\r\n]/g, ' ');
export function placementMarkdown(report) {
  const lines = ['# Placement clicks', '', `As of ${report.generatedAt}. Rolling windows exclude events at or after that time. Counts are logged events, not unique people or registrations.`, ''];
  for (const days of [1, 7, 28]) {
    const window = report.windows[days];
    lines.push(`## Last ${days} d — ${window.total} clicks`, '', '| Venue | Placement | Locale | Page path | Country | Clicks |', '| --- | --- | --- | --- | --- | ---: |');
    for (const row of window.rows.slice(0, 30)) lines.push(`| ${[row.venue, row.src, row.locale, row.path, row.country, row.clicks].map(cell).join(' | ')} |`);
    if (!window.rows.length) lines.push('| — | No logged clicks | — | — | — | 0 |');
    lines.push('', `Showing ${Math.min(window.rows.length, 30)} of ${window.rows.length} rows; JSON contains every row.`, '');
  }
  lines.push('## Placements with zero clicks in 7 d', '', 'Known source values with no observed events; this does not prove that a placement was displayed or tracking was healthy.', '');
  lines.push(...(report.zeroClickPlacements7d.length ? report.zeroClickPlacements7d.map((s) => `- ${cell(s)}`) : ['None.']));
  if (report.knownPlacementRegistry?.unresolvedDynamicFamilies?.length) {
    lines.push('', 'Dynamic families not enumerated (excluded from the zero-click list):', '');
    for (const family of report.knownPlacementRegistry.unresolvedDynamicFamilies) lines.push(`- ${cell(family.pattern)} — ${cell(family.reason)}`);
  }
  return `${lines.join('\n')}\n`;
}

export function run(args = process.argv.slice(2), env = process.env) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--input', '--json', '--markdown', '--now'].includes(args[i]) || !args[i + 1]) throw new Error('Usage: placement-report.mjs --input <jsonl> --json <output.json> --markdown <output.md> [--now <ISO time>]');
    options[args[i].slice(2)] = args[i + 1];
  }
  const input = options.input || env.CLICK_EVENT_FILE;
  if (!input || !options.json || !options.markdown) throw new Error('Input (or CLICK_EVENT_FILE), --json and --markdown are required');
  if (new Set([input, options.json, options.markdown].map((p) => resolve(p))).size !== 3) throw new Error('Input and output paths must differ');
  // Read failures are fatal: an unavailable log must never look like a zero-click report.
  const text = readFileSync(input, 'utf8');
  const discovery = knownPlacementDiscovery();
  const report = placementReport(text, { now: options.now ? Date.parse(options.now) : Date.now(), placements: discovery.records.map((r) => r.src) });
  report.knownPlacementRegistry = { records: discovery.records, unresolvedDynamicFamilies: discovery.unresolvedDynamicFamilies };
  writeFileSync(options.json, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  writeFileSync(options.markdown, placementMarkdown(report), { mode: 0o600 });
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { run(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
