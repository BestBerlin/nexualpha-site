// Mac-side: turn the newest keyword-radar CSV into radar-terms.json (shipped with x-poster on deploy).
// usage: node build-radar-snapshot.mjs [/Volumes/致态2TB/nx-agents/keywords/radar]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { radarTermsFromCsv } from './hashtags.mjs';
const dir = process.argv[2] || '/Volumes/致态2TB/nx-agents/keywords/radar';
const csv = readdirSync(dir).filter((f) => /^keywords-radar-\d{4}-\d{2}-\d{2}\.csv$/.test(f)).sort().at(-1);
if (!csv) throw new Error(`no keywords-radar-*.csv in ${dir}`);
const terms = radarTermsFromCsv(readFileSync(path.join(dir, csv), 'utf8'));
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'radar-terms.json');
writeFileSync(out, JSON.stringify({ source: csv, terms }, null, 2) + '\n');
console.log(JSON.stringify({ source: csv, out, top: Object.entries(terms).slice(0, 10) }));
