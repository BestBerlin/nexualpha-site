#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { selectReviewedNewsSearchSlugs } from "../src/data/reviewed-news-publication.js";
import { neutralVenueCatalog } from "../src/data/market-command.js";
import { venueDatabase } from "../src/data/venue-database.js";
import { priorityVenueAnswerFor } from "../src/data/priority-venue-answers.js";
import { TOPIC_GUIDES } from "../src/data/topic-guides-data.js";
import { TOKENIZED_ASSET_CLUSTER_REVIEW_DATE, TOKENIZED_ASSET_PAGES, TOKENIZED_ASSET_LOCALES } from "../src/data/tokenized-assets-cluster.js";
import { toolArticleLinks, toolKeyForPath } from "../src/data/topic-clusters.js";
import { NEWS_DISPLAY_LOCALES, newsListingPublishedLocales, newsSitemapLanguage, normalizeNewsFeed, normalizeNewsFeedSummaries, newsArticleAvailableLocales, projectNewsFeedForRoute } from "../src/data/news-feed-client.js";
import { BRAZIL_PAGES, BRAZIL_SOURCES } from "../src/data/brazil-market.js";
import { getBrazilSeo } from "../src/data/brazil-seo.js";
import { AUDIT_DATE as FACTBOOK_SOURCE_REVIEW_DATE } from "../src/data/factbook-registry.js";
import { factbookDates } from "../src/data/factbook-dates.js";
import { COUNTRY_ROUTE_PREFIXES, localizedPath, parsePublicRoute } from "../src/data/locale-routing.js";
import { buildSearchPublicationReport, selectSitemapPublicationEntries, sitemapLocalesForRoute } from "./sitemap-publication-policy.mjs";
import { buildPartnersFeed } from "../src/data/partners-feed.js";
export { sitemapLocalesForRoute };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NEWS_PUBLICATION_NAME = "NexuAlpha";
const NEWS_SITEMAP_LIMIT = 1000;
export const INDEXABLE_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
// Every indexable language gets an SSR document. Client-only shells are not
// sufficient for international search discovery or social previews.
export const PRERENDER_LOCALES = INDEXABLE_LOCALES;
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
  if (["/mx", "/tw", "/id", "/vn", "/hk", "/eu", "/uk", "/us", "/jp", "/kr", "/sg", "/int", "/markets/turkiye"].includes(pathname)) return "regionalPreview";
  if (["/mx/comparar", "/mx/costos", "/mx/conta", "/tw/comparar", "/tw/costos", "/tw/conta", "/hk/comparar", "/hk/costos", "/hk/conta"].includes(pathname)) return pathname.endsWith("/comparar") ? "comparison" : pathname.endsWith("/costos") ? "rateTerminal" : "exchangeDirectory";
  const staticTemplates = {
    "/": "home", "/exchanges": "exchangeDirectory", "/activities": "activityCenter",
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
  const staticPaths = ["/", "/exchanges", "/activities", "/rates", "/onchain", "/news", "/methodology", "/embed/calculator", "/partners", "/telegram"];
  const venueProfileSlugs = neutralVenueCatalog
    .map(({ slug }) => slug)
    .filter((slug) => !FACTBOOK_ONLY_LEGACY_SLUGS.has(slug));
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
    ...Object.keys(venueDatabase).map((slug) => `/factbook/${slug}`),
    ...Object.keys(TOPIC_GUIDES).map((slug) => `/topics/${slug}`),
    ...Object.values(TOKENIZED_ASSET_PAGES).map((page) => page.path),
    ...CURATED_COMPARISONS.map((pair) => `/compare/${pair}`),
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
  ];
  return [...new Set([...indexable, ...nonindexed])].map((pathname) => ({
    pathname, level: pathname === "/" ? 1 : pathname.split("/").filter(Boolean).length + 1,
    template: routeTemplate(pathname),
    index: indexable.includes(pathname),
    ...(pathname === "/" ? { locales: INDEXABLE_LOCALES } : {}),
    // Display locales may show a safe client-side summary, but only reviewed
    // locales are indexable. Keep the inventory honest so SEO verification,
    // canonical tags, robots and sitemap publication share one boundary.
    // Localized news lane (2026-10-10): the listing is published in the core editions (en, zh-Hans) plus every
    // locale that has at least one search-published article written natively in it.
    ...(pathname === "/news" ? { locales: newsListingPublishedLocales(newsArticles) } : {}),
    ...(["/topics", "/factbook"].includes(pathname) ? { locales: ["en"] } : {}),
    ...(pathname.startsWith("/news/") ? { locales: newsArticleAvailableLocales(newsArticles.find((article) => pathname === `/news/${article.slug}`)) } : {}),
    ...(COUNTRY_OWNER_LOCALES[pathname] ? { locales: COUNTRY_OWNER_LOCALES[pathname] } : {}),
    // Native English display documents are not additional search owners.
    ...(["/mx", "/mx/comparar", "/mx/costos", "/mx/conta"].includes(pathname) ? { prerenderLocales: ["es", "en"] } : {}),
    // /markets/turkiye without a locale prefix is the noindex English display of the Turkish owner
    // (/tr/markets/turkiye). Prerender it too so crawlers and no-JS readers do not get an empty #root.
    ...(pathname === "/markets/turkiye" ? { prerenderLocales: ["tr", "en"] } : {}),
    ...(Object.values(TOKENIZED_ASSET_PAGES).some((page) => page.path === pathname) ? { locales: TOKENIZED_ASSET_LOCALES } : {}),
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
  const publishedLocalesByPathname = new Map();
  for (const { route, locale } of publication.urls) {
    const locales = publishedLocalesByPathname.get(route.pathname) || [];
    if (!locales.includes(locale)) locales.push(locale);
    publishedLocalesByPathname.set(route.pathname, locales);
  }
  // Keep each indexable language address unique in sitemap/hreflang. The page
  // canonical may still collapse the default locale, but pt-BR needs its own
  // discoverable URL so it cannot duplicate the English <loc> entry.
  const href = (pathname, locale) => COUNTRY_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    ? `https://nexualpha.com${pathname}`
    : `https://nexualpha.com${localizedPath(pathname, locale)}`;
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
  for (const { route, loc, locale } of publication.urls) {
    const article = newsArticles.find((article) => route.pathname === `/news/${article.slug}`);
    const date = routeLastmod(route, article, locale);
    // Alternates must describe the URLs that passed the publication gate.
    // Route capability alone is insufficient: a locale can exist and render
    // while remaining deliberately excluded from search publication.
    const locales = publishedLocalesByPathname.get(route.pathname) || [locale];
    const defaultLocale = locales.includes("en") ? "en" : locales[0];
    lines.push("  <url>", `    <loc>${escape(loc)}</loc>`);
    for (const alternate of [...locales, "x-default"]) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="${alternate}" href="${escape(href(route.pathname, alternate === "x-default" ? defaultLocale : alternate))}" />`);
    }
    // A rebuild is not a content update; use route-level reviewed dates.
    if (date && Number.isFinite(Date.parse(date))) lines.push(`    <lastmod>${new Date(date).toISOString().slice(0, 10)}</lastmod>`);
    lines.push("  </url>");
  }
  return [...lines, "</urlset>", ""].join("\n");
}

function latestDate(values, fallback = SITE_CONTENT_REVIEW_DATE) {
  const dates = values
    .map((value) => Date.parse(value))
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
  return dates.length ? new Date(dates[0]).toISOString() : fallback;
}

function routeLastmod(route, article, locale = "en") {
  if (article) return article.updatedAt || article.publishedAt;
  if (route.pathname.startsWith("/br")) return latestDate(BRAZIL_SOURCES.map((source) => source.checkedAt));
  if (route.template === "topic") {
    const slug = pathSlug(route.pathname, "/topics/");
    return TOPIC_GUIDES[slug]?.lastUpdated || TOKENIZED_ASSET_PAGES[slug]?.updatedAt || TOKENIZED_ASSET_CLUSTER_REVIEW_DATE;
  }
  if (route.template === "venue") return priorityVenueAnswerFor(pathSlug(route.pathname, "/exchanges/"), locale)?.reviewedAt || "2026-09-15";
  // Latest real review of the data on the page (fees checked / benefit terms / dossier), same as the Dataset schema.
  if (route.template === "factbook") return factbookDates(pathSlug(route.pathname, "/factbook/")).latestReviewOn || FACTBOOK_SOURCE_REVIEW_DATE;
  // Shared comparison presentation changed on this date, not on every build.
  if (route.template === "comparison") return "2026-09-22";
  if (route.template === "regionalPreview") return "2026-09-15";
  return SITE_CONTENT_REVIEW_DATE;
}

export function buildNewsSitemap(newsArticles, { generatedAt = new Date().toISOString() } = {}) {
  const origin = "https://nexualpha.com";
  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  const href = (pathname, locale) => `${origin}${localizedPath(pathname, locale)}`;
  const reference = Date.parse(generatedAt);
  const cutoff = reference - (2 * 24 * 60 * 60 * 1000);
  const publishedSlugs = selectReviewedNewsSearchSlugs(newsArticles);
  const recentArticles = newsArticles.filter((article) => {
    const publishedAt = Date.parse(article.publishedAt);
    return publishedSlugs.has(article.slug)
      && article.seo?.noindex === false
      && Number.isFinite(reference)
      && Number.isFinite(publishedAt)
      && publishedAt >= cutoff
      && publishedAt <= reference;
  });
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
  let urlCount = 0;
  for (const article of recentArticles) {
    const locales = newsArticleAvailableLocales(article);
    for (const locale of locales) {
      if (urlCount >= NEWS_SITEMAP_LIMIT) break;
      const pathname = `/news/${article.slug}`;
      const title = article.title?.[locale] || article.title?.en || article.slug;
      lines.push("  <url>", `    <loc>${escape(href(pathname, locale))}</loc>`);
      for (const alternate of [...locales, "x-default"]) {
        const alternateLocale = alternate === "x-default" ? locales[0] : alternate;
        lines.push(`    <xhtml:link rel="alternate" hreflang="${alternate}" href="${escape(href(pathname, alternateLocale))}" />`);
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

export async function generatePrerenderManifest({ projectRoot = root, render } = {}) {
  const clientDir = path.join(projectRoot, "dist", "client");
  const ssrEntry = path.join(projectRoot, "dist", "ssr", "entry-server.js");
  if (!existsSync(clientDir)) throw new Error(`Missing client build directory: ${clientDir}`);
  if (!render) {
    if (!existsSync(ssrEntry)) throw new Error(`Missing SSR entry build: ${ssrEntry}`);
    ({ render } = await import(pathToFileURL(ssrEntry).href));
  }
  const feedText = readFileSync(path.join(projectRoot, "public", "content", "news-feed.json"), "utf8");
  const rawFeed = JSON.parse(feedText);
  const newsArticles = normalizeNewsFeed(rawFeed);
  const newsArticleSummaries = normalizeNewsFeedSummaries(rawFeed);
  const newsFeedFingerprint = createHash("sha256").update(feedText).digest("hex");
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
      const isNews = pathname === "/news" || pathname.startsWith("/news/");
      const initialArticles = isNews ? (pathname === "/news" ? newsArticleSummaries : newsArticles.filter((article) => pathname === `/news/${article.slug}`)) : undefined;
      // Tool pages (/rates, curated compare pairs, /activities without a live feed) list their related articles from the
      // build feed; the Worker renders the request-time tool routes from the live feed (links-l10n lane, scorecard D4).
      const toolKey = toolKeyForPath(pathname);
      const toolArticles = toolKey ? toolArticleLinks(toolKey, newsArticles, locale) || undefined : undefined;
      const html = stripReactResourceHints(await render(url, { newsArticles: initialArticles, toolArticles }));
      if (!/<h1\b/i.test(html)) throw new Error(`Missing prerender H1: ${url}`);
      const asset = `/prerender/${locale}/${pathname === "/" ? "home" : pathname.slice(1)}.json`;
      const assetPath = path.join(clientDir, asset);
      mkdirSync(path.dirname(assetPath), { recursive: true });
      const assetPayload = { html,
        ...(isNews ? { newsArticles: projectNewsFeedForRoute(pathname, initialArticles, locale), newsFeedFingerprint } : {}),
        ...(toolArticles ? { toolArticles } : {}),
      };
      writeFileSync(assetPath, `${JSON.stringify(assetPayload)}\n`);
      routes[`${pathname}|${locale}`] = { pathname, locale, asset,
        searchPublished: publishedRouteLocales.has(`${pathname}|${locale}`),
        ...(isNews ? { newsFeedFingerprint } : {}),
      };
    }
  }
  const manifest = { version: "nexualpha-prerender-v1", generatedAt: new Date().toISOString(), routes };
  writeFileSync(path.join(clientDir, "prerender-manifest.json"), `${JSON.stringify(manifest)}\n`);
  writeFileSync(path.join(clientDir, "route-inventory.json"), `${JSON.stringify({ locales: PRERENDER_LOCALES, routes: inventory }, null, 2)}\n`);
  const publicationReport = JSON.stringify({
    generatedAt: new Date().toISOString(),
    ...buildSearchPublicationReport(publication),
  }, null, 2);
  const sitemap = buildSitemap(inventory, newsArticles);
  const newsSitemap = buildNewsSitemap(newsArticles, { generatedAt: rawFeed.generatedAt });
  writeFileSync(path.join(projectRoot, "public", "sitemap.xml"), sitemap);
  // Partner feed for the Telegram Mini App (one source of truth for shares, codes, links and checked fees).
  const partnersFeed = `${JSON.stringify(buildPartnersFeed())}\n`;
  for (const dir of [path.join(projectRoot, "public", "intel"), path.join(clientDir, "intel")]) { mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, "partners.json"), partnersFeed); }
  writeFileSync(path.join(projectRoot, "public", "news-sitemap.xml"), newsSitemap);
  writeFileSync(path.join(projectRoot, "public", "content", "search-publication-report.json"), `${publicationReport}\n`);
  const clientContentDir = path.join(clientDir, "content");
  mkdirSync(clientContentDir, { recursive: true });
  writeFileSync(path.join(clientDir, "sitemap.xml"), sitemap);
  writeFileSync(path.join(clientDir, "news-sitemap.xml"), newsSitemap);
  writeFileSync(path.join(clientContentDir, "search-publication-report.json"), `${publicationReport}\n`);
  console.log(`Prepared prerender manifest: ${Object.keys(routes).length} routes, HTML split into route assets`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await generatePrerenderManifest();
