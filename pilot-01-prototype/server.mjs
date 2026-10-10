#!/usr/bin/env node
// Production entrypoint. Code/assets may be mounted read-only. Enable local
// analytics with CTA_ENVIRONMENT, CTA_ALLOWED_ORIGIN and an external absolute
// CTA_DATA_FILE. CTA_SMOKE_DATA_FILE is optional and must be a different file.
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, appendFile, realpath, chmod, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCtaCollector } from './server/cta-collector.mjs';
import { createErrorMonitor, safeRequestId } from './server/error-monitor.mjs';
import { resolveAssetPath } from './server/asset-path.mjs';
import { createNewsSsrRenderer } from './server/news-ssr.mjs';
import { createIntelFeed, INTEL_PATH } from './server/intel-feed.mjs';
import { createFundingFeed, FUNDING_PATH } from './server/funding-feed.mjs';
import { createGoRedirect } from './server/go-redirect.mjs';
import { createOgImageRoute, OG_PATH_PREFIX } from './server/og-image.mjs';
import { CTA_CLICK_PATH, clientKey, createCtaClickBeacon } from './server/cta-click.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const mimeTypes = new Map(Object.entries({
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
}));

export async function createProductionServer({ env = process.env, appRoot = root, worker: suppliedWorker, experimentRegistry } = {}) {
  const distRoot = path.resolve(env.DIST_ROOT || path.join(appRoot, 'dist'));
  const clientRoot = path.join(distRoot, 'client');
  const renderNews = createNewsSsrRenderer(distRoot);
  const intel = createIntelFeed(clientRoot, { enabled: !suppliedWorker && env.INTEL_REFRESH !== 'off', log: (m) => console.log(`[NexuAlpha] ${m}`) });
  const funding = createFundingFeed({ enabled: !suppliedWorker && env.INTEL_REFRESH !== 'off', log: (m) => console.log(`[NexuAlpha] ${m}`) });
  const version = suppliedWorker && !existsSync(path.join(clientRoot, 'version.json'))
    ? { buildId: env.BUILD_ID || '3.0-test-build' }
    : JSON.parse(await readFile(path.join(clientRoot, 'version.json'), 'utf8'));
  if (env.BUILD_ID && env.BUILD_ID !== version.buildId) throw new Error('BUILD_ID_RUNTIME_MISMATCH');
  // tracked partner redirect /go/<partner>?src= (owner 2026-10-10); clicks are appended to CLICK_EVENT_FILE when set
  const clickEventFile = env.CLICK_EVENT_FILE ? await privateDataFile(env.CLICK_EVENT_FILE, appRoot, clientRoot) : null;
  const goRedirect = createGoRedirect({ clientRoot, eventFile: clickEventFile });
  // site sign-up buttons keep their partner hrefs; the browser reports the click to POST /api/cta-click (same file, kind "site")
  const ctaClick = createCtaClickBeacon({ clientRoot, eventFile: clickEventFile });
  // Social data cards /og/<kind>/<id>.png (2026-10-10): rendered from the page's own data, cached per build id.
  const ogImages = createOgImageRoute({
    clientRoot, buildId: version.buildId, cacheDir: env.OG_CACHE_DIR || null, fontDir: env.OG_FONT_DIR || null,
    marketEventsFile: env.MARKET_EVENTS_FILE || null, fallbackImage: path.join(clientRoot, 'brand', 'nexualpha', 'nexualpha-social-v1.jpg'),
    log: (m) => console.log(`[NexuAlpha] ${m}`),
  });
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
    collector = createCtaCollector(file, { env, environment: env.CTA_ENVIRONMENT, origin: env.CTA_ALLOWED_ORIGIN, ...(experimentRegistry ? { registry: experimentRegistry } : {}) });
    await collector.ready;
    ctaStatus = { ready: true, configured: true, status: 'ready', mode: 'local', environment: env.CTA_ENVIRONMENT };
    if (env.CTA_SMOKE_DATA_FILE) {
      const smokeFile = await privateDataFile(env.CTA_SMOKE_DATA_FILE, appRoot, clientRoot);
      if (smokeFile === file) throw new Error('CTA_SMOKE_FILE_MUST_BE_SEPARATE');
      smokeCollector = createCtaCollector(smokeFile, { env, environment: 'smoke', origin: env.CTA_ALLOWED_ORIGIN, ...(experimentRegistry ? { registry: experimentRegistry } : {}) });
      await smokeCollector.ready;
    }
  } else if (env.CTA_ANALYTICS_ORIGIN) {
    ctaStatus = { ready: true, configured: true, status: 'ready', mode: 'proxy' };
  }
  if (!suppliedWorker && !existsSync(path.join(clientRoot, 'index.html'))) throw new Error('SITE_BUILD_MISSING');
  const worker = suppliedWorker || (await import(pathToFileURL(path.join(distRoot, 'server/index.js')))).default;
  const assets = {
    async fetch(request) {
      const file = resolveAssetPath(clientRoot, new URL(request.url).pathname);
      if (!file) return new Response('Not Found', { status: 404 });
      const immutableAsset = (/[/\\]assets[/\\]/.test(file) && /-[A-Za-z0-9_-]{8,}\.(js|css)$/.test(file))
        || (/[/\\]brand[/\\]/.test(file) && /-v\d+\.(?:avif|gif|jpe?g|png|webp)$/i.test(file));
      const cache = immutableAsset
        ? 'public, max-age=31536000, immutable' : /\.(woff2?|ttf|png|webp|jpe?g|svg|ico)$/.test(file) ? 'public, max-age=86400' : 'no-cache';
      return new Response(request.method === 'HEAD' ? null : createReadStream(file), { headers: {
        'content-type': mimeTypes.get(path.extname(file)) || 'application/octet-stream', 'cache-control': cache, 'x-content-type-options': 'nosniff',
      } });
    },
  };
  return createServer({ requestTimeout: 15000, headersTimeout: 10000 }, async (req, res) => {
    const requestId = safeRequestId(req.headers['x-request-id']);
    let requestPath = '/site-page';
    try {
      const origin = env.CTA_ALLOWED_ORIGIN || `http://${req.headers.host || 'localhost'}`;
      const body = ['GET', 'HEAD'].includes(req.method) ? undefined : req;
      const request = new Request(new URL(req.url || '/', origin), { method: req.method, headers: req.headers, body, duplex: body ? 'half' : undefined });
      let result;
      requestPath = new URL(request.url).pathname;
      // QA 2026-10-10: '/exchanges/okx/' was a 404. Page URLs have no trailing slash: redirect permanently, keep the query.
      if ((req.method === 'GET' || req.method === 'HEAD') && requestPath.length > 1 && requestPath.endsWith('/') && !requestPath.startsWith('/api/')) {
        const u = new URL(request.url);
        const target = u.pathname.replace(/\/+$/, '') + u.search;
        res.writeHead(301, { location: target, 'cache-control': 'public, max-age=3600', 'x-request-id': requestId });
        res.end();
        return;
      }
      if (requestPath === CTA_CLICK_PATH) {
        result = await ctaClick(request, clientKey(req));
      } else if (requestPath.startsWith('/go/') && (req.method === 'GET' || req.method === 'HEAD')) {
        result = await goRedirect(request);
      } else if (requestPath.startsWith(OG_PATH_PREFIX) && (req.method === 'GET' || req.method === 'HEAD')) {
        result = await ogImages(request);
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
      } else if (requestPath === FUNDING_PATH && (req.method === 'GET' || req.method === 'HEAD')) {
        result = await funding.respond();
      } else if (requestPath === '/api/analytics/cta' && collector) {
        const mode = request.headers.get('x-nexualpha-analytics-mode');
        const testQuery = new URL(request.url).searchParams.has('analytics_test');
        if (mode && !['smoke', 'test'].includes(mode)) result = new Response(null, { status: 400 });
        else if (mode || testQuery) result = smokeCollector ? await smokeCollector(request) : unavailable('CTA_SMOKE_NOT_CONFIGURED');
        else result = await collector(request);
      } else result = await worker.fetch(request, {
        ASSETS: assets, NEWS_SSR_RENDER: renderNews, CORE_API_ORIGIN: env.CORE_API_ORIGIN, CORE_API_BASE_URL: env.CORE_API_BASE_URL,
        CTA_ANALYTICS_ORIGIN: env.CTA_ANALYTICS_ORIGIN,
      });
      if (result.status >= 500 && !isHealthCheckPath(requestPath)) await errorMonitor?.record({ requestId, route: requestPath,
        component: requestPath === '/api/analytics/cta' ? 'cta' : 'web',
        errorCode: requestPath === '/api/analytics/cta' ? 'CTA_COLLECTOR_WRITE_FAILED' : 'SITE_REQUEST_UNAVAILABLE', httpStatus: result.status });
      const responseHeaders = Object.fromEntries(result.headers);
      responseHeaders['x-request-id'] = requestId;
      res.writeHead(result.status, responseHeaders);
      if (req.method === 'HEAD' || !result.body) { res.end(); return; }
      for await (const chunk of result.body) res.write(chunk);
      res.end();
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
  const server = await createProductionServer();
  const port = Number.parseInt(process.env.PORT || '8080', 10);
  server.listen(port, process.env.HOST || '0.0.0.0', () => process.stdout.write(`NexuAlpha server listening on port ${port}\n`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
}
