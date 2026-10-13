import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import { parsePublicRoute, localizedHref, LOCALE_PREFIX_BY_CODE } from '../src/data/locale-routing.js';
import { modulePathsForRoute } from '../src/data/route-module-cache.js';

test('radar JSON endpoints share SSR reader and never retain an extra HTTP cache', async () => {
  for (const kind of ['long-short', 'whales']) {
    const rows = [{ symbol: 'BTC', amount: 100 }];
    const env = { RADAR_READ: async value => { assert.equal(value, kind); return { kind, status: 'live', rows }; } };
    const url = `https://nexualpha.com/api/${kind}.json`;
    const response = await worker.fetch(new Request(url), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual((await response.json()).rows, rows);
    assert.equal(await (await worker.fetch(new Request(url, { method: 'HEAD' }), env)).text(), '');
    assert.equal((await worker.fetch(new Request(url, { method: 'POST' }), env)).status, 405);
    const unavailable = await (await worker.fetch(new Request(url), {})).json();
    assert.equal(unavailable.status, 'unavailable');
    assert.deepEqual(unavailable.rows, []);
    const failed = await (await worker.fetch(new Request(url), { RADAR_READ: async () => { throw new Error('offline'); } })).json();
    assert.equal(failed.updatedAt, null);
  }
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
