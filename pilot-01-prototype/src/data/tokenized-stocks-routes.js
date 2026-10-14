// Tokenized US stocks hub (/tokenized-stocks) and ticker pages (/tokenized-stocks/<ticker>), owner 2026-10-15.
// Entry-safe: the router, the header and the footer import this file, so it holds only paths and the nav label.
import { TS_NAV_LABELS } from "./tokenized-stocks-labels.js";

export const TS_PATH = "/tokenized-stocks";
// Kept in sync with TS_TICKERS (tokenized-stocks-facts.js); tests/tokenized-stocks.test.mjs checks both lists match.
export const TS_TICKER_SLUGS = Object.freeze(["nvda", "tsla", "aapl", "msft", "coin", "mstr", "hood", "crcl", "googl", "amzn", "spy", "qqq"]);
export const tsTickerPath = (ticker) => `${TS_PATH}/${String(ticker).toLowerCase()}`;

/** { kind: "hub" } | { kind: "ticker", ticker } | { kind: "missing" } for /tokenized-stocks paths, null elsewhere. */
export function parseTokenizedStocksPath(pathname) {
  const path = String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path === TS_PATH) return { kind: "hub" };
  if (!path.startsWith(`${TS_PATH}/`)) return null;
  const slug = path.slice(TS_PATH.length + 1);
  return TS_TICKER_SLUGS.includes(slug) ? { kind: "ticker", ticker: slug.toUpperCase() } : { kind: "missing" };
}

export function tokenizedStocksNavLabel(locale = "en") {
  return TS_NAV_LABELS[locale] || (String(locale).startsWith("zh") ? TS_NAV_LABELS["zh-Hans"] : TS_NAV_LABELS.en);
}
