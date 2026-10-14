import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { get } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createProductionServer } from '../server.mjs';

test('slow and disconnected clients apply backpressure and cancel the response source', { timeout: 5000 }, async () => {
  const appRoot = await mkdtemp(path.join(os.tmpdir(), 'nx-runtime-backpressure-'));
  let produced = 0;
  let cancelled = false;
  const server = await createProductionServer({ appRoot, env: {}, worker: { fetch: async () => new Response(new ReadableStream({
    pull(controller) {
      if (produced++ >= 4096) { controller.close(); return; }
      controller.enqueue(new Uint8Array(64 * 1024));
    },
    cancel() { cancelled = true; },
  }), { headers: { 'content-type': 'application/octet-stream' } }) } });
  let client;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    await new Promise((resolve, reject) => {
      client = get(`http://127.0.0.1:${server.address().port}/large`, response => {
        response.pause();
        setTimeout(resolve, 50);
      });
      client.on('error', reject);
    });
    assert.ok(produced < 4096, `source streamed all ${produced} chunks despite a paused socket`);
    client.destroy();
    for (let attempt = 0; attempt < 30 && !cancelled; attempt++) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(cancelled, true, 'disconnect must cancel the upstream response stream');
  } finally {
    client?.destroy();
    await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    await rm(appRoot, { recursive: true, force: true });
  }
});
