// Public base-fee records verified from official pages only.
// These records are independent from partner links, rebates, affiliate terms,
// account-specific fee schedules, regional eligibility, and commission economics.
const CHECKED_AT_2026_09_22 = "2026-09-22";

const rate = ({ product, makerRate, takerRate, tierKey, scopeKey, sourceUrl, checkedAt = CHECKED_AT_2026_09_22, conditions = [] }) => Object.freeze({
  product,
  makerRate,
  takerRate,
  tierKey,
  scopeKey,
  sourceUrl,
  checkedAt,
  conditions: Object.freeze([...conditions]),
});

export const reviewedBaseFeesByVenue = Object.freeze({
  binance: Object.freeze({
    checkedAt: CHECKED_AT_2026_09_22,
    rates: Object.freeze([
      rate({
        product: "spot",
        makerRate: 0.001,
        takerRate: 0.001,
        tierKey: "regular-user",
        scopeKey: "public-spot-margin-base-account-region-not-proven-discounts-excluded",
        sourceUrl: "https://www.binance.com/en/fee/trading",
        conditions: [
          "Regular User row in Binance Spot & Margin public fee table",
          "30D trade volume < 1,000,000 USD or BNB balance >= 0 BNB",
          "BNB 25% off, USDC columns, VIP tiers, promotions, account-specific and regional terms are excluded",
        ],
      }),
    ]),
  }),
  bitget: Object.freeze({
    checkedAt: CHECKED_AT_2026_09_22,
    rates: Object.freeze([
      rate({
        product: "spot",
        makerRate: 0.001,
        takerRate: 0.001,
        tierKey: "standard-non-vip",
        scopeKey: "public-standard-spot-base-account-region-not-proven-bgb-discount-excluded",
        sourceUrl: "https://www.bitget.com/support/articles/12560603892734",
        conditions: [
          "Bitget Trading Fees FAQ standard spot fee before VIP tier or BGB discount",
          "BGB fee-payment discount, VIP tiers, active promotions, account-specific and regional terms are excluded",
          "Official page says users should confirm current rates on the live Fee Schedule before trading",
        ],
      }),
    ]),
  }),
  bybit: Object.freeze({
    checkedAt: CHECKED_AT_2026_09_22,
    rates: Object.freeze([
      rate({
        product: "spot",
        makerRate: 0.001,
        takerRate: 0.001,
        tierKey: "vip-0",
        scopeKey: "public-crypto-to-crypto-spot-base-region-account-not-proven-special-zones-excluded",
        sourceUrl: "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
        conditions: [
          "VIP 0 row under Spot Trading (Crypto-Crypto) public base table",
          "Fiat spot pairs, Adventure Zone, xStocks, derivatives, options, Pro, VIP and market-maker schedules are excluded",
          "Official page says actual fee rates may vary by region and logged-in My Fee Rate after identity verification",
        ],
      }),
    ]),
  }),
});

export function reviewedBaseFeesForVenue(slug) {
  const key = typeof slug === "string" ? slug.trim().toLowerCase() : "";
  return reviewedBaseFeesByVenue[key] || null;
}
