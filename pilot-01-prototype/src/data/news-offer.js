import { isPartnerPromotableIn } from "./partner-geo-policy.js";
import { orderVenues } from "./venue-priority.js";
import { publicCtaForVenue } from "./source-bound-cta.js";

// News sign-up offer: the highest-priority venue the article mentions that has a real invite route (placeholders excluded upstream).
export function pickNewsOfferVenue(slugs, locale = "en", market) {
  for (const slug of orderVenues(Array.isArray(slugs) ? slugs : [], locale)) {
    if (!isPartnerPromotableIn(slug, { locale }) || !isPartnerPromotableIn(slug, { locale, market })) continue;
    const cta = publicCtaForVenue(slug, locale, market);
    if (cta?.hasReferral && /^https:\/\//i.test(cta.registrationUrl || "")) return { slug, cta };
  }
  return null;
}
