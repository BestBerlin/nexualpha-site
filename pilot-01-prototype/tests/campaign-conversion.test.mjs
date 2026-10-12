import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";
import { updateHref } from "../src/data/activity-update.js";
import { monthCampaigns, isStartOfMonth } from "../src/components/v3/activity/campaign-month.js";
let harness, CampaignJoin;
test.before(async () => { harness = await createSsrHarness(); ({ CampaignJoin } = await harness.vite.ssrLoadModule('/src/components/v3/activity/CampaignJoin.jsx')); });
test.after(async () => { await harness?.close(); });
const render = props => renderToStaticMarkup(React.createElement(CampaignJoin, props));
test('join blocks use gated routes, omit unknown rebates, and keep neutral locales', () => {
  const en = render({ venue: 'okx', locale: 'en' });
  assert.match(en, /data-cta-placement="activities-live-campaign"/);
  assert.match(en, /code .* included/);
  assert.match(en, /40%/);
  assert.match(en, /Partner link, commission disclosed/);
  assert.match(render({ venue: 'okx', locale: 'zh-Hans' }), /参加条件/);
  assert.doesNotMatch(render({ venue: 'bybit', locale: 'en' }), /fees back/);
  for (const locale of ['ru', 'ar', 'zh-Hant', 'ur', 'uk', 'zh-TW', 'zh-HK', 'ru-RU', 'ar-SA']) assert.doesNotMatch(render({ venue: 'okx', locale }), /data-cta-code=|40%/);
  for (const venue of ['kraken', 'kucoin', 'okx']) {
    const html = render({ venue, locale: 'en', market: 'JP', officialUrl: 'https://www.okx.com/help/example' });
    assert.doesNotMatch(html, /data-cta-kind="registration"/);
    assert.match(html, /Open official campaign page/);
  }
});
test('monthly strip caps six events newest first and respects timezone boundaries', () => {
  const now = Date.parse('2026-10-01T00:00:00Z');
  const event = { category: 'event', publishedAt: '2026-09-30T20:00:00Z' };
  assert.equal(monthCampaigns([event], 'en', now).length, 0);
  assert.equal(monthCampaigns([event], 'zh-Hans', now).length, 1);
  assert.equal(isStartOfMonth('en', Date.parse('2026-10-07T20:00:00Z')), true);
  assert.equal(isStartOfMonth('zh-Hans', Date.parse('2026-10-07T20:00:00Z')), false);
  const items = Array.from({length: 10}, (_, i) => ({ category: 'event', id: i, publishedAt: `2026-10-${String(i+1).padStart(2,'0')}T00:00:00Z` }));
  assert.deepEqual(monthCampaigns([...items, {category:'listing',publishedAt:'2026-10-11T00:00:00Z'}], 'en', Date.parse('2026-10-12T00:00:00Z')).map(i=>i.id), [9,8,7,6,5,4]);
});
test('live campaign cards and monthly strip preserve official facts and explicit market gates', async () => {
  const { LiveCampaigns } = await harness.vite.ssrLoadModule('/src/components/v3/activity/LiveCampaigns.jsx');
  const initialFeed = { items: [{ id: 'okx:test', venue: 'okx', category: 'event', title: 'Official campaign title', url: 'https://www.okx.com/help/test', publishedAt: new Date().toISOString() }] };
  const html = renderToStaticMarkup(React.createElement(LiveCampaigns, { locale: 'en', market: 'JP', initialFeed }));
  assert.ok(html.includes(updateHref(initialFeed.items[0], 'en', { market: 'JP' })), 'detail links preserve the blocked market');
  assert.match(html, /This month/);
  assert.match(html, /Official campaign title/);
  assert.match(html, /href="\/activities\/updates\/okx\//);
  assert.doesNotMatch(html, /href="https:\/\/www.okx.com\/help\/test"/);
  assert.doesNotMatch(html, /data-cta-kind="registration"/);
  const allowed = renderToStaticMarkup(React.createElement(LiveCampaigns, { locale: 'en', initialFeed }));
  assert.match(allowed, /data-cta-placement="activities-month-campaign"/);
  assert.match(allowed, /data-cta-placement="activities-live-campaign"/);
});
test('campaign copy is complete in every locale and unknown shares never create fee claims', async () => {
  const { campaignJoinCopyByLocale } = await import('../src/components/v3/activity/campaign-join-copy.js');
  assert.equal(Object.keys(campaignJoinCopyByLocale).length, 17);
  for (const [locale, copy] of Object.entries(campaignJoinCopyByLocale)) {
    for (const key of ['month', 'season', 'synced', 'official']) assert.ok(copy[key], `${locale}.${key}`);
    assert.doesNotMatch(copy.body('TestVenue', 'TESTCODE', null), /null|undefined|%/);
    if (['ru', 'ar', 'zh-Hant', 'ur', 'uk'].includes(locale)) assert.doesNotMatch(copy.body('TestVenue', 'TESTCODE', 40), /TESTCODE|40|%/);
    assert.ok(copy.button('TestVenue').includes('TestVenue'));
  }
});
