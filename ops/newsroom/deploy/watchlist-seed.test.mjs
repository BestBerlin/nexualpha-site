import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWatchlistSql, entityRow, slugify } from './watchlist-seed.mjs';

test('ids follow the T2 seed rule and skip unverified accounts', () => {
  assert.equal(slugify('Changpeng Zhao (CZ)'), 'changpeng-zhao-cz');
  const row = entityRow({ name: 'Yi He (何一)', type: 'person', accounts: { x: '@heyibinance', telegram: 'None / Unverified' }, priority: 1, official_site: 'https://www.binance.com' });
  assert.deepEqual(row.display, { en: 'Yi He', 'zh-Hans': '何一' });
  assert.deepEqual(row.accounts, { x: '@heyibinance' });
  assert.ok(row.aliases.includes('何一'));
});

test('SQL is idempotent upsert, merges duplicate names and maps zh to zh-Hans', () => {
  const sql = buildWatchlistSql([{ name: 'Lookonchain', type: 'onchain_source', accounts: { x: '@lookonchain' } }, { name: 'Lookonchain', type: 'person', accounts: {} }], { event_words: { zh: ['暂停提币'], en: ["owner's halt"] } });
  assert.equal((sql.match(/'lookonchain', /g) ?? []).length, 1);
  assert.match(sql, /ON CONFLICT \(id\) DO UPDATE/);
  assert.match(sql, /ON CONFLICT \(term, lang\) DO NOTHING/);
  assert.match(sql, /'暂停提币', 'zh-Hans'/);
  assert.ok(sql.includes("owner''s halt"));
});
