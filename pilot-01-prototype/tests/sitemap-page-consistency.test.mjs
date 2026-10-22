import assert from "node:assert/strict";
import test from "node:test";
import { buildCoinsSitemap, buildNewsSitemap, buildSplitSitemaps, routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import { buildNewsSeoFiles } from "../scripts/update-news-seo.mjs";
import { isSelfCanonicalSitemapSeo, selectSitemapPublicationEntries } from "../scripts/sitemap-publication-policy.mjs";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { coinBySlug } from "../src/data/coins.js";
import { coinIndexable, coinsRouteSeo, coinsSitemapEntries } from "../src/data/coins-seo.js";
import { localizedPath, parsePublicRoute } from "../src/data/locale-routing.js";
import { normalizeNewsFeed } from "../src/data/news-feed-client.js";
import { routeMetadata } from "../worker/index.js";

const generatedAt = "2026-10-22T12:00:00Z";
const fixtureArticle = (slug, extra = {}) => ({
  slug, status: "PUBLISHED", publishedAt: "2026-10-22T10:00:00Z", updatedAt: "2026-10-22T11:00:00Z",
  title: { en: `Source-backed research ${slug}`, tr: `Kraken güvenlik araştırması ${slug}` },
  summary: { en: "Verified source research.", tr: "Doğrulanmış kaynak araştırması." },
  content: { en: "English edition with verified sources.", tr: "Kraken ayarları için kaynakları doğrulanmış Türkçe makale." },
  availableLocales: ["en", "tr"], seo: { noindex: false },
  sources: [{ title: "Official documentation", publisher: "Kraken", url: "https://example.org/source" }], ...extra,
});
const feed = { generatedAt, articles: [
  fixtureArticle("newly-translated-article"),
  fixtureArticle("restricted-edition", { title: { en: "Safety research", tr: "Bitget araştırması" }, content: { en: "Source-backed safety research.", tr: "Bitget hesap koşulları." } }),
  fixtureArticle("private-article", { seo: { noindex: true } }),
  fixtureArticle("unknown-search-state", { seo: {} }),
  fixtureArticle("weaker-duplicate", { canonicalSlug: "newly-translated-article" }),
  fixtureArticle("missing-canonical-target", { canonicalSlug: "missing-target" }),
  fixtureArticle("nonindex-canonical-target", { canonicalSlug: "private-article" }),
] };
const urls = (xml) => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].replaceAll("&amp;", "&"));
const assertPage = (loc, seo) => {
  assert.equal(seo?.status, 200, loc);
  assert.equal(seo.robots, "index,follow", loc);
  assert.equal(seo.canonical, loc, loc);
};

test("article sitemap URLs and page heads use the same live translated fixture", async () => {
  const built = buildNewsSeoFiles(feed);
  const articles = built.articles;
  const env = { ASSETS: { fetch: async (request) => new URL(request.url).pathname === "/content/news-feed.json"
    ? new Response(JSON.stringify(feed), { headers: { "content-type": "application/json" } })
    : new Response("missing", { status: 404 }) } };
  const articleXml = Object.entries(built.sitemapFiles).filter(([file]) => /^sitemap-articles-/.test(file)).map(([, xml]) => xml);
  const allUrls = [...new Set([...articleXml.flatMap(urls), ...urls(built.newsSitemap), ...urls(buildNewsSitemap(articles, { generatedAt }))])];
  assert.ok(allUrls.includes("https://nexualpha.com/tr/news/newly-translated-article"));
  assert.ok(allUrls.includes("https://nexualpha.com/news/restricted-edition"));
  assert.ok(!allUrls.includes("https://nexualpha.com/tr/news/restricted-edition"));
  for (const xml of [...articleXml, built.newsSitemap]) {
    assert.doesNotMatch(xml, /href="https:\/\/nexualpha\.com\/tr\/news\/restricted-edition"/);
  }
  assert.ok(allUrls.every((loc) => !/private-article|unknown-search-state|weaker-duplicate|missing-canonical-target|nonindex-canonical-target/.test(loc)));
  for (const loc of allUrls) {
    const route = parsePublicRoute(new URL(loc).pathname, new URLSearchParams());
    const article = articles.find((row) => `/news/${row.slug}` === route.contentPathname);
    assertPage(loc, computeRouteSeo({ url: loc, article, newsArticles: articles }));
    assertPage(loc, await routeMetadata(new URL(loc), env));
  }
});

test("article publication refreshes stale inventory locales and excludes cross-canonical pages without a roster cap", () => {
  const articles = normalizeNewsFeed(feed);
  const inventory = routeInventory(articles).filter((route) => route.template === "article")
    .map((route) => ({ ...route, locales: ["en"] }));
  const publication = selectSitemapPublicationEntries(inventory, articles, {
    policy: { publicationMode: "full-reviewed-indexable", priorityLocales: ["en", "tr"], maxReviewedNewsArticleRoutes: 0 },
  });
  assert.ok(publication.urls.some((entry) => entry.loc === "https://nexualpha.com/tr/news/newly-translated-article"));
  assert.ok(publication.urls.every((entry) => !entry.loc.includes("weaker-duplicate")));
});

test("coin sitemap and page heads share the coin fixtures and keep observed noindex KAG out", async () => {
  const built = buildCoinsSitemap();
  const coinUrls = urls(built.xml);
  const fixtures = coinsSitemapEntries({ urlFor: (pathname, locale) => `https://nexualpha.com${localizedPath(pathname, locale)}` });
  assert.equal(coinUrls.length, fixtures.length);
  assert.ok(coinUrls.length > 100);
  assert.ok(coinUrls.every((loc) => !loc.endsWith("/coins/kinesis-silver")));
  for (const loc of coinUrls) {
    assertPage(loc, computeRouteSeo({ url: loc }));
    assertPage(loc, await routeMetadata(new URL(loc), {}));
  }
  const kag = coinBySlug("kinesis-silver");
  assert.ok(kag, "the coin and its facts remain accessible");
  for (const locale of ["en", "es", "pt-BR", "tr", "vi", "id", "zh-Hans"]) {
    assert.equal(coinIndexable(kag, locale), false);
    assert.equal(coinsRouteSeo("/coins/kinesis-silver", locale, { urlFor: (path) => path }).status, 200);
    const loc = `https://nexualpha.com${localizedPath("/coins/kinesis-silver", locale)}`;
    assert.equal((await routeMetadata(new URL(loc), {})).robots, "noindex,follow");
  }
  const daily = buildNewsSeoFiles(feed);
  assert.equal(daily.sitemapFiles["sitemap-coins.xml"], built.xml, "publisher refreshes coins instead of retaining stale static URLs");
  assert.equal(buildSplitSitemaps(routeInventory([]), []).coins.xml, built.xml);
});

test("sitemap eligibility fails closed for missing, noindex, redirect and non-self canonical heads", () => {
  const loc = "https://nexualpha.com/news/example";
  const seo = { status: 200, robots: "index,follow", canonical: loc };
  assert.equal(isSelfCanonicalSitemapSeo(loc, seo), true);
  for (const invalid of [null, { ...seo, status: 301 }, { ...seo, robots: "noindex,follow" }, { ...seo, robots: "index,follow,noindex" }, { ...seo, canonical: "https://nexualpha.com/news/stronger" }]) {
    assert.equal(isSelfCanonicalSitemapSeo(loc, invalid), false);
  }
});
