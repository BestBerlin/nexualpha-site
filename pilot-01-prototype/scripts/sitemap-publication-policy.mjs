import { selectReviewedNewsSearchSlugs } from "../src/data/reviewed-news-publication.js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COUNTRY_ROUTE_PREFIXES, isLocalePathEligible, localizedPath, parsePublicRoute } from "../src/data/locale-routing.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://nexualpha.com";
const defaultBaselinePath = path.join(root, "config", "search-publication-baseline.json");
export const SEARCH_PUBLICATION_VERSION = "nexualpha-search-publication-v1";
const SITEMAP_CORE_STATIC_PATHS = new Set(["/", "/exchanges", "/activities", "/rates", "/onchain", "/methodology", "/telegram"]);
const SITEMAP_SECONDARY_STATIC_PATHS = new Set(["/embed/calculator", "/partners"]);
const SITEMAP_PRIORITY_VENUES = new Set(["binance", "okx", "bybit", "bitget", "backpack", "coinbase", "kraken", "hyperliquid", "uniswap"]);
const SITEMAP_REVIEWED_TRILINGUAL_VENUES = new Set(["drift", "deribit"]);
const SITEMAP_PRIORITY_FACTBOOK = new Set(["binance", "okx", "bybit", "bitget", "coinbase", "kraken", "hyperliquid", "uniswap"]);
const SITEMAP_LOCALE_EXCLUDED_VENUES = new Set(["hyperliquid", "htx", "hashkey", "uniswap", "aevo", "jupiter"]);
const SITEMAP_PRIORITY_COMPARISONS = new Set(["binance-vs-okx", "binance-vs-bybit", "okx-vs-bybit", "bybit-vs-bitget", "hyperliquid-vs-dydx", "uniswap-vs-jupiter", "coinbase-vs-kraken", "binance-vs-bitget", "bitget-vs-okx", "bybit-vs-mexc", "bitget-vs-mexc"]);
const SITEMAP_PRIORITY_TOPICS = new Set(["meme-coins", "derivatives", "compliant-exchanges", "no-kyc", "tokenized-assets"]);
// Owner exchange keyword plan 2026-10-11: localized profiles that now carry the localized referral FAQ (and backpack's
// French "avis" answers) are listed in the sitemap in those locales too. They were already index,follow.
const SITEMAP_KEYWORD_VENUE_LOCALES = Object.freeze({
  okx: ["tr", "vi", "id", "pt-BR"],
  binance: ["tr", "vi", "pt-BR"],
  bybit: ["tr", "vi", "id"],
  bitget: ["vi", "id"],
  backpack: ["fr"],
});

const DEFAULT_POLICY = Object.freeze({
  minSitemapUrls: 802,
  maxSitemapUrls: 902,
  maxQueryLocaleUrls: 0,
  publicationMode: "full-reviewed-indexable",
  priorityLocales: ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"],
  selectedInternationalPaths: [],
  zhHansArticleLimit: 30,
  maxReviewedNewsArticleRoutes: 307,
  maxLowDifferentiationUrls: 700,
  maxUrlsByTemplate: {
    article: 624,
    factbook: 64,
  },
  protectedIndexedUrls: [],
  historicalIndexedUrlDispositions: [],
});

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeUrl(value) {
  const url = new URL(String(value || "/"), origin);
  url.hash = "";
  if (url.origin !== origin) return null;
  return url.href;
}

function normalizeHistoricalIndexedUrlDispositions(items = []) {
  const dispositions = [];
  const seen = new Set();
  for (const item of Array.isArray(items) ? items : []) {
    const url = normalizeUrl(item?.url);
    if (!url || seen.has(url)) continue;
    const disposition = String(item?.disposition || "").trim();
    if (!["redirected_legacy", "accessible_noindex", "truly_missing"].includes(disposition)) continue;
    const target = item?.target ? normalizeUrl(item.target) : null;
    dispositions.push({
      url,
      disposition,
      ...(target ? { target } : {}),
      ...(typeof item?.reason === "string" && item.reason.trim() ? { reason: item.reason.trim() } : {}),
    });
    seen.add(url);
  }
  return dispositions;
}

function pathSlug(pathname, prefix) {
  return String(pathname || "").startsWith(prefix) ? String(pathname).slice(prefix.length) : "";
}

function supportedRouteLocales(route, allLocales) {
  return route.locales || (route.pathname.startsWith("/br") ? ["pt-BR"] : allLocales);
}

function pickSupportedLocales(route, candidates, allLocales) {
  const supported = new Set(supportedRouteLocales(route, allLocales));
  return unique(candidates).filter((locale) => supported.has(locale));
}

export function sitemapLocalesForRoute(route, allLocales = DEFAULT_POLICY.priorityLocales) {
  const { pathname, template } = route;
  if (!route.index || route.alias || (route.expectedStatus ?? 200) !== 200) return [];
  if (pathname.startsWith("/br")) return ["pt-BR"];
  if (COUNTRY_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return supportedRouteLocales(route, allLocales);
  if (["topicCollection", "factbookCollection"].includes(template)) return pickSupportedLocales(route, ["en"], allLocales);
  // Localized news lane (2026-10-10): an article or listing route carries its published editions in route.locales
  // (English and Simplified Chinese plus every locale with a native body); without them the two core editions apply.
  if (template === "article") return pickSupportedLocales(route, route.locales || ["en", "zh-Hans"], allLocales);
  if (template === "newsList") return pickSupportedLocales(route, route.locales || ["en", "zh-Hans"], allLocales);
  if (template === "regionalPreview") return supportedRouteLocales(route, allLocales);
  if (!isLocalePathEligible(pathname)) return pickSupportedLocales(route, ["en"], allLocales);
  if (SITEMAP_CORE_STATIC_PATHS.has(pathname)) {
    return pathname === "/"
      ? supportedRouteLocales(route, allLocales)
      : pickSupportedLocales(route, ["en", "zh-Hans", "ja", "ko", "tr"], allLocales);
  }
  if (SITEMAP_SECONDARY_STATIC_PATHS.has(pathname)) return pickSupportedLocales(route, ["en", "zh-Hans"], allLocales);
  if (template === "venue") {
    const slug = pathSlug(pathname, "/exchanges/");
    if (SITEMAP_REVIEWED_TRILINGUAL_VENUES.has(slug)) return pickSupportedLocales(route, ["en", "zh-Hans", "zh-Hant"], allLocales);
    const base = SITEMAP_PRIORITY_VENUES.has(slug) ? ["en", "zh-Hans", "ja", "ko", "tr"] : ["en", "zh-Hans"];
    return pickSupportedLocales(route, [...base, ...(SITEMAP_KEYWORD_VENUE_LOCALES[slug] || [])], allLocales);
  }
  if (template === "factbook") {
    const slug = pathSlug(pathname, "/factbook/");
    return pickSupportedLocales(route, SITEMAP_PRIORITY_FACTBOOK.has(slug) ? ["en", "zh-Hans"] : ["en"], allLocales);
  }
  if (template === "comparison") {
    const slug = pathSlug(pathname, "/compare/");
    // Mirrors the Worker: pairs with a venue in SEARCH_ALL_LOCALE_VENUE_EXCLUSIONS are noindex outside en/zh-Hans, so the
    // sitemap must not list their ja/ko/tr URLs (QA 2026-10-11 found 6 sitemap URLs served as noindex).
    const wide = SITEMAP_PRIORITY_COMPARISONS.has(slug) && !slug.split("-vs-").some((v) => SITEMAP_LOCALE_EXCLUDED_VENUES.has(v));
    return pickSupportedLocales(route, wide ? ["en", "zh-Hans", "ja", "ko", "tr"] : ["en", "zh-Hans"], allLocales);
  }
  if (template === "topic") {
    const slug = pathSlug(pathname, "/topics/");
    return pickSupportedLocales(route, SITEMAP_PRIORITY_TOPICS.has(slug) ? ["en", "zh-Hans", "ja", "ko", "tr"] : ["en", "zh-Hans"], allLocales);
  }
  return pickSupportedLocales(route, ["en", "zh-Hans"], allLocales);
}

export function loadSearchPublicationBaseline({ projectRoot = root } = {}) {
  const baselinePath = path.join(projectRoot, "config", "search-publication-baseline.json");
  const filePath = existsSync(baselinePath) ? baselinePath : defaultBaselinePath;
  if (!existsSync(filePath)) return { ...DEFAULT_POLICY };
  const parsed = JSON.parse(readFileSync(filePath, "utf8"));
  return {
    ...DEFAULT_POLICY,
    ...parsed,
    publicationMode: parsed.publicationMode || DEFAULT_POLICY.publicationMode,
    priorityLocales: unique(parsed.priorityLocales || DEFAULT_POLICY.priorityLocales),
    selectedInternationalPaths: unique(parsed.selectedInternationalPaths || []),
    maxUrlsByTemplate: {
      ...DEFAULT_POLICY.maxUrlsByTemplate,
      ...(parsed.maxUrlsByTemplate || {}),
    },
    protectedIndexedUrls: unique((parsed.protectedIndexedUrls || []).map(normalizeUrl)),
    historicalIndexedUrlDispositions: normalizeHistoricalIndexedUrlDispositions(parsed.historicalIndexedUrlDispositions),
  };
}

export function sitemapUrl(pathname, locale) {
  if (COUNTRY_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return `${origin}${pathname}`;
  return `${origin}${localizedPath(pathname, locale)}`;
}

function routeLocales(route, allLocales) {
  if (route.locales) return route.locales;
  if (COUNTRY_ROUTE_PREFIXES.some((prefix) => route.pathname === prefix || route.pathname.startsWith(`${prefix}/`))) return ["en"];
  if (!isLocalePathEligible(route.pathname)) return ["en"];
  return allLocales;
}

function routeKey(pathname, locale) {
  return `${pathname}|${locale}`;
}

export function searchPublicationRouteKey(pathname, locale) {
  return routeKey(pathname, locale);
}

function shouldPublishRoute(pathname) {
  return !/^\/exchanges\/(?:htx|hashkey|aevo)$/.test(pathname)
    && !/^\/activities\/research\/(?:htx|hashkey|aevo)$/.test(pathname);
}

function publicRouteKeyFromUrl(value) {
  const url = new URL(value, origin);
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  return routeKey(publicRoute.contentPathname, publicRoute.locale);
}

function addEntry(entries, route, locale, loc, source) {
  if (!route.index) return false;
  const url = normalizeUrl(loc || sitemapUrl(route.pathname, locale));
  if (!url) return false;
  if (!entries.has(url)) entries.set(url, { route, locale, loc: url, sources: new Set() });
  entries.get(url).sources.add(source);
  return true;
}

function entryCountByTemplate(entries, template) {
  let count = 0;
  for (const entry of entries.values()) {
    if ((entry.route?.template || "unknown") === template) count += 1;
  }
  return count;
}

export function selectSitemapPublicationEntries(inventory, newsArticles = [], {
  policy = loadSearchPublicationBaseline(),
  allLocales,
} = {}) {
  const locales = allLocales || policy.priorityLocales || DEFAULT_POLICY.priorityLocales;
  const routeByKey = new Map();
  for (const route of inventory) {
    if (!shouldPublishRoute(route.pathname)) continue;
    for (const locale of sitemapLocalesForRoute(route, locales)) routeByKey.set(routeKey(route.pathname, locale), route);
  }

  const entries = new Map();
  const reviewedArticleSlugs = selectReviewedNewsSearchSlugs(newsArticles, Number(policy.maxReviewedNewsArticleRoutes ?? DEFAULT_POLICY.maxReviewedNewsArticleRoutes));
  if (policy.publicationMode === "full-reviewed-indexable") {
    for (const route of inventory) {
      if (!route.index || !shouldPublishRoute(route.pathname)) continue;
      if (route.template === "article" && !reviewedArticleSlugs.has(pathSlug(route.pathname, "/news/"))) continue;
      for (const locale of sitemapLocalesForRoute(route, locales)) {
        addEntry(entries, route, locale, sitemapUrl(route.pathname, locale), "full-reviewed-indexable");
      }
    }
  }
  const selectedInternational = new Set(policy.selectedInternationalPaths || []);
  const zhHansArticleLimit = Number(policy.zhHansArticleLimit ?? 30);
  let zhHansArticleCount = 0;

  if (policy.publicationMode !== "full-reviewed-indexable") {
    for (const route of inventory) {
      if (!route.index || !shouldPublishRoute(route.pathname)) continue;
      const availableLocales = routeLocales(route, locales);
      if (route.pathname.startsWith("/br")) {
        addEntry(entries, route, "pt-BR", sitemapUrl(route.pathname, "pt-BR"), "brazil-original");
        continue;
      }
      if (availableLocales.includes("en")) addEntry(entries, route, "en", sitemapUrl(route.pathname, "en"), "english-canonical");
      if (availableLocales.includes("zh-Hans")) {
        const templateSelected = ["home", "exchangeDirectory", "activityCenter", "newsList", "methodology", "partnerEmbedGuide", "telegram", "venue", "topic", "comparison"].includes(route.template);
        const selectedArticle = route.template === "article" && zhHansArticleCount < zhHansArticleLimit;
        if (templateSelected || selectedInternational.has(route.pathname) || selectedArticle) {
          if (route.template === "article") zhHansArticleCount += 1;
          addEntry(entries, route, "zh-Hans", sitemapUrl(route.pathname, "zh-Hans"), "zh-hans-core");
        }
      }
      if (selectedInternational.has(route.pathname)) {
        for (const locale of ["es", "pt-BR", "ja", "ko", "tr"]) {
          if (availableLocales.includes(locale)) addEntry(entries, route, locale, sitemapUrl(route.pathname, locale), "selected-international");
        }
      }
    }
  }

  const protectedPublished = [];
  const excludedIndexedNoindex = [];
  const excludedIndexedMissing = [];
  const excludedIndexedBudget = [];
  for (const protectedUrl of policy.protectedIndexedUrls || []) {
    const key = publicRouteKeyFromUrl(protectedUrl);
    const route = routeByKey.get(key);
    if (!route) {
      excludedIndexedMissing.push({ url: protectedUrl, disposition: "not in current route inventory" });
      continue;
    }
    if (!route.index) {
      excludedIndexedNoindex.push({ url: protectedUrl, disposition: "current route robots policy is noindex" });
      continue;
    }
    const [, locale] = key.split("|");
    // GSC may retain an older query-locale URL after routing rules move the
    // page to its canonical clean/path URL. Keep the page protected without
    // publishing a redirecting URL in the sitemap.
    if (route.template === "article" && !reviewedArticleSlugs.has(pathSlug(route.pathname, "/news/"))) {
      excludedIndexedBudget.push({ url: protectedUrl, disposition: "article is outside the reviewed publication roster" });
      continue;
    }
    const canonicalUrl = sitemapUrl(route.pathname, locale);
    const template = route.template || "unknown";
    const maxTemplateUrls = Number(policy.maxUrlsByTemplate?.[template] ?? Infinity);
    if (Number.isFinite(maxTemplateUrls) && entryCountByTemplate(entries, template) >= maxTemplateUrls && !entries.has(canonicalUrl)) {
      excludedIndexedBudget.push({ url: protectedUrl, disposition: `${template} sitemap budget already reached` });
      continue;
    }
    if (addEntry(entries, route, locale, canonicalUrl, "protected-indexed-url")) protectedPublished.push(canonicalUrl);
  }

  const urls = [...entries.values()].sort((a, b) => a.loc.localeCompare(b.loc));
  const queryLocaleUrls = urls.filter((entry) => new URL(entry.loc).searchParams.has("locale")).length;
  const urlsByTemplate = {};
  const urlsByLocale = {};
  const routeKeysByTemplate = {};
  for (const entry of urls) {
    const template = entry.route?.template || "unknown";
    urlsByTemplate[template] = (urlsByTemplate[template] || 0) + 1;
    urlsByLocale[entry.locale] = (urlsByLocale[entry.locale] || 0) + 1;
    if (!routeKeysByTemplate[template]) routeKeysByTemplate[template] = new Set();
    routeKeysByTemplate[template].add(entry.route?.pathname || new URL(entry.loc).pathname);
  }
  const routesByTemplate = Object.fromEntries(
    Object.entries(routeKeysByTemplate).map(([template, values]) => [template, values.size]),
  );
  const lowDifferentiationUrlCount = Number(urlsByTemplate.article || 0) + Number(urlsByTemplate.factbook || 0);
  return {
    urls,
    stats: {
      totalUrls: urls.length,
      queryLocaleUrls,
      cleanOrPathUrls: urls.length - queryLocaleUrls,
      urlsByTemplate,
      urlsByLocale,
      routesByTemplate,
      lowDifferentiationUrlCount,
      protectedPublishedCount: protectedPublished.length,
      excludedIndexedNoindex,
      excludedIndexedMissing,
      excludedIndexedBudget,
      minSitemapUrls: policy.minSitemapUrls,
      maxSitemapUrls: policy.maxSitemapUrls,
      maxQueryLocaleUrls: policy.maxQueryLocaleUrls,
      maxReviewedNewsArticleRoutes: policy.maxReviewedNewsArticleRoutes,
      maxLowDifferentiationUrls: policy.maxLowDifferentiationUrls,
      maxUrlsByTemplate: policy.maxUrlsByTemplate || DEFAULT_POLICY.maxUrlsByTemplate,
      publicationMode: policy.publicationMode || DEFAULT_POLICY.publicationMode,
      historicalIndexedUrlDispositions: policy.historicalIndexedUrlDispositions || DEFAULT_POLICY.historicalIndexedUrlDispositions,
    },
    protectedPublished,
    excludedIndexedNoindex,
    excludedIndexedMissing,
    excludedIndexedBudget,
    newsArticles,
  };
}

export function buildSearchPublicationEligibility(publication) {
  const byRouteLocale = new Map();
  const byUrl = new Map();
  for (const entry of publication?.urls || []) {
    const pathname = entry.route?.pathname || entry.route?.path || new URL(entry.loc, origin).pathname;
    const locale = entry.locale || publicRouteKeyFromUrl(entry.loc).split("|").at(-1);
    const key = searchPublicationRouteKey(pathname, locale);
    const value = { ...entry, pathname, locale, key };
    byRouteLocale.set(key, value);
    byUrl.set(normalizeUrl(entry.loc), value);
  }
  return {
    byRouteLocale,
    byUrl,
    has(pathname, locale) {
      return byRouteLocale.has(searchPublicationRouteKey(pathname, locale));
    },
    entry(pathname, locale) {
      return byRouteLocale.get(searchPublicationRouteKey(pathname, locale)) || null;
    },
  };
}

export function isPublishedSearchRouteLocale(pathname, locale, publication) {
  return buildSearchPublicationEligibility(publication).has(pathname, locale);
}

export function assertSitemapPublicationBudget(publication) {
  const { stats } = publication;
  const issues = [];
  if (stats.totalUrls < stats.minSitemapUrls) issues.push(`sitemap has ${stats.totalUrls} URLs, below ${stats.minSitemapUrls}`);
  if (stats.totalUrls > stats.maxSitemapUrls) issues.push(`sitemap has ${stats.totalUrls} URLs, above ${stats.maxSitemapUrls}`);
  if (stats.queryLocaleUrls > stats.maxQueryLocaleUrls) issues.push(`sitemap has ${stats.queryLocaleUrls} query-locale URLs, above ${stats.maxQueryLocaleUrls}`);
  if (Number(stats.routesByTemplate?.article || 0) > Number(stats.maxReviewedNewsArticleRoutes || 0)) {
    issues.push(`sitemap publishes ${stats.routesByTemplate.article} reviewed news article routes, above ${stats.maxReviewedNewsArticleRoutes}`);
  }
  for (const [template, maxUrls] of Object.entries(stats.maxUrlsByTemplate || {})) {
    const count = Number(stats.urlsByTemplate?.[template] || 0);
    if (count > Number(maxUrls)) issues.push(`sitemap publishes ${count} ${template} URLs, above ${maxUrls}`);
  }
  if (Number(stats.lowDifferentiationUrlCount || 0) > Number(stats.maxLowDifferentiationUrls || 0)) {
    issues.push(`sitemap publishes ${stats.lowDifferentiationUrlCount} article/factbook URLs, above ${stats.maxLowDifferentiationUrls}`);
  }
  return issues;
}

export function articleSlugsFromPublication(publication) {
  const slugs = new Set();
  for (const entry of publication?.urls || []) {
    const pathname = entry?.route?.pathname || new URL(entry?.loc || "/", origin).pathname;
    const match = pathname.match(/^\/news\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
    if (match) slugs.add(match[1]);
  }
  return [...slugs].sort();
}

export function selectPublicationNewsArticles(newsArticles, publication) {
  const slugs = new Set(articleSlugsFromPublication(publication));
  return (Array.isArray(newsArticles) ? newsArticles : [])
    .filter((article) => slugs.has(article?.slug));
}

export function buildSearchPublicationReport(publication) {
  const historicalIndexedUrlDispositions = publication?.stats?.historicalIndexedUrlDispositions || [];
  const historicalIndexedCounts = {
    redirectedLegacy: historicalIndexedUrlDispositions.filter((item) => item.disposition === "redirected_legacy").length,
    accessibleNoindex: historicalIndexedUrlDispositions.filter((item) => item.disposition === "accessible_noindex").length,
    trulyMissing: historicalIndexedUrlDispositions.filter((item) => item.disposition === "truly_missing").length,
  };
  return {
    version: SEARCH_PUBLICATION_VERSION,
    publicationScope: "reviewed-indexable-routes-only",
    publicationScopeNote: publication?.stats?.publicationMode === "full-reviewed-indexable"
      ? "The sitemap publishes currently indexable routes only through the shared reviewed sitemap locale policy. Historical GSC URLs are separated into redirected legacy URLs, accessible noindex URLs, and truly missing URLs instead of being reintroduced as thin sitemap entries."
      : "The sitemap intentionally publishes only routes that are currently indexable and within the reviewed locale budget. Historical GSC URLs are separated into redirected legacy URLs, accessible noindex URLs, and truly missing URLs instead of being reintroduced as thin sitemap entries.",
    ...publication.stats,
    excludedCounts: {
      indexedNoindex: publication.stats.excludedIndexedNoindex.length,
      indexedMissing: publication.stats.excludedIndexedMissing.length,
      indexedBudget: publication.stats.excludedIndexedBudget.length,
      redirectedLegacy: historicalIndexedCounts.redirectedLegacy,
      accessibleNoindex: historicalIndexedCounts.accessibleNoindex,
      trulyMissing: historicalIndexedCounts.trulyMissing,
    },
    historicalIndexedCounts,
    historicalIndexedUrlDispositions,
    articleSlugs: articleSlugsFromPublication(publication),
  };
}
