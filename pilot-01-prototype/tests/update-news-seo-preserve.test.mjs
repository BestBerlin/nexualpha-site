import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import { buildNewsSeoFiles } from "../scripts/update-news-seo.mjs";
import { buildNewsSitemap, buildSitemap, routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import { sitemapUrl } from "../scripts/sitemap-publication-policy.mjs";
import { normalizeNewsFeed } from "../src/data/news-feed-client.js";

const feed = {
  generatedAt: "2026-09-08T12:00:00Z",
  articles: [{
    slug: "address-poisoning-transfer-history-wallet-warning-radar",
    status: "PUBLISHED",
    publishedAt: "2026-09-08T11:00:00Z",
    updatedAt: "2026-09-08T11:30:00Z",
    title: { en: "New Source-Backed Research", "zh-Hans": "新的源头核验研究" },
    summary: { en: "A verified summary.", "zh-Hans": "一段已核验摘要。" },
    content: { en: "A verified body.", "zh-Hans": "一段已核验正文。" },
    seo: { noindex: false },
    sources: [{ title: "Official source", publisher: "NexuAlpha", url: "https://nexualpha.com/source" }],
  }, {
    slug: "api-failover-cancel-control-disclosure-radar",
    status: "PUBLISHED",
    publishedAt: "2026-09-05T11:00:00Z",
    updatedAt: "2026-09-05T11:30:00Z",
    title: { en: "Old Source-Backed Research", "zh-Hans": "旧的源头核验研究" },
    summary: { en: "An older summary.", "zh-Hans": "一段旧摘要。" },
    content: { en: "An older body.", "zh-Hans": "一段旧正文。" },
    seo: { noindex: false },
    sources: [{ title: "Official source", publisher: "NexuAlpha", url: "https://nexualpha.com/source" }],
  }, {
    slug: "noindex-research",
    status: "PUBLISHED",
    publishedAt: "2026-09-08T10:00:00Z",
    updatedAt: "2026-09-08T10:30:00Z",
    title: { en: "Noindex Research", "zh-Hans": "不索引研究" },
    summary: { en: "A noindex summary.", "zh-Hans": "一段不索引摘要。" },
    content: { en: "A noindex body.", "zh-Hans": "一段不索引正文。" },
    seo: { noindex: true },
    sources: [{ title: "Official source", publisher: "NexuAlpha", url: "https://nexualpha.com/source" }],
  }],
};

const existingSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://nexualpha.com/</loc></url>
  <url><loc>https://nexualpha.com/exchanges/binance</loc></url>
  <url><loc>https://nexualpha.com/exchanges/binance</loc></url>
  <url><loc>https://nexualpha.com/news/api-failover-cancel-control-disclosure-radar</loc></url>
  <url><loc>https://nexualpha.com/zh-hans/news/stale-research</loc></url>
</urlset>
`;

const existingLlms = `# NexuAlpha

## Core Canonical Endpoints

- [Exchanges](https://nexualpha.com/exchanges)

## Published Source-Backed Research

- [Old](https://nexualpha.com/news/api-failover-cancel-control-disclosure-radar): Old summary.

---

## Editorial Guidelines & Integrity Boundary

- Preserve this policy.
`;

function locsFromSitemap(xml) {
  return [...String(xml || "").matchAll(/<loc>([\s\S]*?)<\/loc>/g)]
    .map((match) => match[1].replaceAll("&amp;", "&"));
}

function blockForLoc(xml, loc) {
  const escapedLoc = loc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(xml || "").match(new RegExp(`<url>\\s*<loc>${escapedLoc.replaceAll("&", "&amp;")}</loc>[\\s\\S]*?</url>`));
  return match?.[0] || "";
}

function hreflangsFromBlock(block) {
  return [...String(block || "").matchAll(/hreflang="([^"]+)"/g)].map((match) => match[1]);
}

function testArticle({
  slug,
  publishedAt,
  updatedAt = publishedAt,
  title = "Freshness Gate Research",
}) {
  return {
    slug,
    status: "PUBLISHED",
    publishedAt,
    updatedAt,
    title: { en: title, "zh-Hans": `${title} 中文` },
    summary: { en: "A verified freshness summary.", "zh-Hans": "一段已核验的新鲜度摘要。" },
    content: { en: "A verified freshness body.", "zh-Hans": "一段已核验的新鲜度正文。" },
    seo: { noindex: false },
    sources: [{ title: "Official source", publisher: "NexuAlpha", url: "https://nexualpha.com/source" }],
  };
}

test("news SEO refresh preserves non-news sitemap and llms sections", () => {
  const result = buildNewsSeoFiles(feed, { existingSitemap, existingLlms });

  assert.match(result.sitemap, /<loc>https:\/\/nexualpha\.com\/exchanges\/binance<\/loc>/);
  assert.match(result.sitemap, /<loc>https:\/\/nexualpha\.com\/news\/address-poisoning-transfer-history-wallet-warning-radar<\/loc>/);
  assert.match(result.sitemap, /<loc>https:\/\/nexualpha\.com\/zh-hans\/news\/address-poisoning-transfer-history-wallet-warning-radar<\/loc>/);
  assert.equal((result.sitemap.match(/<loc>https:\/\/nexualpha\.com\/exchanges\/binance<\/loc>/g) || []).length, 1);
  assert.ok((result.sitemap.match(/<loc>/g) || []).length > 8);
  assert.match(result.sitemap, /api-failover-cancel-control-disclosure-radar/);
  assert.doesNotMatch(result.sitemap, /stale-research/);
  assert.doesNotMatch(result.sitemap, /noindex-research/);

  assert.match(result.llms, /## Core Canonical Endpoints/);
  assert.match(result.llms, /Preserve this policy\./);
  assert.match(result.llms, /Old Source-Backed Research/);
  assert.match(result.llms, /New Source-Backed Research/);
});

test("news SEO refresh uses the shared publication set instead of raw feed expansion", () => {
  const inventory = [
    { pathname: "/", template: "home", index: true, locales: ["en"] },
    { pathname: "/news", template: "newsList", index: true, locales: ["en", "zh-Hans"] },
    { pathname: "/news/address-poisoning-transfer-history-wallet-warning-radar", template: "article", index: true, locales: ["en", "zh-Hans"] },
    { pathname: "/news/api-failover-cancel-control-disclosure-radar", template: "article", index: true, locales: ["en", "zh-Hans"] },
  ];
  const policy = {
    minSitemapUrls: 0,
    maxSitemapUrls: 10,
    maxQueryLocaleUrls: 2,
    priorityLocales: ["en", "zh-Hans"],
    selectedInternationalPaths: [],
    zhHansArticleLimit: 0,
    protectedIndexedUrls: [],
  };
  const result = buildNewsSeoFiles(feed, { existingSitemap, existingLlms, inventory, policy, allLocales: ["en", "zh-Hans"] });

  assert.deepEqual(result.publication.articleSlugs, ["address-poisoning-transfer-history-wallet-warning-radar", "api-failover-cancel-control-disclosure-radar"]);
  assert.equal((result.sitemap.match(/<loc>https:\/\/nexualpha\.com\/news\/address-poisoning-transfer-history-wallet-warning-radar\?locale=zh-Hans<\/loc>/g) || []).length, 0);
  assert.equal((result.sitemap.match(/<loc>https:\/\/nexualpha\.com\/news\/api-failover-cancel-control-disclosure-radar\?locale=zh-Hans<\/loc>/g) || []).length, 0);
  assert.match(result.llms, /publication version: nexualpha-search-publication-v1/i);
  assert.match(result.llms, /New Source-Backed Research/);
  assert.match(result.llms, /Old Source-Backed Research/);
  assert.doesNotMatch(result.llms, /Noindex Research/);
});

test("news SEO refresh rewrites non-article hreflang alternates through publication eligibility", () => {
  const staleSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://nexualpha.com/exchanges/binance</loc>
    <xhtml:link rel="alternate" hreflang="es" href="https://nexualpha.com/es/exchanges/binance" />
  </url>
  <url>
    <loc>https://nexualpha.com/compare/binance-vs-okx</loc>
    <xhtml:link rel="alternate" hreflang="de" href="https://nexualpha.com/de/compare/binance-vs-okx" />
  </url>
  <url>
    <loc>https://nexualpha.com/topics/derivatives</loc>
    <xhtml:link rel="alternate" hreflang="ar" href="https://nexualpha.com/ar/topics/derivatives" />
  </url>
</urlset>
`;
  const inventory = [
    { pathname: "/exchanges/binance", template: "venue", index: true },
    { pathname: "/compare/binance-vs-okx", template: "comparison", index: true },
    { pathname: "/topics/derivatives", template: "topic", index: true },
  ];
  const allLocales = ["en", "zh-Hans", "ja", "ko", "tr", "de", "es", "ar"];
  const policy = {
    publicationMode: "full-reviewed-indexable",
    minSitemapUrls: 0,
    maxSitemapUrls: 100,
    maxQueryLocaleUrls: 0,
    priorityLocales: allLocales,
    selectedInternationalPaths: [],
    protectedIndexedUrls: [],
  };
  const result = buildNewsSeoFiles({ generatedAt: feed.generatedAt, articles: [] }, {
    existingSitemap: staleSitemap,
    existingLlms,
    inventory,
    policy,
    allLocales,
  });

  const expectations = [
    ["/exchanges/binance", "es"],
    ["/compare/binance-vs-okx", "de"],
    ["/topics/derivatives", "ar"],
  ];
  for (const [pathname, blockedLocale] of expectations) {
    const block = blockForLoc(result.sitemap, sitemapUrl(pathname, "en"));
    assert.ok(block, pathname);
    const hreflangs = hreflangsFromBlock(block);
    assert.deepEqual(hreflangs, ["en", "ja", "ko", "tr", "zh-Hans", "x-default"], pathname);
    assert.ok(!hreflangs.includes(blockedLocale), `${pathname} leaked ${blockedLocale}`);
    assert.doesNotMatch(block, new RegExp(`/${blockedLocale}/`), pathname);
  }
});

test("news SEO refresh is idempotent with the build sitemap for the same feed", async () => {
  const feedText = await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8");
  const currentFeed = JSON.parse(feedText);
  const articles = normalizeNewsFeed(currentFeed);
  const buildSitemapXml = buildSitemap(routeInventory(articles), articles);
  const buildNewsSitemapXml = buildNewsSitemap(articles, { generatedAt: currentFeed.generatedAt });
  const result = buildNewsSeoFiles(currentFeed, {
    existingSitemap: buildSitemapXml,
    existingLlms,
  });

  const buildUrls = locsFromSitemap(buildSitemapXml);
  const refreshedUrls = locsFromSitemap(result.sitemap);
  assert.equal(refreshedUrls.length, buildUrls.length);
  assert.deepEqual(new Set(refreshedUrls), new Set(buildUrls));

  const buildNewsUrls = locsFromSitemap(buildNewsSitemapXml);
  const refreshedNewsUrls = locsFromSitemap(result.newsSitemap);
  assert.equal(refreshedNewsUrls.length, buildNewsUrls.length);
  assert.deepEqual(new Set(refreshedNewsUrls), new Set(buildNewsUrls));
});

test("news sitemap exposes only recent indexable reviewed news URLs", () => {
  const result = buildNewsSeoFiles(feed, { existingSitemap, existingLlms });

  assert.match(result.newsSitemap, /xmlns:news="http:\/\/www\.google\.com\/schemas\/sitemap-news\/0\.9"/);
  assert.match(result.newsSitemap, /<loc>https:\/\/nexualpha\.com\/news\/address-poisoning-transfer-history-wallet-warning-radar<\/loc>/);
  assert.match(result.newsSitemap, /<loc>https:\/\/nexualpha\.com\/zh-hans\/news\/address-poisoning-transfer-history-wallet-warning-radar<\/loc>/);
  assert.match(result.newsSitemap, /<news:publication>/);
  assert.match(result.newsSitemap, /<news:name>NexuAlpha<\/news:name>/);
  assert.match(result.newsSitemap, /<news:language>en<\/news:language>/);
  assert.match(result.newsSitemap, /<news:language>zh-Hans<\/news:language>/);
  assert.match(result.newsSitemap, /<news:publication_date>2026-09-08T11:00:00\.000Z<\/news:publication_date>/);
  assert.match(result.newsSitemap, /<news:title>New Source-Backed Research<\/news:title>/);
  assert.match(result.newsSitemap, /<news:title>新的源头核验研究<\/news:title>/);
  assert.match(result.newsSitemap, /<lastmod>2026-09-08<\/lastmod>/);
  assert.match(result.newsSitemap, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
  assert.doesNotMatch(result.newsSitemap, /api-failover-cancel-control-disclosure-radar/);
  assert.doesNotMatch(result.newsSitemap, /noindex-research/);
  assert.equal(result.newsSitemapUrls.length, 2);
});

test("news sitemap freshness gate excludes expired, future, and invalid publication dates", () => {
  const gatedFeed = {
    generatedAt: "2026-09-08T12:00:00Z",
    articles: [
      testArticle({
        slug: "basel-sco60-cryptoasset-exposure-standard-bank-capital-implementation-map",
        publishedAt: "2026-09-06T12:00:00Z",
        updatedAt: "2026-09-09T00:00:00Z",
        title: "Cutoff Research",
      }),
      testArticle({
        slug: "binance-ai-beta-market-insights-evidence-risk-checklist",
        publishedAt: "2026-09-06T11:59:59Z",
        title: "Expired Research",
      }),
      testArticle({
        slug: "binance-ava-gns-towns-network-support-ended-transfer-checklist",
        publishedAt: "2026-09-08T12:00:01Z",
        title: "Future Research",
      }),
      testArticle({
        slug: "binance-bncb-bstocks-spot-listing-redemption-eligibility-checklist",
        publishedAt: "not-a-date",
        title: "Invalid Date Research",
      }),
    ],
  };
  const result = buildNewsSeoFiles(gatedFeed, { existingSitemap, existingLlms });

  assert.match(result.newsSitemap, /<loc>https:\/\/nexualpha\.com\/news\/basel-sco60-cryptoasset-exposure-standard-bank-capital-implementation-map<\/loc>/);
  assert.match(result.newsSitemap, /<news:publication_date>2026-09-06T12:00:00\.000Z<\/news:publication_date>/);
  assert.match(result.newsSitemap, /<lastmod>2026-09-06<\/lastmod>/);
  assert.doesNotMatch(result.newsSitemap, /2026-09-09/);
  assert.doesNotMatch(result.newsSitemap, /binance-ai-beta-market-insights-evidence-risk-checklist/);
  assert.doesNotMatch(result.newsSitemap, /binance-ava-gns-towns-network-support-ended-transfer-checklist/);
  assert.doesNotMatch(result.newsSitemap, /binance-bncb-bstocks-spot-listing-redemption-eligibility-checklist/);
  assert.equal(result.newsSitemapUrls.length, 2);
});

test("machine discovery files do not publish a false MCP endpoint", async () => {
  await assert.rejects(access(new URL("../public/mcp.json", import.meta.url)), /ENOENT/);
});

test("robots exposes AI search crawlers and the regular sitemap entry point", async () => {
  const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
  for (const agent of ["OAI-SearchBot", "GPTBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Claude-SearchBot", "Claude-User", "anthropic-ai", "Google-Extended", "Applebot-Extended", "Bingbot"]) {
    assert.match(robots, new RegExp(`User-agent: ${agent}\\nAllow: /`));
  }
  assert.match(robots, /Sitemap: https:\/\/nexualpha\.com\/sitemap\.xml/);
  assert.doesNotMatch(robots, /Sitemap: https:\/\/nexualpha\.com\/news-sitemap\.xml/, "the non-News publisher does not advertise a Google News sitemap");
});


test("unknown newly arrived articles remain readable feed content but do not gain search publication", () => {
  const arrival = { ...feed.articles[0], slug: 'unreviewed-new-arrival' };
  const result = buildNewsSeoFiles({ ...feed, articles: [arrival, ...feed.articles] }, { existingSitemap, existingLlms });
  assert.doesNotMatch(result.sitemap, /unreviewed-new-arrival/);
  assert.doesNotMatch(result.newsSitemap, /unreviewed-new-arrival/);
  assert.doesNotMatch(result.llms, /unreviewed-new-arrival/);
  assert.equal(result.articles.some((article) => article.slug === arrival.slug), true);
});
