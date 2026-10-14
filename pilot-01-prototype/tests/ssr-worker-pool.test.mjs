import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import { createSsrWorkerPool } from '../server/ssr-worker-pool.mjs';

test('SSR workers isolate CPU work, preserve request state, and read parent snapshots', async () => {
  const base = fileURLToPath(new URL('../../.context-excluded/', import.meta.url));
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(path.join(base, 'pool-test-'));
  const modulePath = path.join(dir, 'worker.mjs');
  await writeFile(modulePath, `export default { async fetch(request, env) {
    const until = Date.now() + 200; while (Date.now() < until) {}
    return new Response(JSON.stringify({url:request.url,cookie:request.headers.get('cookie'),feed:await env.INTEL_READ(),flash:await env.FLASH_MEMORY.load()}), {headers:{'content-type':'text/html'}});
  }};`);
  const pool = createSsrWorkerPool({ workerUrl: pathToFileURL(modulePath).href, clientRoot: dir, distRoot: dir, size: 2 });
  try {
    let ticks = 0;
    const timer = setInterval(() => ticks++, 10);
    const responses = await Promise.all([1, 2].map((n) => pool.fetch(new Request(`https://nexualpha.com/news/${n}`, { headers: { cookie: 'nx_hero=b' } }), { INTEL_READ: async () => ({ version: 42 }), FLASH_MEMORY: { load: async () => ['saved'] } })));
    clearInterval(timer);
    assert.ok(ticks >= 5, `main event loop kept running (${ticks} ticks)`);
    for (let i = 0; i < responses.length; i++) {
      const body = await responses[i].json();
      assert.equal(body.url, `https://nexualpha.com/news/${i + 1}`);
      assert.equal(body.cookie, 'nx_hero=b');
      assert.deepEqual(body.feed, { version: 42 });
      assert.deepEqual(body.flash, ['saved']);
    }
    assert.equal(pool.stats().completed, 2);
    assert.equal(pool.stats().queued, 0);
  } finally { await pool.close(); await rm(dir, { recursive: true, force: true }); }
});


test('SSR backpressure counts active and queued renders together', async () => {
  const base = fileURLToPath(new URL('../../.context-excluded/', import.meta.url));
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(path.join(base, 'pool-cap-test-'));
  const modulePath = path.join(dir, 'worker.mjs');
  await writeFile(modulePath, `export default { async fetch(request, env) {
    await env.INTEL_READ(); return new Response('ready', {headers:{'content-type':'text/html'}});
  }};`);
  let release;
  let entered;
  const blocked = new Promise((resolve) => { release = resolve; });
  const started = new Promise((resolve) => { entered = resolve; });
  const env = { INTEL_READ: async () => { entered(); await blocked; return {}; } };
  const pool = createSsrWorkerPool({ workerUrl: pathToFileURL(modulePath).href, clientRoot: dir, distRoot: dir, size: 1, maxQueue: 2 });
  try {
    const first = pool.fetch(new Request('https://nexualpha.com/news/one'), env);
    await started;
    const second = pool.fetch(new Request('https://nexualpha.com/news/two'), env);
    assert.equal(pool.stats().active, 1);
    assert.equal(pool.stats().queued, 1);
    await assert.rejects(pool.fetch(new Request('https://nexualpha.com/news/three'), env), /SSR pool unavailable/);
    release();
    await Promise.all([first, second]);
    assert.equal(pool.stats().completed, 2);
  } finally { release(); await pool.close(); await rm(dir, { recursive: true, force: true }); }
});
