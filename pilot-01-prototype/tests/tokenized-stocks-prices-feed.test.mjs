import assert from 'node:assert/strict';
import { once } from 'node:events';
import { Readable, Writable } from 'node:stream';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createProductionServer } from '../server.mjs';
import { createTokenizedStocksPricesReader, tokenizedStocksPricesView, TS_PRICES_MAX_AGE_MS } from '../server/tokenized-stocks-prices-feed.mjs';

function fixture(now) {
  const updatedAt = new Date(now).toISOString();
  return { updatedAt, sources: [{ id: 'bybit-spot', venueId: 'bybit', endpoint: 'https://api.bybit.com/v5/market/tickers?category=spot', status: 'ok', updatedAt }],
    rows: [{ ticker: 'TSLA', venueId: 'bybit', instrument: 'TSLAXUSDT', marketType: 'spot', quoteCurrency: 'USDT',
      lastPrice: 100, change24hPct: 2, quoteVolume24h: 1000, indexPrice: 80, premiumPct: 999, updatedAt, sourceId: 'bybit-spot' }] };
}

test('price view expires feed, row and source clocks independently and rejects future clocks', () => {
  const now = Date.parse('2026-10-23T01:00:00Z');
  for (const target of ['feed', 'row', 'source']) {
    for (const age of [TS_PRICES_MAX_AGE_MS, TS_PRICES_MAX_AGE_MS + 1, -60_001]) {
      const feed = fixture(now);
      (target === 'feed' ? feed : target === 'row' ? feed.rows[0] : feed.sources[0]).updatedAt = new Date(now - age).toISOString();
      assert.equal(tokenizedStocksPricesView(feed, now).rows.length, 0, `${target} ${age}`);
    }
  }
  assert.equal(tokenizedStocksPricesView(fixture(now), now + TS_PRICES_MAX_AGE_MS - 1).rows.length, 1);
});

test('price view validates numeric values, sources and instruments without inventing optional metrics', () => {
  const now = Date.now();
  const good = fixture(now);
  assert.equal(tokenizedStocksPricesView(good, now).rows[0].premiumPct, 25, 'premium derives only from index');
  for (const patch of [{ lastPrice: '100' }, { lastPrice: Infinity }, { lastPrice: 0 }, { sourceId: 'missing' }, { venueId: 'mexc' }, { marketType: 'unknown' }, { ticker: ['TSLA'] }, { quoteCurrency: ['USDT'] }]) {
    const feed = fixture(now); Object.assign(feed.rows[0], patch);
    assert.equal(tokenizedStocksPricesView(feed, now).rows.length, 0);
  }
  const feed = fixture(now);
  Object.assign(feed.rows[0], { indexPrice: null, change24hPct: '', quoteVolume24h: -1 });
  const row = tokenizedStocksPricesView(feed, now).rows[0];
  assert.equal(row.premiumPct, null); assert.equal(row.change24hPct, null); assert.equal(row.quoteVolume24h, null);
  feed.sources[0].status = 'error';
  assert.equal(tokenizedStocksPricesView(feed, now).rows.length, 0);
  const malformed = fixture(now); malformed.sources[0].endpoint = ['https://example.org'];
  assert.equal(tokenizedStocksPricesView(malformed, now).rows.length, 0);
});

test('file reads coalesce, cap cache at 60 seconds and expire cached rows on every read', async () => {
  let now = Date.now(), reads = 0;
  const feed = fixture(now - TS_PRICES_MAX_AGE_MS + 10_000);
  const reader = createTokenizedStocksPricesReader({ file: 'test', ttlMs: 999_999, now: () => now,
    readFileImpl: async () => { reads++; return JSON.stringify(feed); } });
  const result = await Promise.all([reader.read(), reader.read(), reader.read()]);
  assert.equal(reads, 1); assert.equal(result[0].rows.length, 1);
  now += 10_000;
  assert.equal((await reader.read()).rows.length, 0); assert.equal(reads, 1);
  now += 50_000;
  await reader.read(); assert.equal(reads, 2);
});

test('separately collected index expires independently of the ticker price', () => {
  const now = Date.now(), feed = fixture(now);
  feed.sources.push({ ...feed.sources[0], id: 'index' });
  Object.assign(feed.rows[0], { indexSourceId: 'index', indexUpdatedAt: new Date(now - TS_PRICES_MAX_AGE_MS + 1000).toISOString() });
  assert.equal(tokenizedStocksPricesView(feed, now).rows[0].premiumPct, 25);
  const row = tokenizedStocksPricesView(feed, now + 1000).rows[0];
  assert.equal(row.lastPrice, 100); assert.equal(row.indexPrice, null); assert.equal(row.premiumPct, null);
  feed.rows[0].indexUpdatedAt = new Date(now).toISOString();
  feed.sources[1].status = 'error';
  assert.equal(tokenizedStocksPricesView(feed, now).rows[0].indexPrice, null);
});

test('missing, malformed and timed-out files fail closed without a stale fallback', async () => {
  let now = Date.now(), text = JSON.stringify(fixture(now));
  const reader = createTokenizedStocksPricesReader({ file: 'test', ttlMs: 0, now: () => now, readFileImpl: async () => text });
  assert.equal((await reader.read()).rows.length, 1);
  text = '{'; now++;
  assert.equal((await reader.read()).rows.length, 0);
  assert.equal((await createTokenizedStocksPricesReader().read()).unavailable, true);
  const hung = createTokenizedStocksPricesReader({ file: 'test', timeoutMs: 10, readFileImpl: () => new Promise(() => {}) });
  assert.equal((await hung.read()).rows.length, 0);
});

test('production request handler reads TS_PRICES_FILE, handles HEAD and rejects writes without sockets', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'ts-prices-http-'));
  let server;
  try {
    const file = path.join(dir, 'prices.json');
    await writeFile(file, JSON.stringify(fixture(Date.now())));
    server = await createProductionServer({ env: { TS_PRICES_FILE: file, INTEL_REFRESH: 'off', FX_REFRESH: 'off', BITGET_ALLIANCE_POOL: 'off', KRAKEN_USDG_LIVE: 'off' },
      worker: { fetch: async () => new Response('fallback', { status: 404 }) } });
    // Exercise the real HTTP request listener. The managed sandbox forbids listen().
    async function request(method = 'GET') {
      const req = Readable.from([]);
      Object.assign(req, { method, url: '/api/tokenized-stocks/prices', headers: { host: 'localhost' } });
      const chunks = [];
      const res = new Writable({ write(chunk, _encoding, done) { chunks.push(Buffer.from(chunk)); done(); } });
      res.setHeader = () => {};
      res.writeHead = (status, headers) => { res.statusCode = status; res.responseHeaders = headers; };
      const finished = once(res, 'finish');
      server.emit('request', req, res);
      await finished;
      return { status: res.statusCode, headers: res.responseHeaders, body: Buffer.concat(chunks).toString() };
    }
    const response = await request();
    assert.equal(response.status, 200); assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(JSON.parse(response.body).rows[0].lastPrice, 100);
    const head = await request('HEAD'); assert.equal(head.status, 200); assert.equal(head.body, '');
    const post = await request('POST'); assert.equal(post.status, 405); assert.equal(post.headers.allow, 'GET, HEAD');
  } finally {
    server?.emit('close');
    await rm(dir, { recursive: true, force: true });
  }
});
