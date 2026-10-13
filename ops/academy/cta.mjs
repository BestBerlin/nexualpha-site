// Read the same facts and territorial gate as /intel/partners.json; never copy codes.
import { buildPartnersFeed } from '../../pilot-01-prototype/src/data/partners-feed.js';
import { isPartnerPromotableIn } from '../../pilot-01-prototype/src/data/partner-geo-policy.js';
import { NEUTRAL_CTA_LOCALE_LIST } from '../../pilot-01-prototype/src/data/locale-policy.js';
const [slug, locale, market = ''] = process.argv.slice(2);
const neutral = NEUTRAL_CTA_LOCALE_LIST;
const row = buildPartnersFeed({generatedAt: 'academy-render'}).partners.find(p => p.slug === slug);
console.log(JSON.stringify(!neutral.includes(locale) && row?.inviteCode && isPartnerPromotableIn(slug, {locale, market}) ? row : null));
