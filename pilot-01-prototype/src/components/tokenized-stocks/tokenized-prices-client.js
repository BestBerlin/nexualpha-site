// Imported only by the lazy tokenized-stocks components. Never import this from the home entry/router.
import { useEffect, useState } from "react";

export const TS_PRICE_MAX_AGE = 15 * 60_000;
const fresh = (value, now) => {
  const time = Date.parse(value);
  return Number.isFinite(time) && time <= now && now - time < TS_PRICE_MAX_AGE;
};
const finite = (value) => typeof value === "number" && Number.isFinite(value);

/** Revalidate every row and its source whenever the clock advances, including after an unsuccessful refresh. */
export function freshTsPrices(feed, now = Date.now()) {
  if (!fresh(feed?.updatedAt, now) || !Array.isArray(feed?.rows) || !Array.isArray(feed?.sources)) return [];
  const sources = new Map(feed.sources.filter((s) => s?.status === "ok" && fresh(s.updatedAt, now)).map((s) => [s.id, s]));
  return feed.rows.filter((r) => {
    const source = sources.get(r?.sourceId);
    return source && source.venueId === r.venueId && fresh(r.updatedAt, now) && finite(r.lastPrice) && r.lastPrice > 0
      && ["spot", "perpetual"].includes(r.marketType) && typeof r.quoteCurrency === "string" && /^[A-Z0-9]{2,12}$/.test(r.quoteCurrency)
      && typeof r.ticker === "string" && typeof r.instrument === "string";
  }).map((r) => {
    const reference = r.indexSourceId ? sources.get(r.indexSourceId) : null;
    const referenceFresh = !r.indexSourceId && !r.indexUpdatedAt || (fresh(r.indexUpdatedAt, now) && (!r.indexSourceId || reference?.venueId === r.venueId));
    const indexPrice = referenceFresh && finite(r.indexPrice) && r.indexPrice > 0 ? r.indexPrice : null;
    return { ...r, indexPrice,
    change24hPct: finite(r.change24hPct) && r.change24hPct >= -100 ? r.change24hPct : null,
    quoteVolume24h: finite(r.quoteVolume24h) && r.quoteVolume24h >= 0 ? r.quoteVolume24h : null,
    // A premium without a venue-published reference is not meaningful.
    premiumPct: indexPrice != null && finite(r.premiumPct) ? r.premiumPct : null,
    };
  });
}

/** Prices must match the current page's allowed listing universe, including regional venue restrictions. */
export function listedTsPrices(prices, matrix, listings) {
  const tickers = new Map(matrix.map((r) => [r.ticker, r]));
  return prices.filter((p) => {
    const lane = p.marketType === "spot" ? "spot" : "perp";
    const primary = tickers.get(p.ticker)?.by[p.venueId]?.[lane];
    // First require the region-allowed matrix lane, then accept only its primary or explicitly recorded alternate.
    return primary && (primary === p.instrument || listings?.rows?.[p.ticker]?.[`${p.venueId}:${lane}`]?.alt === p.instrument);
  });
}
export const tsPriceGroup = (row) => `${row.marketType}:${row.quoteCurrency}`;
export function tsPriceGroups(rows) {
  return [...new Set(rows.map(tsPriceGroup))].sort((a, b) => {
    const rank = (g) => (g.startsWith("spot:") ? 0 : 10) + (g.endsWith(":USDT") ? 0 : g.endsWith(":USD") ? 1 : 2);
    return rank(a) - rank(b) || a.localeCompare(b);
  });
}

/** A price winner is the lowest last trade, not an executable offer. Volume winner uses the identical market/quote. */
export function tsPriceSummary(rows, group) {
  const byTicker = new Map();
  const ordered = rows.filter((r) => tsPriceGroup(r) === group).sort((a, b) => a.venueId.localeCompare(b.venueId) || a.instrument.localeCompare(b.instrument));
  for (const row of ordered) {
    const entry = byTicker.get(row.ticker) || { price: null, volume: null };
    if (!entry.price || row.lastPrice < entry.price.lastPrice) entry.price = row;
    if (row.quoteVolume24h != null && (!entry.volume || row.quoteVolume24h > entry.volume.quoteVolume24h)) entry.volume = row;
    byTicker.set(row.ticker, entry);
  }
  return byTicker;
}
/** Home rows can prefer different groups: every displayed quote carries its currency, venue and market label. */
export function tsHomePriceSummary(rows) {
  const out = new Map();
  for (const group of tsPriceGroups(rows)) {
    for (const [ticker, summary] of tsPriceSummary(rows, group)) if (!out.has(ticker)) out.set(ticker, summary);
  }
  return out;
}
const metric = { price: (s) => s?.price?.lastPrice, change: (s) => s?.price?.change24hPct,
  volume: (s) => s?.price?.quoteVolume24h, premium: (s) => s?.price?.premiumPct ?? s?.premiumRow?.premiumPct,
  bestPrice: (s) => s?.price?.lastPrice, bestVolume: (s) => s?.volume?.quoteVolume24h };
export function sortTsPrices(rows, summaries, key, dir) {
  const get = metric[key];
  if (!get) return rows;
  const sign = dir === "asc" ? 1 : -1;
  return rows.map((row, index) => ({ row, index })).sort((a, b) => {
    const va = get(summaries.get(a.row.ticker)), vb = get(summaries.get(b.row.ticker));
    if (va == null || vb == null) return va == null && vb == null ? a.index - b.index : va == null ? 1 : -1;
    return va === vb ? a.index - b.index : (va < vb ? -1 : 1) * sign;
  }).map(({ row }) => row);
}
/** Premium/discount comes from perpetuals (their index price tracks the underlying); spot tokens publish no index.
 *  Per ticker, the most liquid perpetual with a premium wins, whatever group the table shows. */
export function tsPremiumByTicker(rows) {
  const out = new Map();
  for (const r of rows || []) {
    if (r.premiumPct == null) continue;
    const cur = out.get(r.ticker);
    if (!cur || (r.quoteVolume24h ?? -1) > (cur.quoteVolume24h ?? -1)) out.set(r.ticker, r);
  }
  return out;
}
/** Turnover reads as $11.7B / 157.8K instead of 11,709,496,098.2561. */
export const tsPriceCompact = (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
export const tsPriceNumber = (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(n);
export const tsPricePercent = (n) => n == null ? "—" : `${n > 0 ? "+" : ""}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n)}%`;
export const tsPriceStamp = (rows) => rows.length ? new Date(Math.min(...rows.map((r) => Date.parse(r.updatedAt)))).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " +00:00") : "";

/** `tickers` limits the request (home strip); the hub asks for every ticker. */
export function useTsPrices(tickers = null) {
  const query = tickers?.length ? `?tickers=${tickers.join(",")}` : "";
  const [feed, setFeed] = useState(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    let stopped = false, active = null;
    const refresh = async () => {
      if (active) return;
      const ctrl = new AbortController();
      active = ctrl;
      const deadline = setTimeout(() => ctrl.abort(), 8_000);
      try {
        const res = await fetch(`/api/tokenized-stocks/prices${query}`, { signal: ctrl.signal, headers: { accept: "application/json" }, cache: "no-store" });
        if (res.ok) {
          const next = await res.json();
          if (!stopped) setFeed(next);
        }
      } catch { /* Expiry continues even when the feed is unreachable. */ }
      finally { clearTimeout(deadline); active = null; if (!stopped) setNow(Date.now()); }
    };
    setNow(Date.now());
    refresh();
    const poll = setInterval(refresh, 60_000);
    // Expiry is 15 min server-side; re-checking every minute (only while visible) keeps idle main-thread work near zero.
    const expiry = setInterval(() => { if (document.visibilityState === "visible") setNow(Date.now()); }, 60_000);
    const resume = () => { setNow(Date.now()); refresh(); };
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => { stopped = true; active?.abort(); clearInterval(poll); clearInterval(expiry); window.removeEventListener("focus", resume); document.removeEventListener("visibilitychange", resume); };
  }, []);
  return freshTsPrices(feed, now);
}
