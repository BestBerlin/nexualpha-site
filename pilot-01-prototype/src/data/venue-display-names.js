// Human display names for exchange slugs used in data pages (radar rows, licence directory).
export const VENUE_DISPLAY_NAMES = Object.freeze({
  binance: "Binance",
  "binance-us": "Binance.US",
  okx: "OKX",
  bybit: "Bybit",
  bitget: "Bitget",
  kraken: "Kraken",
  coinbase: "Coinbase",
  "gate-io": "Gate",
  gate: "Gate",
  kucoin: "KuCoin",
  mexc: "MEXC",
  hashkey: "HashKey",
  htx: "HTX",
  coinw: "CoinW",
});

export function venueDisplayName(value) {
  const raw = String(value || "").trim();
  if (!raw) return raw;
  return VENUE_DISPLAY_NAMES[raw.toLowerCase()] || raw;
}
