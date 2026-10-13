// Live ticker feed (2026-10-13) for the slim price bar on the home page and /flash. The server asks Binance USDT-M for
// the 24h tickers at most once per `ttlMs` (15 s) — one public request, no key — and every visitor reads that cached
// snapshot from /api/ticker.json (browsers poll it every 30 s; nobody's browser calls an exchange). When Binance does
// not answer, the market collector's feed (refreshed every 5 minutes, already read for /liquidations) fills in; when
// neither has data the endpoint retains the last good frame; only a cold cache answers 503.
import { createStaleJsonFeed } from './stale-json-feed.mjs';
import { TICKER_PATH, tickerFromBinance, tickerFromMarketEvents } from '../src/data/ticker.js';

export { TICKER_PATH };
const UA = 'NexuAlphaTicker/1.0 (+https://nexualpha.com)';
const BINANCE_URL = 'https://fapi.binance.com/fapi/v1/ticker/24hr';

export function createTickerFeed({ ttlMs = 15 * 1000, staleMs = 10 * 60 * 1000, timeoutMs = 3000, fetchImpl = fetch, readMarketEvents = null, now = Date.now, log = () => {} } = {}) {
  let raw = null;
  const feed = createStaleJsonFeed({ ttlMs, timeoutMs, now, log, load: async (signal) => {
    try {
      const res = await fetchImpl(BINANCE_URL, { headers: { accept: 'application/json', 'user-agent': UA }, signal });
      if (!res.ok) throw new Error(`binance HTTP ${res.status}`);
      const rows = await res.json();
      const next = tickerFromBinance(rows, { now: now() });
      if (next && !signal.aborted) { raw = { rows, at: now() }; return next; }
    } catch (error) { log(`ticker: ${error?.message || error}; using the collector feed`); }
    return typeof readMarketEvents === 'function' ? tickerFromMarketEvents(await readMarketEvents()) : null;
  } });
  // Do not rebuild movers with expired raw rows and stamp them as newly generated.
  const readRows = async () => { await feed.read(); return raw && now() - raw.at < Math.min(ttlMs, staleMs) ? raw.rows : null; };
  return { ...feed, readRows };
}
