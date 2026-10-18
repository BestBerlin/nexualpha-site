import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createMoversFeed } from '../server/movers-feed.mjs';
import { createStaleJsonFeed } from '../server/stale-json-feed.mjs';
import { radarSourceStale } from '../server/source-freshness.mjs';
import { createPositionRadar } from '../server/position-radar.mjs';
import { cycle } from '../../ops/market-collector/market-collector.mjs';
import worker from '../worker/index.js';

const at = Date.parse('2026-10-19T00:00:00Z');
const coins = { coins: ['BTC', 'ETH'].map((symbol, i) => ({ symbol, slug: symbol.toLowerCase(), rank: i + 1, price: 10 })) };
const market = (time = at) => ({ generatedAt: new Date(time).toISOString(), market: { generatedAt: new Date(time).toISOString(), majors: ['BTC', 'ETH'].map((symbol, i) => ({ symbol: `${symbol}USDT`, price: 10, change24hPct: i ? -2 : 2 })), movers: [], openInterest: [] } });

test('movers reject failed, future and expired collector data and recover with the next source frame', async () => {
  let payload = market();
  const feed = createMoversFeed({ now: () => at, readCoins: async () => coins, readMarketEvents: async () => payload });
  const first = await feed.read();
  for (const bad of [{ ...market(), sourceStatus: { markets: { status: 'error' } } }, { ...market(), stale: true }, { ...market(), market: { ...market().market, generatedAt: "invalid" } }, market(at + 1), { ...market(), market: market(at - 16 * 60_000).market }]) {
    payload = bad; await feed.refresh();
    assert.equal((await feed.read()).stale, true);
    assert.equal((await feed.read()).generatedAt, first.generatedAt);
  }
  payload = market(); await feed.refresh(); assert.ok(!(await feed.read()).stale);
});
test('expired Binance rows yield to the fresh collector rather than freezing the board', async () => {
  const rows = [{ symbol: 'BTCUSDT', lastPrice: '10', priceChangePercent: '2', quoteVolume: '100000000' }];
  rows.snapshotAt = at - 31_000;
  const feed = createMoversFeed({ now: () => at, readBinanceRows: async () => rows, readCoins: async () => coins, readMarketEvents: async () => market() });
  const data = await feed.read(); assert.equal(data.source, 'market-events'); assert.ok(!data.stale);
});
test('partial collector success retains the market source clock', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'market-clock-'));
  try {
    const outFile = path.join(dir, 'market.json');
    await writeFile(outFile, JSON.stringify(market()));
    const doc = await cycle({ outFile, stateFile: path.join(dir, 'state.json'), historyFile: path.join(dir, 'history.jsonl'), runner: { run: (_name, fn) => fn(), status: () => ({ markets: { status: 'error' }, headlines: { status: 'ok' } }) }, collectors: { markets: async () => { throw Error('offline'); }, headlines: async () => [{ title: 'existing test headline' }] } });
    assert.equal(doc.market.generatedAt, new Date(at).toISOString());
    assert.notEqual(doc.generatedAt, doc.market.generatedAt);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('whale source freshness uses the data clock, TTL boundary and failure flag', () => {
  const payload = { dataUpdatedAt: new Date(at).toISOString(), updatedAt: new Date(at + 100_000).toISOString(), ttlSeconds: 60 };
  assert.equal(radarSourceStale(payload, at + 59_999), false);
  assert.equal(radarSourceStale(payload, at + 60_000), true);
  assert.equal(radarSourceStale({ ...payload, ttlSeconds: 10 }, at + 10_000), true);
  for (const extra of [{ stale: true }, { dataUpdatedAt: 'invalid' }, { dataUpdatedAt: new Date(at + 1).toISOString() }]) assert.equal(radarSourceStale({ ...payload, ...extra }, at), true);
});
test('healthy whale data remains fresh during cache refresh and expires without renewing its source clock', async () => {
  let clock = at;
  const payload = { dataUpdatedAt: new Date(at).toISOString(), ttlSeconds: 60 };
  const feed = createStaleJsonFeed({ ttlMs: 10_000, now: () => clock, isSourceStale: radarSourceStale, load: async () => payload });
  await feed.read(); clock += 10_001;
  assert.ok(!(await feed.read()).stale);
  await feed.refresh(); clock = at + 60_000;
  assert.equal((await feed.read()).stale, true);
});
test('cached whale file data ages out before the next internal cache refresh', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'whale-clock-')); let clock = at + 59_000;
  try {
    const file = path.join(dir, 'whales.json');
    await writeFile(file, JSON.stringify({ status: 'ok', dataUpdatedAt: new Date(at).toISOString(), rows: [{ id: 'existing', category: 'transfer', chain: 'bitcoin' }] }));
    const radar = createPositionRadar({ now: () => clock, whaleFileOnly: true, whaleSnapshotFile: file });
    assert.ok(!(await radar.read('whales')).stale); clock += 1000;
    assert.equal((await radar.read('whales')).stale, true);
    await writeFile(file, JSON.stringify({ status: 'ok', dataUpdatedAt: new Date(clock).toISOString(), rows: [{ id: 'recovered', category: 'transfer', chain: 'bitcoin' }] }));
    assert.ok(!(await radar.read('whales')).stale, 'source expiry triggers a file refresh before the cache timer expires');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('whale API variants prevent nginx/browser caching of freshness decisions', async () => {
  const env = { RADAR_READ: async () => ({ status: 'ok', updatedAt: new Date().toISOString(), ttlSeconds: 60, rows: [{ id: 'existing', kind: 'position', coin: 'BTC', sizeUsd: 2_000_000, side: 'long' }] }) };
  for (const query of ['', '?view=home', '?view=home&locale=en']) {
    const response = await worker.fetch(new Request(`https://nexualpha.com/api/whales.json${query}`), env);
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.ok(!(await response.json()).stale);
  }
});
