import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';

const CLASSES = ['human', 'bot', 'burst', 'prefetch', 'unknown']; // burst = one address hammering the buttons (server/click-metadata.mjs)

// Rolling seven-day UTC window; old rows without cls remain unknown.
export async function clickReport(file, now = new Date()) {
  const end = now.getTime();
  const start = end - 7 * 86400000;
  const groups = Object.fromEntries(['day', 'partner', 'src prefix', 'cls'].map(key => [key, new Map()]));
  let total = 0;
  let human = 0;
  let invalid = 0;
  const lines = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    let row;
    try { row = JSON.parse(line); } catch { invalid++; continue; }
    const time = typeof row?.t === 'string' ? Date.parse(row.t) : NaN;
    if (!Number.isFinite(time)) { invalid++; continue; }
    if (time < start || time > end) continue;
    const cls = CLASSES.includes(row.cls) ? row.cls : 'unknown';
    const partner = typeof row.partner === 'string' ? row.partner : 'unknown';
    const prefix = typeof row.src === 'string' ? row.src.split(/[-_]/)[0] || 'unknown' : 'unknown';
    for (const [key, value] of Object.entries({ day: new Date(time).toISOString().slice(0, 10), partner, 'src prefix': prefix, cls })) {
      const counts = groups[key].get(value) || Object.fromEntries(CLASSES.map(c => [c, 0]));
      counts[cls]++;
      groups[key].set(value, counts);
    }
    total++;
    if (cls === 'human') human++;
  }
  const output = [`Window: ${new Date(start).toISOString()} through ${now.toISOString()} (UTC)`,
    `Total: ${total}; human: ${human} (${(total ? human / total * 100 : 0).toFixed(2)}%); invalid rows skipped: ${invalid}`];
  for (const [key, values] of Object.entries(groups)) {
    output.push(`\nBy ${key}`, `${key}\ttotal\thuman\tbot\tprefetch\tunknown\thuman share`);
    for (const [value, counts] of [...values].sort(([a], [b]) => a.localeCompare(b))) {
      const count = Object.values(counts).reduce((a, b) => a + b, 0);
      output.push(`${value.replace(/[\t\r\n\x1b]/g, '?')}\t${count}\t${CLASSES.map(c => counts[c]).join('\t')}\t${(counts.human / count * 100).toFixed(2)}%`);
    }
  }
  return output.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/click-report.mjs <click-file.jsonl>');
    console.log(await clickReport(process.argv[2]));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
