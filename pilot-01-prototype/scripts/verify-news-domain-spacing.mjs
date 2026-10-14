import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.argv[2] || "dist";
// Include single-label brands (Crypto. com), partially spaced subdomains and
// fully spaced hosts (www. bybit. com), including URL/email occurrences.
const brokenDomain = /\b[\w-]+\.(?:\s*[\w-]+\.)*\s+(?:com|io|xyz|net|org)\b|\bwww\.\s+[\w-]+(?:\.[\w-]+)*\.(?:com|io|xyz|net|org)\b/gi;
let files = 0;
const matches = [];
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await scan(file);
    else if ((file.includes(`${path.sep}news${path.sep}`) && /\.(?:html|json)$/.test(file)) || /^news-feed(?:-summary)?\.json$/.test(entry.name)) {
      files++;
      const text = await readFile(file, "utf8");
      for (const match of text.matchAll(brokenDomain)) matches.push({ file, text: match[0] });
    }
  }
}
await scan(root);
console.log(JSON.stringify({ root, files, matches: matches.length, examples: matches.slice(0, 10) }, null, 2));
assert.ok(files > 0, "expected built news output; build first");
assert.equal(matches.length, 0, "spaced domain dots remain in built news output");
