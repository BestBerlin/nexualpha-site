import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  claimFreshnessEligibilitySql,
  claimFreshnessRankSql,
  claimFreshnessState,
  claimMarketNoiseEligibilitySql,
  claimQualityState,
  marketNoiseState,
  normalizeClaimQualityConfig,
} from './claim-quality.mjs';

const now = '2026-10-13T12:00:00Z';

test('freshness state rejects stale, future, and passed-deadline events unless a major follow-up exists', () => {
  assert.equal(claimFreshnessState({ event_type: 'listing', source_published_at: '2026-10-12T12:00:00Z' }, { now }).claimable, true);
  assert.equal(claimFreshnessState({ event_type: 'listing', first_seen_at: '2026-10-13T11:00:00Z' }, { now }).claimable, false);
  assert.equal(claimFreshnessState({ event_type: 'listing', source_published_at: '2026-10-10T11:59:00Z' }, { now }).claimable, false);
  assert.equal(claimFreshnessState({ event_type: 'listing', source_published_at: '2026-10-13T13:00:00Z' }, { now }).claimable, false);
  assert.equal(claimFreshnessState({ event_type: 'delisting', source_published_at: '2026-10-13T10:00:00Z', deadline_at: '2026-10-13T11:00:00Z' }, { now }).claimable, false);
  assert.equal(claimFreshnessState({ event_type: 'delisting', source_published_at: '2026-10-13T10:00:00Z', deadline_at: '2026-10-13T11:00:00Z', major_followup_at: '2026-10-13T11:10:00Z' }, { now }).claimable, true);
  assert.equal(claimFreshnessState({ event_type: 'delisting', source_published_at: '2026-10-13T10:00:00Z', effective_at: '2026-10-13T11:00:00Z', deadline_at: '2026-10-14T00:00:00Z' }, { now }).claimable, false);
  assert.equal(claimFreshnessState({ event_type: 'delisting', source_published_at: '2026-10-13T10:00:00Z', effective_at: '2026-10-13T11:00:00Z', deadline_at: '2026-10-14T00:00:00Z', major_followup_at: '2026-10-13T13:00:00Z' }, { now }).claimable, false);
  assert.equal(claimFreshnessState({ event_type: 'delisting', source_published_at: '2026-10-13T10:00:00Z', effective_at: '2026-10-13T11:00:00Z', major_followup_at: '2026-10-12T11:30:00Z' }, { now }).claimable, false);
});

test('market noise only qualifies at flash important thresholds and respects six-hour cadence', () => {
  assert.equal(marketNoiseState({ event_type: 'liquidation_wave', discussion: { metrics: { total_liquidations_usd: 70_000_000, provenance: { window: 'h24' } } } }, { now }).claimable, false);
  assert.equal(marketNoiseState({ event_type: 'liquidation_wave', discussion: { metrics: { total_liquidations_usd: 70_000_000, provenance: { window: 'h1' } } } }, { now }).claimable, true);
  assert.equal(marketNoiseState({ event_type: 'price_move', subjects: ['BTC'], discussion: { price_move_pct_1h: -3.2 } }, { now }).claimable, true);
  assert.equal(marketNoiseState({ event_type: 'price_move', subjects: ['SOL'], discussion: { price_move_pct_1h: 8 } }, { now }).claimable, false);
  assert.equal(marketNoiseState({ event_type: 'price_move', subjects: ['ETH'], discussion: { price_move_pct_1h: 3.5 }, last_market_story_at: '2026-10-13T08:00:00Z' }, { now }).reason, 'market_story_cadence');
});

test('claim quality combines freshness and market-noise gates', () => {
  assert.equal(claimQualityState({
    event_type: 'price_move',
    subjects: ['ETH'],
    source_published_at: '2026-10-13T10:00:00Z',
    discussion: { price_move_pct_1h: 3.1 },
  }, { now }).claimable, true);
  assert.equal(claimQualityState({
    event_type: 'price_move',
    subjects: ['ETH'],
    source_published_at: '2026-10-13T04:00:00Z',
    discussion: { price_move_pct_1h: 3.1 },
  }, { now }).claimable, false);
});

test('claim-quality config normalizes snake and camel case with validation', () => {
  const config = normalizeClaimQualityConfig({
    default_freshness_hours: 36,
    freshness_hours_by_type: { listing: 24 },
    story_window_days: 5,
    market_story_cadence_hours: 4,
    liquidation_usd_1h_min: 75_000_000,
    major_coin_price_move_pct_1h_min: 4,
  });
  assert.equal(config.defaultFreshnessHours, 36);
  assert.equal(config.freshnessHoursByType.listing, 24);
  assert.equal(config.storyWindowDays, 5);
  assert.equal(config.marketStoryCadenceHours, 4);
  assert.equal(config.liquidationUsd1hMin, 75_000_000);
  assert.equal(config.majorCoinPriceMovePct1hMin, 4);
  assert.throws(() => normalizeClaimQualityConfig({ freshness_hours_by_type: { listing: 0 } }), /invalid freshness/);
  assert.throws(() => normalizeClaimQualityConfig({ default_freshness_hours: 12.5 }), /invalid claim quality/);
});

test('claim quality SQL exposes configurable freshness, deadline, rank, and market noise gates', () => {
  assert.match(claimFreshnessEligibilitySql(), /freshness_hours_by_type/);
  assert.match(claimFreshnessEligibilitySql(), /deadline_at/);
  assert.match(claimFreshnessEligibilitySql(), /major_followup_at/);
  assert.match(claimFreshnessEligibilitySql(), /SELECT min\(cutoff_at\)/);
  assert.match(claimFreshnessEligibilitySql(), /CASE WHEN e\.event_type IN \('liquidation_wave','price_move'\) THEN 6 ELSE 48 END/);
  assert.doesNotMatch(claimFreshnessEligibilitySql(), /first_seen_at/);
  assert.match(claimFreshnessRankSql(), /editorial_score \* greatest/);
  assert.match(claimMarketNoiseEligibilitySql(), /liquidation_usd_1h_min/);
  assert.match(claimMarketNoiseEligibilitySql(), /market_story_cadence_hours/);
  assert.match(claimMarketNoiseEligibilitySql(), /active_market\.state='claimed'/);
  assert.match(claimMarketNoiseEligibilitySql(), /major_coin_price_move_pct_1h_min/);
});
