// Estimated liquidation levels from public market-wide open interest. This is not a real position map.
// Model assumptions:
// - public exchange OI is market-wide notional, not account-level position data;
// - long and short sides receive equal notional weight;
// - common leverage tiers receive equal weight;
// - entry price equals the current public ticker price;
// - maintenance margin is a flat 0.5% placeholder because venue/account/tier schedules differ.
// Formulas:
// - long liquidation ~= entry * (1 - 1 / leverage) / (1 - maintenanceMargin)
// - short liquidation ~= entry * (1 + 1 / leverage) / (1 + maintenanceMargin)
export const LIQUIDATION_LEVEL_SYMBOLS = Object.freeze(["BTC", "ETH", "SOL"]);
export const LIQUIDATION_LEVEL_LEVERAGE_TIERS = Object.freeze([10, 25, 50, 100]);
const MAINTENANCE_MARGIN_RATE = 0.005;

const finite = (value) => Number.isFinite(value) && value > 0;
const roundPrice = (value) => {
  if (!finite(value)) return null;
  if (value >= 1000) return Math.round(value * 10) / 10;
  if (value >= 100) return Math.round(value * 100) / 100;
  return Math.round(value * 1000) / 1000;
};

export function estimateLiquidationLevels({ symbol, price, openInterestUsd, leverageTiers = LIQUIDATION_LEVEL_LEVERAGE_TIERS } = {}) {
  if (!LIQUIDATION_LEVEL_SYMBOLS.includes(symbol) || !finite(price) || !finite(openInterestUsd)) return null;
  const tiers = leverageTiers.filter((tier) => Number.isFinite(tier) && tier > 1);
  if (!tiers.length) return null;
  const usdPerBand = openInterestUsd / 2 / tiers.length;
  const levels = [];
  for (const leverage of tiers) {
    const maintenance = MAINTENANCE_MARGIN_RATE;
    const longPrice = price * (1 - (1 / leverage)) / (1 - maintenance);
    const shortPrice = price * (1 + (1 / leverage)) / (1 + maintenance);
    const longDistance = (longPrice / price) - 1;
    const shortDistance = (shortPrice / price) - 1;
    levels.push({
      side: "long",
      leverage,
      price: roundPrice(longPrice),
      distancePct: Number((longDistance * 100).toFixed(3)),
      usd: Math.round(usdPerBand),
    });
    levels.push({
      side: "short",
      leverage,
      price: roundPrice(shortPrice),
      distancePct: Number((shortDistance * 100).toFixed(3)),
      usd: Math.round(usdPerBand),
    });
  }
  return {
    symbol,
    price: roundPrice(price),
    openInterestUsd: Math.round(openInterestUsd),
    levels: levels.filter((level) => finite(level.price) && finite(level.usd)).sort((a, b) => a.price - b.price || a.side.localeCompare(b.side)),
  };
}

export function combineVenueObservations(symbol, observations) {
  const rows = observations.filter((row) => row?.symbol === symbol && finite(row.price) && finite(row.openInterestUsd));
  if (!rows.length) return null;
  const openInterestUsd = rows.reduce((sum, row) => sum + row.openInterestUsd, 0);
  const weightedPrice = rows.reduce((sum, row) => sum + row.price * row.openInterestUsd, 0) / openInterestUsd;
  const estimated = estimateLiquidationLevels({ symbol, price: weightedPrice, openInterestUsd });
  return estimated ? { ...estimated, exchanges: rows.map((row) => ({ venue: row.venue, price: roundPrice(row.price), openInterestUsd: Math.round(row.openInterestUsd) })) } : null;
}
