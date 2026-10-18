// Tokenized US stocks, ticker and exchange pages (2026-10-18): one row per exchange product that lists a ticker.
// Symbols, maximum leverage and standard fees come from the live listing snapshot (the exchanges' own public market data,
// tokenized-stocks-live.generated.js, or the newer runtime copy the server passes in); trading hours, dividend handling,
// the in-app path and region exclusions come from the sourced facts (tokenized-stocks-facts.js). Exchanges we do not
// read live (HTX, Backpack, Hyperliquid, CoinW) keep their sourced fact rows. Nothing is guessed: a value neither source
// publishes stays empty.
import { TS_LIVE_BAKED } from "./tokenized-stocks-live.generated.js";
import { TS_LIVE_ENDPOINTS } from "./tokenized-stocks-live-sources.js";
import { TS_PREIPO, tsListings } from "./tokenized-stocks-facts.js";
import { tsVenues, tsCitable } from "./tokenized-stocks.js";

const LIVE = new Set(Object.keys(TS_LIVE_ENDPOINTS));
const SPOT_FORM = Object.freeze({ bitget: "rToken", okx: "xStocks", binance: "bStocks", bybit: "xStocks", kraken: "xStocks" });

/** A usable live table ({ generatedAt, counts, checked, rows }) or the one baked into the release. */
export function tsLive(live) {
  return live && typeof live === "object" && live.rows && Number.isFinite(Date.parse(live.generatedAt))
    && Date.parse(live.generatedAt) >= Date.parse(TS_LIVE_BAKED.generatedAt) ? live : TS_LIVE_BAKED;
}

/** The live table without one venue (Türkiye pages never carry Bitget, not even in the hydration state). */
export function tsLiveWithout(live, slug) {
  if (!live?.rows) return live;
  const drop = (obj) => Object.fromEntries(Object.entries(obj || {}).filter(([key]) => key !== slug));
  return {
    ...live, counts: drop(live.counts), checked: drop(live.checked),
    rows: Object.fromEntries(Object.entries(live.rows).map(([ticker, lanes]) => [ticker, Object.fromEntries(Object.entries(lanes).filter(([key]) => !key.startsWith(`${slug}:`)))])),
    events: (live.events || []).filter((e) => e.venue !== slug),
  };
}

/** The cited live source of a venue lane: { id, url, title, date } (date = the SGT day it was read). */
export function tsLiveSource(slug, lane, live) {
  const url = TS_LIVE_ENDPOINTS[slug]?.[lane];
  const at = tsLive(live).checked?.[slug]?.[lane];
  if (!url || !at) return null;
  const sgt = new Date(Date.parse(at) + 8 * 3600e3).toISOString().slice(0, 10);
  return { id: `live:${slug}:${lane}`, url, title: `${slug} ${lane} market data`, date: sgt, dateKind: "checked", live: true };
}

const factIds = (...facts) => facts.filter(Boolean).flatMap((fact) => fact.s || []);

function liveRow(ex, lane, item, ticker, live) {
  const facts = ex[lane] || {};
  const preipo = lane === "perp" && TS_PREIPO.has(ticker);
  const laneFacts = preipo && ex.preipo ? ex.preipo : facts;
  const lev = item.lev ?? null;
  const factLev = lev == null && !preipo && laneFacts.lev && lane === "perp" ? laneFacts.lev : null;
  const fee = item.taker != null ? { v: { maker: item.maker ?? null, taker: item.taker } } : (laneFacts.fee || null);
  return {
    exchange: ex, lane: preipo ? "preipo" : lane, symbol: item.sym,
    form: lane === "spot" ? (item.form || SPOT_FORM[ex.slug] || laneFacts.form?.v || null) : "USDT-M",
    alt: item.alt ? { sym: item.alt, form: item.altForm } : null,
    lev, levFact: factLev, fee, feeLive: item.taker != null,
    hours: laneFacts.hours || null, dividends: laneFacts.dividends || null,
    live: tsLiveSource(ex.slug, lane, live),
    factSources: factIds(laneFacts.hours, laneFacts.dividends, factLev, item.taker != null ? null : laneFacts.fee),
  };
}

function factRow(row) {
  const d = row.data;
  return {
    exchange: row.exchange, lane: row.lane, symbol: row.symbol, form: row.lane === "spot" ? d.form?.v || null : d.form?.v || null,
    alt: null, lev: row.lev, levFact: row.lev == null ? d.lev || null : null, fee: d.fee || null, feeLive: false,
    hours: d.hours || null, dividends: d.dividends || null, live: null,
    factSources: factIds(d.tickers, d.hours, d.dividends, d.fee, row.lev != null ? { s: row.levSource } : d.lev),
  };
}

/** Rows of a ticker page in owner venue order (Türkiye without Bitget), token before perpetual. */
export function tsTickerRows(ticker, { locale = "en", market, live } = {}) {
  const data = tsLive(live);
  const venues = tsVenues(locale, market);
  const factRows = tsListings(ticker);
  const rows = [];
  for (const ex of venues) {
    if (LIVE.has(ex.slug)) {
      for (const lane of ["spot", "perp"]) {
        const item = data.rows?.[ticker]?.[`${ex.slug}:${lane}`];
        if (item) rows.push(liveRow(ex, lane, item, ticker, data));
      }
    } else {
      for (const row of factRows.filter((r) => r.exchange.slug === ex.slug)) rows.push(factRow(row));
    }
  }
  return rows;
}

/** Every source a row cites (live endpoint first), filtered for the page (Türkiye: no Bitget pages). */
export function tsRowSources(row, locale, market) {
  return [...(row.live ? [row.live] : []), ...tsCitable(row.factSources, locale, market)];
}

/** Ticker page facts for the answer, the FAQ and the meta description. */
export function tsTickerSummary(rows) {
  const names = [...new Set(rows.map((row) => row.exchange.name))];
  const spot = rows.filter((row) => row.lane === "spot");
  const perp = rows.filter((row) => row.lane !== "spot");
  const levRows = rows.filter((row) => row.lev != null);
  const maxLev = levRows.reduce((m, row) => Math.max(m, row.lev), 0) || null;
  const maxLevVenues = maxLev ? [...new Set(levRows.filter((row) => row.lev === maxLev).map((row) => row.exchange.name))] : [];
  const feeRows = perp.filter((row) => row.feeLive && row.fee?.v?.taker != null);
  const minTaker = feeRows.length ? Math.min(...feeRows.map((row) => row.fee.v.taker)) : null;
  const minTakerVenues = minTaker != null ? [...new Set(feeRows.filter((row) => row.fee.v.taker === minTaker).map((row) => row.exchange.name))] : [];
  const weekend = [...new Set(rows.filter((row) => row.hours?.v === "24/7").map((row) => row.exchange.name))];
  const div = {};
  for (const row of spot) if (row.dividends?.v) (div[row.dividends.v] ||= new Set()).add(row.exchange.name);
  return {
    names, spot, perp, maxLev, maxLevVenues, minTaker, minTakerVenues, weekend,
    dividends: Object.fromEntries(Object.entries(div).map(([k, set]) => [k, [...set]])),
  };
}

/** Exchange page: the page tickers this exchange lists, with token / perpetual symbols and leverage. */
export function tsExchangeTickerRows(slug, tickers, live) {
  const data = tsLive(live);
  return tickers.map((ticker) => {
    const spot = data.rows?.[ticker]?.[`${slug}:spot`] || null;
    const perp = data.rows?.[ticker]?.[`${slug}:perp`] || null;
    return spot || perp ? { ticker, spot, perp, preipo: TS_PREIPO.has(ticker) } : null;
  }).filter(Boolean);
}

/** Stock instruments an exchange lists right now (from the live snapshot), or null when it was not read. */
// Bitget's spot endpoint does not mark rTokens, so the snapshot only counts the ones that also trade as a Bitget stock
// perpetual (a lower bound): the page prints the count Bitget publishes instead (facts, with its date).
const SPOT_COUNT_FROM_FACTS = new Set(["bitget"]);
export function tsExchangeCounts(slug, live, ex = null) {
  const data = tsLive(live);
  const counts = data.counts?.[slug];
  if (!counts) return null;
  const spotFact = SPOT_COUNT_FROM_FACTS.has(slug) ? ex?.spot?.count || null : null;
  return { perp: counts.perp || 0, spot: spotFact ? spotFact.v : counts.spot || 0, spotFact, at: data.checked?.[slug]?.perp || data.generatedAt };
}
