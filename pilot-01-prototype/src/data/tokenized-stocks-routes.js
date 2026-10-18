// Tokenized US stocks hub (/tokenized-stocks), ticker pages (/tokenized-stocks/<ticker>) and exchange-product pages
// (/tokenized-stocks/exchange/<venue>), owner 2026-10-15 / 2026-10-18.
// Entry-safe: the router, the header and the footer import this file, so it holds only paths and the nav label.
import { TS_NAV_LABELS } from "./tokenized-stocks-labels.js";

export const TS_PATH = "/tokenized-stocks";
// Kept in sync with TS_TICKERS (tokenized-stocks-facts.js); tests/tokenized-stocks.test.mjs checks both lists match.
// The first twelve are the 2026-10-15 launch set (indexed in every edition); the rest were added 2026-10-18 from the live
// listing snapshot (each is listed by at least five of the seven exchanges we read) and are indexed in TS_MAIN_LOCALES.
export const TS_LAUNCH_SLUGS = Object.freeze(["nvda", "tsla", "aapl", "msft", "coin", "mstr", "hood", "crcl", "googl", "amzn", "spy", "qqq"]);
export const TS_TICKER_SLUGS = Object.freeze([
  ...TS_LAUNCH_SLUGS,
  "meta", "pltr", "amd", "nflx", "avgo", "tsm", "mu", "intc", "orcl", "arm", "sndk", "crwv", "bmnr", "gme", "baba", "spcx",
  "openai", "anthropic",
]);
export const TS_TICKERS_ALL = Object.freeze(TS_TICKER_SLUGS.map((slug) => slug.toUpperCase()));
// Exchange-product pages ("Bitget stock futures", "OKX xStocks tutorial"), owner order.
export const TS_EXCHANGE_SLUGS = Object.freeze(["bitget", "okx", "binance", "bybit", "gate-io", "kraken", "mexc"]);
export const tsTickerPath = (ticker) => `${TS_PATH}/${String(ticker).toLowerCase()}`;
export const tsExchangePath = (slug) => `${TS_PATH}/exchange/${slug}`;

/** { kind: "hub" } | { kind: "ticker", ticker } | { kind: "exchange", slug } | { kind: "missing" } for /tokenized-stocks paths, null elsewhere. */
export function parseTokenizedStocksPath(pathname) {
  const path = String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path === TS_PATH) return { kind: "hub" };
  if (!path.startsWith(`${TS_PATH}/`)) return null;
  const slug = path.slice(TS_PATH.length + 1);
  if (slug.startsWith("exchange/")) {
    const venue = slug.slice("exchange/".length);
    return TS_EXCHANGE_SLUGS.includes(venue) ? { kind: "exchange", slug: venue } : { kind: "missing" };
  }
  return TS_TICKER_SLUGS.includes(slug) ? { kind: "ticker", ticker: slug.toUpperCase() } : { kind: "missing" };
}

export function tokenizedStocksNavLabel(locale = "en") {
  return TS_NAV_LABELS[locale] || (String(locale).startsWith("zh") ? TS_NAV_LABELS["zh-Hans"] : TS_NAV_LABELS.en);
}
