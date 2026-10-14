import test from 'node:test';
import assert from 'node:assert/strict';
import { createSsrHarness } from './helpers/ssr-hydration-harness.mjs';
import { updatePath, updateHref, updateHeadline, updateItems, normalizeUpdateItem } from '../src/data/activity-update.js';
import { LOCALE_PREFIX_BY_CODE } from '../src/data/locale-routing.js';
import { updateCopy } from '../src/components/v3/activity/update-copy.js';
// Shared neutral list (ru, ar, zh-Hant, ur, uk and, since 2026-10-13, vi): src/data/locale-policy.js.
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";
const items = ['listing','event','delisting'].map(category => ({ id: `okx:${category}`, venue: 'okx', category, title: category === 'listing' ? 'OKX Will List TEST' : `OKX ${category}`, url: `https://www.okx.com/help/${category}`, publishedAt: new Date(Date.now()-3600000).toISOString() }));
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
test('stable update identity preserves distinct feed IDs and validates source URLs', () => {
 assert.equal(updatePath(items[0]), updatePath({...items[0],title:'Corrected title'}));
 assert.notEqual(updatePath({...items[0],id:'okx:a-b'}),updatePath({...items[0],id:'okx:a/b'}));
 assert.equal(updateItems({items:[...items,null,{...items[0],title:null},{...items[0],url:'https://evil.example/test'}]}).length,3);
 assert.equal(updateHeadline({...items[0],title:'Binance Will List TEST'},'zh-Hans'),'币安将上线 TEST');
 assert.ok(updateHref(items[0],'en',{market:'JP'}).endsWith('?market=JP'));
 assert.equal(normalizeUpdateItem({ kind:'PRODUCT_UPDATE' }).category,'product');
 assert.equal(normalizeUpdateItem({ kind:'LISTING' }).category,'listing');
 assert.equal(updateHeadline(normalizeUpdateItem({...items[1],title:{en:'Event',es:'Evento'}}),'es'),'Evento');
});
test('update routes render all categories and translated template guidance in every locale', () => {
 for (const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) for (const item of items) {
  const html = harness.render(`https://nexualpha.com${updateHref(item,locale)}`,{officialAnnouncements:{items}});
  assert.match(html,/class="[^"]*update-page/);
  assert.ok(html.includes(updateCopy(locale).means));
  assert.ok(html.includes(updateCopy(locale)[item.category]));
  assert.ok(html.includes(updateHref(items.find(row => row.id !== item.id),locale)));
  // The starter guide (新手村) is NexuAlpha Academy (/academy); /starter never existed and 404ed (crawl 2026-10-12).
  assert.match(html,/href="(?:\/[a-z-]+)?\/academy(?:[?#][^"]*)?"/);
  assert.doesNotMatch(html,/href="[^"]*\/starter/);
  // Owner 2026-10-13: OKX help pages take no referral parameter, so the original source is a plain label + domain.
  assert.doesNotMatch(html,/href="https:\/\/www\.okx\.com\/help\//,'no uncoded exchange link');
  assert.equal((html.match(/data-source-plain="okx\.com"/g)||[]).length,1,'original source only at bottom');
 }
});
test('neutral locales and blocked markets have no commercial CTA inside update article', () => {
 for (const context of [...NEUTRAL_CTA_LOCALE_LIST.map(locale=>({locale})),{locale:'en',market:'JP'}]) {
  const path = updateHref(items[1],context.locale) + (context.market ? `?market=${context.market}` : '');
  const html = harness.render(`https://nexualpha.com${path}`,{officialAnnouncements:{items}});
  const article = html.match(/<article>([\s\S]*?)<\/article>/)?.[1];
  assert.ok(article);
  assert.doesNotMatch(article,/data-cta-code=|data-cta-kind="registration"|40%|sponsored/);
  assert.match(article,/href="https:\/\/www.okx.com"/);
  if(context.market) assert.ok(article.includes(`${updateHref(items[0],context.locale)}?market=${context.market}`), 'related updates retain the market gate');
 }
 const html = harness.render(`https://nexualpha.com${updatePath(items[1])}`,{officialAnnouncements:{items}});
 assert.match(html,/data-cta-placement="activity-update-join"/);
 // Owner rule 2026-10-12: no commission fine print in page sections; the footer carries the disclosure.
 assert.doesNotMatch(html.split('<footer')[0],/Partner link, commission disclosed|data-disclosure-placement=/);
 assert.match(html,/class="clean-footer__summary"/);
 assert.match(html,/href="[^"]*\/methodology#disclosure"/);
});
test('Türkiye Bitget event update falls back to the activity index while listings stay informationally reachable', () => {
 const bitgetEvent = { id: 'bitget:event', venue: 'bitget', category: 'event', title: 'Bitget campaign title', url: 'https://www.bitget.com/support/articles/event', publishedAt: new Date(Date.now()-3600000).toISOString() };
 const bitgetListing = { id: 'bitget:listing', venue: 'bitget', category: 'listing', title: 'Bitget Will List TEST', url: 'https://www.bitget.com/support/articles/listing', publishedAt: new Date(Date.now()-3600000).toISOString() };
 const trEvent = harness.render(`https://nexualpha.com${updateHref(bitgetEvent,'tr')}`, {officialAnnouncements:{items:[bitgetEvent, bitgetListing]}});
 assert.match(trEvent, /update-page/);
 assert.match(trEvent, /href="\/tr\/activities"/);
 assert.doesNotMatch(trEvent, /Bitget campaign title/);
 const trListing = harness.render(`https://nexualpha.com${updateHref(bitgetListing,'tr')}`, {officialAnnouncements:{items:[bitgetEvent, bitgetListing]}});
 assert.match(trListing, /Bitget listeleyecek TEST/);
 assert.doesNotMatch(trListing, /Bitget campaign title/);
});
