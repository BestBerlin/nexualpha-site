import assert from 'node:assert/strict';
import test from 'node:test';
import { createProductionServer } from '../server.mjs';

test('performance diagnostics reject forwarded requests and combined live feed stays available', async () => {
  const server = await createProductionServer({ env: { INTEL_REFRESH: 'off', FX_REFRESH: 'off' }, worker: { fetch: async (request) => new Response(JSON.stringify({ items: [], locale: new URL(request.url).searchParams.get('locale') }), { headers: { 'content-type': 'application/json' } }) } });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const diagnostics = await fetch(`${base}/__perf`);
    assert.equal(diagnostics.status, 200);
    const data = await diagnostics.json();
    assert.equal(data.ssrCache.maxBytes, 32 * 1024 * 1024);
    assert.equal(typeof data.eventLoop.p99Ms, 'number');
    assert.equal((await fetch(`${base}/__perf`, { headers: { 'x-forwarded-for': '198.51.100.2' } })).status, 404);
    const response = await fetch(`${base}/api/live.json?locale=zh-Hans`);
    assert.equal(response.status, 200);
    const live = await response.json();
    assert.deepEqual(Object.keys(live).sort(), ['announcements', 'flash', 'funding', 'generatedAt', 'movers', 'ticker']);
    assert.equal(live.flash.locale, 'zh-Hans');
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
