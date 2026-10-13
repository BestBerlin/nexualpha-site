import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQuery, main } from '../bin/newsroom.mjs';
import { claimEligibilitySql, exportTopQuery } from '../lib/pipeline.mjs';

test('claim and export share eligibility; claim locks rows, records owner, lease and shortfall atomically', () => {
  const sql = buildQuery(['claim', '--limit', '3', '--writer', "writer's id"]);
  assert.ok(sql.includes(claimEligibilitySql()));
  assert.ok(exportTopQuery().includes(claimEligibilitySql()));
  for (const fragment of ['pg_advisory_xact_lock(20261012,5)', 'story_heads', 'throttled_heads', 'market-story', "'head:' || id::text", 'story_group_key', 'story_event_ids', 'venues', 'story_venues', "state='claimed'", "claimed_by='writer''s id'", "interval '90 minutes'", 'INSERT INTO shortfall_log', 'FROM selected HAVING count(*) < 3', 'event_evidence', 'nexualpha-official', 'telegram-nexualphaclub-preview', "e.discussion ? 'asset'", 'watchlist_entities', 'articles']) assert.ok(sql.includes(fragment), fragment);
  assert.ok(sql.indexOf('editorial_score * greatest') < sql.indexOf("(priority_override='official_major')"));
  assert.match(sql, /^BEGIN;/);
  assert.match(sql, /COMMIT;$/);
  assert.ok(sql.includes("related_event.discussion->'story_venues'"));
  assert.ok(sql.includes('jsonb_agg(DISTINCT story_venue.name)'));
});

test('release and complete apply only to claimed events and support owner guards', () => {
  assert.match(buildQuery(['release', '42', '--writer', 'a']), /id=42 AND state='claimed' AND claimed_by='a'/);
  const sql = buildQuery(['complete', '42', '--article', 'test-story', '--url', 'https://example.test/story', '--writer', 'a']);
  for (const text of ["state='published'", "state='claimed'", "claimed_at >= now() - interval '90 minutes'", "claimed_by='a'", 'story_event_ids', 'INSERT INTO articles', 'published_url', 'FROM target']) assert.ok(sql.includes(text));
  assert.ok(!sql.includes('indexed_at='));
  assert.ok(!sql.includes('ON CONFLICT')); // Duplicate slug cannot steal another article.
});

test('invalid claim and lifecycle inputs never connect', async () => {
  for (const args of [['claim'], ['claim', '--writer', ' '], ['claim', '--writer', 'a', '--limit', '0'], ['claim', '--writer', 'a', '--limit', '2;DROP'], ['release', '-1'], ['complete', '1', '--article', '../story', '--url', 'https://example.test'], ['complete', '1', '--article', 'story', '--url', 'javascript:alert(1)']]) {
    await assert.rejects(main(args, () => assert.fail('unexpected DB access')));
  }
});

test('claim returns evidence bundle and enriches format and suggestions without network', async () => {
  const result = JSON.parse(await main(['claim', '--writer', 'fixture'], () => JSON.stringify([
    { id: 42, event_type: 'withdrawal_halt', subjects: ['okx'], evidence: [{ url: 'https://example.test/notice', excerpt: 'Withdrawals paused' }], entities: [] },
  ])));
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 42);
  assert.equal(result[0].evidence[0].excerpt, 'Withdrawals paused');
  assert.ok(result[0].suggested_format);
});
