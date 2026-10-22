// Tokenized US stocks, stock-by-stock view (2026-10-22): one line per ticker with the exchanges that list it (token /
// perpetual), the highest leverage, the lowest standard perpetual taker fee, how many venues trade it 24/7 and its newest
// listing. Built only from tsTickerRows (live listing snapshot + sourced facts) and the snapshot's `since` dates: no
// prices, no premiums, nothing estimated. A value no source publishes stays null and the page prints a dash.
// Shared by the home strip (lazy chunk) and the hub (route chunk); never imported by the router.
import { TS_PREIPO, TS_TICKERS } from "./tokenized-stocks-facts.js";
import { tsVenues } from "./tokenized-stocks.js";
import { tsLive, tsTickerRows, tsTickerSummary } from "./tokenized-stocks-rows.js";
import { formatSgt, readerDayKey } from "./local-time.js";

/** "2026-10-18 23:10" in Singapore time (SSR and browser print the same string). */
export const sgtStamp = (iso) => { const day = readerDayKey(iso); return day ? `${day} ${formatSgt(iso, "en-GB", "clock").replace(/ SGT$/, "")}` : ""; };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Newest `since` date of a ticker among the venues on this page: { date, slug, lane, sym } or null. */
function latestListing(ticker, slugs, data) {
  let latest = null;
  for (const [key, item] of Object.entries(data.rows?.[ticker] || {})) {
    const [slug, lane] = key.split(":");
    if (!slugs.has(slug) || !DAY.test(String(item?.since || ""))) continue;
    if (!latest || item.since > latest.date) latest = { date: item.since, slug, lane, sym: item.sym };
  }
  return latest;
}

/**
 * One entry per ticker (owner ticker order): { ticker, preipo, by: { slug: { spot?, perp? } }, venues, spot, perp, maxLev,
 * maxLevVenues, minTaker, minTakerVenues, weekend, latest }. Pre-IPO contracts count as perpetuals here.
 */
export function tsMatrix({ locale = "en", market, live, tickers = TS_TICKERS } = {}) {
  const data = tsLive(live);
  const venues = tsVenues(locale, market);
  const slugs = new Set(venues.map((ex) => ex.slug));
  return tickers.map((ticker) => {
    const rows = tsTickerRows(ticker, { locale, market, live: data });
    const sum = tsTickerSummary(rows);
    const by = {};
    for (const row of rows) (by[row.exchange.slug] ||= {})[row.lane === "spot" ? "spot" : "perp"] = row.symbol;
    const listed = Object.values(by);
    return {
      ticker, preipo: TS_PREIPO.has(ticker), by,
      venues: listed.length,
      spot: listed.filter((v) => v.spot).length,
      perp: listed.filter((v) => v.perp).length,
      maxLev: sum.maxLev, maxLevVenues: sum.maxLevVenues,
      minTaker: sum.minTaker, minTakerVenues: sum.minTakerVenues,
      weekend: sum.weekend.length,
      latest: latestListing(ticker, slugs, data),
    };
  });
}

/** Most recent listings across the page tickers (newest first): [{ date, ticker, slug, name, lane, sym }]. */
export function tsNewestListings({ locale = "en", market, live, limit = 8, tickers = TS_TICKERS } = {}) {
  const data = tsLive(live);
  const venues = tsVenues(locale, market);
  const names = Object.fromEntries(venues.map((ex) => [ex.slug, ex.name]));
  const out = [];
  for (const ticker of tickers) {
    for (const [key, item] of Object.entries(data.rows?.[ticker] || {})) {
      const [slug, lane] = key.split(":");
      if (!names[slug] || !DAY.test(String(item?.since || ""))) continue;
      out.push({ date: item.since, ticker, slug, name: names[slug], lane: lane === "perp" && TS_PREIPO.has(ticker) ? "preipo" : lane, sym: item.sym });
    }
  }
  return out.sort((a, b) => (a.date === b.date ? a.ticker.localeCompare(b.ticker) : a.date < b.date ? 1 : -1)).slice(0, limit);
}

/** Sort keys of the hub table; ties keep the owner ticker order. */
export const TS_MATRIX_SORTS = Object.freeze({
  venues: (r) => r.venues, spot: (r) => r.spot, perp: (r) => r.perp, lev: (r) => r.maxLev, fee: (r) => r.minTaker,
  weekend: (r) => r.weekend, latest: (r) => r.latest?.date || null,
});

export function tsSortMatrix(rows, key = "venues", dir = "desc") {
  const get = TS_MATRIX_SORTS[key];
  if (!get) return rows;
  const sign = dir === "asc" ? 1 : -1;
  return rows.map((row, index) => ({ row, index })).sort((a, b) => {
    const va = get(a.row), vb = get(b.row);
    // Missing values always sink to the bottom, whatever the direction.
    if (va == null || vb == null) return va == null && vb == null ? a.index - b.index : va == null ? 1 : -1;
    if (va === vb) return a.index - b.index;
    return (va < vb ? -1 : 1) * sign;
  }).map(({ row }) => row);
}
