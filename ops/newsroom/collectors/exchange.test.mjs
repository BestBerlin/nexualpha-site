import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { poll, supports } from './exchange.mjs';

const fixture = name => JSON.parse(readFileSync(fileURLToPath(new URL(`./fixtures/exchange/${name}.json`, import.meta.url)), 'utf8'));
const now = new Date('2026-10-12T12:00:00Z');

const source = (id, url) => ({ id, name: id, url });

test('supports only the exchange announcement and status sources owned by this collector', () => {
  assert.equal(supports(source('binance-announcements', 'https://www.binance.com/bapi/composite/v1/public/cms/article/list/query')), true);
  assert.equal(supports(source('sec-press', 'https://www.sec.gov/news/pressreleases.rss')), false);
});

test('binance fans out by catalog and emits raw newsroom items after since', async () => {
  const calls = [];
  const items = await poll(
    source('binance-announcements', 'https://www.binance.com/bapi/composite/v1/public/cms/article/list/query'),
    '2026-10-12T08:00:00Z',
    {
      now,
      async request(url) {
        calls.push(new URL(url));
        const catalogId = Number(new URL(url).searchParams.get('catalogId'));
        return catalogId === 48 ? fixture('binance') : { code: '000000', data: { catalogs: [{ catalogId, articles: [] }] } };
      },
    },
  );
  assert.deepEqual(calls.filter(url => url.hostname === 'www.binance.com' && url.pathname === '/bapi/composite/v1/public/cms/article/list/query').map(url => url.searchParams.get('catalogId')), ['48', '49', '93', '161']);
  assert.equal(items.length, 1);
  assert.equal(items[0].external_id, 'binance:a1a7996170f246da90ea49f199a61bcd');
  assert.equal(items[0].event_type_guess, 'listing');
  assert.match(items[0].url, /^https:\/\/www\.binance\.com\/en\/support\/announcement\/detail\//);
});

test('bybit and bitget validate official links and preserve Bitget limit=10', async () => {
  const bybit = await poll(
    source('bybit-announcements', 'https://api.bybit.com/v5/announcements/index'),
    null,
    { now, async request() { return fixture('bybit'); } },
  );
  assert.deepEqual(bybit.map(item => item.external_id), ['bybit:https://announcements.bybit.com/en-US/article/abc/']);
  assert.equal(bybit[0].event_type_guess, 'listing');

  const urls = [];
  const bitget = await poll(
    source('bitget-announcements', 'https://api.bitget.com/api/v2/public/annoucements'),
    null,
    {
      now,
      async request(url) {
        urls.push(new URL(url));
        return fixture('bitget');
      },
    },
  );
  assert.ok(urls.filter(url => url.hostname === 'api.bitget.com').every(url => url.searchParams.get('limit') === '10'));
  assert.deepEqual([...new Set(bitget.map(item => item.external_id))], ['bitget:1001']);
});

test('kucoin fans out across official announcement types and maps listing and delisting categories', async () => {
  const urls = [];
  const rows = await poll(
    source('kucoin-announcements', 'https://api.kucoin.com/api/ua/v2/market/announcement'),
    null,
    {
      now,
      async request(url) {
        urls.push(new URL(url));
        return fixture('kucoin');
      },
    },
  );
  const apiUrls = urls.filter(url => url.hostname === 'api.kucoin.com');
  assert.deepEqual(apiUrls.map(url => url.searchParams.get('type')), ['latest-announcements', 'new-listings', 'delistings']);
  assert.ok(apiUrls.every(url => url.searchParams.get('language') === 'en_US' && url.searchParams.get('pageSize') === '50'));
  assert.deepEqual([...new Set(rows.map(item => item.external_id))], ['kucoin:342429', 'kucoin:342774']);
  assert.equal(rows.find(item => item.external_id === 'kucoin:342429')?.event_type_guess, 'listing');
  assert.equal(rows.find(item => item.external_id === 'kucoin:342774')?.event_type_guess, 'delisting');
});

test('kraken announcement RSS maps asset listing posts as primary exchange announcements', async () => {
  const rows = await poll(
    source('kraken-announcements', 'https://blog.kraken.com/category/product/asset-listings/feed'),
    null,
    { now, async request(url, options) { assert.equal(options.format, 'text'); return readFileSync(fileURLToPath(new URL('./fixtures/exchange/kraken-announcements.xml', import.meta.url)), 'utf8'); } },
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].external_id, 'kraken-blog:https://blog.kraken.com/?p=36775');
  assert.equal(rows[0].event_type_guess, 'listing');
  assert.equal(rows[0].author, 'kraken-announcements');
  assert.match(rows[0].url, /^https:\/\/blog\.kraken\.com\/product\/asset-listings\//);
});

test('kraken status maps incident status and malformed exchange payloads fail loudly', async () => {
  const kraken = await poll(
    source('kraken-status', 'https://status.kraken.com/api/v2/incidents.json'),
    null,
    { now, async request() { return fixture('kraken'); } },
  );
  assert.equal(kraken[0].external_id, 'kraken-status:inc-1');
  assert.equal(kraken[0].event_type_guess, 'market_structure');
  assert.deepEqual(kraken[0].metrics, { impact: 'minor', status: 'monitoring' });

  const resolvedWithdrawal = await poll(
    source('kraken-status', 'https://status.kraken.com/api/v2/incidents.json'),
    null,
    { now, async request() { return { incidents: [{ id: 'inc-2', name: 'Withdrawals delayed', status: 'resolved', impact: 'minor', created_at: '2026-10-12T09:30:00Z' }] }; } },
  );
  assert.equal(resolvedWithdrawal[0].event_type_guess, null);

  await assert.rejects(
    poll(source('bybit-announcements', 'https://api.bybit.com/v5/announcements/index'), null, { now, async request() { return { retCode: 10001, result: null }; } }),
    /malformed payload/,
  );
});

test('endpoint validation rejects a source registry drift before any request is made', async () => {
  let calls = 0;
  await assert.rejects(
    poll(source('bitget-announcements', 'https://api.bitget.com/api/v2/public/announcements'), null, { now, async request() { calls += 1; return {}; } }),
    /endpoint does not match/,
  );
  assert.equal(calls, 0);
});

test('hidden delisting titles fetch announcement body for asset details and fail closed when absent', async () => {
  const sourceRow = source('bybit-announcements', 'https://api.bybit.com/v5/announcements/index');
  const payload = title => ({
    retCode: 0,
    result: { list: [{ title, type: { key: 'delistings' }, url: 'https://announcements.bybit.com/en-US/article/delist-hidden/', dateTimestamp: 1791806400000 }] },
  });
  const resolved = await poll(sourceRow, null, {
    now,
    async request(url) {
      if (new URL(url).hostname === 'api.bybit.com') return payload('Bybit Will Delist 1 Token(s)');
      return '<article>Bybit will delist ABCUSDT spot trading pair at 2026-10-14 08:00 UTC. Deposits and withdrawals for ABC stay open until further notice.</article>';
    },
  });
  assert.equal(resolved[0].title, 'Bybit Will Delist 1 Token(s): ABC');
  assert.match(resolved[0].body_excerpt, /Bybit will delist ABCUSDT spot trading pair/);
  assert.deepEqual(resolved[0].metrics.tickers, ['ABC']);
  assert.deepEqual(resolved[0].metrics.dates, ['2026-10-14']);

  const unknown = await poll(sourceRow, null, {
    now,
    async request(url) {
      if (new URL(url).hostname === 'api.bybit.com') return payload('Bybit Will Delist 1 Token(s)');
      return '<article>Bybit will delist the affected spot trading pair after a project review.</article>';
    },
  });
  assert.equal(unknown[0].metrics.detail_status, 'needs-detail');
});
