import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from '../worker/index.js';
import { marketAssetSnapshot, marketAssetResponse, parseMarketAssetSymbols } from '../src/data/market-events-assets.js';
import { marketContextSnapshot } from '../src/components/v3/news/article-market-context.js';
import { createMarketEventsReader } from '../server/market-events-feed.mjs';
const feed = JSON.parse(await readFile(new URL('./fixtures/market-data/market-events.live-v2-2026-10-13.json', import.meta.url)));
const url = query => new URL(`https://nexualpha.com/api/market-events/asset?${query}`);
const request = (query, env) => worker.fetch(new Request(url(query)), env);

test('asset projection preserves rail numbers and exposes only rendered fields', async () => {
  const original = marketContextSnapshot(feed, ['BTC', 'ETH']);
  const response = await request('symbols=btc,ETH', { MARKET_EVENTS_READ: async () => feed });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=30');
  const payload = await response.json();
  assert.deepEqual(payload, { ...original, stale: false });
  assert.deepEqual(Object.keys(payload).sort(), ['generatedAt', 'rows', 'stale']);
  assert.deepEqual(marketAssetSnapshot(payload, ['ETH', 'BTC']), { generatedAt: original.generatedAt, rows: [...original.rows].reverse() });
  for (const row of payload.rows) assert.deepEqual(Object.keys(row).sort(), ['symbol', 'price', 'change24hPct', 'fundingBinance', 'fundingOkx', 'liquidations24hUsd'].sort());
  assert.ok(JSON.stringify(payload).length < JSON.stringify(feed).length / 10);
  assert.equal(marketAssetSnapshot(feed, ['UNOBSERVED']), null);
});

test('single and multiple symbols, five-item limit, deduplication and malformed queries', async () => {
  assert.deepEqual(parseMarketAssetSymbols(url('symbol=btc').searchParams), ['BTC']);
  assert.deepEqual(parseMarketAssetSymbols(url('symbols=BTC,BTC,ETH').searchParams), ['BTC', 'ETH']);
  assert.deepEqual(parseMarketAssetSymbols(url('symbols=A,B,C,D,E').searchParams), ['A', 'B', 'C', 'D', 'E']);
  for (const query of ['', 'symbol=', 'symbols=BTC,', 'symbol=BTC,ETH', 'symbols=A,B,C,D,E,F', 'symbols=BTC&symbol=ETH', 'symbol=BTC&symbol=ETH', 'symbols=BTC&symbols=ETH', 'symbol=BTC%2FUSDT', 'symbol=%3Cscript%3E']) {
    let reads = 0;
    const response = await request(query, { MARKET_EVENTS_READ: async () => { reads++; return feed; } });
    assert.equal(response.status, 400, query);
    assert.deepEqual(await response.json(), { error: 'INVALID_SYMBOLS' });
    assert.equal(reads, 0);
  }
  const five = { generatedAt: feed.generatedAt, market: { majors: ['A', 'B', 'C', 'D', 'E'].map(symbol => ({ symbol, price: 1 })) } };
  assert.equal((await request('symbols=A,B,C,D,E', { MARKET_EVENTS_READ: async () => five })).status, 200);
  assert.equal((await request('symbol=btc', { MARKET_EVENTS_READ: async () => feed })).status, 200);
});

test('unknown and mixed unknown symbols are 404; cold outages and invalid clocks are 503', async () => {
  for (const query of ['symbol=UNOBSERVED', 'symbols=BTC,UNOBSERVED']) {
    const response = await request(query, { MARKET_EVENTS_READ: async () => feed });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'UNKNOWN_SYMBOL' });
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  for (const read of [async () => null, async () => { throw new Error('offline'); }, async () => ({ generatedAt: 'invalid' })]) {
    const response = await marketAssetResponse(url('symbol=BTC'), read);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'MARKET_FEED_UNAVAILABLE' });
  }
});

test('Node reader shares 60s cache, retains original data clock on outage and recovers', async () => {
  let clock = Date.parse(feed.generatedAt), calls = 0, offline = false;
  const reader = createMarketEventsReader({ now: () => clock, fetchImpl: async () => {
    calls++;
    if (offline) throw new Error('offline');
    return Response.json(feed);
  } });
  const env = { MARKET_EVENTS_READ: reader.read };
  const first = await (await request('symbol=BTC', env)).json();
  await request('symbol=ETH', env);
  assert.equal(calls, 1);
  clock += 59_999;
  await request('symbol=BTC', env);
  assert.equal(calls, 1);
  clock++;
  offline = true;
  const staleResponse = await request('symbol=BTC', env);
  assert.equal(staleResponse.status, 200);
  assert.deepEqual(await staleResponse.json(), { ...first, stale: true });
  assert.equal(calls, 2);
  clock += 60_000;
  offline = false;
  assert.equal((await (await request('symbol=BTC', env)).json()).stale, false);
  assert.equal(calls, 3);
  const cold = createMarketEventsReader({ fetchImpl: async () => { throw new Error('offline'); } });
  assert.equal((await request('symbol=BTC', { MARKET_EVENTS_READ: cold.read })).status, 503);
});

test('assets-only Worker caches across symbols and retains stale data on outage', async () => {
  const originalNow = Date.now;
  let clock = Date.parse(feed.generatedAt), reads = 0, offline = false;
  Date.now = () => clock;
  try {
    const env = { ASSETS: { fetch: async () => { reads++; return offline ? new Response('', { status: 503 }) : Response.json(feed); } } };
    const first = await (await request('symbol=BTC', env)).json();
    await request('symbol=ETH', env);
    assert.equal(reads, 1);
    clock += 60_000;
    offline = true;
    assert.deepEqual(await (await request('symbol=BTC', env)).json(), { ...first, stale: true });
    assert.equal(reads, 2);
    clock += 60_000;
    offline = false;
    assert.equal((await (await request('symbol=BTC', env)).json()).stale, false);
    assert.equal((await request('symbol=BTC', { ASSETS: { fetch: async () => new Response('', { status: 503 }) } })).status, 503);
  } finally { Date.now = originalNow; }
});

test('partial article coverage still refreshes available assets after a mixed-request 404', async () => {
  const { fetchArticleMarketContext } = await import('../src/components/v3/news/article-market-context-fetch.js');
  const partialFeed = { generatedAt: feed.generatedAt, market: { majors: feed.market.majors.filter(row => row.symbol.startsWith('BTC')) } };
  const env = { MARKET_EVENTS_READ: async () => partialFeed };
  const requests = [], controller = new AbortController();
  const result = await fetchArticleMarketContext(url('symbols=BTC,SOL').href, { signal: controller.signal }, ['BTC', 'SOL'], async (href, init) => {
    assert.equal(init.signal, controller.signal);
    requests.push(href);
    return worker.fetch(new Request(new URL(href, 'https://nexualpha.com')), env);
  });
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { ...marketAssetSnapshot(partialFeed, ['BTC']), stale: false });
  assert.equal(requests.length, 3);
  assert.ok(requests.every(href => !href.includes('/intel/')));
});


test('bounded SSR reads retain the last good frame while a slow refresh continues', async () => {
  let clock = Date.parse(feed.generatedAt), resolveSlow, calls = 0;
  const reader = createMarketEventsReader({ now: () => clock, timeoutMs: 1000, fetchImpl: async () => {
    if (++calls === 1) return Response.json(feed);
    return new Promise(resolve => { resolveSlow = resolve; });
  } });
  const original = await reader.read();
  clock += 60_000;
  const stale = await reader.read({ waitMs: 5 });
  assert.deepEqual(stale, { ...original, stale: true });
  resolveSlow(Response.json(feed));
  await reader.refresh();
  assert.deepEqual(await reader.read(), original);
});
