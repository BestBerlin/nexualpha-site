#!/usr/bin/env node
// Tokenized US stocks: live listing snapshot (2026-10-18). Which stock tokens and stock perpetuals each exchange lists right
// now, read from the exchanges' own public market-data endpoints (no keys, no scraping):
//
//   Bitget   /api/v2/mix/market/contracts (USDT-M, isRwa) · /api/v2/spot/public/symbols (rToken r<T>USDT)
//   OKX      /api/v5/public/instruments SWAP + SPOT (instCategory 3 = stocks; xStocks x<T>-USDT; ruleType pre_market)
//   Binance  fapi /fapi/v1/exchangeInfo (TRADIFI_PERPETUAL, EQUITY / PREMARKET) · /api/v3/exchangeInfo (bStocks <T>B)
//   Bybit    /v5/market/instruments-info linear (symbolType stock / ETF) + spot (symbolType xstocks)
//   Gate     /api/v4/futures/usdt/contracts (contract_type stocks) · /api/v4/spot/currency_pairs (xStock, Ondo names)
//   MEXC     contract /api/v1/contract/detail (Stock zone) · /api/v3/exchangeInfo (xStock, Ondo names)
//   Kraken   /0/public/AssetPairs?aclass_base=tokenized_asset (xStocks) · futures /derivatives/api/v3/instruments (xStocks)
//
// Every listing carries the exchange symbol, and only where the endpoint publishes them: max leverage, the standard
// maker/taker fee and the listing time. Nothing is inferred: a value the endpoint does not publish stays absent.
//
// Outputs:
//   public/intel/tokenized-stocks.json            full snapshot, every stock instrument per venue (served, and the input of
//                                                  the listing diff)
//   src/data/tokenized-stocks-live.generated.js   compact table for the ticker pages (route chunk + SSR)
//
//   node scripts/build-tokenized-stocks-live.mjs                     fetch, write both outputs
//   node scripts/build-tokenized-stocks-live.mjs --offline           rebuild the module from public/intel/tokenized-stocks.json
//   node scripts/build-tokenized-stocks-live.mjs --json-only --out F refresh job on the host: write F only (runtime copy)
//   ... --events F                                                   append listing / delisting events (JSON lines) to F
// A venue that fails keeps its previous lanes (marked stale): a network blip never empties a page.
import { mkdir, readFile, writeFile, rename, appendFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { TS_CAMPAIGN_ENDPOINTS, TS_LIVE_ENDPOINTS, TS_LIVE_VENUES, compactLive, isUsableLiveSnapshot, parseBybitCampaigns } from "../src/data/tokenized-stocks-live-sources.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argValue = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const OUT_JSON = argValue("--out") ? path.resolve(argValue("--out")) : path.join(root, "public", "intel", "tokenized-stocks.json");
const OUT_MODULE = path.join(root, "src", "data", "tokenized-stocks-live.generated.js");
const UA = { "user-agent": "NexuAlpha tokenized-stocks (+https://nexualpha.com/tokenized-stocks)", accept: "application/json" };

export { TS_LIVE_ENDPOINTS, TS_LIVE_VENUES, compactLive, isUsableLiveSnapshot };

// Bitget flags gold, oil, metals and FX as RWA too: they are not stocks.
const NOT_STOCKS = new Set(["PAXG", "XAUT", "XAU", "XAG", "XPT", "XPD", "COPPER", "COP", "CL", "BZ", "NATGAS", "HSI", "JP225", "KR200", "NDX100", "SP500"]);
const pct = (rate) => (rate == null || rate === "" || !Number.isFinite(Number(rate)) ? undefined : Math.round(Number(rate) * 1e6) / 1e4);
const day = (ms) => { const n = Number(ms); return Number.isFinite(n) && n > 1e12 ? new Date(n).toISOString().slice(0, 10) : undefined; };
const daySec = (s) => day(Number(s) * 1000);
const lev = (v) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 1 ? n : undefined; };
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ""));
// First listing of a ticker wins; a second token family for the same stock (Gate and MEXC list both the xStocks and the
// Ondo token) is kept as `alt`, xStocks first.
const put = (map, ticker, item) => {
  if (!ticker || !/^[A-Z][A-Z0-9.]{0,14}$/.test(ticker) || NOT_STOCKS.has(ticker)) return;
  const prev = map[ticker];
  if (!prev) { map[ticker] = clean(item); return; }
  if (item.form && prev.form && item.form !== prev.form && !prev.alt) {
    map[ticker] = item.form === "xStocks" ? clean({ ...item, alt: prev.sym, altForm: prev.form }) : { ...prev, alt: item.sym, altForm: item.form };
  }
};
const stripSuffix = (s, suffix) => (s.endsWith(suffix) && s.length > suffix.length ? s.slice(0, -suffix.length) : s);

/** Parsers: raw endpoint JSON -> { [TICKER]: { sym, lev?, maker?, taker?, since?, preipo? } }. */
export const PARSE = {
  bitget: {
    perp(raw) {
      const out = {};
      for (const x of raw?.data || []) {
        if (x.isRwa !== "YES" || x.symbolType !== "perpetual" || x.symbolStatus !== "normal" || x.quoteCoin !== "USDT") continue;
        put(out, stripSuffix(String(x.baseCoin), "STOCK"), { sym: x.symbol, lev: lev(x.maxLever), maker: pct(x.makerFeeRate), taker: pct(x.takerFeeRate), since: day(x.openTime) });
      }
      return out;
    },
    // rTokens are r<TICKER>/USDT. Only names that also trade as a Bitget stock perpetual count, so an unrelated coin whose
    // symbol happens to start with R is never mistaken for a stock token.
    spot(raw, { perp } = {}) {
      const out = {};
      for (const x of raw?.data || []) {
        const m = /^R([A-Z0-9]+)USDT$/.exec(x.symbol || "");
        if (!m || x.status !== "online" || !perp?.[m[1]]) continue;
        put(out, m[1], { sym: `r${m[1]}`, maker: pct(x.makerFeeRate), taker: pct(x.takerFeeRate), since: day(x.openTime) });
      }
      return out;
    },
  },
  okx: {
    perp(raw) {
      const out = {};
      for (const x of raw?.data || []) {
        if (x.instCategory !== "3" || x.state !== "live" || x.settleCcy !== "USDT") continue;
        const [ticker] = String(x.instFamily || x.uly || "").split("-");
        put(out, ticker, { sym: x.instId, lev: lev(x.lever), since: day(x.listTime), preipo: x.ruleType === "pre_market" || undefined });
      }
      return out;
    },
    spot(raw) {
      const out = {};
      for (const x of raw?.data || []) {
        if (x.instCategory !== "3" || x.state !== "live" || x.quoteCcy !== "USDT" || !/^X[A-Z]/.test(x.baseCcy || "")) continue;
        put(out, x.baseCcy.slice(1), { sym: `x${x.baseCcy.slice(1)}`, since: day(x.listTime) });
      }
      return out;
    },
  },
  binance: {
    perp(raw) {
      const out = {};
      for (const x of raw?.symbols || []) {
        if (x.contractType !== "TRADIFI_PERPETUAL" || x.status !== "TRADING" || x.quoteAsset !== "USDT" || !["EQUITY", "PREMARKET"].includes(x.underlyingType)) continue;
        put(out, x.baseAsset, { sym: x.symbol, since: day(x.onboardDate), preipo: x.underlyingType === "PREMARKET" || undefined });
      }
      return out;
    },
    // bStocks are <TICKER>B/USDT; only names Binance also lists as a stock perpetual (or the documented TSLA, NVDA) count.
    spot(raw, { perp } = {}) {
      const out = {};
      for (const x of raw?.symbols || []) {
        const m = /^([A-Z]+)B$/.exec(x.baseAsset || "");
        if (!m || x.quoteAsset !== "USDT" || x.status !== "TRADING" || !(perp?.[m[1]] || ["TSLA", "NVDA"].includes(m[1]))) continue;
        put(out, m[1], { sym: x.symbol.replace(/USDT$/, "") });
      }
      return out;
    },
  },
  bybit: {
    perp(raw) {
      const out = {};
      for (const x of raw?.result?.list || []) {
        if (!["stock", "ETF"].includes(x.symbolType) || x.status !== "Trading" || x.contractType !== "LinearPerpetual" || x.quoteCoin !== "USDT") continue;
        put(out, x.baseCoin, { sym: x.symbol, lev: lev(x.leverageFilter?.maxLeverage), since: day(x.launchTime) });
      }
      return out;
    },
    spot(raw) {
      const out = {};
      for (const x of raw?.result?.list || []) {
        if (x.symbolType !== "xstocks" || x.status !== "Trading" || x.quoteCoin !== "USDT") continue;
        const ticker = stripSuffix(String(x.baseCoin), "X");
        put(out, ticker, { sym: `${ticker}x` });
      }
      return out;
    },
  },
  "gate-io": {
    perp(raw) {
      const out = {};
      for (const x of Array.isArray(raw) ? raw : []) {
        if (x.contract_type !== "stocks" || x.status !== "trading" || x.in_delisting) continue;
        const [ticker, quote] = String(x.name).split("_");
        if (quote !== "USDT") continue;
        put(out, ticker, { sym: x.name.replace("_", ""), lev: lev(x.leverage_max), maker: pct(x.maker_fee_rate), taker: pct(x.taker_fee_rate), since: daySec(x.launch_time || x.create_time), preipo: x.is_pre_market || undefined });
      }
      return out;
    },
    spot(raw) {
      const out = {};
      for (const x of Array.isArray(raw) ? raw : []) {
        if (x.quote !== "USDT" || x.trade_status !== "tradable") continue;
        const name = String(x.base_name || "");
        if (/ xStock$/.test(name)) put(out, stripSuffix(x.base, "X"), { sym: x.base, form: "xStocks" });
        else if (/ Ondo Tokenized$/.test(name)) put(out, stripSuffix(x.base, "ON"), { sym: x.base, form: "Ondo" });
      }
      return out;
    },
  },
  mexc: {
    perp(raw) {
      const out = {};
      for (const x of raw?.data || []) {
        const zones = x.conceptPlate || [];
        if (!zones.includes("mc-trade-zone-Stock") || x.state !== 0 || x.quoteCoin !== "USDT") continue;
        const m = /^([A-Z0-9.]+)_USDT\b/.exec(x.displayNameEn || "");
        if (!m) continue;
        put(out, m[1], { sym: x.symbol.replace("_", ""), lev: lev(x.maxLeverage), maker: pct(x.makerFeeRate), taker: pct(x.takerFeeRate), since: day(x.openingTime), preipo: zones.includes("mc-trade-zone-preipo") || undefined });
      }
      return out;
    },
    spot(raw) {
      const out = {};
      for (const x of raw?.symbols || []) {
        if (x.quoteAsset !== "USDT" || !["1", 1, "ENABLED"].includes(x.status)) continue;
        const name = String(x.fullName || "");
        if (/ xStock$/.test(name)) put(out, stripSuffix(x.baseAsset, "X"), { sym: x.baseAsset, form: "xStocks" });
        else if (/\(Ondo\)$/.test(name)) put(out, stripSuffix(x.baseAsset, "ON"), { sym: x.baseAsset, form: "Ondo" });
      }
      return out;
    },
  },
  kraken: {
    perp(raw) {
      const out = {};
      for (const x of raw?.instruments || []) {
        const m = /^PF_([A-Z0-9]+)XUSD$/.exec(x.symbol || "");
        if (!m || x.category !== "xStocks" || !x.tradeable || x.isExpired) continue;
        const im = Number((x.retailMarginLevels || x.marginLevels || [])[0]?.initialMargin);
        put(out, m[1], { sym: `${m[1]}x PERP`, lev: im > 0 ? lev(1 / im) : undefined, since: x.openingDate ? String(x.openingDate).slice(0, 10) : undefined });
      }
      return out;
    },
    spot(raw) {
      const out = {};
      for (const pair of Object.values(raw?.result || {})) {
        const m = /^([A-Z0-9]+)x$/.exec(pair.base || "");
        if (!m || pair.aclass_base !== "tokenized_asset" || !["online", "post_only"].includes(pair.status) || !/USD$/.test(pair.quote || "")) continue;
        put(out, m[1], { sym: `${m[1]}x` });
      }
      return out;
    },
  },
};

// One retry after 3 s for transport errors and 418/429/5xx (Binance answers 418 to a burst).
async function getJson(url, fetchImpl = fetch) {
  try { return await getJsonOnce(url, fetchImpl); } catch (error) {
    if (!/HTTP (418|429|5\d\d)|abort|fetch failed|ECONN|ETIMEDOUT/i.test(String(error?.message || error))) throw error;
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return getJsonOnce(url, fetchImpl);
  }
}

async function getJsonOnce(url, fetchImpl = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetchImpl(url, { headers: UA, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(timer); }
}

const MIN_ITEMS = { perp: 3, spot: 3 };

/** Fetch every venue; a lane that fails or comes back implausibly small keeps its previous items (stale). */
export async function collectLive({ previous = null, fetchImpl = fetch, now = new Date() } = {}) {
  const venues = {};
  await Promise.all(TS_LIVE_VENUES.map(async (venue) => {
    const lanes = {};
    for (const lane of ["perp", "spot"]) {
      const url = TS_LIVE_ENDPOINTS[venue][lane];
      const prev = previous?.venues?.[venue]?.[lane];
      try {
        const items = PARSE[venue][lane](await getJson(url, fetchImpl), { perp: lanes.perp?.items });
        if (Object.keys(items).length < MIN_ITEMS[lane] && Object.keys(prev?.items || {}).length >= MIN_ITEMS[lane]) throw new Error(`only ${Object.keys(items).length} items`);
        lanes[lane] = { source: url, checkedAt: now.toISOString(), items };
      } catch (error) {
        if (prev) lanes[lane] = { ...prev, stale: true, error: String(error?.message || error).slice(0, 120) };
        else lanes[lane] = { source: url, checkedAt: null, items: {}, stale: true, error: String(error?.message || error).slice(0, 120) };
      }
    }
    venues[venue] = lanes;
  }));
  // Running stock campaigns (official start/end); on failure keep the previous list minus the ones that ended.
  let campaigns;
  try { campaigns = parseBybitCampaigns(await getJson(TS_CAMPAIGN_ENDPOINTS.bybit, fetchImpl), now.getTime()); }
  catch { campaigns = (previous?.campaigns || []).filter((c) => Date.parse(c.endAt) > now.getTime()); }
  return { schema: 1, generatedAt: now.toISOString(), venues: Object.fromEntries(TS_LIVE_VENUES.map((v) => [v, venues[v]])), campaigns };
}

const EVENT_DAYS = 60;
const EVENT_MAX = 300;
export function rollEvents(fresh = [], previous = [], now = new Date().toISOString()) {
  const since = Date.parse(now) - EVENT_DAYS * 86400e3;
  const withIds = fresh.map((e) => ({ id: `${e.observedAt.slice(0, 16)}:${e.type}:${e.venue}:${e.lane}:${e.ticker}`, ...e }));
  return [...withIds, ...(Array.isArray(previous) ? previous : [])].filter((e) => Date.parse(e.observedAt) >= since).slice(0, EVENT_MAX);
}

/** Listing / delisting events between two snapshots (stale lanes never produce events). */
export function diffLive(prev, next) {
  const events = [];
  if (!prev?.venues) return events;
  for (const venue of TS_LIVE_VENUES) {
    for (const lane of ["perp", "spot"]) {
      const a = prev.venues[venue]?.[lane], b = next.venues[venue]?.[lane];
      if (!a || !b || a.stale || b.stale || !b.checkedAt) continue;
      const before = a.items || {}, after = b.items || {};
      for (const ticker of Object.keys(after)) if (!before[ticker]) events.push({ type: "listed", venue, lane, ticker, ...after[ticker], source: b.source, observedAt: next.generatedAt });
      for (const ticker of Object.keys(before)) if (!after[ticker]) events.push({ type: "delisted", venue, lane, ticker, sym: before[ticker].sym, source: b.source, observedAt: next.generatedAt });
    }
  }
  return events;
}

async function readJson(file) { try { return JSON.parse(await readFile(file, "utf8")); } catch { return null; } }

async function writeAtomic(file, text) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(`${file}.tmp`, text);
  await rename(`${file}.tmp`, file);
}

async function main() {
  const previous = await readJson(OUT_JSON);
  const snapshot = process.argv.includes("--offline") ? previous : await collectLive({ previous });
  if (!isUsableLiveSnapshot(snapshot)) throw new Error("tokenized-stocks snapshot implausible (fewer than 200 stock instruments); nothing written");
  if (!process.argv.includes("--offline")) {
    const events = diffLive(previous, snapshot);
    const eventsFile = argValue("--events");
    if (eventsFile && events.length) await appendFile(eventsFile, events.map((e) => JSON.stringify(e)).join("\n") + "\n");
    // Rolling change log inside the snapshot (served at /intel/tokenized-stocks.json): the pages show the latest changes
    // of their ticker / exchange and the newsroom collector turns each one into a listing or delisting event.
    snapshot.events = rollEvents(events, previous?.events, snapshot.generatedAt);
    await writeAtomic(OUT_JSON, `${JSON.stringify(snapshot)}\n`);
    const stale = Object.entries(snapshot.venues).flatMap(([v, lanes]) => Object.entries(lanes).filter(([, l]) => l.stale).map(([l]) => `${v}:${l}`));
    console.log(`${snapshot.generatedAt} tokenized-stocks: ${events.length} change(s)${stale.length ? `, stale ${stale.join(" ")}` : ""}`);
  }
  if (!process.argv.includes("--json-only")) {
    const compact = compactLive(snapshot);
    await writeAtomic(OUT_MODULE, `// Generated by scripts/build-tokenized-stocks-live.mjs from the exchanges' public market-data endpoints — do not edit.\n// Ticker pages render this table; the host refresh job keeps a newer runtime copy (TS_LIVE_FILE) that overrides it.\nexport const TS_LIVE_BAKED = Object.freeze(${JSON.stringify(compact)});\n`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => { console.error(error?.stack || error); process.exit(1); });
}
