import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDedupeSql, buildScoreSql, exportTopQuery, runDedupe, runScore, statusQuery } from './pipeline.mjs';
import { mergeRawItems } from './dedupe.mjs';

const watchlist = [{ id: 'okx', kind: 'exchange', display_name: { en: 'OKX' }, aliases: [], priority: 1, status: 'active' }];
const item = (id, title, extra = {}) => ({ id, source_id: 'okx-announcements', external_id: `x${id}`, url: `https://www.okx.com/help/${id}`, title, platform: 'exchange', tier: 1, published_at: '2026-10-12T10:00:00Z', fetched_at: '2026-10-12T10:01:00Z', entities: [], ...extra });

test('dedupe SQL creates one event per watchlist story, assigns items and skips unmatched noise', () => {
  const items = [item(1, 'OKX suspends withdrawals for maintenance', { event_type_guess: 'withdrawal_halt' }), item(2, 'Random sports headline', { source_id: 'google-trends-us', platform: 'google_trends', tier: 2 })];
  const merged = mergeRawItems(items, { watchlist });
  const { sql, stats } = buildDedupeSql(merged, [1, 2]);
  assert.equal(stats.created, 1);
  assert.equal(stats.assigned, 1);
  assert.equal(stats.skipped_items, 1);
  assert.match(sql, /^BEGIN;/);
  assert.match(sql, /INSERT INTO events/);
  assert.match(sql, /INSERT INTO event_evidence/);
  assert.match(sql, /UPDATE raw_items SET event_id=\(SELECT id FROM target\), state='processed' WHERE id IN \(1\) AND event_id IS NULL/);
  assert.doesNotMatch(sql, /Random sports/);
});

test('dedupe attaches new items to an existing event with UPDATE instead of INSERT', () => {
  const existing = [{ id: 7, subject_entity: 'okx', subjects: ['okx'], event_type: 'withdrawal_halt', title_internal: 'OKX suspends withdrawals for maintenance', source_published_at: '2026-10-12T10:00:00Z', original_links: ['https://www.okx.com/help/1'], evidence: [{ raw_item_id: 1, url: 'https://www.okx.com/help/1', kind: 'official_notice', origin_key: 'url:https://www.okx.com/help/1', source_platform: 'exchange', source_tier: 1 }], raw_items: [{ id: 1, published_at: '2026-10-12T10:00:00Z' }] }];
  const merged = mergeRawItems([item(3, "OKX suspends withdrawals for maintenance, users' funds safe", { url: 'https://www.okx.com/help/1', event_type_guess: 'withdrawal_halt' })], { watchlist, existingEvents: existing });
  const { sql, stats } = buildDedupeSql(merged, [3]);
  assert.equal(stats.updated, 1);
  assert.match(sql, /UPDATE events SET .* WHERE id=7 RETURNING id/s);
  assert.ok(sql.includes("users'' funds"));
});

test('dedupe SQL persists story asset/action keys and explicit delisting deadlines', () => {
  const items = [
    { ...item(11, 'Bybit Will Delist STG Trading Pairs on 2026-10-14'), source_id: 'bybit-announcements', url: 'https://announcements.bybit.com/stg', body_excerpt: 'Project review happened on 2026-10-12. Bybit will delist STGUSDT spot trading pair at 2026-10-14 08:00 UTC.', event_type_guess: 'delisting' },
    { ...item(12, 'KuCoin Will Delist STG on 2026-10-15'), source_id: 'kucoin-announcements', url: 'https://www.kucoin.com/announcement/stg', body_excerpt: 'KuCoin will delist STG at 8:00 on October 15, 2026 (UTC).', event_type_guess: 'delisting' },
  ];
  const merged = mergeRawItems(items, { watchlist: [
    { id: 'bybit', kind: 'exchange', display_name: { en: 'Bybit' }, aliases: [], status: 'active' },
    { id: 'kucoin', kind: 'exchange', display_name: { en: 'KuCoin' }, aliases: [], status: 'active' },
  ] });
  assert.equal(merged.events.length, 2);
  const { sql } = buildDedupeSql(merged, [11, 12]);
  assert.match(sql, /story_asset/);
  assert.match(sql, /'STG'/);
  assert.match(sql, /'delisting'/);
  assert.match(sql, /'delisting:stg'/);
  assert.match(sql, /'2026-10-14T08:00:00Z'::timestamptz/);
  assert.doesNotMatch(sql, /deadline_at='2026-10-12T/);
  assert.match(sql, /'2026-10-15T08:00:00Z'::timestamptz/);
  assert.match(sql, /story_venues/);
  assert.match(sql, /\[\"bybit\"\]/);
  assert.match(sql, /\[\"kucoin\"\]/);
});


test('dedupe SQL exposes exchange venues even when the asset is the first subject', () => {
  const rows = [
    { ...item(31, 'Bybit Will List BTC Pair'), source_id: 'bybit-announcements', title: 'Bybit Will List BTC', body_excerpt: 'Bybit will list BTCUSDT spot trading pair at 2026-10-14 08:00 UTC.', event_type_guess: 'listing', entities: ['BTC'] },
  ];
  const { events } = mergeRawItems(rows, { watchlist: [
    { id: 'BTC', kind: 'asset', display_name: { en: 'Bitcoin' }, aliases: ['BTC'], status: 'active' },
    { id: 'bybit', kind: 'exchange', display_name: { en: 'Bybit' }, aliases: [], status: 'active' },
  ] });
  assert.equal(events[0].subject_entity, 'BTC');
  const { sql } = buildDedupeSql({ events, irrelevantItems: [] }, [31]);
  assert.match(sql, /story_venues/);
  assert.match(sql, /\[\"bybit\"\]/);
});

test('dedupe SQL normalizes one-hour market metrics without promoting 24h snapshots', () => {
  const h1 = {
    ...item(21, 'Crypto futures liquidation lower bound $62M over h1'),
    source_id: 'nexualpha-market-events',
    platform: 'market',
    event_type_guess: 'liquidation_wave',
    metrics: { total_liquidations_usd: 62_000_000, provenance: { window: 'h1' } },
  };
  const h24 = {
    ...item(22, 'Crypto futures liquidation lower bound $220M over h24'),
    source_id: 'nexualpha-market-events',
    platform: 'market',
    event_type_guess: 'liquidation_wave',
    metrics: { total_liquidations_usd: 220_000_000, provenance: { window: 'h24' } },
    url: 'https://nexualpha.com/intel/market-events.json#h24',
  };
  const { sql } = buildDedupeSql(mergeRawItems([h1, h24]), [21, 22]);
  assert.match(sql, /liquidations_usd_1h/);
  assert.match(sql, /62000000/);
  assert.match(sql, /liquidations_usd_24h/);
  assert.match(sql, /220000000/);
});

test('runDedupe and runScore are no-ops on an empty pool', () => {
  const calls = [];
  const execute = sql => { calls.push(sql); return '[]'; };
  assert.deepEqual(runDedupe(execute), { items: 0, created: 0, updated: 0, assigned: 0, skipped_items: 0 });
  assert.deepEqual(runScore(execute), { scored: 0, publish_eligible: 0, review_eligible: 0 });
  assert.ok(calls.every(sql => !/INSERT|UPDATE|DELETE/.test(sql)));
});

test('score SQL appends rows and prunes only superseded history', () => {
  const sql = buildScoreSql([{ id: 4, score: { relevance: 100, heat: 0, timeliness: 50, new_info: 100, impact: 0, weights: { relevance: 25 }, editorial_score: 55, credibility: 3, priority_override: 'official_major', explain: {}, publish_eligible: true, review_eligible: false } }]);
  assert.match(sql, /INSERT INTO event_scores/);
  assert.match(sql, /'official_major'/);
  assert.match(sql, /EXISTS \(SELECT 1 FROM event_scores n WHERE n.event_id=s.event_id AND n.scored_at > s.scored_at\)/);
  assert.equal(buildScoreSql([]), null);
});

test('status and export queries are read-only and bounded', () => {
  for (const sql of [statusQuery(), exportTopQuery(50)]) assert.doesNotMatch(sql, /\b(INSERT|UPDATE|DELETE|DROP)\b/);
  assert.match(exportTopQuery(50), /LIMIT 50/);
  assert.match(exportTopQuery(50), /verification_status/);
  assert.match(exportTopQuery(50), /story_event_ids/);
  assert.match(exportTopQuery(50), /editorial_score \* greatest/);
  assert.match(exportTopQuery(50), /claim_quality/);
  assert.throws(() => exportTopQuery(0));
  assert.throws(() => exportTopQuery('5;DROP'));
});
