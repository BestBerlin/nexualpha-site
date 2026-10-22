import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker, { refreshSitemapIndexLastmods } from "../worker/index.js";

const base = { status: "PUBLISHED", sources: [{ url: "https://example.com" }], title: { en: "t", "zh-Hans": "t" }, summary: { en: "s", "zh-Hans": "s" }, content: { en: "x", "zh-Hans": "x" }, availableLocales: ["en", "zh-Hans"] };
const index = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  "  <sitemap>\n    <loc>https://nexualpha.com/sitemap-articles-en.xml</loc>\n    <lastmod>2026-10-01</lastmod>\n  </sitemap>",
  "  <sitemap>\n    <loc>https://nexualpha.com/sitemap-articles-zh-hans.xml</loc>\n  </sitemap>",
  "  <sitemap>\n    <loc>https://nexualpha.com/sitemap-articles-ja.xml</loc>\n  </sitemap>",
  "  <sitemap>\n    <loc>https://nexualpha.com/sitemap-glossary.xml</loc>\n    <lastmod>2026-10-13</lastmod>\n  </sitemap>",
  "  <sitemap>\n    <loc>https://nexualpha.com/news-sitemap.xml</loc>\n    <lastmod>2026-10-04</lastmod>\n  </sitemap>",
  "</sitemapindex>", "",
].join("\n");

test("sitemap index lastmods for feed-driven children follow the live feed; other children are untouched", () => {
  const now = Date.parse("2026-10-13T12:00:00Z");
  const xml = refreshSitemapIndexLastmods(index, [
    { ...base, slug: "a", publishedAt: "2026-10-13T08:00:00Z", seo: { noindex: false } },
    { ...base, slug: "b", availableLocales: ["en"], content: { en: "x" }, publishedAt: "2026-10-12T08:00:00Z", seo: { noindex: false } },
    { ...base, slug: "hidden", publishedAt: "2026-10-14T08:00:00Z", seo: { noindex: true } },
  ], now);
  assert.match(xml, /sitemap-articles-en\.xml<\/loc>\n {4}<lastmod>2026-10-13<\/lastmod>/);
  assert.match(xml, /sitemap-articles-zh-hans\.xml<\/loc>\n {4}<lastmod>2026-10-13<\/lastmod>/);
  assert.match(xml, /sitemap-glossary\.xml<\/loc>\n {4}<lastmod>2026-10-13<\/lastmod>/);
  assert.doesNotMatch(xml, /news-sitemap\.xml/);
  assert.doesNotMatch(xml, /sitemap-articles-ja/, "a locale with no search-published article is left out");
  assert.equal((xml.match(/<sitemap>/g) || []).length, 3);
  assert.match(xml, /^<\?xml[^\n]*\n<sitemapindex[^\n]*>\n {2}<sitemap>/);
  assert.equal(refreshSitemapIndexLastmods(index, []), index.replace(/\n  <sitemap>\n    <loc>https:\/\/nexualpha\.com\/news-sitemap\.xml<\/loc>[\s\S]*?<\/sitemap>/, ""), "without a feed, remove only the legacy News entry");
});

test("worker answers /sitemap.xml with the release index, refreshed from the mounted feed", async () => {
  const publishedAt = new Date(Date.now() - 3600e3).toISOString();
  const feed = { articles: [{ ...base, slug: "today", publishedAt, seo: { noindex: false } }] };
  const env = { ASSETS: { fetch: async (req) => {
    const p = new URL(req.url).pathname;
    if (p === "/sitemap.xml") return new Response(index);
    if (p === "/content/news-feed.json") return new Response(JSON.stringify(feed));
    return new Response("", { status: 404 });
  } } };
  const res = await worker.fetch(new Request("https://nexualpha.com/sitemap.xml"), env);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /xml/);
  const body = await res.text();
  assert.match(body, new RegExp(`sitemap-articles-en\\.xml</loc>\\n {4}<lastmod>${publishedAt.slice(0, 10)}</lastmod>`));
  assert.match(body, /sitemap-glossary\.xml/);
});

test("every sitemap robots.txt advertises is a child of the release index", () => {
  const robots = readFileSync(new URL("../public/robots.txt", import.meta.url), "utf8");
  const generator = readFileSync(new URL("../scripts/generate-prerender-manifest.mjs", import.meta.url), "utf8");
  for (const [, file] of robots.matchAll(/^Sitemap: https:\/\/nexualpha\.com\/(\S+)$/gm)) {
    if (file === "sitemap.xml") continue;
    assert.ok(generator.includes(`https://nexualpha.com/${file}`), `${file} is in robots.txt but not in the generated index`);
  }
});

test("article index lastmod is the real edit time, independent of sitemap refresh time", () => {
  const article = { ...base, slug: "edited", publishedAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-09T09:30:00Z", seo: { noindex: false } };
  const first = refreshSitemapIndexLastmods(index, [article], Date.parse("2026-10-13T12:00:00Z"));
  const rebuilt = refreshSitemapIndexLastmods(index, [article], Date.parse("2026-10-22T12:00:00Z"));
  assert.equal(first, rebuilt);
  assert.match(first, /sitemap-articles-en\.xml<\/loc>\n {4}<lastmod>2026-10-09<\/lastmod>/);
});
