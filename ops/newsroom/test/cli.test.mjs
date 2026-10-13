import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQuery, literal, main } from '../bin/newsroom.mjs';

test('SQL literals preserve quotes and do not interpolate shell commands', () => {
  assert.equal(literal("owner's $(anything)"), "'owner''s $(anything)'");
  assert.match(buildQuery(['config:set', "x';drop table events;--", '{"text":"a\\\\b"}']), /x'';drop table events;--/);
});
test('top uses latest scores, excludes occupied events and orders official notices first', () => {
  const sql = buildQuery(['events:top', '--limit', '4']);
  assert.match(sql, /JOIN LATERAL/);
  assert.match(sql, /scored_at DESC LIMIT 1/);
  assert.match(sql, /official_major/);
  assert.match(sql, /e.state IN \('new','candidate'\)/);
  assert.match(sql, /LIMIT 4/);
});
test('event bundle contains evidence, score history and linked articles', () => {
  const sql = buildQuery(['event:show', '12']);
  for (const table of ['event_evidence', 'event_scores', 'articles']) assert.ok(sql.includes(table));
  assert.match(sql, /e.id=12/);
  assert.ok(sql.includes("a.states->'story_event_ids' @> jsonb_build_array(e.id)"));
});
test('writer claim, release and complete SQL is bounded and validated', () => {
  const claim = buildQuery(['claim', '--limit', '2', '--writer', 'writer-a']);
  assert.match(claim, /pg_advisory_xact_lock\(20261012,5\)/);
  assert.match(claim, /story_heads/);
  assert.match(claim, /shortfall_log/);
  assert.match(claim, /state='claimed'/);
  assert.match(buildQuery(['release', '12', '--writer', 'writer-a']), /claimed_by='writer-a'/);
  assert.match(buildQuery(['complete', '12', '--writer', 'writer-a', '--article', 'bybit-lists-test', '--url', 'https://nexualpha.com/news/bybit-lists-test']), /published_url/);
  assert.throws(() => buildQuery(['claim', '--limit', '0', '--writer', 'writer-a']));
  assert.throws(() => buildQuery(['claim', '--limit', '2']));
  assert.throws(() => buildQuery(['release', 'bad']));
  assert.throws(() => buildQuery(['complete', '12', '--article', 'Bad Slug', '--url', 'https://nexualpha.com/news/x']));
  assert.throws(() => buildQuery(['complete', '12', '--article', 'ok-slug', '--url', 'javascript:alert(1)']));
});
test('claim command enriches database events for the writer without publishing', async () => {
  let query;
  const output = await main(['claim', '--limit', '1', '--writer', 'writer-a'], sql => {
    query = sql;
    return JSON.stringify([{
      id: 99,
      event_type: 'listing',
      title_internal: 'Bybit lists TEST',
      subject_entity: 'bybit',
      subjects: ['TEST'],
      evidence: [{ id: 'ev1', url: 'https://example.com', kind: 'official_notice', excerpt: 'Bybit lists TEST' }],
      entities: [{ id: 'bybit', kind: 'exchange', display_name: { en: 'Bybit' }, partner_slug: 'bybit' }],
    }]);
  });
  const events = JSON.parse(output);
  assert.match(query, /pg_advisory_xact_lock\(20261012,5\)/);
  assert.equal(events[0].suggested_format, 'flash');
  assert.ok(events[0].cta_hints.length);
});
test('invalid options, ids and JSON are rejected before database execution', async () => {
  for (const args of [['events:top', '--limit', '0'], ['events:top', '--limit', '1;DROP'], ['events:top', '--bad', '2'], ['event:show', '-1'], ['review:list', 'extra'], ['config:set', 'key', 'bad'], ['config:set', 'weights', '{}']]) {
    let calls = 0;
    await assert.rejects(main(args, () => { calls++; }));
    assert.equal(calls, 0);
  }
});
test('shortfall upsert uses a data-modifying CTE and explicit slot', () => {
  const sql = buildQuery(['shortfall:log', '--slot', '2026-10-12T21:35:00+08:00', '--wanted', '2', '--eligible', '0', '--published', '0', '--note', "No verified events; owner's rule"]);
  assert.match(sql, /^WITH result AS \(INSERT/);
  assert.match(sql, /ON CONFLICT\(day,slot\)/);
  assert.ok(sql.includes("owner''s"));
  assert.throws(() => buildQuery(['shortfall:log', '--slot', '2026-10-12T00:00:00', '--wanted', '2', '--eligible', '0', '--published', '0', '--note', 'x']));
});
test('config JSON roundtrips and review query selects unresolved entries', async () => {
  assert.match(buildQuery(['config:set', 'weights', '{"relevance":25,"heat":20,"timeliness":20,"new_info":20,"impact":15}']), /::jsonb/);
  assert.match(buildQuery(['config:set', 'thresholds', '{"publish":45,"publish_credibility_min":2}']), /::jsonb/);
  assert.throws(() => buildQuery(['config:set', 'thresholds', '{"publish":101}']), /invalid threshold/);
  assert.match(buildQuery(['review:list']), /resolved_at IS NULL/);
  let query;
  assert.equal(await main(['config:get', 'weights'], sql => { query = sql; return '[{"key":"weights"}]'; }), '[{"key":"weights"}]');
  assert.ok(query.includes("key='weights'"));
});
test('help does not connect', async () => {
  const help = await main(['--help'], () => assert.fail('unexpected DB access'));
  assert.match(help, /PGDATABASE/);
  assert.match(help, /calibrate/);
});
test('migrate and seed submit atomic serialized batches and reject unexpected options', async () => {
  for (const command of ['migrate', 'seed']) {
    const calls = [];
    const result = await main([command], sql => { calls.push(sql); return ''; });
    assert.equal(calls.length, 1);
    assert.match(calls[0], /^BEGIN;\nSELECT pg_advisory_xact_lock/);
    assert.match(calls[0], /COMMIT;$/);
    assert.match(result, /SQL file\(s\) applied/);
    await assert.rejects(main([command, '--bad'], () => assert.fail('unexpected DB access')));
  }
});
test('seed:watchlist imports the bundled verified snapshot atomically without approving a budget', async () => {
  const calls=[];
  const result=await main(['seed:watchlist'],sql=>{calls.push(sql);return '';});
  assert.match(result,/133 entities, 711 keywords/);
  assert.equal(calls.length,1);
  assert.match(calls[0],/^BEGIN;/);
  assert.match(calls[0],/ON CONFLICT\(term,lang\) DO NOTHING/);
  assert.match(calls[0],/'x_daily_read_budget','0'/);
  assert.match(calls[0],/defillama-hacks/);
  assert.match(calls[0],/COMMIT;$/);
});

test('calibrate command is read-only and fixed to the owner calibration window', async () => {
  const calls = [];
  const result = await main(['calibrate'], sql => { calls.push(sql); return '{"schema":"newsroom.calibration.v1"}'; });
  assert.equal(result, '{"schema":"newsroom.calibration.v1"}');
  assert.equal(calls.length, 1);
  assert.match(calls[0], /\(40\), \(45\), \(50\), \(55\)/);
  assert.match(calls[0], /interval '72 hours'/);
  assert.doesNotMatch(calls[0], /\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bALTER\b/i);
  await assert.rejects(main(['calibrate', '--threshold', '45'], () => assert.fail('unexpected DB access')));
});
