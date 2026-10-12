import { readFileSync, writeFileSync } from 'node:fs';
import { PROMOTIONS } from '../src/data/promotions.js';
import { OWNER_CAMPAIGNS } from '../src/data/owner-campaigns.js';
import { promotionConditions, promotionCopy } from '../src/data/promotion-copy.js';
const root = new URL('../', import.meta.url);
const feed = JSON.parse(readFileSync(new URL('public/intel/official-announcements.json', root), 'utf8'));
const partners = new Set(PROMOTIONS.filter(p => p.kind === 'signup').map(p => p.partner));
// Announcement publication/fetch time does not establish expiry, eligibility or a terms verification date.
const campaigns = [...OWNER_CAMPAIGNS, ...(feed.items || []).filter(c => c.category === 'event')].filter(c => partners.has(c.venue)).map(c => ({
  id: `campaign-${c.id}`, partner: c.venue, kind: 'campaign', name: typeof c.title === 'string' ? c.venue : c.title?.en || c.venue,
  officialSource: c.url, regions: c.regions || { allow: [], deny: [] }, locales: { allow: [], neutral: ['ru', 'ar', 'zh-Hant', 'ur', 'uk'] },
  validFrom: c.startAt || null, validTo: c.endAt || null, conditions: c.conditions || promotionConditions,
  link: `/go/${c.venue}?src=news-campaign`, lastVerified: c.checkedAt || null,
  enabled: Boolean(c.startAt && c.endAt && c.checkedAt && c.regions && c.conditions),
  topicTags: [c.venue], notes: 'Requires explicit campaign validity, eligibility and dated terms verification; publication date is insufficient.',
}));
writeFileSync(new URL('src/data/promotions.generated.js', root), `// Generated from activities campaign snapshots; missing evidence stays disabled.\nexport const CAMPAIGN_PROMOTIONS = Object.freeze(${JSON.stringify(campaigns, null, 2)});\n`);
writeFileSync(new URL('public/intel/promotions.json', root), JSON.stringify({ promotions: [...PROMOTIONS.filter(p => p.kind === 'signup'), ...campaigns] }, null, 2) + '\n');
console.log(`Exported ${partners.size} signup rules and ${campaigns.length} campaign rules`);
