import test from 'node:test';
import viteConfig from '../vite.config.mjs';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createNewsSsrRenderer } from '../server/news-ssr.mjs';
import { createStaleJsonFeed } from '../server/stale-json-feed.mjs';
import { createFundingMatrixReader } from '../server/funding-matrix.mjs';
import worker from '../worker/index.js';
import { createSsrHarness, SHELL_HTML } from './helpers/ssr-hydration-harness.mjs';

const tick = () => new Promise(resolve => setImmediate(resolve));
const snapshot = JSON.parse(await readFile(new URL('./fixtures/funding-matrix/production-2026-10-19.json', import.meta.url), 'utf8'));
const assets = { fetch: async () => new Response(SHELL_HTML, { headers: { 'content-type': 'text/html' } }) };

test('matrix deadline accepts a 3.2s cold loader and JSON second request serves data', async (t) => {
  let calls = 0;
  const env = { FUNDING_MATRIX_READ: async () => {
    calls++;
    await new Promise(resolve => setTimeout(resolve, 3200));
    return snapshot;
  } };
  const start = performance.now();
  const first = await worker.fetch(new Request('https://nexualpha.com/intel/funding-matrix.json'), env);
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), snapshot);
  const second = await worker.fetch(new Request('https://nexualpha.com/intel/funding-matrix.json'), env);
  assert.equal(second.status, 200);
  assert.equal(calls, 1);
  t.diagnostic(`slow collector first/second requests: ${(performance.now() - start).toFixed(1)}ms total`);
});

test('opted-in current flight publishes after timeout, retains stale on failure, rejects superseded flights', async () => {
  let clock = 0, resolve, fail = false;
  const feed = createStaleJsonFeed({ retainLateResults: true, timeoutMs: 15, ttlMs: 100, now: () => clock,
    load: () => fail ? Promise.reject(Error('offline')) : new Promise(r => { resolve = r; }) });
  assert.equal(await feed.read(), null);
  resolve(snapshot); await tick();
  assert.deepEqual(await feed.read(), snapshot, 'current flight can populate cache after its response timeout');
  clock = 101; fail = true; await feed.refresh();
  assert.deepEqual(await feed.read(), { ...snapshot, stale: true });
  fail = false; clock = 202; await feed.refresh();
  const oldResolve = resolve;
  clock = 303;
  const current = feed.refresh(); await tick();
  resolve({ ...snapshot, generatedAt: 'newer' }); await current;
  oldResolve({ ...snapshot, generatedAt: 'obsolete' }); await tick();
  assert.equal((await feed.read()).generatedAt, 'newer');
});

test('reader cached access returns immediately, refreshes in background and retains last good data', async () => {
  let clock = 1000, release;
  const reader = createFundingMatrixReader({ now: () => clock, ttlMs: 1000, sources: {
    binance: () => new Promise(resolve => { release = resolve; }),
    okx: async () => [{ venue: 'okx', symbol: 'BTC', rate: 0.0002, intervalHours: 8 }],
  } });
  assert.equal(await reader.readCached(), null);
  await tick();
  release([{ venue: 'binance', symbol: 'BTC', rate: 0.0001, intervalHours: 8 }]);
  const first = await reader.read();
  clock += 2000;
  const start = performance.now();
  const stale = await reader.readCached();
  assert.ok(performance.now() - start < 100);
  assert.equal(stale.stale, true);
  assert.equal(stale.generatedAt, first.generatedAt);
  await tick(); release([]); await reader.read();
});

test('SSR bounds cold feed wait, background result primes JSON and warm SSR', async (t) => {
  let release, calls = 0, rendered;
  const env = { ASSETS: assets, FUNDING_MATRIX_READ: () => { calls++; return new Promise(r => { release = r; }); },
    NEWS_SSR_RENDER: async (_url, options) => { rendered = options; return '<main data-testid="funding-matrix-page">matrix</main>'; } };
  let start = performance.now();
  const first = await worker.fetch(new Request('https://nexualpha.com/funding-rates/matrix'), env);
  assert.equal(first.status, 200);
  assert.equal(rendered.fundingMatrix, null);
  const coldMs = performance.now() - start;
  assert.ok(coldMs < 3000, `${coldMs}ms`);
  release(snapshot); await tick();
  assert.equal((await worker.fetch(new Request('https://nexualpha.com/intel/funding-matrix.json'), env)).status, 200);
  start = performance.now();
  await worker.fetch(new Request('https://nexualpha.com/funding-rates/matrix'), env);
  const warmMs = performance.now() - start;
  assert.ok(warmMs < 500, `${warmMs}ms`);
  assert.deepEqual(rendered.fundingMatrix, snapshot);
  assert.equal(calls, 1);
  t.diagnostic(`cold SSR ${coldMs.toFixed(1)}ms; warm SSR ${warmMs.toFixed(1)}ms`);
});

test('saved full production snapshot renders through real SSR entry below 1.5s', async (t) => {
  const harness = await createSsrHarness();
  try {
    assert.equal(snapshot.rows.length, 60);
    assert.equal(snapshot.venues.length, 8);
    for (const localePath of ['', '/zh-hans', '/ar']) {
      const start = performance.now();
      const html = await harness.render(`https://nexualpha.com${localePath}/funding-rates/matrix`, { fundingMatrix: snapshot });
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 1500, `${localePath}: ${elapsed}ms`);
      assert.match(html, /data-testid="funding-matrix-page"/);
      assert.equal((html.match(/<tr id="symbol-/g) || []).length, 60);
      t.diagnostic(`${localePath || '/en'} production snapshot SSR ${elapsed.toFixed(1)}ms`);
    }
  } finally { await harness.close(); }
});

// Production uses the bundled renderer, not Vite's development module graph.
test('built runtime renders the production snapshot within the request budget', {
  skip: !existsSync(new URL('../dist/news-ssr/entry-server.js', import.meta.url)),
}, async (t) => {
  const render = createNewsSsrRenderer(fileURLToPath(new URL('../dist', import.meta.url)));
  const env = { ASSETS: assets, FUNDING_MATRIX_READ: async () => snapshot, NEWS_SSR_RENDER: render };
  for (let request = 0; request < 2; request++) {
    const start = performance.now();
    const response = await worker.fetch(new Request('https://nexualpha.com/funding-rates/matrix'), env);
    const html = await response.text();
    const ms = performance.now() - start;
    assert.equal(response.status, 200);
    assert.equal((html.match(/<tr id="symbol-/g) || []).length, 60);
    assert.ok(ms < (request ? 500 : 3000), `${ms}ms`);
    t.diagnostic(`built runtime ${request ? 'warm' : 'cold'} response ${ms.toFixed(1)}ms`);
  }
});

test('matrix chunk matcher ignores funding-matrix in the worktree directory', () => {
  const chunks = viteConfig({ isSsrBuild: false }).build.rollupOptions.output.manualChunks;
  const info = { getModuleInfo: () => null };
  const root = '/Volumes/SSD/nx-wt-codex-funding-matrix-504';
  assert.equal(chunks(`${root}/src/unassigned.js`, info), undefined);
  assert.equal(chunks(`${root}/src/components/data/FundingMatrixPage.jsx`, info), 'route-funding-matrix');
  assert.equal(chunks(`${root}/src/data/funding-matrix.js`, info), 'route-funding-matrix');
});
