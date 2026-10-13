import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyEvent } from './verification.mjs';
import { main } from '../bin/newsroom.mjs';
import { exportTopQuery, runVerify, loadDedupeInputs } from './pipeline.mjs';
import { readFileSync } from 'node:fs';

const title = 'Bybit will delist BTC trading pairs';
const event = evidence => ({ id: 5, last_update_at: '2026-10-12T10:00:00Z', title_internal: title, event_type: 'delisting', evidence });
const row = (extra = {}) => ({ title, excerpt: title, url: 'https://announcements.bybit.com/notice/1', origin_key: 'url:notice1', source_id: 'bybit-announcements', kind: 'official_notice', source_platform: 'exchange', source_tier: 1, verified_official: true, is_independent: true, ...extra });
test('official captured matching facts verify, unsupported or mirror facts do not', () => {
  assert.equal(verifyEvent(event([row()])), 'verified-primary');
  assert.equal(verifyEvent(event([row({ title: 'Different notice', excerpt: 'Unrelated facts' })])), 'unverified');
  assert.equal(verifyEvent(event([row({ verified_official: false })])), 'unverified');
  assert.equal(verifyEvent(event([row({ source_id: 'nexualpha-official-announcements' })])), 'unverified');
  assert.equal(verifyEvent(event([row({ source_id: 'telegram-nexualphaclub-preview', url: 'https://t.me/s/NexuAlphaClub/42' })])), 'unverified');
});
test('two distinct publishers and origins corroborate; reposts and two outlet URLs do not', () => {
  const media = row({ source_platform: 'media', kind: 'media_report', verified_official: false });
  assert.equal(verifyEvent(event([media, { ...media, url: 'https://other.test/news', origin_key: 'other' }])), 'corroborated');
  assert.equal(verifyEvent(event([media, { ...media, url: 'https://other.test/news' }])), 'unverified');
  assert.equal(verifyEvent(event([media, { ...media, url: 'https://announcements.bybit.com/notice/2', origin_key: 'other' }])), 'unverified');
});
test('fraud, insolvency, conflicts require review without primary even if corroborated', () => {
  for (const title_internal of ['Bybit accused of fraud', 'Bybit faces insolvency']) {
    const e = { title_internal, evidence: [row({ title: title_internal, excerpt: title_internal, source_platform: 'media' }), row({ title: title_internal, excerpt: title_internal, source_platform: 'media', url: 'https://other.test/a', origin_key: 'other' })] };
    assert.equal(verifyEvent(e), 'needs-review');
    assert.equal(verifyEvent({ ...e, evidence: [row({ title: title_internal, excerpt: title_internal })] }), 'verified-primary');
  }
  assert.equal(verifyEvent({ ...event([row()]), verification_status: 'conflicting' }), 'needs-review');
  assert.equal(verifyEvent({ ...event([row()]), verification_status: 'debunked' }), 'debunked');
});
test('verify CLI persists statuses and idempotent unresolved review entries', async () => {
  const calls = [];
  const result = await main(['verify'], sql => { calls.push(sql); return calls.length === 1 ? JSON.stringify([{ ...event([]), title_internal: 'Bybit faces insolvency' }]) : '[]'; });
  assert.deepEqual(JSON.parse(result), { verified: 1 });
  assert.match(calls[3], /verification_status='needs-review'/);
  assert.match(calls[3], /INSERT INTO review_queue/);
  assert.match(calls[3], /NOT EXISTS/);
  assert.match(calls[3], /AND last_update_at='2026-10-12T10:00:00Z'::timestamptz/);
  assert.match(calls[3], /FROM target WHERE NOT EXISTS/);
  assert.deepEqual(runVerify(() => '[]'), { verified: 0 });
});
test('export fails closed on score, stale checks, verification and unresolved review', () => {
  const sql = exportTopQuery();
  for (const fragment of ["e.verification_status IN ('verified-primary','corroborated')", 'e.verified_at >= e.last_update_at', 's.scored_at >= e.last_update_at', 's.editorial_score >= coalesce(', "key='thresholds'", 'q.resolved_at IS NULL']) assert.ok(sql.includes(fragment));
});
test('incremental dedupe uses durable pending queue instead of re-reading noise or losing backlog', () => {
  const calls = [];
  loadDedupeInputs(sql => { calls.push(sql); return '[]'; });
  assert.match(calls[2], /r.state='pending'/);
  assert.doesNotMatch(calls[2], /r.fetched_at > now/);
  const migration = readFileSync(new URL('../db/migrations/091_publishable_pool.sql', import.meta.url), 'utf8');
  for (const name of ['idx_raw_items_origin_item_id', 'idx_raw_items_fetched_at', 'idx_raw_items_pending', 'idx_event_evidence_event_id', 'idx_event_scores_score']) assert.ok(migration.includes(`create index if not exists ${name}`));
});
test('scheduler orders dedupe, score, verify, export and stops after prerequisite failure', () => {
  const script = readFileSync(new URL('../deploy/scheduler.sh', import.meta.url), 'utf8');
  assert.match(script, /dedupe \|\| return 1\s+"\$\{CLI\[@\]\}" score \|\| return 1\s+"\$\{CLI\[@\]\}" verify \|\| return 1\s+"\$\{CLI\[@\]\}" export:top/);
});

test('legacy unrelated regulator events cannot become publishable primary leads', () => {
  const calls = [];
  const title_internal = 'SEC charges adviser with cherry picking';
  runVerify(sql => {
    calls.push(sql);
    if (calls.length === 1) return JSON.stringify([{ ...event([row({ title: title_internal, excerpt: title_internal, source_platform: 'regulator', source_id: 'sec-press' })]), title_internal, subjects: ['sec'] }]);
    if (calls.length === 2) return JSON.stringify([{ id: 'sec', kind: 'regulator', status: 'active', display_name: { en: 'SEC' } }]);
    return '[]';
  });
  assert.match(calls[3], /verification_status='unverified'/);
});

test('recorded official Bybit response verifies its captured announcement headline', () => {
  const payload = JSON.parse(readFileSync(new URL('../collectors/fixtures/recorded/bybit.json', import.meta.url), 'utf8'));
  const announcement = payload.result.list[0];
  const captured = row({ title: announcement.title, excerpt: announcement.description, url: announcement.url });
  assert.equal(verifyEvent({ title_internal: announcement.title, event_type: 'product_launch', evidence: [captured] }), 'verified-primary');
});
