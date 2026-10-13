// Public estimated liquidation-level feed. Sources are unauthenticated market endpoints:
// Binance USD-M openInterest + ticker/price, OKX public open-interest + market ticker, and Bybit V5 tickers.
// The output is cached server-side for <=60 s; failures are reported per venue and never converted to zero OI.
import { combineVenueObservations, LIQUIDATION_LEVEL_SYMBOLS } from "../src/data/liquidation-levels.js";

export const LIQUIDATION_LEVELS_PATH = "/api/liquidation-levels";

const UA = "NexuAlphaLiquidationLevels/1.0 (+https://nexualpha.com)";
const CACHE_TTL_MS = 60_000;

const num = (value) => {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const positive = (value) => {
  const parsed = num(value);
  return parsed && parsed > 0 ? parsed : null;
};

async function getJson(url, fetchImpl) {
  const res = await fetchImpl(url, { headers: { accept: "application/json", "user-agent": UA }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const normalizeLiquidationLevelSources = {
  binance(symbol, [openInterest, ticker]) {
    const price = positive(ticker?.price);
    const contracts = positive(openInterest?.openInterest);
    if (!price || !contracts) return null;
    return { venue: "binance", symbol, price, openInterestUsd: contracts * price };
  },
  okx(symbol, [openInterest, ticker]) {
    const price = positive(ticker?.data?.[0]?.last);
    const row = openInterest?.data?.[0];
    if (!price || !row) return null;
    const oiUsd = positive(row.oiUsd);
    const oiCcy = positive(row.oiCcy);
    const oiContracts = positive(row.oi);
    const contractValue = positive(row.ctVal);
    const openInterestUsd = oiUsd || (oiCcy ? oiCcy * price : (oiContracts && contractValue ? oiContracts * contractValue * price : null));
    return openInterestUsd ? { venue: "okx", symbol, price, openInterestUsd } : null;
  },
  bybit(symbol, ticker) {
    const rows = ticker?.result?.list || [];
    const row = rows.find((item) => item.symbol === `${symbol}USDT`);
    const price = positive(row?.lastPrice);
    const oiValue = positive(row?.openInterestValue);
    const oiBase = positive(row?.openInterest);
    const openInterestUsd = oiValue || (price && oiBase ? price * oiBase : null);
    return price && openInterestUsd ? { venue: "bybit", symbol, price, openInterestUsd } : null;
  },
};

export const LIQUIDATION_LEVEL_SOURCES = {
  binance: async (fetchImpl) => {
    const rows = await Promise.all(LIQUIDATION_LEVEL_SYMBOLS.map(async (symbol) => {
      const pair = `${symbol}USDT`;
      return normalizeLiquidationLevelSources.binance(symbol, await Promise.all([
        getJson(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${pair}`, fetchImpl),
        getJson(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${pair}`, fetchImpl),
      ]));
    }));
    return rows.filter(Boolean);
  },
  okx: async (fetchImpl) => {
    const rows = await Promise.all(LIQUIDATION_LEVEL_SYMBOLS.map(async (symbol) => {
      const instId = `${symbol}-USDT-SWAP`;
      return normalizeLiquidationLevelSources.okx(symbol, await Promise.all([
        getJson(`https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=${instId}`, fetchImpl),
        getJson(`https://www.okx.com/api/v5/market/ticker?instId=${instId}`, fetchImpl),
      ]));
    }));
    return rows.filter(Boolean);
  },
  bybit: async (fetchImpl) => {
    const ticker = await getJson("https://api.bybit.com/v5/market/tickers?category=linear", fetchImpl);
    return LIQUIDATION_LEVEL_SYMBOLS.map((symbol) => normalizeLiquidationLevelSources.bybit(symbol, ticker)).filter(Boolean);
  },
};

function timeout(ms) {
  let id;
  const promise = new Promise((resolve) => { id = setTimeout(resolve, ms); });
  return { promise, cancel: () => clearTimeout(id) };
}

export async function buildLiquidationLevels({ now = Date.now, fetchImpl = fetch, sources = LIQUIDATION_LEVEL_SOURCES } = {}) {
  const readNow = typeof now === "function" ? now : () => now;
  const coverage = {};
  const observations = [];
  const loaded = await Promise.all(Object.entries(sources).map(async ([venue, load]) => {
    try {
      const rows = await load(fetchImpl);
      if (!rows.length) throw new Error("no usable rows");
      return { venue, ok: true, rows };
    } catch (error) {
      return { venue, ok: false, error: String(error?.message || error) };
    }
  }));
  for (const result of loaded) {
    if (result.ok) {
      coverage[result.venue] = { ok: true, symbols: result.rows.map((row) => row.symbol) };
      observations.push(...result.rows);
    } else {
      coverage[result.venue] = { ok: false, error: result.error };
    }
  }
  const symbols = LIQUIDATION_LEVEL_SYMBOLS.map((symbol) => combineVenueObservations(symbol, observations)).filter(Boolean);
  if (!symbols.length) return null;
  return {
    generatedAt: new Date(readNow()).toISOString(),
    cacheTtlMs: CACHE_TTL_MS,
    model: {
      leverageTiers: [10, 25, 50, 100],
      assumptions: "Estimated levels use public market-wide open interest, equal leverage-tier weights, balanced long/short sides, and a simplified maintenance-margin model. They are not real exchange position data.",
    },
    coverage,
    symbols,
  };
}

export function createLiquidationLevelsFeed({ ttlMs = CACHE_TTL_MS, fetchImpl = fetch, sources = LIQUIDATION_LEVEL_SOURCES, now = Date.now, log = () => {} } = {}) {
  const boundedTtlMs = Math.min(Math.max(1_000, ttlMs), CACHE_TTL_MS);
  let snapshot = null, refreshedAt = 0, attemptedAt = null, pending = null;
  const refresh = () => {
    if (pending) return pending;
    pending = buildLiquidationLevels({ fetchImpl, sources, now })
      .then((next) => {
        if (next) {
          snapshot = next;
          refreshedAt = now();
        }
      })
      .catch((error) => log(`liquidation levels refresh failed: ${error?.message || error}`))
      .finally(() => { attemptedAt = now(); pending = null; });
    return pending;
  };
  const read = async ({ waitMs = 2500 } = {}) => {
    const age = now() - refreshedAt;
    if (snapshot && age < boundedTtlMs) return snapshot;
    if (attemptedAt != null && now() - attemptedAt < boundedTtlMs) return null;
    const running = refresh();
    const timer = timeout(waitMs);
    try {
      await Promise.race([running, timer.promise]);
    } finally {
      timer.cancel();
    }
    return snapshot && now() - refreshedAt < boundedTtlMs ? snapshot : null;
  };
  const respond = async (method = "GET") => {
    const data = await read();
    const headers = { "content-type": "application/json; charset=utf-8", "x-content-type-options": "nosniff", "x-robots-tag": "noindex" };
    if (!data) return new Response(method === "HEAD" ? null : JSON.stringify({ status: "unavailable" }), { status: 503, headers: { ...headers, "cache-control": "no-store" } });
    return new Response(method === "HEAD" ? null : JSON.stringify(data), { status: 200, headers: { ...headers, "cache-control": "no-store" } });
  };
  return { refresh, read, respond };
}
