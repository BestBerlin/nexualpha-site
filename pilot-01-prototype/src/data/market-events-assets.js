import { localizedNewsTitle, localizedNewsSummary, localizedValue, resolveNewsContentLocale } from "./news-feed-client.js";
import { neutralArticleMarkdown } from "./neutral-article.js";
import { stripArticleEmbedDirectives } from "./article-embeds.js";
import { serpCtrNewsOverride } from "./serp-ctr-news-overrides.js";

// Small, shared projection for article rails and /api/market-events/asset.
// Keep this out of the home entry; the collector remains the only source of figures.
export const MARKET_ASSET_PATH = "/api/market-events/asset";

export const MARKET_CONTEXT_ASSETS = Object.freeze([
  { symbol: "BTC", pattern: /\bBTC\b|\bbitcoin\b|比特币|比特幣|ビットコイン|비트코인|биткоин|بيتكوين/i },
  { symbol: "ETH", pattern: /\bETH\b|\bethereum\b|\bether\b|以太坊|イーサリアム|이더리움|эфириум|إيثريوم/i },
  { symbol: "SOL", pattern: /\bSOL\b|\bsolana\b|ソラナ|솔라나|солана|سولانا/i },
]);

const countMatches = (text, pattern) => (String(text || "").match(new RegExp(pattern.source, "gi")) || []).length;

/** Up to `limit` assets: those named in the title or summary first, then those mentioned at least twice in the body. */
export function detectArticleAssets({ title = "", summary = "", body = "" } = {}, limit = 2) {
  const head = `${title}\n${summary}`;
  const scored = MARKET_CONTEXT_ASSETS.map(({ symbol, pattern }, order) => {
    const inHead = countMatches(head, pattern);
    const inBody = countMatches(body, pattern);
    return { symbol, order, inHead, inBody };
  }).filter((a) => a.inHead > 0 || a.inBody >= 2);
  scored.sort((a, b) => (b.inHead > 0) - (a.inHead > 0) || b.inBody - a.inBody || a.order - b.order);
  return scored.slice(0, limit).map((a) => a.symbol);
}

/** Use the exact same article text on the server and client when selecting assets. */
export function articleMarketAssets(article, locale) {
  const contentLocale = resolveNewsContentLocale(locale, article);
  const override = contentLocale === locale ? serpCtrNewsOverride(article.slug, locale) : null;
  const title = override?.h1 || localizedNewsTitle(article, locale);
  const summary = neutralArticleMarkdown(localizedNewsSummary(article, locale), locale);
  const content = neutralArticleMarkdown(localizedValue(article.content, contentLocale), locale);
  return detectArticleAssets({
    title: `${title}\n${localizedNewsTitle(article, "en")}`,
    summary: `${summary}\n${localizedNewsSummary(article, "en")}`,
    body: stripArticleEmbedDirectives(content),
  });
}

const num = (v) => { const n = typeof v === "number" ? v : Number.parseFloat(v); return Number.isFinite(n) ? n : null; };
const baseOf = (symbol) => String(symbol || "").replace(/^[A-Z]+:/i, "").replace(/(USDT|USDC|USD|BUSD)$/i, "").toUpperCase();

/** One row per detected asset with the figures the feed actually has; null when the feed has none of them. */
export function marketAssetSnapshot(feed, assets) {
  if (!feed || typeof feed !== "object" || !Array.isArray(assets) || !assets.length) return null;
  const generatedAt = Number.isFinite(Date.parse(feed.generatedAt)) ? new Date(Date.parse(feed.generatedAt)).toISOString() : null;
  if (!generatedAt) return null;
  // SSR and the asset API already carry the exact rendered rows. Never re-derive numbers on hydration.
  if (Array.isArray(feed.rows)) {
    const rows = assets.map(symbol => feed.rows.find(row => row.symbol === symbol)).filter(Boolean);
    return rows.length ? { generatedAt, rows } : null;
  }
  const majors = Array.isArray(feed.market?.majors) ? feed.market.majors : [];
  const fundingRows = Array.isArray(feed.funding?.rows) ? feed.funding.rows : [];
  const top24 = Array.isArray(feed.liquidations?.h24?.topSymbols) ? feed.liquidations.h24.topSymbols : [];
  const rows = assets.map((symbol) => {
    const major = majors.find((m) => baseOf(m?.symbol) === symbol);
    const funding = fundingRows.find((r) => baseOf(r?.symbol) === symbol);
    const liqHits = top24.filter((t) => baseOf(t?.symbol) === symbol && num(t?.usd) > 0);
    const row = {
      symbol,
      price: num(major?.price),
      change24hPct: num(major?.change24hPct),
      fundingBinance: num(funding?.binanceRate),
      fundingOkx: num(funding?.okxRate),
      liquidations24hUsd: liqHits.length ? liqHits.reduce((sum, t) => sum + num(t.usd), 0) : null,
    };
    const has = row.price != null || row.fundingBinance != null || row.fundingOkx != null || row.liquidations24hUsd != null;
    return has ? row : null;
  }).filter(Boolean);
  return rows.length ? { generatedAt, rows } : null;
}


/** Reject ambiguous, empty or oversized requests before reading the collector. */
export function parseMarketAssetSymbols(params) {
  const single = params.getAll("symbol"), multiple = params.getAll("symbols");
  if (single.length + multiple.length !== 1) return null;
  const values = (single[0] ?? multiple[0]).split(",").map(value => value.trim().toUpperCase());
  if (!values.length || values.length > 5 || (single.length && values.length !== 1)
    || values.some(value => !/^[A-Z0-9]{1,20}$/.test(value))) return null;
  return [...new Set(values)];
}

export async function marketAssetResponse(url, readFeed) {
  const symbols = parseMarketAssetSymbols(url.searchParams);
  const error = (status, code) => Response.json({ error: code }, { status, headers: { "cache-control": "no-store" } });
  if (!symbols) return error(400, "INVALID_SYMBOLS");
  let feed;
  try { feed = await readFeed(); } catch { /* cold outage fails closed */ }
  if (!feed || !Number.isFinite(Date.parse(feed.generatedAt))) return error(503, "MARKET_FEED_UNAVAILABLE");
  const snapshot = marketAssetSnapshot(feed, symbols);
  if (!snapshot || snapshot.rows.length !== symbols.length) return error(404, "UNKNOWN_SYMBOL");
  return Response.json({ ...snapshot, stale: feed.stale === true }, {
    headers: { "cache-control": "public, max-age=30" },
  });
}
