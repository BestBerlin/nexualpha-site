import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import { parsePublicRoute, localizedHref, LOCALE_PREFIX_BY_CODE } from '../src/data/locale-routing.js';
import { modulePathsForRoute } from '../src/data/route-module-cache.js';

test('radar JSON endpoints share SSR reader, cache bursts and serve stale after failures', async () => {
  for (const kind of ['long-short', 'whales']) {
    const rows = [{ symbol: 'BTC', amount: 100 }];
    const generatedAt = '2026-10-13T00:00:00Z';
    const env = { WORKER_POLLED_JSON_TTL_MS: 0, RADAR_READ: async value => { assert.equal(value, kind); return { kind, status: 'live', rows, updatedAt: generatedAt, sources: ['fixture'] }; } };
    const url = `https://nexualpha.com/api/${kind}.json`;
    const response = await worker.fetch(new Request(url), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), kind === 'whales' ? 'no-store' : 'public, max-age=10, stale-while-revalidate=60');
    assert.deepEqual((await response.json()).rows, rows);
    assert.equal(await (await worker.fetch(new Request(url, { method: 'HEAD' }), env)).text(), '');
    assert.equal((await worker.fetch(new Request(url, { method: 'POST' }), env)).status, 405);
    env.RADAR_READ = async () => { throw new Error('offline'); };
    const failedResponse = await worker.fetch(new Request(url), env);
    const failed = await failedResponse.json();
    assert.equal(failedResponse.status, 200);
    assert.equal(failed.stale, true);
    assert.equal(failed.updatedAt, generatedAt);
    assert.deepEqual(failed.rows, rows);
    const coldUnavailable = await worker.fetch(new Request(url), {});
    const unavailable = await coldUnavailable.json();
    assert.equal(coldUnavailable.status, 503);
    assert.equal(coldUnavailable.headers.get('cache-control'), 'no-store');
    assert.equal(unavailable.status, 'unavailable');
    assert.deepEqual(unavailable.rows, []);
  }
});

test('radar JSON endpoints single-flight cold reads behind the worker timeout', async () => {
  let calls = 0;
  let release;
  const env = {
    WORKER_POLLED_JSON_TTL_MS: 0,
    WORKER_POLLED_JSON_TIMEOUT_MS: 20,
    RADAR_READ: async () => {
      calls += 1;
      await new Promise((resolve) => { release = resolve; });
      return { kind: 'whales', status: 'live', rows: [], updatedAt: '2026-10-13T00:00:00Z', sources: ['fixture'] };
    },
  };
  const request = new Request('https://nexualpha.com/api/whales.json');
  const [first, second] = await Promise.all([worker.fetch(request, env), worker.fetch(request, env)]);
  assert.equal(first.status, 503);
  assert.equal(second.status, 503);
  assert.equal(calls, 1);
  release();
});

test('radar JSON stale cache survives distinct server env wrappers with a shared scope', async () => {
  const scope = {};
  const url = 'https://nexualpha.com/api/long-short.json';
  let failingCalls = 0;
  const good = {
    WORKER_POLLED_JSON_CACHE_SCOPE: scope,
    WORKER_POLLED_JSON_TTL_MS: 0,
    RADAR_READ: async () => ({ kind: 'long-short', status: 'live', rows: [{ symbol: 'BTC' }], updatedAt: '2026-10-13T00:00:00Z', sources: ['fixture'] }),
  };
  const first = await worker.fetch(new Request(url), good);
  assert.equal(first.status, 200);

  const failingWrapper = {
    WORKER_POLLED_JSON_CACHE_SCOPE: scope,
    WORKER_POLLED_JSON_TTL_MS: 0,
    RADAR_READ: async () => { failingCalls += 1; throw new Error('offline'); },
  };
  const second = await worker.fetch(new Request(url), failingWrapper);
  const body = await second.json();
  assert.equal(second.status, 200);
  assert.equal(failingCalls, 1);
  assert.equal(body.stale, true);
  assert.equal(body.updatedAt, '2026-10-13T00:00:00Z');
  assert.deepEqual(body.rows, [{ symbol: 'BTC' }]);
});

test('every locale resolves both radar pages to their own lazy route module', () => {
  for (const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) {
    for (const path of ['/long-short', '/whales']) {
      const href = localizedHref(path, { locale });
      assert.equal(parsePublicRoute(href).contentPathname, path);
      assert.deepEqual(modulePathsForRoute({ name: path === "/whales" ? "whales" : "longShort" }, href), ['./components/radar/RadarPages.jsx']);
    }
  }
});
