import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { healthcheck } from './healthcheck.mjs';
test('healthcheck uses actual updatedAt, admits degraded progress, rejects stale/missing/future heartbeat', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'heartbeat-')); const file = path.join(dir, 'heartbeat.json');
  const now = Date.now();
  try {
    await writeFile(file, JSON.stringify({ updatedAt: new Date(now).toISOString(), status: 'degraded' }));
    assert.equal(await healthcheck('file', file, { now }), true);
    for (const stamp of [now - 600001, now + 60001, NaN]) {
      await writeFile(file, JSON.stringify({ updatedAt: Number.isFinite(stamp) ? new Date(stamp).toISOString() : 'invalid' }));
      await assert.rejects(healthcheck('file', file, { now }), /stale-heartbeat/);
    }
    await rm(file); await assert.rejects(healthcheck('file', file, { now }));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('HTTP healthchecks fail on upstream errors and use a bounded signal', async () => {
  assert.equal(await healthcheck('http', 'http://127.0.0.1/', { fetchImpl: async (_url, opts) => { assert.ok(opts.signal); return new Response('ok'); } }), true);
  await assert.rejects(healthcheck('http', 'http://127.0.0.1/', { fetchImpl: async () => new Response('', { status: 503 }) }), /http-unhealthy/);
});
