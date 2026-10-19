import test from 'node:test';
import assert from 'node:assert/strict';
import { createTickerFeed } from '../server/ticker-feed.mjs';
import { isTickerSourceStale, tickerMetricsFromMarketEvents, tickerFromBinance, tickerFromMarketEvents } from '../src/data/ticker.js';
const epoch = Date.parse('2026-10-19T00:00:00Z');
const rows = ['BTC', 'ETH', 'SOL', 'DOGE', 'HYPE'].map((sym) => ({ symbol: `${sym}USDT`, lastPrice: '12', priceChangePercent: '1', quoteVolume: '100000000' }));
test('ticker freshness expires at max(4 TTL, two minutes), independent of refresh cadence', () => {
  const frame = tickerFromBinance(rows, { now: epoch });
  for (const age of [6000, 119999]) assert.equal(isTickerSourceStale(frame, epoch + age), false);
  assert.equal(isTickerSourceStale(frame, epoch + 120000), true);
  assert.equal(isTickerSourceStale(frame, epoch + 159999, 40000), false);
  assert.equal(isTickerSourceStale(frame, epoch + 160000, 40000), true);
  assert.equal(isTickerSourceStale({ ...frame, generatedAt: 'invalid' }, epoch), true);
  assert.equal(isTickerSourceStale(frame, epoch - 1), true);
});
test('refreshing seconds-old ticker stays fresh; a failed refresh marks retained data stale', async () => {
  let clock = epoch, fail = false;
  const feed = createTickerFeed({ now: () => clock, fetchImpl: async () => {
    if (fail) throw new Error('offline');
    return Response.json(rows);
  } });
  await feed.read();
  clock += 6000;
  assert.equal((await feed.read()).stale, undefined);
  await feed.refresh();
  fail = true;
  await feed.refresh();
  assert.equal((await feed.read()).stale, true);
});
test('collector freshness allows its five-minute cadence and preserves upstream failures', async () => {
  const market = { generatedAt: new Date(epoch).toISOString(), market: { majors: rows.slice(0, 3).map((r) => ({ symbol: r.symbol, price: r.lastPrice, change24hPct: r.priceChangePercent })), movers: [{ symbol: 'HYPEUSDT', price: 40, change24hPct: 2 }] } };
  const frame = tickerFromMarketEvents(market);
  assert.equal(isTickerSourceStale(frame, epoch + 5 * 60000), false);
  assert.equal(isTickerSourceStale(frame, epoch + 15 * 60000), true);
  assert.deepEqual(frame.items.map((r) => r.sym), ['BTC', 'ETH', 'SOL', 'HYPE']);
  const feed = createTickerFeed({ now: () => epoch + 5 * 60000, fetchImpl: async () => { throw new Error('offline'); }, readMarketEvents: async () => market });
  assert.equal((await feed.read()).stale, undefined);
  market.stale = true;
  await feed.refresh();
  assert.equal((await feed.read()).stale, true);
});
test('DOGE and HYPE appear only when present in upstream rows', () => {
  assert.deepEqual(tickerFromBinance(rows, { now: epoch }).items.map((r) => r.sym), ['BTC', 'ETH', 'SOL', 'DOGE', 'HYPE']);
  assert.deepEqual(tickerFromBinance(rows.slice(0, 3), { now: epoch }).items.map((r) => r.sym), ['BTC', 'ETH', 'SOL']);
});

test('optional context uses verified collector fields and omits missing, expired, invalid and failed fields', () => {
  const market = { generatedAt: new Date(epoch).toISOString(), funding: { rows: [{ symbol: 'BTC', binanceRate: 0.0000326 }] }, liquidations: { h24: { totalUsd: 455972370 } } };
  assert.deepEqual(tickerMetricsFromMarketEvents(market, epoch), [
    { id: 'btc-funding', label: 'BTC funding', value: '+0.0033%' },
    { id: 'liquidations-24h', label: '24h observed liquidations', value: '$455.97M' },
  ]);
  assert.deepEqual(tickerMetricsFromMarketEvents({}, epoch), []);
  assert.deepEqual(tickerMetricsFromMarketEvents(market, epoch + 900000), []);
  assert.deepEqual(tickerMetricsFromMarketEvents({ ...market, stale: true }, epoch), []);
  assert.deepEqual(tickerMetricsFromMarketEvents({ ...market, sourceStatus: { funding: { status: 'error' }, liquidations: { status: 'error' } } }, epoch), []);
  assert.deepEqual(tickerMetricsFromMarketEvents({ ...market, funding: { rows: [{ symbol: 'BTC', binanceRate: null }] }, liquidations: { h24: { totalUsd: null } } }, epoch), []);
});
