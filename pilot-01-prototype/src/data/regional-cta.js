import { venueDatabase } from "./venue-database.js";
import { publicCtaForVenue } from "./public-cta.js";
import { directoryContextSearch, regionalCtaState, venueMarketStatus } from "./directory-context.js";
import { localizedHref } from "./locale-routing.js";

export function regionalVenueCta(slug, locale = "en", market, product) {
  const access = publicCtaForVenue(slug, locale);
  const status = venueMarketStatus(venueDatabase[slug] || {}, market, product);
  const state = regionalCtaState({ market, status });
  // A verified benefit is not required to preserve the partner route. The
  // user supplied referral URL is the conversion path; benefit verification
  // only controls what savings/bonus claims we publish. Keep blocked regional
  // markets on the research path, but do not silently replace an unscoped or
  // pending-market referral link with the bare official domain.
  const direct = state !== "blocked" && access.hasPartnerRoute;
  const contextSearch = directoryContextSearch({ market, product, locale });
  return {
    ...access,
    marketStatus: status,
    ctaState: state,
    regionEligible: state === "available",
    direct,
    ctaHref: direct ? access.registrationUrl : localizedHref(`/exchanges/${slug}?${contextSearch}#registration-path`, { locale }),
  };
}
