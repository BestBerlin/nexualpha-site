#!/usr/bin/env node
import { clickStorage } from './server/click-storage.mjs';
import cluster from 'node:cluster';
import { createHash } from 'node:crypto';
import { isClusterWorker, primaryCall } from './server/cluster-rpc.mjs';
import { createPrimaryServices, createWebCtaCollector } from './server/cluster-services.mjs';
import { listenWebWorker, superviseWebWorkers, webWorkerCount } from './server/web-cluster.mjs';
// Production entrypoint. Code/assets may be mounted read-only. Enable local
// analytics with CTA_ENVIRONMENT, CTA_ALLOWED_ORIGIN and an external absolute
// CTA_DATA_FILE. CTA_SMOKE_DATA_FILE is optional and must be a different file.
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, appendFile, realpath, chmod, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createCspReporter, reportOnlyPolicy, workerInlineScriptHashes } from './server/csp-report.mjs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createErrorMonitor, safeRequestId } from './server/error-monitor.mjs';
import { resolveAssetPath, sameSiteRequestTarget, trailingSlashRedirectTarget } from './server/asset-path.mjs';
import { createNewsSsrRenderer } from './server/news-ssr.mjs';
import { createIntelFeed, INTEL_ARCHIVE_PATH, INTEL_PATH } from './server/intel-feed.mjs';
import { createFundingMatrixReader } from './server/funding-matrix.mjs';
import { createFundingFeed, FUNDING_PATH } from './server/funding-feed.mjs';
import { createFxFeed, FX_JSON_PATH } from './server/fx-feed.mjs';
import { rewritePartnerViewHtml } from './src/data/partner-view.js';
import { createPartnerProgram } from './server/partner-program.mjs';
import { createClickClassifier } from './server/click-metadata.mjs';
import { createGoRedirect } from './server/go-redirect.mjs';
import { beginnerAliasRedirect } from './src/data/locale-routing.js';
import { createBitgetAlliancePool, BITGET_ALLIANCE_POOL_PATH } from './server/bitget-alliance-pool.mjs';
import { createKrakenUsdgLive, KRAKEN_USDG_LIVE_PATH } from './server/kraken-usdg-live.mjs';
import { marketEventsReaderFromEnv } from './server/market-events-feed.mjs';
import { MARKET_EVENTS_PATH } from './src/data/market-data-pages.js';
import { createLiquidationLevelsFeed, LIQUIDATION_LEVELS_PATH } from './server/liquidation-levels-feed.mjs';
import { COINS_JSON_PATH, createCoinsSnapshotReader } from './server/coins-feed.mjs';
import { createTokenizedStocksReader, TS_LIVE_JSON_PATH } from './server/tokenized-stocks-feed.mjs';
import { createTokenizedStocksPricesReader, TS_PRICES_PATH } from './server/tokenized-stocks-prices-feed.mjs';
import { createJsonSnapshotReader } from './server/intel-tools-feed.mjs';
import { readEtfFlows } from './src/data/etf-flows.js';
import { readCalendar } from './src/data/crypto-calendar.js';
import { CALENDAR_JSON_PATH, ETF_FLOWS_JSON_PATH } from './src/data/intel-tools-routes.js';
import { createOgImageRoute, OG_PATH_PREFIX } from './server/og-image.mjs';
import { CTA_CLICK_PATH, clientKey, createCtaClickBeacon } from './server/cta-click.mjs';
import { createSsrPageCache } from './server/ssr-page-cache.mjs';
import { createEmbedRoute } from './server/embed-widgets.mjs';
import { createFlashMemory } from './server/flash-memory.mjs';
import { createPositionRadar } from './server/position-radar.mjs';
import { createTickerFeed, TICKER_PATH } from './server/ticker-feed.mjs';
import { createMoversFeed, MOVERS_PATH } from './server/movers-feed.mjs';
import { installUndiciCloseRaceGuard } from './server/undici-close-race.mjs';

installUndiciCloseRaceGuard();

const root = path.dirname(fileURLToPath(import.meta.url));
const mimeTypes = new Map(Object.entries({
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  // Academy subtitle tracks (/captions/academy/s1/*.vtt): <track> needs text/vtt.
  '.vtt': 'text/vtt; charset=utf-8',
}));

export async function createProductionServer({ env = process.env, appRoot = root, worker: suppliedWorker, experimentRegistry } = {}) {
  const distRoot = path.resolve(env.DIST_ROOT || path.join(appRoot, 'dist'));
  const clientRoot = path.join(distRoot, 'client');
  const renderNews = createNewsSsrRenderer(distRoot);
  const cspReporter = createCspReporter();
  const cspTemplate = await readFile(path.join(clientRoot, 'index.html'), 'utf8').catch(() => '');
  const cspReportOnly = reportOnlyPolicy(cspTemplate);
  // SSR HTML also carries the worker's own two inline scripts (hydration bridge, deferred CSS switch): add their hashes
  // so report-only CSP stops posting a script-src-elem report per page view. One policy string per distinct hash set.
  const cspPolicies = new Map();
  const cspForHtml = (html) => {
    const extra = workerInlineScriptHashes(html);
    if (!extra.length) return cspReportOnly;
    const key = extra.join(' ');
    if (!cspPolicies.has(key)) {
      if (cspPolicies.size >= 32) cspPolicies.clear();
      cspPolicies.set(key, reportOnlyPolicy(cspTemplate, extra));
    }
    return cspPolicies.get(key);
  };
  const workerPolledJsonCacheScope = {};
  // Append-only announcement archive (2026-10-12): update pages stay real pages after their item leaves the live feed.
  // INTEL_ARCHIVE_FILE lives outside the read-only app tree (production: /intel-state, host /data/private/nexualpha/intel).
  let intelArchiveFile = null;
  if (env.INTEL_ARCHIVE_FILE) {
    try { intelArchiveFile = await privateDataFile(env.INTEL_ARCHIVE_FILE, appRoot, clientRoot); } catch (error) {
      console.error(`[NexuAlpha] INTEL_ARCHIVE_FILE unusable (${error?.message || error}); serving the shipped archive only`);
    }
  }
  const intel = createIntelFeed(clientRoot, { enabled: !suppliedWorker && env.INTEL_REFRESH !== 'off', archiveFile: intelArchiveFile, log: (m) => console.log(`[NexuAlpha] ${m}`) });
  const fundingMatrix = createFundingMatrixReader({ enabled: !suppliedWorker && env.INTEL_REFRESH !== 'off' });
  const funding = createFundingFeed({ enabled: !suppliedWorker && env.INTEL_REFRESH !== 'off', log: (m) => console.log(`[NexuAlpha] ${m}`) });
  const fx = createFxFeed({
    enabled: env.FX_REFRESH !== 'off' && (!suppliedWorker || env.FX_REFRESH === 'on'),
    ...(env.FX_SOURCE_URL ? { sourceUrl: env.FX_SOURCE_URL } : {}),
    everyMs: Math.max(60_000, Number.parseInt(env.FX_REFRESH_MS || `${24 * 60 * 60 * 1000}`, 10) || 24 * 60 * 60 * 1000),
    log: (m) => console.log(`[NexuAlpha] ${m}`),
  });
  // Bitget Alliance live prize pool (2026-10-13): Bitget's public campaign figures, read on demand at most every 10 min.
  const bitgetAlliancePool = createBitgetAlliancePool({
    enabled: env.BITGET_ALLIANCE_POOL !== 'off' && (!suppliedWorker || env.BITGET_ALLIANCE_POOL === 'on'),
    log: (m) => console.log(`[NexuAlpha] ${m}`),
  });
  // Kraken 5M USDG Challenge live figures (2026-10-13): community volume, tier and top 5 from Kraken's public page, read on
  // demand at most every 10 min.
  const krakenUsdgLive = createKrakenUsdgLive({
    enabled: env.KRAKEN_USDG_LIVE !== 'off' && (!suppliedWorker || env.KRAKEN_USDG_LIVE === 'on'),
    log: (m) => console.log(`[NexuAlpha] ${m}`),
  });
  // Flash market items (2026-10-12): kept next to the announcement archive (FLASH_MEMORY_FILE, default
  // <dir of INTEL_ARCHIVE_FILE>/flash-market-items.json); without either, the Worker keeps them in memory only.
  let flashMemoryFile = null;
  const flashFile = env.FLASH_MEMORY_FILE || (intelArchiveFile ? path.join(path.dirname(intelArchiveFile), 'flash-market-items.json') : null);
  if (flashFile) {
    try { flashMemoryFile = await privateDataFile(flashFile, appRoot, clientRoot); } catch (error) {
      console.error(`[NexuAlpha] FLASH_MEMORY_FILE unusable (${error?.message || error}); flash market items stay in memory`);
    }
  }
  const flashMemory = createFlashMemory({ file: flashMemoryFile, log: (m) => console.log(`[NexuAlpha] ${m}`) });
  // /liquidations and /funding-rates SSR: the collector feed, read at most once per 60 s (MARKET_EVENTS_FILE or MARKET_EVENTS_URL).
  // The summary, asset route and article SSR share this 60 s last-good reader through MARKET_EVENTS_READ.
  const marketEvents = marketEventsReaderFromEnv(env, { log: (m) => console.log(`[NexuAlpha] ${m}`) });
  const liquidationLevels = createLiquidationLevelsFeed({ log: (m) => console.log(`[NexuAlpha] ${m}`) });
  // /coins pages + /intel/coins.json: the host's refreshed snapshot (COINS_FILE, read-only for the server); unset = baked table.
  // Live ticker bar (home, /flash): Binance 24h tickers cached 15 s server-side, the collector feed as fallback. A supplied
  // worker (tests) or INTEL_REFRESH=off never calls out; the bar then renders from the collector feed alone.
  const ticker = createTickerFeed({ readMarketEvents: marketEvents.read, ...(suppliedWorker || env.INTEL_REFRESH === 'off' ? { fetchImpl: async () => { throw new Error('ticker network off'); } } : {}), log: (m) => console.log(`[NexuAlpha] ${m}`) });
  // Whales come only from the collector's file (WHALES_FILE, default /market/whales.json); the web server never polls
  // Hyperliquid or chain sources itself, so a missing file answers "unavailable" at once instead of timing out.
  const radar = createPositionRadar({ whaleFileOnly: true, ...(suppliedWorker || env.INTEL_REFRESH === 'off' ? { fetchImpl: async () => { throw new Error('radar network off'); } } : {}) });
  const coinsSnapshot = createCoinsSnapshotReader({ file: env.COINS_FILE || null, log: (m) => console.log(`[NexuAlpha] ${m}`) });
  // /tokenized-stocks ticker + exchange pages and /intel/tokenized-stocks.json: the host's refreshed listing snapshot
  // (TS_LIVE_FILE, read-only for the server); unset = the table baked into the release.
  const tsLive = createTokenizedStocksReader({ file: env.TS_LIVE_FILE || null, log: (m) => console.log(`[NexuAlpha] ${m}`) });
  const tsPrices = createTokenizedStocksPricesReader({ file: env.TS_PRICES_FILE || null, log: (m) => console.log(`[NexuAlpha] ${m}`) });
  // Home "Today's movers": the ticker's Binance rows + the coin universe (runtime snapshot, else the release copy) + the
  // collector feed. No extra upstream request.
  let releaseCoins = null;
  const readReleaseCoins = async () => (releaseCoins ??= readFile(path.join(clientRoot, 'intel', 'coins.json'), 'utf8').then(JSON.parse).catch(() => null));
  const movers = createMoversFeed({ readBinanceRows: ticker.readRows, readCoins: async () => (coinsSnapshot.enabled ? await coinsSnapshot.read() : null) || readReleaseCoins(), readMarketEvents: marketEvents.read, log: (m) => console.log(`[NexuAlpha] ${m}`) });
  // /etf-flows + /calendar (2026-10-13): host-refreshed snapshots (ETF_FLOWS_FILE / CALENDAR_FILE, read-only); the release's
  // public/intel copies answer until the host has written one.
  const etfFlows = createJsonSnapshotReader({ file: env.ETF_FLOWS_FILE || null, fallbackFile: path.join(clientRoot, 'intel', 'etf-flows.json'), validate: (j) => Boolean(readEtfFlows(j)), label: 'etf-flows', log: (m) => console.log(`[NexuAlpha] ${m}`) });
  const calendar = createJsonSnapshotReader({ file: env.CALENDAR_FILE || null, fallbackFile: path.join(clientRoot, 'intel', 'calendar.json'), validate: (j) => Boolean(readCalendar(j)), label: 'calendar', log: (m) => console.log(`[NexuAlpha] ${m}`) });
  const version = suppliedWorker && !existsSync(path.join(clientRoot, 'version.json'))
    ? { buildId: env.BUILD_ID || '3.0-test-build' }
    : JSON.parse(await readFile(path.join(clientRoot, 'version.json'), 'utf8'));
  if (env.BUILD_ID && env.BUILD_ID !== version.buildId) throw new Error('BUILD_ID_RUNTIME_MISMATCH');
  // tracked partner redirect /go/<partner>?src= (owner 2026-10-10); clicks are appended to CLICK_EVENT_FILE when set
  const clickEventFile = env.CLICK_EVENT_FILE ? await privateDataFile(env.CLICK_EVENT_FILE, appRoot, clientRoot) : null;
  // Home hero copy experiment (X5): HOME_HERO_EXPERIMENT_FORCE=on|a|b previews the experiment on a local/staging build
  // while the registry flag is off. Ignored in production, where only experimentRegistry.home_hero_copy_v1.enabled counts.
  // HOME_HERO_EXPERIMENT_FORCE=off is the kill switch and also works in production (container env, no rebuild).
  const heroForce = env.HOME_HERO_EXPERIMENT_FORCE === 'off' ? 'off' : env.NODE_ENV !== 'production' && ['on', 'a', 'b'].includes(env.HOME_HERO_EXPERIMENT_FORCE) ? env.HOME_HERO_EXPERIMENT_FORCE : undefined;
  // Both click recorders add {experiment, variant} from the visitor's hero cookie while the experiment runs.
  let partnerTokens = {};
  try { partnerTokens = JSON.parse(env.PARTNER_STATS_TOKENS || '{}'); } catch { throw new Error('Invalid PARTNER_STATS_TOKENS JSON'); }
  const partnerProgram = createPartnerProgram({ eventFile: clickEventFile, tokens: partnerTokens });
  const classifyClick = createClickClassifier({ env, ...(isClusterWorker() ? {
    classifyHuman: (key) => primaryCall('click-window', { key }),
  } : {}) });
  const goRedirect = createGoRedirect({ clientRoot, eventFile: clickEventFile, heroForce, env, classify: classifyClick });
  // site sign-up buttons keep their partner hrefs; the browser reports the click to POST /api/cta-click (same file, kind "site")
  const ctaClick = createCtaClickBeacon({ clientRoot, eventFile: clickEventFile, heroForce, env, classify: classifyClick,
    ...(isClusterWorker() ? { allow: (key) => primaryCall('click-allow', { key: createHash('sha256').update(key).digest('hex') }) } : {}),
    origin: env.PUBLIC_ORIGIN || 'https://nexualpha.com' });
  // Social data cards /og/<kind>/<id>.png (2026-10-10): rendered from the page's own data, cached per build id.
  const ogImages = createOgImageRoute({
    clientRoot, buildId: version.buildId, cacheDir: env.OG_CACHE_DIR || null, fontDir: env.OG_FONT_DIR || null,
    marketEventsFile: env.MARKET_EVENTS_FILE || null, fallbackImage: path.join(clientRoot, 'brand', 'nexualpha', 'nexualpha-social-v1.jpg'),
    log: (m) => console.log(`[NexuAlpha] ${m}`),
  });
  // Embeddable widgets /embed/liquidations, /embed/funding-rates (+ .js injectors), 2026-10-11: same feed reader as the
  // data pages, iframe-friendly headers, noindex. Other /embed/* paths (the calculator) stay with the worker.
  const embeds = createEmbedRoute({ readFeed: marketEvents.read, origin: env.PUBLIC_ORIGIN || 'https://nexualpha.com', log: (m) => console.log(`[NexuAlpha] ${m}`) });
  const errorRequired = env.ERROR_MONITOR_REQUIRED === '1';
  if (errorRequired && !env.ERROR_EVENT_FILE) throw new Error('ERROR_MONITOR_REQUIRED');
  let errorMonitor = null;
  if (env.ERROR_EVENT_FILE) {
    const errorFile = await privateDataFile(env.ERROR_EVENT_FILE, appRoot, clientRoot);
    errorMonitor = createErrorMonitor(errorFile, { buildId: version.buildId, environment: env.NODE_ENV === 'production' ? 'production' : 'test' });
  }
  const directConfigured = ['CTA_ENVIRONMENT', 'CTA_ALLOWED_ORIGIN', 'CTA_DATA_FILE', 'CTA_SMOKE_DATA_FILE'].some((key) => env[key]);
  let collector;
  let smokeCollector;
  let ctaStatus = { ready: false, configured: false, status: 'unavailable', reasonCode: 'CTA_COLLECTOR_NOT_CONFIGURED' };
  if (directConfigured) {
    if (!env.CTA_ENVIRONMENT || !env.CTA_ALLOWED_ORIGIN || !env.CTA_DATA_FILE) throw new Error('CTA_EXPLICIT_CONFIG_REQUIRED');
    if (env.CTA_ANALYTICS_ORIGIN) throw new Error('CTA_MULTIPLE_COLLECTORS_CONFIGURED');
    if (env.NODE_ENV === 'production' && env.CTA_ENVIRONMENT !== 'production') throw new Error('CTA_PRODUCTION_ENVIRONMENT_REQUIRED');
    const file = await privateDataFile(env.CTA_DATA_FILE, appRoot, clientRoot);
    collector = createWebCtaCollector(file, { env, environment: env.CTA_ENVIRONMENT, origin: env.CTA_ALLOWED_ORIGIN, ...(experimentRegistry ? { registry: experimentRegistry } : {}) });
    await collector.ready;
    ctaStatus = { ready: true, configured: true, status: 'ready', mode: 'local', environment: env.CTA_ENVIRONMENT };
    if (env.CTA_SMOKE_DATA_FILE) {
      const smokeFile = await privateDataFile(env.CTA_SMOKE_DATA_FILE, appRoot, clientRoot);
      if (smokeFile === file) throw new Error('CTA_SMOKE_FILE_MUST_BE_SEPARATE');
      smokeCollector = createWebCtaCollector(smokeFile, { env, environment: 'smoke', origin: env.CTA_ALLOWED_ORIGIN, ...(experimentRegistry ? { registry: experimentRegistry } : {}) });
      await smokeCollector.ready;
    }
  } else if (env.CTA_ANALYTICS_ORIGIN) {
    ctaStatus = { ready: true, configured: true, status: 'ready', mode: 'proxy' };
  }
  if (!suppliedWorker && !existsSync(path.join(clientRoot, 'index.html'))) throw new Error('SITE_BUILD_MISSING');
  const worker = suppliedWorker || (await import(pathToFileURL(path.join(distRoot, 'server/index.js')))).default;
  // /exchanges directory HTML is cached for 60 s per path + query (perf lane 2026-10-11, SSR_PAGE_CACHE=off disables).
  // The key carries the intel feed version and the published news feed hash, so a feed refresh never serves stale HTML.
  const newsFeedHash = createFileFingerprint(path.join(clientRoot, 'content', 'news-feed.sha256.txt'));
  const pageCache = env.SSR_PAGE_CACHE === 'off' ? null : createSsrPageCache({
    ttlMs: Math.max(1000, Number.parseInt(env.SSR_PAGE_CACHE_TTL_MS || '60000', 10) || 60000),
    fingerprint: async () => `${intel.version?.() || ''}|${await newsFeedHash()}`,
  });
  const assets = {
    async fetch(request) {
      const assetUrl = new URL(request.url);
      const file = resolveAssetPath(clientRoot, assetUrl.pathname);
      if (!file) return new Response('Not Found', { status: 404 });
      const immutableAsset = (/[/\\]assets[/\\]/.test(file) && /-[A-Za-z0-9_-]{8,}\.(js|css|woff2?|svg|png|webp|avif|jpe?g|gif)$/.test(file))
        // Fonts referenced with their content version (src/data/locale-font-faces.js FONT_VERSIONS, ?v=<sha256 prefix>).
        || (/[/\\]fonts[/\\]/.test(file) && /\.woff2$/.test(file) && /^[0-9a-f]{8,64}$/.test(assetUrl.searchParams.get('v') || ''))
        || (/[/\\]brand[/\\]/.test(file) && /-v\d+\.(?:avif|gif|jpe?g|png|webp)$/i.test(file));
      const cache = immutableAsset
        ? 'public, max-age=31536000, immutable' : /\.(woff2?|ttf|png|webp|jpe?g|svg|ico|vtt)$/.test(file) ? 'public, max-age=86400' : 'no-cache';
      return new Response(request.method === 'HEAD' ? null : createReadStream(file), { headers: {
        'content-type': mimeTypes.get(path.extname(file)) || 'application/octet-stream', 'cache-control': cache, 'x-content-type-options': 'nosniff',
      } });
    },
  };
  const server = createServer({ requestTimeout: 15000, headersTimeout: 10000 }, async (req, res) => {
    res.setHeader('Content-Security-Policy-Report-Only', cspReportOnly);
    const requestId = safeRequestId(req.headers['x-request-id']);
    let requestPath = '/site-page';
    try {
      const origin = env.CTA_ALLOWED_ORIGIN || `http://${req.headers.host || 'localhost'}`;
      const body = ['GET', 'HEAD'].includes(req.method) ? undefined : req;
      const request = new Request(new URL(sameSiteRequestTarget(req.url), origin), { method: req.method, headers: req.headers, body, duplex: body ? 'half' : undefined });
      let result;
      requestPath = new URL(request.url).pathname;
      const beginnerRedirect = ['GET', 'HEAD'].includes(req.method) ? beginnerAliasRedirect(request.url) : null;
      if (beginnerRedirect) {
        res.writeHead(301, { location: beginnerRedirect, 'cache-control': 'public, max-age=3600', 'x-request-id': requestId });
        res.end();
        return;
      }
      // English has no locale prefix: '/en' and '/en/x' (used by an old social card) redirect to '/' and '/x', keeping the query.
      if ((req.method === 'GET' || req.method === 'HEAD') && /^\/en(\/|$)/.test(requestPath)) {
        const u = new URL(request.url);
        res.writeHead(301, { location: (u.pathname.replace(/^\/en/, '') || '/') + u.search, 'cache-control': 'public, max-age=3600', 'x-request-id': requestId });
        res.end();
        return;
      }
      // QA 2026-10-10: '/exchanges/okx/' was a 404. Page URLs have no trailing slash: redirect permanently, keep the query.
      if ((req.method === 'GET' || req.method === 'HEAD') && requestPath.length > 1 && requestPath.endsWith('/') && !requestPath.startsWith('/api/')) {
        const u = new URL(request.url);
        const target = trailingSlashRedirectTarget(u.pathname, u.search);
        res.writeHead(301, { location: target, 'cache-control': 'public, max-age=3600', 'x-request-id': requestId });
        res.end();
        return;
      }
      if (requestPath === '/api/csp-report') {
        result = await cspReporter(request);
      } else if ((result = await partnerProgram(request))) {
        // Partner landing and private statistics are handled before public SSR/cache.
      } else if (requestPath === CTA_CLICK_PATH) {
        result = await ctaClick(request, clientKey(req));
      } else if (requestPath.startsWith('/go/') && (req.method === 'GET' || req.method === 'HEAD')) {
        result = await goRedirect(request, clientKey(req));
      } else if (requestPath.startsWith(OG_PATH_PREFIX) && (req.method === 'GET' || req.method === 'HEAD')) {
        result = await ogImages(request);
      } else if (requestPath.startsWith('/embed/') && (result = await embeds(request))) {
        // handled: embed widget or injector script
      } else if (requestPath === '/health/click-storage' || requestPath === '/api/v1/health/click-storage') {
        const status = clickEventFile ? clickStorage.status() : { configured: false, ready: false, writes: 0, failures: 0 };
        result = new Response(JSON.stringify(status), { status: status.ready ? 200 : 503, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
      } else if (requestPath === '/healthz' || requestPath === '/api/health') {
        result = new Response(JSON.stringify({ status: 'ok', service: 'nexualpha-web' }), { status: 200,
          headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
      } else if (requestPath === '/health/live' || requestPath === '/api/v1/health/live') {
        result = new Response(JSON.stringify({ status: 'live', service: 'nexualpha-web' }), { status: 200,
          headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
      } else if (requestPath === '/health/web-ready' || requestPath === '/api/v1/health/web-ready'
        || requestPath === '/readiness' || requestPath === '/health/ready' || requestPath === '/api/ready' || requestPath === '/api/readiness') {
        result = new Response(JSON.stringify({ status: 'ready', service: 'nexualpha-web' }), { status: 200,
          headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
      } else if (requestPath === '/health/cta-ready' || requestPath === '/api/v1/health/cta-ready') {
        result = new Response(JSON.stringify({ service: 'nexualpha-cta', configured: ctaStatus.configured, ...ctaStatus }), { status: ctaStatus.ready ? 200 : 503,
          headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
      } else if (requestPath === '/health/errors-ready' || requestPath === '/api/v1/health/errors-ready') {
        const status = errorMonitor?.status() || { ready: false, configured: false, status: 'unavailable', reasonCode: 'ERROR_MONITOR_NOT_CONFIGURED' };
        result = new Response(JSON.stringify({ service: 'nexualpha-error-monitor', ...status }), { status: status.ready ? 200 : 503,
          headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
      } else if (requestPath === '/health/dependencies' || requestPath === '/api/v1/health/dependencies') {
        const core = await coreHealth(env, (failure) => errorMonitor?.record({ requestId, route: requestPath, component: 'core', httpStatus: 503, ...failure }));
        const dependencies = {
          web: { ready: true, status: 'ready' },
          cta: ctaStatus,
          core,
          ...(errorMonitor ? { errorMonitor: errorMonitor.status() } : {}),
        };
        const degraded = Object.values(dependencies).some((dependency) => dependency.ready !== true);
        result = new Response(JSON.stringify({ status: degraded ? 'degraded' : 'ready', dependencies }), { status: 200,
          headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
      } else if (requestPath === '/api/v1/health/readiness' || requestPath === '/api/v1/health/ready' || requestPath === '/api/v1/health/readiness/details') {
        const core = await coreHealth(env, (failure) => errorMonitor?.record({ requestId, route: requestPath, component: 'core', httpStatus: 503, ...failure }));
        const body = {
          status: core.ready ? 'ready' : 'unavailable',
          coreApi: core.ready ? 'ready' : core.configured ? 'unavailable' : 'not_configured',
          ...(core.reasonCode ? { reasonCode: core.reasonCode } : {}),
          dependencies: { coreApi: { configured: core.configured, ready: core.ready, ...(core.upstreamStatus ? { upstreamStatus: core.upstreamStatus } : {}) } },
          ...(core.ready ? {} : { remediation: core.configured ? 'Check Core API upstream health, routing and timeout.' : 'Configure CORE_API_ORIGIN or CORE_API_BASE_URL before enabling shared-core data routes.' }),
        };
        result = new Response(JSON.stringify(body), { status: core.ready ? 200 : 503,
          headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
      } else if (requestPath === INTEL_PATH && (req.method === 'GET' || req.method === 'HEAD')) {
        result = await intel.respond();
      } else if (requestPath === INTEL_ARCHIVE_PATH && (req.method === 'GET' || req.method === 'HEAD')) {
        result = await intel.respondArchive();
      } else if (requestPath === TICKER_PATH && (req.method === 'GET' || req.method === 'HEAD')) {
        result = await ticker.respond(req.method);
      } else if (requestPath === MOVERS_PATH && (req.method === 'GET' || req.method === 'HEAD')) {
        result = await movers.respond(req.method);
      } else if (requestPath === FUNDING_PATH && (req.method === 'GET' || req.method === 'HEAD')) {
        result = await funding.respond();
      } else if ((requestPath === ETF_FLOWS_JSON_PATH || requestPath === CALENDAR_JSON_PATH) && (req.method === 'GET' || req.method === 'HEAD') && (result = await (requestPath === ETF_FLOWS_JSON_PATH ? etfFlows : calendar).respond(req.method))) {
        // served from ETF_FLOWS_FILE / CALENDAR_FILE (falls through to the static release copy when the file is not usable)
      } else if (requestPath === BITGET_ALLIANCE_POOL_PATH && (req.method === 'GET' || req.method === 'HEAD')) {
        result = await bitgetAlliancePool.respond(req.method);
      } else if (requestPath === KRAKEN_USDG_LIVE_PATH && (req.method === 'GET' || req.method === 'HEAD')) {
        result = await krakenUsdgLive.respond(req.method);
      } else if (requestPath === FX_JSON_PATH && (req.method === 'GET' || req.method === 'HEAD')) {
        result = await fx.respond(req.method);
      } else if (requestPath === LIQUIDATION_LEVELS_PATH && (req.method === 'GET' || req.method === 'HEAD')) {
        result = await liquidationLevels.respond(req.method);
      } else if (requestPath === MARKET_EVENTS_PATH && env.MARKET_EVENTS_FILE && (req.method === 'GET' || req.method === 'HEAD') && (result = await marketEventsFileResponse(env.MARKET_EVENTS_FILE, req.method))) {
        // nginx serves this file in production; serving the mounted copy here keeps staged containers identical
      } else if (requestPath === TS_PRICES_PATH) {
        result = ['GET', 'HEAD'].includes(req.method) ? await tsPrices.respond(req.method, new URL(request.url).searchParams)
          : new Response(null, { status: 405, headers: { allow: 'GET, HEAD', 'cache-control': 'no-store' } });
      } else if (requestPath === TS_LIVE_JSON_PATH && tsLive.enabled && (req.method === 'GET' || req.method === 'HEAD') && (result = await tsLive.respond(req.method))) {
        // served from TS_LIVE_FILE (falls through to the static copy below when the file is not usable)
      } else if (requestPath === COINS_JSON_PATH && coinsSnapshot.enabled && (req.method === 'GET' || req.method === 'HEAD') && (result = await coinsSnapshot.respond(req.method))) {
        // served from COINS_FILE (falls through to the static copy below when the file is not usable)
      } else if (requestPath === '/api/analytics/cta' && collector) {
        const mode = request.headers.get('x-nexualpha-analytics-mode');
        const testQuery = new URL(request.url).searchParams.has('analytics_test');
        if (mode && !['smoke', 'test'].includes(mode)) result = new Response(null, { status: 400 });
        else if (mode || testQuery) result = smokeCollector ? await smokeCollector(request) : unavailable('CTA_SMOKE_NOT_CONFIGURED');
        else result = await collector(request, undefined, { clientIp: clientKey(req) });
      } else {
        const renderPage = (pageRequest) => worker.fetch(pageRequest, {
          ASSETS: assets, WORKER_POLLED_JSON_CACHE_SCOPE: workerPolledJsonCacheScope, NEWS_SSR_RENDER: renderNews, MARKET_EVENTS_READ: marketEvents.read, LIQUIDATION_LEVELS_READ: liquidationLevels.read, FUNDING_MATRIX_READ: fundingMatrix.read, FUNDING_MATRIX_READ_CACHED: fundingMatrix.readCached, FUNDING_READ: funding.read, INTEL_READ: intel.read, INTEL_ARCHIVE_READ: intel.readArchive, FLASH_MEMORY: flashMemory, COINS_SNAPSHOT_READ: coinsSnapshot.enabled ? coinsSnapshot.read : undefined, TS_LIVE_READ: tsLive.enabled ? tsLive.read : undefined, ETF_FLOWS_READ: etfFlows.read, CALENDAR_READ: calendar.read, FX_SNAPSHOT_READ: fx.read, TICKER_READ: ticker.read, MOVERS_READ: movers.read, RADAR_READ: radar.read, CORE_API_ORIGIN: env.CORE_API_ORIGIN, CORE_API_BASE_URL: env.CORE_API_BASE_URL,
          CTA_ANALYTICS_ORIGIN: env.CTA_ANALYTICS_ORIGIN,
          ...(heroForce ? { HOME_HERO_EXPERIMENT_FORCE: heroForce } : {}),
        });
        result = pageCache ? await pageCache.fetch(request, renderPage) : await renderPage(request);
      }
      if (new URL(request.url).searchParams.has('p') && result.headers.get('content-type')?.includes('text/html')) {
        const html = rewritePartnerViewHtml(await result.text(), request.url);
        const rewrittenHeaders = new Headers(result.headers);
        rewrittenHeaders.delete('content-length');
        rewrittenHeaders.set('cache-control', 'no-store');
        result = new Response(html, { status: result.status, headers: rewrittenHeaders });
      }
      if (req.method === 'GET' && result.body && result.headers.get('content-type')?.includes('text/html')) {
        const html = await result.text();
        res.setHeader('Content-Security-Policy-Report-Only', cspForHtml(html));
        result = new Response(html, { status: result.status, headers: result.headers });
      }
      if (result.status >= 500 && !isHealthCheckPath(requestPath)) await errorMonitor?.record({ requestId, route: requestPath,
        component: requestPath === '/api/analytics/cta' ? 'cta' : 'web',
        errorCode: requestPath === '/api/analytics/cta' ? 'CTA_COLLECTOR_WRITE_FAILED' : 'SITE_REQUEST_UNAVAILABLE', httpStatus: result.status });
      const responseHeaders = Object.fromEntries(result.headers);
      responseHeaders['x-request-id'] = requestId;
      res.writeHead(result.status, responseHeaders);
      if (req.method === 'HEAD' || !result.body) { res.end(); return; }
      // Respect socket backpressure and cancel upstream work when the client disconnects.
      try {
        await pipeline(Readable.fromWeb(result.body), res);
      } catch (error) {
        // A visitor closing the tab mid-response is not a site failure: do not page the error monitor for it.
        if (res.destroyed || req.destroyed || error?.code === 'ERR_STREAM_PREMATURE_CLOSE' || error?.name === 'AbortError') return;
        throw error;
      }
    } catch {
      await errorMonitor?.record({ requestId, route: requestPath,
        component: requestPath === '/api/analytics/cta' ? 'cta' : 'web',
        errorCode: requestPath === '/api/analytics/cta' ? 'CTA_COLLECTOR_WRITE_FAILED' : 'SITE_REQUEST_UNAVAILABLE', httpStatus: 503 });
      if (!res.headersSent) {
        res.writeHead(503, { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-request-id': requestId });
        res.end(JSON.stringify({ status: 'unavailable', reasonCode: 'SITE_REQUEST_UNAVAILABLE' }));
      } else res.destroy();
    }
  });
  server.once('close', () => {
    intel.stop();
    funding.stop();
    fx.stop();
    pageCache?.clear();
  });
  server.flush = async () => { await Promise.all([flashMemory.flush(), intel.flush()]); };
  return server;
}

// Re-reads a small fingerprint file at most every few seconds; missing file = empty fingerprint (cache still works).
function createFileFingerprint(file, { everyMs = 5000 } = {}) {
  let value = '';
  let readAt = 0;
  return async () => {
    const now = Date.now();
    if (now - readAt < everyMs) return value;
    readAt = now;
    try { value = (await readFile(file, 'utf8')).trim(); } catch { value = ''; }
    return value;
  };
}

function isHealthCheckPath(pathname) {
  return pathname === '/healthz'
    || pathname === '/readiness'
    || pathname === '/health/ready'
    || pathname.startsWith('/health/')
    || pathname === '/api/health'
    || pathname === '/api/ready'
    || pathname === '/api/readiness'
    || pathname.startsWith('/api/v1/health/');
}

function coreProbeUrl(env) {
  const configured = env.CORE_API_BASE_URL || env.CORE_API_ORIGIN;
  if (!configured) return null;
  const url = new URL(configured);
  const pathname = url.pathname.replace(/\/+$/, '');
  if (pathname.endsWith('/health/ready')) return url;
  if (pathname.endsWith('/api/v1')) url.pathname = `${pathname}/health/ready`;
  else url.pathname = '/api/v1/health/ready';
  url.search = '';
  url.hash = '';
  return url;
}

async function coreHealth(env, onFailure) {
  const url = coreProbeUrl(env);
  if (!url) {
    await onFailure?.({ errorCode: 'CORE_API_ORIGIN_NOT_CONFIGURED' });
    return { ready: false, configured: false, status: 'unavailable', reasonCode: 'CORE_API_ORIGIN_NOT_CONFIGURED' };
  }
  const timeoutMs = Math.max(250, Math.min(Number.parseInt(env.CORE_HEALTH_TIMEOUT_MS || '1500', 10) || 1500, 10000));
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) });
    let body = null;
    try { body = await response.json(); } catch { /* core health body is optional for gateway readiness */ }
    const ready = response.status >= 200 && response.status < 300 && (!body || body.status === 'ready' || body.status === 'ok' || body.status === 'live');
    const result = {
      ready,
      configured: true,
      status: ready ? 'ready' : 'unavailable',
      upstreamStatus: response.status,
      ...(ready ? {} : { reasonCode: 'CORE_API_UPSTREAM_UNAVAILABLE' }),
    };
    if (!ready) await onFailure?.({ errorCode: 'CORE_API_UPSTREAM_UNAVAILABLE', upstreamStatus: response.status });
    return result;
  } catch {
    await onFailure?.({ errorCode: 'CORE_API_UPSTREAM_UNAVAILABLE' });
    return { ready: false, configured: true, status: 'unavailable', reasonCode: 'CORE_API_UPSTREAM_UNAVAILABLE' };
  }
}

function unavailable(reasonCode) {
  return new Response(JSON.stringify({ status: 'unavailable', reasonCode }), { status: 503,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}

async function privateDataFile(file, appRoot, clientRoot) {
  if (!path.isAbsolute(file)) throw new Error('CTA_ABSOLUTE_DATA_PATH_REQUIRED');
  const inside = (parent, candidate) => { const relative = path.relative(parent, candidate); return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative)); };
  const resolved = path.resolve(file);
  if (inside(path.resolve(appRoot), resolved) || inside(path.resolve(clientRoot), resolved)) throw new Error('CTA_DATA_MUST_BE_OUTSIDE_APP');
  await mkdir(path.dirname(resolved), { recursive: true, mode: 0o700 });
  await appendFile(resolved, '', { mode: 0o600 });
  const actual = await realpath(resolved);
  if (inside(await realpath(appRoot), actual) || inside(path.resolve(clientRoot), actual)) throw new Error('CTA_DATA_MUST_BE_OUTSIDE_APP');
  await chmod(actual, 0o600);
  return actual;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const count = webWorkerCount();
  if (cluster.isPrimary && count > 1) superviseWebWorkers({ count, handlers: createPrimaryServices() });
  else await listenWebWorker(() => createProductionServer());
}

async function marketEventsFileResponse(file, method) {
  try {
    const body = await readFile(file);
    return new Response(method === 'HEAD' ? null : body, { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=30' } });
  } catch {
    return null;
  }
}
