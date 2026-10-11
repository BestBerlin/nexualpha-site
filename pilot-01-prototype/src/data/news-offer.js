import { publicCtaForVenue } from "./source-bound-cta.js";

// News sign-up offer: the first venue the article mentions that has a real invite route (placeholders excluded upstream).
export function pickNewsOfferVenue(slugs, locale = "en", market) {
  for (const slug of Array.isArray(slugs) ? slugs : []) {
    const cta = publicCtaForVenue(slug, locale, market);
    if (cta?.hasReferral && /^https:\/\//i.test(cta.registrationUrl || "")) return { slug, cta };
  }
  return null;
}
