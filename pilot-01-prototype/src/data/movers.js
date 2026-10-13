// Home "Today's movers" board (owner 2026-10-13, replaces the static "Popular coins" chip wall). Server-side builder
// (server/movers-feed.mjs, the Worker head and tests): the browser never calls an exchange; it receives this already
// formatted snapshot from /api/movers.json or the prerender state "movers". Built only from data the site already
// collects: the Binance USDT-M 24h tickers the ticker feed caches every 15 s (fallback: the market collector's feed),
// the coin universe in coins.json (top ~100 by market cap, so thin coins never dominate) and the collector's
// liquidation / funding numbers for the headline line. Numbers are formatted once (en-US digits, U+2212 minus), so the
// server frame, the hydrated frame and every refresh render identical strings for identical data.
import { fmtTickerChange, fmtTickerPrice, tickerDir } from "./ticker.js";

export const MOVERS_PATH = "/api/movers.json";
export const MOVERS_ROWS = 5;
export const MOVERS_UNIVERSE_RANK = 100;
// A contract with less 24h quote volume than this is ignored (a stale or barely traded perpetual never ranks).
export const MOVERS_MIN_VOLUME_USD = 2e6;
const SKIP_CATEGORIES = new Set(["stablecoin", "gold"]);
const MINUS = "−";

const num = (value) => { const n = Number(value); return Number.isFinite(n) ? n : null; };

/** Compact USD in en-US digits: $133.4M, $2.38M, $812.0K, $1.21B. */
export function fmtUsdCompact(value) {
  const n = num(value);
  if (n === null || n <= 0) return "—";
  const [div, unit] = n >= 1e9 ? [1e9, "B"] : n >= 1e6 ? [1e6, "M"] : n >= 1e3 ? [1e3, "K"] : [1, ""];
  const v = n / div;
  return `$${v.toFixed(unit ? (v < 10 ? 2 : 1) : 0)}${unit}`;
}
/** Funding rate per period as a signed percentage with 4 decimals: +0.0085%. */
export function fmtRatePct(rate) {
  const n = num(rate);
  if (n === null) return "—";
  const abs = Math.abs(n * 100).toFixed(4);
  return Number(abs) === 0 ? "0.0000%" : `${n > 0 ? "+" : MINUS}${abs}%`;
}

/** Symbol -> { slug, name, price } for the top coins by market cap in a coins.json snapshot (stablecoins and gold excluded). */
export function moversUniverse(coins, maxRank = MOVERS_UNIVERSE_RANK) {
  const list = Array.isArray(coins?.coins) ? coins.coins : Array.isArray(coins) ? coins : [];
  const out = new Map();
  for (const c of list) {
    const rank = num(c?.rank);
    if (rank === null || rank > maxRank || SKIP_CATEGORIES.has(c?.category)) continue;
    const sym = String(c?.symbol || "").toUpperCase();
    if (!/^[A-Z0-9]{1,15}$/.test(sym) || typeof c?.slug !== "string" || !/^[a-z0-9-]+$/.test(c.slug) || out.has(sym)) continue;
    out.set(sym, { slug: c.slug, name: String(c.name || sym), price: num(c.price) });
  }
  return out;
}

// "1000PEPEUSDT" is a contract on 1000 PEPE: same 24h change, price per coin = contract price / 1000.
function splitContract(symbol) {
  const m = /^(1000000|1000)?([A-Z0-9]+)USDT$/.exec(String(symbol || ""));
  return m ? { base: m[2], mult: m[1] ? Number(m[1]) : 1 } : null;
}

const toRow = (sym, coin, price, change) => ({ sym, slug: coin.slug, name: coin.name, price: fmtTickerPrice(price), change: fmtTickerChange(change), dir: tickerDir(change) });

function rank(candidates) {
  const byChange = (a, b) => b.pct - a.pct;
  const up = candidates.filter((c) => c.pct > 0).sort(byChange).slice(0, MOVERS_ROWS);
  const down = candidates.filter((c) => c.pct < 0).sort((a, b) => a.pct - b.pct).slice(0, MOVERS_ROWS);
  return { up: up.map((c) => c.row), down: down.map((c) => c.row) };
}

/** Gainers / losers from Binance USDT-M `GET /fapi/v1/ticker/24hr` rows, limited to the coin universe. */
export function moversFromBinance(rows, universe) {
  if (!Array.isArray(rows) || !(universe instanceof Map) || !universe.size) return null;
  const seen = new Map();
  for (const r of rows) {
    const contract = splitContract(r?.symbol);
    if (!contract || !universe.has(contract.base)) continue;
    const pct = num(r.priceChangePercent), price = num(r.lastPrice), vol = num(r.quoteVolume);
    if (pct === null || price === null || price <= 0 || (vol ?? 0) < MOVERS_MIN_VOLUME_USD) continue;
    // Same ticker, different token: a contract priced more than 3x away from the coin's snapshot price is not that coin.
    const ref = universe.get(contract.base).price;
    if (ref > 0 && (price / contract.mult / ref > 3 || ref / (price / contract.mult) > 3)) continue;
    // Prefer the plain contract over a 1000x one, then the more traded one.
    const prev = seen.get(contract.base);
    if (prev && (prev.mult < contract.mult || (prev.mult === contract.mult && prev.vol >= vol))) continue;
    seen.set(contract.base, { mult: contract.mult, vol, pct, row: toRow(contract.base, universe.get(contract.base), price / contract.mult, pct) });
  }
  if (seen.size < MOVERS_ROWS * 2) return null;
  return { source: "binance-usdm", ...rank([...seen.values()]) };
}

/** Fallback from the market collector feed (market-events.json: majors with price, movers by 24h change). */
export function moversFromMarketEvents(feed, universe) {
  if (!(universe instanceof Map) || !universe.size) return null;
  const market = feed?.market || {};
  const seen = new Map();
  for (const m of [...(Array.isArray(market.majors) ? market.majors : []), ...(Array.isArray(market.movers) ? market.movers : [])]) {
    const contract = splitContract(m?.symbol);
    if (!contract || contract.mult !== 1 || !universe.has(contract.base) || seen.has(contract.base)) continue;
    const pct = num(m.change24hPct);
    if (pct === null) continue;
    seen.set(contract.base, { pct, row: toRow(contract.base, universe.get(contract.base), num(m.price), pct) });
  }
  const ranked = rank([...seen.values()]);
  return ranked.up.length + ranked.down.length ? { source: "market-events", ...ranked } : null;
}

/** Headline from the collector feed: 24h liquidations (total + largest order), else the BTC funding rate. */
export function moversHeadline(feed) {
  const h24 = feed?.liquidations?.h24;
  const total = num(h24?.totalUsd);
  if (total !== null && total > 0) {
    const largest = h24.largest && num(h24.largest.usd) > 0 ? (() => {
      const raw = String(h24.largest.symbol || "");
      const [venueRaw, pair] = raw.includes(":") ? raw.split(":") : ["BINANCE", raw];
      const contract = splitContract(pair);
      const venue = /^okx$/i.test(venueRaw) ? "OKX" : /^binance$/i.test(venueRaw) ? "Binance" : null;
      return contract && venue ? { base: contract.base, side: h24.largest.side === "short" ? "short" : "long", usd: fmtUsdCompact(h24.largest.usd), venue } : null;
    })() : null;
    return { kind: "liquidations", total: fmtUsdCompact(total), largest };
  }
  const btc = (Array.isArray(feed?.funding?.rows) ? feed.funding.rows : []).find((r) => r?.symbol === "BTC");
  const binance = num(btc?.binanceRate), okx = num(btc?.okxRate);
  if (binance !== null || okx !== null) return { kind: "funding", base: "BTC", binance: binance === null ? null : fmtRatePct(binance), okx: okx === null ? null : fmtRatePct(okx) };
  return null;
}

/** The full snapshot, or null when no source gives a usable board. */
export function buildMoversSnapshot({ binanceRows = null, coins = null, marketEvents = null, now = Date.now() } = {}) {
  const universe = moversUniverse(coins);
  const board = moversFromBinance(binanceRows, universe) || moversFromMarketEvents(marketEvents, universe);
  if (!board) return null;
  const at = board.source === "market-events" && Number.isFinite(Date.parse(marketEvents?.generatedAt)) ? Date.parse(marketEvents.generatedAt) : now;
  return { generatedAt: new Date(at).toISOString(), source: board.source, up: board.up, down: board.down, headline: moversHeadline(marketEvents) };
}

const isRow = (r) => Boolean(r && typeof r.sym === "string" && typeof r.slug === "string" && typeof r.price === "string" && typeof r.change === "string");
/** True for a snapshot the board can render (shape check for anything read from the network or prerender state). */
export function isMoversSnapshot(value) {
  return Boolean(value && Array.isArray(value.up) && Array.isArray(value.down) && value.up.length + value.down.length > 0
    && value.up.every(isRow) && value.down.every(isRow) && Number.isFinite(Date.parse(value.generatedAt)));
}
