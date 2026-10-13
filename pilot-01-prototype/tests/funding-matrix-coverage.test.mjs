import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FUNDING_MATRIX_SOURCES, buildFundingMatrixSnapshot, createFundingMatrixReader, mexcContractMap, HTX_FUNDING_HOSTS } from '../server/funding-matrix.mjs';

const fixture = JSON.parse(await readFile(new URL('./fixtures/funding-matrix/recorded-responses.json', import.meta.url), 'utf8'));
const readAt = fixture.recordedAt;
const replay = async (url) => {
  const body = fixture.responses[url];
  if (!body) return new Response('{}', { status: 404 });
  return Response.json(body);
};

test('recorded public responses provide at least 50 matrix symbols for each required venue', async () => {
  const sources = Object.fromEntries(['binance', 'okx', 'bybit', 'bitget', 'gate-io', 'mexc'].map((venue) => [venue, FUNDING_MATRIX_SOURCES[venue]]));
  const matrix = await buildFundingMatrixSnapshot({ now: Date.parse(readAt), fetchImpl: replay, sources });
  for (const venue of Object.keys(sources)) {
    assert.ok(matrix.coverage[venue].count >= 50, `${venue}: ${matrix.coverage[venue].count}`);
    assert.equal(matrix.coverage[venue].lastSuccessAt, new Date(readAt).toISOString());
    assert.equal(new Set(matrix.coverage[venue].symbolsWithData).size, matrix.coverage[venue].count);
  }
});

test('MEXC maps size-independent funding through recorded underlying metadata', async () => {
  const detail = fixture.responses['https://contract.mexc.com/api/v1/contract/detail'];
  const mapping = mexcContractMap(detail);
  for (const [symbol, contract] of [['1000PEPE', 'PEPE_USDT'], ['1000SHIB', 'SHIB_USDT'], ['1000BONK', '1000BONK_USDT'], ['1000SATS', 'SATS_USDT'], ['1000FLOKI', 'FLOKI_USDT']]) {
    assert.equal(mapping.get(symbol), contract);
  }
  assert.equal(mexcContractMap({ data: detail.data.map((row) => ({ ...row, contractSize: 0 })) }).size, 0);
  assert.equal(mexcContractMap({ data: detail.data.map((row) => ({ ...row, displayName: 'unrelated' })) }).size, 0);
  const rows = await FUNDING_MATRIX_SOURCES.mexc(replay, { readAt });
  const pepe = rows.find((row) => row.symbol === '1000PEPE');
  assert.equal(pepe.rate, fixture.responses['https://contract.mexc.com/api/v1/contract/funding_rate/PEPE_USDT'].data.fundingRate);
});

test('Bitget uses one bulk request on success and bounded retry after failure', async () => {
  let calls = 0;
  const load = (failures) => FUNDING_MATRIX_SOURCES.bitget(async (url) => {
    calls += 1;
    assert.equal(new URL(url).searchParams.has('symbol'), false);
    return calls <= failures ? new Response('{}', { status: 429 }) : replay(url);
  }, { readAt });
  assert.ok((await load(0)).length >= 50);
  assert.equal(calls, 1);
  calls = 0;
  assert.ok((await load(1)).length >= 50);
  assert.equal(calls, 2);
  calls = 0;
  await assert.rejects(load(3), /HTTP 429/);
  assert.equal(calls, 3);
});

test('HTX tries public alternatives and fails closed on missing intervals', async () => {
  const calls = [];
  const rows = await FUNDING_MATRIX_SOURCES.htx(async (url) => { calls.push(new URL(url).hostname); return replay(url); }, { readAt });
  assert.equal(rows.length, 0, 'reachable recorded HTX payload has no next_funding_time');
  assert.deepEqual(calls, HTX_FUNDING_HOSTS);
  const valid = { status: 'ok', data: [{ symbol: 'BTC', funding_rate: '0.0001', funding_time: 1791878400000, next_funding_time: 1791907200000 }] };
  let attempts = 0;
  const available = await FUNDING_MATRIX_SOURCES.htx(async () => ++attempts === 1 ? new Response('{}', { status: 503 }) : Response.json(valid), { readAt });
  assert.equal(available.length, 1);
  assert.equal(attempts, 2);
});

test('coverage preserves last success without retaining unavailable quotes or spread edges', async () => {
  let now = Date.parse(readAt);
  let available = true;
  const btc = (venue, rate) => ({ venue, symbol: 'BTC', rate, intervalHours: 8 });
  const reader = createFundingMatrixReader({ now: () => now, ttlMs: 1000, sources: {
    binance: async () => [btc('binance', 0.0001)],
    okx: async () => [btc('okx', 0.0002)],
    htx: async () => available ? [btc('htx', 0.001)] : [],
  } });
  const first = await reader.read();
  available = false;
  now += 2000;
  const second = await reader.read();
  assert.equal(second.coverage.htx.status, 'unavailable');
  assert.equal(second.coverage.htx.count, 0);
  assert.equal(second.coverage.htx.lastSuccessAt, first.generatedAt);
  assert.equal(second.rows[0].venues.htx, undefined);
  assert.equal(second.rows[0].maxSpread.shortVenue, 'okx');
});
