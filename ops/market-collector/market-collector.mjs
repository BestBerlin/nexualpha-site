#!/usr/bin/env node
// NexuAlpha market-event collector (2026-10-10). Finds what crypto traders want to read about today, from public
// exchange data and public news feeds, so articles and Telegram posts start from real events:
//   - liquidations: Binance USDT-M force orders over 1h / 4h / 24h, split long vs short ("both sides wiped out");
//   - liquidation timeline: real observed orders kept for 7 days, rolled into compact 24h 5-minute and 7d hourly
//     buckets for the heat timeline UI. Observation buckets are collector observation points: the route can distinguish
//     "this bucket had a collector cycle/order and zero liquidation value" from gaps, without claiming continuous
//     venue coverage for every millisecond inside the bucket.
//   - big moves: 1h and 24h moves of the most traded perpetuals; open-interest change for BTC and ETH;
//   - headline radar: titles from public RSS feeds (SEC, crypto press), tagged (tokenization, ETF, hack, listing...);
//   - funding rates (2026-10-10, feeds /funding-rates): Binance USDT-M premiumIndex and OKX funding-rate for the
//     top ~20 perpetuals by Binance volume, written under `funding`. Public endpoints only, no key.
// Headlines are for topic discovery only; articles must go back to primary sources.
// Binance's liquidation stream sends at most the latest order per symbol per second, so totals are a lower bound and
// are labelled as such. Output: one JSON file (OUT_FILE), rewritten atomically every 5 minutes, plus an hourly
// history (MARKET_HISTORY_FILE, JSON lines, 90 days) summarised under `history` for the /liquidations 30-day chart.
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { atomicWriteJson, boundedFetch, createSourceRunner, readJson, runCollectorLoop, sourcesDegraded } from "./resilience.mjs";
import { appendHourlySnapshot, defaultHistoryFile, historySnapshot, summarizeHistory } from "./market-history.mjs";

const OUT_FILE = process.env.OUT_FILE || "/var/lib/nexualpha-market/market-events.json";
const STATE_FILE = process.env.STATE_FILE || path.join(path.dirname(OUT_FILE), "liquidations-24h.json");
// Hourly liquidation history (2026-10-11): JSON lines, 90 days, one row per UTC hour; see market-history.mjs.
const HISTORY_FILE = process.env.MARKET_HISTORY_FILE || defaultHistoryFile(OUT_FILE);
const UA = "NexuAlphaMarketCollector/1.0 (+https://nexualpha.com)";
const MINUTE = 60e3;
const HOUR = 60 * MINUTE;
const H24 = 24 * HOUR;
const H7 = 7 * H24;
export const LIQUIDATION_ORDER_RETENTION_MS = H7;
export const LIQUIDATION_TIMELINE_SOURCE_LABEL = "Binance + OKX observed liquidations";
export const LIQUIDATION_TIMELINE_WINDOWS = Object.freeze({
  h24: Object.freeze({ windowMs: H24, bucketMs: 5 * MINUTE }),
  d7: Object.freeze({ windowMs: H7, bucketMs: HOUR }),
});
export const LIQUIDATION_TIMELINE_LARGEST_LIMIT = 20;
const log = (m) => console.log(`[market] ${new Date().toISOString()} ${m}`);
const sourceRunner = createSourceRunner({ timeoutMs: 60_000, log });
const http = boundedFetch();

// ---------- liquidations (Binance force-order stream) ----------
const lnum = (v) => { const n = typeof v === "number" ? v : Number.parseFloat(v); return Number.isFinite(n) ? n : null; };
const nonNegativeUsd = (v) => Math.max(0, Math.round(lnum(v) ?? 0));
const iso = (t) => Number.isFinite(t) ? new Date(t).toISOString() : null;
const retentionCutoff = (now = Date.now(), retentionMs = LIQUIDATION_ORDER_RETENTION_MS) => now - retentionMs;
const withinRetention = (row, now = Date.now(), retentionMs = LIQUIDATION_ORDER_RETENTION_MS) => {
  const t = lnum(row?.t);
  return t != null && t >= retentionCutoff(now, retentionMs) && t <= now + HOUR;
};
// Memory (2026-10-15 OOM crash loop): a 7-day retention holds ~1M small order rows. JSON.parse and the Binance stream
// give every row its own copy of the same few strings ("BTCUSDT", "long", "okx"); sharing one instance per distinct value
// cuts the resident heap by roughly half, so the 5-minute cycle fits a bounded container instead of being killed at
// startup (exit 137, 900+ restarts after the 05:30 SGT reboot).
const internPool = new Map();
const intern = (v) => {
  if (typeof v !== "string") return v;
  const hit = internPool.get(v);
  if (hit !== undefined) return hit;
  if (internPool.size < 50000) internPool.set(v, v);
  return v;
};
const compactOrder = (x) => ({ t: x.t, s: intern(x.s), side: intern(x.side), usd: x.usd, ...(x.src !== undefined ? { src: intern(x.src) } : {}) });
// Hard bound on retained orders (2026-10-18 OOM: liquidations-24h.json reached 21 MB / 281k orders with 7-day
// retention and the collector was killed at its 128 MB limit). Orders arrive in time order, so keeping the tail keeps
// the newest; the 24h windows stay complete and only the oldest part of the 7-day timeline thins out in extreme weeks.
export const MAX_RETAINED_ORDERS = Math.max(1000, Number(process.env.MAX_RETAINED_ORDERS) || 200_000);
export const capOrders = (rows, max = MAX_RETAINED_ORDERS) => (rows.length > max ? [...rows].sort((a, b) => a.t - b.t).slice(rows.length - max) : rows);
const retainedOrders = (orders, now = Date.now()) => capOrders((Array.isArray(orders) ? orders : []).filter((x) => withinRetention(x, now)));
const loadedOrders = (orders, now = Date.now()) => retainedOrders(orders, now).map(compactOrder);
const retainedObservations = (observations, now = Date.now()) => (Array.isArray(observations) ? observations : [])
  .filter((x) => withinRetention(x, now)).map((x) => ({ t: lnum(x.t), binanceStream: Boolean(x.binanceStream), okxPoll: Boolean(x.okxPoll) }));

export function readCollectorStatePayload(payload, now = Date.now()) {
  if (Array.isArray(payload)) return { orders: loadedOrders(payload, now), observations: [] };
  if (!payload || typeof payload !== "object") return { orders: [], observations: [] };
  return { orders: loadedOrders(payload.orders, now), observations: retainedObservations(payload.observations, now) };
}

export function readCollectorState(file = STATE_FILE, now = Date.now()) {
  try { return readCollectorStatePayload(JSON.parse(readFileSync(file, "utf8")), now); }
  catch { return { orders: [], observations: [] }; }
}

export function collectorStatePayload(orders, observations, now = Date.now()) {
  return { version: 2, retainedMs: LIQUIDATION_ORDER_RETENTION_MS, orders: retainedOrders(orders, now), observations: retainedObservations(observations, now) };
}

const collectorState = readCollectorState();
let liq = collectorState.orders;
let observations = collectorState.observations;
// forceOrder belongs to /market after Binance's 2026 endpoint migration.
export const BINANCE_LIQUIDATION_URL = "wss://fstream.binance.com/market/ws/!forceOrder@arr";
export const BINANCE_SILENCE_TIMEOUT_MS = 10 * MINUTE;

export function parseBinanceForceOrder(payload, now = Date.now()) {
  const event = payload?.data || payload;
  const o = event?.o;
  if (event?.e !== "forceOrder" || !o || !["SELL", "BUY"].includes(o.S)) return null;
  // The merged stream can include coin-margined contracts: their q/z are contracts,
  // not base-asset quantities. Keep this collector's USDT-M scope.
  if ((event.st != null && Number(event.st) !== 1) || !/USDT$/.test(o.s || "")) return null;
  const price = Number(o.ap) > 0 ? Number(o.ap) : Number(o.p);
  const quantity = Number(o.z ?? o.q);
  const usd = Math.round(price * quantity), t = Number(o.T);
  if (!Number.isFinite(usd) || usd <= 0 || !Number.isFinite(t) || t <= 0 || t > now || t < retentionCutoff(now)) return null;
  return { t, s: intern(o.s), side: o.S === "SELL" ? "long" : "short", usd, src: "binance" };
}

export function binanceStreamCoverage(state, now = Date.now(), timeoutMs = BINANCE_SILENCE_TIMEOUT_MS) {
  const anchor = state.lastOrderAt ?? state.connectedAt;
  const silentMs = anchor == null ? null : Math.max(0, now - anchor);
  const status = !state.open ? "disconnected" : silentMs >= timeoutMs ? "silent" : state.lastOrderAt == null ? "awaiting-data" : "receiving";
  return {
    status, available: status === "receiving", connected: Boolean(state.open),
    connectedAt: iso(state.connectedAt), lastOrderAt: iso(state.lastOrderAt),
    silentMs, silenceTimeoutMs: timeoutMs,
    reason: status === "silent" ? "No accepted Binance force orders within the silence timeout; cause unverified" : null,
  };
}

// The runtime and tests use the same handler and storage path.
export function connectBinanceLiquidations(orders, {
  WebSocketImpl = WebSocket, now = Date.now, onClose = () => {}, getOrders = () => orders,
} = {}) {
  const state = { open: false, connectedAt: null, lastOrderAt: null };
  const ws = new WebSocketImpl(BINANCE_LIQUIDATION_URL);
  ws.onopen = () => { state.open = true; state.connectedAt = now(); };
  ws.onmessage = (ev) => {
    try {
      const row = parseBinanceForceOrder(JSON.parse(ev.data), now());
      if (!row) return;
      getOrders().push(row);
      state.lastOrderAt = now();
    } catch { /* malformed frames do not establish coverage */ }
  };
  // Guarded: undici fires "error" again from close() on a failed socket; an unguarded close() inside onerror
  // recursed until "Maximum call stack size exceeded" (2026-10-18 incident, hot-patched on prod the same day).
  // onClose (the reconnect scheduler) must also run at most once per socket.
  let closing = false;
  let closedOnce = false;
  ws.onclose = () => { state.open = false; if (closedOnce) return; closedOnce = true; onClose(); };
  ws.onerror = () => {
    state.open = false;
    if (closing) return;
    closing = true;
    try { if (ws.readyState === 0 || ws.readyState === 1) ws.close(); } catch { /* already closing */ }
  };
  return { ws, state };
}

let binanceStream = { state: { open: false, connectedAt: null, lastOrderAt: null } };
function connectLiquidations() {
  try {
    binanceStream = connectBinanceLiquidations(liq, {
      getOrders: () => liq,
      onClose: () => { log("liquidation stream closed; reconnecting in 5s"); setTimeout(connectLiquidations, 5000); },
    });
  } catch (error) {
    // A synchronous DNS/socket startup failure must not kill the REST collector.
    log(`liquidation stream startup failed: ${error.message}; retrying in 5s`);
    setTimeout(connectLiquidations, 5000);
  }
}

export function liquidationCoverage(orders) {
  const venues = ["Binance", "OKX"].filter(venue => orders.some(row => liquidationTimelineVenue(row) === venue && Number(row.usd) > 0));
  return { venues, venueCount: venues.length, label: venues.length ? `${venues.join(" + ")} observed liquidations` : "No observed liquidations" };
}

export function liquidationWindow(ms, orders = liq, now = Date.now()) {
  const since = now - ms;
  const rows = orders.filter((x) => x.t >= since && x.t <= now);
  const sum = (side) => rows.filter((x) => x.side === side).reduce((a, x) => a + x.usd, 0);
  const bySymbol = {};
  for (const r of rows) bySymbol[r.s] = (bySymbol[r.s] || 0) + r.usd;
  const top = Object.entries(bySymbol).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([symbol, usd]) => ({ symbol, usd }));
  const largest = rows.reduce((m, x) => (x.usd > (m?.usd || 0) ? x : m), null);
  const longUsd = sum("long"), shortUsd = sum("short");
  return { longUsd, shortUsd, totalUsd: longUsd + shortUsd, orders: rows.length, topSymbols: top,
    coverage: liquidationCoverage(rows),
    largest: largest ? { symbol: largest.s, side: largest.side, usd: largest.usd, at: new Date(largest.t).toISOString() } : null };
}

// OKX liquidation orders (REST): a second source, polled every cycle for the majors.
const OKX_FAMILIES = ["BTC-USDT", "ETH-USDT", "SOL-USDT", "XRP-USDT", "DOGE-USDT"];
const okxCtVal = {};
const seenOkx = new Set(liq.filter((x) => x.src === "okx").map((x) => `${x.s}:${x.t}:${x.usd}`));
async function pollOkxLiquidations() {
  let okxPoll = false;
  await Promise.all(OKX_FAMILIES.map(async (fam) => {
    try {
      const inst = `${fam}-SWAP`;
      if (!okxCtVal[inst]) okxCtVal[inst] = Number((await getJson(`https://www.okx.com/api/v5/public/instruments?instType=SWAP&instId=${inst}`)).data?.[0]?.ctVal);
      const rows = (await getJson(`https://www.okx.com/api/v5/public/liquidation-orders?instType=SWAP&instFamily=${fam}&state=filled&limit=100`)).data?.[0]?.details || [];
      okxPoll = true;
      for (const d of rows) {
        const usd = Math.round(Number(d.bkPx) * Number(d.sz) * okxCtVal[inst]);
        const t = Number(d.ts), key = `${inst}:${t}:${usd}`;
        if (!Number.isFinite(usd) || usd <= 0 || seenOkx.has(key) || Date.now() - t > H7) continue;
        seenOkx.add(key);
        liq.push({ t, s: intern(`OKX:${fam.replace("-", "")}`), side: d.posSide === "short" ? "short" : "long", usd, src: "okx" });
      }
    } catch (error) { log(`okx liquidations ${fam} failed: ${error.message}`); }
  }));
  if (!okxPoll) throw new Error("all OKX liquidation polls failed");
  return okxPoll;
}

export function liquidationTimelineSymbol(row) {
  const raw = String(row?.s || row?.symbol || "").toUpperCase().replace(/^OKX:/, "").replace(/-SWAP$/, "").replace(/-/g, "");
  return raw.replace(/USDT$/, "") || "UNKNOWN";
}

export function liquidationTimelineVenue(row) {
  return row?.venue === "OKX" || row?.src === "okx" || /^OKX:/i.test(String(row?.s || "")) ? "OKX" : "Binance";
}

function timelineOrder(row) {
  const t = lnum(row?.t), usd = nonNegativeUsd(row?.usd);
  if (t == null || usd <= 0) return null;
  const side = row?.side === "short" ? "short" : "long";
  return { t, symbol: liquidationTimelineSymbol(row), side, usd, venue: liquidationTimelineVenue(row) };
}

function timelineLargest(rows, start, end, limit = LIQUIDATION_TIMELINE_LARGEST_LIMIT) {
  return rows.filter((x) => x.t >= start && x.t < end)
    .sort((a, b) => b.usd - a.usd || b.t - a.t).slice(0, limit)
    .map((x) => ({ t: x.t, symbol: x.symbol, side: x.side, usd: x.usd, at: iso(x.t), venue: x.venue }));
}

function timelineLargestBySymbol(rows, start, end, perSymbolLimit = 5) {
  const by = new Map();
  for (const row of rows.filter((x) => x.t >= start && x.t < end)) {
    if (!by.has(row.symbol)) by.set(row.symbol, []);
    by.get(row.symbol).push(row);
  }
  return Object.fromEntries([...by.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([symbol, symbolRows]) => [
    symbol,
    symbolRows.sort((a, b) => b.usd - a.usd || b.t - a.t).slice(0, perSymbolLimit)
      .map((x) => ({ t: x.t, symbol: x.symbol, side: x.side, usd: x.usd, at: iso(x.t), venue: x.venue })),
  ]));
}

function observationTimes(observationsInput, now) {
  // A failed poll and a closed stream do not establish observation coverage.
  return retainedObservations(observationsInput, now)
    .filter(x => x.binanceStream || x.okxPoll).map(x => x.t).sort((a,b) => a-b);
}

function compactGaps(buckets, limit = 12) {
  const gaps = [];
  let start = null, end = null, count = 0;
  for (const b of buckets) {
    if (!b.observed) {
      start ??= b.start;
      end = b.end;
      count += 1;
    } else if (start) {
      gaps.push({ start, end, buckets: count });
      start = null; end = null; count = 0;
    }
  }
  if (start) gaps.push({ start, end, buckets: count });
  return gaps.slice(0, limit);
}

function buildTimelineWindow(rows, observationsInput, { windowMs, bucketMs }, now) {
  const endMs = Math.ceil(now / bucketMs) * bucketMs;
  const startMs = endMs - windowMs;
  const buckets = [];
  const obs = observationTimes(observationsInput, now);
  const bySymbolTotals = new Map();
  // One pass over the orders and one over the observations: each row lands in its bucket by index. The previous
  // filter-per-bucket scan was O(rows x buckets) (~1M x 456 per cycle on a 7-day retention) and, with the garbage it
  // made, stretched the 5-minute cycle to 30 minutes before the 2026-10-15 OOM crash loop.
  const bucketCount = Math.ceil(windowMs / bucketMs);
  const bucketRowsByIndex = Array.from({ length: bucketCount }, () => []);
  for (const row of rows) {
    if (row.t < startMs || row.t >= endMs) continue;
    bucketRowsByIndex[Math.floor((row.t - startMs) / bucketMs)].push(row);
  }
  const observedByIndex = new Array(bucketCount).fill(false);
  for (const ot of obs) {
    if (ot < startMs || ot >= endMs) continue;
    observedByIndex[Math.floor((ot - startMs) / bucketMs)] = true;
  }
  for (let t = startMs, index = 0; t < endMs; t += bucketMs, index += 1) {
    const bucketEnd = t + bucketMs;
    const bucketRows = bucketRowsByIndex[index] || [];
    const symbolMap = new Map();
    let longUsd = 0, shortUsd = 0;
    for (const row of bucketRows) {
      const current = symbolMap.get(row.symbol) || { symbol: row.symbol, longUsd: 0, shortUsd: 0, totalUsd: 0, orders: 0 };
      current[`${row.side}Usd`] += row.usd;
      current.totalUsd += row.usd;
      current.orders += 1;
      symbolMap.set(row.symbol, current);
      const total = bySymbolTotals.get(row.symbol) || 0;
      bySymbolTotals.set(row.symbol, total + row.usd);
      if (row.side === "long") longUsd += row.usd; else shortUsd += row.usd;
    }
    const observed = bucketRows.length > 0 || observedByIndex[index] === true;
    const symbols = Object.fromEntries([...symbolMap.values()].sort((a, b) => b.totalUsd - a.totalUsd || a.symbol.localeCompare(b.symbol)).map((s) => [s.symbol, {
      longUsd: s.longUsd, shortUsd: s.shortUsd, totalUsd: s.totalUsd, orders: s.orders,
    }]));
    buckets.push({
      t, start: iso(t), end: iso(bucketEnd), observed,
      totalUsd: longUsd + shortUsd, longUsd, shortUsd, orders: bucketRows.length,
      symbols,
    });
  }
  const symbols = [...bySymbolTotals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([symbol]) => symbol);
  return {
    coverage: liquidationCoverage(rows.filter(x => x.t >= startMs && x.t < endMs)),
    windowMs, bucketMs, coverageSince: iso(obs[0] ?? null), start: iso(startMs), end: iso(endMs), symbols, buckets,
    largest: timelineLargest(rows, startMs, endMs),
    largestBySymbol: timelineLargestBySymbol(rows, startMs, endMs),
    observedBuckets: buckets.filter((b) => b.observed).length,
    unobservedBuckets: buckets.filter((b) => !b.observed).length,
    gaps: compactGaps(buckets),
  };
}

export function buildLiquidationTimeline(orders, observationsInput = [], now = Date.now()) {
  const rows = retainedOrders(orders, now).map(timelineOrder).filter(row => row && row.t <= now);
  const symbols = [...new Set(rows.map((x) => x.symbol))].sort();
  const retainedObs = retainedObservations(observationsInput, now).filter(x => (x.binanceStream || x.okxPoll) && x.t <= now);
  // Loop, not Math.min(...array): a busy 7-day retention holds >100k orders and spreading them as call
  // arguments overflowed the stack (RangeError crash loop 2026-10-13 23:52 UTC, feeds froze ~3 h).
  let firstObserved = null;
  for (const x of retainedObs) if (firstObserved === null || x.t < firstObserved) firstObserved = x.t;
  for (const x of rows) if (firstObserved === null || x.t < firstObserved) firstObserved = x.t;
  const h24 = buildTimelineWindow(rows, observationsInput, LIQUIDATION_TIMELINE_WINDOWS.h24, now);
  const d7 = buildTimelineWindow(rows, observationsInput, LIQUIDATION_TIMELINE_WINDOWS.d7, now);
  return {
    coverage: {
      ...liquidationCoverage(rows),
      since: iso(firstObserved),
      until: iso(now),
      observationCount: retainedObs.length,
      observationModel: "collector-cycle-or-order-inside-bucket",
    },
    symbols,
    h24,
    d7,
  };
}

// ---------- prices, moves, open interest ----------
async function getJson(url) {
  const key = `${new URL(url).hostname}${new URL(url).pathname}`;
  return sourceRunner.run(key, async (signal) => {
    const res = await http(url, { headers: { accept: "application/json", "user-agent": UA }, signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}
async function markets() {
  const tickers = (await getJson("https://fapi.binance.com/fapi/v1/ticker/24hr"))
    .filter((t) => t.symbol.endsWith("USDT")).sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume));
  const top = tickers.slice(0, 60);
  fundingSymbols = topFundingSymbols(tickers);
  const majors = [];
  await Promise.all(["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", "BNBUSDT"].map(async (symbol) => {
    const t = tickers.find((x) => x.symbol === symbol);
    if (!t) return;
    const k = await getJson(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1h&limit=2`);
    const open1h = Number(k[k.length - 1][1]);
    majors.push({ symbol, price: Number(t.lastPrice), change1hPct: round((Number(t.lastPrice) / open1h - 1) * 100), change24hPct: round(Number(t.priceChangePercent)), quoteVolume24h: Math.round(Number(t.quoteVolume)) });
  }));
  const movers = top.map((t) => ({ symbol: t.symbol, change24hPct: round(Number(t.priceChangePercent)), quoteVolume24h: Math.round(Number(t.quoteVolume)) }))
    .filter((t) => Math.abs(t.change24hPct) >= 10).sort((a, b) => Math.abs(b.change24hPct) - Math.abs(a.change24hPct)).slice(0, 10);
  const openInterest = [];
  await Promise.all(["BTCUSDT", "ETHUSDT"].map(async (symbol) => {
    const h = await getJson(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=25`);
    if (h.length >= 2) openInterest.push({ symbol, oiUsd: Math.round(Number(h[h.length - 1].sumOpenInterestValue)), change24hPct: round((Number(h[h.length - 1].sumOpenInterestValue) / Number(h[0].sumOpenInterestValue) - 1) * 100) });
  }));
  return { majors, movers, openInterest };
}
const round = (x) => Math.round(x * 100) / 100;

// ---------- headline radar ----------
const FEEDS = [
  ["SEC", "https://www.sec.gov/news/pressreleases.rss"],
  ["CoinDesk", "https://www.coindesk.com/arc/outboundfeeds/rss/"],
  ["Cointelegraph", "https://cointelegraph.com/rss"],
  ["The Block", "https://www.theblock.co/rss.xml"],
  ["Decrypt", "https://decrypt.co/feed"],
];
const TAGS = [
  ["tokenization", /tokeni[sz]|\bRWA\b|real[- ]world asset|tokenized (stock|treasur|fund|equit)|xStocks|stock token/i],
  ["etf", /\bETF\b|exchange[- ]traded/i],
  ["liquidation", /liquidat|wiped out|long squeeze|short squeeze/i],
  ["hack", /hack|exploit|drain|stolen|breach/i],
  ["regulation", /\bSEC\b|\bCFTC\b|regulat|lawsuit|MiCA|\bbill\b|senate|court/i],
  ["listing", /\blist(s|ing|ed)\b|delist/i],
  ["exchange", /Binance|OKX|Bybit|Bitget|Coinbase|Kraken|KuCoin|Hyperliquid|Gate/i],
  ["stablecoin", /stablecoin|USDT|USDC|Tether|Circle/i],
];
async function headlines() {
  const out = [];
  let answered = 0;
  await Promise.all(FEEDS.map(async ([source, url]) => {
    try {
      await sourceRunner.run(`rss:${source}`, async (signal) => {
        const res = await http(url, { headers: { "user-agent": UA, accept: "application/rss+xml, application/xml, text/xml" }, signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        answered += 1;
        for (const item of xml.split(/<item[\s>]/).slice(1, 30)) {
          const pick = (tag) => (item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          const title = pick("title"), link = pick("link"), date = pick("pubDate") || pick("dc:date");
          const t = Date.parse(date);
          if (!title || !link || !Number.isFinite(t) || Date.now() - t > 48 * 3600e3) continue;
          out.push({ source, title: title.replace(/&amp;/g, "&").replace(/&#39;|&#8217;/g, "'").replace(/&quot;/g, '"'), url: link, publishedAt: new Date(t).toISOString(), tags: TAGS.filter(([, re]) => re.test(title)).map(([n]) => n) });
        }
      });
    } catch (error) { log(`feed ${source} failed: ${error.message}`); }
  }));
  if (!answered) throw new Error("all headline feeds failed");
  return out.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

// ---------- funding rates (Binance premiumIndex + OKX funding-rate) ----------
export const FUNDING_SYMBOL_COUNT = 20;
export const FUNDING_SOURCE = "Binance USDT-M premiumIndex (lastFundingRate, nextFundingTime) + OKX public funding-rate per instrument; top symbols by Binance 24h quote volume";
const FUNDING_FALLBACK_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", "BNBUSDT"];
const fnum = (v) => { const n = typeof v === "number" ? v : Number.parseFloat(v); return Number.isFinite(n) ? n : null; };
const isoMs = (v) => { const n = fnum(v); return n && n > 0 ? new Date(n).toISOString() : null; };

// Top USDT perpetuals by 24h quote volume from a /fapi/v1/ticker/24hr response (base symbols, e.g. "BTC").
export function topFundingSymbols(tickers, count = FUNDING_SYMBOL_COUNT) {
  return (Array.isArray(tickers) ? tickers : [])
    .filter((t) => /USDT$/.test(t.symbol) && !/^(USDC|FDUSD|TUSD|BUSD|USDP|DAI)USDT$/.test(t.symbol) && fnum(t.quoteVolume) > 0)
    .sort((a, b) => fnum(b.quoteVolume) - fnum(a.quoteVolume))
    .slice(0, count)
    .map((t) => t.symbol.replace(/USDT$/, ""));
}

// Binance quotes some small coins as 1000x contracts ("1000PEPEUSDT"); OKX lists the plain coin ("PEPE-USDT-SWAP").
export const okxInstId = (base) => `${String(base).replace(/^1(000)+(?=[A-Z])/, "")}-USDT-SWAP`;

// Map of base symbol -> { rate, nextAt } from the premiumIndex array. Out-of-range or non-numeric rates are dropped.
export function normalizeBinancePremium(premium) {
  const out = new Map();
  for (const x of Array.isArray(premium) ? premium : []) {
    if (!/USDT$/.test(x?.symbol || "")) continue;
    const rate = fnum(x.lastFundingRate);
    if (rate == null || Math.abs(rate) > 0.05) continue;
    out.set(x.symbol.replace(/USDT$/, ""), { rate, nextAt: isoMs(x.nextFundingTime) });
  }
  return out;
}

// One OKX /api/v5/public/funding-rate response -> { rate, nextAt } or null. fundingTime is the settlement of the current period.
export function normalizeOkxFunding(json) {
  const x = json?.data?.[0];
  const rate = fnum(x?.fundingRate);
  if (rate == null || Math.abs(rate) > 0.05) return null;
  return { rate, nextAt: isoMs(x.fundingTime) || isoMs(x.nextFundingTime) };
}

// Rows for the feed: a symbol is kept when at least one venue answered; a venue that did not answer is null, never 0.
export function buildFundingRows(symbols, binanceBySymbol, okxBySymbol) {
  const rows = [];
  for (const symbol of symbols) {
    const b = binanceBySymbol.get(symbol) || null, o = okxBySymbol.get(symbol) || null;
    if (!b && !o) continue;
    rows.push({ symbol, binanceRate: b?.rate ?? null, binanceNextAt: b?.nextAt ?? null, okxRate: o?.rate ?? null, okxNextAt: o?.nextAt ?? null });
  }
  return rows;
}

let fundingSymbols = FUNDING_FALLBACK_SYMBOLS.map((s) => s.replace(/USDT$/, ""));
let lastFunding = readJson(OUT_FILE)?.funding || null;
async function collectFunding(symbols) {
  let binance = new Map();
  const okx = new Map();
  await Promise.all([
    getJson("https://fapi.binance.com/fapi/v1/premiumIndex").then((json) => { binance = normalizeBinancePremium(json); }).catch((error) => log(`binance funding failed: ${error.message}`)),
    // Bounded batches avoid both serial timeout multiplication and a 20-request burst.
    (async () => {
      for (let i = 0; i < symbols.length; i += 4) await Promise.all(symbols.slice(i, i + 4).map(async (base) => {
        try {
          const r = normalizeOkxFunding(await getJson(`https://www.okx.com/api/v5/public/funding-rate?instId=${okxInstId(base)}`));
          if (r) okx.set(base, r);
        } catch (error) { log(`okx funding ${base} failed: ${error.message}`); }
      }));
    })(),
  ]);
  const rows = buildFundingRows(symbols, binance, okx);
  if (!rows.length) throw new Error("no funding rows");
  return { generatedAt: new Date().toISOString(), source: FUNDING_SOURCE, rows };
}

// ---------- events (what is worth writing about now) ----------
function detectEvents(liq1h, liq24h, m) {
  const ev = [];
  const btc = m.majors.find((x) => x.symbol === "BTCUSDT"), eth = m.majors.find((x) => x.symbol === "ETHUSDT");
  for (const x of [btc, eth].filter(Boolean)) {
    if (Math.abs(x.change1hPct) >= 3) ev.push({ type: "sharp-move", severity: "high", text: `${x.symbol} moved ${x.change1hPct}% in the last hour` });
    else if (Math.abs(x.change24hPct) >= 7) ev.push({ type: "big-day", severity: "medium", text: `${x.symbol} moved ${x.change24hPct}% in 24 hours` });
  }
  if (liq1h.totalUsd >= 50e6) ev.push({ type: "liquidation-spike", severity: "high", text: `At least ${Math.round(liq1h.totalUsd / 1e6)}M USD liquidated on ${liq1h.coverage.venues.join(" + ")} futures in 1 hour` });
  const minSide = Math.min(liq24h.longUsd, liq24h.shortUsd);
  if (liq24h.totalUsd >= 100e6 && minSide / liq24h.totalUsd >= 0.35) ev.push({ type: "both-sides-liquidated", severity: "high", text: `Longs and shorts both liquidated in 24h (long ${Math.round(liq24h.longUsd / 1e6)}M / short ${Math.round(liq24h.shortUsd / 1e6)}M USD, ${liq24h.coverage.venues.join(" + ")} lower bound)` });
  for (const mv of m.movers.slice(0, 3)) ev.push({ type: "top-mover", severity: "medium", text: `${mv.symbol} ${mv.change24hPct}% in 24h on ${Math.round(mv.quoteVolume24h / 1e6)}M USD volume` });
  for (const oi of m.openInterest) if (Math.abs(oi.change24hPct) >= 8) ev.push({ type: "open-interest", severity: "medium", text: `${oi.symbol} open interest ${oi.change24hPct}% in 24h` });
  return ev;
}

export async function cycle({ outFile = OUT_FILE, stateFile = STATE_FILE, historyFile = HISTORY_FILE, runner = sourceRunner, collectors = { liquidations: pollOkxLiquidations, markets, headlines, funding: () => collectFunding(fundingSymbols) } } = {}) {
  liq = retainedOrders(liq);
  observations = retainedObservations(observations);
  seenOkx.clear();
  for (const row of liq.filter(x => x.src === "okx")) seenOkx.add(`${row.s}:${row.t}:${row.usd}`);
  const results = await Promise.allSettled(Object.entries(collectors).map(([name, collect]) => runner.run(name, () => collect())));
  const result = Object.fromEntries(Object.keys(collectors).map((name, index) => [name, results[index]]));
  const okxPoll = result.liquidations?.status === "fulfilled" && result.liquidations.value;
  const binanceCoverage = binanceStreamCoverage(binanceStream.state);
  if (binanceCoverage.status === "silent") log("Binance force-order stream unavailable: connected but silent for at least 10 minutes");
  observations.push({ t: Date.now(), binanceStream: binanceCoverage.available, okxPoll: Boolean(okxPoll) });
  const previous = readJson(outFile);
  const m = result.markets?.status === "fulfilled" ? result.markets.value : previous?.market || { majors: [], movers: [], openInterest: [] };
  const news = result.headlines?.status === "fulfilled" ? result.headlines.value : previous?.headlines || [];
  if (result.funding?.status === "fulfilled") lastFunding = result.funding.value;
  if (lastFunding && Date.now() - Date.parse(lastFunding.generatedAt) > 2 * 3600e3) lastFunding = null;
  const sourceStatus = { ...runner.status(), binanceStream: binanceCoverage };
  const stale = !binanceCoverage.available && !results.some((r, i) => r.status === "fulfilled" && (Object.keys(collectors)[i] !== "headlines" || r.value.length));
  const degraded = stale || sourcesDegraded(sourceStatus);
  const l1 = liquidationWindow(3600e3), l4 = liquidationWindow(4 * 3600e3), l24 = liquidationWindow(H24);
  const doc = {
    generatedAt: stale ? previous?.generatedAt || null : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stale, degraded, sourceStatus,
    liquidations: {
      source: `${l24.coverage.label}; a lower bound, not the whole market. Binance snapshots at most one order per symbol per second; OKX polls BTC/ETH/SOL/XRP/DOGE. Only contributing venues are named above.`,
      coverage: { ...l24.coverage, binance: binanceCoverage },
      coverageSince: liq[0] ? new Date(liq[0].t).toISOString() : null,
      h1: l1, h4: l4, h24: l24,
      timeline: buildLiquidationTimeline(liq, observations),
    },
    market: m,
    ...(lastFunding ? { funding: lastFunding } : {}),
    events: detectEvents(l1, l24, m),
    headlines: news.slice(0, 80),
  };
  if (stale && previous) Object.assign(doc, previous, { updatedAt: doc.updatedAt, stale: true, degraded: true, sourceStatus });
  // History: one snapshot per UTC hour (the first cycle of the hour); the summary is recomputed every cycle so the
  // feed always carries it. A history failure never blocks the live feed.
  try {
    const snapshot = historySnapshot(doc);
    if (snapshot && (okxPoll || binanceCoverage.available)) {
      const { rows } = appendHourlySnapshot(historyFile, snapshot);
      const history = summarizeHistory(rows);
      if (history) doc.history = history;
    }
  } catch (error) { log(`history failed: ${error.message}`); }
  atomicWriteJson(outFile, doc);
  atomicWriteJson(stateFile, collectorStatePayload(liq, observations));
  atomicWriteJson(`${outFile}.heartbeat.json`, { updatedAt: doc.updatedAt, status: degraded ? "degraded" : "ok", sourceStatus });
  log(`events=${doc.events.length} headlines=${news.length} liq24h=${Math.round(l24.totalUsd / 1e6)}M funding=${lastFunding ? lastFunding.rows.length : 0}`);
  return doc;
}

// Only the entrypoint starts the stream and the 5-minute loop; tests import the pure helpers above.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  connectLiquidations();
  runCollectorLoop(async () => !(await cycle()).stale, {
    cycleMs: 5 * 60 * 1000,
    onError: (error) => {
      log(`cycle failed: ${error.message}`);
      const updatedAt = new Date().toISOString();
      const previous = readJson(OUT_FILE);
      if (previous) atomicWriteJson(OUT_FILE, { ...previous, updatedAt, stale: true, degraded: true, sourceStatus: sourceRunner.status() });
      atomicWriteJson(`${OUT_FILE}.heartbeat.json`, { updatedAt, status: "error", error: error.message, sourceStatus: sourceRunner.status() });
    },
  });
}
