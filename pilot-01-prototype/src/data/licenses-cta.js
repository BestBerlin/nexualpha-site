import { publicCtaForVenue } from './source-bound-cta.js';
import { isPartnerPromotableIn, promotionCountries } from './partner-geo-policy.js';
const TURKEY = new Set(['okx', 'binance', 'bybit']);
// A register entry never authorizes a commercial route by itself.
export function licenseSignup(record, { locale = 'en', market } = {}) {
  if (!['licensed', 'registered', 'applied'].includes(record.status)) return null;
  if (['zh-Hans', 'zh-Hant'].includes(locale)) return null;
  const country = record.country;
  if (!country || (country === 'TR' && !TURKEY.has(record.exchange))) return null;
  if (promotionCountries({ locale, market }).includes('TR') && !TURKEY.has(record.exchange)) return null;
  if (!isPartnerPromotableIn(record.exchange, { locale, market: country })) return null;
  if (!isPartnerPromotableIn(record.exchange, { locale, market })) return null;
  const cta = publicCtaForVenue(record.exchange, locale, country);
  if (!cta.hasPartnerRoute || cta.actionGate || !cta.registrationUrl) return null;
  return `/go/${record.exchange}?src=licenses-${country.toLowerCase()}&market=${encodeURIComponent(country)}`;
}
