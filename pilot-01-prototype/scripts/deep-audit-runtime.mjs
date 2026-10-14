// Short, non-deploying probe of the real built SSR server. Does not establish a 90-minute production soak.
import { createProductionServer } from '../server.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { localizedPath } from '../src/data/locale-routing.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const supportedLocales = ['en', 'zh-Hans', 'zh-Hant', 'es', 'pt-BR', 'fr', 'de', 'it', 'ja', 'ko', 'ru', 'tr', 'id', 'vi', 'ar', 'ur', 'uk'];
const crawlerRoutes = supportedLocales.map((locale) => localizedPath('/exchanges', locale));
const server = await createProductionServer({ env: {
  DIST_ROOT: path.join(root, 'dist'), INTEL_REFRESH: 'off', FX_REFRESH: 'off',
  BITGET_ALLIANCE_POOL: 'off', KRAKEN_USDG_LIVE: 'off', HOME_HERO_EXPERIMENT_FORCE: 'off',
  MARKET_EVENTS_FILE: path.join(root, 'dist/client/intel/market-events.json'),
} });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const samples = [];
const request = async (pathname, headers = {}) => {
  const start = performance.now();
  const response = await fetch(origin + pathname, { headers });
  const bytes = (await response.arrayBuffer()).byteLength;
  return { pathname, status: response.status, cache: response.headers.get('x-nexualpha-ssr-cache'), ms: performance.now() - start, bytes };
};
try {
  for (const pathname of ['/exchanges', '/zh-hans/exchanges', '/ar/exchanges', '/compare/binance-vs-okx', '/news', '/activities', '/flash', '/jp']) {
    const row = await request(pathname);
    if (row.status !== 200) throw new Error(`warmup failed: ${pathname} ${row.status}`);
  }
  globalThis.gc?.();
  const before = process.memoryUsage();
  const first = await request('/exchanges');
  const second = await request('/exchanges');
  const privateRow = await request('/exchanges', { cookie: 'session=audit' });
  const crawler = [];
  for (let batch = 0; batch < 10; batch++) {
    const rows = await Promise.all([
      ...Array.from({ length: 8 }, (_, index) => request(crawlerRoutes[(batch * 8 + index) % crawlerRoutes.length], { 'user-agent': 'Googlebot' })),
      ...Array.from({ length: 8 }, () => request('/api/news/search?locale=en&limit=10')),
    ]);
    crawler.push(...rows.slice(0, 8));
    samples.push(...rows.slice(8));
  }
  for (let i = 0; i < 400; i++) await request('/exchanges');
  globalThis.gc?.();
  const after = process.memoryUsage();
  const sorted = samples.map(row => row.ms).sort((a, b) => a - b);
  const crawlerSorted = crawler.map(row => row.ms).sort((a, b) => a - b);
  const summary = { mode: 'real-built-server-short-local-probe', cache: [first.cache, second.cache], cookieCache: privateRow.cache,
    crawlerRouteCount: new Set(crawler.map(row => row.pathname)).size, crawlerRequests: crawler.length, crawlerFailures: crawler.filter(row => row.status !== 200).length,
    crawlerP95Ms: Number(crawlerSorted[Math.floor(crawlerSorted.length * 0.95)].toFixed(2)),
    apiRequests: samples.length, apiFailures: samples.filter(row => row.status !== 200).length,
    apiP95Ms: Number(sorted[Math.floor(sorted.length * 0.95)].toFixed(2)),
    heapDeltaMB: Number(((after.heapUsed - before.heapUsed) / 1024 ** 2).toFixed(2)),
    rssDeltaMB: Number(((after.rss - before.rss) / 1024 ** 2).toFixed(2)), heapEndMB: Number((after.heapUsed / 1024 ** 2).toFixed(2)), rssEndMB: Number((after.rss / 1024 ** 2).toFixed(2)) };
  console.log(JSON.stringify(summary));
  if (second.cache !== 'hit' || privateRow.cache || summary.crawlerFailures || summary.apiFailures) process.exitCode = 1;
} finally { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
