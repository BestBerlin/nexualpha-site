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

test("first-page localized news feed stays under the first-view payload budget", async () => {
  for (const locale of ["en", "zh-Hans", "ja"]) {
    const raw = await readFile(new URL(`../public/content/news-feed-page-1.${locale}.json`, import.meta.url));
    const parsed = JSON.parse(raw);
    assert.ok(raw.byteLength <= 60_000, `${locale} first page is ${raw.byteLength} bytes`);
    assert.equal(parsed.locale, locale);
    assert.equal(parsed.page, 1);
    assert.ok(Array.isArray(parsed.articles) && parsed.articles.length <= 30);
    assert.equal(parsed.articles.some((article) => article.content || article.sources || article.seo), false);
  }
});
