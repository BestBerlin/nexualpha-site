// Public base-fee records, derived ONLY from exchange-facts.js (the single fee source).
// These records are independent from partner links, rebates, affiliate terms,
// account-specific fee schedules, regional eligibility, and commission economics.
// Rates here are fractions (0.001 = 0.10%); exchange-facts.js holds percent.
// A product without a checked maker AND taker figure produces no record ("Not yet checked").
import { EXCHANGE_FACTS, feeFact, primarySourceUrl } from "./exchange-facts.js";

// Tier/scope keys select localized copy in reviewed-fee-copy.js. Spot keys for binance, bitget and bybit
// keep their dedicated scope copy; every other record uses the generic public-source copy.
const SCOPE = Object.freeze({
  binance: { spot: ["regular-user", "public-spot-margin-base-account-region-not-proven-discounts-excluded"] },
  bitget: { spot: ["standard-non-vip", "public-standard-spot-base-account-region-not-proven-bgb-discount-excluded"], futures: ["standard-non-vip", "public-usdt-m-futures-base-account-region-not-proven"] },
  bybit: { spot: ["vip-0", "public-crypto-to-crypto-spot-base-region-account-not-proven-special-zones-excluded"], futures: ["vip-0", "public-perpetual-futures-base-region-account-not-proven"] },
  okx: { spot: ["regular-user", "public-spot-base-account-region-not-proven"], futures: ["regular-user", "public-futures-base-account-region-not-proven"] },
  "gate-io": { spot: ["vip-0", "public-spot-base-account-region-not-proven"], futures: ["vip-0", "public-usdt-perpetual-base-account-region-not-proven"] },
});

const toFraction = (pct) => Math.round(pct * 1e6) / 1e8;

function record(slug, product) {
  const fact = feeFact(slug, product === "futures" ? "perp" : "spot");
  if (fact.state !== "checked" || !Number.isFinite(fact.maker) || !Number.isFinite(fact.taker)) return null;
  const sourceUrl = primarySourceUrl(slug);
  if (!sourceUrl) return null;
  const [tierKey, scopeKey] = SCOPE[slug]?.[product] || ["unknown", `public-${product}-base-account-region-not-proven`];
  return Object.freeze({
    product,
    makerRate: toFraction(fact.maker),
    takerRate: toFraction(fact.taker),
    tierKey,
    scopeKey,
    sourceUrl,
    checkedAt: fact.checkedOn,
    conditions: Object.freeze(fact.note ? [fact.note] : []),
  });
}

export const reviewedBaseFeesByVenue = Object.freeze(Object.fromEntries(
  Object.keys(EXCHANGE_FACTS).map((slug) => {
    const rates = [record(slug, "spot"), record(slug, "futures")].filter(Boolean);
    if (!rates.length) return null;
    const checkedAt = rates.map((r) => r.checkedAt).sort().at(-1);
    return [slug, Object.freeze({ checkedAt, rates: Object.freeze(rates) })];
  }).filter(Boolean),
));

export function reviewedBaseFeesForVenue(slug) {
  const key = typeof slug === "string" ? slug.trim().toLowerCase() : "";
  return reviewedBaseFeesByVenue[key] || null;
}
