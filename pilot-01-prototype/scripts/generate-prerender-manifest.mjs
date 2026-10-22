#!/usr/bin/env node
import { announcementSnapshot } from "../src/components/shared/announcement-snapshot.js";
import { bitgetGuideSitemapEntries } from "../src/data/bitget-guide-seo.js";
import { beginnerSitemapEntries } from "../src/data/beginner-seo.js";
import { isTurkeyUnlistedVenue, turkeyListingAllowed } from "../src/data/partner-geo-policy.js";
import { campaignSitemapEntries } from "../src/data/campaign-autodraft.js";
import { articleRelatedPool } from '../src/data/article-related-links.js';
import { applyNewsSearchStateToFeed, newsStrengthRank } from "../src/data/news-search-state.js";
import { LEGAL_PAGE_PATHS, LEGAL_LOCALES, LEGAL_EFFECTIVE_DATE } from "../src/data/legal-pages.js";
import { buildPartnerGeoRestrictionsFeed } from "../src/data/partner-geo-restrictions.js";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { neutralVenueCatalog } from "../src/data/market-command.js";
import { venueDatabase } from "../src/data/venue-database.js";
import { priorityVenueAnswerFor } from "../src/data/priority-venue-answers.js";
import { TOPIC_GUIDES } from "../src/data/topic-guides-data.js";
import { TOKENIZED_ASSET_CLUSTER_REVIEW_DATE, TOKENIZED_ASSET_PAGES, TOKENIZED_ASSET_LOCALES } from "../src/data/tokenized-assets-cluster.js";
import { toolArticleLinks, toolKeyForPath } from "../src/data/topic-clusters.js";
import { VENUE_ALTERNATIVE_PAGES, VENUE_ALTERNATIVES_INDEX_LOCALES, VENUE_ALTERNATIVES_REVIEWED_AT } from "../src/data/venue-alternatives.js";
import { BRAZIL_DEADLINE_PATH_EN, BRAZIL_DEADLINE_PATH_PT, brazilDeadlineIndexLocales, isBrazilDeadlineSlug } from "../src/data/brazil-vasp-deadline-slugs.js";
import { BRAZIL_DEADLINE_REVIEWED_AT } from "../src/data/brazil-vasp-status.js";
import { BRAND_PAGE_PATHS } from "../src/data/brand-entity.js";
import { DATA_PAGE_PATHS, LIQUIDATION_HEATMAP_PATH } from "../src/data/market-data-pages.js";
import { NEWS_DISPLAY_LOCALES, newsListingIndexableLocales, newsListingPublishedLocales, newsSitemapLanguage, normalizeNewsFeed, normalizeNewsFeedSummaries, newsArticleAvailableLocales, newsArticleSeoLocales, projectNewsFeedForRoute } from "../src/data/news-feed-client.js";
import { BRAZIL_PAGES, BRAZIL_SOURCES } from "../src/data/brazil-market.js";
import { getBrazilSeo } from "../src/data/brazil-seo.js";
import { AUDIT_DATE as FACTBOOK_SOURCE_REVIEW_DATE } from "../src/data/factbook-registry.js";
import { factbookDates } from "../src/data/factbook-dates.js";
import { FACTS_AS_OF } from "../src/data/exchange-facts.js";
import { homeHeroEnabled } from "../src/data/home-hero-experiment.js";
import { COUNTRY_ROUTE_PREFIXES, localizedPath, parsePublicRoute } from "../src/data/locale-routing.js";
import { articleSitemapLocales, isSelfCanonicalSitemapSeo, buildSearchPublicationReport, selectSitemapPublicationEntries, sitemapHreflangAlternates, sitemapLocalesForRoute } from "./sitemap-publication-policy.mjs";
import { buildBotPromosFeed } from "../src/data/bot-promos-feed.js";
import { buildPartnersFeed } from "../src/data/partners-feed.js";
import { generatedCompareLocales, indexableGeneratedComparePairs } from "../src/data/compare-generated.js";
import { appDownloadSitemapEntries } from "../src/data/app-downloads.js";
import { academySitemapEntries } from "../src/data/academy-seo.js";
import { LONG_SHORT_INDEX_LOCALES, RADAR_PATHS, WHALES_INDEX_LOCALES } from "../src/data/radar-seo.js";
import { licenseSitemapEntries } from "../src/data/licenses-seo.js";
import { depositSitemapEntries } from "../src/data/deposit-seo.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { coinsSitemapEntries } from "../src/data/coins-seo.js";
import { exchangeHubNewsArticles } from "../src/data/hub-entity-news.js";
import { intelToolsSitemapEntries } from "../src/data/intel-tools-seo.js";
import { dataAssetsSitemapEntries } from "../src/data/data-assets-seo.js";
import { converterSitemapEntries } from "../src/data/converter-seo.js";
import { glossarySitemapEntries } from "../src/data/glossary-seo.js";
import { binanceOctoberSitemapEntries } from "../src/data/binance-october-seo.js";
import { bybitStocksSitemapEntries } from "../src/data/bybit-stocks-seo.js";
import { tokenizedStocksSitemapEntries } from "../src/data/tokenized-stocks-seo.js";
import { bitgetAllianceSitemapEntries } from "../src/data/bitget-alliance-seo.js";
import { krakenUsdgSitemapEntries } from "../src/data/kraken-usdg-seo.js";
export { sitemapLocalesForRoute };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NEWS_PUBLICATION_NAME = "NexuAlpha";
const NEWS_SITEMAP_LIMIT = 1000;
export const INDEXABLE_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
export const UI_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
// Every UI language gets an SSR document. New ur/uk pages remain noindex and
// outside sitemap publication until native review promotes them.
export const PRERENDER_LOCALES = UI_LOCALES;
export const CURATED_COMPARISONS = [
  "binance-vs-okx", "binance-vs-bybit", "okx-vs-bybit", "binance-vs-mexc",
  "okx-vs-mexc", "bybit-vs-bitget", "hyperliquid-vs-dydx", "uniswap-vs-jupiter", "binance-vs-kraken", "gate-io-vs-mexc",
  "binance-vs-bitget", "bitget-vs-okx", "bybit-vs-mexc", "bitget-vs-mexc",
];
const SITE_CONTENT_REVIEW_DATE = "2026-09-17";
const FACTBOOK_ONLY_LEGACY_SLUGS = new Set(["htx", "hashkey", "aevo"]);
const COUNTRY_OWNER_LOCALES = Object.freeze({
  "/mx": ["es"],
  "/mx/comparar": ["es"],
  "/mx/costos": ["es"],
  "/mx/conta": ["es"],
  "/tw": ["zh-Hant"],
  "/tw/comparar": ["zh-Hant"],
  "/tw/costos": ["zh-Hant"],
  "/tw/conta": ["zh-Hant"],
  "/id": ["id"],
  "/vn": ["vi"],
  "/hk": ["zh-Hant"],
  "/hk/comparar": ["zh-Hant"],
  "/hk/costos": ["zh-Hant"],
  "/hk/conta": ["zh-Hant"],
  "/eu": ["en"],
  "/uk": ["en"],
  "/us": ["en"],
  "/jp": ["ja"],
  "/kr": ["ko"],
  "/sg": ["en"],
  "/int": ["en"],
  "/markets/turkiye": ["tr"],
});

function pathSlug(pathname, prefix) {
  return String(pathname || "").startsWith(prefix) ? String(pathname).slice(prefix.length) : "";
}

export function routeTemplate(pathname) {
  if (BRAZIL_PAGES.some((page) => page.path === pathname)) return "brazilDecision";
  if (pathname === "/funding-rates/matrix" || DATA_PAGE_PATHS.includes(pathname) || pathname === LIQUIDATION_HEATMAP_PATH) return "dataTool";
  if (RADAR_PATHS.includes(pathname)) return "radarTool";
  if (BRAND_PAGE_PATHS.includes(pathname)) return "brandPage";
  if (["/mx", "/tw", "/id", "/vn", "/hk", "/eu", "/uk", "/us", "/jp", "/kr", "/sg", "/int", "/markets/turkiye"].includes(pathname)) return "regionalPreview";
  if (["/mx/comparar", "/mx/costos", "/mx/conta", "/tw/comparar", "/tw/costos", "/tw/conta", "/hk/comparar", "/hk/costos", "/hk/conta"].includes(pathname)) return pathname.endsWith("/comparar") ? "comparison" : pathname.endsWith("/costos") ? "rateTerminal" : "exchangeDirectory";
  if (LEGAL_PAGE_PATHS.includes(pathname)) return "legal";
  const staticTemplates = {
    "/": "home", "/exchanges": "exchangeDirectory", "/compare": "comparisonHub", "/activities": "activityCenter",
    "/rates": "rateTerminal", "/onchain": "onchainBoard", "/news": "newsList",
    "/methodology": "methodology", "/embed/calculator": "embedCalculator", "/partners": "partnerEmbedGuide", "/telegram": "telegram",
    "/index.html": "home", "/topics": "topicCollection", "/factbook": "factbookCollection", "/partners/embed-guide": "partnerEmbedGuide",
  };
  if (staticTemplates[pathname]) return staticTemplates[pathname];
  if (pathname.startsWith("/activities/research/")) return "research";
  if (pathname.startsWith("/activities/")) return "activityDetail";
  if (pathname.startsWith("/exchanges/")) return "venue";
  if (pathname.startsWith("/factbook/")) return "factbook";
  if (pathname.startsWith("/compare/")) return "comparison";
  if (pathname.startsWith("/topics/")) return "topic";
  if (pathname.startsWith("/news/")) return "article";
  if (pathname.startsWith("/ref/")) return "kolLanding";
  return "notFound";
}

export function routeInventory(newsArticles = []) {
  // /embed/calculator is an iframe widget: rendered, but noindex and never in a sitemap (audit 2026-10-11 #13).
  const staticPaths = [...LEGAL_PAGE_PATHS, ...DATA_PAGE_PATHS, ...RADAR_PATHS, "/funding-rates/matrix", LIQUIDATION_HEATMAP_PATH, ...BRAND_PAGE_PATHS, "/", "/exchanges", "/compare", "/activities", "/rates", "/onchain", "/news", "/methodology", "/partners", "/telegram"];
  const venueProfileSlugs = neutralVenueCatalog.map(({ slug }) => slug);
  const indexable = [
    ...staticPaths,
    "/topics",
    "/factbook",
    "/mx",
    "/tw",
    "/id",
    "/hk",
    "/jp",
    "/kr",
    "/sg",
    "/eu",
    "/uk",
    "/us",
    "/markets/turkiye",
    ...venueProfileSlugs.map((slug) => `/exchanges/${slug}`),
    ...Object.keys(TOPIC_GUIDES).map((slug) => `/topics/${slug}`),
    ...Object.values(TOKENIZED_ASSET_PAGES).map((page) => page.path),
    ...Object.values(VENUE_ALTERNATIVE_PAGES).map((page) => page.path),
    BRAZIL_DEADLINE_PATH_EN,
    BRAZIL_DEADLINE_PATH_PT,
    ...CURATED_COMPARISONS.map((pair) => `/compare/${pair}`),
    ...indexableGeneratedComparePairs().map((pair) => `/compare/${pair}`),
    ...newsArticles.filter((article) => article.seo?.noindex === false).map((article) => `/news/${article.slug}`),
  ];
  const nonindexed = [
    "/mx/comparar", "/mx/costos", "/mx/conta",
    "/tw/comparar", "/tw/costos", "/tw/conta",
    "/vn", "/hk/comparar", "/hk/costos", "/hk/conta", "/int",
    ...venueProfileSlugs.map((slug) => `/activities/research/${slug}`),
    ...newsArticles.filter((article) => article.seo?.noindex !== false).map((article) => `/news/${article.slug}`),
    "/ref/crypto-zhang", "/ref/alpha-king", "/ref/partner",
    "/compare/binance-vs-okx-vs-bybit",
    "/embed/calculator",
  ];
  return [...new Set([...indexable, ...nonindexed])].map((pathname) => ({
    pathname, level: pathname === "/" ? 1 : pathname.split("/").filter(Boolean).length + 1,
    template: routeTemplate(pathname),
    index: indexable.includes(pathname),
    ...(pathname === "/" ? { locales: UI_LOCALES } : {}),
    ...(LEGAL_PAGE_PATHS.includes(pathname) ? { locales: LEGAL_LOCALES } : {}),
    // Display locales may show a safe client-side summary, but only reviewed
    // locales are indexable. Keep the inventory honest so SEO verification,
    // canonical tags, robots and sitemap publication share one boundary.
    // Localized news lane (2026-10-10): the listing is published in the core editions (en, zh-Hans) plus every
    // locale that has at least one search-published article written natively in it.
    // Search locales need >= NEWS_LISTING_MIN_NATIVE_ARTICLES native editions (audit 2026-10-11 #4); every published
    // listing edition is still prerendered.
    ...(pathname === "/news" ? { locales: newsListingIndexableLocales(newsArticles), prerenderLocales: newsListingPublishedLocales(newsArticles) } : {}),
    ...(pathname === "/funding-rates/matrix" || DATA_PAGE_PATHS.includes(pathname) || pathname === LIQUIDATION_HEATMAP_PATH || BRAND_PAGE_PATHS.includes(pathname) ? { locales: INDEXABLE_LOCALES } : {}),
    ...(RADAR_PATHS.includes(pathname) ? { locales: pathname.startsWith("/whales") ? WHALES_INDEX_LOCALES : LONG_SHORT_INDEX_LOCALES, prerenderLocales: PRERENDER_LOCALES } : {}),
    ...(["/topics", "/factbook"].includes(pathname) ? { locales: ["en"] } : {}),
    ...(pathname.startsWith("/news/") ? { locales: newsArticleSeoLocales(newsArticles.find((article) => pathname === `/news/${article.slug}`)), prerenderLocales: newsArticleAvailableLocales(newsArticles.find((article) => pathname === `/news/${article.slug}`)) } : {}),
    ...(COUNTRY_OWNER_LOCALES[pathname] ? { locales: COUNTRY_OWNER_LOCALES[pathname] } : {}),
    // Native English display documents are not additional search owners.
    ...(["/mx", "/mx/comparar", "/mx/costos", "/mx/conta"].includes(pathname) ? { prerenderLocales: ["es", "en"] } : {}),
    // /markets/turkiye without a locale prefix is the noindex English display of the Turkish owner
    // (/tr/markets/turkiye). Prerender it too so crawlers and no-JS readers do not get an empty #root.
    ...(pathname === "/markets/turkiye" ? { prerenderLocales: ["tr", "en"] } : {}),
    ...(Object.values(TOKENIZED_ASSET_PAGES).some((page) => page.path === pathname) ? { locales: TOKENIZED_ASSET_LOCALES } : {}),
    ...(Object.values(VENUE_ALTERNATIVE_PAGES).some((page) => page.path === pathname) ? { locales: VENUE_ALTERNATIVES_INDEX_LOCALES } : {}),
    // Brazil BCB deadline topic: one edition per slug (English slug in en, Portuguese slug in pt-BR); the sitemap lists
    // exactly those editions (ownLocales).
    ...([BRAZIL_DEADLINE_PATH_EN, BRAZIL_DEADLINE_PATH_PT].includes(pathname) ? { locales: brazilDeadlineIndexLocales(pathname), ownLocales: true } : {}),
    ...(pathname.startsWith("/compare/") && indexableGeneratedComparePairs().includes(pathSlug(pathname, "/compare/")) ? { locales: generatedCompareLocales(pathSlug(pathname, "/compare/")), generatedComparison: true } : {}),
  })).concat(BRAZIL_PAGES.map(({ path: pathname }) => ({ pathname, level: pathname === '/br' ? 2 : 3,
    template: 'brazilDecision', index: true, locales: ['pt-BR'] })));
}

function stripReactResourceHints(html) {
  return html.replace(/<link\s+rel="preload"\s+as="image"[^>]*\/>/g, "");
}

function prerenderUrl(pathname, locale) {
  if (COUNTRY_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return parsePublicRoute(pathname).locale === locale ? pathname : `${pathname}?locale=${encodeURIComponent(locale)}`;
  }
  const href = localizedPath(pathname, locale);
  const url = new URL(href, "https://nexualpha.com");
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  if (publicRoute.locale !== locale) {
    url.searchParams.set("locale", locale);
    return `${url.pathname}${url.search}`;
  }
  return href;
}

export function buildSitemap(inventory, newsArticles, options = {}) {
  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  const publication = selectSitemapPublicationEntries(inventory, newsArticles, {
    ...options,
    allLocales: INDEXABLE_LOCALES,
  });
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
  for (const { route, loc, locale } of publication.urls) {
    const article = newsArticles.find((article) => route.pathname === `/news/${article.slug}`);
    const date = routeLastmod(route, article, locale, { newsArticles });
    // hreflang comes from the same helpers as the page head (audit 2026-10-11 #1): news routes carry their indexable
    // editions; every other route's alternates live on the page and in /locale-sitemap.xml (worker routeMetadata), so
    // this file never states a second, smaller set for the same <loc>.
    lines.push("  <url>", `    <loc>${escape(loc)}</loc>`);
    for (const alternate of sitemapHreflangAlternates(route.pathname, { article, newsArticles, eligibleArticleLocales: route.template === "article" ? route.locales : undefined })) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escape(alternate.href)}" />`);
    }
    // A rebuild is not a content update: use the route's own content date only.
    if (date && Number.isFinite(Date.parse(date))) lines.push(`    <lastmod>${new Date(date).toISOString().slice(0, 10)}</lastmod>`);
    lines.push("  </url>");
  }
  return [...lines, "</urlset>", ""].join("\n");
}

function sitemapFileForEntry({ route, locale }) {
  const template = route?.template || "unknown";
  if (template === "article") return `sitemap-articles-${String(locale || "en").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xml`;
  if (template === "venue" || template === "factbook") return "sitemap-venues.xml";
  if (template === "comparison" && String(route?.pathname || "").startsWith("/compare/")) return "sitemap-compare.xml";
  if (["topic", "topicCollection", "factbookCollection", "rateTerminal", "onchainBoard", "dataTool", "radarTool", "methodology", "partnerEmbedGuide"].includes(template)) return "sitemap-topics-tools.xml";
  return "sitemap-locales.xml";
}

function sitemapEntryLastmod(entry, newsArticles, options = {}) {
  const article = newsArticles.find((article) => entry.route.pathname === `/news/${article.slug}`);
  return routeLastmod(entry.route, article, entry.locale, { newsArticles }) || null;
}

function buildUrlset(entries, newsArticles, options = {}) {
  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
  for (const entry of entries) {
    const article = newsArticles.find((article) => entry.route.pathname === `/news/${article.slug}`);
    const date = sitemapEntryLastmod(entry, newsArticles, options);
    lines.push("  <url>", `    <loc>${escape(entry.loc)}</loc>`);
    for (const alternate of sitemapHreflangAlternates(entry.route.pathname, { article, newsArticles, eligibleArticleLocales: entry.route.template === "article" ? entry.route.locales : undefined })) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escape(alternate.href)}" />`);
    }
    if (date && Number.isFinite(Date.parse(date))) lines.push(`    <lastmod>${new Date(date).toISOString().slice(0, 10)}</lastmod>`);
    lines.push("  </url>");
  }
  return [...lines, "</urlset>", ""].join("\n");
}

function newestEntryDate(entries, newsArticles, options = {}) {
  const dates = entries
    .map((entry) => Date.parse(sitemapEntryLastmod(entry, newsArticles, options)))
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
  return dates.length ? new Date(dates[0]).toISOString().slice(0, 10) : null;
}

function buildSitemapIndex(rows) {
  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  for (const row of rows) {
    lines.push("  <sitemap>", `    <loc>${escape(row.loc)}</loc>`, ...(row.lastmod ? [`    <lastmod>${escape(row.lastmod)}</lastmod>`] : []), "  </sitemap>");
  }
  return [...lines, "</sitemapindex>", ""].join("\n");
}

export function buildSplitSitemaps(inventory, newsArticles, options = {}) {
  options = { ...options, articleSeoLocales: options.articleSeoLocales || new Map() };
  const publication = selectSitemapPublicationEntries(inventory, newsArticles, {
    ...options,
    allLocales: INDEXABLE_LOCALES,
  });
  const groups = new Map();
  for (const entry of publication.urls) {
    const file = sitemapFileForEntry(entry);
    if (!groups.has(file)) groups.set(file, []);
    groups.get(file).push(entry);
  }
  // Runtime article sitemaps are rendered from the mounted live feed, so the index must advertise every search locale
  // even when the build-time feed currently has no reviewed article in that locale yet.
  for (const locale of INDEXABLE_LOCALES) {
    const file = `sitemap-articles-${String(locale).toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xml`;
    if (!groups.has(file)) groups.set(file, []);
  }
  const files = new Map(
    [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([file, entries]) => [file, {
        xml: buildUrlset(entries, newsArticles, options),
        count: entries.length,
        lastmod: newestEntryDate(entries, newsArticles, options),
      }]),
  );
  const indexRows = [...files.entries()].map(([file, info]) => ({
    loc: `https://nexualpha.com/${file}`,
    lastmod: info.lastmod,
  }));
  // Regular article sitemaps carry every search-published edition; we are not a Google News publisher.
  // NexuAlpha Academy (2026-10-12): hub + 24 lessons in every locale with a localized lesson, rendered by the Worker at
  // request time. It is its own file outside the route inventory's publication budget; its
  // hreflang sets are the page head's (routeAlternates over ACADEMY_INDEX_LOCALES).
  const apps = buildAppsSitemap();
  indexRows.push({ loc: "https://nexualpha.com/sitemap-apps.xml", lastmod: apps.lastmod });
  const academy = buildAcademySitemap();
  indexRows.push({ loc: "https://nexualpha.com/sitemap-academy.xml", lastmod: academy.lastmod });
  const beginner = buildDownloadOrAcademySitemap(() => [...beginnerSitemapEntries(), ...bitgetGuideSitemapEntries()]);
  indexRows.push({ loc: "https://nexualpha.com/sitemap-beginner.xml", lastmod: beginner.lastmod });
  const licenses = buildLicensesSitemap();
  indexRows.push({ loc: "https://nexualpha.com/sitemap-licenses.xml", lastmod: licenses.lastmod });
  // Deposit & withdraw hub, its indexable country editions and /crypto-cards (2026-10-15), rendered by the Worker.
  const deposit = buildDepositSitemap();
  indexRows.push({ loc: "https://nexualpha.com/sitemap-deposit.xml", lastmod: deposit.lastmod });
  // Where to buy <coin> (2026-10-12): /coins and every coin page in its indexable locales (listed on a covered exchange
  // and described in that language), rendered by the Worker at request time; hreflang sets match the page head.
  const coins = buildCoinsSitemap();
  indexRows.push({ loc: "https://nexualpha.com/sitemap-coins.xml", lastmod: coins.lastmod });
  // Spot ETF flows + crypto calendar (2026-10-13): refreshed daily on the host, so no build-time lastmod in the index.
  const dataTools = buildIntelToolsSitemap();
  indexRows.push({ loc: "https://nexualpha.com/sitemap-data.xml" });
  const convert = buildConvertSitemap();
  indexRows.push({ loc: "https://nexualpha.com/sitemap-convert.xml", lastmod: convert.lastmod });
  // Crypto glossary (2026-10-13): /glossary and every term page in the locales it is written in, rendered by the Worker
  // at request time; hreflang sets match the page head.
  const glossary = buildGlossarySitemap();
  indexRows.push({ loc: "https://nexualpha.com/sitemap-glossary.xml", lastmod: glossary.lastmod });
  // Campaign landing pages (2026-10-12: /activities/binance-october-gifts, /activities/bybit-stocks), rendered by the
  // Worker at request time; hreflang sets are the page head's.
  const campaigns = buildCampaignSitemap();
  indexRows.push({ loc: "https://nexualpha.com/sitemap-campaigns.xml", lastmod: campaigns.lastmod });
  // Tokenized US stocks (2026-10-15): hub + 12 ticker pages in every written edition, request-time SSR in the Worker.
  const tokenizedStocks = buildTokenizedStocksSitemap();
  indexRows.push({ loc: "https://nexualpha.com/sitemap-tokenized-stocks.xml", lastmod: tokenizedStocks.lastmod });
  return {
    index: buildSitemapIndex(indexRows),
    files,
    academy,
    beginner,
    licenses,
    deposit,
    coins,
    dataTools,
    convert,
    glossary,
    apps,
    campaigns,
    tokenizedStocks,
    publication,
  };
}

export function buildTokenizedStocksSitemap() {
  return buildDownloadOrAcademySitemap(tokenizedStocksSitemapEntries);
}

export function buildAppsSitemap() {
  return buildDownloadOrAcademySitemap(appDownloadSitemapEntries);
}

export function buildGlossarySitemap() {
  return buildDownloadOrAcademySitemap(glossarySitemapEntries);
}

export function buildAcademySitemap() {
  return buildDownloadOrAcademySitemap(academySitemapEntries);
}

export function buildDepositSitemap() {
  return buildDownloadOrAcademySitemap(depositSitemapEntries);
}

export function buildLicensesSitemap() {
  return buildDownloadOrAcademySitemap(licenseSitemapEntries);
}

// Campaign landing pages share one sitemap: Binance October gifts and Bybit Stocks (2026-10-12), Bitget Alliance (2026-10-13).
export function buildCampaignSitemap() {
  return buildDownloadOrAcademySitemap((options) => [...binanceOctoberSitemapEntries(options), ...bybitStocksSitemapEntries(options), ...bitgetAllianceSitemapEntries(options), ...krakenUsdgSitemapEntries(options), ...campaignSitemapEntries(options)]);
}

function buildDownloadOrAcademySitemap(sitemapEntries) {
  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  const isIndexableEdition = (href) => {
    const url = new URL(href, "https://nexualpha.com");
    return !["ur", "uk"].includes(parsePublicRoute(url.pathname, url.searchParams).locale);
  };
  const entries = sitemapEntries({ urlFor: (pathname, locale) => `https://nexualpha.com${localizedPath(pathname, locale)}` })
    .filter((entry) => isIndexableEdition(entry.loc))
    .map((entry) => ({ ...entry, alternates: entry.alternates.filter((alternate) => !["ur", "uk"].includes(alternate.hreflang) && isIndexableEdition(alternate.href)) }));
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
  for (const entry of entries) {
    lines.push("  <url>", `    <loc>${escape(entry.loc)}</loc>`);
    for (const alternate of entry.alternates) lines.push(`    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escape(alternate.href)}" />`);
    lines.push(`    <lastmod>${entry.lastmod}</lastmod>`, "  </url>");
  }
  const lastmod = entries.map((entry) => entry.lastmod).sort().pop() || null;
  return { xml: [...lines, "</urlset>", ""].join("\n"), count: entries.length, lastmod };
}

export function buildIntelToolsSitemap() {
  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  const urlFor = (pathname, locale) => `https://nexualpha.com${localizedPath(pathname, locale)}`;
  // Linkable data assets + /press (SEO W43, 2026-10-18) share this data sitemap, with their own lastmod/changefreq.
  const entries = [...intelToolsSitemapEntries({ urlFor }).map((entry) => ({ ...entry, lastmod: null, changefreq: "daily" })), ...dataAssetsSitemapEntries({ urlFor })];
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
  for (const entry of entries) {
    lines.push("  <url>", `    <loc>${escape(entry.loc)}</loc>`);
    for (const alternate of entry.alternates) lines.push(`    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escape(alternate.href)}" />`);
    if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
    lines.push(`    <changefreq>${entry.changefreq || "daily"}</changefreq>`, "  </url>");
  }
  return { xml: [...lines, "</urlset>", ""].join("\n"), count: entries.length };
}

export function buildCoinsSitemap() {
  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  const entries = coinsSitemapEntries({ urlFor: (pathname, locale) => `https://nexualpha.com${localizedPath(pathname, locale)}` })
    .filter((entry) => isSelfCanonicalSitemapSeo(entry.loc, computeRouteSeo({ url: entry.loc })));
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
  for (const entry of entries) {
    lines.push("  <url>", `    <loc>${escape(entry.loc)}</loc>`);
    for (const alternate of entry.alternates) lines.push(`    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escape(alternate.href)}" />`);
    if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
    lines.push("  </url>");
  }
  const lastmod = entries.map((entry) => entry.lastmod).filter(Boolean).sort().pop() || null;
  return { xml: [...lines, "</urlset>", ""].join("\n"), count: entries.length, lastmod };
}

export function buildConvertSitemap() {
  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  const entries = converterSitemapEntries({ urlFor: (pathname, locale) => `https://nexualpha.com${localizedPath(pathname, locale)}` });
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
  for (const entry of entries) {
    lines.push("  <url>", `    <loc>${escape(entry.loc)}</loc>`);
    for (const alternate of entry.alternates) lines.push(`    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escape(alternate.href)}" />`);
    if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
    lines.push("  </url>");
  }
  const lastmod = entries.map((entry) => entry.lastmod).filter(Boolean).sort().pop() || null;
  return { xml: [...lines, "</urlset>", ""].join("\n"), count: entries.length, lastmod };
}

function latestDate(values, fallback = SITE_CONTENT_REVIEW_DATE) {
  const dates = values
    .map((value) => Date.parse(value))
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
  return dates.length ? new Date(dates[0]).toISOString() : fallback;
}

// Real content date of a sitemap route (audit 2026-10-11 #3): article dateModified/publishedAt, the newest article for the
// home and news listings, venue/factbook/topic review dates from data. Shared with scripts/update-news-seo.mjs so the
// publisher never stamps the publish date on pages that did not change. Returns null when the route has no date.
export function routeLastmod(route, article, locale = "en", { newsArticles = [] } = {}) {
  if (route.pathname === "/funding-rates/matrix") return "2026-10-13";
  if (LEGAL_PAGE_PATHS.includes(route.pathname)) return LEGAL_EFFECTIVE_DATE;
  if (article) return article.updatedAt || article.publishedAt || null;
  if (route.pathname === "/" || route.template === "newsList" || route.pathname === "/news") {
    const newest = latestDate((Array.isArray(newsArticles) ? newsArticles : []).filter((item) => item?.seo?.noindex === false).map((item) => item.updatedAt || item.publishedAt), null);
    if (newest) return newest;
  }
  if (route.pathname.startsWith("/br")) return latestDate(BRAZIL_SOURCES.map((source) => source.checkedAt));
  if (route.template === "topic") {
    const slug = pathSlug(route.pathname, "/topics/");
    if (VENUE_ALTERNATIVE_PAGES[slug]) return VENUE_ALTERNATIVES_REVIEWED_AT;
    if (isBrazilDeadlineSlug(slug)) return BRAZIL_DEADLINE_REVIEWED_AT;
    return TOPIC_GUIDES[slug]?.lastUpdated || TOKENIZED_ASSET_PAGES[slug]?.updatedAt || TOKENIZED_ASSET_CLUSTER_REVIEW_DATE;
  }
  if (route.template === "venue") return priorityVenueAnswerFor(pathSlug(route.pathname, "/exchanges/"), locale)?.reviewedAt || "2026-09-15";
  // Latest real review of the data on the page (fees checked / benefit terms / dossier), same as the Dataset schema.
  if (route.template === "factbook") return factbookDates(pathSlug(route.pathname, "/factbook/")).latestReviewOn || FACTBOOK_SOURCE_REVIEW_DATE;
  // Shared comparison presentation changed on this date, not on every build.
  if (route.template === "comparison") return "2026-09-22";
  if (route.template === "regionalPreview") return "2026-09-15";
  // Fee tables on the directory and the rate terminal show the facts file's check date.
  if (["exchangeDirectory", "rateTerminal"].includes(route.template) && FACTS_AS_OF) return FACTS_AS_OF;
  return SITE_CONTENT_REVIEW_DATE;
}

export function buildNewsSitemap(newsArticles, { generatedAt = new Date().toISOString() } = {}) {
  const origin = "https://nexualpha.com";
  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  const href = (pathname, locale) => `${origin}${localizedPath(pathname, locale)}`;
  const reference = Date.parse(generatedAt);
  const cutoff = reference - (2 * 24 * 60 * 60 * 1000);
  const recentArticles = newsArticles.filter((article) => {
    const publishedAt = Date.parse(article.publishedAt);
    return article.seo?.noindex === false
      && Number.isFinite(reference)
      && Number.isFinite(publishedAt)
      && publishedAt >= cutoff
      && publishedAt <= reference;
  });
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
  let urlCount = 0;
  for (const article of recentArticles) {
    const locales = articleSitemapLocales(article, newsArticles);
    for (const locale of locales) {
      if (urlCount >= NEWS_SITEMAP_LIMIT) break;
      const pathname = `/news/${article.slug}`;
      const title = article.title?.[locale] || article.title?.en || article.slug;
      lines.push("  <url>", `    <loc>${escape(href(pathname, locale))}</loc>`);
      for (const alternate of sitemapHreflangAlternates(pathname, { article, newsArticles, eligibleArticleLocales: locales })) {
        lines.push(`    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escape(alternate.href)}" />`);
      }
      const lastmod = article.updatedAt || article.publishedAt;
      if (lastmod && Number.isFinite(Date.parse(lastmod))) lines.push(`    <lastmod>${new Date(Date.parse(lastmod)).toISOString().slice(0, 10)}</lastmod>`);
      lines.push("    <news:news>", "      <news:publication>", `        <news:name>${escape(NEWS_PUBLICATION_NAME)}</news:name>`, `        <news:language>${escape(newsSitemapLanguage(locale))}</news:language>`, "      </news:publication>");
      lines.push(`      <news:publication_date>${escape(new Date(Date.parse(article.publishedAt)).toISOString())}</news:publication_date>`, `      <news:title>${escape(title)}</news:title>`, "    </news:news>", "  </url>");
      urlCount += 1;
    }
  }
  return [...lines, "</urlset>", ""].join("\n");
}

// Türkiye editions (tr-bitget-sweep): related, hub and listing articles never feature an SPK-listed venue; an article
// page keeps its own article (the worker applies the Türkiye article view to it).
function routeNewsArticles(pathname, context) {
  const articles = routeNewsArticlesFor(pathname, context);
  if (!Array.isArray(articles) || context.locale !== "tr") return articles;
  return articles.filter((article) => pathname === `/news/${article.slug}` || turkeyListingAllowed([article.slug, article.title?.tr || article.title?.en, article.summary?.tr || article.summary?.en, article.relatedVenues], { locale: context.locale }));
}

function routeNewsArticlesFor(pathname, { newsArticles, newsArticleSummaries, locale }) {
  if (pathname === "/news") return newsArticleSummaries;
  if (pathname.startsWith("/news/")) {
    const current = newsArticles.find((article) => pathname === `/news/${article.slug}`);
    if (!current) return [];
    return articleRelatedPool(current, [current, ...newsArticleSummaries.filter((article) => article.slug !== current.slug)], locale);
  }
  const venueSlug = pathname.match(/^\/exchanges\/([a-z0-9-]+)$/)?.[1];
  if (venueSlug) {
    const venue = venueDatabase[venueSlug];
    return exchangeHubNewsArticles(newsArticleSummaries, { slug: venueSlug, name: venue?.name, locale });
  }
  return undefined;
}

export async function generatePrerenderManifest({ projectRoot = root, render } = {}) {
  const clientDir = path.join(projectRoot, "dist", "client");
  const ssrEntry = path.join(projectRoot, "dist", "ssr", "entry-server.js");
  if (!existsSync(clientDir)) throw new Error(`Missing client build directory: ${clientDir}`);
  if (!render) {
    if (!existsSync(ssrEntry)) throw new Error(`Missing SSR entry build: ${ssrEntry}`);
    ({ render } = await import(pathToFileURL(ssrEntry).href));
  }
  const feedText = readFileSync(path.join(projectRoot, "public", "content", "news-feed.json"), "utf8");
  // T10: same search state as the Worker applies to the live feed (src/data/news-search-state.js).
  const rawFeed = applyNewsSearchStateToFeed(JSON.parse(feedText));
  const newsArticles = normalizeNewsFeed(rawFeed);
  const newsArticleSummaries = normalizeNewsFeedSummaries(rawFeed);
  const newsFeedFingerprint = createHash("sha256").update(feedText).digest("hex");
  const announcementFile = path.join(projectRoot, "public", "intel", "official-announcements.json");
  const officialAnnouncements = existsSync(announcementFile) ? JSON.parse(readFileSync(announcementFile, "utf8")) : { items: [] };
  const inventory = routeInventory(newsArticles);
  const publication = selectSitemapPublicationEntries(inventory, newsArticles, { allLocales: INDEXABLE_LOCALES });
  const publishedRouteLocales = new Set(publication.urls.map(({ route, locale }) => `${route.pathname}|${locale}`));
  const brazilMetadata = JSON.stringify({ version: 1, pages: Object.fromEntries(BRAZIL_PAGES.map((page) => [page.path, getBrazilSeo(page.path)])) });
  for (const directory of [path.join(projectRoot, 'public', 'content'), path.join(clientDir, 'content')]) {
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'brazil-metadata.json'), brazilMetadata + '\n');
    writeFileSync(path.join(directory, 'news-feed.sha256.txt'), `${newsFeedFingerprint}\n`);
  }
  const routes = {};
  for (const route of inventory) {
    const { pathname } = route;
    for (const locale of route.prerenderLocales || route.locales || PRERENDER_LOCALES) {
      const url = prerenderUrl(pathname, locale);
      const initialArticles = routeNewsArticles(pathname, { newsArticles, newsArticleSummaries, locale });
      // Tool pages (/rates, curated compare pairs, /activities without a live feed) list their related articles from the
      // build feed; the Worker renders the request-time tool routes from the live feed (links-l10n lane, scorecard D4).
      const toolKey = toolKeyForPath(pathname);
      const toolArticles = toolKey ? toolArticleLinks(toolKey, newsArticles, locale, { rank: newsStrengthRank }) || undefined : undefined;
      const noticeSlugs = pathname.startsWith("/exchanges/") ? [pathname.split("/")[2]] : pathname.startsWith("/compare/") ? pathname.split("/")[2].split("-vs-") : null;
      const noticeState = pathname === "/" || noticeSlugs ? { officialAnnouncements: announcementSnapshot({
        ...officialAnnouncements,
        ...(officialAnnouncements.sources ? { sources: Object.fromEntries(Object.entries(officialAnnouncements.sources).filter(([slug]) => !isTurkeyUnlistedVenue(slug, { locale }))) } : {}),
        // Türkiye editions carry no SPK-listed venue's notices (tr-bitget-sweep), except on that venue's own pages.
        items: (officialAnnouncements.items || []).filter((item) => (!noticeSlugs || noticeSlugs.includes(item.venue))
          && (noticeSlugs?.some((slug) => isTurkeyUnlistedVenue(slug, { locale })) || turkeyListingAllowed([item.venue, item.title, item.url], { locale }))).slice(0, 40),
      }) } : {};
      const html = stripReactResourceHints(await render(url, { newsArticles: initialArticles, toolArticles, ...noticeState }));
      if (!/<h1\b/i.test(html)) throw new Error(`Missing prerender H1: ${url}`);
      const asset = `/prerender/${locale}/${pathname === "/" ? "home" : pathname.slice(1)}.json`;
      const assetPath = path.join(clientDir, asset);
      mkdirSync(path.dirname(assetPath), { recursive: true });
      const assetPayload = { html, ...noticeState,
        ...(initialArticles?.length ? { newsArticles: projectNewsFeedForRoute(pathname.startsWith("/news/") ? pathname : "/news", initialArticles, locale), newsFeedFingerprint } : {}),
        ...(toolArticles ? { toolArticles } : {}),
      };
      writeFileSync(assetPath, `${JSON.stringify(assetPayload)}\n`);
      // Home hero copy experiment (X5): variant B of every home edition is prerendered next to A with the same renderer,
      // so a visitor the worker assigns to B gets complete SSR HTML from the same fast path (no request-time render, no
      // client swap). Only the worker's assignment (experimentRegistry.home_hero_copy_v1.enabled) ever serves it.
      let heroVariants;
      if (pathname === "/" && homeHeroEnabled()) {
        const htmlB = stripReactResourceHints(await render(url, { heroVariant: "b", ...noticeState }));
        if (!/<h1\b/i.test(htmlB) || !htmlB.includes('data-hero-variant="b"')) throw new Error(`Missing hero variant B prerender: ${url}`);
        const assetB = `/prerender/${locale}/home-hero-b.json`;
        writeFileSync(path.join(clientDir, assetB), `${JSON.stringify({ html: htmlB, ...noticeState })}\n`);
        heroVariants = { b: assetB };
      }
      routes[`${pathname}|${locale}`] = { pathname, locale, asset,
        searchPublished: publishedRouteLocales.has(`${pathname}|${locale}`),
        ...(initialArticles?.length ? { newsFeedFingerprint } : {}),
        ...(heroVariants ? { heroVariants } : {}),
      };
    }
  }
  const manifest = { version: "nexualpha-prerender-v1", generatedAt: new Date().toISOString(), routes };
  writeFileSync(path.join(clientDir, "prerender-manifest.json"), `${JSON.stringify(manifest)}\n`);
  writeFileSync(path.join(clientDir, "route-inventory.json"), `${JSON.stringify({ locales: PRERENDER_LOCALES, indexableLocales: INDEXABLE_LOCALES, routes: inventory }, null, 2)}\n`);
  const publicationReport = JSON.stringify({
    generatedAt: new Date().toISOString(),
    ...buildSearchPublicationReport(publication),
  }, null, 2);
  const splitSitemaps = buildSplitSitemaps(inventory, newsArticles);
  const newsSitemap = buildNewsSitemap(newsArticles, { generatedAt: rawFeed.generatedAt });
  writeFileSync(path.join(projectRoot, "public", "sitemap.xml"), splitSitemaps.index);
  for (const [file, { xml }] of splitSitemaps.files) writeFileSync(path.join(projectRoot, "public", file), xml);
  writeFileSync(path.join(projectRoot, "public", "sitemap-academy.xml"), splitSitemaps.academy.xml);
  writeFileSync(path.join(projectRoot, "public", "sitemap-beginner.xml"), splitSitemaps.beginner.xml);
  writeFileSync(path.join(projectRoot, "public", "sitemap-licenses.xml"), splitSitemaps.licenses.xml);
  writeFileSync(path.join(projectRoot, "public", "sitemap-deposit.xml"), splitSitemaps.deposit.xml);
  writeFileSync(path.join(projectRoot, "public", "sitemap-coins.xml"), splitSitemaps.coins.xml);
  writeFileSync(path.join(projectRoot, "public", "sitemap-data.xml"), splitSitemaps.dataTools.xml);
  writeFileSync(path.join(projectRoot, "public", "sitemap-convert.xml"), splitSitemaps.convert.xml);
  writeFileSync(path.join(projectRoot, "public", "sitemap-glossary.xml"), splitSitemaps.glossary.xml);
  writeFileSync(path.join(projectRoot, "public", "sitemap-apps.xml"), splitSitemaps.apps.xml);
  writeFileSync(path.join(projectRoot, "public", "sitemap-campaigns.xml"), splitSitemaps.campaigns.xml);
  writeFileSync(path.join(projectRoot, "public", "sitemap-tokenized-stocks.xml"), splitSitemaps.tokenizedStocks.xml);
  // Partner feed for the Telegram Mini App (one source of truth for shares, codes, links and checked fees).
  const partnersFeed = `${JSON.stringify(buildPartnersFeed())}\n`;
  const botPromosFeed = `${JSON.stringify(buildBotPromosFeed())}\n`;
  for (const dir of [path.join(projectRoot, "public", "intel"), path.join(clientDir, "intel")]) { mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, "partners.json"), partnersFeed); writeFileSync(path.join(dir, "bot-promos.json"), botPromosFeed); writeFileSync(path.join(dir, "partner-geo-restrictions.json"), `${JSON.stringify(buildPartnerGeoRestrictionsFeed(), null, 2)}\n`); }
  writeFileSync(path.join(projectRoot, "public", "news-sitemap.xml"), newsSitemap);
  writeFileSync(path.join(projectRoot, "public", "content", "search-publication-report.json"), `${publicationReport}\n`);
  const clientContentDir = path.join(clientDir, "content");
  mkdirSync(clientContentDir, { recursive: true });
  writeFileSync(path.join(clientDir, "sitemap.xml"), splitSitemaps.index);
  for (const [file, { xml }] of splitSitemaps.files) writeFileSync(path.join(clientDir, file), xml);
  writeFileSync(path.join(clientDir, "sitemap-academy.xml"), splitSitemaps.academy.xml);
  writeFileSync(path.join(clientDir, "sitemap-beginner.xml"), splitSitemaps.beginner.xml);
  writeFileSync(path.join(clientDir, "sitemap-licenses.xml"), splitSitemaps.licenses.xml);
  writeFileSync(path.join(clientDir, "sitemap-deposit.xml"), splitSitemaps.deposit.xml);
  writeFileSync(path.join(clientDir, "sitemap-coins.xml"), splitSitemaps.coins.xml);
  writeFileSync(path.join(clientDir, "sitemap-data.xml"), splitSitemaps.dataTools.xml);
  writeFileSync(path.join(clientDir, "sitemap-convert.xml"), splitSitemaps.convert.xml);
  writeFileSync(path.join(clientDir, "sitemap-glossary.xml"), splitSitemaps.glossary.xml);
  writeFileSync(path.join(clientDir, "sitemap-apps.xml"), splitSitemaps.apps.xml);
  writeFileSync(path.join(clientDir, "sitemap-campaigns.xml"), splitSitemaps.campaigns.xml);
  writeFileSync(path.join(clientDir, "sitemap-tokenized-stocks.xml"), splitSitemaps.tokenizedStocks.xml);
  writeFileSync(path.join(clientDir, "news-sitemap.xml"), newsSitemap);
  writeFileSync(path.join(clientContentDir, "search-publication-report.json"), `${publicationReport}\n`);
  console.log(`Prepared prerender manifest: ${Object.keys(routes).length} routes, HTML split into route assets`);
  return manifest;
}

// The CLI imports the SSR runtime, which can retain native compiler resources.
// Reusable imports stay side-effect free; the one-shot command exits after all writes.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generatePrerenderManifest();
  process.exit(0);
}
