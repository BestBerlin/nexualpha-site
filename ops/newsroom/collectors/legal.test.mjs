import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { poll, supports } from './legal.mjs';

const textFixture = name => readFileSync(fileURLToPath(new URL(`./fixtures/legal/${name}`, import.meta.url)), 'utf8');
const jsonFixture = name => JSON.parse(textFixture(name));
const now = new Date('2026-10-12T12:00:00Z');
const source = (id, url) => ({ id, name: id, url });
const entities = [
  {
    id: 'example-bitcoin-treasury',
    name: 'Example Bitcoin Treasury Inc.',
    display_name: { en: 'Example Bitcoin Treasury Inc.' },
    aliases: ['EBTC'],
    status: 'active',
  },
];

test('supports regulator and filing sources but not exchange sources', () => {
  assert.equal(supports(source('sec-press', 'https://www.sec.gov/news/pressreleases.rss')), true);
  assert.equal(supports(source('sec-edgar-submissions', 'https://data.sec.gov/submissions/')), true);
  assert.equal(supports(source('binance-announcements', 'https://www.binance.com/bapi/composite/v1/public/cms/article/list/query')), false);
});

test('SEC RSS is requested as text with contact UA and mapped to raw items', async () => {
  const calls = [];
  const items = await poll(
    source('sec-press', 'https://www.sec.gov/news/pressreleases.rss'),
    '2026-10-12T07:00:00Z',
    {
      now,
      async request(url, options) {
        calls.push({ url, options });
        return textFixture('sec-press.xml');
      },
    },
  );
  assert.equal(calls[0].options.format, 'text');
  assert.equal(calls[0].options.headers['User-Agent'], 'NexuAlpha newsroom ops@nexualpha.com');
  assert.equal(items.length, 1);
  assert.equal(items[0].external_id, 'sec-press:sec-2026-123');
  assert.equal(items[0].event_type_guess, 'enforcement');
});

test('CourtListener search builds a watchlist query and rejects malformed results', async () => {
  const urls = [];
  const items = await poll(
    source('courtlistener-search', 'https://www.courtlistener.com/api/rest/v4/search/'),
    null,
    {
      now,
      entities,
      keywords: [{ term: 'lawsuit filed', event_type: 'lawsuit', status: 'active' }],
      async request(url) {
        urls.push(new URL(url));
        return jsonFixture('courtlistener.json');
      },
    },
  );
  assert.match(urls[0].searchParams.get('q'), /Example Bitcoin Treasury Inc/);
  assert.match(urls[0].searchParams.get('q'), /lawsuit filed/);
  assert.equal(items[0].external_id, 'courtlistener:42');
  assert.equal(items[0].event_type_guess, 'lawsuit');

  await assert.rejects(
    poll(source('courtlistener-search', 'https://www.courtlistener.com/api/rest/v4/search/'), null, { now, async request() { return { results: null }; } }),
    /malformed payload/,
  );
});

test('CourtListener recorded RECAP rows use docket ids, docket URLs and metadata dates', async () => {
  const recorded = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/recorded/courtlistener.json', import.meta.url)), 'utf8'));
  const items = await poll(
    source('courtlistener-search', 'https://www.courtlistener.com/api/rest/v4/search/'),
    null,
    { now, async request() { return recorded; } },
  );
  assert.equal(items.length, 2);
  assert.equal(items[0].external_id, 'courtlistener:66801867');
  assert.equal(items[0].url, 'https://www.courtlistener.com/docket/66801867/lee-v-binance/');
  assert.equal(items[0].published_at, '2022-05-02T00:00:00.000Z');
  assert.equal(items[0].metrics.docket_id, 66801867);
});

test('EDGAR full-text uses POST JSON with SEC contact UA', async () => {
  const calls = [];
  const items = await poll(
    source('sec-edgar-full-text', 'https://efts.sec.gov/LATEST/search-index'),
    '2026-10-10T00:00:00Z',
    {
      now,
      entities,
      keywords: [{ term: 'digital asset', event_type: 'crypto_treasury_company', status: 'active' }],
      async request(url, options) {
        calls.push({ url, options });
        return jsonFixture('edgar-full-text.json');
      },
    },
  );
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['User-Agent'], 'NexuAlpha newsroom ops@nexualpha.com');
  const body = JSON.parse(calls[0].options.body);
  assert.match(body.q, /digital asset/);
  assert.equal(body.startdt, '2026-10-10');
  assert.deepEqual(body.forms, ['8-K', '10-Q', '10-K', 'S-1', '13F']);
  assert.equal(items[0].external_id, 'edgar-fts:0001193125-26-123456');
  assert.equal(items[0].event_type_guess, 'crypto_treasury_company');
  assert.equal(items[0].metrics.search_score, 8.1);
  assert.equal(items[0].metrics.form, '8-K');
  assert.equal(items[0].body_excerpt, 'Item 8.01 Other Events - digital asset treasury update');
  assert.deepEqual(items.map(item => item.external_id), ['edgar-fts:0001193125-26-123456']);
});

test('EDGAR full-text drops disallowed forms before raw item creation', async () => {
  const items = await poll(
    source('sec-edgar-full-text', 'https://efts.sec.gov/LATEST/search-index'),
    null,
    {
      now,
      entities: [],
      keywords: [{ term: 'digital asset', event_type: 'crypto_treasury_company', status: 'active' }],
      async request() {
        return jsonFixture('edgar-full-text.json');
      },
    },
  );
  assert.deepEqual(items.map(item => item.external_id), ['edgar-fts:0001193125-26-123456']);
});

test('EDGAR submissions discovers CIKs from official company_tickers exact name or ticker matches', async () => {
  const urls = [];
  const items = await poll(
    source('sec-edgar-submissions', 'https://data.sec.gov/submissions/'),
    null,
    {
      now,
      entities,
      async request(url) {
        urls.push(url);
        if (url === 'https://www.sec.gov/files/company_tickers.json') return jsonFixture('company_tickers.json');
        assert.equal(url, 'https://data.sec.gov/submissions/CIK0000320193.json');
        return jsonFixture('submissions.json');
      },
    },
  );
  assert.deepEqual(urls, ['https://www.sec.gov/files/company_tickers.json', 'https://data.sec.gov/submissions/CIK0000320193.json']);
  assert.equal(items[0].external_id, 'edgar-submission:0000320193-26-000001');
  assert.equal(items[0].metrics.cik, '320193');
  assert.match(items[0].url, /Archives\/edgar\/data\/320193\/000032019326000001/);
  assert.equal(items.length, 1);
});

test('EDGAR submissions marks partial on no CIKs and keeps other companies when one request fails', async () => {
  const emptyCtx = {
    now,
    entities: [{ id: 'unknown-company', name: 'Unknown Company', status: 'active' }],
    async request() { return jsonFixture('company_tickers.json'); },
  };
  assert.deepEqual(await poll(source('sec-edgar-submissions', 'https://data.sec.gov/submissions/'), null, emptyCtx), []);
  assert.match(emptyCtx.partial, /no watchlist companies resolved/);

  const ctx = {
    now,
    entities: [
      ...entities,
      { id: 'broken', name: 'Broken Co', cik: '42', status: 'active' },
    ],
    async request(url) {
      if (url === 'https://www.sec.gov/files/company_tickers.json') return jsonFixture('company_tickers.json');
      if (url.endsWith('CIK0000000042.json')) throw new Error('fixture failure');
      return jsonFixture('submissions.json');
    },
  };
  const items = await poll(source('sec-edgar-submissions', 'https://data.sec.gov/submissions/'), null, ctx);
  assert.equal(items.length, 1);
  assert.match(ctx.partial, /company failed: 42/);
});

test('SEC submissions source may be a concrete CIK JSON URL', async () => {
  const items = await poll(
    source('sec-edgar-submissions', 'https://data.sec.gov/submissions/CIK0000320193.json'),
    null,
    {
      now,
      async request(url) {
        assert.equal(url, 'https://data.sec.gov/submissions/CIK0000320193.json');
        return jsonFixture('submissions.json');
      },
    },
  );
  assert.equal(items[0].external_id, 'edgar-submission:0000320193-26-000001');
});

test('legal endpoint validation rejects registry drift before requests', async () => {
  let calls = 0;
  await assert.rejects(
    poll(source('sec-press', 'https://www.sec.gov/news/pressreleases.xml'), null, { now, async request() { calls += 1; return ''; } }),
    /endpoint does not match/,
  );
  assert.equal(calls, 0);
});
