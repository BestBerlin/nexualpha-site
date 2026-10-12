import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mergeRawItems } from './dedupe.mjs';
import { canonicalizeUrl, originKey, trigramSimilarity } from './normalization.mjs';
import { relevanceForItem } from './relevance.mjs';
import { parseFeed } from '../collectors/feeds.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = async name => JSON.parse(await readFile(join(here, 'fixtures', name), 'utf8'));
const collectorFixture = async name => readFile(join(here, '../collectors/fixtures', name), 'utf8');

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
  const { events, irrelevantItems } = mergeRawItems(items, { watchlist: [{ id: 'solana', aliases: ['sol'] }] });
  assert.equal(events.length, 0);
  assert.equal(irrelevantItems.length, 1);
});

test('candidate watchlist entities are ignored until verified active', () => {
  const items = [
    { id: 'a', source_id: 'one', platform: 'media', url: 'https://one.example/a', title: 'CandidateCoin listing', published_at: '2026-10-12T10:00:00Z', event_type_guess: 'listing' },
  ];
  const { events, irrelevantItems } = mergeRawItems(items, { watchlist: [{ id: 'candidatecoin', aliases: ['CandidateCoin'], status: 'candidate' }] });
  assert.equal(events.length, 0);
  assert.equal(irrelevantItems.length, 1);
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
  assert.equal(result.events[0].discussion.independent_sources, 1);
});

test('relevance gate rejects generic regulator enforcement without crypto context', () => {
  const sec = { id: 'sec', kind: 'regulator', display_name: { en: 'SEC' }, aliases: ['U.S. Securities and Exchange Commission'], status: 'active' };
  const irrelevant = { id: 901, source_id: 'sec-litigation', platform: 'regulator', url: 'https://www.sec.gov/litigation/1', title: 'SEC charges adviser with disclosure failures', body_excerpt: 'The Commission filed a complaint.', published_at: '2026-10-12T10:00:00Z', event_type_guess: 'enforcement' };
  const relevant = { ...irrelevant, id: 902, title: 'SEC charges crypto exchange over token sales' };
  assert.equal(relevanceForItem(irrelevant, { watchlist: [sec], keywords: [{ term: 'enforcement', event_type: 'enforcement', status: 'active' }] }).relevant, false);
  assert.equal(relevanceForItem(relevant, { watchlist: [sec], keywords: [{ term: 'crypto exchange', event_type: 'enforcement', status: 'active' }] }).relevant, true);
  const merged = mergeRawItems([irrelevant, relevant], { watchlist: [sec], keywords: [{ term: 'crypto exchange', event_type: 'enforcement', status: 'active' }] });
  assert.equal(merged.events.length, 1);
  assert.equal(merged.irrelevantItems.length, 1);
});

test('recorded SEC regulator feed rows stay irrelevant without crypto context', async () => {
  const sec = { id: 'sec', kind: 'regulator', display_name: { en: 'SEC' }, aliases: ['Securities and Exchange Commission'], status: 'active' };
  const rows = parseFeed(await collectorFixture('recorded/sec.xml')).map((row, index) => ({
    ...row,
    id: 980 + index,
    source_id: 'sec-press',
    platform: 'regulator',
    tier: 1,
    event_type_guess: 'enforcement',
  }));
  const result = mergeRawItems(rows, { watchlist: [sec], keywords: [{ term: 'enforcement', event_type: 'enforcement', status: 'active' }] });
  assert.equal(rows.length, 2);
  assert.equal(result.events.length, 0);
  assert.deepEqual(result.irrelevantItems.map(item => item.id).sort(), [980, 981]);
});

test('relevance gate rejects out-of-scope EDGAR structured-note forms', () => {
  const structuredNote = { id: 990, source_id: 'sec-edgar-full-text', platform: 'edgar', title: '497K Bitcoin structured notes update', body_excerpt: 'bitcoin buffered structured notes', published_at: '2026-10-12T10:00:00Z', event_type_guess: 'crypto_treasury_company', metrics: { form: '497K' } };
  const holdings = { ...structuredNote, id: 991, title: '13F-HR Bitcoin treasury fund holdings', metrics: { form: '13F-HR' } };
  assert.equal(relevanceForItem(structuredNote).relevant, false);
  assert.equal(relevanceForItem(holdings).relevant, true);
  const merged = mergeRawItems([structuredNote, holdings]);
  assert.equal(merged.events.length, 1);
  assert.deepEqual(merged.irrelevantItems.map(item => item.id), [990]);
});

test('EDGAR relevance requires explicit allowed form and crypto or legal company scope', () => {
  const allowedButUnrelated = { id: 992, source_id: 'sec-edgar-full-text', platform: 'edgar', title: '10-Q Industrial issuer earnings rise as oil revenue jumps', body_excerpt: 'Oil revenue increased 8% and dollar costs fell.', published_at: '2026-10-12T10:00:00Z', metrics: { form: '10-Q' } };
  const disallowedAuthoritativeForm = { id: 993, source_id: 'sec-edgar-full-text', platform: 'edgar', title: '424B2 Bitcoin note filed under 8-K root', body_excerpt: 'bitcoin structured note', published_at: '2026-10-12T10:00:00Z', metrics: { form: '424B2' } };
  const watchlistCompany = { ...allowedButUnrelated, id: 994, title: '10-Q Example Bitcoin Treasury earnings', body_excerpt: 'Quarterly filing update.', metrics: { form: '10-Q', cik: '320193' } };
  assert.equal(relevanceForItem(allowedButUnrelated).relevant, false);
  assert.equal(relevanceForItem(disallowedAuthoritativeForm).relevant, false);
  assert.equal(relevanceForItem(watchlistCompany).relevant, true);
  const merged = mergeRawItems([allowedButUnrelated, disallowedAuthoritativeForm, watchlistCompany]);
  assert.equal(merged.events.length, 1);
  assert.deepEqual(merged.irrelevantItems.map(item => item.id).sort(), [992, 993]);
});

test('coin universe accepts explicit three-letter uppercase symbols without generic collisions', () => {
  assert.equal(relevanceForItem({ title: 'SUI jumps 12% after exchange listing' }, { coinUniverse: [{ id: 'sui', name: 'Sui', symbol: 'SUI' }] }).relevant, true);
  assert.equal(relevanceForItem({ title: 'ONE analyst opens new coverage' }, { coinUniverse: [{ id: 'harmony', name: 'Harmony', symbol: 'ONE' }] }).relevant, false);
  assert.equal(relevanceForItem({ title: 'KuCoin lists ABC with USDT trading pair' }).relevant, true);
});

test('owner cross-asset moves infer event type and market channel without a collector guess', () => {
  const oil = { id: 905, source_id: 'macro-wire', platform: 'media', url: 'https://macro.example/oil', title: 'Oil prices surge 8% as USD yields jump', published_at: '2026-10-12T10:00:00Z' };
  const speech = { id: 906, source_id: 'macro-wire', platform: 'media', url: 'https://macro.example/fed', title: 'Fed official gives routine speech on supervision', published_at: '2026-10-12T10:01:00Z' };
  const gold = { id: 907, source_id: 'macro-wire', platform: 'media', url: 'https://macro.example/gold', title: 'Gold breaks record high as dollar falls', published_at: '2026-10-12T10:02:00Z' };
  const oilRelevance = relevanceForItem(oil);
  assert.equal(oilRelevance.relevant, true);
  assert.equal(oilRelevance.inferred_event_type, 'fx_macro');
  assert.equal(oilRelevance.inferred_market_channel, 'oil');
  assert.equal(relevanceForItem(speech).relevant, false);
  const { events, irrelevantItems } = mergeRawItems([oil, speech, gold]);
  assert.equal(events.length, 2);
  assert.equal(irrelevantItems.length, 1);
  assert.deepEqual(events.map(event => event.event_type), ['fx_macro', 'fx_macro']);
  assert.deepEqual(events.map(event => event.discussion.market_channel), ['oil', 'gold']);
});

test('nexualpha official exchange mirror shares origin with official source and does not add independence', () => {
  const items = [
    { id: 911, source_id: 'bybit-announcements', platform: 'exchange', tier: 1, url: 'https://announcements.bybit.com/en-US/article/bybit-to-delist-abc--art1/', title: 'Bybit Will Delist ABC Trading Pairs', body_excerpt: 'delisting', published_at: '2026-10-12T10:00:00Z', event_type_guess: 'delisting' },
    { id: 912, source_id: 'nexualpha-official-announcements', platform: 'exchange', tier: 1, url: 'https://announcements.bybit.com/en-US/article/bybit-to-delist-abc--art1/', title: 'Bybit Will Delist ABC Trading Pairs', body_excerpt: 'delisting', published_at: '2026-10-12T10:01:00Z', event_type_guess: 'delisting', metrics: { venue: 'Bybit', source_type: 'mirror' } },
  ];
  const { events } = mergeRawItems(items);
  assert.equal(events.length, 1);
  assert.equal(events[0].raw_items.length, 2);
  assert.equal(events[0].discussion.independent_sources, 1);
  assert.deepEqual(events[0].evidence.map(row => row.origin_key), ['exchange-action:bybit:ABC:delisting:2026-10-12', 'exchange-action:bybit:ABC:delisting:2026-10-12']);
});

test('exchange mirror first still leaves the exchange source independent', () => {
  const mirror = { id: 921, source_id: 'nexualpha-official-announcements', platform: 'exchange', tier: 1, url: 'https://announcements.bybit.com/en-US/article/bybit-to-delist-abc--art1/', title: 'Bybit Will Delist ABC Trading Pairs', body_excerpt: 'delisting', published_at: '2026-10-12T10:00:00Z', event_type_guess: 'delisting', metrics: { venue: 'Bybit', source_type: 'mirror' } };
  const official = { ...mirror, id: 922, source_id: 'bybit-announcements', published_at: '2026-10-12T10:01:00Z', metrics: null };
  const { events } = mergeRawItems([mirror, official]);
  assert.equal(events.length, 1);
  assert.equal(events[0].discussion.independent_sources, 1);
  assert.deepEqual(events[0].evidence.map(row => row.is_independent), [false, true]);
});

test('standalone mirrors do not create independent source heat', () => {
  const { events } = mergeRawItems([
    { id: 931, source_id: 'nexualpha-official-announcements', platform: 'exchange', tier: 1, url: 'https://announcements.bybit.com/en-US/article/bybit-to-delist-abc--art1/', title: 'Bybit Will Delist ABC Trading Pairs', body_excerpt: 'delisting', published_at: '2026-10-12T10:00:00Z', event_type_guess: 'delisting', metrics: { venue: 'Bybit', source_type: 'mirror' } },
  ]);
  assert.equal(events.length, 1);
  assert.equal(events[0].discussion.independent_sources, 0);
  assert.equal(events[0].evidence[0].is_independent, false);
});

test('listing and delisting clustering keeps different symbols and dates apart', () => {
  const base = { source_id: 'bybit-announcements', platform: 'exchange', tier: 1, event_type_guess: 'delisting' };
  const { events } = mergeRawItems([
    { ...base, id: 941, url: 'https://announcements.bybit.com/a', title: 'Bybit Will Delist ABC Trading Pairs', published_at: '2026-10-12T10:00:00Z' },
    { ...base, id: 942, url: 'https://announcements.bybit.com/b', title: 'Bybit Will Delist XYZ Trading Pairs', published_at: '2026-10-12T10:05:00Z' },
    { ...base, id: 943, url: 'https://announcements.bybit.com/c', title: 'Bybit Will Delist ABC Trading Pairs', published_at: '2026-10-15T10:00:00Z' },
  ], { watchlist: [{ id: 'bybit', kind: 'exchange', display_name: { en: 'Bybit' }, status: 'active' }] });
  assert.equal(events.length, 3);
});

test('generic listing headlines do not invent a symbol hard key', () => {
  const { events } = mergeRawItems([
    { id: 951, source_id: 'bybit-announcements', platform: 'exchange', tier: 1, url: 'https://announcements.bybit.com/a', title: 'Bybit Lists New Trading Pairs', published_at: '2026-10-12T10:00:00Z', event_type_guess: 'listing' },
  ]);
  assert.deepEqual(events[0].hard_keys, []);
});

test('media reports of one story without a watchlist entity cluster on shared amount and distinctive words', () => {
  const base = { platform: 'media', tier: 2, lang: 'en', body_excerpt: 'Crypto industry report.' };
  const items = [
    { ...base, id: 9101, source_id: 'decrypt', url: 'https://decrypt.co/a', title: 'New York AG secures up to $35 million from former Celsius CEO Alex Mashinsky', published_at: '2026-10-12T10:00:00Z', fetched_at: '2026-10-12T10:05:00Z' },
    { ...base, id: 9102, source_id: 'theblock', url: 'https://www.theblock.co/b', title: 'New York permanently bars Celsius founder Mashinsky in $35M fraud settlement', event_type_guess: 'lawsuit', published_at: '2026-10-12T12:00:00Z', fetched_at: '2026-10-12T12:05:00Z' },
    { ...base, id: 9103, source_id: 'cointelegraph', url: 'https://cointelegraph.com/c', title: 'Ledger Probes Potential Theft of $87M in User Funds Tied to Crypto Wallet Reseller', published_at: '2026-10-12T12:00:00Z', fetched_at: '2026-10-12T12:05:00Z' },
    { ...base, id: 9104, source_id: 'theblock', url: 'https://www.theblock.co/d', title: 'Ledger investigates wallet drains involving CryptoBilis buyers; estimate tops $86 million in losses', published_at: '2026-10-12T12:30:00Z', fetched_at: '2026-10-12T12:35:00Z' },
  ];
  const { events } = mergeRawItems(items, { watchlist: [], keywords: [{ term: 'crypto', lang: 'en', status: 'active' }, { term: 'Celsius', lang: 'en', status: 'active' }, { term: 'Ledger', lang: 'en', status: 'active' }] });
  const celsius = events.find(event => event.raw_items.some(item => item.id === 9101));
  assert.deepEqual(celsius.raw_items.map(item => item.id).sort(), [9101, 9102]);
  assert.equal(celsius.discussion.merge_provenance.at(-1).method, 'narrative_facts');
  // Different reported amounts stay separate until a human or a primary source reconciles them.
  assert.notEqual(events.find(event => event.raw_items.some(item => item.id === 9103)), events.find(event => event.raw_items.some(item => item.id === 9104)));
});
