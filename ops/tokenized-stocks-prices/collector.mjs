#!/usr/bin/env node
// Public, no-auth market snapshots. Listings come exclusively from the supplied directory snapshot.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import { atomicWriteJson, boundedFetch } from "../market-collector/resilience.mjs";
import { TS_TICKERS_ALL } from "../../pilot-01-prototype/src/data/tokenized-stocks-routes.js";

export const MAX_AGE_MS = 15 * 60_000;
const FUTURE_SKEW_MS = 60_000;
const root = fileURLToPath(new URL("../../", import.meta.url));
const source = (venueId, lane, endpoint, kind = "ticker") => ({ id: `${venueId}:${lane}:${kind}`, venueId, lane, endpoint, kind });
export const SOURCES = Object.freeze([
  source("bitget", "spot", "https://api.bitget.com/api/v3/market/tickers?category=SPOT"),
  source("bitget", "perp", "https://api.bitget.com/api/v3/market/tickers?category=USDT-FUTURES"),
  source("bybit", "spot", "https://api.bybit.com/v5/market/tickers?category=spot"),
  source("bybit", "perp", "https://api.bybit.com/v5/market/tickers?category=linear"),
  source("okx", "spot", "https://www.okx.com/api/v5/market/tickers?instType=SPOT"),
  source("okx", "perp", "https://www.okx.com/api/v5/market/tickers?instType=SWAP"),
  source("okx", "perp", "https://www.okx.com/api/v5/market/index-tickers?quoteCcy=USDT", "index"),
  source("binance", "spot", "https://api.binance.com/api/v3/ticker/24hr"),
  source("binance", "perp", "https://fapi.binance.com/fapi/v1/ticker/24hr"),
  source("binance", "perp", "https://fapi.binance.com/fapi/v1/premiumIndex", "index"),
  source("gate-io", "spot", "https://api.gateio.ws/api/v4/spot/tickers"),
  source("gate-io", "perp", "https://api.gateio.ws/api/v4/futures/usdt/tickers"),
  source("mexc", "spot", "https://api.mexc.com/api/v3/ticker/24hr"),
  source("mexc", "perp", "https://api.mexc.com/api/v1/contract/ticker"),
  source("kraken", "spot", "https://api.kraken.com/0/public/AssetPairs?aclass_base=tokenized_asset", "pairs"),
  source("kraken", "spot", "https://api.kraken.com/0/public/Ticker?asset_class=tokenized_asset"),
  source("kraken", "perp", "https://futures.kraken.com/derivatives/api/v3/tickers"),
]);

export function strictNumber(value) {
  if (typeof value !== "number" && (typeof value !== "string" || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value))) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
const positive = value => { const n = strictNumber(value); return n > 0 ? n : null; };
const nonnegative = value => { const n = strictNumber(value); return n !== null && n >= 0 ? n : null; };
const change = (last, open) => positive(last) !== null && positive(open) !== null ? (Number(last) / Number(open) - 1) * 100 : null;
const ratioPercent = value => { const n = strictNumber(value); return n === null ? null : n * 100; };
const timestamp = value => typeof value === "string" && value.includes("T") ? Date.parse(value) : strictNumber(value);
export const fresh = (value, now) => Number.isFinite(timestamp(value)) && timestamp(value) > 0 && timestamp(value) > now - MAX_AGE_MS && timestamp(value) <= now + FUTURE_SKEW_MS;
const iso = value => Number.isFinite(timestamp(value)) && timestamp(value) > 0 ? new Date(timestamp(value)).toISOString() : null;
const upper = value => typeof value === "string" ? value.toUpperCase() : "";
function array(value) { if (!Array.isArray(value)) throw new Error("invalid market-data array"); return value; }
function object(value) { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid market-data object"); return value; }

/** Raw exchange response -> canonical metrics (identity is still validated against the directory below). */
export function parseSource(def, raw, observedAt) {
  const { venueId: venue, lane, kind } = def;
  let entries, responseTime = observedAt;
  if (venue === "bitget") {
    if (raw?.code !== "00000") throw new Error("Bitget API failure");
    entries = array(raw.data); responseTime = raw.requestTime;
  } else if (venue === "bybit") {
    if (raw?.retCode !== 0 || raw?.result?.category !== (lane === "spot" ? "spot" : "linear")) throw new Error("Bybit API failure/category mismatch");
    entries = array(raw.result.list); responseTime = raw.time;
  } else if (venue === "okx") {
    if (raw?.code !== "0") throw new Error("OKX API failure");
    entries = array(raw.data);
  } else if (venue === "mexc" && lane === "perp") {
    if (raw?.success !== true || raw?.code !== 0) throw new Error("MEXC API failure");
    entries = array(raw.data);
  } else if (venue === "kraken") {
    if (lane === "spot") {
      if (!Array.isArray(raw?.error) || raw.error.length) throw new Error("Kraken API failure");
      entries = Object.entries(object(raw.result)).map(([instrument, value]) => ({ instrument, ...value }));
    } else {
      if (raw?.result !== "success") throw new Error("Kraken Futures API failure");
      entries = array(raw.tickers); responseTime = raw.serverTime;
    }
  } else entries = array(raw);
  if (kind === "pairs") return { rows: entries, updatedAt: iso(observedAt), timestampBasis: "observed" };

  const rows = entries.flatMap(x => {
    if (!x || typeof x !== "object") return [];
    let instrument, lastPrice, change24hPct, quoteVolume24h, indexPrice = null, at = responseTime;
    let timestampBasis = ["bitget", "bybit"].includes(venue) || (venue === "kraken" && lane === "perp") ? "exchange" : "observed";
    if (venue === "bitget") {
      if (x.category !== (lane === "spot" ? "SPOT" : "USDT-FUTURES")) return [];
      instrument = x.symbol; lastPrice = x.lastPrice; change24hPct = change(x.lastPrice, x.openPrice24h);
      quoteVolume24h = x.turnover24h; indexPrice = lane === "perp" ? x.indexPrice : null; at = x.ts;
      timestampBasis = "exchange";
    } else if (venue === "bybit") {
      instrument = x.symbol; lastPrice = x.lastPrice; change24hPct = ratioPercent(x.price24hPcnt);
      quoteVolume24h = x.turnover24h; indexPrice = lane === "perp" ? x.indexPrice : null;
      // usdIndexPrice on spot is the account collateral valuation, not a stock reference.
    } else if (venue === "okx") {
      instrument = x.instId; lastPrice = x.last; change24hPct = change(x.last, x.open24h);
      // Swap volCcy24h is BASE currency. Never publish it as quote turnover.
      quoteVolume24h = lane === "spot" ? x.volCcy24h : null;
      indexPrice = kind === "index" ? x.idxPx : null; at = x.ts; timestampBasis = "exchange";
    } else if (venue === "binance" || (venue === "mexc" && lane === "spot")) {
      instrument = x.symbol; lastPrice = x.lastPrice; change24hPct = change(x.lastPrice, x.openPrice);
      quoteVolume24h = x.quoteVolume; at = kind === "index" ? x.time : x.closeTime;
      indexPrice = kind === "index" ? x.indexPrice : null; timestampBasis = "exchange";
    } else if (venue === "mexc") {
      instrument = x.symbol; lastPrice = x.lastPrice; change24hPct = ratioPercent(x.riseFallRate);
      quoteVolume24h = x.amount24; indexPrice = x.indexPrice; at = x.timestamp; timestampBasis = "exchange";
    } else if (venue === "gate-io") {
      instrument = lane === "spot" ? x.currency_pair : x.contract; lastPrice = x.last;
      change24hPct = strictNumber(x.change_percentage);
      quoteVolume24h = lane === "spot" ? x.quote_volume : x.volume_24h_quote;
      indexPrice = lane === "perp" ? x.index_price : null;
    } else if (venue === "kraken" && lane === "spot") {
      instrument = x.instrument; lastPrice = x.c?.[0];
      // o is today's midnight-UTC open, not a rolling 24h open. Do not mislabel it.
      change24hPct = null;
      // Kraken publishes 24h base volume and VWAP, not exact quote turnover.
      quoteVolume24h = null;
    } else if (venue === "kraken") {
      if (x.tag !== "perpetual" || x.suspended === true) return [];
      instrument = x.symbol; lastPrice = x.last; change24hPct = change(x.last, x.open24h);
      quoteVolume24h = x.volumeQuote; indexPrice = x.indexPrice;
      // lastTime is the last trade; do not refresh an old last trade just because the API responded.
      at = x.lastTime; timestampBasis = "exchange";
    }
    if (typeof instrument !== "string" || !fresh(at, observedAt)) return [];
    if (kind !== "index" && positive(lastPrice) === null) return [];
    const pct = strictNumber(change24hPct);
    return [{ instrument, lastPrice: positive(lastPrice), change24hPct: pct !== null && pct > -100 ? pct : null, quoteVolume24h: nonnegative(quoteVolume24h), indexPrice: positive(indexPrice), updatedAt: iso(at), timestampBasis }];
  });
  const newest = rows.reduce((at, row) => Math.max(at, Date.parse(row.updatedAt)), 0);
  // Some APIs have per-instrument clocks only; keep their newest accepted generation time on the source.
  const sourceAt = ["bitget", "bybit"].includes(venue) || (venue === "kraken" && lane === "perp") ? responseTime : newest || observedAt;
  return { rows, updatedAt: iso(sourceAt), timestampBasis: rows.some(row => row.timestampBasis === "exchange") ? "exchange" : "observed" };
}

/** Match only exact snapshot instruments, including explicitly recorded alternate token families. */
export function listedInstrument(def, instrument, snapshot, pairs = []) {
  const items = snapshot?.venues?.[def.venueId]?.[def.lane]?.items;
  if (!items || typeof items !== "object") return null;
  const id = upper(instrument);
  for (const [ticker, item] of Object.entries(items)) {
    if (!TS_TICKERS_ALL.includes(ticker) || typeof item?.sym !== "string") continue;
    for (const sym of [item.sym, item.alt].filter(x => typeof x === "string")) {
      let matches = false, quoteCurrency = "USDT";
      if (def.lane === "perp") {
        if (def.venueId === "kraken") { matches = /^([A-Z0-9]+)x PERP$/.test(sym) && id === `PF_${upper(sym.replace(/ PERP$/, ""))}USD`; quoteCurrency = "USD"; }
        else if (["gate-io", "mexc"].includes(def.venueId)) matches = /^[A-Z0-9.]+_USDT$/.test(id) && id.replace("_", "") === upper(sym);
        else matches = id === upper(sym) && (def.venueId === "okx" ? /-USDT-SWAP$/.test(id) : /USDT$/.test(id));
      } else if (def.venueId === "kraken") {
        const pair = pairs.find(pair => pair.instrument === instrument && pair.base === sym && pair.aclass_base === "tokenized_asset" && ["online", "post_only"].includes(pair.status) && /^(Z)?USD$/.test(pair.quote));
        matches = Boolean(pair); quoteCurrency = "USD";
      } else {
        const separator = ["okx"].includes(def.venueId) ? "-" : def.venueId === "gate-io" ? "_" : "";
        matches = id === `${upper(sym)}${separator}USDT`;
      }
      if (matches) return { ticker, quoteCurrency, instrument: sym };
    }
  }
  return null;
}

export function buildFeed(snapshot, results, now = Date.now()) {
  const sources = results.map(result => ({ id: result.def.id, venueId: result.def.venueId, endpoint: result.def.endpoint, kind: result.def.kind, updatedAt: result.updatedAt ?? null, checkedAt: result.checkedAt, status: result.status, timestampBasis: result.timestampBasis ?? null, ...(result.error ? { error: result.error } : {}) }));
  const pairs = results.find(result => result.def.kind === "pairs" && result.status === "ok" && fresh(result.updatedAt, now))?.rows || [];
  const rows = [];
  for (const result of results) {
    const def = result.def;
    if (def.kind !== "ticker" || result.status !== "ok" || !fresh(result.updatedAt, now)) continue;
    for (const row of result.rows) {
      if (!fresh(row.updatedAt, now)) continue;
      const listing = listedInstrument(def, row.instrument, snapshot, pairs);
      if (!listing) continue;
      let indexPrice = row.indexPrice, indexSourceId = null, indexUpdatedAt = null;
      if (def.lane === "perp" && ["binance", "okx"].includes(def.venueId)) {
        const indexes = results.find(item => item.def.venueId === def.venueId && item.def.kind === "index" && item.status === "ok" && fresh(item.updatedAt, now));
        const key = def.venueId === "okx" ? row.instrument.replace(/-SWAP$/, "") : row.instrument;
        const reference = indexes?.rows.find(item => item.instrument === key && fresh(item.updatedAt, now));
        indexPrice = reference?.indexPrice ?? null;
        if (indexPrice !== null) { indexSourceId = indexes.def.id; indexUpdatedAt = reference.updatedAt; }
      }
      const premiumPct = indexPrice > 0 ? (row.lastPrice / indexPrice - 1) * 100 : null;
      rows.push({ ...listing, venueId: def.venueId, exchangeInstrument: row.instrument, marketType: def.lane === "spot" ? "spot" : "perpetual", lastPrice: row.lastPrice, change24hPct: row.change24hPct, quoteVolume24h: row.quoteVolume24h, indexPrice, premiumPct: Number.isFinite(premiumPct) ? premiumPct : null, updatedAt: row.updatedAt, sourceId: def.id, timestampBasis: row.timestampBasis, ...(indexSourceId ? { indexSourceId, indexUpdatedAt } : {}) });
    }
  }
  return { schema: 1, updatedAt: new Date(now).toISOString(), sources, rows };
}

/** Sequential bulk requests, a 500ms minimum gap, bounded transport/body reads, no retry storms. */
export async function collectPrices({ snapshot, fetchImpl = fetch, now = Date.now, wait = sleep, gapMs = 500, definitions = SOURCES } = {}) {
  const http = boundedFetch(fetchImpl, { timeoutMs: 12_000 });
  const results = [], backoff = new Map();
  for (const def of definitions) {
    if (results.length) await wait(Math.max(500, gapMs));
    const checkedAt = new Date(now()).toISOString();
    const host = new URL(def.endpoint).host;
    try {
      if ((backoff.get(host) || 0) > now()) throw new Error("venue rate-limit backoff");
      const response = await http(def.endpoint, { headers: { Accept: "application/json", "User-Agent": "NexuAlphaTokenizedStocksPrices/1.0 (+https://nexualpha.com)" } });
      if (!response.ok) {
        if ([418, 429].includes(response.status)) {
          const retry = response.headers?.get("retry-after");
          const seconds = strictNumber(retry);
          const until = seconds === null ? Date.parse(retry || "") : now() + Math.max(60, seconds) * 1000;
          backoff.set(host, Number.isFinite(until) ? Math.max(now() + 60_000, until) : now() + 60_000);
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const parsed = parseSource(def, await response.json(), now());
      if (!fresh(parsed.updatedAt, now())) throw new Error("stale or invalid source timestamp");
      results.push({ def, ...parsed, checkedAt, status: "ok" });
    } catch (error) {
      results.push({ def, rows: [], updatedAt: null, checkedAt, status: "error", error: String(error?.message || error).slice(0, 180) });
    }
  }
  return buildFeed(snapshot, results, now());
}

async function main() {
  const arg = name => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; };
  const input = arg("--listings") || process.env.TS_LIVE_FILE || path.join(root, "pilot-01-prototype/public/intel/tokenized-stocks.json");
  const output = arg("--out") || process.env.TS_PRICES_FILE || "/var/lib/nexualpha-market/tokenized-stocks-prices.json";
  const snapshot = JSON.parse(await readFile(input, "utf8"));
  if (snapshot?.schema !== 1 || !snapshot.venues) throw new Error("invalid listing snapshot; nothing written");
  const feed = await collectPrices({ snapshot });
  atomicWriteJson(output, feed);
  const coverage = Object.fromEntries([...new Set(SOURCES.map(source => source.venueId))].map(venue => [venue, { rows: feed.rows.filter(row => row.venueId === venue).length, tickers: new Set(feed.rows.filter(row => row.venueId === venue).map(row => row.ticker)).size }]));
  console.log(JSON.stringify({ updatedAt: feed.updatedAt, output, coverage, sources: feed.sources.map(({ id, status, error }) => ({ id, status, ...(error ? { error } : {}) })) }));
  if (!feed.rows.length) process.exitCode = 2;
}
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
