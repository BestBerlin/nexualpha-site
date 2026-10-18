import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";
import { updateHref } from "../src/data/activity-update.js";
import { campaignVisibleInLocale } from "../src/data/campaign-locale-policy.js";
import { monthCampaigns, isStartOfMonth } from "../src/components/v3/activity/campaign-month.js";
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";
let harness, CampaignJoin;
test.before(async () => { harness = await createSsrHarness(); ({ CampaignJoin } = await harness.vite.ssrLoadModule('/src/components/v3/activity/CampaignJoin.jsx')); });
test.after(async () => { await harness?.close(); });
const render = props => renderToStaticMarkup(React.createElement(CampaignJoin, props));
test('join blocks use gated routes, omit unknown rebates, and keep neutral locales', () => {
  const en = render({ venue: 'okx', locale: 'en' });
  assert.match(en, /data-cta-placement="activities-live-campaign"/);
  assert.match(en, /data-cta-code="[^"]+"/);
  assert.doesNotMatch(en, /<p>|40%/);
  // Owner rule 2026-10-12: the join block carries no commission or terms fine print (footer + legal pages only).
  assert.doesNotMatch(en, /commission disclosed|official page|<small>|data-disclosure-placement=/);
  assert.doesNotMatch(render({ venue: 'okx', locale: 'zh-Hans' }), /参加条件/);
  assert.doesNotMatch(render({ venue: 'bybit', locale: 'en' }), /fees back/);
  for (const locale of [...NEUTRAL_CTA_LOCALE_LIST, 'zh-TW', 'zh-HK', 'ru-RU', 'ar-SA', 'vi-VN']) assert.doesNotMatch(render({ venue: 'okx', locale }), /data-cta-code=|40%/);
  for (const venue of ['kraken', 'kucoin', 'okx']) {
    const html = render({ venue, locale: 'en', market: 'JP', officialUrl: 'https://www.okx.com/help/example' });
    assert.doesNotMatch(html, /data-cta-kind="registration"/);
    assert.match(html, /Open official campaign page/);
  }
});
test('monthly strip caps six events newest first and uses Singapore month boundaries for every locale', () => {
  const now = Date.parse('2026-10-01T00:00:00Z');
  const event = { category: 'event', publishedAt: '2026-09-30T20:00:00Z' };
  assert.equal(monthCampaigns([event], 'en', now).length, 1);
  assert.equal(monthCampaigns([event], 'zh-Hans', now).length, 1);
  assert.equal(isStartOfMonth('en', Date.parse('2026-10-07T20:00:00Z')), false);
  assert.equal(isStartOfMonth('zh-Hans', Date.parse('2026-10-07T20:00:00Z')), false);
  assert.equal(monthCampaigns([{ category: 'event', publishedAt: '2026-09-30T15:59:00Z' }], 'en', now).length, 0);
  const items = Array.from({length: 10}, (_, i) => ({ category: 'event', id: i, publishedAt: `2026-10-${String(i+1).padStart(2,'0')}T00:00:00Z` }));
  assert.deepEqual(monthCampaigns([...items, {category:'listing',publishedAt:'2026-10-11T00:00:00Z'}], 'en', Date.parse('2026-10-12T00:00:00Z')).map(i=>i.id), [9,8,7,6,5,4]);
});
test('one grouped campaign list preserves official facts and explicit market gates', async () => {
  const { LiveCampaigns } = await harness.vite.ssrLoadModule('/src/components/v3/activity/LiveCampaigns.jsx');
  const initialFeed = { items: [
    { id: 'okx:test', venue: 'okx', category: 'event', title: 'Official campaign title', url: 'https://www.okx.com/help/test', publishedAt: new Date().toISOString() },
    { id: 'bitget:test', venue: 'bitget', category: 'event', title: 'Bitget campaign title', url: 'https://www.bitget.com/support/articles/test', publishedAt: new Date().toISOString() },
  ] };
  const html = renderToStaticMarkup(React.createElement(LiveCampaigns, { locale: 'en', market: 'JP', initialFeed }));
  assert.ok(html.includes(updateHref(initialFeed.items[0], 'en', { market: 'JP' })), 'detail links preserve the blocked market');
  assert.doesNotMatch(html, /campaign-month/);
  assert.equal((html.match(/Official campaign title/g) || []).length, 1);
  assert.equal((html.match(/Bitget campaign title/g) || []).length, 1);
  assert.match(html, /Official campaign title/);
  assert.match(html, /Bitget campaign title/);
  assert.match(html, /href="\/activities\/updates\/okx\//);
  assert.doesNotMatch(html, /href="https:\/\/www.okx.com\/help\/test"/);
  assert.doesNotMatch(html, /data-cta-kind="registration"/);
  const allowed = renderToStaticMarkup(React.createElement(LiveCampaigns, { locale: 'en', initialFeed }));
  assert.doesNotMatch(allowed, /activities-month-campaign/);
  assert.match(allowed, /data-cta-placement="activities-live-campaign"/);
  const tr = renderToStaticMarkup(React.createElement(LiveCampaigns, { locale: 'tr', initialFeed }));
  assert.match(tr, /Official campaign title/);
  assert.doesNotMatch(tr, /Bitget campaign title/);
});
test('Türkiye Bitget campaign policy hides campaigns and platform activities but keeps listings', () => {
  assert.equal(campaignVisibleInLocale({ venue: 'bitget', category: 'event' }, 'tr'), false);
  assert.equal(campaignVisibleInLocale({ platform: { slug: 'bitget' }, kind: 'PLATFORM_ACTIVITY' }, 'tr'), false);
  assert.equal(campaignVisibleInLocale({ venue: 'bitget', category: 'listing' }, 'tr'), true);
  assert.equal(campaignVisibleInLocale({ venue: 'okx', category: 'event' }, 'tr'), true);
  assert.equal(campaignVisibleInLocale({ venue: 'bitget', category: 'event' }, 'en'), true);
});
test('legacy activity detail route also hides Turkish Bitget platform activities', async () => {
  const { ActivityDetailPage } = await harness.vite.ssrLoadModule('/src/components/v3/activity/ActivityPages.jsx');
  const update = {
    id: 'bitget-platform-activity',
    kind: 'PLATFORM_ACTIVITY',
    title: 'Bitget platform activity title',
    platform: { slug: 'bitget', name: 'Bitget' },
    officialSource: { type: 'official', url: 'https://www.bitget.com/support/articles/activity' },
    discoveredAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  };
  const html = renderToStaticMarkup(React.createElement(ActivityDetailPage, { copy: {}, locale: 'tr', update, venues: [{ slug: 'bitget', name: 'Bitget' }] }));
  assert.doesNotMatch(html, /Bitget platform activity title/);
  assert.match(html, /v3-page--empty/);
});
test('campaign copy is complete in every locale and unknown shares never create fee claims', async () => {
  const { campaignJoinCopyByLocale } = await import('../src/components/v3/activity/campaign-join-copy.js');
  assert.equal(Object.keys(campaignJoinCopyByLocale).length, 17);
  for (const [locale, copy] of Object.entries(campaignJoinCopyByLocale)) {
    for (const key of ['month', 'season', 'synced', 'official']) assert.ok(copy[key], `${locale}.${key}`);
    assert.doesNotMatch(copy.body('TestVenue', 'TESTCODE', null), /null|undefined|%/);
    if (NEUTRAL_CTA_LOCALE_LIST.includes(locale)) assert.doesNotMatch(copy.body('TestVenue', 'TESTCODE', 40), /TESTCODE|40|%/);
    assert.ok(copy.button('TestVenue').includes('TestVenue'));
  }
});
