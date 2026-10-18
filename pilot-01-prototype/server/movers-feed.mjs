// Home "Today's movers" feed (2026-10-13). No request of its own: it reuses the Binance USDT-M 24h rows the ticker feed
// already caches (15 s), the coins.json universe (runtime COINS_FILE snapshot, else the release copy) and the market
// collector feed (headline line; fallback board when Binance did not answer). The built snapshot is cached `ttlMs` and
// served at /api/movers.json (browsers poll it at most once a minute while the board is on screen) and spliced into the
// prerendered home by the Worker. Failed refreshes retain the last good frame; only a cold cache answers 503.
import { createStaleJsonFeed } from './stale-json-feed.mjs';
import { MOVERS_PATH, buildMoversSnapshot } from '../src/data/movers.js';

export { MOVERS_PATH };

// A frame is "stale" only when its source data is older than this. Comparing against the 30 s cache TTL marked every
// collector-sourced frame (rewritten every ~5 min) stale, so the board froze on its first frame (fixed 2026-10-18).
export const MOVERS_MAX_SOURCE_AGE_MS = 15 * 60 * 1000;
export function createMoversFeed({ readBinanceRows = null, readCoins = null, readMarketEvents = null, ttlMs = 30 * 1000, maxSourceAgeMs = MOVERS_MAX_SOURCE_AGE_MS, timeoutMs = 3000, now = Date.now, log = () => {} } = {}) {
  let lastWide = null;
  const safe = async (fn) => { if (typeof fn !== 'function') return null; try { return await fn(); } catch (error) { log(`movers: ${error?.message || error}`); return null; } };
  return createStaleJsonFeed({ ttlMs, timeoutMs, now, log, load: async () => {
    const [binanceRows, coins, marketEvents] = await Promise.all([safe(readBinanceRows), safe(readCoins), safe(readMarketEvents)]);
    const next = buildMoversSnapshot({ binanceRows, coins, marketEvents, now: now() });
    // Binance frames keep the strict TTL (expired cached rows must not pose as new); collector frames get the source bound.
    if (next && now() - Date.parse(next.generatedAt) >= (next.source === 'market-events' ? maxSourceAgeMs : ttlMs)) return { ...next, stale: true };
    if (next?.up.length && next?.down.length) { lastWide = next; return next; }
    // A degraded collector universe must not replace either side of a good board.
    if (lastWide) return { ...lastWide, stale: true };
    return next;
  } });
}
