import test from 'node:test';
import { rendersSource } from './helpers/outbound-expect.mjs';
import assert from 'node:assert/strict';
import { validateCampaignBriefs, attachCampaignBriefs, applyCampaignBriefs } from '../src/data/campaign-briefs.js';
import { updatePath, updateHref } from '../src/data/activity-update.js';
import { createSsrHarness } from './helpers/ssr-hydration-harness.mjs';
const now = Date.parse('2026-10-12T00:00:00Z');
const item = { id: 'okx:brief-test', venue: 'okx', category: 'event', title: 'Original campaign title $999', url: 'https://www.okx.com/help/brief-test', publishedAt: '2026-10-11T00:00:00Z', endAt: '2026-10-20T00:00:00Z' };
const brief = { id: item.id, updated: '2026-10-11T00:00:00Z', headline: { en: 'Reviewed headline', 'zh-Hans': '已审核标题' }, summary: { en: 'Reviewed summary. Check eligibility at the source.' }, key_facts: [{ label: { en: 'Requirement' }, value: 'Verified account' }], who_can_join: { en: 'Eligible account holders.' }, reward_text: { en: 'Source checked reward' }, deadline: '2026-10-20T00:00:00Z', source_checked: '2026-10-11T00:00:00Z' };
test('locale fallback is requested locale, English, then raw; no inferred facts', () => {
 const feed = attachCampaignBriefs({items:[item]}, {items:[brief]});
 assert.equal(applyCampaignBriefs(item, feed, 'zh-Hans').title, '已审核标题');
 assert.equal(applyCampaignBriefs(item, feed, 'tr').title, 'Reviewed headline');
 assert.equal(applyCampaignBriefs(item, {campaignBriefs:[{id:item.id,headline:{vi:'Vietnamese'}}]}, 'tr').title, item.title);
 assert.equal(applyCampaignBriefs(item, {}, 'en').brief, null);
});
test('schema validates optional fields, stale IDs, dates, codes, lengths, duplicates and unknown keys', () => {
 const validate = entry => validateCampaignBriefs({items:[entry]}, {ids:[item.id],now,partnerCodes:['SECRET123']});
 assert.deepEqual(validate(brief), []);
 assert.deepEqual(validate({id:item.id}), []);
 assert.deepEqual(validate({...brief,id:'retained'}), []);
 for (const invalid of [{...brief,id:'old',updated:'2026-08-01T00:00:00Z'}, {...brief,deadline:'tomorrow'}, {...brief,deadline:'2026-02-30T00:00:00Z'}, {...brief,headline:{en:'SECRET123'}}, {...brief,summary:{en:'https://example.com?ref=foo'}}, {...brief,headline:{en:'x'.repeat(181)}}, {...brief,headline:{xx:'Bad locale'}}, {...brief,unknown:true}, {...brief,updated:'2027-01-01T00:00:00Z'}, {...brief,key_facts:[{label:{en:'Label'},value:3}]}]) assert.ok(validate(invalid).length);
 assert.ok(validateCampaignBriefs({items:[brief,brief]},{ids:[item.id],now}).length);
 assert.ok(validateCampaignBriefs([]).length);
});
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
test('SSR renders brief, English fallback and source (no raw exchange title under a brief headline, owner 2026-10-12); absent briefs keep template', () => {
 for (const locale of ['en','zh-Hans','tr','vi']) {
  const html = harness.render(`https://nexualpha.com${updateHref(item,locale)}`,{officialAnnouncements:attachCampaignBriefs({items:[item]},[brief])});
  assert.ok(html.includes(locale === 'zh-Hans' ? brief.headline['zh-Hans'] : brief.headline.en));
  assert.ok(html.includes(brief.summary.en));
  assert.ok(!html.includes(item.title));
  assert.ok(html.includes('Verified account'));
  assert.match(html, /dateTime="2026-10-20T00:00:00Z"/i);
  assert.ok(rendersSource(html, item.url, { locale }), `${locale}: source carries the code or is a plain label`);
 }
 const html = harness.render(`https://nexualpha.com${updatePath(item)}`,{officialAnnouncements:{items:[item]}});
 assert.ok(html.includes(item.title));
 assert.ok(!/datetime="2026-10-20T00:00:00Z"/i.test(html));
 assert.ok(!html.includes('Reviewed summary'));
});

test('activities SSR cards consume localized briefs and explicit facts', () => {
 const html = harness.render('https://nexualpha.com/vi/activities', {officialAnnouncements:attachCampaignBriefs({items:[item]},[brief])});
 assert.ok(html.includes(brief.headline.en));
 assert.ok(!html.includes(brief.summary.en), 'untranslated summaries are not full cards');
 assert.ok(!html.includes('Verified account'), 'compact source notice omits unlocalized facts');
 assert.ok(html.includes('data-compact-notice="true"'));
 assert.ok(!html.includes(item.title));
});
