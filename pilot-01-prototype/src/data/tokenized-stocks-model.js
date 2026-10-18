// Tokenized US stocks: what a ticker page and an exchange-product page say (answer, FAQ, title inputs), built from the
// live listing rows and the sourced facts. Pure data: the page components (TokenizedStocksDetail.jsx) and the server-only
// head/schema helpers (tokenized-stocks-seo.js) share it, so the visible answer, the FAQPage JSON-LD and the meta
// description always say the same thing.
import { TS_COPY } from "./tokenized-stocks-copy.js";
import { TS_PREIPO, TS_TICKERS, tsExchange } from "./tokenized-stocks-facts.js";
import { fillTs, tsCitable, tsList } from "./tokenized-stocks.js";
import { tsExchangeCounts, tsExchangeTickerRows, tsLive, tsRowSources, tsTickerRows, tsTickerSummary } from "./tokenized-stocks-rows.js";
import { formatSgt, readerDayKey } from "./local-time.js";

export const tsCopyFor = (locale) => TS_COPY[locale] || (String(locale || "").startsWith("zh") ? TS_COPY["zh-Hans"] : TS_COPY.en);
const copyFor = tsCopyFor;
const pct = (n) => `${Number(n).toString()}%`;
/** "2026-10-18 23:10" in Singapore time (SSR and browser print the same string). */
export const sgtStamp = (iso) => { const day = readerDayKey(iso); return day ? `${day} ${formatSgt(iso, "en-GB", "clock").replace(/ SGT$/, "")}` : ""; };

/** FAQ of a ticker page, built from the rows: every answer names the exchanges it is about and cites them. */
function tickerFaq({ ticker, name, rows, sum, t, tk, locale, market }) {
  const list = (items) => tsList(items, locale);
  const spotText = list(sum.spot.map((row) => `${row.exchange.name} (${row.symbol})`));
  const perpText = list(sum.perp.map((row) => `${row.exchange.name} (${row.symbol})`));
  const allSources = (subset) => {
    const seen = new Map();
    for (const row of subset) for (const src of tsRowSources(row, locale, market)) if (!seen.has(src.id)) seen.set(src.id, src);
    return [...seen.values()].slice(0, 6);
  };
  const items = [];
  const preipo = TS_PREIPO.has(ticker);
  const a1 = sum.spot.length && sum.perp.length ? fillTs(tk.a1Both, { spot: spotText, perp: perpText })
    : sum.perp.length ? fillTs(tk.a1Perp, { perp: perpText, ticker }) : fillTs(tk.a1Spot, { spot: spotText });
  items.push([fillTs(tk.q1, { name, ticker }), a1, allSources(rows.slice(0, 6))]);
  if (sum.maxLev) {
    const levRows = rows.filter((row) => row.lev === sum.maxLev);
    items.push([fillTs(tk.q2, { ticker }), fillTs(tk.a2, { lev: sum.maxLev, list: list(levRows.map((row) => `${row.exchange.name} (${row.symbol})`)) }), allSources(levRows)]);
  }
  if (preipo) {
    const src = tsCitable(["okx-preipo", "hl-preipo"], locale, market);
    items.push([fillTs(tk.q3Pre, { name }), fillTs(tk.a3Pre, { name }), src]);
  } else if (Object.keys(sum.dividends).length) {
    const parts = [];
    if (sum.dividends.cash) parts.push(fillTs(tk.a3Cash, { list: list(sum.dividends.cash) }));
    if (sum.dividends.reinvest) parts.push(fillTs(tk.a3Reinvest, { list: list(sum.dividends.reinvest) }));
    if (sum.dividends.nocash) parts.push(fillTs(tk.a3NoCash, { list: list(sum.dividends.nocash) }));
    if (rows.some((row) => row.lane === "perp")) parts.push(tk.a3Perp);
    items.push([fillTs(tk.q3, { ticker }), parts.join(" "), allSources(rows.filter((row) => row.dividends))]);
  }
  items.push([fillTs(tk.q4, { ticker }), sum.weekend.length ? fillTs(tk.a4, { list: list(sum.weekend) }) : fillTs(tk.a4No, { ticker }), allSources(rows.filter((row) => row.hours?.v === "24/7"))]);
  return items;
}

/** Everything a ticker page and its meta/schema say (shared with tokenized-stocks-seo.js). */
export function tickerPageModel(ticker, { locale = "en", market, live } = {}) {
  const t = copyFor(locale);
  const tk = t.tk;
  const data = tsLive(live);
  const rows = tsTickerRows(ticker, { locale, market, live: data });
  const sum = tsTickerSummary(rows);
  const name = t.names[ticker] || ticker;
  const preipo = TS_PREIPO.has(ticker);
  const list = (items) => tsList(items, locale);
  const answer = [];
  if (preipo) answer.push(fillTs(tk.preAnswer, { n: sum.names.length, name, list: list(sum.names) }));
  else {
    answer.push(fillTs(t.tickerAnswer, { n: sum.names.length, ticker, list: list(sum.names) }));
    if (sum.spot.length) answer.push(fillTs(t.tickerAnswerSpot, { list: list(sum.spot.map((row) => `${row.exchange.name} (${row.symbol})`)) }));
    if (sum.perp.length) answer.push(fillTs(t.tickerAnswerPerp, { list: list(sum.perp.map((row) => `${row.exchange.name} (${row.symbol})`)) }));
  }
  if (sum.maxLev) answer.push(fillTs(tk.answerLev, { lev: sum.maxLev, list: list(sum.maxLevVenues) }));
  if (sum.minTaker != null) answer.push(fillTs(tk.answerFee, { ticker, fee: pct(sum.minTaker), list: list(sum.minTakerVenues) }));
  if (!preipo && sum.weekend.length) answer.push(fillTs(tk.answerWeekend, { list: list(sum.weekend) }));
  const faq = tickerFaq({ ticker, name, rows, sum, t, tk, locale, market });
  return { t, tk, data, rows, sum, name, preipo, answer, faq, about: t.about?.[ticker] || "" };
}

/** Everything an exchange page and its meta/schema say (shared with tokenized-stocks-seo.js). */
export function exchangePageModel(slug, { locale = "en", market, live } = {}) {
  const t = copyFor(locale);
  const ex = tsExchange(slug);
  const data = tsLive(live);
  const exName = t.exNames?.[slug] || ex?.name || slug;
  const page = t.exPages?.[slug];
  const counts = tsExchangeCounts(slug, data, ex);
  const tickers = tsExchangeTickerRows(slug, TS_TICKERS, data);
  const levs = tickers.filter((row) => row.perp?.lev != null);
  const maxLev = levs.reduce((m, row) => Math.max(m, row.perp.lev), 0) || null;
  const maxLevTickers = maxLev ? levs.filter((row) => row.perp.lev === maxLev).map((row) => row.ticker).slice(0, 4) : [];
  const fill = (s) => fillTs(s, { name: exName, lev: maxLev || "" });
  const tsla = tickers.find((row) => row.ticker === "TSLA");
  const at = counts?.at || data.generatedAt;
  const answer = [];
  if (counts) answer.push(fillTs(counts.spot ? t.ex.answer : t.ex.answerPerpOnly, { name: exName, perp: counts.perp, spot: counts.spot, time: sgtStamp(at) }));
  if (maxLev) answer.push(fillTs(t.ex.answerLev, { lev: maxLev, list: tsList(maxLevTickers, locale) }));
  if (tsla) answer.push(fillTs(t.ex.answerTsla, { name: exName, symbols: tsList([tsla.spot?.sym, tsla.perp?.sym].filter(Boolean), locale) }));
  const excluded = ex?.excluded?.v || [];
  const faq = [];
  if (counts) faq.push([fill(t.ex.q1), fillTs(counts.spot ? t.ex.a1 : t.ex.a1PerpOnly, { name: exName, perp: counts.perp, spot: counts.spot }), []]);
  if (maxLev) faq.push([fill(t.ex.q2), fillTs(t.ex.a2, { lev: maxLev, list: tsList(maxLevTickers, locale) }), []]);
  if (excluded.length) faq.push([fill(t.ex.q3), fillTs(t.ex.a3, { name: exName, list: tsList(excluded.map((code) => t.regions?.[code] || code), locale) }), tsCitable(ex.excluded.s, locale, market)]);
  return {
    t, ex, exName, data, counts, tickers, maxLev, answer, faq, excluded, at,
    title: page ? fill(page.title) : exName, description: page ? fill(page.description) : "", h1: page ? fill(page.h1) : exName, intro: page ? fill(page.intro) : "",
  };
}

