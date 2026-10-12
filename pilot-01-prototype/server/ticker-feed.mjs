// Live ticker feed (2026-10-13) for the slim price bar on the home page and /flash. The server asks Binance USDT-M for
// the 24h tickers at most once per `ttlMs` (15 s) — one public request, no key — and every visitor reads that cached
// snapshot from /api/ticker.json (browsers poll it every 30 s; nobody's browser calls an exchange). When Binance does
// not answer, the market collector's feed (refreshed every 5 minutes, already read for /liquidations) fills in; when
// neither has data the endpoint answers 503 and the bar keeps the frame it has.
import { TICKER_PATH, tickerFromBinance, tickerFromMarketEvents } from '../src/data/ticker.js';

export { TICKER_PATH };
const UA = 'NexuAlphaTicker/1.0 (+https://nexualpha.com)';
const BINANCE_URL = 'https://fapi.binance.com/fapi/v1/ticker/24hr';

export function createTickerFeed({ ttlMs = 15 * 1000, staleMs = 10 * 60 * 1000, fetchImpl = fetch, readMarketEvents = null, now = Date.now, log = () => {} } = {}) {
  let snapshot = null, at = 0, pending = null;
  const fromBinance = async () => {
    const res = await fetchImpl(BINANCE_URL, { headers: { accept: 'application/json', 'user-agent': UA }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`binance HTTP ${res.status}`);
    return tickerFromBinance(await res.json(), { now: now() });
  };
  const fromCollector = async () => (typeof readMarketEvents === 'function' ? tickerFromMarketEvents(await readMarketEvents()) : null);
  const refresh = () => {
    if (pending) return pending;
    pending = (async () => {
      let next = null;
      try { next = await fromBinance(); } catch (error) { log(`ticker: ${error?.message || error}; using the collector feed`); }
      if (!next) { try { next = await fromCollector(); } catch { next = null; } }
      if (next) { snapshot = next; at = now(); }
    })().finally(() => { pending = null; });
    return pending;
  };
  // Resolves to a snapshot no older than `staleMs`, or null. A fresh-enough cache answers at once; an expired one is
  // refreshed in the background (the caller gets the previous frame) unless there is nothing to show yet.
  const read = async ({ waitMs = 2500 } = {}) => {
    const age = now() - at;
    if (snapshot && age < ttlMs) return snapshot;
    const running = refresh();
    if (!snapshot) await Promise.race([running, new Promise((resolve) => setTimeout(resolve, waitMs))]);
    return snapshot && now() - at <= staleMs ? snapshot : null;
  };
  const respond = async (method = 'GET') => {
    const data = await read();
    const headers = { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex' };
    if (!data) return new Response(method === 'HEAD' ? null : JSON.stringify({ status: 'unavailable' }), { status: 503, headers: { ...headers, 'cache-control': 'no-store' } });
    return new Response(method === 'HEAD' ? null : JSON.stringify(data), { status: 200, headers: { ...headers, 'cache-control': 'public, max-age=10, stale-while-revalidate=20' } });
  };
  return { read, respond, refresh };
}
