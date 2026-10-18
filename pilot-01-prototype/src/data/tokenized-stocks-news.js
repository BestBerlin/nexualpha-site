// Tokenized-stocks links from news (SEO w43, 2026-10-18): one rule decides which news articles belong to the
// tokenized-stocks cluster and which ticker pages an article names. Each such article links INTO the hub
// (/tokenized-stocks) and the ticker pages it names, through its "Topic hubs & tools" line (topic-clusters.js), which
// NewsDetailPage and the Worker's fallback body both render. The hub and ticker pages themselves are owned elsewhere.
// Cluster membership reads the English title, the slug and the English summary; ticker mentions also read the English
// body (article pages hydrate with their body, so server and browser select the same links).
import { TS_PATH, TS_TICKER_SLUGS, tokenizedStocksNavLabel, tsTickerPath } from "./tokenized-stocks-routes.js";
import { localizedPath } from "./locale-routing.js";

export const TS_NEWS_PATTERN = /tokeni[sz]ed (?:u\.?s\.? )?(?:stocks?|equit|shares?|nms stock)|stock tokens?|\bxstocks?\b|\bbstocks?\b|ondo (?:global markets|stocks)|\bstock perp|equity perp|tradfi perp|代币化(?:股票|美股)|代幣化(?:股票|美股)/i;

// Symbols match case-sensitively (also as $NVDA); company names only where the name is not also a crypto venue or
// issuer (Coinbase, Robinhood and Circle appear in tokenized-stock articles as platforms, not as the stock).
const TICKER_NAMES = Object.freeze({
  NVDA: /\bNvidia\b/i, TSLA: /\bTesla\b/i, AAPL: /\bApple\b/, MSFT: /\bMicrosoft\b/i, MSTR: /\bMicroStrategy\b/i,
  GOOGL: /\b(?:Alphabet|Google)\b/, AMZN: /\bAmazon\b/, SPY: /S&P 500/i, QQQ: /Nasdaq[- ]100/i,
});
// Slug tokens that are unambiguous ticker mentions ("coin" and "hood" are ordinary words in slugs).
const SLUG_TICKERS = new Set(["nvda", "tsla", "aapl", "msft", "mstr", "crcl", "googl", "amzn", "spy", "qqq"]);

const english = (value) => (typeof value === "string" ? value : value && typeof value === "object" && typeof value.en === "string" ? value.en : "");
const textCache = new WeakMap();
function articleText(article) {
  if (!article || typeof article !== "object") return { prose: "", slugTokens: [] };
  let cached = textCache.get(article);
  if (!cached) {
    const slug = String(article.slug || "");
    const prose = `${english(article.title)}\n${english(article.summary)}`;
    cached = { prose, body: `${prose}\n${english(article.content)}`, slugText: slug.replace(/-/g, " "), slugTokens: slug.split("-") };
    textCache.set(article, cached);
  }
  return cached;
}

/** True when a published article belongs to the tokenized-stocks cluster. */
export function isTokenizedStockArticle(article) {
  if (!article?.slug || (article.status && article.status !== "PUBLISHED")) return false;
  const { prose, slugText } = articleText(article);
  return TS_NEWS_PATTERN.test(prose) || TS_NEWS_PATTERN.test(slugText);
}

/** Upper-case tickers (with a ticker page) that a tokenized-stocks article names, in TS_TICKER_SLUGS order. */
export function tsArticleTickers(article) {
  if (!isTokenizedStockArticle(article)) return [];
  const { body: prose, slugTokens } = articleText(article);
  return TS_TICKER_SLUGS.filter((slug) => {
    const symbol = slug.toUpperCase();
    if (new RegExp(`(?<![A-Za-z0-9])\\$?${symbol}(?![A-Za-z0-9])`).test(prose)) return true;
    if (TICKER_NAMES[symbol]?.test(prose)) return true;
    return SLUG_TICKERS.has(slug) && slugTokens.includes(slug);
  }).map((slug) => slug.toUpperCase());
}

export const TS_ARTICLE_TICKER_LINK_LIMIT = 3;

/** Hub + ticker links for an article's "Topic hubs & tools" line ([] for articles outside the cluster). */
export function tsArticleLinks(article, locale = "en") {
  if (!isTokenizedStockArticle(article)) return [];
  const label = tokenizedStocksNavLabel(locale);
  return [
    { id: "tokenized-stocks-hub", kind: "hub", path: TS_PATH, href: localizedPath(TS_PATH, locale), label },
    ...tsArticleTickers(article).slice(0, TS_ARTICLE_TICKER_LINK_LIMIT).map((ticker) => {
      const path = tsTickerPath(ticker);
      return { id: `tokenized-stocks:${ticker.toLowerCase()}`, kind: "ticker", path, href: localizedPath(path, locale), label: `${label}: ${ticker}` };
    }),
  ];
}
