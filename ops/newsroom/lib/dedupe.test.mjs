import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mergeRawItems } from './dedupe.mjs';
import { canonicalizeUrl, originKey, trigramSimilarity } from './normalization.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = async name => JSON.parse(await readFile(join(here, 'fixtures', name), 'utf8'));

test('canonical URLs strip tracking and keep stable query order', () => {
  assert.equal(canonicalizeUrl('https://example.com/path?b=2&utm_source=x&a=1#frag'), 'https://example.com/path?a=1&b=2');
  assert.equal(canonicalizeUrl('https://twitter.com/example/status/111?ref_src=twsrc'), 'https://x.com/example/status/111');
});

test('origin keys collapse syndication around the cited original', () => {
  assert.equal(originKey({ cited_original_url: 'https://twitter.com/example/status/111?utm_medium=social' }), 'x:111');
});

test('10 outlets quoting one tweet merge to one event and one independent origin', async () => {
  const data = await fixture('origin-independence.json');
  const { events } = mergeRawItems(data.items, { watchlist: data.watchlist });
  assert.equal(events.length, 1);
  assert.equal(events[0].raw_items.length, 11);
  assert.equal(events[0].discussion.independent_sources, 1);
  assert.equal(events[0].discussion.metric_total_across_platforms, null);
  assert.equal(events[0].discussion.by_platform.x.metrics_unknown, true);
  assert.equal(events[0].discussion.by_platform.media.metrics_unknown, true);
});

test('event-level clustering uses compatible entity/type/window and rejects stale copies', async () => {
  const data = await fixture('origin-independence.json');
  const stale = { ...data.items[1], id: 'stale', external_id: 'stale', published_at: '2026-10-15T10:00:00Z', url: 'https://late.example/story' };
  const { events } = mergeRawItems([...data.items.slice(0, 2), stale], { watchlist: data.watchlist });
  assert.equal(events.length, 2);
});

test('origin_item_id chains resolve to the root origin', () => {
  const items = [
    { id: 'root', source_id: 'x', platform: 'x', url: 'https://x.com/a/status/123', title: 'Binance update', published_at: '2026-10-12T10:00:00Z', subject_entity: 'binance', event_type_guess: 'withdrawal_halt' },
    { id: 'quote', origin_item_id: 'root', source_id: 'x', platform: 'x', url: 'https://x.com/b/status/456', title: 'Binance update quoted', published_at: '2026-10-12T10:01:00Z', subject_entity: 'binance', event_type_guess: 'withdrawal_halt', content_hash: 'same-origin-chain' },
    { id: 'story', origin_item_id: 'quote', source_id: 'media', platform: 'media', url: 'https://media.example/story', title: 'Binance update quoted by outlet', published_at: '2026-10-12T10:02:00Z', subject_entity: 'binance', event_type_guess: 'withdrawal_halt', content_hash: 'same-origin-chain' },
  ];
  const { events } = mergeRawItems(items);
  assert.equal(events.length, 1);
  assert.equal(events[0].discussion.independent_sources, 1);
  assert.deepEqual(events[0].evidence.map(row => row.origin_key), ['x:123', 'x:123', 'x:123']);
});

test('subject_entity participates in matching when subjects are empty', () => {
  const items = [
    { id: 'a', source_id: 'one', platform: 'media', url: 'https://one.example/a', title: 'OKX ABC listing', published_at: '2026-10-12T10:00:00Z', subject_entity: 'okx', event_type_guess: 'listing' },
    { id: 'b', source_id: 'two', platform: 'media', url: 'https://two.example/b', title: 'OKX ABC listing details', published_at: '2026-10-12T10:10:00Z', subject_entity: 'okx', event_type_guess: 'listing' },
  ];
  assert.equal(mergeRawItems(items).events.length, 1);
});

test('short aliases require token boundaries', () => {
  const items = [
    { id: 'a', source_id: 'one', platform: 'media', url: 'https://one.example/a', title: 'Exchange denies insolvency rumor', published_at: '2026-10-12T10:00:00Z', event_type_guess: 'insolvency' },
  ];
  const { events } = mergeRawItems(items, { watchlist: [{ id: 'solana', aliases: ['sol'] }] });
  assert.deepEqual(events[0].subjects, []);
});

test('candidate watchlist entities are ignored until verified active', () => {
  const items = [
    { id: 'a', source_id: 'one', platform: 'media', url: 'https://one.example/a', title: 'CandidateCoin listing', published_at: '2026-10-12T10:00:00Z', event_type_guess: 'listing' },
  ];
  const { events } = mergeRawItems(items, { watchlist: [{ id: 'candidatecoin', aliases: ['CandidateCoin'], status: 'candidate' }] });
  assert.deepEqual(events[0].subjects, []);
});

test('content_hash and near simhash duplicates attach within the 48 hour window', () => {
  const items = [
    { id: 'a', source_id: 'one', platform: 'media', url: 'https://one.example/a', title: 'Bybit listing ABC', published_at: '2026-10-12T10:00:00Z', subject_entity: 'bybit', event_type_guess: 'listing', content_hash: 'same', simhash: 0b11110000 },
    { id: 'b', source_id: 'two', platform: 'media', url: 'https://two.example/b', title: 'Different headline', published_at: '2026-10-12T10:10:00Z', subject_entity: 'bybit', event_type_guess: 'listing', content_hash: 'same' },
    { id: 'c', source_id: 'three', platform: 'media', url: 'https://three.example/c', title: 'Another headline', published_at: '2026-10-12T10:20:00Z', subject_entity: 'bybit', event_type_guess: 'listing', simhash: 0b11110001 },
  ];
  assert.equal(mergeRawItems(items).events.length, 1);
  assert.equal(mergeRawItems(items).events[0].discussion.independent_sources, 1);
});

test('int8 simhash strings cluster and collapse origin independence', () => {
  const items = [
    { id: 'a', source_id: 'one', platform: 'media', url: 'https://one.example/a', title: 'Bybit listing ABC', published_at: '2026-10-12T10:00:00Z', subject_entity: 'bybit', event_type_guess: 'listing', simhash: '9223372036854775807' },
    { id: 'b', source_id: 'two', platform: 'media', url: 'https://two.example/b', title: 'Different headline', published_at: '2026-10-12T10:10:00Z', subject_entity: 'bybit', event_type_guess: 'listing', simhash: '9223372036854775806' },
  ];
  const { events } = mergeRawItems(items);
  assert.equal(events.length, 1);
  assert.equal(events[0].discussion.independent_sources, 1);
});

test('negative int8 simhash strings compare as unsigned 64-bit values without hanging', () => {
  const items = [
    { id: 'a', source_id: 'one', platform: 'media', url: 'https://one.example/a', title: 'Bybit listing ABC', published_at: '2026-10-12T10:00:00Z', subject_entity: 'bybit', event_type_guess: 'listing', simhash: '-1' },
    { id: 'b', source_id: 'two', platform: 'media', url: 'https://two.example/b', title: 'Different headline', published_at: '2026-10-12T10:10:00Z', subject_entity: 'bybit', event_type_guess: 'listing', simhash: '18446744073709551615' },
  ];
  const { events } = mergeRawItems(items);
  assert.equal(events.length, 1);
  assert.equal(events[0].discussion.independent_sources, 1);
});


test('duplicate source_id and external_id does not repeat raw items or evidence', () => {
  const item = { id: 'a', source_id: 'one', external_id: 'same', platform: 'media', url: 'https://one.example/a', title: 'Bybit listing ABC', published_at: '2026-10-12T10:00:00Z', subject_entity: 'bybit', event_type_guess: 'listing' };
  const { events } = mergeRawItems([item, { ...item, id: 'b', title: 'Bybit listing ABC copy' }]);
  assert.equal(events.length, 1);
  assert.equal(events[0].raw_items.length, 1);
  assert.equal(events[0].evidence.length, 1);
});

test('default evidence kind does not mark generic tier-1 social as official', () => {
  const items = [
    { id: 'a', source_id: 'x', platform: 'x', tier: 1, url: 'https://x.com/a/status/1', title: 'CEO post', published_at: '2026-10-12T10:00:00Z', subject_entity: 'binance', event_type_guess: 'key_person_statement' },
    { id: 'b', source_id: 'exchange', platform: 'exchange', tier: 1, url: 'https://exchange.example/notice', title: 'Official notice', published_at: '2026-10-12T10:00:00Z', subject_entity: 'binance', event_type_guess: 'withdrawal_halt' },
  ];
  const { events } = mergeRawItems(items);
  assert.equal(events[0].evidence[0].kind, 'social_post');
  assert.equal(events[1].evidence[0].kind, 'official_notice');
});

test('onchain data defaults to market_data unless a transaction hash is explicit', () => {
  const items = [
    { id: 'a', source_id: 'defillama', platform: 'onchain', url: 'https://data.example/a', title: 'Stablecoin supply moves', published_at: '2026-10-12T10:00:00Z', subject_entity: 'usdt', event_type_guess: 'stablecoin_depeg' },
    { id: 'b', source_id: 'etherscan', platform: 'onchain', url: 'https://data.example/b', title: 'Whale tx', published_at: '2026-10-12T10:01:00Z', subject_entity: 'usdt', event_type_guess: 'whale_transfer', tx_hash: '0x' + 'a'.repeat(64) },
  ];
  const { events } = mergeRawItems(items);
  assert.equal(events[0].evidence[0].kind, 'market_data');
  assert.equal(events[1].evidence[0].kind, 'onchain_tx');
});

test('evidence excerpts are capped at 600 characters', () => {
  const longBody = 'a'.repeat(700);
  const { events } = mergeRawItems([{ id: 'a', source_id: 'one', platform: 'media', url: 'https://one.example/a', title: 'Bybit listing ABC', body_excerpt: longBody, published_at: '2026-10-12T10:00:00Z', subject_entity: 'bybit', event_type_guess: 'listing' }]);
  assert.equal(events[0].evidence[0].excerpt.length, 600);
});

test('unknown source timestamps stay null in event and evidence', () => {
  const { events } = mergeRawItems([{ id: 'a', source_id: 'one', platform: 'media', url: 'https://one.example/a', title: 'Bybit listing ABC', subject_entity: 'bybit', event_type_guess: 'listing', fetched_at: '2026-10-12T10:00:00Z' }]);
  assert.equal(events[0].source_published_at, null);
  assert.equal(events[0].evidence[0].published_at, null);
});

test('trigram similarity supports repeat-angle comparisons', () => {
  assert.ok(trigramSimilarity('What does the OKX ABC listing change for traders?', 'What OKX ABC listing changes for traders') >= 0.5);
  assert.equal(Number(trigramSimilarity('word', 'words').toFixed(6)), 0.571429);
  assert.equal(trigramSimilarity('', ''), 0);
});
test('known occurrence times control clustering independently of source publication times', () => {
  const base = { entities: ['okx'], event_type_guess: 'withdrawal_halt', title: 'OKX withdrawal halt', platform: 'exchange', tier: 1 };
  const sameOccurrence = mergeRawItems([
    { ...base, id: 801, url: 'https://example.test/a', published_at: '2026-10-12T00:00:00Z', occurred_at: '2026-10-09T00:00:00Z' },
    { ...base, id: 802, url: 'https://example.test/b', published_at: '2026-10-15T00:00:00Z', occurred_at: '2026-10-09T00:00:00Z' },
  ]);
  assert.equal(sameOccurrence.events.length, 1);
  assert.equal(sameOccurrence.events[0].source_published_at, '2026-10-12T00:00:00.000Z');
});
test('source-scoped external ids preserve distinct item assignments before database ids exist', () => {
  const base = { external_id: '1', entities: ['okx'], event_type_guess: 'listing', title: 'OKX lists ABC', published_at: '2026-10-12T00:00:00Z' };
  const result = mergeRawItems([{ ...base, source_id: 'one', url: 'https://example.test/a' }, { ...base, source_id: 'two', url: 'https://example.test/b' }]);
  assert.equal(result.assignments.size, 2);
  assert.equal(result.events[0].evidence.length, 2);
  assert.equal(result.events[0].discussion.independent_sources, 2);
});
