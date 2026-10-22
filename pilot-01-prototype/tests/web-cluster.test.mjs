import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { webWorkerCount } from '../server/web-cluster.mjs';

const fixture = fileURLToPath(new URL('./fixtures/web-cluster-harness.mjs', import.meta.url));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate, description, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (predicate()) return; await delay(25); }
  throw new Error(`Timed out: ${description}`);
}
function start(t, env = {}, script = fixture) {
  const child = spawn(process.execPath, [script], { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  const state = { child, output: '', error: '', exited: once(child, 'exit') };
  child.stdout.on('data', chunk => { state.output += chunk; });
  child.stderr.on('data', chunk => { state.error += chunk; });
  t.after(async () => { if (child.exitCode === null && child.signalCode === null) { child.kill('SIGTERM'); await state.exited; } });
  return state;
}
function rows(state) {
  return state.output.split('\n').filter(line => line.startsWith('{')).map(line => JSON.parse(line));
}
const pids = state => [...state.output.matchAll(/worker ready pid=(\d+)/g)].map(match => Number(match[1]));

test('worker count defaults to CPU-aware cap; 1 preserves single process; invalid values fail closed', () => {
  assert.equal(webWorkerCount(undefined), Math.min(4, availableParallelism()));
  assert.equal(webWorkerCount('1'), 1);
  assert.equal(webWorkerCount('2'), 2);
  for (const value of ['', '0', '-1', '2x', '1.5', 'Infinity', '9007199254740992']) assert.throws(() => webWorkerCount(value));
});

test('two real workers share burst, duplicate, and rate-limit state; crashes restart with backoff; TERM leaves no workers', { timeout: 20000 }, async t => {
  const state = start(t, { IPC_ONLY: '1' });
  await until(() => rows(state).length === 2, 'two IPC workers');
  const classifications = rows(state).flatMap(row => row.results);
  assert.equal(classifications.filter(cls => cls === 'human').length, 1);
  assert.equal(classifications.filter(cls => cls === 'duplicate').length, 11);
  assert.equal(classifications.filter(cls => cls === 'burst').length, 2);
  assert.equal(rows(state).flatMap(row => row.allowed).filter(Boolean).length, 30);
  const crashed = rows(state)[0].pid;
  const before = Date.now();
  process.kill(crashed, 'SIGKILL');
  await until(() => rows(state).length === 3, 'replacement worker');
  assert.ok(Date.now() - before >= 50, 'restart respects backoff');
  assert.ok(rows(state)[2].results.every(cls => cls === 'burst'), 'worker restart retains primary counters');
  state.child.kill('SIGTERM');
  assert.deepEqual(await state.exited, [0, null]);
  for (const { pid } of rows(state)) assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
});

test('repeated worker failure exits primary non-zero instead of restarting forever', { timeout: 15000 }, async t => {
  const state = start(t, { CRASH_LOOP: '1' });
  const [code, signal] = await state.exited;
  assert.equal(code, 1);
  assert.equal(signal, null);
  assert.match(state.error, /WEB_WORKER_CRASH_LOOP/);
});

test('shutdown preserves a worker drain failure as a non-zero container exit', { timeout: 15000 }, async t => {
  const state = start(t, { IPC_ONLY: '1', FAIL_DRAIN: '1' });
  await until(() => rows(state).length === 2, 'workers before drain');
  state.child.kill('SIGTERM');
  assert.deepEqual(await state.exited, [1, null]);
});

test('direct CTA collector deduplicates real IPC calls from two workers and preserves preflight', { timeout: 15000 }, async t => {
  const { mkdtemp, readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const path = await import('node:path');
  const { randomUUID } = await import('node:crypto');
  const dir = await mkdtemp(path.join(tmpdir(), 'cta-ipc-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'cta.jsonl');
  const event = { version: 2, type: 'page_view', eventId: randomUUID(), session: randomUUID(), page: '/', locale: 'en', source: 'cluster-test', market: 'unknown', product: 'unknown' };
  const state = start(t, { IPC_ONLY: '1', SHARED_CTA_FILE: file, SHARED_CTA_EVENT: JSON.stringify(event) });
  await until(() => rows(state).length === 2, 'CTA workers');
  for (const row of rows(state)) assert.deepEqual(row.cta, [204, 204, 204, 403]);
  assert.equal((await readFile(file, 'utf8')).trim().split('\n').length, 1);
  state.child.kill('SIGTERM');
  assert.deepEqual(await state.exited, [0, null]);
});

async function localPort(t) {
  const probe = createServer();
  try {
    probe.listen(0, '127.0.0.1');
    await once(probe, 'listening');
    const port = probe.address().port;
    await new Promise(resolve => probe.close(resolve));
    return port;
  } catch (error) {
    if (['EPERM', 'EACCES'].includes(error.code)) { t.skip(`loopback listen unavailable: ${error.code}`); return null; }
    throw error;
  }
}

test('two workers serve the same port; graceful TERM completes an in-flight HTTP request', { timeout: 20000 }, async t => {
  const port = await localPort(t);
  if (!port) return;
  const state = start(t, { PORT: String(port), HOST: '127.0.0.1' });
  await until(() => pids(state).length === 2, 'listening workers');
  const bodies = await Promise.all(Array.from({ length: 20 }, async () => (await fetch(`http://127.0.0.1:${port}/`, { headers: { connection: 'close' } })).text()));
  assert.equal(new Set(bodies).size, 2);
  const request = fetch(`http://127.0.0.1:${port}/slow`).then(response => response.text());
  await until(() => state.output.includes('slow-started'), 'in-flight request');
  state.child.kill('SIGTERM');
  assert.match(await request, /^finished pid=/);
  assert.deepEqual(await state.exited, [0, null]);
  for (const pid of pids(state)) assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
});

test('built production entrypoint preserves deploy health and direct CTA collector acceptance', { timeout: 25000 }, async t => {
  const port = await localPort(t);
  if (!port) return;
  const { mkdtemp, readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const path = await import('node:path');
  const dir = await mkdtemp(path.join(tmpdir(), 'production-cluster-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const state = start(t, { WEB_WORKERS: '2', PORT: String(port), HOST: '127.0.0.1', INTEL_REFRESH: 'off', FX_REFRESH: 'off',
    ERROR_MONITOR_REQUIRED: '1', ERROR_EVENT_FILE: path.join(dir, 'errors.jsonl'), CLICK_EVENT_FILE: path.join(dir, 'clicks.jsonl'),
    CLICK_HASH_SECRET: 'test-stable-secret', CTA_ENVIRONMENT: 'test', CTA_ALLOWED_ORIGIN: 'https://nexualpha.com',
    CTA_DATA_FILE: path.join(dir, 'cta.jsonl') }, fileURLToPath(new URL('../server.mjs', import.meta.url)));
  await until(() => pids(state).length === 2, 'production workers', 20000);
  for (const route of ['/healthz', '/health/web-ready', '/health/cta-ready', '/health/errors-ready', '/version.json']) {
    const responses = await Promise.all(Array.from({ length: 4 }, () => fetch(`http://127.0.0.1:${port}${route}`, { headers: { connection: 'close' } })));
    assert.ok(responses.every(response => response.status === 200), route);
    if (route.includes('-ready')) for (const response of responses) assert.equal((await response.json()).ready ?? true, true);
  }
  const { randomUUID } = await import('node:crypto');
  const event = { version: 2, type: 'page_view', eventId: randomUUID(), session: randomUUID(), page: '/', locale: 'en', source: 'cluster-test', market: 'unknown', product: 'unknown' };
  const responses = await Promise.all(Array.from({ length: 12 }, () => fetch(`http://127.0.0.1:${port}/api/analytics/cta`, {
    method: 'POST', headers: { origin: 'https://nexualpha.com', 'content-type': 'application/json', connection: 'close' }, body: JSON.stringify(event) })));
  assert.ok(responses.every(response => response.status === 204));
  assert.equal((await readFile(path.join(dir, 'cta.jsonl'), 'utf8')).trim().split('\n').length, 1);
  state.child.kill('SIGTERM');
  assert.deepEqual(await state.exited, [0, null]);
});
