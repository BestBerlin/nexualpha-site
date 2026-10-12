// Sign-up of the Bybit Stocks page: the registry invite route (publicCtaForVenue, never typed by hand) through our tracked
// /go/bybit redirect, or null where Bybit Stocks may not be promoted (neutral locales, restricted markets, no partner route).
// Browser/SSR only; the Worker head reads bybitStocksInviteCode (bybit-stocks.js) so it does not ship the CTA graph.
import { publicCtaForVenue } from "./source-bound-cta.js";
import { BYBIT_STOCKS_VENUE, bybitStocksSignupGate } from "./bybit-stocks.js";

export function bybitStocksSignup({ locale = "en", market, placement = "hero" } = {}) {
  if (bybitStocksSignupGate({ locale, market })) return null;
  const cta = publicCtaForVenue(BYBIT_STOCKS_VENUE, locale, market);
  if (!cta?.routeAvailable || !cta.inviteCode) return null;
  return { code: cta.inviteCode, href: `/go/${BYBIT_STOCKS_VENUE}?src=bybit-stocks-${placement}` };
}
