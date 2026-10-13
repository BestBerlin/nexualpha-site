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
import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
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

// ---------- liquidations (Binance force-order stream) ----------
const lnum = (v) => { const n = typeof v === "number" ? v : Number.parseFloat(v); return Number.isFinite(n) ? n : null; };
const nonNegativeUsd = (v) => Math.max(0, Math.round(lnum(v) ?? 0));
const iso = (t) => Number.isFinite(t) ? new Date(t).toISOString() : null;
const retentionCutoff = (now = Date.now(), retentionMs = LIQUIDATION_ORDER_RETENTION_MS) => now - retentionMs;
const withinRetention = (row, now = Date.now(), retentionMs = LIQUIDATION_ORDER_RETENTION_MS) => {
  const t = lnum(row?.t);
  return t != null && t >= retentionCutoff(now, retentionMs) && t <= now + HOUR;
};
const retainedOrders = (orders, now = Date.now()) => (Array.isArray(orders) ? orders : []).filter((x) => withinRetention(x, now));
const retainedObservations = (observations, now = Date.now()) => (Array.isArray(observations) ? observations : [])
  .filter((x) => withinRetention(x, now)).map((x) => ({ t: lnum(x.t), binanceStream: Boolean(x.binanceStream), okxPoll: Boolean(x.okxPoll) }));

export function readCollectorStatePayload(payload, now = Date.now()) {
  if (Array.isArray(payload)) return { orders: retainedOrders(payload, now), observations: [] };
  if (!payload || typeof payload !== "object") return { orders: [], observations: [] };
  return { orders: retainedOrders(payload.orders, now), observations: retainedObservations(payload.observations, now) };
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
let liquidationStreamOpen = false;
function connectLiquidations() {
  const ws = new WebSocket("wss://fstream.binance.com/ws/!forceOrder@arr");
  ws.onopen = () => { liquidationStreamOpen = true; };
  ws.onmessage = (ev) => {
    try {
      const o = JSON.parse(ev.data).o;
      const usd = Number(o.ap || o.p) * Number(o.z || o.q);
      if (!Number.isFinite(usd) || usd <= 0) return;
      // side SELL = a long position was liquidated; BUY = a short position was liquidated
      liq.push({ t: Number(o.T) || Date.now(), s: o.s, side: o.S === "SELL" ? "long" : "short", usd: Math.round(usd) });
    } catch { /* ignore malformed */ }
  };
  ws.onclose = () => { liquidationStreamOpen = false; log("liquidation stream closed; reconnecting in 5s"); setTimeout(connectLiquidations, 5000); };
  ws.onerror = () => { liquidationStreamOpen = false; ws.close(); };
}

function liquidationWindow(ms) {
  const since = Date.now() - ms;
  const rows = liq.filter((x) => x.t >= since);
  const sum = (side) => rows.filter((x) => x.side === side).reduce((a, x) => a + x.usd, 0);
  const bySymbol = {};
  for (const r of rows) bySymbol[r.s] = (bySymbol[r.s] || 0) + r.usd;
  const top = Object.entries(bySymbol).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([symbol, usd]) => ({ symbol, usd }));
  const largest = rows.reduce((m, x) => (x.usd > (m?.usd || 0) ? x : m), null);
  const longUsd = sum("long"), shortUsd = sum("short");
  return { longUsd, shortUsd, totalUsd: longUsd + shortUsd, orders: rows.length, topSymbols: top,
    largest: largest ? { symbol: largest.s, side: largest.side, usd: largest.usd, at: new Date(largest.t).toISOString() } : null };
}

// OKX liquidation orders (REST): a second source, polled every cycle for the majors.
const OKX_FAMILIES = ["BTC-USDT", "ETH-USDT", "SOL-USDT", "XRP-USDT", "DOGE-USDT"];
const okxCtVal = {};
const seenOkx = new Set(liq.filter((x) => x.src === "okx").map((x) => `${x.s}:${x.t}:${x.usd}`));
async function pollOkxLiquidations() {
  let okxPoll = false;
  for (const fam of OKX_FAMILIES) {
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
        liq.push({ t, s: `OKX:${fam.replace("-", "")}`, side: d.posSide === "short" ? "short" : "long", usd, src: "okx" });
      }
    } catch (error) { log(`okx liquidations ${fam} failed: ${error.message}`); }
  }
  return okxPoll;
}

export function liquidationTimelineSymbol(row) {
  const raw = String(row?.s || row?.symbol || "").toUpperCase().replace(/^OKX:/, "").replace(/-SWAP$/, "").replace(/-/g, "");
  return raw.replace(/USDT$/, "") || "UNKNOWN";
}

export function liquidationTimelineVenue(row) {
  return row?.src === "okx" || /^OKX:/i.test(String(row?.s || "")) ? "OKX" : "Binance";
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
  for (let t = startMs; t < endMs; t += bucketMs) {
    const bucketEnd = t + bucketMs;
    const bucketRows = rows.filter((x) => x.t >= t && x.t < bucketEnd);
    const symbolMap = new Map();
    for (const row of bucketRows) {
      const current = symbolMap.get(row.symbol) || { symbol: row.symbol, longUsd: 0, shortUsd: 0, totalUsd: 0, orders: 0 };
      current[`${row.side}Usd`] += row.usd;
      current.totalUsd += row.usd;
      current.orders += 1;
      symbolMap.set(row.symbol, current);
      const total = bySymbolTotals.get(row.symbol) || 0;
      bySymbolTotals.set(row.symbol, total + row.usd);
    }
    const longUsd = bucketRows.filter((x) => x.side === "long").reduce((a, x) => a + x.usd, 0);
    const shortUsd = bucketRows.filter((x) => x.side === "short").reduce((a, x) => a + x.usd, 0);
    const observed = bucketRows.length > 0 || obs.some((ot) => ot >= t && ot < bucketEnd);
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
  const knownTimes = [...retainedObs.map(x => x.t), ...rows.map(x => x.t)];
  const firstObserved = knownTimes.length ? Math.min(...knownTimes) : null;
  const h24 = buildTimelineWindow(rows, observationsInput, LIQUIDATION_TIMELINE_WINDOWS.h24, now);
  const d7 = buildTimelineWindow(rows, observationsInput, LIQUIDATION_TIMELINE_WINDOWS.d7, now);
  return {
    coverage: {
      label: LIQUIDATION_TIMELINE_SOURCE_LABEL,
      venueCount: 2,
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
  const res = await fetch(url, { headers: { accept: "application/json", "user-agent": UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json();
}
async function markets() {
  const tickers = (await getJson("https://fapi.binance.com/fapi/v1/ticker/24hr"))
    .filter((t) => t.symbol.endsWith("USDT")).sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume));
  const top = tickers.slice(0, 60);
  fundingSymbols = topFundingSymbols(tickers);
  const majors = [];
  for (const symbol of ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", "BNBUSDT"]) {
    const t = tickers.find((x) => x.symbol === symbol);
    if (!t) continue;
    const k = await getJson(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1h&limit=2`);
    const open1h = Number(k[k.length - 1][1]);
    majors.push({ symbol, price: Number(t.lastPrice), change1hPct: round((Number(t.lastPrice) / open1h - 1) * 100), change24hPct: round(Number(t.priceChangePercent)), quoteVolume24h: Math.round(Number(t.quoteVolume)) });
  }
  const movers = top.map((t) => ({ symbol: t.symbol, change24hPct: round(Number(t.priceChangePercent)), quoteVolume24h: Math.round(Number(t.quoteVolume)) }))
    .filter((t) => Math.abs(t.change24hPct) >= 10).sort((a, b) => Math.abs(b.change24hPct) - Math.abs(a.change24hPct)).slice(0, 10);
  const openInterest = [];
  for (const symbol of ["BTCUSDT", "ETHUSDT"]) {
    const h = await getJson(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=25`);
    if (h.length >= 2) openInterest.push({ symbol, oiUsd: Math.round(Number(h[h.length - 1].sumOpenInterestValue)), change24hPct: round((Number(h[h.length - 1].sumOpenInterestValue) / Number(h[0].sumOpenInterestValue) - 1) * 100) });
  }
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
  for (const [source, url] of FEEDS) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/rss+xml, application/xml, text/xml" }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      for (const item of xml.split(/<item[\s>]/).slice(1, 30)) {
        const pick = (tag) => (item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
        const title = pick("title"), link = pick("link"), date = pick("pubDate") || pick("dc:date");
        const t = Date.parse(date);
        if (!title || !link || !Number.isFinite(t) || Date.now() - t > 48 * 3600e3) continue;
        out.push({ source, title: title.replace(/&amp;/g, "&").replace(/&#39;|&#8217;/g, "'").replace(/&quot;/g, '"'), url: link, publishedAt: new Date(t).toISOString(), tags: TAGS.filter(([, re]) => re.test(title)).map(([n]) => n) });
      }
    } catch (error) { log(`feed ${source} failed: ${error.message}`); }
  }
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
let lastFunding = null;
async function collectFunding(symbols) {
  const binance = normalizeBinancePremium(await getJson("https://fapi.binance.com/fapi/v1/premiumIndex"));
  const okx = new Map();
  for (const base of symbols) {
    try {
      const r = normalizeOkxFunding(await getJson(`https://www.okx.com/api/v5/public/funding-rate?instId=${okxInstId(base)}`));
      if (r) okx.set(base, r);
    } catch (error) { log(`okx funding ${base} failed: ${error.message}`); }
    await new Promise((r) => setTimeout(r, 150));
  }
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
  if (liq1h.totalUsd >= 50e6) ev.push({ type: "liquidation-spike", severity: "high", text: `At least ${Math.round(liq1h.totalUsd / 1e6)}M USD liquidated on Binance and OKX futures in 1 hour` });
  const minSide = Math.min(liq24h.longUsd, liq24h.shortUsd);
  if (liq24h.totalUsd >= 100e6 && minSide / liq24h.totalUsd >= 0.35) ev.push({ type: "both-sides-liquidated", severity: "high", text: `Longs and shorts both liquidated in 24h (long ${Math.round(liq24h.longUsd / 1e6)}M / short ${Math.round(liq24h.shortUsd / 1e6)}M USD, Binance+OKX lower bound)` });
  for (const mv of m.movers.slice(0, 3)) ev.push({ type: "top-mover", severity: "medium", text: `${mv.symbol} ${mv.change24hPct}% in 24h on ${Math.round(mv.quoteVolume24h / 1e6)}M USD volume` });
  for (const oi of m.openInterest) if (Math.abs(oi.change24hPct) >= 8) ev.push({ type: "open-interest", severity: "medium", text: `${oi.symbol} open interest ${oi.change24hPct}% in 24h` });
  return ev;
}

async function cycle() {
  liq = retainedOrders(liq);
  observations = retainedObservations(observations);
  seenOkx.clear();
  for (const row of liq.filter(x => x.src === "okx")) seenOkx.add(`${row.s}:${row.t}:${row.usd}`);
  const okxPoll = await pollOkxLiquidations();
  observations.push({ t: Date.now(), binanceStream: liquidationStreamOpen, okxPoll });
  let m = { majors: [], movers: [], openInterest: [] };
  try { m = await markets(); } catch (error) { log(`markets failed: ${error.message}`); }
  const news = await headlines();
  // Funding: a failed pass keeps the previous block (at most 2 hours old) rather than inventing rates.
  try { lastFunding = await collectFunding(fundingSymbols); }
  catch (error) { log(`funding failed: ${error.message}`); if (lastFunding && Date.now() - Date.parse(lastFunding.generatedAt) > 2 * 3600e3) lastFunding = null; }
  const l1 = liquidationWindow(3600e3), l4 = liquidationWindow(4 * 3600e3), l24 = liquidationWindow(H24);
  const doc = {
    generatedAt: new Date().toISOString(),
    liquidations: {
      source: "Binance USDT-M force-order stream (at most one order per symbol per second) plus OKX liquidation orders for BTC/ETH/SOL/XRP/DOGE; a lower bound, not the whole market",
      coverageSince: liq[0] ? new Date(liq[0].t).toISOString() : null,
      h1: l1, h4: l4, h24: l24,
      timeline: buildLiquidationTimeline(liq, observations),
    },
    market: m,
    ...(lastFunding ? { funding: lastFunding } : {}),
    events: detectEvents(l1, l24, m),
    headlines: news.slice(0, 80),
  };
  // History: one snapshot per UTC hour (the first cycle of the hour); the summary is recomputed every cycle so the
  // feed always carries it. A history failure never blocks the live feed.
  try {
    const snapshot = historySnapshot(doc);
    if (snapshot) {
      const { rows } = appendHourlySnapshot(HISTORY_FILE, snapshot);
      const history = summarizeHistory(rows);
      if (history) doc.history = history;
    }
  } catch (error) { log(`history failed: ${error.message}`); }
  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileSync(`${OUT_FILE}.tmp`, JSON.stringify(doc)); renameSync(`${OUT_FILE}.tmp`, OUT_FILE);
  writeFileSync(`${STATE_FILE}.tmp`, JSON.stringify(collectorStatePayload(liq, observations))); renameSync(`${STATE_FILE}.tmp`, STATE_FILE);
  log(`events=${doc.events.length} headlines=${news.length} liq24h=${Math.round(l24.totalUsd / 1e6)}M funding=${lastFunding ? lastFunding.rows.length : 0}`);
}

// Only the entrypoint starts the stream and the 5-minute loop; tests import the pure helpers above.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  connectLiquidations();
  cycle();
  setInterval(cycle, 5 * 60 * 1000);
}
