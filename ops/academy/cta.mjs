// Read the same facts and territorial gate as /intel/partners.json; never copy codes.
import { buildPartnersFeed } from '../../pilot-01-prototype/src/data/partners-feed.js';
import { isPartnerPromotableIn } from '../../pilot-01-prototype/src/data/partner-geo-policy.js';
const [slug, locale, market = ''] = process.argv.slice(2);
const neutral = ['ru', 'ar', 'zh-Hant', 'ur', 'uk'];
const row = buildPartnersFeed({generatedAt: 'academy-render'}).partners.find(p => p.slug === slug);
console.log(JSON.stringify(!neutral.includes(locale) && row?.inviteCode && isPartnerPromotableIn(slug, {locale, market}) ? row : null));
