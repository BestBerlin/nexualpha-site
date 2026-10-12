import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mergeRawItems } from './dedupe.mjs';
import { configFromNewsroomRows, credibilityScore, notableExchangeListing, scoreEvent } from './scoring.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = async name => JSON.parse(await readFile(join(here, 'fixtures', name), 'utf8'));
const now = '2026-10-12T11:00:00Z';

test('scoring preserves unknown metrics as null and does not sum across platforms', async () => {
  const data = await fixture('origin-independence.json');
  const { events } = mergeRawItems(data.items, { watchlist: data.watchlist });
  const score = scoreEvent(events[0], {
    now,
    entitiesById: { binance: { priority: 1 } },
  });
  assert.equal(score.explain.heat.independent_sources, 1);
  assert.equal(score.explain.heat.metric_total_across_platforms, null);
  assert.deepEqual(score.explain.heat.per_platform_growth.map(row => row.metric_growth_max), [null, null]);
  assert.equal(score.credibility, 1);
  assert.equal(score.explain.credibility_separate_from_editorial_score, true);
});

test('heat keeps known zero growth distinct from unknown baseline', () => {
  const zeroGrowth = scoreEvent({
    subject_entity: 'binance',
    event_type: 'listing',
    source_published_at: now,
    discussion: {
      independent_sources: 1,
      platforms_with_independent_items: 1,
      by_platform: { x: { independent_posts: 1, metric_now: 0, baseline: 10 } },
    },
    evidence: [{ kind: 'official_notice', origin_key: 'notice:1', source_tier: 1 }],
  }, { now, entitiesById: { binance: { priority: 1 } } });
  assert.equal(zeroGrowth.explain.heat.max_platform_growth, 0);
  assert.equal(zeroGrowth.explain.heat.per_platform_growth[0].metrics_unknown, false);

  const unknownBaseline = scoreEvent({
    subject_entity: 'binance',
    event_type: 'listing',
    source_published_at: now,
    discussion: {
      independent_sources: 1,
      platforms_with_independent_items: 1,
      by_platform: { x: { independent_posts: 1, metric_now: 10, baseline: 0 } },
    },
    evidence: [{ kind: 'official_notice', origin_key: 'notice:1', source_tier: 1 }],
  }, { now, entitiesById: { binance: { priority: 1 } } });
  assert.equal(unknownBaseline.explain.heat.max_platform_growth, null);
  assert.equal(unknownBaseline.explain.heat.per_platform_growth[0].baseline_unknown, true);
});

test('heat dedupes repeated URLs from the same publisher while preserving distinct origins', () => {
  const score = scoreEvent({
    subject_entity: 'binance',
    subjects: ['binance', 'SOL'],
    event_type: 'listing',
    source_published_at: '2026-10-12T10:00:00Z',
    evidence: [
      { kind: 'media_report', origin_key: 'media:a', source_id: 'publisher-one-feed-a', url: 'https://publisher.example/a', published_at: '2026-10-12T10:00:00Z' },
      { kind: 'media_report', origin_key: 'media:b', source_id: 'publisher-one-feed-b', url: 'https://www.publisher.example/b', published_at: '2026-10-12T10:05:00Z' },
      { kind: 'media_report', origin_key: 'media:c', source_id: 'publisher-two', url: 'https://other.example/c', published_at: '2026-10-11T10:00:00Z' },
    ],
  }, { now, entitiesById: { binance: { priority: 1 } } });
  assert.equal(score.explain.heat.independent_sources, 2);
  assert.equal(score.explain.heat.independent_source_decay_applied, true);
  assert.ok(score.explain.heat.independent_sources_decayed < 2);
});


test('repeat-angle fixture gets new_info 0', async () => {
  const data = await fixture('repeat-angle.json');
  const score = scoreEvent(data.event, {
    now,
    articles: data.articles,
    entitiesById: { okx: { priority: 1 } },
  });
  assert.equal(score.new_info, 0);
  assert.equal(score.explain.new_info.reason, 'repeat_angle');
  assert.equal(score.explain.new_info.matched_slug, 'okx-abc-listing-traders');
});

test('official tier-1 withdrawal halt gets official_major without mixing credibility into score', async () => {
  const data = await fixture('official-major.json');
  const score = scoreEvent(data.event, {
    now,
    entitiesById: { binance: { priority: 1 } },
  });
  assert.equal(score.priority_override, 'official_major');
  assert.equal(score.credibility, 3);
  assert.equal(credibilityScore(data.event), 3);
  assert.equal(score.explain.credibility_separate_from_editorial_score, true);
  assert.equal(score.explain.priority_override_does_not_bypass_eligibility, true);
});

test('verified-primary notable exchange listing receives relevance and impact floors without fabricated heat', () => {
  const event = {
    subject_entity: 'bybit',
    subjects: ['bybit', 'SOL'],
    event_type: 'listing',
    title_internal: 'Bybit lists SOL spot trading',
    source_published_at: '2026-10-12T10:00:00Z',
    verification_status: 'verified-primary',
    discussion: { independent_sources: 1, platforms_with_independent_items: 1, by_platform: { exchange: { independent_posts: 1, metric_growth_max: null } } },
    fact_summary: 'Bybit lists SOL spot trading',
    evidence: [{ kind: 'official_notice', origin_key: 'notice:bybit-sol', source_id: 'bybit-announcements', source_tier: 1, source_platform: 'exchange', verified_official: true, url: 'https://announcements.bybit.com/sol-listing', title: 'Bybit lists SOL spot trading', excerpt: 'Bybit lists SOL spot trading', published_at: '2026-10-12T10:00:00Z' }],
  };
  const score = scoreEvent(event, { now, entitiesById: { bybit: { priority: 2 } } });
  assert.equal(notableExchangeListing(event), true);
  assert.equal(score.heat, 12);
  assert.equal(score.impact, 50);
  assert.equal(score.explain.notable_exchange_listing, true);
  assert.deepEqual(score.explain.notable_listing_boosts, { relevance_floor: 70, impact_floor: 50, raw_relevance: 70 });
  assert.equal(score.publish_eligible, true);
});

test('minor exchange listing without a top-200 asset does not receive notable floors', () => {
  const event = {
    subject_entity: 'small-exchange',
    subjects: ['small-exchange', 'NOTTOP'],
    event_type: 'listing',
    title_internal: 'Small Exchange lists NOTTOP',
    source_published_at: '2026-10-12T10:00:00Z',
    verification_status: 'verified-primary',
    fact_summary: 'Small Exchange lists NOTTOP',
    evidence: [{ kind: 'official_notice', origin_key: 'notice:small-nottop', source_id: 'small-exchange', source_tier: 1, source_platform: 'exchange', verified_official: true, url: 'https://small.example/nottop', title: 'Small Exchange lists NOTTOP', excerpt: 'Small Exchange lists NOTTOP', published_at: '2026-10-12T10:00:00Z' }],
  };
  const score = scoreEvent(event, { now, entitiesById: { 'small-exchange': { priority: 2 } } });
  assert.equal(notableExchangeListing(event), false);
  assert.equal(score.heat, 12);
  assert.equal(score.explain.notable_exchange_listing, false);
});

test('owner weights are configurable and included in the score snapshot', async () => {
  const data = await fixture('official-major.json');
  const score = scoreEvent(data.event, {
    now,
    config: { weights: { relevance: 20, heat: 20, timeliness: 20, new_info: 25, impact: 15 } },
    entitiesById: { binance: { priority: 1 } },
  });
  assert.deepEqual(score.weights, { relevance: 20, heat: 20, timeliness: 20, new_info: 25, impact: 15 });
  assert.equal(typeof score.editorial_score, 'number');
  assert.ok(score.explain);
});

test('newsroom_config rows use seed keys for weights and thresholds', () => {
  const config = configFromNewsroomRows([
    { key: 'weights', value: { relevance: 25, heat: 20, timeliness: 20, new_info: 20, impact: 15 } },
    { key: 'thresholds', value: { publish_editorial_score_min: 55, publish_credibility_min: 2, flash_credibility_min: 3, review_editorial_score_min: 70, review_credibility_min: 1 } },
  ]);
  assert.equal(config.thresholds.publish, 55);
  assert.equal(config.thresholds.flashCredibilityMin, 3);
  assert.equal(config.thresholds.reviewCredibilityMin, 1);
});

test('invalid weights are rejected', async () => {
  const data = await fixture('official-major.json');
  assert.throws(() => scoreEvent(data.event, { config: { weights: { relevance: 1 } } }), /weights/);
  assert.throws(() => configFromNewsroomRows([{ key: 'weights', value: { relevance: 25, heat: 20, timeliness: 20, new_info: 20, impact: 20 } }]), /total 100/);
});

test('priority override never bypasses relevance or flash credibility eligibility', async () => {
  const data = await fixture('official-major.json');
  const noChannelPolitics = { ...data.event, event_type: 'politics_market', market_channel: null };
  const noChannelScore = scoreEvent(noChannelPolitics, { now, entitiesById: { binance: { priority: 1 } } });
  assert.equal(noChannelScore.relevance, 0);
  assert.equal(noChannelScore.publish_eligible, false);

  const flashWithMediaCredibility = {
    ...data.event,
    format: 'flash',
    evidence: [
      { kind: 'media_report', origin_key: 'media:one', source_tier: 2 },
      { kind: 'media_report', origin_key: 'media:two', source_tier: 2 },
    ],
  };
  const flashScore = scoreEvent(flashWithMediaCredibility, { now, entitiesById: { binance: { priority: 1 } } });
  assert.equal(flashScore.credibility, 2);
  assert.equal(flashScore.explain.required_credibility_for_publish, 3);
  assert.equal(flashScore.publish_eligible, false);
});

test('explicitly excluded and unclassified event types are not eligible', async () => {
  const data = await fixture('official-major.json');
  for (const event_type of ['pure_politics', 'unrelated_society', 'routine_pr', 'empty_speech', 'unknown']) {
    const score = scoreEvent({ ...data.event, event_type }, { now, entitiesById: { binance: { priority: 1 } } });
    assert.equal(score.relevance, 0);
    assert.equal(score.publish_eligible, false);
  }
});

test('unknown source timestamps do not score as fresh', async () => {
  const data = await fixture('official-major.json');
  const event = { ...data.event };
  delete event.source_published_at;
  const score = scoreEvent(event, { now, entitiesById: { binance: { priority: 1 } } });
  assert.equal(score.timeliness, 10);
  assert.equal(score.explain.timeliness.unknown_source_time, true);
});

test('originless reputable media does not become independent credibility', () => {
  assert.equal(credibilityScore({
    evidence: [
      { kind: 'media_report', source_tier: 2 },
      { kind: 'media_report', source_tier: 2 },
    ],
  }), 1);
});

test('articles without subject and type metadata do not trigger repeat angle', async () => {
  const data = await fixture('repeat-angle.json');
  const score = scoreEvent(data.event, {
    now,
    articles: [{ slug: 'missing-metadata', main_question: data.articles[0].main_question, published_at: '2026-10-11T09:00:00Z' }],
    entitiesById: { okx: { priority: 1 } },
  });
  assert.equal(score.new_info, 100);
});
test('missing or unrecognized taxonomy cannot qualify on heat alone', () => {
  for (const event_type of [undefined, 'unclassified', 'sports_result']) {
    const score = scoreEvent({ event_type, impact_score: 100, source_published_at: '2026-10-12T00:00:00Z', evidence: [{ kind: 'official_notice' }] }, { now: '2026-10-12T00:30:00Z' });
    assert.equal(score.relevance, 0);
    assert.equal(score.publish_eligible, false);
  }
});
test('thresholds reject impossible credibility and similarity settings', () => {
  assert.throws(() => scoreEvent({}, { config: { thresholds: { flashCredibilityMin: 4 } } }));
  assert.throws(() => scoreEvent({}, { config: { thresholds: { repeatAngleSimilarity: 2 } } }));
});

test('ordinary words do not count as top-200 symbols and excluded events stay at relevance zero', () => {
  const event = { event_type: 'listing', verification_status: 'verified-primary', title_internal: 'Small Exchange lists NOTTOP with one new pair' };
  assert.equal(notableExchangeListing(event), false);
  const excluded = scoreEvent({ ...event, title_internal: 'Binance lists SOL', out_of_scope: true });
  assert.equal(excluded.relevance, 0);
  assert.equal(excluded.publish_eligible, false);
});
