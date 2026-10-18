// Live ticker feed (2026-10-13) for the slim price bar on the home page and /flash. The server asks Binance USDT-M for
// the 24h tickers at most once per `ttlMs` (6 s) — one public request, no key — and every visitor reads that cached
// snapshot from /api/ticker.json (browsers poll it every 12 s; nobody's browser calls an exchange).
// Freshness (2026-10-15, "the ticker never changes"): nginx honours our Cache-Control, so its max-age and SWR stack on
// top of this TTL. With 15 s + max-age=10/SWR=60 a browser saw a new frame only every ~25-40 s, and two polls in a row
// often returned the same frame. 6 s + max-age=4/SWR=8 keeps the served frame under ~15 s old. Binance weight: one
// /fapi/v1/ticker/24hr (weight 40) per 6 s at most = 400 of the 2400/min IP budget. When Binance does
// not answer, the market collector's feed (refreshed every 5 minutes, already read for /liquidations) fills in; when
// neither has data the endpoint retains the last good frame; only a cold cache answers 503.
import { createStaleJsonFeed } from './stale-json-feed.mjs';
import { TICKER_PATH, tickerFromBinance, tickerFromMarketEvents } from '../src/data/ticker.js';

export { TICKER_PATH };
const UA = 'NexuAlphaTicker/1.0 (+https://nexualpha.com)';
const BINANCE_URL = 'https://fapi.binance.com/fapi/v1/ticker/24hr';

export const TICKER_TTL_MS = 6 * 1000;
export const TICKER_CACHE_CONTROL = 'public, max-age=4, stale-while-revalidate=8';
export function createTickerFeed({ ttlMs = TICKER_TTL_MS, staleMs = 10 * 60 * 1000, timeoutMs = 3000, fetchImpl = fetch, readMarketEvents = null, now = Date.now, log = () => {} } = {}) {
  let raw = null;
  const feed = createStaleJsonFeed({ ttlMs, timeoutMs, now, log, cacheControl: TICKER_CACHE_CONTROL, load: async (signal) => {
    try {
      const res = await fetchImpl(BINANCE_URL, { headers: { accept: 'application/json', 'user-agent': UA }, signal });
      if (!res.ok) throw new Error(`binance HTTP ${res.status}`);
      const rows = await res.json();
      const next = tickerFromBinance(rows, { now: now() });
      if (next && !signal.aborted) {
        const at = now();
        // Preserve the source clock when movers reuses a stale wide universe.
        Object.defineProperty(rows, 'snapshotAt', { value: at, configurable: true });
        raw = { rows, at }; return next;
      }
    } catch (error) { log(`ticker: ${error?.message || error}; using the collector feed`); }
    // A timed-out flight is already over; do not start a collector read nobody will wait for.
    if (signal?.aborted) return null;
    const market = typeof readMarketEvents === 'function' ? await readMarketEvents() : null;
    const fallback = tickerFromMarketEvents(market);
    return fallback && (market?.stale || (market?.sourceStatus?.markets && market.sourceStatus.markets.status !== 'ok') || now() - Date.parse(fallback.generatedAt) >= ttlMs) ? { ...fallback, stale: true } : fallback;
  } });
  // SWR uses the last wide snapshot for ten minutes; the consumer retains its original clock.
  const readRows = async () => { await feed.read(); return raw && now() - raw.at < staleMs ? raw.rows : null; };
  return { ...feed, readRows };
}
