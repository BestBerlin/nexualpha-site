import test from 'node:test';
import assert from 'node:assert/strict';
import { createStaleJsonFeed } from '../server/stale-json-feed.mjs';
import { createTickerFeed, TICKER_CACHE_CONTROL } from '../server/ticker-feed.mjs';
import { createMoversFeed } from '../server/movers-feed.mjs';

const CACHE = 'public, max-age=10, stale-while-revalidate=60';
test('stale payload survives extended errors with original generatedAt, headers and HEAD', async () => {
  let clock = 0, fail = false, calls = 0;
  const payload = { generatedAt: '2026-10-13T00:00:00Z', items: [1] };
  const feed = createStaleJsonFeed({ now: () => clock, load: async () => { calls++; if (fail) throw Error('offline'); return payload; } });
  assert.deepEqual(await (await feed.respond()).json(), payload);
  clock += 86400000; fail = true;
  const res = await feed.respond();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), CACHE);
  assert.deepEqual(await res.json(), { ...payload, stale: true });
  await feed.refresh();
  const before = calls;
  await feed.respond(); await feed.respond();
  assert.equal(calls, before, 'failed refreshes are rate limited');
  assert.equal(await (await feed.respond('HEAD')).text(), '');
  fail = false; clock += 15001; await feed.refresh();
  assert.deepEqual(await feed.read(), payload, 'successful refresh clears stale');
});
test('cold requests share one refresh and time out even if the source ignores abort', async () => {
  let calls = 0, signal, clock = 0;
  const feed = createStaleJsonFeed({ now: () => clock, timeoutMs: 20, load: async (s) => { calls++; signal = s; return new Promise(() => {}); } });
  const results = await Promise.all(Array.from({ length: 12 }, () => feed.respond()));
  assert.equal(calls, 1);
  assert.equal(signal.aborted, true);
  clock = 30000; await feed.respond();
  assert.equal(calls, 1, 'a timed-out source that ignores abort keeps ownership of the flight');
  for (const res of results) { assert.equal(res.status, 503); assert.equal(res.headers.get('cache-control'), 'no-store'); }
});
test('late timed-out payload cannot overwrite a good snapshot', async () => {
  let clock = 0, resolve;
  const good = { generatedAt: 'original' };
  const feed = createStaleJsonFeed({ now: () => clock, timeoutMs: 20, load: async () => clock ? new Promise((r) => { resolve = r; }) : good });
  await feed.read(); clock = 30000;
  await feed.refresh(); resolve({ generatedAt: 'late' });
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(await feed.read(), { ...good, stale: true });
});
test('ticker and movers retain good snapshots past their former ten-minute cutoff', async () => {
  let clock = 0, fail = false;
  const market = { generatedAt: '2026-10-13T00:00:00Z', market: { majors: ['BTC', 'ETH', 'SOL'].map((sym) => ({ symbol: `${sym}USDT`, price: 10, change24hPct: 1 })), movers: [] } };
  const ticker = createTickerFeed({ now: () => clock, fetchImpl: async () => { throw Error('offline'); }, readMarketEvents: async () => fail ? null : market });
  const movers = createMoversFeed({ now: () => clock, readMarketEvents: async () => fail ? null : market,
    readCoins: async () => ({ coins: [{ rank: 1, symbol: 'BTC', slug: 'bitcoin', name: 'Bitcoin', price: 10 }] }) });
  for (const feed of [ticker, movers]) assert.equal((await feed.respond()).status, 200);
  clock = 86400000; fail = true;
  for (const feed of [ticker, movers]) {
    await feed.refresh();
    const res = await feed.respond(); assert.equal(res.status, 200); assert.equal(res.headers.get('cache-control'), feed === ticker ? TICKER_CACHE_CONTROL : CACHE);
    assert.equal((await res.json()).stale, true);
  }
});
test('warm requests return stale immediately while sharing one background refresh', async () => {
  let clock = 0, calls = 0, resolve;
  const feed = createStaleJsonFeed({ now: () => clock, load: async () => {
    calls++; return calls === 1 ? { generatedAt: 'first' } : new Promise((r) => { resolve = r; });
  } });
  await feed.read(); clock = 16000;
  const results = await Promise.all(Array.from({ length: 12 }, () => feed.read()));
  assert.equal(calls, 2);
  for (const result of results) assert.deepEqual(result, { generatedAt: 'first', stale: true });
  resolve({ generatedAt: 'second' }); await feed.refresh();
  assert.deepEqual(await feed.read(), { generatedAt: 'second' });
});
test('expired Binance rows cannot be rebuilt as newly generated movers during an outage', async () => {
  let clock = 0, fail = false;
  const rows = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT'].map((sym) => ({ symbol: `${sym}USDT`, lastPrice: '10', priceChangePercent: '1', quoteVolume: '100000000' }));
  const ticker = createTickerFeed({ now: () => clock, fetchImpl: async () => {
    if (fail) throw Error('offline'); return Response.json(rows);
  } });
  const movers = createMoversFeed({ now: () => clock, readBinanceRows: ticker.readRows,
    readCoins: async () => ({ coins: rows.map((row, i) => ({ rank: i + 1, symbol: row.symbol.slice(0, -4), slug: row.symbol.slice(0, -4).toLowerCase(), name: row.symbol, price: 10 })) }) });
  const good = await movers.read(); assert.ok(good);
  fail = true; clock = 31000;
  await ticker.refresh(); await movers.refresh();
  const stale = await movers.read();
  assert.equal(stale.stale, true);
  assert.equal(stale.generatedAt, good.generatedAt);
});
test('a cold endpoint can serve the backing reader’s already-stale good frame', async () => {
  const payload = { generatedAt: 'original', items: [1], stale: true };
  const feed = createStaleJsonFeed({ load: async () => payload });
  const response = await feed.respond();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), payload);
});

test('wide ticker rows survive the 15s TTL without a forged movers clock', async () => {
  let clock = 1000, fail = false;
  const rows = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT'].map((sym, i) => ({ symbol: `${sym}USDT`, lastPrice: '10', priceChangePercent: String(i < 5 ? i + 1 : -i), quoteVolume: '100000000' }));
  const ticker = createTickerFeed({ now: () => clock, fetchImpl: async () => { if (fail) throw Error('offline'); return Response.json(rows); } });
  const coins = { coins: rows.map((row, i) => ({ rank: i + 1, symbol: row.symbol.slice(0, -4), slug: row.symbol.slice(0, -4).toLowerCase(), price: 10 })) };
  const movers = createMoversFeed({ now: () => clock, readBinanceRows: ticker.readRows, readCoins: async () => coins });
  const good = await movers.read();
  assert.equal(good.up.length, 5); assert.equal(good.down.length, 5);
  fail = true; clock = 32000;
  await ticker.refresh();
  assert.equal((await ticker.readRows()).length, 10);
  await movers.refresh();
  const stale = await movers.read();
  assert.equal(stale.generatedAt, good.generatedAt); assert.equal(stale.stale, true);
  assert.equal(stale.down.length, 5);
  clock = 602000;
  assert.equal(await ticker.readRows(), null);
  await movers.refresh();
  assert.equal((await movers.read()).down.length, 5);
});

test('a degraded one-sided refresh cannot erase a last good losers list', async () => {
  let clock = 1000, degraded = false;
  const rows = ['BTC', 'ETH'].map((sym, i) => ({ symbol: `${sym}USDT`, lastPrice: '10', priceChangePercent: i ? '-2' : '2', quoteVolume: '100000000' }));
  const feed = createMoversFeed({ now: () => clock, readBinanceRows: async () => degraded ? rows.slice(0, 1) : rows,
    readCoins: async () => ({ coins: rows.map((r, i) => ({ rank: i + 1, symbol: r.symbol.slice(0, -4), slug: r.symbol.slice(0, -4).toLowerCase(), price: 10 })) }) });
  const good = await feed.read(); degraded = true; clock = 32000;
  await feed.refresh();
  const next = await feed.read();
  assert.equal(next.down.length, 1); assert.equal(next.generatedAt, good.generatedAt); assert.equal(next.stale, true);
});
