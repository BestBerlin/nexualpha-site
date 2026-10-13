import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { claimQualityState, claimMarketNoiseEligibilitySql, claimFreshnessEligibilitySql } from './claim-quality.mjs';
import { independentEvidenceRows, publisherIdentity } from './evidence-quality.mjs';
import { countIndependentSources } from './dedupe.mjs';
import { credibilityScore, scoreEvent } from './scoring.mjs';
import { verifyEvent } from './verification.mjs';
import { claimQuery } from '../writer/queries.mjs';

const shadow = JSON.parse(readFileSync(new URL('./fixtures/shadow-1110.json', import.meta.url)));
const now = shadow.plan.generated_at;
const eventFor = id => {
  const event = structuredClone(shadow.plan.events.find(row => row.id === id));
  event.source_published_at = event.evidence[0].published_at;
  return event;
};

test('recorded fx_macro BTC headline fails magnitude and six-hour freshness gates', () => {
  const event = eventFor(2598);
  const state = claimQualityState(event, { now });
  assert.equal(state.claimable, false);
  assert.equal(state.freshness.freshness_hours, 6);
  assert.equal(state.freshness.claimable, false);
  assert.equal(state.market_noise.reason, 'below_price_move_threshold');
  const important = { ...event, subjects: ['BTC'], discussion: { price_move_pct_1h: -3.2 } };
  assert.equal(claimQualityState(important, { now }).claimable, false);
  important.source_published_at = now;
  assert.equal(claimQualityState(important, { now }).claimable, true);
  important.discussion = { price_move_pct_24h: -5 };
  assert.equal(claimQualityState(important, { now }).claimable, false);
  important.event_type = 'market_headline';
  assert.equal(claimQualityState(important, { now }).claimable, false);
});

test('recorded wealth-transfer forecast needs a verified and dated hard retail action', () => {
  const event = { ...eventFor(2831), source_published_at: now, subjects: ['ETH'], discussion: { price_move_pct_1h: 5 } };
  assert.equal(claimQualityState(event, { now }).market_noise.reason, 'opinion_without_hard_retail_action');
  event.retail_can_act_this_week = true;
  assert.equal(claimQualityState(event, { now }).claimable, false);
  event.story_action = 'delisting';
  event.deadline_at = '2026-10-14T00:00:00Z';
  assert.equal(claimQualityState(event, { now }).claimable, false);
  event.verification_status = 'verified-primary';
  assert.equal(claimQualityState(event, { now }).claimable, true);
});

test('SQL gates cover fx_macro forecasts, freshness, active leases, cadence and claim batches', () => {
  const sql = claimMarketNoiseEligibilitySql();
  assert.match(sql, /e\.event_type IN \('price_move','fx_macro','market_headline'\)/);
  assert.match(sql, /concat_ws\(' ', e\.title_internal, e\.fact_summary\) ~\*/);
  assert.match(sql, /active_market\.event_type IN \('liquidation_wave','price_move','fx_macro','market_headline'\)/);
  assert.match(sql, /recent_event\.event_type IN \('liquidation_wave','price_move','fx_macro','market_headline'\)/);
  assert.match(claimFreshnessEligibilitySql(), /WHEN e\.event_type IN \('fx_macro','market_headline'\) THEN 6 END/);
  assert.match(claimQuery(4, 'shadow-test'), /story_heads\.event_type IN \('liquidation_wave','price_move','fx_macro','market_headline'\)/);
});

test('recorded WuBlockchain feeds count as one outlet even with different URLs and origin keys', () => {
  const recorded = eventFor(3921).evidence;
  assert.equal(countIndependentSources(recorded.slice(0, 2)), 1);
  assert.equal(countIndependentSources(recorded), 3);
  const wu = recorded.slice(0, 2).map((row, index) => ({
    ...row, is_independent: true, kind: 'media_report', source_platform: 'media',
    url: index ? 'https://wublockchain.com/another-story' : row.url,
    origin_key: `distinct:${index}`,
  }));
  assert.equal(publisherIdentity(wu[0]), publisherIdentity(wu[1]));
  assert.equal(independentEvidenceRows(wu).length, 1);
  assert.equal(countIndependentSources(wu), 1);
  assert.equal(credibilityScore({ evidence: wu }), 1);
  assert.equal(scoreEvent({ ...eventFor(3921), evidence: wu }, { now }).explain.heat.independent_sources, 1);
  // Use captured identical excerpts so the test isolates outlet independence.
  const matching = { title_internal: wu[0].excerpt, fact_summary: wu[0].excerpt, evidence: wu };
  assert.equal(verifyEvent(matching), 'unverified');
  matching.evidence.push({ ...wu[0], source_id: 'panews-rss', url: 'https://panewslab.com/en/story', origin_key: 'distinct:panews' });
  assert.equal(verifyEvent(matching), 'corroborated');
  assert.notEqual(publisherIdentity({ url: 'https://t.me/outlet_a/1' }), publisherIdentity({ url: 'https://t.me/outlet_b/1' }));
  assert.equal(publisherIdentity({ source_id: 'extra-feed' }, { extra: { sourceIds: ['extra-feed'] } }), 'outlet:extra');
});
