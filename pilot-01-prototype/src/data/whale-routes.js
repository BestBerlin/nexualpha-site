// Finite, crawlable watchlist. A route does not imply a current qualifying signal.
export const WHALE_COINS = Object.freeze(["BTC", "ETH", "SOL", "HYPE", "PURR", "USDT", "USDC", "TRX", "AERO", "WELL", "VIRTUAL"]);
export const whaleCoinPath = (coin) => WHALE_COINS.includes(String(coin).toUpperCase()) ? `/whales/${String(coin).toLowerCase()}` : null;
export const coinForWhalePath = (path) => WHALE_COINS.find((coin) => whaleCoinPath(coin) === path) || null;
export const whaleRowCoin = (row) => String(row.coin || row.asset || row.symbol || "").toUpperCase();
export function whaleSignalBucket(row) {
  const kind = String(row.homeKind || row.kind || row.eventKind || row.category || "").toLowerCase();
  if (row.signalType || ["signal", "accumulation", "distribution", "smart_money"].includes(kind)) {
    const action = String(row.signalType || row.type || row.action || kind).toLowerCase();
    // A short position or an exchange deposit alone is not spot distribution.
    if (/short/.test(action) || /short/i.test(String(row.side || ""))) return "positions";
    return row.stealth === "sell" || /distribution|spot.sell|dex.sell/.test(action) ? "distribution" : "signals";
  }
  return ["position", "hyperliquid_position", "liquidation"].includes(kind) ? "positions" : "transfers";
}
// Whale page <-> "where to buy" coin page (SEO w43 link hub). Coin-page slug and display name per watchlist symbol that
// has a /coins page; PURR and WELL have none. tests/w43-link-hubs.test.mjs keeps this in step with coins-data.generated.js.
export const WHALE_COIN_PAGES = Object.freeze({
  BTC: ["bitcoin", "Bitcoin"], ETH: ["ethereum", "Ethereum"], SOL: ["solana", "Solana"], HYPE: ["hyperliquid", "Hyperliquid"],
  USDT: ["tether", "Tether"], USDC: ["usdc", "USDC"], TRX: ["tron", "TRON"], AERO: ["aerodrome-finance", "Aerodrome Finance"],
  VIRTUAL: ["virtuals-protocol", "Virtuals Protocol"],
});
/** { path, name, symbol } of the /coins page for a whale watchlist symbol, or null. */
export function coinPageForWhaleCoin(symbol) {
  const key = String(symbol || "").toUpperCase();
  const entry = WHALE_COIN_PAGES[key];
  return entry ? { path: `/coins/${entry[0]}`, name: entry[1], symbol: key } : null;
}
/** /whales/<coin> path for a /coins page slug, or null when the coin is not on the whale watchlist. */
export function whalePathForCoinSlug(slug) {
  const symbol = Object.keys(WHALE_COIN_PAGES).find((key) => WHALE_COIN_PAGES[key][0] === slug);
  return symbol ? whaleCoinPath(symbol) : null;
}
