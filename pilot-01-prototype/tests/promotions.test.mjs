import {readFile} from 'node:fs/promises';
import {referralPartnerRows} from '../scripts/generate-referral-partners.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { PROMOTIONS, resolvePromotions, NEUTRAL_PROMOTION_LOCALES } from '../src/data/promotions.js';
import { buildPartnersFeed } from '../src/data/partners-feed.js';
const now = Date.parse('2026-10-12T12:00:00Z');
const base = PROMOTIONS.find(p => p.partner === 'okx' && p.kind === 'signup');
const resolve = (records, context = {}) => resolvePromotions({ venue: 'okx', locale: 'en', now, ...context }, records);
const neutral = result => assert.equal(result[0].kind, 'tool');
test('build-generated seed uses exact registry codes and shares; no WEEX or invented campaigns', async () => {
  const sourceUrl=new URL('../src/data/promotions.js',import.meta.url);
  let source=(await readFile(sourceUrl,'utf8')).replace(/import \{ REFERRAL_PARTNERS \} from ['"][^'"]+['"];?/, 'const REFERRAL_PARTNERS='+JSON.stringify(referralPartnerRows())+';');
  source=source.replace(/from (['"])(\.[^'"]+)\1/g,(_,q,p)=>'from '+JSON.stringify(new URL(p,sourceUrl).href));
  const {PROMOTIONS:generatedSeed}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  for (const p of generatedSeed.filter(p => p.kind === 'signup')) {
    const row = buildPartnersFeed({ generatedAt: 'static' }).partners.find(row => row.slug === p.partner);
    assert.equal(p.inviteCode, row.inviteCode); assert.equal(p.share, row.share);
  }
  assert.ok(!generatedSeed.some(p => p.partner === 'weex'));
  assert.ok(generatedSeed.filter(p => p.kind === 'campaign').every(p => !p.enabled));
});
test('expiry, future start, staleness, invalid dates and disabled fail closed', () => {
  assert.equal(resolve([base])[0].partner, 'okx');
  for (const patch of [{ enabled: false }, { validTo: '2026-10-11' }, { validFrom: '2026-10-13' }, { lastVerified: '2026-09-11' }, { lastVerified: null }, { lastVerified: '2026-10-13' }, { validTo: 'invalid' }]) neutral(resolve([{ ...base, ...patch }]));
  assert.equal(resolve([{ ...base, validTo: new Date(now).toISOString() }])[0].partner, 'okx');
  assert.equal(resolve([{ ...base, lastVerified: new Date(now - 30 * 864e5).toISOString(), validFrom: null }])[0].partner, 'okx');
});
test('geo, locale, registry and link gates', () => {
  for (const locale of NEUTRAL_PROMOTION_LOCALES) neutral(resolve([base], { locale }));
  neutral(resolve([base], { market: 'JP' }));
  neutral(resolve([base], { locale: 'zh-hant' }));
  for (const patch of [{ partner: 'unknown' }, { partner: 'weex' }, { link: 'https://www.okx.com' }, { link: '/go/binance?src=news' }, { link: '/go/okx' }, { regions: { allow: ['JP'], deny: [] } }, { regions: { deny: ['BR'] } }, { locales: { allow: ['ja'] } }]) neutral(resolve([{ ...base, ...patch }], { market: 'BR' }));
});
test('relevance, optional cta-style hints, neutral fallback and maximum two', () => {
  neutral(resolve([base], { venue: null, topicTags: ['politics'] }));
  assert.equal(resolve([base], { venue: null, topicTags: ['okx'] })[0].partner, 'okx');
  assert.equal(resolve([base, { ...base, id: 'second' }, { ...base, id: 'third' }]).length, 2);
  neutral(resolve([], { coin: 'BTC' }));
});
test('normalization and localized route payload preserve topic tags and cta hints', async () => {
  const { normalizeNewsArticle, projectNewsArticleForLocale } = await import('../src/data/news-feed-client.js');
  const article = normalizeNewsArticle({ slug: 'hint-fixture', publishedAt: '2026-10-12', title: { en: 'Title' }, summary: { en: 'Summary' }, content: { en: 'Content' }, sources: [{ url: 'https://example.com', title: 'Source', publisher: 'Source' }], tags: ['okx', 'stocks'], cta: { venue: 'okx', topic: 'stocks' } });
  assert.ok(article); assert.deepEqual(article.topicTags, ['okx', 'stocks']);
  const payload = projectNewsArticleForLocale(article, 'zh-Hans', { includeContent: true });
  assert.deepEqual(payload.topicTags, article.topicTags); assert.equal(payload.cta.venue, 'okx');
});
