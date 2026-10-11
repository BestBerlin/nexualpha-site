const routeModuleEntries = new Map();

export const ROUTE_MODULE_PATHS = Object.freeze({
  finder: "./components/finder/CommandFinder.jsx",
  searchDialog: "./components/finder/SearchDialog.jsx",
  v3Pages: "./components/v3/V3Pages.jsx",
  // venue-graph perf lane 2026-10-11: the venue detail route left V3Pages.jsx so /exchanges/<slug> stops loading the
  // compare, activity and topic-guide graphs (39 chunks, 1.3 MB) after hydration.
  venueDetail: "./components/v3/VenueDetailPage.jsx",
  // Its collapsed "Sources" hub: not preloaded for the route; App.jsx loads it when the disclosure opens.
  venueResearch: "./components/v3/VenueDetailResearch.jsx",
  officialResearch: "./components/v3/activity/OfficialResearch.jsx",
  newsDetail: "./components/v3/news/NewsDetailPage.jsx",
  leanHero: "./components/v3/LeanHero.jsx",
  rebateTicker: "./components/v3/RebateTickerBar.jsx",
  campaignRadar: "./components/v3/CampaignRadar.jsx",
  feeBenchmark: "./components/v3/FeeBenchmarkTerminal.jsx",
  onchain: "./components/v3/OnChainLiquidityBoard.jsx",
  marketFearGreed: "./components/v3/MarketFearGreedPanel.jsx",
  kolLanding: "./components/v3/KolLandingPage.jsx",
  tradingBleed: "./components/v3/TradingBleedAnalyzer.jsx",
  telegram: "./components/v3/TelegramBotHub.jsx",
  liveProof: "./components/v3/LiveConversionProof.jsx",
  methodology: "./components/v3/MethodologyPage.jsx",
  about: "./components/v3/brand-pages/AboutPage.jsx",
  editorialPolicy: "./components/v3/brand-pages/EditorialPolicyPage.jsx",
  embedCalculator: "./components/v3/EmbedCalculator.jsx",
  partnerEmbedGuide: "./components/v3/PartnerEmbedGuide.jsx",
  topicGuide: "./components/v3/TopicGuidePage.jsx",
  factbook: "./components/v3/FactbookPage.jsx",
  collectionHub: "./components/v3/CollectionHubPage.jsx",
  tokenizedAssets: "./components/v3/TokenizedAssetsPage.jsx",
  brazilDecision: "./components/v3/international/BrazilDecisionPage.jsx",
  brazilCostEmbed: "./components/v3/international/BrazilCostEmbed.jsx",
  regionalPreview: "./components/v3/international/RegionalMarketPreview.jsx",
  // Perf lane 2026-10-11: these used to be static imports of App.jsx and shipped with every page.
  directory: "./components/v3/VenueYellowPages.jsx",
  crossroadsCompare: "./components/v3/CrossroadsCompare.jsx",
  platformMatcher: "./components/v3/PlatformMatcher.jsx",
  newsList: "./components/v3/news/NewsListPage.jsx",
  liquidations: "./components/data/LiquidationsPage.jsx",
  fundingRates: "./components/data/FundingRatesPage.jsx",
});

export const DEFERRED_ROUTE_MODULE_PATHS = Object.freeze(Object.values(ROUTE_MODULE_PATHS));

export function registerRouteModuleLoaders(loaders = {}) {
  for (const [path, loader] of Object.entries(loaders)) {
    if (typeof loader !== "function") continue;
    const current = routeModuleEntries.get(path);
    if (current) {
      current.loader = loader;
      continue;
    }
    routeModuleEntries.set(path, { status: "idle", loader, promise: null, module: null, error: null });
  }
}

function entryFor(path) {
  const entry = routeModuleEntries.get(path);
  if (!entry?.loader) throw new Error(`Missing deferred component loader for ${path}`);
  return entry;
}

export function preloadRouteModule(path, options = {}) {
  const entry = entryFor(path);
  if (entry.status === "fulfilled") return Promise.resolve(entry.module);
  if (entry.status === "pending") return entry.promise;
  if (entry.status === "rejected" && !options.retry) return Promise.reject(entry.error);
  entry.status = "pending";
  entry.error = null;
  entry.promise = Promise.resolve()
    .then(entry.loader)
    .then((module) => {
      entry.status = "fulfilled";
      entry.module = module;
      return module;
    })
    .catch((error) => {
      entry.status = "rejected";
      entry.error = error;
      throw error;
    });
  return entry.promise;
}

export function readRouteModuleExport(path, exportName) {
  const entry = entryFor(path);
  if (entry.status === "fulfilled") {
    const component = entry.module?.[exportName];
    if (!component) throw new Error(`Missing component export ${exportName} from ${path}`);
    return component;
  }
  if (entry.status === "rejected") throw entry.error;
  throw preloadRouteModule(path);
}

export function routeModuleStatus(path) {
  return routeModuleEntries.get(path)?.status || "unregistered";
}

export function clearRouteModuleCache() {
  routeModuleEntries.clear();
}

export function modulePathsForRoute(route, sourceUrl = "") {
  const name = route?.name || "home";
  // Home (v7) hydrates with no deferred module: the research drawer (CampaignRadar, FeeBenchmarkTerminal,
  // OnChainLiquidityBoard, TelegramBotHub, MarketFearGreedPanel) and the closing index load when they scroll near
  // (DeferUntilVisible), so the first screen is interactive without the old ten-module preload (perf lane 2026-10-11).
  if (name === "home") return [];
  if (name === "directory") return [ROUTE_MODULE_PATHS.directory];
  if (name === "newsList") return [ROUTE_MODULE_PATHS.newsList];
  if (name === "liquidations") return [ROUTE_MODULE_PATHS.liquidations];
  if (name === "fundingRates") return [ROUTE_MODULE_PATHS.fundingRates];
  if (name === "venue") return [ROUTE_MODULE_PATHS.venueDetail];
  if (["activity", "activities", "compare", "compareHub", "notFound"].includes(name)) return [ROUTE_MODULE_PATHS.v3Pages];
  if (name === "research") return [ROUTE_MODULE_PATHS.officialResearch];
  if (name === "newsDetail") return [ROUTE_MODULE_PATHS.newsDetail];
  if (name === "rateTerminal") return [ROUTE_MODULE_PATHS.feeBenchmark];
  if (name === "onchainBoard") return [ROUTE_MODULE_PATHS.onchain];
  if (name === "kolLanding") return [ROUTE_MODULE_PATHS.kolLanding];
  if (name === "telegram") return [ROUTE_MODULE_PATHS.telegram];
  if (name === "methodology") return [ROUTE_MODULE_PATHS.methodology];
  if (name === "about") return [ROUTE_MODULE_PATHS.about];
  if (name === "editorialPolicy") return [ROUTE_MODULE_PATHS.editorialPolicy];
  if (name === "partners") return [ROUTE_MODULE_PATHS.partnerEmbedGuide];
  if (name === "topic") return [ROUTE_MODULE_PATHS.topicGuide];
  if (["topicCollection", "factbookCollection"].includes(name)) return [ROUTE_MODULE_PATHS.collectionHub];
  if (name === "factbook") return [ROUTE_MODULE_PATHS.factbook];
  if (name === "tokenizedAssets") return [ROUTE_MODULE_PATHS.tokenizedAssets];
  if (name === "brazil") return [ROUTE_MODULE_PATHS.brazilDecision];
  if (["regionalPreview", "regionalDecision"].includes(name)) return [ROUTE_MODULE_PATHS.regionalPreview];
  if (name === "embedCalculator") {
    const params = new URL(sourceUrl || "https://nexualpha.com/embed/calculator").searchParams;
    const isBrazilWidget = params.get("scenario") !== "fees" && params.get("market") === "BR" && (!params.has("product") || params.get("product") === "spot");
    return [isBrazilWidget ? ROUTE_MODULE_PATHS.brazilCostEmbed : ROUTE_MODULE_PATHS.embedCalculator];
  }
  return [];
}

export async function preloadRouteModules(paths, options = {}) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  await Promise.all(uniquePaths.map((path) => preloadRouteModule(path, options)));
}

export function createHydrationRoutePreparer({ preloadForUrl }) {
  let failedUrls = [];
  const prepareUrls = async (urls, options = {}) => {
    const uniqueUrls = [...new Set(urls.filter(Boolean))];
    failedUrls = [];
    for (const url of uniqueUrls) {
      try {
        await preloadForUrl(url, options);
      } catch (error) {
        failedUrls.push(url);
        throw error;
      }
    }
  };
  return {
    prepare: prepareUrls,
    retry: (options = {}) => prepareUrls(failedUrls, { ...options, retry: true }),
    failedUrls: () => [...failedUrls],
  };
}


export function createHydrationOnceController({ prepare, hydrate, onFailure = () => {}, onSuccess = () => {} }) {
  let state = "idle";
  let flight = null;
  let result = null;
  let lastError = null;

  const start = (options = {}) => {
    if (state === "hydrated") return Promise.resolve(result);
    if (state === "preparing") return flight;
    state = "preparing";
    flight = Promise.resolve()
      .then(() => prepare(options))
      .then(() => {
        result = hydrate();
        state = "hydrated";
        flight = null;
        lastError = null;
        onSuccess(result);
        return result;
      })
      .catch((error) => {
        state = "failed";
        flight = null;
        lastError = error;
        onFailure(error);
        throw error;
      });
    return flight;
  };

  return {
    start,
    retry: () => start({ retry: true }),
    state: () => state,
    lastError: () => lastError,
  };
}
