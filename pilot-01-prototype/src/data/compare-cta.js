import { regionalVenueCta } from './source-bound-cta.js';

// Preserve the reviewed geographic/product gate; only available actions enter /go.
export function compareVenueCta(slug, selected, locale, market, product, context = {}) {
  const cta = regionalVenueCta(slug, locale, market, product, context);
  if (!cta.direct) return cta;
  const query = new URLSearchParams({ src: `compare-${selected.join('-vs-')}` });
  if (locale) query.set('locale', locale);
  if (market) query.set('market', market);
  return { ...cta, ctaHref: `/go/${slug}?${query}` };
}
