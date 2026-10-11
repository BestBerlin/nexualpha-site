// "<exchange> alternatives" page slugs for route matching in the app shell. Mirrors Object.keys(VENUE_ALTERNATIVE_PAGES)
// in venue-alternatives.js (guarded by tests/exchange-keywords.test.mjs) so App.jsx does not ship the page copy on every
// route. Add a slug here when a page is added there.
export const VENUE_ALTERNATIVE_SLUGS = Object.freeze(["bybit-alternatives"]);
