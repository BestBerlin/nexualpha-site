import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { officialCampaignResearchByVenue as records } from '../src/data/official-campaign-research.js';
import { campaignPeriod, officialResearchUrl, researchRoute, researchView } from '../src/data/official-campaign-model.js';
import { campaignCopyByLocale, campaignCopyKeys } from '../src/components/v3/activity/campaign-copy.js';
import { researchFieldsByLocale, researchUnknown } from '../src/components/v3/activity/research-fields-copy.js';
import { visibleOfficialUpdates } from '../src/components/official-updates/official-updates-model.js';
const now = Date.parse('2026-09-07T01:00:00Z');
const locales = ['en', 'zh-Hans', 'zh-Hant', 'es', 'pt-BR', 'fr', 'de', 'ja', 'ko', 'ar', 'tr', 'ru', 'id', 'vi', 'it', "ur", "uk"];

test('research routes resolve known catalogue slugs without activity ID collisions', () => {
  const venues = Object.keys(records).map((slug) => ({ slug }));
  for (const venue of venues) assert.deepEqual(researchRoute(`/activities/research/${venue.slug}`, venues), { name: 'research', slug: venue.slug });
  for (const path of ['/activities/research/unknown', '/activities/research/%2Fbinance', '/activities/research/binance/more', '/activities/research/']) assert.deepEqual(researchRoute(path, venues), { name: 'notFound' });
  assert.equal(researchRoute('/activities/an-approved-id', venues), null);
  assert.equal(researchRoute('/activities', venues), null);
});

test('all 21 platform records retain 33 official sources and separate source check times', () => {
  assert.equal(Object.keys(records).length, 21);
  const sources = Object.values(records).flatMap((record) => record.sources);
  assert.equal(sources.length, 33);
  assert.equal(sources.filter((source) => source.access === 'READ').length, 31);
  for (const record of Object.values(records)) {
    const view = researchView(record, 'en', now);
    assert.equal(view.sources.length, record.sources.length, record.venueSlug);
    assert.equal(view.humanApproved, false);
    assert.equal(view.commercialAction, null);
    assert.equal(view.signupReward.amount, record.signupReward.amount);
    if (view.signupReward.amount !== null) { assert.equal(view.signupReward.kind, 'fee_discount'); assert.match(view.signupReward.amount, /%/); }
    assert.deepEqual(visibleOfficialUpdates([view], now), []);
    for (const source of record.sources) {
      assert.equal(officialResearchUrl(source.url, record.venueSlug), source.url);
      assert.equal(view.sources.find((candidate) => candidate.id === source.id).checkedAt, source.checkedAt);
    }
  }
});

test('future, date-only and malformed times cannot become active windows', () => {
  assert.equal(campaignPeriod({ startAt: '2026-09-01', endAt: '2026-09-20' }, now), 'INVALID');
  assert.equal(campaignPeriod({ startAt: '2026-09-01T00:00:00', endAt: '2026-09-20T00:00:00' }, now), 'INVALID');
  assert.equal(campaignPeriod({ startAt: '2026-09-08T00:00:00Z', endAt: '2026-09-09T00:00:00Z' }, now), 'UPCOMING');
  const broken = structuredClone(records.binance);
  broken.sources[0].startAt = 'bad';
  const source = researchView(broken, 'en', now).sources[0];
  assert.equal(source.startAt, null);
  assert.equal(source.period, 'INVALID');
});

test('actual dated Gate and observed-ended MEXC sources obey expiration without timezone inference', () => {
  const gate = records['gate-io'];
  const before = researchView(gate, 'en', Date.parse('2026-09-06T23:59:59Z'));
  const after = researchView(gate, 'en', Date.parse('2026-09-07T00:00:00Z'));
  assert.equal(before.sources.find((source) => source.id === 'gate-europe-august-campaign').period, 'WITHIN_DATES');
  assert.equal(after.sources.find((source) => source.id === 'gate-europe-august-campaign').period, 'ENDED');
  const historical = researchView(records.mexc, 'en', now).sources.find((source) => source.id === 'mexc-tradingpapa-ended');
  assert.equal(historical.period, 'ENDED');
  assert.equal(historical.endAt, null);
  assert.equal(historical.timeZone, null);
});

test('an official allowlist blocks unrelated, deceptive and cross-platform domains', () => {
  for (const url of ['https://binance.com.evil.test/rewards', 'https://fakebinance.com/rewards', 'https://www.okx.com/help/rewards', 'https://127.0.0.1/rewards']) assert.equal(officialResearchUrl(url, 'binance'), null);
  const forged = structuredClone(records['gate-io']);
  forged.sources = forged.sources.map((source) => ({ ...source, url: 'https://not-the-exchange.example/reward' }));
  const view = researchView(forged, 'en', now);
  assert.equal(view.sources.length, 0);
  assert.equal(view.signupReward.status, 'UNCONFIRMED');
  assert.equal(view.signupReward.amount, null);
  assert.deepEqual(view.signupReward.conditions, []);
  assert.doesNotMatch(view.signupReward.summary, /135|USDT/);
  assert.doesNotMatch(view.summary, /135|USDT/);
});

test('fresh record metadata cannot conceal a stale or inaccessible underlying source', () => {
  const record = structuredClone(records.binance);
  record.checkedAt = '2026-09-07T00:00:00Z';
  record.sources[0].checkedAt = '2026-08-01T00:00:00Z';
  const view = researchView(record, 'en', now);
  assert.equal(view.sources[0].freshness, 'NEEDS_RECHECK');
  assert.equal(view.freshness, 'NEEDS_RECHECK');
  const failed = structuredClone(records['gate-io']);
  failed.sources = failed.sources.map((source) => ({ ...source, access: 'INACCESSIBLE' }));
  const result = researchView(failed, 'en', now);
  assert.equal(result.signupReward.status, 'UNCONFIRMED');
  assert.doesNotMatch(result.signupReward.summary, /135|USDT/);
});

test('source dates without timezone remain source text, never an invented midnight', () => {
  for (const record of Object.values(records)) for (const source of record.sources.filter((source) => source.publishedDate && !source.publishedAt)) {
    const projected = researchView(record, 'en', now).sources.find((candidate) => candidate.id === source.id);
    assert.equal(projected.publishedAt, null);
    assert.equal(projected.publishedDate, source.publishedDate);
  }
});

test('DEX mechanics and voucher rewards are preserved without fabricated signup cash', () => {
  for (const slug of ['uniswap', 'curve', 'pancakeswap']) {
    const view = researchView(records[slug], 'en', now);
    assert.equal(view.signupReward.status, 'NOT_APPLICABLE', slug);
    assert.equal(view.signupReward.amount, null);
  }
  for (const slug of ['jupiter', 'raydium', 'dydx']) assert.equal(researchView(records[slug], 'en', now).signupReward.status, 'UNCONFIRMED');
  assert.equal(researchView(records['gate-io'], 'en', now).signupReward.kind, 'vouchers');
  assert.match(researchView(records.bybit, 'en', now).signupReward.summary, /not withdrawable/i);
  assert.equal(researchView(records.binance, 'en', now).evidenceRequirements.regions, null);
});

test('15 UI locales are complete and research-owned display bodies are localized with explicit source-body fallback state', () => {
  assert.deepEqual(Object.keys(campaignCopyByLocale), locales);
  assert.deepEqual(Object.keys(researchFieldsByLocale), locales);
  for (const locale of locales) {
    for (const key of campaignCopyKeys) assert.ok(campaignCopyByLocale[locale][key]?.trim(), `${locale}.${key}`);
    for (const [key, value] of Object.entries(researchFieldsByLocale[locale])) assert.ok(value.trim(), `${locale}.${key}`);
    assert.ok(researchUnknown(locale));
    const view = researchView(records.bybit, locale, now);
    assert.equal(view.contentLocale, locale);
    assert.equal(view.usedFallback, !['en', 'zh-Hans', 'zh-Hant'].includes(locale));
  }
});

test('activity source keeps the human-reviewed list separate from independent research', () => {
  const source = readFileSync(new URL('../src/components/v3/activity/ActivityCenterV3.jsx', import.meta.url), 'utf8');
  assert.match(source, /visibleOfficialUpdates\(publicUpdates, now\)/);
  assert.match(source, /aria-labelledby="activity-reviewed-title"/);
  assert.match(source, /activity-center-v3__index-drawer/);
  assert.match(source, /<OfficialResearchIndex/);
  assert.doesNotMatch(source, /publicCampaignCard|activityCards|researchCards/);
});
