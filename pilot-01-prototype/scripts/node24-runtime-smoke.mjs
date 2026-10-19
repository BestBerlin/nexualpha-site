// Local production-entry smoke. Never reads production state or contacts a CTA collector.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';

assert.equal(Number(process.versions.node.split('.')[0]), 24, 'Run this smoke with Node 24');
const appRoot = fileURLToPath(new URL('../', import.meta.url));
const version = JSON.parse(await readFile(path.join(appRoot, 'dist/client/version.json'), 'utf8'));
const routes = ['/', '/exchanges', '/exchanges/binance', '/exchanges/bitget', '/exchanges/okx',
  '/compare/binance-vs-okx', '/activities', '/news', '/rates', '/telegram', '/br', '/methodology', '/zh-hans'];
const state = await mkdtemp(path.join(tmpdir(), 'nexualpha-node24-'));
const socket = createServer();
socket.listen(0, '127.0.0.1');
await once(socket, 'listening');
const port = socket.address().port;
await new Promise((resolve) => socket.close(resolve));
// Deliberately do not inherit private credentials, proxy targets or production file paths.
const env = { PATH: process.env.PATH, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port),
  BUILD_ID: version.buildId, PUBLIC_ORIGIN: 'https://nexualpha.com', INTEL_REFRESH: 'off', FX_REFRESH: 'off',
  BITGET_ALLIANCE_POOL: 'off', KRAKEN_USDG_LIVE: 'off', ERROR_MONITOR_REQUIRED: '1',
  ERROR_EVENT_FILE: path.join(state, 'errors/events.jsonl'), CLICK_EVENT_FILE: path.join(state, 'clicks/events.jsonl'),
  OG_CACHE_DIR: path.join(state, 'og-cache'), INTEL_ARCHIVE_FILE: path.join(state, 'intel/archive.json'),
  COINS_FILE: path.join(state, 'intel/coins.json'), TS_LIVE_FILE: path.join(state, 'intel/tokenized-stocks.json'),
  ETF_FLOWS_FILE: path.join(state, 'intel/etf-flows.json'), CALENDAR_FILE: path.join(state, 'intel/calendar.json'),
  MARKET_EVENTS_FILE: path.join(state, 'market/market-events.json'), WHALES_FILE: path.join(state, 'market/whales.json') };
const child = spawn(process.execPath, ['server.mjs'], { cwd: appRoot, env, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '';
for (const stream of [child.stdout, child.stderr]) stream.on('data', (data) => { logs = (logs + data).slice(-24000); });
let spawnError;
child.on('error', (error) => { spawnError = error; });
const origin = `http://127.0.0.1:${port}`;
async function get(route) {
  return fetch(origin + route, { redirect: 'manual', signal: AbortSignal.timeout(60000) });
}
try {
  const deadline = Date.now() + 30000;
  while (!logs.includes('server listening on port')) {
    if (spawnError) throw spawnError;
    assert.equal(child.exitCode, null, `server exited: ${logs}`);
    assert.ok(Date.now() < deadline, `server startup timeout: ${logs}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  console.log(`PASS node server.mjs startup (${process.version}, NODE_ENV=production)`);
  assert.deepEqual(await (await get('/version.json')).json(), version);
  assert.equal((await (await get('/health/errors-ready')).json()).ready, true);
  console.log('PASS build id and isolated error-monitor readiness');
  for (const route of routes) {
    const response = await get(route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type') || '', /text\/html/, route);
    const html = await response.text();
    assert.match(html, /<title[\s>]/i, `${route}: title`);
    assert.match(html, /<h1[\s>]/i, `${route}: rendered heading`);
    console.log(`PASS SSR ${route} (${Buffer.byteLength(html)} bytes)`);
  }
  const response = await get('/og/venue/okx.png');
  assert.equal(response.status, 200, 'OG image status');
  assert.notEqual(response.headers.get('x-nexualpha-og'), 'fallback', 'OG must use native renderer');
  assert.match(response.headers.get('content-type') || '', /image\/png/);
  const png = Buffer.from(await response.arrayBuffer());
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.ok(png.length > 1000, 'native renderer must produce a nonempty PNG');
  console.log(`PASS native OG /og/venue/okx.png (${png.length} bytes, 1200x630)`);
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  if (child.exitCode === null && !spawnError) {
    const exited = once(child, 'exit');
    child.kill('SIGTERM');
    const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
    await exited;
    clearTimeout(timer);
  }
  await rm(state, { recursive: true, force: true });
}
