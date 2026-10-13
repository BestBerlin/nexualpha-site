import { isNeutralCtaLocale } from './locale-policy.js';
import { publicCtaForVenue } from './source-bound-cta.js';
import { partnerRegistry } from './partner-registry.js';
import { isPartnerPromotableIn, promotionCountries } from './partner-geo-policy.js';
const TURKEY = new Set(['okx', 'binance', 'bybit']);
const SIGNUP_AUTHORIZED_STATUSES = new Set(['licensed', 'registered', 'authorised', 'authorized']);
// A register entry never authorizes a commercial route by itself.
export function licenseSignup(record, { locale = 'en', market } = {}) {
  if (!partnerRegistry[record.exchange]?.hasReferral) return null;
  if (record.authorised === false || !SIGNUP_AUTHORIZED_STATUSES.has(String(record.status || '').toLowerCase())) return null;
  // Neutral locales (ru/ar/zh-Hant/ur/uk/vi) and zh-Hans carry no signup CTA.
  if (locale === 'zh-Hans' || isNeutralCtaLocale(locale)) return null;
  const country = record.country;
  if (!country || country === 'VN' || country === 'EU' || (country === 'TR' && !TURKEY.has(record.exchange))) return null;
  if (promotionCountries({ locale, market }).includes('TR') && !TURKEY.has(record.exchange)) return null;
  if (!isPartnerPromotableIn(record.exchange, { locale, market: country })) return null;
  if (!isPartnerPromotableIn(record.exchange, { locale, market })) return null;
  const cta = publicCtaForVenue(record.exchange, locale, country);
  if (!cta.hasPartnerRoute || cta.actionGate || !cta.registrationUrl) return null;
  return `/go/${record.exchange}?src=licenses-${country.toLowerCase()}&market=${encodeURIComponent(country)}`;
}
