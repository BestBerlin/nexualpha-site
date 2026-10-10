#!/usr/bin/env node
// NexuAlpha market-event collector (2026-10-10). Finds what crypto traders want to read about today, from public
// exchange data and public news feeds, so articles and Telegram posts start from real events:
//   - liquidations: Binance USDT-M force orders over 1h / 4h / 24h, split long vs short ("both sides wiped out");
//   - big moves: 1h and 24h moves of the most traded perpetuals; open-interest change for BTC and ETH;
//   - headline radar: titles from public RSS feeds (SEC, crypto press), tagged (tokenization, ETF, hack, listing...).
// Headlines are for topic discovery only; articles must go back to primary sources.
// Binance's liquidation stream sends at most the latest order per symbol per second, so totals are a lower bound and
// are labelled as such. Output: one JSON file (OUT_FILE), rewritten atomically every 5 minutes.
import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import path from "node:path";

const OUT_FILE = process.env.OUT_FILE || "/var/lib/nexualpha-market/market-events.json";
const STATE_FILE = process.env.STATE_FILE || path.join(path.dirname(OUT_FILE), "liquidations-24h.json");
const UA = "NexuAlphaMarketCollector/1.0 (+https://nexualpha.com)";
const H24 = 24 * 3600e3;
const log = (m) => console.log(`[market] ${new Date().toISOString()} ${m}`);

// ---------- liquidations (Binance force-order stream) ----------
let liq = [];
try { liq = JSON.parse(readFileSync(STATE_FILE, "utf8")).filter((x) => Date.now() - x.t < H24); } catch { /* fresh start */ }
function connectLiquidations() {
  const ws = new WebSocket("wss://fstream.binance.com/ws/!forceOrder@arr");
  ws.onmessage = (ev) => {
    try {
      const o = JSON.parse(ev.data).o;
      const usd = Number(o.ap || o.p) * Number(o.z || o.q);
      if (!Number.isFinite(usd) || usd <= 0) return;
      // side SELL = a long position was liquidated; BUY = a short position was liquidated
      liq.push({ t: Number(o.T) || Date.now(), s: o.s, side: o.S === "SELL" ? "long" : "short", usd: Math.round(usd) });
    } catch { /* ignore malformed */ }
  };
  ws.onclose = () => { log("liquidation stream closed; reconnecting in 5s"); setTimeout(connectLiquidations, 5000); };
  ws.onerror = () => ws.close();
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
  for (const fam of OKX_FAMILIES) {
    try {
      const inst = `${fam}-SWAP`;
      if (!okxCtVal[inst]) okxCtVal[inst] = Number((await getJson(`https://www.okx.com/api/v5/public/instruments?instType=SWAP&instId=${inst}`)).data?.[0]?.ctVal);
      const rows = (await getJson(`https://www.okx.com/api/v5/public/liquidation-orders?instType=SWAP&instFamily=${fam}&state=filled&limit=100`)).data?.[0]?.details || [];
      for (const d of rows) {
        const usd = Math.round(Number(d.bkPx) * Number(d.sz) * okxCtVal[inst]);
        const t = Number(d.ts), key = `${inst}:${t}:${usd}`;
        if (!Number.isFinite(usd) || usd <= 0 || seenOkx.has(key) || Date.now() - t > H24) continue;
        seenOkx.add(key);
        liq.push({ t, s: `OKX:${fam.replace("-", "")}`, side: d.posSide === "short" ? "short" : "long", usd, src: "okx" });
      }
    } catch (error) { log(`okx liquidations ${fam} failed: ${error.message}`); }
  }
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
  liq = liq.filter((x) => Date.now() - x.t < H24);
  await pollOkxLiquidations();
  let m = { majors: [], movers: [], openInterest: [] };
  try { m = await markets(); } catch (error) { log(`markets failed: ${error.message}`); }
  const news = await headlines();
  const l1 = liquidationWindow(3600e3), l4 = liquidationWindow(4 * 3600e3), l24 = liquidationWindow(H24);
  const doc = {
    generatedAt: new Date().toISOString(),
    liquidations: { source: "Binance USDT-M force-order stream (at most one order per symbol per second) plus OKX liquidation orders for BTC/ETH/SOL/XRP/DOGE; a lower bound, not the whole market", coverageSince: liq[0] ? new Date(liq[0].t).toISOString() : null, h1: l1, h4: l4, h24: l24 },
    market: m,
    events: detectEvents(l1, l24, m),
    headlines: news.slice(0, 80),
  };
  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileSync(`${OUT_FILE}.tmp`, JSON.stringify(doc)); renameSync(`${OUT_FILE}.tmp`, OUT_FILE);
  writeFileSync(`${STATE_FILE}.tmp`, JSON.stringify(liq)); renameSync(`${STATE_FILE}.tmp`, STATE_FILE);
  log(`events=${doc.events.length} headlines=${news.length} liq24h=${Math.round(l24.totalUsd / 1e6)}M`);
}

connectLiquidations();
cycle();
setInterval(cycle, 5 * 60 * 1000);
