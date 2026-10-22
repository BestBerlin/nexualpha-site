import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';

export const EXCLUDED_CLASSES = ['internal', 'bot', 'burst', 'duplicate', 'unknown', 'legacy-unverified'];
export const SOURCE_GROUPS = ['telegram', 'article', 'home', 'venue', 'other'];
const DAY_MS = 86400000;
const IP_HASH = /^[a-f0-9]{64}$/i;

// Placement prefixes, not referrer URLs: old rows may contain only a hostname in ref.
export function clickSourceGroup(src) {
  if (typeof src !== 'string') return 'other';
  if (src.startsWith('tg-')) return 'telegram';
  if (/^(?:article|news)(?:[-_]|$)/.test(src)) return 'article';
  if (/^home(?:[-_]|$)/.test(src)) return 'home';
  if (/^(?:venue|profile|fee-summary|registration-card)(?:[-_]|$)/.test(src)) return 'venue';
  return 'other';
}

function emptyCounts() {
  return { events: 0, humanEvents: 0, humanUnique: 0, humanRepeatEvents: 0, excluded: Object.fromEntries(EXCLUDED_CLASSES.map(cls => [cls, 0])) };
}

function addCount(counts, cls) {
  counts.events++;
  if (cls === 'human' || cls === 'human-repeat') {
    counts.humanEvents++;
    if (cls === 'human') counts.humanUnique++;
    else counts.humanRepeatEvents++;
  } else counts.excluded[cls]++;
}

function addGroup(groups, dimensions, cls) {
  const key = JSON.stringify(dimensions);
  if (!groups.has(key)) groups.set(key, { ...dimensions, ...emptyCounts() });
  addCount(groups.get(key), cls);
}

function sortedRows(groups) {
  return [...groups.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, row]) => row);
}

/**
 * JSON contract for the green board: totals.humanUnique is the owner metric;
 * byDay.find(row => row.day === 'YYYY-MM-DD')?.humanUnique ?? 0 is a UTC day.
 * Window is exactly [now - 7 * 24h, now], inclusive, so boundary days are partial.
 * Uniqueness is UTC day × partner × valid daily IP hash, across both routes and
 * all sources. Additional human rows are humanRepeatEvents, separate from
 * write-time excluded.duplicate. Earliest human source wins; equal timestamps
 * use lexical source-group order. No IP hashes appear in the output.
 * Each grouping sums to totals; never add different grouping views together.
 */
export async function clickReportData(file, now = new Date()) {
  const end = now.getTime();
  if (!Number.isFinite(end)) throw new Error('Invalid report time');
  const start = end - 7 * DAY_MS;
  const totals = emptyCounts();
  const groups = { byDay: new Map(), byPartner: new Map(), bySourceGroup: new Map(), daily: new Map() };
  const humans = new Map();
  let invalidRows = 0;
  let outsideWindowRows = 0;
  function record(day, partner, sourceGroup, cls) {
    addCount(totals, cls);
    addGroup(groups.byDay, { day }, cls);
    addGroup(groups.byPartner, { partner }, cls);
    addGroup(groups.bySourceGroup, { sourceGroup }, cls);
    addGroup(groups.daily, { day, partner, sourceGroup }, cls);
  }
  const lines = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    let row;
    try { row = JSON.parse(line); } catch { invalidRows++; continue; }
    const time = typeof row?.t === 'string' ? Date.parse(row.t) : NaN;
    if (!Number.isFinite(time)) { invalidRows++; continue; }
    if (time < start || time > end) { outsideWindowRows++; continue; }
    const day = new Date(time).toISOString().slice(0, 10);
    // Campaign/alternate/page routes retain their historical slug in partner and the exchange in venue.
    const partnerValue = row.venue || row.partner;
    const partnerValid = typeof partnerValue === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/i.test(partnerValue);
    const partner = partnerValid ? partnerValue.toLowerCase() : 'unknown';
    const sourceGroup = clickSourceGroup(row.src);
    const validHash = typeof row.ipHash === 'string' && IP_HASH.test(row.ipHash);
    const cls = !validHash ? 'legacy-unverified'
      : row.cls === 'human' && partnerValid ? 'human'
        : row.cls === 'prefetch' ? 'bot'
          : EXCLUDED_CLASSES.includes(row.cls) && row.cls !== 'legacy-unverified' ? row.cls : 'unknown';
    if (cls !== 'human') { record(day, partner, sourceGroup, cls); continue; }
    const key = JSON.stringify([day, partner, row.ipHash.toLowerCase()]);
    const first = humans.get(key);
    if (!first) humans.set(key, { day, partner, sourceGroup, time });
    else if (time < first.time || (time === first.time && sourceGroup < first.sourceGroup)) {
      record(first.day, first.partner, first.sourceGroup, 'human-repeat');
      humans.set(key, { day, partner, sourceGroup, time });
    } else record(day, partner, sourceGroup, 'human-repeat');
  }
  for (const row of humans.values()) record(row.day, row.partner, row.sourceGroup, 'human');
  return {
    schemaVersion: 1,
    window: { start: new Date(start).toISOString(), end: now.toISOString(), timezone: 'UTC', inclusive: true },
    metric: 'Distinct UTC day × partner × daily IP hash; earliest human source attribution',
    totals,
    invalidRows,
    outsideWindowRows,
    ...Object.fromEntries(Object.entries(groups).map(([key, values]) => [key, sortedRows(values)])),
  };
}

export async function clickReport(file, now = new Date()) {
  const report = await clickReportData(file, now);
  const output = [
    `Window: ${report.window.start} through ${report.window.end} (UTC, inclusive; partial boundary days)`,
    `Total: ${report.totals.events}; human unique: ${report.totals.humanUnique}; human events: ${report.totals.humanEvents}; invalid rows skipped: ${report.invalidRows}; outside window: ${report.outsideWindowRows}`,
    'Human unique = distinct UTC day × partner × daily IP hash; earliest human source wins.',
    'Human repeats are separate from write-time duplicate. Old rows without a valid hash are legacy-unverified.',
  ];
  const tables = [
    ['day', report.byDay, ['day']], ['partner', report.byPartner, ['partner']],
    ['src group', report.bySourceGroup, ['sourceGroup']], ['day / partner / src group', report.daily, ['day', 'partner', 'sourceGroup']],
  ];
  for (const [name, rows, dimensions] of tables) {
    output.push(`\nBy ${name}`, [...dimensions, 'events', 'human events', 'human unique', 'human repeats', ...EXCLUDED_CLASSES].join('\t'));
    for (const row of rows) output.push([
      ...dimensions.map(key => row[key]), row.events, row.humanEvents, row.humanUnique, row.humanRepeatEvents, ...EXCLUDED_CLASSES.map(cls => row.excluded[cls]),
    ].join('\t'));
  }
  return output.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    const json = args.includes('--json');
    const files = args.filter(arg => arg !== '--json');
    if (files.length !== 1 || files[0].startsWith('--') || args.length !== files.length + Number(json)) {
      throw new Error('Usage: node scripts/click-report.mjs <click-file.jsonl> [--json]');
    }
    console.log(json ? JSON.stringify(await clickReportData(files[0])) : await clickReport(files[0]));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
