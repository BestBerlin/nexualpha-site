// Run only through test-postgres.sh against its disposable database/psql wrapper.
import assert from 'node:assert/strict';
import { main, runPsql } from '../bin/newsroom.mjs';
if (!process.env.NEWSROOM_TEST_PROJECT) throw new Error('Disposable PostgreSQL test environment required');
runPsql(`
SELECT setval(pg_get_serial_sequence('events','id'), coalesce((SELECT max(id) FROM events),1));
INSERT INTO watchlist_entities(id,kind,display_name) VALUES ('bybit','exchange','{"en":"Bybit"}') ON CONFLICT DO NOTHING;
INSERT INTO raw_items(source_id, external_id, url, title, event_type_guess, published_at)
SELECT 'sec-press', 'noise-'||n, 'https://www.sec.gov/newsroom/noise-'||n,
 'SEC charges unrelated adviser with cherry picking', 'enforcement', now() FROM generate_series(1,974) n;
INSERT INTO raw_items(source_id,external_id,url,title,event_type_guess,published_at) VALUES
 ('bybit-announcements','delisting-smoke','https://announcements.bybit.com/delist-btc','Bybit will delist BTC trading pairs','delisting',now()),
 ('nexualpha-official-announcements','mirror-smoke','https://nexualpha.com/announcements/delist-btc','Bybit will delist BTC trading pairs','delisting',now());
INSERT INTO newsroom_config(key,value) VALUES ('thresholds','{"publish":0}') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
`);
const started = performance.now();
const dedupe = JSON.parse(await main(['dedupe']));
assert.equal(dedupe.items, 976);
assert.equal(dedupe.created, 1);
assert.equal(dedupe.skipped_items, 974);
await main(['score']);
await main(['verify']);
const exported = JSON.parse(await main(['export:top']));
const lead = exported.events.find(e => e.title_internal === 'Bybit will delist BTC trading pairs');
assert.ok(lead, 'Primary lead must export');
assert.equal(lead.verification_status, 'verified-primary');
assert.equal(lead.evidence.length, 2);
assert.equal(lead.evidence.find(e => e.source_id === 'nexualpha-official-announcements').is_independent, false);
assert.equal(JSON.parse(await main(['dedupe'])).items, 0, 'Second pass must not rescan irrelevant noise');
await main(['config:set', 'thresholds', '{"publish":100}']);
assert.equal(JSON.parse(await main(['export:top'])).events.length, 0);
const elapsed = performance.now() - started;
assert.ok(elapsed < 30000, `976-item pipeline exceeded 30s: ${elapsed.toFixed(0)}ms`);
console.log(`Disposable PostgreSQL pipeline smoke: 976 raw rows, one primary event, zero repeat work; ${elapsed.toFixed(0)}ms`);
