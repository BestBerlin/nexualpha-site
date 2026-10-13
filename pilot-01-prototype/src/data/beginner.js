import { publicCtaForVenue } from './source-bound-cta.js';
import { promotionCountries } from './partner-geo-policy.js';
import { isNeutralCtaLocale } from './locale-policy.js';
import { licenseRecords } from './licenses.js';
import { partnerRegistry } from './partner-registry.js';
import { BACKUP_SIGNUP_URLS } from './backup-signup.js';

export const BEGINNER_VENUES = Object.freeze(['bitget', 'okx', 'binance', 'bybit']);
export function beginnerChoice(locale = 'en', market) {
  const countries = promotionCountries({ locale, market });
  const order = (locale === 'tr' || countries.includes('TR')) ? ['okx', 'binance', 'bybit'] : BEGINNER_VENUES;
  const choice = order.map(slug => publicCtaForVenue(slug, locale, market)).find(cta => cta.hasPartnerRoute && !cta.actionGate);
  if (!choice || isNeutralCtaLocale(locale)) return null;
  const records = licenseRecords.filter(record => record.exchange === choice.slug && countries.includes(record.country));
  return { ...choice, countries, records, href: beginnerSignupHref(choice.slug, locale, market) };
}
export function beginnerSignupHref(slug, locale, market, backup = false) {
  const params = new URLSearchParams({ src: 'beginner', locale });
  if (market) params.set('market', market);
  return `/go/${slug}${backup ? '-alt' : ''}?${params}`;
}

// Same bounded domain-only semantics as the bot /checklink: never fetch or store the submitted URL.
// Official domains and approved mirrors come from the existing registry; do not learn hosts from user input.
const HOSTS = new Map();
for (const [slug, record] of Object.entries(partnerRegistry)) {
  const values = [record.officialDomain, BACKUP_SIGNUP_URLS[slug]];
  for (const value of values.filter(Boolean)) {
    try {
      const host = new URL(value.startsWith('https:') ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, '');
      HOSTS.set(host, slug);
    } catch { /* Invalid registry entries are not trusted. */ }
  }
}
export function checkBeginnerLink(input) {
  let url;
  try { url = new URL(String(input).trim()); } catch { return { kind: 'invalid' }; }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return { kind: 'invalid' };
  const host = url.hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
  if (/^[\d.]+$/.test(host) || host.includes(':') || host.includes('xn--')) return { kind: 'invalid', host };
  // Exact approved hosts only: an exchange-looking subdomain is not automatically an official entry.
  if (HOSTS.has(host)) return { kind: 'valid', host, venue: HOSTS.get(host) };
  return { kind: [...HOSTS.values()].some(brand => host.includes(brand.replace('-io', ''))) ? 'invalid' : 'unknown', host };
}
