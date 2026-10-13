import { APPROVED_CAMPAIGNS } from './campaign-autodraft.generated.js';
import { partnerRegistry } from './partner-registry.js';
import { isNeutralCtaLocale } from './locale-policy.js';
import { partnerPromotionGate, promotionCountries } from './partner-geo-policy.js';
import { sitewideReferral } from './exchange-outbound.js';

export const CAMPAIGN_LOCALES = ['en', 'zh-Hans'];
export const campaignPath = id => `/activities/${id}`;
export function approvedCampaign(pathname) {
  return APPROVED_CAMPAIGNS.find(c => campaignPath(c.id) === String(pathname).split(/[?#]/)[0].replace(/\/+$/, '')) || null;
}
// Custom links must bind the exact registered query parameter or equal a registered opaque-path URL.
export function campaignTarget(campaign) {
  const partner = partnerRegistry[campaign.venue];
  if (!partner?.hasReferral || !partner.inviteCode) return null;
  if (!campaign.campaignLinkRequired) return partner.registrationUrl;
  let url;
  try { url = new URL(campaign.campaignUrl); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
  const registered = [partner.registrationUrl, ...(partner.alternateRegistrationUrls || [])].map(href => new URL(href));
  if (registered.some(target => target.href === url.href)) return url.href;
  const sitewide = sitewideReferral(campaign.venue);
  const mainHost = partner.officialDomain.replace(/^www\./, '');
  if (url.hostname.replace(/^www\./, '') !== mainHost) return null;
  if (sitewide) { url.searchParams.set(sitewide.param, sitewide.code); return url.href; }
  // Other venues require an owner-reviewed special URL with the same parameter and code as registration.
  if (registered.some(target => [...target.searchParams].some(([key, value]) => value === partner.inviteCode && url.searchParams.get(key) === value))) return url.href;
  return null;
}
export function campaignSignup(campaign, { locale = 'en', market, now = Date.now() } = {}) {
  const policyLocale = /^tr(?:-|$)/i.test(String(locale)) ? 'tr' : locale;
  if (campaign.status !== 'APPROVED' || isNeutralCtaLocale(locale) || partnerPromotionGate(campaign.venue, { locale: policyLocale, market })) return null;
  const countries = promotionCountries({ locale: policyLocale, market });
  if (countries.some(country => campaign.restrictedCountries.includes(country.split('-')[0]))) return null;
  if (campaign.allowedCountries.length && (!countries.length || countries.some(country => !campaign.allowedCountries.includes(country.split('-')[0])))) return null;
  const time = Number(now instanceof Date ? now.getTime() : now);
  if (!(time >= Date.parse(campaign.startAt) && time < Date.parse(campaign.endAt)) || !campaignTarget(campaign)) return null;
  const params = new URLSearchParams({ src: `campaign-${campaign.id}`.slice(0, 48), locale });
  if (market) params.set('market', market);
  return { code: partnerRegistry[campaign.venue].inviteCode, href: `/go/campaign-${campaign.id}?${params}` };
}
export function campaignRouteSeo(pathname, locale = 'en', { urlFor = path => path } = {}) {
  const campaign = approvedCampaign(pathname);
  if (!campaign) return null;
  const copy = campaign.copy[locale] || campaign.copy.en;
  return { title: `${copy.title} | NexuAlpha`, description: copy.rewardHeadline, indexable: CAMPAIGN_LOCALES.includes(locale), schemas: [{ '@context': 'https://schema.org', '@type': 'WebPage', name: copy.title, url: urlFor(campaignPath(campaign.id)), inLanguage: locale }] };
}
export function campaignSitemapEntries({ urlFor }) {
  return APPROVED_CAMPAIGNS.flatMap(c => CAMPAIGN_LOCALES.map(locale => ({
    pathname: campaignPath(c.id), locale, loc: urlFor(campaignPath(c.id), locale), lastmod: c.reviewedAt.slice(0, 10),
    alternates: [...CAMPAIGN_LOCALES.map(hreflang => ({ hreflang, href: urlFor(campaignPath(c.id), hreflang) })), { hreflang: 'x-default', href: urlFor(campaignPath(c.id), 'en') }],
  })));
}
