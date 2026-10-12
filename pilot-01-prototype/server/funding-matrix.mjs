import {
  FUNDING_MATRIX_PATH,
  FUNDING_MATRIX_SYMBOLS,
  buildFundingMatrix,
  normalizeFundingQuote,
} from "../src/data/funding-matrix.js";

export { FUNDING_MATRIX_PATH };

const UA = "NexuAlphaFundingMatrix/1.0 (+https://nexualpha.com)";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url, fetchImpl, init = {}, { timeoutMs = 4000, deadlineAt = null } = {}) {
  const remainingMs = deadlineAt ? Math.max(1, deadlineAt - Date.now()) : timeoutMs;
  const response = await fetchImpl(url, {
    ...init,
    headers: { accept: "application/json", "user-agent": UA, ...(init.headers || {}) },
    signal: AbortSignal.timeout(Math.min(timeoutMs, remainingMs)),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function eachSymbol(fetchImpl, makeUrl, normalize, { concurrency = 4, delayMs = 40, deadlineMs = 12000 } = {}) {
  const rows = [];
  const deadlineAt = Date.now() + deadlineMs;
  let index = 0;
  async function worker() {
    while (index < FUNDING_MATRIX_SYMBOLS.length && Date.now() < deadlineAt) {
      const symbol = FUNDING_MATRIX_SYMBOLS[index];
      index += 1;
      try {
        const normalized = normalize(symbol, await getJson(makeUrl(symbol), fetchImpl, {}, { deadlineAt }));
        if (Array.isArray(normalized)) rows.push(...normalized);
        else if (normalized) rows.push(normalized);
      } catch {
        // A missing symbol on one venue is not a matrix failure; other venues may still answer it.
      }
      if (delayMs > 0 && Date.now() < deadlineAt) await wait(delayMs);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()));
  return rows;
}

function quote(venue, symbol, rate, intervalHours, nextFundingAt, readAt) {
  return normalizeFundingQuote({ venue, symbol, rate, intervalHours, nextFundingAt, readAt });
}

function binance(premium, info, readAt) {
  const hours = new Map((Array.isArray(info) ? info : []).map((item) => [item.symbol, item.fundingIntervalHours]));
  return (Array.isArray(premium) ? premium : [])
    .map((item) => {
      const match = /^(.+)USDT$/.exec(String(item.symbol || ""));
      return match ? quote("binance", match[1], item.lastFundingRate, hours.get(item.symbol) || 8, item.nextFundingTime, readAt) : null;
    })
    .filter(Boolean);
}

function okx(symbol, json, readAt) {
  const row = json?.data?.[0];
  const intervalHours = (Number(row?.nextFundingTime) - Number(row?.fundingTime)) / 36e5;
  return row ? quote("okx", symbol, row.fundingRate, Number.isFinite(intervalHours) && intervalHours > 0 ? intervalHours : null, row.fundingTime, readAt) : null;
}

function bybit(json, readAt) {
  return (json?.result?.list || [])
    .map((item) => {
      const match = /^(.+)USDT$/.exec(String(item.symbol || ""));
      return match ? quote("bybit", match[1], item.fundingRate, item.fundingIntervalHour, item.nextFundingTime, readAt) : null;
    })
    .filter(Boolean);
}

function bitget(symbol, json, readAt) {
  const row = json?.data?.[0];
  return row ? quote("bitget", symbol, row.fundingRate, row.fundingRateInterval, row.nextUpdate, readAt) : null;
}

function gate(symbol, json, readAt) {
  return json?.name ? quote("gate-io", symbol, json.funding_rate, Number(json.funding_interval) / 3600, Number(json.funding_next_apply) * 1000, readAt) : null;
}

function mexc(symbol, json, readAt) {
  const row = json?.data;
  return row ? quote("mexc", symbol, row.fundingRate, row.collectCycle, row.nextSettleTime, readAt) : null;
}

function htx(symbol, json, readAt) {
  const row = Array.isArray(json?.data) ? json.data[0] : json?.data;
  const intervalHours = (Number(row?.next_funding_time ?? row?.nextFundingTime) - Number(row?.funding_time ?? row?.fundingTime)) / 36e5;
  return row ? quote("htx", symbol, row.funding_rate ?? row.fundingRate, intervalHours, row.funding_time ?? row.fundingTime, readAt) : null;
}

function htxBatch(json, readAt) {
  return (Array.isArray(json?.data) ? json.data : [])
    .map((row) => htx(row?.symbol, { data: row }, readAt))
    .filter(Boolean);
}

function hyperliquid(json, readAt, now = Date.now()) {
  const names = json?.[0]?.universe?.map((item) => item.name) || [];
  const ctxs = json?.[1] || [];
  const nextFundingAt = Math.ceil(now / 36e5) * 36e5;
  return FUNDING_MATRIX_SYMBOLS
    .map((symbol) => {
      // Hyperliquid lists 1000x contracts with a "k" prefix (kPEPE, kSHIB, kBONK); funding rate is size-independent.
      const index = symbol.startsWith("1000") ? names.indexOf(`k${symbol.slice(4)}`) : names.indexOf(symbol);
      return index >= 0 && ctxs[index] ? quote("hyperliquid", symbol, ctxs[index].funding, 1, nextFundingAt, readAt) : null;
    })
    .filter(Boolean);
}

export const FUNDING_MATRIX_SOURCES = Object.freeze({
  binance: async (fetchImpl, { readAt }) => binance(
    await getJson("https://fapi.binance.com/fapi/v1/premiumIndex", fetchImpl),
    await getJson("https://fapi.binance.com/fapi/v1/fundingInfo", fetchImpl),
    readAt,
  ),
  okx: (fetchImpl, { readAt }) => eachSymbol(fetchImpl, (symbol) => `https://www.okx.com/api/v5/public/funding-rate?instId=${symbol}-USDT-SWAP`, (symbol, json) => okx(symbol, json, readAt)),
  bybit: async (fetchImpl, { readAt }) => bybit(await getJson("https://api.bybit.com/v5/market/tickers?category=linear", fetchImpl), readAt),
  bitget: (fetchImpl, { readAt }) => eachSymbol(fetchImpl, (symbol) => `https://api.bitget.com/api/v2/mix/market/current-fund-rate?symbol=${symbol}USDT&productType=usdt-futures`, (symbol, json) => bitget(symbol, json, readAt)),
  "gate-io": (fetchImpl, { readAt }) => eachSymbol(fetchImpl, (symbol) => `https://api.gateio.ws/api/v4/futures/usdt/contracts/${symbol}_USDT`, (symbol, json) => gate(symbol, json, readAt)),
  mexc: (fetchImpl, { readAt }) => eachSymbol(fetchImpl, (symbol) => `https://contract.mexc.com/api/v1/contract/funding_rate/${symbol}_USDT`, (symbol, json) => mexc(symbol, json, readAt)),
  htx: async (fetchImpl, { readAt }) => htxBatch(await getJson("https://api.hbdm.com/linear-swap-api/v1/swap_batch_funding_rate", fetchImpl), readAt),
  hyperliquid: async (fetchImpl, { readAt, now }) => hyperliquid(await getJson("https://api.hyperliquid.xyz/info", fetchImpl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "metaAndAssetCtxs" }) }), readAt, now),
});

export async function buildFundingMatrixSnapshot({ now = Date.now(), fetchImpl = fetch, sources = FUNDING_MATRIX_SOURCES, log = () => {} } = {}) {
  const readAt = new Date(now).toISOString();
  const settled = await Promise.allSettled(Object.entries(sources).map(async ([venue, load]) => {
    const rows = await load(fetchImpl, { now, readAt });
    return { venue, rows: Array.isArray(rows) ? rows : [] };
  }));
  const quotes = [];
  for (const result of settled) {
    if (result.status === "fulfilled") quotes.push(...result.value.rows);
    else log(`funding matrix source failed: ${result.reason?.message || result.reason}`);
  }
  return quotes.length ? buildFundingMatrix(quotes, { generatedAt: readAt }) : null;
}

export function createFundingMatrixReader({ enabled = true, ttlMs = 60000, fetchImpl = fetch, sources = FUNDING_MATRIX_SOURCES, now = () => Date.now(), log = () => {} } = {}) {
  let cached = null;
  let cachedAt = 0;
  let pending = null;
  const maxTtlMs = Math.min(Math.max(1000, ttlMs), 60000);
  async function read() {
    if (!enabled) return null;
    const current = now();
    if (cached && current - cachedAt <= maxTtlMs) return cached;
    if (!pending) {
      pending = buildFundingMatrixSnapshot({ now: current, fetchImpl, sources, log })
        .then((matrix) => {
          if (matrix) {
            cached = matrix;
            cachedAt = current;
          }
          return matrix;
        })
        .finally(() => { pending = null; });
    }
    const matrix = await pending;
    return matrix || (cached && now() - cachedAt <= maxTtlMs ? cached : null);
  }
  return Object.freeze({
    read,
    async respond(method = "GET") {
      const matrix = await read();
      if (!matrix) return new Response(method === "HEAD" ? null : "{}", { status: 503, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
      return new Response(method === "HEAD" ? null : `${JSON.stringify(matrix)}\n`, {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    },
  });
}
