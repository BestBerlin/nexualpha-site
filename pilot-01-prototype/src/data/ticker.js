import { METRIC_LABELS } from "./ticker-labels.js";
import { LOCALE_CODE_BY_PREFIX } from "./locale-routing.js";

// Live ticker bar (2026-10-13): BTC, ETH, SOL, BNB, XRP price + 24h change and the biggest 24h mover among the most
// traded perpetuals. Server-side only (server/ticker-feed.mjs, the Worker head and tests): the browser never calls an
// exchange; it receives this already formatted snapshot from /api/ticker.json or the prerender state. Numbers are
// formatted once, the same way in every language (en-US digits, U+2212 minus), so the server frame, the hydrated frame
// and every refresh render identical strings for identical data.
export const TICKER_PATH = "/api/ticker.json";
export const TICKER_SYMBOLS = Object.freeze(["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "HYPE"]);
// Refresh cadence does not make a healthy source stale. Collector snapshots arrive every five minutes.
export function isTickerSourceStale(snapshot, at = Date.now(), ttlMs = 6000) {
  const age = at - Date.parse(snapshot?.generatedAt);
  const maxAge = snapshot?.source === "market-events" ? 15 * 60 * 1000 : Math.max(4 * ttlMs, 120000);
  return !Number.isFinite(age) || age < 0 || age >= maxAge;
}
// Biggest mover: among the 60 most traded USDT-M perpetuals (same universe as the market collector's movers).
export const TICKER_MOVER_UNIVERSE = 60;
// ...with at least this much 24h quote volume, so a thin contract never headlines the bar.
export const TICKER_MOVER_MIN_VOLUME_USD = 50e6;
const MINUS = "−";
const STABLE = new Set(["USDC", "FDUSD", "TUSD", "USDP", "DAI", "USDE", "USD1", "BUSD", "EUR", "XUSD", "RLUSD", "PYUSD"]);

export function fmtTickerPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const digits = n >= 10000 ? 0 : n >= 1 ? 2 : n >= 0.01 ? 4 : 6;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}
export function fmtTickerChange(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n).toFixed(2);
  return Number(abs) === 0 ? "0.00%" : `${n > 0 ? "+" : MINUS}${abs}%`;
}
export const tickerDir = (value) => (!Number.isFinite(Number(value)) || Number(Number(value).toFixed(2)) === 0 ? "flat" : Number(value) > 0 ? "up" : "down");
const baseOf = (symbol) => String(symbol || "").replace(/USDT$/, "");

const row = (sym, price, change) => ({ sym, price: fmtTickerPrice(price), change: fmtTickerChange(change), dir: tickerDir(change) });

/** Optional context already present in the collector; missing, failed or expired fields stay absent. */
export function tickerMetricsFromMarketEvents(feed, now = Date.now()) {
  if (!feed || feed.stale || isTickerSourceStale({ source: "market-events", generatedAt: feed.generatedAt }, now)) return [];
  const metrics = [];
  const btc = (Array.isArray(feed.funding?.rows) ? feed.funding.rows : []).find((r) => r?.symbol === "BTC");
  const fundingStatus = feed.sourceStatus?.funding?.status;
  if ((!fundingStatus || fundingStatus === "ok") && typeof btc?.binanceRate === "number" && Number.isFinite(btc.binanceRate)) {
    const pct = btc.binanceRate * 100;
    metrics.push({ id: "btc-funding", label: "BTC funding", value: `${pct > 0 ? "+" : pct < 0 ? MINUS : ""}${Math.abs(pct).toFixed(4)}%` });
  }
  const total = feed.liquidations?.h24?.totalUsd;
  const liquidationStatus = feed.sourceStatus?.liquidations?.status;
  if ((!liquidationStatus || liquidationStatus === "ok") && typeof total === "number" && Number.isFinite(total) && total >= 0) {
    const value = total >= 1e9 ? `$${(total / 1e9).toFixed(2)}B` : total >= 1e6 ? `$${(total / 1e6).toFixed(2)}M` : `$${total.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    metrics.push({ id: "liquidations-24h", label: "24h observed liquidations", value });
  }
  return metrics;
}

/** Snapshot from Binance USDT-M `GET /fapi/v1/ticker/24hr` rows (all symbols). Null when the majors are missing. */
export function tickerFromBinance(rows, { now = Date.now() } = {}) {
  if (!Array.isArray(rows)) return null;
  const bySymbol = new Map(rows.filter((r) => r && typeof r.symbol === "string").map((r) => [r.symbol, r]));
  const items = TICKER_SYMBOLS.map((sym) => bySymbol.get(`${sym}USDT`)).filter(Boolean)
    .filter((r) => Number.isFinite(Number(r.lastPrice)) && Number(r.lastPrice) > 0)
    .map((r) => row(baseOf(r.symbol), r.lastPrice, r.priceChangePercent));
  if (items.length < 3) return null;
  const universe = rows.filter((r) => /USDT$/.test(r?.symbol || "") && Number(r.quoteVolume) >= TICKER_MOVER_MIN_VOLUME_USD)
    .sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume)).slice(0, TICKER_MOVER_UNIVERSE)
    .filter((r) => !TICKER_SYMBOLS.includes(baseOf(r.symbol)) && !STABLE.has(baseOf(r.symbol)) && /^[A-Z0-9]{2,15}$/.test(baseOf(r.symbol)));
  const top = universe.reduce((best, r) => (Math.abs(Number(r.priceChangePercent) || 0) > Math.abs(Number(best?.priceChangePercent) || 0) ? r : best), null);
  return { generatedAt: new Date(now).toISOString(), source: "binance-usdm", items, mover: top ? { sym: baseOf(top.symbol), change: fmtTickerChange(top.priceChangePercent), dir: tickerDir(top.priceChangePercent) } : null };
}

/** Fallback snapshot from the market collector feed (market-events.json, refreshed every 5 minutes). */
export function tickerFromMarketEvents(feed) {
  const majors = Array.isArray(feed?.market?.majors) ? feed.market.majors : [];
  const available = [...majors, ...(Array.isArray(feed?.market?.movers) ? feed.market.movers : [])];
  const items = TICKER_SYMBOLS.map((sym) => available.find((m) => m?.symbol === `${sym}USDT`)).filter(Boolean)
    .filter((m) => Number.isFinite(Number(m.price)) && Number(m.price) > 0)
    .map((m) => row(baseOf(m.symbol), m.price, m.change24hPct));
  if (items.length < 3) return null;
  const movers = (Array.isArray(feed?.market?.movers) ? feed.market.movers : [])
    .filter((m) => m && !TICKER_SYMBOLS.includes(baseOf(m.symbol)) && !STABLE.has(baseOf(m.symbol)) && Number.isFinite(Number(m.change24hPct)));
  const top = movers.sort((a, b) => Math.abs(b.change24hPct) - Math.abs(a.change24hPct))[0];
  return { generatedAt: Number.isFinite(Date.parse(feed?.generatedAt)) ? new Date(Date.parse(feed.generatedAt)).toISOString() : null, source: "market-events",
    metrics: tickerMetricsFromMarketEvents(feed), items, mover: top ? { sym: baseOf(top.symbol), change: fmtTickerChange(top.change24hPct), dir: tickerDir(top.change24hPct) } : null };
}

/** True for a snapshot the bar can render (shape check for anything read from the network or prerender state). */
export function isTickerSnapshot(value) {
  return Boolean(value && Array.isArray(value.items) && value.items.length && value.items.every((i) => i && typeof i.sym === "string" && typeof i.price === "string" && typeof i.change === "string"));
}

const escHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/**
 * Writes a snapshot into prerendered HTML that was rendered with an empty bar (TickerBar with no data): the text of
 * every `data-tk` value and the `data-dir` of each row, in both copies of the list. The result is byte-identical to
 * rendering TickerBar with that snapshot (tests/ticker.test.mjs), so hydration sees the same markup. Function
 * replacers only: the values are data.
 */
export function spliceTickerHtml(html, snapshot) {
  if (typeof html !== "string" || !isTickerSnapshot(snapshot) || (!html.includes("nx-ticker") && !html.includes("h7-terminal"))) return html;
  const text = new Map();
  const dirs = new Map();
  for (const item of snapshot.items) {
    text.set(`${item.sym}-p`, item.price); text.set(`${item.sym}-c`, item.change); dirs.set(item.sym, item.dir || "flat");
  }
  if (snapshot.mover) { text.set("mover-sym", snapshot.mover.sym); text.set("mover-c", snapshot.mover.change); dirs.set("mover", snapshot.mover.dir || "flat"); }
  let out = html.replace(/(<li class="nx-ticker__item[^"]*" data-sym=")([A-Za-z0-9]+)(" data-dir=")([a-z]+)(")/g,
    (match, a, sym, b, dir, c) => (dirs.has(sym) ? `${a}${sym}${b}${dirs.get(sym)}${c}` : match));
  out = out.replace(/(<(span|b)\b[^>]*\bdata-tk=")([A-Za-z0-9-]+)("[^>]*>)([^<]*)(<\/\2>)/g,
    (match, open, _tag, key, rest, _old, close) => (text.has(key) ? `${open}${key}${rest}${escHtml(text.get(key))}${close}` : match));
  out = out.replace(/(<div class="nx-ticker"[^>]*\bdata-ticker-source=")([a-z-]+)(")/g, (_m, a, _old, c) => `${a}${escHtml(snapshot.source || "none")}${c}`);
  // Prerendered bars omit unavailable optional rows. Rebuild those rows in both lists so the
  // injected hydration snapshot and server markup have exactly the same children and order.
  out = out.replace(/(<ul class="nx-ticker__list"[^>]*>)([\s\S]*?)(<\/ul>)/g, (_match, open, body, close) => {
    const coinHref = body.match(/href="([^" ]*)\/coins\/bitcoin"/)?.[1] || "";
    const prefix = coinHref.replace(/^\//, "");
    const locale = LOCALE_CODE_BY_PREFIX[prefix] || "en";
    const hidden = open.includes('aria-hidden="true"');
    body = body.replace(/<li class="nx-ticker__item" data-sym="(?:DOGE|HYPE)"[\s\S]*?<\/li>/g, "")
      .replace(/<li class="nx-ticker__item nx-ticker__item--mover">[\s\S]*?<\/li>/g, "");
    const optional = ["DOGE", "HYPE"].flatMap(sym => {
      const item = snapshot.items.find(row => row.sym === sym);
      if (!item) return [];
      const slug = sym === "DOGE" ? "dogecoin" : "hyperliquid";
      return [`<li class="nx-ticker__item" data-sym="${sym}" data-dir="${escHtml(item.dir || "flat")}"><a href="${coinHref}/coins/${slug}"${hidden ? ' tabindex="-1"' : ""}><b translate="no">${sym}</b><span class="nx-ticker__p" data-tk="${sym}-p">${escHtml(item.price || "—")}</span><span class="nx-ticker__c" data-tk="${sym}-c">${escHtml(item.change || "—")}</span></a></li>`];
    }).join("");
    body = body.replace(/(?=<li class="nx-ticker__item nx-ticker__item--mover" data-sym="mover")/, () => optional);
    const metrics = (snapshot.metrics || []).map(metric => `<li class="nx-ticker__item nx-ticker__item--mover"><span class="nx-ticker__l">${escHtml((METRIC_LABELS[locale] || METRIC_LABELS.en)[metric.id === "btc-funding" ? 0 : 1])}</span><span class="nx-ticker__p">${escHtml(metric.value)}</span></li>`).join("");
    return open + body + metrics + close;
  });
  out = out.replace(/(<li\b[^>]*\bdata-sym=")([A-Za-z0-9]+)("\s+data-dir=")([a-z]+)(")/g,
    (match, a, sym, b, dir, c) => (dirs.has(sym) ? `${a}${sym}${b}${dirs.get(sym)}${c}` : match));
  out = out.replace(/(<(span|b)\b[^>]*\bdata-ht=")([A-Za-z0-9-]+)("[^>]*>)([^<]*)(<\/\2>)/g,
    (match, open, _tag, key, rest, _old, close) => (text.has(key) ? `${open}${key}${rest}${escHtml(text.get(key))}${close}` : match));
  out = out.replace(/(<span class="ht-badge"[^>]*\bdata-ht="BTC-c"\s+data-dir=")([a-z]+)(")/g,
    (_m, a, _old, c) => `${a}${dirs.get("BTC") || "flat"}${c}`);
  return out;
}
