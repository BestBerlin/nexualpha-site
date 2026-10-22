import { loopbackListenSkip } from "./helpers/environment.mjs";
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';
import { access, chmod, mkdir, mkdtemp, readFile, rename, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createErrorMonitor } from '../server/error-monitor.mjs';
import { createProductionServer } from '../server.mjs';

const buildId = '3.0-test-build';
const exists = async (file) => access(file).then(() => true, () => false);
const rows = async (file) => (await readFile(file, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);

async function fixture(prefix = 'nexu-error-monitor-') {
  const dir = await mkdtemp(path.join(os.tmpdir(), prefix));
  const appRoot = path.join(dir, 'app');
  const privateRoot = path.join(dir, 'private');
  await mkdir(appRoot, { mode: 0o700 });
  await mkdir(privateRoot, { mode: 0o700 });
  return {
    dir,
    appRoot,
    privateRoot,
    file: path.join(privateRoot, 'errors.jsonl'),
    close: () => rm(dir, { recursive: true, force: true }),
  };
}

async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

async function closeServer(server) {
  if (!server?.listening) return;
  await new Promise((resolve) => {
    server.close(resolve);
    server.closeIdleConnections?.();
  });
}

test('records only the strict error event schema and normalizes untrusted input', async () => {
  const f = await fixture();
  try {
    const monitor = createErrorMonitor(f.file, { buildId, environment: 'production' });
    const secret = 'SHOULD_NOT_REACH_ERROR_LOG';
    assert.equal(await monitor.record({
      requestId: `not-a-uuid-${secret}`,
      route: `/login?token=${secret}`,
      component: 'web',
      errorCode: 'SITE_REQUEST_UNAVAILABLE',
      httpStatus: '503',
      upstreamStatus: '502',
      rawMessage: secret,
    }), true);

    const [row] = await rows(f.file);
    assert.deepEqual(Object.keys(row).sort(), [
      'buildId',
      'component',
      'environment',
      'errorCode',
      'eventId',
      'httpStatus',
      'occurredAt',
      'requestId',
      'route',
      'schemaVersion',
      'service',
    ].sort());
    assert.equal(row.schemaVersion, 1);
    assert.equal(row.environment, 'production');
    assert.equal(row.service, 'nexualpha-web');
    assert.equal(row.buildId, buildId);
    assert.equal(row.route, '/site-page');
    assert.equal(row.component, 'web');
    assert.equal(row.errorCode, 'SITE_REQUEST_UNAVAILABLE');
    assert.equal(row.httpStatus, 503);
    assert.match(row.eventId, /^[0-9a-f-]{36}$/i);
    assert.match(row.requestId, /^[0-9a-f-]{36}$/i);
    assert.notEqual(row.requestId, `not-a-uuid-${secret}`);
    assert.doesNotMatch(await readFile(f.file, 'utf8'), new RegExp(secret));
  } finally { await f.close(); }
});

test('rejects unknown components and error codes without creating an event file', async () => {
  const f = await fixture();
  try {
    const monitor = createErrorMonitor(f.file, { buildId, environment: 'test' });
    assert.equal(await monitor.record({ requestId: randomUUID(), route: '/api/v1/venues', component: 'database', errorCode: 'SITE_REQUEST_UNAVAILABLE' }), false);
    assert.equal(await monitor.record({ requestId: randomUUID(), route: '/api/v1/venues', component: 'web', errorCode: 'RAW_EXCEPTION_MESSAGE' }), false);
    assert.equal(await exists(f.file), false);
  } finally { await f.close(); }
});

test('deduplicates repeated component code and route fingerprints inside the dedupe window', async () => {
  const f = await fixture();
  try {
    const monitor = createErrorMonitor(f.file, { buildId, environment: 'test', dedupeMs: 60_000 });
    assert.equal(await monitor.record({ requestId: randomUUID(), route: '/api/v1/venues', component: 'web', errorCode: 'SITE_REQUEST_UNAVAILABLE' }), true);
    assert.equal(await monitor.record({ requestId: randomUUID(), route: '/api/v1/venues?token=secret', component: 'web', errorCode: 'SITE_REQUEST_UNAVAILABLE' }), false);
    assert.equal(await monitor.record({ requestId: randomUUID(), route: '/api/analytics/cta', component: 'cta', errorCode: 'CTA_COLLECTOR_WRITE_FAILED' }), true);
    const stored = await rows(f.file);
    assert.equal(stored.length, 2);
    assert.deepEqual(stored.map((row) => row.route), ['/api/v1/*', '/api/analytics/cta']);
  } finally { await f.close(); }
});

test('serializes concurrent writes as valid newline-delimited JSON', async () => {
  const f = await fixture();
  try {
    const monitor = createErrorMonitor(f.file, { buildId, environment: 'test', dedupeMs: 0 });
    const writes = Array.from({ length: 40 }, () => monitor.record({
      requestId: randomUUID(),
      route: '/api/v1/venues',
      component: 'web',
      errorCode: 'SITE_REQUEST_UNAVAILABLE',
      httpStatus: 503,
    }));
    assert.deepEqual(await Promise.all(writes), Array.from({ length: 40 }, () => true));
    const lines = (await readFile(f.file, 'utf8')).split('\n').filter(Boolean);
    assert.equal(lines.length, 40);
    for (const line of lines) assert.equal(JSON.parse(line).errorCode, 'SITE_REQUEST_UNAVAILABLE');
  } finally { await f.close(); }
});

test('continues writing to a new active file after rename-based rotation', async () => {
  const f = await fixture();
  try {
    const monitor = createErrorMonitor(f.file, { buildId, environment: 'test', dedupeMs: 0 });
    assert.equal(await monitor.record({ requestId: randomUUID(), route: '/first', component: 'web', errorCode: 'SITE_REQUEST_UNAVAILABLE' }), true);
    const archive = `${f.file}-20260928`;
    await rename(f.file, archive);
    assert.equal(await monitor.record({ requestId: randomUUID(), route: '/second', component: 'web', errorCode: 'SITE_REQUEST_UNAVAILABLE' }), true);
    assert.equal((await rows(archive)).length, 1);
    assert.equal((await rows(f.file)).length, 1);
  } finally { await f.close(); }
});

test('degrades readiness when the monitor cannot create the event file', { skip: process.getuid?.() === 0 && 'root ignores directory permissions' }, async () => {
  const f = await fixture();
  const locked = path.join(f.dir, 'locked');
  await mkdir(locked, { mode: 0o700 });
  try {
    const monitor = createErrorMonitor(path.join(locked, 'errors.jsonl'), { buildId, environment: 'test' });
    await chmod(locked, 0o500);
    assert.equal(await monitor.record({ requestId: randomUUID(), route: '/api/v1/venues', component: 'web', errorCode: 'SITE_REQUEST_UNAVAILABLE' }), false);
    const status = monitor.status();
    assert.equal(status.ready, false);
    assert.equal(status.status, 'degraded');
    assert.equal(status.configured, true);
    assert.equal(status.mode, 'local');
    assert.equal(status.environment, 'test');
    assert.match(status.lastFailureAt, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    await chmod(locked, 0o700).catch(() => {});
    await f.close();
  }
});

test('records worker exceptions as sanitized site request events', { skip: await loopbackListenSkip() }, async () => {
  const f = await fixture();
  let server;
  try {
    server = await createProductionServer({
      appRoot: f.appRoot,
      env: { ERROR_EVENT_FILE: f.file },
      worker: { fetch: async () => { throw new Error('WORKER_SECRET_STACK'); } },
    });
    const base = await listen(server);
    const response = await fetch(`${base}/private?token=WORKER_SECRET_STACK`, { headers: { 'x-request-id': 'invalid-request-id' } });
    assert.equal(response.status, 503);
    assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/i);
    assert.deepEqual(await response.json(), { status: 'unavailable', reasonCode: 'SITE_REQUEST_UNAVAILABLE' });
    const [row] = await rows(f.file);
    assert.equal(row.component, 'web');
    assert.equal(row.errorCode, 'SITE_REQUEST_UNAVAILABLE');
    assert.equal(row.route, '/site-page');
    assert.equal(row.httpStatus, 503);
    assert.doesNotMatch(await readFile(f.file, 'utf8'), /WORKER_SECRET_STACK/);
  } finally {
    await closeServer(server);
    await f.close();
  }
});

test('records Core not-configured readiness errors without storing request secrets', { skip: await loopbackListenSkip() }, async () => {
  const f = await fixture();
  let server;
  try {
    server = await createProductionServer({
      appRoot: f.appRoot,
      env: { ERROR_EVENT_FILE: f.file },
      worker: { fetch: async () => new Response('site-ok') },
    });
    const base = await listen(server);
    const response = await fetch(`${base}/api/v1/health/ready?token=CORE_SECRET`, { headers: { 'x-request-id': randomUUID() } });
    assert.equal(response.status, 503);
    const [row] = await rows(f.file);
    assert.equal(row.component, 'core');
    assert.equal(row.errorCode, 'CORE_API_ORIGIN_NOT_CONFIGURED');
    assert.equal(row.route, '/api/v1/health/ready');
    assert.equal(row.httpStatus, 503);
    assert.doesNotMatch(await readFile(f.file, 'utf8'), /CORE_SECRET/);
  } finally {
    await closeServer(server);
    await f.close();
  }
});

test('records Core upstream readiness errors with bounded upstream status', { skip: await loopbackListenSkip() }, async () => {
  const f = await fixture();
  let core;
  let server;
  try {
    core = createHttpServer((_req, res) => {
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'down', secret: 'CORE_UPSTREAM_SECRET' }));
    });
    const coreOrigin = await listen(core);
    server = await createProductionServer({
      appRoot: f.appRoot,
      env: { ERROR_EVENT_FILE: f.file, CORE_API_ORIGIN: coreOrigin },
      worker: { fetch: async () => new Response('site-ok') },
    });
    const base = await listen(server);
    const response = await fetch(`${base}/health/dependencies`);
    assert.equal(response.status, 200);
    const [row] = await rows(f.file);
    assert.equal(row.component, 'core');
    assert.equal(row.errorCode, 'CORE_API_UPSTREAM_UNAVAILABLE');
    assert.equal(row.route, '/health/dependencies');
    assert.equal(row.httpStatus, 503);
    assert.equal(row.upstreamStatus, 502);
    assert.doesNotMatch(await readFile(f.file, 'utf8'), /CORE_UPSTREAM_SECRET/);
  } finally {
    await closeServer(server);
    await closeServer(core);
    await f.close();
  }
});

test('error operations templates use rename rotation and one explicit UTC schedule', async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const rotate = await readFile(path.join(root, 'ops/errors/logrotate.conf.template'), 'utf8');
  assert.match(rotate, /"@@BASE@@\/errors\.jsonl"/);
  assert.doesNotMatch(rotate, /^\s*copytruncate\b/m);
  assert.match(rotate, /^\s*nocreate$/m);
  assert.doesNotMatch(rotate, /^\s*create\b/m);
  assert.match(rotate, /^\s*maxage 30$/m);
  const cron = await readFile(path.join(root, 'ops/errors/cron.template'), 'utf8');
  assert.match(cron, /^CRON_TZ=UTC$/m);
  assert.equal(cron.split('\n').filter((line) => /^20 0 /.test(line)).length, 1);
  assert.match(cron, /logrotate .*ops\/errors\/logrotate\.conf/);
});
