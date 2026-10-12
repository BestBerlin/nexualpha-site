import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CollectorError, normalizeItem } from './common.mjs';
import { poll, supports } from './market.mjs';

const fixture = name => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));
const now = new Date('2026-10-12T00:00:00.000Z');
const sources = {
  mempool: { id: 'mempool-space', name: 'mempool.space REST', url: 'https://mempool.space/api/blocks/tip/height' },
  blockchair: { id: 'blockchair-bitcoin-stats', name: 'Blockchair Bitcoin stats', url: 'https://api.blockchair.com/bitcoin/stats' },
  stablecoins: { id: 'defillama-stablecoins', name: 'DefiLlama stablecoins', url: 'https://stablecoins.llama.fi/stablecoins' },
  hacks: { id: 'defillama-hacks', name: 'DefiLlama hacks', url: 'https://api.llama.fi/hacks' },
  hyperliquid: { id: 'hyperliquid-info', name: 'Hyperliquid POST /info official API', url: 'https://api.hyperliquid.xyz/info' },
  binance: { id: 'binance-futures-24hr', name: 'Binance futures 24h ticker', url: 'https://fapi.binance.com/fapi/v1/ticker/24hr' },
  own: { id: 'nexualpha-market-events', name: 'NexuAlpha market-events feed', url: 'https://nexualpha.com/intel/market-events.json' },
};

function requestFrom(map, calls = []) {
  return async (url, options = {}) => {
    calls.push({ url, options });
    assert.ok(Object.hasOwn(map, url), `unexpected URL ${url}`);
    return structuredClone(map[url]);
  };
}

function assertMetricsAreNumeric(items) {
  for (const row of items) {
    assert.ok(row.external_id && row.url && row.title && Object.hasOwn(row, 'published_at'), `raw item shape ${JSON.stringify(row)}`);
    for (const [key, value] of Object.entries(row.metrics ?? {})) {
      if (key === 'provenance') {
        assert.equal(typeof value, 'object', `${row.external_id} metrics.provenance is structured`);
        continue;
      }
      assert.equal(typeof value, 'number', `${row.external_id} metrics.${key} is numeric`);
      assert.ok(Number.isFinite(value), `${row.external_id} metrics.${key} finite`);
    }
  }
}

test('supports only the named on-chain and market feeds owned by this module', () => {
  assert.equal(supports(sources.mempool), true);
  assert.equal(supports({ id: 'etherscan-v2', platform: 'onchain', url: 'https://api.etherscan.io/v2/api' }), false);
  assert.equal(supports({ id: 'defillama-protocols', platform: 'onchain', url: 'https://api.llama.fi/protocols' }), false);
  assert.equal(supports({ id: 'unknown-market', platform: 'market', url: 'https://example.com/feed.json' }), false);
});

test('mempool.space and Blockchair produce Bitcoin congestion anomaly items', async () => {
  const mempool = fixture('market-mempool');
  const mempoolItems = await poll(sources.mempool, null, { now, request: requestFrom({
    [sources.mempool.url]: mempool.tipHeight,
    'https://mempool.space/api/v1/fees/recommended': mempool.fees,
  }) });
  assert.equal(mempoolItems.length, 1);
  assert.equal(mempoolItems[0].event_type_guess, 'liquidity_anomaly');
  assert.equal(mempoolItems[0].published_at, null);
  assert.equal(mempoolItems[0].metrics.fastest_fee_sat_vb, 142);
  assert.equal(mempoolItems[0].metrics.provenance.kind, 'bitcoin_fee_pressure');

  const blockchairItems = await poll(sources.blockchair, null, { now, request: requestFrom({ [sources.blockchair.url]: fixture('market-blockchair') }) });
  assert.equal(blockchairItems.length, 1);
  assert.equal(blockchairItems[0].metrics.mempool_transactions, 131442);
  assert.equal(blockchairItems[0].metrics.suggested_fee_sat_vb, 68);
  assertMetricsAreNumeric([...mempoolItems, ...blockchairItems]);
});

test('DefiLlama stablecoins emits depeg and supply move items, and hacks emits only material losses', async () => {
  const stablecoinItems = await poll(sources.stablecoins, null, { now, request: requestFrom({ [sources.stablecoins.url]: fixture('market-defillama-stablecoins') }) });
  assert.deepEqual(stablecoinItems.map(row => row.metrics.provenance.symbol).sort(), ['FLOWUSD', 'TESTUSD']);
  assert.equal(stablecoinItems.find(row => row.metrics.provenance.symbol === 'TESTUSD').event_type_guess, 'stablecoin_depeg');
  assert.equal(stablecoinItems.find(row => row.metrics.provenance.symbol === 'FLOWUSD').event_type_guess, 'flows');
  assert.ok(!stablecoinItems.some(row => row.title.includes('EURS')), 'non-USD pegs are skipped');

  const hackItems = await poll(sources.hacks, null, { now, request: requestFrom({ [sources.hacks.url]: fixture('market-defillama-hacks') }) });
  assert.equal(hackItems.length, 1);
  assert.equal(hackItems[0].event_type_guess, 'hack_exploit');
  assert.equal(hackItems[0].metrics.amount_usd, 12500000);
  assert.equal(hackItems[0].published_at, '2026-10-11T00:00:00.000Z');
  assertMetricsAreNumeric([...stablecoinItems, ...hackItems]);
});

test('Hyperliquid info API preserves open-interest and funding context from metaAndAssetCtxs', async () => {
  const calls = [];
  const items = await poll(sources.hyperliquid, null, { now, request: requestFrom({ [sources.hyperliquid.url]: fixture('market-hyperliquid-info') }, calls) });
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(JSON.parse(calls[0].options.body).type, 'metaAndAssetCtxs');
  assert.ok(items.some(row => row.metrics.provenance.kind === 'hyperliquid_open_interest' && row.metrics.provenance.symbol === 'BTC' && row.metrics.open_interest_usd === 74400000));
  assert.ok(items.some(row => row.metrics.provenance.kind === 'hyperliquid_funding' && row.metrics.provenance.symbol === 'HYPE' && row.metrics.funding_rate === 0.00081));
  assertMetricsAreNumeric(items);
});

test('Binance futures covers 24h movers, funding extremes and open-interest changes without live requests', async () => {
  const calls = [];
  const items = await poll(sources.binance, null, { now, request: requestFrom({
    [sources.binance.url]: fixture('market-binance-ticker-24hr'),
    'https://fapi.binance.com/fapi/v1/premiumIndex': fixture('market-binance-premium-index'),
    'https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1h&limit=25': fixture('market-binance-oi-btc'),
    'https://fapi.binance.com/futures/data/openInterestHist?symbol=ETHUSDT&period=1h&limit=25': fixture('market-binance-oi-eth'),
    'https://fapi.binance.com/futures/data/openInterestHist?symbol=SOLUSDT&period=1h&limit=25': fixture('market-binance-oi-sol'),
  }, calls) });
  assert.ok(items.some(row => row.metrics.provenance.kind === 'binance_top_mover' && row.metrics.provenance.symbol === 'BTCUSDT'));
  assert.ok(items.some(row => row.metrics.provenance.kind === 'binance_funding' && row.metrics.provenance.symbol === 'BTCUSDT'));
  assert.ok(items.some(row => row.metrics.provenance.kind === 'binance_open_interest' && row.metrics.provenance.symbol === 'BTCUSDT' && row.metrics.open_interest_change_pct === 11 && row.metrics.provenance.window === '24h'));
  assert.equal(calls.length, 5);
  assertMetricsAreNumeric(items);
});

test('own market feed keeps liquidation windows separate with lower-bound and venue provenance', async () => {
  const items = await poll(sources.own, null, { now, request: requestFrom({ [sources.own.url]: fixture('market-own-feed') }) });
  const liquidations = items.filter(row => row.metrics.provenance.kind === 'liquidations');
  assert.deepEqual(liquidations.map(row => row.metrics.provenance.window).sort(), ['h1', 'h24']);
  assert.deepEqual(liquidations.map(row => row.metrics.total_liquidations_usd).sort((a, b) => a - b), [3344668, 6114135]);
  assert.equal(liquidations.reduce((sum, row) => sum + row.metrics.total_liquidations_usd, 0), 9458803, 'tests would catch accidental snapshot summing');
  for (const row of liquidations) {
    assert.equal(row.metrics.provenance.lower_bound, true);
    assert.deepEqual(row.metrics.provenance.venues, ['Binance USDT-M', 'OKX']);
    assert.ok(Array.isArray(row.metrics.provenance.coins) && row.metrics.provenance.coins.includes('OKX:SOLUSDT'));
  }
  assert.ok(items.some(row => row.metrics.provenance.kind === 'funding' && row.metrics.provenance.symbol === 'SOL'));
  assert.ok(items.some(row => row.metrics.provenance.kind === 'market_collector_event' && row.event_type_guess === 'price_move'));
  assertMetricsAreNumeric(items);
});

test('normalizeItem keeps market provenance inside persisted metrics', async () => {
  const items = await poll(sources.own, null, { now, request: requestFrom({ [sources.own.url]: fixture('market-own-feed') }) });
  const normalized = normalizeItem(items.find(row => row.metrics.provenance.kind === 'liquidations'), sources.own, { now });
  assert.equal(normalized.metrics.provenance.window, 'h1');
  assert.equal(normalized.metrics.provenance.lower_bound, true);
  assert.deepEqual(normalized.metrics.provenance.venues, ['Binance USDT-M', 'OKX']);
});

test('since filters snapshots and malformed responses fail closed', async () => {
  const old = await poll(sources.own, '2026-10-10T15:00:00.000Z', { now, request: requestFrom({ [sources.own.url]: fixture('market-own-feed') }) });
  assert.equal(old.length, 0);

  await assert.rejects(
    poll(sources.stablecoins, null, { now, request: requestFrom({ [sources.stablecoins.url]: { bad: true } }) }),
    error => error instanceof CollectorError && /Malformed DefiLlama stablecoins/.test(error.message),
  );
  await assert.rejects(
    poll(sources.hyperliquid, null, { now, request: requestFrom({ [sources.hyperliquid.url]: { bad: true } }) }),
    error => error instanceof CollectorError && /Malformed Hyperliquid info/.test(error.message),
  );
});
