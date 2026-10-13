// Home "Today's movers" feed (2026-10-13). No request of its own: it reuses the Binance USDT-M 24h rows the ticker feed
// already caches (15 s), the coins.json universe (runtime COINS_FILE snapshot, else the release copy) and the market
// collector feed (headline line; fallback board when Binance did not answer). The built snapshot is cached `ttlMs` and
// served at /api/movers.json (browsers poll it at most once a minute while the board is on screen) and spliced into the
// prerendered home by the Worker. With no usable source the endpoint answers 503 and the board keeps its frame.
import { MOVERS_PATH, buildMoversSnapshot } from '../src/data/movers.js';

export { MOVERS_PATH };

export function createMoversFeed({ readBinanceRows = null, readCoins = null, readMarketEvents = null, ttlMs = 30 * 1000, now = Date.now, log = () => {} } = {}) {
  let snapshot = null, at = 0, pending = null;
  const safe = async (fn) => { if (typeof fn !== 'function') return null; try { return await fn(); } catch (error) { log(`movers: ${error?.message || error}`); return null; } };
  const refresh = () => {
    pending ??= (async () => {
      const [binanceRows, coins, marketEvents] = await Promise.all([safe(readBinanceRows), safe(readCoins), safe(readMarketEvents)]);
      const next = buildMoversSnapshot({ binanceRows, coins, marketEvents, now: now() });
      if (next) { snapshot = next; at = now(); }
    })().finally(() => { pending = null; });
    return pending;
  };
  // Resolves to the cached snapshot, rebuilt first when older than `ttlMs`; null when nothing usable was ever built or
  // the last good one is older than 10 minutes.
  const read = async () => {
    if (!snapshot || now() - at >= ttlMs) await refresh();
    return snapshot && now() - at <= 10 * 60 * 1000 ? snapshot : null;
  };
  const respond = async (method = 'GET') => {
    const data = await read();
    const headers = { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex' };
    if (!data) return new Response(method === 'HEAD' ? null : JSON.stringify({ status: 'unavailable' }), { status: 503, headers: { ...headers, 'cache-control': 'no-store' } });
    return new Response(method === 'HEAD' ? null : JSON.stringify(data), { status: 200, headers: { ...headers, 'cache-control': 'public, max-age=30, stale-while-revalidate=30' } });
  };
  return { read, respond, refresh };
}
