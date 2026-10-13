// Home "Today's movers" feed (2026-10-13). No request of its own: it reuses the Binance USDT-M 24h rows the ticker feed
// already caches (15 s), the coins.json universe (runtime COINS_FILE snapshot, else the release copy) and the market
// collector feed (headline line; fallback board when Binance did not answer). The built snapshot is cached `ttlMs` and
// served at /api/movers.json (browsers poll it at most once a minute while the board is on screen) and spliced into the
// prerendered home by the Worker. Failed refreshes retain the last good frame; only a cold cache answers 503.
import { createStaleJsonFeed } from './stale-json-feed.mjs';
import { MOVERS_PATH, buildMoversSnapshot } from '../src/data/movers.js';

export { MOVERS_PATH };

export function createMoversFeed({ readBinanceRows = null, readCoins = null, readMarketEvents = null, ttlMs = 30 * 1000, timeoutMs = 3000, now = Date.now, log = () => {} } = {}) {
  const safe = async (fn) => { if (typeof fn !== 'function') return null; try { return await fn(); } catch (error) { log(`movers: ${error?.message || error}`); return null; } };
  return createStaleJsonFeed({ ttlMs, timeoutMs, now, log, load: async () => {
    const [binanceRows, coins, marketEvents] = await Promise.all([safe(readBinanceRows), safe(readCoins), safe(readMarketEvents)]);
    return buildMoversSnapshot({ binanceRows, coins, marketEvents, now: now() });
  } });
}
