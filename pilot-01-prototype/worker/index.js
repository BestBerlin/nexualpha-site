import { LEGAL_PAGE_PATHS, isLegalPagePath, legalPageSeo } from "../src/data/legal-pages.js";
import { isPartnerPromotableIn } from "../src/data/partner-geo-policy.js";
import { PARTNER_RESTRICTED_COUNTRIES, PARTNER_RESTRICTED_SCOPES } from "../src/data/partner-geo-policy.generated.js";
import { hreflangAlternates, localizedNewsTitle, localizedNewsSummary, newsArticleSeoLocales, newsHumanReview, newsListingIndexableLocales, newsListingPublishedLocales } from "../src/data/news-feed-client.js";
import { noKycMetaTitle } from "../src/data/no-kyc-meta-title.js";
import { topicFaqSchemaEntries } from "../src/data/topic-source-registry.js";
import { tokenizedAssetPage, tokenizedAssetLocalized } from "../src/data/tokenized-assets-cluster.js";
import { isReviewedNewsSearchArticle, selectReviewedNewsSearchSlugs } from "../src/data/reviewed-news-publication.js";
import { referralSeoFor, geoSafeVenueSeoOverride } from "../src/data/referral-seo.js";
import { articleMetaDescription, budgetTitle, clampMetaDescription, metaDescriptionLimit, routeMetaDescription, titleBudgetForLocale } from "../src/data/meta-description.js";
import { HOME_SEARCH_COPY } from "../src/data/home-search-copy.js";
import { inlineMarkdownHtml } from "../src/data/article-inline-markdown.js";
import { ONCHAIN_GUIDE_LOCALES, ONCHAIN_GUIDE_PATH, onchainGuideSchema, onchainGuideSeo } from "../src/data/onchain-guide.js";
import { compareSeoOverrideFromDirectAnswer } from "../src/data/compare-direct-answers.js";
import { ACTIVE_COMPARE_VENUE_SLUGS, CURATED_COMPARISON_SLUGS, canonicalComparePairSlug, compareIndexCopy, generatedCompareCopy, generatedCompareDataDate, generatedCompareLocales, generatedComparePolicy, indexableGeneratedComparePairs, parseComparePair } from "../src/data/compare-generated.js";
import { newsReadTimes } from "../src/data/news-read-time.js";
import { dropEmptyArticleHeadings } from "../src/data/article-empty-headings.js";
import { socialImageObject, socialImagePathForRoute, SOCIAL_IMAGE_WIDTH, SOCIAL_IMAGE_HEIGHT } from "../src/data/social-image.js";
import { applyPartnerVenueFaqSchema } from "../src/data/partner-venue-faq.js";
import { VENUE_ALTERNATIVES_INDEX_LOCALES, VENUE_ALTERNATIVE_PAGES, venueAlternativePage, venueAlternativesContent, venueAlternativesSchemas } from "../src/data/venue-alternatives.js";
import { brazilDeadlineAlternates, brazilDeadlineContentLocale, brazilDeadlineIndexLocales, brazilDeadlineIndexable, brazilDeadlinePathFor, isBrazilDeadlinePath } from "../src/data/brazil-vasp-deadline-slugs.js";
import { brazilDeadlineContent, brazilDeadlineSchemas } from "../src/data/brazil-vasp-deadline.js";
import { appendFragmentContextParams, FRAGMENT_CONTEXT_KEYS } from "../src/data/locale-routing.js";
import { sanitizeBrAttributionFromSearch } from "../src/data/tracking-attribution.js";
import { fundingMatrixSeo } from "../src/data/funding-matrix-seo.js";
import { DATA_PAGE_PATHS, compactMarketEvents, dataPageMeta, dataPageSchemas, isDataPagePath, readHistory } from "../src/data/market-data-pages.js";
import { BRAND_PAGE_PATHS, NEXUALPHA_PUBLISHER, RESEARCH_DESK, brandPageMeta, brandPageSchemas, isBrandPagePath, organizationSchema, websiteSchema } from "../src/data/brand-entity.js";
import { NEWS_HUB_SEO_EN, newsListHeroCopy } from "../src/data/news-list-copy.js";
import { readIntelFeed } from "../src/data/announcement-intel.js";
import { ARCHIVE_PATH, archiveItems, isArchiveIndexable } from "../src/data/announcement-archive.js";
import { isUpdateNoindex, normalizeUpdateItem, updateCategory, updateHeadline, updateItems, updatePath } from "../src/data/activity-update.js";
import { attachCampaignBriefs, CAMPAIGN_BRIEFS_URL, campaignBriefItems, localizedBriefText } from "../src/data/campaign-briefs.js";
import { visibleOfficialUpdates } from "../src/components/official-updates/official-updates-model.js";
import { factbookDates } from "../src/data/factbook-dates.js";
import { assignHomeHeroVariant, homeHeroSetCookie } from "../src/data/home-hero-experiment.js";
import { articleEmbedHtml, articleEmbedModel, isolateArticleEmbedDirectives, parseArticleEmbed, stripArticleEmbedDirectives } from "../src/data/article-embeds.js";
import { repairNewsArticle } from "../src/data/news-content-repair.js";
import { applyNewsSearchState, newsCanonicalTargetSlug, newsStrengthRank } from "../src/data/news-search-state.js";
import { NEWS_HUB_TOOL_KEY, articleClusterLineLabel, articleClusterLinks, isRelatedArticlesToolKey, toolArticleLinks, toolKeyForPath } from "../src/data/topic-clusters.js";
import { ACADEMY_INDEX_LOCALES, ACADEMY_PATH, parseAcademyPath } from "../src/data/academy.js";
import { appDownloadRouteSeo } from "../src/data/app-downloads.js";
import { parseAppDownloadPath } from "../src/data/app-download-path.js";
import { academyRouteSeo } from "../src/data/academy-seo.js";
import { parseLicensesPath } from "../src/data/licenses-routes.js";
import { licenseRouteSeo } from "../src/data/licenses-seo.js";
import { COINS_PATH, parseCoinsPath } from "../src/data/coins-routes.js";
import { coinsRouteSeo } from "../src/data/coins-seo.js";
import { CALENDAR_ICS_PATH, INTEL_TOOL_INDEX_LOCALES, INTEL_TOOL_PATHS, intelToolKey, isIntelToolLive } from "../src/data/intel-tools-routes.js";
import { intelToolRouteSeo } from "../src/data/intel-tools-seo.js";
import { calendarEventLabel } from "../src/data/intel-tools-labels.js";
import { intelToolsCopy } from "../src/data/intel-tools-copy.js";
import { compactEtfFlows, readEtfFlows } from "../src/data/etf-flows.js";
import { CALENDAR_TYPES, compactCalendar, filterEvents, readCalendar, renderIcs } from "../src/data/crypto-calendar.js";
import { GLOSSARY_PATH, parseGlossaryPath } from "../src/data/glossary-routes.js";
import { glossaryRouteSeo } from "../src/data/glossary-seo.js";
import { applyCoinOverlay, coinOverlayFromSnapshot, COINS_GENERATED_AT } from "../src/data/coins.js";
import { parseConverterPath } from "../src/data/converter-routes.js";
import { converterRouteSeo } from "../src/data/converter-seo.js";
import { RADAR_INDEX_LOCALES, RADAR_PATHS, parseRadarPath, radarRouteSeo } from "../src/data/radar-seo.js";
import { FLASH_FEED_LEGACY_URL, FLASH_FEED_URL, FLASH_PAGE_SIZE, FLASH_PATH, FLASH_SITEMAP_PATH, flashItemPath, parseFlashPath } from "../src/data/flash.js";
import { isTickerSnapshot, spliceTickerHtml, tickerFromMarketEvents } from "../src/data/ticker.js";
import { FLASH_INDEX_LOCALES, buildFlashItems, findFlashItem, flashItemIndexLocales, flashItemPayload, flashItemSeo, flashStreamPayload, flashStreamSeo, renderFlashSitemap } from "../src/data/flash-feed.js";
import { BINANCE_OCTOBER_INDEX_LOCALES, BINANCE_OCTOBER_PATH, parseBinanceOctoberPath } from "../src/data/binance-october.js";
import { binanceOctoberRouteSeo } from "../src/data/binance-october-seo.js";
import { BYBIT_STOCKS_INDEX_LOCALES, BYBIT_STOCKS_PATH, parseBybitStocksPath } from "../src/data/bybit-stocks.js";
import { bybitStocksRouteSeo } from "../src/data/bybit-stocks-seo.js";
import { BITGET_ALLIANCE_INDEX_LOCALES, BITGET_ALLIANCE_PATH, parseBitgetAlliancePath } from "../src/data/bitget-alliance.js";
import { bitgetAllianceRouteSeo } from "../src/data/bitget-alliance-seo.js";
import { KRAKEN_USDG_INDEX_LOCALES, KRAKEN_USDG_PATH, parseKrakenUsdgPath } from "../src/data/kraken-usdg.js";
import { krakenUsdgRouteSeo } from "../src/data/kraken-usdg-seo.js";
import { NEWS_CATEGORY_KEYS, NEWS_PAGE_SIZE, NEWS_SEARCH_MAX_LIMIT, isNewsCategory, newsCategoryCopy, newsCategoryCounts, newsLibraryCopy, newsListingPath, newsPaginationItems, paginateNews, parseNewsListingPath, relatedNewsArticles, searchNewsArticles, sortNewsForLocale } from "../src/data/news-library.js";
import { resolvePromotions, promotionCopy } from "../src/data/promotions.js";
const COINS_PATH_PATTERN = /(?:^|\/)coins(?:\/|$)/;
const CONVERTER_PATH_PATTERN = /(?:^|\/)convert(?:\/|$)/;
// Returns the overlay the page was rendered with (also shipped as prerender state "coins"), or null for the baked table.
async function refreshCoinOverlay(env) {
  if (typeof env?.COINS_SNAPSHOT_READ !== "function") return null;
  try {
    const overlay = coinOverlayFromSnapshot(await env.COINS_SNAPSHOT_READ());
    applyCoinOverlay(overlay);
    return overlay;
  } catch (error) {
    console.error(`[NexuAlpha] coins overlay failed: ${error?.message || error}`);
    return null;
  }
}

// Runtime snapshots of /etf-flows and /calendar (server.mjs: ETF_FLOWS_READ / CALENDAR_READ, refreshed on the host).
async function readIntelToolSnapshot(env, key) {
  const read = key === "etf" ? env?.ETF_FLOWS_READ : env?.CALENDAR_READ;
  if (typeof read !== "function") return null;
  try { return await read(); } catch (error) { console.error(`[NexuAlpha] ${key} snapshot read failed: ${error?.message || error}`); return null; }
}
const ICS_LOCALES = new Set(INTEL_TOOL_INDEX_LOCALES);
async function handleCalendarIcs(request, env, url) {
  const data = readCalendar(await readIntelToolSnapshot(env, "calendar"));
  if (!data) return new Response("Calendar temporarily unavailable", { status: 503, headers: { "content-type": "text/plain; charset=utf-8", "retry-after": "600", "cache-control": "no-store" } });
  const type = CALENDAR_TYPES.includes(url.searchParams.get("type")) ? url.searchParams.get("type") : null;
  const locale = ICS_LOCALES.has(url.searchParams.get("locale")) ? url.searchParams.get("locale") : "en";
  const t = intelToolsCopy(locale).calendar;
  const from = Date.now() - 31 * 864e5;
  const events = filterEvents(data.events, type).filter((e) => Date.parse(e.start) >= from);
  const body = renderIcs(events, {
    name: `NexuAlpha · ${t.h1}${type ? ` · ${t.types[type]}` : ""}`, generatedAt: data.generatedAt,
    describe: (e) => ({ summary: `[${t.types[e.type]}] ${calendarEventLabel(e, locale)}`, description: `${t.source}: ${e.sourceName || ""} ${e.sourceUrl}` }),
    urlFor: (e) => (e.pagePath ? localizedCanonical(e.pagePath, locale) : e.sourceUrl),
  });
  return new Response(request.method === "HEAD" ? null : body, { status: 200, headers: {
    "content-type": "text/calendar; charset=utf-8", "cache-control": "public, max-age=1800",
    "content-disposition": `inline; filename="nexualpha-calendar${type ? `-${type}` : ""}.ics"`, "x-content-type-options": "nosniff",
  } });
}
async function refreshFxSnapshot(env) {
  if (typeof env?.FX_SNAPSHOT_READ !== "function") return null;
  try {
    const snapshot = await env.FX_SNAPSHOT_READ();
    return snapshot && typeof snapshot === "object" ? snapshot : null;
  } catch (error) {
    console.error(`[NexuAlpha] FX snapshot failed: ${error?.message || error}`);
    return null;
  }
}

function unavailableRadarPayload(kind) {
  return { kind, status: "unavailable", rows: [], updatedAt: null, sources: [] };
}

function normalizeRadarPayload(kind, payload) {
  if (!payload || typeof payload !== "object") return unavailableRadarPayload(kind);
  return {
    ...payload,
    kind,
    status: typeof payload.status === "string" ? payload.status : "unavailable",
    rows: Array.isArray(payload.rows) ? payload.rows : [],
    updatedAt: typeof payload.updatedAt === "string" ? payload.updatedAt : null,
    sources: Array.isArray(payload.sources) ? payload.sources : [],
  };
}

async function readRadarPayload(env, kind) {
  try {
    if (typeof env?.RADAR_READ === "function") return normalizeRadarPayload(kind, await env.RADAR_READ(kind));
  } catch {
    // Keep page and API payloads explicit: unavailable, never synthetic rows.
  }
  return unavailableRadarPayload(kind);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/analytics/cta") return handleAnalyticsCollector(request, env, url);
    // Coin pages read the runtime coins.json (server COINS_FILE, refreshed on the host) before any head or body is built.
    if (COINS_PATH_PATTERN.test(url.pathname) || CONVERTER_PATH_PATTERN.test(url.pathname) || (url.pathname === "/api/route-seo" && (COINS_PATH_PATTERN.test(url.searchParams.get("path") || "") || CONVERTER_PATH_PATTERN.test(url.searchParams.get("path") || "")))) await refreshCoinOverlay(env);
    // Social cards are rendered by server.mjs (server/og-image.mjs) before the worker sees the request; a worker
    // without that renderer answers 404 instead of an HTML page, so link previews never cache a page as an image.
    if (url.pathname.startsWith("/og/")) {
      return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300", "x-content-type-options": "nosniff" } });
    }
    // Site click beacon is served by server.mjs (needs the private CLICK_EVENT_FILE); the worker alone has nowhere to write it.
    if (url.pathname === "/api/cta-click") return new Response(null, { status: 404, headers: { "cache-control": "no-store" } });
    if (url.pathname.startsWith("/api/v1/")) return handleApi(request, env, url);
    if (["/api/long-short.json", "/api/whales.json"].includes(url.pathname)) {
      if (!["GET", "HEAD"].includes(request.method)) return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
      const kind = url.pathname === "/api/whales.json" ? "whales" : "long-short";
      const snapshot = await readRadarPayload(env, kind);
      return new Response(request.method === "HEAD" ? null : JSON.stringify(snapshot), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
    }
    if (url.pathname === "/api/route-seo" && ["GET", "HEAD"].includes(request.method)) return handleRouteSeoJson(request, env, url);
    if (url.pathname === "/content/news-feed.json" && request.method === "GET") return handlePublicNewsSummaryFeed(request, env, url);
    if (url.pathname === "/sitemap.xml" && ["GET", "HEAD"].includes(request.method) && env?.ASSETS) return handleSitemapIndex(request, env, url);
    if (/^\/sitemap-articles-[a-z0-9-]+\.xml$/.test(url.pathname) && request.method === "GET" && env?.ASSETS) return handleArticleSitemap(env, url);
    // Crypto calendar iCal export (2026-10-13): every event of the runtime snapshot, optionally one type, in one locale.
    if (url.pathname === CALENDAR_ICS_PATH && ["GET", "HEAD"].includes(request.method)) return handleCalendarIcs(request, env, url);
    if (/^\/sitemap-(?:locales|venues|compare|topics-tools|academy|apps|campaigns|licenses|coins|convert|glossary|data)\.xml$/.test(url.pathname) && ["GET", "HEAD"].includes(request.method) && env?.ASSETS) return env.ASSETS.fetch(request);
    if (url.pathname === "/news-sitemap.xml" && request.method === "GET" && env?.ASSETS) return handleLiveNewsSitemap(env, url);
    if (url.pathname === UPDATE_SITEMAP_PATH && ["GET", "HEAD"].includes(request.method)) return handleUpdateSitemap(request, env, url);
    // Flash (2026-10-12): the stream JSON for client refreshes / the home rail, and the 7-day flash sitemap.
    if (url.pathname === "/intel/funding-matrix.json" && ["GET", "HEAD"].includes(request.method)) {
      let feed = null;
      try { feed = typeof env.FUNDING_MATRIX_READ === "function" ? await env.FUNDING_MATRIX_READ() : null; } catch { /* unavailable */ }
      return new Response(request.method === "HEAD" ? null : JSON.stringify(feed || {}), { status: feed ? 200 : 503,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
    }
    if ((url.pathname === FLASH_FEED_URL || url.pathname === FLASH_FEED_LEGACY_URL) && ["GET", "HEAD"].includes(request.method)) return handleFlashFeedJson(request, env, url);
    if (url.pathname === FLASH_SITEMAP_PATH && ["GET", "HEAD"].includes(request.method)) return handleFlashSitemap(request, env, url);
    if (["/news-library-sitemap.xml", "/locale-sitemap.xml"].includes(url.pathname) && ["GET", "HEAD"].includes(request.method)) {
      return Response.redirect(`${PUBLIC_ORIGIN}/sitemap.xml`, 301);
    }
    if (url.pathname.startsWith("/api/news/article/") && request.method === "GET" && env?.ASSETS) return handleNewsArticleJson(env, url);
    if (url.pathname === "/api/news/search" && request.method === "GET" && env?.ASSETS) return handleNewsSearchJson(env, url);
    if (url.pathname === "/api/news/tool-articles" && request.method === "GET" && env?.ASSETS) return handleToolArticlesJson(env, url);
    if (url.pathname === "/content/news-feed-summary.json" && request.method === "GET" && env?.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      if (!response.ok) return response;
      const headers = new Headers(response.headers);
      headers.set("cache-control", "public, max-age=300");
      headers.set("content-type", "application/json; charset=utf-8");
      return new Response(response.body, { status: response.status, headers });
    }
    if (url.pathname === CAMPAIGN_BRIEFS_URL && request.method === "GET" && env?.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      if (!response.ok) return response;
      const headers = new Headers(response.headers);
      headers.set("cache-control", "public, max-age=300");
      headers.set("content-type", "application/json; charset=utf-8");
      return new Response(response.body, { status: response.status, headers });
    }
    // Search-engine ownership files (Google / Yandex) are static .html in public/; page routing would 404 them.
    if (/^\/(?:google[0-9a-f]{16}|yandex_[0-9a-f]{16})\.html$/.test(url.pathname) && ["GET", "HEAD"].includes(request.method) && env?.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    if (["/sitemap_index.xml", "/sitemap-index.xml"].includes(url.pathname) && ["GET", "HEAD"].includes(request.method)) {
      return Response.redirect(`${PUBLIC_ORIGIN}/sitemap.xml`, 301);
    }
    const parsedRoute = parsePublicRoute(url.pathname, url.searchParams);
    const legacyCompareRedirect = LEGACY_COMPARE_REDIRECTS[parsedRoute.contentPathname];
    if (legacyCompareRedirect && ["GET", "HEAD"].includes(request.method)) {
      const destination = new URL(localizedPath(legacyCompareRedirect, parsedRoute.locale), PUBLIC_ORIGIN);
      const preserved = new URLSearchParams(preservedRedirectSearch(url.searchParams).slice(1));
      for (const [key, value] of preserved) destination.searchParams.append(key, value);
      return Response.redirect(destination.href, 301);
    }
    // Compare-any (2026-10-11): the no-JS picker submits GET /compare?a=<slug>&b=<slug>; normalize to the canonical
    // pair path (302) and send invalid selections back to the picker. A reverse two-venue slug 301s to its canonical.
    if (parsedRoute.contentPathname === "/compare" && ["GET", "HEAD"].includes(request.method) && (url.searchParams.has("a") || url.searchParams.has("b"))) {
      const pair = parseComparePair(`${cleanSlug(url.searchParams.get("a")) || ""}-vs-${cleanSlug(url.searchParams.get("b")) || ""}`);
      const target = pair ? `/compare/${canonicalComparePairSlug(pair)}` : "/compare";
      const destination = new URL(localizedPath(target, parsedRoute.locale), PUBLIC_ORIGIN);
      const preserved = new URLSearchParams(preservedRedirectSearch(url.searchParams).slice(1));
      for (const [key, value] of preserved) destination.searchParams.append(key, value);
      return Response.redirect(destination.href, 302);
    }
    const reverseComparePair = parsedRoute.contentPathname.match(/^\/compare\/([a-z0-9-]+-vs-[a-z0-9-]+)$/)?.[1];
    if (reverseComparePair && ["GET", "HEAD"].includes(request.method)) {
      const slugs = parseComparePair(reverseComparePair);
      const canonicalPair = slugs ? canonicalComparePairSlug(slugs) : null;
      if (canonicalPair && canonicalPair !== reverseComparePair) {
        const destination = new URL(localizedPath(`/compare/${canonicalPair}`, parsedRoute.locale), PUBLIC_ORIGIN);
        const preserved = new URLSearchParams(preservedRedirectSearch(url.searchParams).slice(1));
        for (const [key, value] of preserved) destination.searchParams.append(key, value);
        return Response.redirect(destination.href, 301);
      }
    }
    const legacyFactbookSlug = LEGACY_VENUE_FACTBOOK_REDIRECTS[parsedRoute.contentPathname];
    if (legacyFactbookSlug && ["GET", "HEAD"].includes(request.method)) {
      const destination = new URL(localizedPath(`/factbook/${legacyFactbookSlug}`, parsedRoute.locale), PUBLIC_ORIGIN);
      const preserved = new URLSearchParams(preservedRedirectSearch(url.searchParams).slice(1));
      for (const [key, value] of preserved) destination.searchParams.append(key, value);
      return Response.redirect(destination.href, 301);
    }
    // Retired paths still linked from crawled pages (site crawl 2026-10-12): /starter never existed as a page; the starter
    // guide (新手村) is NexuAlpha Academy (/academy) since 2026-10-12.
    // /starter is not a locale-eligible path, so the locale prefix is resolved here rather than by parsePublicRoute.
    const retiredPathLocale = localePrefixForPath(normalizePathname(url.pathname));
    const retiredContentPath = retiredPathLocale ? normalizePathname(stripLocalePrefix(normalizePathname(url.pathname), retiredPathLocale.prefix)) : parsedRoute.contentPathname;
    const retiredPageTarget = RETIRED_PAGE_REDIRECTS[retiredContentPath];
    if (retiredPageTarget && ["GET", "HEAD"].includes(request.method)) {
      const destination = new URL(localizedPath(retiredPageTarget, retiredPathLocale?.locale || parsedRoute.locale), PUBLIC_ORIGIN);
      const preserved = new URLSearchParams(preservedRedirectSearch(url.searchParams).slice(1));
      for (const [key, value] of preserved) destination.searchParams.append(key, value);
      return Response.redirect(destination.href, 301);
    }
    const localeRedirect = legacyLocaleRedirect(url);
    if (localeRedirect && ["GET", "HEAD"].includes(request.method)) {
      return Response.redirect(new URL(localeRedirect, PUBLIC_ORIGIN).href, 308);
    }
    // /news/page/1 and /news/category/<key>/page/1 are the same documents as their first page.
    const newsListingRedirect = parseNewsListingPath(parsedRoute.contentPathname)?.redirect;
    if (newsListingRedirect && ["GET", "HEAD"].includes(request.method)) {
      const destination = new URL(localizedPath(newsListingRedirect, parsedRoute.locale), PUBLIC_ORIGIN);
      for (const [key, value] of url.searchParams) if (key !== "locale" || !destination.searchParams.has("locale")) destination.searchParams.append(key, value);
      return Response.redirect(destination.href, 301);
    }
    const legacyNewsSlug = !url.searchParams.get("ref") && url.searchParams.get("page") === "newsDetail"
      ? cleanSlug(url.searchParams.get("slug"))
      : null;
    if (legacyNewsSlug) {
      const locale = url.searchParams.get("locale");
      const destination = `${PUBLIC_ORIGIN}/news/${legacyNewsSlug}${locale ? `?locale=${encodeURIComponent(locale)}` : ""}`;
      return Response.redirect(destination, 301);
    }

    const stripTrackedBrazilHtmlValidators = shouldStripTrackedBrazilHtmlValidators(request, url);
    const response = normalizeTextAssetResponse(await env.ASSETS.fetch(assetFetchRequest(request, null, stripTrackedBrazilHtmlValidators)), url);
    const accepts = request.headers.get("accept") ?? "";
    const acceptsHtml = accepts.includes("text/html");
    const looksLikeAppRoute = !url.pathname.startsWith("/api/") && !pathHasFileExtension(url.pathname);

    if (response.status !== 404 || (!acceptsHtml && !looksLikeAppRoute) || !["GET", "HEAD"].includes(request.method)) {
      return appHtmlResponse(response, url, env, false, request);
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return appHtmlResponse(await env.ASSETS.fetch(assetFetchRequest(request, indexUrl, stripTrackedBrazilHtmlValidators)), url, env, true, request);
  },
};

const PUBLIC_ORIGIN = "https://nexualpha.com";
// BEGIN GENERATED PRIORITY VENUE SEO
const PRIORITY_VENUE_SEO = {
  "hyperliquid": {
    "en": {
      "title": "Hyperliquid Fees & Referral Code NEXU888: Funded Account Checks (2026)",
      "description": "Hyperliquid referral code NEXU888: fees and official sign-up link checked by NexuAlpha.",
      "directAnswer": {
        "question": "Are hyperliquid fees cheaper than a centralized futures exchange?",
        "answer": "You cannot decide from a headline taker fee alone. Hyperliquid fees depend on a maker/taker fee tier based on rolling 14-day volume, separate spot and perp schedules, sub-account volume rules, vault-volume separation, HIP-3 market conditions and referral discount eligibility; hourly peer-to-peer funding is separate from maker/taker trading fees and can change the holding cost.",
        "citations": [
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"
        ]
      },
      "faq": [
        [
          "Does Hyperliquid have cashback or a referral discount?",
          "Use official referral language, not a generic cashback promise. A hyperliquid cashback search should be checked against official referral discount and reward terms: Hyperliquid's docs describe referral rewards and a referral-code fee discount with volume boundaries; they also say referral discounts do not apply to vaults or sub-accounts. Verify the current app state before treating any code or link as a live benefit.",
          [
            "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts"
          ]
        ],
        [
          "How should I read Hyperliquid funding?",
          "Hyperliquid describes funding as peer-to-peer and paid every hour. A position can pay or receive funding depending on the premium and interest components, so it belongs in the pre-trade checklist rather than after-the-fact reporting.",
          [
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"
          ]
        ],
        [
          "What is the liquidation check on Hyperliquid?",
          "Check account equity against maintenance margin before relying on leverage. Hyperliquid states liquidation begins when equity falls below maintenance margin, and that maintenance margin varies by asset and maximum leverage.",
          [
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"
          ]
        ],
        [
          "Does Hyperliquid offer a funded account?",
          "Not according to its own documentation: the full Hyperliquid docs (checked October 11, 2026) describe no funded-account or prop-trading programme run by Hyperliquid, and \"funded account\" offers on Hyperliquid come from third parties with their own terms. Official Hyperliquid docs can support checks around self-funded wallet collateral, vault participation, sub-accounts and API-wallet signing routes, but they do not prove third-party trader-funding offers, a third-party capital allocation offer or a promised trader-funding result.",
          [
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"
          ]
        ]
      ],
      "sourceUrls": [
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals"
      ],
      "relatedLinks": [
        "/compare/hyperliquid-vs-dydx",
        "/news/hyperliquid-vs-dydx",
        "/topics/no-kyc",
        "/topics/derivatives#perp-cost-field-dictionary",
        "/topics/derivatives",
        "/factbook/hyperliquid",
        "/exchanges/dydx"
      ],
      "reviewedAt": "2026-09-22"
    },
    "zh-Hans": {
      "title": "Hyperliquid 邀请码 NEXU888：注册教程、手续费与官方入口（2026）",
      "description": "Hyperliquid 邀请码 NEXU888：注册入口与手续费。NexuAlpha 核验官方入口。",
      "reviewedAt": "2026-09-22",
      "sourceUrls": [
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals"
      ],
      "relatedLinks": [
        "/compare/hyperliquid-vs-dydx",
        "/topics/derivatives#perp-cost-field-dictionary",
        "/topics/no-kyc"
      ],
      "directAnswer": {
        "question": "Hyperliquid 一定比中心化合约交易所便宜吗？",
        "answer": "不能只用表面 taker 费率判断。Hyperliquid 费用取决于滚动 14 日成交量、现货与永续的不同费率表、子账户成交量规则、vault 成交量单独处理、HIP-3 市场条件，以及仓位上的每小时资金费。",
        "citations": [
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"
        ]
      },
      "faq": [
        [
          "Hyperliquid 有 cashback 或邀请折扣吗？",
          "应使用官方 referral 表述，而不是承诺通用 cashback。Hyperliquid 官方文档写明邀请奖励和邀请码费率折扣存在成交量边界，并说明邀请折扣不适用于 vault 或子账户。任何代码、链接或权益都应在当前官方 App 中再次核验，不能据此承诺无条件返现。",
          [
            "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts"
          ]
        ],
        [
          "Hyperliquid 的资金费应该怎么看？",
          "官方文档把资金费描述为点对点结算，并且每小时支付。仓位可能支付或收到资金费，方向取决于溢价和利率组成，因此它应放在下单前检查清单里。",
          [
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"
          ]
        ],
        [
          "Hyperliquid 的清算要检查什么？",
          "先看账户权益是否可能低于维持保证金。官方文档说明，当权益低于维持保证金时会开始清算，而维持保证金会随资产和最大杠杆变化。",
          [
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"
          ]
        ],
        [
          "Hyperliquid 是否提供 funded account？",
          "把 funded account 关键词当成单独研究路径。官方资料可用于核对抵押模式、vault 参与、子账户和 API 钱包签名路径，但不能证明第三方会给交易员分配资金或承诺结果。",
          [
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"
          ]
        ]
      ]
    },
    "zh-Hant": {
      "title": "Hyperliquid 費率、邀請折扣、資金費與清算檢查清單",
      "description": "Hyperliquid 官方來源答案：區分邀請折扣與 cashback，覆蓋滾動費率階梯、每小時資金費、保證金、清算和 funded-account 邊界。",
      "reviewedAt": "2026-09-22",
      "sourceUrls": [
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals"
      ],
      "relatedLinks": [
        "/compare/hyperliquid-vs-dydx",
        "/topics/derivatives#perp-cost-field-dictionary",
        "/topics/no-kyc"
      ],
      "directAnswer": {
        "question": "Hyperliquid 一定比中心化合約交易所便宜嗎？",
        "answer": "不能只用表面 taker 費率判斷。Hyperliquid 費用取決於滾動 14 日成交量、現貨與永續的不同費率表、子帳戶成交量規則、vault 成交量單獨處理、HIP-3 市場條件，以及倉位上的每小時資金費。",
        "citations": [
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"
        ]
      },
      "faq": [
        [
          "Hyperliquid 有 cashback 或邀請折扣嗎？",
          "應使用官方 referral 表述，而不是承諾通用 cashback。Hyperliquid 官方文檔寫明邀請獎勵和邀請碼費率折扣存在成交量邊界，並說明邀請折扣不適用於 vault 或子帳戶。任何代碼、連結或權益都應在目前官方 App 中再次核驗，不能據此承諾無條件返現。",
          [
            "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts"
          ]
        ],
        [
          "Hyperliquid 的資金費應該怎麼看？",
          "官方文檔把資金費描述為點對點結算，並且每小時支付。倉位可能支付或收到資金費，方向取決於溢價和利率組成，因此它應放在下單前檢查清單裡。",
          [
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"
          ]
        ],
        [
          "Hyperliquid 的清算要檢查什麼？",
          "先看帳戶權益是否可能低於維持保證金。官方文檔說明，當權益低於維持保證金時會開始清算，而維持保證金會隨資產和最大槓桿變化。",
          [
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"
          ]
        ],
        [
          "Hyperliquid 是否提供 funded account？",
          "把 funded account 關鍵詞當成單獨研究路徑。官方資料可用於核對抵押模式、vault 參與、子帳戶和 API 錢包簽名路徑，但不能證明第三方會給交易員分配資金或承諾結果。",
          [
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"
          ]
        ]
      ]
    }
  },
  "uniswap": {
    "en": {
      "reviewedAt": "2026-09-22",
      "title": "Uniswap Testnet, Mainnet, Permit2 and Swap Preview Checklist — NexuAlpha",
      "description": "Check Uniswap official app and docs, API and web testnet scope, mainnet chain, token contract, pool route, Permit2 spender, gas and wallet transaction preview.",
      "directAnswer": {
        "question": "What should I check before using Uniswap testnet or mainnet?",
        "answer": "Guidance checked 2026-10-01: open the official Uniswap app and docs first; separate API table coverage from the public web app. Test coins have no real-world value. Wallet/Extension only: open the app or extension, select the gear icon, Advanced, then turn on Testnet mode. These are not instructions for the ordinary web interface. Before mainnet use, verify network, token contract, approval or Permit2 spender, gas asset and final wallet transaction preview (the final mainnet transaction preview for live use). Testnet results do not prove mainnet liquidity, execution quality or token safety; do not connect a wallet or send value from an unverified link or contract.",
        "citations": [
          "https://app.uniswap.org/",
          "https://developers.uniswap.org/docs/get-started/quickstart",
          "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains",
          "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap",
          "https://support.uniswap.org/hc/en-us/articles/39884112333197-How-do-I-use-testnets-on-Uniswap",
          "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"
        ]
      },
      "faq": [
        [
          "Do I need an exchange account to use Uniswap?",
          "No. Uniswap is a wallet-connected app route rather than a custodial exchange account. The practical check is whether the user is on the official app, using the intended wallet, chain, token contract, approval and swap route.",
          [
            "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"
          ]
        ],
        [
          "What is the difference between Uniswap API testnets and the web app?",
          "Documentation checked 2026-10-01: the API table lists Ethereum Sepolia, Unichain Sepolia and Base Sepolia, and documents only Ethereum Sepolia and Unichain Sepolia as testnet options for web availability. Uniswap Support lists Sepolia and Unichain for the Interface. This documents support, not controls observed in your current web session; Wallet/Extension Testnet mode has separate instructions. Testnet support is not proof of mainnet liquidity or token safety.",
          [
            "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains",
            "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap"
          ]
        ],
        [
          "What roles do token contract, Universal Router, Permit2 and spender play?",
          "The token contract identifies the asset, Universal Router can route the swap path, Permit2 can manage signature-based token permissions, and the spender is the address allowed to move tokens. Check each role before signing because a familiar page does not make every token or approval safe, and an unknown contract should not be treated as safe.",
          [
            "https://developers.uniswap.org/docs/protocols/universal-router/overview",
            "https://developers.uniswap.org/docs/protocols/permit2/overview"
          ]
        ],
        [
          "Does disconnecting a wallet revoke Uniswap approvals?",
          "No. Disconnecting stops a site session, while token approvals remain on-chain until revoked or changed. Users should inspect active approvals and revoke unwanted permissions rather than relying on disconnect alone.",
          [
            "https://support.uniswap.org/hc/en-us/articles/25380237324685-How-to-revoke-token-approvals",
            "https://developers.uniswap.org/docs/protocols/permit2/overview"
          ]
        ],
        [
          "Does a Uniswap affiliate program search prove consumer referral or cashback eligibility?",
          "Official documentation checked 2026-10-02: the Swap API FAQ describes an integrator fee, while the Custom Linking page documents prefilled interface links in a v2 documentation context. These are developer integration and interface-linking mechanics, not evidence that a consumer qualifies for a referral reward or cashback. They do not establish whether a consumer affiliate program exists or is available to a particular user. Verify any separate program terms and eligibility through current official sources; no reward or cashback is promised here.",
          [
            "https://developers.uniswap.org/docs/trading/swapping-api/faqs",
            "https://developers.uniswap.org/docs/trading/custom-interface-links"
          ]
        ]
      ],
      "sourceUrls": [
        "https://developers.uniswap.org/docs/trading/swapping-api/faqs",
        "https://developers.uniswap.org/docs/trading/custom-interface-links",
        "https://app.uniswap.org/",
        "https://developers.uniswap.org/docs/get-started/quickstart",
        "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains",
        "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap",
        "https://support.uniswap.org/hc/en-us/articles/39884112333197-How-do-I-use-testnets-on-Uniswap",
        "https://developers.uniswap.org/docs/protocols/universal-router/overview",
        "https://developers.uniswap.org/docs/protocols/v4/deployments",
        "https://developers.uniswap.org/docs/protocols/permit2/overview",
        "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens",
        "https://support.uniswap.org/hc/en-us/articles/25380237324685-How-to-revoke-token-approvals"
      ],
      "relatedLinks": [
        "/compare/uniswap-vs-jupiter",
        "/news/uniswap-v3-vs-pancakeswap-v3-concentrated-liquidity-controls",
        "/topics/meme-coins",
        "/topics/no-kyc",
        "/factbook/uniswap",
        "/exchanges/jupiter",
        "/onchain?product=swap",
        "/news/cex-vs-dex-vs-perp-dex"
      ]
    },
    "zh-Hans": {
      "title": "Uniswap 测试网、Permit2 与真实 swap 安全清单",
      "description": "基于官方来源的 Uniswap 答案，区分 API/测试网研究与真实钱包 swap，并检查链、代币合约、Permit2、授权、路径和 gas。",
      "reviewedAt": "2026-09-22",
      "sourceUrls": [
        "https://developers.uniswap.org/docs/trading/swapping-api/faqs",
        "https://developers.uniswap.org/docs/trading/custom-interface-links",
        "https://app.uniswap.org/",
        "https://developers.uniswap.org/docs/get-started/quickstart",
        "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains",
        "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap",
        "https://support.uniswap.org/hc/en-us/articles/39884112333197-How-do-I-use-testnets-on-Uniswap",
        "https://developers.uniswap.org/docs/protocols/universal-router/overview",
        "https://developers.uniswap.org/docs/protocols/v4/deployments",
        "https://developers.uniswap.org/docs/protocols/permit2/overview",
        "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens",
        "https://support.uniswap.org/hc/en-us/articles/25380237324685-How-to-revoke-token-approvals"
      ],
      "relatedLinks": [
        "/compare/uniswap-vs-jupiter",
        "/onchain?product=swap",
        "/news/cex-vs-dex-vs-perp-dex"
      ],
      "directAnswer": {
        "question": "使用 Uniswap 测试网或主网前要检查什么？",
        "answer": "2026-10-01 核对说明：先打开官方 Uniswap App 和文档，区分 API 表的支持范围与普通 Web App。测试币没有现实价值。仅适用于 Wallet/Extension：打开应用或扩展，选择齿轮设置、Advanced，再开启 Testnet mode。这不是普通网页的操作步骤。使用主网前，要核对网络、代币合约、approval 或 Permit2 spender、gas 资产和最终钱包交易预览，并确认最终主网交易预览。测试网不能证明主网流动性、成交质量或代币安全；不要从未经核验的链接或合约连接钱包或发送资产。",
        "citations": [
          "https://app.uniswap.org/",
          "https://developers.uniswap.org/docs/get-started/quickstart",
          "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains",
          "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap",
          "https://support.uniswap.org/hc/en-us/articles/39884112333197-How-do-I-use-testnets-on-Uniswap",
          "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"
        ]
      },
      "faq": [
        [
          "使用 Uniswap 需要交易所账户吗？",
          "不需要。Uniswap 是钱包连接型 App 路径，不是托管交易所账户。真正要检查的是官方 App、当前钱包、链、代币合约、授权和 swap 路径是否都正确。",
          [
            "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"
          ]
        ],
        [
          "Uniswap API 测试网和 Web App 有什么区别？",
          "2026-10-01 核对官方文档：API 表列出 Ethereum Sepolia、Unichain Sepolia 和 Base Sepolia，并注明 Web 测试网仅支持 Ethereum Sepolia 与 Unichain Sepolia。Uniswap Support 的 Interface 支持说明列出 Sepolia 和 Unichain。这是文档支持范围，不代表已观察到当前网页会话的开关；Wallet/Extension 的 Testnet mode 有单独说明。测试网支持不能证明主网流动性或代币安全。",
          [
            "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains",
            "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap"
          ]
        ],
        [
          "代币合约、Universal Router、Permit2 和 spender 分别是什么角色？",
          "代币合约用于确认资产，Universal Router 可以路由 swap 路径，Permit2 可以管理基于签名的代币权限，spender 是被允许移动代币的地址。签名前要分别检查这些角色，因为熟悉页面不代表每个代币或授权都安全。",
          [
            "https://developers.uniswap.org/docs/protocols/universal-router/overview",
            "https://developers.uniswap.org/docs/protocols/permit2/overview"
          ]
        ],
        [
          "断开钱包连接会撤销 Uniswap 授权吗？",
          "不会。断开连接只是结束网站会话，代币授权仍会留在链上，直到用户撤销或修改。用户应检查当前授权并撤销不需要的权限，而不是只依赖断开连接。",
          [
            "https://support.uniswap.org/hc/en-us/articles/25380237324685-How-to-revoke-token-approvals",
            "https://developers.uniswap.org/docs/protocols/permit2/overview"
          ]
        ],
        [
          "搜索 Uniswap affiliate program 能证明消费者推荐或返现资格吗？",
          "2026-10-02 核对官方文档：Swap API FAQ 说明 integrator fee（集成方费用），Custom Linking 页面在 v2 文档语境下说明预填界面链接。这些是开发者集成与界面链接机制，不是消费者具备推荐奖励或返现资格的证据，也不能据此判断消费者 affiliate 计划有无或是否适用于某位用户。任何独立计划的条款与资格都应另行核对当前官方来源；这里不承诺奖励或返现。",
          [
            "https://developers.uniswap.org/docs/trading/swapping-api/faqs",
            "https://developers.uniswap.org/docs/trading/custom-interface-links"
          ]
        ]
      ]
    },
    "zh-Hant": {
      "title": "Uniswap 測試網、Permit2 與真實 swap 安全清單",
      "description": "基於官方來源的 Uniswap 答案，區分 API/測試網研究與真實錢包 swap，並檢查鏈、代幣合約、Permit2、授權、路徑和 gas。",
      "reviewedAt": "2026-09-22",
      "sourceUrls": [
        "https://developers.uniswap.org/docs/trading/swapping-api/faqs",
        "https://developers.uniswap.org/docs/trading/custom-interface-links",
        "https://app.uniswap.org/",
        "https://developers.uniswap.org/docs/get-started/quickstart",
        "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains",
        "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap",
        "https://support.uniswap.org/hc/en-us/articles/39884112333197-How-do-I-use-testnets-on-Uniswap",
        "https://developers.uniswap.org/docs/protocols/universal-router/overview",
        "https://developers.uniswap.org/docs/protocols/v4/deployments",
        "https://developers.uniswap.org/docs/protocols/permit2/overview",
        "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens",
        "https://support.uniswap.org/hc/en-us/articles/25380237324685-How-to-revoke-token-approvals"
      ],
      "relatedLinks": [
        "/compare/uniswap-vs-jupiter",
        "/onchain?product=swap",
        "/news/cex-vs-dex-vs-perp-dex"
      ],
      "directAnswer": {
        "question": "使用 Uniswap 測試網或主網前要檢查什麼？",
        "answer": "2026-10-01 核對說明：先打開官方 Uniswap App 和文檔，區分 API 表的支援範圍與普通 Web App。測試幣沒有現實價值。僅適用於 Wallet/Extension：打開應用或擴充功能，選擇齒輪設定、Advanced，再開啟 Testnet mode。這不是普通網頁的操作步驟。使用主網前，要核對網路、代幣合約、approval 或 Permit2 spender、gas 資產和最終錢包交易預覽，並確認最終主網交易預覽。測試網不能證明主網流動性、成交品質或代幣安全；不要從未經核驗的連結或合約連接錢包或發送資產。",
        "citations": [
          "https://app.uniswap.org/",
          "https://developers.uniswap.org/docs/get-started/quickstart",
          "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains",
          "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap",
          "https://support.uniswap.org/hc/en-us/articles/39884112333197-How-do-I-use-testnets-on-Uniswap",
          "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"
        ]
      },
      "faq": [
        [
          "使用 Uniswap 需要交易所帳戶嗎？",
          "不需要。Uniswap 是錢包連接型 App 路徑，不是託管交易所帳戶。真正要檢查的是官方 App、當前錢包、鏈、代幣合約、授權和 swap 路徑是否都正確。",
          [
            "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"
          ]
        ],
        [
          "Uniswap API 測試網和 Web App 有什麼區別？",
          "2026-10-01 核對官方文檔：API 表列出 Ethereum Sepolia、Unichain Sepolia 和 Base Sepolia，並註明 Web 測試網僅支援 Ethereum Sepolia 與 Unichain Sepolia。Uniswap Support 的 Interface 支援說明列出 Sepolia 和 Unichain。這是文檔支援範圍，不代表已觀察到目前網頁工作階段的開關；Wallet/Extension 的 Testnet mode 有單獨說明。測試網支援不能證明主網流動性或代幣安全。",
          [
            "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains",
            "https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap"
          ]
        ],
        [
          "代幣合約、Universal Router、Permit2 和 spender 分別是什麼角色？",
          "代幣合約用於確認資產，Universal Router 可以路由 swap 路徑，Permit2 可以管理基於簽名的代幣權限，spender 是被允許移動代幣的地址。簽名前要分別檢查這些角色，因為熟悉頁面不代表每個代幣或授權都安全。",
          [
            "https://developers.uniswap.org/docs/protocols/universal-router/overview",
            "https://developers.uniswap.org/docs/protocols/permit2/overview"
          ]
        ],
        [
          "斷開錢包連接會撤銷 Uniswap 授權嗎？",
          "不會。斷開連接只是結束網站會話，代幣授權仍會留在鏈上，直到用戶撤銷或修改。用戶應檢查目前授權並撤銷不需要的權限，而不是只依賴斷開連接。",
          [
            "https://support.uniswap.org/hc/en-us/articles/25380237324685-How-to-revoke-token-approvals",
            "https://developers.uniswap.org/docs/protocols/permit2/overview"
          ]
        ],
        [
          "搜尋 Uniswap affiliate program 能證明消費者推薦或返現資格嗎？",
          "2026-10-02 核對官方文檔：Swap API FAQ 說明 integrator fee（整合方費用），Custom Linking 頁面在 v2 文檔語境下說明預填介面連結。這些是開發者整合與介面連結機制，不是消費者具備推薦獎勵或返現資格的證據，也不能據此判斷消費者 affiliate 計劃有無或是否適用於某位用戶。任何獨立計劃的條款與資格都應另行核對目前官方來源；這裡不承諾獎勵或返現。",
          [
            "https://developers.uniswap.org/docs/trading/swapping-api/faqs",
            "https://developers.uniswap.org/docs/trading/custom-interface-links"
          ]
        ]
      ]
    }
  },
  "gmx": {
    "en": {
      "title": "GMX v2 Fees: Pools, Price Impact, Funding and Liquidation — NexuAlpha",
      "directAnswer": {
        "question": "When is GMX a sensible next page to open?",
        "answer": "GMX is worth opening when the user wants a wallet-connected swap or perpetual route and is prepared to inspect pool selection, collateral, oracle-based execution, price impact, funding, borrow cost and liquidation before signing. It is not an ordinary order-book account decision.",
        "citations": [
          "https://docs.gmx.io/docs/intro/",
          "https://docs.gmx.io/docs/trading/order-types/"
        ]
      },
      "faq": [
        [
          "Which GMX fees should I check first?",
          "Separate position fees, swap fees, price impact, borrow cost, funding payments and gas. A single displayed fee does not cover the full GMX route because funding and borrow accrual can keep changing while a position remains open.",
          [
            "https://docs.gmx.io/docs/trading/fees/"
          ]
        ],
        [
          "How does GMX collateral affect liquidation risk?",
          "GMX documentation ties liquidation to remaining collateral after unrealized losses, accrued fees and capped negative price impact. Collateral token choice also changes exposure, so users should check collateral, leverage, accrued costs and market rules together.",
          [
            "https://docs.gmx.io/docs/trading/liquidations/",
            "https://docs.gmx.io/docs/trading/order-types/"
          ]
        ],
        [
          "Does a GMX referral discount cover all costs?",
          "No. GMX referral docs describe trader discounts for eligible opening and closing fees and state that rewards and discounts do not apply to borrow fees or funding fees. They do not remove gas, price impact, slippage, liquidation or market risk.",
          [
            "https://docs.gmx.io/docs/referrals/",
            "https://docs.gmx.io/docs/trading/fees/"
          ]
        ]
      ],
      "sourceUrls": [
        "https://docs.gmx.io/docs/intro/",
        "https://docs.gmx.io/docs/trading/fees/",
        "https://docs.gmx.io/docs/trading/liquidations/",
        "https://docs.gmx.io/docs/trading/order-types/",
        "https://docs.gmx.io/docs/referrals/"
      ],
      "relatedLinks": [
        "/factbook/gmx",
        "/compare/hyperliquid-vs-dydx",
        "/topics/derivatives#perp-cost-field-dictionary",
        "/topics/derivatives",
        "/topics/no-kyc",
        "/exchanges/hyperliquid",
        "/exchanges/dydx",
        "/news/cex-vs-dex-vs-perp-dex"
      ],
      "description": "Source-backed GMX answer covering GM/GLV pools, oracle pricing, collateral, position and swap fees, price impact, borrow, funding and liquidation boundaries.",
      "reviewedAt": "2026-09-28"
    },
    "zh-Hans": {
      "title": "GMX 费用、资金费、流动性池与清算检查清单",
      "description": "基于官方来源的 GMX 答案，覆盖 GM/GLV 池、预言机定价、抵押资产、仓位与 swap 费用、价格影响、资金费、借贷成本和清算边界。",
      "reviewedAt": "2026-09-28",
      "sourceUrls": [
        "https://docs.gmx.io/docs/intro/",
        "https://docs.gmx.io/docs/trading/fees/",
        "https://docs.gmx.io/docs/trading/liquidations/",
        "https://docs.gmx.io/docs/trading/order-types/",
        "https://docs.gmx.io/docs/referrals/"
      ],
      "relatedLinks": [
        "/topics/derivatives#perp-cost-field-dictionary",
        "/compare/hyperliquid-vs-dydx",
        "/news/cex-vs-dex-vs-perp-dex"
      ],
      "directAnswer": {
        "question": "什么情况下适合继续打开 GMX？",
        "answer": "当用户需要钱包连接型 swap 或永续路径，并且愿意检查资金池选择、抵押资产、预言机执行、价格影响、资金费、借贷成本和清算条件时，GMX 才是合理的下一步。它不是普通订单簿开户注册问题。",
        "citations": [
          "https://docs.gmx.io/docs/intro/",
          "https://docs.gmx.io/docs/trading/order-types/"
        ]
      },
      "faq": [
        [
          "GMX 要先检查哪些费用？",
          "把仓位费用、swap 费用、价格影响、借贷成本、资金费和 gas 分开看。单一显示费率不能覆盖 GMX 路径，因为资金费和借贷成本会在持仓期间继续变化。",
          [
            "https://docs.gmx.io/docs/trading/fees/"
          ]
        ],
        [
          "GMX 抵押资产如何影响清算？",
          "GMX 文档把清算与扣除未实现亏损、已累计费用和负向价格影响后的剩余抵押品联系起来。抵押币种也会改变额外敞口，所以要把抵押、杠杆、费用和市场规则一起检查。",
          [
            "https://docs.gmx.io/docs/trading/liquidations/",
            "https://docs.gmx.io/docs/trading/order-types/"
          ]
        ],
        [
          "GMX 邀请折扣覆盖全部成本吗？",
          "不覆盖。GMX referral 文档说明，交易者折扣适用于合格开仓和平仓费用，并且奖励和折扣不适用于借贷费用或资金费；它也不能抵消 gas、价格影响、滑点、清算或市场风险。",
          [
            "https://docs.gmx.io/docs/referrals/",
            "https://docs.gmx.io/docs/trading/fees/"
          ]
        ]
      ]
    },
    "zh-Hant": {
      "title": "GMX 費用、資金費、流動性池與清算檢查清單",
      "description": "基於官方來源的 GMX 答案，覆蓋 GM/GLV 池、預言機定價、抵押資產、倉位與 swap 費用、價格影響、資金費、借貸成本和清算邊界。",
      "reviewedAt": "2026-09-28",
      "sourceUrls": [
        "https://docs.gmx.io/docs/intro/",
        "https://docs.gmx.io/docs/trading/fees/",
        "https://docs.gmx.io/docs/trading/liquidations/",
        "https://docs.gmx.io/docs/trading/order-types/",
        "https://docs.gmx.io/docs/referrals/"
      ],
      "relatedLinks": [
        "/topics/derivatives#perp-cost-field-dictionary",
        "/compare/hyperliquid-vs-dydx",
        "/news/cex-vs-dex-vs-perp-dex"
      ],
      "directAnswer": {
        "question": "什麼情況下適合繼續打開 GMX？",
        "answer": "當用戶需要錢包連接型 swap 或永續路徑，並且願意檢查資金池選擇、抵押資產、預言機執行、價格影響、資金費、借貸成本和清算條件時，GMX 才是合理的下一步。它不是普通訂單簿開戶註冊問題。",
        "citations": [
          "https://docs.gmx.io/docs/intro/",
          "https://docs.gmx.io/docs/trading/order-types/"
        ]
      },
      "faq": [
        [
          "GMX 要先檢查哪些費用？",
          "把倉位費用、swap 費用、價格影響、借貸成本、資金費和 gas 分開看。單一顯示費率不能覆蓋 GMX 路徑，因為資金費和借貸成本會在持倉期間繼續變化。",
          [
            "https://docs.gmx.io/docs/trading/fees/"
          ]
        ],
        [
          "GMX 抵押資產如何影響清算？",
          "GMX 文檔把清算與扣除未實現虧損、已累計費用和負向價格影響後的剩餘抵押品聯繫起來。抵押幣種也會改變額外敞口，所以要把抵押、槓桿、費用和市場規則一起檢查。",
          [
            "https://docs.gmx.io/docs/trading/liquidations/",
            "https://docs.gmx.io/docs/trading/order-types/"
          ]
        ],
        [
          "GMX 邀請折扣覆蓋全部成本嗎？",
          "不覆蓋。GMX referral 文檔說明，交易者折扣適用於合格開倉和平倉費用，並且獎勵和折扣不適用於借貸費用或資金費；它也不能抵消 gas、價格影響、滑點、清算或市場風險。",
          [
            "https://docs.gmx.io/docs/referrals/",
            "https://docs.gmx.io/docs/trading/fees/"
          ]
        ]
      ]
    }
  },
  "drift": {
    "en": {
      "title": "Drift source-boundary checklist: official site, updates and docs redirect",
      "description": "Source-backed Drift answer: Drift-owned pages, recovery updates, docs redirect status and stop conditions before deposits, trading or sponsored registration.",
      "reviewedAt": "2026-09-29",
      "sourceUrls": [
        "https://www.drift.trade/",
        "https://www.drift.trade/updates",
        "https://www.drift.trade/updates/drift-recovery-update-june-3-2026",
        "https://docs.drift.trade/"
      ],
      "relatedLinks": [
        "/compare/hyperliquid-vs-dydx",
        "/topics/derivatives#perp-cost-field-dictionary",
        "/news/cex-vs-dex-vs-perp-dex"
      ],
      "directAnswer": {
        "question": "What should I verify before opening Drift?",
        "answer": "Start with Drift-owned pages: the official site, the updates page and the current app route. If the documentation path redirects to another branded protocol destination, treat that as a source-bound caution and do not restate redirected mechanics as current Drift terms without a fresh owner statement.",
        "citations": [
          "https://www.drift.trade/",
          "https://www.drift.trade/updates",
          "https://docs.drift.trade/"
        ]
      },
      "faq": [
        [
          "Does the recovery update prove Drift is normally available?",
          "No. The reviewed recovery notice discusses outstanding user-loss recovery and a reboot path. It is not enough to prove normal current deposits, trading access, rewards, TVL, ranking, fees or regional eligibility.",
          [
            "https://www.drift.trade/updates/drift-recovery-update-june-3-2026"
          ]
        ],
        [
          "How should I handle the Drift documentation redirect?",
          "Use the redirect as a documentation-status signal only. It can justify a caution in the research page, but it should not be rewritten into a rebrand claim, product guarantee, or equivalent user-protection statement unless a current Drift-owned source says so.",
          [
            "https://docs.drift.trade/",
            "https://www.drift.trade/updates"
          ]
        ],
        [
          "When should NexuAlpha stop the Drift CTA path?",
          "Stop before sending a user to deposit, trade or a sponsored registration route when the current Drift-owned source does not clearly confirm app state, account terms, product availability, user benefit and risk notices. NexuAlpha can link to source review first, but should not present unverified action claims as a conversion step.",
          [
            "https://www.drift.trade/",
            "https://www.drift.trade/updates"
          ]
        ]
      ]
    },
    "zh-Hans": {
      "title": "Drift 来源边界检查：官网、更新公告与文档重定向",
      "description": "Drift 来源答案：区分 Drift 自有页面、恢复公告、文档重定向状态，以及充值、交易、sponsored registration 前的停止条件。",
      "reviewedAt": "2026-09-29",
      "sourceUrls": [
        "https://www.drift.trade/",
        "https://www.drift.trade/updates",
        "https://www.drift.trade/updates/drift-recovery-update-june-3-2026",
        "https://docs.drift.trade/"
      ],
      "relatedLinks": [
        "/compare/hyperliquid-vs-dydx",
        "/topics/derivatives#perp-cost-field-dictionary",
        "/news/cex-vs-dex-vs-perp-dex"
      ],
      "directAnswer": {
        "question": "打开 Drift 之前应该核对什么？",
        "answer": "先看 Drift 自有页面：官网、更新页和当前 App 入口。如果文档路径重定向到另一个品牌的协议文档，只把它当成来源边界提示；没有新的 Drift 自有说明时，不要把重定向后的机制改写成当前 Drift 条款。",
        "citations": [
          "https://www.drift.trade/",
          "https://www.drift.trade/updates",
          "https://docs.drift.trade/"
        ]
      },
      "faq": [
        [
          "恢复公告能证明 Drift 已经正常可用吗？",
          "不能。已核验的恢复公告讨论的是未补偿用户损失的恢复和重启路径，不能证明当前充值、交易、奖励、TVL、排名、费率或地区资格正常可用。",
          [
            "https://www.drift.trade/updates/drift-recovery-update-june-3-2026"
          ]
        ],
        [
          "Drift 文档重定向应该怎么处理？",
          "只把重定向作为文档状态信号。它可以支持研究页给出谨慎提示，但不能写成品牌更名、产品保证或同等用户保护，除非 Drift 自有当前来源明确这样说。",
          [
            "https://docs.drift.trade/",
            "https://www.drift.trade/updates"
          ]
        ],
        [
          "NexuAlpha 什么时候应该停止 Drift 的 CTA 路径？",
          "当 Drift 自有当前来源没有明确确认 App 状态、账户条款、产品可用性、用户权益和风险提示时，应停在充值、交易或 sponsored registration 路径之前。NexuAlpha 可以先引导用户做来源核对，但不应把未验证行动声明做成转化步骤。",
          [
            "https://www.drift.trade/",
            "https://www.drift.trade/updates"
          ]
        ]
      ]
    },
    "zh-Hant": {
      "title": "Drift 來源邊界檢查：官網、更新公告與文件重新導向",
      "description": "Drift 來源答案：區分 Drift 自有頁面、恢復公告、文件重新導向狀態，以及儲值、交易、sponsored registration 前的停止條件。",
      "reviewedAt": "2026-09-29",
      "sourceUrls": [
        "https://www.drift.trade/",
        "https://www.drift.trade/updates",
        "https://www.drift.trade/updates/drift-recovery-update-june-3-2026",
        "https://docs.drift.trade/"
      ],
      "relatedLinks": [
        "/compare/hyperliquid-vs-dydx",
        "/topics/derivatives#perp-cost-field-dictionary",
        "/news/cex-vs-dex-vs-perp-dex"
      ],
      "directAnswer": {
        "question": "打開 Drift 之前應該核對什麼？",
        "answer": "先看 Drift 自有頁面：官網、更新頁和當前 App 入口。如果文件路徑重新導向到另一個品牌的協議文件，只把它當成來源邊界提示；沒有新的 Drift 自有說明時，不要把重新導向後的機制改寫成目前 Drift 條款。",
        "citations": [
          "https://www.drift.trade/",
          "https://www.drift.trade/updates",
          "https://docs.drift.trade/"
        ]
      },
      "faq": [
        [
          "恢復公告能證明 Drift 已經正常可用嗎？",
          "不能。已核驗的恢復公告討論的是未補償用戶損失的恢復和重啟路徑，不能證明目前儲值、交易、獎勵、TVL、排名、費率或地區資格正常可用。",
          [
            "https://www.drift.trade/updates/drift-recovery-update-june-3-2026"
          ]
        ],
        [
          "Drift 文件重新導向應該怎麼處理？",
          "只把重新導向作為文件狀態信號。它可以支援研究頁給出謹慎提示，但不能寫成品牌更名、產品保證或同等用戶保護，除非 Drift 自有當前來源明確這樣說。",
          [
            "https://docs.drift.trade/",
            "https://www.drift.trade/updates"
          ]
        ],
        [
          "NexuAlpha 什麼時候應該停止 Drift 的 CTA 路徑？",
          "當 Drift 自有當前來源沒有明確確認 App 狀態、帳戶條款、產品可用性、用戶權益和風險提示時，應停在儲值、交易或 sponsored registration 路徑之前。NexuAlpha 可以先引導用戶做來源核對，但不應把未驗證行動聲明做成轉化步驟。",
          [
            "https://www.drift.trade/",
            "https://www.drift.trade/updates"
          ]
        ]
      ]
    }
  },
  "deribit": {
    "en": {
      "title": "Deribit Fees: Options, Futures and 10% User Discount Terms",
      "description": "Deribit fees for options and futures, the six-month 10% user fee discount, DRB Panama vs FZE entity limits, spot exclusion, margin modes and liquidation risk.",
      "reviewedAt": "2026-09-29",
      "sourceUrls": [
        "https://support.deribit.com/hc/en-us/articles/25944746248989-Fees",
        "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program",
        "https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations",
        "https://support.deribit.com/hc/en-us/articles/25944811317149-Margin-types-and-usage",
        "https://docs.deribit.com/"
      ],
      "relatedLinks": [
        "/topics/derivatives#perp-cost-field-dictionary",
        "/topics/tokenized-stocks-vs-perpetuals",
        "/compare/hyperliquid-vs-dydx"
      ],
      "directAnswer": {
        "question": "When is Deribit the right next page to open?",
        "answer": "Open Deribit when the query is about crypto options, futures, perpetuals, margin models, API execution or liquidation mechanics. Deribit documents WebSocket, HTTP and FIX interfaces; confirm the test-versus-production environment before moving an automated strategy to production. If the user wants basic spot buying, fiat onboarding or broad exchange selection, start from the exchange directory or comparison page instead.",
        "citations": [
          "https://docs.deribit.com/"
        ]
      },
      "faq": [
        [
          "What Deribit affiliate benefit is source-supported?",
          "The cited Deribit affiliate page supports a 10% trading-fee discount for eligible referred users during the first six months, under the covered DRB Panama route. It says Deribit FZE accounts are outside that affiliate setup, spot is excluded and regional eligibility still has to be checked in the official account flow.",
          [
            "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"
          ]
        ],
        [
          "Which Deribit cost should I check before trading options?",
          "For options, compare the options fee rule, premium-based caps where shown, settlement or delivery cost, margin mode, any source-supported user discount and liquidation path. A futures, perpetual or spot fee does not describe the full options cost.",
          [
            "https://support.deribit.com/hc/en-us/articles/25944746248989-Fees",
            "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"
          ]
        ],
        [
          "How should I read Deribit liquidation risk?",
          "Deribit describes incremental auto-liquidation and says users do not control the account during the process. Treat liquidation fees, margin usage, collateral model and possible portfolio-margin hedges as separate risk checks from the entry order.",
          [
            "https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations",
            "https://support.deribit.com/hc/en-us/articles/25944811317149-Margin-types-and-usage"
          ]
        ],
        [
          "What changes after the Deribit affiliate migration dates?",
          "Treat 2026-09-09 as the stop date for creating new affiliates and 2027-01-01 as the stop date for onboarding new users through legacy affiliate links, based on the cited notice. Recheck entity, region and attribution before treating an old readable link as current.",
          [
            "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"
          ]
        ]
      ]
    },
    "zh-Hans": {
      "title": "Deribit 期权费用、10% 用户折扣、迁移日期与实体检查",
      "description": "Deribit 决策清单，区分期权、合约费用、前六个月 10% 用户折扣、DRB Panama/FZE 实体、现货排除、迁移日期、保证金与清算边界。",
      "reviewedAt": "2026-09-29",
      "sourceUrls": [
        "https://support.deribit.com/hc/en-us/articles/25944746248989-Fees",
        "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program",
        "https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations",
        "https://support.deribit.com/hc/en-us/articles/25944811317149-Margin-types-and-usage",
        "https://docs.deribit.com/"
      ],
      "relatedLinks": [
        "/topics/derivatives#perp-cost-field-dictionary",
        "/topics/tokenized-stocks-vs-perpetuals",
        "/compare/hyperliquid-vs-dydx"
      ],
      "directAnswer": {
        "question": "什么情况下适合继续打开 Deribit？",
        "answer": "当用户明确在研究期权、交割合约、永续、API 执行或专业衍生品风险控制时，Deribit 才是强相关下一页。Deribit 文档覆盖 WebSocket、HTTP 和 FIX 接口；把自动化策略迁移到生产环境前，应确认测试与生产环境。如果只是简单现货入金，Deribit 档案更多是背景，不是最短路径。",
        "citations": [
          "https://docs.deribit.com/"
        ]
      },
      "faq": [
        [
          "Deribit affiliate 来源支持什么用户权益？",
          "已引用的 Deribit affiliate 页面支持合资格受邀用户前六个月 10% 交易手续费折扣，适用于覆盖的 DRB Panama 路径。页面同时说明 Deribit FZE 账户不在该 affiliate 设置内、现货不适用，地区资格仍需在官方账户流程里核对。",
          [
            "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"
          ]
        ],
        [
          "交易 Deribit 期权前要看哪些成本？",
          "期权要比较期权费用规则、页面列出的权利金上限、结算或交割成本、保证金模式、来源支持的用户折扣和清算路径。合约、永续或现货费率不能说明完整期权成本。",
          [
            "https://support.deribit.com/hc/en-us/articles/25944746248989-Fees",
            "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"
          ]
        ],
        [
          "Deribit 清算风险应该怎么理解？",
          "Deribit 说明其采用增量自动清算，并且清算期间用户不能控制账户。清算费用、保证金使用率、抵押模式和组合保证金下的对冲处理，都应作为独立风险检查。",
          [
            "https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations",
            "https://support.deribit.com/hc/en-us/articles/25944811317149-Margin-types-and-usage"
          ]
        ],
        [
          "Deribit affiliate 迁移日期之后有什么变化？",
          "按已引用公告处理：2026-09-09 是停止创建新 affiliate 的日期，2027-01-01 是旧 affiliate 链接停止用于新用户归因开户的日期。旧页面仍可读取，不等于实体、地区和归因仍然有效。",
          [
            "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"
          ]
        ]
      ]
    },
    "zh-Hant": {
      "title": "Deribit 期權費用、10% 用戶折扣、遷移日期與實體檢查",
      "description": "Deribit 決策清單，區分期權、合約費用、前六個月 10% 用戶折扣、DRB Panama/FZE 實體、現貨排除、遷移日期、保證金與清算邊界。",
      "reviewedAt": "2026-09-29",
      "sourceUrls": [
        "https://support.deribit.com/hc/en-us/articles/25944746248989-Fees",
        "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program",
        "https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations",
        "https://support.deribit.com/hc/en-us/articles/25944811317149-Margin-types-and-usage",
        "https://docs.deribit.com/"
      ],
      "relatedLinks": [
        "/topics/derivatives#perp-cost-field-dictionary",
        "/topics/tokenized-stocks-vs-perpetuals",
        "/compare/hyperliquid-vs-dydx"
      ],
      "directAnswer": {
        "question": "什麼情況下適合繼續打開 Deribit？",
        "answer": "當用戶明確在研究期權、交割合約、永續、API 執行或專業衍生品風險控制時，Deribit 才是強相關下一頁。Deribit 文件涵蓋 WebSocket、HTTP 和 FIX 介面；把自動化策略遷移到生產環境前，應確認測試與生產環境。如果只是簡單現貨入金，Deribit 檔案更多是背景，不是最短路徑。",
        "citations": [
          "https://docs.deribit.com/"
        ]
      },
      "faq": [
        [
          "Deribit affiliate 來源支援什麼用戶權益？",
          "已引用的 Deribit affiliate 頁面支援合資格受邀用戶前六個月 10% 交易手續費折扣，適用於覆蓋的 DRB Panama 路徑。頁面同時說明 Deribit FZE 帳戶不在該 affiliate 設定內、現貨不適用，地區資格仍需在官方帳戶流程裡核對。",
          [
            "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"
          ]
        ],
        [
          "交易 Deribit 期權前要看哪些成本？",
          "期權要比較期權費用規則、頁面列出的權利金上限、結算或交割成本、保證金模式、來源支援的用戶折扣和清算路徑。合約、永續或現貨費率不能說明完整期權成本。",
          [
            "https://support.deribit.com/hc/en-us/articles/25944746248989-Fees",
            "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"
          ]
        ],
        [
          "Deribit 清算風險應該怎麼理解？",
          "Deribit 說明其採用增量自動清算，並且清算期間用戶不能控制帳戶。清算費用、保證金使用率、抵押模式和組合保證金下的對沖處理，都應作為獨立風險檢查。",
          [
            "https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations",
            "https://support.deribit.com/hc/en-us/articles/25944811317149-Margin-types-and-usage"
          ]
        ],
        [
          "Deribit affiliate 遷移日期之後有什麼變化？",
          "按已引用公告處理：2026-09-09 是停止建立新 affiliate 的日期，2027-01-01 是舊 affiliate 連結停止用於新用戶歸因開戶的日期。舊頁面仍可讀取，不等於實體、地區和歸因仍然有效。",
          [
            "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program"
          ]
        ]
      ]
    }
  }
};
const PRIORITY_COMPARE_SEO = {
  "binance-vs-okx": {
    "en": {
      "title": "Binance vs OKX: Fees, Products, KYC and Web3 Access Checks — NexuAlpha",
      "completeFaq": true,
      "description": "Compare Binance and OKX by published fee tables, spot and derivatives product scope, identity requirements, Web3 or DEX-style access and account eligibility.",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "How should I compare Binance and OKX before choosing an exchange?",
        "answer": "Compare Binance and OKX by their official fee tables, product-specific availability, identity requirements, regional restrictions, Web3 or DEX-style access paths and announcement sources. Do not treat either public comparison as a current account entitlement, fee guarantee or eligibility decision."
      },
      "faq": [
        [
          "Is Binance vs OKX mainly a fee comparison?",
          "Fees matter, but the safer comparison also checks product scope, KYC, regional eligibility, Web3 wallet or DEX-style routing, official announcements and the source date for each claim."
        ],
        [
          "Can this page decide whether my account can trade a product?",
          "No. It can narrow what to verify. Final access depends on the current official account flow, user region, verification status, product rules and platform terms."
        ]
      ],
      "relatedLinks": [
        "/exchanges/binance",
        "/exchanges/okx",
        "/topics/derivatives",
        "/factbook/binance",
        "/factbook/okx"
      ],
      "sourceUrls": [
        "https://www.binance.com/en/fee/trading",
        "https://www.binance.com/en/support/faq/detail/360027287111",
        "https://www.okx.com/fees",
        "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported"
      ]
    },
    "zh-Hans": null,
    "zh-Hant": null,
    "ja": {
      "title": "Binance vs OKX：手数料、商品、KYC、Web3 アクセス確認 — NexuAlpha",
      "completeFaq": true,
      "description": "Binance と OKX を公式手数料、商品範囲、本人確認、地域条件、Web3 ルート、口座資格の境界で比較します。",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "Binance と OKX は登録前にどう比較すべきですか？",
        "answer": "Binance と OKX は、公式手数料表、現物・デリバティブの商品範囲、本人確認、地域条件、法定通貨ルート、Web3 ウォレットや DEX 型導線、公式告知の新しさで比較します。公開比較はアカウント権利、手数料保証、地域資格、ユーザー特典を確定しません。"
      },
      "faq": [
        [
          "Binance vs OKX は主に手数料比較ですか？",
          "手数料は重要ですが、商品範囲、KYC、地域資格、Web3 ルート、公式告知、出典日も同時に確認する必要があります。"
        ],
        [
          "このページで自分のアカウントが商品を取引できるか分かりますか？",
          "いいえ。確認すべき項目を絞るページです。最終的な可否は地域、本人確認、商品ルール、公式アカウント条件で決まります。"
        ],
        [
          "登録ルートを開く前に何を確認しますか？",
          "公式ドメイン、必要な商品、手数料ソース、KYC 要件、地域条件を確認します。パートナー経路は承認や最終コストを保証しません。"
        ]
      ],
      "relatedLinks": [
        "/exchanges/binance",
        "/exchanges/okx",
        "/topics/derivatives",
        "/factbook/binance",
        "/factbook/okx"
      ],
      "sourceUrls": [
        "https://www.binance.com/en/fee/trading",
        "https://www.binance.com/en/support/faq/detail/360027287111",
        "https://www.okx.com/fees",
        "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported"
      ]
    },
    "ko": {
      "title": "Binance vs OKX: 수수료, 상품, KYC, Web3 접근 확인 — NexuAlpha",
      "completeFaq": true,
      "description": "Binance와 OKX를 공식 수수료, 상품 범위, 본인 확인, 지역 조건, Web3 경로와 계정 자격 경계로 비교하세요.",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "가입 전 Binance와 OKX를 어떻게 비교해야 하나요?",
        "answer": "Binance와 OKX는 공식 수수료표, 현물·파생상품 범위, 본인 확인, 지역 제한, 법정화폐 경로, Web3 지갑 또는 DEX형 접근, 공식 공지 출처로 비교해야 합니다. 공개 비교는 계정 권한, 수수료 보장, 지역 자격 또는 사용자 혜택을 확정하지 않습니다."
      },
      "faq": [
        [
          "Binance vs OKX는 주로 수수료 비교인가요?",
          "수수료는 중요하지만 상품 범위, KYC, 지역 자격, Web3 경로, 공식 공지, 출처 날짜도 함께 확인해야 합니다."
        ],
        [
          "이 페이지가 내 계정의 거래 가능 여부를 결정하나요?",
          "아니요. 확인해야 할 항목을 좁혀 줍니다. 최종 접근성은 지역, 인증 상태, 상품 규칙, 공식 계정 조건에 따라 달라집니다."
        ],
        [
          "가입 경로를 열기 전 무엇을 확인해야 하나요?",
          "공식 도메인, 필요한 상품, 수수료 출처, KYC 요구 사항, 지역 조건을 확인하세요. 파트너 경로는 승인이나 최종 비용을 보장하지 않습니다."
        ]
      ],
      "relatedLinks": [
        "/exchanges/binance",
        "/exchanges/okx",
        "/topics/derivatives",
        "/factbook/binance",
        "/factbook/okx"
      ],
      "sourceUrls": [
        "https://www.binance.com/en/fee/trading",
        "https://www.binance.com/en/support/faq/detail/360027287111",
        "https://www.okx.com/fees",
        "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported"
      ]
    },
    "tr": {
      "title": "Binance vs OKX: ücret, ürün, KYC ve Web3 erişim kontrolleri — NexuAlpha",
      "completeFaq": true,
      "description": "Binance ve OKX'i resmi ücretler, ürün kapsamı, kimlik doğrulama, bölgesel koşullar, Web3 rotası ve hesap uygunluğu sınırlarıyla karşılaştırın.",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "Kayıt öncesi Binance ve OKX nasıl karşılaştırılmalı?",
        "answer": "Binance ve OKX; resmi ücret tabloları, spot ve türev ürün kapsamı, kimlik doğrulama, bölgesel koşullar, fiat rotaları, Web3 cüzdanı veya DEX benzeri erişim ve resmi duyuru kaynaklarıyla karşılaştırılmalıdır. Açık karşılaştırma hesap hakkı, ücret garantisi, bölgesel uygunluk veya kullanıcı avantajı doğrulamaz."
      },
      "faq": [
        [
          "Binance vs OKX temelde ücret karşılaştırması mı?",
          "Ücretler önemlidir, ancak ürün kapsamı, KYC, bölgesel uygunluk, Web3 rotası, resmi duyurular ve kaynak tarihi de kontrol edilmelidir."
        ],
        [
          "Bu sayfa hesabımın bir ürünü kullanıp kullanamayacağını belirler mi?",
          "Hayır. Sadece kontrol edilmesi gereken alanları daraltır. Nihai erişim resmi hesap akışı, bölge, doğrulama durumu, ürün kuralları ve platform şartlarına bağlıdır."
        ],
        [
          "Kayıt rotasını açmadan önce ne doğrulanmalı?",
          "Resmi domain, gerekli ürün, ücret kaynağı, KYC koşulu ve bölgesel şartlar kontrol edilmelidir. Partner rotası onay veya nihai maliyet garantisi değildir."
        ]
      ],
      "relatedLinks": [
        "/exchanges/binance",
        "/exchanges/okx",
        "/topics/derivatives",
        "/factbook/binance",
        "/factbook/okx"
      ],
      "sourceUrls": [
        "https://www.binance.com/en/fee/trading",
        "https://www.binance.com/en/support/faq/detail/360027287111",
        "https://www.okx.com/fees",
        "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported"
      ]
    },
    "pt-BR": {
      "title": "Binance vs OKX: taxas, produtos, KYC e acesso Web3 — NexuAlpha",
      "completeFaq": true,
      "description": "Compare Binance e OKX por taxas oficiais, escopo spot e derivativos, identidade, condições regionais, acesso Web3 e limites de elegibilidade da conta.",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "Como comparar Binance e OKX antes de escolher uma exchange?",
        "answer": "Compare Binance e OKX por tabelas oficiais de taxa, disponibilidade por produto, verificação de identidade, restrições regionais, rotas fiat, acesso Web3 ou estilo DEX e fontes de anúncio. Uma comparação pública não confirma direito de conta, custo final, elegibilidade regional ou benefício do usuário."
      },
      "faq": [
        [
          "Binance vs OKX é principalmente uma comparação de taxas?",
          "Taxas importam, mas a decisão segura também verifica escopo de produto, KYC, elegibilidade regional, rota Web3, anúncios oficiais e data das fontes."
        ],
        [
          "Esta página decide se minha conta pode operar um produto?",
          "Não. Ela reduz o que deve ser verificado. O acesso final depende do fluxo oficial da conta, região, status de verificação, regras do produto e termos da plataforma."
        ],
        [
          "O que revisar antes de abrir a rota de cadastro?",
          "Confira domínio oficial, produto necessário, fonte de taxa, exigência de KYC e condições regionais. Uma rota parceira não confirma aprovação nem custo final."
        ]
      ],
      "relatedLinks": [
        "/exchanges/binance",
        "/exchanges/okx",
        "/topics/derivatives",
        "/factbook/binance",
        "/factbook/okx"
      ],
      "sourceUrls": [
        "https://www.binance.com/en/fee/trading",
        "https://www.binance.com/en/support/faq/detail/360027287111",
        "https://www.okx.com/fees",
        "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported"
      ]
    }
  },
  "bybit-vs-bitget": {
    "en": {
      "title": "Bybit vs Bitget Stocks, Copy Trading, Fees and Account Checks — NexuAlpha",
      "completeFaq": true,
      "description": "Compare Bybit and Bitget by product label first: UTA margin, xStocks fee schedule, stock futures, copy-trading profit sharing, KYC, region and signup limits.",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "How should I compare Bybit and Bitget before choosing a platform?",
        "answer": "Start by labeling the user path: ordinary crypto futures, xStocks-style exposure, stock futures, copy trading, UTA or a first-time account route. Bybit xStocks, Bybit TradFi derivatives, Bitget stock futures, Bitget stock-product pages, UTA margin and crypto copy trading are different paths. Compare the product-specific official fee table first: xStocks uses the Adventure Zone & xStocks schedule, not ordinary crypto spot fees; copy trading needs the profit-sharing rules and the selected trader/account page."
      },
      "faq": [
        [
          "Does Bybit vs Bitget mean real stocks are available?",
          "No. Separate ordinary securities, tokenized exposure, stock futures, stock-product pages, copy trading and regional account permissions before treating a stock-related search as an eligible route."
        ],
        [
          "Which fees should I compare first?",
          "Start with the product-specific official table. Bybit xStocks follow the Adventure Zone & xStocks fee schedule, not the ordinary crypto spot row; copy trading also needs the selected trader's profit-sharing rules and account display."
        ],
        [
          "How should I compare Bybit and Bitget UTA accounts?",
          "Do not compare the UTA label alone. Bybit documents spot, spot margin, perpetuals, futures and options plus isolated, cross and portfolio-margin behavior; Bitget documents spot, margin and futures sharing a multi-asset margin pool. Check the live account mode, supported collateral, collateral valuation, borrowing, interest and liquidation rules in the official account before moving funds."
        ],
        [
          "Which account conditions can change the result?",
          "Identity checks, issuing country or region, product permission, account tier, lead-trader rules and official account terms can change the practical route."
        ],
        [
          "What should I verify before leaving NexuAlpha?",
          "Confirm the product label, source date, fee tier, KYC requirement and account route on the official platform. A public comparison is a checklist, not approval or a benefit promise."
        ]
      ],
      "relatedLinks": [
        "/exchanges/bybit",
        "/exchanges/bitget",
        "/topics/derivatives",
        "/topics/tokenized-stocks-vs-perpetuals",
        "/topics/tokenized-assets",
        "/factbook/bybit",
        "/factbook/bitget"
      ],
      "sourceUrls": [
        "https://www.bybit.com/en/help-center/article/FAQ-xStocks-on-Bybit",
        "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
        "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
        "https://www.bybit.com/en/help-center/article/Copy-Trading-Profit-Sharing-Explained",
        "https://www.bybit.com/en/help-center/article/Unified-Trading-Account-Asset-Page",
        "https://www.bybit.com/en/help-center/article/FAQ-Unified-Trading-Account",
        "https://www.bitget.com/support/articles/7700532076057",
        "https://www.bitget.com/support/articles/12560603892733",
        "https://www.bitget.com/support/articles/12560603892734",
        "https://www.bitget.com/support/articles/12560603817155",
        "https://www.bitget.com/support/articles/12560603795184",
        "https://www.bitget.com/support/articles/9083311039641",
        "https://www.bitget.com/support/articles/12560603885783",
        "https://www.bitget.com/support/articles/12560603890654"
      ]
    },
    "zh-Hans": {
      "title": "Bybit vs Bitget UTA、股票类产品、跟单、费用与账户检查 — NexuAlpha",
      "completeFaq": true,
      "description": "比较 Bybit 与 Bitget 时先确认产品标签：UTA 保证金、xStocks 费率、股票期货、跟单分润、费用、资金费、KYC 与开户注册路径限制。",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "选择平台前应该怎样比较 Bybit 与 Bitget？",
        "answer": "先给产品贴准标签。Bybit xStocks、Bybit TradFi 衍生品、Bitget 股票期货、Bitget 股票相关产品页面和加密跟单，是不同路径。先看具体产品的官方费率表：xStocks 走 Adventure Zone & xStocks 费率，不套普通加密现货费率；跟单还要看分润规则和所选交易员/账户页面。"
      },
      "faq": [
        [
          "Bybit vs Bitget 是否代表可以买真实股票？",
          "不是。先区分普通证券、代币化敞口、股票期货、股票相关产品页面、跟单和地区账户权限，再判断是否适合继续。"
        ],
        [
          "应该先比较哪些费用？",
          "先看具体产品的官方费率表。Bybit xStocks 使用 Adventure Zone & xStocks 费率，不是普通加密现货费率；跟单还要看所选交易员的分润规则和账户页面。"
        ],
        [
          "Bybit 与 Bitget 的 UTA 应该怎样比较？",
          "不要只比较 UTA 名称。Bybit 官方资料覆盖现货、现货杠杆、永续、交割和期权，并区分逐仓、全仓与组合保证金；Bitget 官方资料说明现货、杠杆和合约共用多资产保证金池。转入资金前，应在官方登录账户核对实际模式、支持抵押品、抵押估值、借贷利息和清算规则。"
        ],
        [
          "哪些账户条件会改变结果？",
          "身份认证、证件签发国家或地区、产品权限、账户等级、带单规则和官方账户条款，都会改变实际路径。"
        ],
        [
          "离开 NexuAlpha 前要确认什么？",
          "先在官方平台确认产品名称、来源日期、费率等级、KYC 要求和账户路径。公开对比是检查清单，不是批准或权益承诺。"
        ]
      ],
      "relatedLinks": [
        "/exchanges/bybit",
        "/exchanges/bitget",
        "/topics/tokenized-stocks-vs-perpetuals",
        "/factbook/bybit",
        "/factbook/bitget"
      ],
      "sourceUrls": [
        "https://www.bybit.com/en/help-center/article/FAQ-xStocks-on-Bybit",
        "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
        "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
        "https://www.bybit.com/en/help-center/article/Copy-Trading-Profit-Sharing-Explained",
        "https://www.bybit.com/en/help-center/article/Unified-Trading-Account-Asset-Page",
        "https://www.bybit.com/en/help-center/article/FAQ-Unified-Trading-Account",
        "https://www.bitget.com/support/articles/7700532076057",
        "https://www.bitget.com/support/articles/12560603892733",
        "https://www.bitget.com/support/articles/12560603892734",
        "https://www.bitget.com/support/articles/12560603817155",
        "https://www.bitget.com/support/articles/12560603795184",
        "https://www.bitget.com/support/articles/9083311039641",
        "https://www.bitget.com/support/articles/12560603885783",
        "https://www.bitget.com/support/articles/12560603890654"
      ]
    },
    "zh-Hant": {
      "title": "Bybit vs Bitget UTA、股票類產品、跟單、費用與帳戶檢查 — NexuAlpha",
      "completeFaq": true,
      "description": "比較 Bybit 與 Bitget 時先確認產品標籤：UTA 保證金、xStocks 費率、股票期貨、跟單分潤、費用、資金費、KYC 與開戶註冊路徑限制。",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "選擇平台前應該怎樣比較 Bybit 與 Bitget？",
        "answer": "先給產品貼準標籤。Bybit xStocks、Bybit TradFi 衍生品、Bitget 股票期貨、Bitget 股票相關產品頁面和加密跟單，是不同路徑。先看具體產品的官方費率表：xStocks 走 Adventure Zone & xStocks 費率，不套普通加密現貨費率；跟單還要看分潤規則和所選交易員/帳戶頁面。"
      },
      "faq": [
        [
          "Bybit vs Bitget 是否代表可以買真實股票？",
          "不是。先區分普通證券、代幣化敞口、股票期貨、股票相關產品頁面、跟單和地區帳戶權限，再判斷是否適合繼續。"
        ],
        [
          "應該先比較哪些費用？",
          "先看具體產品的官方費率表。Bybit xStocks 使用 Adventure Zone & xStocks 費率，不是普通加密現貨費率；跟單還要看所選交易員的分潤規則和帳戶頁面。"
        ],
        [
          "Bybit 與 Bitget 的 UTA 應該怎樣比較？",
          "不要只比較 UTA 名稱。Bybit 官方資料覆蓋現貨、現貨槓桿、永續、交割和期權，並區分逐倉、全倉與組合保證金；Bitget 官方資料說明現貨、槓桿和合約共用多資產保證金池。轉入資金前，應在官方登入帳戶核對實際模式、支援抵押品、抵押估值、借貸利息和清算規則。"
        ],
        [
          "哪些帳戶條件會改變結果？",
          "身份認證、證件簽發國家或地區、產品權限、帳戶等級、帶單規則和官方帳戶條款，都會改變實際路徑。"
        ],
        [
          "離開 NexuAlpha 前要確認什麼？",
          "先在官方平台確認產品名稱、來源日期、費率等級、KYC 要求和帳戶路徑。公開對比是檢查清單，不是批准或權益承諾。"
        ]
      ],
      "relatedLinks": [
        "/exchanges/bybit",
        "/exchanges/bitget",
        "/topics/tokenized-stocks-vs-perpetuals",
        "/factbook/bybit",
        "/factbook/bitget"
      ],
      "sourceUrls": [
        "https://www.bybit.com/en/help-center/article/FAQ-xStocks-on-Bybit",
        "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
        "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
        "https://www.bybit.com/en/help-center/article/Copy-Trading-Profit-Sharing-Explained",
        "https://www.bybit.com/en/help-center/article/Unified-Trading-Account-Asset-Page",
        "https://www.bybit.com/en/help-center/article/FAQ-Unified-Trading-Account",
        "https://www.bitget.com/support/articles/7700532076057",
        "https://www.bitget.com/support/articles/12560603892733",
        "https://www.bitget.com/support/articles/12560603892734",
        "https://www.bitget.com/support/articles/12560603817155",
        "https://www.bitget.com/support/articles/12560603795184",
        "https://www.bitget.com/support/articles/9083311039641",
        "https://www.bitget.com/support/articles/12560603885783",
        "https://www.bitget.com/support/articles/12560603890654"
      ]
    },
    "ja": {
      "title": "Bybit vs Bitget：株式型商品、コピー取引、手数料と口座確認 — NexuAlpha",
      "completeFaq": true,
      "description": "Bybit と Bitget を商品ラベル、xStocks、株式先物、コピー取引、手数料、KYC、地域条件、登録画面で比較します。",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "登録前に Bybit と Bitget をどう比較すべきですか？",
        "answer": "まずユーザーの目的を通常の暗号資産デリバティブ、xStocks 型エクスポージャー、株式先物、コピー取引、初回口座開設ルートに分けます。Bybit xStocks、Bybit TradFi デリバティブ、Bitget 株式先物、Bitget の株式関連ページ、暗号資産コピー取引は同じ経路ではありません。公式の商品別手数料表、KYC、地域条件、実際の登録画面を確認してから進めてください。"
      },
      "faq": [
        [
          "Bybit vs Bitget は実際の株式を買えるという意味ですか？",
          "いいえ。証券、トークン化エクスポージャー、株式先物、コピー取引、地域別アカウント権限を分けて確認してください。"
        ],
        [
          "最初に比較すべき手数料は何ですか？",
          "商品別の公式手数料表です。xStocks、先物、コピー取引は普通の暗号資産現物手数料だけでは判断できません。"
        ],
        [
          "Bybit と Bitget の UTA は同じですか？",
          "いいえ。名称は似ていますが、担保、証拠金、借入、清算、商品権限は異なります。資金移動前に公式アカウントで確認してください。"
        ]
      ],
      "relatedLinks": [
        "/exchanges/bybit",
        "/exchanges/bitget",
        "/topics/tokenized-stocks-vs-perpetuals",
        "/factbook/bybit",
        "/factbook/bitget"
      ],
      "sourceUrls": [
        "https://www.bybit.com/en/help-center/article/FAQ-xStocks-on-Bybit",
        "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
        "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
        "https://www.bybit.com/en/help-center/article/Copy-Trading-Profit-Sharing-Explained",
        "https://www.bybit.com/en/help-center/article/Unified-Trading-Account-Asset-Page",
        "https://www.bybit.com/en/help-center/article/FAQ-Unified-Trading-Account",
        "https://www.bitget.com/support/articles/7700532076057",
        "https://www.bitget.com/support/articles/12560603892733",
        "https://www.bitget.com/support/articles/12560603892734",
        "https://www.bitget.com/support/articles/12560603817155",
        "https://www.bitget.com/support/articles/12560603795184",
        "https://www.bitget.com/support/articles/9083311039641",
        "https://www.bitget.com/support/articles/12560603885783",
        "https://www.bitget.com/support/articles/12560603890654"
      ]
    },
    "ko": {
      "title": "Bybit vs Bitget: 수수료, 카피트레이딩과 주식형 노출 확인 — NexuAlpha",
      "completeFaq": true,
      "description": "Bybit과 Bitget의 수수료, 파생상품, 카피트레이딩, xStocks 또는 주식 선물 노출, KYC, 지역 접근성과 가입 조건을 비교하세요.",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "가입 전에 Bybit과 Bitget을 어떻게 비교해야 하나요?",
        "answer": "Bybit과 Bitget은 공개 수수료표, 파생상품 도구, 카피트레이딩 흐름, 주식형 노출 경계, KYC, 지역 이용 가능성, 공식 가입 조건으로 비교해야 합니다. 주식 관련 검색은 공식 계정 경로를 열기 전 현재 계정 조건으로 다시 확인하세요."
      },
      "faq": [
        [
          "Bybit vs Bitget 비교가 실제 주식 거래 가능성을 뜻하나요?",
          "아니요. 실제 증권, 토큰형 노출, 주식 선물, 카피트레이딩 상품과 지역 계정 가능성을 분리해서 확인해야 합니다."
        ],
        [
          "어떤 수수료를 먼저 비교해야 하나요?",
          "상품별 공식 수수료표부터 보세요. xStocks, futures, 카피트레이딩은 일반 암호화폐 spot 수수료만으로 판단할 수 없습니다."
        ],
        [
          "Bybit과 Bitget UTA는 어떻게 비교해야 하나요?",
          "UTA 명칭만 비교하지 마세요. 담보, 마진 모드, 차입, 이자, 청산 규칙과 상품 권한을 공식 계정에서 확인해야 합니다."
        ],
        [
          "카피트레이딩 등록 경로 전 무엇을 확인해야 하나요?",
          "KYC 수준, 지역, 상품 권한, 수수료표, lead trader 규칙과 공식 가입 조건을 확인하세요. 공개 비교는 동일한 접근성을 보장하지 않습니다."
        ]
      ],
      "relatedLinks": [
        "/exchanges/bybit",
        "/exchanges/bitget",
        "/topics/tokenized-stocks-vs-perpetuals",
        "/factbook/bybit",
        "/factbook/bitget"
      ],
      "sourceUrls": [
        "https://www.bybit.com/en/help-center/article/FAQ-xStocks-on-Bybit",
        "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
        "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
        "https://www.bybit.com/en/help-center/article/Copy-Trading-Profit-Sharing-Explained",
        "https://www.bybit.com/en/help-center/article/Unified-Trading-Account-Asset-Page",
        "https://www.bybit.com/en/help-center/article/FAQ-Unified-Trading-Account",
        "https://www.bitget.com/support/articles/7700532076057",
        "https://www.bitget.com/support/articles/12560603892733",
        "https://www.bitget.com/support/articles/12560603892734",
        "https://www.bitget.com/support/articles/12560603817155",
        "https://www.bitget.com/support/articles/12560603795184",
        "https://www.bitget.com/support/articles/9083311039641",
        "https://www.bitget.com/support/articles/12560603885783",
        "https://www.bitget.com/support/articles/12560603890654"
      ]
    },
    "tr": {
      "title": "Bybit vs Bitget: ücretler, copy trading ve hisse benzeri ürün kontrolleri — NexuAlpha",
      "completeFaq": true,
      "description": "Bybit ve Bitget ücretlerini, türevleri, copy trading'i, xStocks veya stock futures maruziyetini, KYC'yi, bölgesel erişimi ve kayıt koşullarını karşılaştırın.",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "Kayıt olmadan önce Bybit ve Bitget nasıl karşılaştırılmalı?",
        "answer": "Bybit ve Bitget; yayımlanmış ücret çizelgeleri, türev araçları, copy trading akışı, hisse benzeri ürün sınırları, KYC, bölgesel uygunluk ve resmi kayıt koşullarıyla karşılaştırılmalıdır. Hisseyle ilgili bir arama, resmî hesap rotası açılmadan önce güncel hesap koşullarıyla kontrol edilmelidir."
      },
      "faq": [
        [
          "Bybit vs Bitget gerçek hisse erişimi anlamına gelir mi?",
          "Hayır. Gerçek menkul kıymet, tokenized exposure, stock futures, copy trading ürünü ve bölgesel hesap erişimi ayrı ayrı kontrol edilmelidir."
        ],
        [
          "Önce hangi ücretler karşılaştırılmalı?",
          "Ürün özel resmi ücret çizelgesiyle başlayın. xStocks, futures ve copy trading, normal kripto spot ücretleriyle tek başına değerlendirilemez."
        ],
        [
          "Bybit ve Bitget UTA nasıl karşılaştırılmalı?",
          "Sadece UTA adını karşılaştırmayın. Teminat, marjin modu, borçlanma, faiz, likidasyon ve ürün izinleri resmi hesapta kontrol edilmelidir."
        ],
        [
          "Copy trading registration route'sı öncesi hangi kontroller gerekir?",
          "KYC seviyesi, bölge, ürün izinleri, ücret çizelgesi, lead trader kuralları ve resmi kayıt koşulları kontrol edilmelidir."
        ]
      ],
      "relatedLinks": [
        "/exchanges/bybit",
        "/exchanges/bitget",
        "/topics/tokenized-stocks-vs-perpetuals",
        "/factbook/bybit",
        "/factbook/bitget"
      ],
      "sourceUrls": [
        "https://www.bybit.com/en/help-center/article/FAQ-xStocks-on-Bybit",
        "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
        "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
        "https://www.bybit.com/en/help-center/article/Copy-Trading-Profit-Sharing-Explained",
        "https://www.bybit.com/en/help-center/article/Unified-Trading-Account-Asset-Page",
        "https://www.bybit.com/en/help-center/article/FAQ-Unified-Trading-Account",
        "https://www.bitget.com/support/articles/7700532076057",
        "https://www.bitget.com/support/articles/12560603892733",
        "https://www.bitget.com/support/articles/12560603892734",
        "https://www.bitget.com/support/articles/12560603817155",
        "https://www.bitget.com/support/articles/12560603795184",
        "https://www.bitget.com/support/articles/9083311039641",
        "https://www.bitget.com/support/articles/12560603885783",
        "https://www.bitget.com/support/articles/12560603890654"
      ]
    },
    "pt-BR": {
      "title": "Bybit vs Bitget: ações tokenizadas, copy trading, taxas e conta — NexuAlpha",
      "completeFaq": true,
      "description": "Compare Bybit e Bitget por rótulo do produto: xStocks, stock futures, copy trading, taxas, funding, KYC, região e limites da rota de conta.",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "Como comparar Bybit e Bitget antes de escolher uma plataforma?",
        "answer": "Comece nomeando a rota: futures cripto comuns, exposição estilo xStocks, stock futures, copy trading ou primeira conta. Bybit xStocks, derivativos TradFi da Bybit, stock futures da Bitget, páginas de produtos de ações da Bitget e copy trading cripto são caminhos diferentes. Compare primeiro a tabela oficial específica do produto, KYC, região e a tela oficial de cadastro."
      },
      "faq": [
        [
          "Bybit vs Bitget significa que ações reais estão disponíveis?",
          "Não. Separe valores mobiliários, exposição tokenizada, stock futures, páginas de produto, copy trading e permissões regionais da conta."
        ],
        [
          "Quais taxas comparar primeiro?",
          "Comece pela tabela oficial específica do produto. xStocks, futures e copy trading não podem ser avaliados apenas pela taxa spot cripto comum."
        ],
        [
          "Como comparar contas UTA de Bybit e Bitget?",
          "Não compare só o rótulo UTA. Verifique colateral, modo de margem, empréstimo, juros, liquidação e permissões de produto na conta oficial."
        ],
        [
          "O que verificar antes de sair da NexuAlpha?",
          "Confirme produto, data da fonte, nível de taxa, KYC e rota da conta na plataforma oficial. A comparação pública é checklist, não aprovação."
        ]
      ],
      "relatedLinks": [
        "/exchanges/bybit",
        "/exchanges/bitget",
        "/topics/tokenized-stocks-vs-perpetuals",
        "/factbook/bybit",
        "/factbook/bitget"
      ],
      "sourceUrls": [
        "https://www.bybit.com/en/help-center/article/FAQ-xStocks-on-Bybit",
        "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
        "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
        "https://www.bybit.com/en/help-center/article/Copy-Trading-Profit-Sharing-Explained",
        "https://www.bybit.com/en/help-center/article/Unified-Trading-Account-Asset-Page",
        "https://www.bybit.com/en/help-center/article/FAQ-Unified-Trading-Account",
        "https://www.bitget.com/support/articles/7700532076057",
        "https://www.bitget.com/support/articles/12560603892733",
        "https://www.bitget.com/support/articles/12560603892734",
        "https://www.bitget.com/support/articles/12560603817155",
        "https://www.bitget.com/support/articles/12560603795184",
        "https://www.bitget.com/support/articles/9083311039641",
        "https://www.bitget.com/support/articles/12560603885783",
        "https://www.bitget.com/support/articles/12560603890654"
      ]
    }
  },
  "hyperliquid-vs-dydx": {
    "en": {
      "title": "Hyperliquid vs dYdX: Perp Fees, Funding, Liquidation and Access Checks — NexuAlpha",
      "completeFaq": true,
      "description": "Compare Hyperliquid and dYdX by fee schedules, funding, collateral, liquidation rules, oracle design, wallet signing, no-KYC access assumptions and official documentation.",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "How should I compare Hyperliquid and dYdX as crypto perpetual platforms?",
        "answer": "Compare Hyperliquid and dYdX by execution model, fee schedule, funding cadence, collateral, liquidation logic, oracle design, wallet-signing route, network dependency, regional limits and official documentation. A lower quoted cost or faster interface does not remove liquidation, bridge, outage or eligibility risk."
      },
      "faq": [
        [
          "Which risk check matters first on Hyperliquid vs dYdX?",
          "Start with collateral and liquidation. Confirm what asset backs the position, how margin is maintained, how liquidations are triggered, what oracle or price source is used and what happens if the wallet, network, indexer or front end is unavailable."
        ],
        [
          "Is Hyperliquid vs dYdX a no-KYC comparison?",
          "Only partly. Wallet connection can reduce account friction, but no-KYC access still depends on front-end availability, regional restrictions, sanctions controls, product rules, wallet screening and current official terms. Treat it as an access-risk comparison, not an eligibility promise."
        ],
        [
          "Should funding rates decide the platform choice?",
          "Funding is one input, not the whole decision. Compare funding cadence, maker and taker fees, liquidity, collateral movement, liquidation rules, oracle route, withdrawal path and operational recovery before choosing a perpetual venue."
        ],
        [
          "Should I read the news explainer or this comparison page?",
          "Use the news article for the dated source-reading explainer. Use this comparison page for the current decision checklist across fees, funding, collateral, liquidation, wallet route, account access and operational recovery."
        ],
        [
          "What dYdX onboarding detail belongs beside the fee comparison?",
          "Check dYdX onboarding, wallet screening, regional access, bridge route and withdrawal path beside fees and funding. Those source checks can change whether a wallet-connected route is usable before the trade cost is even relevant."
        ]
      ],
      "relatedLinks": [
        "/news/hyperliquid-vs-dydx",
        "/topics/no-kyc",
        "/topics/derivatives",
        "/exchanges/hyperliquid",
        "/exchanges/dydx"
      ],
      "sourceUrls": [
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
        "https://docs.dydx.xyz/concepts/onboarding-faqs",
        "https://docs.dydx.xyz/concepts/trading/rewards_fees_and_parameters"
      ]
    },
    "zh-Hans": null,
    "zh-Hant": null,
    "ja": {
      "title": "Hyperliquid vs dYdX：Perp 手数料、資金調達、清算、アクセス確認 — NexuAlpha",
      "completeFaq": true,
      "description": "Hyperliquid と dYdX を手数料、資金調達、担保、清算、オラクル、ウォレット署名、No-KYC 前提、公式ドキュメントで比較します。",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "暗号資産 Perp プラットフォームとして Hyperliquid と dYdX をどう比較すべきですか？",
        "answer": "Hyperliquid と dYdX は、実行モデル、手数料表、資金調達の頻度、担保、清算ロジック、オラクル設計、ウォレット署名、ネットワーク依存、地域制限、公式ドキュメントで比較します。表示コストが低い、または画面が速いことは、清算、ブリッジ、障害、地域資格のリスクを消しません。"
      },
      "faq": [
        [
          "Hyperliquid vs dYdX で最初に見るリスクは何ですか？",
          "担保と清算です。どの資産がポジションを支え、証拠金がどう維持され、どの価格ソースで清算されるかを確認します。"
        ],
        [
          "Hyperliquid vs dYdX は No-KYC 比較ですか？",
          "一部だけです。ウォレット接続でも地域制限、スクリーニング、商品ルール、公式条件は残ります。"
        ],
        [
          "資金調達率だけで選べますか？",
          "いいえ。資金調達は一要素です。手数料、流動性、担保移動、清算、オラクル、出金と復旧を合わせて比較します。"
        ]
      ],
      "relatedLinks": [
        "/news/hyperliquid-vs-dydx",
        "/topics/no-kyc",
        "/topics/derivatives",
        "/exchanges/hyperliquid",
        "/exchanges/dydx"
      ],
      "sourceUrls": [
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
        "https://docs.dydx.xyz/concepts/onboarding-faqs",
        "https://docs.dydx.xyz/concepts/trading/rewards_fees_and_parameters"
      ]
    },
    "ko": {
      "title": "Hyperliquid vs dYdX: perp 수수료, funding, 청산과 접근 확인 — NexuAlpha",
      "completeFaq": true,
      "description": "Hyperliquid와 dYdX를 수수료, funding, 담보, 청산 규칙, oracle, 지갑 서명, No-KYC 가정과 공식 문서로 비교하세요.",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "암호화폐 perpetual 플랫폼으로 Hyperliquid와 dYdX를 어떻게 비교해야 하나요?",
        "answer": "Hyperliquid와 dYdX는 실행 모델, 수수료표, funding 주기, 담보, 청산 로직, oracle 설계, 지갑 서명 경로, 네트워크 의존성, 지역 제한, 공식 문서로 비교해야 합니다. 낮은 표시 비용이나 빠른 인터페이스가 청산, 브리지, 장애, 지역 자격 리스크를 없애지는 않습니다."
      },
      "faq": [
        [
          "Hyperliquid vs dYdX에서 먼저 볼 리스크는 무엇인가요?",
          "담보와 청산입니다. 어떤 자산이 포지션을 뒷받침하고, 마진이 어떻게 유지되며, 어떤 가격 소스로 청산되는지 확인하세요."
        ],
        [
          "Hyperliquid vs dYdX는 No-KYC 비교인가요?",
          "부분적으로만 그렇습니다. 지갑 연결이라도 지역 제한, 스크리닝, 상품 규칙, 공식 조건은 남아 있습니다."
        ],
        [
          "Funding rate만으로 선택해도 되나요?",
          "아니요. funding은 하나의 입력입니다. 수수료, 유동성, 담보 이동, 청산, oracle, 출금과 복구를 함께 비교하세요."
        ]
      ],
      "relatedLinks": [
        "/news/hyperliquid-vs-dydx",
        "/topics/no-kyc",
        "/topics/derivatives",
        "/exchanges/hyperliquid",
        "/exchanges/dydx"
      ],
      "sourceUrls": [
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
        "https://docs.dydx.xyz/concepts/onboarding-faqs",
        "https://docs.dydx.xyz/concepts/trading/rewards_fees_and_parameters"
      ]
    },
    "tr": {
      "title": "Hyperliquid vs dYdX: perp ücretleri, funding, likidasyon ve erişim — NexuAlpha",
      "completeFaq": true,
      "description": "Hyperliquid ve dYdX'i ücretler, funding, teminat, likidasyon kuralları, oracle, cüzdan imzası, No-KYC varsayımı ve resmi belgelerle karşılaştırın.",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "Kripto perpetual platformu olarak Hyperliquid ve dYdX nasıl karşılaştırılmalı?",
        "answer": "Hyperliquid ve dYdX; yürütme modeli, ücret çizelgesi, funding sıklığı, teminat, likidasyon mantığı, oracle tasarımı, cüzdan imzalama rotası, ağ bağımlılığı, bölgesel sınırlar ve resmi belgelerle karşılaştırılmalıdır. Daha düşük görünen maliyet veya hızlı arayüz likidasyon, köprü, kesinti ya da uygunluk riskini kaldırmaz."
      },
      "faq": [
        [
          "Hyperliquid vs dYdX'te ilk risk kontrolü nedir?",
          "Teminat ve likidasyondur. Pozisyonu hangi varlık destekliyor, marjin nasıl korunuyor ve hangi fiyat kaynağıyla likidasyon tetikleniyor kontrol edilmelidir."
        ],
        [
          "Hyperliquid vs dYdX bir No-KYC karşılaştırması mı?",
          "Kısmen. Cüzdan bağlantısı hesap sürtünmesini azaltabilir, fakat bölge, tarama, ürün kuralları ve resmi şartlar devam eder."
        ],
        [
          "Funding rate platform seçimini belirler mi?",
          "Hayır. Funding sadece bir girdidir. Ücret, likidite, teminat hareketi, likidasyon, oracle, çekim ve kurtarma birlikte karşılaştırılmalıdır."
        ]
      ],
      "relatedLinks": [
        "/news/hyperliquid-vs-dydx",
        "/topics/no-kyc",
        "/topics/derivatives",
        "/exchanges/hyperliquid",
        "/exchanges/dydx"
      ],
      "sourceUrls": [
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
        "https://docs.dydx.xyz/concepts/onboarding-faqs",
        "https://docs.dydx.xyz/concepts/trading/rewards_fees_and_parameters"
      ]
    },
    "pt-BR": {
      "title": "Hyperliquid vs dYdX: taxas perp, funding, liquidação e acesso — NexuAlpha",
      "completeFaq": true,
      "description": "Compare Hyperliquid e dYdX por taxas, funding, colateral, liquidação, oracle, assinatura de carteira, premissas no-KYC e documentação oficial.",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "Como comparar Hyperliquid e dYdX como plataformas perp cripto?",
        "answer": "Compare Hyperliquid e dYdX por modelo de execução, tabela de taxas, cadência de funding, colateral, lógica de liquidação, oracle, rota de assinatura da carteira, dependência de rede, limites regionais e documentação oficial. Custo aparente menor ou interface mais rápida não remove risco de liquidação, bridge, indisponibilidade ou elegibilidade."
      },
      "faq": [
        [
          "Qual risco vem primeiro em Hyperliquid vs dYdX?",
          "Comece por colateral e liquidação. Confirme o ativo que sustenta a posição, manutenção da margem, gatilhos e fonte de preço."
        ],
        [
          "Hyperliquid vs dYdX é uma comparação no-KYC?",
          "Apenas em parte. Conexão de carteira pode reduzir fricção, mas acesso depende de região, triagem, regras do produto e termos oficiais atuais."
        ],
        [
          "Funding rate decide a escolha?",
          "Não. Funding é um fator. Compare taxas, liquidez, movimento de colateral, liquidação, oracle, saque e recuperação operacional."
        ]
      ],
      "relatedLinks": [
        "/news/hyperliquid-vs-dydx",
        "/topics/no-kyc",
        "/topics/derivatives",
        "/exchanges/hyperliquid",
        "/exchanges/dydx"
      ],
      "sourceUrls": [
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
        "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
        "https://docs.dydx.xyz/concepts/onboarding-faqs",
        "https://docs.dydx.xyz/concepts/trading/rewards_fees_and_parameters"
      ]
    }
  },
  "uniswap-vs-jupiter": {
    "en": {
      "title": "Uniswap vs Jupiter: Chain, Route, Fees and Wallet Preview Checks — NexuAlpha",
      "completeFaq": true,
      "description": "Compare Uniswap and Jupiter by chain, token contract or mint, route source, slippage, gas or priority fees, approval scope and final wallet preview before signing.",
      "reviewedAt": "2026-09-22",
      "directAnswer": {
        "question": "How should I compare Uniswap and Jupiter before signing a swap?",
        "answer": "Compare Uniswap and Jupiter as wallet-connected swap routes, not as exchange accounts. Start with chain identity, official app domain, token contract or mint, pool or route source, quote freshness, slippage, price impact, priority fees, approval or Permit2 scope, and the final wallet transaction preview. A working quote or testnet result does not prove mainnet liquidity, token safety, execution quality or regional front-end access."
      },
      "faq": [
        [
          "Is Uniswap vs Jupiter mainly an Ethereum versus Solana choice?",
          "Chain is the first split, but the safer comparison also checks token contract or mint, pool or route source, fee tier, slippage, price impact, gas or priority fee and final wallet preview."
        ],
        [
          "Does a successful quote prove the swap is safe?",
          "No. A quote can be stale or point through a route the user should not sign. Verify the official app domain, token identity, route legs, approval scope and wallet transaction before acting."
        ],
        [
          "Why does this page link back to the Uniswap owner page?",
          "The Uniswap owner page carries the deeper source-bound checklist for official app, supported-chain, Universal Router, Permit2, token contract and approval boundaries. It is the primary next step before a live signature."
        ]
      ],
      "relatedLinks": [
        "/exchanges/uniswap",
        "/exchanges/jupiter",
        "/topics/no-kyc",
        "/onchain?product=swap"
      ],
      "sourceUrls": [
        "https://app.uniswap.org/",
        "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains",
        "https://developers.uniswap.org/docs/protocols/universal-router/overview",
        "https://developers.uniswap.org/docs/protocols/permit2/overview",
        "https://dev.jup.ag/docs/swap",
        "https://dev.jup.ag/docs/ultra",
        "https://dev.jup.ag/docs/tokens",
        "https://support.jup.ag/"
      ]
    },
    "zh-Hans": null,
    "zh-Hant": null,
    "ja": null,
    "ko": null,
    "tr": null,
    "pt-BR": null
  }
};
const WORKER_COMPARE_FAQ = {
  "en": [
    [
      "Which fees should I compare first?",
      "Check the published spot and futures fee rows, account tier and source date. Final fees can still vary by product, region, account level and the official account screen."
    ],
    [
      "Is the product scope the same on both platforms?",
      "No. Compare spot, derivatives, copy trading and any stock-like exposure separately. Do not treat one product label as proof of availability on the other platform."
    ],
    [
      "What should I verify about KYC and local funding?",
      "Confirm identity level, residence, local deposit and withdrawal rails, fiat support and product permissions in the official account flow before funding the account."
    ],
    [
      "When should I use the registration link?",
      "Use it only after checking the official domain, current terms and the product you need. A partner route does not guarantee approval, bonus eligibility or final net cost."
    ]
  ],
  "zh-Hans": [
    [
      "应该先比较哪些费用？",
      "先看本页已审核的现货、合约费率行、账户等级和来源日期；最终费用仍可能因产品、地区、账户等级和官方账户页面而变化。"
    ],
    [
      "两家平台的产品范围一样吗？",
      "不一样。现货、衍生品、跟单和股票类敞口要分开看；不能用一个产品名称推断另一家平台一定可用。"
    ],
    [
      "KYC 和本地入出金要核对什么？",
      "在入金前确认身份等级、居住地区、本地入金与提现通道、法币支持和产品权限，最终以官方账户流程为准。"
    ],
    [
      "什么时候才适合点开户注册链接？",
      "确认官方域名、当前条款和所需产品后再打开。合作路径不保证开户通过、奖励资格或最终净成本。"
    ]
  ],
  "zh-Hant": [
    [
      "應該先比較哪些費用？",
      "先看本頁已審核的現貨、合約費率列、帳戶等級和來源日期；最終費用仍可能因產品、地區、帳戶等級和官方帳戶頁面而變化。"
    ],
    [
      "兩家平台的產品範圍一樣嗎？",
      "不一樣。現貨、衍生品、跟單和股票類敞口要分開看；不能用一個產品名稱推斷另一家平台一定可用。"
    ],
    [
      "KYC 和本地入出金要核對什麼？",
      "入金前確認身份等級、居住地區、本地入金與提現通道、法幣支援和產品權限，最終以官方帳戶流程為準。"
    ],
    [
      "什麼時候才適合點開戶註冊連結？",
      "確認官方網域、目前條款和所需產品後再打開。合作路徑不保證開戶通過、獎勵資格或最終淨成本。"
    ]
  ],
  "es": [
    [
      "¿Qué comisiones conviene comparar primero?",
      "Revisa las filas de comisiones spot y futures con fuente, el nivel de cuenta y la fecha de revisión. La comisión final puede variar por producto, región, nivel de cuenta y pantalla oficial."
    ],
    [
      "¿El alcance de productos es igual en ambas plataformas?",
      "No. Separa spot, derivados, copy trading y exposición tipo acciones. Un nombre de producto no prueba disponibilidad en la otra plataforma."
    ],
    [
      "¿Qué debo comprobar sobre KYC y fondeo local?",
      "Confirma nivel de identidad, residencia, depósitos y retiros locales, soporte fiat y permisos de producto dentro del flujo oficial antes de fondear."
    ],
    [
      "¿Cuándo usar el enlace de registro?",
      "Úsalo después de comprobar dominio oficial, términos actuales y producto necesario. Una ruta de socio no garantiza aprobación, bonus ni coste neto final."
    ]
  ],
  "pt-BR": [
    [
      "Quais taxas devo comparar primeiro?",
      "Confira as linhas de taxa spot e futures com fonte, o nível da conta e a data de revisão. A taxa final pode variar por produto, região, nível da conta e tela oficial."
    ],
    [
      "O escopo de produtos é igual nas duas plataformas?",
      "Não. Separe spot, derivativos, copy trading e exposição parecida com ações. Um nome de produto não prova disponibilidade na outra plataforma."
    ],
    [
      "O que revisar sobre KYC e entrada ou saída local?",
      "Confirme identidade, residência, depósito e saque locais, suporte fiat e permissões de produto no fluxo oficial antes de enviar fundos."
    ],
    [
      "Quando usar o link de cadastro?",
      "Use depois de conferir domínio oficial, termos atuais e produto necessário. Uma rota de parceiro não garante aprovação, bônus nem custo líquido final."
    ]
  ],
  "fr": [
    [
      "Quels frais comparer en premier ?",
      "Vérifiez les lignes de frais spot et futures sourcées, le niveau de compte et la date de revue. Le coût final peut varier selon produit, région, compte et écran officiel."
    ],
    [
      "Les produits disponibles sont-ils les mêmes ?",
      "Non. Séparez spot, dérivés, copy trading et exposition de type action. Un nom de produit ne prouve pas l’accès sur l’autre plateforme."
    ],
    [
      "Que vérifier pour le KYC et les rails locaux ?",
      "Confirmez identité, résidence, dépôts et retraits locaux, fiat et permissions produit dans le parcours officiel avant d’envoyer des fonds."
    ],
    [
      "Quand utiliser le lien d’inscription ?",
      "Après avoir vérifié domaine officiel, conditions actuelles et produit voulu. Une route partenaire ne garantit ni approbation, ni bonus, ni coût net final."
    ]
  ],
  "de": [
    [
      "Welche Gebühren sollte ich zuerst vergleichen?",
      "Prüfen Sie belegte Spot- und Futures-Gebühren, Kontostufe und Prüftermin. Endgültige Gebühren können nach Produkt, Region, Konto und offizieller Ansicht abweichen."
    ],
    [
      "Ist der Produktumfang gleich?",
      "Nein. Spot, Derivate, Copy Trading und aktienähnliche Exposures getrennt prüfen. Ein Produktname beweist keine Verfügbarkeit bei der anderen Plattform."
    ],
    [
      "Was ist bei KYC und lokalen Zahlungswegen zu prüfen?",
      "Identität, Wohnsitz, lokale Ein- und Auszahlungen, Fiat-Unterstützung und Produktrechte im offiziellen Kontofluss prüfen, bevor Geld eingeht."
    ],
    [
      "Wann sollte ich den Registrierungslink nutzen?",
      "Erst nach Prüfung von offizieller Domain, aktuellen Bedingungen und benötigtem Produkt. Ein Partnerweg garantiert keine Freigabe, Boni oder Nettokosten."
    ]
  ],
  "ja": [
    [
      "最初に比較すべき手数料は？",
      "出典付きの現物・先物手数料、口座ティア、確認日を見ます。最終手数料は商品、地域、口座条件、公式画面で変わる場合があります。"
    ],
    [
      "両社の商品範囲は同じですか？",
      "同じとは限りません。現物、デリバティブ、コピー取引、株式型エクスポージャーは分けて確認します。商品名だけで利用可否は判断できません。"
    ],
    [
      "KYC と地域の入出金で何を見るべきですか？",
      "本人確認レベル、居住地域、現地の入金・出金手段、法定通貨対応、商品権限を公式フローで確認してから入金します。"
    ],
    [
      "登録リンクはいつ使うべきですか？",
      "公式ドメイン、現在の条件、必要な商品を確認してから使います。提携ルートは承認、特典、最終コストを保証しません。"
    ]
  ],
  "ko": [
    [
      "먼저 어떤 수수료를 비교해야 하나요?",
      "출처가 있는 현물·선물 수수료, 계정 등급과 검토일을 확인하세요. 최종 수수료는 상품, 지역, 계정 조건, 공식 화면에 따라 달라질 수 있습니다."
    ],
    [
      "두 플랫폼의 상품 범위가 같나요?",
      "아닙니다. 현물, 파생상품, 카피트레이딩, 주식형 노출은 분리해서 봐야 합니다. 상품명만으로 다른 플랫폼의 이용 가능성을 판단할 수 없습니다."
    ],
    [
      "KYC와 현지 입출금은 무엇을 확인해야 하나요?",
      "입금 전 신원확인 수준, 거주 지역, 현지 입금·출금 경로, 법정화폐 지원과 상품 권한을 공식 계정 흐름에서 확인하세요."
    ],
    [
      "가입 링크는 언제 사용해야 하나요?",
      "공식 도메인, 현재 조건, 필요한 상품을 확인한 뒤 사용하세요. 파트너 경로는 승인, 보너스 자격, 최종 순비용을 보장하지 않습니다."
    ]
  ],
  "ur": [
    [
      "پہلے کون سی فیس موازنہ کرنی چاہیے؟",
      "ذریعہ والی اسپاٹ اور فیوچر فیس قطاریں، اکاؤنٹ درجے اور جائزہ تاریخ دیکھیں۔ آخری فیس پروڈکٹ، ریجن، اکاؤنٹ سطح اور سرکاری اسکرین کے مطابق بدل سکتی ہے۔"
    ],
    [
      "کیا دونوں پلیٹ فارمز کا پروڈکٹ دائرہ ایک جیسا ہے؟",
      "نہیں۔ اسپاٹ، مشتقات، کاپی ٹریڈنگ اور شیئر جیسی نمائش کو الگ پڑھیں۔ پروڈکٹ نام دوسری پلیٹ فارم پر دستیابی ثابت نہیں کرتا۔"
    ],
    [
      "KYC اور مقامی فنڈنگ کے بارے میں کیا تصدیق کروں؟",
      "اکاؤنٹ میں رقم جمع کرنے سے پہلے سرکاری اکاؤنٹ کے عمل میں شناختی درجہ، رہائش، مقامی جمع اور نکاسی کے ذرائع، فیاٹ سہولت اور مصنوعات کی اجازت کی تصدیق کریں۔"
    ],
    [
      "رجسٹریشن لنک کب استعمال کروں؟",
      "سرکاری ڈومین، موجودہ شرائط اور مطلوبہ مصنوعات چیک کرنے کے بعد ہی استعمال کریں۔ پارٹنر راستہ منظوری، بونس کی اہلیت یا آخری خالص لاگت کی ضمانت نہیں دیتا۔"
    ]
  ],
  "uk": [
    [
      "Які комісії порівняти спершу?",
      "Перевірте спотові та ф'ючерсні комісії з джерелом, рівень акаунта й дату огляду. Фінальна комісія може відрізнятися за продуктом, регіоном, рівнем акаунта й офіційним екраном."
    ],
    [
      "Чи однаковий набір продуктів?",
      "Ні. Спот, деривативи, копітрейдинг і експозиції, схожі на акції, потрібно розділяти. Назва продукту не доводить його доступність на іншій платформі."
    ],
    [
      "Що перевірити щодо KYC і місцевого поповнення?",
      "Перед поповненням підтвердьте рівень ідентифікації, місце проживання, місцеві канали внесення й виведення коштів, підтримку фіату та дозволи на продукти в офіційному процесі акаунта."
    ],
    [
      "Коли використовувати посилання для реєстрації?",
      "Лише після перевірки офіційного домену, чинних умов і потрібного продукту. Партнерський маршрут не гарантує схвалення, права на бонус або остаточної чистої вартості."
    ]
  ],
  "ar": [
    [
      "أي رسوم يجب مقارنتها أولاً؟",
      "راجع رسوم السبوت والعقود الآجلة ذات المصدر، مستوى الحساب وتاريخ المراجعة. قد تختلف الرسوم النهائية حسب المنتج والمنطقة والحساب والشاشة الرسمية."
    ],
    [
      "هل نطاق المنتجات متماثل؟",
      "لا. افصل بين السبوت والمشتقات ونسخ التداول والتعرض الشبيه بالأسهم. اسم المنتج لا يثبت توفره في المنصة الأخرى."
    ],
    [
      "ما الذي يجب فحصه في KYC والتمويل المحلي؟",
      "أكد مستوى الهوية والإقامة ومسارات الإيداع والسحب المحلية ودعم fiat وصلاحيات المنتج داخل المسار الرسمي قبل التمويل."
    ],
    [
      "متى أستخدم رابط التسجيل؟",
      "استخدمه بعد فحص النطاق الرسمي والشروط الحالية والمنتج المطلوب. مسار الشريك لا يضمن الموافقة أو المكافأة أو التكلفة الصافية."
    ]
  ],
  "tr": [
    [
      "Önce hangi ücretleri karşılaştırmalıyım?",
      "Kaynaklı spot ve futures ücret satırlarını, hesap seviyesini ve inceleme tarihini kontrol edin. Nihai ücret ürün, bölge, hesap seviyesi ve resmî ekrana göre değişebilir."
    ],
    [
      "Ürün kapsamı iki platformda aynı mı?",
      "Hayır. Spot, türevler, copy trading ve hisse benzeri maruziyet ayrı okunmalı. Tek bir ürün adı diğer platformda erişim kanıtı değildir."
    ],
    [
      "KYC ve yerel para giriş çıkışı için neye bakmalıyım?",
      "Fon göndermeden önce kimlik seviyesi, ikamet, yerel yatırma-çekme yolları, fiat desteği ve ürün izinlerini resmî hesap akışında doğrulayın."
    ],
    [
      "Kayıt bağlantısını ne zaman kullanmalıyım?",
      "Resmî alan adını, güncel şartları ve gereken ürünü kontrol ettikten sonra kullanın. Partner yolu onay, bonus veya net maliyet garantisi vermez."
    ]
  ],
  "ru": [
    [
      "Какие комиссии сравнить сначала?",
      "Проверьте строки спота и фьючерсов с источником, уровень аккаунта и дату проверки. Итоговая комиссия зависит от продукта, региона, аккаунта и официального экрана."
    ],
    [
      "Одинаковый ли набор продуктов?",
      "Нет. Спот, деривативы, копитрейдинг и экспозиции к акциям нужно разделять. Название продукта не доказывает доступность на другой платформе."
    ],
    [
      "Что проверить по KYC и местным вводам или выводам?",
      "До пополнения проверьте уровень личности, резидентство, местные вводы и выводы, fiat-поддержку и доступ к продукту в официальном аккаунте."
    ],
    [
      "Когда использовать ссылку регистрации?",
      "После проверки официального домена, текущих условий и нужного продукта. Партнёрский путь не гарантирует одобрение, бонус или итоговую стоимость."
    ]
  ],
  "id": [
    [
      "Biaya apa yang perlu dibandingkan dulu?",
      "Periksa biaya spot dan futures bersumber, level akun, dan tanggal tinjauan. Biaya akhir dapat berubah menurut produk, wilayah, level akun, dan layar resmi."
    ],
    [
      "Apakah cakupan produk sama?",
      "Tidak. Spot, derivatif, copy trading, dan eksposur mirip saham perlu dipisahkan. Nama produk tidak membuktikan ketersediaan di platform lain."
    ],
    [
      "Apa yang dicek untuk KYC dan dana lokal?",
      "Konfirmasi level identitas, domisili, jalur deposit dan penarikan lokal, dukungan fiat, serta izin produk di alur akun resmi sebelum mengirim dana."
    ],
    [
      "Kapan memakai link pendaftaran?",
      "Gunakan setelah memeriksa domain resmi, syarat terbaru, dan produk yang dibutuhkan. Rute partner tidak menjamin persetujuan, bonus, atau biaya bersih akhir."
    ]
  ],
  "vi": [
    [
      "Nên so sánh phí nào trước?",
      "Kiểm tra phí spot và futures có nguồn, cấp tài khoản và ngày rà soát. Phí cuối cùng có thể đổi theo sản phẩm, khu vực, cấp tài khoản và màn hình chính thức."
    ],
    [
      "Phạm vi sản phẩm có giống nhau không?",
      "Không. Spot, phái sinh, copy trading và tiếp xúc giống cổ phiếu phải tách riêng. Tên sản phẩm không chứng minh khả dụng trên nền tảng kia."
    ],
    [
      "Cần kiểm tra gì về KYC và nạp rút địa phương?",
      "Xác nhận cấp danh tính, nơi cư trú, kênh nạp rút địa phương, hỗ trợ fiat và quyền sản phẩm trong luồng tài khoản chính thức trước khi nạp tiền."
    ],
    [
      "Khi nào dùng link đăng ký?",
      "Dùng sau khi kiểm tra tên miền chính thức, điều khoản hiện tại và sản phẩm cần dùng. Đường đối tác không đảm bảo phê duyệt, bonus hay chi phí ròng."
    ]
  ],
  "it": [
    [
      "Quali commissioni confronto per prime?",
      "Controlla righe spot e futures con fonte, livello account e data di revisione. Il costo finale può variare per prodotto, regione, livello account e schermata ufficiale."
    ],
    [
      "La gamma prodotti è uguale?",
      "No. Spot, derivati, copy trading ed esposizioni simili ad azioni vanno separati. Un nome prodotto non prova disponibilità sull’altra piattaforma."
    ],
    [
      "Cosa verificare su KYC e movimenti locali?",
      "Conferma identità, residenza, depositi e prelievi locali, supporto fiat e permessi prodotto nel flusso ufficiale prima di inviare fondi."
    ],
    [
      "Quando usare il link di registrazione?",
      "Dopo aver verificato dominio ufficiale, termini attuali e prodotto necessario. Un percorso partner non garantisce approvazione, bonus o costo netto finale."
    ]
  ]
};
// END GENERATED PRIORITY VENUE SEO
const LEGACY_VENUE_FACTBOOK_REDIRECTS = Object.freeze({
  "/exchanges/htx": "htx",
  "/exchanges/hashkey": "hashkey",
  "/exchanges/aevo": "aevo",
});
const LEGACY_COMPARE_REDIRECTS = Object.freeze({
  "/compare/aevo-vs-binance": "/exchanges",
  "/compare/hashkey-vs-binance": "/exchanges",
  "/compare/htx-vs-binance": "/exchanges",
  "/compare/kraken-vs-binance": "/compare/binance-vs-kraken",
  "/compare/bitget-vs-binance": "/compare/binance-vs-bitget",
  "/compare/okx-vs-bitget": "/compare/bitget-vs-okx",
  "/compare/mexc-vs-bybit": "/compare/bybit-vs-mexc",
  "/compare/mexc-vs-bitget": "/compare/bitget-vs-mexc",
});
const TEXT_ASSET_CONTENT_TYPE = "text/plain; charset=utf-8";
const IMMUTABLE_STATIC_CACHE = "public, max-age=31536000, immutable";
const BRAND_STATIC_CACHE = "public, max-age=604800, stale-while-revalidate=86400";

function normalizeTextAssetResponse(response, url) {
  if (response.status === 404 || !url.pathname.endsWith(".txt")) return response;
  const headers = new Headers(response.headers);
  headers.set("content-type", TEXT_ASSET_CONTENT_TYPE);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const BR_ATTRIBUTION_QUERY_KEYS = Object.freeze(["utm_source", "utm_medium", "utm_campaign"]);

function hasBrazilAttributionQuery(searchParams) {
  return BR_ATTRIBUTION_QUERY_KEYS.some((key) => searchParams.has(key));
}

function shouldStripTrackedBrazilHtmlValidators(request, url) {
  if (!["GET", "HEAD"].includes(request.method)) return false;
  if (!hasBrazilAttributionQuery(url.searchParams)) return false;
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  return brazilPath(publicRoute.contentPathname);
}

function assetFetchRequest(request, targetUrl = null, stripHtmlValidators = false) {
  const source = targetUrl ? new Request(targetUrl, request) : request;
  if (!stripHtmlValidators) return source;
  const headers = new Headers(source.headers);
  headers.delete("if-none-match");
  headers.delete("if-modified-since");
  return new Request(source, { headers });
}

function staticAssetCacheControl(url) {
  const pathname = url?.pathname || "";
  const filename = pathname.split("/").pop() || "";
  if (pathname.startsWith("/assets/") && /-[A-Za-z0-9_-]{6,}\.(?:css|js|mjs|png|jpe?g|svg|webp|avif|woff2?)$/i.test(filename)) {
    return IMMUTABLE_STATIC_CACHE;
  }
  if (pathname.startsWith("/brand/") && /-v\d+\.(?:avif|gif|jpe?g|png|webp)$/i.test(filename)) {
    return IMMUTABLE_STATIC_CACHE;
  }
  if (pathname.startsWith("/brand/") && /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(filename)) {
    return BRAND_STATIC_CACHE;
  }
  return null;
}

function staticAssetResponse(response, url) {
  if (response.status === 404) return response;
  const cacheControl = staticAssetCacheControl(url);
  if (!cacheControl) return response;
  const headers = new Headers(response.headers);
  headers.set("cache-control", cacheControl);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const NEXUALPHA_DATA_LICENSE_URL = `${PUBLIC_ORIGIN}/methodology#data-license`;
// RESEARCH_DESK and NEXUALPHA_PUBLISHER come from src/data/brand-entity.js (one Organization @id for every page).
const DEFAULT_SOCIAL_IMAGE = `${PUBLIC_ORIGIN}/brand/nexualpha/nexualpha-social-v1.jpg`;
const REGIONAL_FUNDING_MATRIX_REVIEWED_AT = "2026-09-15";
const REGIONAL_FUNDING_MATRIX_URLS = Object.freeze({
  json: `${PUBLIC_ORIGIN}/research/regional-funding-verification-matrix.json`,
  csv: `${PUBLIC_ORIGIN}/research/regional-funding-verification-matrix.csv`,
  methodology: `${PUBLIC_ORIGIN}/methodology`,
});
const REGIONAL_FUNDING_MATRIX_COVERAGE = "Reviewed funding checklist rows currently cover BR, MX, TW, ID, EU, UK, US, JP, HK, KR, SG and TR; every rail and account outcome still requires confirmation in the official logged-in account flow.";
const REGIONAL_FUNDING_MATRIX_LIMITATIONS = "The matrix is a dated research checklist, not a live-rate feed, account approval decision, funding availability promise, product-access promise, user-benefit promise or registration outcome.";
const WAVE48_PERP_DEX_COST_CITATION_URLS = Object.freeze({
  json: `${PUBLIC_ORIGIN}/research/wave48-perp-dex-cost-citations.json`,
  csv: `${PUBLIC_ORIGIN}/research/wave48-perp-dex-cost-citations.csv`,
  canonicalOwner: `${PUBLIC_ORIGIN}/topics/derivatives#perp-cost-field-dictionary`,
});
const WAVE48_PERP_DEX_COST_FINDING = "Wave56 finding: across the four reviewed Perp DEX venues, all 24 required venue-field records are source-backed as known, but every venue still requires cost review across fee, funding, collateral, margin, oracle and liquidation rather than a single static fee or live funding quote.";
const WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_URL = `${PUBLIC_ORIGIN}/research/wave48-tokenized-treasury-rights-ops.json`;
const WAVE57_TOKENIZED_TREASURY_FINDING = "Wave57 finding: the reviewed tokenized Treasury matrix covers five products across four distinct product types; compare issuer/legal wrapper, recordkeeper, custody, redemption, eligibility jurisdiction and yield basis before comparing yield, token addresses or venue access.";
const WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_LIMITATIONS = "This asset is a dated source-review matrix, not legal advice, investment advice, live yield data, account eligibility, signup eligibility, registration outcome, ownership guarantee or redemption guarantee.";
const TOKENIZED_TREASURY_OWNER_PATH = "/topics/tokenized-treasuries";
const TOKENIZED_TREASURY_SUPPORT_PATH = "/news/tokenized-treasuries-structure-access-risks";
const NEWS_OWNER_RELATED_LINKS = Object.freeze({
  "tokenized-treasuries-structure-access-risks": [
    TOKENIZED_TREASURY_OWNER_PATH,
    TOKENIZED_TREASURY_SUPPORT_PATH,
    "/research/wave48-tokenized-treasury-rights-ops.json",
    "/topics/tokenized-assets",
    "/topics/tokenized-stocks-vs-perpetuals",
    "/methodology",
  ],
  "bybit-vs-bitget-fees-products-risk-controls": [
    "/compare/bybit-vs-bitget",
    "/topics/tokenized-stocks-vs-perpetuals",
    "/factbook/bybit",
    "/factbook/bitget",
    TOKENIZED_TREASURY_SUPPORT_PATH,
    "/news/crypto-exchange-fee-disclosure-audit",
    "/methodology",
  ],
  "uniswap-v3-vs-pancakeswap-v3-concentrated-liquidity-controls": [
    "/exchanges/uniswap",
    "/compare/uniswap-vs-jupiter",
    "/factbook/uniswap",
    "/factbook/pancakeswap",
    "/topics/no-kyc",
    "/methodology",
  ],
});
const MACHINE_READABLE_CITATION_ASSETS = Object.freeze([
  { name: "NexuAlpha public source review index", url: `${PUBLIC_ORIGIN}/llms.txt`, encodingFormat: "text/plain" },
  { name: "NexuAlpha full source review records", url: `${PUBLIC_ORIGIN}/llms-full.txt`, encodingFormat: "text/plain" },
  { name: "Perp DEX cost-field dictionary JSON", url: `${PUBLIC_ORIGIN}/research/perp-dex-cost-field-dictionary.json`, encodingFormat: "application/json" },
  { name: "Perp DEX cost-field dictionary CSV", url: `${PUBLIC_ORIGIN}/research/perp-dex-cost-field-dictionary.csv`, encodingFormat: "text/csv" },
  { name: "Wave48 Perp DEX cost citations JSON", url: WAVE48_PERP_DEX_COST_CITATION_URLS.json, encodingFormat: "application/json" },
  { name: "Wave48 Perp DEX cost citations CSV", url: WAVE48_PERP_DEX_COST_CITATION_URLS.csv, encodingFormat: "text/csv" },
  { name: "Regional funding verification matrix JSON", url: REGIONAL_FUNDING_MATRIX_URLS.json, encodingFormat: "application/json" },
  { name: "Regional funding verification matrix CSV", url: REGIONAL_FUNDING_MATRIX_URLS.csv, encodingFormat: "text/csv" },
]);
function uniqueUrls(values = []) {
  return [...new Set(values.filter(Boolean))];
}
function regionalFundingMatrixDatasetSchema() {
  return {
    "@type": "Dataset",
    name: "Regional funding verification matrix",
    url: REGIONAL_FUNDING_MATRIX_URLS.json,
    sameAs: REGIONAL_FUNDING_MATRIX_URLS.csv,
    dateModified: REGIONAL_FUNDING_MATRIX_REVIEWED_AT,
    creator: RESEARCH_DESK,
    publisher: NEXUALPHA_PUBLISHER,
    license: NEXUALPHA_DATA_LICENSE_URL,
    isAccessibleForFree: true,
    inLanguage: "en",
    description: `${REGIONAL_FUNDING_MATRIX_COVERAGE} ${REGIONAL_FUNDING_MATRIX_LIMITATIONS}`,
    about: ["fiat funding verification", "regional payment rails", "crypto platform account checks"],
    measurementTechnique: "Official source review of regulator, payment-system and platform support pages; account-specific outcomes remain pending until shown in the official logged-in account flow.",
    variableMeasured: ["market", "fiatCurrency", "paymentRails", "accountScreenChecks", "feeOrTimingChecks", "officialSources", "unknowns", "cannotPromise"],
    distribution: [
      { "@type": "DataDownload", name: "Regional funding verification matrix JSON", contentUrl: REGIONAL_FUNDING_MATRIX_URLS.json, encodingFormat: "application/json" },
      { "@type": "DataDownload", name: "Regional funding verification matrix CSV", contentUrl: REGIONAL_FUNDING_MATRIX_URLS.csv, encodingFormat: "text/csv" },
    ],
    citation: [REGIONAL_FUNDING_MATRIX_URLS.methodology, REGIONAL_FUNDING_MATRIX_URLS.json, REGIONAL_FUNDING_MATRIX_URLS.csv],
    conditionsOfAccess: REGIONAL_FUNDING_MATRIX_LIMITATIONS,
  };
}
const REGIONAL_FUNDING_ROUTE_LINKS = Object.freeze([
  ["/hk", "Hong Kong funding route checklist"],
  ["/eu", "European Union funding route checklist"],
  ["/uk", "United Kingdom funding route checklist"],
  ["/us", "United States funding route checklist"],
  ["/jp?locale=ja", "Japan funding route checklist"],
  ["/kr?locale=ko", "Korea funding route checklist"],
  ["/sg", "Singapore funding route checklist"],
  ["/tr/markets/turkiye", "Türkiye funding route checklist"],
  ["/br", "Brazil funding route checklist"],
  ["/mx", "Mexico funding route checklist"],
  ["/tw", "Taiwan funding route checklist"],
  ["/compare/binance-vs-okx", "Binance vs OKX comparison"],
  ["/compare/bybit-vs-bitget", "Bybit vs Bitget comparison"],
  ["/compare/hyperliquid-vs-dydx", "Hyperliquid vs dYdX comparison"],
]);
function regionalFundingRouteSchemas(locale = "en") {
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: [{
        "@type": "Question",
        name: "How should international users verify crypto funding routes?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Start from the regional funding matrix, then open the market page for residence, identity, local rail and official-account checks. Use comparison pages only after the region, product and funding path are clear. The matrix is a dated research checklist, not a live fee quote, account approval promise, funding guarantee, user-benefit promise or registration outcome.",
          citation: [REGIONAL_FUNDING_MATRIX_URLS.json, REGIONAL_FUNDING_MATRIX_URLS.csv, REGIONAL_FUNDING_MATRIX_URLS.methodology],
        },
      }],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Regional crypto funding route entry points",
      inLanguage: locale,
      itemListElement: REGIONAL_FUNDING_ROUTE_LINKS.map(([url, name], index) => ({
        "@type": "ListItem",
        position: index + 1,
        name,
        url: `${PUBLIC_ORIGIN}${url}`,
      })),
    },
  ];
}
function wave48PerpDexCostCitationsDatasetSchema() {
  return {
    "@type": "Dataset",
    name: "Wave48 Perp DEX cost citations",
    url: WAVE48_PERP_DEX_COST_CITATION_URLS.json,
    sameAs: WAVE48_PERP_DEX_COST_CITATION_URLS.csv,
    dateModified: "2026-09-15",
    creator: RESEARCH_DESK,
    publisher: NEXUALPHA_PUBLISHER,
    license: NEXUALPHA_DATA_LICENSE_URL,
    isAccessibleForFree: true,
    inLanguage: "en",
    abstract: WAVE48_PERP_DEX_COST_FINDING,
    description: `${WAVE48_PERP_DEX_COST_FINDING} Dated research snapshot; not a live quote, trading recommendation, referral route, campaign eligibility claim or venue ranking.`,
    about: ["Perp DEX costs", "funding", "margin", "oracle", "liquidation"],
    isPartOf: WAVE48_PERP_DEX_COST_CITATION_URLS.canonicalOwner,
    variableMeasured: ["venue", "fee", "funding", "collateral", "margin", "oracle", "liquidation", "sourceUrl", "unknowns"],
    distribution: [
      { "@type": "DataDownload", name: "Wave48 Perp DEX cost citations JSON", contentUrl: WAVE48_PERP_DEX_COST_CITATION_URLS.json, encodingFormat: "application/json" },
      { "@type": "DataDownload", name: "Wave48 Perp DEX cost citations CSV", contentUrl: WAVE48_PERP_DEX_COST_CITATION_URLS.csv, encodingFormat: "text/csv" },
    ],
    citation: [WAVE48_PERP_DEX_COST_CITATION_URLS.canonicalOwner, WAVE48_PERP_DEX_COST_CITATION_URLS.json, WAVE48_PERP_DEX_COST_CITATION_URLS.csv],
    conditionsOfAccess: "Dated research snapshot for citation and comparison; not a live quote, trading recommendation, referral route, campaign eligibility claim or venue ranking.",
  };
}
function wave48TokenizedTreasuryRightsOpsDatasetSchema() {
  return {
    "@type": "Dataset",
    name: "Wave48 tokenized Treasury rights and operations",
    url: WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_URL,
    dateModified: "2026-09-16",
    creator: RESEARCH_DESK,
    publisher: NEXUALPHA_PUBLISHER,
    license: NEXUALPHA_DATA_LICENSE_URL,
    isAccessibleForFree: true,
    inLanguage: "en",
    abstract: WAVE57_TOKENIZED_TREASURY_FINDING,
    description: `${WAVE57_TOKENIZED_TREASURY_FINDING} ${WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_LIMITATIONS}`,
    about: ["tokenized Treasuries", "legal claim", "recordkeeper", "custody", "redemption", "eligibility"],
    isPartOf: `${PUBLIC_ORIGIN}/topics/tokenized-treasuries`,
    variableMeasured: ["productType", "legalClaimOrIssuerSpv", "recordkeeper", "custody", "redemption", "eligibilityJurisdiction", "yieldBasis", "sourceUrl", "unknownsLimits"],
    distribution: [
      { "@type": "DataDownload", name: "Wave48 tokenized Treasury rights and operations JSON", contentUrl: WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_URL, encodingFormat: "application/json" },
    ],
    citation: [`${PUBLIC_ORIGIN}/topics/tokenized-treasuries`, WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_URL],
    conditionsOfAccess: WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_LIMITATIONS,
  };
}
function citationAssetSchemas() {
  return [
    ...MACHINE_READABLE_CITATION_ASSETS.map((asset) => ({ "@type": "DigitalDocument", ...asset })),
    wave48PerpDexCostCitationsDatasetSchema(),
    regionalFundingMatrixDatasetSchema(),
  ];
}
function researchAttribution(sourceUrls = []) {
  return {
    author: RESEARCH_DESK,
    publisher: NEXUALPHA_PUBLISHER,
    reviewedBy: RESEARCH_DESK,
    isAccessibleForFree: true,
    citation: uniqueUrls([`${PUBLIC_ORIGIN}/methodology`, `${PUBLIC_ORIGIN}/llms.txt`, `${PUBLIC_ORIGIN}/llms-full.txt`, ...sourceUrls]),
    hasPart: citationAssetSchemas(),
  };
}
function newsArticleAuthor(article) {
  const name = String(article?.author || "").trim() || RESEARCH_DESK.name;
  if (name === RESEARCH_DESK.name) return RESEARCH_DESK;
  return { "@type": "Organization", name };
}
function tokenizedTreasuryArticleFaqCitations(article, question) {
  const sourceUrls = Array.isArray(article?.sources) ? article.sources.map((source) => source?.url).filter(Boolean) : [];
  const matching = (patterns) => sourceUrls.filter((url) => patterns.some((pattern) => pattern.test(url)));
  const patterns = /BUIDL|BENJI|same kind of claim/i.test(question)
    ? [/2013810/, /2094496/, /franklin-on-chain/, /9001-PSUM/, /securitize\.io\/blackrock\/buidl/]
    : /lose money|yield/i.test(question)
      ? [/treasury-bills/, /franklin-on-chain/, /9001-PSUM/, /blackrock.*product-screener/]
      : /transfer|wallet/i.test(question)
        ? [/tokenized-securities/, /2094496/, /blackrock-token-addresses/]
        : /stablecoin/i.test(question)
          ? [/tokenized-securities/, /crypto-assets/, /franklin-on-chain/, /securitize\.io\/blackrock\/buidl/]
          : [/buying-a-marketable-security/, /treasury-bills/, /tokenized-securities/];
  return uniqueUrls([WAVE48_TOKENIZED_TREASURY_RIGHTS_OPS_URL, ...matching(patterns)]).slice(0, 6);
}
function tokenizedTreasuryGscFaqEntry(articleLocale) {
  if (articleLocale !== "en") return null;
  return {
    question: "What are tokenized Treasuries?",
    answer: "Tokenized Treasuries are blockchain-recorded products that reference Treasury-bill or Treasury-fund exposure, but the token label alone does not prove direct Treasury ownership. Check the issuer or legal wrapper, recordkeeper, custodian, redemption path, transfer controls, permitted chain, eligibility and yield basis before comparing products.",
  };
}
const NEWS_ROUTE_MARKER = "NEXUALPHA_NEWS_ROUTE_V1";
const ARTICLE_ROUTE_MARKER = "NEXUALPHA_ARTICLE_ROUTE_V1";
const EXCHANGES_ROUTE_MARKER = "NEXUALPHA_EXCHANGES_ROUTE_V1";
const VENUE_ROUTE_MARKER = "NEXUALPHA_VENUE_ROUTE_V1";
const COMPARE_ROUTE_MARKER = "NEXUALPHA_COMPARE_ROUTE_V1";
const ACTIVITIES_ROUTE_MARKER = "NEXUALPHA_ACTIVITIES_ROUTE_V1";
const ACTIVITY_UPDATE_ROUTE_MARKER = "NEXUALPHA_ACTIVITY_UPDATE_ROUTE_V1";
const TOPIC_ROUTE_MARKER = "NEXUALPHA_TOPIC_ROUTE_V1";
const FACTBOOK_ROUTE_MARKER = "NEXUALPHA_FACTBOOK_ROUTE_V1";
const FACTBOOK_SOURCE_REVIEW_DATE = "2026-09-08";
const HOME_ROUTE_MARKER = "NEXUALPHA_HOME_ROUTE_V1";
const STATIC_ROUTE_MARKER = "NEXUALPHA_STATIC_ROUTE_V1";
const NOT_FOUND_ROUTE_MARKER = "NEXUALPHA_NOT_FOUND_ROUTE_V1";
const APP_DOWNLOAD_ROUTE_MARKER = "NEXUALPHA_APP_DOWNLOAD_ROUTE_V1";
const ACADEMY_ROUTE_MARKER = "NEXUALPHA_ACADEMY_ROUTE_V1";
const LICENSES_ROUTE_MARKER = "NEXUALPHA_LICENSES_ROUTE_V1";
const COINS_ROUTE_MARKER = "NEXUALPHA_COINS_ROUTE_V1";
const INTEL_TOOLS_ROUTE_MARKER = "NEXUALPHA_INTEL_TOOLS_ROUTE_V1";
const CONVERTER_ROUTE_MARKER = "NEXUALPHA_CONVERTER_ROUTE_V1";
const RADAR_ROUTE_MARKER = "NEXUALPHA_RADAR_ROUTE_V1";
const GLOSSARY_ROUTE_MARKER = "NEXUALPHA_GLOSSARY_ROUTE_V1";
const FLASH_ROUTE_MARKER = "NEXUALPHA_FLASH_ROUTE_V1";
const CAMPAIGN_LANDING_ROUTE_MARKER = "NEXUALPHA_CAMPAIGN_LANDING_ROUTE_V1";
// /starter (新手村) is the academy since 2026-10-12; it briefly pointed at the Telegram hub.
const RETIRED_PAGE_REDIRECTS = Object.freeze({ "/starter": ACADEMY_PATH });
const SHARED_ROUTE_STYLE_PREFIXES = Object.freeze(["index-", "core-", "shared-decision-rail-", "shared-decision-return-"]);
const COMPARE_PAGE_STYLE_PREFIXES = Object.freeze(["page-compare-", "route-v3-pages-"]);
// The exchange directory renders the "compare any two" picker in SSR. Its stylesheet used to arrive with its chunk at
// hydration: the picker row grew 50 -> 205 px (CLS 0.13 at 390). Linked up front, the first paint already has the hydrated look.
const DIRECTORY_PAGE_STYLE_PREFIXES = Object.freeze(["page-compare-", "page-directory-", "route-v3-pages-", "shared-compare-picker-"]);
const ROUTE_STYLE_PREFIXES_BY_MARKER = Object.freeze({
  [HOME_ROUTE_MARKER]: ["page-home-", "route-v3-home-", "route-v3-wizard-", "route-v3-pages-", "route-v3-registration-", "route-v3-calculators-", "route-v3-campaigns-", "route-v3-social-proof-", "route-international-", "route-rates-", "route-activity-", "route-onchain-", "route-telegram-", "route-market-"],
  [EXCHANGES_ROUTE_MARKER]: DIRECTORY_PAGE_STYLE_PREFIXES,
  [VENUE_ROUTE_MARKER]: ["page-profile-", "page-detail-", "route-v3-pages-", "route-v3-registration-", "route-v3-readiness-", "route-activity-", "route-licenses-"],
  [COMPARE_ROUTE_MARKER]: COMPARE_PAGE_STYLE_PREFIXES,
  [ACTIVITIES_ROUTE_MARKER]: ["route-activity-"],
  [ACTIVITY_UPDATE_ROUTE_MARKER]: ["route-activity-"],
  [TOPIC_ROUTE_MARKER]: ["route-topic-guide-"],
  [FACTBOOK_ROUTE_MARKER]: ["page-factbook-", "page-detail-", "route-factbook-", "route-activity-"],
  [NEWS_ROUTE_MARKER]: ["route-news-", "route-activity-"],
  [ARTICLE_ROUTE_MARKER]: ["route-news-"],
  [APP_DOWNLOAD_ROUTE_MARKER]: ["route-apps-"],
  // Academy hub and lessons: own chunk plus the news chunk that carries the sign-up card (NewsVenueOffer).
  [ACADEMY_ROUTE_MARKER]: ["route-academy-", "route-news-"],
  [LICENSES_ROUTE_MARKER]: ["route-licenses-"],
  // Where to buy <coin>: own chunk only.
  [COINS_ROUTE_MARKER]: ["route-coins-"],
  // Spot ETF flows + crypto calendar: own chunk only.
  [INTEL_TOOLS_ROUTE_MARKER]: ["route-intel-tools-"],
  [CONVERTER_ROUTE_MARKER]: ["route-converter-"],
  [RADAR_ROUTE_MARKER]: ["route-radar-"],
  // Crypto glossary (hub + terms): own chunk only.
  [GLOSSARY_ROUTE_MARKER]: ["route-glossary-"],
  // Flash stream and items: own chunk plus the news chunk that carries the sign-up card (NewsVenueOffer).
  [FLASH_ROUTE_MARKER]: ["route-flash-", "route-news-"],
  // Campaign landing pages (/activities/binance-october-gifts): own chunk only.
  // Campaign landing pages (/activities/bybit-stocks): own chunk only.
  [CAMPAIGN_LANDING_ROUTE_MARKER]: ["route-campaign-landing-"],
});
const ROUTE_STYLE_PREFIXES_BY_PATH = Object.freeze({
  "/methodology": ["route-methodology-"],
  "/partners": ["route-partners-"],
  "/rates": ["page-rates-", "route-rates-", "route-activity-"],
  "/onchain": ["route-onchain-"],
  "/telegram": ["page-telegram-", "route-telegram-"],
  "/embed/calculator": ["route-embed-", "route-international-"],
  // Data pages: own chunk plus the shared news chrome they reuse (Telegram alerts line, sign-up card).
  "/liquidations": ["route-data-", "route-news-"],
  "/funding-rates/matrix": ["route-funding-matrix-", "route-data-"],
  "/funding-rates": ["route-data-", "route-news-"],
  // Brand pages (/about, /editorial-policy): own chunk.
  "/privacy": ["route-brand-pages-"],
  "/terms": ["route-brand-pages-"],
  "/contact": ["route-brand-pages-"],
  "/about": ["route-brand-pages-"],
  "/editorial-policy": ["route-brand-pages-"],
});
const REGIONAL_ROUTE_PATHS = new Set(["/mx", "/tw", "/id", "/vn", "/hk", "/eu", "/uk", "/us", "/jp", "/kr", "/sg", "/int", "/markets/turkiye"]);
const TOKENIZED_ASSET_TOPIC_PATHS = new Set(["/topics/tokenized-assets", "/topics/tokenized-treasuries", "/topics/tokenized-stocks-vs-perpetuals"]);
const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRERENDER_MANIFEST_PATH = "/prerender-manifest.json";
const PRERENDERABLE_LOCALES = new Set(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"]);
const UI_LOCALES = new Set(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"]);
const INDEXABLE_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
const NATIVE_REVIEW_PENDING_LOCALES = new Set(["ur", "uk"]);
// Localized news lane (2026-10-10): an article edition exists in every UI locale whose title, summary and body the feed
// carries (English is always required and is the canonical edition). en and zh-Hans are the core editions the content
// lane always writes; a listing page in another locale is published once one search-published article has that edition.
const NEWS_CORE_LOCALES = ["en", "zh-Hans"];
const NEWS_INDEXABLE_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"];
// Google News sitemap <news:language> values (ISO 639-1; zh-cn / zh-tw are the documented exceptions).
const NEWS_SITEMAP_LANGUAGE = Object.freeze({ "zh-Hans": "zh-cn", "zh-Hant": "zh-tw", "pt-BR": "pt" });
function newsSitemapLanguage(locale) {
  return NEWS_SITEMAP_LANGUAGE[locale] || String(locale || "en").split("-")[0].toLowerCase();
}
const LOCALE_PREFIX_BY_CODE = Object.freeze({ en: "", "zh-Hans": "zh-hans", "zh-Hant": "zh-hant", es: "es", "pt-BR": "pt-br", fr: "fr", de: "de", ja: "ja", ko: "ko", ar: "ar", tr: "tr", ru: "ru", id: "id-id", vi: "vi", it: "it",
// l10n: needs native review
ur: "ur",
// l10n: needs native review
uk: "uk-ua" });
const LOCALE_CODE_BY_PREFIX = Object.freeze(Object.fromEntries(Object.entries(LOCALE_PREFIX_BY_CODE).filter(([, prefix]) => prefix).map(([locale, prefix]) => [prefix, locale])));
const MIGRATED_PATH_LOCALES = new Set(Object.keys(LOCALE_PREFIX_BY_CODE).filter((locale) => locale !== "en"));
const COUNTRY_ROUTE_PREFIXES = Object.freeze(["/br", "/mx", "/tw", "/id", "/vn", "/hk", "/eu", "/uk", "/us", "/jp", "/kr", "/sg", "/int"]);
const COUNTRY_LOCALE_BY_PREFIX = Object.freeze({ "/br": "pt-BR", "/mx": "es", "/tw": "zh-Hant", "/id": "id", "/vn": "vi", "/hk": "zh-Hant", "/eu": "en", "/uk": "en", "/us": "en", "/jp": "ja", "/kr": "ko", "/sg": "en", "/int": "en" });
const GLOBAL_ROUTE_PREFIXES = Object.freeze(["/exchanges", "/compare", "/topics", "/factbook", "/activities", "/news", "/markets", "/academy", "/licenses", "/flash", "/coins", "/convert", "/glossary"]);
const GLOBAL_EXACT_ROUTES = new Set(["/", "/rates", "/onchain", "/methodology", "/partners", "/telegram", ...RADAR_PATHS, ...DATA_PAGE_PATHS, "/funding-rates/matrix", ...INTEL_TOOL_PATHS, ...BRAND_PAGE_PATHS, ...LEGAL_PAGE_PATHS]);
const NON_LOCALIZED_PREFIXES = Object.freeze(["/api", "/assets", "/brand", "/content", "/ref"]);
const PRESERVED_REDIRECT_PARAMS = new Set(["market", "product", "account_stage", "funding", "publisher", "gclid", "fbclid", "msclkid"]);
// Hand-written pairs; the list lives in src/data/compare-generated.js so the app, seo-injection and worker agree.
const CURATED_COMPARISONS = new Set(CURATED_COMPARISON_SLUGS);
const SEARCH_CORE_STATIC_PATHS = new Set(["/", "/exchanges", "/activities", "/rates", "/onchain", "/methodology", "/telegram"]);
// Owner 2026-10-10 (search growth): mirror of src/data/seo-injection.js — fully translated pages publish all 15 locales.
const SEARCH_ALL_LOCALE_STATIC_PATHS = new Set(["/exchanges", "/compare", "/activities", "/rates", "/onchain", ...RADAR_PATHS, ...DATA_PAGE_PATHS, "/funding-rates/matrix", ...BRAND_PAGE_PATHS]);
const SEARCH_ALL_LOCALE_VENUE_EXCLUSIONS = new Set(["hyperliquid", "htx", "hashkey", "uniswap", "aevo", "jupiter"]);
const SEARCH_SECONDARY_STATIC_PATHS = new Set(["/partners"]);
const SEARCH_PRIORITY_VENUES = new Set(["binance", "okx", "bybit", "bitget", "backpack", "coinbase", "kraken", "hyperliquid", "uniswap"]);
const SEARCH_PRIORITY_FACTBOOK = new Set(["binance", "okx", "bybit", "bitget", "coinbase", "kraken", "hyperliquid", "uniswap"]);
const SEARCH_PRIORITY_COMPARISONS = new Set(["binance-vs-okx", "binance-vs-bybit", "okx-vs-bybit", "bybit-vs-bitget", "hyperliquid-vs-dydx", "uniswap-vs-jupiter", "coinbase-vs-kraken", "binance-vs-bitget", "bitget-vs-okx", "bybit-vs-mexc", "bitget-vs-mexc"]);
const SEARCH_PRIORITY_TOPICS = new Set(["meme-coins", "derivatives", "compliant-exchanges", "no-kyc", "tokenized-assets"]);

const SERP_CTR_NEWS_OVERRIDES = {
  "okx-usd-to-usdc-spot-pair-migration": {
    title: "OKX USD to USDC Migration (Sept 2026): API, Orders and Bots",
    description: "OKX moved affected Crypto-USD spot pairs to Crypto-USDC in September 2026. Check open orders, bots, API instId and tradeQuoteCcy before a live change.",
    question: "What should I check before the OKX USD to USDC spot-pair migration?",
    answer: "Check the official pair scope first, then inspect open orders, bots, API instrument identifiers, quote-currency handling and account balances before changing a live workflow.",
  },
  "hyperliquid-vs-dydx": {
    title: "Hyperliquid vs dYdX: Fees, Funding and Liquidation",
    description: "Compare Hyperliquid and dYdX fees, funding, collateral, liquidation, oracle, wallet and recovery mechanics before opening a perpetual position.",
    question: "Should I choose Hyperliquid or dYdX for perp DEX trading?",
    answer: "Choose only after comparing fees and funding alongside collateral, liquidation, oracle, wallet recovery and regional access; no single quoted rate settles the decision.",
  },
  "tokenized-treasuries-structure-access-risks": {
    title: "Tokenized Treasuries: BUIDL, BENJI, Ownership and Redemption Checks",
    description: "Check what a tokenized Treasury legally represents before comparing yield: issuer, recordkeeper, custodian, redemption path, wallet controls and eligibility.",
    question: "What should I verify before comparing tokenized Treasury yield?",
  },
};

function serpCtrNewsOverride(slug, locale) {
  return locale === "en" ? SERP_CTR_NEWS_OVERRIDES[slug] || null : null;
}

const REGIONAL_PREVIEW_SEO = {
  "/mx": ["México: preparación para MXN y SPEI — NexuAlpha", "Ruta de investigación para MXN, SPEI y la preparación de una cuenta de pagos local."],
  "/tw": ["台灣：新台幣開戶條件研究 — NexuAlpha", "繁體中文研究路徑，整理新台幣、銀行驗證與帳戶條件。"],
  "/id": ["Indonesia: IDR deposit path research — NexuAlpha", "Research path for IDR deposits, local payment methods and account conditions."],
  "/vn": ["Việt Nam crypto account research checklist — NexuAlpha", "Noindex research path for Vietnam crypto account checks: official domain, identity, VND or USDT funding, fees, limits and product scope, each verified in official sources."],
  "/hk": ["Hong Kong Crypto Account Eligibility Research — NexuAlpha", "Direct answer hub for Hong Kong crypto account checks: SFC platform status, HKD funding, identity, proof-of-address and product scope, verified in official sources."],
  "/eu": ["European Union Crypto Platform Eligibility Research — NexuAlpha", "EU crypto platform checks: ESMA MiCA register, country scope, EUR or SEPA funding, identity and product permissions must be verified in official sources."],
  "/uk": ["United Kingdom Crypto Account Eligibility Research — NexuAlpha", "Direct answer hub for UK crypto account checks: FCA registration, residence, identity or appropriateness checks, GBP funding and product scope, verified in official sources."],
  "/us": ["United States Crypto Account Verification Research — NexuAlpha", "Direct answer hub for U.S. crypto account checks: FinCEN MSB context, state licenses, USD funding, identity, residence and product scope, verified in official sources."],
  "/jp": ["日本の暗号資産プラットフォーム調査 — NexuAlpha", "金融庁の登録情報、本人確認、日本円入金、本人名義口座、商品範囲を公式情報で確認するための直接回答ハブです。"],
  "/kr": ["한국 암호화폐 플랫폼 조사 — NexuAlpha", "금융위원회·금융정보분석원 맥락, 본인확인, 실명확인 계좌, 원화 입출금과 상품 범위를 공식 자료로 확인하는 직접 답변 허브입니다."],
  "/sg": ["Singapore Crypto Account Verification Checklist — NexuAlpha", "Answer-first checklist for Singapore crypto accounts: verify MAS DPT context, SGD funding, PayNow, FAST and product scope only inside the official account flow."],
  "/markets/turkiye": ["Türkiye kripto platformu araştırması: SPK, TRY ve hesap kapsamı — NexuAlpha", "SPK geçici faaliyet ve tasfiye listeleri, kimlik adımları, TRY yatırma yolu ve ürün kapsamı için resmi kaynaklara dayalı doğrudan cevap merkezi."],
  "/int": ["International Crypto Account Checklist — NexuAlpha", "Set residence, product, funding route and account stage before choosing a crypto platform or following any registration path."],
};
const INDEXABLE_REGIONAL_PREVIEWS = new Set(["/mx", "/tw", "/id", "/hk", "/eu", "/uk", "/us", "/jp", "/kr", "/sg", "/markets/turkiye"]);
function regionalPreviewIsIndexable(canonicalPath, locale) {
  if (!INDEXABLE_REGIONAL_PREVIEWS.has(canonicalPath)) return false;
  return ({ "/mx": "es", "/tw": "zh-Hant", "/id": "id", "/hk": "zh-Hant", "/eu": "en", "/uk": "en", "/us": "en", "/jp": "ja", "/kr": "ko", "/sg": "en", "/markets/turkiye": "tr" })[canonicalPath] === locale;
}
function regionalPreviewCanonicalLocale(canonicalPath, locale) {
  if (canonicalPath === "/mx") return "es";
  return canonicalPath === "/markets/turkiye" ? "tr" : locale;
}
const CLEAN_REGIONAL_ROOTS = new Set(["/br", "/mx", "/tw", "/id", "/vn", "/hk", "/eu", "/uk", "/us", "/jp", "/kr", "/sg", "/int"]);
function regionalPreviewCanonicalUrl(canonicalPath, locale) {
  return CLEAN_REGIONAL_ROOTS.has(canonicalPath)
    ? `${PUBLIC_ORIGIN}${canonicalPath}`
    : localizedCanonical(canonicalPath, regionalPreviewCanonicalLocale(canonicalPath, locale));
}
const REGIONAL_PREVIEW_FAQ = {
  "/tw": {
    "zh-Hant": {
      question: "台灣用戶選擇加密貨幣平台前，應如何理解金管會法規與洗錢防制登記？",
      answer: "先確認金管會公布的現行法規、施行日期與服務主體。已公布的法律可能仍有部分條文尚未施行；完成洗錢防制或 VASP 登記也不等於金管會保證帳戶獲批、平台安全、新台幣入出金或任何商品可用。最後仍要在官方帳戶流程核對身分、本人銀行帳戶、費用、限額與商品範圍。",
    },
  },
  "/mx": {
    es: {
      question: "¿Qué debe confirmar un usuario mexicano sobre SPEI antes de elegir una plataforma?",
      answer: "Un usuario mexicano debe empezar por SPEI y MXN como ruta de pago, después confirmar identidad, residencia, producto y condiciones de cuenta en el flujo oficial de la plataforma. Banxico, Binance y CNBV ayudan a delimitar la investigación, pero no garantizan apertura, depósito, producto o beneficio para una cuenta concreta.",
    },
  },
  "/jp": {
    ja: {
      question: "日本で暗号資産プラットフォームを選ぶ前に何を確認すべきですか？",
      answer: "日本の利用者は、金融庁の登録情報、公式プラットフォームの本人確認、日本円入金、本人名義口座、利用できる商品範囲を確認してください。登録情報は口座資格や特典を保証しません。",
    },
  },
  "/kr": {
    ko: {
      question: "한국에서 암호화폐 플랫폼을 선택하기 전에 무엇을 확인해야 하나요?",
      answer: "금융위원회와 금융정보분석원의 공식 맥락, 본인확인, 실명확인 계좌, 원화 입출금, 상품 범위와 계정별 조건을 각각 확인해야 합니다. 공식 자료는 특정 계정의 승인이나 혜택을 보장하지 않습니다.",
    },
  },
  "/sg": {
    en: {
      question: "What should a Singapore user verify before choosing a crypto platform?",
      answer: "For Singapore, use MAS Digital Payment Token service context, SGD, PayNow and FAST only as account-screen verification inputs. Confirm the platform's official account flow, identity and residence checks, service entity, payment rail visibility, fees, limits and product scope before acting; a listing or Singapore-facing page does not prove account approval, funding access, product access or benefits.",
    },
  },
  "/hk": {
    "zh-Hant": {
      question: "香港使用者如何用 SFC 名單核對平台狀態，而不把名單誤認為開戶或產品保證？",
      answer: "先查閱 SFC 虛擬資產交易平台名單及平台官方資料，再在官方帳戶流程核對居住地、身分、地址證明、2FA、本人銀行帳戶、HKD 銀行轉帳、eDDA、鏈上轉帳、費用、hold 與產品範圍。這些資料不保證開戶批准、產品適用性、費用結果、用戶權益或註冊歸因。",
    },
  },
  "/eu": {
    en: {
      question: "What should an EU user verify before choosing a crypto platform?",
      answer: "Start with ESMA MiCA register context, then confirm the service entity, country of residence, identity checks, EUR or SEPA funding route and product scope inside the official account flow. A register entry or payment guide does not guarantee account approval, product access or user benefits.",
    },
  },
  "/uk": {
    en: {
      question: "What should a UK user verify before choosing a crypto platform?",
      answer: "Start with FCA cryptoasset registration guidance, then confirm UK residence, identity or appropriateness checks, GBP funding, bank-name matching, product scope and current onboarding terms in the official platform account flow. Public sources do not guarantee registration, funding or benefits for a specific user.",
    },
  },
  "/us": {
    en: {
      question: "Does FinCEN MSB registration prove that a U.S. crypto platform is endorsed or safe for every account?",
      answer: "Start with FinCEN MSB registration as BSA context, then check NMLS or NYDFS state records, SEC and CFTC risk context, identity, residence, USD funding rails, bank-name matching, holds, state exclusions and product scope in the official account flow. Public sources do not prove account approval, endorsement, USD availability, product access, benefit eligibility or registration attribution for a specific user.",
    },
  },
  "/markets/turkiye": {
    tr: {
      question: "Türkiye'de kripto platformu seçmeden önce SPK listesi nasıl okunmalıdır?",
      answer: "SPK'nın geçici faaliyet listesi ve tasfiye listesi ayrı okunmalıdır. Bir adın listede görünmesi hesap uygunluğu, ürün erişimi, kayıt sonucu veya kullanıcı faydası anlamına gelmez; kimlik, TRY yatırma ve ürün kapsamı resmi hesap akışında doğrulanmalıdır.",
    },
  },
};
const REGIONAL_PREVIEW_SOURCE_URLS = {
  "/tw": ["https://law.fsc.gov.tw/LawContent.aspx?id=GL004301", "https://law.fsc.gov.tw/LawContent.aspx?id=GL004000", "https://www.fsc.gov.tw/userfiles/file/1141114%E5%AE%8C%E6%88%90%E6%B4%97%E9%8C%A2%E9%98%B2%E5%88%B6%E7%99%BB%E8%A8%98%E4%B9%8BVASP%E6%A5%AD%E8%80%85%E5%90%8D%E5%96%AE%28%E6%9B%B4%E6%8B%93%E8%8D%92%E8%B3%87%E6%9C%AC%E9%A1%8D.pdf", "https://support.maicoin.com/zh-TW/support/solutions/articles/32000026522-max-%E6%96%B0%E5%8F%B0%E5%B9%A3%E5%85%A5%E9%87%91%E6%95%99%E5%AD%B8", "https://support.maicoin.com/zh-TW/support/solutions/articles/32000027069-%E8%A8%BB%E5%86%8A%E6%95%99%E5%AD%B8", "https://support.maicoin.com/zh-TW/support/solutions/articles/32000016129-%E5%A6%82%E4%BD%95%E9%A9%97%E8%AD%89%E9%8A%80%E8%A1%8C%E5%B8%B3%E8%99%9F-"],
  "/mx": ["https://www.banxico.org.mx/servicios/spei_-informacion-banco-mex.html", "https://www.binance.com/es-MX/support/faq/detail/c45b457e73a14580ab6be95f10bef5b5", "https://www.binance.com/es-MX/support/faq/detail/588ca3bd6b214a17bf1070a8189fb809", "https://www.gob.mx/cnbv/acciones-y-programas/sector-fintech"],
  "/hk": ["https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators/Lists-of-virtual-asset-trading-platforms", "https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators", "https://support.hashkey.com/hc/en-gb/articles/25794717042585-HashKey-Exchange-fiat-currency-deposit-guidelines-General", "https://support.hashkey.com/hc/en-gb/articles/48860678459801-Deposit-Guide-for-eDDA", "https://www.osl.com/hk-en/bits/article/osl-account-opening-and-2fa-setup-guide", "https://www.osl.com/hk-en/support/article/kA0fv00000002BVCAY?channel=PPXtZS"],
  "/eu": ["https://www.esma.europa.eu/et/node/200055", "https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-109-register-crypto-asset-white", "https://help.coinbase.com/en-gb/coinbase/getting-started/add-a-payment-method/add-and-verify-pm-emea"],
  "/uk": ["https://www.fca.org.uk/firms/cryptoassets/who-needs-register", "https://www.fca.org.uk/firms/cryptoassets/how-apply-registration", "https://help.coinbase.com/en-gb/coinbase/trading-and-funding/depositing-or-withdrawing-fiat-money/funding-your-account-emea"],
  "/us": ["https://www.fincen.gov/resources/money-services-business-msb-registration", "https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-persons-administering", "https://www.sec.gov/resources-small-businesses/capital-raising-building-blocks/crypto-assets-federal-securities-laws", "https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/understand_risks_of_virtual_currency.html", "https://www.nmlsconsumeraccess.org/", "https://www.dfs.ny.gov/virtual_currency_businesses", "https://help.coinbase.com/en/exchange/trading-and-funding/funding-your-account-with-usd", "https://support.kraken.com/in/articles/quick-start-for-clients-in-the-united-states", "https://support.binance.us/en/collections/10384430-deposits-withdrawals"],
  "/jp": ["https://www.fsa.go.jp/en/regulated/licensed/en_kasoutuka.pdf", "https://bitflyer.com/en-jp/s/how-to-start", "https://bitflyer.com/en-jp/faq"],
  "/kr": ["https://www.fsc.go.kr/eng/pr010101/81698", "https://www.kofiu.go.kr/eng/legislation/legislation.do", "https://support.upbit.com/hc/ko/articles/900006825383-%ED%9A%8C%EC%9B%90-%EA%B0%80%EC%9E%85%EC%9D%80-%EC%96%B4%EB%96%BB%EA%B2%8C-%ED%95%98%EB%82%98%EC%9A%94"],
  "/sg": ["https://eservices.mas.gov.sg/fid/institution?activity=Digital+Payment+Token+Service", "https://www.mas.gov.sg/regulation/payments/licensing-for-payment-service-providers/types-of-payment-services", "https://www.coinbase.com/en-sg", "https://www.independentreserve.com/"],
  "/markets/turkiye": ["https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi", "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/tasfiye-surecinde-olanlar-listesi", "https://www.paribu.com/destek/try-transactions/try-deposit"],
};
const REGIONAL_PREVIEW_RELATED_LINKS = {
  "/tw": ["/methodology", "/exchanges?market=TW&product=spot", "/rates?market=TW&product=spot", "/compare/binance-vs-okx?market=TW&product=spot"],
  "/mx": ["/methodology", "/exchanges", "/compare/binance-vs-okx", "/rates"],
  "/hk": ["/methodology", "/exchanges?market=HK&product=spot&locale=zh-Hant", "/rates?market=HK&product=spot&locale=zh-Hant", "/compare/binance-vs-okx?market=HK&product=spot&locale=zh-Hant", "/factbook/hashkey"],
  "/eu": ["/methodology", "/news/esma-mica-register-how-to-check-casp-issuer-status", "/factbook/coinbase"],
  "/uk": ["/methodology", "/exchanges", "/factbook/coinbase"],
  "/us": ["/methodology", "/exchanges?market=US&product=spot", "/rates?market=US&product=spot", "/compare/coinbase-vs-kraken?market=US&product=spot"],
  "/jp": ["/methodology", "/exchanges"],
  "/kr": ["/methodology", "/exchanges"],
  "/sg": ["/exchanges?market=SG&product=spot", "/rates?market=SG&product=spot", "/compare/binance-vs-okx?market=SG&product=spot"],
  "/markets/turkiye": ["/methodology", "/exchanges", "/markets/turkiye"],
};
const REGIONAL_PREVIEW_EXTRA_FAQ = {
  "/tw": { "zh-Hant": [["洗錢防制或 VASP 登記是否代表帳戶與商品一定可用？", "不是。登記只提供特定監理脈絡，不是帳戶核准、平台背書、資產安全、新台幣入出金或商品權限的保證。"], ["台灣用戶在入金前要核對哪些帳戶條件？", "在官方帳戶畫面逐項確認身分驗證、本人名義銀行帳戶、新台幣入金與出金、費用、限額、處理時間及目標商品；公開資料不能代替帳戶結果。"]] },
  "/mx": { es: [["¿Qué debe revisar un usuario mexicano sobre identidad, residencia y cuenta antes de seguir la ruta oficial?", "No. Las fuentes oficiales permiten revisar identidad, residencia, MXN, SPEI, producto y marco regulatorio, pero la disponibilidad final se decide dentro de la cuenta oficial."], ["¿Cómo debe comprobar un usuario mexicano que el producto que busca está disponible para su cuenta y región?", "Debe abrir el flujo oficial del producto que quiere usar y comprobar entidad, dominio, permisos, comisiones y restricciones regionales antes de depositar o registrarse."]] },
  "/hk": { "zh-Hant": [
    ["香港用戶在使用 HKD 銀行轉帳或 eDDA 前，需要核對哪些本人帳戶、費用與 hold 條件？", "不能只看公開來源。請把 SFC 與平台官方資料當作核驗地圖，並在官方帳戶流程確認本人銀行帳戶、HKD 銀行轉帳、eDDA、最低金額、費用、hold、銀行處理時間與退回規則。"],
    ["香港用戶在提交身分與地址證明後，還要如何核對產品範圍與帳戶狀態？", "提交身分與地址證明後，仍要在官方帳戶畫面核對帳戶狀態、2FA、銀行驗證、鏈上轉帳、現貨或其他產品範圍；公開來源不能替代帳戶結果。"],
  ] },
  "/eu": { en: [["Does a MiCA or ESMA register record prove all EU products are available?", "No. Register context must be paired with the service entity, Member State, identity checks, EUR or SEPA route and the exact product permission shown in the official account flow."]] },
  "/uk": { en: [["Does FCA registration guidance prove a UK user can trade every product?", "No. FCA context is a starting point. The user still needs UK residence checks, identity or appropriateness steps, GBP funding conditions, bank-name matching and official product-scope confirmation."]] },
  "/us": { en: [["Which NMLS or NYDFS state-license checks should a U.S. user review before relying on a crypto account route?", "FinCEN MSB registration, NMLS records, NYDFS context, SEC materials and CFTC risk guidance are research inputs. A U.S. user still needs state, identity, USD rail, bank-name, hold, product and account-stage checks in the official account flow."], ["What USD, ACH, wire, bank-name and withdrawal-hold checks should a U.S. user verify in the official account flow?", "ACH, wire, debit-card, crypto transfer, cash-out and withdrawal permissions can differ by state, platform, identity status and current account controls. Treat every USD rail as account-specific until the official screen confirms it."]] },
  "/jp": { ja: [["金融庁の登録情報だけで口座開設や入金は判断できますか？", "判断できません。登録情報は確認の出発点です。本人確認、本人名義口座、日本円入金、商品範囲、公式アプリや口座画面の条件を別々に確認してください。"]] },
  "/kr": { ko: [["공식 규제 맥락만으로 원화 입금과 상품 이용이 보장되나요?", "아닙니다. FSC·KoFIU 맥락은 출발점입니다. 본인확인, 실명확인 계좌, 원화 입출금, 상품 범위와 계정별 조건은 공식 계정 화면에서 별도로 확인해야 합니다."]] },
  "/sg": { en: [["Does seeing SGD, PayNow or FAST in a Singapore source prove my account can use them?", "No. SGD, PayNow and FAST are account-screen checks, not public promises. Keep the market, product and locale context attached while moving from directory to rates to comparison checks."]] },
  "/markets/turkiye": { tr: [["SPK listesi TRY yatırma veya ürün erişimini kanıtlar mı?", "Hayır. SPK listesi durum kontrolü sağlar; kimlik, adres, yatırımcı profili, TRY banka transferi ve ürün kapsamı resmi platform akışında ayrı ayrı doğrulanmalıdır."]] },
};
function regionalPreviewFaqEntries(canonicalPath, locale) {
  const primary = REGIONAL_PREVIEW_FAQ[canonicalPath]?.[locale];
  const extras = REGIONAL_PREVIEW_EXTRA_FAQ[canonicalPath]?.[locale] || [];
  return [
    ...(primary ? [{ question: primary.question, answer: primary.answer }] : []),
    ...extras.map(([question, answer]) => ({ question, answer })),
  ];
}
const MX_DECISION_SOURCE_URLS = REGIONAL_PREVIEW_SOURCE_URLS["/mx"];
const MX_DECISION_LINKS = {
  "/mx/comparar": ["/mx", "/mx/costos", "/mx/conta", "/compare/binance-vs-okx?market=MX&product=spot&locale=es", "/exchanges?market=MX&product=spot&locale=es"],
  "/mx/costos": ["/mx", "/mx/comparar", "/mx/conta", "/rates?market=MX&product=spot&locale=es", "/methodology"],
  "/mx/conta": ["/mx", "/mx/comparar", "/mx/costos", "/exchanges?market=MX&product=spot&locale=es", "/methodology#disclosure"],
};
const MX_DECISION_SEO = {
  "/mx/comparar": {
    title: "Comparar exchanges en México: MXN, SPEI y cuenta oficial — NexuAlpha",
    description: "Compara Binance, OKX y otros candidatos para México separando MXN, SPEI, identidad, producto, dominio oficial y condiciones de cuenta antes del registro.",
    faq: [
      ["¿Cómo comparar Binance, OKX y otros candidatos para México sin asumir que todos tienen MXN o SPEI?", "Empieza por la ruta documentada de Binance para MXN/SPEI y compara OKX u otros candidatos solo desde su dominio y flujo oficial de cuenta. Ninguna comparación externa prueba que todos tengan MXN, SPEI, el mismo producto o una promoción activa para México."],
      ["¿Qué enlaces internos debe revisar un usuario mexicano antes del CTA?", "Usa la página principal de México para el mapa de fuentes, la página de costes para separar comisiones y la página de cuenta para distinguir partner, código, beneficio y aprobación de cuenta antes de abrir el enlace oficial."],
      ["¿Una comparación pública demuestra que una plataforma acepta mi depósito?", "No. La comparación reduce la lista de candidatos, pero el método de fondeo, identidad, residencia, límites, producto y condiciones finales se confirman dentro de la cuenta oficial."],
    ],
  },
  "/mx/costos": {
    title: "Costos cripto en México: MXN, SPEI, spot y tarifa de cuenta — NexuAlpha",
    description: "Separa comisión spot, coste de entrada MXN/SPEI, spread, retiro, límites y condiciones de cuenta para México antes de registrarte o depositar.",
    faq: [
      ["¿Qué costes debe separar un usuario mexicano antes de depositar MXN o abrir una orden spot?", "Separa comisión maker/taker, coste del método de entrada, spread, retiro, límites, tiempo de proceso, nivel de cuenta y producto. SPEI o MXN en una fuente pública no sustituyen la tarifa final mostrada por la cuenta oficial."],
      ["¿La calculadora de costes sustituye la tabla oficial?", "No. Sirve para comparar hipótesis antes del registro. La comisión aplicable, el método disponible, los límites y cualquier coste de transferencia deben venir del flujo oficial de la plataforma."],
      ["¿Qué debe pasar antes de depositar MXN?", "El usuario debe ver el método de fondeo, la cuenta bancaria, el importe, la comisión, el límite, el tiempo y el estado de la orden en la pantalla oficial de su propia cuenta."],
    ],
  },
  "/mx/conta": {
    title: "Cuenta cripto en México: partner, código, beneficio y KYC — NexuAlpha",
    description: "Distingue enlace de partner, código, beneficio, KYC, residencia, producto y aprobación de cuenta para México antes de seguir una ruta oficial.",
    faq: [
      ["¿Qué diferencia hay entre enlace de partner, código, beneficio y aprobación de cuenta para México?", "El enlace de partner es una ruta de registro; el código o beneficio son condiciones que solo la plataforma puede mostrar como aplicables. KYC, residencia, producto, campaña, depósito, operación y atribución de registro deben verificarse en la cuenta oficial."],
      ["¿Un enlace con partner garantiza bono o descuento en México?", "No. Puede identificar una ruta de registro, pero no prueba aprobación de cuenta, elegibilidad, beneficio, comisión final, producto disponible ni atribución hasta que el flujo oficial lo muestre."],
      ["¿Qué debe guardar el usuario antes de continuar?", "Debe guardar o revisar la pantalla oficial con dominio, código cuando aparezca, tareas, producto, plazo, KYC, método de fondeo y condiciones aplicables a su cuenta."],
    ],
  },
};
const MX_DECISION_SEO_EN = {
  "/mx/comparar": {
    title: "Mexico: compare Binance, OKX and other candidates before registration — NexuAlpha",
    description: "A Mexico comparison page that separates the documented MXN/SPEI route, official domain, identity checks, product scope and account conditions before any CTA.",
  },
  "/mx/costos": {
    title: "Mexico: separate spot fee, MXN/SPEI, spread, withdrawal and account conditions — NexuAlpha",
    description: "A Mexico cost page that turns a registration decision into an editable cost hypothesis, with clear limits between published fees and final account costs.",
  },
  "/mx/conta": {
    title: "Mexico: account, partner route, code, KYC and benefit before registration — NexuAlpha",
    description: "A Mexico account page that separates partner link, visible code, benefit, KYC, residence, product and approval before continuing to official registration.",
  },
};
function mxDecisionSchemas(canonicalPath, title, locale) {
  const canonicalUrl = `${PUBLIC_ORIGIN}${canonicalPath}`;
  const config = MX_DECISION_SEO[canonicalPath];
  return [
    pageBreadcrumb(title, canonicalUrl, "Markets", "/exchanges", locale),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      url: canonicalUrl,
      inLanguage: locale,
      dateModified: "2026-09-29",
      ...researchAttribution(MX_DECISION_SOURCE_URLS),
      isBasedOn: MX_DECISION_SOURCE_URLS,
      relatedLink: MX_DECISION_LINKS[canonicalPath].map((link) => `${PUBLIC_ORIGIN}${link}`),
    },
    ...(locale === "en" ? [] : [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: config.faq.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer, citation: MX_DECISION_SOURCE_URLS.slice(0, 4) },
      })),
    }]),
  ];
}
const REGIONAL_PREVIEW_SEO_LOCALIZED = {
  "/us": {
    en: ["United States crypto account checks: FinCEN, state licenses, USD rails — NexuAlpha", "Research-only U.S. checklist for FinCEN MSB context, NMLS or NYDFS state checks, USD funding rails, identity, residence, holds and spot product scope."],
  },
  "/kr": {
    ko: ["한국 암호화폐 플랫폼 조사: 본인확인, 원화 입출금과 상품 범위 — NexuAlpha", "금융위원회와 금융정보분석원 공식 맥락, 본인확인, 실명확인 계좌, 원화 입출금과 상품 범위를 따로 확인하세요."],
  },
  "/mx": {
    en: ["Mexico: compare MXN, SPEI and identity before opening an account — NexuAlpha", "A Mexico-specific research path that separates SPEI, bank-account ownership, identity checks, product scope and official account conditions before registration."],
    ja: ["メキシコの暗号資産調査：MXN・SPEI — NexuAlpha", "MXN、SPEI、本人確認、地域ごとのアカウント条件を確認します。"],
    ko: ["멕시코 암호화폐 조사: MXN·SPEI — NexuAlpha", "MXN, SPEI, 본인확인 및 지역별 계정 조건을 확인합니다."],
    tr: ["Meksika kripto araştırması: MXN ve SPEI — NexuAlpha", "MXN, SPEI, kimlik doğrulama ve bölgesel hesap koşullarını inceler."],
    fr: ["Recherche crypto au Mexique : MXN et SPEI — NexuAlpha", "Vérifiez MXN, SPEI, l’identité et les conditions de compte régionales."],
    de: ["Krypto-Recherche Mexiko: MXN und SPEI — NexuAlpha", "Prüfen Sie MXN, SPEI, Identität und regionale Kontobedingungen."],
    "pt-BR": ["Pesquisa cripto no México: MXN e SPEI — NexuAlpha", "Verifique MXN, SPEI, identidade e condições regionais da conta."],
    "zh-Hans": ["墨西哥加密资产研究：MXN 与 SPEI — NexuAlpha", "整理 MXN、SPEI、身份核验与地区账户条件。"],
    "zh-Hant": ["墨西哥加密資產研究：MXN 與 SPEI — NexuAlpha", "整理 MXN、SPEI、身份核驗與地區帳戶條件。"],
    es: ["Investigación cripto en México: MXN y SPEI — NexuAlpha", "Analiza MXN, SPEI, identidad y condiciones regionales de la cuenta."],
    ar: ["بحث العملات الرقمية في المكسيك: MXN وSPEI — NexuAlpha", "تحقق من MXN وSPEI والهوية وشروط الحساب الإقليمية."],
    ru: ["Исследование криптоплатформ Мексики: MXN и SPEI — NexuAlpha", "Проверьте MXN, SPEI, личность и региональные условия аккаунта."],
    id: ["Riset kripto Meksiko: MXN dan SPEI — NexuAlpha", "Periksa MXN, SPEI, identitas, dan ketentuan akun regional."],
    vi: ["Nghiên cứu crypto tại Mexico: MXN và SPEI — NexuAlpha", "Kiểm tra MXN, SPEI, danh tính và điều kiện tài khoản theo khu vực."],
    it: ["Ricerca crypto in Messico: MXN e SPEI — NexuAlpha", "Verifica MXN, SPEI, identità e condizioni regionali dell’account."],
  },
  "/tw": {
    "zh-Hant": ["台灣加密貨幣平台核對：金管會、VASP 登記與新台幣入金 — NexuAlpha", "以繁體中文核對金管會法規的公布與施行狀態、洗錢防制或 VASP 登記邊界、本人銀行帳戶、新台幣入出金、身分驗證、費用限額與商品範圍。"],
    ja: ["台湾の暗号資産調査：TWD入金条件 — NexuAlpha", "台湾ドル入金、銀行確認、本人確認、商品範囲を確認します。"],
    ko: ["대만 암호화폐 조사: TWD 입금 조건 — NexuAlpha", "TWD 입금, 은행 확인, 본인확인 및 상품 범위를 확인합니다."],
    tr: ["Tayvan kripto araştırması: TWD fonlama koşulları — NexuAlpha", "TWD fonlama, banka doğrulaması, kimlik ve ürün kapsamını inceler."],
    fr: ["Recherche crypto à Taïwan : conditions TWD — NexuAlpha", "Vérifiez les dépôts TWD, la banque, l’identité et les produits."],
    de: ["Krypto-Recherche Taiwan: TWD-Einzahlungsbedingungen — NexuAlpha", "Prüfen Sie TWD-Einzahlungen, Bankprüfung, Identität und Produkte."],
    "pt-BR": ["Pesquisa cripto em Taiwan: condições de depósito em TWD — NexuAlpha", "Verifique depósitos em TWD, banco, identidade e produtos."],
    es: ["Investigación cripto en Taiwán: depósitos TWD — NexuAlpha", "Analiza depósitos TWD, verificación bancaria, identidad y productos."],
    ar: ["بحث العملات الرقمية في تايوان: إيداعات TWD — NexuAlpha", "تحقق من إيداعات TWD والبنك والهوية والمنتجات."],
    ru: ["Исследование криптоплатформ Тайваня: пополнение в TWD — NexuAlpha", "Проверьте пополнение в TWD, банк, личность и продукты."],
    id: ["Riset kripto Taiwan: setoran TWD — NexuAlpha", "Periksa setoran TWD, verifikasi bank, identitas, dan produk."],
    vi: ["Nghiên cứu crypto tại Đài Loan: nạp TWD — NexuAlpha", "Kiểm tra nạp TWD, ngân hàng, danh tính và sản phẩm."],
    it: ["Ricerca crypto a Taiwan: depositi TWD — NexuAlpha", "Verifica depositi TWD, banca, identità e prodotti."],
  },
  "/hk": {
    "zh-Hans": ["香港加密平台账户资格研究 — NexuAlpha", "整理港币入金、身份核验与平台产品适用范围的研究路径。"],
    "zh-Hant": ["香港加密平台帳戶核對：SFC、HKD、eDDA 與產品範圍 — NexuAlpha", "以繁體中文核對 SFC 平台狀態、HKD 銀行轉帳、eDDA、身分與地址證明、本人銀行帳戶、費用 hold、鏈上轉帳與產品範圍；結果以官方帳戶流程為準。"],
    ar: ["بحث شروط حسابات منصات العملات الرقمية في هونغ كونغ — NexuAlpha", "تحقق من إيداعات HKD والهوية وإتاحة المنتجات حسب المنصة."], ru: ["Исследование условий криптоаккаунтов в Гонконге — NexuAlpha", "Проверьте пополнение в HKD, личность и доступ к продуктам."], "pt-BR": ["Pesquisa de contas cripto em Hong Kong — NexuAlpha", "Verifique depósitos em HKD, identidade e acesso a produtos por plataforma."], vi: ["Nghiên cứu điều kiện tài khoản crypto tại Hong Kong — NexuAlpha", "Kiểm tra nạp HKD, danh tính và quyền dùng sản phẩm theo nền tảng."], it: ["Ricerca sui conti crypto a Hong Kong — NexuAlpha", "Verifica depositi HKD, identità e accesso ai prodotti per piattaforma."], id: ["Riset ketentuan akun kripto Hong Kong — NexuAlpha", "Periksa deposit HKD, identitas, dan akses produk menurut platform."],
    "zh-Hant": ["香港加密平台帳戶核對：SFC、HKD、eDDA 與產品範圍 — NexuAlpha", "以繁體中文核對 SFC 平台狀態、HKD 銀行轉帳、eDDA、身分與地址證明、本人銀行帳戶、費用 hold、鏈上轉帳與產品範圍；結果以官方帳戶流程為準。"],
    ja: ["香港の暗号資産口座条件調査 — NexuAlpha", "香港ドル入金、本人確認、プラットフォームごとの商品利用条件を確認します。"],
    ko: ["홍콩 암호화폐 계정 조건 조사 — NexuAlpha", "홍콩달러 입금, 본인확인 및 플랫폼별 상품 이용 조건을 확인합니다."],
    tr: ["Hong Kong kripto hesap koşulları araştırması — NexuAlpha", "HKD fonlama, kimlik kontrolleri ve platforma göre ürün erişimini inceler."],
    es: ["Investigación de cuentas cripto en Hong Kong — NexuAlpha", "Analiza depósitos en HKD, identidad y acceso a productos según la plataforma."],
    fr: ["Étude des comptes crypto à Hong Kong — NexuAlpha", "Analyse des dépôts en HKD, de l’identité et de l’accès aux produits."],
    de: ["Krypto-Kontobedingungen in Hongkong — NexuAlpha", "Recherche zu HKD-Einzahlungen, Identität und plattformabhängigem Produktzugang."],
  },
  "/eu": {
    "zh-Hans": ["欧盟加密平台账户条件研究 — NexuAlpha", "整理欧元、SEPA 和各国账户条件的研究路径。"],
    "zh-Hant": ["歐盟加密平台帳戶條件研究 — NexuAlpha", "整理歐元、SEPA 與各國帳戶條件的研究路徑。"],
    ar: ["بحث شروط منصات العملات الرقمية في الاتحاد الأوروبي — NexuAlpha", "تحقق من EUR وSEPA وشروط الحساب حسب الدولة."], ru: ["Исследование условий криптоплатформ в ЕС — NexuAlpha", "Проверьте EUR, SEPA и условия аккаунта по странам."], "pt-BR": ["Pesquisa de plataformas cripto na UE — NexuAlpha", "Verifique EUR, SEPA e condições de conta por país."], vi: ["Nghiên cứu nền tảng crypto tại EU — NexuAlpha", "Kiểm tra EUR, SEPA và điều kiện tài khoản theo quốc gia."], it: ["Ricerca sulle piattaforme crypto nell’UE — NexuAlpha", "Verifica EUR, SEPA e condizioni dell’account per paese."], id: ["Riset platform kripto di Uni Eropa — NexuAlpha", "Periksa EUR, SEPA, dan ketentuan akun menurut negara."],
    de: ["Krypto-Plattformen in der EU: Konto- und Länderbedingungen — NexuAlpha", "Recherche zu EUR, SEPA und länderspezifischen Bedingungen für Plattformkonten."],
    ja: ["EU暗号資産プラットフォームの口座条件調査 — NexuAlpha", "EUR、SEPA、国別の本人確認と口座条件を確認します。"],
    ko: ["EU 암호화폐 플랫폼 계정 조건 조사 — NexuAlpha", "EUR, SEPA 및 국가별 플랫폼 계정 조건을 확인합니다."],
    tr: ["AB kripto platformu hesap koşulları araştırması — NexuAlpha", "EUR, SEPA ve ülkeye göre platform hesap koşullarını inceler."],
    es: ["Investigación de plataformas cripto en la UE — NexuAlpha", "Analiza EUR, SEPA y las condiciones de cuenta específicas de cada país."],
    fr: ["Étude des plateformes crypto dans l’UE — NexuAlpha", "Recherche sur l’EUR, SEPA et les conditions de compte propres à chaque pays."],
  },
  "/uk": {
    "zh-Hans": ["英国加密账户条件研究 — NexuAlpha", "整理英镑入金、居住验证和平台产品范围。"],
    "zh-Hant": ["英國加密帳戶條件研究 — NexuAlpha", "整理英鎊入金、居住驗證與平台產品範圍。"],
    ar: ["بحث شروط الحسابات الرقمية في المملكة المتحدة — NexuAlpha", "تحقق من تمويل GBP والإقامة ونطاق المنتجات."], ru: ["Исследование условий криптоаккаунтов в Великобритании — NexuAlpha", "Проверьте пополнение в GBP, резидентство и доступность продуктов."], "pt-BR": ["Pesquisa de contas cripto no Reino Unido — NexuAlpha", "Verifique depósitos em GBP, residência e escopo dos produtos."], vi: ["Nghiên cứu điều kiện tài khoản crypto tại Vương quốc Anh — NexuAlpha", "Kiểm tra nạp GBP, cư trú và phạm vi sản phẩm."], it: ["Ricerca sui conti crypto nel Regno Unito — NexuAlpha", "Verifica depositi GBP, residenza e ambito dei prodotti."], id: ["Riset ketentuan akun kripto Inggris — NexuAlpha", "Periksa deposit GBP, domisili, dan cakupan produk."],
    ja: ["英国の暗号資産口座条件調査 — NexuAlpha", "GBP入金、居住確認、プラットフォームごとの商品範囲を確認します。"],
    ko: ["영국 암호화폐 계정 조건 조사 — NexuAlpha", "GBP 입금, 거주지 확인 및 플랫폼별 상품 범위를 확인합니다."],
    tr: ["Birleşik Krallık kripto hesap koşulları araştırması — NexuAlpha", "GBP fonlama, ikamet kontrolleri ve platform ürün kapsamını inceler."],
    es: ["Investigación de cuentas cripto en Reino Unido — NexuAlpha", "Analiza depósitos en GBP, residencia y alcance de productos."],
    fr: ["Étude des comptes crypto au Royaume-Uni — NexuAlpha", "Analyse des dépôts en GBP, de la résidence et du périmètre des produits."],
    de: ["Krypto-Kontobedingungen im Vereinigten Königreich — NexuAlpha", "Recherche zu GBP-Einzahlungen, Wohnsitzprüfung und Produktumfang."],
  },
  "/id": {
    id: ["Riset jalur deposit IDR di Indonesia — NexuAlpha", "Riset deposit IDR, metode pembayaran lokal, dan ketentuan akun platform."],
    ja: ["インドネシアの暗号資産入金ルート調査 — NexuAlpha", "インドネシアのIDR入金、現地決済方法、アカウント条件を確認します。"],
    ko: ["인도네시아 IDR 입금 경로 조사 — NexuAlpha", "IDR 입금, 현지 결제 수단 및 플랫폼 계정 조건을 확인합니다."],
    tr: ["Endonezya IDR para yatırma yolu araştırması — NexuAlpha", "IDR yatırma, yerel ödeme yöntemleri ve platform hesap koşullarını inceler."],
    fr: ["Étude des dépôts IDR en Indonésie — NexuAlpha", "Analyse des dépôts IDR, des paiements locaux et des conditions de compte."],
    de: ["Recherche zu IDR-Einzahlungen in Indonesien — NexuAlpha", "Recherche zu IDR-Einzahlungen, lokalen Zahlungsmethoden und Kontobedingungen."],
    "pt-BR": ["Pesquisa de depósitos em IDR na Indonésia — NexuAlpha", "Verifique depósitos em IDR, pagamentos locais e condições de conta."],
    es: ["Investigación de depósitos IDR en Indonesia — NexuAlpha", "Analiza depósitos IDR, métodos de pago locales y condiciones de cuenta."],
    ar: ["بحث مسار إيداع IDR في إندونيسيا — NexuAlpha", "تحقق من إيداع IDR وطرق الدفع المحلية وشروط الحساب."],
    ru: ["Исследование пополнения в IDR в Индонезии — NexuAlpha", "Проверьте пополнение в IDR, местные способы оплаты и условия аккаунта."],
    vi: ["Nghiên cứu nạp IDR tại Indonesia — NexuAlpha", "Kiểm tra nạp IDR, phương thức thanh toán địa phương và điều kiện tài khoản."],
    it: ["Ricerca sui depositi IDR in Indonesia — NexuAlpha", "Verifica depositi IDR, pagamenti locali e condizioni dell’account."],
    "zh-Hans": ["印度尼西亚 IDR 入金路径研究 — NexuAlpha", "整理 IDR 入金、本地支付方式与平台账户条件。"],
    "zh-Hant": ["印尼 IDR 入金路徑研究 — NexuAlpha", "整理 IDR 入金、本地支付方式與平台帳戶條件。"],
  },
  "/sg": {
    en: ["Singapore crypto account checks: MAS DPT, SGD, PayNow and FAST — NexuAlpha", "Answer-first Singapore checklist: MAS DPT, SGD, PayNow and FAST are account-screen checks; market, product and locale carry through the directory, rates and compare pages."],
  },
  "/markets/turkiye": {
    tr: ["Türkiye kripto platformu araştırması: SPK, TRY ve hesap kapsamı — NexuAlpha", "SPK geçici listesi, tasfiye listesi, Paribu hesap doğrulaması ve TRY yatırma kaynaklarını ayrı ayrı kontrol edin."],
  },
};
const ACTIVE_VENUE_SLUGS = new Set(ACTIVE_COMPARE_VENUE_SLUGS);
const SEARCH_REVIEWED_TRILINGUAL_VENUES = new Set(["drift", "deribit"]);
const prerenderManifests = new WeakMap();
const brazilCatalogs = new WeakMap();
function brazilPath(pathname) { return pathname === '/br' || pathname.startsWith('/br/'); }

function normalizePathname(pathname = "/") {
  const value = String(pathname || "/").split("#")[0].split("?")[0];
  if (!value || value === "/") return "/";
  return value.startsWith("/") ? value.replace(/\/+$/, "") || "/" : `/${value}`.replace(/\/+$/, "");
}

function hasPathPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function countryPrefixForPath(pathname) {
  return COUNTRY_ROUTE_PREFIXES.find((prefix) => hasPathPrefix(pathname, prefix)) || null;
}

function localePrefixForPath(pathname) {
  const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
  const locale = LOCALE_CODE_BY_PREFIX[firstSegment] || null;
  return locale ? { prefix: firstSegment, locale } : null;
}

function stripLocalePrefix(pathname, prefix) {
  const stripped = pathname.slice(prefix.length + 1);
  if (!stripped) return "/";
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

function isLocalePathEligible(pathname) {
  const normalized = normalizePathname(pathname);
  if (normalized === "/embed/calculator") return false;
  if (countryPrefixForPath(normalized)) return false;
  if (NON_LOCALIZED_PREFIXES.some((prefix) => hasPathPrefix(normalized, prefix))) return false;
  if (GLOBAL_EXACT_ROUTES.has(normalized)) return true;
  return GLOBAL_ROUTE_PREFIXES.some((prefix) => hasPathPrefix(normalized, prefix));
}

function parsePublicRoute(pathname, searchParams) {
  const publicPathname = normalizePathname(pathname);
  const params = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams || "");
  const queryLocale = params.get("locale");
  const countryPrefix = countryPrefixForPath(publicPathname);
  const pathLocale = countryPrefix ? null : localePrefixForPath(publicPathname);
  if (pathLocale && MIGRATED_PATH_LOCALES.has(pathLocale.locale)) {
    const contentPathname = normalizePathname(stripLocalePrefix(publicPathname, pathLocale.prefix));
    if (isLocalePathEligible(contentPathname)) {
      return { publicPathname, contentPathname, locale: pathLocale.locale, localeSource: "path", isCountryRoute: false, canonicalPathname: publicPathname };
    }
  }
  const isCountryRoute = Boolean(countryPrefix);
  if (queryLocale && UI_LOCALES.has(queryLocale)) return { publicPathname, contentPathname: publicPathname, locale: queryLocale, localeSource: "query", isCountryRoute, canonicalPathname: publicPathname };
  if (countryPrefix) return { publicPathname, contentPathname: publicPathname, locale: COUNTRY_LOCALE_BY_PREFIX[countryPrefix] || "en", localeSource: "market", isCountryRoute: true, canonicalPathname: publicPathname };
  return { publicPathname, contentPathname: publicPathname, locale: "en", localeSource: "default", isCountryRoute: false, canonicalPathname: publicPathname };
}

function localizedPath(pathname, locale = "en") {
  const normalized = normalizePathname(pathname);
  if (!UI_LOCALES.has(locale) || locale === "en") return normalized;
  if (!isLocalePathEligible(normalized)) return `${normalized}?locale=${encodeURIComponent(locale)}`;
  if (!MIGRATED_PATH_LOCALES.has(locale)) return `${normalized}?locale=${encodeURIComponent(locale)}`;
  const prefix = LOCALE_PREFIX_BY_CODE[locale];
  return normalized === "/" ? `/${prefix}` : `/${prefix}${normalized}`;
}

function preservedRedirectSearch(searchParams) {
  const next = new URLSearchParams();
  for (const [key, value] of searchParams) {
    if (key === "locale") continue;
    if (PRESERVED_REDIRECT_PARAMS.has(key) || key.startsWith("utm_")) next.append(key, value);
  }
  const serialized = next.toString();
  return serialized ? `?${serialized}` : "";
}

function legacyLocaleRedirect(url) {
  const chinesePathMatch = String(url.pathname || "").match(/^\/(zh-cn)(\/.*)?$/i);
  if (chinesePathMatch) {
    const suffix = chinesePathMatch[2] || "/";
    const contentPathname = normalizePathname(suffix);
    if (contentPathname !== "/" && !isLocalePathEligible(contentPathname)) return null;
    const preserved = preservedRedirectSearch(url.searchParams);
    return `${localizedPath(contentPathname, "zh-Hans")}${preserved}`;
  }
  const route = parsePublicRoute(url.pathname, url.searchParams);
  const queryLocale = url.searchParams.get("locale");
  if (route.localeSource === "path" && queryLocale) return `${route.canonicalPathname}${preservedRedirectSearch(url.searchParams)}`;
  if (queryLocale && queryLocale !== "pt-BR" && brazilPath(route.contentPathname)) return `${route.contentPathname}${preservedRedirectSearch(url.searchParams)}`;
  if (!queryLocale || !UI_LOCALES.has(queryLocale)) return null;
  if (queryLocale === "en" && isLocalePathEligible(route.contentPathname)) {
    return `${route.contentPathname}${preservedRedirectSearch(url.searchParams)}`;
  }
  if (!MIGRATED_PATH_LOCALES.has(queryLocale) || !isLocalePathEligible(route.contentPathname)) return null;
  return `${localizedPath(route.contentPathname, queryLocale)}${preservedRedirectSearch(url.searchParams)}`;
}

async function brazilMetadata(url, env) {
  if (!brazilCatalogs.has(env.ASSETS)) {
    const pending = env.ASSETS.fetch(new Request(new URL('/content/brazil-metadata.json', url)))
      .then((response) => response.ok ? response.json() : null)
      .then((value) => value?.version === 1 && value.pages && typeof value.pages === 'object' ? value.pages : null)
      .catch(() => null);
    brazilCatalogs.set(env.ASSETS, pending);
  }
  const pages = await brazilCatalogs.get(env.ASSETS);
  if (!pages) {
    brazilCatalogs.delete(env.ASSETS);
    return { ...notFoundMetadata(url.pathname, 'pt-BR'), status: 503, title: 'Conteúdo temporariamente indisponível | NexuAlpha' };
  }
  const page = Object.hasOwn(pages, url.pathname) ? pages[url.pathname] : null;
  if (!page) return notFoundMetadata(url.pathname, 'pt-BR');
  return { ...page, schema: page.schemas, marker: 'NEXUALPHA_BRAZIL_ROUTE_V1' };
}

function cleanSlug(value) {
  const slug = typeof value === "string" ? value.trim().toLowerCase() : "";
  return VALID_SLUG.test(slug) ? slug : null;
}

function sanitizePublicText(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/World\s*#?\s*\d+|#\s*[1-9]\b|industry[- ]leading|global leader|premier|preferred|top[- ]tier|undisputed/gi, "source-linked research")
    .replace(/zero[- ]slippage|near[- ]zero slippage|zero[- ]gas|zero[- ]maker fee|zero[- ]fee/gi, "published execution terms")
    .replace(/ultra[- ]low latency|sub[- ]millisecond|millisecond execution|fastest|instant(?:ly)?/gi, "published timing terms")
    .replace(/lowest(?: trading)? fees?|best(?:-in-class)?|most liquid|widest market selection/gi, "published fee and market terms")
    .replace(/\$\s?\d+(?:\.\d+)?\s?(?:m|b|million|billion)\+?/gi, "published fund or scale figure")
    .replace(/\b\d+%\s*(?:fee\s*)?(?:rebate|cashback|off)\b/gi, "user benefit pending verification")
    .replace(/\b(?:up to|max(?:imum)?|最高)\s*(?:\$|USDT|USD)?\s?[\d,.]+\s*(?:USDT|USD|USDT)?/gi, "published reward terms")
    .replace(/全球(?:流动性|深度)?第一|全网最低|全网最快|业内第一|行业领跑|首选|天花板|绝对安全|零滑点|最低费率|超低延迟|毫秒级撮合|极速开户/g, "来源研究")
    .replace(/\d+%\s*返佣/g, "用户权益（待核验）")
    .replace(/\d+%\s*(?:实时)?返现/g, "用户权益（待核验）")
    .replace(/百倍/g, "高波动")
    .replace(/权威/g, "独立研究")
    .replace(/终身(?:最高\s*)?\d+%\s*(?:手续费)?(?:返佣|返还|折扣)/g, "用户权益（待核验）")
    .replace(/终身(?:手续费)?(?:返佣|返还|折扣)/g, "用户权益（待核验）")
    .replace(/终身净有效费率/g, "账户净费率待核验")
    .replace(/独家/g, "平台特定")
    .replace(/0\s*手续费/g, "公开费率条件")
    .replace(/秒级(?:交互|结算|确认)/g, "公开执行时序")
    .replace(/秒级/g, "公开时序")
    .replace(/终身最高/g, "")
    .replace(/100x/g, "high-volatility");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function replaceOrInsert(html, expression, replacement) {
  // Function replacers: page text may contain "$'" or "$&", which String.replace would otherwise expand (QA 2026-10-11:
  // a Turkish research summary with "200$'a" truncated the SSR body and broke hydration on /tr/activities).
  if (expression.test(html)) return html.replace(expression, () => replacement);
  return html.replace(/<\/head>/i, () => `    ${replacement}\n  </head>`);
}

function routeLocale(url) {
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  if (publicRoute.localeSource === "path") return publicRoute.locale;
  if (publicRoute.localeSource === "market") return publicRoute.locale;
  if (publicRoute.contentPathname === "/mx") return publicRoute.locale === "en" ? "en" : "es";
  if (brazilPath(publicRoute.contentPathname)) return 'pt-BR';
  const requested = url.searchParams.get("locale");
  if (["zh-Hans", "zh-Hant"].includes(requested)) return requested;
  if (!requested) return "en";
  if (PRERENDERABLE_LOCALES.has(requested)) return requested;
  const base = requested.split(/[-_]/)[0].toLowerCase();
  if (base === "pt") return "pt-BR";
  return PRERENDERABLE_LOCALES.has(base) ? base : "en";
}

function prerenderLocale(url) {
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  if (publicRoute.localeSource === "path") return publicRoute.locale;
  if (publicRoute.localeSource === "market") return publicRoute.locale;
  const locale = url.searchParams.get("locale");
  if (publicRoute.contentPathname === "/mx") return publicRoute.locale === "en" ? "en" : "es";
  if (brazilPath(publicRoute.contentPathname)) return !locale || locale === 'pt-BR' ? 'pt-BR' : null;
  if (!locale) return "en";
  return PRERENDERABLE_LOCALES.has(locale) ? locale : null;
}

function prerenderRouteKey(url) {
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  const routePathname = publicRoute.localeSource === "path" ? publicRoute.contentPathname : url.pathname;
  let pathname = routePathname === "/index.html" ? "/" : routePathname;
  if (pathname === "/partners/embed-guide") pathname = "/partners";
  const ref = url.searchParams.get("ref");
  if (ref && !brazilPath(pathname)) {
    const slug = cleanSlug(ref);
    if (!slug) return null;
    pathname = `/ref/${slug}`;
  }
  // UTM/click IDs do not change page content. Route-level decision context
  // may change hydrated controls, but it must not make crawler HTML blank.
  const neutralKeys = new Set(["locale", "ref", "market", "product", "account_stage", "funding", "gclid", "fbclid", "msclkid", "publisher", "analytics_test"]);
  const brazilDecisionKeys = new Set(["market", "product", "platform", "amount", "spot_fee_bps", "deposit_fee_pct", "deposit_fixed_brl"]);
  const allowsRouteContext = (key) => {
    if (neutralKeys.has(key) || key.startsWith("utm_")) return true;
    if (brazilPath(pathname) && brazilDecisionKeys.has(key)) return true;
    return false;
  };
  if ([...url.searchParams.keys()].some((key) => !allowsRouteContext(key))) return null;
  if (url.searchParams.getAll("locale").length > 1 || url.searchParams.getAll("ref").length > 1) return null;
  const locale = prerenderLocale(url);
  return locale ? `${pathname}|${locale}` : null;
}

function localized(value, locale) {
  if (!value || typeof value !== "object") return "";
  return value[locale] || value.en || value["zh-Hans"] || "";
}

function localizedArticleText(value, locale) {
  return localized(value, locale) || (typeof value === "string" ? value : "");
}

function hasExactArticleText(value, locale) {
  return Boolean(value && typeof value === "object" && typeof value[locale] === "string" && value[locale].trim());
}

const NEWS_ARTICLE_ROUTE_PROJECTION_SOURCE = "nexualpha-news-route-projection-v1";

function articlePublishedLocales(article) {
  if (!article || typeof article !== "object") return [];
  const explicit = Array.isArray(article.availableLocales)
    ? article.availableLocales.filter((locale) => NEWS_INDEXABLE_LOCALES.includes(locale))
    : NEWS_INDEXABLE_LOCALES;
  const locales = explicit.filter((locale) => hasExactArticleText(article.title, locale)
    && hasExactArticleText(article.summary, locale)
    && hasExactArticleText(article.content, locale));
  return NEWS_INDEXABLE_LOCALES.filter((locale) => locales.includes(locale));
}

function articleProjectionLocales(article) {
  const projection = article && typeof article === "object" && article.routeProjection && typeof article.routeProjection === "object"
    ? article.routeProjection
    : null;
  if (projection?.source !== NEWS_ARTICLE_ROUTE_PROJECTION_SOURCE) return [];
  const locales = Array.isArray(projection.availableLocales)
    ? projection.availableLocales.filter((locale) => NEWS_INDEXABLE_LOCALES.includes(locale))
    : [];
  return NEWS_INDEXABLE_LOCALES.filter((locale) => locales.includes(locale));
}

function articleSeoLocales(article) {
  const publishedLocales = articlePublishedLocales(article);
  if (!article || typeof article !== "object") return publishedLocales;
  if (article.status !== "PUBLISHED" || article.seo?.noindex !== false) return publishedLocales;
  if (!Array.isArray(article.sources) || article.sources.length === 0) return publishedLocales;
  const projectedLocales = articleProjectionLocales(article);
  return projectedLocales.length > publishedLocales.length ? projectedLocales : publishedLocales;
}

function newsPublishedLocales(articles = []) {
  return NEWS_INDEXABLE_LOCALES.filter((locale) => articles.some((article) => articlePublishedLocales(article).includes(locale)));
}

function newsContentLocale(requestedLocale, articleOrLocales) {
  const locales = Array.isArray(articleOrLocales) ? articleOrLocales : articlePublishedLocales(articleOrLocales);
  if (locales.includes(requestedLocale)) return requestedLocale;
  if (String(requestedLocale).startsWith("zh") && locales.includes("zh-Hans")) return "zh-Hans";
  return locales.includes("en") ? "en" : locales[0] || "en";
}

function newsCollectionSchema({ title, contentLocale, displayLocale, articles = [], url: collectionUrl }) {
  const itemListElement = articles.slice(0, 12).flatMap((article, index) => {
    const articleLocale = newsContentLocale(contentLocale, article);
    const headline = localizedArticleText(article.title, displayLocale) || localizedArticleText(article.title, articleLocale);
    const description = localizedArticleText(article.summary, displayLocale) || localizedArticleText(article.summary, articleLocale);
    if (!article?.slug || !headline || !description) return [];
    const url = localizedCanonical(`/news/${article.slug}`, articleLocale);
    return [{
      "@type": "ListItem",
      position: index + 1,
      url,
      item: {
        "@type": "NewsArticle",
        headline,
        description,
        url,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt || article.publishedAt,
        inLanguage: articleLocale,
        author: RESEARCH_DESK,
        publisher: NEXUALPHA_PUBLISHER,
        isAccessibleForFree: true,
      },
    }];
  });
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title.replace(" — NexuAlpha", ""),
    url: collectionUrl || localizedCanonical("/news", contentLocale),
    inLanguage: contentLocale,
    dateModified: itemListElement[0]?.item?.dateModified,
    publisher: NEXUALPHA_PUBLISHER,
  };
  if (itemListElement.length) {
    schema.mainEntity = {
      "@type": "ItemList",
      name: "Reviewed NexuAlpha news and research articles",
      numberOfItems: itemListElement.length,
      itemListElement,
    };
  }
  return schema;
}

function plainMarkdownText(value) {
  return stripArticleEmbedDirectives(String(value || ""))
    .trim()
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/^\s*(?:[-*+] |\d+[.)]\s+)/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function articleFaqEntries(article, locale) {
  const content = localizedArticleText(article?.content, locale);
  const match = /^##\s+(?:frequently asked questions|faq|常见问题|常見問題)\s*$/im.exec(content);
  if (!match) return [];
  const faqBody = content.slice(match.index + match[0].length).split(/^##\s+/m, 1)[0];
  const headings = [...faqBody.matchAll(/^###\s+(.+?[?？])\s*$/gm)];
  return headings.flatMap((heading, index) => {
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? faqBody.length;
    const question = plainMarkdownText(heading[1]);
    const answer = plainMarkdownText(faqBody.slice(start, end));
    return question && answer ? [{ question, answer }] : [];
  });
}

const OKX_USD_USDC_OWNER_CHECKLIST = Object.freeze({
  slug: "okx-usd-to-usdc-spot-pair-migration",
  faq: [
    {
      question: "What must OKX API users change when USD spot pairs migrate to USDC instruments?",
      answer: "API users should map affected Crypto-USD instruments to replacement Crypto-USDC instruments, then review instId, instIdCode, WebSocket subscriptions, cached instrument lists, historical-data calls, tradeQuoteCcy defaults and tradeQuoteCcyList handling. Treat September dates as migration markers, not proof that a private integration is production-safe.",
    },
    {
      question: "What should OKX users check about open orders, margin positions and trading bots before the USD to USDC migration deadline?",
      answer: "The September 30 delisting window is a historical announced schedule. Users should now inspect current affected open orders, margin positions, strategy orders, grid bots, DCA bots, balances, USDC order books and sub-accounts inside the logged-in account. The public notice is an operations checklist; it does not confirm account-specific impact, eligibility, completion or execution outcome.",
    },
  ],
});

function articleExtraFaqEntries(article, locale) {
  if (locale !== "en" || article?.slug !== OKX_USD_USDC_OWNER_CHECKLIST.slug) return [];
  return OKX_USD_USDC_OWNER_CHECKLIST.faq;
}

function localizedCanonical(pathname, locale) {
  const resolved = locale === "zh-Hant" ? "zh-Hant" : (String(locale).startsWith("zh") ? "zh-Hans" : (UI_LOCALES.has(locale) ? locale : "en"));
  return `${PUBLIC_ORIGIN}${localizedPath(pathname, resolved)}`;
}

function routeDateModified(schema) {
  const graph = Array.isArray(schema?.["@graph"]) ? schema["@graph"] : (Array.isArray(schema) ? schema : [schema]);
  const dated = graph.find((item) => item?.dateModified);
  return dated?.dateModified || null;
}
function routeHasRegionalFundingDataset(schema) {
  const graph = Array.isArray(schema?.["@graph"]) ? schema["@graph"] : (Array.isArray(schema) ? schema : [schema]);
  const nested = JSON.stringify(graph);
  return nested.includes(REGIONAL_FUNDING_MATRIX_URLS.json) || nested.includes(REGIONAL_FUNDING_MATRIX_URLS.csv);
}

// Head fragments shared by the SSR head (injectRouteMetadata) and the client navigation payload (/api/route-seo):
// one source for og/twitter/trust meta and the JSON-LD payload, so a client-side route change renders the same head.
function routeOpenGraphPairs(metadata) {
  return [
    ["og:type", metadata.ogType || "website"],
    ["og:site_name", "NexuAlpha"],
    ["og:title", metadata.title],
    ["og:description", metadata.description],
    ["og:url", metadata.canonical],
    ["og:image", metadata.image || DEFAULT_SOCIAL_IMAGE],
    ["og:image:width", String(SOCIAL_IMAGE_WIDTH)],
    ["og:image:height", String(SOCIAL_IMAGE_HEIGHT)],
    ["og:image:alt", metadata.title],
  ];
}

function routeTwitterPairs(metadata) {
  return [
    ["twitter:card", "summary_large_image"],
    ["twitter:site", "@NexuAlpha"],
    ["twitter:title", metadata.title],
    ["twitter:description", metadata.description],
    ["twitter:image", metadata.image || DEFAULT_SOCIAL_IMAGE],
  ];
}

function routeTrustPairs(metadata) {
  const reviewedAt = routeDateModified(metadata.schema);
  const hasRegionalFundingDataset = routeHasRegionalFundingDataset(metadata.schema);
  return [
    ["author", "NexuAlpha Research Desk"],
    ["nexualpha-last-reviewed", reviewedAt],
    ["nexualpha-methodology", `${PUBLIC_ORIGIN}/methodology`],
    ["nexualpha-llms", `${PUBLIC_ORIGIN}/llms.txt`],
    ["nexualpha-regional-funding-dataset", hasRegionalFundingDataset ? REGIONAL_FUNDING_MATRIX_URLS.json : null],
    ["nexualpha-regional-funding-dataset-reviewed", hasRegionalFundingDataset ? REGIONAL_FUNDING_MATRIX_REVIEWED_AT : null],
    ["nexualpha-regional-funding-dataset-limitations", hasRegionalFundingDataset ? REGIONAL_FUNDING_MATRIX_LIMITATIONS : null],
  ].filter(([, content]) => Boolean(content));
}

function routeSchemaPayload(schema) {
  if (!schema) return null;
  return Array.isArray(schema)
    ? { "@context": "https://schema.org", "@graph": schema.map((item) => { const copy = { ...item }; delete copy["@context"]; return copy; }) }
    : schema;
}

// <html lang> for a route: Brazil and /mx follow the content locale, news follows the displayed edition, every other
// route keeps the requested UI locale (a Japanese reader of an English-only page still gets a Japanese shell).
function documentLocaleFor(metadata, url) {
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  const requestedLocale = publicRoute.localeSource === "path" ? publicRoute.locale : url.searchParams.get("locale");
  return brazilPath(publicRoute.contentPathname)
    ? metadata.locale
    : publicRoute.contentPathname === "/mx"
    ? metadata.locale
    : [NEWS_ROUTE_MARKER, ARTICLE_ROUTE_MARKER].includes(metadata.marker)
    ? metadata.displayLocale || metadata.locale
    : UI_LOCALES.has(requestedLocale) ? requestedLocale : metadata.locale;
}

// Client navigation SEO payload (seo-payload lane 2026-10-11). The browser no longer ships the route SEO tables
// (src/data/seo-injection.js stays a Node/SSR module); after a client-side route change it fetches exactly what the
// SSR head for that URL contains. Everything here is derived from routeMetadata() through the same helpers as
// injectRouteMetadata, so the two cannot drift. Feed internals (newsArticles, fingerprints) never leave the server.
export function routeSeoPayload(metadata, url) {
  return {
    path: url.pathname,
    search: url.search,
    status: metadata.status,
    marker: metadata.marker || null,
    locale: metadata.locale,
    htmlLocale: documentLocaleFor(metadata, url),
    title: metadata.title,
    description: metadata.description,
    canonical: metadata.canonical,
    robots: metadata.robots || "index,follow",
    alternates: Array.isArray(metadata.alternates) ? metadata.alternates.map(({ hreflang, href }) => ({ hreflang, href })) : [],
    openGraph: routeOpenGraphPairs(metadata),
    twitter: routeTwitterPairs(metadata),
    trust: routeTrustPairs(metadata),
    schema: routeSchemaPayload(metadata.schema),
  };
}

export function routeSeoTargetUrl(requestUrl) {
  const requested = requestUrl.searchParams.get("path") || "/";
  if (!requested.startsWith("/") || requested.startsWith("//")) return null;
  let target;
  try { target = new URL(requested, requestUrl.origin); } catch { return null; }
  if (target.origin !== requestUrl.origin || target.pathname.startsWith("/api/")) return null;
  const locale = requestUrl.searchParams.get("locale");
  if (locale) target.searchParams.set("locale", locale);
  target.hash = "";
  return target;
}

async function handleRouteSeoJson(request, env, url) {
  const target = routeSeoTargetUrl(url);
  if (!target) return json({ error: "path must be a site-relative pathname" }, 400);
  const metadata = await routeMetadata(target, env);
  const payload = routeSeoPayload(metadata, target);
  const body = request.method === "HEAD" ? null : JSON.stringify(payload);
  return new Response(body, {
    status: 200,
    headers: {
      ...jsonHeaders,
      // The payload mirrors a cacheable HTML head; a 404 route answer must not be kept around.
      "cache-control": metadata.status === 200 ? "public, max-age=300, stale-while-revalidate=600" : "no-store",
      "x-robots-tag": "noindex",
      "x-nexualpha-route-seo-status": String(metadata.status),
    },
  });
}

const ARABIC_FONT_PRELOAD_HREF = "/fonts/ar-400.woff2";

function injectRouteMetadata(html, metadata) {
  const pageLocale = metadata.locale || "en";
  const pageDirection = ["ar", "ur"].includes(String(pageLocale).toLowerCase().split("-")[0]) ? "rtl" : "ltr";
  let output = html.replace(/<html\b([^>]*)>/i, (_tag, attributes = "") => {
    const preserved = attributes
      .replace(/\s+lang=["'][^"']*["']/gi, "")
      .replace(/\s+dir=["'][^"']*["']/gi, "");
    return `<html${preserved} lang="${pageLocale}" dir="${pageDirection}">`;
  });
  // Arabic pages: fetch the Arabic face with the Geist preloads. Without it the font arrived 1-3 s after first paint and the
  // wider glyphs re-wrapped the /ar/news intro, shifting everything below it (CLS 0.35 at 768 px, 2026-10-11).
  if (pageDirection === "rtl" && !output.includes(ARABIC_FONT_PRELOAD_HREF)) {
    output = output.replace(/(<link\b[^>]*rel=["']preload["'][^>]*geist-mono-latin\.woff2[^>]*>)/i, (tag) => `${tag}\n    <link rel="preload" href="${ARABIC_FONT_PRELOAD_HREF}" as="font" type="font/woff2" crossorigin />`);
  }
  output = replaceOrInsert(
    output,
    /<title\b[^>]*>[\s\S]*?<\/title>/i,
    `<title translate="no" lang="${pageLocale}">${escapeHtml(metadata.title)}</title>`,
  );
  output = replaceOrInsert(
    output,
    /<meta\b[^>]*name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
  );
  for (const [property, content] of routeOpenGraphPairs(metadata)) {
    const expression = new RegExp(`<meta\\b[^>]*property=["']${property.replace(":", "\\:")}["'][^>]*>`, "i");
    output = replaceOrInsert(output, expression, `<meta property="${property}" content="${escapeHtml(content)}" data-nexualpha-route-seo="social" />`);
  }
  for (const [name, content] of routeTwitterPairs(metadata)) {
    const expression = new RegExp(`<meta\\b[^>]*name=["']${name.replace(":", "\\:")}["'][^>]*>`, "i");
    output = replaceOrInsert(output, expression, `<meta name="${name}" content="${escapeHtml(content)}" data-nexualpha-route-seo="social" />`);
  }
  output = output.replace(/\s*<link\b[^>]*data-nexualpha-route-seo=["']alternate["'][^>]*>\s*/gi, "\n");
  if (Array.isArray(metadata.alternates)) {
    const alternateHtml = metadata.alternates
      .map((alternate) => `    <link rel="alternate" hreflang="${alternate.hreflang}" href="${escapeHtml(alternate.href)}" data-nexualpha-route-seo="alternate" />`)
      .join("\n");
    output = output.replace(/<\/head>/i, () => `${alternateHtml}\n  </head>`);
  }
  output = replaceOrInsert(
    output,
    /<link\b[^>]*rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(metadata.canonical)}" data-nexualpha-route-seo="canonical" />`,
  );
  output = replaceOrInsert(
    output,
    /<meta\b[^>]*name=["']robots["'][^>]*>/i,
    `<meta name="robots" content="${metadata.robots || "index,follow"}" data-nexualpha-route-seo="robots" />`,
  );
  for (const [name, content] of routeTrustPairs(metadata)) {
    const expression = new RegExp(`<meta\\b[^>]*name=["']${name.replace(":", "\\:")}["'][^>]*>`, "i");
    output = replaceOrInsert(output, expression, `<meta name="${name}" content="${escapeHtml(content)}" data-nexualpha-route-seo="trust" />`);
  }
  output = output.replace(/\s*<meta\b[^>]*name=["']nexualpha-route-marker["'][^>]*>\s*/gi, "\n");
  if (metadata.marker) {
    output = output.replace(
      /<\/head>/i,
      `    <meta name="nexualpha-route-marker" content="${escapeHtml(metadata.marker)}" data-nexualpha-route-seo="marker" />\n  </head>`,
    );
  }
  output = output.replace(/\s*<script\b[^>]*id=["']nexualpha-route-schema["'][^>]*>[\s\S]*?<\/script>\s*/gi, "\n");
  const schemaPayload = routeSchemaPayload(metadata.schema);
  if (schemaPayload) {
    output = output.replace(
      /<\/head>/i,
      () => `    <script id="nexualpha-route-schema" type="application/ld+json">${safeJson(schemaPayload)}</script>\n  </head>`,
    );
  }
  return output;
}

async function loadPrerenderManifest(env, requestUrl) {
  if (!env?.ASSETS) return null;
  if (!prerenderManifests.has(env.ASSETS)) {
    const manifestUrl = new URL(PRERENDER_MANIFEST_PATH, requestUrl);
    const pending = env.ASSETS.fetch(new Request(manifestUrl, { headers: { accept: "application/json" } }))
      .then((response) => response.ok ? response.json() : null)
      .then((manifest) => manifest?.routes && typeof manifest.routes === "object" ? manifest : null)
      .catch(() => null);
    prerenderManifests.set(env.ASSETS, pending);
  }
  const manifest = await prerenderManifests.get(env.ASSETS);
  if (!manifest) prerenderManifests.delete(env.ASSETS);
  return manifest;
}

function injectPrerenderedBody(html, appHtml, routeKey, route, url) {
  if (!appHtml || typeof appHtml !== "string") return html;
  const [pathname, locale] = routeKey.split("|");
  const brProjection = projectBrazilAttributionHtml(appHtml, pathname, url);
  const payload = safeJson({ pathname, locale, version: "nexualpha-prerender-v1",
    ...(brProjection.attribution ? { brAttribution: brProjection.attribution } : {}),
    // Listing payloads are summary rows for one page ("/news" projection: no content, sources or seo), never article bodies.
    ...(Array.isArray(route.newsArticles) ? { newsArticles: initialNewsArticlesForRoute(route.newsListing ? "/news" : pathname, route.newsArticles, locale, { preserveSsrContent: true }) } : {}),
    ...(route.newsListing && typeof route.newsListing === "object" ? { newsListing: route.newsListing } : {}),
    ...(route.fundingMatrix && typeof route.fundingMatrix === "object" ? { fundingMatrix: route.fundingMatrix } : {}),
    ...(route.marketEvents && typeof route.marketEvents === "object" ? { marketEvents: route.marketEvents } : {}),
    ...(route.activityContext && typeof route.activityContext === "object" ? { activityContext: route.activityContext } : {}),
    ...(route.appDownloadContext && typeof route.appDownloadContext === "object" ? { appDownloadContext: route.appDownloadContext } : {}),
    ...(route.officialAnnouncements && typeof route.officialAnnouncements === "object" ? { officialAnnouncements: route.officialAnnouncements } : {}),
    // Home hero copy experiment (X5): the variant this HTML was rendered with; the browser hydrates the same one.
    ...(route.heroVariant === "a" || route.heroVariant === "b" ? { heroVariant: route.heroVariant } : {}),
    ...(route.toolArticles && typeof route.toolArticles === "object" ? { toolArticles: route.toolArticles } : {}),
    ...(route.flash && typeof route.flash === "object" ? { flash: route.flash } : {}),
    ...(isTickerSnapshot(route.ticker) ? { ticker: route.ticker } : {}),
    // Coin pages rendered from a runtime coins.json: the rows that differ from the baked table (applyCoinOverlay).
    ...(route.coins && typeof route.coins === "object" && Array.isArray(route.coins.rows) ? { coins: route.coins } : {}),
    // /etf-flows and /calendar: the snapshot the page was rendered with ({ kind, data, now }).
    ...(route.intelTool && typeof route.intelTool === "object" && ["etf", "calendar"].includes(route.intelTool.kind) ? { intelTool: route.intelTool } : {}),
    ...(route.fx && typeof route.fx === "object" ? { fx: route.fx } : {}),
    ...(route.radar && typeof route.radar === "object" ? { radar: route.radar } : {}),
  });
  const body = `<div id="root">${brProjection.html}</div><script type="application/json" id="nexualpha-prerender-state">${payload}</script>`;
  // Function replacer: the body is page text and may contain "$'" / "$&" replacement patterns.
  return html.replace(/<div\s+id=["']root["']\s*>\s*<\/div>/i, () => body);
}

function decodeHtmlAttribute(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x2f;/gi, "/")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function fragmentContextParamsFromUrl(url) {
  const params = new URLSearchParams(url?.search || "");
  const hash = String(url?.hash || "");
  const fragmentQuery = hash.includes("?") ? hash.split("?").slice(1).join("?") : "";
  if (fragmentQuery) {
    const fragmentParams = new URLSearchParams(fragmentQuery);
    for (const key of Object.values(FRAGMENT_CONTEXT_KEYS)) {
      if (!params.has(key) && fragmentParams.has(key)) params.set(key, fragmentParams.get(key));
    }
  }
  return params;
}

function shouldProjectBrazilHref(url) {
  if (!url || url.origin !== "https://nexualpha.com") return false;
  const context = fragmentContextParamsFromUrl(url);
  if (!context.has("market") || !context.has("product")) return false;
  if (brazilPath(url.pathname)) return true;
  if (url.pathname === "/rates") return true;
  if (url.pathname === "/exchanges" || /^\/exchanges\/[a-z0-9-]+$/i.test(url.pathname)) return true;
  return false;
}

function projectBrazilHrefWithAttribution(target, attribution) {
  const sourceContext = fragmentContextParamsFromUrl(target);
  const context = {};
  for (const [key, value] of sourceContext) {
    if (["utm_source", "utm_medium", "utm_campaign", "locale"].includes(key)) continue;
    context[key] = value;
  }
  if (attribution?.source) context.utm_source = attribution.source;
  if (attribution?.medium) context.utm_medium = attribution.medium;
  if (attribution?.campaign) context.utm_campaign = attribution.campaign;
  if (sourceContext.has("locale")) context.locale = sourceContext.get("locale");
  const fragmentTarget = String(target.hash || "").split("?")[0];
  return appendFragmentContextParams(`${target.pathname}${fragmentTarget}`, context);
}

function projectBrazilAttributionHtml(appHtml, pathname, requestUrl) {
  const attribution = brazilPath(pathname) ? sanitizeBrAttributionFromSearch(requestUrl?.searchParams) : null;
  if (!attribution) return { html: appHtml, attribution: null, projectedCount: 0 };
  let projectedCount = 0;
  const html = appHtml.replace(/<a\b[^>]*\shref=(["'])([\s\S]*?)\1[^>]*>/gi, (tag, quote, rawHref) => {
    const decodedHref = decodeHtmlAttribute(rawHref);
    if (!decodedHref.startsWith("/") || decodedHref.startsWith("//")) return tag;
    let target;
    try {
      target = new URL(decodedHref, "https://nexualpha.com");
    } catch {
      return tag;
    }
    if (!shouldProjectBrazilHref(target)) return tag;
    const projectedHref = projectBrazilHrefWithAttribution(target, attribution);
    if (projectedHref === decodedHref) return tag;
    projectedCount += 1;
    return tag.replace(new RegExp(`\\shref=${quote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${quote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"), ` href="${escapeHtml(projectedHref)}"`);
  });
  return projectedCount > 0 ? { html, attribution, projectedCount } : { html: appHtml, attribution, projectedCount: 0 };
}

function isPrerenderAssetPath(asset) {
  return typeof asset === "string" && /^\/prerender\/[a-zA-Z0-9/_-]+\.json$/.test(asset);
}

async function loadPrerenderAssetPayload(route, url, env) {
  if (!isPrerenderAssetPath(route?.asset)) return null;
  try {
    const response = await env.ASSETS.fetch(new Request(new URL(route.asset, url), { headers: { accept: "application/json" } }));
    if (!response.ok) return null;
    const payload = await response.json();
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

function summarizeNewsArticle(article) {
  if (!article || typeof article !== "object") return null;
  const slug = cleanSlug(article.slug);
  if (!slug) return null;
  return {
    slug,
    status: article.status === "PUBLISHED" ? "PUBLISHED" : article.status,
    category: typeof article.category === "string" && article.category.trim() ? article.category.trim() : "research",
    categoryName: article.categoryName && typeof article.categoryName === "object" ? article.categoryName : undefined,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt || null,
    readTime: article.readTime || "6 min",
    // Per-edition reading time written by the importer (SEO audit 2026-10-11 #7); article pages measure their own body.
    ...(article.readTimeByLocale && typeof article.readTimeByLocale === "object" ? { readTimeByLocale: article.readTimeByLocale } : {}),
    author: article.author || "NexuAlpha Research Desk",
    title: article.title,
    summary: article.summary,
    relatedVenues: Array.isArray(article.relatedVenues) ? article.relatedVenues : [],
    ...(Array.isArray(article.tags) ? { tags: article.tags.filter((tag) => typeof tag === "string" && tag.trim()) } : {}),
    ...(Array.isArray(article.topicTags) ? { topicTags: article.topicTags.filter((tag) => typeof tag === "string" && tag.trim()) } : {}),
    ...(article.cta && typeof article.cta === "object" ? { cta: article.cta } : {}),
    availableLocales: Array.isArray(article.availableLocales) ? article.availableLocales : undefined,
  };
}

function compactLocalizedObject(value, locale = "en") {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const keep = new Set(["en"]);
  if (String(locale).startsWith("zh")) keep.add("zh-Hans");
  if (UI_LOCALES.has(locale)) keep.add(locale);
  const compact = {};
  for (const key of keep) {
    if (typeof value[key] === "string" && value[key].trim()) compact[key] = value[key].trim();
  }
  return compact;
}

function stripMarkdownLinksFromText(value) {
  return String(value || "").replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, label, href) => {
    const cleanLabel = String(label || "").replace(/\s+/g, " ").trim();
    return `${cleanLabel || href} (${href})`;
  });
}

function compactHydrationContentObject(value, locale = "en") {
  const compact = compactLocalizedObject(value, locale);
  if (!compact || typeof compact !== "object" || Array.isArray(compact)) return compact;
  return Object.fromEntries(
    Object.entries(compact).map(([key, text]) => [key, stripMarkdownLinksFromText(text)]),
  );
}

function projectNewsArticleForRoute(pathname, article, locale = "en", { preserveSsrContent = false } = {}) {
  if (!article || typeof article !== "object") return null;
  const summary = summarizeNewsArticle(article);
  if (!summary) return null;
  const verifiedLocales = articlePublishedLocales(article);
  const carriedProjectionLocales = articleProjectionLocales(article);
  const routeProjectionLocales = carriedProjectionLocales.length > verifiedLocales.length ? carriedProjectionLocales : verifiedLocales;
  const projected = {
    ...summary,
    title: compactLocalizedObject(article.title, locale),
    summary: compactLocalizedObject(article.summary, locale),
    categoryName: compactLocalizedObject(article.categoryName, locale),
    routeProjection: {
      source: NEWS_ARTICLE_ROUTE_PROJECTION_SOURCE,
      locale,
      availableLocales: routeProjectionLocales,
    },
  };
  if (String(pathname || "").startsWith("/news/")) {
    const contentLocale = newsContentLocale(locale, article);
    // Full SSR snapshots must hydrate the exact same Markdown text.
    // Simplified fallback rendering retains its separate text projection.
    projected.content = preserveSsrContent
      ? compactLocalizedObject(article.content, contentLocale)
      : compactHydrationContentObject(article.content, contentLocale);
    projected.sources = Array.isArray(article.sources) ? article.sources : [];
    projected.seo = article.seo && typeof article.seo === "object" ? article.seo : {};
    projected.aeo = article.aeo && typeof article.aeo === "object" ? article.aeo : {};
    projected.geo = article.geo && typeof article.geo === "object" ? article.geo : {};
  }
  return projected;
}

function initialNewsArticlesForRoute(pathname, articles, locale = "en", options = {}) {
  const rows = Array.isArray(articles) ? articles : [];
  return rows.map((article) => projectNewsArticleForRoute(pathname, article, locale, options)).filter(Boolean);
}

async function handlePublicNewsSummaryFeed(request, env, url) {
  if (!env?.ASSETS) return new Response(JSON.stringify({ articles: [] }), { status: 503, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  try {
    const response = await env.ASSETS.fetch(new Request(new URL("/content/news-feed.json", url), { headers: { accept: "application/json" } }));
    if (!response.ok) return response;
    const parsed = await response.json();
    const articles = Array.isArray(parsed?.articles) ? parsed.articles.map(summarizeNewsArticle).filter(Boolean) : [];
    return new Response(JSON.stringify({ ...parsed, articles }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": response.headers.get("cache-control") || "public, max-age=300",
        vary: "Accept-Encoding",
      },
    });
  } catch {
    return new Response(JSON.stringify({ articles: [], status: "unavailable", reasonCode: "NEWS_SUMMARY_FEED_UNAVAILABLE" }), {
      status: 503,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }
}

// Same tokenizer and link rules as the React article renderer (src/data/article-inline-markdown.js):
// internal "[label](/news/...)" links become localized <a> elements, never raw Markdown text (audit NX-10).
function markdownInlineHtml(value, locale = "en") {
  return inlineMarkdownHtml(String(value || ""), { locale });
}

function dedupeLongSentences(markdown) {
  const seen = new Set();
  return String(markdown || "").replace(/[^.!?。！？\n]+[.!?。！？]/g, (sentence) => {
    const normalized = sentence.replace(/\s+/g, " ").trim().toLowerCase();
    if (normalized.length < 80) return sentence;
    if (seen.has(normalized)) return "";
    seen.add(normalized);
    return sentence;
  }).replace(/\n{3,}/g, "\n\n");
}

const newsTableScrollHints = {
  "en": "Article table: scroll horizontally, or focus the table area and use the arrow keys.",
  "zh-Hans": "文章表格：可横向滑动，或聚焦表格区域后使用方向键。",
  "zh-Hant": "文章表格：可橫向滑動，或聚焦表格區域後使用方向鍵。",
  "ja": "記事の表：横にスクロールするか、表の領域にフォーカスして矢印キーを使ってください。",
  "ko": "기사 표: 가로로 스크롤하거나 표 영역에 초점을 맞춘 뒤 방향키를 사용하세요.",
  "es": "Tabla del artículo: desplázate horizontalmente o enfoca el área de la tabla y usa las flechas.",
  "pt-BR": "Tabela do artigo: role na horizontal ou selecione a área da tabela e use as teclas de seta.",
  "fr": "Tableau de l’article : faites défiler horizontalement ou placez le focus sur le tableau et utilisez les flèches.",
  "de": "Artikeltabelle: horizontal scrollen oder den Tabellenbereich fokussieren und die Pfeiltasten verwenden.",
  "tr": "Makale tablosu: yatay kaydırın veya tablo alanına odaklanıp ok tuşlarını kullanın.",
  "ru": "Таблица статьи: прокрутите по горизонтали или установите фокус на области таблицы и используйте клавиши со стрелками.",
  "ar": "جدول المقال: مرّر أفقيًا أو انقل التركيز إلى منطقة الجدول واستخدم مفاتيح الأسهم.",
  "id": "Tabel artikel: gulir secara horizontal atau fokuskan area tabel dan gunakan tombol panah.",
  "vi": "Bảng trong bài viết: cuộn ngang hoặc đặt tiêu điểm vào vùng bảng và dùng các phím mũi tên.",
  "it": "Tabella dell’articolo: scorri in orizzontale oppure porta il focus sull’area della tabella e usa i tasti freccia.",
  // l10n: needs native review
  ur: "مضمون کا جدول: افقی اسکرول کریں، یا جدول کے حصے پر فوکس کرکے تیر کی کلیدیں استعمال کریں۔",
  // l10n: needs native review
  uk: "Таблиця статті: прокрутіть горизонтально або сфокусуйте область таблиці й використовуйте клавіші зі стрілками."
};

function markdownBlockHtml(block, index = 0, locale = "en") {
  const text = String(block || "").trim();
  if (!text) return "";
  // `::embed <widget>` (D3): same block as the React article renderer; unknown widgets render nothing.
  const embed = parseArticleEmbed(text);
  if (embed) return articleEmbedHtml(articleEmbedModel(embed, locale));
  if (text.startsWith("### ")) return `<h3>${markdownInlineHtml(text.replace(/^###\s+/, ""), locale)}</h3>`;
  if (text.startsWith("## ")) return `<h2>${markdownInlineHtml(text.replace(/^##\s+/, ""), locale)}</h2>`;
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length && lines.every((line) => line.startsWith(">"))) {
    return `<blockquote><p>${markdownInlineHtml(lines.map((line) => line.replace(/^>\s?/, "")).join(" "), locale)}</p></blockquote>`;
  }
  if (lines.length >= 2 && lines.every((line) => line.startsWith("|"))) {
    const rows = lines
      .filter((line) => !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
      .map((line) => line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
    const [head = [], ...body] = rows;
    const hint = newsTableScrollHints[locale] || newsTableScrollHints.en;
    return `<div class="news-detail__table-block"><p class="news-detail__table-hint" id="news-table-hint-${index}">${escapeHtml(hint)}</p><div class="news-detail__table-scroll" role="region" aria-labelledby="news-table-hint-${index}" tabindex="0"><table style="--news-table-columns:${head.length}"><thead><tr>${head.map((cell) => `<th scope="col">${markdownInlineHtml(cell, locale)}</th>`).join("")}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${markdownInlineHtml(cell, locale)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>`;
  }
  if (lines.some((line) => line.startsWith("- "))) {
    const lead = lines.filter((line) => !line.startsWith("- ")).map((line) => `<p>${markdownInlineHtml(line, locale)}</p>`).join("");
    const items = lines.filter((line) => line.startsWith("- ")).map((line) => `<li>${markdownInlineHtml(line.replace(/^- /, ""), locale)}</li>`).join("");
    return `${lead}<ul>${items}</ul>`;
  }
  return `<p>${markdownInlineHtml(text, locale)}</p>`;
}

function newsFallbackCopy(locale) {
  const base = {
    badge: "MARKET INTELLIGENCE & SEO REPORTS",
    back: "Back to News & Reports",
    author: "Author",
    sources: "Sources",
    originalNotice: "This article is shown in its verified English source language while translation is under review.",
  };
  return ({
    "zh-Hans": { badge: "市场情报与 SEO 研究", back: "返回新闻与研报列表", author: "作者", sources: "来源与证据", originalNotice: "本文正文暂以英文原文展示，翻译版本需完成来源复核后再发布。" },
    "zh-Hant": { badge: "市場情報與 SEO 研究", back: "返回新聞與研報列表", author: "作者", sources: "來源與證據", originalNotice: "本文正文暫以英文原文展示，翻譯版本需完成來源複核後再發布。" },
    ja: { badge: "市場インテリジェンスとSEOレポート", back: "ニュースとレポートに戻る", author: "著者", sources: "出典", originalNotice: "本文は確認済みの英語原文で表示しています。翻訳版は出典確認後に追加します。" },
    ko: { badge: "시장 인텔리전스 및 SEO 리포트", back: "뉴스 및 리포트로 돌아가기", author: "작성자", sources: "출처", originalNotice: "본문은 검증된 영어 원문으로 표시됩니다. 번역본은 출처 검토 후 추가됩니다." },
    tr: { badge: "Piyasa istihbaratı ve SEO raporları", back: "Haberler ve raporlara dön", author: "Yazar", sources: "Kaynaklar", originalNotice: "Gövde metni doğrulanmış İngilizce kaynak dilinde gösteriliyor. Çeviri kaynak incelemesinden sonra eklenecek." },
    es: { badge: "INTELIGENCIA DE MERCADO E INFORMES SEO", back: "Volver a noticias e informes", author: "Autor", sources: "Fuentes", originalNotice: "El cuerpo del artículo se muestra en el original verificado en inglés. La traducción se añadirá tras revisar las fuentes." },
    "pt-BR": { badge: "INTELIGÊNCIA DE MERCADO E RELATÓRIOS SEO", back: "Voltar para notícias e relatórios", author: "Autor", sources: "Fontes", originalNotice: "O corpo do artigo aparece no original em inglês verificado. A tradução será adicionada após revisão das fontes." },
    fr: { badge: "INTELLIGENCE DE MARCHÉ ET RAPPORTS SEO", back: "Retour aux actualités et rapports", author: "Auteur", sources: "Sources", originalNotice: "Le corps de l'article est affiché dans sa version anglaise vérifiée. La traduction sera ajoutée après revue des sources." },
    de: { badge: "MARKTINTELLIGENZ UND SEO-BERICHTE", back: "Zurück zu News und Berichten", author: "Autor", sources: "Quellen", originalNotice: "Der Artikeltext wird im geprüften englischen Original angezeigt. Die Übersetzung folgt nach der Quellenprüfung." },
    ru: { badge: "РЫНОЧНАЯ АНАЛИТИКА И SEO-ОТЧЁТЫ", back: "Вернуться к новостям и отчетам", author: "Автор", sources: "Источники", originalNotice: "Текст статьи показан в проверенном английском оригинале. Перевод будет добавлен после проверки источников." },
    ar: { badge: "تحليلات السوق وتقارير SEO", back: "العودة إلى الأخبار والتقارير", author: "الكاتب", sources: "المصادر", originalNotice: "يظهر نص المقال باللغة الإنجليزية الأصلية بعد التحقق. ستُضاف الترجمة بعد مراجعة المصادر." },
    id: { badge: "INTELIJEN PASAR DAN LAPORAN SEO", back: "Kembali ke berita dan laporan", author: "Penulis", sources: "Sumber", originalNotice: "Isi artikel ditampilkan dalam bahasa Inggris asli yang telah diverifikasi. Terjemahan ditambahkan setelah tinjauan sumber." },
    vi: { badge: "THÔNG TIN THỊ TRƯỜNG VÀ BÁO CÁO SEO", back: "Quay lại tin tức và báo cáo", author: "Tác giả", sources: "Nguồn", originalNotice: "Nội dung bài viết đang hiển thị bằng bản gốc tiếng Anh đã xác minh. Bản dịch sẽ được thêm sau khi rà soát nguồn." },
    it: { badge: "INTELLIGENCE DI MERCATO E REPORT SEO", back: "Torna a notizie e report", author: "Autore", sources: "Fonti", originalNotice: "Il corpo dell'articolo è mostrato nell'originale inglese verificato. La traduzione sarà aggiunta dopo la revisione delle fonti." },
  })[locale] || base;
}


function decisionRailFallbackCopy(locale) {
  const localeKey = String(locale || "en").toLowerCase() === "pt-br" ? "pt-BR" : String(locale || "en").split("-")[0];
  const copy = {
    "zh-Hans": { label: "下一步决策", compare: "比较总成本", facts: "查看来源档案", directory: "按条件选平台" },
    "zh-Hant": { label: "下一步決策", compare: "比較總成本", facts: "查看來源檔案", directory: "按條件選平台" },
    en: { label: "NEXT DECISION", compare: "Compare total cost", facts: "Review source factbook", directory: "Choose by conditions" },
    es: { label: "SIGUIENTE DECISIÓN", compare: "Comparar coste total", facts: "Ver ficha de fuentes", directory: "Elegir por condiciones" },
    "pt-BR": { label: "PRÓXIMA DECISÃO", compare: "Comparar custo total", facts: "Ver ficha de fontes", directory: "Escolher por condições" },
    fr: { label: "PROCHAINE DÉCISION", compare: "Comparer le coût total", facts: "Voir la fiche des sources", directory: "Choisir selon les conditions" },
    de: { label: "NÄCHSTE ENTSCHEIDUNG", compare: "Gesamtkosten vergleichen", facts: "Quellen-Factbook öffnen", directory: "Nach Bedingungen wählen" },
    ja: { label: "次の判断", compare: "総コストを比較", facts: "出典ファクトブックを見る", directory: "条件から選ぶ" },
    ko: { label: "다음 결정", compare: "총비용 비교", facts: "출처 팩트북 보기", directory: "조건으로 선택" },
    ar: { label: "القرار التالي", compare: "قارن التكلفة الإجمالية", facts: "راجع سجل المصادر", directory: "اختر حسب الشروط" },
    tr: { label: "SONRAKİ KARAR", compare: "Toplam maliyeti karşılaştır", facts: "Kaynak dosyasını incele", directory: "Koşullara göre seç" },
    ru: { label: "СЛЕДУЮЩЕЕ РЕШЕНИЕ", compare: "Сравнить общую стоимость", facts: "Открыть досье источников", directory: "Выбрать по условиям" },
    id: { label: "KEPUTUSAN BERIKUTNYA", compare: "Bandingkan biaya total", facts: "Lihat factbook sumber", directory: "Pilih berdasarkan kondisi" },
    vi: { label: "QUYẾT ĐỊNH TIẾP THEO", compare: "So sánh tổng phí", facts: "Xem hồ sơ nguồn", directory: "Chọn theo điều kiện" },
    it: { label: "PROSSIMA DECISIONE", compare: "Confronta il costo totale", facts: "Apri il factbook delle fonti", directory: "Scegli per condizioni" },
    // l10n: needs native review
    ur: { label: "اگلا فیصلہ", compare: "کل لاگت کا موازنہ", facts: "ذرائع کی فیکٹ بک دیکھیں", directory: "شرائط کے مطابق منتخب کریں" },
    // l10n: needs native review
    uk: { label: "НАСТУПНЕ РІШЕННЯ", compare: "Порівняти загальну вартість", facts: "Переглянути фактбук джерел", directory: "Вибрати за умовами" },

  };
  return copy[locale] || copy[localeKey] || (String(locale || "").startsWith("zh") ? copy["zh-Hans"] : copy.en);
}

function renderDecisionPathRailFallback(locale, current = "news") {
  const t = decisionRailFallbackCopy(locale);
  const links = [
    { id: "compare", href: localizedCanonical("/compare/binance-vs-okx", locale), label: t.compare },
    { id: "facts", href: `${localizedCanonical("/factbook/binance", locale)}#rates`, label: t.facts },
    { id: "directory", href: localizedCanonical("/exchanges", locale), label: t.directory },
  ];
  return `<div class="v2-shell news-page__decision-rail"><nav class="decision-path-rail" aria-label="${escapeHtml(t.label)}" data-decision-current="${escapeHtml(current)}"><span class="decision-path-rail__label">${escapeHtml(t.label)}</span><div class="decision-path-rail__links">${links.map((link, index) => `<a href="${escapeHtml(link.href)}" class="decision-path-rail__link${index === 0 ? " is-primary" : ""}" data-cta-kind="research" data-cta-placement="decision-rail-${escapeHtml(link.id)}" data-growth-placement="decision-rail-${escapeHtml(link.id)}" data-growth-decision="binance"><span aria-hidden="true">0${index + 1}</span>${escapeHtml(link.label)} <b aria-hidden="true">→</b></a>`).join("")}</div></nav></div>`;
}

// Fallback bodies must remain readable before their deferred page CSS loads.
const newsFallbackTableStyles = `<style data-news-fallback-tables>
.news-detail__prose,.news-detail__table-block{min-width:0}.news-detail__table-block{max-width:100%;margin-block:1.25rem}
.news-detail__prose .news-detail__table-hint{margin-block:0 .5rem;color:#94a3b8;font-size:.8125rem;line-height:1.5}
.news-detail__table-scroll{width:100%;max-width:100%;overflow-x:auto;border:1px solid rgba(255,255,255,.12);border-radius:8px}
.news-detail__table-scroll:focus-visible{outline:2px solid #8fb0ff;outline-offset:3px}
.news-detail__table-scroll table{width:100%;min-width:calc(var(--news-table-columns,4)*10rem);table-layout:fixed;border-collapse:collapse;font-size:.9375rem;line-height:1.6}
.news-detail__table-scroll th,.news-detail__table-scroll td{padding:.75rem;border-block-end:1px solid rgba(255,255,255,.1);text-align:start;vertical-align:top;overflow-wrap:anywhere}
.news-detail__table-scroll th{color:#f1f5f9;background:rgba(255,255,255,.045)}
</style>`;

function articlePromotionContext(article = {}) {
  return {
    topicTags: [...(article.topicTags || article.tags || []), article.cta?.topic].filter(Boolean),
    venue: article.cta?.venue || (Array.isArray(article.relatedVenues) ? article.relatedVenues : []),
    coin: article.cta?.coin,
  };
}

function promotionHref(promotion, locale, market) {
  if (promotion?.kind === "tool") {
    const href = localizedCanonical(promotion.link || "/compare", locale);
    if (!market) return href;
    const url = new URL(href);
    url.searchParams.set("market", market);
    return url.href;
  }
  const href = promotion?.link || "#";
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}locale=${encodeURIComponent(locale)}${market ? `&market=${encodeURIComponent(market)}` : ""}`;
}

function renderSponsoredSlotHtml(promotions, { variant = "end", locale = "en", market } = {}) {
  if (!Array.isArray(promotions) || !promotions.length) return "";
  const t = promotionCopy(locale);
  const dir = ["ar", "ur"].includes(locale) ? "rtl" : "ltr";
  const cards = promotions.map((promotion) => {
    const isTool = promotion.kind === "tool";
    const label = isTool ? t.tool : t.sponsored;
    const condition = promotion.conditions?.[locale] || promotion.conditions?.en || (!isTool ? t.conditions : "");
    const href = promotionHref(promotion, locale, market);
    const externalAttrs = isTool ? "" : ' target="_blank" rel="sponsored noopener"';
    return `<div class="sponsored-slot__card"><small class="sponsored-slot__label">${escapeHtml(label)}</small><strong>${escapeHtml(promotion.name || promotion.partner || t.compare)}</strong>${condition ? `<p>${escapeHtml(condition)}</p>` : ""}<a href="${escapeHtml(href)}"${externalAttrs}>${escapeHtml(t.open)} <span aria-hidden="true">→</span></a></div>`;
  }).join("");
  return `<aside class="sponsored-slot sponsored-slot--${escapeHtml(variant)}" data-sponsored-slot="${escapeHtml(variant)}" lang="${escapeHtml(locale)}" dir="${escapeHtml(dir)}">${cards}</aside>`;
}

function renderNewsFallbackBody(metadata, url) {
  if (metadata.status !== 200 || !Array.isArray(metadata.newsArticles)) return null;
  const requestedLocale = routeLocale(url);
  const locale = UI_LOCALES.has(requestedLocale) ? requestedLocale : (metadata.locale || requestedLocale);
  const market = url.searchParams.get("market") || undefined;
  const t = newsFallbackCopy(locale);
  const newsHref = localizedCanonical("/news", locale);
  const listing = parseNewsListingPath(url.pathname);
  if (listing && !listing.invalid) return renderNewsListingFallback(metadata, locale, listing);
  const slug = cleanSlug(url.pathname.replace(/^\/news\//, ""));
  const article = slug ? metadata.newsArticles.find((item) => item?.slug === slug) : null;
  if (!article) return null;
  const title = localizedNewsTitle(article, locale) || article.slug;
  const summary = localizedNewsSummary(article, locale) || article.seo?.description || "";
  const contentLocale = newsContentLocale(locale, article);
  const showsOriginalLanguage = contentLocale !== locale;
  const content = dedupeLongSentences(showsOriginalLanguage ? summary : (localizedArticleText(article.content, contentLocale) || summary));
  const contentBlocks = dropEmptyArticleHeadings(isolateArticleEmbedDirectives(content)).split("\n\n");
  const renderedContentBlocks = contentBlocks.map((block, index) => markdownBlockHtml(block, index, locale));
  const promotionContext = articlePromotionContext(article);
  const promotions = resolvePromotions({ ...promotionContext, locale, market, now: Date.now() });
  const commercialPromotions = promotions.filter((promotion) => promotion.kind !== "tool");
  const inlineSponsoredHtml = commercialPromotions.length ? renderSponsoredSlotHtml(commercialPromotions.slice(0, 1), { variant: "inline", locale, market }) : "";
  if (inlineSponsoredHtml) renderedContentBlocks.splice(Math.ceil(contentBlocks.length / 3), 0, inlineSponsoredHtml);
  const articleContentHtml = renderedContentBlocks.join("");
  const endSponsoredHtml = renderSponsoredSlotHtml(promotions, { variant: "end", locale, market });
  const sidebarSponsoredHtml = renderSponsoredSlotHtml(promotions, { variant: "sidebar", locale, market });
  const railSponsoredHtml = sidebarSponsoredHtml ? `<div class="news-detail__rail"><div class="news-detail__rail-sticky">${sidebarSponsoredHtml}</div></div>` : "";
  const relatedLinksHtml = renderArticleClusterLinksHtml(article, locale) + renderNewsRelatedArticlesHtml(article, metadata.newsArticles, locale) + renderArticleRelatedLinks(article, locale);
  const sourcesHtml = Array.isArray(article.sources) && article.sources.length
    ? `<h2>${escapeHtml(t.sources)}</h2><ul>${article.sources.map((source) => `<li><a href="${escapeHtml(source?.url || "#")}" rel="noopener noreferrer">${escapeHtml(source?.publisher || source?.title || source?.url || "Source")}${source?.title ? `: ${escapeHtml(source.title)}` : ""}</a></li>`).join("")}</ul>`
    : "";
  return `${articleContentHtml.includes('class="news-detail__table-scroll"') ? newsFallbackTableStyles : ""}<main class="v2-page v3-page news-detail-page" id="top" data-nexualpha-ssr-fallback="news-detail">
    <article class="news-detail-container v2-shell">
      <nav class="news-detail__nav"><a href="${escapeHtml(newsHref)}" class="news-detail__back">${escapeHtml(t.back)}</a></nav>
      <header class="news-detail__header">
        <div class="news-detail__meta"><span class="news-detail__tag">${escapeHtml(localizedArticleText(article.categoryName, locale) || article.category || "research")}</span><time class="news-detail__date" datetime="${escapeHtml(article.publishedAt || "")}">${escapeHtml(String(article.publishedAt || "").slice(0, 10))}</time><span class="news-detail__readtime">${escapeHtml(newsReadTimes(article.content)[contentLocale] || article.readTime || "")}</span></div>
        <h1 class="news-detail__title">${escapeHtml(title)}</h1>
        <p class="news-detail__summary">${escapeHtml(summary)}</p>
        <div class="news-detail__author-bar"><span>${escapeHtml(t.author)}: <strong>${escapeHtml(article.author || "NexuAlpha Research Desk")}</strong></span></div>
        ${showsOriginalLanguage ? `<p class="news-detail__translation-note" role="note">${escapeHtml(t.originalNotice)}</p>` : ""}
      </header>
      <section class="news-detail__content"><div class="news-detail__prose">${articleContentHtml}${relatedLinksHtml}${sourcesHtml}${endSponsoredHtml}</div></section>
      ${railSponsoredHtml}
    </article>
  </main>`;
}

// Server-rendered news library page (2026-10-10): category links, 24 newest-first cards and real <a href> pagination.
// The client NewsListPage re-renders the same structure from the hydration state (newsArticles + newsListing).
function newsCardCategoryLabel(article, locale) {
  const own = article?.categoryName && typeof article.categoryName === "object" ? article.categoryName[locale] : null;
  if (typeof own === "string" && own.trim()) return own.trim();
  return newsCategoryCopy(article?.category, locale)?.label || localizedArticleText(article?.categoryName, locale) || article?.category || "research";
}

function renderNewsCategoryNavHtml(locale, active, counts = null) {
  const libraryCopy = newsLibraryCopy(locale);
  const items = [{ key: null, label: libraryCopy.all }, ...NEWS_CATEGORY_KEYS.map((key) => ({ key, label: newsCategoryCopy(key, locale).label }))];
  return `<nav class="news-tabs news-category-nav" aria-label="${escapeHtml(libraryCopy.browse)}">${items.map(({ key, label }) => {
    const current = (key || null) === (active || null);
    const count = key && counts && Number.isFinite(counts[key]) ? `<span class="news-tab__count">${counts[key]}</span>` : "";
    return `<a class="news-tab${current ? " news-tab--active" : ""}" href="${escapeHtml(localizedPath(newsListingPath({ category: key }), locale))}"${current ? ' aria-current="page"' : ""} data-cta-kind="research" data-cta-placement="news-category-nav">${escapeHtml(label)}${count}</a>`;
  }).join("")}</nav>`;
}

function renderNewsPaginationHtml(locale, { category = null, page = 1, totalPages = 1 } = {}) {
  if (totalPages <= 1) return "";
  const libraryCopy = newsLibraryCopy(locale);
  const href = (n) => escapeHtml(localizedPath(newsListingPath({ category, page: n }), locale));
  const items = newsPaginationItems(page, totalPages).map((n) => n === null
    ? '<li class="news-pagination__gap" aria-hidden="true">…</li>'
    : n === page
      ? `<li><a class="news-pagination__pill" href="${href(n)}" aria-current="page">${n}</a></li>`
      : `<li><a class="news-pagination__pill" href="${href(n)}">${n}</a></li>`).join("");
  return `<nav class="news-pagination" aria-label="${escapeHtml(libraryCopy.pagination)}" data-page="${page}" data-total-pages="${totalPages}">
    ${page > 1 ? `<a class="news-pagination__step news-pagination__step--prev" href="${href(page - 1)}" rel="prev" data-cta-placement="news-pagination-prev"><span aria-hidden="true">←</span> ${escapeHtml(libraryCopy.previous)}</a>` : ""}
    <ol class="news-pagination__pills">${items}</ol>
    <p class="news-pagination__status">${escapeHtml(libraryCopy.pageOf(page, totalPages))}</p>
    ${page < totalPages ? `<a class="news-pagination__step news-pagination__step--next" href="${href(page + 1)}" rel="next" data-cta-placement="news-pagination-next">${escapeHtml(libraryCopy.next)} <span aria-hidden="true">→</span></a>` : ""}
  </nav>`;
}

function renderNewsListingFallback(metadata, locale, listing) {
  const t = newsFallbackCopy(locale);
  const { category = null, page = 1 } = listing;
  const pagination = paginateNews(metadata.newsArticles, { category, page, locale });
  const libraryCopy = newsLibraryCopy(locale);
  const categoryCopy = category ? newsCategoryCopy(category, locale) : null;
  // Same heading source as NewsListPage (src/data/news-list-copy.js): the fallback must never show a different H1.
  const hero = newsListHeroCopy(locale);
  const heading = categoryCopy ? categoryCopy.label : hero.title;
  const subtitle = categoryCopy ? categoryCopy.intro : hero.subtitle;
  return `<main class="v6 v2-page v3-page news-page" id="top" data-nexualpha-ssr-fallback="news-list" data-news-category="${escapeHtml(category || "all")}" data-news-page="${pagination.page}">
      <section class="news-hero v2-shell">
        <div class="news-hero__badge">${escapeHtml(hero.eyebrow)}</div>
        <h1 class="news-hero__title">${escapeHtml(heading)}</h1>
        <p class="news-hero__subtitle">${escapeHtml(subtitle)}</p>
        <div class="news-index-controls">${renderNewsCategoryNavHtml(locale, category, newsCategoryCounts(metadata.newsArticles))}</div>
        <p class="news-index-status">${escapeHtml(libraryCopy.pageOf(pagination.page, pagination.totalPages))}</p>
      </section>
      ${renderDecisionPathRailFallback(locale, "news")}
      <section class="news-grid-section v2-shell">
        <div class="news-grid">${pagination.rows.map((article) => {
          const title = localizedArticleText(article.title, locale) || article.slug;
          const summary = localizedArticleText(article.summary, locale) || article.seo?.description || "";
          const href = localizedCanonical(`/news/${article.slug}`, locale);
          return `<article class="news-article-card">
            <div class="news-article-card__header"><span class="news-article-card__tag news-article-card__tag--${escapeHtml(article.category || "research")}">${escapeHtml(newsCardCategoryLabel(article, locale))}</span><time class="news-article-card__time" datetime="${escapeHtml(article.publishedAt || "")}">${escapeHtml(String(article.publishedAt || "").slice(0, 10))}</time></div>
            <h2 class="news-article-card__title"><a href="${escapeHtml(href)}">${escapeHtml(title)}</a></h2>
            <p class="news-article-card__summary">${escapeHtml(summary)}</p>
          </article>`;
        }).join("")}</div>
        ${renderNewsPaginationHtml(locale, { category, page: pagination.page, totalPages: pagination.totalPages })}
      </section>
    </main>`;
}

// Related articles for an article page: same category plus shared relatedVenues, summary-only.
function newsRelatedSummaries(article, articles) {
  return relatedNewsArticles(article, articles).map(summarizeNewsArticle).filter(Boolean);
}

function renderNewsRelatedArticlesHtml(article, articles, locale) {
  const related = relatedNewsArticles(article, articles);
  if (!related.length) return "";
  const title = newsLibraryCopy(locale).related;
  return `<section class="news-detail__related-research" aria-label="${escapeHtml(title)}"><h2>${escapeHtml(title)}</h2><ul class="news-detail__related-articles">${related.map((item) => {
    const href = localizedCanonical(`/news/${item.slug}`, locale);
    const label = localizedNewsTitle(item, locale) || item.slug;
    return `<li><a class="news-detail__related-card" href="${escapeHtml(href)}" data-cta-kind="research" data-cta-placement="news-detail-related-article"><span class="news-detail__related-meta">${escapeHtml(newsCardCategoryLabel(item, locale))} · <time datetime="${escapeHtml(item.publishedAt || "")}">${escapeHtml(String(item.publishedAt || "").slice(0, 10))}</time></span><span class="news-detail__related-title">${escapeHtml(label)}</span></a></li>`;
  }).join("")}</ul></section>`;
}

// "Topic hubs & tools" (links-l10n lane 2026-10-11, scorecard C5/D4): the same cluster links NewsDetailPage renders.
function renderArticleClusterLinksHtml(article, locale) {
  const links = articleClusterLinks(article, locale);
  if (!links.length) return "";
  return `<p class="news-detail__cluster-links" data-news-cluster-links=""><span>${escapeHtml(articleClusterLineLabel(locale))}:</span> ${links.map((link) => `<a href="${escapeHtml(link.href)}" data-cluster-link="${escapeHtml(link.id)}">${escapeHtml(link.label)}</a>`).join(" · ")}</p>`;
}

function renderArticleRelatedLinks(article, locale) {
  const targets = Array.isArray(article?.seo?.internalLinkTargets) ? article.seo.internalLinkTargets : [];
  const venueTargets = articleVenueTargets(article);
  const safeTargets = [...new Set([...targets, ...venueTargets])]
    .filter((target) => typeof target === "string" && /^\/[a-z0-9][a-z0-9/_-]*(?:\?[a-z0-9=&._%-]+)?$/i.test(target))
    .filter((target) => !target.startsWith("/ref/"))
    .slice(0, 8);
  if (!safeTargets.length) return "";
  const label = locale === "zh-Hans" ? "继续核验" : locale === "zh-Hant" ? "繼續核驗" : "Continue checking";
  return `<h2>${escapeHtml(label)}</h2><ul>${safeTargets.map((target) => {
    const href = localizedCanonical(target, locale);
    const text = target.split("?")[0].split("/").filter(Boolean).join(" / ").replaceAll("-", " ");
    return `<li><a href="${escapeHtml(href)}">${escapeHtml(text || target)}</a></li>`;
  }).join("")}</ul>`;
}

function articleVenueTargets(article) {
  const related = Array.isArray(article?.relatedVenues) ? article.relatedVenues : [];
  const text = `${localizedArticleText(article?.title, "en")} ${localizedArticleText(article?.summary, "en")} ${article?.slug || ""}`.toLowerCase();
  const slugs = new Set(related);
  for (const [slug, venue] of Object.entries(VENUE_REGISTRY)) {
    const name = String(venue?.name || slug).toLowerCase();
    if (text.includes(name) || text.includes(slug.replace(/-/g, " "))) slugs.add(slug);
  }
  return [...slugs]
    .filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && VENUE_REGISTRY[slug])
    .map((slug) => `/exchanges/${slug}`);
}

function injectFallbackBody(html, metadata, url) {
  if (!/<div\s+id=["']root["']\s*>\s*<\/div>/i.test(html)) return html;
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  const contentUrl = new URL(url);
  contentUrl.pathname = publicRoute.localeSource === "path" ? publicRoute.contentPathname : url.pathname;
  if (publicRoute.localeSource === "path") contentUrl.searchParams.set("locale", publicRoute.locale);
  const appHtml = renderNewsFallbackBody(metadata, contentUrl);
  if (!appHtml) return html;
  const slug = cleanSlug(contentUrl.pathname.match(/^\/news\/([a-z0-9-]+)$/)?.[1]);
  const locale = routeLocale(contentUrl);
  const sourceArticles = Array.isArray(metadata.newsArticles) ? metadata.newsArticles : [];
  let hydrationArticles = [];
  let newsListing = null;
  const listing = parseNewsListingPath(contentUrl.pathname);
  if (listing && !listing.invalid) {
    const pagination = paginateNews(sourceArticles, { ...listing, locale });
    hydrationArticles = initialNewsArticlesForRoute("/news", pagination.rows, locale);
    newsListing = { category: listing.category, page: pagination.page, total: pagination.total, totalPages: pagination.totalPages, libraryTotal: sourceArticles.length, counts: newsCategoryCounts(sourceArticles) };
  } else if (slug) {
    const article = sourceArticles.find((item) => item?.slug === slug);
    hydrationArticles = article ? initialNewsArticlesForRoute(contentUrl.pathname, [article, ...newsRelatedSummaries(article, sourceArticles)], locale) : [];
  }
  if (!hydrationArticles.length) {
    return html.replace(/<div\s+id=["']root["']\s*>\s*<\/div>/i, () => `<div id="root" data-nexualpha-client-render="true">${appHtml}</div>`);
  }
  const payload = safeJson({
    pathname: contentUrl.pathname,
    locale,
    version: "nexualpha-prerender-v1",
    newsArticles: hydrationArticles,
    ...(newsListing ? { newsListing } : {}),
    ...(metadata.newsFeedFingerprint ? { newsFeedFingerprint: metadata.newsFeedFingerprint } : {}),
  });
  return html.replace(
    /<div\s+id=["']root["']\s*>\s*<\/div>/i,
    () => `<div id="root" data-nexualpha-client-render="true">${appHtml}</div><script type="application/json" id="nexualpha-prerender-state">${payload}</script>`,
  );
}

// The URL the browser hydrates with (src/data/hydration-bootstrap.js): content pathname + explicit locale, no other
// query. Rendering the same URL on the server keeps every generated href identical between SSR and first render.
function hydrationRenderUrl(url, pathname, locale) {
  const renderUrl = new URL(url);
  renderUrl.pathname = pathname;
  renderUrl.search = "";
  renderUrl.hash = "";
  renderUrl.searchParams.set("locale", locale || "en");
  return renderUrl.href;
}

function activityRequestContext(url) {
  return Object.fromEntries(["market", "product", "account_stage", "funding"]
    .map(key => [key, url.searchParams.get(key)?.slice(0, 64)])
    .filter(([, value]) => value));
}
function activityRenderUrl(url, pathname, locale) {
  const renderUrl = new URL(hydrationRenderUrl(url, pathname, locale));
  for (const [key, value] of Object.entries(activityRequestContext(url))) renderUrl.searchParams.set(key, value);
  return renderUrl.href;
}

async function renderNewsListingAtRequestTime(html, metadata, url, env, publicRoute) {
  const pathname = publicRoute.contentPathname;
  const listing = parseNewsListingPath(pathname);
  if (!listing || listing.invalid || listing.redirect || !Array.isArray(metadata.newsArticles)) return null;
  const locale = publicRoute.locale;
  try {
    const pagination = paginateNews(metadata.newsArticles, { category: listing.category, page: listing.page, locale });
    const newsArticles = initialNewsArticlesForRoute("/news", pagination.rows, locale);
    const newsListing = {
      category: listing.category, page: pagination.page, total: pagination.total, totalPages: pagination.totalPages,
      libraryTotal: metadata.newsArticles.length, counts: newsCategoryCounts(metadata.newsArticles),
    };
    // T10: the hub (page 1, all categories) links the strongest articles by Google impressions.
    const toolArticles = toolKeyForPath(pathname) === NEWS_HUB_TOOL_KEY && metadata.newsFeedFingerprint
      ? cachedToolArticleLinks({ articles: metadata.newsArticles, fingerprint: metadata.newsFeedFingerprint }, NEWS_HUB_TOOL_KEY, UI_LOCALES.has(locale) ? locale : "en") || undefined
      : undefined;
    const appHtml = await env.NEWS_SSR_RENDER(hydrationRenderUrl(url, pathname, locale), { newsArticles, newsListing, toolArticles });
    if (typeof appHtml === "string" && appHtml.includes('class="news-hero__title"')) {
      metadata.newsSsrMode = "runtime";
      return injectPrerenderedBody(html, appHtml, `${pathname}|${locale}`, { newsArticles, newsListing, ...(toolArticles ? { toolArticles } : {}) }, url);
    }
    console.error(`[NexuAlpha] news listing SSR returned no listing body for ${pathname} (${locale}); serving the fallback template`);
  } catch (error) {
    console.error(`[NexuAlpha] news listing SSR failed for ${pathname} (${locale}): ${error?.message || error}`);
  }
  return null;
}

// Campaign rows for the /activities SSR and its hydration payload: official "event" announcements of the last 30 days
// (the same filter LiveCampaigns applies), only the fields the cards render. Nothing is invented: no feed, no rows.
const LIVE_CAMPAIGN_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
function compactCampaignBrief(brief) {
  if (!brief || typeof brief !== "object") return null;
  return {
    id: String(brief.id || ""),
    ...(typeof brief.updated === "string" ? { updated: brief.updated } : {}),
    ...(brief.headline && typeof brief.headline === "object" ? { headline: brief.headline } : {}),
    ...(brief.summary && typeof brief.summary === "object" ? { summary: brief.summary } : {}),
    ...(Array.isArray(brief.key_facts) ? { key_facts: brief.key_facts } : {}),
    ...(brief.who_can_join && typeof brief.who_can_join === "object" ? { who_can_join: brief.who_can_join } : {}),
    ...(typeof brief.deadline === "string" || brief.deadline === null ? { deadline: brief.deadline } : {}),
    ...(brief.reward_text && typeof brief.reward_text === "object" ? { reward_text: brief.reward_text } : {}),
    ...(typeof brief.source_checked === "string" ? { source_checked: brief.source_checked } : {}),
  };
}

function attachBriefToCompactItem(item, feed) {
  const brief = compactCampaignBrief(feed?.campaignBriefs?.find((row) => row?.id === String(item.id || item.url || "")));
  return brief ? { ...item, brief } : item;
}

export function compactOfficialAnnouncements(feed, now = Date.now()) {
  if (!feed || typeof feed !== "object" || !Array.isArray(feed.items)) return null;
  const items = readIntelFeed(feed, { now })
    .filter((item) => item.category === "event" && now - Date.parse(item.publishedAt) < LIVE_CAMPAIGN_WINDOW_MS)
    .map(({ id, venue, category, title, summary, url, publishedAt }) => attachBriefToCompactItem({ id, venue, category, title, ...(typeof summary === "string" && summary ? { summary } : {}), url, publishedAt }, feed));
  return {
    generatedAt: typeof feed.generatedAt === "string" ? feed.generatedAt : null,
    items,
    ...(Array.isArray(feed.campaignBriefs) ? { campaignBriefs: campaignBriefItems(feed.campaignBriefs).map(compactCampaignBrief).filter(Boolean) } : {}),
  };
}

function compactActivityUpdateItems(feed) {
  if (!feed || typeof feed !== "object") return null;
  const items = updateItems(feed).map(({ id, venue, category, title, headlines, summary, url, publishedAt, startAt, endAt, expiresAt }) => ({
    id, venue, category, title, ...(typeof summary === "string" && summary ? { summary } : {}), url, publishedAt,
    ...(headlines && typeof headlines === "object" ? { headlines } : {}),
    ...(typeof startAt === "string" ? { startAt } : {}),
    ...(typeof endAt === "string" ? { endAt } : {}),
    ...(typeof expiresAt === "string" ? { expiresAt } : {}),
  })).map((item) => attachBriefToCompactItem(item, feed));
  return {
    generatedAt: typeof feed.generatedAt === "string" ? feed.generatedAt : null,
    items,
    ...(Array.isArray(feed.campaignBriefs) ? { campaignBriefs: campaignBriefItems(feed.campaignBriefs).map(compactCampaignBrief).filter(Boolean) } : {}),
  };
}

function findActivityUpdate(feed, venue, slug) {
  const compact = compactActivityUpdateItems(feed);
  const pathname = `/activities/updates/${venue}/${slug}`;
  const update = compact?.items.find((item) => updatePath(item) === pathname) || null;
  return { update, compact };
}

// Append-only announcement archive (src/data/announcement-archive.js): every item the live feed ever carried. The
// production server passes INTEL_ARCHIVE_READ; Sites/preview builds read the shipped asset. null when unavailable.
async function readActivityUpdateArchive(env, url) {
  if (typeof env?.INTEL_ARCHIVE_READ === "function") {
    try {
      const archive = await env.INTEL_ARCHIVE_READ();
      if (archive) return archive;
    } catch {
      // fall through to the shipped asset
    }
  }
  if (!env?.ASSETS) return null;
  try {
    const response = await env.ASSETS.fetch(new Request(new URL(ARCHIVE_PATH, url), { headers: { accept: "application/json" } }));
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

// An update page whose item left the live feed: the archived row, rendered as an ended update. Same compact shape as the
// live rows (plus archived: true), so SSR, hydration and the client find it through the same updatePath lookup.
async function findArchivedActivityUpdate(env, url, venue, slug, now = Date.now()) {
  const archive = await readActivityUpdateArchive(env, url);
  const pathname = `/activities/updates/${venue}/${slug}`;
  const row = archiveItems(archive, { now }).map(normalizeUpdateItem).find((item) => updatePath(item) === pathname);
  if (!row) return null;
  const { id, category, title, summary, url: officialUrl, publishedAt, startAt, endAt, expiresAt } = row;
  return {
    id, venue: row.venue, category, title, ...(typeof summary === "string" && summary ? { summary } : {}), url: officialUrl, publishedAt,
    ...(typeof startAt === "string" ? { startAt } : {}), ...(typeof endAt === "string" ? { endAt } : {}), ...(typeof expiresAt === "string" ? { expiresAt } : {}),
    archived: true,
  };
}

function mergeActivityUpdateFeeds(seed, officialRows) {
  const rows = Array.isArray(officialRows) ? officialRows : [];
  if (!rows.length) return seed || null;
  return {
    ...(seed && typeof seed === "object" ? seed : {}),
    generatedAt: typeof seed?.generatedAt === "string" ? seed.generatedAt : null,
    items: [...(Array.isArray(seed?.items) ? seed.items : []), ...rows],
  };
}

async function readOfficialUpdatesForActivityFeed(env, url) {
  try {
    const apiUrl = new URL("/api/v1/official-updates", url);
    const response = await handleApi(new Request(apiUrl, { headers: { accept: "application/json" } }), env, apiUrl);
    const payload = response.ok ? await response.json() : null;
    const reviewed = (Array.isArray(payload?.data) ? payload.data : []).filter((item) => item?.reviewStatus === "APPROVED" && item.fixture === false);
    const updates = visibleOfficialUpdates(reviewed);
    return updates.map(normalizeUpdateItem).filter((item) => item?.id && item.venue && item.title && item.url && item.publishedAt);
  } catch {
    return [];
  }
}

async function readCampaignBriefs(env, url) {
  if (!env?.ASSETS) return [];
  try {
    const response = await env.ASSETS.fetch(new Request(new URL(CAMPAIGN_BRIEFS_URL, url), { headers: { accept: "application/json" } }));
    if (!response.ok) return [];
    return campaignBriefItems(await response.json());
  } catch {
    return [];
  }
}

async function readActivityUpdateFeed(env, url) {
  const officialRows = await readOfficialUpdatesForActivityFeed(env, url);
  const campaignBriefs = await readCampaignBriefs(env, url);
  const attachBriefs = (feed) => attachCampaignBriefs(mergeActivityUpdateFeeds(feed, officialRows), campaignBriefs);
  if (typeof env?.INTEL_READ === "function") {
    try {
      const feed = await env.INTEL_READ();
      if (feed) return attachBriefs(feed);
    } catch {
      // Local Sites preview may not wire INTEL_READ; fall through to the built asset seed.
    }
  }
  if (!env?.ASSETS) return attachBriefs(null);
  const response = await env.ASSETS.fetch(new Request(new URL("/intel/official-announcements.json", url), { headers: { accept: "application/json" } }));
  if (!response.ok) return attachBriefs(null);
  return attachBriefs(await response.json());
}

function parseActivityUpdatePath(pathname) {
  const match = normalizePathname(pathname).match(/^\/activities\/updates\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  try {
    return { venue: decodeURIComponent(match[1]), slug: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}

async function renderActivitiesAtRequestTime(html, metadata, url, env) {
  if (typeof env?.NEWS_SSR_RENDER !== "function" || typeof env?.INTEL_READ !== "function") return null;
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  let officialAnnouncements = null;
  try {
    const feed = attachCampaignBriefs(await env.INTEL_READ(), await readCampaignBriefs(env, url));
    officialAnnouncements = compactOfficialAnnouncements(feed);
  } catch (error) {
    console.error(`[NexuAlpha] activities SSR could not read the announcement feed: ${error?.message || error}`);
  }
  if (!officialAnnouncements) return null;
  try {
    const toolArticles = await toolArticlesForRequest(env, url, "/activities", publicRoute.locale);
    const appHtml = await env.NEWS_SSR_RENDER(activityRenderUrl(url, "/activities", publicRoute.locale), { officialAnnouncements, toolArticles });
    if (typeof appHtml === "string" && appHtml.includes('class="live-campaigns')) {
      metadata.activitiesSsrMode = "runtime";
      return injectPrerenderedBody(html, appHtml, `/activities|${publicRoute.locale}`, { officialAnnouncements, toolArticles, activityContext: activityRequestContext(url) }, url);
    }
    console.error(`[NexuAlpha] activities SSR returned no campaign body (${publicRoute.locale}); serving the prerendered page`);
  } catch (error) {
    console.error(`[NexuAlpha] activities SSR failed (${publicRoute.locale}): ${error?.message || error}`);
  }
  return null;
}

async function renderActivityUpdateAtRequestTime(html, metadata, url, env) {
  if (metadata?.marker !== ACTIVITY_UPDATE_ROUTE_MARKER || typeof env?.NEWS_SSR_RENDER !== "function") return null;
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  let officialAnnouncements = metadata.activityUpdateFeed || null;
  try { officialAnnouncements ||= compactActivityUpdateItems(await readActivityUpdateFeed(env, url)); } catch (error) {
    console.error(`[NexuAlpha] activity update SSR could not read the announcement feed: ${error?.message || error}`);
  }
  if (!officialAnnouncements) return null;
  try {
    const appHtml = await env.NEWS_SSR_RENDER(activityRenderUrl(url, publicRoute.contentPathname, publicRoute.locale), { officialAnnouncements });
    if (typeof appHtml === "string" && hasMainWithHeading(appHtml)) {
      metadata.activitiesSsrMode = "runtime-update";
      return injectPrerenderedBody(html, appHtml, `${publicRoute.contentPathname}|${publicRoute.locale}`, { officialAnnouncements, activityContext: activityRequestContext(url) }, url);
    }
    console.error(`[NexuAlpha] activity update SSR returned no page body for ${publicRoute.contentPathname} (${publicRoute.locale}); serving the app shell`);
  } catch (error) {
    console.error(`[NexuAlpha] activity update SSR failed for ${publicRoute.contentPathname} (${publicRoute.locale}): ${error?.message || error}`);
  }
  return null;
}

// Request-time render of a route the build-time manifest does not carry (QA #10, 2026-10-11). Locale editions without
// their own content (/ja/topics, /ar/factbook, /ko/topics/tokenized-assets, …) are served noindex with a canonical to the
// owner edition, but their SSR body used to be the empty app shell: the client then rendered the whole page (CLS
// 0.3-0.9 at 390, nothing for no-JS readers). Render the same component with the same props and the same bootstrap URL
// the browser hydrates (content pathname + explicit locale); the shell is served only when the renderer throws or
// returns no page (both logged). `accept` names the markup that proves the renderer produced the client's page.
async function renderRouteAtRequestTime(html, metadata, url, env, { accept, label, preserveContext = false, hydrationData = {} }) {
  if (typeof env?.NEWS_SSR_RENDER !== "function") return null;
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  const pathname = publicRoute.contentPathname;
  const locale = publicRoute.locale;
  try {
    const renderUrl = new URL(hydrationRenderUrl(url, pathname, locale));
    if (preserveContext) for (const key of ["market", "product", "account_stage", "funding"]) {
      const value = url.searchParams.get(key);
      if (value) renderUrl.searchParams.set(key, value);
    }
    const appHtml = await env.NEWS_SSR_RENDER(renderUrl.href, {});
    if (typeof appHtml === "string" && accept(appHtml)) {
      metadata.fallbackSsrMode = "runtime";
      return injectPrerenderedBody(html, appHtml, `${pathname}|${locale}`, hydrationData, url);
    }
    console.error(`[NexuAlpha] ${label} SSR returned no page body for ${pathname} (${locale}); serving the app shell`);
  } catch (error) {
    console.error(`[NexuAlpha] ${label} SSR failed for ${pathname} (${locale}): ${error?.message || error}`);
  }
  return null;
}

const hasMainWithHeading = (appHtml) => /<main\b/i.test(appHtml) && /<h1\b/i.test(appHtml);
const REQUEST_TIME_FALLBACK_EXCLUDED_MARKERS = new Set([NEWS_ROUTE_MARKER, ARTICLE_ROUTE_MARKER, HOME_ROUTE_MARKER, EXCHANGES_ROUTE_MARKER, VENUE_ROUTE_MARKER, COMPARE_ROUTE_MARKER, ACTIVITIES_ROUTE_MARKER, ACTIVITY_UPDATE_ROUTE_MARKER]);
// NotFoundPage (V3Pages.jsx): `/ja/br` and other legacy market paths resolve to a different client page, so only the
// 404 component itself is accepted; anything else keeps the shell.
const isNotFoundPage = (appHtml) => appHtml.includes("v3-page--empty") && /<h1\b[^>]*>404<\/h1>/.test(appHtml);

async function injectPrerenderedRoute(html, metadata, url, env) {
  if (!/<div\s+id=["']root["']\s*>\s*<\/div>/i.test(html)) return html;
  if (metadata.status === 404) {
    return (await renderRouteAtRequestTime(html, metadata, url, env, { accept: isNotFoundPage, label: "not-found" })) || html;
  }
  if (metadata.status !== 200) return html;
  // Latest article body must use the same component as hydration. Keep the
  // existing content fingerprint gate; never admit an obsolete prerender.
  const fallback = async () => {
    const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
    const pathname = publicRoute.contentPathname;
    // News listings (2026-10-11): /news, /news/page/N and /news/category/<key>[/page/N] in every locale are rendered at
    // request time with the NewsListPage the browser hydrates (summary rows of this page + library counts), so the
    // SSR body, the head and the first client render agree and crawlers index the current listing. The hand-written
    // renderNewsListingFallback stays only for hosts without the renderer, or when it throws (logged).
    if (metadata.marker === NEWS_ROUTE_MARKER && typeof env?.NEWS_SSR_RENDER === "function") {
      const rendered = await renderNewsListingAtRequestTime(html, metadata, url, env, publicRoute);
      if (rendered) return rendered;
    }
    if (metadata.marker === ARTICLE_ROUTE_MARKER && typeof env?.NEWS_SSR_RENDER === "function") {
      const article = metadata.newsArticles?.find(item => `/news/${item.slug}` === pathname);
      if (article) {
        try {
          const locale = publicRoute.locale;
          const newsArticles = [article, ...newsRelatedSummaries(article, metadata.newsArticles)];
          const appHtml = await env.NEWS_SSR_RENDER(url.href, { newsArticles });
          if (typeof appHtml === "string" && appHtml.includes('class="news-detail__title"')) {
            metadata.newsSsrMode = "runtime";
            return injectPrerenderedBody(html, appHtml, `${pathname}|${locale}`, { newsArticles }, url);
          }
        } catch { /* Portable assets-only hosts retain their safe fallback. */ }
      }
    }
    // Data pages are rendered at request time from the collector feed (60 s server cache in server/market-events-feed.mjs).
    // Without a renderer (assets-only hosts) the client renders them; without a feed the page shows its unavailable state.
    if (pathname === "/funding-rates/matrix" && typeof env?.NEWS_SSR_RENDER === "function") {
      let fundingMatrix = null;
      try { fundingMatrix = typeof env.FUNDING_MATRIX_READ === "function" ? await env.FUNDING_MATRIX_READ() : null; } catch { /* unavailable */ }
      try {
        const appHtml = await env.NEWS_SSR_RENDER(url.href, { fundingMatrix });
        if (typeof appHtml === "string" && appHtml.includes('data-testid="funding-matrix-page"')) {
          metadata.dataSsrMode = fundingMatrix ? "runtime" : "runtime-no-feed";
          return injectPrerenderedBody(html, appHtml, `${pathname}|${publicRoute.locale}`, { fundingMatrix }, url);
        }
      } catch { /* portable assets-only fallback */ }
    }
    if (isDataPagePath(pathname) && typeof env?.NEWS_SSR_RENDER === "function") {
      let marketEvents = null;
      try { marketEvents = typeof env?.MARKET_EVENTS_READ === "function" ? compactMarketEvents(await env.MARKET_EVENTS_READ()) : null; } catch { marketEvents = null; }
      try {
        const toolArticles = await toolArticlesForRequest(env, url, pathname, publicRoute.locale);
        const appHtml = await env.NEWS_SSR_RENDER(url.href, { marketEvents, toolArticles });
        if (typeof appHtml === "string" && appHtml.includes("class=\"nxd-hero")) {
          metadata.dataSsrMode = marketEvents ? "runtime" : "runtime-no-feed";
          return injectPrerenderedBody(html, appHtml, `${pathname}|${publicRoute.locale}`, { marketEvents, toolArticles }, url);
        }
      } catch { /* fall through to the client-rendered shell */ }
    }
    // Compare hub and generated pairs (compare-any, 2026-10-11) are not in the build-time prerender manifest (196 pairs
    // x 15 locales); render them at request time with the same renderer so crawlers and no-JS readers get the matrix.
    if ((pathname === "/compare" || (metadata.marker === COMPARE_ROUTE_MARKER && metadata.generatedComparison)) && typeof env?.NEWS_SSR_RENDER === "function") {
      try {
        const toolArticles = await toolArticlesForRequest(env, url, pathname, publicRoute.locale);
        const appHtml = await env.NEWS_SSR_RENDER(url.href, { toolArticles });
        if (typeof appHtml === "string" && (appHtml.includes("v3-compare-page") || appHtml.includes("v3-compare-hub"))) {
          metadata.compareSsrMode = "runtime";
          return injectPrerenderedBody(html, appHtml, `${pathname}|${publicRoute.locale}`, { toolArticles }, url);
        }
      } catch { /* fall through to the client-rendered shell */ }
    }
    if (metadata.marker === APP_DOWNLOAD_ROUTE_MARKER && typeof env?.NEWS_SSR_RENDER === "function") {
      const rendered = await renderRouteAtRequestTime(html, metadata, url, env, {
        accept: (appHtml) => appHtml.includes('class="nx-app-download '), label: "app-download", preserveContext: true, hydrationData: { appDownloadContext: activityRequestContext(url) },
      });
      if (rendered) return rendered;
    }
    // Academy hub and lessons: static copy rendered at request time with the component the browser hydrates (full
    // transcript, takeaways and exercise in the HTML for crawlers and no-JS readers).
    if (metadata.marker === ACADEMY_ROUTE_MARKER && typeof env?.NEWS_SSR_RENDER === "function") {
      try {
        const appHtml = await env.NEWS_SSR_RENDER(hydrationRenderUrl(url, pathname, publicRoute.locale), {});
        if (typeof appHtml === "string" && appHtml.includes("class=\"nxa ")) {
          metadata.academySsrMode = "runtime";
          return injectPrerenderedBody(html, appHtml, `${pathname}|${publicRoute.locale}`, {}, url);
        }
        console.error(`[NexuAlpha] academy SSR returned no page body for ${pathname} (${publicRoute.locale}); serving the app shell`);
      } catch (error) { console.error(`[NexuAlpha] academy SSR failed for ${pathname} (${publicRoute.locale}): ${error?.message || error}`); }
    }
    if (metadata.marker === LICENSES_ROUTE_MARKER && typeof env?.NEWS_SSR_RENDER === "function") {
      try {
        const appHtml = await env.NEWS_SSR_RENDER(hydrationRenderUrl(url, pathname, publicRoute.locale), {});
        if (typeof appHtml === "string" && appHtml.includes("class=\"v2-shell nx-licenses")) {
          metadata.licensesSsrMode = "runtime";
          return injectPrerenderedBody(html, appHtml, `${pathname}|${publicRoute.locale}`, {}, url);
        }
        console.error(`[NexuAlpha] licenses SSR returned no page body for ${pathname} (${publicRoute.locale}); serving the app shell`);
      } catch (error) { console.error(`[NexuAlpha] licenses SSR failed for ${pathname} (${publicRoute.locale}): ${error?.message || error}`); }
    }
    // Where to buy <coin> (hub + coin pages): rendered at request time with the component the browser hydrates.
    if (metadata.marker === COINS_ROUTE_MARKER && typeof env?.NEWS_SSR_RENDER === "function") {
      try {
        // No newer runtime snapshot: an empty overlay still tells the browser this page was server-rendered (no refetch).
        const overlay = await refreshCoinOverlay(env);
        const coins = overlay || { generatedAt: COINS_GENERATED_AT, rows: [] };
        const appHtml = await env.NEWS_SSR_RENDER(hydrationRenderUrl(url, pathname, publicRoute.locale), { coins });
        if (typeof appHtml === "string" && appHtml.includes("class=\"nxc ")) {
          metadata.coinsSsrMode = overlay ? "runtime-snapshot" : "runtime";
          return injectPrerenderedBody(html, appHtml, `${pathname}|${publicRoute.locale}`, { coins }, url);
        }
        console.error(`[NexuAlpha] coins SSR returned no page body for ${pathname} (${publicRoute.locale}); serving the app shell`);
      } catch (error) { console.error(`[NexuAlpha] coins SSR failed for ${pathname} (${publicRoute.locale}): ${error?.message || error}`); }
    }
    // Spot ETF flows + crypto calendar: rendered at request time from the runtime snapshot the head was built from.
    if (metadata.marker === INTEL_TOOLS_ROUTE_MARKER && typeof env?.NEWS_SSR_RENDER === "function") {
      try {
        const intelTool = metadata.intelTool || null;
        const appHtml = await env.NEWS_SSR_RENDER(hydrationRenderUrl(url, pathname, publicRoute.locale), intelTool ? { intelTool } : {});
        if (typeof appHtml === "string" && appHtml.includes("class=\"v6 v2-page v3-page nxd nxi ")) {
          metadata.intelToolSsrMode = intelTool?.data ? "runtime" : "runtime-no-data";
          return injectPrerenderedBody(html, appHtml, `${pathname}|${publicRoute.locale}`, intelTool ? { intelTool } : {}, url);
        }
        console.error(`[NexuAlpha] intel tool SSR returned no page body for ${pathname} (${publicRoute.locale}); serving the app shell`);
      } catch (error) { console.error(`[NexuAlpha] intel tool SSR failed for ${pathname} (${publicRoute.locale}): ${error?.message || error}`); }
    }
    if (metadata.marker === CONVERTER_ROUTE_MARKER && typeof env?.NEWS_SSR_RENDER === "function") {
      try {
        const overlay = await refreshCoinOverlay(env);
        const coins = overlay || { generatedAt: COINS_GENERATED_AT, rows: [] };
        const fx = metadata.converterFx || await refreshFxSnapshot(env);
        const appHtml = await env.NEWS_SSR_RENDER(hydrationRenderUrl(url, pathname, publicRoute.locale), { coins, fx });
        if (typeof appHtml === "string" && appHtml.includes("class=\"nxconvert")) {
          metadata.converterSsrMode = fx ? "runtime" : "runtime-no-fx";
          return injectPrerenderedBody(html, appHtml, `${pathname}|${publicRoute.locale}`, { coins, fx }, url);
        }
        console.error(`[NexuAlpha] converter SSR returned no page body for ${pathname} (${publicRoute.locale}); serving the app shell`);
      } catch (error) { console.error(`[NexuAlpha] converter SSR failed for ${pathname} (${publicRoute.locale}): ${error?.message || error}`); }
    }
    if (metadata.marker === RADAR_ROUTE_MARKER && typeof env?.NEWS_SSR_RENDER === "function") {
      try {
        const kind = parseRadarPath(pathname)?.kind || "long-short";
        const radar = metadata.radarPayload || await readRadarPayload(env, kind);
        const appHtml = await env.NEWS_SSR_RENDER(hydrationRenderUrl(url, pathname, publicRoute.locale), { radar });
        if (typeof appHtml === "string" && (appHtml.includes("class=\"nxr ") || hasMainWithHeading(appHtml))) {
          metadata.radarSsrMode = radar.status === "unavailable" ? "runtime-unavailable" : "runtime";
          return injectPrerenderedBody(html, appHtml, `${pathname}|${publicRoute.locale}`, { radar }, url);
        }
        console.error(`[NexuAlpha] radar SSR returned no page body for ${pathname} (${publicRoute.locale}); serving the app shell`);
      } catch (error) { console.error(`[NexuAlpha] radar SSR failed for ${pathname} (${publicRoute.locale}): ${error?.message || error}`); }
    }
    // Crypto glossary (hub + terms): static copy rendered at request time with the component the browser hydrates.
    if (metadata.marker === GLOSSARY_ROUTE_MARKER && typeof env?.NEWS_SSR_RENDER === "function") {
      try {
        const appHtml = await env.NEWS_SSR_RENDER(hydrationRenderUrl(url, pathname, publicRoute.locale), {});
        if (typeof appHtml === "string" && appHtml.includes("class=\"nxg ")) {
          metadata.glossarySsrMode = "runtime";
          return injectPrerenderedBody(html, appHtml, `${pathname}|${publicRoute.locale}`, {}, url);
        }
        console.error(`[NexuAlpha] glossary SSR returned no page body for ${pathname} (${publicRoute.locale}); serving the app shell`);
      } catch (error) { console.error(`[NexuAlpha] glossary SSR failed for ${pathname} (${publicRoute.locale}): ${error?.message || error}`); }
    }
    // Flash stream and item pages: the payload resolved for the head (metadata.flashPayload) is rendered with the
    // component the browser hydrates and shipped as prerender state "flash".
    if (metadata.marker === FLASH_ROUTE_MARKER && metadata.flashPayload && typeof env?.NEWS_SSR_RENDER === "function") {
      try {
        const flash = metadata.flashPayload;
        const ticker = await readTickerSnapshot(env);
        const renderUrl = new URL(hydrationRenderUrl(url, pathname, publicRoute.locale));
        const appHtml = await env.NEWS_SSR_RENDER(renderUrl.href, { flash, ...(ticker ? { ticker } : {}) });
        if (typeof appHtml === "string" && appHtml.includes("class=\"nxf ")) {
          metadata.flashSsrMode = "runtime";
          return injectPrerenderedBody(html, appHtml, `${pathname}|${publicRoute.locale}`, { flash, ...(ticker ? { ticker } : {}) }, url);
        }
        console.error(`[NexuAlpha] flash SSR returned no page body for ${pathname} (${publicRoute.locale}); serving the app shell`);
      } catch (error) { console.error(`[NexuAlpha] flash SSR failed for ${pathname} (${publicRoute.locale}): ${error?.message || error}`); }
    }
    // Campaign landing pages (/activities/binance-october-gifts, /activities/bybit-stocks): every section in the HTML,
    // rendered with the hydrated component.
    if (metadata.marker === CAMPAIGN_LANDING_ROUTE_MARKER && typeof env?.NEWS_SSR_RENDER === "function") {
      try {
        // activityRenderUrl keeps ?market= (a compliance gate: no sign-up in restricted markets).
        const appHtml = await env.NEWS_SSR_RENDER(activityRenderUrl(url, pathname, publicRoute.locale), {});
        if (typeof appHtml === "string" && (appHtml.includes("class=\"nxbg ") || appHtml.includes("class=\"nxbs ") || appHtml.includes("class=\"nxba ") || appHtml.includes("class=\"nxku "))) {
          metadata.campaignSsrMode = "runtime";
          return injectPrerenderedBody(html, appHtml, `${pathname}|${publicRoute.locale}`, {}, url);
        }
        console.error(`[NexuAlpha] campaign SSR returned no page body for ${pathname} (${publicRoute.locale}); serving the app shell`);
      } catch (error) { console.error(`[NexuAlpha] campaign SSR failed for ${pathname} (${publicRoute.locale}): ${error?.message || error}`); }
    }
    // Brand pages (/about, /editorial-policy) are static copy: render them at request time with the same renderer so
    // crawlers and no-JS readers get the full entity page instead of an empty #root.
    if ((isBrandPagePath(pathname) || isLegalPagePath(pathname)) && typeof env?.NEWS_SSR_RENDER === "function") {
      try {
        const appHtml = await env.NEWS_SSR_RENDER(url.href, {});
        if (typeof appHtml === "string" && appHtml.includes("class=\"nxb-hero")) {
          metadata.brandSsrMode = "runtime";
          return injectPrerenderedBody(html, appHtml, `${pathname}|${publicRoute.locale}`, {}, url);
        }
      } catch { /* fall through to the client-rendered shell */ }
    }
    // Every other 200 route the manifest does not carry (locale fallback editions of /topics, /factbook, the
    // tokenized-asset topics and /markets/turkiye; /ref/<slug> entries) is rendered at request time with the component
    // the client hydrates. News routes keep their own fallback template above; families prerendered in all 15 locales
    // (home, /exchanges, venue pages, curated compare pairs, /activities) keep their build-time path and the shell on a
    // manifest miss (junk-query URLs), as tests/compare-any.test.mjs pins.
    if (!REQUEST_TIME_FALLBACK_EXCLUDED_MARKERS.has(metadata.marker)) {
      const rendered = await renderRouteAtRequestTime(html, metadata, url, env, { accept: hasMainWithHeading, label: "route fallback" });
      if (rendered) return rendered;
    }
    metadata.newsSsrMode = "fallback";
    return injectFallbackBody(html, metadata, url);
  };
  if (typeof env?.NEWS_SSR_RENDER === "function") {
    const contentPath = parsePublicRoute(url.pathname, url.searchParams).contentPathname;
    if (contentPath === "/funding-rates/matrix") return fallback();
    // Listing pages never come from the build-time manifest: the feed is published after the build.
    const listing = metadata.marker === NEWS_ROUTE_MARKER ? parseNewsListingPath(contentPath) : null;
    if (listing && !listing.invalid && !listing.redirect) return fallback();
    // App pages always carry their own market-aware hydration payload, including when a country changes policy.
    if (metadata.marker === APP_DOWNLOAD_ROUTE_MARKER) return fallback();
    // /activities: campaigns come from the live announcement feed, so the body is rendered per request when the feed is
    // readable; without a feed the prerendered page (fixed-height campaign placeholder) is served as before.
    if (contentPath === "/activities" && metadata.marker === ACTIVITIES_ROUTE_MARKER) {
      const rendered = await renderActivitiesAtRequestTime(html, metadata, url, env);
      if (rendered) return rendered;
    }
    if (metadata.marker === ACTIVITY_UPDATE_ROUTE_MARKER) {
      const rendered = await renderActivityUpdateAtRequestTime(html, metadata, url, env);
      if (rendered) return rendered;
    }
  }
  // The manifest ignores decision query parameters. A country can change promotion policy,
  // so a locale-only snapshot must never expose a code excluded by the requested market.
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  const market = url.searchParams.get("market");
  const promotionPage = /^\/(?:exchanges|compare|topics|factbook|ref)(?:\/|$)/.test(publicRoute.contentPathname) || publicRoute.contentPathname === "/rates";
  const policyChanges = market && promotionPage && [...new Set([...Object.keys(PARTNER_RESTRICTED_COUNTRIES), ...Object.keys(PARTNER_RESTRICTED_SCOPES)])].some(slug =>
    !isPartnerPromotableIn(slug, { locale: publicRoute.locale, market }) && isPartnerPromotableIn(slug, { locale: publicRoute.locale }));
  if (policyChanges) {
    const rendered = await renderRouteAtRequestTime(html, metadata, url, env, { accept: hasMainWithHeading, label: "country promotion policy", preserveContext: true });
    // Fail closed if the host cannot render country context; do not fall back to an ungated snapshot.
    return rendered || html;
  }
  const routeKey = prerenderRouteKey(url);
  if (!routeKey) return fallback();
  const manifest = await loadPrerenderManifest(env, url);
  const route = manifest?.routes?.[routeKey];
  if (!route) return fallback();
  // Content-only publication must never mix a new article head with stale body.
  // Prefix-localized news routes obey the same freshness gate as English.
  const contentPathname = parsePublicRoute(url.pathname, url.searchParams).contentPathname;
  if (contentPathname === "/news" || contentPathname.startsWith("/news/")) {
    if (!metadata.newsFeedFingerprint || route.newsFeedFingerprint !== metadata.newsFeedFingerprint) return fallback();
  }
  let routePayload = route;
  let appHtml = route.html;
  // Home hero copy experiment (X5): a visitor assigned to "b" gets the build-time variant B prerender of the same edition.
  // If that asset is unavailable the page falls back to A and says so (heroServed), never to a client-side swap.
  const heroAssignment = metadata.heroAssignment;
  let heroServed = heroAssignment?.active ? "a" : null;
  if (heroAssignment?.variant === "b" && isPrerenderAssetPath(route.heroVariants?.b)) {
    const payloadB = await loadPrerenderAssetPayload({ asset: route.heroVariants.b }, url, env);
    if (payloadB && typeof payloadB.html === "string" && payloadB.html) {
      routePayload = { ...route, ...payloadB };
      appHtml = payloadB.html;
      heroServed = "b";
    }
  }
  if (heroServed !== "b" && isPrerenderAssetPath(route.asset)) {
    const payload = await loadPrerenderAssetPayload(route, url, env);
    if (!payload && !appHtml) return fallback();
    if (payload) {
      routePayload = { ...route, ...payload };
      if (typeof payload.html === "string") appHtml = payload.html;
    }
  }
  if (heroServed) {
    metadata.heroServed = heroServed;
    routePayload = { ...routePayload, heroVariant: heroServed };
  }
  // Live ticker bar (2026-10-13): the home page is prerendered with an empty bar; write the cached snapshot into it and
  // ship the same snapshot as state "ticker" so the browser hydrates the identical frame.
  if (contentPathname === "/" && typeof appHtml === "string" && appHtml.includes("nx-ticker")) {
    const ticker = await readTickerSnapshot(env);
    if (ticker) { appHtml = spliceTickerHtml(appHtml, ticker); routePayload = { ...routePayload, ticker }; }
  }
  return injectPrerenderedBody(html, appHtml, routeKey, routePayload, url);
}

function sanitizeRawNewsFeedArticle(article) {
  if (!article || typeof article !== "object") return article;
  const { routeProjection: _discardRawRouteProjection, ...rest } = article;
  // Content sweep guard (scorecard C4): a feed that has not been repaired yet never shows a truncated summary,
  // Markdown markers in plain text or a link to a local filesystem path (scripts/repair-news-feed-content.mjs).
  // T10 (2026-10-12): thin template pages and weaker duplicates get their search state here, the one choke point every
  // news route, sitemap and API response reads the live feed through (src/data/news-search-state.js).
  return applyNewsSearchState(repairNewsArticle(rest).article);
}

// The production feed is a mounted, auto-updated file (~23 MB). Parsing, sanitizing and hashing it on every news request
// cost 1-5 s of TTFB. The parsed feed is reused while the published news-feed.sha256.txt still names it (a 65-byte read);
// without a sha file it is reused only while the feed text is byte-identical. A changed feed is served on the next request.
let newsFeedCache = null;

// Google News sitemap built from the mounted live feed on request (2026-10-10). The build-time file was always empty:
// the content publisher writes the feed after the site build, so only the server sees the current articles. Lists
// search-published articles (feed seo.noindex === false) from the last two days, one entry per published locale.
const LIVE_NEWS_SITEMAP_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;
const xmlText = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
export function renderLiveNewsSitemap(articles, now = Date.now()) {
  const href = (slug, locale) => localizedCanonical(`/news/${slug}`, locale);
  const rows = [];
  for (const article of (Array.isArray(articles) ? articles : [])) {
    if (!isReviewedNewsSearchArticle(article)) continue;
    const published = Date.parse(article.publishedAt);
    if (!Number.isFinite(published) || published > now || now - published > LIVE_NEWS_SITEMAP_WINDOW_MS) continue;
    // One entry per published edition (any UI locale with a native body), each listing every edition as an alternate.
    const locales = articleSeoLocales(article);
    for (const locale of locales) {
      const title = (typeof article.title === "object" ? article.title?.[locale] || article.title?.en : article.title) || article.slug;
      rows.push([
        "  <url>",
        `    <loc>${xmlText(href(article.slug, locale))}</loc>`,
        ...sitemapAlternateLines(routeAlternates(`/news/${article.slug}`, locales)),
        "    <news:news>",
        "      <news:publication>",
        "        <news:name>NexuAlpha</news:name>",
        `        <news:language>${newsSitemapLanguage(locale)}</news:language>`,
        "      </news:publication>",
        `      <news:publication_date>${new Date(published).toISOString()}</news:publication_date>`,
        `      <news:title>${xmlText(title)}</news:title>`,
        "    </news:news>",
        "  </url>",
      ].join("\n"));
    }
  }
  return ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...rows.slice(0, 1000), "</urlset>", ""].join("\n");
}
// One article (plus compact summaries of the articles it links to) for client-side article pages (2026-10-10, audit
// finding 8): the detail page used to download the whole ~23 MB feed (4.4 MB gzipped) for every non-prerendered visit.
async function handleNewsArticleJson(env, url) {
  const slug = url.pathname.slice("/api/news/article/".length);
  const headers = { "content-type": "application/json; charset=utf-8", "x-content-type-options": "nosniff" };
  if (!/^[a-z0-9][a-z0-9-]{0,159}$/.test(slug)) return new Response(JSON.stringify({ articles: [] }), { status: 404, headers: { ...headers, "cache-control": "no-store" } });
  const feed = await loadNewsFeed(env, url);
  const article = feed.articles.find((item) => item?.slug === slug);
  if (!article) return new Response(JSON.stringify({ articles: [] }), { status: 404, headers: { ...headers, "cache-control": "public, max-age=60" } });
  const linked = new Set([...JSON.stringify(article).matchAll(/\/news\/([a-z0-9][a-z0-9-]{0,159})/g)].map((m) => m[1]).filter((s) => s !== slug));
  const related = newsRelatedSummaries(article, feed.articles);
  const relatedSlugs = new Set(related.map((item) => item.slug));
  const linkedSummaries = feed.articles.filter((item) => linked.has(item?.slug) && !relatedSlugs.has(item.slug)).map(summarizeNewsArticle).filter(Boolean);
  // ?locale=<ui locale> (localized news lane): ship only the English edition plus the requested one (and zh-Hans for
  // Chinese readers) instead of every native body, and tell the client which edition it will read. The full set of
  // editions is carried in routeProjection.availableLocales so hreflang stays complete client-side.
  const requestedLocale = url.searchParams.get("locale");
  if (requestedLocale && UI_LOCALES.has(requestedLocale)) {
    const contentLocale = newsContentLocale(requestedLocale, article);
    const projected = {
      ...article,
      title: compactLocalizedObject(article.title, requestedLocale),
      summary: compactLocalizedObject(article.summary, requestedLocale),
      categoryName: compactLocalizedObject(article.categoryName, requestedLocale),
      content: compactLocalizedObject(article.content, contentLocale),
      availableLocales: articlePublishedLocales(article),
      routeProjection: { source: NEWS_ARTICLE_ROUTE_PROJECTION_SOURCE, locale: requestedLocale, availableLocales: articleSeoLocales(article) },
    };
    return new Response(JSON.stringify({ version: 1, locale: requestedLocale, contentLocale, articles: [projected, ...related, ...linkedSummaries], relatedSlugs: [...relatedSlugs] }), { headers: { ...headers, "cache-control": "public, max-age=300", vary: "Accept-Encoding" } });
  }
  return new Response(JSON.stringify({ version: 1, articles: [article, ...related, ...linkedSummaries], relatedSlugs: [...relatedSlugs] }), { headers: { ...headers, "cache-control": "public, max-age=300" } });
}

// Full-library search and listing (2026-10-10). Searches titles and summaries of every published article in the
// cached feed and returns compact rows only; without q it returns one newest-first page of the (category) archive.
//   GET /api/news/search?q=&locale=&category=&page=&limit=
// Tool page -> related articles (links-l10n lane 2026-10-11, scorecard D4): the newest articles on a tool's subject,
// from the live feed, for the request-time renders of /liquidations, /funding-rates, /compare(/pair) and /activities
// and for client-side route changes (GET /api/news/tool-articles). Build-time prerendered tool routes (/rates, curated
// pairs) carry the same payload from scripts/generate-prerender-manifest.mjs. Cached per feed fingerprint.
const toolArticlesCache = new Map();
function cachedToolArticleLinks(feed, toolKey, locale) {
  const key = `${feed.fingerprint}|${toolKey}|${locale}`;
  if (!toolArticlesCache.has(key)) {
    if (toolArticlesCache.size > 2000) toolArticlesCache.clear();
    toolArticlesCache.set(key, toolArticleLinks(toolKey, feed.articles, locale, { rank: newsStrengthRank }));
  }
  return toolArticlesCache.get(key);
}
async function toolArticlesForRequest(env, url, pathname, locale) {
  const toolKey = toolKeyForPath(pathname);
  if (!toolKey || !env?.ASSETS) return undefined;
  try {
    const feed = await loadNewsFeed(env, url);
    if (!feed?.fingerprint || !feed.articles.length) return undefined;
    return cachedToolArticleLinks(feed, toolKey, UI_LOCALES.has(locale) ? locale : "en") || undefined;
  } catch { return undefined; }
}
async function handleToolArticlesJson(env, url) {
  const headers = { "content-type": "application/json; charset=utf-8", "x-content-type-options": "nosniff" };
  const tool = String(url.searchParams.get("tool") || "");
  const toolKey = isRelatedArticlesToolKey(tool) ? tool : null;
  const requestedLocale = url.searchParams.get("locale") || "en";
  const locale = UI_LOCALES.has(requestedLocale) ? requestedLocale : "en";
  if (!toolKey) return new Response(JSON.stringify({ version: 1, status: "invalid", items: [] }), { status: 400, headers: { ...headers, "cache-control": "no-store" } });
  const feed = await loadNewsFeed(env, url);
  if (!feed.fingerprint) return new Response(JSON.stringify({ version: 1, status: "unavailable", items: [] }), { status: 503, headers: { ...headers, "cache-control": "no-store" } });
  const payload = cachedToolArticleLinks(feed, toolKey, locale) || { tool: toolKey, locale, items: [] };
  return new Response(JSON.stringify({ version: 1, status: "ok", ...payload }), { status: 200, headers: { ...headers, "cache-control": "public, max-age=300" } });
}

async function handleNewsSearchJson(env, url) {
  const headers = { "content-type": "application/json; charset=utf-8", "x-content-type-options": "nosniff" };
  const params = url.searchParams;
  const query = String(params.get("q") || "").slice(0, 120).trim();
  const rawCategory = params.get("category") || "";
  const category = rawCategory && rawCategory !== "all" ? rawCategory : null;
  if (category && !isNewsCategory(category)) {
    return new Response(JSON.stringify({ version: 1, status: "invalid", reasonCode: "NEWS_CATEGORY_UNKNOWN", articles: [] }), { status: 400, headers: { ...headers, "cache-control": "no-store" } });
  }
  const requestedLocale = params.get("locale") || "en";
  const locale = UI_LOCALES.has(requestedLocale) ? requestedLocale : "en";
  const limit = Math.min(NEWS_SEARCH_MAX_LIMIT, Math.max(1, Number.parseInt(params.get("limit") || "", 10) || NEWS_PAGE_SIZE));
  const page = Math.min(1000, Math.max(1, Number.parseInt(params.get("page") || "", 10) || 1));
  const feed = await loadNewsFeed(env, url);
  if (!feed.fingerprint) {
    return new Response(JSON.stringify({ version: 1, status: "unavailable", reasonCode: "NEWS_FEED_UNAVAILABLE", articles: [] }), { status: 503, headers: { ...headers, "cache-control": "no-store" } });
  }
  // Archive pages (no query) on a localized listing put the articles written natively in that locale first.
  const matches = query ? searchNewsArticles(feed.articles, { query, category }) : sortNewsForLocale(searchNewsArticles(feed.articles, { query, category }), locale);
  const totalPages = Math.max(1, Math.ceil(matches.length / limit));
  const rows = matches.slice((page - 1) * limit, page * limit).map((article) => {
    const summary = summarizeNewsArticle(article);
    return summary && {
      ...summary,
      title: compactLocalizedObject(article.title, locale),
      summary: compactLocalizedObject(article.summary, locale),
      categoryName: compactLocalizedObject(article.categoryName, locale),
    };
  }).filter(Boolean);
  return new Response(JSON.stringify({
    version: 1,
    query,
    category: category || "all",
    locale,
    page,
    pageSize: limit,
    total: matches.length,
    totalPages,
    libraryTotal: feed.articles.length,
    counts: newsCategoryCounts(feed.articles),
    articles: rows,
  }), { headers: { ...headers, "cache-control": "public, max-age=120", vary: "Accept-Encoding" } });
}

// Sitemap for the news library collections (/news pages and category archives) in the two indexable news locales.
// Article URLs stay in the publisher-written /sitemap.xml and the live /news-sitemap.xml.
// Every indexable, self-canonical page in all 15 locales (2026-10-10). The main /sitemap.xml is written by the content
// publisher and only carried en, zh-Hans and a few ja/ko/tr pages, so the translated exchange, rates, compare and
// activity pages were missing from every sitemap. Built from routeMetadata so it can never list a noindex or
// non-canonical URL; cached for an hour.
const LOCALE_SITEMAP_STATIC = ["/", "/exchanges", "/compare", "/activities", "/rates", "/onchain", "/methodology", "/telegram", "/partners", "/topics", "/factbook", ...DATA_PAGE_PATHS, ...RADAR_PATHS, "/funding-rates/matrix", ...BRAND_PAGE_PATHS, ...LEGAL_PAGE_PATHS];
let localeSitemapCache = null;
export async function renderLocaleSitemap(env = {}) {
  // Generated pairs: only the indexable ones (both venues with reviewed fee rows and at least one partner); their
  // locale set is enforced by routeMetadata via searchPublicationLocales, so noindex locales never slip in.
  const paths = [...LOCALE_SITEMAP_STATIC, ...[...ACTIVE_VENUE_SLUGS].map((slug) => `/exchanges/${slug}`), ...[...CURATED_COMPARISONS].map((pair) => `/compare/${pair}`), ...indexableGeneratedComparePairs().map((pair) => `/compare/${pair}`)];
  const rows = [];
  for (const pathname of paths) {
    for (const locale of INDEXABLE_LOCALES) {
      const loc = `${PUBLIC_ORIGIN}${localizedPath(pathname, locale)}`.replace(/\/$/, "") || PUBLIC_ORIGIN;
      let meta;
      try { meta = await routeMetadata(new URL(loc), env); } catch { continue; }
      if (meta?.status !== 200 || meta.robots !== "index,follow" || meta.canonical !== loc) continue;
      rows.push([
        "  <url>",
        `    <loc>${xmlText(loc)}</loc>`,
        ...(meta.alternates || []).map((alt) => `    <xhtml:link rel="alternate" hreflang="${xmlText(alt.hreflang)}" href="${xmlText(alt.href)}" />`),
        "  </url>",
      ].join("\n"));
    }
  }
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">', ...rows, "</urlset>", ""].join("\n");
}
// Official update pages (2026-10-12): the live feed plus archived items published within ARCHIVE_INDEXABLE_MS, only the
// categories the page itself marks index,follow. One <loc> per indexable locale; the page head carries the hreflang set.
export const UPDATE_SITEMAP_PATH = "/sitemap-updates.xml";
export async function renderUpdateSitemap(env = {}, url = new URL(PUBLIC_ORIGIN), now = Date.now()) {
  const live = compactActivityUpdateItems(await readActivityUpdateFeed(env, url))?.items || [];
  const archived = archiveItems(await readActivityUpdateArchive(env, url), { now }).map(normalizeUpdateItem);
  const byPath = new Map();
  for (const item of live) byPath.set(updatePath(item), item);
  // Same rule as the archived page's robots tag: index,follow for ARCHIVE_INDEXABLE_MS after publication.
  for (const item of archived) if (!byPath.has(updatePath(item)) && isArchiveIndexable(item, now)) byPath.set(updatePath(item), item);
  const rows = [];
  for (const [pathname, item] of byPath) {
    if (!["listing", "event"].includes(item.category) || isUpdateNoindex(item)) continue;
    const lastmod = new Date(Date.parse(item.publishedAt)).toISOString().slice(0, 10);
    for (const locale of INDEXABLE_LOCALES) {
      rows.push(`  <url>\n    <loc>${xmlText(localizedCanonical(pathname, locale))}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`);
    }
  }
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...rows, "</urlset>", ""].join("\n");
}
// ---------------------------------------------------------------------------------------------------------- Ticker
// Live ticker bar snapshot (2026-10-13): the Node server's 15 s Binance cache (TICKER_READ, server/ticker-feed.mjs),
// else the market collector feed it already reads for /liquidations. Never blocks a page for long: the reader waits at
// most ~2.5 s on a cold start and answers from cache afterwards. Null = the bar keeps its empty frame.
async function readTickerSnapshot(env) {
  try {
    if (typeof env?.TICKER_READ === "function") { const snapshot = await env.TICKER_READ(); if (isTickerSnapshot(snapshot)) return snapshot; }
    if (typeof env?.MARKET_EVENTS_READ === "function") { const snapshot = tickerFromMarketEvents(await env.MARKET_EVENTS_READ()); if (isTickerSnapshot(snapshot)) return snapshot; }
  } catch (error) { console.error(`[NexuAlpha] ticker snapshot failed: ${error?.message || error}`); }
  return null;
}

// ---------------------------------------------------------------------------------------------------------- Flash
// The flash items are rebuilt at most once per 60 s per host from the feeds the server already holds (announcement
// feed + archive, campaign briefs, the market collector's feed, the published news feed): no external call per request.
// Market items only exist in the snapshot they were seen in, so the first sighting is kept in memory and, when the
// server passes FLASH_MEMORY (server/flash-memory.mjs), on disk across restarts.
const FLASH_TTL_MS = 60 * 1000;
const flashCaches = new WeakMap();
const flashCacheKey = (env) => (env?.ASSETS && typeof env.ASSETS === "object" ? env.ASSETS : flashCaches);
const flashNow = (env) => (Number.isFinite(Number(env?.FLASH_NOW)) ? Number(env.FLASH_NOW) : Date.now());

async function readJsonAsset(env, url, path) {
  if (!env?.ASSETS) return null;
  try {
    const response = await env.ASSETS.fetch(new Request(new URL(path, url), { headers: { accept: "application/json" } }));
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

async function readFlashSources(env, url) {
  const announcements = await (async () => {
    if (typeof env?.INTEL_READ === "function") { try { const feed = await env.INTEL_READ(); if (feed) return feed; } catch { /* asset seed below */ } }
    return readJsonAsset(env, url, "/intel/official-announcements.json");
  })();
  const market = await (async () => {
    if (typeof env?.MARKET_EVENTS_READ === "function") { try { return await env.MARKET_EVENTS_READ(); } catch { return null; } }
    return readJsonAsset(env, url, "/intel/market-events.json");
  })();
  const [archive, briefs, newsFeed] = await Promise.all([readActivityUpdateArchive(env, url), readCampaignBriefs(env, url), loadNewsFeed(env, url)]);
  return { announcements, archive, briefs, market, news: newsFeed?.articles || [] };
}

async function readFlashItems(env, url) {
  const key = flashCacheKey(env);
  let cache = flashCaches.get(key);
  if (!cache) { cache = { at: 0, items: null, pending: null, memory: null }; flashCaches.set(key, cache); }
  const now = flashNow(env);
  if (cache.items && Date.now() - cache.at < FLASH_TTL_MS) return cache.items;
  if (cache.pending) return cache.pending;
  cache.pending = (async () => {
    if (!cache.memory) {
      cache.memory = [];
      try { if (typeof env?.FLASH_MEMORY?.load === "function") cache.memory = (await env.FLASH_MEMORY.load()) || []; } catch { cache.memory = []; }
    }
    const sources = await readFlashSources(env, url);
    const { items, marketItems } = buildFlashItems({ ...sources, remembered: cache.memory, now });
    const changed = marketItems.length !== cache.memory.length || marketItems[0]?.id !== cache.memory[0]?.id;
    cache.memory = marketItems;
    if (changed && typeof env?.FLASH_MEMORY?.save === "function") Promise.resolve(env.FLASH_MEMORY.save(marketItems)).catch(() => {});
    cache.items = items;
    cache.at = Date.now();
    return items;
  })().finally(() => { cache.pending = null; });
  return cache.pending;
}

async function handleFlashFeedJson(request, env, url) {
  const headers = { "content-type": "application/json; charset=utf-8", "x-content-type-options": "nosniff", "x-robots-tag": "noindex" };
  const locale = UI_LOCALES.has(url.searchParams.get("locale")) ? url.searchParams.get("locale") : "en";
  let items = [];
  try { items = await readFlashItems(env, url); } catch (error) { console.error(`[NexuAlpha] flash feed failed: ${error?.message || error}`); }
  const now = flashNow(env);
  const key = url.searchParams.get("key");
  let payload;
  if (key) {
    const item = /^[0-9a-z]{10}$/.test(key) ? findFlashItem(items, key) : null;
    if (!item) return new Response(JSON.stringify({ item: null }), { status: 404, headers: { ...headers, "cache-control": "public, max-age=30" } });
    payload = flashItemPayload(items, item, locale, { now });
  } else {
    payload = flashStreamPayload(items, locale, { limit: url.searchParams.get("limit") || FLASH_PAGE_SIZE, before: url.searchParams.get("before"),
      type: url.searchParams.get("type"), venue: url.searchParams.get("venue"), important: url.searchParams.get("important") === "1", now });
  }
  return new Response(request.method === "HEAD" ? null : JSON.stringify(payload), { status: 200, headers: { ...headers, "cache-control": "public, max-age=30, stale-while-revalidate=60" } });
}

const flashSitemapCaches = new WeakMap();
async function handleFlashSitemap(request, env, url) {
  const key = flashCacheKey(env);
  let cached = flashSitemapCaches.get(key);
  if (!cached || Date.now() - cached.at > 600e3) {
    const items = await readFlashItems(env, url).catch(() => []);
    cached = { at: Date.now(), xml: renderFlashSitemap(items, { now: flashNow(env), urlFor: (path, locale) => localizedCanonical(path, locale), alternates: (path, locales) => routeAlternates(path, locales) }) };
    flashSitemapCaches.set(key, cached);
  }
  return new Response(request.method === "HEAD" ? null : cached.xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=600" } });
}

let updateSitemapCache = null;
async function handleUpdateSitemap(request, env, url) {
  if (!updateSitemapCache || Date.now() - updateSitemapCache.at > 600e3) updateSitemapCache = { at: Date.now(), xml: await renderUpdateSitemap(env, url) };
  return new Response(request.method === "HEAD" ? null : updateSitemapCache.xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=600" } });
}

async function handleLocaleSitemap(env) {
  if (!localeSitemapCache || Date.now() - localeSitemapCache.at > 3600e3) localeSitemapCache = { at: Date.now(), xml: await renderLocaleSitemap(env) };
  return new Response(localeSitemapCache.xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}

export function renderNewsLibrarySitemap(articles) {
  const rows = [];
  const lastmodFor = (items) => {
    const newest = items.reduce((max, item) => Math.max(max, Date.parse(item?.updatedAt || item?.publishedAt) || 0), 0);
    return newest ? new Date(newest).toISOString() : null;
  };
  // Listing pages are indexable (and listed) in English plus every locale with at least NEWS_LISTING_MIN_NATIVE_ARTICLES
  // search-published native articles (audit 2026-10-11 #4, scorecard M3); thinner locale listings render as noindex.
  const listingLocales = newsListingIndexableLocales(articles);
  const alternates = (path) => sitemapAlternateLines(routeAlternates(path, listingLocales));
  for (const category of [null, ...NEWS_CATEGORY_KEYS]) {
    const { totalPages, total } = paginateNews(articles, { category });
    if (!total) continue;
    for (let page = 1; page <= totalPages; page += 1) {
      const path = newsListingPath({ category, page });
      const lastmod = lastmodFor(paginateNews(articles, { category, page }).rows);
      for (const locale of listingLocales) {
        rows.push([
          "  <url>",
          `    <loc>${xmlText(localizedCanonical(path, locale))}</loc>`,
          ...alternates(path),
          ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
          "  </url>",
        ].join("\n"));
      }
    }
  }
  return ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...rows, "</urlset>", ""].join("\n");
}

async function handleNewsLibrarySitemap(env, url) {
  const feed = await loadNewsFeed(env, url);
  return new Response(renderNewsLibrarySitemap(feed.articles), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=600" } });
}

function articleSitemapLocaleFromPath(pathname) {
  const match = String(pathname || "").match(/^\/sitemap-articles-([a-z0-9-]+)\.xml$/);
  if (!match) return null;
  if (match[1] === "zh-hans") return "zh-Hans";
  if (match[1] === "zh-hant") return "zh-Hant";
  if (match[1] === "pt-br") return "pt-BR";
  if (match[1] === "id-id") return "id";
  return match[1];
}

export function renderArticleSitemap(articles, locale = "en") {
  const publishedSlugs = selectReviewedNewsSearchSlugs(articles);
  const rows = [];
  for (const article of Array.isArray(articles) ? articles : []) {
    if (!publishedSlugs.has(article?.slug) || article?.seo?.noindex !== false) continue;
    const locales = newsArticleSeoLocales(article);
    if (!locales.includes(locale)) continue;
    const pathname = `/news/${article.slug}`;
    const lastmod = article.updatedAt || article.publishedAt;
    rows.push([
      "  <url>",
      `    <loc>${xmlText(localizedCanonical(pathname, locale))}</loc>`,
      ...sitemapAlternateLines(hreflangAlternates(locales, (entryLocale) => localizedCanonical(pathname, entryLocale))),
      ...(lastmod && Number.isFinite(Date.parse(lastmod)) ? [`    <lastmod>${new Date(Date.parse(lastmod)).toISOString().slice(0, 10)}</lastmod>`] : []),
      "  </url>",
    ].join("\n"));
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...rows,
    "</urlset>",
    "",
  ].join("\n");
}

// Sitemap index (2026-10-13). nginx used to serve the content publisher's own /sitemap.xml, a stale copy that missed
// every child sitemap added after 10-12; it now proxies here. The index is the release's build-time file (every child
// the release serves); only the lastmod of the feed-driven children (sitemap-articles-*, news-sitemap) is refreshed
// from the mounted live feed, since the build checkout's bundled feed is days older than the published one, and empty
// article locales are dropped.
export function refreshSitemapIndexLastmods(indexXml, articles, now = Date.now()) {
  const day = (ms) => new Date(ms).toISOString().slice(0, 10);
  const newest = new Map();
  const bump = (file, ms) => { if (Number.isFinite(ms) && ms <= now && ms > (newest.get(file) || 0)) newest.set(file, ms); };
  const publishedSlugs = selectReviewedNewsSearchSlugs(articles);
  for (const article of Array.isArray(articles) ? articles : []) {
    if (!publishedSlugs.has(article?.slug) || article?.seo?.noindex !== false) continue;
    const modified = Date.parse(article.updatedAt || article.publishedAt);
    for (const locale of newsArticleSeoLocales(article)) bump(`sitemap-articles-${String(locale).toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xml`, modified);
  }
  for (const article of Array.isArray(articles) ? articles : []) {
    const published = Date.parse(article?.publishedAt);
    if (isReviewedNewsSearchArticle(article) && now - published <= LIVE_NEWS_SITEMAP_WINDOW_MS) bump("news-sitemap.xml", published);
  }
  const feedLoaded = newest.size > 0;
  return String(indexXml).replace(/\n?[ \t]*<sitemap>([\s\S]*?)<\/sitemap>/g, (block, inner) => {
    const file = inner.match(/<loc>https:\/\/nexualpha\.com\/([^<]+)<\/loc>/)?.[1];
    // A locale with no search-published article renders an empty urlset; leave it out of the index until it has one.
    if (feedLoaded && /^sitemap-articles-[a-z0-9-]+\.xml$/.test(file || "") && !newest.has(file)) return "";
    if (!file || !newest.has(file)) return block;
    const lastmod = `<lastmod>${day(newest.get(file))}</lastmod>`;
    return /<lastmod>[^<]*<\/lastmod>/.test(inner)
      ? block.replace(/<lastmod>[^<]*<\/lastmod>/, lastmod)
      : block.replace(/(<loc>[^<]*<\/loc>)/, `$1\n    ${lastmod}`);
  });
}

async function handleSitemapIndex(request, env, url) {
  const response = await env.ASSETS.fetch(new Request(new URL("/sitemap.xml", url), { headers: { accept: "application/xml" } }));
  if (!response.ok) return response;
  let xml = await response.text();
  try { xml = refreshSitemapIndexLastmods(xml, (await loadNewsFeed(env, url)).articles); } catch { /* serve the build-time index */ }
  return new Response(request.method === "HEAD" ? null : xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=600", "x-content-type-options": "nosniff" } });
}

async function handleArticleSitemap(env, url) {
  const feed = await loadNewsFeed(env, url);
  const locale = articleSitemapLocaleFromPath(url.pathname) || "en";
  return new Response(renderArticleSitemap(feed.articles, locale), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=600" } });
}

async function handleLiveNewsSitemap(env, url) {
  const feed = await loadNewsFeed(env, url);
  return new Response(renderLiveNewsSitemap(feed.articles), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=600" } });
}

async function readNewsFeedSha(env, requestUrl) {
  try {
    const response = await env.ASSETS.fetch(new Request(new URL("/content/news-feed.sha256.txt", requestUrl), { headers: { accept: "text/plain" } }));
    const sha = response.ok ? (await response.text()).trim() : "";
    return /^[a-f0-9]{64}$/i.test(sha) ? sha.toLowerCase() : null;
  } catch { return null; }
}

async function loadNewsFeed(env, requestUrl) {
  try {
    const sha = await readNewsFeedSha(env, requestUrl);
    if (sha && newsFeedCache?.sha === sha) return newsFeedCache.value;
    const response = await env.ASSETS.fetch(new Request(new URL("/content/news-feed.json", requestUrl), { headers: { accept: "application/json" } }));
    if (!response.ok) return { articles: [], fingerprint: null };
    const text = await response.text();
    if (!sha && newsFeedCache?.text === text) return newsFeedCache.value;
    const parsed = JSON.parse(text);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    const fingerprint = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    const value = { articles: Array.isArray(parsed?.articles) ? parsed.articles.map(sanitizeRawNewsFeedArticle).filter((article) => article?.status === "PUBLISHED") : [], fingerprint };
    // Key by sha only when it names exactly this text (the feed and its sha are written separately).
    newsFeedCache = sha === fingerprint ? { sha, value } : sha ? null : { text, value };
    return value;
  } catch { return { articles: [], fingerprint: null }; }
}

async function loadPrerenderedNewsSnapshot(env, requestUrl) {
  const manifest = await loadPrerenderManifest(env, requestUrl);
  const route = manifest?.routes?.[prerenderRouteKey(requestUrl)];
  const fingerprint = route?.newsFeedFingerprint;
  if (!/^[a-f0-9]{64}$/i.test(fingerprint || "")) return null;
  try {
    const response = await env.ASSETS.fetch(new Request(new URL("/content/news-feed.sha256.txt", requestUrl), { headers: { accept: "text/plain" } }));
    if (!response.ok || (await response.text()).trim() !== fingerprint) return null;
  } catch { return null; }
  let articles = route.newsArticles;
  if (!Array.isArray(articles)) {
    const payload = await loadPrerenderAssetPayload(route, requestUrl, env);
    articles = payload?.newsArticles;
  }
  if (!Array.isArray(articles)) return null;
  const stated = articles.map(applyNewsSearchState);
  // A build-time snapshot marked search-published loses that status when the article is now thin or canonicalized.
  const slug = requestUrl.pathname.match(/\/news\/([a-z0-9-]+)$/)?.[1];
  const current = slug ? stated.find((item) => item?.slug === slug) : null;
  return { articles: stated, fingerprint, searchPublished: route.searchPublished !== false && !(current && current.searchState) };
}


const VENUE_REGISTRY = {
  binance: {
    slug: "binance",
    name: "Binance",
    category: "CEX",
    officialDomain: "www.binance.com",
    rebate: 20,
    welcomeBonus: "$100",
    spotFee: "0.10% / 0.10%",
    futuresFee: "0.02% / 0.05%",
    porCoverage: "105.8% (Merkle Tree)",
    securityFund: "SAFU Fund ($1.0B+)",
    kycLevel: "mandatory",
    kycSummaryZh: "强制实名认证（身份证件 + 人脸识别）",
    kycSummaryEn: "Mandatory KYC (ID + facial scan)",
    inviteCode: "11350287",
    restrictedRegionsZh: "美国、朝鲜、伊朗、古巴、叙利亚",
    restrictedRegionsEn: "United States, North Korea, Iran, Cuba, Syria",
    fiatChannelsZh: "P2P、信用卡、银行电汇",
    fiatChannelsEn: "P2P, Credit Card, Bank Wire",
  },
  okx: {
    slug: "okx",
    name: "OKX",
    category: "CEX",
    officialDomain: "www.okx.com",
    rebate: 20,
    welcomeBonus: "$50",
    spotFee: "0.08% / 0.10%",
    futuresFee: "0.02% / 0.05%",
    porCoverage: "104.2% (22 Assets)",
    securityFund: "OKX 风险储备金",
    kycLevel: "mandatory",
    kycSummaryZh: "强制实名认证（身份证件 + 人脸识别）",
    kycSummaryEn: "Mandatory KYC (ID + facial recognition)",
    inviteCode: "nexu888",
    restrictedRegionsZh: "美国、朝鲜、伊朗、古巴、叙利亚",
    restrictedRegionsEn: "United States, North Korea, Iran, Cuba, Syria",
    fiatChannelsZh: "P2P、信用卡、银行转账",
    fiatChannelsEn: "P2P, Credit Card, Bank Transfer",
  },
  bybit: {
    slug: "bybit",
    name: "Bybit",
    category: "CEX",
    officialDomain: "www.bybit.com",
    rebate: 20,
    welcomeBonus: "$50",
    spotFee: "0.10% / 0.10%",
    futuresFee: "0.02% / 0.055%",
    porCoverage: "104.5% (Audited)",
    securityFund: "Bybit 保险基金",
    kycLevel: "mandatory",
    kycSummaryZh: "基础实名认证（证件上传）",
    kycSummaryEn: "Standard KYC required",
    inviteCode: "48553",
    restrictedRegionsZh: "美国、中国大陆、新加坡、加拿大",
    restrictedRegionsEn: "United States, Mainland China, Singapore, Canada",
    fiatChannelsZh: "P2P、信用卡、Apple Pay",
    fiatChannelsEn: "P2P, Credit Card, Apple Pay",
  },
  bitget: {
    slug: "bitget",
    name: "Bitget",
    category: "CEX",
    officialDomain: "www.bitget.com",
    rebate: 20,
    welcomeBonus: "$100",
    spotFee: "0.10% / 0.10%",
    futuresFee: "0.02% / 0.06%",
    porCoverage: "172.0% ($400M+ Fund)",
    securityFund: "Bitget 保护基金 ($400M+)",
    kycLevel: "mandatory",
    kycSummaryZh: "强制基础实名认证",
    kycSummaryEn: "Standard KYC required",
    inviteCode: "nexu888",
    restrictedRegionsZh: "美国、中国大陆、新加坡、加拿大",
    restrictedRegionsEn: "United States, Mainland China, Singapore, Canada",
    fiatChannelsZh: "P2P、信用卡、第三方支付",
    fiatChannelsEn: "P2P, Credit Card, Third-party gateways",
  },
  coinbase: {
    slug: "coinbase",
    name: "Coinbase",
    category: "CEX",
    officialDomain: "www.coinbase.com",
    rebate: 0,
    welcomeBonus: "$0",
    spotFee: "0.40% / 0.60%",
    futuresFee: "0.05% / 0.10%",
    porCoverage: "100% US Publicly Audited (10-K)",
    securityFund: "美国机构级独立托管",
    kycLevel: "mandatory",
    kycSummaryZh: "严格合规 KYC",
    kycSummaryEn: "Strict US regulated KYC",
    inviteCode: null,
    restrictedRegionsZh: "受制裁国家与地区",
    restrictedRegionsEn: "Sanctioned jurisdictions",
    fiatChannelsZh: "ACH、FedWire、借记卡、SEPA",
    fiatChannelsEn: "ACH, FedWire, Debit Card, SEPA",
  },
  kraken: {
    slug: "kraken",
    name: "Kraken",
    category: "CEX",
    officialDomain: "www.kraken.com",
    rebate: 10,
    welcomeBonus: "$50",
    spotFee: "0.16% / 0.26%",
    futuresFee: "0.02% / 0.05%",
    porCoverage: "100% 半年度默克尔树审计",
    securityFund: "Kraken 储备安全金库",
    kycLevel: "mandatory",
    kycSummaryZh: "基础或进阶实名认证",
    kycSummaryEn: "Intermediate / Pro KYC",
    inviteCode: "7f97gkqw",
    restrictedRegionsZh: "受制裁国家与地区",
    restrictedRegionsEn: "Sanctioned jurisdictions",
    fiatChannelsZh: "FedWire、SEPA、ACH、SWIFT",
    fiatChannelsEn: "FedWire, SEPA, ACH, SWIFT",
  },
  "gate-io": {
    slug: "gate-io",
    name: "Gate.io",
    category: "CEX",
    officialDomain: "www.gate.io",
    rebate: 20,
    welcomeBonus: "$100",
    spotFee: "0.09% / 0.09%",
    futuresFee: "0.015% / 0.05%",
    porCoverage: "115.3% (zk-SNARKs)",
    securityFund: "Gate 安全基金",
    kycLevel: "mandatory",
    kycSummaryZh: "实名认证（身份证件）",
    kycSummaryEn: "Identity document verification",
    inviteCode: "nexubest",
    restrictedRegionsZh: "美国、中国大陆、新加坡",
    restrictedRegionsEn: "United States, Mainland China, Singapore",
    fiatChannelsZh: "P2P、信用卡、第三方支付",
    fiatChannelsEn: "P2P, Credit Card, Third-party payment",
  },
  kucoin: {
    slug: "kucoin",
    name: "KuCoin",
    category: "CEX",
    officialDomain: "www.kucoin.com",
    rebate: 20,
    welcomeBonus: "$100",
    spotFee: "0.10% / 0.10%",
    futuresFee: "0.02% / 0.06%",
    porCoverage: "102.1% (Merkle Tree)",
    securityFund: "KuCoin 保护基金",
    kycLevel: "mandatory",
    kycSummaryZh: "实名认证（身份证件）",
    kycSummaryEn: "Mandatory KYC verification",
    inviteCode: "NEXU_KUCOIN",
    restrictedRegionsZh: "美国、中国大陆、新加坡",
    restrictedRegionsEn: "United States, Mainland China, Singapore",
    fiatChannelsZh: "P2P、信用卡、FastTrade",
    fiatChannelsEn: "P2P, Credit Card, FastTrade",
  },
  mexc: {
    slug: "mexc",
    name: "MEXC",
    category: "CEX",
    officialDomain: "www.mexc.com",
    rebate: 20,
    welcomeBonus: "$100",
    spotFee: "0.00% / 0.05%",
    futuresFee: "0.00% / 0.02%",
    porCoverage: "102.8% (Public PoR)",
    securityFund: "MEXC 投资者保护金",
    kycLevel: "mandatory",
    kycSummaryZh: "根据 MEXC 用户协议（https://www.mexc.com/terms）须完成身份认证；MEXC 未公布未认证账户的官方限额。",
    kycSummaryEn: "Identity verification required under the MEXC User Agreement (https://www.mexc.com/terms); MEXC publishes no official limit for unverified accounts.",
    inviteCode: "4BRhe",
    restrictedRegionsZh: "美国、中国大陆、新加坡",
    restrictedRegionsEn: "United States, Mainland China, Singapore",
    fiatChannelsZh: "P2P、第三方支付",
    fiatChannelsEn: "P2P, Third-party payment",
  },
  htx: {
    slug: "htx",
    name: "HTX",
    category: "CEX",
    officialDomain: "www.htx.com",
    rebate: 20,
    welcomeBonus: "$100",
    spotFee: "0.20% / 0.20%",
    futuresFee: "0.02% / 0.05%",
    porCoverage: "101.4% (Merkle Tree)",
    securityFund: "HTX 用户安全保障基金",
    kycLevel: "mandatory",
    kycSummaryZh: "基础实名认证（身份证件）",
    kycSummaryEn: "Basic ID verification required",
    inviteCode: "nexu888",
    restrictedRegionsZh: "美国、中国大陆、加拿大、新加坡",
    restrictedRegionsEn: "United States, Mainland China, Canada, Singapore",
    fiatChannelsZh: "P2P、信用卡、第三方支付",
    fiatChannelsEn: "P2P, Credit Card, Third-party payment",
  },
  backpack: {
    slug: "backpack",
    name: "Backpack",
    category: "CEX",
    officialDomain: "backpack.exchange",
    rebate: 20,
    welcomeBonus: "$50",
    spotFee: "0.08% / 0.10%",
    futuresFee: "0.02% / 0.05%",
    porCoverage: "100% (Dubai VARA zk-PoR)",
    securityFund: "VARA 监管安全金库",
    kycLevel: "mandatory",
    kycSummaryZh: "基础实名认证",
    kycSummaryEn: "Standard KYC required",
    inviteCode: "LuckyBitcoin",
    restrictedRegionsZh: "美国、中国大陆",
    restrictedRegionsEn: "United States, Mainland China",
    fiatChannelsZh: "加密货币充值、精选银行转账",
    fiatChannelsEn: "Crypto Deposit, Select Bank Transfer",
  },
  deribit: {
    slug: "deribit",
    name: "Deribit",
    category: "CEX",
    officialDomain: "www.deribit.com",
    rebate: 10,
    welcomeBonus: "$50",
    spotFee: "0.00% / 0.05%",
    futuresFee: "-0.01% / 0.05%",
    porCoverage: "100% (Audited Segregated)",
    securityFund: "Deribit 保险基金",
    kycLevel: "mandatory",
    kycSummaryZh: "基础实名认证（护照或身份证）",
    kycSummaryEn: "Standard KYC verification",
    inviteCode: "NEXU_DERIBIT",
    restrictedRegionsZh: "美国、中国大陆",
    restrictedRegionsEn: "United States, Mainland China",
    fiatChannelsZh: "仅限加密资产（BTC、ETH、USDC）",
    fiatChannelsEn: "Crypto only (BTC, ETH, USDC)",
  },
  hashkey: {
    slug: "hashkey",
    name: "HashKey Global",
    category: "CEX",
    officialDomain: "global.hashkey.com",
    rebate: 20,
    welcomeBonus: "$50",
    spotFee: "0.05% / 0.05%",
    futuresFee: "0.02% / 0.05%",
    porCoverage: "100% 持牌机构独立托管",
    securityFund: "一级保险冷钱包托管",
    kycLevel: "mandatory",
    kycSummaryZh: "严格合规持牌 KYC",
    kycSummaryEn: "Licensed institutional KYC",
    inviteCode: "NEXUALPHA",
    restrictedRegionsZh: "中国大陆、美国",
    restrictedRegionsEn: "Mainland China, United States",
    fiatChannelsZh: "美元电汇、香港本地银行转账",
    fiatChannelsEn: "USD Bank Wire, Hong Kong Local Bank Transfer",
  },
  uniswap: {
    slug: "uniswap",
    name: "Uniswap",
    category: "DEX",
    officialDomain: "app.uniswap.org",
    rebate: 0,
    welcomeBonus: "$0",
    spotFee: "0.05% / 0.30%",
    futuresFee: "N/A",
    porCoverage: "100% 链上智能合约透明",
    securityFund: "以太坊多重审计代码安全",
    kycLevel: "none",
    kycSummaryZh: "完全免 KYC，钱包直连",
    kycSummaryEn: "Non-custodial, Zero KYC",
    inviteCode: null,
    restrictedRegionsZh: "OFAC 制裁地址",
    restrictedRegionsEn: "OFAC sanctioned addresses",
    fiatChannelsZh: "第三方 Web3 支付通道",
    fiatChannelsEn: "Third-party web3 on-ramps",
  },
  pancakeswap: {
    slug: "pancakeswap",
    name: "PancakeSwap",
    category: "DEX",
    officialDomain: "pancakeswap.finance",
    rebate: 0,
    welcomeBonus: "$0",
    spotFee: "0.01% - 0.25%",
    futuresFee: "0.02% / 0.07%",
    porCoverage: "100% 多链链上流动性池",
    securityFund: "BNB Chain 顶级审计合约",
    kycLevel: "none",
    kycSummaryZh: "完全免 KYC，钱包直连",
    kycSummaryEn: "Non-custodial, Zero KYC",
    inviteCode: null,
    restrictedRegionsZh: "OFAC 制裁地址",
    restrictedRegionsEn: "OFAC sanctioned addresses",
    fiatChannelsZh: "第三方入金网关",
    fiatChannelsEn: "Third-party fiat gateways",
  },
  jupiter: {
    slug: "jupiter",
    name: "Jupiter",
    category: "DEX",
    officialDomain: "jup.ag",
    rebate: 0,
    welcomeBonus: "$0",
    spotFee: "0.00% 聚合器零加价",
    futuresFee: "0.06% / 0.06%",
    porCoverage: "100% Solana 原生状态",
    securityFund: "Solana 智能合约审计",
    kycLevel: "none",
    kycSummaryZh: "完全免 KYC，Solana 钱包直连",
    kycSummaryEn: "Non-custodial, Zero KYC",
    inviteCode: null,
    restrictedRegionsZh: "受制裁地区",
    restrictedRegionsEn: "Sanctioned jurisdictions",
    fiatChannelsZh: "Solana 链上原生兑换",
    fiatChannelsEn: "Solana on-chain swaps",
  },
  raydium: {
    slug: "raydium",
    name: "Raydium",
    category: "DEX",
    officialDomain: "raydium.io",
    rebate: 0,
    welcomeBonus: "$0",
    spotFee: "0.25% AMM / 0.04% CLMM",
    futuresFee: "N/A",
    porCoverage: "100% Solana 链上流动性",
    securityFund: "Kudelski 审计代码",
    kycLevel: "none",
    kycSummaryZh: "完全免 KYC，Solana 钱包直连",
    kycSummaryEn: "Non-custodial, Zero KYC",
    inviteCode: null,
    restrictedRegionsZh: "受制裁地区",
    restrictedRegionsEn: "Sanctioned jurisdictions",
    fiatChannelsZh: "Solana 链上充提",
    fiatChannelsEn: "Solana on-chain only",
  },
  aerodrome: {
    slug: "aerodrome",
    name: "Aerodrome",
    category: "DEX",
    officialDomain: "aerodrome.finance",
    rebate: 0,
    welcomeBonus: "$0",
    spotFee: "0.05% - 0.30%",
    futuresFee: "N/A",
    porCoverage: "100% Base 链上透明",
    securityFund: "Base 网络原生安全",
    kycLevel: "none",
    kycSummaryZh: "完全免 KYC，Base 钱包直连",
    kycSummaryEn: "Non-custodial, Zero KYC",
    inviteCode: null,
    restrictedRegionsZh: "受制裁地区",
    restrictedRegionsEn: "Sanctioned jurisdictions",
    fiatChannelsZh: "Base L2 链上通道",
    fiatChannelsEn: "Base L2 on-ramp",
  },
  curve: {
    slug: "curve",
    name: "Curve",
    category: "DEX",
    officialDomain: "curve.finance",
    rebate: 0,
    welcomeBonus: "$0",
    spotFee: "0.04% (StableSwap)",
    futuresFee: "N/A",
    porCoverage: "100% 多链链上智能池",
    securityFund: "Curve 多重审计架构",
    kycLevel: "none",
    kycSummaryZh: "完全免 KYC，EVM 钱包直连",
    kycSummaryEn: "Non-custodial, Zero KYC",
    inviteCode: null,
    restrictedRegionsZh: "受制裁地区",
    restrictedRegionsEn: "Sanctioned jurisdictions",
    fiatChannelsZh: "多链链上出入金",
    fiatChannelsEn: "Multi-chain on-ramps",
  },
  hyperliquid: {
    slug: "hyperliquid",
    name: "Hyperliquid",
    category: "Perp DEX",
    officialDomain: "app.hyperliquid.xyz",
    rebate: 4,
    welcomeBonus: "$0",
    spotFee: "0.00% / 0.02%",
    futuresFee: "0.01% / 0.035%",
    porCoverage: "100% Hyperliquid L1 原生状态",
    securityFund: "HLP 金库安全资金池 ($500M+)",
    kycLevel: "none",
    kycSummaryZh: "完全免 KYC，自托管钱包直连",
    kycSummaryEn: "Non-custodial, Zero KYC",
    inviteCode: "NEXU888",
    restrictedRegionsZh: "美国",
    restrictedRegionsEn: "United States",
    fiatChannelsZh: "通过 Arbitrum USDC 桥接",
    fiatChannelsEn: "Bridge via Arbitrum USDC",
  },
  dydx: {
    slug: "dydx",
    name: "dYdX",
    category: "Perp DEX",
    officialDomain: "dydx.trade",
    rebate: 0,
    welcomeBonus: "$0",
    spotFee: "N/A",
    futuresFee: "0.02% / 0.05%",
    porCoverage: "100% dYdX Chain 独立链状态",
    securityFund: "dYdX 风险保障模块",
    kycLevel: "none",
    kycSummaryZh: "完全免 KYC，Cosmos 链自托管钱包",
    kycSummaryEn: "Non-custodial, Zero KYC",
    inviteCode: null,
    restrictedRegionsZh: "美国、受制裁国家",
    restrictedRegionsEn: "United States, Sanctioned countries",
    fiatChannelsZh: "Cosmos / 以太坊跨链桥",
    fiatChannelsEn: "Cosmos / Ethereum Bridge",
  },
  gmx: {
    slug: "gmx",
    name: "GMX",
    category: "Perp DEX",
    officialDomain: "gmx.io",
    rebate: 10,
    welcomeBonus: "$0",
    spotFee: "0.05% - 0.25%",
    futuresFee: "0.05% / 0.07%",
    porCoverage: "100% Arbitrum/Avalanche GM 池",
    securityFund: "GMX GM 资产池本金支撑",
    kycLevel: "none",
    kycSummaryZh: "完全免 KYC，Web3 钱包直连",
    kycSummaryEn: "Non-custodial, Zero KYC",
    inviteCode: "NEXU_GMX",
    restrictedRegionsZh: "美国",
    restrictedRegionsEn: "United States",
    fiatChannelsZh: "Arbitrum / Avalanche 链上通道",
    fiatChannelsEn: "Arbitrum / Avalanche crypto rails",
  },
  drift: {
    slug: "drift",
    name: "Drift",
    category: "Perp DEX",
    officialDomain: "app.drift.trade",
    rebate: 5,
    welcomeBonus: "$0",
    spotFee: "0.05% / 0.10%",
    futuresFee: "0.00% / 0.045%",
    porCoverage: "100% Solana 链上状态 ($400M+ TVL)",
    securityFund: "Drift 保险资金池",
    kycLevel: "none",
    kycSummaryZh: "完全免 KYC，Phantom 钱包直连",
    kycSummaryEn: "Non-custodial, Zero KYC",
    inviteCode: "NEXU_DRIFT",
    restrictedRegionsZh: "美国",
    restrictedRegionsEn: "United States",
    fiatChannelsZh: "Solana 链上充提通道",
    fiatChannelsEn: "Via Solana on-ramps",
  },
  aevo: {
    slug: "aevo",
    name: "Aevo",
    category: "Perp DEX",
    officialDomain: "app.aevo.xyz",
    rebate: 10,
    welcomeBonus: "$0",
    spotFee: "N/A",
    futuresFee: "0.02% / 0.05%",
    porCoverage: "100% OP Stack L2 原生状态",
    securityFund: "Aevo 保险准备金",
    kycLevel: "none",
    kycSummaryZh: "完全免 KYC，Web3 钱包直连",
    kycSummaryEn: "Non-custodial, Zero KYC",
    inviteCode: "NEXUALPHA",
    restrictedRegionsZh: "美国",
    restrictedRegionsEn: "United States",
    fiatChannelsZh: "Arbitrum/Optimism 跨链充值",
    fiatChannelsEn: "Crypto bridge via Arbitrum/Optimism",
  },
};

function buildWorkerHomeSchema(locale) {
  const isZh = locale === "zh-Hans";
  const featuredVenues = [...ACTIVE_VENUE_SLUGS].slice(0, 6).map((slug, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: VENUE_REGISTRY[slug]?.name || slug,
    url: `${PUBLIC_ORIGIN}/exchanges/${slug}`,
  }));
  // WebSite + Organization come from src/data/brand-entity.js: same @id, logo, sameAs and Research Desk department on
  // the home page, the article pages, the data pages and /about.
  return [
    websiteSchema(locale, {
      dateModified: "2026-09-21",
      description: isZh
        ? "基于源头核验的独立加密交易平台数据库，整理公开费率、地区条件与 PoR 来源；用户权益需逐项核对官方条款。"
        : "Independent, source-backed crypto platform research covering published fees, regional conditions and reserve disclosures; user benefits require official-term verification.",
    }),
    organizationSchema(locale),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${PUBLIC_ORIGIN}/#featured-platforms`,
      name: isZh ? "精选加密平台" : "Featured crypto platforms",
      itemListElement: featuredVenues,
    },
  ];
}

function pageBreadcrumb(name, canonicalUrl, parentName, parentPath, locale) {
  return { "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "NexuAlpha", item: localizedCanonical("/", locale) },
    { "@type": "ListItem", position: 2, name: parentName, item: localizedCanonical(parentPath, locale) },
    { "@type": "ListItem", position: 3, name, item: canonicalUrl },
  ] };
}

function buildWorkerVenueSchema(venue, locale, canonicalUrl, seoOverride = null) {
  const sourceUrls = seoOverride?.sourceUrls || [];
  const schemas = [pageBreadcrumb(venue.name, canonicalUrl, "Exchanges", "/exchanges", locale), {
    "@type": "WebPage", name: `${venue.name} Exchange Profile`, url: canonicalUrl, inLanguage: locale, dateModified: seoOverride?.reviewedAt || (seoOverride ? "2026-09-15" : "2026-09-08"),
    ...researchAttribution([`https://${venue.officialDomain}`, ...sourceUrls]),
    about: { "@type": "Organization", name: venue.name, url: `https://${venue.officialDomain}` },
    isBasedOn: [...new Set([`https://${venue.officialDomain}`, ...sourceUrls])],
    ...(seoOverride?.relatedLinks ? { relatedLink: seoOverride.relatedLinks.map((link) => `${PUBLIC_ORIGIN}${link}`) } : {}),
  }];
  if (seoOverride?.directAnswer) {
    const entries = [seoOverride.directAnswer, ...(seoOverride.faq || []).map((entry) => {
      if (!Array.isArray(entry)) return entry;
      const [question, answer, citations] = entry;
      return { question, answer, citations };
    })];
    schemas.push({
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: entries.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: entry.answer,
          ...((entry.citations?.length || sourceUrls.length) ? { citation: entry.citations?.length ? entry.citations : sourceUrls.slice(0, 4) } : {}),
        },
      })),
      about: { "@type": "Organization", name: venue.name, url: `https://${venue.officialDomain}` },
    });
  } else {
    const official = `https://${venue.officialDomain}`;
    // Same localized fallback as venueProfileFaq() in src/data/seo-injection.js (client/Worker parity).
    const zhFallback = locale === "zh-Hans" ? [[`${venue.name} 的最终手续费和账户条件在哪里确认？`, `应在 ${venue.name} 官方账户流程中确认最终手续费、身份验证、地区可用性、产品和账户条件。NexuAlpha 页面只整理公开资料。`], [`NexuAlpha 是否保证 ${venue.name} 的优惠或邀请权益？`, "不保证。优惠、邀请权益和账户条件会随地区、账户、产品和官方当前条款变化，必须以官方页面为准。"]] : null;
    schemas.push({
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: zhFallback ? zhFallback.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text, citation: [official] } })) : [
        {
          "@type": "Question",
          name: `Where should ${venue.name} fees and account terms be confirmed?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Confirm final fees, identity checks, regional availability, products and account terms in the ${venue.name} official account flow. NexuAlpha only organizes published sources.`,
            citation: [official],
          },
        },
        {
          "@type": "Question",
          name: `Does NexuAlpha guarantee a ${venue.name} benefit or referral entitlement?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Benefits, referral terms and account conditions can vary by region, account, product and current official terms. Verify them on the official platform.",
            citation: [official],
          },
        },
      ],
      about: { "@type": "Organization", name: venue.name, url: official },
    });
  }
  return schemas;
}

function workerCompareFaq(locale, venues) {
  const names = venues.map((venue) => venue.name);
  const vars = { nameA: names[0] || "", nameB: names[1] || "", name: names.join(" vs ") };
  const rows = WORKER_COMPARE_FAQ[locale] || WORKER_COMPARE_FAQ.en || [];
  return rows.map(([question, answer]) => [workerTemplate(question, vars), workerTemplate(answer, vars)]);
}

function workerTemplate(value, vars) {
  return String(value || "").replace(/\{(\w+)\}/g, (_match, key) => vars[key] ?? "");
}

function buildWorkerCompareSchema(venues, locale, canonicalUrl, seoOverride = null) {
  const name = venues.map((venue) => venue.name).join(" vs ");
  const hasSeoOverrideFaq = seoOverride?.completeFaq === true || Boolean(seoOverride?.directAnswer && seoOverride?.faq?.length);
  const faqCopy = hasSeoOverrideFaq ? [] : workerCompareFaq(locale, venues);
  const directAnswer = seoOverride?.directAnswer;
  const answerEntries = hasSeoOverrideFaq ? [
    ...(directAnswer ? [directAnswer] : []),
    ...(seoOverride?.faq || []).map(([question, answer]) => ({ question, answer })),
  ] : [];
  return [pageBreadcrumb(name, canonicalUrl, "Exchanges", "/exchanges", locale), {
    "@type": "WebPage", name, url: canonicalUrl, inLanguage: locale, dateModified: "2026-09-22",
    ...researchAttribution([...venues.map((venue) => `https://${venue.officialDomain}`), ...(seoOverride?.sourceUrls || [])]),
    about: venues.map((venue) => ({ "@type": "Organization", name: venue.name, url: `https://${venue.officialDomain}` })),
    mainEntity: {
      "@type": "ItemList", name: `${name} comparison subjects`,
      itemListElement: venues.map((venue, index) => ({ "@type": "ListItem", position: index + 1, name: venue.name, url: `${PUBLIC_ORIGIN}/factbook/${venue.slug}` })),
    },
    ...(seoOverride?.relatedLinks ? { relatedLink: seoOverride.relatedLinks.map((link) => `${PUBLIC_ORIGIN}${link}`) } : {}),
    ...(faqCopy.length || answerEntries.length ? {
      subjectOf: {
        "@type": "FAQPage",
        inLanguage: locale,
        mainEntity: [
          ...answerEntries.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer, ...(seoOverride?.sourceUrls?.length ? { citation: seoOverride.sourceUrls } : {}) } })),
          ...faqCopy.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
        ],
      },
    } : {}),
    isBasedOn: venues.map((venue) => `https://${venue.officialDomain}`),
  }].concat(faqCopy.length || answerEntries.length ? [{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: [
      ...answerEntries.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer } })),
      ...faqCopy.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
    ],
  }] : []);
}

function factbookRelatedLinks(slug) {
  const pairRoutes = {
    binance: ["/compare/binance-vs-okx", "/news/crypto-exchange-fee-disclosure-audit"],
    okx: ["/compare/binance-vs-okx", "/news/okx-usd-to-usdc-spot-pair-migration", "/news/crypto-exchange-fee-disclosure-audit"],
    bybit: ["/compare/bybit-vs-bitget", "/topics/tokenized-stocks-vs-perpetuals", "/news/crypto-exchange-fee-disclosure-audit"],
    bitget: ["/compare/bybit-vs-bitget", "/topics/tokenized-stocks-vs-perpetuals", "/news/crypto-exchange-fee-disclosure-audit"],
  };
  return ["/factbook", `/exchanges/${slug}`, ...(pairRoutes[slug] || []), "/methodology"];
}
function buildWorkerFactbookSchema(venue, locale, canonicalUrl) {
  return [pageBreadcrumb(venue.name, canonicalUrl, "Factbook", "/factbook", locale), {
    "@type": "Dataset", "@id": `${canonicalUrl}#dataset`, name: `${venue.name} Platform Factbook`,
    description: "Platform fee, custody and access reference. Consult the page for source dates, assumptions and limitations.",
    license: NEXUALPHA_DATA_LICENSE_URL,
    url: canonicalUrl, inLanguage: locale,
    dateModified: factbookDates(venue.slug).latestReviewOn,
    ...researchAttribution([`https://${venue.officialDomain}`]),
    creator: { "@type": "Organization", name: "NexuAlpha", url: `${PUBLIC_ORIGIN}/` },
    about: { "@type": "Organization", name: venue.name, url: `https://${venue.officialDomain}` },
    isBasedOn: `https://${venue.officialDomain}`,
    relatedLink: factbookRelatedLinks(venue.slug).map((link) => `${PUBLIC_ORIGIN}${link}`),
    variableMeasured: ["Spot Maker Fee", "Spot Taker Fee", "Futures Maker Fee", "Futures Taker Fee", "KYC Requirements"],
  }];
}

function collectionBreadcrumb(name, canonicalUrl, locale) {
  return { "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "NexuAlpha", item: localizedCanonical("/", locale) },
    { "@type": "ListItem", position: 2, name, item: canonicalUrl },
  ] };
}

function buildWorkerCollectionHubSchema(kind, locale, canonicalUrl) {
  const isFactbook = kind === "factbook";
  const isZh = locale === "zh-Hans";
  const title = isFactbook
    ? (isZh ? "来源审阅事实库" : "Source Review Factbook")
    : (isZh ? "主题研究聚合页" : "Topic Research Hubs");
  const description = isFactbook
    ? (isZh ? "按平台聚合公开来源、费率字段、账户条件、官方域名与核验边界。" : "A platform-level collection of published source records, fee fields, account conditions, official domains and verification limits.")
    : (isZh ? "按交易主题聚合平台比较、费用核验、地区条件、链上风险与来源记录。" : "A collection of trading-topic research paths covering platform comparisons, fee checks, regional conditions, on-chain risks and source records.");
  const records = isFactbook
    ? Object.values(VENUE_REGISTRY).map((venue) => ({ name: `${venue.name} Factbook`, href: `/factbook/${venue.slug}` }))
    : [
        ...Object.values(TOPIC_REGISTRY).map((topic) => ({ name: isZh ? topic.titleZh : topic.titleEn, href: `/topics/${topic.slug}` })),
        ...Object.values(TOKENIZED_ASSET_REGISTRY).map((topic) => ({ name: isZh ? topic.titleZh : topic.titleEn, href: `/topics/${topic.slug}` })),
      ];
  return [
    collectionBreadcrumb(title, canonicalUrl, locale),
    {
      "@type": "CollectionPage",
      name: title,
      description,
      url: canonicalUrl,
      inLanguage: locale,
      dateModified: isFactbook ? FACTBOOK_SOURCE_REVIEW_DATE : TOPIC_SOURCE_REVIEW_DATE,
      ...researchAttribution([]),
    },
    {
      "@type": "ItemList",
      name: isFactbook ? "Factbook records" : "Topic guides",
      url: canonicalUrl,
      inLanguage: locale,
      itemListElement: records.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: localizedCanonical(item.href, locale),
      })),
    },
  ];
}

function buildWorkerDirectorySchema(locale) {
  const isZh = locale === "zh-Hans";
  const canonicalUrl = localizedCanonical("/exchanges", locale);
  const items = Object.values(VENUE_REGISTRY).filter((venue) => ACTIVE_VENUE_SLUGS.has(venue.slug)).map((venue, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: `${venue.name} (${venue.category})`,
    url: `${PUBLIC_ORIGIN}/exchanges/${venue.slug}`,
  }));

  return [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "NexuAlpha", item: `${PUBLIC_ORIGIN}/` },
        { "@type": "ListItem", position: 2, name: isZh ? "交易平台黄页" : "Exchanges Directory", item: canonicalUrl },
      ],
    },
    {
      "@type": "ItemList",
      name: isZh ? "全球核心加密交易平台数据库" : "Global Crypto Exchanges Directory",
      description: isZh
        ? "收录 20+ CEX 与 DEX 的公开费率、官方域名、账户条件与来源状态。"
        : "Source-linked directory of crypto CEXs and DEXs covering published fees, official domains, account conditions and review status.",
      itemListElement: items,
    },
  ];
}

function buildWorkerActivitiesSchema(locale) {
  return [{ "@type": "CollectionPage", name: locale === "zh-Hans" ? "官方活动中心" : "Official Campaigns", url: localizedCanonical("/activities", locale), inLanguage: locale }];
}

function venueDisplayName(slug) {
  return VENUE_REGISTRY[slug]?.name || String(slug || "").split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") || "Exchange";
}

function activityUpdateDescription(item, locale) {
  const briefSummary = localizedBriefText(item?.brief?.summary, locale);
  if (briefSummary) return clampMetaDescription(briefSummary, locale);
  const venueName = venueDisplayName(item.venue);
  const headline = updateHeadline(item, locale) || item.title;
  const category = updateCategory(item, locale);
  const templates = {
    "zh-Hans": `${venueName} 官方${category}更新：${headline}。NexuAlpha 保留站内解读、账户步骤和官方原文入口。`,
    "zh-Hant": `${venueName} 官方${category}更新：${headline}。NexuAlpha 保留站內解讀、帳戶步驟和官方原文入口。`,
    es: `Actualización oficial de ${category} de ${venueName}: ${headline}. NexuAlpha mantiene la lectura, los pasos de cuenta y el enlace original dentro del sitio.`,
    "pt-BR": `Atualização oficial de ${category} da ${venueName}: ${headline}. A NexuAlpha mantém a leitura, os passos de conta e o anúncio original dentro do site.`,
    fr: `Mise à jour officielle ${category} de ${venueName} : ${headline}. NexuAlpha garde l'analyse, les étapes de compte et l'annonce originale sur la page.`,
    de: `Offizielles ${category}-Update von ${venueName}: ${headline}. NexuAlpha hält Einordnung, Konto-Schritte und Originalmeldung auf dieser Seite zusammen.`,
    it: `Aggiornamento ufficiale ${category} di ${venueName}: ${headline}. NexuAlpha tiene lettura, passaggi account e annuncio originale nella pagina.`,
    ja: `${venueName} の公式${category}更新: ${headline}。NexuAlpha は解釈、アカウント手順、原文リンクを同じページにまとめます。`,
    ko: `${venueName} 공식 ${category} 업데이트: ${headline}. NexuAlpha는 해석, 계정 단계, 원문 링크를 한 페이지에 둡니다.`,
    vi: `Cập nhật ${category} chính thức của ${venueName}: ${headline}. NexuAlpha giữ phần diễn giải, bước tài khoản và thông báo gốc trên trang này.`,
    id: `Pembaruan resmi ${category} dari ${venueName}: ${headline}. NexuAlpha menyimpan konteks, langkah akun, dan pengumuman asli di halaman ini.`,
    tr: `${venueName} resmi ${category} güncellemesi: ${headline}. NexuAlpha yorumu, hesap adımlarını ve orijinal duyuruyu bu sayfada tutar.`,
    ru: `Официальное обновление ${category} от ${venueName}: ${headline}. NexuAlpha держит пояснение, шаги аккаунта и оригинал объявления на этой странице.`,
    ar: `تحديث ${category} رسمي من ${venueName}: ${headline}. تجمع NexuAlpha التفسير وخطوات الحساب ورابط الإعلان الأصلي في هذه الصفحة.`,
  };
  return templates[locale] || `${venueName} official ${category.toLowerCase()} update: ${headline}. NexuAlpha keeps the interpretation, account steps, and original announcement on our page.`;
}

function buildWorkerActivityUpdateSchema(item, locale, canonicalUrl) {
  const headline = updateHeadline(item, locale) || item.title;
  const description = activityUpdateDescription(item, locale);
  const publishedAt = Number.isFinite(Date.parse(item.publishedAt)) ? new Date(item.publishedAt).toISOString() : undefined;
  const schemas = [
    pageBreadcrumb(headline, canonicalUrl, locale === "zh-Hans" ? "官方活动中心" : "Official Campaigns", "/activities", locale),
    {
      "@type": "NewsArticle",
      headline,
      description,
      url: canonicalUrl,
      mainEntityOfPage: canonicalUrl,
      inLanguage: locale,
      ...(publishedAt ? { datePublished: publishedAt, dateModified: publishedAt } : {}),
      author: RESEARCH_DESK,
      publisher: NEXUALPHA_PUBLISHER,
      isAccessibleForFree: true,
      about: { "@type": "Organization", name: venueDisplayName(item.venue) },
      citation: item.url,
    },
  ];
  const deadline = Number.isFinite(Date.parse(item?.brief?.deadline)) ? new Date(item.brief.deadline).toISOString() : null;
  if (item.category === "event" && deadline) {
    schemas.push({
      "@type": "Event",
      name: headline,
      description,
      url: canonicalUrl,
      inLanguage: locale,
      endDate: deadline,
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      organizer: { "@type": "Organization", name: venueDisplayName(item.venue) },
    });
  }
  return schemas;
}

const TOPIC_REGISTRY = {
  "meme-coins": {
    slug: "meme-coins",
    titleZh: "Meme 币交易平台比较：MEXC、Gate.io 与 Raydium — NexuAlpha",
    titleEn: "Meme Coin Platform Comparison: MEXC, Gate.io and Raydium — NexuAlpha",
    descZh: "比较 MEXC、Gate.io 与 Raydium 的产品入口、流动性机制、交易成本、代币与资金池核验步骤，以及不同账户和地区条件。",
    descEn: "Compare product access, liquidity mechanics, trading costs, token and pool checks, and account or regional conditions across MEXC, Gate.io and Raydium.",
    categoryZh: "Meme 币与链上交易",
    categoryEn: "Meme Coins & On-chain Trading",
    platforms: ["mexc", "gate-io", "raydium"],
    faqs: [
      {
        qZh: "选择 Meme 币交易平台时应核对什么？",
        qEn: "What should be checked when choosing a meme coin trading platform?",
        aZh: "先核对代币合约、可用交易对、流动性与价差，再确认平台是否对你的地区和账户开放。上线节奏、费率与活动条件会变化，应以平台当前官方页面为准。",
        aEn: "Check the token contract, available pairs, liquidity and spread, then confirm access for your region and account. Listings, fees and campaigns change, so use the venue's current official pages.",
      },
      {
        qZh: "在 Raydium 等链上 DEX 打新如何防止被 MEV 夹子套利？",
        qEn: "How to avoid MEV sandwich attacks on DEXs like Raydium?",
        aZh: "没有适用于所有池子的固定安全滑点。交易前应检查代币与资金池地址、模拟成交结果、价格影响、路由和当前网络条件；私有路由只能在有可核验证据时作为额外措施。",
        aEn: "There is no universal safe slippage threshold. Check token and pool addresses, simulate the result, review price impact, route and network conditions, and treat private routing as an additional measure only when its behavior is verifiable.",
      },
      {
        qZh: "Meme 币退出交易前应检查哪些风险？",
        qEn: "What risks should be checked before exiting a meme coin position?",
        aZh: "分别检查流动性、价格影响、代币合约、网络状态、平台规则与提现条件。法币出金还涉及银行、地区、反洗钱和资金来源要求，任何路径都不能保证银行或平台一定放行。",
        aEn: "Review liquidity, price impact, token contract, network state, venue rules and withdrawal conditions separately. Fiat cash-out also depends on bank, regional, AML and source-of-funds rules; no route guarantees approval.",
      },
    ],
  },
  "derivatives": {
    slug: "derivatives",
    titleZh: "永续合约平台比较：Binance、Bybit 与 Hyperliquid — NexuAlpha",
    titleEn: "Perpetuals Platform Comparison: Binance, Bybit and Hyperliquid — NexuAlpha",
    descZh: "比较公开费率、资金费率机制、保证金模式、强平边界、流动性与来源更新时间，并提示账户和地区条件。",
    descEn: "Compare four derivative routes in one checklist: CEX futures accounts, wallet-connected Perp DEXs, options/perps specialist venues and GMX-style pool routes. Check published fees, funding, margin mode, liquidation rules, oracle route, collateral movement, region and wallet-signature risk before choosing the next step.",
    categoryZh: "合约与永续产品",
    categoryEn: "Derivatives & Perpetual Contracts",
    platforms: ["binance", "bybit", "hyperliquid"],
    faqs: [
      {
        qZh: "统一交易账户会自动提高资金效率吗？",
        qEn: "Does a unified trading account automatically improve capital efficiency?",
        aZh: "不会。可用抵押品、折扣率、风险抵消、仓位规则和强平条件因平台与账户等级而异，应在开户和开仓前核对当前官方规则。",
        aEn: "No. Eligible collateral, haircuts, risk offsets, position rules and liquidation conditions vary by venue and account tier. Check the current official rules before funding or opening a position.",
      },
      {
        qZh: "Hyperliquid 去中心化合约平台是否会发生穿仓分摊？",
        qEn: "Can Hyperliquid traders face socialized clawback or slippage?",
        aZh: "Hyperliquid 官方文档描述了订单簿清算与清算金库等机制，但这些机制不构成优于其他平台的安全保证。应核对当前保证金、强平价格、预言机和清算文档。",
        aEn: "Hyperliquid documents order-book liquidation and a liquidation vault, but those mechanics do not guarantee superior safety. Check the current margin, liquidation price, oracle and liquidation documentation.",
      },
      {
        qZh: "资金费率套利是否无风险？",
        qEn: "Does funding-rate arbitrage eliminate risk?",
        aZh: "不是。即使方向敞口接近中性，仍有基差、手续费、滑点、强平、平台、转账和资金费率变化风险，应按两端最坏情况计算成本。",
        aEn: "No. Even with near-neutral directional exposure, basis, fees, slippage, liquidation, venue, transfer and funding-rate changes remain. Model the worst case on both legs.",
      },
    ],
  },
  "compliant-exchanges": {
    slug: "compliant-exchanges",
    titleZh: "法币通道与账户资格比较：HashKey、Kraken 与 OKX — NexuAlpha",
    titleEn: "Fiat Access and Account Eligibility: HashKey, Kraken and OKX — NexuAlpha",
    descZh: "比较地区资格、身份核验、同名银行要求、法币通道和官方规则来源。银行、平台和监管要求可能随地区与账户变化。",
    descEn: "Compare regional eligibility, identity checks, same-name banking requirements, fiat routes and official rule sources. Bank, venue and regulatory requirements vary by region and account.",
    categoryZh: "法币通道与账户条件",
    categoryEn: "Fiat Access & Account Eligibility",
    platforms: ["hashkey", "kraken", "okx"],
    faqs: [
      {
        qZh: "大额法币出金能否保证银行账户不被冻结？",
        qEn: "Can a large fiat withdrawal guarantee that a bank account will not be frozen?",
        aZh: "不能保证。应分别核对平台与银行的同名账户、地区资格、反洗钱、资金来源、限额及税务要求，并保存可解释的交易记录。",
        aEn: "No. Check the venue and bank requirements for same-name accounts, regional eligibility, AML, source of funds, limits and tax obligations, and retain an explainable transaction record.",
      },
      {
        qZh: "中国大陆居民或离岸投资者开户 HashKey 需要准备哪些合规材料？",
        qEn: "What documentation is required to open a HashKey account?",
        aZh: "所需证件、居住地、银行账户和最低入金条件会随客户类型与地区变化。开户前应查看 HashKey 当前官方准入与验证页面，不应依赖固定材料清单。",
        aEn: "Identification, residency, banking and minimum-funding requirements vary by customer type and region. Check HashKey's current official eligibility and verification pages before applying.",
      },
      {
        qZh: "OKX 的「神盾商家」和普通 P2P 交易有什么本质区别？",
        qEn: "What distinguishes OKX P2P Shield merchants from standard sellers?",
        aZh: "商户资格、保证金、申诉和补偿边界必须以 OKX 当前官方规则为准。任何商户标签都不能保证银行放行、账户不受限制或损失一定获得赔付。",
        aEn: "Merchant eligibility, collateral, appeals and compensation boundaries must be checked in OKX's current official rules. No merchant label guarantees bank approval, unrestricted accounts or reimbursement.",
      },
    ],
  },
  "no-kyc": {
    slug: "no-kyc",
    titleZh: "2026 免实名自托管 vs 实名交易所：Hyperliquid、dYdX 与 MEXC 对比 — NexuAlpha",
    titleEn: "No-KYC Self-Custody vs KYC Exchange (2026): Hyperliquid, dYdX and MEXC — NexuAlpha",
    descZh: "比较钱包连接、账户注册、身份核验、提现、地区限制和风险边界。平台可根据规则或风控要求追加验证。",
    descEn: "Compare wallet connection, account registration, identity checks, withdrawals, regional restrictions and risk boundaries. Venues may require additional verification under current rules or risk controls.",
    categoryZh: "钱包与账户访问",
    categoryEn: "Wallet & Account Access",
    platforms: ["hyperliquid", "dydx", "mexc"],
    faqs: [
      {
        qZh: "完全免 KYC 的去中心化合约（如 Hyperliquid）本金真的安全吗？",
        qEn: "Is capital truly safe on no-KYC DEXs like Hyperliquid?",
        aZh: "自托管减少部分中心化托管风险，但仍有智能合约、预言机、前端、桥、强平和私钥风险。应核对协议架构、资产路径与当前官方风险文档。",
        aEn: "Self-custody reduces some centralized custody risks but still leaves smart-contract, oracle, frontend, bridge, liquidation and key-management risks. Check the protocol architecture, asset path and current official risk documentation.",
      },
      {
        qZh: "纯邮箱注册的交易所（如 MEXC）提现时会不会突然强制要求实名？",
        qEn: "Will an email-registered CEX suddenly demand KYC during withdrawal?",
        aZh: "中心化交易所可能根据地区、额度、账户状态和风险控制要求追加身份或安全验证。提现前应核对当前官方条款与账户实际限额。",
        aEn: "A centralized venue may request identity or security checks based on region, limits, account state and risk controls. Check current official terms and the limits shown in the account before funding.",
      },
      {
        qZh: "如果 DEX 前端网页被封锁或无法访问，我该如何取回本金？",
        qEn: "How do I withdraw if a DEX frontend is blocked or goes down?",
        aZh: "恢复路径取决于具体协议、链、合约和账户状态。不要假设一定存在紧急提现函数，也不要在未核验合约地址和调用参数时使用镜像或区块浏览器直接交互。",
        aEn: "Recovery depends on the protocol, chain, contract and account state. Do not assume an emergency-withdraw function exists, and do not use mirrors or direct explorer interactions without verifying contract addresses and call parameters.",
      },
      {
        qZh: "钱包直连是不是等于完全不受风控或地区限制？",
        qEn: "Does wallet access mean there are no risk controls or regional limits?",
        aZh: "不是。钱包直连只说明入口不是传统账户登录。前端、协议、链上合约、制裁规则、流动性、桥和账户状态仍可能影响访问、成交、提现或恢复路径。",
        aEn: "No. Wallet access only describes the login and signing route. Frontends, protocols, contracts, sanctions rules, liquidity, bridges and account state can still affect access, execution, withdrawal or recovery.",
      },
    ],
  },
};

const TOPIC_SOURCE_REVIEW_DATE = "2026-09-04T19:59:35Z";
const TOPIC_RELATED_LINKS = {
  "derivatives": ["/compare/binance-vs-okx", "/compare/bybit-vs-bitget", "/compare/hyperliquid-vs-dydx", "/exchanges/binance", "/exchanges/bybit", "/exchanges/hyperliquid", "/topics/no-kyc", "/topics/tokenized-stocks-vs-perpetuals"],
  "no-kyc": ["/compare/hyperliquid-vs-dydx", "/exchanges/hyperliquid", "/exchanges/dydx", "/exchanges/mexc"],
};
const TOKENIZED_ASSET_LOCALES = ["en", "zh-Hans"];
const TOKENIZED_ASSET_REVIEW_DATE = "2026-09-15";
const TOKENIZED_ASSET_SOURCE_URLS = [
  "https://www.sec.gov/newsroom/speeches-statements/peirce-tokenization-070925",
  "https://securitize.io/",
  "https://docs.ondo.finance/",
  "https://digitalassets.franklintempleton.com/",
  "https://www.coinbase.com/blog/coinbase-launches-stock-perpetual-futures",
  "https://www.coinbase.com/blog/system-update-the-future-of-finance-is-on-coinbase",
];
const TOKENIZED_ASSET_REGISTRY = {
	  "tokenized-assets": {
	    slug: "tokenized-assets",
	    titleEn: "Tokenized Assets Hub: Treasury, Stock and Perp Exposure Checks",
	    titleZh: "代币化资产研究中心：美债、股票与永续合约敞口",
	    descEn: "Compare tokenized assets by legal claim, issuer or broker model, custody, redemption, eligibility, settlement path and derivative risk.",
	    descZh: "来源绑定的代币化资产地图，覆盖代币化美债、股票代币化访问与股票永续合约。注册前先核对法律形态、托管、赎回、平台准入和产品资格。",
	    faqEn: [
	      ["What is the first question before choosing a tokenized asset platform?", "Ask what the token legally represents. A fund share, note, security entitlement, derivative and synthetic perpetual can all look similar in a trading interface, but custody, redemption, investor rights and regional eligibility are different."],
	      ["Why check Factbook before signup?", "Tokenized assets are decision-heavy products. Factbook pages help verify venue identity, product scope and official-domain routing before a user leaves NexuAlpha for an account flow."],
	      ["Where should a tokenized Treasury search continue from the hub?", "Use the tokenized Treasuries topic for the ongoing issuer, recordkeeper, custodian and redemption checklist, then use the dated news explainer for the source trail behind BUIDL, BENJI, OUSG-style exposure and access-risk terms."],
	      ["What should a broad tokenized assets search compare first?", "Start by classifying the product as a fund share, security entitlement, note, tokenized claim, stock perpetual or other synthetic exposure. The next checks are issuer, recordkeeper, custodian, redemption, eligibility and venue access."],
	      ["Why does NexuAlpha split tokenized Treasuries from tokenized stocks and stock perps?", "The legal claim, custody record, redemption process, shareholder rights, funding and liquidation mechanics differ. A single tokenized-asset label is too broad for registration or trading decisions."],
	    ],
    faqZh: [
      ["选择代币化资产平台前，第一个问题是什么？", "先问这个代币在法律上代表什么。基金份额、票据、证券权益、衍生品和合成永续在交易界面上可能很像，但托管、赎回、投资者权利和地区资格完全不同。"],
      ["为什么开户注册前要先看事实库？", "代币化资产属于高决策成本产品。事实库页面先帮助用户核对平台身份、产品范围和官方域名，再决定是否离开 NexuAlpha 进入开户流程。"],
      ["从研究中心继续核对代币化美债时应去哪里？", "先用代币化美债主题页持续核对发行方、登记方、托管方与赎回清单，再用带日期的新闻解释页查看 BUIDL、BENJI、OUSG 类敞口与准入风险的来源链。"],
    ],
    relatedLinks: ["/topics/tokenized-treasuries", "/news/tokenized-treasuries-structure-access-risks", "/topics/tokenized-stocks-vs-perpetuals", "/factbook/coinbase", "/factbook/kraken", "/methodology"],
  },
  "tokenized-treasuries": {
    slug: "tokenized-treasuries",
    titleEn: "Tokenized Treasury Checklist: BUIDL, OUSG, BENJI, Redemption and Custody",
    titleZh: "代币化美债核对清单：发行方、托管、赎回与资格",
    descEn: "Tokenized treasury searches: issuer, legal wrapper, recordkeeper, custodian, redemption, transfer, permitted-chain, collateral treatment and eligibility checks.",
    descZh: "按发行方、法律载体、官方登记方、托管方、投资者资格、赎回流程、转让限制、许可链和抵押品处理比较代币化美债产品，不把收益型代币简单当作现金等价物。",
    faqEn: [
      ["Are tokenized Treasuries the same as holding Treasury bills directly?", "No. The user usually holds a tokenized claim, fund share, note or recordkeeping token governed by product documents. Direct Treasury ownership, fund shares and tokenized notes have different rights and redemption paths."],
      ["What should be verified before using a tokenized Treasury product as collateral?", "Verify issuer approval, wallet eligibility, permitted chains, transfer restrictions, valuation method, margin haircut, redemption timing and what happens if the platform, custodian or chain is unavailable."],
      ["Which sources should come before comparing tokenized Treasury yield?", "Open the issuer or fund page, SEC or offering record, transfer-agent or recordkeeper source, official token-address list, redemption terms and account-eligibility screen before comparing yield, fees or collateral usefulness."],
      ["Should a tokenized Treasury query land on the article or the topic checklist?", "Use the article for a dated source-reading explainer and use this topic page for the evergreen checklist. The article preserves the source trail; the topic page keeps issuer, recordkeeper, custody, redemption, chain and collateral checks grouped for comparison."],
      ["What should a tokenized treasury searcher check first?", "Start with the legal wrapper and recordkeeper: identify whether the token represents a fund share, note, platform claim or bookkeeping token, then verify issuer, transfer agent, custodian, eligibility and redemption route."],
      ["When should I use the tokenized Treasuries article instead of this checklist?", "Use the article for the dated source trail behind BUIDL, BENJI and OUSG-style exposure; use this checklist when comparing ongoing issuer, custody, redemption, chain and collateral conditions."],
    ],
    faqZh: [
      ["代币化美债等于直接持有美国国债吗？", "不是。用户通常持有受产品文件约束的代币化权益、基金份额、票据或登记代币。直接持有国债、持有基金份额和持有代币化票据的权利与赎回路径不同。"],
      ["把代币化美债作为抵押品前要核对什么？", "要核对发行方审批、钱包资格、允许链、转让限制、估值方式、抵押折扣、赎回时间，以及平台、托管方或链不可用时的处理方式。"],
      ["比较代币化美债收益前应先看哪些来源？", "先打开发行方或基金页面、SEC 或发行文件、转让代理或登记方来源、官方 token 地址列表、赎回条款和账户资格页面，再比较收益、费用或抵押用途。"],
      ["代币化美债查询应该看文章还是主题清单？", "文章用于带日期的来源解读，主题页用于长期清单。文章保留来源链，主题页把发行方、登记方、托管、赎回、支持链与抵押检查集中在一起便于比较。"],
    ],
    relatedLinks: ["/topics/tokenized-assets", "/news/tokenized-treasuries-structure-access-risks", "/topics/tokenized-stocks-vs-perpetuals", "/research/wave48-tokenized-treasury-rights-ops.json", "/factbook/coinbase", "/factbook/kraken", "/methodology"],
  },
	  "tokenized-stocks-vs-perpetuals": {
	    slug: "tokenized-stocks-vs-perpetuals",
	    titleEn: "Tokenized Stocks vs Stock Perps: Rights and Liquidation",
	    titleZh: "股票代币化 vs 股票永续：所有权、合成敞口与强平风险",
	    descEn: "Compare tokenized stock claims with stock perpetuals by ownership rights, custody, dividends, funding, margin, liquidation, eligibility and venue access.",
	    descZh: "区分股票代币化权益和股票永续合约。选择平台前，先比较股东权利、托管、合资格地区、资金费率、杠杆、强平和指数构成。",
	    faqEn: [
	      ["Are tokenized stocks and stock perpetuals the same product?", "No. A tokenized stock may represent an issuer or broker entitlement linked to equity; a stock perpetual is a derivative with funding, margin and liquidation risk. Verify the legal claim before comparing price exposure, and treat xStocks, stock futures and copy-trading labels as separate products."],
	      ["What should I check first for tokenized stock searches?", "Start with whether the product claims shareholder rights, broker custody, issuer-backed entitlement, dividend handling, transfer controls and regional eligibility. Then compare those facts with the official product screen."],
	      ["What should I check first for stock perpetual searches?", "Start with the index or reference market, funding cadence, leverage, margin mode, liquidation rules, trading hours, eligible jurisdiction and venue-specific risk disclosures."],
	      ["Does a stock perpetual give me shareholder rights?", "No. A perpetual future gives derivative price exposure under the platform's contract rules. It does not normally create voting rights, share custody, dividend rights or a direct claim on the underlying stock."],
	      ["When should NexuAlpha route users to a Factbook page instead of a signup CTA?", "Route to Factbook first when product eligibility, derivative status, custody model or regional access is uncertain. The CTA can appear after official-domain, KYC and product-scope checks are visible."],
	      ["What is the fastest way to separate tokenized stocks from stock perps?", "Ask whether the product claims a security entitlement or only tracks price through a derivative contract. Then compare custody or broker records for tokenized stocks against funding, margin and liquidation terms for stock perpetuals."],
	      ["Why does the Bybit vs Bitget comparison link here?", "Stock-related searches around Bybit and Bitget can mix xStocks, stock futures, copy trading and ordinary derivatives. This topic keeps ownership, synthetic exposure and account-route checks separate before any CTA path."],
	    ],
    faqZh: [
      ["股票永续会给我股东权利吗？", "不会。永续合约只是在平台合约规则下提供衍生品价格敞口，通常不产生投票权、股票托管权、股息权或对底层股票的直接权利。"],
      ["什么时候 NexuAlpha 应该先导向事实库，而不是直接开户注册 CTA？", "当产品资格、衍生品属性、托管模型或地区准入不明确时，应先导向事实库。只有官方域名、KYC 和产品范围检查可见后，才适合展示 CTA。"],
    ],
	    relatedLinks: ["/topics/tokenized-assets", "/compare/bybit-vs-bitget", "/news/tokenized-stocks-vs-stock-perpetuals", "/news/tokenized-treasuries-structure-access-risks", "/factbook/coinbase", "/factbook/bybit", "/factbook/bitget", "/methodology"],
	  },
};
const LOCALIZED_VENUE_SEO_OVERRIDES = {
  ja: {
    binance: ["Binance 日本向け手数料・本人確認・商品範囲チェック — NexuAlpha", "Binanceで登録や比較に進む前に、公式手数料表、BNB/VIP条件、本人確認、地域条件、商品範囲、公式告知を確認します。", "Binanceを日本語で確認するとき、登録前に何を見るべきですか？", "まず公式手数料表、BNBまたはVIP条件、本人確認、地域ごとの商品範囲、公式告知を分けて確認します。NexuAlphaの日本語ページは登録導線の前に確認項目を整理するもので、すべてのアカウントに同じ手数料、商品、地域アクセスが適用されるとは約束しません。", [["Binanceの手数料は全ユーザーで同じですか？", "いいえ。公開されるmaker/taker手数料、VIPティア、BNB利用、商品、注文タイプ、地域、アカウント条件によって最終コストは変わる可能性があります。"], ["日本語ページを見るだけで登録資格は確認できますか？", "いいえ。本人確認、地域制限、商品アクセス、キャンペーン条件は、公式ドメイン上の現在のアカウント画面と告知で確認する必要があります。"], ["比較後に何を開くべきですか？", "Binance vs OKXの比較で手数料と商品範囲を見た後、公式ドメイン、本人確認、対象商品、手数料表、登録画面の条件を順番に確認してください。"]]],
  },
  ko: {
    hyperliquid: ["Hyperliquid 수수료, 펀딩 및 계정 구조 확인 — NexuAlpha", "Hyperliquid의 롤링 수수료, 시간별 펀딩, 청산 위험, USDC 담보, 하위 계정, API 지갑 위임, 볼트 참여와 funded account 표현의 경계를 확인하세요.", "Hyperliquid를 사용하기 전에 어떤 수수료와 계정 조건을 먼저 확인해야 하나요?", "Hyperliquid는 공식 수수료표, 시간별 펀딩, 청산 구조, USDC 담보 경로, 계정 모드, 하위 계정, API 지갑 위임과 볼트 문서를 함께 확인해야 합니다. funded account 검색어는 지갑 담보, 계정 권한, 볼트 참여와 제3자 배정 주장으로 나누어 읽어야 합니다.", [["Hyperliquid 수수료는 어떻게 확인하나요?", "공식 수수료 페이지에서 14일 거래량 기준, UTC 일별 산정, perp와 spot 수수료표를 먼저 확인한 뒤 펀딩, 마진 모드와 청산 조건을 같이 확인하세요."], ["Hyperliquid funded account 검색어는 무엇을 구분해야 하나요?", "지갑 담보, USDC 이동, 계정 모드, 하위 계정, API 지갑 위임과 볼트 참여를 분리해야 합니다. 공식 문서만으로 prop-style 배정이나 가입 혜택을 추정하면 안 됩니다."]]],
    uniswap: ["Uniswap 테스트넷, v4 훅과 스왑 경로 확인 — NexuAlpha", "Uniswap 테스트넷, v4 배포, 공식 앱 URL, 토큰 컨트랙트, 풀 수수료, 가스, 지갑 시뮬레이션과 서명 전 검토를 확인하세요.", "Uniswap 테스트넷이나 v4 훅 경로를 실거래 전에 어떻게 확인해야 하나요?", "Uniswap 테스트넷과 로컬 훅 자료는 개발자 연구용입니다. 실제 지갑으로 스왑하기 전에는 공식 앱 URL, 네트워크, 토큰 컨트랙트, v4 배포 주소, 풀 버전, 수수료 티어 또는 dynamic-fee 훅, 가스 토큰, 지갑 시뮬레이션과 최종 서명 내용을 확인해야 합니다.", [["Uniswap 테스트넷 검증이 실거래 안전을 뜻하나요?", "아니요. 테스트넷과 로컬 훅은 개발 환경입니다. 실거래는 공식 앱 URL, 네트워크, 배포 주소, 토큰 컨트랙트, 가스와 최종 지갑 트랜잭션을 다시 확인해야 합니다."], ["Uniswap 수수료는 무엇을 비교해야 하나요?", "v2, v3, v4의 수수료 모델과 풀 동작이 다릅니다. v4 dynamic-fee 또는 훅 동작은 현재 Uniswap 문서와 배포 데이터로 확인해야 합니다."]]],
    aerodrome: ["Aerodrome Base DEX 풀 수수료와 veAERO 조건 확인 — NexuAlpha", "Aerodrome(Base DEX) 풀별 수수료, Slipstream 경로, 토큰 컨트랙트, 가스, veAERO 보상 경계를 확인하세요.", "Aerodrome 경로와 풀 수수료 조건은 어떻게 확인해야 하나요?", "Aerodrome은 Base 네트워크의 DEX 경로로 확인해야 합니다. Base 브리지, 지갑 네트워크, 토큰 컨트랙트, 풀 주소, 표준 풀 또는 Slipstream 풀 유형, 풀별 거래량과 수수료 표시, veAERO 인센티브나 보상 조건을 자금 이동이나 서명 전에 따로 확인하세요.", [["Aerodrome에는 하나의 고정 DEX 수수료가 있나요?", "아니요. 표준 풀, Slipstream 집중 유동성 풀, 인센티브와 veAERO 투표 조건이 실제 비용이나 보상 맥락을 바꿀 수 있으므로 풀 단위로 확인해야 합니다."], ["Aerodrome 스왑만으로 veAERO 보상이 생기나요?", "아니요. 스왑 경로와 veAERO 투표 또는 보상 청구는 별도 흐름입니다. 풀 거래만으로 보상 자격을 추정하면 안 됩니다."]]],
    jupiter: ["Jupiter Solana 스왑 경로, 테스트 견적과 수수료 확인 — NexuAlpha", "Jupiter Swap과 Ultra 경로, 토큰 목록, 경로 실패 원인, 플랫폼 수수료 경계, 슬리피지와 route leg를 확인하세요.", "Jupiter 경로, 테스트 견적과 플랫폼 수수료는 어떻게 확인해야 하나요?", "Jupiter는 Solana 라우팅과 트랜잭션 생성 경로로 보아야 합니다. Swap 또는 Ultra 출력, 토큰 mint 상태, 유동성, 플랫폼 수수료 설정, 슬리피지, 가격 영향, 네트워크 비용과 지갑에 표시되는 모든 route leg를 서명 전에 확인하세요.", [["Jupiter 견적이 보인 뒤에도 스왑이 실패할 수 있나요?", "네. 가격 변동, 유동성 부족, 거래 크기, 토큰 제한 또는 오래된 경로 가격 때문에 실패할 수 있습니다."], ["Jupiter 견적은 최종 비용 보장인가요?", "아니요. 견적은 보관, 실행 또는 최종 비용 보장이 아닙니다. 지갑에서 네트워크 비용, 슬리피지와 route leg를 다시 확인해야 합니다."]]],
  },
  tr: {
    hyperliquid: ["Hyperliquid ücretleri, funding ve hesap yapısı kontrolü — NexuAlpha", "Hyperliquid ücretlerini, saatlik funding'i, likidasyon riskini, USDC teminatını, alt hesapları, vault katılımını ve funded account sınırlarını inceleyin.", "Hyperliquid kullanmadan önce hangi ücret ve hesap koşulları kontrol edilmeli?", "Hyperliquid için resmi rolling ücret çizelgesi, saatlik funding kuralları, likidasyon mantığı, USDC teminat yolu, hesap modu, alt hesaplar, API cüzdan yetkisi ve vault dokümantasyonu birlikte okunmalıdır. Funded account araması cüzdan teminatı, hesap izinleri, vault katılımı ve üçüncü taraf tahsis iddialarını ayırmalıdır.", [["Hyperliquid ücretleri nasıl okunmalı?", "Önce resmi ücret sayfasındaki 14 günlük hacim, UTC gün değerlendirmesi ve perp/spot çizelgelerini kontrol edin; ardından funding, marjin modu ve likidasyon koşullarını birlikte değerlendirin."], ["Hyperliquid funded account ifadesi neyi ayırmalı?", "Cüzdan teminatı, USDC hareketi, hesap modu, alt hesaplar, API cüzdan yetkisi ve vault katılımı ayrılmalıdır. Resmi dokümanlar bu ifadeyi prop-style tahsis veya kayıt hakkına dönüştürmez."]]],
    uniswap: ["Uniswap testnet, v4 hook ve swap rota kontrolleri — NexuAlpha", "Uniswap testnet, v4 dağıtımları, resmi uygulama URL'si, token kontratları, pool ücretleri, gas, cüzdan simülasyonu ve imza öncesi kontrolleri inceleyin.", "Uniswap testnet veya v4 hook rotası canlı swap öncesi nasıl araştırılmalı?", "Uniswap testnet ve yerel hook materyali geliştirici araştırmasıdır; canlı cüzdan rotasının güvenli olduğunu kanıtlamaz. Resmi uygulama URL'si, ağ, token kontratı, v4 dağıtım haritası, pool sürümü, ücret seviyesi veya dynamic-fee hook, gas tokenı, cüzdan simülasyonu ve son imza ekranı ayrı kontrol edilmelidir.", [["Uniswap testnet araştırması canlı swap güvenliği sağlar mı?", "Hayır. Testnet ve yerel hook rehberleri geliştirici yollarıdır. Canlı rota için resmi app URL'si, ağ, dağıtım adresi, token kontratı, gas ve son cüzdan işlemi yeniden kontrol edilmelidir."], ["Uniswap ücretlerinde hangi sürümler karşılaştırılmalı?", "v2, v3 ve v4 ücret modeli ve pool davranışı ayrıdır. v4 dynamic-fee veya hook davranışı güncel Uniswap dokümantasyonu ve dağıtım verisiyle doğrulanmalıdır."]]],
    aerodrome: ["Aerodrome Base DEX pool ücretleri ve veAERO kontrolleri — NexuAlpha", "Aerodrome'u Base-native DEX olarak inceleyin: pool bazlı ücretler, Slipstream rotası, hacim, token kontratları, Base gas, teşvikler ve veAERO ödül sınırları.", "Aerodrome rota ve pool ücret koşulları nasıl kontrol edilmeli?", "Aerodrome bir Base-native DEX rotası olarak kontrol edilmelidir. Base bridge yolu, cüzdan ağı, token kontratı, pool adresi, standart veya Slipstream pool tipi, pool bazlı hacim ve ücret görünümü ile veAERO teşvik veya ödül koşulları fon taşımadan ya da imza atmadan önce doğrulanmalıdır.", [["Aerodrome'da tek bir DEX ücreti var mı?", "Hayır. Standart pool, Slipstream yoğun likidite pool'u, teşvikler ve veAERO oylaması pratik maliyet veya ödül bağlamını değiştirebilir; kontrol pool düzeyinde yapılmalıdır."], ["Aerodrome swap işlemi veAERO ödülü doğurur mu?", "Hayır. Swap rotası ile veAERO oylama veya ödül hakları ayrı akışlardır. Bir pool işlemi tek başına ödül hakkı sayılmamalıdır."]]],
    jupiter: ["Jupiter Solana swap rotaları, test quote ve ücret kontrolleri — NexuAlpha", "Jupiter Swap ve Ultra rotalarını, token listesini, rota hata nedenlerini, platform ücreti sınırlarını, slippage'i ve rota bacaklarını inceleyin.", "Jupiter rota, test quote ve platform ücretleri nasıl kontrol edilmeli?", "Jupiter bir Solana rota ve işlem oluşturma yoludur. Swap veya Ultra çıktısı, token mint durumu, likidite, platform ücreti yapılandırması, slippage, fiyat etkisi, ağ maliyeti ve cüzdandaki her rota bacağı imza öncesinde kontrol edilmelidir; quote saklama veya nihai maliyet garantisi değildir.", [["Jupiter quote göründükten sonra swap neden başarısız olabilir?", "Fiyatın yürütmeden önce değişmesi, likiditenin yetersiz olması, işlem boyutunun uygun olmaması, token kısıtları veya rota fiyatının bayatlaması başarısızlığa yol açabilir."], ["Jupiter quote nihai maliyet garantisi midir?", "Hayır. Quote saklama, yürütme veya nihai maliyet garantisi değildir. Ağ maliyeti, slippage ve rota bacakları cüzdanda yeniden kontrol edilmelidir."]]],
  },
};
const LOCALIZED_COMPARE_SEO_OVERRIDES = {
  ja: { "bybit-vs-bitget": ["Bybit vs Bitget：株式型商品、コピー取引、手数料と口座確認 — NexuAlpha", "Bybit と Bitget を商品ラベル、xStocks、株式先物、コピー取引、手数料、KYC、地域条件、登録画面で比較します。", "登録前に Bybit と Bitget をどう比較すべきですか？", "まず通常の暗号資産デリバティブ、xStocks 型エクスポージャー、株式先物、コピー取引、初回口座開設ルートを分け、商品別手数料表、KYC、地域条件、公式登録画面を確認してください。", [["Bybit vs Bitget は実際の株式を買えるという意味ですか？", "いいえ。証券、トークン化エクスポージャー、株式先物、コピー取引、地域別アカウント権限を分けて確認してください。"], ["最初に比較すべき手数料は何ですか？", "商品別の公式手数料表です。xStocks、先物、コピー取引は普通の暗号資産現物手数料だけでは判断できません。"]]] },
  ko: { "bybit-vs-bitget": ["Bybit vs Bitget: 수수료, 카피트레이딩과 주식형 노출 확인 — NexuAlpha", "Bybit과 Bitget의 수수료, 파생상품, 카피트레이딩, tokenized stock 또는 stock-perp 노출, KYC, 지역 접근성과 가입 조건을 비교하세요.", "가입 전에 Bybit과 Bitget을 어떻게 비교해야 하나요?", "Bybit과 Bitget은 공개 수수료표, 파생상품 도구, 카피트레이딩 흐름, 주식 토큰·tokenized stock·stock perp 노출 경계, KYC, 지역 이용 가능성, 공식 가입 조건으로 비교해야 합니다. 주식 관련 검색은 CTA 사용 전 현재 계정 조건으로 다시 확인하세요.", [["Bybit vs Bitget 비교가 실제 주식 거래 가능성을 뜻하나요?", "아니요. 실제 증권, tokenized stock, stock perpetual, 카피트레이딩 상품과 지역 계정 가능성을 분리해서 확인해야 합니다."], ["카피트레이딩 CTA 전 무엇을 확인해야 하나요?", "KYC 수준, 지역, 상품 권한, 수수료표, lead trader 규칙과 공식 가입 조건을 확인하세요. 공개 비교는 동일한 접근성을 보장하지 않습니다."]]] },
  tr: { "bybit-vs-bitget": ["Bybit vs Bitget: ücretler, copy trading ve hisse benzeri ürün kontrolleri — NexuAlpha", "Bybit ve Bitget ücretlerini, türevleri, copy trading'i, tokenized stock veya stock-perp maruziyetini, KYC'yi, bölgesel erişimi ve kayıt koşullarını karşılaştırın.", "Kayıt olmadan önce Bybit ve Bitget nasıl karşılaştırılmalı?", "Bybit ve Bitget; yayımlanmış ücret çizelgeleri, türev araçları, copy trading akışı, hisse tokenı, tokenized stock veya stock-perp ürün sınırları, KYC, bölgesel uygunluk ve resmi kayıt koşullarıyla karşılaştırılmalıdır. Hisseyle ilgili bir arama, CTA kullanılmadan önce güncel hesap koşullarıyla kontrol edilmelidir.", [["Bybit vs Bitget gerçek hisse erişimi anlamına gelir mi?", "Hayır. Gerçek menkul kıymet, tokenized stock, stock perpetual, copy trading ürünü ve bölgesel hesap erişimi ayrı ayrı kontrol edilmelidir."], ["Copy trading CTA'sı öncesi hangi kontroller gerekir?", "KYC seviyesi, bölge, ürün izinleri, ücret çizelgesi, lead trader kuralları ve resmi kayıt koşulları kontrol edilmelidir. Kamuya açık karşılaştırma aynı erişimi garanti etmez."]]] },
  ar: { "bybit-vs-bitget": ["Bybit مقابل Bitget: المنتجات الشبيهة بالأسهم ونسخ التداول والرسوم — NexuAlpha", "قارن Bybit وBitget حسب مسار المنتج، xStocks، عقود الأسهم، نسخ التداول، الرسوم، KYC، المنطقة وشاشة التسجيل الرسمية.", "كيف أقارن Bybit وBitget قبل التسجيل؟", "افصل بين عقود العملات المشفرة والتعرض الشبيه بالأسهم وعقود الأسهم ونسخ التداول، ثم راجع جدول الرسوم حسب المنتج وKYC والمنطقة وشاشة التسجيل الرسمية.", [["هل تعني مقارنة Bybit وBitget أن الأسهم الحقيقية متاحة؟", "لا. افصل بين الأوراق المالية، التعرض المرمز، عقود الأسهم، نسخ التداول وصلاحيات الحساب حسب المنطقة."], ["ما الرسوم التي يجب مقارنتها أولاً؟", "ابدأ بجدول الرسوم الرسمي حسب المنتج. xStocks والعقود ونسخ التداول لا تكفي لها رسوم spot العامة وحدها."]]] },
};
const LOCALIZED_TOPIC_SEO_OVERRIDES = {
  en: {
    "derivatives": ["Crypto Perpetual Platform Comparison: Fees, Funding and Liquidation Checks — NexuAlpha", "Perpetual platform checks: published fees, funding, margin mode, liquidation rules, oracle route, collateral movement, regional access and product permissions.", "What is a crypto perpetual platform, and how should I compare one?", "A crypto perpetual platform lets users trade contracts with no fixed expiry. Compare platform type first: account-based CEX futures such as Binance or Bybit require fee, funding, margin mode, KYC, region and product-permission checks, while wallet-connected perpetual protocols such as Hyperliquid require collateral, oracle, bridge, liquidation and front-end checks. Use Binance vs OKX or Bybit vs Bitget for account-based decisions, Hyperliquid vs dYdX for wallet-connected mechanics, and the tokenized-stock guide when the search intent mixes stock-like exposure with derivatives.", [["Which page should I use after a broad crypto perpetual platform search?", "Use this derivatives topic as the evergreen checklist, then continue to Binance vs OKX for account-based CEX futures, Bybit vs Bitget for derivatives and copy-trading conditions, or Hyperliquid vs dYdX for wallet-connected perpetual mechanics."], ["Should funding rates decide the perpetual platform choice?", "No. Funding is one input. Compare maker and taker fees, funding cadence, liquidity, collateral movement, margin mode, liquidation rules, oracle route, withdrawal path, region and identity requirements before choosing a route."], ["Which mechanics should every perpetual checklist cover?", "Check funding cadence, isolated or cross margin, accepted collateral, oracle or mark-price route, liquidation rules, insurance or ADL disclosures, deposit and withdrawal path, and product access by region before treating a platform as usable."], ["Does a public comparison prove my account can trade perpetuals?", "No. Public comparison narrows the decision path. Final product access, KYC, country availability, benefits, leverage and fee tier must be verified in the official platform account or wallet flow."]]],
    "no-kyc": ["No-KYC Self-Custody vs KYC Exchange (2026): Hyperliquid, dYdX and MEXC — NexuAlpha", "Compare wallet access, CEX account flows, withdrawals, regional limits, sanctions controls, front-end availability and liquidation risk before treating any crypto platform as no-KYC.", "What should I check before using a no-KYC crypto platform?", "Start by separating wallet-connected protocols from centralized accounts. Check whether access depends on a front end, smart contract, bridge, liquidity route, withdrawal limit, regional restriction, sanctions control, wallet screening, product type or later identity review. No-KYC is a current access condition, not a permanent account promise.", [["Does wallet connection mean no KYC forever?", "No. Wallet connection describes how a user signs transactions. A protocol, front end, bridge, region rule, sanctions screen or risk control can still limit access, and centralized platforms may request identity checks later."], ["Which page should I use after the no-KYC overview?", "Use the Hyperliquid vs dYdX comparison for perpetual mechanics, then open each venue profile to verify official domains, collateral, liquidation, bridge, withdrawal and regional conditions."], ["Can a centralized exchange be treated as no-KYC?", "Only with caution. Email or low-friction onboarding can change by region, limit, product, withdrawal route, account age and risk review. Verify the current official account flow before depositing or trading."]]]
  },
  ko: { "no-kyc": ["KYC 없는 셀프 커스터디 vs KYC 필수 거래소(2026): Hyperliquid, dYdX, MEXC 비교 — NexuAlpha", "지갑 연결, 계정 가입, 본인확인 가능성, 출금, 지역 제한과 리스크 경계를 Hyperliquid, dYdX, MEXC 기준으로 비교하세요.", "No-KYC 암호화폐 플랫폼을 비교할 때 무엇을 먼저 확인해야 하나요?", "No-KYC 비교는 로그인 방식보다 넓게 봐야 합니다. 지갑 연결, 계정 가입, 추가 본인확인 가능성, 출금 제한, 지역 차단, 프런트엔드 접근, 스마트 컨트랙트, 브리지, 유동성과 복구 경로를 함께 확인하세요.", [["지갑 연결은 KYC와 지역 제한이 없다는 뜻인가요?", "아니요. 지갑 연결은 로그인 경로일 뿐입니다. 프런트엔드, 프로토콜, 제재 규칙, 유동성, 브리지와 계정 상태가 접근과 출금을 제한할 수 있습니다."], ["이메일 가입 CEX는 출금 때 KYC가 없나요?", "항상 그렇지 않습니다. 지역, 한도, 계정 상태와 리스크 관리에 따라 추가 신원 또는 보안 확인이 요구될 수 있습니다."]]] },
  tr: { "no-kyc": ["KYC’siz öz saklama vs KYC zorunlu borsa (2026): Hyperliquid, dYdX ve MEXC — NexuAlpha", "Cüzdan bağlantısı, hesap kaydı, kimlik kontrolü olasılığı, çekim, bölgesel sınırlamalar ve risk sınırlarını Hyperliquid, dYdX ve MEXC üzerinden karşılaştırın.", "No-KYC kripto platformları karşılaştırılırken önce ne kontrol edilmeli?", "No-KYC karşılaştırması yalnızca giriş yönteminden ibaret değildir. Cüzdan bağlantısı, hesap kaydı, ek kimlik kontrolü olasılığı, çekim limitleri, bölgesel bloklar, frontend erişimi, akıllı kontratlar, bridge, likidite ve kurtarma yolu birlikte kontrol edilmelidir.", [["Cüzdan bağlantısı KYC veya bölge sınırı olmadığı anlamına gelir mi?", "Hayır. Cüzdan bağlantısı yalnızca giriş ve imza yolunu anlatır. Frontend, protokol, yaptırım kuralları, likidite, bridge ve hesap durumu erişimi veya çekimi etkileyebilir."], ["E-posta ile kayıt olunan CEX çekimde KYC istemez mi?", "Her zaman değil. Bölge, limit, hesap durumu ve risk kontrollerine göre ek kimlik veya güvenlik doğrulaması istenebilir."]]] },
};

const TOPIC_METADATA_LOCALIZED_PACK = {
  "zh-Hant": {
    "meme-coins": ["迷因幣平台比較：MEXC、Gate.io、Raydium — NexuAlpha", "比較迷因幣平台的上幣節奏、流動性、池子檢查、交易成本、合約地址和地區帳戶條件。"],
    "compliant-exchanges": ["法幣通道與帳戶資格：HashKey、Kraken、OKX — NexuAlpha", "比較地區資格、身份核驗、同名銀行要求、法幣通道和官方規則來源，並區分銀行、平台和監管條件。"],
    derivatives: ["加密永續合約平台比較：費率、資金費與清算檢查 — NexuAlpha", "按帳戶模式、公開費率、資金費、保證金模式、清算規則、預言機、地區限制與身份要求比較永續合約平台。"],
    "no-kyc": ["2026 免實名自託管 vs 實名交易所：Hyperliquid、dYdX 與 MEXC 比較 — NexuAlpha", "比較錢包連接、中心化帳戶流程、出金、地區限制、制裁控制、前端可用性和清算風險。"],
  },
  es: {
    "meme-coins": ["Comparación de plataformas meme coin: MEXC, Gate.io y Raydium — NexuAlpha", "Compara acceso, liquidez, costes, contratos de tokens, rutas de pools y condiciones de cuenta para operar meme coins."],
    "compliant-exchanges": ["Acceso fiat y elegibilidad de cuenta: HashKey, Kraken y OKX — NexuAlpha", "Compara elegibilidad regional, identidad, banca a mismo nombre, rutas fiat y fuentes oficiales antes de elegir plataforma."],
    derivatives: ["Comparación de plataformas perpetuas cripto: comisiones, funding y liquidación — NexuAlpha", "Compara plataformas perpetuas por modelo de cuenta, comisiones publicadas, funding, margen, liquidación, oráculos y acceso regional."],
    "no-kyc": ["Autocustodia sin KYC vs exchange con KYC (2026): Hyperliquid, dYdX y MEXC — NexuAlpha", "Compara acceso con wallet, cuentas CEX, retiros, límites regionales, controles de sanciones, front ends y riesgo de liquidación."],
  },
  "pt-BR": {
    "meme-coins": ["Comparação de plataformas meme coin: MEXC, Gate.io e Raydium — NexuAlpha", "Compare acesso, liquidez, custos, contratos de token, rotas de pools e condições de conta para meme coins."],
    "compliant-exchanges": ["Acesso fiat e elegibilidade de conta: HashKey, Kraken e OKX — NexuAlpha", "Compare elegibilidade regional, identidade, banco em mesmo nome, rotas fiat e fontes oficiais antes de escolher uma plataforma."],
    derivatives: ["Comparação de plataformas perpétuas cripto: taxas, funding e liquidação — NexuAlpha", "Compare plataformas perpétuas por modelo de conta, taxas publicadas, funding, margem, liquidação, oráculos e acesso regional."],
    "no-kyc": ["Autocustódia sem KYC vs exchange com KYC (2026): Hyperliquid, dYdX e MEXC — NexuAlpha", "Compare acesso por carteira, contas CEX, saques, limites regionais, controles de sanções, front ends e risco de liquidação."],
  },
  fr: {
    "meme-coins": ["Comparatif des plateformes meme coin : MEXC, Gate.io et Raydium — NexuAlpha", "Comparez accès, liquidité, frais, contrats de tokens, pools et conditions de compte pour les meme coins."],
    "compliant-exchanges": ["Accès fiat et éligibilité de compte : HashKey, Kraken et OKX — NexuAlpha", "Comparez éligibilité régionale, identité, banque au même nom, rails fiat et sources officielles avant de choisir."],
    derivatives: ["Comparatif des plateformes perpétuelles crypto : frais, funding et liquidation — NexuAlpha", "Comparez les plateformes perpétuelles par compte, frais publiés, funding, marge, liquidation, oracle et accès régional."],
    "no-kyc": ["Auto-garde sans KYC vs exchange avec KYC (2026) : Hyperliquid, dYdX et MEXC — NexuAlpha", "Comparez l’accès wallet, les comptes CEX, retraits, limites régionales, contrôles de sanctions, front ends et risque de liquidation."],
  },
  de: {
    "meme-coins": ["Meme-Coin-Plattformvergleich: MEXC, Gate.io und Raydium — NexuAlpha", "Vergleichen Sie Zugang, Liquidität, Kosten, Token-Verträge, Pool-Routen und Kontobedingungen für Meme Coins."],
    "compliant-exchanges": ["Fiat-Zugang und Kontoeignung: HashKey, Kraken und OKX — NexuAlpha", "Vergleichen Sie regionale Eignung, Identität, gleichnamige Bankkonten, Fiat-Wege und offizielle Quellen vor der Wahl."],
    derivatives: ["Krypto-Perpetual-Plattformen: Gebühren, Funding und Liquidation — NexuAlpha", "Vergleichen Sie Perpetual-Plattformen nach Kontomodell, Gebühren, Funding, Margin, Liquidation, Oracle und regionalem Zugang."],
    "no-kyc": ["Selbstverwahrung ohne KYC vs Börse mit KYC (2026): Hyperliquid, dYdX und MEXC — NexuAlpha", "Vergleichen Sie Wallet-Zugang, CEX-Konten, Auszahlungen, regionale Grenzen, Sanktionsprüfungen, Frontends und Liquidationsrisiko."],
  },
  ja: {
    "meme-coins": ["ミームコイン取引プラットフォーム比較：MEXC、Gate.io、Raydium — NexuAlpha", "ミームコインの上場、流動性、手数料、トークンコントラクト、プール経路、口座条件を比較します。"],
    "compliant-exchanges": ["法定通貨アクセスと口座適格性：HashKey、Kraken、OKX — NexuAlpha", "地域適格性、本人確認、同名義銀行、法定通貨ルート、公式ルール情報を比較します。"],
    derivatives: ["暗号資産パーペチュアル比較：手数料、資金調達率、清算チェック — NexuAlpha", "口座モデル、公開手数料、資金調達率、証拠金、清算、オラクル、地域条件で比較します。"],
    "no-kyc": ["本人確認なしの自己管理 vs 本人確認必須の取引所（2026）：Hyperliquid、dYdX、MEXC比較 — NexuAlpha", "ウォレット接続、CEX口座、出金、地域制限、制裁チェック、フロントエンド、清算リスクを比較します。"],
  },
  ko: {
    "meme-coins": ["밈코인 플랫폼 비교: MEXC, Gate.io, Raydium — NexuAlpha", "밈코인 상장, 유동성, 비용, 토큰 계약, 풀 경로와 계정 조건을 비교하세요."],
    "compliant-exchanges": ["법정화폐 접근성과 계정 자격: HashKey, Kraken, OKX — NexuAlpha", "지역 자격, 본인확인, 동일 명의 은행, 법정화폐 경로와 공식 규칙 출처를 비교하세요."],
    derivatives: ["크립토 무기한 계약 플랫폼 비교: 수수료, 펀딩과 청산 — NexuAlpha", "계정 모델, 공개 수수료, 펀딩, 마진, 청산, 오라클, 지역 접근과 신원 요구 사항을 비교하세요."],
  },
  ar: {
    "meme-coins": [
      "مقارنة منصات عملات الميم: العقد والسيولة ومسار الخروج — NexuAlpha",
      "قارن MEXC وGate.io وRaydium حسب عقد الرمز والسيولة والتكاليف المنشورة وتفويض المحفظة وشروط الخروج، مع التحقق من الحساب والمنطقة في المصدر الرسمي.",
      "ما أول شيء يجب فحصه عند اختيار منصة لعملة ميم؟",
      "ابدأ بعقد الرمز وزوج التداول والسيولة أو دفتر الأوامر وشبكات الإيداع والسحب. بعد ذلك تحقق من KYC والمنطقة وشروط الحساب والرسوم المنشورة في الصفحة الرسمية الحالية. لا تجعل سرعة الإدراج أو عنواناً تسويقياً بديلاً عن فحص العقد والسيولة ومسار الخروج.",
      [
        ["كيف أقارن MEXC وGate.io وRaydium لعملات الميم؟", "افصل مسار CEX عن مسار DEX. في CEX تحقق من الإعلان والزوج وعمق دفتر الأوامر والحساب والمنطقة. في DEX تحقق من عنوان الرمز والمجمع والتفويض وتأثير السعر ومسار الخروج."],
        ["هل يوجد انزلاق آمن ثابت لتداول عملات الميم على DEX؟", "لا. لا توجد نسبة واحدة آمنة لكل مجمع. تحقق من عنوان الرمز والمجمع ونتيجة التسعير وتأثير السعر والمسار وحالة الشبكة قبل توقيع الصفقة."],
        ["هل تعرض هذه الصفحة رابط تسجيل أو وعد خصم لعملات الميم؟", "لا. هذه الصفحة تبقي المقارنة بحثية. أي مسار تسجيل أو منفعة مستخدم يجب أن يأتي من سجل NexuAlpha التجاري المحمي وأن يتم التحقق منه في الشروط الرسمية الحالية."],
      ],
    ],
    "compliant-exchanges": ["الوصول إلى العملات التقليدية وأهلية الحساب: HashKey وKraken وOKX — NexuAlpha", "قارن الأهلية الإقليمية والهوية ومتطلبات الحساب البنكي ومسارات العملات التقليدية والمصادر الرسمية."],
    derivatives: ["مقارنة منصات العقود الدائمة: الرسوم والتمويل والتصفية — NexuAlpha", "قارن منصات العقود الدائمة حسب نموذج الحساب والرسوم المنشورة والتمويل والهامش والتصفية والأوراكل والوصول الإقليمي."],
    "no-kyc": ["حفظ ذاتي دون KYC مقابل منصة تتطلب KYC (2026): Hyperliquid وdYdX وMEXC — NexuAlpha", "قارن اتصال المحفظة وحسابات CEX والسحب والحدود الإقليمية وفحص العقوبات والواجهات ومخاطر التصفية."],
  },
  tr: {
    "meme-coins": ["Meme coin platform karşılaştırması: MEXC, Gate.io ve Raydium — NexuAlpha", "Meme coin erişimini, likiditeyi, maliyetleri, token kontratlarını, pool rotalarını ve hesap koşullarını karşılaştırın."],
    "compliant-exchanges": ["Fiat erişimi ve hesap uygunluğu: HashKey, Kraken ve OKX — NexuAlpha", "Bölgesel uygunluk, kimlik, aynı isimli banka, fiat yolları ve resmi kural kaynaklarını karşılaştırın."],
    derivatives: ["Kripto perpetual platform karşılaştırması: ücretler, funding ve likidasyon — NexuAlpha", "Perpetual platformları hesap modeli, yayınlanmış ücretler, funding, marjin, likidasyon, oracle ve bölgesel erişime göre karşılaştırın."],
  },
  ru: {
    "meme-coins": ["Сравнение платформ для meme coin: MEXC, Gate.io и Raydium — NexuAlpha", "Сравните доступ, ликвидность, комиссии, контракты токенов, маршруты пулов и условия аккаунта для meme coin."],
    "compliant-exchanges": ["Фиатный доступ и условия аккаунта: HashKey, Kraken и OKX — NexuAlpha", "Сравните региональную доступность, идентификацию, одноимённый банк, фиатные маршруты и официальные источники."],
    derivatives: ["Сравнение крипто-перпетуалов: комиссии, funding и ликвидация — NexuAlpha", "Сравните perpetual-платформы по модели аккаунта, комиссиям, funding, марже, ликвидации, oracle и региональному доступу."],
    "no-kyc": ["Самостоятельное хранение без KYC vs биржа с KYC (2026): Hyperliquid, dYdX и MEXC — NexuAlpha", "Сравните wallet-доступ, CEX-аккаунты, вывод, региональные лимиты, санкционные проверки, фронтенды и риск ликвидации."],
  },
  id: {
    "meme-coins": ["Perbandingan platform meme coin: MEXC, Gate.io, dan Raydium — NexuAlpha", "Bandingkan akses, likuiditas, biaya, kontrak token, rute pool, dan ketentuan akun untuk meme coin."],
    "compliant-exchanges": ["Akses fiat dan kelayakan akun: HashKey, Kraken, dan OKX — NexuAlpha", "Bandingkan kelayakan regional, identitas, bank atas nama sama, jalur fiat, dan sumber aturan resmi."],
    derivatives: ["Perbandingan platform perpetual kripto: biaya, funding, dan likuidasi — NexuAlpha", "Bandingkan platform perpetual menurut model akun, biaya publik, funding, margin, likuidasi, oracle, dan akses regional."],
    "no-kyc": ["Swakelola tanpa KYC vs bursa dengan KYC (2026): Hyperliquid, dYdX, dan MEXC — NexuAlpha", "Bandingkan akses dompet, akun CEX, penarikan, batas regional, kontrol sanksi, front end, dan risiko likuidasi."],
  },
  vi: {
    "meme-coins": ["So sánh nền tảng meme coin: MEXC, Gate.io và Raydium — NexuAlpha", "So sánh quyền truy cập, thanh khoản, chi phí, hợp đồng token, tuyến pool và điều kiện tài khoản cho meme coin."],
    "compliant-exchanges": ["Truy cập fiat và điều kiện tài khoản: HashKey, Kraken và OKX — NexuAlpha", "So sánh điều kiện khu vực, danh tính, ngân hàng cùng tên, tuyến fiat và nguồn quy tắc chính thức."],
    derivatives: ["So sánh nền tảng perpetual crypto: phí, funding và thanh lý — NexuAlpha", "So sánh nền tảng perpetual theo mô hình tài khoản, phí công bố, funding, ký quỹ, thanh lý, oracle và truy cập khu vực."],
    "no-kyc": ["Tự lưu ký không KYC vs sàn yêu cầu KYC (2026): Hyperliquid, dYdX và MEXC — NexuAlpha", "So sánh kết nối ví, tài khoản CEX, rút tiền, giới hạn khu vực, kiểm soát trừng phạt, front end và rủi ro thanh lý."],
  },
  it: {
    "meme-coins": ["Confronto piattaforme meme coin: MEXC, Gate.io e Raydium — NexuAlpha", "Confronta accesso, liquidità, costi, contratti token, pool e condizioni account per le meme coin."],
    "compliant-exchanges": ["Accesso fiat e idoneità account: HashKey, Kraken e OKX — NexuAlpha", "Confronta idoneità regionale, identità, banca con stesso nome, percorsi fiat e fonti ufficiali."],
    derivatives: ["Confronto piattaforme perpetual crypto: commissioni, funding e liquidazione — NexuAlpha", "Confronta piattaforme perpetual per modello account, commissioni pubblicate, funding, margine, liquidazione, oracle e accesso regionale."],
    "no-kyc": ["Autocustodia senza KYC vs exchange con KYC (2026): Hyperliquid, dYdX e MEXC — NexuAlpha", "Confronta accesso wallet, account CEX, prelievi, limiti regionali, controlli sanzioni, front end e rischio di liquidazione."],
  },
};
for (const [locale, topics] of Object.entries(TOPIC_METADATA_LOCALIZED_PACK)) {
  LOCALIZED_TOPIC_SEO_OVERRIDES[locale] ||= {};
  for (const [slug, tuple] of Object.entries(topics)) {
    const [title, description] = tuple;
    LOCALIZED_TOPIC_SEO_OVERRIDES[locale][slug] ||= tuple.length > 2 ? tuple : [title, description, `${title.replace(/ — NexuAlpha$/, '')} source check`, description, []];
    LOCALIZED_TOPIC_SEO_OVERRIDES[locale][slug][0] ||= title;
    LOCALIZED_TOPIC_SEO_OVERRIDES[locale][slug][1] ||= description;
  }
}

function overrideFromTuple(tuple, base = {}) {
  if (!tuple) return null;
  const [title, description, question, answer, faq = []] = tuple;
  return { title, description, completeFaq: true, directAnswer: { question, answer }, faq, sourceUrls: base.sourceUrls, relatedLinks: base.relatedLinks };
}
function localizedVenueSeoOverride(slug, locale, base) {
  return overrideFromTuple(LOCALIZED_VENUE_SEO_OVERRIDES[locale]?.[slug], base);
}
function localizedCompareSeoOverride(pair, locale, base) {
  return overrideFromTuple(LOCALIZED_COMPARE_SEO_OVERRIDES[locale]?.[pair], base);
}
function localizedTopicSeoOverride(slug, locale) {
  return overrideFromTuple(LOCALIZED_TOPIC_SEO_OVERRIDES[locale]?.[slug]);
}

function buildWorkerTopicSchema(topic, locale, canonicalUrl, seoOverride = null) {
  const isZh = locale === "zh-Hans";
  const title = sanitizePublicText(seoOverride?.title || (isZh ? topic.titleZh : topic.titleEn));
  const description = sanitizePublicText(seoOverride?.description || (isZh ? topic.descZh : topic.descEn))
    .replace(/20%\s*(fee\s*)?rebate/gi, "user benefits pending official verification")
    .replace(/零手续费/g, "费率条件待官方核验")
    .replace(/zero[- ]fee/gi, "published fee terms")
    .replace(/0\.00%/g, "published base fee terms")
    .replace(/100x/gi, "high-volatility");

  const itemList = {
    "@type": "ItemList",
    name: isZh ? `${sanitizePublicText(topic.categoryZh)} 平台比较` : `${sanitizePublicText(topic.categoryEn)} Platform Comparison`,
    itemListElement: topic.platforms.map((slug, idx) => {
      const venue = VENUE_REGISTRY[slug] || { name: slug.toUpperCase(), slug };
      return {
        "@type": "ListItem",
        position: idx + 1,
        name: venue.name,
        url: `${PUBLIC_ORIGIN}/exchanges/${slug}`,
      };
    }),
  };

  const sourceUrls = topic.platforms
    .map((slug) => VENUE_REGISTRY[slug]?.officialDomain)
    .filter(Boolean)
    .map((domain) => `https://${domain}`);

  const schemas = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "NexuAlpha", item: `${PUBLIC_ORIGIN}/` },
        { "@type": "ListItem", position: 2, name: isZh ? "细分赛道选型" : "Topic Guides", item: localizedCanonical("/topics", locale) },
        { "@type": "ListItem", position: 3, name: title, item: canonicalUrl },
      ],
    },
    {
      "@type": "CollectionPage",
      name: title,
      description,
      url: canonicalUrl,
      inLanguage: locale,
      dateModified: topic.slug === "derivatives" ? "2026-09-22" : TOPIC_SOURCE_REVIEW_DATE,
      ...researchAttribution(sourceUrls),
      about: topic.platforms.map((slug) => ({ "@type": "Thing", name: (VENUE_REGISTRY[slug] || { name: slug }).name })),
      isBasedOn: sourceUrls,
      mainEntity: itemList,
      ...(TOPIC_RELATED_LINKS[topic.slug] ? { relatedLink: TOPIC_RELATED_LINKS[topic.slug].map((link) => `${PUBLIC_ORIGIN}${link}`) } : {}),
    },
  ];
  if (seoOverride?.directAnswer) {
    schemas.push({
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: [seoOverride.directAnswer, ...(seoOverride.faq || []).map(([question, answer]) => ({ question, answer }))].map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: entry.answer,
          ...(sourceUrls.length ? { citation: sourceUrls.slice(0, 4) } : {}),
        },
      })),
    });
  }
  const visibleTopicFaqs = topicFaqSchemaEntries(topic.slug, locale);
  if (visibleTopicFaqs.length) {
    const retained = schemas.filter(schema => schema['@type'] !== 'FAQPage');
    return [...retained, { '@type': 'FAQPage', inLanguage: locale, mainEntity: visibleTopicFaqs }];
  }
  return schemas;
}

// One hreflang shape for the page head, /api/route-seo and every sitemap (audit 2026-10-11 #1): hreflangAlternates in
// src/data/news-feed-client.js, which the build/publisher sitemap writers use too.
function routeAlternates(pathname, locales = INDEXABLE_LOCALES) {
  return hreflangAlternates(locales, (hreflang) => localizedCanonical(pathname, hreflang));
}

function sitemapAlternateLines(alternates = []) {
  return alternates.map((alt) => `    <xhtml:link rel="alternate" hreflang="${xmlText(alt.hreflang)}" href="${xmlText(alt.href)}" />`);
}

function searchPublishedNewsSlugs(articles = []) {
  return selectReviewedNewsSearchSlugs(articles);
}

function searchPublicationLocales(pathname, options = {}) {
  if (pathname === "/" || pathname === "/index.html") return INDEXABLE_LOCALES;
  if (pathname === "/br" || pathname.startsWith("/br/")) return ["pt-BR"];
  if (/^\/activities\/updates\/[^/]+\/[^/]+$/.test(pathname)) return INDEXABLE_LOCALES;
  const regionalLocales = {
    "/mx": ["es"],
    "/tw": ["zh-Hant"],
    "/id": ["id"],
    "/hk": ["zh-Hant"],
    "/eu": ["en"],
    "/uk": ["en"],
    "/us": ["en"],
    "/jp": ["ja"],
    "/kr": ["ko"],
    "/sg": ["en"],
    "/markets/turkiye": ["tr"],
  }[pathname];
  if (regionalLocales) return regionalLocales;
  if (pathname === "/topics" || pathname === "/factbook") return ["en"];
  if (parseAppDownloadPath(pathname)?.valid) return Object.keys(LOCALE_PREFIX_BY_CODE);
  // Academy hub and lessons: the locales with a localized lesson (src/data/academy.js).
  if (parseAcademyPath(pathname) && parseAcademyPath(pathname).kind !== "missing") return ACADEMY_INDEX_LOCALES;
  if (parseLicensesPath(pathname) && parseLicensesPath(pathname).kind !== "missing") return licenseRouteSeo(pathname, "en", { urlFor: (path) => path })?.alternatesLocales || [];
  // Spot ETF flows + crypto calendar: their nine written editions.
  if (INTEL_TOOL_PATHS.includes(pathname)) return isIntelToolLive(pathname) ? INTEL_TOOL_INDEX_LOCALES : [];
  // Where to buy <coin>: per-coin index locales (listed on a covered exchange and described in that language).
  if (parseCoinsPath(pathname) && parseCoinsPath(pathname).kind !== "missing") return coinsRouteSeo(pathname, "en", { urlFor: (path) => path })?.alternatesLocales || [];
  if (parseConverterPath(pathname) && parseConverterPath(pathname).kind !== "missing") return converterRouteSeo(pathname, "en", { urlFor: (path) => path })?.alternatesLocales || [];
  if (parseRadarPath(pathname)) return RADAR_INDEX_LOCALES;
  // Crypto glossary: the hub's written editions; a term page lists the locales its entry is written in.
  if (parseGlossaryPath(pathname) && parseGlossaryPath(pathname).kind !== "missing") return glossaryRouteSeo(pathname, "en", { urlFor: (path) => path })?.alternatesLocales || [];
  // Flash: the stream in every templated locale; an item page carries its own locale set (metadata.flashIndexLocales).
  if (parseFlashPath(pathname)?.kind === "stream") return FLASH_INDEX_LOCALES;
  if (parseFlashPath(pathname)?.kind === "item") return options.flashIndexLocales || FLASH_INDEX_LOCALES;
  // Binance October campaigns page: its written editions (src/data/binance-october.js).
  if (parseBinanceOctoberPath(pathname)) return BINANCE_OCTOBER_INDEX_LOCALES;
  // Bybit Stocks campaign page: its written editions (src/data/bybit-stocks.js).
  if (parseBybitStocksPath(pathname)) return BYBIT_STOCKS_INDEX_LOCALES;
  // Bitget Alliance campaign page: its written editions (src/data/bitget-alliance.js).
  if (parseBitgetAlliancePath(pathname)) return BITGET_ALLIANCE_INDEX_LOCALES;
  // Kraken 5M USDG Challenge page: its written editions (src/data/kraken-usdg.js).
  if (parseKrakenUsdgPath(pathname)) return KRAKEN_USDG_INDEX_LOCALES;
  // /embed/* are iframe widgets: noindex,follow (meta + X-Robots-Tag) and in no sitemap (SEO audit 2026-10-11 #13).
  if (pathname === "/embed" || pathname.startsWith("/embed/")) return [];
  if (pathname === "/news") return newsListingIndexableLocales(options.newsArticles);
  const newsListing = parseNewsListingPath(pathname);
  if (newsListing && !newsListing.invalid && !newsListing.redirect) return newsListingIndexableLocales(options.newsArticles);
  if (options.article) {
    if (typeof options.searchPublished === "boolean") {
      return options.searchPublished && isReviewedNewsSearchArticle(options.article) ? articleSeoLocales(options.article) : [];
    }
    return searchPublishedNewsSlugs(options.newsArticles).has(options.article.slug)
      ? articleSeoLocales(options.article)
      : [];
  }
  if (TOKENIZED_ASSET_TOPIC_PATHS.has(pathname)) return TOKENIZED_ASSET_LOCALES;
  if (venueAlternativePage(pathname.match(/^\/topics\/([a-z0-9-]+)$/)?.[1])) return VENUE_ALTERNATIVES_INDEX_LOCALES;
  if (isBrazilDeadlinePath(pathname)) return brazilDeadlineIndexLocales(pathname);
  if (SEARCH_ALL_LOCALE_STATIC_PATHS.has(pathname)) return INDEXABLE_LOCALES;
  if (SEARCH_CORE_STATIC_PATHS.has(pathname)) return ["en", "zh-Hans", "ja", "ko", "tr"];
  if (SEARCH_SECONDARY_STATIC_PATHS.has(pathname)) return ["en", "zh-Hans"];
  const venueSlug = pathname.match(/^\/exchanges\/([a-z0-9-]+)$/)?.[1];
  if (venueSlug && ACTIVE_VENUE_SLUGS.has(venueSlug)) {
    if (SEARCH_REVIEWED_TRILINGUAL_VENUES.has(venueSlug)) return ["en", "zh-Hans", "zh-Hant"];
    if (!SEARCH_ALL_LOCALE_VENUE_EXCLUSIONS.has(venueSlug)) return INDEXABLE_LOCALES;
    return SEARCH_PRIORITY_VENUES.has(venueSlug) ? ["en", "zh-Hans", "ja", "ko", "tr"] : ["en", "zh-Hans"];
  }
  const factbookSlug = pathname.match(/^\/factbook\/([a-z0-9-]+)$/)?.[1];
  if (factbookSlug && VENUE_REGISTRY[factbookSlug]) return SEARCH_PRIORITY_FACTBOOK.has(factbookSlug) ? ["en", "zh-Hans"] : ["en"];
  const comparisonSlug = pathname.match(/^\/compare\/([a-z0-9-]+(?:-vs-[a-z0-9-]+){1,2})$/)?.[1];
  if (comparisonSlug && CURATED_COMPARISONS.has(comparisonSlug)) return SEARCH_PRIORITY_COMPARISONS.has(comparisonSlug) && !comparisonSlug.split("-vs-").some((v) => SEARCH_ALL_LOCALE_VENUE_EXCLUSIONS.has(v)) ? INDEXABLE_LOCALES : ["en", "zh-Hans"];
  if (comparisonSlug && parseComparePair(comparisonSlug)?.length === 2) {
    const policy = generatedComparePolicy(comparisonSlug);
    return policy.indexable ? generatedCompareLocales(comparisonSlug) : [];
  }
  const topicSlug = pathname.match(/^\/topics\/([a-z0-9-]+)$/)?.[1];
  if (topicSlug && TOPIC_REGISTRY[topicSlug]) return SEARCH_PRIORITY_TOPICS.has(topicSlug) ? ["en", "zh-Hans", "ja", "ko", "tr"] : ["en", "zh-Hans"];
  return [];
}

// Page-specific social card (2026-10-10): news, venue, compare, /liquidations and /funding-rates get a rendered
// 1200x630 PNG by route kind; everything else keeps the brand image. A route that already set its image wins.
export function applySocialImage(metadata, pathname, locale = "en") {
  if (!metadata || metadata.status !== 200 || metadata.image) return metadata;
  const imagePath = socialImagePathForRoute(pathname, locale);
  if (imagePath) metadata.image = `${PUBLIC_ORIGIN}${imagePath}`;
  return metadata;
}

function applySearchPublicationEligibility(metadata, pathname, locale, options = {}) {
  if (!metadata || metadata.status !== 200) return metadata;
  // T10 canonicalized duplicate: index,follow + cross-article canonical, outside the search-published set by design.
  if (metadata.newsCanonicalTarget) { metadata.alternates = []; return metadata; }
  // Flash items: indexable editions are the item's localized ones within 30 days (src/data/flash-feed.js).
  if (Array.isArray(metadata.flashIndexLocales)) {
    if (metadata.robots === "index,follow" && !metadata.flashIndexLocales.includes(locale)) metadata.robots = "noindex,follow";
    metadata.alternates = metadata.robots === "index,follow" ? routeAlternates(pathname, metadata.flashIndexLocales) : [];
    return metadata;
  }
  const publishedLocales = searchPublicationLocales(pathname, options);
  if (metadata.robots === "index,follow" && !publishedLocales.includes(locale)) {
    metadata.robots = "noindex,follow";
  }
  if (/^\/activities\/updates\/[^/]+\/[^/]+$/.test(pathname)) {
    metadata.alternates = routeAlternates(pathname, publishedLocales.length ? publishedLocales : INDEXABLE_LOCALES);
    return metadata;
  }
  if (metadata.robots !== "index,follow") {
    metadata.alternates = [];
  } else if (publishedLocales.length) {
    metadata.alternates = isBrazilDeadlinePath(pathname)
      ? brazilDeadlineAlternates(localizedCanonical)
      : CLEAN_REGIONAL_ROOTS.has(pathname) || MX_DECISION_SEO[pathname]
      ? [...publishedLocales.map((hreflang) => ({ hreflang, href: `${PUBLIC_ORIGIN}${pathname}` })), { hreflang: "x-default", href: `${PUBLIC_ORIGIN}${pathname}` }]
      : routeAlternates(pathname, publishedLocales);
  }
  return metadata;
}

function buildTokenizedAssetSchema(topic, locale, canonicalUrl) {
  const isZh = locale === "zh-Hans";
  const visiblePage = tokenizedAssetPage(topic.slug);
  const questions = visiblePage.faqs.map(({ q, a }) => [tokenizedAssetLocalized(q, locale), tokenizedAssetLocalized(a, locale)]);
  return [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "NexuAlpha", item: `${PUBLIC_ORIGIN}/` },
        { "@type": "ListItem", position: 2, name: isZh ? "主题研究" : "Topic Research", item: localizedCanonical("/topics", locale) },
        { "@type": "ListItem", position: 3, name: isZh ? topic.titleZh : topic.titleEn, item: canonicalUrl },
      ],
    },
    {
      "@type": "CollectionPage",
      name: isZh ? topic.titleZh : topic.titleEn,
      description: isZh ? topic.descZh : topic.descEn,
      url: canonicalUrl,
      inLanguage: locale,
      dateModified: TOKENIZED_ASSET_REVIEW_DATE,
      ...researchAttribution(TOKENIZED_ASSET_SOURCE_URLS),
      ...(topic.slug === "tokenized-treasuries" ? {
        hasPart: [
          ...researchAttribution(TOKENIZED_ASSET_SOURCE_URLS).hasPart,
          wave48TokenizedTreasuryRightsOpsDatasetSchema(),
        ],
      } : {}),
      isBasedOn: TOKENIZED_ASSET_SOURCE_URLS,
      mainEntity: { '@type': 'ItemList', itemListElement: visiblePage.decisionRows.map((row, index) => ({
        '@type': 'ListItem', position: index + 1,
        name: tokenizedAssetLocalized(row.label, locale), description: tokenizedAssetLocalized(row.verify, locale),
        url: row.route ? localizedCanonical(row.route, locale) : canonicalUrl,
      })) },
      ...(topic.slug === "tokenized-treasuries" ? { subjectOf: wave48TokenizedTreasuryRightsOpsDatasetSchema() } : {}),
      relatedLink: topic.relatedLinks.map((link) => `${PUBLIC_ORIGIN}${link}`),
    },
    {
      "@type": "FAQPage",
      mainEntity: questions.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer, citation: TOKENIZED_ASSET_SOURCE_URLS.slice(0, 3) },
      })),
    },
  ];
}

function notFoundMetadata(pathname, locale) {
  return { status: 404, title: "Page Not Found — NexuAlpha", description: "The requested page does not exist or is not published.", canonical: localizedCanonical(pathname, locale), locale, robots: "noindex,nofollow", marker: NOT_FOUND_ROUTE_MARKER };
}

// Home title/description (owner 2026-10-10 search intent + 2026-10-11 brand slogans): one table shared with the
// Worker head and /api/route-seo, built in src/data/home-search-copy.js from src/data/brand-slogan.js.

// Served meta descriptions share the snippet budget with computeRouteSeo (src/data/meta-description.js).
export { clampMetaDescription, metaDescriptionLimit };

function applyServedMetadataBudget(metadata) {
  if (metadata && typeof metadata.title === "string") metadata.title = budgetTitle(metadata.title, titleBudgetForLocale(metadata.locale));
  if (metadata && typeof metadata.description === "string") {
    metadata.description = routeMetaDescription(metadata.title, metadata.description, metadata.locale);
  }
  return metadata;
}

export async function routeMetadata(url, env) {
  const route = parsePublicRoute(url.pathname, url.searchParams);
  if (isLegalPagePath(route.contentPathname)) return applyServedMetadataBudget({ ...legalPageSeo(route.contentPathname, route.locale), marker: STATIC_ROUTE_MARKER });
  const metadata = await resolveRouteMetadata(url, env);
  return applyServedMetadataBudget(metadata);
}

async function resolveRouteMetadata(url, env) {
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams);
  const contentUrl = new URL(url);
  contentUrl.pathname = publicRoute.localeSource === "path" ? publicRoute.contentPathname : url.pathname;
  if (publicRoute.localeSource === "path") {
    contentUrl.searchParams.set("locale", publicRoute.locale);
  }
  if (brazilPath(contentUrl.pathname)) return brazilMetadata(contentUrl, env);
  const locale = routeLocale(url);
  const requestedLocale = publicRoute.localeSource === "path" ? publicRoute.locale : url.searchParams.get("locale") || locale;
  // Keep the requested Traditional Chinese document distinct from Simplified
  // Chinese in canonical URLs and structured data.
  const schemaLocale = String(requestedLocale).startsWith("zh") ? requestedLocale : locale;
  const ref = contentUrl.searchParams.get("ref");
  const refMatch = contentUrl.pathname.match(/^\/ref\/([a-z0-9-]+)$/);
  if (ref || refMatch) {
    const slug = cleanSlug(ref || refMatch[1]);
    return { status: 200, title: "NexuAlpha Partner Page", description: "Platform choices for this partner entry.", canonical: localizedCanonical(slug ? `/ref/${slug}` : "/", locale), locale, robots: "noindex,follow", marker: STATIC_ROUTE_MARKER };
  }
  const isNewsRoute = contentUrl.pathname === "/news" || contentUrl.pathname.startsWith("/news/");
  const newsFeed = isNewsRoute
    ? (await loadPrerenderedNewsSnapshot(env, url)) || await loadNewsFeed(env, url)
    : null;
  const searchEligibilityNewsFeed = isNewsRoute && typeof newsFeed?.searchPublished !== "boolean"
    ? await loadNewsFeed(env, url)
    : null;
  const metadata = await routeMetadataBase(contentUrl, env, newsFeed);
  // Preserve the requested Chinese language in canonical and structured data.
  if (metadata.schema && requestedLocale && String(requestedLocale).startsWith("zh") && !(contentUrl.pathname === "/news" || contentUrl.pathname.startsWith("/news/"))) {
    metadata.schema.inLanguage = requestedLocale;
  }
  if (contentUrl.pathname === "/partners/embed-guide") {
    metadata.canonical = localizedCanonical("/partners", locale);
    metadata.alternates = routeAlternates("/partners");
    if (metadata.schema) metadata.schema.url = metadata.canonical;
  }
  if (contentUrl.pathname === "/news" || contentUrl.pathname.startsWith("/news/")) {
    metadata.newsFeedFingerprint = newsFeed?.fingerprint;
    metadata.newsArticles = newsFeed?.articles || [];
  }
  const articleSlug = contentUrl.pathname.match(/^\/news\/([a-z0-9-]+)$/)?.[1] || null;
  const article = articleSlug ? newsFeed?.articles?.find((item) => item.slug === articleSlug) : null;
  const searchEligibilityArticle = articleSlug ? searchEligibilityNewsFeed?.articles?.find((item) => item.slug === articleSlug) || article : article;
  const eligibilityPathname = contentUrl.pathname === "/partners/embed-guide" ? "/partners" : contentUrl.pathname;
  applySocialImage(metadata, contentUrl.pathname, requestedLocale);
  return applySearchPublicationEligibility(metadata, eligibilityPathname, locale, {
    article: searchEligibilityArticle,
    searchPublished: articleSlug ? newsFeed?.searchPublished : undefined,
    newsArticles: searchEligibilityNewsFeed?.articles || newsFeed?.articles || [],
  });
}

async function routeMetadataBase(url, env, newsFeed) {
  const canonicalPath = url.pathname === "/index.html" ? "/" : url.pathname;
  const locale = routeLocale(url);
  const requestedLocale = url.searchParams.get("locale") || locale;
  const schemaLocale = String(requestedLocale).startsWith("zh") ? requestedLocale : locale;
  const isZh = locale === "zh-Hans";

  if (canonicalPath === "/") {
    const homeCopyLocale = HOME_SEARCH_COPY[requestedLocale] ? requestedLocale : locale;
    const [title, description] = HOME_SEARCH_COPY[homeCopyLocale] || HOME_SEARCH_COPY.en;

    return {
      status: 200,
      title,
      description,
      canonical: localizedCanonical("/", locale),
      locale,
      robots: "index,follow",
      marker: HOME_ROUTE_MARKER,
      alternates: routeAlternates("/"),
      schema: buildWorkerHomeSchema(schemaLocale),
    };
  }

  if (REGIONAL_PREVIEW_SEO[canonicalPath]) {
    const regionalLocale = canonicalPath === "/mx" ? (locale === "en" ? "en" : "es") : canonicalPath === "/id" ? "id" : locale;
    const [title, description] = REGIONAL_PREVIEW_SEO_LOCALIZED[canonicalPath]?.[regionalLocale]
      || REGIONAL_PREVIEW_SEO[canonicalPath];
    const faqEntries = regionalPreviewFaqEntries(canonicalPath, regionalLocale);
    const sourceUrls = REGIONAL_PREVIEW_SOURCE_URLS[canonicalPath] || [];
    const relatedLinks = REGIONAL_PREVIEW_RELATED_LINKS[canonicalPath] || ["/methodology", "/exchanges"];
    const regionalIndexable = canonicalPath === "/id"
      ? regionalLocale === "id"
      : regionalPreviewIsIndexable(canonicalPath, regionalLocale);
    const regionalCanonical = regionalPreviewCanonicalUrl(canonicalPath, regionalLocale);
    const pageCanonical = regionalIndexable ? regionalCanonical : `${PUBLIC_ORIGIN}${canonicalPath}`;
    return {
      status: 200,
      title,
      description,
      canonical: pageCanonical,
      locale: regionalLocale,
      robots: regionalIndexable ? "index,follow" : "noindex,follow",
      alternates: regionalIndexable ? [{ hreflang: regionalPreviewCanonicalLocale(canonicalPath, regionalLocale), href: regionalCanonical }, { hreflang: "x-default", href: regionalCanonical }] : [],
      schema: [
        pageBreadcrumb(title, pageCanonical, "Markets", "/exchanges", regionalLocale),
        { "@context": "https://schema.org", "@type": "WebPage", name: title, url: pageCanonical, inLanguage: regionalLocale, dateModified: "2026-09-15", ...researchAttribution(sourceUrls), isBasedOn: sourceUrls, relatedLink: relatedLinks.map((link) => `${PUBLIC_ORIGIN}${link}`) },
        ...(faqEntries.length ? [{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: regionalLocale,
        mainEntity: faqEntries.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer, ...(sourceUrls.length ? { citation: sourceUrls.slice(0, 4) } : {}) } })),
      }] : []),
      ],
      marker: STATIC_ROUTE_MARKER,
    };
  }

  if (/^\/(mx|tw|hk)\/(comparar|costos|conta)$/.test(canonicalPath)) {
    const marketName = canonicalPath.startsWith("/tw/") ? "台湾" : canonicalPath.startsWith("/hk/") ? "Hong Kong" : "México";
    const marketCopy = canonicalPath.startsWith("/tw/")
      ? { "/tw/comparar": ["台灣交易平台比較：新台幣、銀行驗證與帳戶條件 — NexuAlpha", "比較台灣用戶在新台幣、銀行驗證、身份條件與產品適用性上的研究路徑。"], "/tw/costos": ["台灣加密貨幣交易成本比較 — NexuAlpha", "用公開費率假設比較交易成本；最終條件以你的官方帳戶為準。"], "/tw/conta": ["台灣可用交易平台與開戶條件 — NexuAlpha", "核對居住地、身份驗證、入金方式與產品範圍，再前往官方流程。" ] }
      : canonicalPath.startsWith("/hk/")
        ? { "/hk/comparar": ["Hong Kong crypto platform comparison: funding, identity and product scope — NexuAlpha", "Compare Hong Kong funding routes, identity checks, residence eligibility and product scope before the official account flow."], "/hk/costos": ["Hong Kong crypto trading costs and fee references — NexuAlpha", "Compare published fee assumptions for Hong Kong users; final account terms must be checked on the official platform."], "/hk/conta": ["Hong Kong crypto platforms and account conditions — NexuAlpha", "Review residence, identity, funding and product conditions before continuing to the official platform." ] }
        : Object.fromEntries(Object.entries(locale === "en" ? MX_DECISION_SEO_EN : MX_DECISION_SEO).map(([path, config]) => [path, [config.title, config.description]]));
    const copy = marketCopy[canonicalPath];
    const mx = canonicalPath.startsWith("/mx/");
    return {
      status: 200,
      title: copy[0],
      description: copy[1],
      canonical: mx ? `${PUBLIC_ORIGIN}${canonicalPath}` : localizedCanonical(canonicalPath, locale),
      locale: mx ? (locale === "en" ? "en" : "es") : locale,
      robots: "noindex,follow",
      alternates: [],
      schema: mx ? mxDecisionSchemas(canonicalPath, copy[0], locale === "en" ? "en" : "es") : [],
      marker: STATIC_ROUTE_MARKER,
    };
  }

  if (/^\/mx\/(comparar|costos|conta)$/.test(canonicalPath)) {
    const mxCopy = {
      "/mx/comparar": ["Comparar exchanges en México: MXN, SPEI y condiciones de cuenta — NexuAlpha", "Compara Binance y OKX para México con foco en MXN, SPEI, identidad y condiciones de cuenta. Verifica siempre el flujo oficial."],
      "/mx/costos": ["Costos de trading cripto en México: calculadora y referencias — NexuAlpha", "Consulta escenarios de comisiones publicados para comparar plataformas desde México. Las condiciones finales dependen de tu cuenta y del flujo oficial."],
      "/mx/conta": ["Exchanges disponibles para México: directorio y condiciones — NexuAlpha", "Explora plataformas cripto y sus rutas oficiales para México. Revisa residencia, identidad, producto y método de fondeo antes de registrarte."],
    }[canonicalPath];
    return { status: 200, title: mxCopy[0], description: mxCopy[1], canonical: localizedCanonical(canonicalPath, locale), locale, robots: "noindex,follow", marker: STATIC_ROUTE_MARKER };
  }

  if (canonicalPath === "/exchanges") {
    const directoryCopy = {
      ja: ["暗号資産取引所一覧と手数料比較 (2026) — NexuAlpha", "CEX と DEX の公開手数料、準備金ソース、KYC、地域条件を出典付きで比較します。"],
      ko: ["암호화폐 거래소 목록 및 수수료 비교 (2026) — NexuAlpha", "CEX와 DEX의 공개 수수료, 준비금 출처, KYC 및 지역 조건을 출처와 함께 비교합니다."],
      tr: ["Kripto borsaları dizini ve ücret karşılaştırması (2026) — NexuAlpha", "CEX ve DEX platformlarının yayınlanan ücretlerini, rezerv kaynaklarını, KYC ve bölgesel koşullarını kaynaklarla karşılaştırın."],
      es: ["Directorio de exchanges cripto y comparación de comisiones (2026) — NexuAlpha", "Compara comisiones publicadas, reservas, KYC y condiciones regionales de CEX y DEX con fuentes."],
      "zh-Hant": ["加密交易平台目錄與費率比較 (2026) — NexuAlpha", "以來源整理 CEX 與 DEX 的公開費率、儲備證明、KYC 和地區條件。"],
      "pt-BR": ["Diretório de exchanges cripto e comparação de taxas (2026) — NexuAlpha", "Compare taxas publicadas, reservas, KYC e condições regionais de CEX e DEX com fontes."],
      fr: ["Annuaire des plateformes crypto et comparaison des frais (2026) — NexuAlpha", "Comparez les frais publiés, les réserves, le KYC et les conditions régionales des CEX et DEX avec leurs sources."],
      de: ["Krypto-Plattformverzeichnis und Gebührenvergleich (2026) — NexuAlpha", "Vergleichen Sie veröffentlichte Gebühren, Reserven, KYC und regionale Bedingungen von CEX und DEX anhand von Quellen."],
      ar: ["دليل منصات العملات المشفرة ومقارنة الرسوم (2026) — NexuAlpha", "قارن الرسوم المنشورة والاحتياطيات ومتطلبات KYC والشروط الإقليمية لمنصات CEX وDEX مع المصادر."],
      ru: ["Каталог криптоплатформ и сравнение комиссий (2026) — NexuAlpha", "Сравнивайте опубликованные комиссии, резервы, KYC и региональные условия CEX и DEX по источникам."],
      id: ["Direktori platform kripto dan perbandingan biaya (2026) — NexuAlpha", "Bandingkan biaya, cadangan, KYC, dan ketentuan wilayah CEX serta DEX berdasarkan sumber."],
      vi: ["Danh mục nền tảng tiền mã hóa và đối chiếu phí (2026) — NexuAlpha", "Đối chiếu phí công bố, dự trữ, KYC và điều kiện khu vực của CEX và DEX theo nguồn."],
      it: ["Directory delle piattaforme crypto e confronto commissioni (2026) — NexuAlpha", "Confronta commissioni pubblicate, riserve, KYC e condizioni regionali di CEX e DEX con le fonti."],

      // l10n: needs native review
      ur: ["کرپٹو ایکسچینج ڈائریکٹری اور فیس موازنہ (2026) — NexuAlpha", "CEX اور DEX کی شائع شدہ فیس، ذخائر، KYC اور علاقائی شرائط کو ماخذوں کے ساتھ موازنہ کریں۔"],

      // l10n: needs native review
      uk: ["Довідник криптобірж і порівняння комісій (2026) — NexuAlpha", "Порівнюйте опубліковані комісії, резерви, KYC і регіональні умови CEX та DEX за джерелами."],
    }[locale] || (isZh ? ["全球核心加密货币交易所黄页与费率评测 (2026) — NexuAlpha", "收录币安、OKX、Bybit、Bitget 等中心化与去中心化平台，整理 PoR 来源、现货与合约公开费率、KYC 要求和地区条件。"] : ["Crypto Exchanges Directory & Fee Comparison (2026) — NexuAlpha", "A source-linked directory of crypto CEXs and DEXs. Compare published spot/futures fees, reserve sources, KYC tiers and regional conditions."]);
    const [title, description] = directoryCopy;

    return {
      status: 200,
      title,
      description,
      canonical: localizedCanonical("/exchanges", locale),
      locale,
      robots: "index,follow",
      marker: EXCHANGES_ROUTE_MARKER,
      alternates: routeAlternates("/exchanges"),
      schema: buildWorkerDirectorySchema(schemaLocale),
    };
  }

  const venueMatch = canonicalPath.match(/^\/exchanges\/([a-z0-9-]+)$/);
  if (venueMatch) {
    const slug = cleanSlug(venueMatch[1]);
    const venue = slug && ACTIVE_VENUE_SLUGS.has(slug) ? VENUE_REGISTRY[slug] : null;
    if (!venue) {
      return {
        status: 404,
        title: "Exchange Not Found — NexuAlpha",
        description: "The requested exchange profile is unavailable or not indexed.",
        canonical: localizedCanonical(canonicalPath, locale),
        locale,
        robots: "noindex,nofollow",
      };
    }

    const localizedProfileTitle = {
      "zh-Hant": "平台檔案與手續費",
      ja: "プラットフォーム概要と手数料",
      ko: "플랫폼 프로필 및 수수료",
      tr: "Platform profili ve ücretler",
      es: "Perfil de plataforma y comisiones",
      "pt-BR": "Perfil da plataforma e taxas",
      fr: "Profil de la plateforme et frais",
      de: "Plattformprofil und Gebühren",
      ar: "ملف المنصة والرسوم",
      ru: "Профиль платформы и комиссии",
      id: "Profil platform dan biaya",
      vi: "Hồ sơ nền tảng và phí",
      it: "Profilo della piattaforma e commissioni",
    }[requestedLocale] || { "zh-Hant": "平台檔案與手續費" }[locale];
    const venueSeoOverride = {
      "gate-io": {
        title: "Gate.io Fees, KYC, Listings and Referral Code Checks — NexuAlpha",
        description: "Check Gate.io spot and futures fee sources, KYC and regional conditions, withdrawal and listing risks, API scope, and whether the referral code appears in the official signup flow.",
        directAnswer: {
          question: "What should I verify before opening a Gate.io account?",
          answer: "Before opening a Gate.io account, verify the official regional domain, current identity requirements, the product-specific spot or futures fee schedule, withdrawal conditions, listing and delisting risk, API scope, and whether any referral code is visible in the official signup flow. Public fee, listing or referral information does not prove account eligibility, a final fee tier, withdrawal availability or a referral benefit for a specific user.",
        },
        faq: [
          ["Where should Gate.io fees be checked?", "Use Gate's current product-specific fee pages and the final account flow. Spot maker and taker rules, futures costs, VIP tiers, payment routes and withdrawal charges should not be collapsed into one universal fee."],
          ["Does a Gate.io referral code guarantee a benefit?", "No. Confirm that the code is visible in the official signup flow and review the current terms. A public code or link does not prove attribution, eligibility, reward value, account approval or commission."],
          ["What should be checked before trading a newly listed token on Gate.io?", "Verify the official listing announcement, exact pair, deposit and withdrawal state, liquidity, order type, price impact and any delisting or regional restriction before trading."],
          ["How should Gate.io API access be reviewed?", "Treat spot and futures REST or WebSocket surfaces as separate integrations. Verify the current API documentation, permissions, rate limits, account scope and product eligibility before enabling keys."],
        ],
        sourceUrls: ["https://www.gate.com/", "https://www.gate.com/docs/developers/apiv4/", "https://www.gate.com/help/trade/spot/22550/gate-io-s-spot-trading-fee-rules", "https://www.gate.com/announcements"],
        relatedLinks: ["/compare/gate-io-vs-coinbase", "/compare/gate-io-vs-mexc", "/topics/meme-coins", "/topics/derivatives", "/rates", "/methodology"],
      },
      binance: {
        title: "Binance Fees, KYC and Product Scope Checks — NexuAlpha",
        description: "Review Binance spot and margin fee tables, BNB/VIP tier conditions, identity verification, product scope and official announcement paths before choosing an account route.",
        directAnswer: {
          question: "What should I check on Binance before comparing it with another exchange?",
          answer: "Start with Binance's published spot and margin fee table, VIP or BNB discount conditions, identity-verification requirement, product-specific availability and official announcement path. NexuAlpha treats these as source checks, not as a promise that every account receives the same fees, products or regional access.",
        },
        faq: [
          ["Are Binance fees the same for every user?", "No. Binance publishes maker and taker fee tables with tier conditions, and final costs can vary by product, account tier, BNB use, region, order type and current official terms."],
          ["Does a Binance profile prove account eligibility?", "No. The profile points to official fee, identity and announcement sources. Identity verification, regional rules and product access still need to be checked in the official account flow."],
        ],
        sourceUrls: [
          "https://www.binance.com/en/fee/trading",
          "https://www.binance.com/en/support/faq/detail/360027287111",
          "https://www.binance.com/en/support/announcement",
        ],
        relatedLinks: ["/compare/binance-vs-okx", "/topics/derivatives", "/factbook/binance"],
      },
      okx: {
        title: "OKX Fees, KYC, Web3 and Product Scope Checks — NexuAlpha",
        description: "Review OKX published fees, spot and derivatives product scope, Web3 access, identity requirements, announcements and proof-of-reserves before choosing an account route.",
        directAnswer: {
          question: "What should I check on OKX before choosing a trading route?",
          answer: "Start with OKX's published fee page, identity-verification support path, product scope, Web3 or DEX-style access, announcement taxonomy and proof-of-reserves source. NexuAlpha treats these as pre-signup checks, not as a promise that every account receives the same products, benefits or regional access.",
        },
        faq: [
          ["Are OKX fees one blended exchange fee?", "No. OKX separates spot, futures, options and other instrument fee areas. Compare the product-specific fee page with the account level, region, order type and current official account flow."],
          ["What should I verify after comparing OKX with Binance?", "Open the OKX profile, the Binance vs OKX comparison and the factbook, then verify the official domain, identity route, product permissions, fee page and current announcement source before registration."],
          ["Does Web3 or DEX-style access remove account checks?", "No. Web3 access, account-based trading, campaign eligibility and regional availability are separate surfaces. Check the official flow for the product and account you intend to use."],
        ],
        sourceUrls: [
          "https://www.okx.com/fees",
          "https://www.okx.com/help/section/announcements-latest-announcements",
          "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported",
          "https://www.okx.com/proof-of-reserves",
        ],
        relatedLinks: ["/compare/binance-vs-okx", "/factbook/okx", "/exchanges/binance", "/activities"],
      },
      bybit: {
        title: "Bybit Fees, KYC, Derivatives and Copy Trading Checks — NexuAlpha",
        description: "Review Bybit trading-fee structure, KYC levels, derivatives access, copy trading boundaries, announcements and regional product conditions before choosing a signup path.",
        directAnswer: {
          question: "What should I check on Bybit before comparing it with Bitget?",
          answer: "Start with Bybit's trading-fee structure, individual KYC FAQ, product scope, derivatives permissions, copy-trading rules, announcements and regional restrictions. Treat a public profile as a source checklist before using any registration path, not as eligibility or product-access proof.",
        },
        faq: [
          ["Does Bybit require identity verification for products?", "Bybit's KYC material should be checked before product decisions because account level, region, product permissions and risk controls can change what an account can use."],
          ["What should I compare before using a copy-trading CTA?", "Compare KYC level, product permissions, lead-trader rules, fee structure, risk controls and regional account availability. Public comparison content should narrow the checklist, not promise access."],
          ["Which page should I open after the Bybit profile?", "Use the Bybit vs Bitget comparison for copy trading, derivatives and stock-like exposure boundaries, then open the factbook and official fee or KYC pages for account-level confirmation."],
        ],
        sourceUrls: [
          "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
          "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
          "https://announcements.bybit.com/en/",
          "https://www.bybit.com/en/proof-of-reserves",
        ],
        relatedLinks: ["/compare/bybit-vs-bitget", "/factbook/bybit", "/exchanges/bitget", "/topics/derivatives"],
      },
      bitget: {
        title: "Bitget Fees, KYC, Futures and Copy Trading Checks — NexuAlpha",
        description: "Review Bitget spot fees, futures fee components, identity verification, copy trading, announcements and account conditions before choosing a registration route.",
        directAnswer: {
          question: "What should I check on Bitget before opening a registration route?",
          answer: "Start with Bitget's spot-fee article, futures-fee guide, identity-verification path, announcement center, copy-trading surface and current account conditions. A public profile can organize the decision path, but final eligibility and benefits must be checked in the official flow.",
        },
        faq: [
          ["Are Bitget spot and futures fees checked the same way?", "No. Bitget spot material defines maker and taker roles, while futures material separates transaction fees from funding fees. Compare the product you plan to use instead of reading one blended fee."],
          ["What should I compare before choosing Bitget over Bybit?", "Compare published fees, futures access, copy-trading workflow, KYC level, regional availability, product permissions and current official announcements before using a registration route."],
          ["Does a Bitget profile prove user benefits are available?", "No. The profile points to fee, identity and announcement sources. Benefits, tasks, account limits and product access remain subject to the current official account flow."],
        ],
        sourceUrls: [
          "https://www.bitget.com/support/articles/12560603820584",
          "https://www.bitget.com/support/articles/12560603817155",
          "https://www.bitget.com/support/articles/12560603795184",
          "https://www.bitget.com/support/announcement-center",
        ],
        relatedLinks: ["/compare/bybit-vs-bitget", "/factbook/bitget", "/exchanges/bybit", "/activities"],
      },
      hyperliquid: {
        title: "Hyperliquid Fees, Funding, Funded Account and Vault Checks — NexuAlpha",
        description: "Review Hyperliquid rolling 14-day fee tiers, hourly peer-to-peer funding, USDC collateral, sub-accounts, vault volume, account abstraction and funded-account claim boundaries before opening a perp position.",
        directAnswer: {
          question: "Is Hyperliquid a funded account platform, and what fees should I check before trading?",
          answer: "Hyperliquid fees should be read as a stack: rolling 14-day maker/taker fee tier, separate perp and spot schedules, hourly peer-to-peer funding, USDC collateral route, margin mode, liquidation rules, sub-account or API-wallet permissions, and vault context. A Hyperliquid funded account search should separate self-funded wallet collateral, sub-accounts, API-wallet delegation and vault participation from third-party trader-funding offers; the official docs do not describe a Hyperliquid-operated capital-allocation program.",
          citations: [
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc",
            "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/vaults",
          ],
        },
        faq: [
          ["How are Hyperliquid fees reviewed?", "Use the official fee page first: Hyperliquid says fees are based on rolling 14 day volume and assessed at the end of each UTC day, with separate perp and spot schedules. Then check hourly funding, margin mode, liquidation mechanics, vault context and the collateral route before treating a quoted maker/taker rate as the whole cost.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"]],
          ["What source map should I use for Hyperliquid fees?", "Use the fee schedule for maker/taker tiers and volume counting, funding docs for hourly peer-to-peer payments, contract specifications for market mechanics, USDC docs for collateral movement, vault docs for pooled strategy context and liquidation docs for maintenance-margin failure paths.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding", "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"]],
          ["What does a Hyperliquid funded account search need to separate?", "Separate wallet funding, USDC collateral, account abstraction mode, sub-accounts, API-wallet delegation and vault participation. Hyperliquid's official docs do not turn the phrase into a Hyperliquid-operated funded account program, account-opening result, signup entitlement or third-party capital allocation.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/vaults", "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"]],
          ["What should I verify before using a Hyperliquid CTA?", "Confirm the official app route, wallet network, collateral asset, account mode, sub-account or API-wallet permission, margin setting, funding cadence, vault context and liquidation rule before depositing or opening a position.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margining", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations", "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"]],
          ["How does Hyperliquid funding change the cost calculation?", "Funding is separate from maker/taker trading fees. Hyperliquid documentation describes funding as a peer-to-peer payment every hour, so a pre-trade cost check should include likely funding direction and interval, not only the entry fee tier.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"]],
          ["Why can a Hyperliquid funded-account answer be misleading?", "The phrase can mean several different things: adding personal USDC collateral, using account-abstraction modes, creating sub-accounts, delegating signing to an API wallet, joining a vault or evaluating an outside prop-firm offer. Each meaning needs a different official source check, so NexuAlpha keeps the answer as a source map instead of a single signup claim.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts", "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/vaults"]],
          ["Which Hyperliquid account details can change the final fee read?", "Sub-account volume can count toward a master account tier, vault volume is treated separately, spot volume is weighted differently from perp volume, and HIP-3 markets can add deployer or growth-mode fee conditions. Check the current official tier, account mode and market before treating any base rate as final.", ["https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/vaults", "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals"]],
        ],
        sourceUrls: [
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margining",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/sub-accounts",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/vaults",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals",
        ],
        relatedLinks: ["/compare/hyperliquid-vs-dydx", "/news/hyperliquid-vs-dydx", "/topics/no-kyc", "/topics/derivatives#perp-cost-field-dictionary", "/topics/derivatives", "/factbook/hyperliquid", "/exchanges/dydx"],
      },
      dydx: {
        relatedLinks: ["/compare/hyperliquid-vs-dydx", "/topics/derivatives#perp-cost-field-dictionary", "/topics/derivatives", "/topics/no-kyc", "/factbook/dydx", "/exchanges/hyperliquid"],
        sourceUrls: [
          "https://docs.dydx.xyz/concepts/trading/rewards_fees_and_parameters",
          "https://docs.dydx.xyz/concepts/trading/funding",
          "https://docs.dydx.xyz/concepts/trading/margin",
          "https://docs.dydx.xyz/concepts/trading/liquidations",
        ],
      },
      uniswap: {
        reviewedAt: "2026-09-16",
        title: "Uniswap Testnet, Mainnet, Permit2 and Swap Preview Checklist — NexuAlpha",
        description: "Check Uniswap official app and docs, API and web testnet scope, mainnet chain, token contract, pool route, Permit2 spender, gas and wallet transaction preview.",
        directAnswer: {
          question: "How should I research Uniswap testnet or v4 hook routes before using a live swap?",
          answer: "For a Uniswap testnet query, first decide whether the task is developer testing, v4 hook review or a live-wallet route check, then separate API support from the official web interface. The reviewed source lists Ethereum Sepolia, Unichain Sepolia and Base Sepolia for API access, while the web interface lists only Ethereum Sepolia and Unichain Sepolia. Before a live swap, verify the official app URL, network-specific v4 deployment, token contract, Universal Router, Permit2 contract, spender, amount, expiration, gas asset, wallet simulation and final signed transaction. Testnet support and recognizable contract addresses do not prove mainnet liquidity, execution or signature safety.",
          citations: ["https://developers.uniswap.org/docs/trading/swapping-api/supported-chains", "https://developers.uniswap.org/docs/protocols/v4/deployments", "https://developers.uniswap.org/docs/protocols/universal-router/overview", "https://developers.uniswap.org/docs/protocols/permit2/overview", "https://support.uniswap.org/hc/en-us/articles/40050562560781-Crypto-Wallet-Signature-Scams"],
        },
        faq: [
          ["Does Uniswap testnet research prove a live swap route is safe?", "No. Testnet and local hook guides are developer research paths using test assets or local state. A live route still requires checking the official app URL, network, token contract, deployment mapping, gas cost and the final wallet transaction."],
          ["Is Uniswap testnet the same as mainnet real-money trading?", "No. A testnet or local hook setup is not a mainnet real-money environment. Treat it as a way to inspect contract behavior, deployment assumptions and signing flow before separately checking the live app, live network and wallet transaction."],
          ["What source map should I use for a Uniswap testnet query?", "Use the quickstart for official app URL behavior, v4 hook docs for local or test behavior, deployments for network-specific contract addresses and fee docs for static or dynamic fee mechanics."],
          ["What Uniswap fee versions should be compared?", "Compare the relevant v2, v3 or v4 fee model and pool behavior instead of assuming one DEX fee. v4 dynamic-fee or hook behavior should be verified against current Uniswap documentation and deployment data."],
          ["What should I verify before signing a Uniswap transaction?", "Check the app domain, chain, token address, pool route, approval spender or Permit2 route, expected output, slippage, gas token, wallet simulation and the final transaction data shown by the wallet."],
          ["What is the 60-second Uniswap testnet source check?", "Open the official Uniswap docs for fees, v4 deployments and hook behavior, confirm the target chain and contract address, then separate developer test evidence from any live swap route. A testnet result does not prove live liquidity, final gas cost, mainnet execution or wallet safety."],
          ["Which Uniswap testnets are available through the API versus the web interface?", "At the 2026-09-16 source review, Uniswap lists Ethereum Sepolia, Unichain Sepolia and Base Sepolia for API access. Its official supported-chains page says only Ethereum Sepolia and Unichain Sepolia are available as testnets in the web interface. This is dated availability evidence, not proof of mainnet liquidity or execution.", ["https://developers.uniswap.org/docs/trading/swapping-api/supported-chains"]],
          ["How are the token contract, Universal Router, Permit2 and spender different?", "The token contract identifies the asset on one chain; the Universal Router composes swap commands; Permit2 manages delegated token permission; and the spender is the protocol address authorized by that permission. Review them as separate fields with the chain, amount and expiration. A familiar domain or Permit2 address does not certify a signature as safe, and disconnecting a dapp does not revoke token approval.", ["https://developers.uniswap.org/docs/protocols/universal-router/overview", "https://developers.uniswap.org/docs/protocols/permit2/overview", "https://support.uniswap.org/hc/en-us/articles/26757826138637-What-is-a-token-contract-address", "https://support.uniswap.org/hc/en-us/articles/40050562560781-Crypto-Wallet-Signature-Scams", "https://support.uniswap.org/hc/en-us/articles/15724901841037-How-to-revoke-a-token-approval"]],
        ],
        sourceUrls: [
          "https://developers.uniswap.org/docs/get-started/concepts/fees",
          "https://developers.uniswap.org/docs/protocols/v4/concepts/dynamic-fees",
          "https://developers.uniswap.org/docs/protocols/v4/deployments",
          "https://developers.uniswap.org/docs/protocols/v4/guides/hooks/getting-started",
          "https://developers.uniswap.org/docs/protocols/permit2/overview",
          "https://developers.uniswap.org/docs/trading/swapping-api/supported-chains",
          "https://developers.uniswap.org/docs/protocols/universal-router/overview",
          "https://support.uniswap.org/hc/en-us/articles/26757826138637-What-is-a-token-contract-address",
          "https://support.uniswap.org/hc/en-us/articles/40050562560781-Crypto-Wallet-Signature-Scams",
          "https://support.uniswap.org/hc/en-us/articles/15724901841037-How-to-revoke-a-token-approval",
        ],
        relatedLinks: ["/compare/uniswap-vs-jupiter", "/news/uniswap-v3-vs-pancakeswap-v3-concentrated-liquidity-controls", "/topics/meme-coins", "/topics/no-kyc", "/factbook/uniswap", "/exchanges/jupiter"],
      },
      aerodrome: {
        title: "Aerodrome Review: Base DEX Fees, Pools, Slipstream & veAERO — NexuAlpha",
        description: "Aerodrome as a Base-native DEX path: pool-level fees, Slipstream routing, Base bridge, token contracts, gas, incentives and veAERO reward boundaries.",
        directAnswer: {
          question: "How should I check Aerodrome route and pool fee plus veAERO conditions?",
          answer: "Aerodrome is a Base-native DEX. Before swapping or adding liquidity, verify the official domain, Base network and bridge route, gas asset, token and pool contracts, standard or Slipstream pool type, displayed pool fee, liquidity, price impact and whether any incentive requires separate veAERO voting or locking. A pool route does not prove execution safety, regional availability or reward eligibility.",
        },
        faq: [
          ["Does Aerodrome have one universal DEX fee?", "No. Aerodrome routes should be checked at pool level because standard pools, Slipstream concentrated-liquidity pools, incentives and veAERO voting can change the practical cost or reward context."],
          ["What should I verify before using Aerodrome on Base?", "Confirm the official Aerodrome domain, Base wallet network, bridge route, gas asset, token contract, pool address, pool type, pool-level fees, liquidity and any veAERO voting or incentive terms."],
          ["Does an Aerodrome swap create veAERO rewards?", "No. A swap route and veAERO voting or reward claims are separate flows. A pool trade alone should not be treated as a reward entitlement."],
          ["Which decision path follows an Aerodrome pool check?", "After checking the pool, compare Base network funding, token contract, liquidity, route preview, gas, incentive terms and whether the user is swapping, adding liquidity or voting."],
      ["What is the compact Aerodrome CTA after this checklist?", "Open the official Aerodrome route only after the Base network, token contract, pool address, pool type, pool fee display and incentive terms match your task. This CTA is a source check, not a route-safety, availability or reward promise."],
      ["How should I compare Aerodrome with Uniswap or Jupiter?", "Use Aerodrome for Base-native pool and veAERO checks, Uniswap for multi-chain pool and hook checks, and Jupiter for Solana routing checks. Do not treat one quoted route, incentive display or pool page as a universal DEX winner."],
        ],
        sourceUrls: [
          "https://aerodrome.finance/",
          "https://aerodrome.finance/docs",
          "https://aerodrome.finance/docs/launcher",
        ],
        relatedLinks: ["/compare/uniswap-vs-jupiter", "/topics/no-kyc", "/topics/meme-coins", "/factbook/aerodrome", "/exchanges/uniswap", "/exchanges/jupiter"],
      },
      jupiter: {
        title: "Jupiter Solana Swap Routes, Ultra Quotes and Fee Checks — NexuAlpha",
        description: "Jupiter Swap and Ultra: Solana test quotes, no-route or failed-swap causes, platform fee boundaries, slippage, priority fees and route legs.",
        directAnswer: {
          question: "How should I check Jupiter route, test quote and platform fee conditions?",
          answer: "For a Jupiter route query, first decide whether the task is a test quote, live swap, token-list check, Ultra route review, API integration or platform-fee review, plus failed-swap diagnosis. Use Jupiter as a Solana routing and transaction-building path, not a custodial account. Check Swap or Ultra route output, token mint status, liquidity, platform fee configuration, slippage, price impact, network cost and every route leg in the wallet before signing; a quote is not custody, route-safety proof or a final-cost promise.",
        },
        faq: [
          ["Why can a Jupiter swap fail even after a quote appears?", "Jupiter Support says swaps can fail because price moves before execution, a pair lacks enough liquidity, trade size is unsuitable, token restrictions apply or route pricing becomes stale."],
          ["Does Jupiter Ultra compensation cover trading losses?", "Jupiter's support language limits Ultra review to defined bad-routing, repeated-failure or extreme-slippage cases and does not treat potential profit-and-loss as compensated."],
          ["What does 'No routes found' mean on Jupiter?", "It usually points to insufficient liquidity, unsuitable trade size or token restrictions. Verify real Solana DEX liquidity and token mint status before treating a route as available."],
          ["What should I check before signing a Jupiter route?", "Check token mint status, route legs, platform fee configuration, slippage, price impact, priority fee, wallet simulation and whether the final transaction matches the quote context."],
      ["What is the compact Jupiter CTA after this checklist?", "Open Jupiter only after the token mint, route legs, liquidity, platform-fee setting, slippage, priority fee and wallet transaction match the quote context. This CTA is a source check, not execution, safety or availability proof."],
      ["How should I compare Jupiter with Uniswap or Aerodrome?", "Use Jupiter for Solana route construction and quote checks, Uniswap for multi-chain pool and hook checks, and Aerodrome for Base pool and veAERO checks. The comparison should start with chain, token mint, liquidity source, route legs and wallet signing evidence."],
        ],
        sourceUrls: [
          "https://dev.jup.ag/docs/swap",
          "https://dev.jup.ag/docs/ultra",
          "https://dev.jup.ag/docs/tokens",
          "https://support.jup.ag/",
        ],
        relatedLinks: ["/compare/uniswap-vs-jupiter", "/news/jupiter-vs-raydium-solana-swap-routing-execution-controls", "/topics/no-kyc", "/topics/meme-coins", "/factbook/jupiter", "/exchanges/uniswap", "/exchanges/aerodrome"],
      },
      gmx: {
        title: "GMX v2 Fees: Pools, Price Impact, Funding and Liquidation — NexuAlpha",
        directAnswer: {
          question: "What should I check on GMX v2 before using a perpetual DEX route?",
          answer: "GMX v2 is a wallet-connected perpetual and swap route powered by GM or GLV liquidity pools rather than a conventional central order book. Before signing, check the official network and wallet route, selected pool, collateral, price impact, position and swap fees, borrow cost, funding, oracle-based execution, gas, referral-term scope and liquidation conditions.",
        },
        faq: [
          ["Is GMX v2 an order-book exchange?", "No. GMX documentation describes trading as powered by GM and GLV liquidity pools, while the order-type documentation describes oracle-based pricing rather than a central limit order book."],
          ["Does a GMX referral discount remove all trading costs?", "No. GMX referral documentation should be checked for the current v2 discount scope. It does not remove network costs, price impact, funding, liquidation risk, wallet-signing risk or regional front-end restrictions."],
          ["What should I verify before opening a GMX position?", "Verify the official GMX route, wallet network, collateral asset, pool context, order type, fee and referral terms, liquidation parameters, oracle-pricing boundary and final wallet transaction before depositing or trading."],
        ],
        sourceUrls: [
          "https://docs.gmx.io/docs/intro/",
          "https://docs.gmx.io/docs/trading/order-types/",
          "https://docs.gmx.io/docs/referrals/",
          "https://docs.gmx.io/docs/trading/liquidations/",
        ],
        relatedLinks: ["/factbook/gmx", "/compare/hyperliquid-vs-dydx", "/topics/derivatives#perp-cost-field-dictionary", "/topics/derivatives", "/topics/no-kyc", "/exchanges/hyperliquid", "/exchanges/dydx"],
      },
    }[slug];
    const localizedVenueOverride = localizedVenueSeoOverride(slug, requestedLocale, venueSeoOverride);
    const candidateVenueSeoOverride = PRIORITY_VENUE_SEO[slug]?.[requestedLocale] || localizedVenueOverride || (requestedLocale === "en" ? venueSeoOverride : null);
    const baseVenueSeoOverride = geoSafeVenueSeoOverride(candidateVenueSeoOverride, slug, { locale: requestedLocale, market: url.searchParams.get("market") });
    // Owner 2026-10-10: partner profiles lead with the real invite code (same rule as src/data/seo-injection.js).
    const referralSeo = referralSeoFor(slug, requestedLocale, url.searchParams.get("market"));
    const effectiveVenueSeoOverride = referralSeo ? { ...(baseVenueSeoOverride || {}), title: referralSeo.title, description: referralSeo.description } : baseVenueSeoOverride;
    const title = effectiveVenueSeoOverride?.title || (isZh
      ? `${venue.name} 评测、手续费与账户条件 — NexuAlpha`
      : localizedProfileTitle
        ? `${venue.name} ${localizedProfileTitle} — NexuAlpha`
        : `${venue.name} Review, Fee Conditions & Official Route — NexuAlpha`);
    const localizedProfileDescription = {
      "zh-Hant": `${venue.name} 手續費、產品、帳戶條件與官方來源的獨立資料。用戶權益、地區可用性和活動資格需在官方帳戶內核驗。`,
      ja: `${venue.name}の手数料、口座条件、公式情報を整理した独立プロフィール。特典と地域条件は公式アカウントで確認してください。`,
      ko: `${venue.name}의 수수료, 계정 조건, 공식 출처를 정리한 독립 프로필입니다. 혜택과 지역 조건은 공식 계정에서 확인하세요.`,
      tr: `${venue.name} için ücretleri, hesap koşullarını ve resmî kaynakları inceleyen bağımsız profil. Avantajları ve bölgesel uygunluğu resmî hesapta doğrulayın.`,
      es: `Perfil independiente de ${venue.name} con comisiones, condiciones de cuenta y fuentes oficiales. Verifica beneficios y disponibilidad regional en la cuenta oficial.`,
      "pt-BR": `Perfil independente da ${venue.name} com taxas, condições da conta e fontes oficiais. Confirme benefícios e disponibilidade regional na conta oficial.`,
      fr: `Profil indépendant de ${venue.name} avec frais, conditions de compte et sources officielles. Vérifiez les avantages et la disponibilité régionale sur le compte officiel.`,
      de: `Unabhängiges Profil von ${venue.name} mit Gebühren, Kontobedingungen und offiziellen Quellen. Vorteile und regionale Verfügbarkeit im offiziellen Konto prüfen.`,
      ar: `ملف مستقل لمنصة ${venue.name} يتناول الرسوم وشروط الحساب والمصادر الرسمية. تحقق من المزايا والتوفر الإقليمي عبر الحساب الرسمي.`,
      ru: `Независимый профиль ${venue.name}: комиссии, условия аккаунта и официальные источники. Проверяйте преимущества и доступность по региону в официальном аккаунте.`,
      id: `Profil independen ${venue.name} dengan biaya, ketentuan akun, dan sumber resmi. Verifikasi manfaat dan ketersediaan wilayah di akun resmi.`,
      vi: `Hồ sơ độc lập của ${venue.name} về phí, điều kiện tài khoản và nguồn chính thức. Xác minh quyền lợi và khả dụng theo khu vực trong tài khoản chính thức.`,
      it: `Profilo indipendente di ${venue.name} con commissioni, condizioni dell’account e fonti ufficiali. Verifica vantaggi e disponibilità regionale nell’account ufficiale.`,
    }[requestedLocale] || { "zh-Hant": `${venue.name} 手續費、產品、帳戶條件與官方來源的獨立資料。用戶權益、地區可用性和活動資格需在官方帳戶內核驗。` }[locale];
    const description = effectiveVenueSeoOverride?.description || (isZh
      ? `独立整理 ${venue.name} 的现货费率、合约费率、账户条件与官方来源；用户权益、地区可用性和活动资格需在官方账户内核验。`
      : localizedProfileDescription || `Independent ${venue.name} profile covering fee schedules, account conditions and official sources. User benefits, regional availability and campaign eligibility must be verified in the official account.`);

    const canonical = localizedCanonical(canonicalPath, locale);
    return {
      status: 200,
      title,
      description,
      canonical,
      locale,
      robots: "index,follow",
      marker: VENUE_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath),
      schema: buildWorkerVenueSchema(venue, schemaLocale, canonical, effectiveVenueSeoOverride).map((entry) => applyPartnerVenueFaqSchema(entry, slug, requestedLocale, url.searchParams.get("market"))),
    };
  }

  if (canonicalPath === "/compare") {
    // Compare hub (2026-10-11): the "compare any two" picker plus the curated and indexable generated pair lists.
    const hubCopy = compareIndexCopy(requestedLocale);
    const canonical = localizedCanonical("/compare", locale);
    return {
      status: 200,
      title: hubCopy.title,
      description: hubCopy.description,
      canonical,
      locale,
      robots: "index,follow",
      marker: COMPARE_ROUTE_MARKER,
      alternates: routeAlternates("/compare"),
      schema: [pageBreadcrumb(hubCopy.h1, canonical, "Exchanges", "/exchanges", schemaLocale), {
        "@type": "CollectionPage", name: hubCopy.h1, description: hubCopy.description, url: canonical, inLanguage: schemaLocale,
        hasPart: [...CURATED_COMPARISONS].map((pair) => ({ "@type": "WebPage", url: localizedCanonical(`/compare/${pair}`, locale) })),
      }],
    };
  }
  const compareMatch = canonicalPath.match(/^\/compare\/([a-z0-9-]+(?:-vs-[a-z0-9-]+){1,2})$/);
  if (compareMatch) {
    const pair = compareMatch[1];
    const slugs = pair.split("-vs-");
    const venues = slugs.map((slug) => VENUE_REGISTRY[slug]);
    if (slugs.length < 2 || slugs.length > 3 || new Set(slugs).size !== slugs.length || venues.some((venue) => !venue || !ACTIVE_VENUE_SLUGS.has(venue.slug))) {
      return notFoundMetadata(canonicalPath, locale);
    }
    const name = venues.map((venue) => venue.name).join(isZh ? " 对比 " : " vs ");
    const canonical = localizedCanonical(canonicalPath, locale);
    const curated = CURATED_COMPARISONS.has(pair);
    // Generated two-venue pairs (compare-any, 2026-10-11): templated copy per locale, index policy from the data.
    const generatedPolicy = !curated && slugs.length === 2 ? generatedComparePolicy(pair) : null;
    if (generatedPolicy?.generated) {
      const generatedCopy = generatedCompareCopy(requestedLocale, { nameA: venues[0].name, nameB: venues[1].name, date: generatedCompareDataDate(slugs) });
      return {
        status: 200,
        title: generatedCopy.title,
        description: generatedCopy.description,
        canonical, locale, robots: generatedPolicy.robots, marker: COMPARE_ROUTE_MARKER, generatedComparison: true,
        alternates: generatedPolicy.indexable ? routeAlternates(canonicalPath, generatedCompareLocales(pair)) : [],
        schema: buildWorkerCompareSchema(venues, schemaLocale, canonical, null),
      };
    }
    const compareSeoOverrides = {
      "binance-vs-okx": {
        title: "Binance vs OKX: Fees, Products, KYC and Web3 Access Checks — NexuAlpha",
        description: "Compare Binance and OKX by published fee tables, spot and derivatives product scope, identity requirements, Web3 or DEX-style access and account eligibility.",
        directAnswer: {
          question: "How should I compare Binance and OKX before choosing an exchange?",
          answer: "Compare Binance and OKX by their official fee tables, product-specific availability, identity requirements, regional restrictions, Web3 or DEX-style access paths and announcement sources. Do not treat either public comparison as a current account entitlement, fee guarantee or eligibility decision.",
        },
        faq: [
          ["Is Binance vs OKX mainly a fee comparison?", "Fees matter, but the safer comparison also checks product scope, KYC, regional eligibility, Web3 wallet or DEX-style routing, official announcements and the source date for each claim."],
          ["Can this page decide whether my account can trade a product?", "No. It can narrow what to verify. Final access depends on the current official account flow, user region, verification status, product rules and platform terms."],
        ],
        relatedLinks: ["/exchanges/binance", "/exchanges/okx", "/topics/derivatives", "/factbook/binance", "/factbook/okx"],
        sourceUrls: [
          "https://www.binance.com/en/fee/trading",
          "https://www.binance.com/en/support/faq/detail/360027287111",
          "https://www.okx.com/fees",
          "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported",
        ],
      },
      "binance-vs-bybit": {
        title: "Binance vs Bybit: Fees, Futures, Earn and KYC Checks — NexuAlpha",
        description: "Compare Binance and Bybit by published spot and futures fees, product scope, Earn or copy-trading boundaries, identity requirements, regional limits and official account terms.",
        directAnswer: {
          question: "How should I compare Binance and Bybit before choosing a trading platform?",
          answer: "Compare Binance and Bybit by product category first: spot, futures, options, Earn-style products and copy-trading routes can have separate fee tables, identity checks, regional limits and risk terms. Use the comparison to decide what to verify on the official account screen, not as a fee, access or benefit promise.",
        },
        faq: [
          ["Is Binance vs Bybit only a lower-fee decision?", "No. Compare published maker and taker fees beside futures funding, product permissions, KYC, regional availability, withdrawal route, copy-trading terms and current official notices."],
          ["What should I verify before using a registration route?", "Confirm official domain, product name, fee schedule date, account tier, identity status, region and whether the product you need is enabled for your account."],
          ["Which NexuAlpha pages support this comparison?", "Use the venue profiles for account and source checks, the rates terminal for scenario cost context, and derivatives topic pages for funding, liquidation and margin mechanics."],
        ],
        relatedLinks: ["/exchanges/binance", "/exchanges/bybit", "/rates", "/topics/derivatives", "/factbook/binance", "/factbook/bybit"],
        sourceUrls: [
          "https://www.binance.com/en/fee/trading",
          "https://www.binance.com/en/support/faq/detail/360027287111",
          "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
          "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
        ],
      },
      "okx-vs-bybit": {
        title: "OKX vs Bybit: Fees, Web3, Derivatives and Account Checks — NexuAlpha",
        description: "Compare OKX and Bybit by fee schedules, derivatives access, Web3 or wallet routes, copy-trading context, identity requirements, regional limits and official account terms.",
        directAnswer: {
          question: "How should I compare OKX and Bybit before opening an account?",
          answer: "Compare OKX and Bybit by separating exchange-account products from wallet or Web3 routes, then check published fees, derivatives access, copy-trading conditions, identity requirements, regional restrictions and official account terms. A public comparison cannot prove your final account cost or product eligibility.",
        },
        faq: [
          ["What makes OKX vs Bybit different from a generic fee page?", "OKX includes exchange and Web3-style routes, while Bybit searches often include derivatives, copy trading and tokenized exposure. Compare the actual product path before comparing fees."],
          ["Should derivatives funding decide the choice?", "No. Funding is only one field. Compare maker and taker fees, margin mode, liquidation terms, collateral, account permissions and withdrawal route together."],
          ["What should happen before a CTA click?", "The visitor should see the official-domain path, source date, account checks and product-scope limits before leaving NexuAlpha for the platform flow."],
        ],
        relatedLinks: ["/exchanges/okx", "/exchanges/bybit", "/rates", "/topics/derivatives", "/factbook/okx", "/factbook/bybit"],
        sourceUrls: [
          "https://www.okx.com/fees",
          "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported",
          "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
          "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
        ],
      },
      "binance-vs-mexc": {
        title: "Binance vs MEXC: Fees, Listings, KYC and Region Checks — NexuAlpha",
        description: "Compare Binance and MEXC by published fee tables, futures and spot scope, listing breadth, identity requirements, regional limits, withdrawal routes and official source dates.",
        directAnswer: {
          question: "How should I compare Binance and MEXC for fees and listing access?",
          answer: "Compare Binance and MEXC by separating broad exchange depth from listing access. Check published spot and futures fees, product permissions, KYC requirements, regional availability, withdrawal networks and official source dates before treating either platform as the right registration route.",
        },
        faq: [
          ["Is MEXC listing breadth enough to choose it over Binance?", "No. Listing breadth must be checked with liquidity, withdrawal network, account permissions, regional conditions and token-specific risk before it becomes a platform decision."],
          ["What fee fields should be compared?", "Compare maker and taker fees by product, futures funding, withdrawal network costs, spread or slippage context and the account tier shown by the official platform."],
          ["Can this page promise account access?", "No. Final product access, KYC, region, asset availability and fee tier depend on the official platform flow and current account status."],
        ],
        relatedLinks: ["/exchanges/binance", "/exchanges/mexc", "/rates", "/topics/meme-coins", "/factbook/binance", "/factbook/mexc"],
        sourceUrls: [
          "https://www.binance.com/en/fee/trading",
          "https://www.binance.com/en/support/faq/detail/360027287111",
          "https://www.mexc.com/fee",
          "https://www.mexc.com/support",
        ],
      },
      "okx-vs-mexc": {
        title: "OKX vs MEXC: Fees, Wallet Routes, Listings and KYC Checks — NexuAlpha",
        description: "Compare OKX and MEXC by published fees, exchange versus wallet routes, listing access, futures scope, identity requirements, regional limits and official account terms.",
        directAnswer: {
          question: "How should I compare OKX and MEXC before choosing a route?",
          answer: "Compare OKX and MEXC by asking whether the task is exchange trading, Web3-style access, listing discovery or futures execution. Then verify published fee schedules, KYC, regional restrictions, withdrawal route, product availability and official account terms before leaving NexuAlpha.",
        },
        faq: [
          ["Is OKX vs MEXC a CEX versus DEX decision?", "Not exactly. OKX can involve exchange and Web3-style routes, while MEXC is often searched for listing breadth. The route should be separated before fees are compared."],
          ["What should be checked for high-intent listing searches?", "Confirm token contract, listing pair, liquidity, withdrawal network, risk notice, account permission and regional availability on the official platform."],
          ["Does this comparison include a registration promise?", "No. It keeps the source trail and account checks visible; registration, KYC, deposits and trading happen only under current official terms."],
        ],
        relatedLinks: ["/exchanges/okx", "/exchanges/mexc", "/rates", "/topics/meme-coins", "/factbook/okx", "/factbook/mexc"],
        sourceUrls: [
          "https://www.okx.com/fees",
          "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported",
          "https://www.mexc.com/fee",
          "https://www.mexc.com/support",
        ],
      },
      "bybit-vs-bitget": {
        title: "Bybit vs Bitget Stocks, Copy Trading, Fees and Account Checks — NexuAlpha",
        description: "Compare Bybit and Bitget by product label first: xStocks fee schedule, stock futures, copy-trading profit sharing, KYC, region and account-route limits.",
        directAnswer: {
          question: "How should I compare Bybit and Bitget before choosing a platform?",
          answer: "Start by labeling the product. Bybit xStocks, Bybit TradFi derivatives, Bitget stock futures, Bitget stock-product pages and crypto copy trading are different paths. Compare the product-specific official fee table first: xStocks uses the Adventure Zone & xStocks schedule, not ordinary crypto spot fees; copy trading needs the profit-sharing rules and the selected trader/account page.",
        },
        faq: [
          ["Does Bybit vs Bitget mean real stocks are available?", "Not by default. Separate real securities, tokenized securities, stock perpetuals, copy-trading products and regional account availability before treating a stock-related query as an eligible trading route."],
          ["What should a stock-related search compare first?", "First label the product type: real share, tokenized stock, stock perpetual, index exposure, margin product or copy-trading portfolio. Then check country access, account verification and current official product terms."],
          ["How are tokenized stocks, stock perpetuals and copy trading different?", "A tokenized stock usually tracks a security through an issued token, a stock perpetual is a derivatives contract without physical share ownership, and copy trading follows another trader's portfolio or strategy. Each route has different custody, margin, liquidation, region and account-permission checks."],
          ["Which checks matter before using a copy-trading route?", "Compare KYC level, region, product permissions, fee schedule, lead-trader rules and official account conditions. A public comparison page is not a promise that every account receives the same product access."],
          ["Which official sources should I open before deciding?", "Open Bybit's xStocks FAQ, trading-fee and identity-verification pages; then open Bitget's futures agreement, product-fee FAQ, futures fee and identity pages. These sources separate tokenized stock, stock-futures ownership, copy-trading costs and regional account access; the logged-in account still decides final availability."],
          ["Which NexuAlpha path should I use after this comparison?", "Use the Bybit and Bitget profiles for account-route checks, the tokenized stocks vs perpetuals topic for stock-exposure boundaries, the derivatives topic for margin and liquidation checks, and each factbook for official-domain and source review before leaving NexuAlpha."],
        ],
        relatedLinks: ["/exchanges/bybit", "/exchanges/bitget", "/topics/derivatives", "/topics/tokenized-stocks-vs-perpetuals", "/topics/tokenized-assets", "/factbook/bybit", "/factbook/bitget", "/news/bybit-vs-bitget-fees-products-risk-controls", "/news/crypto-exchange-fee-disclosure-audit"],
        sourceUrls: [
          "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
          "https://www.bybit.com/en/help-center/article/FAQ-xStocks-on-Bybit",
          "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ",
          "https://announcements.bybit.com/en/",
          "https://www.bitget.com/support/articles/12560603820584",
          "https://www.bitget.com/support/articles/12560603817155",
          "https://www.bitget.com/support/articles/7700532076057",
          "https://www.bitget.com/support/articles/12560603892733",
          "https://www.bitget.com/support/articles/12560603795184",
          "https://www.bitget.com/support/announcement-center",
        ],
      },
      "hyperliquid-vs-dydx": {
        title: "Hyperliquid vs dYdX: Perp Fees, Funding, Liquidation and Access Checks — NexuAlpha",
        description: "Compare Hyperliquid and dYdX by fee schedules, funding, collateral, liquidation rules, oracle design, wallet signing, no-KYC access assumptions and official documentation.",
        directAnswer: {
          question: "How should I compare Hyperliquid and dYdX as crypto perpetual platforms?",
          answer: "Compare Hyperliquid and dYdX by execution model, fee schedule, funding cadence, collateral, liquidation logic, oracle design, wallet-signing route, network dependency, regional limits and official documentation. A lower quoted cost or faster interface does not remove liquidation, bridge, outage or eligibility risk.",
        },
        faq: [
          ["Which risk check matters first on Hyperliquid vs dYdX?", "Start with collateral and liquidation. Confirm what asset backs the position, how margin is maintained, how liquidations are triggered, what oracle or price source is used and what happens if the wallet, network, indexer or front end is unavailable."],
          ["Is Hyperliquid vs dYdX a no-KYC comparison?", "Only partly. Wallet connection can reduce account friction, but no-KYC access still depends on front-end availability, regional restrictions, sanctions controls, product rules, wallet screening and current official terms. Treat it as an access-risk comparison, not an eligibility promise."],
          ["Should funding rates decide the platform choice?", "Funding is one input, not the whole decision. Compare funding cadence, maker and taker fees, liquidity, collateral movement, liquidation rules, oracle route, withdrawal path and operational recovery before choosing a perpetual venue."],
          ["Should I read the news explainer or this comparison page?", "Use the news article for the dated source-reading explainer. Use this comparison page for the current decision checklist across fees, funding, collateral, liquidation, wallet route, account access and operational recovery."],
          ["What dYdX onboarding detail belongs beside the fee comparison?", "Check dYdX onboarding, wallet screening, regional access, bridge route and withdrawal path beside fees and funding. Those source checks can change whether a wallet-connected route is usable before the trade cost is even relevant."],
        ],
        relatedLinks: ["/news/hyperliquid-vs-dydx", "/topics/no-kyc", "/topics/derivatives#perp-cost-field-dictionary", "/topics/derivatives", "/exchanges/hyperliquid", "/exchanges/dydx", "/factbook/hyperliquid", "/factbook/dydx"],
        sourceUrls: [
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding",
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations",
          "https://docs.dydx.xyz/concepts/onboarding-faqs",
          "https://docs.dydx.xyz/concepts/trading/rewards_fees_and_parameters",
        ],
      },
    };
    const baseCompareSeoOverride = requestedLocale === "en" ? compareSeoOverrides[pair] : null;
    const localFirstComparePairs = new Set(["binance-vs-okx", "binance-vs-bybit", "okx-vs-bybit", "binance-vs-mexc", "okx-vs-mexc"]);
    // Pairs outside the generated projection (the 2026-10-10 market-plan pairs) read the shared direct-answer data
    // for every locale, the same source the SSR page and seo-injection use.
    const sharedDirectAnswerOverride = PRIORITY_COMPARE_SEO[pair] ? null : compareSeoOverrideFromDirectAnswer(pair, requestedLocale);
    const compareSeoOverride = sharedDirectAnswerOverride || (localFirstComparePairs.has(pair)
      ? baseCompareSeoOverride || PRIORITY_COMPARE_SEO[pair]?.[requestedLocale] || localizedCompareSeoOverride(pair, requestedLocale, compareSeoOverrides[pair])
      : PRIORITY_COMPARE_SEO[pair]?.[requestedLocale] || localizedCompareSeoOverride(pair, requestedLocale, compareSeoOverrides[pair]) || baseCompareSeoOverride);
    return {
      status: 200,
      title: compareSeoOverride?.title || `${name}: ${({ "zh-Hant": "手續費與平台選擇", ja: "取引手数料とプラットフォーム比較", ko: "거래 수수료 및 플랫폼 비교", tr: "İşlem ücretleri ve platform karşılaştırması", es: "Comisiones y comparación de plataformas", "pt-BR": "Taxas e comparação de plataformas", fr: "Frais et comparaison des plateformes", de: "Gebühren und Plattformvergleich", ar: "مقارنة الرسوم والمنصات", ru: "Сравнение комиссий и платформ", id: "Perbandingan biaya dan platform", vi: "So sánh phí và nền tảng", it: "Confronto di commissioni e piattaforme",
      // l10n: needs native review
      ur: "فیس اور پلیٹ فارم موازنہ",
      // l10n: needs native review
      uk: "Комісії та порівняння платформ" }[requestedLocale] || (isZh ? "手续费与平台选择" : "Trading Fees & Platform Comparison"))} — NexuAlpha`,
      description: compareSeoOverride?.description || (isZh ? `${name}：比较手续费、产品、账户条件与平台差异。` : ({
        "zh-Hant": `比較 ${name} 的手續費、產品、帳戶條件與平台差異。`,
        ja: `${name}：手数料、商品、口座条件、プラットフォームの違いを比較します。`,
        ko: `${name}: 거래 수수료, 상품, 계정 조건과 플랫폼 차이를 비교합니다.`,
        tr: `${name}: işlem ücretleri, ürünler, hesap koşulları ve platform farklarını karşılaştırın.`,
        es: `${name}: compara comisiones, productos, condiciones de cuenta y diferencias entre plataformas.`,
        "pt-BR": `${name}: compare taxas, produtos, condições da conta e diferenças entre plataformas.`,
        fr: `${name} : comparez les frais, les produits, les conditions de compte et les différences entre plateformes.`,
        de: `${name}: Vergleichen Sie Gebühren, Produkte, Kontobedingungen und Plattformunterschiede.`,
        ar: `${name}: قارن الرسوم والمنتجات وشروط الحساب والفروق بين المنصات.`,
        ru: `${name}: сравните комиссии, продукты, условия аккаунта и различия платформ.`,
        id: `${name}: bandingkan biaya, produk, ketentuan akun, dan perbedaan antarplatform.`,
        vi: `${name}: so sánh phí, sản phẩm, điều kiện tài khoản và khác biệt giữa các nền tảng.`,
        it: `${name}: confronta commissioni, prodotti, condizioni dell’account e differenze tra piattaforme.`,

        // l10n: needs native review
        ur: `${name}: ٹریڈنگ فیس، مصنوعات، اکاؤنٹ کی شرائط اور پلیٹ فارم کے فرق کا موازنہ کریں۔`,

        // l10n: needs native review
        uk: `${name}: порівняйте торгові комісії, продукти, вимоги до акаунта й відмінності платформ.`,
      }[requestedLocale] || `Compare ${name} by trading fees, products, account requirements and platform differences.`)),
      canonical, locale, robots: curated ? "index,follow" : "noindex,follow", marker: COMPARE_ROUTE_MARKER,
      alternates: curated ? routeAlternates(canonicalPath) : [],
      schema: buildWorkerCompareSchema(venues, schemaLocale, canonical, compareSeoOverride),
    };
  }

  if (canonicalPath === "/activities") {
    const activityLocalized = { ja: { title: "公式暗号資産キャンペーン・上場・エアドロップレーダー — NexuAlpha", description: "確認済みの公式キャンペーン、新規上場、Launchpool、各プラットフォームの新規特典を整理します。" }, ko: { title: "공식 암호화폐 캠페인·상장·에어드롭 레이더 — NexuAlpha", description: "검토된 공식 캠페인, 신규 상장, Launchpool과 플랫폼별 신규 혜택을 정리합니다." }, tr: { title: "Resmî kripto kampanyaları, listelemeler ve airdrop radarı — NexuAlpha", description: "İncelenmiş resmî kampanyaları, yeni listelemeleri, Launchpool ve platforma özel avantajları takip edin." }, es: { title: "Radar de campañas cripto oficiales y airdrops — NexuAlpha", description: "Consulta campañas oficiales, nuevos listados, Launchpool y ventajas para nuevos usuarios." }, "zh-Hant": { title: "官方加密活動、上線與空投雷達 — NexuAlpha", description: "整理已審核的官方活動、新上線、Launchpool 與平台更新。" }, "pt-BR": { title: "Radar de campanhas cripto oficiais e airdrops — NexuAlpha", description: "Consulte campanhas oficiais, novas listagens, Launchpool e atualizações de plataformas." }, fr: { title: "Radar des campagnes crypto officielles et airdrops — NexuAlpha", description: "Consultez les campagnes officielles, nouvelles cotations, Launchpool et mises à jour des plateformes." }, de: { title: "Radar für offizielle Krypto-Kampagnen und Airdrops — NexuAlpha", description: "Prüfen Sie offizielle Kampagnen, neue Listings, Launchpool und Plattform-Updates." }, ar: { title: "رادار حملات العملات المشفرة الرسمية والإسقاطات — NexuAlpha", description: "راجع الحملات الرسمية والإدراجات الجديدة وLaunchpool وتحديثات المنصات." }, ru: { title: "Радар официальных криптокампаний и аирдропов — NexuAlpha", description: "Изучайте официальные кампании, новые листинги, Launchpool и обновления платформ." }, id: { title: "Radar kampanye kripto resmi dan airdrop — NexuAlpha", description: "Tinjau kampanye resmi, listing baru, Launchpool, dan pembaruan platform." }, vi: { title: "Radar chiến dịch crypto chính thức và airdrop — NexuAlpha", description: "Xem các chiến dịch chính thức, niêm yết mới, Launchpool và cập nhật nền tảng." }, it: { title: "Radar delle campagne crypto ufficiali e degli airdrop — NexuAlpha", description: "Consulta campagne ufficiali, nuovi listing, Launchpool e aggiornamenti delle piattaforme." } }[requestedLocale];
    const title = isZh
      ? "官方活动中心：Launchpool 质押、新币空投与迎新福利雷达 — NexuAlpha"
      : activityLocalized?.title || "Official Crypto Campaigns, Launchpool & Airdrop Radar — NexuAlpha";
    const description = isZh
      ? "实时追踪币安、OKX、Bybit 等官方最新活动，汇集 Launchpool 挖矿年化、空投申领、充值返利与独家新手任务礼包。"
      : activityLocalized?.description || "Verified exchange campaigns, new token listings, Launchpool staking yields, and platform-specific welcome terms across reviewed venues.";

    return {
      status: 200,
      title,
      description,
      canonical: localizedCanonical("/activities", locale),
      locale,
      robots: "index,follow",
      marker: ACTIVITIES_ROUTE_MARKER,
      alternates: routeAlternates("/activities"),
      schema: buildWorkerActivitiesSchema(schemaLocale),
    };
  }

  // Brazil BCB deadline topic (owner plan 2026-10-12): same data and head as computeRouteSeo. English slug indexable in
  // en, Portuguese slug in pt-BR; other pairs are noindex with a canonical to the edition of their language.
  if (isBrazilDeadlinePath(canonicalPath)) {
    const indexable = brazilDeadlineIndexable(canonicalPath, locale);
    const content = brazilDeadlineContent(locale);
    const canonical = localizedCanonical(brazilDeadlinePathFor(locale), brazilDeadlineContentLocale(locale));
    return {
      status: 200,
      title: `${content.metaTitle} — NexuAlpha`,
      description: content.metaDescription,
      canonical,
      locale,
      robots: indexable ? "index,follow" : "noindex,follow",
      marker: TOPIC_ROUTE_MARKER,
      alternates: indexable ? brazilDeadlineAlternates(localizedCanonical) : [],
      schema: brazilDeadlineSchemas(locale, canonical, PUBLIC_ORIGIN),
    };
  }

  // /topics/<exchange>-alternatives (exchange keyword plan 2026-10-11): same data and head as computeRouteSeo.
  const alternativesPage = venueAlternativePage(canonicalPath.match(/^\/topics\/([a-z0-9-]+)$/)?.[1]);
  if (alternativesPage) {
    const indexable = VENUE_ALTERNATIVES_INDEX_LOCALES.includes(locale);
    const content = venueAlternativesContent(alternativesPage, locale);
    const canonical = localizedCanonical(canonicalPath, indexable ? locale : "en");
    return {
      status: 200,
      title: `${content.metaTitle} — NexuAlpha`,
      description: content.metaDescription,
      canonical,
      locale: indexable ? locale : content.locale,
      robots: indexable ? "index,follow" : "noindex,follow",
      marker: TOPIC_ROUTE_MARKER,
      alternates: indexable ? routeAlternates(canonicalPath, VENUE_ALTERNATIVES_INDEX_LOCALES) : [],
      schema: venueAlternativesSchemas(alternativesPage, locale, canonical, PUBLIC_ORIGIN),
    };
  }

  const tokenizedTopicMatch = canonicalPath.match(/^\/topics\/(tokenized-assets|tokenized-treasuries|tokenized-stocks-vs-perpetuals)$/);
  if (tokenizedTopicMatch) {
    const topic = TOKENIZED_ASSET_REGISTRY[tokenizedTopicMatch[1]];
    const contentLocale = TOKENIZED_ASSET_LOCALES.includes(locale) ? locale : "en";
    const indexable = TOKENIZED_ASSET_LOCALES.includes(locale);
    const canonical = indexable
      ? localizedCanonical(canonicalPath, contentLocale)
      : localizedCanonical(canonicalPath, "en");
    return {
      status: 200,
      title: contentLocale === "zh-Hans" ? `${topic.titleZh} — NexuAlpha` : `${topic.titleEn} — NexuAlpha`,
      description: contentLocale === "zh-Hans" ? topic.descZh : topic.descEn,
      canonical,
      locale: contentLocale,
      robots: indexable ? "index,follow" : "noindex,follow",
      marker: TOPIC_ROUTE_MARKER,
      alternates: indexable ? routeAlternates(canonicalPath, TOKENIZED_ASSET_LOCALES) : [],
      schema: buildTokenizedAssetSchema(topic, contentLocale, canonical),
    };
  }

  const topicMatch = canonicalPath.match(/^\/topics(?:\/([a-z0-9-]+))?$/);
  if (topicMatch) {
    if (!topicMatch[1]) {
      const isPublishedLocale = locale === "en";
      const canonical = localizedCanonical("/topics", "en");
      const isZh = locale === "zh-Hans";
      return {
        status: 200,
        title: isZh ? "主题研究聚合页 — NexuAlpha" : "Topic Research Hubs — NexuAlpha",
        description: isZh ? "按交易主题聚合平台比较、费用核验、地区条件、链上风险与来源记录。" : "A collection of trading-topic research paths covering platform comparisons, fee checks, regional conditions, on-chain risks and source records.",
        canonical,
        locale,
        robots: isPublishedLocale ? "index,follow" : "noindex,follow",
        marker: TOPIC_ROUTE_MARKER,
        alternates: isPublishedLocale ? routeAlternates("/topics", ["en"]) : [],
        schema: buildWorkerCollectionHubSchema("topics", isPublishedLocale ? locale : "en", canonical),
      };
    }
    const rawSlug = topicMatch[1] || "meme-coins";
    const slug = cleanSlug(rawSlug);
    const topic = slug ? TOPIC_REGISTRY[slug] : null;
    if (!topic) {
      return {
        status: 404,
        title: "Topic Guide Not Found — NexuAlpha",
        description: "The requested cryptocurrency trading track guide is unavailable.",
        canonical: localizedCanonical(canonicalPath, locale),
        locale,
        robots: "noindex,nofollow",
      };
    }

    const localizedTopicTitles = {
      en: {
        "meme-coins": "Meme coin platform comparison (2026): MEXC vs Gate.io vs Raydium — NexuAlpha",
        derivatives: "Crypto perpetual platform comparison: Binance, Bybit and Hyperliquid — NexuAlpha",
        "compliant-exchanges": "Regulated crypto exchange comparison for fiat access: HashKey, Kraken and OKX — NexuAlpha",
        "no-kyc": "No-KYC Self-Custody vs KYC Exchange (2026): Hyperliquid, dYdX and MEXC — NexuAlpha",
      },
      ja: {
        "meme-coins": "ミームコイン取引プラットフォーム比較：MEXC・Gate.io・Raydium — NexuAlpha",
        derivatives: "暗号資産パーペチュアル取引プラットフォーム比較：Binance・Bybit・Hyperliquid — NexuAlpha",
      },
      ko: {
        "meme-coins": "밈코인 거래 플랫폼 비교: MEXC·Gate.io·Raydium — NexuAlpha",
        derivatives: "암호화폐 무기한 계약 플랫폼 비교: Binance·Bybit·Hyperliquid — NexuAlpha",
      },
      tr: {
        "meme-coins": "Meme coin işlem platformları karşılaştırması: MEXC, Gate.io ve Raydium — NexuAlpha",
        derivatives: "Kripto sürekli vadeli işlem platformları karşılaştırması: Binance, Bybit ve Hyperliquid — NexuAlpha",
      },
      "zh-Hant": { "meme-coins": "迷因幣交易平台比較：MEXC、Gate.io 與 Raydium — NexuAlpha", derivatives: "加密永續合約平台比較：Binance、Bybit 與 Hyperliquid — NexuAlpha" },
      es: { "meme-coins": "Comparativa de plataformas para memecoins: MEXC, Gate.io y Raydium — NexuAlpha", derivatives: "Comparativa de plataformas de perpetuos cripto: Binance, Bybit y Hyperliquid — NexuAlpha" },
      "pt-BR": { "meme-coins": "Comparação de plataformas para memecoins: MEXC, Gate.io e Raydium — NexuAlpha", derivatives: "Comparação de plataformas perpétuas cripto: Binance, Bybit e Hyperliquid — NexuAlpha" },
      fr: { "meme-coins": "Comparatif des plateformes de memecoins : MEXC, Gate.io et Raydium — NexuAlpha", derivatives: "Comparatif des plateformes perpétuelles crypto : Binance, Bybit et Hyperliquid — NexuAlpha" },
      de: { "meme-coins": "Vergleich von Memecoin-Plattformen: MEXC, Gate.io und Raydium — NexuAlpha", derivatives: "Vergleich von Krypto-Perpetual-Plattformen: Binance, Bybit und Hyperliquid — NexuAlpha" },
      ar: { "meme-coins": "مقارنة منصات عملات الميم: MEXC وGate.io وRaydium — NexuAlpha", derivatives: "مقارنة منصات العقود الدائمة للعملات المشفرة: Binance وBybit وHyperliquid — NexuAlpha" },
      ru: { "meme-coins": "Сравнение платформ для мемкоинов: MEXC, Gate.io и Raydium — NexuAlpha", derivatives: "Сравнение криптоплатформ для бессрочных контрактов: Binance, Bybit и Hyperliquid — NexuAlpha" },
      id: { "meme-coins": "Perbandingan platform memecoin: MEXC, Gate.io, dan Raydium — NexuAlpha", derivatives: "Perbandingan platform perpetual kripto: Binance, Bybit, dan Hyperliquid — NexuAlpha" },
      vi: { "meme-coins": "So sánh nền tảng memecoin: MEXC, Gate.io và Raydium — NexuAlpha", derivatives: "So sánh nền tảng perpetual crypto: Binance, Bybit và Hyperliquid — NexuAlpha" },
      it: { "meme-coins": "Confronto delle piattaforme memecoin: MEXC, Gate.io e Raydium — NexuAlpha", derivatives: "Confronto delle piattaforme perpetual crypto: Binance, Bybit e Hyperliquid — NexuAlpha" },
    }[locale]?.[topic.slug];
    const localizedTopicSeo = localizedTopicSeoOverride(topic.slug, locale);
    const sourceTitle = sanitizePublicText((localizedTopicSeo?.title || localizedTopicTitles || (isZh ? topic.titleZh : topic.titleEn)).replace(/百倍/g, "高波动"));
    const title = topic.slug === "no-kyc" ? noKycMetaTitle(locale) : sourceTitle;
    const description = sanitizePublicText((localizedTopicSeo?.description || (isZh ? topic.descZh : topic.descEn)))
      .replace(/20%\s*(fee\s*)?rebate/gi, "user benefits pending official verification")
      .replace(/零手续费/g, "费率条件待官方核验")
      .replace(/zero[- ]fee/gi, "published fee terms")
      .replace(/0\.00%/g, "published base fee terms")
      .replace(/100x/gi, "high-volatility");
    const resolvedPath = `/topics/${topic.slug}`;
    const canonical = localizedCanonical(resolvedPath, locale);

    return {
      status: 200,
      title,
      description,
      canonical,
      locale,
      robots: "index,follow",
      marker: TOPIC_ROUTE_MARKER,
      alternates: routeAlternates(resolvedPath),
      schema: buildWorkerTopicSchema(topic, schemaLocale, canonical, localizedTopicSeo),
    };
  }

  const factbookMatch = canonicalPath.match(/^\/factbook(?:\/([a-z0-9-]+))?$/);
  if (factbookMatch) {
    if (!factbookMatch[1]) {
      const isPublishedLocale = locale === "en";
      const canonical = localizedCanonical("/factbook", "en");
      const isZh = locale === "zh-Hans";
      return {
        status: 200,
        title: isZh ? "来源审阅事实库 — NexuAlpha" : "Source Review Factbook — NexuAlpha",
        description: isZh ? "按平台聚合公开来源、费率字段、账户条件、官方域名与核验边界。" : "A platform-level collection of published source records, fee fields, account conditions, official domains and verification limits.",
        canonical,
        locale,
        robots: isPublishedLocale ? "index,follow" : "noindex,follow",
        marker: FACTBOOK_ROUTE_MARKER,
        alternates: isPublishedLocale ? routeAlternates("/factbook", ["en"]) : [],
        schema: buildWorkerCollectionHubSchema("factbook", isPublishedLocale ? locale : "en", canonical),
      };
    }
    const rawSlug = factbookMatch[1] || "binance";
    const slug = cleanSlug(rawSlug);
    const venue = slug ? VENUE_REGISTRY[slug] : null;
    if (!venue) {
      return {
        status: 404,
        title: "Factbook Not Found — NexuAlpha",
        description: "The requested exchange factbook profile is unavailable or not indexed.",
        canonical: localizedCanonical(canonicalPath, locale),
        locale,
        robots: "noindex,nofollow",
      };
    }

    const title = isZh
      ? `${venue.name} 来源审阅事实库 (Factbook) — NexuAlpha`
      : `${venue.name} ${({ "zh-Hans": "来源审阅事实库 (Factbook)", "zh-Hant": "來源審閱事實庫 (Factbook)", ja: "出典ファクトブック", ko: "출처 팩트북", tr: "Kaynak factbook", es: "Ficha de fuentes", "pt-BR": "Ficha de fontes", fr: "Fiche des sources", de: "Quellen-Factbook", ar: "سجل المصادر", ru: "Досье источников", id: "Factbook sumber", vi: "Hồ sơ nguồn", it: "Factbook delle fonti" }[requestedLocale] || "Source Review Factbook")} — NexuAlpha`;
    const factbookDescriptions = {
      "zh-Hans": `${venue.name} 来源审阅事实库：基础费率、地区资格、KYC 参考与官方域名核验。用户权益和储备数据须逐项核对来源与更新时间。`,
      "zh-Hant": `${venue.name} 來源審閱事實庫：基礎費率、地區資格、KYC 參考與官方網域核驗。用戶權益和儲備資料須逐項核對來源與更新時間。`,
      es: `Ficha de fuentes de ${venue.name}: comisiones base, acceso regional, referencias KYC y dominios oficiales. Beneficios y reservas requieren verificación por fuente.`,
      "pt-BR": `Ficha de fontes da ${venue.name}: taxas base, acesso regional, referências de KYC e domínios oficiais. Benefícios e reservas exigem verificação por fonte.`,
      fr: `Factbook des sources pour ${venue.name} : frais de base, accès régional, KYC et domaines officiels. Avantages et réserves exigent une vérification par source.`,
      de: `Quellen-Factbook für ${venue.name}: Basisgebühren, regionaler Zugang, KYC-Hinweise und offizielle Domains. Vorteile und Reserven brauchen Quellenprüfung.`,
      ja: `${venue.name}の基本手数料、地域アクセス、KYC情報、公式ドメインを確認する出典ファクトブック。特典と準備金は項目ごとの確認が必要です。`,
      ko: `${venue.name}의 기본 수수료, 지역 접근성, KYC 정보와 공식 도메인을 확인하는 출처 팩트북입니다. 혜택과 준비금은 항목별 확인이 필요합니다.`,
      ar: `سجل مصادر ${venue.name}: الرسوم الأساسية، الوصول الإقليمي، مراجع KYC والنطاقات الرسمية. تتطلب المزايا والاحتياطيات تحققاً لكل مصدر.`,
      tr: `${venue.name} için kaynak factbook: temel ücretler, bölgesel erişim, KYC referansları ve resmî alan adları. Avantajlar ve rezervler kaynak bazında doğrulanmalıdır.`,
      ru: `Досье источников ${venue.name}: базовые комиссии, региональный доступ, KYC и официальные домены. Преимущества и резервы проверяются по источникам.`,
      id: `Factbook sumber ${venue.name}: biaya dasar, akses regional, referensi KYC, dan domain resmi. Manfaat dan cadangan harus diverifikasi per sumber.`,
      vi: `Hồ sơ nguồn của ${venue.name}: phí cơ sở, quyền truy cập theo khu vực, KYC và tên miền chính thức. Quyền lợi và dự trữ cần kiểm tra theo nguồn.`,
      it: `Factbook delle fonti per ${venue.name}: commissioni base, accesso regionale, KYC e domini ufficiali. Vantaggi e riserve richiedono verifica per fonte.`,
    };
    const description = factbookDescriptions[requestedLocale] || `Source-aware Factbook for ${venue.name}: base fee schedules, regional access, KYC references, and official-domain checks. User benefits and reserve figures require item-level source verification.`;

    const resolvedPath = `/factbook/${venue.slug}`;
    const canonical = localizedCanonical(resolvedPath, locale);

    return {
      status: 200,
      title,
      description,
      canonical,
      locale,
      robots: "index,follow",
      marker: FACTBOOK_ROUTE_MARKER,
      alternates: routeAlternates(resolvedPath),
      schema: buildWorkerFactbookSchema(venue, schemaLocale, canonical),
    };
  }

  const newsListing = parseNewsListingPath(canonicalPath);
  if (newsListing?.invalid) return notFoundMetadata(canonicalPath, locale);
  if (newsListing) {
    // The prerendered collection intentionally carries summary-only article
    // objects, so deriving publication languages from their missing `content`
    // field would incorrectly noindex the reviewed zh-Hans collection page.
    // Summary rows still declare their editions in `availableLocales`, so a locale listing is published once one
    // search-published article carries that edition; the core editions stay published.
    const publishedLocales = newsListingPublishedLocales(newsFeed?.articles || []);
    // Indexable only with >= NEWS_LISTING_MIN_NATIVE_ARTICLES native editions (audit 2026-10-11 #4); a thinner locale
    // listing keeps its self-canonical edition but is noindex,follow without hreflang.
    const indexableLocales = newsListingIndexableLocales(newsFeed?.articles || []);
    const contentLocale = newsContentLocale(locale, publishedLocales);
    const displayLocale = UI_LOCALES.has(locale) ? locale : contentLocale;
    const isPublishedLocale = publishedLocales.includes(locale) && contentLocale === locale;
    const isIndexableLocale = isPublishedLocale && indexableLocales.includes(locale);
    const newsCopy = {
      "zh-Hans": ["市场新闻与源头核验研究 — NexuAlpha", "NexuAlpha 提供带来源链接的加密市场结构、交易平台、风险与代币化资产研究。"],
      "zh-Hant": ["市場新聞與來源核驗研究 — NexuAlpha", "NexuAlpha 提供附來源連結的加密市場結構、交易平台、風險與代幣化資產研究。"],
      ja: ["市場ニュースと出典付きリサーチ — NexuAlpha", "NexuAlpha は出典リンク付きで暗号資産市場、取引所、リスク、トークン化資産を調査します。"],
      ko: ["시장 뉴스 및 출처 기반 리서치 — NexuAlpha", "NexuAlpha는 출처 링크와 함께 암호화폐 시장, 거래소, 위험과 토큰화 자산을 연구합니다."],
      tr: ["Piyasa haberleri ve kaynaklı araştırma — NexuAlpha", "NexuAlpha; kripto piyasası, borsalar, riskler ve tokenleştirilmiş varlıkları kaynak bağlantılarıyla inceler."],
      es: ["Noticias del mercado e investigación con fuentes — NexuAlpha", "NexuAlpha investiga mercados cripto, plataformas, riesgos y activos tokenizados con enlaces de fuente."],
      "pt-BR": ["Notícias de mercado e pesquisa com fontes — NexuAlpha", "A NexuAlpha pesquisa mercados cripto, plataformas, riscos e ativos tokenizados com links de fonte."],
      fr: ["Actualités du marché et recherche sourcée — NexuAlpha", "NexuAlpha étudie les marchés crypto, plateformes, risques et actifs tokenisés avec des liens sources."],
      de: ["Marktnachrichten und quellenbasierte Recherche — NexuAlpha", "NexuAlpha untersucht Kryptomärkte, Plattformen, Risiken und tokenisierte Assets mit Quellenlinks."],
      ru: ["Новости рынка и исследования с источниками — NexuAlpha", "NexuAlpha исследует крипторынки, платформы, риски и токенизированные активы со ссылками на источники."],
      ar: ["أخبار السوق وأبحاث موثقة بالمصادر — NexuAlpha", "تبحث NexuAlpha في أسواق العملات الرقمية والمنصات والمخاطر والأصول المرمّزة مع روابط المصادر."],
      id: ["Berita pasar dan riset berbasis sumber — NexuAlpha", "NexuAlpha meneliti pasar kripto, platform, risiko, dan aset bertoken dengan tautan sumber."],
      vi: ["Tin thị trường và nghiên cứu có nguồn — NexuAlpha", "NexuAlpha nghiên cứu thị trường tiền mã hóa, nền tảng, rủi ro và tài sản token hóa kèm liên kết nguồn."],
      it: ["Notizie di mercato e ricerca con fonti — NexuAlpha", "NexuAlpha analizza mercati crypto, piattaforme, rischi e asset tokenizzati con link alle fonti."],
      // l10n: needs native review
      ur: ["مارکیٹ خبریں اور ماخذ والی تحقیق — NexuAlpha", "NexuAlpha کرپٹو مارکیٹوں، پلیٹ فارمز، خطرات اور ٹوکنائزڈ اثاثوں پر ماخذ روابط کے ساتھ تحقیق کرتا ہے۔"],
      // l10n: needs native review
      uk: ["Ринкові новини й дослідження з джерелами — NexuAlpha", "NexuAlpha досліджує крипторинки, платформи, ризики й токенізовані активи з посиланнями на джерела."],
    }[displayLocale] || [NEWS_HUB_SEO_EN.title, NEWS_HUB_SEO_EN.description];
    // Library pages (2026-10-10): /news/page/N and /news/category/<key>[/page/N] are self-canonical collections.
    const { category, page } = newsListing;
    const pagination = paginateNews(newsFeed?.articles || [], { category, page, locale: displayLocale });
    if (page > pagination.totalPages) return notFoundMetadata(canonicalPath, locale);
    const listingPath = newsListingPath({ category, page });
    const libraryCopy = newsLibraryCopy(displayLocale);
    const categoryCopy = category ? newsCategoryCopy(category, displayLocale) : null;
    const sectionName = newsCopy[0].replace(/\s+—\s+NexuAlpha$/, "");
    const pageSuffix = page > 1 ? ` — ${libraryCopy.pageOf(page, pagination.totalPages)}` : "";
    const localizedCopy = {
      title: `${categoryCopy ? `${categoryCopy.label} — ${sectionName}` : sectionName}${pageSuffix} — NexuAlpha`,
      description: `${categoryCopy ? categoryCopy.intro : newsCopy[1]}${page > 1 ? ` ${libraryCopy.pageOf(page, pagination.totalPages)}.` : ""}`,
    };
    const hasArticles = pagination.rows.length > 0;
    const pendingSelfCanonicalLocale = NATIVE_REVIEW_PENDING_LOCALES.has(displayLocale);
    const canonicalLocale = isPublishedLocale || pendingSelfCanonicalLocale ? displayLocale : contentLocale;
    const canonicalUrl = localizedCanonical(listingPath, canonicalLocale);
    return {
      status: 200,
      ...localizedCopy,
      canonical: canonicalUrl,
      locale: displayLocale,
      robots: isIndexableLocale && hasArticles ? "index,follow" : "noindex,follow",
      marker: NEWS_ROUTE_MARKER,
      alternates: isIndexableLocale && hasArticles ? routeAlternates(listingPath, indexableLocales) : [],
      // Heading and intro are the NewsListPage hero copy (one source for SSR, fallback and client).
      newsListing: { category, page, total: pagination.total, totalPages: pagination.totalPages, path: listingPath, heading: categoryCopy ? categoryCopy.label : newsListHeroCopy(displayLocale).title, intro: categoryCopy ? categoryCopy.intro : newsListHeroCopy(displayLocale).subtitle },
      schema: {
        ...newsCollectionSchema({
          title: localizedCopy.title,
          contentLocale,
          displayLocale,
          articles: pagination.rows,
          url: canonicalUrl,
        }),
      },
    };
  }

  const match = canonicalPath.match(/^\/news\/([a-z0-9-]+)$/);
  if (match) {
    const slug = cleanSlug(match[1]);
    const article = slug ? newsFeed?.articles.find((article) => article.slug === slug) : null;
    if (!article) {
      return {
        status: 404,
        title: "Article Not Found — NexuAlpha",
        description: "The requested NexuAlpha research article is unavailable.",
        canonical: localizedCanonical(canonicalPath, locale),
        locale,
        robots: "noindex,nofollow",
      };
    }
    const articleLocales = articleSeoLocales(article);
    const contentLocale = newsContentLocale(locale, articleLocales);
    const isPublishedLocale = articleLocales.includes(locale) && contentLocale === locale;
    const title = localizedArticleText(article.title, contentLocale) || slug;
    const serpOverride = serpCtrNewsOverride(article.slug, contentLocale);
    const searchTitle = serpOverride?.title || (contentLocale === "en" && article.seo?.title
      ? article.seo.title
      : title);
    const rawDescription = serpOverride?.description || (contentLocale === "en"
      ? (article.seo?.description || localizedArticleText(article.summary, contentLocale) || "Source-backed NexuAlpha research.")
      : (localizedArticleText(article.summary, contentLocale) || article.seo?.description || "NexuAlpha 源头核验研究。 "));
    const description = isPublishedLocale
      ? articleMetaDescription(article, contentLocale, rawDescription)
      : localizedNewsSummary(article, locale);
    const isTokenizedTreasuryArticle = article.slug === "tokenized-treasuries-structure-access-risks";
    const articleRelatedLinks = Array.isArray(article.seo?.internalLinkTargets)
      ? [...new Set(article.seo.internalLinkTargets)]
        .filter((target) => typeof target === "string" && /^\/[a-z0-9][a-z0-9/_-]*(?:\?[a-z0-9=&._%-]+)?$/i.test(target))
        .filter((target) => !target.startsWith("/ref/"))
      : [];
    for (const link of NEWS_OWNER_RELATED_LINKS[article.slug] || []) {
      if (!articleRelatedLinks.includes(link)) articleRelatedLinks.push(link);
    }
    if (isTokenizedTreasuryArticle && !articleRelatedLinks.includes("/research/wave48-tokenized-treasury-rights-ops.json")) articleRelatedLinks.push("/research/wave48-tokenized-treasury-rights-ops.json");
    const ownerPath = isTokenizedTreasuryArticle ? TOKENIZED_TREASURY_OWNER_PATH : null;
    // T10: a weaker duplicate points its canonical at the stronger article (same language edition when it exists),
    // stays index,follow so Google can consolidate, and carries no hreflang set of its own.
    // An edition the stronger article does not have (no cross-language canonical) stays noindex,follow instead.
    const canonicalTargetSlug = newsCanonicalTargetSlug(article);
    const targetArticle = canonicalTargetSlug ? newsFeed?.articles.find((item) => item?.slug === canonicalTargetSlug) : null;
    const canonicalTarget = isPublishedLocale && targetArticle && newsContentLocale(contentLocale, targetArticle) === contentLocale ? targetArticle : null;
    const articleCanonical = canonicalTarget
      ? localizedCanonical(`/news/${canonicalTarget.slug}`, contentLocale)
      : localizedCanonical(canonicalPath, contentLocale);
    const humanReview = newsHumanReview(article);
    return {
      status: 200,
      title: `${isPublishedLocale ? searchTitle : localizedNewsTitle(article, locale)} — NexuAlpha`,
      description,
      canonical: articleCanonical,
      locale: contentLocale,
      displayLocale: UI_LOCALES.has(locale) ? locale : contentLocale,
      robots: canonicalTarget || (article.seo?.noindex === false && isPublishedLocale) ? "index,follow" : "noindex,follow",
      ...(canonicalTarget ? { newsCanonicalTarget: canonicalTarget.slug } : {}),
      marker: ARTICLE_ROUTE_MARKER,
      ogType: "article",
      alternates: !canonicalTarget && article.seo?.noindex === false && isPublishedLocale ? routeAlternates(canonicalPath, articleLocales) : [],
      schema: [{
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: title,
        description,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt || article.publishedAt,
        mainEntityOfPage: { "@type": "WebPage", "@id": articleCanonical },
        // The article's own 1200x630 social card, same URL as og:image (audit 2026-10-11 #2).
        image: [socialImageObject(canonicalPath, locale, PUBLIC_ORIGIN)].filter(Boolean),
        inLanguage: contentLocale,
        author: newsArticleAuthor(article),
        publisher: NEXUALPHA_PUBLISHER,
        // No reviewer is claimed unless a human review record exists (AUDIT 2026-10-12: "never claim human review").
        ...(humanReview ? { reviewedBy: { "@type": "Person", name: humanReview.by } } : {}),
        isAccessibleForFree: true,
        hasPart: [...citationAssetSchemas(), ...(isTokenizedTreasuryArticle ? [wave48TokenizedTreasuryRightsOpsDatasetSchema()] : [])],
        citation: Array.isArray(article.sources) ? article.sources.map((source) => source?.url).filter(Boolean) : [],
        ...(ownerPath ? { isPartOf: `${PUBLIC_ORIGIN}${ownerPath}`, articleSection: "Dated source trail" } : {}),
        ...(articleRelatedLinks.length ? { relatedLink: articleRelatedLinks.map((link) => String(link).startsWith("/research/") ? `${PUBLIC_ORIGIN}${link}` : localizedCanonical(link, contentLocale)) } : {}),
        ...(serpOverride?.question ? { about: { "@type": "Thing", name: serpOverride.question } } : {}),
      }, pageBreadcrumb(title, articleCanonical, "News", "/news", contentLocale), ...(() => {
        const tokenizedTreasuryGscFaq = isTokenizedTreasuryArticle ? tokenizedTreasuryGscFaqEntry(contentLocale) : null;
        const entries = [
          ...(serpOverride?.question && serpOverride?.answer ? [{ question: serpOverride.question, answer: serpOverride.answer }] : []),
          ...(tokenizedTreasuryGscFaq ? [tokenizedTreasuryGscFaq] : []),
          ...articleExtraFaqEntries(article, contentLocale),
          ...articleFaqEntries(article, contentLocale),
        ];
        return entries.length ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: contentLocale,
          mainEntity: entries.map(({ question, answer }) => ({
            "@type": "Question",
            name: question,
            acceptedAnswer: { "@type": "Answer", text: answer, ...(isTokenizedTreasuryArticle ? { citation: tokenizedTreasuryArticleFaqCitations(article, question) } : {}) },
          })),
        }] : [];
      })()],
    };
  }

  // Public data pages (owner 2026-10-10): titles, descriptions and Dataset/FAQ/Breadcrumb JSON-LD come from one
  // shared copy table; every UI locale is indexable and self-canonical.
  if (canonicalPath === "/funding-rates/matrix") {
    const meta = fundingMatrixSeo(locale);
    return { status: 200, ...meta, canonical: localizedCanonical(canonicalPath, locale), locale,
      robots: "index,follow", marker: STATIC_ROUTE_MARKER, alternates: routeAlternates(canonicalPath) };
  }
  if (isDataPagePath(canonicalPath)) {
    const meta = dataPageMeta(canonicalPath, locale);
    // Dataset temporalCoverage starts at the liquidation history's first snapshot when the feed carries one (2026-10-11).
    let history = null;
    try { history = typeof env?.MARKET_EVENTS_READ === "function" ? readHistory(await env.MARKET_EVENTS_READ()) : null; } catch { history = null; }
    return {
      status: 200, title: meta.title, description: meta.description,
      canonical: localizedCanonical(canonicalPath, locale), locale, robots: "index,follow", marker: STATIC_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath), schema: dataPageSchemas(canonicalPath, locale, { origin: PUBLIC_ORIGIN, history }),
    };
  }
  // App downloads share their localized head and schema with the client.
  const appSeo = appDownloadRouteSeo(canonicalPath, requestedLocale, { urlFor: (path) => localizedCanonical(path, requestedLocale) });
  if (appSeo) {
    if (appSeo.status !== 200) return notFoundMetadata(canonicalPath, requestedLocale);
    return {
      status: 200, title: appSeo.title, description: appSeo.description,
      canonical: localizedCanonical(canonicalPath, requestedLocale), locale: requestedLocale,
      robots: "index,follow", marker: APP_DOWNLOAD_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath, Object.keys(LOCALE_PREFIX_BY_CODE)), schema: appSeo.schemas,
    };
  }
  // Flash (2026-10-12): /flash is a LiveBlogPosting of the latest items; /flash/<key>-<slug> is one NewsArticle. Items
  // come from feeds we already publish (src/data/flash-feed.js). An item stays a 200 page; after 30 days, in locales
  // without its own text, and for news items (the article is the search page) it is noindex,follow. Unknown keys 301
  // to the stream; an outdated slug 301s to the item's current path.
  const flashRoute = parseFlashPath(canonicalPath);
  if (flashRoute) {
    if (flashRoute.kind === "missing") return notFoundMetadata(canonicalPath, locale);
    const now = flashNow(env);
    const items = await readFlashItems(env, url);
    const urlFor = (path) => localizedCanonical(path, requestedLocale);
    if (flashRoute.kind === "stream") {
      const payload = flashStreamPayload(items, requestedLocale, { limit: FLASH_PAGE_SIZE, now });
      const seo = flashStreamSeo(payload, requestedLocale, { urlFor });
      return {
        status: 200, title: seo.title, description: seo.description, canonical: urlFor(FLASH_PATH), locale: requestedLocale,
        robots: FLASH_INDEX_LOCALES.includes(requestedLocale) ? "index,follow" : "noindex,follow", marker: FLASH_ROUTE_MARKER,
        alternates: routeAlternates(FLASH_PATH, FLASH_INDEX_LOCALES), schema: seo.schemas, flashPayload: { kind: "stream", ...payload },
      };
    }
    const item = findFlashItem(items, flashRoute.key);
    const keep = (target) => { const market = url.searchParams.get("market"); if (market) target.searchParams.set("market", market); return target; };
    if (!item) {
      const target = keep(new URL(localizedCanonical(FLASH_PATH, requestedLocale)));
      return { status: 301, redirect: target.href, title: "", description: "", canonical: target.href, locale, robots: "noindex,follow", marker: NOT_FOUND_ROUTE_MARKER };
    }
    const itemPath = flashItemPath(item);
    if (canonicalPath !== itemPath) {
      const target = keep(new URL(localizedCanonical(itemPath, requestedLocale)));
      return { status: 301, redirect: target.href, title: "", description: "", canonical: target.href, locale, robots: "noindex,follow", marker: NOT_FOUND_ROUTE_MARKER };
    }
    const payload = flashItemPayload(items, item, requestedLocale, { now });
    const seo = flashItemSeo(payload.item, requestedLocale, { urlFor });
    const indexLocales = flashItemIndexLocales(item, { now });
    return {
      status: 200, title: seo.title, description: seo.description, canonical: urlFor(itemPath), locale: requestedLocale,
      robots: payload.item.indexable ? "index,follow" : "noindex,follow", marker: FLASH_ROUTE_MARKER,
      alternates: indexLocales.length ? routeAlternates(itemPath, indexLocales) : [], schema: seo.schemas,
      flashPayload: { kind: "item", ...payload }, flashIndexLocales: indexLocales,
    };
  }
  // Academy hub and lessons share the client SEO helper; only localized lesson editions are indexable.
  const academySeo = academyRouteSeo(canonicalPath, requestedLocale, { urlFor: (path) => localizedCanonical(path, requestedLocale) });
  if (academySeo) {
    if (academySeo.status !== 200) return notFoundMetadata(canonicalPath, locale);
    return {
      status: 200, title: academySeo.title, description: academySeo.description,
      canonical: localizedCanonical(canonicalPath, requestedLocale), locale: requestedLocale,
      robots: academySeo.indexable ? "index,follow" : "noindex,follow", marker: ACADEMY_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath, ACADEMY_INDEX_LOCALES), schema: academySeo.schemas,
      ...(academySeo.image ? { image: academySeo.image } : {}),
    };
  }
  const licensesSeo = licenseRouteSeo(canonicalPath, requestedLocale, { urlFor: (path) => localizedCanonical(path, requestedLocale) });
  if (licensesSeo) {
    if (licensesSeo.status !== 200) return notFoundMetadata(canonicalPath, locale);
    return {
      status: 200, title: licensesSeo.title, description: licensesSeo.description,
      canonical: localizedCanonical(canonicalPath, requestedLocale), locale: requestedLocale,
      robots: licensesSeo.indexable ? "index,follow" : "noindex,follow", marker: LICENSES_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath, licensesSeo.alternatesLocales), schema: licensesSeo.schemas,
    };
  }
  // Spot ETF flows + crypto calendar (2026-10-13): Dataset (+ Event list) + FAQPage + BreadcrumbList from
  // src/data/intel-tools-seo.js (same helper as seo-injection.js), built from the runtime snapshot the body renders.
  const intelKey = intelToolKey(canonicalPath);
  if (intelKey) {
    const now = Date.now();
    const raw = await readIntelToolSnapshot(env, intelKey);
    const data = raw ? (intelKey === "etf" ? readEtfFlows(raw) : readCalendar(raw)) : null;
    const seo = intelToolRouteSeo(canonicalPath, requestedLocale, { urlFor: (path) => localizedCanonical(path, requestedLocale), data, now });
    return {
      status: 200, title: seo.title, description: seo.description, canonical: localizedCanonical(canonicalPath, requestedLocale), locale: requestedLocale,
      robots: seo.indexable ? "index,follow" : "noindex,follow", marker: INTEL_TOOLS_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath, seo.alternatesLocales), schema: seo.schemas,
      intelTool: { kind: intelKey, data: data ? (intelKey === "etf" ? compactEtfFlows(raw) : compactCalendar(raw, now)) : null, now },
    };
  }
  // Where to buy <coin> (2026-10-12): WebPage + venue ItemList + FAQPage + BreadcrumbList from src/data/coins-seo.js (same
  // helper as seo-injection.js). Unlisted coins, coins without our description in the locale and non-index locales are
  // noindex,follow; hreflang lists only the coin's indexable editions.
  const coinsSeo = coinsRouteSeo(canonicalPath, requestedLocale, { urlFor: (path) => localizedCanonical(path, requestedLocale) });
  if (coinsSeo) {
    if (coinsSeo.status !== 200) return notFoundMetadata(canonicalPath, locale);
    return {
      status: 200, title: coinsSeo.title, description: coinsSeo.description,
      canonical: localizedCanonical(canonicalPath, requestedLocale), locale: requestedLocale,
      robots: coinsSeo.indexable ? "index,follow" : "noindex,follow", marker: COINS_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath, coinsSeo.alternatesLocales), schema: coinsSeo.schemas,
    };
  }
  const converterFx = parseConverterPath(canonicalPath)?.kind === "pair" ? await refreshFxSnapshot(env) : null;
  const converterSeo = converterRouteSeo(canonicalPath, requestedLocale, { urlFor: (path) => localizedCanonical(path, requestedLocale), market: url.searchParams.get("market") || undefined, fx: converterFx });
  if (converterSeo) {
    if (converterSeo.status !== 200) return notFoundMetadata(canonicalPath, locale);
    return {
      status: 200, title: converterSeo.title, description: converterSeo.description,
      canonical: localizedCanonical(canonicalPath, requestedLocale), locale: requestedLocale,
      robots: converterSeo.indexable ? "index,follow" : "noindex,follow", marker: CONVERTER_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath, converterSeo.alternatesLocales), schema: converterSeo.schemas,
      ...(converterFx ? { converterFx } : {}),
    };
  }
  const radarSeo = radarRouteSeo(canonicalPath, requestedLocale, { urlFor: (path) => localizedCanonical(path, requestedLocale) });
  if (radarSeo) {
    const radarPayload = await readRadarPayload(env, radarSeo.kind);
    return {
      status: 200, title: radarSeo.title, description: radarSeo.description,
      canonical: localizedCanonical(canonicalPath, requestedLocale), locale: requestedLocale,
      robots: radarSeo.indexable ? "index,follow" : "noindex,follow", marker: RADAR_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath, radarSeo.alternatesLocales), schema: radarSeo.schemas,
      radarPayload,
    };
  }
  // Crypto glossary (2026-10-13): DefinedTermSet / DefinedTerm + FAQPage + BreadcrumbList from src/data/glossary-seo.js (same
  // helper as seo-injection.js). English fallbacks and non-index locales are noindex,follow; hreflang lists written editions.
  const glossarySeo = glossaryRouteSeo(canonicalPath, requestedLocale, { urlFor: (path) => localizedCanonical(path, requestedLocale) });
  if (glossarySeo) {
    if (glossarySeo.status !== 200) return notFoundMetadata(canonicalPath, locale);
    return {
      status: 200, title: glossarySeo.title, description: glossarySeo.description,
      canonical: localizedCanonical(canonicalPath, requestedLocale), locale: requestedLocale,
      robots: glossarySeo.indexable ? "index,follow" : "noindex,follow", marker: GLOSSARY_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath, glossarySeo.alternatesLocales), schema: glossarySeo.schemas,
    };
  }
  // Binance October campaigns page (2026-10-12): WebPage + FAQPage + BreadcrumbList from src/data/binance-october-seo.js
  // (same helper as seo-injection.js). Must run before the runtime /activities/<id> lookup below. Unwritten locales: noindex.
  const binanceOctoberSeo = binanceOctoberRouteSeo(canonicalPath, requestedLocale, { urlFor: (path) => localizedCanonical(path, requestedLocale), market: url.searchParams.get("market") || undefined });
  if (binanceOctoberSeo) {
    return {
      status: 200, title: binanceOctoberSeo.title, description: binanceOctoberSeo.description,
      canonical: localizedCanonical(canonicalPath, requestedLocale), locale: requestedLocale,
      robots: binanceOctoberSeo.indexable ? "index,follow" : "noindex,follow", marker: CAMPAIGN_LANDING_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath, BINANCE_OCTOBER_INDEX_LOCALES), schema: binanceOctoberSeo.schemas,
    };
  }
  // Bybit Stocks campaign page (2026-10-12): WebPage + FAQPage + BreadcrumbList from src/data/bybit-stocks-seo.js (same
  // helper as seo-injection.js). Must run before the runtime /activities/<id> lookup below. Unwritten locales: noindex.
  const bybitStocksSeo = bybitStocksRouteSeo(canonicalPath, requestedLocale, { urlFor: (path) => localizedCanonical(path, requestedLocale), market: url.searchParams.get("market") || undefined });
  if (bybitStocksSeo) {
    return {
      status: 200, title: bybitStocksSeo.title, description: bybitStocksSeo.description,
      canonical: localizedCanonical(canonicalPath, requestedLocale), locale: requestedLocale,
      robots: bybitStocksSeo.indexable ? "index,follow" : "noindex,follow", marker: CAMPAIGN_LANDING_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath, BYBIT_STOCKS_INDEX_LOCALES), schema: bybitStocksSeo.schemas,
    };
  }
  // Bitget Alliance campaign page (2026-10-13): WebPage + FAQPage + BreadcrumbList from src/data/bitget-alliance-seo.js
  // (same helper as seo-injection.js). Must run before the runtime /activities/<id> lookup below. Unwritten locales: noindex.
  const bitgetAllianceSeo = bitgetAllianceRouteSeo(canonicalPath, requestedLocale, { urlFor: (path) => localizedCanonical(path, requestedLocale), market: url.searchParams.get("market") || undefined });
  if (bitgetAllianceSeo) {
    return {
      status: 200, title: bitgetAllianceSeo.title, description: bitgetAllianceSeo.description,
      canonical: localizedCanonical(canonicalPath, requestedLocale), locale: requestedLocale,
      robots: bitgetAllianceSeo.indexable ? "index,follow" : "noindex,follow", marker: CAMPAIGN_LANDING_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath, BITGET_ALLIANCE_INDEX_LOCALES), schema: bitgetAllianceSeo.schemas,
    };
  }
  // Kraken 5M USDG Challenge page (2026-10-13): WebPage + FAQPage + BreadcrumbList from src/data/kraken-usdg-seo.js.
  const krakenUsdgSeo = krakenUsdgRouteSeo(canonicalPath, requestedLocale, { urlFor: (path) => localizedCanonical(path, requestedLocale), market: url.searchParams.get("market") || undefined });
  if (krakenUsdgSeo) {
    return {
      status: 200, title: krakenUsdgSeo.title, description: krakenUsdgSeo.description,
      canonical: localizedCanonical(canonicalPath, requestedLocale), locale: requestedLocale,
      robots: krakenUsdgSeo.indexable ? "index,follow" : "noindex,follow", marker: CAMPAIGN_LANDING_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath, KRAKEN_USDG_INDEX_LOCALES), schema: krakenUsdgSeo.schemas,
    };
  }
  // Brand pages (/about, /editorial-policy): titles, descriptions and AboutPage/WebPage JSON-LD come from
  // src/data/brand-entity.js; every UI locale is indexable and self-canonical.
  if (isBrandPagePath(canonicalPath)) {
    const meta = brandPageMeta(canonicalPath, requestedLocale);
    const canonical = localizedCanonical(canonicalPath, locale);
    return {
      status: 200, title: meta.title, description: meta.description,
      canonical, locale, robots: "index,follow", marker: STATIC_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath), schema: brandPageSchemas(canonicalPath, schemaLocale, { canonical }),
    };
  }
  const staticPageCopy = {
    "/rates": {
	      en: {
	        title: "Crypto Exchange Fee Benchmark Terminal — NexuAlpha",
	        description: "Compare published maker and taker fee references across CEX, DEX and perpetual platforms. Use the page as a scenario checklist, then verify VIP tier, funding, withdrawal and account terms on the official platform.",
	      },
      "zh-Hans": {
        title: "交易所手续费基准终端 — NexuAlpha",
        description: "对比中心化交易所、DEX 与永续合约平台公开的 Maker、Taker 手续费基准。",
      },
      ja: { title: "暗号資産取引所の手数料ベンチマーク — NexuAlpha", description: "CEX、DEX、パーペチュアル取引所の公開メイカー・テイカー手数料を比較します。" },
      ko: { title: "암호화폐 거래소 수수료 벤치마크 터미널 — NexuAlpha", description: "CEX, DEX와 퍼펙추얼 플랫폼의 공개 메이커·테이커 수수료를 비교합니다." },
      tr: { title: "Kripto borsa ücretleri kıyaslama terminali — NexuAlpha", description: "CEX, DEX ve perpetual platformların yayınlanmış maker ve taker ücretlerini karşılaştırın." },
      es: { title: "Terminal de comparación de comisiones cripto — NexuAlpha", description: "Compara las comisiones maker y taker publicadas de exchanges centralizados, DEX y plataformas perpetuas." },
    },
    "/methodology": {
      en: {
        title: "Research Methodology & Editorial Policy — NexuAlpha",
        description: "How NexuAlpha verifies sources, separates facts from estimates, and discloses commercial relationships.",
      },
      "zh-Hans": {
        title: "研究方法与编辑政策 — NexuAlpha",
        description: "了解 NexuAlpha 如何核验来源、区分事实与估算，并披露商业合作关系。",
      },
      ja: { title: "調査方法と編集ポリシー — NexuAlpha", description: "NexuAlphaが情報源を確認し、事実と推定を分け、商業関係を開示する方法。" },
      ko: { title: "조사 방법론 및 편집 정책 — NexuAlpha", description: "NexuAlpha가 출처를 검토하고 사실과 추정을 구분하며 상업적 관계를 공개하는 방법입니다." },
      tr: { title: "Araştırma yöntemi ve editoryal politika — NexuAlpha", description: "NexuAlpha'nın kaynakları doğrulama, gerçekleri tahminlerden ayırma ve ticari ilişkileri açıklama yöntemi." },
      ar: { title: "منهجية البحث والسياسة التحريرية — NexuAlpha", description: "كيف تتحقق NexuAlpha من المصادر وتفصل بين الحقائق والتقديرات وتفصح عن العلاقات التجارية." },

      // l10n: needs native review
      ur: { title: "تحقیقی طریقۂ کار اور ادارتی پالیسی — NexuAlpha", description: "NexuAlpha ماخذوں کی تصدیق، حقائق کو اندازوں سے الگ کرنے اور تجارتی تعلقات ظاہر کرنے کا طریقہ۔" },

      // l10n: needs native review
      uk: { title: "Методологія досліджень і редакційна політика — NexuAlpha", description: "Як NexuAlpha перевіряє джерела, відокремлює факти від оцінок і розкриває комерційні зв’язки." },

    },
    "/embed/calculator": {
      en: {
        title: "Embeddable Trading Fee Calculator — NexuAlpha",
        description: "Embed NexuAlpha's trading-fee comparison calculator with transparent assumptions and disclosures.",
      },
      "zh-Hans": {
        title: "可嵌入交易手续费计算器 — NexuAlpha",
        description: "嵌入带透明假设与披露说明的 NexuAlpha 交易手续费对比计算器。",
      },

      // l10n: needs native review
      ur: { title: "ایمبیڈ کے قابل ٹریڈنگ فیس کیلکولیٹر — NexuAlpha", description: "شفاف مفروضات اور افشا بیانات کے ساتھ فیس موازنہ کیلکولیٹر ایمبیڈ کریں۔" },

      // l10n: needs native review
      uk: { title: "Калькулятор торгових комісій для вбудовування — NexuAlpha", description: "Вбудуйте калькулятор порівняння комісій із прозорими припущеннями та розкриттями." },
    },
    "/telegram": {
      en: { title: "Telegram Research Bot & Platform Intelligence Hub — NexuAlpha", description: "Continue platform comparisons, fee research, official-source checks and return paths in Telegram." },
      "zh-Hans": { title: "Telegram 研究机器人与平台情报中心 — NexuAlpha", description: "在 Telegram 中继续平台比较、费率研究、官方来源核对和回访路径。" },
      "zh-Hant": { title: "Telegram 研究機器人與平台情報中心 — NexuAlpha", description: "在 Telegram 中繼續平台比較、費率研究、官方來源核對與回訪路徑。" },
      es: { title: "Centro de investigación de Telegram y plataformas — NexuAlpha", description: "Continúa en Telegram la comparación de plataformas, la investigación de comisiones y la revisión de fuentes oficiales." },
      "pt-BR": { title: "Central de pesquisa do Telegram e plataformas — NexuAlpha", description: "Continue no Telegram a comparação de plataformas, a pesquisa de taxas e a verificação de fontes oficiais." },
      fr: { title: "Centre de recherche Telegram et plateformes — NexuAlpha", description: "Poursuivez dans Telegram la comparaison des plateformes, l’étude des frais et la vérification des sources officielles." },
      de: { title: "Telegram-Recherche und Plattformen — NexuAlpha", description: "Setzen Sie Plattformvergleiche, Gebührenrecherche und die Prüfung offizieller Quellen in Telegram fort." },
      ar: { title: "مركز أبحاث Telegram والمنصات — NexuAlpha", description: "تابع مقارنة المنصات وأبحاث الرسوم والتحقق من المصادر الرسمية داخل Telegram." },
      ru: { title: "Исследовательский центр Telegram и платформ — NexuAlpha", description: "Продолжайте сравнение платформ, исследование комиссий и проверку официальных источников в Telegram." },
      id: { title: "Pusat riset Telegram dan platform — NexuAlpha", description: "Lanjutkan perbandingan platform, riset biaya, dan pemeriksaan sumber resmi di Telegram." },
      vi: { title: "Trung tâm nghiên cứu Telegram và nền tảng — NexuAlpha", description: "Tiếp tục so sánh nền tảng, nghiên cứu phí và kiểm tra nguồn chính thức trên Telegram." },
      it: { title: "Centro di ricerca Telegram e piattaforme — NexuAlpha", description: "Continua su Telegram il confronto tra piattaforme, la ricerca sulle commissioni e la verifica delle fonti ufficiali." },
      ja: { title: "Telegram 調査ボットとプラットフォーム情報センター — NexuAlpha", description: "Telegramでプラットフォーム比較、手数料調査、公式ソース確認を続けます。" },
      ko: { title: "Telegram 리서치 봇 및 플랫폼 정보 센터 — NexuAlpha", description: "Telegram에서 플랫폼 비교, 수수료 조사와 공식 출처 확인을 이어갑니다." },
      tr: { title: "Telegram araştırma botu ve platform bilgi merkezi — NexuAlpha", description: "Telegramda platform karşılaştırması, ücret araştırması ve resmi kaynak kontrolüne devam edin." },

      // l10n: needs native review
      ur: { title: "Telegram تحقیقی بوٹ اور پلیٹ فارم معلوماتی مرکز — NexuAlpha", description: "Telegram میں پلیٹ فارم موازنہ، فیس تحقیق، سرکاری ماخذ کی جانچ اور واپسی کے راستے جاری رکھیں۔" },

      // l10n: needs native review
      uk: { title: "Telegram-бот для досліджень і центр даних про платформи — NexuAlpha", description: "Продовжуйте в Telegram порівняння платформ, дослідження комісій, перевірки офіційних джерел і маршрути повернення." },
    },
    "/partners": {
      en: {
        title: "Partner Embeds & Distribution — NexuAlpha",
        description: "Integration guidance for publishers using NexuAlpha research and comparison embeds.",
      },
      "zh-Hans": {
        title: "合作嵌入与内容分发 — NexuAlpha",
        description: "面向使用 NexuAlpha 研究与比较组件的发布者提供接入说明。",
      },

      // l10n: needs native review
      ur: { title: "پارٹنر ایمبیڈز اور تقسیم — NexuAlpha", description: "NexuAlpha کی تحقیق اور موازنہ ماڈیولز استعمال کرنے والے ناشرین کے لیے انضمام کی رہنمائی۔" },

      // l10n: needs native review
      uk: { title: "Партнерські вбудовування й дистрибуція — NexuAlpha", description: "Інструкції з інтеграції для видавців, які використовують дослідження й модулі порівняння NexuAlpha." },
    },
    "/partners/embed-guide": {
      en: {
        title: "Partner Embed Guide — NexuAlpha",
        description: "Implementation guidance for embedding NexuAlpha comparison tools on partner sites.",
      },
      "zh-Hans": {
        title: "合作伙伴嵌入指南 — NexuAlpha",
        description: "在合作伙伴网站嵌入 NexuAlpha 比较工具的实施指南。",
      },
    },
  };
  const extraStaticLocales = {
    ar: {
      "/rates": { title: "مقارنة رسوم منصات العملات الرقمية — NexuAlpha", description: "قارن رسوم الصانع والمتداول المنشورة بين المنصات المركزية وDEX ومنصات العقود الدائمة." },
      "/embed/calculator": { title: "حاسبة رسوم التداول القابلة للتضمين — NexuAlpha", description: "أضف حاسبة مقارنة رسوم التداول مع افتراضات وإفصاحات واضحة." },
      "/partners": { title: "تضمين بيانات رسوم العملات الرقمية وتوزيعها — NexuAlpha", description: "إرشادات للناشرين الذين يستخدمون أدوات بحث ومقارنة NexuAlpha." },
    },
    id: {
      "/rates": { title: "Perbandingan biaya platform kripto — NexuAlpha", description: "Bandingkan biaya maker dan taker yang dipublikasikan untuk CEX, DEX, dan platform perpetual." },
      "/methodology": { title: "Metodologi riset dan kebijakan editorial — NexuAlpha", description: "Cara NexuAlpha memverifikasi sumber, memisahkan fakta dari estimasi, dan mengungkap hubungan komersial." },
      "/embed/calculator": { title: "Kalkulator biaya perdagangan yang dapat disematkan — NexuAlpha", description: "Sematkan kalkulator perbandingan biaya dengan asumsi dan pengungkapan yang transparan." },
      "/partners": { title: "Embed mitra dan distribusi — NexuAlpha", description: "Panduan integrasi bagi penerbit yang menggunakan riset dan alat perbandingan NexuAlpha." },
    },
    vi: {
      "/rates": { title: "So sánh phí nền tảng tiền mã hóa — NexuAlpha", description: "So sánh phí maker và taker được công bố trên CEX, DEX và nền tảng hợp đồng vĩnh cửu." },
      "/methodology": { title: "Phương pháp nghiên cứu và chính sách biên tập — NexuAlpha", description: "Cách NexuAlpha xác minh nguồn, tách sự thật khỏi ước tính và công bố quan hệ thương mại." },
      "/embed/calculator": { title: "Máy tính phí giao dịch có thể nhúng — NexuAlpha", description: "Nhúng máy tính so sánh phí với giả định và công bố minh bạch." },
      "/partners": { title: "Nhúng đối tác và phân phối — NexuAlpha", description: "Hướng dẫn tích hợp cho nhà xuất bản sử dụng công cụ nghiên cứu và so sánh NexuAlpha." },
    },
    it: {
      "/rates": { title: "Confronto delle commissioni delle piattaforme crypto — NexuAlpha", description: "Confronta le commissioni maker e taker pubblicate di CEX, DEX e piattaforme perpetual." },
      "/methodology": { title: "Metodologia di ricerca e politica editoriale — NexuAlpha", description: "Come NexuAlpha verifica le fonti, separa fatti e stime e dichiara i rapporti commerciali." },
      "/embed/calculator": { title: "Calcolatore di commissioni di trading incorporabile — NexuAlpha", description: "Incorpora un calcolatore di confronto con ipotesi e informative trasparenti." },
      "/partners": { title: "Embed per partner e distribuzione — NexuAlpha", description: "Guida all'integrazione per editori che usano gli strumenti di ricerca e confronto NexuAlpha." },
    },
    ru: {
      "/methodology": { title: "Методология исследований и редакционная политика — NexuAlpha", description: "Как NexuAlpha проверяет источники, отделяет факты от оценок и раскрывает коммерческие отношения." },
      "/rates": { title: "Сравнение комиссий криптоплатформ — NexuAlpha", description: "Сравнивайте опубликованные комиссии maker и taker для CEX, DEX и бессрочных платформ." },
      "/embed/calculator": { title: "Встраиваемый калькулятор торговых комиссий — NexuAlpha", description: "Встраивайте калькулятор сравнения комиссий с прозрачными допущениями и раскрытиями." },
      "/partners": { title: "Партнёрские встраивания и дистрибуция — NexuAlpha", description: "Руководство для издателей, использующих исследовательские и сравнительные инструменты NexuAlpha." },
    },

    // l10n: needs native review
    ur: {
      "/rates": { title: "کرپٹو فیس موازنے کا بنچ مارک ٹرمینل — NexuAlpha", description: "CEX، DEX اور پرپیچوئل پلیٹ فارمز کی شائع شدہ maker اور taker فیس حوالہ جات موازنہ کریں۔" },
      "/methodology": { title: "تحقیقی طریقۂ کار اور ادارتی پالیسی — NexuAlpha", description: "ماخذوں، حقائق/اندازوں اور تجارتی افشا کے لیے NexuAlpha کا طریقہ۔" },
      "/embed/calculator": { title: "ایمبیڈ کے قابل ٹریڈنگ فیس کیلکولیٹر — NexuAlpha", description: "شفاف مفروضات اور افشا بیانات کے ساتھ فیس موازنہ کیلکولیٹر ایمبیڈ کریں۔" },
      "/partners": { title: "پارٹنر ایمبیڈز اور تقسیم — NexuAlpha", description: "NexuAlpha کی تحقیق اور موازنہ ماڈیولز استعمال کرنے والے ناشرین کے لیے انضمام کی رہنمائی۔" },
    },

    // l10n: needs native review
    uk: {
      "/rates": { title: "Термінал порівняння комісій криптобірж — NexuAlpha", description: "Порівнюйте опубліковані довідкові комісії maker і taker для CEX, DEX і безстрокових платформ." },
      "/methodology": { title: "Методологія досліджень і редакційна політика — NexuAlpha", description: "Метод NexuAlpha для джерел, фактів/оцінок і комерційних розкриттів." },
      "/embed/calculator": { title: "Калькулятор торгових комісій для вбудовування — NexuAlpha", description: "Вбудуйте калькулятор порівняння комісій із прозорими припущеннями та розкриттями." },
      "/partners": { title: "Партнерські вбудовування й дистрибуція — NexuAlpha", description: "Інструкції з інтеграції для видавців, які використовують дослідження й модулі порівняння NexuAlpha." },
    },
  };
  for (const [locale, routes] of Object.entries(extraStaticLocales)) {
    for (const [pathname, copy] of Object.entries(routes)) staticPageCopy[pathname][locale] = copy;
  }
  const staticPageCopyPatch = {
    "/rates": {
      "zh-Hant": { title: "交易所手續費基準終端 — NexuAlpha", description: "比較中心化交易所、DEX 與永續合約平台公開的 Maker、Taker 手續費基準。" },
      "pt-BR": { title: "Terminal de comparação de taxas cripto — NexuAlpha", description: "Compare taxas maker e taker publicadas por CEXs, DEXs e plataformas perpétuas." },
      fr: { title: "Terminal de comparaison des frais crypto — NexuAlpha", description: "Comparez les frais maker et taker publiés par les CEX, DEX et plateformes perpétuelles." },
      de: { title: "Terminal für Krypto-Gebührenvergleiche — NexuAlpha", description: "Vergleichen Sie veröffentlichte Maker- und Taker-Gebühren von CEXs, DEXs und Perpetual-Plattformen." },
    },
    "/methodology": {
      "zh-Hant": { title: "研究方法與編輯政策 — NexuAlpha", description: "了解 NexuAlpha 如何核驗來源、區分事實與估算，並披露商業合作關係。" },
      es: { title: "Metodología de investigación y política editorial — NexuAlpha", description: "Cómo NexuAlpha verifica fuentes, separa hechos de estimaciones y declara relaciones comerciales." },
      "pt-BR": { title: "Metodologia de pesquisa e política editorial — NexuAlpha", description: "Como a NexuAlpha verifica fontes, separa fatos de estimativas e declara relações comerciais." },
      fr: { title: "Méthodologie de recherche et politique éditoriale — NexuAlpha", description: "Comment NexuAlpha vérifie les sources, sépare faits et estimations et déclare les relations commerciales." },
      de: { title: "Forschungsmethodik und redaktionelle Richtlinie — NexuAlpha", description: "Wie NexuAlpha Quellen prüft, Fakten von Schätzungen trennt und kommerzielle Beziehungen offenlegt." },
    },
    "/embed/calculator": {
      "zh-Hant": { title: "可嵌入交易手續費計算器 — NexuAlpha", description: "嵌入帶透明假設與披露說明的 NexuAlpha 交易手續費比較計算器。" },
      es: { title: "Calculadora de comisiones de trading integrable — NexuAlpha", description: "Inserta una calculadora de comisiones con supuestos transparentes y divulgaciones visibles." },
      "pt-BR": { title: "Calculadora de taxas de trading incorporável — NexuAlpha", description: "Incorpore uma calculadora de comparação de taxas com premissas e divulgações transparentes." },
      fr: { title: "Calculateur de frais de trading intégrable — NexuAlpha", description: "Intégrez un calculateur de frais avec hypothèses transparentes et informations visibles." },
      de: { title: "Einbettbarer Trading-Gebührenrechner — NexuAlpha", description: "Binden Sie einen Gebührenrechner mit transparenten Annahmen und Offenlegungen ein." },
      ja: { title: "埋め込み可能な取引手数料計算機 — NexuAlpha", description: "透明な前提と開示を備えた手数料比較計算機を埋め込みます。" },
      ko: { title: "임베드 가능한 거래 수수료 계산기 — NexuAlpha", description: "투명한 가정과 고지를 포함한 수수료 비교 계산기를 삽입합니다." },
      tr: { title: "Gömülebilir işlem ücreti hesaplayıcısı — NexuAlpha", description: "Şeffaf varsayımlar ve açıklamalar içeren ücret karşılaştırma aracını gömün." },
    },
    "/partners": {
      "zh-Hant": { title: "合作嵌入與內容分發 — NexuAlpha", description: "面向使用 NexuAlpha 研究與比較元件的發布者提供接入說明。" },
      es: { title: "Embeds para socios y distribución — NexuAlpha", description: "Guía de integración para editores que usan investigación y comparaciones de NexuAlpha." },
      "pt-BR": { title: "Embeds de parceiros e distribuição — NexuAlpha", description: "Orientação de integração para editores que usam pesquisas e comparações da NexuAlpha." },
      fr: { title: "Intégrations partenaires et distribution — NexuAlpha", description: "Guide d’intégration pour les éditeurs utilisant les recherches et comparaisons NexuAlpha." },
      de: { title: "Partner-Einbettungen und Distribution — NexuAlpha", description: "Integrationshinweise für Publisher, die NexuAlpha-Recherche und Vergleichsmodule nutzen." },
      ja: { title: "パートナー埋め込みと配信 — NexuAlpha", description: "NexuAlphaの調査と比較モジュールを使う発行者向けの導入ガイドです。" },
      ko: { title: "파트너 임베드와 배포 — NexuAlpha", description: "NexuAlpha 리서치와 비교 모듈을 사용하는 게시자를 위한 연동 안내입니다." },
      tr: { title: "Partner embedleri ve dağıtım — NexuAlpha", description: "NexuAlpha araştırma ve karşılaştırma modüllerini kullanan yayıncılar için entegrasyon rehberi." },
    },
  };
  for (const [pathname, locales] of Object.entries(staticPageCopyPatch)) {
    staticPageCopy[pathname] ||= {};
    for (const [locale, copy] of Object.entries(locales)) staticPageCopy[pathname][locale] = copy;
  }
  // /onchain is a proof-of-reserves verification guide (audit NX-05): title, description and schema come from
  // src/data/onchain-guide.js, shared with computeRouteSeo.
  staticPageCopy[ONCHAIN_GUIDE_PATH] = Object.fromEntries(ONCHAIN_GUIDE_LOCALES.map((code) => {
    const { title, description } = onchainGuideSeo(code);
    return [code, { title, description }];
  }));
  const staticPage = staticPageCopy[canonicalPath];
  if (staticPage) {
    const copy = staticPage[requestedLocale] || staticPage[locale] || staticPage.en;
    const canonical = localizedCanonical(canonicalPath, locale);
    const staticSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: copy.title.replace(" — NexuAlpha", ""),
      description: copy.description,
      url: canonical,
      inLanguage: locale,
      ...(canonicalPath === "/methodology" ? {
        dateModified: REGIONAL_FUNDING_MATRIX_REVIEWED_AT,
        ...researchAttribution([REGIONAL_FUNDING_MATRIX_URLS.json, REGIONAL_FUNDING_MATRIX_URLS.csv]),
        hasPart: citationAssetSchemas(),
        about: regionalFundingMatrixDatasetSchema(),
      } : {}),
    };
    return {
      status: 200,
      ...copy,
      canonical,
      locale,
      robots: "index,follow",
      marker: STATIC_ROUTE_MARKER,
      alternates: routeAlternates(canonicalPath),
      schema: canonicalPath === "/methodology"
        ? [staticSchema, ...regionalFundingRouteSchemas(locale)]
        : canonicalPath === ONCHAIN_GUIDE_PATH ? onchainGuideSchema(locale, { canonical }) : staticSchema,
    };
  }

  const researchMatch = canonicalPath.match(/^\/activities\/research\/([a-z0-9-]+)$/);
  if (researchMatch && ACTIVE_VENUE_SLUGS.has(researchMatch[1])) {
    return {
      status: 200, title: `${VENUE_REGISTRY[researchMatch[1]].name} Official Source Research — NexuAlpha`,
      description: "Public-source research with its own publication and review context.",
      canonical: localizedCanonical(canonicalPath, locale), locale, robots: "noindex,follow", marker: STATIC_ROUTE_MARKER,
    };
  }
  const updateMatch = parseActivityUpdatePath(canonicalPath);
  if (updateMatch) {
    try {
      const feed = await readActivityUpdateFeed(env, url);
      const { update, compact } = feed ? findActivityUpdate(feed, updateMatch.venue, updateMatch.slug) : { update: null, compact: null };
      const archivedRow = update ? null : await findArchivedActivityUpdate(env, url, updateMatch.venue, updateMatch.slug);
      const archived = archivedRow ? attachBriefToCompactItem(archivedRow, feed) : null;
      if (!update && archived) {
        const category = updateCategory(archived, requestedLocale);
        const headline = updateHeadline(archived, requestedLocale) || archived.title;
        const canonical = localizedCanonical(updatePath(archived), locale);
        const indexable = ["listing", "event"].includes(archived.category) && !isUpdateNoindex(archived) && isArchiveIndexable(archived);
        const items = [...(compact?.items || []).filter((row) => row.id !== archived.id), archived];
        return {
          status: 200,
          title: budgetTitle(`${venueDisplayName(archived.venue)} ${category}: ${headline} | NexuAlpha`, titleBudgetForLocale(requestedLocale)),
          description: activityUpdateDescription(archived, requestedLocale),
          canonical,
          locale,
          robots: indexable ? "index,follow" : "noindex,follow",
          marker: ACTIVITY_UPDATE_ROUTE_MARKER,
          alternates: routeAlternates(updatePath(archived)),
          schema: buildWorkerActivityUpdateSchema(archived, requestedLocale, canonical),
          activityUpdateFeed: { ...(compact || { generatedAt: null }), items },
          activityUpdateArchived: true,
        };
      }
      if (update) {
        const category = updateCategory(update, requestedLocale);
        const headline = updateHeadline(update, requestedLocale) || update.title;
        const venueName = venueDisplayName(update.venue);
        const canonical = localizedCanonical(updatePath(update), locale);
        const indexable = ["listing", "event"].includes(update.category) && !isUpdateNoindex(update);
        const title = budgetTitle(`${venueName} ${category}: ${headline} | NexuAlpha`, titleBudgetForLocale(requestedLocale));
        return {
          status: 200,
          title,
          description: activityUpdateDescription(update, requestedLocale),
          canonical,
          locale,
          robots: indexable ? "index,follow" : "noindex,follow",
          marker: ACTIVITY_UPDATE_ROUTE_MARKER,
          alternates: routeAlternates(updatePath(update)),
          schema: buildWorkerActivityUpdateSchema(update, requestedLocale, canonical),
          activityUpdateFeed: compact,
        };
      }
    } catch { /* fall through to the listing redirect */ }
    // Never published (or past the archive retention): send readers and crawlers to the activity listing, not a 404.
    // The listing exists in every locale; ?market= is a compliance gate and is kept.
    const target = new URL(localizedCanonical("/activities", locale));
    const market = url.searchParams.get("market");
    if (market) target.searchParams.set("market", market);
    return { status: 301, redirect: target.href, title: "", description: "", canonical: target.href, locale, robots: "noindex,follow", marker: NOT_FOUND_ROUTE_MARKER };
  }
  // Activity detail IDs are runtime data. An unavailable or unknown ID is not a real page.
  const activityMatch = canonicalPath.match(/^\/activities\/([^/]+)$/);
  if (activityMatch) {
    try {
      const response = await handleApi(new Request(new URL("/api/v1/official-updates", url)), env, new URL("/api/v1/official-updates", url));
      const payload = response.ok ? await response.json() : null;
      const updates = Array.isArray(payload?.data) ? payload.data : [];
      const update = updates.find((entry) => entry?.id === decodeURIComponent(activityMatch[1]));
      if (update) return { status: 200, title: `${localized(update.title, locale) || "Official Update"} — NexuAlpha`, description: localized(update.summary, locale), canonical: localizedCanonical(canonicalPath, locale), locale, robots: "noindex,follow", marker: STATIC_ROUTE_MARKER };
    } catch { /* Missing runtime evidence remains a 404. */ }
  }

  return {
    status: 404,
    title: isZh ? "页面不存在 — NexuAlpha" : "Page Not Found — NexuAlpha",
    description: isZh
      ? "请求的 NexuAlpha 页面不存在或未发布。"
      : "The requested NexuAlpha page does not exist or is not published.",
    canonical: localizedCanonical(canonicalPath, locale),
    locale,
    robots: "noindex,nofollow",
    marker: NOT_FOUND_ROUTE_MARKER,
  };
}

async function appHtmlResponse(response, url, env, forceHtml = false, request = null) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!forceHtml && !contentType.includes("text/html")) {
    return staticAssetResponse(htmlSecurityResponse(response, forceHtml), url);
  }
  const metadata = await routeMetadata(url, env);
  if (metadata.status === 301 && metadata.redirect) {
    return new Response(null, { status: 301, headers: { location: metadata.redirect, "cache-control": "public, max-age=3600", "x-robots-tag": "noindex,follow" } });
  }
  // Home hero copy experiment (X5): assigned here, server-side, before the prerendered body is chosen. Inactive (flag off
  // and no preview force) = no cookie, no header change, variant A for everyone.
  const heroAssignment = homeHeroAssignmentFor(request, url, metadata, env);
  if (heroAssignment.active) metadata.heroAssignment = heroAssignment;
  // Match the app's exact widget route; ref and legacy article queries select other layouts.
  const publicEmbed = response.status === 200 && metadata.status === 200
    && url.pathname === "/embed/calculator"
    && !url.searchParams.get("ref")
    && !(url.searchParams.get("page") === "newsDetail" && url.searchParams.get("slug"));
  if (!response.body) {
    const headers = new Headers(response.headers);
    headers.set("x-robots-tag", metadata.robots || "index,follow");
    return withHomeHeroHeaders(htmlSecurityResponse(new Response(null, { status: metadata.status, headers }), true, publicEmbed, url), metadata, url);
  }
  const htmlLocale = documentLocaleFor(metadata, url);
  let html = optimizeRouteResourceHints(
    injectRouteMetadata(await injectPrerenderedRoute(await response.text(), metadata, url, env), { ...metadata, locale: htmlLocale }),
    metadata,
    url,
  );
  if (isCriticalCssHomeRoute(html, metadata, url)) {
    html = inlineCriticalStylesheets(html, (await loadCriticalCss(env, url))?.routes?.home);
  }
  const headers = new Headers(response.headers);
  if (metadata.newsSsrMode) headers.set("x-nexualpha-news-render", metadata.newsSsrMode);
  if (metadata.fallbackSsrMode) headers.set("x-nexualpha-fallback-render", metadata.fallbackSsrMode);
  // Iframe widgets carry noindex in the header too, as the server-rendered /embed/liquidations widgets do (SEO audit
  // 2026-10-11 #13); HEAD already mirrors metadata.robots above.
  if (/^\/embed(?:\/|$)/.test(url.pathname)) headers.set("x-robots-tag", metadata.robots || "noindex,follow");
  if (parsePublicRoute(url.pathname, url.searchParams).contentPathname === "/funding-rates/matrix") headers.set("cache-control", "no-store");
  headers.delete("content-length");
  return withHomeHeroHeaders(htmlSecurityResponse(new Response(html, {
    status: metadata.status,
    headers,
  }), true, publicEmbed, url), metadata, url);
}

function isHomeHeroRequest(url, metadata) {
  if (metadata?.status !== 200 || !url || url.pathname === "/embed/calculator") return false;
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams || new URLSearchParams());
  return normalizePathname(publicRoute.contentPathname || url.pathname) === "/";
}

function homeHeroAssignmentFor(request, url, metadata, env) {
  if (!request || !isHomeHeroRequest(url, metadata)) return { active: false };
  return assignHomeHeroVariant({
    cookieHeader: request.headers.get("cookie") || "",
    userAgent: request.headers.get("user-agent") || "",
    method: request.method,
    // Non-production preview only (server.mjs forwards it when NODE_ENV !== "production"): "on" | "a" | "b".
    force: typeof env?.HOME_HERO_EXPERIMENT_FORCE === "string" ? env.HOME_HERO_EXPERIMENT_FORCE : null,
  });
}

// While the experiment runs, a home response depends on the visitor's cookie: it must never be stored by a shared cache
// (private) and a browser cache keys it by the cookie (Vary). New visitors get their bucket cookie with the same response.
function withHomeHeroHeaders(response, metadata, url) {
  const assignment = metadata?.heroAssignment;
  if (!assignment?.active) return response;
  const headers = new Headers(response.headers);
  const cacheControl = headers.get("cache-control") || "";
  if (!cacheControl.includes("no-store")) headers.set("cache-control", "private, max-age=300");
  const vary = headers.get("vary");
  if (!/(^|,)\s*cookie\s*(,|$)/i.test(vary || "")) headers.set("vary", vary ? `${vary}, Cookie` : "Cookie");
  headers.set("x-nexualpha-hero-variant", metadata.heroServed || assignment.variant);
  if (assignment.setCookie) {
    const cookie = homeHeroSetCookie(assignment.setCookie, { secure: url?.protocol === "https:" });
    if (cookie) headers.append("set-cookie", cookie);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function protectPrerenderInteraction(html, eager = false) {
  return html.replace(/<script\b(?=[^>]*type=["']module["'])(?=[^>]*src=["']([^"']+)["'])[^>]*><\/script>/i, (tag, src) => {
    // If hydration retains a native details state, assigning the same open value
    // emits no toggle. Notify the attached state listener once; never replay a click.
    const bridge = `<script data-nexualpha-deferred-hydration>/* Prerendered content is already visible. */(()=>{let p;const s=${safeJson(src)};const x=v=>CSS.escape(v);const r=e=>{for(let n=e;n&&n!==document;n=n.parentElement){for(let m=n;m=m.previousSibling;){if(m.nodeType===1){if(m.dataset?.nexualphaScopeEnd)break;if(m.dataset?.nexualphaScopeStart)return m.dataset.nexualphaScopeStart}}}return""};const y=a=>a?!!document.querySelector('[data-nexualpha-scope-start="'+x(a)+'"][data-nexualpha-interaction-ready="true"]'):document.documentElement.dataset.nexualphaHydrated==="true";const l=()=>p||(p=import(s).then(()=>true,()=>{p=null;return false}));const G=a=>new Promise(o=>{let t,d,v,D=false;const c=b=>{if(D)return;D=true;clearTimeout(t);if(v&&d)removeEventListener(v,d);o(b)};t=setTimeout(()=>c(false),8000);l().then(b=>{if(D)return;if(!b)return c(false);if(y(a))return c(true);v=a?"nexualpha:interaction-ready":"nexualpha:hydrated";d=()=>{if(y(a))c(true)};addEventListener(v,d)},()=>c(false))});const B=e=>{const C=t=>(t||"").replace(/\\s+/g," ").trim();let q="";if(e.id){const L=document.querySelector('label[for="'+x(e.id)+'"]');if(L)q=C(L.innerText||L.textContent)}if(!q){for(let n=e.parentElement;n&&n!==document;n=n.parentElement){if(n.tagName==="LABEL"){q=C(n.innerText||n.textContent);break}}}return q};const H=e=>(e.querySelector?.("summary")||e.tagName==="SUMMARY"&&e)?.textContent?.replace(/\\s+/g," ").trim()||"";const k=e=>({e,g:r(e),q:e.dataset?.ctaPlacement||"",d:e.dataset?.testid||"",i:e.id||"",c:e.getAttribute?.("aria-controls")||"",n:e.getAttribute?.("name")||"",a:e.getAttribute?.("aria-label")||"",b:B(e),h:H(e),t:(e.innerText||e.textContent||"").replace(/\\s+/g," ").trim()});const u=(a,e)=>!a.g||r(e)===a.g;const m=(a,z)=>[...document.querySelectorAll(z)].find(e=>u(a,e));const f=(a,z)=>{if(a.q){const n=m(a,'[data-cta-placement="'+x(a.q)+'"]');if(n)return n}if(a.d){const n=m(a,z+'[data-testid="'+x(a.d)+'"]');if(n)return n}if(a.i){const n=document.getElementById(a.i);if(n&&u(a,n))return n}if(a.c){const n=m(a,z+'[aria-controls="'+x(a.c)+'"]');if(n)return n}if(a.n){const n=m(a,z+'[name="'+x(a.n)+'"]');if(n)return n}if(a.a){const n=m(a,z+'[aria-label="'+x(a.a)+'"]');if(n)return n}if(a.b){const n=[...document.querySelectorAll(z)].filter(e=>u(a,e)&&B(e)===a.b);if(n.length===1)return n[0]}if(a.h){const n=[...document.querySelectorAll(z)].filter(e=>u(a,e)&&H(e)===a.h);if(n.length===1)return n[0]}if(a.t){const n=[...document.querySelectorAll(z)].filter(e=>u(a,e)&&(e.innerText||e.textContent||"").replace(/\\s+/g," ").trim()===a.t);if(n.length===1)return n[0]}return a.e?.isConnected?a.e:null};const R=/^(|text|search|number|range)$/;const I=e=>typeof HTMLInputElement!=="undefined"&&e instanceof HTMLInputElement&&R.test((e.getAttribute("type")||e.type||"text").toLowerCase());const W=new Map,T=new Map,WK=new WeakMap;let WC=0;const O=a=>[a.q,a.d,a.i,a.c,a.n,a.a,a.b,a.h,a.t].some(Boolean)?[a.g,a.q,a.d,a.i,a.c,a.n,a.a,a.b,a.h,a.t].join("|"):(WK.has(a.e)?WK.get(a.e):(WK.set(a.e,"@"+(++WC)),WK.get(a.e)));const E=(a,b)=>a.g===b.g&&["q","d","c","n","a","b","h","t"].some(h=>a[h]&&a[h]===b[h]);const Z=a=>{for(const [K,S]of W){if(E(S.a,a))W.delete(K)}for(const [K,S]of T){if(E(S.a,a))T.delete(K)}};const V=(e,v)=>{const p=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e),"value"),o=Object.getOwnPropertyDescriptor(e,"value");if(o?.set&&p?.set&&e.value===v){const b=e.defaultValue??e.getAttribute?.("value")??"";if(b!==v)o.set.call(e,b)}p?.set?p.set.call(e,v):e.value=v};const A=c=>requestAnimationFrame(()=>requestAnimationFrame(c));const J=()=>{let o,t,d=false;const j=()=>{if(d)return;d=true;clearTimeout(t);if(o)o.disconnect();typeof requestIdleCallback==="function"?requestIdleCallback(()=>{l()},{timeout:3000}):setTimeout(()=>{l()},2500)};const f=()=>typeof performance!=="undefined"&&typeof performance.getEntriesByType==="function"&&performance.getEntriesByType("paint").some(e=>e.name==="first-contentful-paint");const b=()=>{t=setTimeout(j,3000);typeof requestAnimationFrame==="function"?A(j):j()};if(document.querySelector("#root")?.dataset?.nexualphaClientRender==="true")return j();try{if(f())return j();if(typeof PerformanceObserver!=="function"||!PerformanceObserver.supportedEntryTypes?.includes("paint"))return b();o=new PerformanceObserver(e=>{if(e.getEntries().some(e=>e.name==="first-contentful-paint"))j()});o.observe({type:"paint",buffered:true});t=setTimeout(j,3000);if(f())j()}catch{b()}};document.readyState==="complete"?J():addEventListener("load",J,{once:true});addEventListener("pointerdown",()=>{l()},{once:true,passive:true,capture:true});addEventListener("keydown",()=>{l()},{once:true,capture:true});addEventListener("touchstart",()=>{l()},{once:true,passive:true,capture:true});addEventListener("wheel",()=>{l()},{once:true,passive:true});document.addEventListener("input",async e=>{if(!I(e.target))return;const a=k(e.target);if(y(a.g)){Z(a);return}const K=O(a),S={v:e.target.value,a};W.set(K,S);e.stopImmediatePropagation();if(!await G(a.g)){if(W.get(K)===S)W.delete(K);return}if(W.get(K)!==S)return;A(()=>{if(W.get(K)!==S)return;const n=f(a,"input");if(I(n)){V(n,S.v);n.dispatchEvent(new Event("input",{bubbles:true}))}if(W.get(K)===S)W.delete(K)})},true);document.addEventListener("click",e=>{const q=e.target?.closest?.("summary"),d=q?.closest?.("details");if(!d)return;const a=k(d);if(y(a.g)){Z(a);return}const K=O(a),S={o:!!d.open,a};T.set(K,S);setTimeout(async()=>{if(T.get(K)!==S)return;S.o=!!d.open;if(!y(a.g)&&!await G(a.g)){if(T.get(K)===S)T.delete(K);return}if(T.get(K)!==S)return;requestAnimationFrame(()=>{if(T.get(K)!==S)return;const n=f(a,"details");if(n?.tagName==="DETAILS"){if(n.open===S.o)n.dispatchEvent(new Event("toggle"));else n.open=S.o}if(T.get(K)===S)T.delete(K)})},0)},true);document.addEventListener("change",async e=>{if(!(e.target instanceof HTMLSelectElement))return;const a=k(e.target);if(y(a.g))return;const v=e.target.value;e.stopImmediatePropagation();if(!await G(a.g))return;requestAnimationFrame(()=>{const n=f(a,"select");if(n instanceof HTMLSelectElement){n.value=v;n.dispatchEvent(new Event("change",{bubbles:true}))}})},true);document.addEventListener("click",async e=>{const b=e.target?.closest?.("button");if(!b)return;const a=k(b);if(y(a.g))return;e.preventDefault();e.stopImmediatePropagation();if(!await G(a.g))return;requestAnimationFrame(()=>f(a,"button")?.click())},true)})();</script>`;
    return eager ? bridge + tag : bridge;
  });
}

function optimizeRouteResourceHints(html, metadata, url) {
  const hasPrerenderState = /<script\b[^>]*\bid=["']nexualpha-prerender-state["'][^>]*>/i.test(html);
  const hasDecisionState = Boolean(url?.searchParams?.get("account_stage") || url?.searchParams?.get("funding"));
  const isClientRenderedNews = !hasPrerenderState
    && [NEWS_ROUTE_MARKER, ARTICLE_ROUTE_MARKER].includes(metadata?.marker);
  if (metadata?.status !== 200) return html;
  // Embedded calculators must load immediately to restore saved query inputs.
  // Protect their already-visible SSR controls without delaying the module.
  if (url?.pathname === "/embed/calculator") return hasPrerenderState
    ? protectPrerenderInteraction(html, true)
    : html;
  const allowedStylePrefixes = routeStylePrefixesForPath(url, metadata);
  // Every normal route gets an SSR shell and a single app entry. Vite's
  // manifest can emit modulepreload hints for every lazy route in that shell,
  // so fallback shells would otherwise download unrelated international and
  // calculator chunks before the user has chosen a route. Keep fallback CSS
  // intact, but always remove those speculative JS preloads.
  const optimized = html.replace(/\s*<link\b[^>]*rel=["']modulepreload["'][^>]*>/gi, "");
  const styled = hasPrerenderState || isClientRenderedNews
    ? optimized.replace(/\s*<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, (tag) => shouldKeepStylesheet(tag, allowedStylePrefixes) ? tag : "")
    : optimized;
  const newsSummaryPreload = metadata?.marker === NEWS_ROUTE_MARKER || url?.pathname === "/news"
    ? '<link rel="preload" href="/content/news-feed-summary.json" as="fetch" crossorigin />'
    : "";
  const withNewsPreload = newsSummaryPreload && !/news-feed-summary\.json/.test(styled)
    ? styled.replace(/<\/head>/i, `${newsSummaryPreload}</head>`)
    : styled;
  // Non-indexable locale news shells need immediate hydration to load their
  // summarized feed, but they do not need every route chunk or stylesheet.
  if (!hasPrerenderState) return withNewsPreload;
  // Static prerender HTML cannot contain query-scoped decision state. Load the
  // application immediately for decision-passport URLs so the visible handoff
  // reflects account stage and funding without requiring an unrelated click.
  return protectPrerenderInteraction(withNewsPreload, hasDecisionState);
}

function routeStylePrefixesForPath(url, metadata) {
  const publicRoute = parsePublicRoute(url?.pathname || "/", url?.searchParams || new URLSearchParams());
  const pathname = normalizePathname(publicRoute.contentPathname || url?.pathname || "/");
  if (/^\/(mx|tw|hk)\/(?:comparar|conta)$/.test(pathname)) return [...SHARED_ROUTE_STYLE_PREFIXES, ...DIRECTORY_PAGE_STYLE_PREFIXES];
  if (/^\/(mx|tw|hk)\/costos$/.test(pathname)) return [...SHARED_ROUTE_STYLE_PREFIXES, "page-rates-", "route-rates-", "route-activity-"];
  if (brazilPath(pathname)) return [...SHARED_ROUTE_STYLE_PREFIXES, "page-br-", "route-international-"];
  if (REGIONAL_ROUTE_PATHS.has(pathname)) return [...SHARED_ROUTE_STYLE_PREFIXES, "route-international-"];
  if (pathname === "/") return [...SHARED_ROUTE_STYLE_PREFIXES, ...ROUTE_STYLE_PREFIXES_BY_MARKER[HOME_ROUTE_MARKER]];
  if (pathname === "/exchanges") return [...SHARED_ROUTE_STYLE_PREFIXES, ...DIRECTORY_PAGE_STYLE_PREFIXES];
  if (pathname === "/compare") return [...SHARED_ROUTE_STYLE_PREFIXES, ...COMPARE_PAGE_STYLE_PREFIXES, "shared-compare-picker-"];
  if (parseAppDownloadPath(pathname)?.valid) return [...SHARED_ROUTE_STYLE_PREFIXES, "route-apps-"];
  if (pathname.startsWith("/exchanges/")) return [...SHARED_ROUTE_STYLE_PREFIXES, "page-profile-", "page-detail-", "route-v3-pages-", "route-v3-registration-", "route-v3-readiness-", "route-activity-", "route-licenses-"];
  if (pathname.startsWith("/compare/")) return [...SHARED_ROUTE_STYLE_PREFIXES, ...COMPARE_PAGE_STYLE_PREFIXES];
  if (pathname === BINANCE_OCTOBER_PATH) return [...SHARED_ROUTE_STYLE_PREFIXES, ...ROUTE_STYLE_PREFIXES_BY_MARKER[CAMPAIGN_LANDING_ROUTE_MARKER]];
  // Bybit Stocks has its own route chunk (route-campaign-bybit), separate from the Binance page's.
  if (pathname === BYBIT_STOCKS_PATH) return [...SHARED_ROUTE_STYLE_PREFIXES, "route-campaign-bybit-"];
  // Bitget Alliance has its own route chunk (route-campaign-bitget).
  if (pathname === BITGET_ALLIANCE_PATH) return [...SHARED_ROUTE_STYLE_PREFIXES, "route-campaign-bitget-"];
  // Kraken 5M USDG Challenge has its own route chunk (route-campaign-kraken).
  if (pathname === KRAKEN_USDG_PATH) return [...SHARED_ROUTE_STYLE_PREFIXES, "route-campaign-kraken-"];
  if (pathname === "/activities" || pathname.startsWith("/activities/")) return [...SHARED_ROUTE_STYLE_PREFIXES, "route-activity-"];
  if (pathname === ACADEMY_PATH || pathname.startsWith(`${ACADEMY_PATH}/`)) return [...SHARED_ROUTE_STYLE_PREFIXES, ...ROUTE_STYLE_PREFIXES_BY_MARKER[ACADEMY_ROUTE_MARKER]];
  if (pathname === "/licenses" || pathname.startsWith("/licenses/")) return [...SHARED_ROUTE_STYLE_PREFIXES, ...ROUTE_STYLE_PREFIXES_BY_MARKER[LICENSES_ROUTE_MARKER]];
  if (INTEL_TOOL_PATHS.includes(pathname)) return [...SHARED_ROUTE_STYLE_PREFIXES, ...ROUTE_STYLE_PREFIXES_BY_MARKER[INTEL_TOOLS_ROUTE_MARKER]];
  if (pathname === COINS_PATH || pathname.startsWith(`${COINS_PATH}/`)) return [...SHARED_ROUTE_STYLE_PREFIXES, ...ROUTE_STYLE_PREFIXES_BY_MARKER[COINS_ROUTE_MARKER]];
  if (pathname === "/convert" || pathname.startsWith("/convert/")) return [...SHARED_ROUTE_STYLE_PREFIXES, ...ROUTE_STYLE_PREFIXES_BY_MARKER[CONVERTER_ROUTE_MARKER]];
  if (RADAR_PATHS.includes(pathname)) return [...SHARED_ROUTE_STYLE_PREFIXES, ...ROUTE_STYLE_PREFIXES_BY_MARKER[RADAR_ROUTE_MARKER]];
  if (pathname === GLOSSARY_PATH || pathname.startsWith(`${GLOSSARY_PATH}/`)) return [...SHARED_ROUTE_STYLE_PREFIXES, ...ROUTE_STYLE_PREFIXES_BY_MARKER[GLOSSARY_ROUTE_MARKER]];
  if (pathname === FLASH_PATH || pathname.startsWith(`${FLASH_PATH}/`)) return [...SHARED_ROUTE_STYLE_PREFIXES, ...ROUTE_STYLE_PREFIXES_BY_MARKER[FLASH_ROUTE_MARKER]];
  // The list route renders the Telegram alerts strip (route-v3-pages-strip chunk) in SSR; keep its stylesheet so the
  // strip is styled at first paint instead of when its JS chunk injects the CSS.
  if (pathname === "/news" || parseNewsListingPath(pathname)) return [...SHARED_ROUTE_STYLE_PREFIXES, "route-news-", "route-v3-pages-strip-"];
  if (pathname.startsWith("/news/tokenized-treasuries")) return [...SHARED_ROUTE_STYLE_PREFIXES, "route-news-"];
  if (pathname.startsWith("/news/")) return [...SHARED_ROUTE_STYLE_PREFIXES, "route-news-"];
  if (pathname === "/partners" || pathname.startsWith("/partners/")) return [...SHARED_ROUTE_STYLE_PREFIXES, "route-partners-"];
  if (pathname === "/topics/derivatives") return [...SHARED_ROUTE_STYLE_PREFIXES, "route-topic-guide-", "route-v3-pages-"];
  if (TOKENIZED_ASSET_TOPIC_PATHS.has(pathname) || Object.values(VENUE_ALTERNATIVE_PAGES).some((page) => page.path === pathname) || isBrazilDeadlinePath(pathname)) return [...SHARED_ROUTE_STYLE_PREFIXES, "route-tokenized-assets-"];
  // The topic and factbook hubs render CollectionHubPage, whose editorial index CSS lives in route-collection-hubs.
  if (pathname === "/topics") return [...SHARED_ROUTE_STYLE_PREFIXES, "route-topic-guide-", "route-collection-hubs-"];
  if (pathname === "/factbook") return [...SHARED_ROUTE_STYLE_PREFIXES, "page-factbook-", "page-detail-", "route-factbook-", "route-activity-", "route-collection-hubs-"];
  if (pathname === "/topics" || pathname.startsWith("/topics/")) return [...SHARED_ROUTE_STYLE_PREFIXES, "route-topic-guide-"];
  if (pathname === "/factbook" || pathname.startsWith("/factbook/")) return [...SHARED_ROUTE_STYLE_PREFIXES, "page-factbook-", "page-detail-", "route-factbook-", "route-activity-"];
  if (pathname.startsWith("/ref/")) return [...SHARED_ROUTE_STYLE_PREFIXES, "route-kol-"];
  const exact = ROUTE_STYLE_PREFIXES_BY_PATH[pathname];
  if (exact) return [...SHARED_ROUTE_STYLE_PREFIXES, ...exact];
  const marker = ROUTE_STYLE_PREFIXES_BY_MARKER[metadata?.marker];
  if (marker) return [...SHARED_ROUTE_STYLE_PREFIXES, ...marker];
  return null;
}

// Home critical CSS (mobile-perf lane 2026-10-11, scorecard T4). scripts/build-critical-css.mjs writes
// /critical-css.json: the rules of the home stylesheets that can match the prerendered home markup (15 locales), in
// cascade order, plus the exact stylesheet list they were extracted from. The home HTML then carries that CSS inline
// and loads the full stylesheets without blocking the first paint, in their original order; a small script switches
// them on together once all have arrived (one style recalculation instead of one per file). When the linked list does
// not equal the recorded list (stale or partial build), the page keeps its blocking links.
const CRITICAL_CSS_PATH = "/critical-css.json";
const criticalCssPayloads = new WeakMap();

export function homeRouteStylePrefixes() {
  return [...SHARED_ROUTE_STYLE_PREFIXES, ...ROUTE_STYLE_PREFIXES_BY_MARKER[HOME_ROUTE_MARKER]];
}

async function loadCriticalCss(env, requestUrl) {
  if (!env?.ASSETS) return null;
  if (!criticalCssPayloads.has(env.ASSETS)) {
    const pending = env.ASSETS.fetch(new Request(new URL(CRITICAL_CSS_PATH, requestUrl), { headers: { accept: "application/json" } }))
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => payload?.version === 1 && payload.routes && typeof payload.routes === "object" ? payload : null)
      .catch(() => null);
    criticalCssPayloads.set(env.ASSETS, pending);
  }
  const payload = await criticalCssPayloads.get(env.ASSETS);
  if (!payload) criticalCssPayloads.delete(env.ASSETS);
  return payload;
}

function isCriticalCssHomeRoute(html, metadata, url) {
  if (metadata?.status !== 200 || !url || url.pathname === "/embed/calculator") return false;
  if (!/<script\b[^>]*\bid=["']nexualpha-prerender-state["'][^>]*>/i.test(html)) return false;
  const publicRoute = parsePublicRoute(url.pathname, url.searchParams || new URLSearchParams());
  return normalizePathname(publicRoute.contentPathname || url.pathname) === "/";
}

const DEFERRED_CSS_ATTR = "data-nexualpha-deferred-css";
const DEFERRED_CSS_SWITCH = `<script>(()=>{const l=[...document.querySelectorAll("link[${DEFERRED_CSS_ATTR}]")];let n=l.length;const on=()=>{for(const e of l)e.media="all"};const d=()=>{if(--n===0)on()};for(const e of l){if(e.sheet)d();else{e.addEventListener("load",d,{once:true});e.addEventListener("error",d,{once:true})}}setTimeout(on,15000)})()</script>`;

export function inlineCriticalStylesheets(html, critical) {
  if (!critical || typeof critical.css !== "string" || !critical.css || !Array.isArray(critical.sheets) || !critical.sheets.length) return html;
  const linkPattern = /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi;
  const tags = html.match(linkPattern) || [];
  const hrefOf = (tag) => /\bhref=["']([^"']+)["']/i.exec(tag)?.[1] || "";
  if (tags.length !== critical.sheets.length || tags.some((tag, index) => hrefOf(tag) !== critical.sheets[index])) return html;
  if (tags.some((tag) => /\bmedia=/i.test(tag))) return html;
  const style = `<style data-nexualpha-critical="home">${critical.css.replace(/<\/style/gi, "<\\/style")}</style>`;
  const noscript = `<noscript>${tags.join("")}</noscript>`;
  let index = 0;
  // Function replacer: the CSS text may contain "$" sequences.
  return html.replace(linkPattern, (tag) => {
    index += 1;
    const deferred = tag.replace(/\s*\/?>$/, ` media="print" ${DEFERRED_CSS_ATTR}>`);
    if (index === 1 && index === tags.length) return `${style}${deferred}${DEFERRED_CSS_SWITCH}${noscript}`;
    if (index === 1) return `${style}${deferred}`;
    if (index === tags.length) return `${deferred}${DEFERRED_CSS_SWITCH}${noscript}`;
    return deferred;
  });
}

function shouldKeepStylesheet(tag, allowedPrefixes) {
  if (!allowedPrefixes) return true;
  const match = tag.match(/\bhref=["']([^"']+)["']/i);
  if (!match) return true;
  const pathname = (() => {
    try { return new URL(match[1], PUBLIC_ORIGIN).pathname; }
    catch { return match[1]; }
  })();
  const filename = pathname.split("/").pop() || "";
  if (!pathname.startsWith("/assets/") || !filename.endsWith(".css")) return true;
  return allowedPrefixes.some((prefix) => filename.startsWith(prefix));
}

function pathHasFileExtension(pathname) {
  const lastSegment = pathname.split("/").filter(Boolean).at(-1) ?? "";
  return /\.[a-z0-9]{1,12}$/i.test(lastSegment);
}

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function handleAgentApi(request, url) {
  const corsHeaders = {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "cache-control": "public, max-age=60",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const pathname = url.pathname;
  const searchParams = url.searchParams;
  const updatedAt = "2026-09-14T00:00:00Z";

  if (pathname === "/api/v1/agent/lowest-fee") {
    const volume = Number(searchParams.get("volume")) || 10000;
    const type = (searchParams.get("type") || "futures").toLowerCase();

    const candidates = Object.values(VENUE_REGISTRY).map((v) => {
      let baseMaker = 0.0002;
      let baseTaker = 0.0005;
      if (type === "spot") {
        const parts = (v.spotFee || "0.10% / 0.10%").split("/").map((s) => parseFloat(s) / 100);
        baseMaker = parts[0] || 0.001;
        baseTaker = parts[1] || 0.001;
      } else {
        const parts = (v.futuresFee || "0.02% / 0.05%").split("/").map((s) => parseFloat(s) / 100);
        baseMaker = parts[0] || 0.0002;
        baseTaker = parts[1] || 0.0005;
      }
      return {
        slug: v.slug,
        name: v.name,
        category: v.category,
        baseMakerRate: baseMaker,
        baseTakerRate: baseTaker,
        baseMakerFee: (baseMaker * 100).toFixed(3) + "%",
        baseTakerFee: (baseTaker * 100).toFixed(3) + "%",
        estimatedTakerCostUsd: Number((volume * baseTaker).toFixed(2)),
        officialDomain: v.officialDomain,
      };
    }).sort((a, b) => a.baseTakerRate - b.baseTakerRate);

    return new Response(JSON.stringify({
      status: "success",
      sourceStatus: "limited_published_base_fee_scenario",
      query: { volumeUsd: volume, marketType: type },
      decisionUse: "Compare published base fee scenarios only. This endpoint does not verify rebates, account-tier discounts, regional availability, liquidity, spreads, slippage, funding, deposits, withdrawals, or final signup terms.",
      lowestPublishedBaseFeeScenario: {
        name: candidates[0]?.name,
        slug: candidates[0]?.slug,
        baseTakerFee: candidates[0]?.baseTakerFee,
        baseMakerFee: candidates[0]?.baseMakerFee,
        estimatedTakerCostUsd: candidates[0]?.estimatedTakerCostUsd,
        officialDomain: candidates[0]?.officialDomain,
        sourceStatus: "official_terms_review_required",
      },
      publishedBaseFeeScenarios: candidates.slice(0, 5).map((c, idx) => ({
        rank: idx + 1,
        name: c.name,
        slug: c.slug,
        baseTakerFee: c.baseTakerFee,
        baseMakerFee: c.baseMakerFee,
        estimatedTakerCostUsd: c.estimatedTakerCostUsd,
        officialDomain: c.officialDomain,
        sourceStatus: "official_terms_review_required",
      })),
      sourceLinks: [
        "https://nexualpha.com/methodology",
        "https://nexualpha.com/exchanges",
      ],
      updatedAt,
      timestamp: new Date().toISOString(),
      attribution: "NexuAlpha source-bound research API (https://nexualpha.com/methodology)"
    }), { status: 200, headers: corsHeaders });
  }

  if (pathname === "/api/v1/agent/verify-domain") {
    const rawDomain = (searchParams.get("domain") || "").trim().toLowerCase();
    if (!rawDomain) {
      return new Response(JSON.stringify({ status: "error", message: "Missing 'domain' query parameter" }), { status: 400, headers: corsHeaders });
    }
    const cleanDomain = rawDomain.replace(/^https?:\/\//, "").split("/")[0];
    const normalizedInput = cleanDomain.replace(/^www\./, "");
    const match = Object.values(VENUE_REGISTRY).find((v) => {
      const off = (v.officialDomain || "").toLowerCase().replace(/^www\./, "");
      return off === normalizedInput || normalizedInput.endsWith("." + off);
    });

    if (match) {
      return new Response(JSON.stringify({
        status: "success",
        domain: cleanDomain,
        matchesKnownOfficialDomain: true,
        venue: {
          slug: match.slug,
          name: match.name,
          category: match.category,
          officialDomain: match.officialDomain,
        },
        matchStatus: "known_official_domain_registry_match",
        decisionUse: "This endpoint only checks whether the submitted hostname matches a known official-domain registry entry. It does not rate security, certify account safety, or evaluate reserve disclosures.",
        timestamp: new Date().toISOString(),
      }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      status: "warning",
      domain: cleanDomain,
      matchesKnownOfficialDomain: false,
      matchStatus: "not_found_in_registry",
      decisionUse: "This endpoint only checks known official-domain registry matches. A non-match is not a risk finding; verify the domain through the venue's current official sources before acting.",
      timestamp: new Date().toISOString(),
    }), { status: 200, headers: corsHeaders });
  }

  if (pathname === "/api/v1/agent/por-status") {
    const slug = (searchParams.get("slug") || "").trim().toLowerCase();
    const venue = VENUE_REGISTRY[slug];
    if (!venue) {
      return new Response(JSON.stringify({ status: "error", message: `Exchange '${slug}' not found in registry.` }), { status: 404, headers: corsHeaders });
    }
    return new Response(JSON.stringify({
      status: "success",
      exchange: venue.name,
      slug: venue.slug,
      sourceStatus: "official_source_review_required",
      porCoverage: "unknown_pending_official_review",
      reserveDisclosureStatus: "unknown_pending_official_review",
      securityFundStatus: "unknown_pending_official_review",
      kycLevel: venue.kycLevel,
      officialDomain: venue.officialDomain,
      sourceLinks: [
        `https://${venue.officialDomain}`,
        "https://nexualpha.com/methodology",
      ],
      updatedAt,
      auditTimestamp: null,
      merkleTreeStatus: "unknown_pending_official_review",
      decisionUse: "This endpoint does not certify reserve adequacy. Review the exchange's current official reserve disclosure and account terms before making any custody decision.",
    }), { status: 200, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ status: "error", message: "Unknown Agent API route" }), { status: 404, headers: corsHeaders });
}

async function handleApi(request, env, url) {
  if (isForbiddenApiPath(url.pathname)) return failClosedApiResponse(url.pathname, request.method, "API_ROUTE_NOT_FOUND");
  if (url.pathname.startsWith("/api/v1/agent/")) return handleAgentApi(request, url);

  const upstream = env?.CORE_API_ORIGIN ?? env?.CORE_API_BASE_URL;
  if (upstream) {
    try {
      const response = await fetch(upstreamRequest(request, upstream, url));
      if (response.ok) return response;
      if (isPublicHandoffApiPath(url.pathname, request.method)) return response;
      if (!hasFailClosedFallback(url.pathname, request.method)) return response;
    } catch {
      // Fall through to the explicit unavailable envelope below.
    }
  }

  return failClosedApiResponse(url.pathname, request.method, upstream ? "CORE_API_UPSTREAM_UNAVAILABLE" : "CORE_API_ORIGIN_NOT_CONFIGURED");
}

/**
 * Production CTA collection is an explicit integration boundary. The Worker
 * never pretends that static assets are a durable analytics sink: configure a
 * same-origin collector base in CTA_ANALYTICS_ORIGIN before enabling it.
 */
async function handleAnalyticsCollector(request, env, url) {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST", "cache-control": "no-store" } });
  }

  const configuredOrigin = env?.CTA_ANALYTICS_ORIGIN;
  if (!configuredOrigin) {
    return json({ status: "unavailable", reasonCode: "CTA_COLLECTOR_NOT_CONFIGURED", updatedAt: now() }, 503);
  }

  try {
    const target = new URL(url.pathname + url.search, configuredOrigin);
    const response = await fetch(new Request(target, request));
    return response;
  } catch {
    return json({ status: "unavailable", reasonCode: "CTA_COLLECTOR_UPSTREAM_UNAVAILABLE", updatedAt: now() }, 503);
  }
}

function upstreamRequest(request, upstream, url) {
  const upstreamUrl = new URL(upstream);
  const pathname = upstreamUrl.pathname.endsWith("/api/v1") && url.pathname.startsWith("/api/v1/")
    ? url.pathname.slice("/api/v1".length)
    : url.pathname;
  upstreamUrl.pathname = joinPath(upstreamUrl.pathname, pathname);
  upstreamUrl.search = url.search;
  return new Request(upstreamUrl, request);
}

function joinPath(prefix, pathname) {
  const normalizedPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  return `${normalizedPrefix}${pathname}`;
}

function now() {
  return new Date().toISOString();
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

const HTML_PRIVATE_CONTEXT_PARAMS = new Set([
  "ref",
  "referral",
  "referral_code",
  "affiliate",
  "affiliate_id",
  "campaign",
  "campaign_id",
  "partner",
  "partner_id",
  "account_stage",
  "decision",
  "decision_state",
  "state",
]);
const HTML_STATEFUL_CONTEXT_PARAMS = new Set([
  "market",
  "product",
  "platform",
  "amount",
  "spot_fee_bps",
  "deposit_fee_pct",
  "deposit_fixed_brl",
]);
const HTML_PERMISSIONS_POLICY = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";
const EDGE_OWNED_HTML_SECURITY_HEADERS = ["referrer-policy", "x-content-type-options"];
const BASE_HTML_CSP_DIRECTIVES = Object.freeze([
  ["base-uri", "'self'"],
  ["object-src", "'none'"],
  ["form-action", "'self'"],
]);

function appendMissingCspDirectives(csp, directives = BASE_HTML_CSP_DIRECTIVES) {
  const existing = new Set(String(csp || "").split(";")
    .map((directive) => directive.trim().split(/\s+/, 1)[0]?.toLowerCase())
    .filter(Boolean));
  const additions = directives
    .filter(([name]) => !existing.has(name.toLowerCase()))
    .map(([name, value]) => `${name} ${value}`);
  const normalized = String(csp || "").replace(/\s*;?\s*$/, "");
  return [normalized, ...additions].filter(Boolean).join("; ");
}

function isPrivateHtmlContext(url) {
  if (!url) return false;
  for (const [key, value] of url.searchParams) {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey.startsWith("utm_")) return true;
    if (HTML_PRIVATE_CONTEXT_PARAMS.has(normalizedKey) && value) return true;
    if (HTML_STATEFUL_CONTEXT_PARAMS.has(normalizedKey) && value) return true;
  }
  return false;
}

function htmlCacheControl(url, publicEmbed) {
  if (url && RADAR_PATHS.includes(parsePublicRoute(url.pathname, url.searchParams).contentPathname)) return "no-store";
  if (isPrivateHtmlContext(url)) return "private, no-store, max-age=0";
  if (publicEmbed) return "public, max-age=60";
  return "public, max-age=300, stale-while-revalidate=600";
}

function htmlSecurityResponse(response, forceHtml = false, publicEmbed = false, url = null) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!forceHtml && !contentType.includes("text/html")) return response;

  const headers = new Headers(response.headers);
  const csp = appendMissingCspDirectives(headers.get("content-security-policy"));
  if (publicEmbed) {
    const otherDirectives = (csp || "").split(";")
      .filter((directive) => directive.trim() && !/^\s*frame-ancestors(?:\s|$)/i.test(directive))
      .join(";").trim();
    headers.set("content-security-policy", appendMissingCspDirectives(`${otherDirectives ? `${otherDirectives}; ` : ""}frame-ancestors http: https:`));
    headers.delete("x-frame-options");
  } else if (!csp) {
    headers.set("content-security-policy", appendMissingCspDirectives("frame-ancestors 'self'"));
  } else if (!/(^|;)\s*frame-ancestors\s+/i.test(csp)) {
    headers.set("content-security-policy", appendMissingCspDirectives(`${csp.replace(/\s*;?\s*$/, "")}; frame-ancestors 'self'`));
  } else {
    headers.set("content-security-policy", csp);
  }
  if (!publicEmbed) headers.set("x-frame-options", "SAMEORIGIN");
  for (const header of EDGE_OWNED_HTML_SECURITY_HEADERS) headers.delete(header);
  headers.set("permissions-policy", HTML_PERMISSIONS_POLICY);
  const cacheControl = htmlCacheControl(url, publicEmbed);
  if (cacheControl) headers.set("cache-control", cacheControl);
  if (cacheControl?.includes("no-store")) {
    headers.delete("etag");
    headers.delete("last-modified");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function unavailableFeed(reasonCode) {
  return {
    status: "unavailable",
    provider: null,
    sourceUrl: null,
    fetchedAt: now(),
    freshness: "unavailable",
    data: [],
    attribution: null,
    reasonCode,
  };
}

function unavailableAssetPulse(reasonCode) {
  return {
    ...unavailableFeed(reasonCode),
    quoteCurrency: "USD",
    data: ["BTC", "ETH", "SOL"].map((symbol) => ({ symbol, priceUsd: null, change24hPct: null, asOf: null })),
  };
}

function hasFailClosedFallback(pathname, method) {
  if (method === "GET") return Boolean(failClosedGetBody(pathname, "CORE_API_UNAVAILABLE"));
  return method === "POST" && (pathname === "/api/v1/commercial/resolve" || pathname === "/api/v1/attribution/preflight");
}

function failClosedApiResponse(pathname, method, reasonCode) {
  if (isPublicHandoffApiPath(pathname, method)) {
    return json({ error: { code: "OUTBOUND_HANDOFF_UNAVAILABLE", message: "outbound handoff is unavailable while Shared Core is unreachable" }, status: "unavailable", reasonCode, updatedAt: now() }, 503);
  }

  if (method === "GET") {
    const body = failClosedGetBody(pathname, reasonCode);
    if (body) return json(body, pathname === "/api/v1/health/ready" ? 503 : 200);
  }

  if (method === "POST" && pathname === "/api/v1/commercial/resolve") {
    return json({ data: { decision: { outcome: "DENY", reason: "POLICY_EVALUATION_FAILED" }, cta: null }, status: "unavailable", reasonCode, updatedAt: now() }, 200);
  }

  if (method === "POST" && pathname === "/api/v1/attribution/preflight") {
    return json({ error: { code: "ATTRIBUTION_PREFLIGHT_UNAVAILABLE", message: "attribution preflight is unavailable while Shared Core is unreachable" }, status: "unavailable", reasonCode, updatedAt: now() }, 503);
  }

  return json({ error: { code: "ROUTE_NOT_FOUND", message: "route was not found" }, status: "unavailable", reasonCode: "API_ROUTE_NOT_FOUND", updatedAt: now() }, 404);
}

function isPublicHandoffApiPath(pathname, method) {
  return (method === "GET" && /^\/api\/v1\/venues\/[a-z0-9-]+\/outbound-offer$/.test(pathname))
    || (method === "POST" && pathname === "/api/v1/outbound-handoffs");
}

function isForbiddenApiPath(pathname) {
  return /^\/api\/v1\/(?:internal|operator)(?:\/|$)/.test(pathname) || /\/operator(?:\/|$)/.test(pathname);
}

function failClosedGetBody(pathname, reasonCode) {
  const updatedAt = now();
  if (pathname === "/api/v1/health/live") return { status: "live", updatedAt };
  if (pathname === "/api/v1/health/ready") return { status: "unavailable", dependency: { adapter: "sites-worker-fallback", ready: false }, reasonCode, updatedAt };
  if (pathname === "/api/v1/site/bootstrap") return { status: "unavailable", reasonCode, updatedAt, data: [] };
  if (pathname === "/api/v1/opportunities") return { status: "unavailable", reasonCode, updatedAt, data: [] };
  if (pathname === "/api/v1/venues") return { status: "unavailable", reasonCode, updatedAt, data: [] };
  if (pathname.match(/^\/api\/v1\/venues\/[a-z0-9-]+$/)) return { status: "unavailable", reasonCode, updatedAt, data: null };
  if (pathname === "/api/v1/listings") return { availability: "unavailable", status: "unavailable", reasonCode: "NO_COMPARABLE_AUTHORIZED_SOURCE", updatedAt, data: [] };
  if (pathname === "/api/v1/official-updates") return { status: "unavailable", reasonCode, updatedAt, data: [] };
  if (pathname === "/api/v1/market/crypto-sentiment") {
    return {
      data: {
        provider: "alternative-me",
        sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/",
        fetchedAt: updatedAt,
        freshness: "unavailable",
        value: null,
        classification: null,
        asOf: null,
        scope: "bitcoin-and-large-crypto",
        attribution: "Source: Alternative.me Crypto Fear & Greed Index",
      },
      status: "unavailable",
      reasonCode,
      updatedAt,
    };
  }
  if (pathname === "/api/v1/market/asset-pulse") return { data: unavailableAssetPulse(reasonCode), status: "unavailable", reasonCode, updatedAt };
  if (pathname === "/api/v1/market/exchange-snapshots") return { data: unavailableFeed(reasonCode), status: "unavailable", reasonCode, updatedAt };
  if (pathname === "/api/v1/market-intelligence") {
    return {
      status: "unavailable",
      reasonCode,
      updatedAt,
      assetPulse: unavailableAssetPulse(reasonCode),
      exchangeSnapshots: unavailableFeed(reasonCode),
      exchangeSnapshotsBySlug: {},
      data: [],
    };
  }
  if (pathname === "/api/v1/homepage-composition") return { status: "unavailable", reasonCode, updatedAt, data: [] };
  if (pathname.match(/^\/api\/v1\/opportunities\/[a-z0-9-]+$/)) return { status: "unavailable", reasonCode, updatedAt, data: null };
  return null;
}
