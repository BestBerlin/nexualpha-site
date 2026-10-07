import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("news summary feed stays below the mobile payload budget and excludes article bodies", async () => {
  const raw = await readFile(new URL("../public/content/news-feed-summary.json", import.meta.url));
  const parsed = JSON.parse(raw);
  assert.ok(raw.byteLength < 1_000_000, `summary feed is ${raw.byteLength} bytes`);
  assert.ok(Array.isArray(parsed.articles) && parsed.articles.length >= 6);
  assert.equal(parsed.articles.some((article) => article.content || article.sources || article.seo), false);
});
