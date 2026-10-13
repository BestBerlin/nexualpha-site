import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.js";
import { newsArticleGeoView, newsMetadataAllowed } from "../src/data/news-geo-policy.js";
import { pickNewsOfferVenue } from "../src/data/news-offer.js";
import { createSsrHarness, SHELL_HTML } from "./helpers/ssr-hydration-harness.mjs";
// Reported package is absent from the checked-in feed: reproduce its shared metadata shape.
const slug = "exchange-new-user-rewards-roundup-october-2026-verified-terms";
const article = { slug, status: "PUBLISHED", publishedAt: "2026-10-14T00:00:00Z", availableLocales: ["en", "tr"],
 title: { en: "Exchange rewards", tr: "Yeni kullanıcı ödülleri" }, summary: { en: "Bitget and OKX terms", tr: "OKX koşulları." },
 content: { en: "## Rewards\n\nBitget and OKX rewards.", tr: "## Ödüller\n\nOKX koşullarını doğrulayın." },
 sources: [{ publisher: "Bitget", title: "Rewards", url: "https://www.bitget.com/support/articles/rewards" }, { publisher: "OKX", title: "Rewards", url: "https://www.okx.com/help/rewards" }],
 relatedVenues: ["bitget", "okx"], seo: { noindex: false, internalLinkTargets: ["/exchanges/bitget", "/compare/bitget-vs-okx", "/exchanges/okx"] },
 internalLinks: ["/tr/exchanges/bitget", "/tr/exchanges/okx"], cta: { venue: "bitget" } };
const related = { ...article, slug: "bitget-rewards", title: { en: "Bitget rewards", tr: "Bitget ödülleri" } };
const feed = { articles: [article, related] };
const assets = { fetch: async request => {
 const path = new URL(request.url).pathname;
 if (path === "/content/news-feed.json") return Response.json(feed);
 if (path === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html" } });
 return new Response("missing", { status: 404 });
} };
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
test("Turkish rewards article has no Bitget in React, worker HTML, JSON-LD or hydration", async () => {
 for (const [prefix, query] of [["/tr", ""], ["/tr", "?market=SG"], ["/tr", "?market=VN"], ["", "?market=TR"]]) {
  const url = `https://nexualpha.com${prefix}/news/${slug}${query}`;
  const react = harness.render(url, { newsArticles: feed.articles });
  assert.match(react, /OKX/); assert.doesNotMatch(react, /bitget/i);
  for (const ssr of [false, true]) {
   const response = await worker.fetch(new Request(url), { ASSETS: assets, ...(ssr ? { NEWS_SSR_RENDER: harness.render } : {}) });
   assert.equal(response.status, 200);
   const html = await response.text(); assert.match(html, /application\/ld\+json/); assert.match(html, /okx\.com/);
   assert.doesNotMatch(html, /bitget/i, `ssr=${ssr} ${query}`);
  }
 }
});
test("TR market filters shared metadata and localized endpoint", async () => {
 const view = newsArticleGeoView(article, { locale: "en", market: "TR" });
 assert.doesNotMatch(JSON.stringify(view), /bitget/i);
 assert.equal(view.sources.length, 1); assert.deepEqual(view.relatedVenues, ["okx"]); assert.equal(view.cta, undefined);
 const res = await worker.fetch(new Request(`https://nexualpha.com/api/news/article/${slug}?locale=tr&market=SG`), { ASSETS: assets });
 assert.doesNotMatch(JSON.stringify(await res.json()), /bitget/i);
});
test("CoinW market bans and neutral CTA removal share the existing gate", () => {
 assert.equal(newsMetadataAllowed("https://www.coinw.com/help", { locale: "en", market: "US" }), false);
 assert.equal(newsMetadataAllowed("/compare/coinw-vs-okx", { locale: "en", market: "US" }), false);
 assert.equal(pickNewsOfferVenue(["coinw"], "en", "US"), null);
 assert.equal(pickNewsOfferVenue(["bitget"], "tr", "SG"), null);
 assert.equal(pickNewsOfferVenue(["okx"], "vi"), null);
 assert.equal(newsMetadataAllowed("https://www.bitget.com/help", { locale: "vi", market: "TR" }), false);
 const context = { locale: "en" };
 assert.equal(newsMetadataAllowed("bitget", context), true);
 context.market = "TR";
 assert.equal(newsMetadataAllowed("bitget", context), false);
 assert.equal(newsArticleGeoView(article, { locale: "en" }).sources.length, 2);
});
