import { publicCtaForVenue, regionalVenueCta } from '../../../data/source-bound-cta.js';
import { isNeutralCtaLocale } from '../../../data/locale-policy.js';

// Both gates matter: a valid partner route cannot override a market/product restriction.
export function conversionCta(slug, locale = 'en', market, product, context = {}) {
  if (isNeutralCtaLocale(locale)) return null;
  const cta = publicCtaForVenue(slug, locale, market);
  const regional = regionalVenueCta(slug, locale, market, product, context);
  if (!cta?.hasReferral || !cta.routeAvailable || !cta.registrationUrl || cta.actionGate ||
      !regional.direct || regional.actionGate || regional.ctaState === 'blocked') return null;
  return cta;
}

export function stickyVisible({ eligible, mobile, dismissed, heroPassed, ctaVisible, footerVisible = false }) {
  return Boolean(eligible && mobile && !dismissed && heroPassed && !ctaVisible && !footerVisible);
}

// Only explicit subject/entity metadata is eligible; incidental body mentions are not endorsements.
export function articleVenueKeys(article = {}) {
  const values = [article.subject, article.subjects, article.entityKeys, article.entities, article.relatedVenues].flat();
  return [...new Set(values.flatMap(value => {
    const key = typeof value === 'string' ? value : value?.slug || value?.key;
    if (!key) return [];
    return [key.replace(/^(?:venue|exchange):/, '').toLowerCase()];
  }))];
}
