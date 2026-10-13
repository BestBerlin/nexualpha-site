// Soft CTA of /etf-flows (owner rules): one venue in our order, geo-gated like the coin pages, tracked as
// /go/<venue>?src=etf-flows. Neutral locales and restricted markets get none.
import { isPartnerPromotableIn, promotionCountries } from "./partner-geo-policy.js";
import { publicCtaForVenue } from "./source-bound-cta.js";

const SIGNUP_ORDER = ["okx", "bitget", "binance"];
const NEUTRAL_LOCALES = new Set(["ru", "ar", "zh-Hant", "ur", "uk"]);
const TURKEY_VENUES = new Set(["okx", "binance", "bybit"]);
const VENUE_NAMES = { okx: "OKX", bitget: "Bitget", binance: "Binance" };
export function etfSignup({ locale = "en", market } = {}) {
  if (NEUTRAL_LOCALES.has(locale)) return null;
  const turkey = promotionCountries({ locale, market }).includes("TR");
  for (const venue of SIGNUP_ORDER) {
    if (turkey && !TURKEY_VENUES.has(venue)) continue;
    if (!isPartnerPromotableIn(venue, { locale, market })) continue;
    const cta = publicCtaForVenue(venue, locale, market);
    if (!cta || cta.actionGate || !cta.registrationUrl) continue;
    return { venue, name: VENUE_NAMES[venue], href: `/go/${venue}?src=etf-flows` };
  }
  return null;
}
