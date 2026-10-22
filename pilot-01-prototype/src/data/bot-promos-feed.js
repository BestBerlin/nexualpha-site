// Build-only projection. Never import into the browser entry or invent campaign terms.
import { OFFICIAL_EXCHANGE_ACTIVITIES } from './generated-official-activities.js';
import { OWNER_CAMPAIGNS } from './owner-campaigns.js';
import { campaignPeriod, officialResearchUrl } from './official-campaign-model.js';
import { campaignVisibleInLocale } from './campaign-locale-policy.js';
import { isPartnerPromotableIn } from './partner-geo-policy.js';
import { isNeutralCtaLocale } from './locale-policy.js';
import { LOCALE_PREFIX_BY_CODE, localizedPath } from './locale-routing.js';
import { updatePath } from './activity-update-path.js';
import { feeFact, factsForVenue } from './exchange-facts.js';
import { HOME_REBATE_SHARE } from './home-rebate-tiers.js';

export const BOT_PROMOS_PATH = '/intel/bot-promos.json';
const text = (value, locale) => typeof value === 'string' ? value : value?.[locale] || value?.en || '';
// UTF-16 units count an astral emoji as two, as required by the bot contract.
export function promoButton(value) {
  let result = '';
  for (const char of value) {
    if (result.length + char.length > 20) break;
    result += char;
  }
  return result;
}

export function buildBotPromosFeed({ now = Date.now(), campaigns = [...OFFICIAL_EXCHANGE_ACTIVITIES, ...OWNER_CAMPAIGNS.map(item => ({ ...item, category: item.category || 'campaign' }))] } = {}) {
  const time = Number(now);
  if (!Number.isFinite(time)) throw new TypeError('Invalid bot promo build time');
  const rows = ['bitget', 'okx', 'binance', 'hyperliquid'].flatMap(slug => {
    const fee = feeFact(slug, 'perp');
    if (fee.state !== 'checked' || !Number.isFinite(fee.taker) || !fee.checkedOn) return [];
    // Same 4% fee discount as the home figure; explicitly distinct from a rebate.
    const discount = slug === 'hyperliquid';
    return [{ slug, name: factsForVenue(slug).name, takerPct: fee.taker,
      share: discount ? 0.04 : HOME_REBATE_SHARE[slug], benefitType: discount ? 'fee-discount' : 'rebate',
      source: `perp taker, checked ${fee.checkedOn}` }];
  });
  const promos = [];
  for (const item of Array.isArray(campaigns) ? campaigns : []) {
    if (!item || typeof item !== 'object') continue;
    const partner = item.venue || item.platform?.slug;
    const startsAt = item.startAt;
    const endsAt = item.endAt; // A notice cache expiry is not a campaign end date.
    if (campaignPeriod({ startAt: startsAt, endAt: endsAt }, time) !== 'WITHIN_DATES') continue;
    if (item.fixture === true || (item.reviewStatus && item.reviewStatus !== 'APPROVED')) continue;
    if (item.status && item.status !== 'ACTIVE') continue;
    const officialUrl = officialResearchUrl(item.officialSource?.url || item.url, partner);
    if (typeof item.id !== 'string' || !item.id.trim() || !officialUrl) continue;
    const promo = { id: item.id, partner, priority: Number.isFinite(item.priority) ? item.priority : 0,
      startsAt, endsAt, officialUrl, page: {}, button: {}, title: {}, summary: {}, locales: [] };
    const announcement = !['event', 'campaign', 'platform_activity'].includes(String(item.category || item.kind || '').toLowerCase());
    for (const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) {
      if (isNeutralCtaLocale(locale) || !campaignVisibleInLocale(item, locale) || !isPartnerPromotableIn(partner, { locale })) continue;
      if (Array.isArray(item.locales) && !item.locales.includes(locale)) continue;
      const title = text(item.title, locale);
      if (typeof title !== 'string' || !title.trim()) continue;
      promo.locales.push(locale);
      promo.page[locale] = localizedPath(updatePath(item), locale);
      promo.title[locale] = title;
      promo.button[locale] = promoButton(title);
      // Announcements carry only their existing title, time and official URL.
      const summary = text(item.summary, locale);
      promo.summary[locale] = announcement || typeof summary !== 'string' ? '' : summary;
    }
    if (promo.locales.length) promos.push(promo);
  }
  promos.sort((a, b) => b.priority - a.priority || Date.parse(b.startsAt) - Date.parse(a.startsAt) || a.id.localeCompare(b.id));
  const seen = new Set();
  const unique = promos.filter(p => !seen.has(p.id) && seen.add(p.id));
  return { schema: 'nexualpha.bot-promos.v1', generatedAt: new Date(time).toISOString(),
    savings: { volumes: [1e6, 1e7, 1e8], rows }, promos: unique.slice(0, 5) };
}
