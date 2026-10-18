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
