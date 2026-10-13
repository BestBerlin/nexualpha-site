// Live perpetual funding rates (owner 2026-10-10: modules that keep the site alive). Same pattern as intel-feed:
// public endpoints only, refreshed in the background, a venue that fails keeps its last good rows (marked with the
// time they were read), nothing is invented. Memory only; served at FUNDING_PATH.
import { FUNDING_PATH, FUNDING_SYMBOLS, normalizeFunding } from '../src/data/funding-rates.js';

export { FUNDING_PATH };
const UA = 'NexuAlphaFundingReader/1.0 (+https://nexualpha.com)';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, fetchImpl, init = {}) {
  const res = await fetchImpl(url, { ...init, headers: { accept: 'application/json', 'user-agent': UA, ...(init.headers || {}) }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function each(fetchImpl, make, normalize) {
  const rows = [];
  for (const s of FUNDING_SYMBOLS) {
    const r = normalize(s, await getJson(make(s), fetchImpl));
    if (r) rows.push(r);
    await wait(150);
  }
  return rows;
}

export const FUNDING_SOURCES = {
  binance: async (f) => normalizeFunding.binance(await getJson('https://fapi.binance.com/fapi/v1/premiumIndex', f), await getJson('https://fapi.binance.com/fapi/v1/fundingInfo', f).catch(() => [])),
  okx: (f) => each(f, (s) => `https://www.okx.com/api/v5/public/funding-rate?instId=${s}-USDT-SWAP`, normalizeFunding.okx),
  bybit: async (f) => normalizeFunding.bybit(await getJson('https://api.bybit.com/v5/market/tickers?category=linear', f)),
  bitget: (f) => each(f, (s) => `https://api.bitget.com/api/v2/mix/market/current-fund-rate?symbol=${s}USDT&productType=usdt-futures`, normalizeFunding.bitget),
  'gate-io': (f) => each(f, (s) => `https://api.gateio.ws/api/v4/futures/usdt/contracts/${s}_USDT`, normalizeFunding['gate-io']),
  hyperliquid: async (f) => normalizeFunding.hyperliquid(await getJson('https://api.hyperliquid.xyz/info', f, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'metaAndAssetCtxs' }) })),
};

export async function buildFunding(previous, { now = Date.now(), fetchImpl = fetch, sources = FUNDING_SOURCES } = {}) {
  const venues = {};
  let anyOk = false;
  for (const [venue, load] of Object.entries(sources)) {
    try {
      const rows = await load(fetchImpl);
      if (!rows.length) throw new Error('no rows');
      venues[venue] = { ok: true, readAt: new Date(now).toISOString(), rows };
      anyOk = true;
    } catch (error) {
      const prev = previous?.venues?.[venue];
      // keep the last good rows for at most 2 hours, then drop them rather than show stale rates
      if (prev?.rows?.length && now - Date.parse(prev.readAt) < 2 * 36e5) venues[venue] = { ...prev, ok: false, error: String(error?.message || error) };
    }
  }
  return anyOk ? { generatedAt: new Date(now).toISOString(), venues } : null;
}

export function createFundingFeed({ everyMs = 5 * 60 * 1000, enabled = true, fetchImpl = fetch, log = () => {} } = {}) {
  let feed = null, body = null, refreshing = null;
  const refresh = () => {
    if (refreshing) return refreshing;
    refreshing = buildFunding(feed, { fetchImpl })
      .then((next) => { if (next) { feed = next; body = `${JSON.stringify(next)}\n`; log(`funding refreshed: ${Object.keys(next.venues).length} venues`); } })
      .catch((error) => log(`funding refresh failed: ${error?.message || error}`))
      .finally(() => { refreshing = null; });
    return refreshing;
  };
  let timer = null;
  if (enabled) { refresh(); timer = setInterval(refresh, everyMs); timer.unref?.(); }
  return {
    refresh,
    // Home SSR reads the same cached snapshot without waiting for a cold network refresh.
    read: () => feed,
    stop: () => { if (timer) clearInterval(timer); },
    async respond() {
      if (!body && refreshing) await refreshing;
      if (!body) return new Response('Not Found', { status: 404, headers: { 'cache-control': 'no-store' } });
      return new Response(body, { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=120', 'x-content-type-options': 'nosniff' } });
    },
  };
}
