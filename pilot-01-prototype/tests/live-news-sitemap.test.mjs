import test from "node:test";
import assert from "node:assert/strict";
import worker, { renderLiveNewsSitemap } from "../worker/index.js";

const now = Date.parse("2026-10-10T12:00:00Z");
const base = { status: "PUBLISHED", sources: [{ url: "https://example.com" }], title: { en: "OKX & Bitget fees", "zh-Hans": "OKX 与 Bitget 手续费" }, summary: { en: "s", "zh-Hans": "s" }, content: { en: "x", "zh-Hans": "x" }, availableLocales: ["en", "zh-Hans"] };

test("live news sitemap lists only search-published articles from the last two days", () => {
  const xml = renderLiveNewsSitemap([
    { ...base, slug: "fresh-indexable", publishedAt: "2026-10-10T08:00:00Z", seo: { noindex: false } },
    { ...base, slug: "fresh-noindex", publishedAt: "2026-10-10T08:00:00Z", seo: { noindex: true } },
    { ...base, slug: "old-indexable", publishedAt: "2026-10-01T08:00:00Z", seo: { noindex: false } },
  ], now);
  assert.match(xml, /<loc>https:\/\/nexualpha\.com\/news\/fresh-indexable<\/loc>/);
  assert.match(xml, /<news:title>OKX &amp; Bitget fees<\/news:title>/);
  assert.doesNotMatch(xml, /fresh-noindex|old-indexable/);
  assert.match(xml, /xmlns:news="http:\/\/www\.google\.com\/schemas\/sitemap-news\/0\.9"/);
});

test("worker serves /news-sitemap.xml from the mounted feed", async () => {
  const feed = { articles: [{ ...base, slug: "served-now", publishedAt: new Date(Date.now() - 3600e3).toISOString(), seo: { noindex: false } }] };
  const env = { ASSETS: { fetch: async (req) => new URL(req.url).pathname === "/content/news-feed.json" ? new Response(JSON.stringify(feed)) : new Response("", { status: 404 }) } };
  const res = await worker.fetch(new Request("https://nexualpha.com/news-sitemap.xml"), env);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /xml/);
  assert.match(await res.text(), /served-now/);
});
