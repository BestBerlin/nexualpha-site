import { partnerRegistry } from './partner-registry.js';
import { REFERRAL_PARTNERS } from './referral-partners.generated.js';
import { partnerBenefitStatus } from './partner-benefit-status.js';
import { isPartnerPromotableIn, promotionCountries } from './partner-geo-policy.js';
import { CAMPAIGN_PROMOTIONS } from './promotions.generated.js';
import { promotionCopy, promotionConditions } from './promotion-copy.js';
export { promotionCopy } from './promotion-copy.js';

// This compact registry projection is generated from buildPartnersFeed before this module is built.
const registryRows = REFERRAL_PARTNERS.map(p => ({ ...p, termsConfirmedOn: partnerBenefitStatus(p.slug)?.confirmedOn || null }));
const registrySlugs = new Set(registryRows.map(p => p.slug));
export const NEUTRAL_PROMOTION_LOCALES = ['ru', 'ar', 'zh-Hant', 'ur', 'uk'];
// Confirmation dates come from the registry, never the build clock. Undated terms stay disabled.
export const PROMOTIONS = Object.freeze([
  ...registryRows.map(p => ({
    id: `${p.slug}-signup`, partner: p.slug, kind: 'signup', name: p.name,
    officialSource: `https://${partnerRegistry[p.slug].officialDomain}`,
    regions: { allow: [], deny: [] }, locales: { allow: [], neutral: NEUTRAL_PROMOTION_LOCALES },
    validFrom: p.termsConfirmedOn, validTo: null, conditions: promotionConditions,
    link: `/go/${p.slug}?src=news-sponsored`, lastVerified: p.termsConfirmedOn,
    enabled: Boolean(p.termsConfirmedOn), inviteCode: p.inviteCode, share: p.share,
    topicTags: [p.slug], notes: p.termsConfirmedOn ? 'Registry-confirmed signup terms; no bonus claim.' : 'Disabled: dated terms verification missing.',
  })), ...CAMPAIGN_PROMOTIONS,
]);

export function resolvePromotions({ topicTags = [], venue, coin, locale = 'en', market, now = Date.now() } = {}, records = PROMOTIONS) {
  locale = Object.keys(promotionConditions).find(key => key.toLowerCase() === String(locale).toLowerCase()) || locale;
  const clock = typeof now === 'number' ? now : Date.parse(now);
  const tags = new Set([...(Array.isArray(topicTags) ? topicTags : []), ...(Array.isArray(venue) ? venue : [venue]), coin].filter(v => typeof v === 'string').map(v => v.toLowerCase()));
  const countries = promotionCountries({ locale, market });
  const selected = Number.isFinite(clock) && !NEUTRAL_PROMOTION_LOCALES.includes(locale) ? records.filter(p => {
    const verified = Date.parse(p.lastVerified);
    const start = p.validFrom ? Date.parse(p.validFrom) : -Infinity;
    const end = p.validTo ? Date.parse(p.validTo) : Infinity;
    const registryPartner = registrySlugs.has(p.partner);
    if (!p.enabled || !registryPartner || !partnerRegistry[p.partner] || !/^https:\/\//.test(p.officialSource || '') || p.link?.split('?')[0] !== `/go/${p.partner}` || !/^src=[a-z0-9_-]+$/.test(p.link?.split('?')[1] || '')) return false;
    if (!Number.isFinite(verified) || clock < verified || clock - verified > 30 * 864e5 || Number.isNaN(start) || Number.isNaN(end) || clock < start || clock > end) return false;
    if (!isPartnerPromotableIn(p.partner, { locale, market }) || p.locales?.neutral?.includes(locale) || (p.locales?.allow?.length && !p.locales.allow.includes(locale))) return false;
    const areas = [...countries, String(market || '').toUpperCase()];
    if (p.regions?.deny?.some(r => areas.includes(r.toUpperCase())) || (p.regions?.allow?.length && !p.regions.allow.some(r => areas.includes(r.toUpperCase())))) return false;
    return tags.has(p.partner) || p.topicTags?.some(tag => tags.has(tag.toLowerCase())) || p.coins?.some(c => tags.has(c.toLowerCase()));
  }).slice(0, 2) : [];
  if (selected.length) return selected;
  const t = promotionCopy(locale);
  return [{ id: 'site-tool', kind: 'tool', link: '/compare', name: t.compare, conditions: {} }];
}
