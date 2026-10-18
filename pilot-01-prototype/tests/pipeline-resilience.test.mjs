import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createMarketEventsReader } from '../server/market-events-feed.mjs';
import { createJsonSnapshotReader } from '../server/intel-tools-feed.mjs';
import { createTickerFeed } from '../server/ticker-feed.mjs';
import { createPositionRadar } from '../server/position-radar.mjs';

const at = '2026-10-15T00:00:00.000Z';
const market = { generatedAt: at, market: { majors: ['BTC','ETH','SOL'].map(symbol => ({ symbol: `${symbol}USDT`, price: 100, change24hPct: 1 })) } };
test('market reader retains last good source clock and marks stale after outage beyond prior expiry', async () => {
  let clock = Date.parse(at), down = false;
  const reader = createMarketEventsReader({ now: () => clock, ttlMs: 10, staleMs: 50,
    fetchImpl: async () => { if (down) throw new Error('DNS not ready'); return Response.json(market); } });
  assert.equal((await reader.read()).generatedAt, at);
  down = true; clock += 100;
  const retained = await reader.read();
  assert.equal(retained?.generatedAt, at);
  assert.equal(retained?.stale, true);
  down = false; clock += 20;
  assert.equal((await reader.read()).stale, true, 'reading an unchanged old file does not renew its source clock');
});
test('ticker collector fallback preserves stale flag and timestamp on cold server start', async () => {
  const ticker = createTickerFeed({ now: () => Date.parse(at) + 1e6, fetchImpl: async () => { throw new Error('offline'); },
    readMarketEvents: async () => ({ ...market, stale: true }) });
  const response = await ticker.respond();
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.stale, true);
  assert.equal(payload.generatedAt, at);
});
test('intel reader retains runtime data with explicit stale flag after file disappears, and recovers', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'intel-outage-'));
  const file = path.join(dir, 'feed.json'); let clock = Date.parse(at);
  try {
    await writeFile(file, JSON.stringify({ generatedAt: at, rows: [1] }));
    const reader = createJsonSnapshotReader({ file, ttlMs: 10, now: () => clock });
    assert.deepEqual((await reader.read()).rows, [1]);
    await rm(file); clock += 11;
    const response = await reader.respond();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).stale, true);
    await writeFile(file, JSON.stringify({ generatedAt: new Date(clock).toISOString(), rows: [2] })); clock += 11;
    assert.ok(!(await reader.read()).stale);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('whale file reader preserves collector degraded flag despite a fresh heartbeat', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'whale-outage-')); const file = path.join(dir, 'whales.json');
  try {
    await writeFile(file, JSON.stringify({ status: 'ok', updatedAt: at, stale: true, rows: [{ id: 'real-existing-row', category: 'transfer', chain: 'bitcoin' }] }));
    const radar = createPositionRadar({ now: () => Date.parse(at), whaleFileOnly: true, whaleSnapshotFile: file });
    assert.equal((await radar.read('whales')).stale, true);
    await rm(file);
    assert.equal((await radar.refresh('whales')).stale, true);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('whale sources start independently before a slow source completes', async () => {
  let release, btcStarted = false;
  const gate = new Promise(resolve => { release = resolve; });
  const radar = createPositionRadar({ whaleSnapshotFile: null, whaleSources: {
    hyperliquid: async () => { await gate; return []; },
    btcMempool: async () => { btcStarted = true; return []; },
    tronTronscan: async () => { throw new Error('Tronscan timeout'); },
  } });
  const run = radar.refresh('whales');
  await new Promise(resolve => setImmediate(resolve));
  const independent = btcStarted;
  release(); await run;
  assert.equal(independent, true);
});

test('unchanged collector snapshot becomes stale even while its file remains readable', async () => {
  const clock = Date.parse(at) + 1000;
  const reader = createMarketEventsReader({ now: () => clock, staleMs: 50, fetchImpl: async () => Response.json(market) });
  assert.equal((await reader.read()).stale, true);
});

test('partial collector recovery cannot renew cached ticker prices when the market source failed', async () => {
  const ticker = createTickerFeed({ now: () => Date.parse(at), fetchImpl: async () => { throw new Error('offline'); },
    readMarketEvents: async () => ({ ...market, stale: false, sourceStatus: { markets: { status: 'error' }, headlines: { status: 'ok' } } }) });
  assert.equal((await ticker.read()).stale, true);
});
