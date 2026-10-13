// Owner priority for display/defaults only; eligibility and CTA gates remain with their existing policies.
export const VENUE_PRIORITY = Object.freeze([
  "bitget", "okx", "binance", "bybit", "gate-io", "mexc", "htx", "kraken", "backpack", "hyperliquid", "coinw",
]);

const slugOf = (venue) => typeof venue === "string" ? venue : venue?.slug || venue?.partner || venue?.id;
const rank = (venue) => {
  const index = VENUE_PRIORITY.indexOf(slugOf(venue));
  return index < 0 ? VENUE_PRIORITY.length : index;
};
export const compareVenuePriority = (a, b) => rank(a) - rank(b);

// Unknown venues keep their input order. Türkiye never defaults to/offers Bitget.
export function orderVenues(venues = [], locale = "en") {
  return [...venues].filter((venue) => !/^tr(?:-|$)/i.test(locale) || slugOf(venue) !== "bitget")
    .sort(compareVenuePriority);
}
