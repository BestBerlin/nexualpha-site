import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderLocaleSitemap, routeMetadata } from "../worker/index.js";
import {
  INDEXABLE_LOCALES,
  buildSplitSitemaps,
  buildSitemap,
  routeInventory,
} from "../scripts/generate-prerender-manifest.mjs";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import {
  assertSitemapPublicationBudget,
  buildSearchPublicationReport,
  buildSearchPublicationEligibility,
  loadSearchPublicationBaseline,
  selectSitemapPublicationEntries,
  sitemapLocalesForRoute,
  sitemapUrl,
} from "../scripts/sitemap-publication-policy.mjs";
import { newsArticleAvailableLocales, normalizeNewsFeed } from "../src/data/news-feed-client.js";
import { applyNewsSearchStateToFeed } from "../src/data/news-search-state.js";
import { indexableGeneratedComparePairs } from "../src/data/compare-generated.js";

const feedText = await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8");
const brazilMetadataText = await readFile(new URL("../public/content/brazil-metadata.json", import.meta.url), "utf8");
// Same T10 search state the build scripts and the Worker apply (src/data/news-search-state.js).
const articles = normalizeNewsFeed(applyNewsSearchStateToFeed(JSON.parse(feedText)));
const inventory = routeInventory(articles);
const policy = loadSearchPublicationBaseline();
const publication = selectSitemapPublicationEntries(inventory, articles, {
  policy,
  allLocales: INDEXABLE_LOCALES,
});
const legacyHistoricalIndexedUrlDispositions = [
  ...Array.from({ length: 4 }, (_, index) => ({
    url: `https://nexualpha.com/legacy-redirect-${index + 1}`,
    disposition: "redirected_legacy",
    target: publication.urls[index]?.loc || "https://nexualpha.com/",
  })),
  ...Array.from({ length: 7 }, (_, index) => ({
    url: `https://nexualpha.com/legacy-noindex-${index + 1}`,
    disposition: "accessible_noindex",
  })),
  ...Array.from({ length: 8 }, (_, index) => ({
    url: `https://nexualpha.com/legacy-missing-${index + 1}`,
    disposition: "truly_missing",
  })),
];
const legacyPolicy = {
  ...policy,
  protectedIndexedUrls: publication.urls.slice(0, 62).map((entry) => entry.loc),
  historicalIndexedUrlDispositions: legacyHistoricalIndexedUrlDispositions,
};
const legacyPublication = selectSitemapPublicationEntries(inventory, articles, {
  policy: legacyPolicy,
  allLocales: INDEXABLE_LOCALES,
});
const newsEnv = {
  ASSETS: {
    fetch: async (request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/content/news-feed.json") {
        return new Response(feedText, { headers: { "content-type": "application/json" } });
      }
      if (pathname === "/content/brazil-metadata.json") {
        return new Response(brazilMetadataText, { headers: { "content-type": "application/json" } });
      }
      if (pathname === "/index.html") {
        return new Response("<!doctype html><html><head><title>NexuAlpha</title></head><body><div id=\"root\"></div></body></html>", {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      return new Response("missing", { status: 404 });
    },
  },
};

function locsFromSitemap(xml) {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].replaceAll("&amp;", "&"));
}

function sitemapUrlBlock(xml, loc) {
  return [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)]
    .map((match) => match[0])
    .find((block) => block.includes(`<loc>${loc}</loc>`));
}

test("sitemap publication gate stays inside reviewed locale and URL budgets", () => {
  assert.deepEqual(assertSitemapPublicationBudget(publication), []);
  assert.ok(publication.stats.totalUrls >= policy.minSitemapUrls);
  assert.equal(publication.stats.publicationMode, "full-reviewed-indexable");
  assert.ok(publication.stats.totalUrls > policy.maxSitemapUrls, "full-reviewed indexable mode is no longer capped by the old cautious max");
  assert.equal(publication.stats.queryLocaleUrls, 0);
  // T10 (2026-10-12): 312 -> 224 article routes after the thin template pages and weaker duplicates left search.
  assert.equal(publication.stats.routesByTemplate.article, 224);
  assert.equal(publication.stats.urlsByTemplate.article, 448);
  assert.equal(publication.stats.routesByTemplate.comparison, 48);
  assert.equal(publication.stats.urlsByTemplate.comparison, 234);
  assert.equal(publication.stats.urlsByTemplate.venue, 260); // + /exchanges/coinw (en, zh-Hans) 2026-10-13
  assert.equal(publication.stats.urlsByTemplate.home, 15);
  assert.equal(publication.stats.urlsByTemplate.factbook || 0, 0);
  assert.equal(publication.stats.routesByTemplate.venue, 22);
  assert.equal(publication.stats.urlsByTemplate.venue, 260);
  assert.ok(publication.stats.lowDifferentiationUrlCount <= policy.maxLowDifferentiationUrls);
  assert.equal(
    publication.stats.cleanOrPathUrls,
    publication.stats.totalUrls - publication.stats.queryLocaleUrls,
  );
});

test("full reviewed publication cannot bypass the cautious sitemap locale policy", () => {
  for (const entry of publication.urls) {
    assert.ok(
      sitemapLocalesForRoute(entry.route, INDEXABLE_LOCALES).includes(entry.locale),
      `${entry.route.pathname} published unexpected ${entry.locale}`,
    );
  }

  const locs = new Set(publication.urls.map((entry) => entry.loc));
  const constrainedTopicLocales = ["es", "fr", "de", "ar", "ru", "it"];
  for (const locale of constrainedTopicLocales) {
    assert.ok(!locs.has(sitemapUrl("/topics/no-kyc", locale)), locale);
  }
  for (const locale of INDEXABLE_LOCALES) {
    assert.ok(locs.has(sitemapUrl("/exchanges/binance", locale)), `binance ${locale}`);
    assert.ok(locs.has(sitemapUrl("/compare/binance-vs-okx", locale)), `compare ${locale}`);
  }
  for (const locale of ["en", "zh-Hans", "zh-Hant"]) assert.ok(locs.has(sitemapUrl("/exchanges/drift", locale)), `drift ${locale}`);
  assert.ok(!locs.has(sitemapUrl("/exchanges/drift", "es")), "drift es");
  for (const locale of ["en", "zh-Hans", "ja", "ko", "tr"]) assert.ok(locs.has(sitemapUrl("/exchanges/hyperliquid", locale)), `hyperliquid ${locale}`);
  assert.ok(!locs.has(sitemapUrl("/exchanges/hyperliquid", "es")), "hyperliquid es");
  for (const locale of ["ja", "ko", "tr"]) {
    assert.ok(locs.has(sitemapUrl("/exchanges/binance", locale)), locale);
    assert.ok(locs.has(sitemapUrl("/compare/binance-vs-okx", locale)), locale);
    assert.ok(locs.has(sitemapUrl("/topics/no-kyc", locale)), locale);
  }
});

test("sitemap alternates contain only locales admitted by the publication gate", () => {
  const sitemap = buildSitemap(inventory, articles, { policy });
  const excluded = [
    "https://nexualpha.com/ar/topics/derivatives",
  ];

  for (const url of excluded) {
    assert.ok(!sitemap.includes(`<loc>${url}</loc>`), url);
    assert.ok(!sitemap.includes(`href="${url}"`), url);
  }

  for (const pathname of ["/compare/binance-vs-okx", "/exchanges/binance", "/topics/derivatives"]) {
    const block = sitemapUrlBlock(sitemap, `https://nexualpha.com${pathname}`);
    assert.ok(block, pathname);
    const alternates = [...block.matchAll(/hreflang="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(alternates, [], pathname);
  }
});

test("sitemap index splits indexable canonical routes by template", async () => {
  const split = buildSplitSitemaps(inventory, articles, { policy, newsSitemapLastmod: "2026-10-12T00:00:00Z" });
  const files = new Set(split.files.keys());

  assert.match(split.index, /<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  for (const file of [
    "sitemap-locales.xml",
    "sitemap-venues.xml",
    "sitemap-compare.xml",
    "sitemap-topics-tools.xml",
    ...INDEXABLE_LOCALES.map((locale) => `sitemap-articles-${locale.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xml`),
  ]) {
    assert.ok(files.has(file), file);
    assert.match(split.index, new RegExp(`<loc>https://nexualpha\\.com/${file}</loc>`), file);
  }
  assert.match(split.index, /<loc>https:\/\/nexualpha\.com\/news-sitemap\.xml<\/loc>/);
  assert.match(split.index, /<loc>https:\/\/nexualpha\.com\/news-sitemap\.xml<\/loc>\n {4}<lastmod>2026-10-12<\/lastmod>/);
  assert.doesNotMatch(
    split.index,
    /<loc>https:\/\/nexualpha\.com\/sitemap-updates\.xml<\/loc>/,
    "thin update detail pages stay out of the sitemap index",
  );

  const compareLocs = locsFromSitemap(split.files.get("sitemap-compare.xml").xml);
  assert.equal(compareLocs.length, 234);
  assert.equal(compareLocs.filter((loc) => /\/compare\//.test(new URL(loc).pathname)).length, 234);
  assert.equal(new Set(compareLocs).size, compareLocs.length);
  for (const pair of indexableGeneratedComparePairs()) {
    assert.ok(compareLocs.includes(`https://nexualpha.com/compare/${pair}`), pair);
    assert.ok(compareLocs.includes(`https://nexualpha.com/zh-hans/compare/${pair}`), `${pair} zh-Hans`);
    assert.ok(compareLocs.includes(`https://nexualpha.com/zh-hant/compare/${pair}`), `${pair} zh-Hant`);
  }

  const allLocs = [...split.files.values()].flatMap(({ xml }) => locsFromSitemap(xml));
  assert.equal(allLocs.length, publication.urls.length);
  assert.deepEqual(new Set(allLocs), new Set(publication.urls.map((entry) => entry.loc)));
  assert.ok(!allLocs.some((loc) => /\/news\/(?:page\/\d+|category\/)/.test(new URL(loc).pathname)));
  for (const forbidden of ["/embed/calculator", "/es/news", "/pt-br/news", "/ru/news"]) {
    assert.ok(!allLocs.some((loc) => new URL(loc).pathname === forbidden), forbidden);
  }

  const legacyLocaleLocs = locsFromSitemap(await renderLocaleSitemap({}));
  const legacyRedirectLocs = new Set([
    "https://nexualpha.com/exchanges/htx",
    "https://nexualpha.com/zh-hans/exchanges/htx",
    "https://nexualpha.com/exchanges/hashkey",
    "https://nexualpha.com/zh-hans/exchanges/hashkey",
    "https://nexualpha.com/exchanges/aevo",
    "https://nexualpha.com/zh-hans/exchanges/aevo",
  ]);
  const missingFromSplit = legacyLocaleLocs.filter((loc) => !allLocs.includes(loc) && !legacyRedirectLocs.has(loc));
  assert.deepEqual(missingFromSplit, [], "split sitemap children must preserve the old locale sitemap indexable URL union except redirected legacy exchange aliases");

  for (const loc of allLocs) {
    const metadata = await routeMetadata(new URL(loc), newsEnv);
    assert.equal(metadata.status, 200, loc);
    assert.equal(metadata.robots, "index,follow", loc);
    assert.equal(metadata.canonical, loc, loc);
  }
});

test("current GSC indexed baseline is fully classified", () => {
  const classified =
    legacyPublication.stats.protectedPublishedCount
    + legacyPublication.stats.excludedIndexedNoindex.length
    + legacyPublication.stats.excludedIndexedMissing.length
    + legacyPublication.stats.excludedIndexedBudget.length;
  const report = buildSearchPublicationReport(legacyPublication);

  assert.equal(legacyPolicy.protectedIndexedUrls.length, 62);
  assert.equal(legacyPublication.stats.protectedPublishedCount, 62);
  assert.equal(legacyPublication.stats.excludedIndexedNoindex.length, 0);
  assert.equal(legacyPublication.stats.excludedIndexedMissing.length, 0);
  assert.equal(legacyPublication.stats.excludedIndexedBudget.length, 0);
  assert.equal(classified, legacyPolicy.protectedIndexedUrls.length);
  assert.deepEqual(report.historicalIndexedCounts, {
    redirectedLegacy: 4,
    accessibleNoindex: 7,
    trulyMissing: 8,
  });
});

test("protected indexable pages remain in sitemap through canonical URLs while retired and legacy URLs stay excluded", () => {
  const sitemap = buildSitemap(inventory, articles, { policy });
  const locs = new Set(locsFromSitemap(sitemap));
  const published = new Set(publication.protectedPublished);

  for (const url of published) assert.ok(locs.has(url), url);
  for (const { url } of publication.stats.excludedIndexedNoindex) assert.ok(!locs.has(url), url);
  for (const { url } of publication.stats.excludedIndexedMissing) assert.ok(!locs.has(url), url);
  assert.ok(locs.has("https://nexualpha.com/compare/bybit-vs-bitget"));
  assert.ok(locs.has("https://nexualpha.com/compare/binance-vs-kraken"));
  assert.ok(!locs.has("https://nexualpha.com/factbook/htx"));
  assert.ok(!locs.has("https://nexualpha.com/factbook/aevo"));
  assert.ok(!locs.has("https://nexualpha.com/factbook/hashkey"));
  assert.ok(locs.has("https://nexualpha.com/methodology"));
  assert.ok(locs.has("https://nexualpha.com/news/okx-usd-to-usdc-spot-pair-migration"));
  assert.ok(!locs.has("https://nexualpha.com/compare/kraken-vs-binance?locale=en"));
  assert.ok(!locs.has("https://nexualpha.com/exchanges/htx"));
  assert.ok(!locs.has("https://nexualpha.com/exchanges/aevo"));
  assert.ok(!locs.has("https://nexualpha.com/exchanges/hashkey"));
  assert.ok(!locs.has("https://nexualpha.com/activities/research/bitget"));
  assert.ok(!locs.has("https://nexualpha.com/compare/bybit-vs-bitget?locale=en"));
  assert.ok(!locs.has("https://nexualpha.com/methodology?locale=en"));
  assert.ok(!locs.has("https://nexualpha.com/news/okx-usd-to-usdc-spot-pair-migration?locale=en"));
});

test("sitemap XML and search publication report are generated from the same URL set", () => {
  const sitemap = buildSitemap(inventory, articles, { policy });
  const locs = locsFromSitemap(sitemap);
  const uniqueLocs = new Set(locs);
  const report = buildSearchPublicationReport(publication);

  assert.equal(locs.length, publication.urls.length);
  assert.equal(uniqueLocs.size, locs.length);
  assert.equal(report.totalUrls, locs.length);
  assert.equal(
    report.queryLocaleUrls,
    locs.filter((loc) => new URL(loc).searchParams.has("locale")).length,
  );
  assert.equal(
    report.cleanOrPathUrls,
    locs.filter((loc) => !new URL(loc).searchParams.has("locale")).length,
  );
  assert.deepEqual(new Set(locs), new Set(publication.urls.map((entry) => entry.loc)));
  assert.equal(locs.filter((loc) => loc.includes("locale=en")).length, 0);
});

test("Exchange sitemap lastmod uses the exchange profile review date after factbook detail consolidation", () => {
  const sitemap = buildSitemap(inventory, articles, { policy });
  assert.match(
    sitemap,
    /<loc>https:\/\/nexualpha\.com\/exchanges\/binance<\/loc>[\s\S]*?<lastmod>2026-09-15<\/lastmod>/,
  );
  assert.doesNotMatch(sitemap, /<loc>https:\/\/nexualpha\.com\/factbook\/binance<\/loc>/);
});

test("Brazil original pages and cautious international routes are still discoverable", () => {
  const locs = new Set(publication.urls.map((entry) => entry.loc));
  const brazilRoutes = inventory.filter((route) => route.index && route.pathname.startsWith("/br"));
  assert.ok(brazilRoutes.length >= 7);
  for (const route of brazilRoutes) assert.ok(locs.has(sitemapUrl(route.pathname, "pt-BR")), route.pathname);

  for (const locale of ["ja", "ko", "tr"]) {
    assert.ok(locs.has(sitemapUrl("/exchanges/binance", locale)), locale);
    assert.ok(locs.has(sitemapUrl("/compare/binance-vs-okx", locale)), locale);
    assert.ok(locs.has(sitemapUrl("/topics/no-kyc", locale)), locale);
  }
});

test("collection hubs add only reviewed English sitemap entries", () => {
  const locs = new Set(publication.urls.map((entry) => entry.loc));

  assert.ok(locs.has("https://nexualpha.com/topics"));
  assert.ok(locs.has("https://nexualpha.com/factbook"));
  assert.equal(publication.stats.urlsByTemplate.topicCollection, 1);
  assert.equal(publication.stats.urlsByTemplate.factbookCollection, 1);

  for (const locale of INDEXABLE_LOCALES.filter((locale) => locale !== "en")) {
    assert.ok(!locs.has(sitemapUrl("/topics", locale)), locale);
    assert.ok(!locs.has(sitemapUrl("/factbook", locale)), locale);
  }
});

test("Mexico hub is published as one clean Spanish country URL while thin regional previews stay out", () => {
  const locs = new Set(publication.urls.map((entry) => entry.loc));

  assert.ok(locs.has("https://nexualpha.com/mx"));
  assert.ok(!locs.has("https://nexualpha.com/mx?locale=es"));
  assert.ok(locs.has("https://nexualpha.com/tw"));
  assert.ok(!locs.has("https://nexualpha.com/tw?locale=zh-Hant"));
  assert.ok(!locs.has("https://nexualpha.com/id"));
  assert.ok(locs.has("https://nexualpha.com/id-id"));
  assert.ok(!locs.has("https://nexualpha.com/id?locale=id"));
  for (const path of ["/mx/comparar", "/mx/costos", "/mx/conta", "/tw/comparar", "/tw/costos", "/tw/conta", "/int"]) {
    assert.ok(![...locs].some((loc) => new URL(loc).pathname === path), path);
  }
});

test("published Chinese news sitemap URLs match Worker index and canonical policy", async () => {
  const chineseNewsUrls = publication.urls
    .filter((entry) => entry.route.template === "article" && entry.locale === "zh-Hans")
    .map((entry) => entry.loc);

  assert.ok(chineseNewsUrls.length > 0, "expected zh-Hans news URLs in sitemap publication");

  for (const loc of chineseNewsUrls) {
    const metadata = await routeMetadata(new URL(loc), newsEnv);
    assert.equal(metadata.status, 200, loc);
    assert.equal(metadata.robots, "index,follow", loc);
    assert.equal(metadata.canonical, loc, loc);
    assert.equal(metadata.locale, "zh-Hans", loc);
  }
});

test("news route-locale metadata follows the final sitemap article budget", async () => {
  const publishedArticleUrls = new Set(
    publication.urls
      .filter((entry) => entry.route.template === "article")
      .map((entry) => entry.loc),
  );
  const excluded = [];

  for (const article of articles.filter((item) => item?.status === "PUBLISHED" && item?.seo?.noindex === false)) {
    for (const locale of newsArticleAvailableLocales(article)) {
      const loc = sitemapUrl(`/news/${article.slug}`, locale);
      if (!publishedArticleUrls.has(loc)) excluded.push({ article, locale, loc });
    }
  }

  const indexableArticleSlugs = new Set(
    articles
      .filter((item) => item?.status === "PUBLISHED" && item?.seo?.noindex === false)
      .map((item) => item.slug),
  );
  const expectedExcludedArticleRoutes = Math.max(
    0,
    indexableArticleSlugs.size - publication.stats.routesByTemplate.article,
  );
  const excludedArticlesBySlug = new Map(excluded.map(({ article }) => [article.slug, article]));
  const expectedExcludedLocales = [...excludedArticlesBySlug.values()]
    .reduce((count, article) => count + newsArticleAvailableLocales(article).length, 0);

  assert.equal(new Set(excluded.map(({ article }) => article.slug)).size, expectedExcludedArticleRoutes);
  assert.equal(excluded.length, expectedExcludedLocales);

  for (const { article, locale, loc } of excluded) {
    const server = await routeMetadata(new URL(loc), newsEnv);
    const client = computeRouteSeo({ url: loc, article, newsArticles: articles });

    assert.equal(server.status, 200, loc);
    assert.equal(server.robots, "noindex,follow", loc);
    assert.deepEqual(server.alternates, [], loc);
    assert.equal(client.status, 200, loc);
    assert.equal(client.robots, "noindex,follow", loc);
    assert.deepEqual(client.alternates, [], loc);
    assert.equal(client.locale, locale, loc);
  }

  const published = publication.urls.find((entry) => entry.route.template === "article" && entry.locale === "en");
  const publishedArticle = articles.find((article) => `/news/${article.slug}` === published.route.pathname);
  const server = await routeMetadata(new URL(published.loc), newsEnv);
  const client = computeRouteSeo({ url: published.loc, article: publishedArticle, newsArticles: articles });

  assert.equal(server.robots, "index,follow", published.loc);
  assert.equal(server.canonical, published.loc, published.loc);
  assert.ok(server.alternates.every((alternate) => publishedArticleUrls.has(alternate.href) || alternate.hreflang === "x-default"), published.loc);
  assert.equal(client.robots, "index,follow", published.loc);
  assert.equal(client.canonical, published.loc, published.loc);
  assert.ok(client.alternates.every((alternate) => publishedArticleUrls.has(alternate.href) || alternate.hreflang === "x-default"), published.loc);
});

test("publication report explains the reviewed indexable sitemap scope", () => {
  const report = buildSearchPublicationReport(legacyPublication);
  assert.equal(report.publicationScope, "reviewed-indexable-routes-only");
  assert.match(report.publicationScopeNote, /redirected legacy URLs/);
  assert.match(report.publicationScopeNote, /accessible noindex URLs/);
  assert.match(report.publicationScopeNote, /truly missing URLs/);
  assert.equal(report.maxReviewedNewsArticleRoutes, legacyPolicy.maxReviewedNewsArticleRoutes);
  assert.deepEqual(report.maxUrlsByTemplate, legacyPolicy.maxUrlsByTemplate);
  assert.equal(report.urlsByTemplate.article, legacyPublication.stats.urlsByTemplate.article);
  assert.equal(report.lowDifferentiationUrlCount, legacyPublication.stats.lowDifferentiationUrlCount);
  assert.deepEqual(report.excludedCounts, {
    indexedNoindex: legacyPublication.stats.excludedIndexedNoindex.length,
    indexedMissing: legacyPublication.stats.excludedIndexedMissing.length,
    indexedBudget: legacyPublication.stats.excludedIndexedBudget.length,
    redirectedLegacy: 4,
    accessibleNoindex: 7,
    trulyMissing: 8,
  });
  assert.equal(report.historicalIndexedUrlDispositions.length, 19);
});

test("route-locale eligibility is the single source for indexable hreflang candidates", () => {
  const eligibility = buildSearchPublicationEligibility(publication);

  assert.equal(eligibility.has("/exchanges/binance", "ja"), true);
  assert.equal(eligibility.has("/exchanges/binance", "es"), true);
  assert.equal(eligibility.has("/topics", "en"), true);
  assert.equal(eligibility.has("/topics", "ja"), false);
  assert.equal(eligibility.has("/mx", "es"), true);
  assert.equal(eligibility.has("/mx/comparar", "es"), false);

  const binanceJa = eligibility.entry("/exchanges/binance", "ja");
  assert.equal(binanceJa.loc, "https://nexualpha.com/ja/exchanges/binance");
  assert.equal(binanceJa.route.template, "venue");
});
