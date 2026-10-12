import { feeFact } from "./exchange-facts.js";

export const FUNDING_MATRIX_PATH = "/intel/funding-matrix.json";

export const FUNDING_MATRIX_SYMBOLS = Object.freeze([
  "BTC", "ETH", "SOL", "XRP", "DOGE", "BNB", "ADA", "TRX", "LINK", "AVAX",
  "SUI", "TON", "LTC", "BCH", "DOT", "UNI", "AAVE", "APT", "NEAR", "ARB",
  "OP", "INJ", "SEI", "TIA", "ATOM", "ETC", "FIL", "WLD", "1000PEPE", "1000SHIB",
  "1000BONK", "WIF", "FLOKI", "JUP", "PYTH", "ENA", "PENDLE", "ORDI", "STX", "RUNE",
  "GALA", "SAND", "MANA", "APE", "LDO", "CRV", "COMP", "MKR", "SNX", "DYDX",
  "STRK", "BLUR", "ZRO", "ZK", "JTO", "NOT", "ONDO", "TAO", "1000FLOKI", "1000SATS",
]);

export const FUNDING_MATRIX_VENUES = Object.freeze([
  "binance",
  "okx",
  "bybit",
  "bitget",
  "gate-io",
  "mexc",
  "htx",
  "hyperliquid",
]);

const DISPLAY_NAMES = Object.freeze({
  binance: "Binance",
  okx: "OKX",
  bybit: "Bybit",
  bitget: "Bitget",
  "gate-io": "Gate.io",
  mexc: "MEXC",
  htx: "HTX",
  hyperliquid: "Hyperliquid",
});

const ALIASES = Object.freeze({
  gate: "gate-io",
  gateio: "gate-io",
  gate_io: "gate-io",
  huobi: "htx",
});

const num = (value) => {
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

const iso = (value) => {
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  const n = num(value);
  return n && n > 0 ? new Date(n < 100000000000 ? n * 1000 : n).toISOString() : null;
};

export function venueSlug(value) {
  const slug = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ALIASES[slug] || slug;
}

export function venueName(slug) {
  return DISPLAY_NAMES[venueSlug(slug)] || slug;
}

export function normalizeIntervalRate(rate, intervalHours) {
  const r = num(rate);
  const h = num(intervalHours);
  if (r == null || h == null || h <= 0 || h > 24 || Math.abs(r) > 0.05) return null;
  return {
    rate: r,
    intervalHours: h,
    rate8h: r * (8 / h),
    annualized: r * (24 / h) * 365,
  };
}

export function normalizeFundingQuote(input) {
  const symbol = typeof input?.symbol === "string" ? input.symbol.trim().toUpperCase() : "";
  const venue = venueSlug(input?.venue);
  const normalized = normalizeIntervalRate(input?.rate, input?.intervalHours ?? input?.intervalH);
  if (!symbol || !venue || !FUNDING_MATRIX_SYMBOLS.includes(symbol) || !FUNDING_MATRIX_VENUES.includes(venue) || !normalized) return null;
  return Object.freeze({
    symbol,
    venue,
    venueName: venueName(venue),
    rate: normalized.rate,
    intervalHours: normalized.intervalHours,
    rate8h: normalized.rate8h,
    annualized: normalized.annualized,
    nextFundingAt: iso(input.nextFundingAt ?? input.nextAt),
    readAt: iso(input.readAt) || null,
    profileHref: `/exchanges/${venue}`,
    tradeHref: `/go/${venue}?src=funding-matrix`,
  });
}

export function buildFundingMatrix(quotes, { generatedAt = new Date().toISOString() } = {}) {
  const grouped = new Map(FUNDING_MATRIX_SYMBOLS.map((symbol) => [symbol, new Map()]));
  for (const input of Array.isArray(quotes) ? quotes : []) {
    const quote = normalizeFundingQuote(input);
    if (quote) grouped.get(quote.symbol)?.set(quote.venue, quote);
  }
  const rows = [];
  for (const [symbol, venues] of grouped) {
    if (!venues.size) continue;
    const cells = Object.fromEntries([...venues.entries()].sort(([a], [b]) => FUNDING_MATRIX_VENUES.indexOf(a) - FUNDING_MATRIX_VENUES.indexOf(b)));
    const values = Object.values(cells).sort((a, b) => b.rate8h - a.rate8h);
    const max = values[0] || null;
    const min = values[values.length - 1] || null;
    rows.push(Object.freeze({
      symbol,
      venues: cells,
      maxSpread: max && min ? Object.freeze({
        longVenue: min.venue,
        shortVenue: max.venue,
        spread8h: max.rate8h - min.rate8h,
        annualized: (max.rate8h - min.rate8h) * 3 * 365,
      }) : null,
    }));
  }
  return Object.freeze({
    generatedAt,
    ttlSeconds: 60,
    symbols: FUNDING_MATRIX_SYMBOLS.length,
    venues: FUNDING_MATRIX_VENUES.map((slug) => Object.freeze({ slug, name: venueName(slug), profileHref: `/exchanges/${slug}`, tradeHref: `/go/${slug}?src=funding-matrix` })),
    rows,
  });
}

export function fundingMatrixCell(matrix, symbol, venue) {
  const row = matrix?.rows?.find((item) => item.symbol === String(symbol || "").toUpperCase());
  return row?.venues?.[venueSlug(venue)] || null;
}

function feeRate(slug, side) {
  const fact = feeFact(slug, "perp");
  const pct = side === "maker" ? fact.maker : fact.taker;
  return typeof pct === "number" && Number.isFinite(pct) ? pct / 100 : null;
}

export function calculateFundingArbitrage(input) {
  const matrix = input?.matrix;
  const symbol = String(input?.symbol || "").trim().toUpperCase();
  const longVenue = venueSlug(input?.longVenue);
  const shortVenue = venueSlug(input?.shortVenue);
  const notional = num(input?.notional);
  const holdingHours = num(input?.holdingHours);
  const feeSide = input?.feeSide === "maker" ? "maker" : "taker";
  if (!symbol || !longVenue || !shortVenue || longVenue === shortVenue || notional == null || notional <= 0 || holdingHours == null || holdingHours <= 0) return null;
  const long = fundingMatrixCell(matrix, symbol, longVenue);
  const short = fundingMatrixCell(matrix, symbol, shortVenue);
  if (!long || !short) return null;
  const longFunding = -notional * long.rate * (holdingHours / long.intervalHours);
  const shortFunding = notional * short.rate * (holdingHours / short.intervalHours);
  const fundingPnl = longFunding + shortFunding;
  const longFeeRate = feeRate(longVenue, feeSide);
  const shortFeeRate = feeRate(shortVenue, feeSide);
  const fees = longFeeRate == null || shortFeeRate == null ? null : notional * 2 * (longFeeRate + shortFeeRate);
  const netPnl = fees == null ? null : fundingPnl - fees;
  const hourlyFunding = fundingPnl / holdingHours;
  const breakEvenHours = fees != null && hourlyFunding > 0 ? fees / hourlyFunding : null;
  const annualized = fundingPnl / notional / holdingHours * 24 * 365;
  return Object.freeze({
    symbol,
    longVenue,
    shortVenue,
    notional,
    holdingHours,
    feeSide,
    fundingPnl,
    fees,
    netPnl,
    breakEvenHours,
    annualized,
    plainLanguage: `Estimate based on current rates: long ${venueName(longVenue)} and short ${venueName(shortVenue)} on ${symbol} for ${holdingHours}h has estimated funding PnL of ${formatUsd(fundingPnl)}${fees == null ? "" : ` before ${formatUsd(fees)} estimated ${feeSide} trading fees`}.`,
  });
}

function formatUsd(value) {
  const amount = Math.abs(value).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${value < 0 ? "-" : ""}$${amount}`;
}
