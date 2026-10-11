#!/usr/bin/env node
// Applies the deterministic news-text repairs (src/data/news-content-repair.js) to a feed file (scorecard C4).
//   node scripts/repair-news-feed-content.mjs <news-feed.json> [--write]
// Without --write it only lists what would change. With --write it rewrites the feed in place (same formatting as the
// importer: 2-space JSON) and its news-feed.sha256.txt sibling when one exists; regenerate the summary feed afterwards
// (node scripts/generate-news-summary-feed.mjs) for the repository copy. Repairs: truncated summaries completed from the
// same locale's body (or cut back to the last full sentence), Markdown markers removed from plain-text fields, and
// Markdown links to local filesystem paths reduced to their label.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { repairNewsArticle } from "../src/data/news-content-repair.js";

const file = process.argv[2];
if (!file) { console.error("usage: node scripts/repair-news-feed-content.mjs <news-feed.json> [--write]"); process.exit(2); }
const write = process.argv.includes("--write");
const feed = JSON.parse(readFileSync(file, "utf8"));
let changed = 0;
feed.articles = (feed.articles || []).map((article) => {
  const { article: repaired, changes } = repairNewsArticle(article);
  if (changes.length) {
    changed += 1;
    for (const [field, locale, before, after] of changes) console.log(`${article.slug} [${locale}] ${field}\n  - ${String(before).slice(-90)}\n  + ${String(after).slice(-90)}`);
  }
  return repaired;
});
console.log(`${changed} article(s) ${write ? "repaired" : "would change"} in ${file}`);
if (write && changed) {
  const text = `${JSON.stringify(feed, null, 2)}\n`;
  writeFileSync(file, text);
  const shaFile = path.join(path.dirname(file), "news-feed.sha256.txt");
  if (existsSync(shaFile)) writeFileSync(shaFile, `${createHash("sha256").update(text).digest("hex")}\n`);
}
