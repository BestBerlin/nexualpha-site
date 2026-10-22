import { coinForWhalePath } from "./data/whale-routes.js";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { localeManifest, supportedLocales } from "./content/locale-manifest";
import { intlLocale, v2Copy } from "./content/v2-copy";
import { getTextDirection, localStorageKey, setLocale as setParaglideLocale } from "./paraglide/runtime.js";
import { loadSiteView } from "./data/site-data.ts";
import { marketCommand, presentationModel, neutralVenueCatalog } from "./data/market-command";
import { DesignSystem } from "./components/DesignSystem";
import { SiteHeader, MobileSheet } from "./components/shell/SiteHeader.jsx";
import { TickerBar } from "./components/ticker/TickerBar.jsx";
import { LanguageMenu } from "./components/shell/LanguageMenu.jsx";
import { researchRoute } from "./data/official-research-route.js";
import { v3ShellCopy } from "./data/v3-shell-copy.js";
import { storedLocale, validComparison, cleanSelection, installHashNavigation } from "./data/browser-state";
import { HomeV7 } from "./components/v7/HomeV7.jsx";
import { ClosingBand } from "./components/v6/ClosingBand";
import { createSelectionStore } from "./components/v6/home-selection.js";
import { CleanFooter } from "./components/v3/CleanFooter";
import { DeferUntilVisible } from "./components/shared/DeferUntilVisible.jsx";
import { headerNavigationState } from "./data/header-navigation-state.js";
// Mobile bottom dock removed in v8 (owner request 2026-10-09); navigation lives in the header menu.
import { venueDatabase } from "./data/venue-database.js";
import { TOPIC_SLUGS } from "./data/topic-slugs.js";
import { TOKENIZED_ASSET_SLUGS } from "./data/tokenized-asset-slugs.js";
import { VENUE_ALTERNATIVE_SLUGS } from "./data/venue-alternative-slugs.js";
import { BRAZIL_DEADLINE_SLUGS } from "./data/brazil-vasp-deadline-slugs.js";
import { isBrazilPagePath } from "./data/brazil-page-paths.js";
import { trackGrowthDecision } from "./data/cta-analytics.js";
import { decisionContextSearchFromUrl, readDecisionPassport } from "./data/decision-passport.js";
import { resolveMarketLocale } from "./data/market-policy.js";
import { localizedHref, localizedLanguageHref, parsePublicRoute } from "./data/locale-routing.js";
import { languageOptionsFromHreflang, readDocumentHreflangAlternates } from "./data/page-hreflang-links.js";
import { sharedOfficialEventItems } from "./data/event-source.js";
import { startJsonPolling } from "./components/shared/json-polling.js";
import { isNeutralCtaLocale } from "./data/locale-policy.js";
import { parseNewsListingPath } from "./data/news-listing-path.js";
import { sectionEyebrowAttrs } from "./data/section-eyebrow.js";
import { FUNDING_RATES_PATH, LIQUIDATIONS_PATH, LIQUIDATION_HEATMAP_PATH, dataPageCopy } from "./data/market-data-pages-nav.js";
import { parseAppDownloadPath } from "./data/app-download-path.js";
import { academyContentModulePath, academyShellCopy, parseAcademyPath } from "./data/academy.js";
import { isBitgetGuidePath, bitgetGuideAvailable } from "./data/bitget-guide-routes.js";
import { BEGINNER_ROOTS, parseBeginnerPath } from "./data/beginner-routes.js";
import { parseLicensesPath } from "./data/licenses-routes.js";
import { DEPOSIT_ROOTS, CRYPTO_CARDS_PATH, depositNavLabel, parseDepositPath } from "./data/deposit-routes.js";
import { parseConverterPath } from "./data/converter-routes.js";
import { coinContentModulePath, parseCoinsPath } from "./data/coins-routes.js";
import { turkeyListingAllowed } from "./data/partner-geo-policy.js";
import { GLOSSARY_INDEX_LOCALES, glossaryIndexModulePath, glossaryLinksModulePath, glossaryShardModulePath, parseGlossaryPath } from "./data/glossary-routes.js";
import { FLASH_PATH, flashNavLabel } from "./data/flash-path.js";
import { CALENDAR_PATH, ETF_FLOWS_PATH } from "./data/intel-tools-routes.js";
import { FEE_INDEX_PATH, PRESS_PATH, TS_TRACKER_PATH, WHALE_REPORT_PATH } from "./data/data-assets-routes.js";
import { parseBinanceOctoberPath } from "./data/binance-october-path.js";
import { parseBybitStocksPath } from "./data/bybit-stocks-path.js";
import { TS_PATH, parseTokenizedStocksPath, tokenizedStocksNavLabel } from "./data/tokenized-stocks-routes.js";
import { parseBitgetAlliancePath } from "./data/bitget-alliance-path.js";
import { approvedCampaign } from "./data/campaign-autodraft.js";
import { parseKrakenUsdgPath } from "./data/kraken-usdg-path.js";
import { signalInteractionReady } from "./data/hydration-readiness.js";
import { syncRouteSeo } from "./data/route-seo-client.js";
import {
  ROUTE_MODULE_PATHS,
  modulePathsForRoute,
  preloadRouteModule,
  preloadRouteModules,
  readRouteModuleExport,
  registerRouteModuleLoaders,
  registerRouteModuleResolver,
} from "./data/route-module-cache.js";

const deferredPageModules = import.meta.env.SSR ? {} : import.meta.glob([
  "./components/finder/CommandFinder.jsx",
  "./components/finder/SearchDialog.jsx",
  "./components/v3/V3Pages.jsx",
  "./components/v3/VenueDetailPage.jsx",
  "./components/v3/VenueDetailResearch.jsx",
  "./components/v3/activity/OfficialResearch.jsx",
  "./components/v3/activity/ActivityUpdatePage.jsx",
  "./components/v3/news/NewsDetailPage.jsx",
  "./components/v3/LeanHero.jsx",
  "./components/v3/RebateTickerBar.jsx",
  "./components/v3/CampaignRadar.jsx",
  "./components/v3/FeeBenchmarkTerminal.jsx",
  "./components/v3/OnChainLiquidityBoard.jsx",
  "./components/v3/MarketFearGreedPanel.jsx",
  "./components/v3/KolLandingPage.jsx",
  "./components/v3/TradingBleedAnalyzer.jsx",
  "./components/v3/TelegramBotHub.jsx",
  "./components/v3/LiveConversionProof.jsx",
  "./components/v3/MethodologyPage.jsx",
  "./components/v3/brand-pages/AboutPage.jsx",
  "./components/v3/brand-pages/LegalPage.jsx",
  "./components/v3/brand-pages/EditorialPolicyPage.jsx",
  "./components/v3/EmbedCalculator.jsx",
  "./components/v3/PartnerEmbedGuide.jsx",
  "./components/v3/TopicGuidePage.jsx",
  "./components/v3/FactbookPage.jsx",
  "./components/v3/CollectionHubPage.jsx",
  "./components/v3/TokenizedAssetsPage.jsx",
  "./components/v3/VenueAlternativesPage.jsx",
  "./components/v3/BrazilDeadlinePage.jsx",
  "./components/v3/international/BrazilDecisionPage.jsx",
  "./components/v3/international/BrazilCostEmbed.jsx",
  "./components/v3/international/RegionalMarketPreview.jsx",
  "./components/v3/VenueYellowPages.jsx",
  "./components/v3/CrossroadsCompare.jsx",
  "./components/v3/PlatformMatcher.jsx",
  "./components/v3/news/NewsListPage.jsx",
  "./components/data/LiquidationsPage.jsx",
  "./components/data/LiquidationHeatmapPage.jsx",
  "./components/data/FundingRatesPage.jsx",
  "./components/data/FundingMatrixPage.jsx",
  "./components/shared/ToolArticleLinks.jsx",
  "./components/shared/CrawlPriorityLinks.jsx",
  "./components/academy/AcademyPages.jsx",
  "./components/apps/AppDownloadPage.jsx",
  "./data/academy-content-*.js",
  "!./data/academy-content-all.js",
  "./components/licenses/LicensePages.jsx",
  "./components/deposit/DepositPages.jsx",
  "./components/beginner/BeginnerPages.jsx",
  "./components/beginner/BitgetGuidePage.jsx",
  "./data/beginner-copy/*.json",
  "./components/coins/CoinPages.jsx",
  "./components/converter/ConverterPage.jsx",
  "./components/glossary/GlossaryPages.jsx",
  "./components/flash/FlashPages.jsx",
  "./components/radar/RadarPages.jsx",
  "./components/campaigns/BinanceOctoberPage.jsx",
  "./components/campaigns/BybitStocksPage.jsx",
  "./components/tokenized-stocks/TokenizedStocksPages.jsx",
  "./components/intel-tools/IntelToolPages.jsx",
  "./components/data-assets/DataAssetPages.jsx",
  "./components/campaigns/BitgetAlliancePage.jsx",
  "./components/campaigns/KrakenUsdgPage.jsx",
  "./components/campaigns/AutodraftCampaignPage.jsx",
]);

if (!import.meta.env.SSR) registerRouteModuleLoaders(deferredPageModules);
// Glossary content (index, term shards, auto-link forms: 160+ modules) gets its loaders from one small chunk on first use,
// so the browser entry carries no per-module loader table.
const GLOSSARY_MODULE_PATTERN = /^\.\/data\/glossary-(?:index|shard|links)-[a-z0-9-]+\.js$/;
if (!import.meta.env.SSR) registerRouteModuleResolver((path) => (GLOSSARY_MODULE_PATTERN.test(path)
  ? () => import("./data/glossary-content-loader.js").then((loader) => loader.loadGlossaryModule(path)) : null));

function readRenderedLanguageAlternates(doc = globalThis.document) {
  if (!doc || typeof doc.querySelectorAll !== "function") return [];
  return [...doc.querySelectorAll(".nx-lang__list a[hreflang]")].map((link) => ({
    hreflang: link.getAttribute("hreflang"),
    href: link.getAttribute("href"),
  }));
}

function readInitialPageAlternates(doc = globalThis.document) {
  if (!doc || typeof doc.querySelector !== "function") return [];
  const headAlternates = readDocumentHreflangAlternates(doc);
  const hasAuthoritativeHead = headAlternates.length || doc.querySelector('[data-nexualpha-route-seo="marker"], link[rel="canonical"], meta[name="robots"]');
  return hasAuthoritativeHead ? headAlternates : readRenderedLanguageAlternates(doc);
}

const ssrDeferredPageModules = import.meta.env.SSR ? import.meta.glob([
  "./components/finder/CommandFinder.jsx",
  "./components/finder/SearchDialog.jsx",
  "./components/v3/V3Pages.jsx",
  "./components/v3/VenueDetailPage.jsx",
  "./components/v3/VenueDetailResearch.jsx",
  "./components/v3/activity/OfficialResearch.jsx",
  "./components/v3/activity/ActivityUpdatePage.jsx",
  "./components/v3/news/NewsDetailPage.jsx",
  "./components/v3/LeanHero.jsx",
  "./components/v3/RebateTickerBar.jsx",
  "./components/v3/CampaignRadar.jsx",
  "./components/v3/FeeBenchmarkTerminal.jsx",
  "./components/v3/OnChainLiquidityBoard.jsx",
  "./components/v3/MarketFearGreedPanel.jsx",
  "./components/v3/KolLandingPage.jsx",
  "./components/v3/TradingBleedAnalyzer.jsx",
  "./components/v3/TelegramBotHub.jsx",
  "./components/v3/LiveConversionProof.jsx",
  "./components/v3/MethodologyPage.jsx",
  "./components/v3/brand-pages/AboutPage.jsx",
  "./components/v3/brand-pages/LegalPage.jsx",
  "./components/v3/brand-pages/EditorialPolicyPage.jsx",
  "./components/v3/EmbedCalculator.jsx",
  "./components/v3/PartnerEmbedGuide.jsx",
  "./components/v3/TopicGuidePage.jsx",
  "./components/v3/FactbookPage.jsx",
  "./components/v3/CollectionHubPage.jsx",
  "./components/v3/TokenizedAssetsPage.jsx",
  "./components/v3/VenueAlternativesPage.jsx",
  "./components/v3/BrazilDeadlinePage.jsx",
  "./components/v3/international/BrazilDecisionPage.jsx",
  "./components/v3/international/BrazilCostEmbed.jsx",
  "./components/v3/international/RegionalMarketPreview.jsx",
  "./components/v3/VenueYellowPages.jsx",
  "./components/v3/CrossroadsCompare.jsx",
  "./components/v3/PlatformMatcher.jsx",
  "./components/v3/news/NewsListPage.jsx",
  "./components/data/LiquidationsPage.jsx",
  "./components/data/LiquidationHeatmapPage.jsx",
  "./components/data/FundingRatesPage.jsx",
  "./components/data/FundingMatrixPage.jsx",
  "./components/shared/ToolArticleLinks.jsx",
  "./components/shared/CrawlPriorityLinks.jsx",
  "./components/academy/AcademyPages.jsx",
  "./components/apps/AppDownloadPage.jsx",
  "./data/academy-content-*.js",
  "!./data/academy-content-all.js",
  "./components/licenses/LicensePages.jsx",
  "./components/deposit/DepositPages.jsx",
  "./components/beginner/BeginnerPages.jsx",
  "./components/beginner/BitgetGuidePage.jsx",
  "./data/beginner-copy/*.json",
  "./components/coins/CoinPages.jsx",
  "./components/converter/ConverterPage.jsx",
  "./data/coin-content-*.js",
  "./components/glossary/GlossaryPages.jsx",
  "./data/glossary-index-*.js",
  "./data/glossary-shard-*.js",
  "./data/glossary-links-*.js",
  "./components/flash/FlashPages.jsx",
  "./components/radar/RadarPages.jsx",
  "./components/campaigns/BinanceOctoberPage.jsx",
  "./components/campaigns/BybitStocksPage.jsx",
  "./components/tokenized-stocks/TokenizedStocksPages.jsx",
  "./components/intel-tools/IntelToolPages.jsx",
  "./components/data-assets/DataAssetPages.jsx",
  "./components/campaigns/BitgetAlliancePage.jsx",
  "./components/campaigns/KrakenUsdgPage.jsx",
  "./components/campaigns/AutodraftCampaignPage.jsx",
], { eager: true }) : {};

function deferredComponent(path, exportName) {
  if (import.meta.env.SSR) {
    const module = ssrDeferredPageModules[path];
    if (!module?.[exportName]) throw new Error(`Missing SSR component export ${exportName} from ${path}`);
    return module[exportName];
  }
  const DeferredComponent = (props) => {
    const Component = readRouteModuleExport(path, exportName);
    return <Component {...props} />;
  };
  DeferredComponent.displayName = `DeferredComponent(${exportName})`;
  return DeferredComponent;
}

const CommandFinder = deferredComponent("./components/finder/CommandFinder.jsx", "CommandFinder");
const SearchDialog = deferredComponent("./components/finder/SearchDialog.jsx", "SearchDialog");
const ActivityCenterPage = deferredComponent("./components/v3/V3Pages.jsx", "ActivityCenterPage");
const ActivityDetailPage = deferredComponent("./components/v3/V3Pages.jsx", "ActivityDetailPage");
const CompareDeepPage = deferredComponent("./components/v3/V3Pages.jsx", "CompareDeepPage");
const CompareHubPage = deferredComponent("./components/v3/V3Pages.jsx", "CompareHubPage");
const NotFoundPage = deferredComponent("./components/v3/V3Pages.jsx", "NotFoundPage");
const VenueDetailPage = deferredComponent("./components/v3/VenueDetailPage.jsx", "VenueDetailPage");
// The venue page's collapsed "Sources" hub: static on the server, loaded on toggle in the browser (venue-graph lane).
const VenueDetailResearch = deferredComponent("./components/v3/VenueDetailResearch.jsx", "VenueDetailResearch");
const prefetchVenueResearch = () => preloadRouteModule(ROUTE_MODULE_PATHS.venueResearch).catch(() => {});
const ActivityUpdatePage = deferredComponent(ROUTE_MODULE_PATHS.activityUpdate, "ActivityUpdatePage");
const OfficialResearchPage = deferredComponent("./components/v3/activity/OfficialResearch.jsx", "OfficialResearchPage");
// Perf lane 2026-10-11: the directory, the home comparison slots, the news list and the data pages are route modules
// too (preloaded by modulePathsForRoute before hydration on their own routes), so other pages stop shipping them.
const NewsListPage = deferredComponent("./components/v3/news/NewsListPage.jsx", "NewsListPage");
const VenueYellowPages = deferredComponent("./components/v3/VenueYellowPages.jsx", "VenueYellowPages");
const CrossroadsCompare = deferredComponent("./components/v3/CrossroadsCompare.jsx", "CrossroadsCompare");
const PlatformMatcher = deferredComponent("./components/v3/PlatformMatcher.jsx", "PlatformMatcher");
const LiquidationsPage = deferredComponent("./components/data/LiquidationsPage.jsx", "LiquidationsPage");
const LiquidationHeatmapPage = deferredComponent(ROUTE_MODULE_PATHS.liquidationHeatmap, "LiquidationHeatmapPage");
const FundingMatrixPage = deferredComponent("./components/data/FundingMatrixPage.jsx", "FundingMatrixPage");
const FundingRatesPage = deferredComponent("./components/data/FundingRatesPage.jsx", "FundingRatesPage");
const NewsDetailPage = deferredComponent("./components/v3/news/NewsDetailPage.jsx", "NewsDetailPage");
const ToolArticleLinks = deferredComponent("./components/shared/ToolArticleLinks.jsx", "ToolArticleLinks");
// Related-research crawl index: lazy module, rendered inside its own Suspense boundary (keeps the server HTML).
const CrawlPriorityLinksDeferred = deferredComponent(ROUTE_MODULE_PATHS.crawlLinks, "CrawlPriorityLinks");
const CrawlPriorityLinks = (props) => <React.Suspense fallback={null}><CrawlPriorityLinksDeferred {...props} /></React.Suspense>;
// Academy (2026-10-12): one route chunk for the hub and lesson pages; lesson content is one lazy module per locale.
const AppDownloadPage = deferredComponent(ROUTE_MODULE_PATHS.appDownload, "AppDownloadPage");
const AcademyHubPage = deferredComponent(ROUTE_MODULE_PATHS.academy, "AcademyHubPage");
const AcademyEpisodePage = deferredComponent(ROUTE_MODULE_PATHS.academy, "AcademyEpisodePage");
function readAcademyContent(locale) {
  const path = academyContentModulePath(locale);
  if (import.meta.env.SSR) return ssrDeferredPageModules[path]?.ACADEMY_CONTENT;
  return readRouteModuleExport(path, "ACADEMY_CONTENT");
}
// Where to buy <coin> (2026-10-12): one route chunk for /coins and /coins/<slug>; descriptions are one lazy module per locale.
const BitgetGuidePage = deferredComponent("./components/beginner/BitgetGuidePage.jsx", "BitgetGuidePage");
const BeginnerPage = deferredComponent("./components/beginner/BeginnerPages.jsx", "BeginnerPage");
function BeginnerRoute({ route, locale, market }) {
  const path = `./data/beginner-copy/${locale}.json`;
  const content = import.meta.env.SSR ? ssrDeferredPageModules[path]?.default : readRouteModuleExport(path, "default");
  return <BeginnerPage locale={locale} market={market} route={route.beginner} copy={content} />;
}
const LicenseDirectoryPage = deferredComponent("./components/licenses/LicensePages.jsx", "LicenseDirectoryPage");
// Deposit & withdraw hub, country pages and /crypto-cards (2026-10-15): one route chunk (route-deposit).
const DepositPage = deferredComponent("./components/deposit/DepositPages.jsx", "DepositPage");
const CoinsHubPage = deferredComponent(ROUTE_MODULE_PATHS.coins, "CoinsHubPage");
const ConverterPage = deferredComponent(ROUTE_MODULE_PATHS.converter, "ConverterPage");
const CoinPage = deferredComponent(ROUTE_MODULE_PATHS.coins, "CoinPage");
// Descriptions reach the server render here; in the browser the page keeps the server text (CoinPages.jsx) and loads
// the locale module itself after a client-side navigation, so the entry carries no per-locale loaders.
function readCoinContent(locale) {
  return import.meta.env.SSR ? ssrDeferredPageModules[coinContentModulePath(locale)]?.COIN_DESCRIPTIONS : undefined;
}
// overlay: runtime coins.json rows the server rendered with (prerender state "coins"); the page applies it before rendering.
function CoinsRoute({ route, locale, overlay, initialNewsArticles }) {
  if (route.name === "coinsHub") return <CoinsHubPage locale={locale} market={route.market} overlay={overlay} />;
  return <CoinPage locale={locale} content={readCoinContent(locale)} slug={route.slug} market={route.market} overlay={overlay} initialNewsArticles={initialNewsArticles} />;
}
// Linkable data assets + /press (SEO W43, 2026-10-18): one route chunk (route-data-assets). The whale report's server
// snapshot travels in the "intelTool" hydration slot as { kind: "whale-report", data }.
const FeeIndexPage = deferredComponent(ROUTE_MODULE_PATHS.dataAssets, "FeeIndexPage");
const TokenizedTrackerPage = deferredComponent(ROUTE_MODULE_PATHS.dataAssets, "TokenizedTrackerPage");
const WhaleReportPage = deferredComponent(ROUTE_MODULE_PATHS.dataAssets, "WhaleReportPage");
const PressPage = deferredComponent(ROUTE_MODULE_PATHS.dataAssets, "PressPage");
// Spot ETF flows + crypto calendar (2026-10-13): one route chunk (route-intel-tools). `initial` is the snapshot the
// server rendered with (prerender state "intelTool"); `now` keeps the calendar's first client render identical.
const EtfFlowsPage = deferredComponent(ROUTE_MODULE_PATHS.intelTools, "EtfFlowsPage");
const CalendarPage = deferredComponent(ROUTE_MODULE_PATHS.intelTools, "CalendarPage");
// Crypto glossary (2026-10-13): one route chunk for /glossary and /glossary/<slug>; content is the locale's index (hub) or
// the term's shard module (term page), both preloaded before hydration (modulePathsForRoute).
const GlossaryHubPage = deferredComponent(ROUTE_MODULE_PATHS.glossary, "GlossaryHubPage");
const GlossaryTermPage = deferredComponent(ROUTE_MODULE_PATHS.glossary, "GlossaryTermPage");
function readGlossaryModule(path, exportName) {
  if (import.meta.env.SSR) return ssrDeferredPageModules[path]?.[exportName];
  return readRouteModuleExport(path, exportName);
}
function GlossaryRoute({ route, locale }) {
  if (route.name === "glossaryHub") return <GlossaryHubPage locale={locale} content={readGlossaryModule(glossaryIndexModulePath(locale), "GLOSSARY_INDEX")} market={route.market} />;
  return <GlossaryTermPage locale={locale} content={readGlossaryModule(glossaryShardModulePath(locale, route.slug), "GLOSSARY_SHARD")} slug={route.slug} market={route.market} />;
}
/** Auto-link forms of the locale's glossary for news articles and lesson transcripts (null outside written locales). */
function readGlossaryLinks(locale) {
  if (!GLOSSARY_INDEX_LOCALES.includes(locale)) return null;
  return readGlossaryModule(glossaryLinksModulePath(locale), "GLOSSARY_LINKS") || null;
}
// Binance October campaigns page (2026-10-12): its own route chunk (route-campaign-landing).
const BinanceOctoberPage = deferredComponent(ROUTE_MODULE_PATHS.binanceOctober, "BinanceOctoberPage");
// Bybit Stocks campaign landing page (2026-10-12): its own route chunk (route-campaign-bybit).
const BybitStocksPage = deferredComponent(ROUTE_MODULE_PATHS.bybitStocks, "BybitStocksPage");
const TokenizedStocksHubPage = deferredComponent(ROUTE_MODULE_PATHS.tokenizedStocks, "TokenizedStocksHubPage");
const TokenizedStocksTickerPage = deferredComponent(ROUTE_MODULE_PATHS.tokenizedStocks, "TokenizedStocksTickerPage");
const TokenizedStocksExchangePage = deferredComponent(ROUTE_MODULE_PATHS.tokenizedStocks, "TokenizedStocksExchangePage");
// Bitget Alliance campaign landing page (2026-10-13): its own route chunk (route-campaign-bitget).
const BitgetAlliancePage = deferredComponent(ROUTE_MODULE_PATHS.bitgetAlliance, "BitgetAlliancePage");
// Kraken 5M USDG Futures Challenge page (2026-10-13): its own route chunk (route-campaign-kraken).
const AutodraftCampaignPage = deferredComponent(ROUTE_MODULE_PATHS.autodraftCampaign, "AutodraftCampaignPage");
const KrakenUsdgPage = deferredComponent(ROUTE_MODULE_PATHS.krakenUsdg, "KrakenUsdgPage");
function AcademyRoute({ route, locale }) {
  const content = readAcademyContent(locale);
  if (route.name === "academyHub") return <AcademyHubPage locale={locale} content={content} market={route.market} />;
  return <AcademyEpisodePage locale={locale} content={content} slug={route.slug} market={route.market} glossaryLinks={readGlossaryLinks(locale)} />;
}
// Flash (2026-10-12): the 7x24 stream and item pages share one route chunk (route-flash).
const LongShortPage = deferredComponent(ROUTE_MODULE_PATHS.radar, "LongShortPage");
const WhalesPage = deferredComponent(ROUTE_MODULE_PATHS.radar, "WhalesPage");
const FlashStreamPage = deferredComponent(ROUTE_MODULE_PATHS.flash, "FlashStreamPage");
const FlashItemPage = deferredComponent(ROUTE_MODULE_PATHS.flash, "FlashItemPage");
// Tool key of a route (mirror of toolKeyForRoute in src/data/topic-clusters.js, kept here so the mapping stays off the
// browser entry; tests/crosslinks.test.mjs pins that both agree).
// T10 (2026-10-12): the /news hub, exchange profiles and topic hubs list their strongest related articles too.
const TOPIC_TOOL_KEYS = { "tokenized-treasuries": "topic:tokenized-treasuries", "tokenized-stocks-vs-perpetuals": "topic:tokenized-stocks", "meme-coins": "topic:meme-coins", derivatives: "topic:derivatives", "brazil-crypto-exchange-deadline-2026": "topic:brazil-vasp-deadline" };
const toolKeyOf = (route) => ({ liquidations: "liquidations", liquidationHeatmap: "liquidations", fundingRates: "funding-rates", rateTerminal: "rates", compareHub: "compare", activities: "activities" })[route?.name]
  || (route?.name === "compare" && Array.isArray(route.slugs) && route.slugs.length >= 2 ? `compare:${route.slugs.join("-vs-")}` : null)
  || (route?.name === "newsList" && !route.category && (!route.page || Number(route.page) === 1) ? "news-hub" : null)
  || (route?.name === "venue" && typeof route.slug === "string" && route.slug ? `venue:${route.slug}` : null)
  || ((route?.name === "topic" || route?.name === "tokenizedAssets") && TOPIC_TOOL_KEYS[route.slug] ? TOPIC_TOOL_KEYS[route.slug] : null);
const LeanHero = deferredComponent("./components/v3/LeanHero.jsx", "LeanHero");
const RebateTickerBar = deferredComponent("./components/v3/RebateTickerBar.jsx", "RebateTickerBar");
const CampaignRadar = deferredComponent("./components/v3/CampaignRadar.jsx", "CampaignRadar");
const FeeBenchmarkTerminal = deferredComponent("./components/v3/FeeBenchmarkTerminal.jsx", "FeeBenchmarkTerminal");
const RatesShortAnswer = deferredComponent("./components/v3/FeeBenchmarkTerminal.jsx", "RatesShortAnswer");
const OnChainLiquidityBoard = deferredComponent("./components/v3/OnChainLiquidityBoard.jsx", "OnChainLiquidityBoard");
const MarketFearGreedPanel = deferredComponent("./components/v3/MarketFearGreedPanel.jsx", "MarketFearGreedPanel");
const KolLandingPage = deferredComponent("./components/v3/KolLandingPage.jsx", "KolLandingPage");
const TradingBleedAnalyzer = deferredComponent("./components/v3/TradingBleedAnalyzer.jsx", "TradingBleedAnalyzer");
const TelegramBotHub = deferredComponent("./components/v3/TelegramBotHub.jsx", "TelegramBotHub");
const LiveConversionProof = deferredComponent("./components/v3/LiveConversionProof.jsx", "LiveConversionProof");
const LegalPage = deferredComponent("./components/v3/brand-pages/LegalPage.jsx", "LegalPage");
const AuditMethodologyPage = deferredComponent("./components/v3/MethodologyPage.jsx", "MethodologyPage");
const AboutPage = deferredComponent("./components/v3/brand-pages/AboutPage.jsx", "AboutPage");
const EditorialPolicyPage = deferredComponent("./components/v3/brand-pages/EditorialPolicyPage.jsx", "EditorialPolicyPage");
const EmbedCalculator = deferredComponent("./components/v3/EmbedCalculator.jsx", "EmbedCalculator");
const PartnerEmbedGuide = deferredComponent("./components/v3/PartnerEmbedGuide.jsx", "PartnerEmbedGuide");
const TopicGuidePage = deferredComponent("./components/v3/TopicGuidePage.jsx", "TopicGuidePage");
const FactbookPage = deferredComponent("./components/v3/FactbookPage.jsx", "FactbookPage");
const CollectionHubPage = deferredComponent("./components/v3/CollectionHubPage.jsx", "CollectionHubPage");
const TokenizedAssetsPage = deferredComponent("./components/v3/TokenizedAssetsPage.jsx", "TokenizedAssetsPage");
const VenueAlternativesPage = deferredComponent("./components/v3/VenueAlternativesPage.jsx", "VenueAlternativesPage");
const BrazilDeadlinePage = deferredComponent("./components/v3/BrazilDeadlinePage.jsx", "BrazilDeadlinePage");
const BrazilDecisionPage = deferredComponent("./components/v3/international/BrazilDecisionPage.jsx", "BrazilDecisionPage");
const BrazilEntryLink = deferredComponent("./components/v3/international/BrazilDecisionPage.jsx", "BrazilEntryLink");
const BrazilCostEmbed = deferredComponent("./components/v3/international/BrazilCostEmbed.jsx", "BrazilCostEmbed");
const RegionalMarketPreview = deferredComponent("./components/v3/international/RegionalMarketPreview.jsx", "RegionalMarketPreview");
const REGIONAL_DECISION_DOCK_MARKETS = new Set(["JP", "KR", "TR", "MX", "ID"]);

function InteractionReadySignal({ scope }) {
  useEffect(() => {
    signalInteractionReady(scope);
  }, [scope]);
  return null;
}

function ScopedContent({ children, scope = "page-content", defer = true }) {
  return <>
    <template data-nexualpha-scope-start={scope} />
    {defer ? <React.Suspense fallback={null}>{children}<InteractionReadySignal scope={scope} /></React.Suspense> : <>{children}<InteractionReadySignal scope={scope} /></>}
    <template data-nexualpha-scope-end={scope} />
  </>;
}

function DeferredBoundary({ children, scope = "page-content" }) {
  return <ScopedContent scope={scope}>{children}</ScopedContent>;
}

const normalizeRequestedLocale = (requested) => {
  if (!requested) return null;
  if (supportedLocales.includes(requested)) return requested;
  const base = String(requested).split(/[-_]/)[0].toLowerCase();
  const alias = { zh: "zh-Hans", pt: "pt-BR" }[base] || base;
  return supportedLocales.includes(alias) ? alias : null;
};

const readLocale = (initialUrl) => {
  const sourceUrl = initialUrl
    ? new URL(initialUrl, "https://nexualpha.com")
    : (typeof window !== "undefined" ? new URL(window.location.href) : null);
  if (!sourceUrl) return "en";
  const contextParams = new URLSearchParams(decisionContextSearchFromUrl(sourceUrl));
  const requested = sourceUrl.searchParams.get("locale") || contextParams.get("locale");
  const publicRoute = parsePublicRoute(sourceUrl.pathname, sourceUrl.searchParams);
  // Brazil decision routes are original pt-BR pages. Letting an arbitrary UI
  // locale override them creates a mixed-language page and can even apply RTL
  // to Portuguese content, so the route language owns the interface here.
  if (isBrazilPagePath(publicRoute.contentPathname || sourceUrl.pathname)) return "pt-BR";
  if (publicRoute.localeSource === "path") return publicRoute.locale;
  const normalized = normalizeRequestedLocale(requested);
  if (normalized) return normalized;
  if (publicRoute.localeSource === "default" && isGenericEnglishDefaultRoute(publicRoute.contentPathname)) return "en";
  const policyLocale = resolveMarketLocale({ pathname: sourceUrl.pathname, locale: normalized || requested, market: sourceUrl.searchParams.get("market") || contextParams.get("market") });
  if (supportedLocales.includes(policyLocale)) return policyLocale;
  if (typeof window === "undefined") return "en";
  try { return storedLocale(window.localStorage, localStorageKey, supportedLocales); }
  catch { return "en"; }
};

const readComparison = () => {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem("nexualpha-comparison") || "null");
    if (Array.isArray(saved)) return cleanSelection(saved, neutralVenueCatalog);
  } catch { /* A blocked session store must not prevent browsing. */ }
  return ["binance", "okx"];
};

const withLocale = (locale, href) => localizedHref(href, { locale });

const GENERIC_ENGLISH_DEFAULT_EXACT_ROUTES = new Set(["/", "/rates", "/onchain", "/methodology", "/about", "/editorial-policy", "/privacy", "/terms", "/contact", "/partners", "/telegram", LIQUIDATIONS_PATH, LIQUIDATION_HEATMAP_PATH, FUNDING_RATES_PATH, ETF_FLOWS_PATH, CALENDAR_PATH, FEE_INDEX_PATH, TS_TRACKER_PATH, WHALE_REPORT_PATH, PRESS_PATH]);
const GENERIC_ENGLISH_DEFAULT_PREFIXES = [...BEGINNER_ROOTS, ...DEPOSIT_ROOTS, CRYPTO_CARDS_PATH, "/guides", "/exchanges", "/compare", "/topics", "/factbook", "/activities", "/news", "/markets", "/academy", FLASH_PATH, "/coins", TS_PATH, "/convert", "/glossary", "/licenses"];

const isGenericEnglishDefaultRoute = (pathname = "/") => {
  const normalized = String(pathname || "/").split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  return GENERIC_ENGLISH_DEFAULT_EXACT_ROUTES.has(normalized)
    || GENERIC_ENGLISH_DEFAULT_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
};

const homeNavigationCopy = (locale) => {
  if (locale === "zh-Hant" || locale === "zh-TW") return {
    label: "本頁導覽",
    compare: "比較",
    analyzer: "費用體檢",
    venues: "平台目錄",
    research: "研究工具",
  };
  if (locale.startsWith("zh")) return {
    label: "本页导航",
    compare: "比较",
    analyzer: "费用体检",
    venues: "平台目录",
    research: "研究工具",
  };
  const localized = {
    ja: { label: "このページ", compare: "比較", analyzer: "手数料チェック", venues: "プラットフォーム", research: "調査ツール" },
    ko: { label: "이 페이지", compare: "비교", analyzer: "수수료 확인", venues: "플랫폼", research: "리서치 도구" },
    tr: { label: "Bu sayfada", compare: "Karşılaştır", analyzer: "Ücret kontrolü", venues: "Platformlar", research: "Araştırma araçları" },
    ru: { label: "На этой странице", compare: "Сравнить", analyzer: "Проверка комиссий", venues: "Платформы", research: "Инструменты исследования" },
    de: { label: "Auf dieser Seite", compare: "Vergleichen", analyzer: "Gebühren prüfen", venues: "Plattformen", research: "Recherchetools" },
    fr: { label: "Sur cette page", compare: "Comparer", analyzer: "Vérifier les frais", venues: "Plateformes", research: "Outils de recherche" },
    es: { label: "En esta página", compare: "Comparar", analyzer: "Revisar comisiones", venues: "Plataformas", research: "Herramientas de investigación" },
    "pt-BR": { label: "Nesta página", compare: "Comparar", analyzer: "Verificar taxas", venues: "Plataformas", research: "Ferramentas de pesquisa" },
    it: { label: "In questa pagina", compare: "Confronta", analyzer: "Controllo commissioni", venues: "Piattaforme", research: "Strumenti di ricerca" },
    id: { label: "Di halaman ini", compare: "Bandingkan", analyzer: "Cek biaya", venues: "Platform", research: "Alat riset" },
    vi: { label: "Trên trang này", compare: "So sánh", analyzer: "Kiểm tra phí", venues: "Nền tảng", research: "Công cụ nghiên cứu" },
    // l10n: needs native review
    ur: { label: "اس صفحے پر", compare: "موازنہ", analyzer: "فیس کی جانچ", venues: "پلیٹ فارم", research: "تحقیقی ٹولز" },
    // l10n: needs native review
    uk: { label: "На цій сторінці", compare: "Порівняння", analyzer: "Перевірка комісій", venues: "Платформи", research: "Дослідницькі інструменти" },
    ar: { label: "في هذه الصفحة", compare: "مقارنة", analyzer: "فحص الرسوم", venues: "المنصات", research: "أدوات البحث" },
  };
  if (localized[locale]) return localized[locale];
  return { label: "On this page", compare: "Compare", analyzer: "Fee check", venues: "Platforms", research: "Research tools" };
};

const liquidationHeatmapNavLabel = (locale) => (
  locale === "zh-Hant" || locale === "zh-TW" ? "清算熱力圖"
    : locale.startsWith("zh") ? "清算热力图"
      : ({ ja: "清算ヒートマップ", ko: "청산 히트맵", tr: "Likidasyon haritası", ru: "Карта ликвидаций", de: "Liquidationskarte", fr: "Carte des liquidations", es: "Mapa de liquidaciones", "pt-BR": "Mapa de liquidações", it: "Mappa delle liquidazioni", id: "Peta likuidasi", vi: "Bản đồ thanh lý", ar: "خريطة التصفية" }[locale] || "Liquidation heatmap")
);

function HomeSectionNav({ locale }) {
  const text = homeNavigationCopy(locale);
  return <nav className="home-section-nav v2-shell" aria-label={text.label}>
    <span className="home-section-nav__label">{text.label}</span>
    <a href="#compare">{text.compare}</a>
    <a href="#bleed-analyzer">{text.analyzer}</a>
    <a href="#exchanges">{text.venues}</a>
    <a href="#research-tools">{text.research}</a>
  </nav>;
}

function HomeResearchDrawer({ locale }) {
  const [researchOpen, setResearchOpen] = useState(false);
  const researchDrawerRef = useRef(null);
  useEffect(() => {
    setResearchOpen(Boolean(researchDrawerRef.current?.open));
  }, []);
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const isZh = locale.startsWith("zh");
  const text = isHant
    ? { summary: "展開研究工具", note: "費率、鏈上流動性、Telegram 與市場狀態集中在這裡" }
    : isZh
      ? { summary: "展开研究工具", note: "费率、链上流动性、Telegram 与市场状态集中在这里" }
      : ({
        ja: { summary: "調査ツールを開く", note: "手数料、オンチェーン流動性、Telegram、市場状況をまとめて確認" },
        ko: { summary: "리서치 도구 열기", note: "수수료, 온체인 유동성, Telegram과 시장 상태를 한곳에서 확인" },
        tr: { summary: "Araştırma araçlarını aç", note: "Ücretler, zincir üstü likidite, Telegram ve piyasa durumu" },
        ru: { summary: "Открыть инструменты исследования", note: "Комиссии, ончейн-ликвидность, Telegram и состояние рынка" },
        de: { summary: "Recherchetools öffnen", note: "Gebühren, On-Chain-Liquidität, Telegram und Marktstatus" },
        fr: { summary: "Ouvrir les outils de recherche", note: "Frais, liquidité on-chain, Telegram et état du marché" },
        es: { summary: "Abrir herramientas de investigación", note: "Comisiones, liquidez on-chain, Telegram y estado del mercado" },
        "pt-BR": { summary: "Abrir ferramentas de pesquisa", note: "Taxas, liquidez on-chain, Telegram e estado do mercado" },
        it: { summary: "Apri strumenti di ricerca", note: "Commissioni, liquidità on-chain, Telegram e stato del mercato" },
        id: { summary: "Buka alat riset", note: "Biaya, likuiditas on-chain, Telegram, dan kondisi pasar" },
        vi: { summary: "Mở công cụ nghiên cứu", note: "Phí, thanh khoản on-chain, Telegram và trạng thái thị trường" },
        // l10n: needs native review
        ur: { summary: "تحقیقی ٹولز کھولیں", note: "فیس، آن چین لیکویڈیٹی، Telegram اور مارکیٹ کی حالت" },
        // l10n: needs native review
        uk: { summary: "Відкрити дослідницькі інструменти", note: "Комісії, ліквідність у блокчейні, Telegram і стан ринку" },
        ar: { summary: "فتح أدوات البحث", note: "الرسوم والسيولة على السلسلة وTelegram وحالة السوق" },
      }[locale] || { summary: "Open research tools", note: "Fees, on-chain liquidity, Telegram and market state in one section" });
  return <details className="home-research-drawer" id="research-tools" ref={researchDrawerRef} onToggle={(event) => {
    if (event.target === event.currentTarget) setResearchOpen(event.currentTarget.open);
  }}>
    <summary><strong>{text.summary}</strong><span>{text.note}</span><b aria-hidden="true">＋</b></summary>
    <div className="home-research-drawer__body">
      {researchOpen && <LiveConversionProof locale={locale} />}
      <CampaignRadar locale={locale} />
      <FeeBenchmarkTerminal locale={locale} />
      <OnChainLiquidityBoard locale={locale} />
      <TelegramBotHub locale={locale} />
      <MarketFearGreedPanel locale={locale} />
    </div>
  </details>;
}

export function routeState(venues, initialUrl) {
  const sourceUrl = initialUrl
    ? new URL(initialUrl, "https://nexualpha.com")
    : (typeof window !== "undefined" ? new URL(window.location.href) : null);
  if (!sourceUrl) return { name: "home" };
  const publicRoute = parsePublicRoute(sourceUrl.pathname, sourceUrl.searchParams);
  const pathname = publicRoute.contentPathname;
  const search = sourceUrl.search;
  if (isBrazilPagePath(pathname)) return { name: "brazil", pathname };
  // Market-specific decision routes reuse the audited global tools while
  // preserving the user's market and locale context.
  const regionalDecisionPath = pathname.match(/^\/(mx|tw|hk)\/(comparar|costos|conta)$/);
  if (regionalDecisionPath) {
    const market = regionalDecisionPath[1].toUpperCase();
    const marketContext = new URLSearchParams(search);
    marketContext.set("market", market);
    const locale = marketContext.get("locale") || (market === "TW" ? "zh-Hant" : market === "HK" ? "en" : "es");
    if (market === "MX") return { name: "regionalDecision", market, locale, decisionPath: regionalDecisionPath[2] };
    if (regionalDecisionPath[2] === "comparar") return { name: "compare", slugs: ["binance", "okx"], market, product: "spot", locale };
    if (regionalDecisionPath[2] === "costos") return { name: "rateTerminal", market, product: "spot", locale };
    return { name: "directory", market, product: "spot", locale };
  }
  if (pathname === "/markets/turkiye") {
    return { name: "regionalPreview", market: "TR" };
  }
  const regionalPath = pathname.match(/^\/(mx|tw|id|vn|hk|eu|uk|us|jp|kr|sg|int)$/);
  if (regionalPath) {
    const market = regionalPath[1] === "int" ? "OTHER" : regionalPath[1].toUpperCase();
    return { name: "regionalPreview", market };
  }
  const searchParams = new URLSearchParams(search);
  const contextParams = () => ({
    market: searchParams.get("market") || undefined,
    product: searchParams.get("product") || undefined,
    campaign: searchParams.get("utm_campaign") || undefined,
    source: searchParams.get("utm_source") || undefined,
    accountStage: searchParams.get("account_stage") || undefined,
    funding: searchParams.get("funding") || undefined,
  });
  const refMatch = pathname.match(/^\/ref\/([a-z0-9-]+)$/);
  if (refMatch) return { name: "kolLanding", kol: refMatch[1], ...contextParams() };
  if (pathname === "/") return { name: "home", ...contextParams() };
  if (searchParams.get("page") === "newsDetail" && searchParams.get("slug")) {
    return { name: "newsDetail", slug: searchParams.get("slug"), ...contextParams() };
  }
  if (pathname === "/news") return { name: "newsList", category: null, page: 1, ...contextParams() };
  const newsListing = parseNewsListingPath(pathname);
  if (newsListing) return newsListing.invalid ? { name: "notFound" } : { name: "newsList", category: newsListing.category, page: newsListing.page, ...contextParams() };
  if (pathname === "/onchain") return { name: "onchainBoard" };
  if (["/privacy", "/terms", "/contact"].includes(pathname)) return { name: "legal", pathname };
  if (pathname === "/methodology") return { name: "methodology" };
  if (pathname === "/about") return { name: "about" };
  if (pathname === "/editorial-policy") return { name: "editorialPolicy" };
  if (pathname === "/embed/calculator") return { name: "embedCalculator" };
  if (pathname === "/partners" || pathname === "/partners/embed-guide") return { name: "partners" };
  if (pathname === "/telegram") return { name: "telegram" };
  const appDownload = parseAppDownloadPath(pathname);
  if (appDownload) return appDownload.valid ? { name: "appDownload", slug: appDownload.slug, ...contextParams() } : { name: "notFound" };
  const academy = parseAcademyPath(pathname);
  if (academy?.kind === "hub") return { name: "academyHub", ...contextParams() };
  if (academy?.kind === "episode") return { name: "academyEpisode", slug: academy.episode.slug, ...contextParams() };
  if (academy?.kind === "missing") return { name: "notFound" };
  if (isBitgetGuidePath(pathname)) return bitgetGuideAvailable(publicRoute.locale, searchParams.get("market")) ? { name: "bitgetGuide" } : { name: "notFound" };
  const beginner = parseBeginnerPath(pathname, publicRoute.locale);
  if (beginner) return beginner.kind === "missing" ? { name: "notFound" } : { name: "beginner", beginner, ...contextParams() };
  const deposit = parseDepositPath(pathname, publicRoute.locale);
  if (deposit) return deposit.kind === "missing" ? { name: "notFound" } : { name: "deposit", pathname, ...contextParams() };
  const licenses = parseLicensesPath(pathname);
  if (licenses?.kind === "hub") return { name: "licenses", ...contextParams() };
  if (licenses?.kind === "country") return { name: "licenses", country: licenses.country, ...contextParams() };
  if (licenses) return { name: "notFound" };
  const converter = parseConverterPath(pathname);
  if (converter?.kind === "pair") return { name: "converter", symbol: converter.symbol, fiat: converter.fiat, ...contextParams() };
  if (converter) return { name: "notFound" };
  const coins = parseCoinsPath(pathname);
  if (coins?.kind === "hub") return { name: "coinsHub", ...contextParams() };
  // Türkiye pages (tr-market-gaps): an SPK-listed venue's own token (BGB) has no page there, like the Bitget guide.
  if (coins?.kind === "coin") return turkeyListingAllowed(coins.slug, { locale: publicRoute.locale, market: searchParams.get("market") || undefined }) ? { name: "coinPage", slug: coins.slug, ...contextParams() } : { name: "notFound" };
  if (coins?.kind === "missing") return { name: "notFound" };
  const tokenizedStocks = parseTokenizedStocksPath(pathname);
  if (tokenizedStocks?.kind === "hub") return { name: "tokenizedStocksHub", ...contextParams() };
  if (tokenizedStocks?.kind === "ticker") return { name: "tokenizedStocksTicker", ticker: tokenizedStocks.ticker, ...contextParams() };
  // Türkiye never shows Bitget: its exchange-product page does not exist there.
  if (tokenizedStocks?.kind === "exchange") return tokenizedStocks.slug === "bitget" && (publicRoute.locale === "tr" || String(searchParams.get("market") || "").toUpperCase() === "TR") ? { name: "notFound" } : { name: "tokenizedStocksExchange", slug: tokenizedStocks.slug, ...contextParams() };
  if (tokenizedStocks) return { name: "notFound" };
  const glossary = parseGlossaryPath(pathname);
  if (glossary?.kind === "hub") return { name: "glossaryHub", ...contextParams() };
  if (glossary?.kind === "term") return { name: "glossaryTerm", slug: glossary.slug, ...contextParams() };
  if (glossary?.kind === "missing") return { name: "notFound" };
  // Flash: same shapes as parseFlashPath (src/data/flash-path.js), inlined to keep the entry inside its budget.
  if (pathname === "/long-short") return { name: "longShort", ...contextParams() };
  if (pathname === "/whales" || coinForWhalePath(pathname)) return { name: "whales", coin: coinForWhalePath(pathname), ...contextParams() };
  if (pathname === FLASH_PATH) return { name: "flashStream", ...contextParams() };
  const flashKey = pathname.startsWith(`${FLASH_PATH}/`) && (pathname.match(/^\/flash\/([0-9a-z]{10})(?:-[a-z0-9-]*)?$/) || [])[1];
  if (flashKey) return { name: "flashItem", key: flashKey, ...contextParams() };
  if (pathname.startsWith(`${FLASH_PATH}/`)) return { name: "notFound" };
  if (pathname === LIQUIDATION_HEATMAP_PATH) return { name: "liquidationHeatmap" };
  if (pathname === FEE_INDEX_PATH) return { name: "feeIndex", ...contextParams() };
  if (pathname === TS_TRACKER_PATH) return { name: "tsTracker", ...contextParams() };
  if (pathname === WHALE_REPORT_PATH) return { name: "whaleReport", ...contextParams() };
  if (pathname === PRESS_PATH) return { name: "press", ...contextParams() };
  if (pathname === ETF_FLOWS_PATH) return { name: "etfFlows", ...contextParams() };
  if (pathname === CALENDAR_PATH) return { name: "calendar", ...contextParams() };
  if (pathname === LIQUIDATIONS_PATH) return { name: "liquidations" };
  if (pathname === "/funding-rates/matrix") return { name: "fundingMatrix", ...contextParams() };
  if (pathname === FUNDING_RATES_PATH) return { name: "fundingRates" };
  if (pathname === "/topics") return { name: "topicCollection", ...contextParams() };
  const topicMatch = pathname.match(/^\/topics\/([a-z0-9-]+)$/);
  if (topicMatch && TOKENIZED_ASSET_SLUGS.includes(topicMatch[1])) return { name: "tokenizedAssets", slug: topicMatch[1], ...contextParams() };
  if (topicMatch && VENUE_ALTERNATIVE_SLUGS.includes(topicMatch[1])) return { name: "venueAlternatives", slug: topicMatch[1], ...contextParams() };
  if (topicMatch && BRAZIL_DEADLINE_SLUGS.includes(topicMatch[1])) return { name: "brazilDeadline", slug: topicMatch[1], ...contextParams() };
  if (topicMatch) return TOPIC_SLUGS.includes(topicMatch[1]) ? { name: "topic", slug: topicMatch[1], ...contextParams() } : { name: "notFound" };
  if (pathname === "/factbook") return { name: "factbookCollection", ...contextParams() };
  const factbookMatch = pathname.match(/^\/factbook\/([a-z0-9-]+)$/);
  if (factbookMatch) {
    const slug = factbookMatch[1];
    const venue = venues.find((v) => v.slug === slug) || venueDatabase[slug];
    return venue ? { name: "factbook", slug, ...contextParams() } : { name: "notFound" };
  }
  const newsMatch = pathname.match(/^\/news\/([a-z0-9-]+)$/);
  if (newsMatch) return { name: "newsDetail", slug: newsMatch[1], ...contextParams() };
  if (pathname === "/rates") return { name: "rateTerminal", ...contextParams() };
  if (pathname === "/exchanges") return { name: "directory", ...contextParams() };
  const venueMatch = pathname.match(/^\/exchanges\/([a-z0-9-]+)$/);
  if (venueMatch) return { name: "venue", slug: venueMatch[1], ...contextParams() };
  if (pathname === "/compare") return { name: "compareHub", ...contextParams() };
  const compareMatch = pathname.match(/^\/compare\/([a-z0-9-]+(?:-vs-[a-z0-9-]+){1,2})$/);
  if (compareMatch) {
    const slugs = validComparison(compareMatch[1], venues);
    return slugs ? { name: "compare", slugs, ...contextParams() } : { name: "notFound" };
  }
  const officialResearch = researchRoute(pathname, venues);
  if (officialResearch) return { ...officialResearch, ...contextParams() };
  if (parseBinanceOctoberPath(pathname)) return { name: "binanceOctober", ...contextParams() };
  if (parseBybitStocksPath(pathname)) return { name: "bybitStocks", ...contextParams() };
  if (parseBitgetAlliancePath(pathname)) return { name: publicRoute.locale === "tr" ? "activities" : "bitgetAlliance", ...contextParams() };
  const autodraft = approvedCampaign(pathname);
  if (autodraft) return { name: "autodraftCampaign", id: autodraft.id, ...contextParams() };
  if (parseKrakenUsdgPath(pathname)) return { name: "krakenUsdg", ...contextParams() };
  const updateMatch = pathname.match(/^\/activities\/updates\/([a-z0-9-]+)\/([a-z0-9-]+)$/);
  if (updateMatch) return { name: "activityUpdate", venue: updateMatch[1], slug: updateMatch[2], ...contextParams() };
  const activityMatch = pathname.match(/^\/activities\/([^/]+)$/);
  if (activityMatch) {
      try { return { name: "activity", id: decodeURIComponent(activityMatch[1]), ...contextParams() }; } catch { return { name: "notFound" }; }
  }
  if (pathname === "/activities") return { name: "activities", ...contextParams() };
  return pathname === "/" || pathname === "/index.html" ? { name: "home", ...contextParams() } : { name: "notFound" };
}

export async function preloadCurrentRouteModulesForUrl(initialUrl, options = {}) {
  if (import.meta.env.SSR) return;
  const route = routeState(neutralVenueCatalog, initialUrl);
  await preloadRouteModules(modulePathsForRoute(route, initialUrl), options);
}

// Native modal ownership keeps the covered page inert and Tab inside the menu.
function activateMobileMenu(dialog, trigger, header, onClose) {
  const desktop = window.matchMedia("(min-width: 781px)");
  const restoreFocus = () => {
    const target = desktop.matches
      ? header?.querySelector(".nx-nav a[href], .nexualpha-wordmark[href]")
      : trigger;
    if (target?.isConnected) target.focus({ preventScroll: true });
  };
  if (desktop.matches) {
    onClose();
    restoreFocus();
    return () => {};
  }
  const oldOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  const cancel = (event) => { event.preventDefault(); onClose(); };
  const breakpoint = (event) => { if (event.matches) onClose(); };
  dialog.addEventListener("cancel", cancel);
  desktop.addEventListener("change", breakpoint);
  dialog.showModal();
  dialog.querySelector("button")?.focus({ preventScroll: true });
  return () => {
    dialog.removeEventListener("cancel", cancel);
    desktop.removeEventListener("change", breakpoint);
    if (dialog.open) dialog.close();
    document.body.style.overflow = oldOverflow;
    restoreFocus();
  };
}


function appendLanguageContextFragment(href, contextUrl, locale) {
  if (!contextUrl || !/[?#&](?:market|product|utm_source|platform|amount|scenario|venue|instrument|order|volume)=/.test(contextUrl)) return href;
  try {
    const contextHash = new URL(localizedLanguageHref(contextUrl, { locale }), "https://nexualpha.com").hash;
    if (!contextHash) return href;
    const target = new URL(href, "https://nexualpha.com");
    return `${target.pathname}${target.search}${contextHash}`;
  } catch {
    return href;
  }
}

function Header({ copy, locale, onLocaleChange, onSearch, brazil = false, initialUrl, pageAlternates = [] }) {
  const [navigationUrl, setNavigationUrl] = useState(null);
  useEffect(() => {
    const update = () => setNavigationUrl(window.location.href);
    update();
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  }, [locale, brazil]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const mobileTriggerRef = useRef(null);
  const headerRef = useRef(null);
  const text = v3ShellCopy(locale);
  const nav = brazil ? [
    ["Comparar plataformas", "/br/comparar"],
    ["Pix", "/br/pix"],
    ["Saque Pix", "/br/saque-pix"],
    ["Calcular custos", "/br/custos"],
    ["KYC e CPF", "/br/kyc-cpf"],
    ["Conta e benefícios", "/br/conta"],
  ] : [
    // Header items name real destinations: the exchange directory and the comparison page,
    // not anchors on the home page (the home page has no #exchanges / #compare section any more).
    [copy.nav.exchanges, withLocale(locale, "/exchanges")],
    // Tokenized US stocks (owner 2026-10-15: this year's top traffic topic): second primary item.
    [tokenizedStocksNavLabel(locale), withLocale(locale, TS_PATH)],
    [copy.nav.compare, withLocale(locale, "/compare")], // compare hub: any-two picker + popular pairs (audit 4.6)
    // Academy (owner 2026-10-12): the 24-lesson beginner course is a primary destination.
    [academyShellCopy(locale).nav, withLocale(locale, "/academy")],
    [text.activities, withLocale(locale, "/activities")],
    [locale === "zh-Hant" || locale === "zh-TW" ? "新聞與研究" : locale.startsWith("zh") ? "新闻与研究" : ({ ja: "マーケットニュース", ko: "시장 뉴스", tr: "Piyasa Haberleri", ru: "Новости рынка", de: "Marktnachrichten", fr: "Actualités du marché", es: "Noticias del mercado", "pt-BR": "Notícias do mercado", it: "Notizie di mercato", id: "Berita pasar", vi: "Tin thị trường",
        // l10n: needs native review
        ur: "مارکیٹ کی خبریں",
        // l10n: needs native review
        uk: "Новини ринку", ar: "أخبار السوق" }[locale] || "Market news"), withLocale(locale, "/news")],
    // Flash (2026-10-12): the 7x24 stream sits first under "More" (the five primary items stay as the owner set them).
    [flashNavLabel(locale), withLocale(locale, FLASH_PATH)],
    // Deposit & withdraw (出入金, 2026-10-15): the hub under "More", right after Flash.
    [depositNavLabel(locale), withLocale(locale, DEPOSIT_ROOTS[0])],
    [locale === "zh-Hant" || locale === "zh-TW" ? "賽道選型" : locale.startsWith("zh") ? "赛道选型" : ({ ja: "トピックガイド", ko: "주제 가이드", tr: "Konu Rehberleri", ru: "Тематические гиды", de: "Themen-Guides", fr: "Guides thématiques", es: "Guías temáticas", "pt-BR": "Guias temáticos", it: "Guide tematiche", id: "Panduan topik", vi: "Hướng dẫn chủ đề",
        // l10n: needs native review
        ur: "موضوعاتی رہنما",
        // l10n: needs native review
        uk: "Тематичні посібники", ar: "أدلة المواضيع" }[locale] || "Topic Guides"), withLocale(locale, "/topics/meme-coins")],
    [dataPageCopy(locale).nav.liquidations, withLocale(locale, LIQUIDATIONS_PATH)],
    [liquidationHeatmapNavLabel(locale), withLocale(locale, LIQUIDATION_HEATMAP_PATH)],
    [locale.startsWith("zh") ? "Telegram" : ({ ja: "Telegram調査", ko: "Telegram 리서치", tr: "Telegram araştırma", ru: "Исследование в Telegram", de: "Telegram-Recherche", fr: "Analyses Telegram", es: "Investigación en Telegram", "pt-BR": "Pesquisa no Telegram", it: "Ricerca Telegram", id: "Riset Telegram", vi: "Nghiên cứu Telegram",
        // l10n: needs native review
        ur: "Telegram تحقیق",
        // l10n: needs native review
        uk: "Дослідження Telegram", ar: "بحث Telegram" }[locale] || "Telegram Research"), withLocale(locale, "/telegram")],
  ];
  useEffect(() => {
    if (!mobileOpen) return;
    return activateMobileMenu(mobileMenuRef.current, mobileTriggerRef.current, headerRef.current, () => setMobileOpen(false));
  }, [mobileOpen]);
  const localeOptions = useMemo(() => {
    const contextUrl = navigationUrl || "";
    const options = languageOptionsFromHreflang(pageAlternates)
      .filter((option) => !brazil || option.code === "pt-BR")
      .map((option) => ({ ...option, href: appendLanguageContextFragment(option.href, contextUrl, option.code) }));
    return options.length ? options : (brazil ? [{ code: "pt-BR", label: localeManifest["pt-BR"].language, href: localizedLanguageHref(navigationUrl || initialUrl || "/", { locale: "pt-BR" }) }] : []);
  }, [brazil, navigationUrl, initialUrl, pageAlternates]);
  const navState = (href) => headerNavigationState(href, navigationUrl);
  const closeMobile = () => setMobileOpen(false);
  const languageMenu = <LanguageMenu locale={locale} options={localeOptions} label={copy.ui.language} disabled={brazil} onSelect={onLocaleChange} inline />;
  return <>
    <SiteHeader copy={copy} locale={locale} brazil={brazil} nav={nav} homeHref={withLocale(locale, "/")} navState={navState} localeOptions={localeOptions}
      onLocaleChange={onLocaleChange} onSearch={onSearch} mobileOpen={mobileOpen} onMobileToggle={() => setMobileOpen((value) => !value)}
      mobileTriggerRef={mobileTriggerRef} headerRef={headerRef} />
    {mobileOpen && <MobileSheet copy={copy} nav={nav} homeHref={withLocale(locale, "/")} navState={navState} dialogRef={mobileMenuRef} languageMenu={languageMenu}
      onClose={closeMobile} onSearch={() => { closeMobile(); onSearch({ currentTarget: mobileTriggerRef.current }); }} />}
  </>;
}

export function App({ initialUrl, initialLocale, initialCompareSelection, initialNewsArticles, initialHomeLatest, initialNewsListing, initialMarketEvents, initialLiquidationLevels, initialFundingMatrix, initialFundingFeed, initialOfficialAnnouncements, initialToolArticles, initialFlash, initialCoins, initialFx, initialTicker, initialWhales, initialRadar, initialIntelTool, initialSeoAlternates, initialTsLive, initialTsPage } = {}) {
  const [locale, setLocale] = useState(() => initialLocale || readLocale(initialUrl));
  const region = "Global";
  const [siteView, setSiteView] = useState(null);
  const [dataStatus, setDataStatus] = useState("loading");
  const [dataRevision, setDataRevision] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pageAlternates, setPageAlternates] = useState(() => {
    if (Array.isArray(initialSeoAlternates)) return initialSeoAlternates;
    if (typeof document === "undefined") return [];
    return readInitialPageAlternates(document);
  });
  // Only commit alternates when their content changes; identical arrays must not re-render the whole app.
  const setStableAlternates = useCallback((next) => {
    setPageAlternates((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, []);
  const searchReturnFocusRef = useRef(null);

  // Hydration can begin from the server's default locale while the browser URL
  // already carries an explicit locale query. Reconcile once on the client so
  // legacy V3 children cannot remain on the English default after hydration.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlLocale = readLocale(window.location.href);
    if (urlLocale && urlLocale !== locale) setLocale(urlLocale);
  }, [locale]);
  const closeSearchDialog = useCallback(() => setSearchOpen(false), []);
  const openSearchDialog = useCallback((event) => {
    const candidate = event?.currentTarget;
    if (candidate?.focus && candidate.isConnected !== false) {
      searchReturnFocusRef.current = candidate;
    } else if (typeof document !== "undefined") {
      const active = document.activeElement;
      searchReturnFocusRef.current = active && active !== document.body ? active : null;
    }
    setSearchOpen(true);
  }, []);
  const [compareSelection, setCompareSelection] = useState(() => initialCompareSelection || readComparison());
  // Home acts (lab + directory) share their pair through this store instead of App state, so a pick never re-renders the page.
  const [homeSelection] = useState(() => createSelectionStore(compareSelection));
  const copy = useMemo(() => v2Copy(locale), [locale]);
  const changeLocale = useCallback((nextLocale) => {
    if (!supportedLocales.includes(nextLocale)) return;
    // A full locale navigation is intentional: it guarantees that SSR, the
    // prerendered route tree, and every legacy child component start from the
    // same locale. A client-only state swap could leave an English subtree
    // mounted after changing the selector.
    if (typeof window === "undefined") {
      setLocale(nextLocale);
      return;
    }
    window.location.assign(localizedHref(`${window.location.pathname}${window.location.search}${window.location.hash}`, { locale: nextLocale, preserveQuery: true }));
  }, []);

  useEffect(() => {
    try { setParaglideLocale(locale, { reload: false }); } catch { /* URL and React state remain authoritative if persistence is denied. */ }
    try {
      window.localStorage.setItem(localStorageKey, locale);
      document.cookie = `${localStorageKey}=${encodeURIComponent(locale)}; path=/; max-age=34560000; samesite=lax`;
    } catch { /* Locale changes remain usable without browser persistence. */ }
    const localizedUrl = localizedHref(`${window.location.pathname}${window.location.search}${window.location.hash}`, { locale, preserveQuery: true });
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== localizedUrl) window.history.replaceState(window.history.state, "", localizedUrl);
    document.documentElement.lang = intlLocale(locale);
    document.documentElement.dir = getTextDirection(locale);
    document.documentElement.dataset.build = __NEXUALPHA_BUILD_ID__;
  }, [locale]);
  useEffect(() => { const syncFromHistory = () => setLocale(readLocale()); window.addEventListener("popstate", syncFromHistory); return () => window.removeEventListener("popstate", syncFromHistory); }, []);
  useEffect(() => installHashNavigation(document, window), []);
  useEffect(() => {
    let alive = true;
    setDataStatus("loading");
    setSiteView(null);
    loadSiteView(locale).then((result) => {
      if (!alive) return;
      setSiteView(result.view ?? null);
      setDataStatus(result.status);
    }).catch(() => {
      if (!alive) return;
      setSiteView(null);
      setDataStatus("error");
    });
    return () => { alive = false; };
  }, [locale, dataRevision]);

  useEffect(() => {
    document.documentElement.dataset.dataSource = siteView?.source ?? "local-research";
  }, [siteView]);

  useEffect(() => {
    try { window.sessionStorage.setItem("nexualpha-comparison", JSON.stringify(compareSelection)); } catch { /* Selection remains usable in memory. */ }
  }, [compareSelection]);

  useEffect(() => {
    const openSearch = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  const model = presentationModel(siteView, region, copy);
  const [noticeFeed, setNoticeFeed] = useState(initialOfficialAnnouncements);
  useEffect(() => { setNoticeFeed(initialOfficialAnnouncements); }, [initialOfficialAnnouncements]);
  const sharedOfficialEvents = useMemo(() => {
    return Array.isArray(noticeFeed?.items) ? sharedOfficialEventItems(noticeFeed) : (model.officialUpdates ?? []);
  }, [noticeFeed, model.officialUpdates]);
  const command = useMemo(() => marketCommand(copy, model.venues), [copy, model.venues]);
  const route = routeState(command.venueCatalog, initialUrl);
  useEffect(() => {
    if (route.name !== "venue" && route.name !== "compare") return;
    return startJsonPolling({ request: "/intel/official-announcements.json", intervalMs: 5 * 60 * 1000,
      isData: (feed) => Array.isArray(feed?.items), onData: setNoticeFeed });
  }, [route.name]);
  useEffect(() => {
    if (route.name === "newsDetail") {
      // The article component owns metadata after its feed resolves, including
      // locale switches and missing articles. Preserve the server head meanwhile.
      return;
    }
    // Route SEO is server-rendered for every route (worker routeMetadata). The browser keeps that head on first load
    // and only after a client-side route change fetches that one route's head from /api/route-seo
    // (src/data/route-seo-client.js, seo-payload lane 2026-10-11) instead of shipping the route tables.
    let alive = true;
    syncRouteSeo({ pathname: window.location.pathname, search: window.location.search, locale }).then((seo) => {
      if (!alive) return;
      setStableAlternates(seo?.alternates?.length ? seo.alternates : readInitialPageAlternates(document));
    });
    return () => { alive = false; };
    // routeState() returns a new object every render; depending on it re-ran this effect after every render and the
    // fresh alternates array re-rendered the whole app ~800x/s while idle (perf audit 2026-10-14). Key on stable values.
  }, [locale, route.name, initialUrl]);
  useEffect(() => {
    if (typeof document === "undefined" || typeof MutationObserver === "undefined") return undefined;
    const update = () => setStableAlternates(readInitialPageAlternates(document));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["href", "hreflang", "rel"] });
    return () => observer.disconnect();
  }, [locale, route.name]);

  const [liveDecisionContextSearch, setLiveDecisionContextSearch] = useState(null);
  // Apply fragment-based geographic gates before passive feed refresh effects.
  const useDecisionContextEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
  useDecisionContextEffect(() => {
    if (typeof window === "undefined") return undefined;
    const update = () => setLiveDecisionContextSearch(decisionContextSearchFromUrl(window.location.href));
    update();
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  }, []);
  if (import.meta.env.DEV && typeof window !== "undefined" && window.location.pathname === "/dev/design-system") return <DesignSystem />;
  const selectedFromRoute = route.name === "compare" && route.slugs.length >= 2 ? route.slugs : compareSelection;
  const sourceSearch = liveDecisionContextSearch ?? (initialUrl
    ? decisionContextSearchFromUrl(initialUrl)
    : (typeof window !== "undefined" ? decisionContextSearchFromUrl(window.location.href) : ""));
  const decisionPassport = readDecisionPassport(sourceSearch, route);
  const routedVenue = route.name === "venue" ? command.venueCatalog.find((venue) => venue.slug === route.slug) : null;
  const searchDialog = searchOpen && <DeferredBoundary scope="search-dialog"><SearchDialog label={copy.common.openFinder} onClose={closeSearchDialog} returnFocusRef={searchReturnFocusRef}><h2>{copy.common.openFinder}</h2><CommandFinder copy={copy} command={command} autoFocus onClose={closeSearchDialog} /><button type="button" onClick={closeSearchDialog}>{copy.common.closeFinder}</button></SearchDialog></DeferredBoundary>;
  const footerMarket = route.market || (decisionPassport.market !== "unknown" ? decisionPassport.market : undefined);
  const footer = <CleanFooter locale={locale} market={footerMarket} brazil={route.name === "brazil"} />;
  const regionalDecisionDockOwnsMobileNav = ["regionalPreview", "regionalDecision"].includes(route.name)
    && REGIONAL_DECISION_DOCK_MARKETS.has(route.market);
  const showSharedMobileNav = route.name !== "venue" && route.name !== "compare" && !regionalDecisionDockOwnsMobileNav;
  // Locale changes must remount the complete route subtree. Several legacy
  // sections keep derived copy in child state; reusing those nodes can leave
  // an English body below a translated header after a client-side switch.
  const toolKey = route.name === "venue" && !routedVenue ? null : toolKeyOf(route);
  const pageShell = (content, { deferContent = true, crawlScope = null } = {}) => <React.Fragment key={`locale-${locale}`}><Header initialUrl={initialUrl} pageAlternates={pageAlternates} copy={copy} locale={locale} brazil={route.name === "brazil"} onLocaleChange={changeLocale} onSearch={openSearchDialog} />{deferContent ? <DeferredBoundary scope="page-content">{content}</DeferredBoundary> : <ScopedContent scope="page-content" defer={false}>{content}</ScopedContent>}{toolKey ? <React.Suspense fallback={null}><ToolArticleLinks tool={toolKey} locale={locale} initial={initialToolArticles} /></React.Suspense> : null}{crawlScope ? <CrawlPriorityLinks locale={locale} scope={crawlScope} /> : null}{footer}{searchDialog}</React.Fragment>;

  const adjustSelection = () => document.querySelector("#exchanges")?.scrollIntoView({ behavior: typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  if (route.name === "embedCalculator") {
    const embedUrl = new URL(sourceSearch ? `/embed/calculator${sourceSearch}` : (initialUrl || (typeof window !== "undefined" ? window.location.href : "/embed/calculator")), "https://nexualpha.com");
    const isBrazilWidget = embedUrl.searchParams.get("scenario") !== "fees"
      && embedUrl.searchParams.get("market") === "BR"
      && (!embedUrl.searchParams.has("product") || embedUrl.searchParams.get("product") === "spot");
    return <DeferredBoundary scope="embed-content">{isBrazilWidget ? <BrazilCostEmbed initialUrl={embedUrl.href} locale="pt-BR" /> : <EmbedCalculator locale={locale} market={embedUrl.searchParams.get("market")} product={embedUrl.searchParams.get("product")} />}</DeferredBoundary>;
  }
  if (route.name === "brazil") return pageShell(<BrazilDecisionPage pathname={route.pathname} initialUrl={initialUrl} locale={locale} trackGrowthDecision={trackGrowthDecision} />);
  if (route.name === "regionalPreview") return pageShell(<RegionalMarketPreview market={route.market} locale={locale} decisionPassport={decisionPassport} />);
  if (route.name === "regionalDecision") return pageShell(<RegionalMarketPreview market={route.market} locale={route.locale || locale} decisionPath={route.decisionPath} decisionPassport={decisionPassport} />);
  if (route.name === "legal") return pageShell(<LegalPage locale={locale} pathname={route.pathname} />);
  if (route.name === "methodology") return pageShell(<AuditMethodologyPage locale={locale} />);
  if (route.name === "about") return pageShell(<AboutPage locale={locale} />);
  if (route.name === "editorialPolicy") return pageShell(<EditorialPolicyPage locale={locale} />);
  if (route.name === "partners") return pageShell(<PartnerEmbedGuide locale={locale} pathname={new URL(initialUrl || "/", "https://nexualpha.com").pathname} />);
  if (route.name === "telegram") return pageShell(<main className="v6 v2-page v3-page r1-telegram-page" id="top" dir={getTextDirection(locale)} {...sectionEyebrowAttrs(locale, "telegram")}><TelegramBotHub locale={locale} headingLevel={1} /></main>);
  if (route.name === "appDownload") return pageShell(<AppDownloadPage slug={route.slug} locale={locale} market={route.market || decisionPassport.market} contextSearch={sourceSearch} />);
  if (route.name === "academyHub" || route.name === "academyEpisode") return pageShell(<AcademyRoute route={route} locale={locale} />);
  if (route.name === "bitgetGuide") return pageShell(<BitgetGuidePage locale={locale} />);
  if (route.name === "beginner") return pageShell(<BeginnerRoute route={route} locale={locale} market={new URLSearchParams(sourceSearch).get("market") || route.market} />);
  if (route.name === "deposit") return pageShell(<DepositPage pathname={route.pathname} locale={locale} />);
  if (route.name === "licenses") return pageShell(<LicenseDirectoryPage locale={locale} country={route.country} market={route.market} />);
  if (route.name === "converter") return pageShell(<ConverterPage key={`${route.symbol}-${route.fiat}-${locale}`} locale={locale} symbol={route.symbol} fiat={route.fiat} market={route.market} overlay={initialCoins} fx={initialFx} />);
  if (route.name === "coinsHub" || route.name === "coinPage") return pageShell(<CoinsRoute route={route} locale={locale} overlay={initialCoins} initialNewsArticles={initialNewsArticles} />);
  if (route.name === "glossaryHub" || route.name === "glossaryTerm") return pageShell(<GlossaryRoute route={route} locale={locale} />);
  // Live ticker bar (2026-10-13): home and /flash only; first frame from prerender state "ticker".
  if (route.name === "longShort") return pageShell(<LongShortPage locale={locale} market={route.market} initial={initialRadar} />);
  if (route.name === "whales") return pageShell(<WhalesPage locale={locale} market={route.market} coin={route.coin} initial={initialRadar} />);
  if (route.name === "flashStream") return pageShell(<><TickerBar locale={locale} initial={initialTicker} /><FlashStreamPage locale={locale} market={route.market} initial={initialFlash} /></>);
  if (route.name === "flashItem") return pageShell(<><TickerBar locale={locale} initial={initialTicker} /><FlashItemPage locale={locale} market={route.market} itemKey={route.key} initial={initialFlash} /></>);
  if (route.name === "binanceOctober") return pageShell(<BinanceOctoberPage locale={locale} market={route.market} />);
  if (route.name === "bybitStocks") return pageShell(<BybitStocksPage locale={locale} market={route.market} />);
  if (route.name === "tokenizedStocksHub") return pageShell(<TokenizedStocksHubPage initialNewsArticles={initialNewsArticles} locale={locale} market={route.market} live={initialTsLive} page={initialTsPage} />);
  if (route.name === "tokenizedStocksTicker") return pageShell(<TokenizedStocksTickerPage initialNewsArticles={initialNewsArticles} key={route.ticker} locale={locale} market={route.market} ticker={route.ticker} live={initialTsLive} page={initialTsPage} />);
  if (route.name === "tokenizedStocksExchange") return pageShell(<TokenizedStocksExchangePage key={route.slug} locale={locale} market={route.market} slug={route.slug} live={initialTsLive} page={initialTsPage} />);
  if (route.name === "feeIndex") return pageShell(<FeeIndexPage locale={locale} market={route.market} />);
  if (route.name === "tsTracker") return pageShell(<TokenizedTrackerPage locale={locale} market={route.market} />);
  if (route.name === "whaleReport") return pageShell(<WhaleReportPage locale={locale} market={route.market} initial={initialIntelTool?.kind === "whale-report" ? initialIntelTool.data : undefined} />);
  if (route.name === "press") return pageShell(<PressPage locale={locale} market={route.market} />);
  if (route.name === "etfFlows") return pageShell(<EtfFlowsPage locale={locale} market={route.market} initial={initialIntelTool?.kind === "etf" ? initialIntelTool.data : undefined} />);
  if (route.name === "calendar") return pageShell(<CalendarPage locale={locale} market={route.market} initial={initialIntelTool?.kind === "calendar" ? initialIntelTool.data : undefined} now={initialIntelTool?.kind === "calendar" ? initialIntelTool.now : undefined} />);
  if (route.name === "bitgetAlliance") return pageShell(<BitgetAlliancePage locale={locale} market={route.market} />);
  if (route.name === "autodraftCampaign") return pageShell(<AutodraftCampaignPage id={route.id} locale={locale} market={route.market} />);
  if (route.name === "krakenUsdg") return pageShell(<KrakenUsdgPage locale={locale} market={route.market} />);
  if (route.name === "liquidations") return pageShell(<LiquidationsPage locale={locale} initialFeed={initialMarketEvents} />, { deferContent: false });
  if (route.name === "liquidationHeatmap") return pageShell(<LiquidationHeatmapPage locale={locale} initialFeed={initialMarketEvents} initialLevels={initialLiquidationLevels} />, { deferContent: false });
  if (route.name === "fundingMatrix") return pageShell(<FundingMatrixPage locale={locale} initialFeed={initialFundingMatrix} market={route.market} />, { deferContent: false });
  if (route.name === "fundingRates") return pageShell(<FundingRatesPage locale={locale} initialFeed={initialMarketEvents} />, { deferContent: false });
  if (route.name === "topicCollection") return pageShell(<CollectionHubPage kind="topics" locale={locale} />);
  if (route.name === "factbookCollection") return pageShell(<CollectionHubPage kind="factbook" locale={locale} />);
  if (route.name === "tokenizedAssets") return pageShell(<TokenizedAssetsPage slug={route.slug} locale={locale} />, { crawlScope: "tokenized" });
  if (route.name === "venueAlternatives") return pageShell(<VenueAlternativesPage slug={route.slug} locale={locale} />);
  if (route.name === "brazilDeadline") return pageShell(<BrazilDeadlinePage locale={locale} />);
  if (route.name === "topic") return pageShell(<TopicGuidePage slug={route.slug} locale={locale} market={route.market} product={route.product} venues={command.venueCatalog} />);
  if (route.name === "factbook") return pageShell(<FactbookPage slug={route.slug} locale={locale} market={route.market} product={route.product} />);
  if (route.name === "kolLanding") return pageShell(<KolLandingPage kolHandle={route.kol} locale={locale} market={route.market} product={route.product} />);
  if (route.name === "rateTerminal") return pageShell(<main className="v6 v2-page v3-page r1-rates-page" id="top">
    <section className="v2-section v2-shell rt-hero" aria-label={({ "zh-Hant": "手續費計算", ja: "手数料比較", ko: "수수료 비교", tr: "Ücret karşılaştırması",
        // l10n: needs native review
        ur: "فیس موازنہ",
        // l10n: needs native review
        uk: "Порівняння комісій", ar: "مقارنة الرسوم", "pt-BR": "Comparação de taxas", es: "Comparación de comisiones", fr: "Comparaison des frais", de: "Gebührenvergleich", ru: "Сравнение комиссий", id: "Perbandingan biaya", vi: "Đối chiếu phí", it: "Confronto delle commissioni" }[locale] || (locale.startsWith("zh") ? "手续费计算" : "Fee benchmark"))}>
      <h1>{({
        "zh-Hant": "交易所手續費對比",
        ja: "取引所の手数料を比較", ko: "거래소 수수료 비교", tr: "Borsa ücretleri yan yana",

        // l10n: needs native review
        ur: "پلیٹ فارم کی فیس کا موازنہ",
        // l10n: needs native review
        uk: "Порівняння комісій платформ", ar: "مقارنة رسوم منصات التداول", "pt-BR": "Taxas das corretoras lado a lado", es: "Comisiones de exchanges, lado a lado",
        fr: "Les frais des plateformes, côte à côte", de: "Börsengebühren im Vergleich", ru: "Сравнение комиссий платформ",
        id: "Perbandingan biaya bursa", vi: "So sánh phí các sàn", it: "Commissioni degli exchange a confronto"
      }[locale] || (locale.startsWith("zh") ? "交易所手续费对比" : "Exchange fees, side by side"))}</h1>
      <RatesShortAnswer locale={locale} market={route.market} />
    </section>
    <FeeBenchmarkTerminal locale={locale} market={route.market} product={route.product} accountStage={route.accountStage} funding={route.funding} />
  </main>, { crawlScope: "rates" });
  if (route.name === "onchainBoard") return pageShell(<main className="v6 v2-page v3-page" id="top"><OnChainLiquidityBoard locale={locale} headingLevel={1} /></main>);
  if (route.name === "newsList") return pageShell(<NewsListPage locale={locale} market={route.market} product={route.product} category={route.category} page={route.page} initialArticles={initialNewsArticles} listing={initialNewsListing} />);
  if (route.name === "newsDetail") return pageShell(<NewsDetailPage slug={route.slug} locale={locale} market={route.market} product={route.product} initialArticles={initialNewsArticles} glossaryLinks={readGlossaryLinks(locale)} />);
  if (route.name === "venue" && !routedVenue) return pageShell(<NotFoundPage locale={locale} />);
  if (route.name === "venue" && routedVenue) return pageShell(<VenueDetailPage copy={copy} locale={locale} venue={routedVenue} venues={command.venueCatalog} updates={sharedOfficialEvents} market={route.market || (decisionPassport.market !== "unknown" ? decisionPassport.market : undefined)} product={route.product} accountStage={route.accountStage} funding={route.funding} researchComponent={VenueDetailResearch} prefetchResearch={prefetchVenueResearch} initialNewsArticles={initialNewsArticles} />);
  if (route.name === "compareHub") return pageShell(<CompareHubPage locale={locale} venues={command.venueCatalog} market={route.market} product={route.product} accountStage={route.accountStage} funding={route.funding} />, { crawlScope: "compare" });
  if (route.name === "compare" && selectedFromRoute.length < 2) return pageShell(<NotFoundPage locale={locale} />);
  if (route.name === "compare" && selectedFromRoute.length >= 2) return pageShell(<CompareDeepPage initialNewsArticles={initialNewsArticles} copy={copy} locale={locale} selected={selectedFromRoute} venues={command.venueCatalog} updates={sharedOfficialEvents} market={route.market} product={route.product} accountStage={route.accountStage} funding={route.funding} />, { crawlScope: "compare" });
  if (route.name === "research") return pageShell(<OfficialResearchPage locale={locale} market={route.market} product={route.product} venue={command.venueCatalog.find((venue) => venue.slug === route.slug)} venues={command.venueCatalog} />);
  if (route.name === "activity") return pageShell(<ActivityDetailPage copy={copy} locale={locale} market={route.market} product={route.product} update={(model.officialUpdates ?? []).find((update) => update.id === route.id)} venues={command.venueCatalog} />);
  if (route.name === "activityUpdate") return pageShell(<ActivityUpdatePage venue={route.venue} slug={route.slug} locale={locale} market={route.market} initialFeed={initialOfficialAnnouncements} />);
  if (route.name === "activities") return pageShell(<ActivityCenterPage copy={copy} locale={locale} market={route.market} product={route.product} venues={command.venueCatalog} updates={model.officialUpdates ?? []} campaignFeed={initialOfficialAnnouncements} />);
  if (route.name === "directory") return pageShell(<main className="v6 v2-page v3-page" id="top" dir={getTextDirection(locale)} {...sectionEyebrowAttrs(locale, "exchanges")}><VenueYellowPages venues={command.venueCatalog} locale={locale} market={route.market} product={route.product} accountStage={route.accountStage} funding={route.funding} headingLevel={1} /></main>, { deferContent: false, crawlScope: "directory" });
  if (route.name === "notFound") return pageShell(<NotFoundPage locale={locale} />);

  // 顶级转化漏斗首页：跑马灯 -> LeanHero首屏 -> 横向对比决策 -> 交易暗亏体检仪 -> 核心黄页开户 -> 辅助情报模块 -> 实时社交证明浮窗
  return <main key={`locale-${locale}`} className="v2-page home-refinement v5 v6" id="top" dir={getTextDirection(locale)}>
    <Header initialUrl={initialUrl} pageAlternates={pageAlternates} copy={copy} locale={locale} onLocaleChange={changeLocale} onSearch={openSearchDialog} />
    <TickerBar locale={locale} initial={initialTicker} />
    <HomeV7 homeLatest={initialHomeLatest} locale={locale} market={route.market} whales={initialWhales} fundingFeed={initialFundingFeed} initialOfficialAnnouncements={initialOfficialAnnouncements} initialFlash={initialFlash} initialTicker={initialTicker} />
    <ClosingBand locale={locale} />
    {footer}
    {searchDialog}
  </main>;
}
