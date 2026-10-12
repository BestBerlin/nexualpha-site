#!/usr/bin/env node
// "Where to buy <coin>" data (2026-10-12). Builds the coin universe and, per coin, which of the exchanges we cover list
// it (spot pairs, USDT/USDC perpetuals, deposit networks where the venue publishes them), from public endpoints only:
//
//   CoinGecko (free public API, no key) .. top coins by market cap, price/24h change snapshot, categories, contract
//                                          networks (/coins/markets, /coins/markets?category=, /coins/list?include_platform)
//   OKX      /api/v5/public/instruments (SPOT, SWAP)
//   Binance  /api/v3/exchangeInfo, fapi /fapi/v1/exchangeInfo
//   Bitget   /api/v2/spot/public/symbols, /api/v2/mix/market/contracts, /api/v2/spot/public/coins (networks)
//   Bybit    /v5/market/instruments-info (spot, linear)
//   Gate     /api/v4/spot/currency_pairs, /api/v4/futures/usdt/contracts, /api/v4/spot/currencies (networks)
//   MEXC     /api/v3/exchangeInfo, contract.mexc.com /api/v1/contract/detail
//   HTX      /v2/settings/common/symbols, linear-swap contract_info, /v2/reference/currencies (networks)
//   Kraken   /0/public/AssetPairs, futures /derivatives/api/v3/instruments
//
// Outputs (all committed; the site build never touches the network):
//   public/intel/coins.json                 full snapshot (also served at /intel/coins.json)
//   src/data/coins-data.generated.js        compact table the /coins pages render from (route chunk + SSR)
//   src/data/coins-links.generated.js       top-20 coins for the home page (tiny)
//   src/data/coins-venue-links.generated.js top-20 coins per exchange for the exchange profiles (tiny)
//   src/data/coin-content-<locale>.js       our own coin descriptions per locale (content-source/coins/descriptions)
//   src/data/coins-copy.js                  page template strings per locale (content-source/coins/ui)
//
// Usage:  node scripts/build-coin-availability.mjs            fetch everything, write all outputs
//         node scripts/build-coin-availability.mjs --reuse-universe  keep the last coin list/prices, refresh listings
//         node scripts/build-coin-availability.mjs --offline  rebuild the modules from public/intel/coins.json and the
//                                                             description files (no network)
// Daily refresh: see docs/coins-refresh.md. A venue that fails to answer keeps its previous listing (marked stale) so a
// network blip never empties the table; the run fails only when CoinGecko itself is unreachable.
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COIN_INDEX_LOCALES } from "../src/data/coins-routes.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_JSON = path.join(root, "public", "intel", "coins.json");
const OUT_DATA = path.join(root, "src", "data", "coins-data.generated.js");
const OUT_LINKS = path.join(root, "src", "data", "coins-links.generated.js");
const OUT_VENUE_LINKS = path.join(root, "src", "data", "coins-venue-links.generated.js");
const DESCRIPTION_DIR = path.join(root, "content-source", "coins", "descriptions");
const UI_DIR = path.join(root, "content-source", "coins", "ui");
const OUT_COPY = path.join(root, "src", "data", "coins-copy.js");
const CONTENT_MODULE = (locale) => path.join(root, "src", "data", `coin-content-${locale.toLowerCase()}.js`);

export const COIN_VENUES = Object.freeze(["okx", "binance", "bitget", "bybit", "gate-io", "mexc", "htx", "kraken"]);
const UNIVERSE_SIZE = Number(process.env.COIN_UNIVERSE_SIZE || 200);
const CG = "https://api.coingecko.com/api/v3";
const UA = { "user-agent": "NexuAlpha coin availability (+https://nexualpha.com)", accept: "application/json" };

// Our display categories, in precedence order (a coin gets the first one it belongs to).
export const CATEGORY_SOURCES = Object.freeze([
  ["stablecoin", "stablecoins"],
  ["meme", "meme-token"],
  ["gold", "tokenized-gold"],
  ["oracle", "oracle"],
  ["privacy", "privacy-coins"],
  ["layer2", "layer-2"],
  ["layer1", "layer-1"],
  ["exchange", "centralized-exchange-token-cex"],
  ["dex", "decentralized-exchange"],
  ["ai", "artificial-intelligence"],
  ["rwa", "real-world-assets-rwa"],
  ["lending", "lending-borrowing"],
  ["defi", "decentralized-finance-defi"],
  ["gaming", "gaming"],
  ["depin", "depin"],
  ["storage", "storage"],
  ["payments", "payment-solutions"],
  ["infrastructure", "infrastructure"],
  ["exchange", "exchange-based-tokens"],
  ["layer1", "smart-contract-platform"],
]);
// Derivative receipts (wrapped, bridged, staked, restaked, tokenized funds): not "where to buy" coins.
const EXCLUDED_CATEGORIES = Object.freeze(["wrapped-tokens", "bridged-tokens", "liquid-staking-tokens", "liquid-restaking-tokens",
  "tokenized-btc", "tokenized-treasuries", "tokenized-t-bills", "tokenized-money-market-fund-mmfs", "yield-bearing-tokens", "tokenized-private-credit"]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function getJson(url, { tries = 4, timeout = 45000, pause = 0 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      const response = await fetch(url, { headers: UA, signal: AbortSignal.timeout(timeout) });
      if (response.status === 429) throw Object.assign(new Error(`429 ${url}`), { retryAfter: Number(response.headers.get("retry-after")) || 30 });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      const json = await response.json();
      if (pause) await sleep(pause);
      return json;
    } catch (error) {
      lastError = error;
      await sleep(error.retryAfter ? error.retryAfter * 1000 : 2000 * attempt);
    }
  }
  throw lastError;
}
const firstJson = async (urls, options) => {
  let lastError;
  for (const url of urls) { try { return await getJson(url, options); } catch (error) { lastError = error; } }
  throw lastError;
};

// ------------------------------------------------------------------ symbols
const up = (value) => String(value || "").trim().toUpperCase();
// Kraken's legacy asset names.
const KRAKEN_ALIASES = { XBT: "BTC", XDG: "DOGE" };
// Perpetual multiplier prefixes (1000PEPE, 1000000MOG, 1MBABYDOGE): the base coin is the rest.
function perpBase(symbol, known) {
  const s = up(symbol);
  if (known.has(s)) return s;
  const match = s.match(/^(?:1000000|100000|10000|1000|100|1M|1K)(.+)$/);
  return match && known.has(match[1]) ? match[1] : s;
}
const QUOTE_ORDER = ["USDT", "USDC", "USD", "FDUSD", "EUR", "TRY", "BRL", "BTC", "ETH", "BNB"];
const sortQuotes = (quotes) => [...new Set(quotes)].sort((a, b) => {
  const ia = QUOTE_ORDER.indexOf(a), ib = QUOTE_ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
});

// Each venue loader returns { spot: Map<BASE, quotes[]>, perp: Map<BASE, quotes[]>, networks: Map<BASE, string[]> | null }.
function collector() {
  const spot = new Map(), perp = new Map();
  const add = (map, base, quote) => { if (!base || !quote) return; const list = map.get(base) || []; list.push(quote); map.set(base, list); };
  // prices: BASE -> last USD-stable price on this venue, for the ticker-collision check (see assemble()).
  const prices = new Map();
  const addPrice = (base, quote, last) => {
    const value = Number(last);
    if (!Number.isFinite(value) || value <= 0 || !USD_QUOTES.has(up(quote))) return;
    if (!prices.has(up(base)) || up(quote) === "USDT") prices.set(up(base), value);
  };
  return { spot, perp, prices, addPrice, addSpot: (b, q) => add(spot, up(b), up(q)), addPerp: (b, q) => add(perp, up(b), up(q)) };
}
const PERP_QUOTES = new Set(["USDT", "USDC", "USD"]);
const USD_QUOTES = new Set(["USDT", "USDC", "USD"]);

const VENUE_LOADERS = {
  async okx(known) {
    const c = collector();
    const [spot, swap, tickers] = await Promise.all([
      getJson("https://www.okx.com/api/v5/public/instruments?instType=SPOT"),
      getJson("https://www.okx.com/api/v5/public/instruments?instType=SWAP"),
      getJson("https://www.okx.com/api/v5/market/tickers?instType=SPOT").catch(() => ({ data: [] })),
    ]);
    for (const row of spot.data || []) if (row.state === "live") c.addSpot(row.baseCcy, row.quoteCcy);
    for (const row of tickers.data || []) { const [b, q] = String(row.instId).split("-"); c.addPrice(b, q, row.last); }
    for (const row of swap.data || []) {
      if (row.state !== "live" || row.ctType !== "linear") continue;
      const [base, quote] = String(row.instFamily || "").split("-");
      if (PERP_QUOTES.has(up(quote))) c.addPerp(perpBase(base, known), quote);
    }
    return { ...c, networks: null };
  },
  async binance(known) {
    const c = collector();
    const [spot, futures, tickers] = await Promise.all([
      getJson("https://api.binance.com/api/v3/exchangeInfo?permissions=SPOT", { timeout: 90000 }),
      firstJson(["https://fapi.binance.com/fapi/v1/exchangeInfo"]),
      getJson("https://api.binance.com/api/v3/ticker/price").catch(() => []),
    ]);
    const bySymbol = new Map();
    for (const row of spot.symbols || []) if (row.status === "TRADING") { c.addSpot(row.baseAsset, row.quoteAsset); bySymbol.set(row.symbol, [row.baseAsset, row.quoteAsset]); }
    for (const row of tickers || []) { const pair = bySymbol.get(row.symbol); if (pair) c.addPrice(pair[0], pair[1], row.price); }
    for (const row of futures.symbols || []) {
      if (row.status === "TRADING" && row.contractType === "PERPETUAL" && PERP_QUOTES.has(up(row.quoteAsset))) c.addPerp(perpBase(row.baseAsset, known), row.quoteAsset);
    }
    return { ...c, networks: null };
  },
  async bitget(known) {
    const c = collector();
    const [spot, usdt, usdc, coins, tickers] = await Promise.all([
      getJson("https://api.bitget.com/api/v2/spot/public/symbols"),
      getJson("https://api.bitget.com/api/v2/mix/market/contracts?productType=USDT-FUTURES"),
      getJson("https://api.bitget.com/api/v2/mix/market/contracts?productType=USDC-FUTURES").catch(() => ({ data: [] })),
      getJson("https://api.bitget.com/api/v2/spot/public/coins").catch(() => null),
      getJson("https://api.bitget.com/api/v2/spot/market/tickers").catch(() => ({ data: [] })),
    ]);
    const bySymbol = new Map();
    for (const row of spot.data || []) if (row.status === "online") { c.addSpot(row.baseCoin, row.quoteCoin); bySymbol.set(row.symbol, [row.baseCoin, row.quoteCoin]); }
    for (const row of tickers.data || []) { const pair = bySymbol.get(row.symbol); if (pair) c.addPrice(pair[0], pair[1], row.lastPr); }
    for (const row of [...(usdt.data || []), ...(usdc.data || [])]) {
      if (row.symbolStatus === "normal" && row.symbolType === "perpetual") c.addPerp(perpBase(row.baseCoin, known), row.quoteCoin);
    }
    let networks = null;
    if (coins?.data) {
      networks = new Map();
      for (const row of coins.data) {
        const chains = (row.chains || []).filter((chain) => chain.rechargeable === "true").map((chain) => chain.chain);
        if (chains.length) networks.set(up(row.coin), chains);
      }
    }
    return { ...c, networks };
  },
  async bybit(known) {
    const c = collector();
    const pages = async (category) => {
      const rows = [];
      let cursor = "";
      for (let i = 0; i < 10; i += 1) {
        const json = await getJson(`https://api.bybit.com/v5/market/instruments-info?category=${category}&limit=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
        rows.push(...(json.result?.list || []));
        cursor = json.result?.nextPageCursor || "";
        if (!cursor) break;
      }
      return rows;
    };
    const [spot, linear, tickers] = await Promise.all([pages("spot"), pages("linear"),
      getJson("https://api.bybit.com/v5/market/tickers?category=spot").catch(() => ({ result: { list: [] } }))]);
    const bySymbol = new Map();
    for (const row of spot) if (row.status === "Trading") { c.addSpot(row.baseCoin, row.quoteCoin); bySymbol.set(row.symbol, [row.baseCoin, row.quoteCoin]); }
    for (const row of tickers.result?.list || []) { const pair = bySymbol.get(row.symbol); if (pair) c.addPrice(pair[0], pair[1], row.lastPrice); }
    for (const row of linear) {
      if (row.status === "Trading" && row.contractType === "LinearPerpetual" && PERP_QUOTES.has(up(row.quoteCoin))) c.addPerp(perpBase(row.baseCoin, known), row.quoteCoin);
    }
    return { ...c, networks: null };
  },
  async "gate-io"(known) {
    const c = collector();
    const [spot, futures, currencies, tickers] = await Promise.all([
      getJson("https://api.gateio.ws/api/v4/spot/currency_pairs"),
      getJson("https://api.gateio.ws/api/v4/futures/usdt/contracts"),
      getJson("https://api.gateio.ws/api/v4/spot/currencies").catch(() => null),
      getJson("https://api.gateio.ws/api/v4/spot/tickers").catch(() => []),
    ]);
    for (const row of spot || []) if (row.trade_status === "tradable") c.addSpot(row.base, row.quote);
    for (const row of tickers || []) { const [b, q] = String(row.currency_pair).split("_"); c.addPrice(b, q, row.last); }
    for (const row of futures || []) {
      if (row.in_delisting) continue;
      const [base, quote] = String(row.name || "").split("_");
      c.addPerp(perpBase(base, known), quote);
    }
    let networks = null;
    if (Array.isArray(currencies)) {
      networks = new Map();
      for (const row of currencies) {
        if (row.delisted || row.trade_disabled) continue;
        const chains = (row.chains || []).filter((chain) => !chain.deposit_disabled).map((chain) => chain.name);
        // Gate lists chain-suffixed duplicates ("USDT_TRX"); keep the plain currency.
        if (chains.length && !/_/.test(row.currency)) networks.set(up(row.currency), chains);
      }
    }
    return { ...c, networks };
  },
  async mexc(known) {
    const c = collector();
    const [spot, futures, tickers] = await Promise.all([
      getJson("https://api.mexc.com/api/v3/exchangeInfo"),
      getJson("https://contract.mexc.com/api/v1/contract/detail"),
      getJson("https://api.mexc.com/api/v3/ticker/price").catch(() => []),
    ]);
    const bySymbol = new Map();
    for (const row of spot.symbols || []) if (String(row.status) === "1" && row.isSpotTradingAllowed !== false) { c.addSpot(row.baseAsset, row.quoteAsset); bySymbol.set(row.symbol, [row.baseAsset, row.quoteAsset]); }
    for (const row of tickers || []) { const pair = bySymbol.get(row.symbol); if (pair) c.addPrice(pair[0], pair[1], row.price); }
    for (const row of futures.data || []) if (row.state === 0 && PERP_QUOTES.has(up(row.quoteCoin))) c.addPerp(perpBase(row.baseCoin, known), row.quoteCoin);
    return { ...c, networks: null };
  },
  async htx(known) {
    const c = collector();
    const [spot, futures, currencies, tickers] = await Promise.all([
      getJson("https://api.huobi.pro/v2/settings/common/symbols"),
      firstJson(["https://api.hbdm.com/linear-swap-api/v1/swap_contract_info", "https://api.hbdm.vn/linear-swap-api/v1/swap_contract_info"], { tries: 2 }),
      getJson("https://api.huobi.pro/v2/reference/currencies").catch(() => null),
      getJson("https://api.huobi.pro/market/tickers").catch(() => ({ data: [] })),
    ]);
    const bySymbol = new Map();
    for (const row of spot.data || []) if (row.state === "online") { c.addSpot(row.bcdn || row.bc, row.qcdn || row.qc); bySymbol.set(row.sc, [row.bcdn || row.bc, row.qcdn || row.qc]); }
    for (const row of tickers.data || []) { const pair = bySymbol.get(row.symbol); if (pair) c.addPrice(pair[0], pair[1], row.close); }
    for (const row of futures.data || []) {
      if (row.contract_status !== 1 || row.business_type && row.business_type !== "swap") continue;
      const [base, quote] = String(row.contract_code || "").split("-");
      c.addPerp(perpBase(base, known), quote);
    }
    let networks = null;
    if (currencies?.data) {
      networks = new Map();
      for (const row of currencies.data) {
        const chains = (row.chains || []).filter((chain) => chain.depositStatus === "allowed").map((chain) => chain.displayName || chain.baseChain || chain.chain);
        if (chains.length) networks.set(up(row.currency), chains);
      }
    }
    return { ...c, networks };
  },
  async kraken(known) {
    const c = collector();
    const [pairs, futures, tickers] = await Promise.all([
      getJson("https://api.kraken.com/0/public/AssetPairs"),
      getJson("https://futures.kraken.com/derivatives/api/v3/instruments").catch(() => ({ instruments: [] })),
      getJson("https://api.kraken.com/0/public/Ticker").catch(() => ({ result: {} })),
    ]);
    for (const [key, row] of Object.entries(pairs.result || {})) {
      if (row.status !== "online" || !row.wsname) continue;
      const [rawBase, rawQuote] = row.wsname.split("/");
      const base = KRAKEN_ALIASES[up(rawBase)] || rawBase, quote = KRAKEN_ALIASES[up(rawQuote)] || rawQuote;
      c.addSpot(base, quote);
      const last = tickers.result?.[key]?.c?.[0];
      if (last) c.addPrice(base, quote, last);
    }
    for (const row of futures.instruments || []) {
      if (row.type !== "flexible_futures" || !row.tradeable || !/^PF_/.test(row.symbol || "")) continue;
      c.addPerp(perpBase(KRAKEN_ALIASES[up(row.base)] || row.base, known), row.quote);
    }
    return { ...c, networks: null };
  },
};

// ------------------------------------------------------------------ CoinGecko
async function coinGeckoUniverse() {
  const pause = 6500; // free tier: stay well under the per-minute limit
  const markets = [];
  for (const page of [1, 2]) {
    markets.push(...await getJson(`${CG}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&price_change_percentage=24h`, { pause, tries: 6 }));
  }
  const categoryIds = [...new Set([...CATEGORY_SOURCES.map(([, id]) => id), ...EXCLUDED_CATEGORIES])];
  const membership = new Map(); // coingecko id -> Set(category ids)
  for (const id of categoryIds) {
    try {
      const rows = await getJson(`${CG}/coins/markets?vs_currency=usd&category=${id}&order=market_cap_desc&per_page=250&page=1`, { pause, tries: 6 });
      for (const row of rows) { const set = membership.get(row.id) || new Set(); set.add(id); membership.set(row.id, set); }
    } catch (error) { console.warn(`[coins] category ${id} unavailable: ${error.message}`); }
  }
  let platforms = new Map(), platformNames = new Map();
  try {
    const list = await getJson(`${CG}/coins/list?include_platform=true`, { pause, tries: 6, timeout: 90000 });
    platforms = new Map(list.map((row) => [row.id, row.platforms || {}]));
    const names = await getJson(`${CG}/asset_platforms`, { pause, tries: 6 });
    platformNames = new Map(names.map((row) => [row.id, row.name]));
  } catch (error) { console.warn(`[coins] contract networks unavailable: ${error.message}`); }
  return { markets, membership, platforms, platformNames };
}

const slugify = (value) => String(value || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");

function selectUniverse({ markets, membership, platforms, platformNames }, previous) {
  const previousSlugs = new Map((previous?.coins || []).map((coin) => [coin.id, coin.slug]));
  const takenSymbols = new Set();
  const takenSlugs = new Set();
  const coins = [];
  for (const row of markets) {
    if (coins.length >= UNIVERSE_SIZE) break;
    if (!row.market_cap_rank || !row.symbol || !row.name) continue;
    const cats = membership.get(row.id) || new Set();
    if (EXCLUDED_CATEGORIES.some((id) => cats.has(id)) && !cats.has("stablecoins")) continue;
    const symbol = up(row.symbol);
    if (takenSymbols.has(symbol)) continue; // a lower-ranked coin sharing a ticker would mix up venue listings
    // Slugs stay stable across refreshes (a renamed coin keeps its URL).
    let slug = previousSlugs.get(row.id) || slugify(row.name) || slugify(row.id);
    if (takenSlugs.has(slug)) slug = `${slug}-${symbol.toLowerCase()}`;
    takenSymbols.add(symbol); takenSlugs.add(slug);
    const category = (CATEGORY_SOURCES.find(([, id]) => cats.has(id)) || ["other"])[0];
    const contract = Object.entries(platforms.get(row.id) || {}).filter(([chain, address]) => chain && address)
      .map(([chain]) => platformNames.get(chain) || chain);
    coins.push({
      id: row.id, slug, name: row.name, symbol, rank: row.market_cap_rank, category, cgCategories: [...cats].sort(),
      categories: CATEGORY_SOURCES.filter(([, id]) => cats.has(id)).map(([key]) => key).filter((key, i, all) => all.indexOf(key) === i),
      networks: contract.length ? contract.slice(0, 8) : null, // null: the coin runs on its own chain
      price: Number.isFinite(row.current_price) ? row.current_price : null,
      change24h: Number.isFinite(row.price_change_percentage_24h) ? Math.round(row.price_change_percentage_24h * 100) / 100 : null,
      marketCap: Number.isFinite(row.market_cap) ? row.market_cap : null,
      priceAt: row.last_updated || null,
    });
  }
  return coins;
}

// ------------------------------------------------------------------ build
async function readPrevious() {
  try { return JSON.parse(await readFile(OUT_JSON, "utf8")); } catch { return null; }
}

// --reuse-universe: keep the coin list, prices and categories of the last snapshot and refresh only the venue listings
// (CoinGecko's free tier allows a handful of calls a minute; a full universe refresh takes ~10 minutes).
function reusedUniverse(previous) {
  if (!previous?.coins?.length) throw new Error("--reuse-universe needs an existing public/intel/coins.json");
  return previous.coins.map(({ venues, dropped, ...coin }) => {
    const cats = new Set(coin.cgCategories || []);
    const category = cats.size ? (CATEGORY_SOURCES.find(([, id]) => cats.has(id)) || ["other"])[0] : coin.category;
    return { ...coin, category };
  });
}

// A venue whose USD-stable price for the ticker is far from the coin's market price lists a different token under the
// same symbol (ticker collision): that venue is not counted for this coin.
const PRICE_TOLERANCE = 0.5;
function sameAsset(coin, venuePrice) {
  if (!Number.isFinite(coin.price) || coin.price <= 0 || !Number.isFinite(venuePrice)) return true;
  return Math.abs(venuePrice / coin.price - 1) <= PRICE_TOLERANCE;
}

export async function fetchSnapshot({ reuseUniverse = false } = {}) {
  const previous = await readPrevious();
  const universe = reuseUniverse ? reusedUniverse(previous) : selectUniverse(await coinGeckoUniverse(), previous);
  const known = new Set(universe.map((coin) => coin.symbol));
  const venueStatus = {};
  const listings = {};
  await Promise.all(COIN_VENUES.map(async (venue) => {
    try {
      listings[venue] = await VENUE_LOADERS[venue](known);
      venueStatus[venue] = { ok: true, checkedAt: new Date().toISOString(), spotMarkets: listings[venue].spot.size, networks: Boolean(listings[venue].networks) };
    } catch (error) {
      console.warn(`[coins] ${venue} unavailable: ${error.message}; keeping the previous listing`);
      venueStatus[venue] = { ok: false, checkedAt: previous?.venueStatus?.[venue]?.checkedAt || null, error: String(error.message).slice(0, 200) };
    }
  }));
  const previousById = new Map((previous?.coins || []).map((coin) => [coin.id, coin]));
  for (const coin of universe) {
    coin.venues = {};
    for (const venue of COIN_VENUES) {
      const source = listings[venue];
      if (!source) { const old = previousById.get(coin.id)?.venues?.[venue]; if (old) coin.venues[venue] = { ...old, stale: true }; continue; }
      const spot = sortQuotes(source.spot.get(coin.symbol) || []);
      const perp = sortQuotes(source.perp.get(coin.symbol) || []);
      if (!spot.length && !perp.length) continue;
      if (!sameAsset(coin, source.prices.get(coin.symbol))) {
        (coin.dropped ||= []).push({ venue, venuePrice: source.prices.get(coin.symbol) });
        continue;
      }
      const networks = source.networks ? (source.networks.get(coin.symbol) || []).slice(0, 8) : null;
      coin.venues[venue] = { spot, perp, ...(networks ? { networks } : {}) };
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    sources: {
      universe: "CoinGecko public API /coins/markets (top by market cap), categories and /coins/list?include_platform=true",
      listings: "Each exchange's public market endpoints (spot instruments, USDT/USDC perpetual contracts)",
      networks: "Deposit networks from the public currency endpoints of Bitget, Gate and HTX; other venues do not publish them without an API key",
      descriptions: "Written by NexuAlpha (content-source/coins/descriptions)",
    },
    venues: COIN_VENUES,
    venueStatus,
    coins: universe,
  };
}

async function readDescriptions() {
  const byLocale = {};
  let files = [];
  try { files = (await readdir(DESCRIPTION_DIR)).filter((file) => file.endsWith(".json")); } catch { /* none yet */ }
  for (const file of files) {
    const json = JSON.parse(await readFile(path.join(DESCRIPTION_DIR, file), "utf8"));
    for (const [locale, entries] of Object.entries(json)) Object.assign(byLocale[locale] ||= {}, entries);
  }
  return byLocale;
}

const js = (value) => JSON.stringify(value);
export async function writeModules(snapshot) {
  const descriptions = await readDescriptions();
  const venues = snapshot.venues;
  // Compact rows: [id, slug, name, symbol, rank, category, networks, price, change24h, marketCap, venueRows]
  // venueRows: { venue: [spotQuotes, perpQuotes, depositNetworks|null] }
  const rows = snapshot.coins.map((coin) => [coin.id, coin.slug, coin.name, coin.symbol, coin.rank, coin.category, coin.networks, coin.price, coin.change24h, coin.marketCap,
    Object.fromEntries(Object.entries(coin.venues || {}).map(([venue, v]) => [venue, [v.spot, v.perp, v.networks || null]]))]);
  const header = "// Generated by scripts/build-coin-availability.mjs from public/intel/coins.json. Do not edit by hand.\n";
  await writeFile(OUT_DATA, `${header}export const COINS_GENERATED_AT = ${js(snapshot.generatedAt)};\nexport const COIN_VENUE_SLUGS = Object.freeze(${js(venues)});\n`
    + `export const COIN_VENUE_STATUS = Object.freeze(${js(Object.fromEntries(Object.entries(snapshot.venueStatus || {}).map(([k, v]) => [k, { ok: v.ok, checkedAt: v.checkedAt }])))});\n`
    + `export const COIN_ROWS = Object.freeze(${js(rows)});\n`);
  // Links: top 20 coins listed on any venue (home) and per venue (exchange profiles), by market-cap rank.
  const listed = snapshot.coins.filter((coin) => Object.keys(coin.venues || {}).length && coin.category !== "stablecoin");
  const link = (coin) => [coin.slug, coin.name, coin.symbol];
  const perVenue = Object.fromEntries(venues.map((venue) => [venue, listed.filter((coin) => coin.venues[venue]?.spot?.length).slice(0, 20).map(link)]));
  // Two modules: the home list ships with the home page, the per-venue lists with the exchange profile chunk.
  await writeFile(OUT_LINKS, `${header}export const POPULAR_COINS = Object.freeze(${js(listed.slice(0, 20).map(link))});\n`);
  await writeFile(OUT_VENUE_LINKS, `${header}export const POPULAR_COINS_BY_VENUE = Object.freeze(${js(perVenue)});\n`);
  // Descriptions per locale: only coins in the universe.
  const ids = new Set(snapshot.coins.map((coin) => coin.id));
  const written = {};
  for (const locale of COIN_INDEX_LOCALES) descriptions[locale] ||= {};
  for (const [locale, entries] of Object.entries(descriptions)) {
    const kept = Object.fromEntries(Object.entries(entries).filter(([id, text]) => ids.has(id) && typeof text === "string" && text.trim()).sort(([a], [b]) => a.localeCompare(b)));
    await writeFile(CONTENT_MODULE(locale), `// Generated by scripts/build-coin-availability.mjs from content-source/coins/descriptions. Do not edit by hand.\n// NexuAlpha's own coin descriptions (${locale}).\nexport const COIN_DESCRIPTIONS = Object.freeze(${JSON.stringify(kept, null, 0)});\n`);
    written[locale] = Object.keys(kept).length;
  }
  // Template strings per locale.
  const copy = {};
  for (const file of (await readdir(UI_DIR)).filter((name) => name.endsWith(".json")).sort()) copy[file.replace(/\.json$/, "")] = JSON.parse(await readFile(path.join(UI_DIR, file), "utf8"));
  await writeFile(OUT_COPY, `// Generated by scripts/build-coin-availability.mjs from content-source/coins/ui. Do not edit by hand.\nexport const COIN_COPY = Object.freeze(${JSON.stringify(copy)});\n`);
  return written;
}

async function main() {
  const offline = process.argv.includes("--offline");
  const snapshot = offline ? await readPrevious() : await fetchSnapshot({ reuseUniverse: process.argv.includes("--reuse-universe") });
  if (!snapshot) throw new Error("no snapshot: run without --offline first");
  if (!offline) {
    await mkdir(path.dirname(OUT_JSON), { recursive: true });
    await writeFile(OUT_JSON, `${JSON.stringify(snapshot)}\n`);
  }
  const written = await writeModules(snapshot);
  const listed = snapshot.coins.filter((coin) => Object.keys(coin.venues || {}).length).length;
  console.log(`[coins] ${snapshot.coins.length} coins, ${listed} listed on at least one covered venue; venues ok: ${Object.entries(snapshot.venueStatus || {}).filter(([, v]) => v.ok).map(([k]) => k).join(", ")}`);
  const dropped = snapshot.coins.filter((coin) => coin.dropped?.length);
  if (dropped.length) console.log(`[coins] ticker collisions skipped: ${dropped.map((coin) => `${coin.symbol}@${coin.dropped.map((d) => d.venue).join("+")}`).join(", ")}`);
  console.log(`[coins] descriptions: ${Object.entries(written).map(([locale, n]) => `${locale}=${n}`).join(" ") || "none"}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error); process.exit(1); });
}
