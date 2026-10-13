import { readFile } from "node:fs/promises";
import { createFundingMatrixReader } from "./server/funding-matrix.mjs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

const generatedBuildId = `3.0-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}`;
const requestedBuildId = process.env.BUILD_ID?.trim();
if (requestedBuildId && !/^3\.0-[0-9A-Za-z._-]{6,64}$/.test(requestedBuildId)) {
  throw new Error("BUILD_ID must use the 3.0- prefix and contain only letters, numbers, dots, underscores or hyphens");
}
const buildId = requestedBuildId || generatedBuildId;
const ssrLazyChunkWarningModules = [
  "/src/components/finder/CommandFinder.jsx",
  "/src/components/finder/SearchDialog.jsx",
  "/src/components/v3/CampaignRadar.jsx",
  "/src/components/v7/home7-below.jsx",
  "/src/components/v6/closing-index.jsx",
];

// Client builds: `import.meta.env.SSR ? import.meta.glob([...], { eager: true }) : {}` kept every page module statically
// reachable from the browser entry, because Vite expands the eager glob into static imports before the dead SSR branch
// is dropped (every page downloaded ~1.7 MB of route chunks after hydration, perf lane 2026-10-11). The browser
// transform replaces that eager glob with an empty object; the SSR transform (options.ssr) keeps it.
const SSR_EAGER_GLOB_PATTERN = /import\.meta\.env\.SSR\s*\?\s*import\.meta\.glob\((?:\[[^\]]*\]|"[^"]*")\s*,\s*\{\s*eager:\s*true\s*\}\)\s*:\s*\{\}/g;
export function dropSsrEagerGlobForClient(code) {
  if (!code.includes("eager: true")) return null;
  const next = code.replace(SSR_EAGER_GLOB_PATTERN, "import.meta.env.SSR ? {} : {}");
  return next === code ? null : next;
}
export const clientDropsSsrEagerGlobPlugin = () => ({
  name: "nexualpha-client-drops-ssr-eager-glob",
  enforce: "pre",
  transform(code, id, options) {
    if (options?.ssr || !/\.[jt]sx?(?:\?|$)/.test(id)) return null;
    const next = dropSsrEagerGlobForClient(code);
    return next === null ? null : { code: next, map: null };
  },
});

function isExpectedSsrLazyChunkWarning(warning) {
  const message = String(warning?.message || "");
  return message.includes("is dynamically imported by")
    && message.includes("but also statically imported by")
    && message.includes("dynamic import will not move module into another chunk")
    && ssrLazyChunkWarningModules.some((modulePath) => message.includes(modulePath));
}

const CLIENT_ENTRY_SUFFIX = "/src/main.jsx";
const reachabilityCache = new Map();
// True when `id` is reached from the module ending in `rootSuffix` through static imports only (dynamic imports do not
// count). Used to keep always-loaded modules together and to give the lazily imported SEO injector its own closure.
function isStaticallyReachableFrom(id, rootSuffix, getModuleInfo) {
  if (!id.includes("/src/") || id.endsWith(rootSuffix) || /\.css(?:\?|$)/.test(id)) return false;
  const info = getModuleInfo(id);
  if (!info || info.isExternal) return false;
  if (info.importedIds.some((imported) => /\.css(?:\?|$)/.test(imported))) return false;
  const visit = (moduleId, trail) => {
    if (moduleId.endsWith(rootSuffix)) return true;
    const cacheKey = `${rootSuffix}|${moduleId}`;
    if (reachabilityCache.has(cacheKey)) return reachabilityCache.get(cacheKey);
    if (trail.has(moduleId)) return false;
    trail.add(moduleId);
    const importers = getModuleInfo(moduleId)?.importers || [];
    const reachable = importers.some((importer) => visit(importer, trail));
    trail.delete(moduleId);
    if (reachable) reachabilityCache.set(cacheKey, true);
    return reachable;
  };
  return visit(id, new Set());
}
const isStaticallyReachableFromClientEntry = (id, getModuleInfo) => isStaticallyReachableFrom(id, CLIENT_ENTRY_SUFFIX, getModuleInfo);

// Stylesheet link order of index.html. Route chunks are reached through dynamic imports since 2026-10-11, so Vite no
// longer links their CSS in index.html; the worker's per-route stylesheet filter (and SSR pages styled before any JS
// runs) depend on every route stylesheet being linked there in a stable cascade order. nexualpha-link-route-stylesheets
// re-links every emitted stylesheet in this order (the order Vite produced while the chunks were static), then
// nexualpha-ordered-route-stylesheets positions the early/mid/late layers around the entry stylesheet as before.
export const STYLESHEET_LINK_ORDER = Object.freeze([
  // Shared component styles split out of a route stylesheet keep that route's name prefix, so the worker's per-route
  // allow-list applies them on exactly the routes it did before (e.g. the disclosure line stays news-only in SSR and
  // .mx-disclosure keeps winning on the directory).
  "route-news-commission", "route-topic-guide-bridge",
  "route-v3-registration", "route-kol", "route-v3-wizard", "route-v3-calculators", "shared-decision-return", "route-v3-home",
  // growth-conversion.css used to sit inside route-v3-home (linked only on home; the venue and compare pages got it from
  // Vite's chunk preload after hydration). Own CSS-only chunk, linked right after route-v3-home on every route that shows
  // its buttons (venue-graph lane 2026-10-11).
  "route-v3-pages-growth",
  "route-factbook", "shared-decision-rail", "route-embed", "route-rates", "route-v3-social-proof", "route-market",
  "route-methodology", "route-onchain", "route-partners", "route-topic-guide", "route-v3-decision-articles", "route-activity",
  "route-v3-research-panels", "route-v3-readiness", "route-v3-pages-strip", "route-v3-pages",
  // Venue detail styles split out of route-v3-pages (they followed crossroads-compare.css inside that file).
  "route-v3-pages-detail", "route-v3-pages-return-banner", "route-v3-pages-directory", "route-news-shared",
  "route-telegram", "route-tokenized-assets", "route-international", "route-data",
  "page-home-early", "index", "page-home-mid1", "page-compare-mid1", "page-profile-mid1", "core-b", "page-home-mid2",
  "page-directory-mid2", "page-detail-mid2", "core-c", "page-home-late", "page-br-late", "page-rates-late",
  "page-factbook-late", "page-telegram-late",
]);
export const stylesheetChunkName = (fileName) => fileName.split("/").pop().replace(/-[\w-]{8}\.css$/, "");
export function orderStylesheetFiles(fileNames) {
  const firstPage = STYLESHEET_LINK_ORDER.indexOf("page-home-early");
  const rank = (fileName) => {
    const index = STYLESHEET_LINK_ORDER.indexOf(stylesheetChunkName(fileName));
    // A chunk this list does not know yet is a route stylesheet: it joins the route group, before the page layers.
    return index === -1 ? firstPage - 0.5 : index;
  };
  return [...fileNames].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
export function relinkStylesheets(html, cssFileNames) {
  const existing = new Set();
  let stripped = html.replace(/\s*<link\b[^>]*rel="stylesheet"[^>]*href="[^"]*\/(assets\/[\w-]+\.css)"[^>]*>/g, (_tag, file) => { existing.add(file); return ""; });
  const files = orderStylesheetFiles([...new Set([...existing, ...cssFileNames])]);
  const links = files.map((file) => `<link rel="stylesheet" crossorigin href="/${file}">`).join("\n    ");
  if (!/<\/head>/i.test(stripped)) throw new Error("link route stylesheets: </head> not found");
  // Keep the links where Vite put them: right after the entry module script when it exists, else before </head>.
  const anchor = /<script\b[^>]*type="module"[^>]*><\/script>(?:\s*<link\b[^>]*rel="modulepreload"[^>]*>)*/i;
  if (anchor.test(stripped)) return stripped.replace(anchor, (match) => `${match}\n    ${links}`);
  return stripped.replace(/<\/head>/i, `    ${links}\n  </head>`);
}

export default defineConfig(({ isSsrBuild = false }) => ({
  define: { __NEXUALPHA_BUILD_ID__: JSON.stringify(buildId) },
  build: {
    outDir: "dist/client",
    rollupOptions: {
      onwarn(warning, warn) {
        if (isExpectedSsrLazyChunkWarning(warning)) return;
        warn(warning);
      },
      output: {
        // Keep the large route/editorial surface cacheable independently from
        // the app shell. This reduces repeat navigation cost without changing
        // SSR output or hiding indexable content behind a client-only loader.
        manualChunks(id, { getModuleInfo }) {
          // Vite's dynamic-import preload helper is an unassigned virtual module: Rollup folds it into the first manual
          // chunk that dynamically imports something (route-v3-venue once the venue page lazy-loaded its research hub),
          // and the browser entry then imports that route chunk statically on every page. Keep it with the shell.
          if (!isSsrBuild && id.endsWith("vite/preload-helper.js")) return "core-ui";
          // This navigation is shared by several lazy routes. Otherwise Rollup
          // assigns its CSS to Factbook and route-specific HTML drops the style.
          if (id.endsWith("/src/components/v3/decision-path-rail.css")) return "shared-decision-rail";
          // The entry stylesheet is split into ordered chunks (re-linked in cascade order by
          // nexualpha-ordered-route-stylesheets below); the worker allow-lists each "page-*-" prefix per route.
          // Shared cascade layers after the entry stylesheet (always linked; "core-" prefix).
          if (id.endsWith("/src/styles/split/core-b.css")) return "core-b";
          if (id.endsWith("/src/styles/v6/index.css")) return "core-c";
          // Route-only layers of the mid cascade (slot 1: before core-b, slot 2: between core-b and core-c).
          if (id.endsWith("/src/styles/split/home-mid1.css")) return "page-home-mid1";
          if (id.endsWith("/src/styles/split/compare-mid1.css")) return "page-compare-mid1";
          if (id.endsWith("/src/styles/split/profile-mid1.css")) return "page-profile-mid1";
          if (id.endsWith("/src/styles/split/home-mid2.css")) return "page-home-mid2";
          if (id.endsWith("/src/styles/split/directory-mid2.css")) return "page-directory-mid2";
          if (id.endsWith("/src/styles/split/detail-mid2.css")) return "page-detail-mid2";
          if (id.endsWith("/src/styles/v6/home.css")) return "page-home-late";
          if (id.endsWith("/src/components/v3/matcher.css") || id.endsWith("/src/components/v3/campaign-radar.css")) return "page-home-early";
          if (id.endsWith("/src/styles/v6/pages-br.css")) return "page-br-late";
          if (id.endsWith("/src/styles/v6/pages-rates.css")) return "page-rates-late";
          if (id.endsWith("/src/styles/v6/pages-factbook.css")) return "page-factbook-late";
          if (id.endsWith("/src/styles/v6/pages-telegram.css")) return "page-telegram-late";
          if (id.endsWith("/src/components/v3/decision-return-link.css")) return "shared-decision-return";
          if (id.includes("/node_modules/react/") || id.includes("/node_modules/react-dom/")) return "vendor-react";
          if (id.includes("/node_modules/@inlang/") || id.includes("/node_modules/@paraglide/")) return "vendor-i18n";
          // Rollup folds the unassigned static dependencies of a manual chunk into that chunk. Before 2026-10-11 that
          // dragged data every page needs (locale routing, CTA copy, exchange facts...) into route chunks, so the
          // browser entry pulled route-international, route-activity, data-telegram and more on every page. Data,
          // content and helper modules that the browser entry reaches through static imports now share one chunk that
          // is always loaded first; components keep their place so their stylesheets keep their link position.
          if (!isSsrBuild && /\/src\/(?:data|content|lib|hooks|utils|paraglide)\//.test(id) && isStaticallyReachableFromClientEntry(id, getModuleInfo)) return "core-shared";
          // Home copy is read by the first screen and by the registration card: keep it with the always-loaded data.
          if (!isSsrBuild && id.includes("/src/components/v7/home7-copy")) return "core-shared";
          // Home first screen: the alerts strip (and the alerts copy it shares with article footers) must not drag the V3
          // page or news chunks in. Its stylesheet keeps the "route-v3-pages-" prefix it had inside the V3 page chunk, so
          // the worker links it on the same routes as before.
          if (!isSsrBuild && (id.includes("/src/components/v3/TelegramAlertsStrip") || id.endsWith("/src/components/v3/telegram-signal-strip.css")
            || id.includes("/src/components/v3/news/NewsTelegramAlerts"))) return "route-v3-pages-strip";
          // Modules shared by two route chunks used to be absorbed into one of them and formed circular chunks
          // (route-topic-guide <-> route-international, route-v3-pages -> route-v3-calculators -> route-news-shared ->
          // route-v3-pages). Loaded statically from the entry that happened to work; loaded on demand it threw
          // "Cannot access ... before initialization". Shared pieces get their own chunk, named with the prefix of the
          // stylesheet they came from so the worker links their CSS on the same routes as before.
          if (!isSsrBuild) {
            if (id.includes("/src/components/v3/NextDecisionBridge") || id.endsWith("/src/components/v3/next-decision-bridge.css")) return "route-topic-guide-bridge";
            if (id.includes("/src/components/v3/OnsiteTelegramBotHandoff")) return "shared-onsite-telegram-handoff";
            if (id.includes("/src/data/referral-seo.js") || id.includes("/src/data/referral-partners.generated.js") || id.includes("/src/data/tr-percent.js")) return "data-referral-seo";
            // Home budget (2026-10-12): the router reads news-listing-path.js / brazil-page-paths.js, so the news library
            // and the Brazil content left the entry closure. Own chunks keep Rollup from folding them into the first route
            // chunk that visits them (route-news-detail / route-international), which other routes would then import.
            if (/\/src\/data\/(?:news-library|news-feed-client|news-read-time)\.js$/.test(id)) return "data-news-library";
            if (id.endsWith("/src/data/brazil-market.js")) return "data-brazil-market";
            if (id.includes("/src/data/aeo-question-registry.js") || id.includes("/src/data/topic-reviewed-faqs.js") || id.includes("/src/data/international-source-registry.js")) return "data-aeo-questions";
          }
          // CSS-free components shared by the shell and route modules (otherwise a route chunk absorbs them).
          if (!isSsrBuild && (id.includes("/src/components/brand/BrandMark") || id.includes("/src/components/brand/NexuAlphaWordmark")
            || id.includes("/src/components/v3/CleanFooter") || id.includes("/src/components/v7/home7-shared")
            || id.includes("/src/components/shared/DeferUntilVisible") || id.includes("/src/components/shared/DataRule") || id.includes("/src/components/shared/SourceLink"))) return "core-ui";
          // "Get alerts on Telegram" line (2026-10-13): CSS-free, shared by route-flash, route-coins and route-data; pinned so
          // none of them absorbs it and drags the others in.
          if (id.includes("/src/components/shared/TelegramTriggerCta")) return "shared-telegram-cta";
          // Data-page paths/nav are read by route-data, route-coins and the news chunks: pinned (SSR TDZ, 2026-10-13).
          if (id.endsWith("/src/data/market-data-pages-nav.js")) return "data-market-nav";
          // Keep infrequently visited editorial and regional surfaces out of
          // the first route payload. They remain statically imported for SSR,
          // but can be cached and fetched as separate browser chunks.
          // The partner geo policy is read by locale-routing.js (Türkiye link gate, 2026-10-13) and so by every route: pinned
          // in its own small chunk so no route chunk absorbs it and becomes a dependency of every other (SSR TDZ cycle).
          if (/\/src\/data\/partner-geo-policy(?:\.generated)?\.js$/.test(id)) return isSsrBuild ? "data-partner-geo" : undefined;
          if (id.includes("FundingMatrixPage") || id.includes("funding-matrix")) return "route-funding-matrix";
          if (id.includes("/src/components/data/")) return "route-data";
          if (id.includes("/src/components/v3/MethodologyPage")) return "route-methodology";
          // Academy hub and lesson pages (2026-10-12); each locale's lessons stay a separate lazy chunk.
          if (id.includes("/src/components/apps/") || id.includes("/src/data/app-download-copy.js")) return "route-apps";
          if (id.includes("/src/components/academy/") || id.includes("/src/data/academy-copy.js")) return "route-academy";
          // Where to buy <coin> (2026-10-12): pages, model, copy and the coin table; each locale's descriptions stay lazy.
          if (id.includes("/src/components/converter/") || /\/src\/data\/converter(?:-copy)?\.js/.test(id)) return "route-converter";
          if (id.includes("/src/components/coins/") || /\/src\/data\/(?:coins\.js|coins-copy\.js|coins-data\.generated\.js)/.test(id)) return "route-coins";
          // Spot ETF flows + crypto calendar (2026-10-13): pages, styles, copy and readers in one route chunk.
          if (id.includes("/src/components/intel-tools/") || /\/src\/data\/(?:intel-tools-copy|intel-tools-labels|etf-flows|crypto-calendar)\.js/.test(id)) return "route-intel-tools";
          // Crypto glossary (2026-10-13): pages, model, UI copy and the term index. Generated content modules
          // (glossary-index/shard/links-<locale>.js) stay lazy chunks of their own via glossary-content-loader.js.
          if (id.includes("/src/components/glossary/") || /\/src\/data\/glossary(?:-copy|-terms)?\.js$/.test(id)) return "route-glossary";
          // The promotions resolver (SponsoredSlot) is read by the news article and glossary chunks: pinned with the
          // partner status it evaluates at load, so neither route chunk imports the other (SSR build: TDZ cycle).
          if (/\/src\/data\/(?:promotions|promotions\.generated|promotion-copy|partner-benefit-status)\.js$/.test(id)) return "data-promotions";
          // Its auto-linker is read by the news article and academy lesson chunks: pinned so neither pulls the other.
          if (id.includes("/src/data/glossary-autolink.js")) return "shared-glossary-link";
          // Flash stream + item pages (2026-10-12). The home rail (FlashRail.jsx) stays with the home page.
          if (id.includes("/src/components/flash/FlashPages") || id.includes("/src/components/flash/flash.css") || id.includes("/src/data/flash.js")) return "route-flash";
          // Bybit Stocks campaign page (2026-10-12): component, styles and its 14-locale copy in its own route chunk
          // (before the shared campaigns rule, so the Binance page does not load this copy).
          if (/\/src\/components\/campaigns\/(?:BybitStocksPage\.jsx|bybit-stocks\.css)$/.test(id) || id.includes("/src/data/bybit-stocks-copy.js")) return "route-campaign-bybit";
          // Its route/teaser helper is read by the home stream, /activities and /exchanges/bybit: pinned so none of them
          // pulls another route's chunk.
          if (/\/src\/data\/bybit-stocks(?:-path)?\.js$/.test(id)) return "shared-campaign-feature";
          // Bitget Alliance campaign page (2026-10-13): component, styles and its copy in its own route chunk; its
          // route/teaser helper joins the shared campaign feature chunk (home stream, /activities, /exchanges/bitget, /flash).
          if (/\/src\/components\/campaigns\/(?:BitgetAlliancePage\.jsx|bitget-alliance\.css)$/.test(id) || id.includes("/src/data/bitget-alliance-copy.js")) return "route-campaign-bitget";
          if (/\/src\/data\/bitget-alliance(?:-path)?\.js$/.test(id)) return "shared-campaign-feature";
          // Campaign landing pages (2026-10-12: Binance October): component, styles and copy in one route chunk.
          if (id.includes("/src/components/campaigns/") || /\/src\/data\/binance-october-(?:tournament-)?copy\.js$/.test(id)) return "route-campaign-landing";
          // The campaign route/teaser helper is read by the home stream, /activities and /exchanges/binance: pinned so none
          // of them pulls another route's chunk.
          if (/\/src\/data\/binance-october(?:-path)?\.js$/.test(id)) return "shared-campaign-feature";
          if (id.includes("/src/components/v3/brand-pages/")) return "route-brand-pages";
          if (id.includes("/src/components/v3/TokenizedAssetsPage")) return "route-tokenized-assets";
          // /topics/<exchange>-alternatives shares the small topic-cluster chunk (and its route stylesheet prefix in the Worker).
          if (id.includes("/src/components/v3/VenueAlternativesPage")) return "route-tokenized-assets";
          // /topics/<brazil deadline> (pt-BR + en) uses the same small topic chunk and route stylesheet prefix.
          if (id.includes("/src/components/v3/BrazilDeadlinePage")) return "route-tokenized-assets";
          if (id.includes("/src/components/v3/TopicGuidePage")) return "route-topic-guide";
          if (id.includes("/src/components/v3/FactbookPage")) return "route-factbook";
          if (id.includes("/src/components/v3/international/")) return "route-international";
          // campaignCopy labels the venue page's activity panel too; alone in its chunk it no longer drags route-activity
          // (official-campaign-localizations, 750 KB) onto venue pages (venue-graph lane 2026-10-11).
          if (id.includes("/src/components/v3/activity/campaign-copy")) return "data-campaign-copy";
          if (id.includes("/src/components/v3/activity/")) return "route-activity";
          if (id.includes("/src/components/v3/news/NewsListPage")) return "route-news-list";
          if (id.includes("/src/components/v3/news/NewsDetailPage")) return "route-news-detail";
          if (id.includes("/src/components/v3/news/")) return "route-news-shared";
          if (id.includes("/src/components/v3/CollectionHubPage")) return "route-collection-hubs";
          if (id.includes("/src/components/v3/KolLandingPage")) return "route-kol";
          if (id.includes("/src/components/v3/TelegramBotHub")) return "route-telegram";
          // src/data/seo-injection.js is a Node/SSR-only module since the seo-payload lane (2026-10-11): the browser gets
          // route heads from /api/route-seo. Keep it out of every client chunk; the SSR build may still bundle it.
          if (!isSsrBuild && id.includes("/src/data/seo-injection.js")) throw new Error("seo-injection.js reached the client bundle: " + id);
          // Scroll-loaded home sections (DeferUntilVisible): own chunks, so a route module that shares a helper with them
          // cannot absorb them into its chunk.
          if (!isSsrBuild && /\/src\/components\/v7\/home7-(?:below|funding|telegram)\.jsx$/.test(id)) return "home-below-fold";
          if (!isSsrBuild && id.includes("/src/components/v6/closing-index")) return "home-closing-index";
          if (id.includes("/src/components/v3/FeeBenchmarkTerminal")) return "route-rates";
          if (id.includes("/src/components/v3/MarketFearGreedPanel")) return "route-market";
          if (id.includes("/src/components/v3/OnChainLiquidityBoard")) return "route-onchain";
          if (id.includes("/src/components/v3/EmbedCalculator")) return "route-embed";
          if (id.includes("/src/components/v3/PartnerEmbedGuide")) return "route-partners";
          if (id.includes("/src/components/v3/TraderWizardModal")) return "route-v3-wizard";
          if (id.includes("/src/components/v3/TradingBleedAnalyzer")) return "route-v3-calculators";
          if (id.includes("/src/components/v3/FeeRebateCalculator")) return "route-v3-calculators";
          if (id.includes("/src/components/v3/RegistrationCard")) return "route-v3-registration";
          if (id.includes("/src/components/v3/VenueFaqSection")) return "route-v3-venue-faq";
          if (id.includes("/src/components/v3/CompareFinalChoiceCard")) return "route-v3-compare-final-choice";
          if (id.includes("/src/components/v3/ResearchPanels")) return "route-v3-research-panels";
          if (id.includes("/src/components/v3/VenueDecisionArticles")) return "route-v3-decision-articles";
          if (id.includes("/src/components/v3/VenueReadinessChecklist")) return "route-v3-readiness";
          // Shared by the home closing band and the regional rails: keep the copy out of the deferred hero chunk.
          if (id.includes("/src/components/v3/LeanHeroCopy")) return "shared-hero-copy";
          if (id.includes("/src/components/v3/LeanHero")) return "route-v3-home";
          if (id.includes("/src/components/v3/TopIntelligenceHub")) return "route-v3-home";
          if (id.includes("/src/components/v3/AntiPhishingVerifier")) return "route-v3-security";
          if (id.includes("/src/components/v3/LiveConversionProof")) return "route-v3-social-proof";
          if (id.includes("/src/components/v3/RebateTickerBar")) return "route-v3-social-proof";
          if (id.includes("/src/data/topic-guides-data.js")) return "data-topic-guides";
          if (id.includes("/src/data/factbook-registry.js")) return "data-factbook";
          if (id.includes("/src/data/venue-database.js")) return "data-venue";
          if (id.includes("/src/data/exchange-research.js")) return "data-research";
          if (id.includes("/src/data/official-campaign-research.js")) return "data-official-research";
          if (id.includes("/src/data/venue-decision-content.js")) return "data-decision-content";
          if (id.includes("/src/data/priority-venue-answers.js")) return "data-priority-venue-answers";
          // Venue-graph lane (2026-10-11): /exchanges/<slug> gets its own route module. Rollup folds the unassigned static
          // dependencies of a manual chunk into whichever manual chunk visits them first, so small helpers the venue page
          // shares with other routes used to sit inside route-topic-guide (public-copy-sanitizer), route-factbook
          // (ExchangeFactsV5, exchange-matrix-copy), route-collection-hubs (fallback-lang), route-v3-calculators
          // (reviewed-fee-copy, venue-fee-summary, venue-name-helper), route-v3-home (reviewed-base-fees) and route-activity
          // (campaign-copy) and dragged those graphs onto every venue page; after the audit merge plural-copy sat inside
          // route-rates and pulled the rates, factbook and calculator graphs back in. Pin them to small shared chunks.
          if (/\/src\/(?:data\/reviewed-fee-copy|data\/venue-fee-summary|data\/reviewed-base-fees|data\/public-copy-sanitizer|data\/contextual-href|data\/plural-copy|utils\/fallback-lang|utils\/venue-name-helper|components\/v3\/exchange-matrix-copy)\.js$/.test(id)) return "shared-venue-copy";
          // Brazil BCB deadline notice: shared by the directory, venue and Brazil topic chunks (no stylesheet of its own).
          if (/\/src\/(?:data\/brazil-vasp-status\.js|data\/venue-kyc-corrections\.js|components\/v3\/BrazilDeadlineNotice\.jsx)$/.test(id)) return "shared-venue-copy";
          if (id.includes("/src/components/v3/ExchangeFactsV5") || id.includes("/src/components/v6/InnerLedger") || id.includes("/src/components/v6/inner-r9-copy") || id.includes("/src/lib/v5/")) return "shared-exchange-facts";
          // CSS-only chunks keep the "route-v3-pages-" prefix the Worker allow-lists on the venue, compare and home routes.
          if (id.endsWith("/src/components/v3/profile-density.css") || id.endsWith("/src/components/v3/HyperliquidFeeScenario.css")) return "route-v3-pages-detail";
          if (id.endsWith("/src/components/v3/growth-conversion.css")) return "route-v3-pages-growth";
          if (id.includes("/src/components/v3/TelegramReturnBanner") || id.endsWith("/src/components/v3/telegram-return-banner.css")) return "route-v3-pages-return-banner";
          if (id.includes("/src/components/v3/v3-pages-shared")) return "route-v3-pages-shared";
          if (id.includes("/src/components/v3/VenueDetailResearch")) return "route-v3-venue-research";
          if (id.includes("/src/components/v3/VenueDetailPage") || id.includes("/src/components/v3/venue-detail-shared")) return "route-v3-venue";
          // Compare-any (PR #60): keep the pair policy/templates, the picker and the route helper out of route-v3-pages,
          // otherwise the directory's picker import drags every V3 route chunk in (QA 2026-10-11: /exchanges 456 → 1003 KB).
          if (id.includes("/src/data/compare-generated.js") || id.includes("/src/data/compare-pairs/") || id.includes("/src/data/compare-pair-answers.js")) return "data-compare-generated";
          if (id.includes("/src/components/compare/CompareAnyPicker") || id.includes("/src/components/compare/compare-any-picker.css")) return "shared-compare-picker";
          if (id.includes("/src/components/v6/compare-routes.js") || id.includes("/src/data/compare-slug.js")) return "shared-compare-routes";
          if ((id.includes("/src/data/compare-direct-answers.js") || id.includes("/src/data/compare-direct-answer-drafts.js"))) return "data-compare-direct-answers";
          if (id.includes("/src/data/compare-faq-locales.js")) return "data-compare-faq-locales";
          if (id.includes("/src/data/telegram-config.js")) return "data-telegram";
          if (id.includes("/src/data/directory-context.js")) return "data-directory-context";
          if (id.includes("/src/data/partner-registry.js")) return "data-partner-registry";
          if (id.includes("/src/data/v3-product.js")) return "data-v3-product";
          if (id.includes("/src/content/v3-interface-copy.js")) return "data-v3-interface-copy";
          if (id.includes("/src/components/v3/venue-yellow-pages-copy.js")) return "route-v3-pages-copy";
          if (id.includes("/src/components/v3/venue-yellow-pages-state.js")) return "route-v3-pages-state";
          // The directory stylesheet used to live inside the V3 page chunk, which made the directory statically import
          // the whole route-v3-pages graph (QA 2026-10-11: /exchanges loaded 1 MB after idle). Own CSS-only chunk;
          // the "route-v3-pages-" prefix keeps the Worker's per-route stylesheet allow-list unchanged.
          if (id.endsWith("/src/components/v3/venue-yellow-pages.css")) return "route-v3-pages-directory";
          if (id.includes("/src/components/v3/VenueYellowPages")) return "route-v3-directory";
          if (id.includes("/src/components/v3/V3Pages")) return "route-v3-pages";
          return undefined;
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    fs: {
      // The frontend consumes the generated Shared Core client directly from the sibling backend package.
      allow: [".."],
    },
    proxy: {
      "/api/v1": {
        target: process.env.CORE_API_ORIGIN ?? "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [
    { name: "nexualpha-build-identity", generateBundle() {
      this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ version: "3.0.0", buildId }) });
    } },
    {
      name: "nexualpha-link-route-stylesheets",
      transformIndexHtml: {
        order: "post",
        handler(html, ctx) {
          const bundle = ctx?.bundle;
          if (!bundle) return html;
          const css = Object.values(bundle).filter((item) => item.type === "asset" && /^assets\/[\w-]+\.css$/.test(item.fileName)).map((item) => item.fileName);
          return relinkStylesheets(html, css);
        },
      },
    },
    {
      // The old single entry stylesheet is now a sequence of chunks. Vite links every imported chunk's CSS in module
      // order (before, or for some chunks after, the entry link), so re-link them in cascade order around the entry:
      //   *-early-*  index-*  *-mid1-*  core-b-*  *-mid2-*  core-c-*  *-late-*
      // Every rule keeps its original position; the worker drops the page-* chunks a route does not use.
      name: "nexualpha-ordered-route-stylesheets",
      transformIndexHtml: {
        order: "post",
        handler(html) {
          const pick = (pattern) => {
            const tags = [];
            html = html.replace(new RegExp(`\\s*<link\\b[^>]*rel="stylesheet"[^>]*href="[^"]*/assets/${pattern}-[\\w-]+\\.css"[^>]*>`, "g"), (tag) => { tags.push(tag.trim()); return ""; });
            return tags;
          };
          const slots = ["[\\w-]+-early", "[\\w-]+-mid1", "core-b", "[\\w-]+-mid2", "core-c", "[\\w-]+-late"].map(pick);
          if (!slots.some((tags) => tags.length)) return html;
          const entry = /<link\b[^>]*rel="stylesheet"[^>]*href="[^"]*\/assets\/index-[\w-]+\.css"[^>]*>/;
          if (!entry.test(html)) throw new Error("ordered route stylesheets: entry stylesheet link not found");
          const [early, ...after] = slots;
          return html.replace(entry, (tag) => [...early, tag, ...after.flat()].join("\n    "));
        },
      },
    },
    {
      // Dev only: /liquidations and /funding-rates read /intel/market-events.json, which nginx serves in production
      // from the market collector. Serve a local copy (MARKET_EVENTS_FILE) or proxy the public feed.
      name: "nexualpha-dev-market-events",
      apply: "serve",
      configureServer(server) {
        const matrix = createFundingMatrixReader();
        server.middlewares.use("/intel/funding-matrix.json", async (req, res) => {
          const response = await matrix.respond(req.method);
          res.statusCode = response.status;
          for (const [key, value] of response.headers) res.setHeader(key, value);
          res.end(await response.text());
        });
        server.middlewares.use("/intel/market-events.json", async (req, res) => {
          try {
            const body = process.env.MARKET_EVENTS_FILE
              ? await readFile(process.env.MARKET_EVENTS_FILE, "utf8")
              : await (await fetch("https://nexualpha.com/intel/market-events.json", { signal: AbortSignal.timeout(8000) })).text();
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.setHeader("cache-control", "no-store");
            res.end(body);
          } catch {
            res.statusCode = 503;
            res.end("{}");
          }
        });
      },
    },
    clientDropsSsrEagerGlobPlugin(),
    react(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      emitTsDeclarations: true,
    }),
  ],
}));
