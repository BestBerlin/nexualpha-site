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
  const sourceStale = (snapshot, at) => {
    const age = at - Date.parse(snapshot.generatedAt);
    // Binance frames are refreshed every ttlMs; a frame is only stale once several refreshes have been missed.
    const maxAge = snapshot.source === 'market-events' ? maxSourceAgeMs : Math.max(ttlMs * 4, 2 * 60 * 1000);
    return !Number.isFinite(age) || age < 0 || age >= maxAge;
  };
  return createStaleJsonFeed({ ttlMs, timeoutMs, now, log, isSourceStale: sourceStale, load: async () => {
    const [binanceRows, coins, marketEvents] = await Promise.all([safe(readBinanceRows), safe(readCoins), safe(readMarketEvents)]);
    // Expired wide ticker rows must not shadow a healthy collector fallback.
    const rowsAge = now() - binanceRows?.snapshotAt;
    const usableRows = Number.isFinite(rowsAge) && (rowsAge < 0 || rowsAge >= ttlMs) ? null : binanceRows;
    const next = buildMoversSnapshot({ binanceRows: usableRows, coins, marketEvents, now: now() });
    const marketFailed = marketEvents?.stale === true
      || (marketEvents?.sourceStatus?.markets && marketEvents.sourceStatus.markets.status !== 'ok');
    if (next && (sourceStale(next, now()) || (next.source === 'market-events' && marketFailed))) return { ...next, stale: true };
    if (next?.up.length && next?.down.length) { lastWide = next; return next; }
    // A degraded collector universe must not replace either side of a good board.
    if (lastWide) return { ...lastWide, stale: true };
    return next;
  } });
}
