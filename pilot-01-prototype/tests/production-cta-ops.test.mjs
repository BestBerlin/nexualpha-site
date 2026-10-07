import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, chmod, access, symlink, readdir } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const runFile = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'ops/cta/daily-cta.py');
const secretMarker = 'PRIVATE_EVENT_PAYLOAD_NEVER_PRINT';
const exists = async (file) => access(file).then(() => true, () => false);
const row = (receivedAt, environment = 'production') => ({
  version: 2, type: 'page_view', eventId: randomUUID(), session: randomUUID(),
  page: '/br', locale: 'pt-BR', source: secretMarker, market: 'BR', product: 'spot',
  accountStage: 'new_account', receivedAt, environment,
});

async function fixture() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nexu-cta-ops-'));
  const base = path.join(dir, 'analytics');
  const ops = path.join(dir, 'ops');
  await mkdir(base, { mode: 0o700 });
  await mkdir(ops, { mode: 0o700 });
  const rotation = path.join(dir, 'rotation.called');
  const fakeLogrotate = path.join(dir, 'logrotate-fixture');
  await writeFile(fakeLogrotate, '#!/bin/sh\nprintf "rotation fixture only\\n" > "$CTA_OPS_TEST_ROTATION_MARKER"\n', { mode: 0o700 });
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('CTA_OPS_')));
  Object.assign(env, {
    CTA_OPS_BASE: base, CTA_OPS_DIR: ops, CTA_OPS_CONTAINER: 'synthetic-nexualpha',
    CTA_OPS_SYNTHETIC: '1', CTA_OPS_NOW_UTC: '2026-09-15T00:15:00Z',
    CTA_OPS_REPORT_SCRIPT: path.join(root, 'server/growth-report.mjs'), CTA_OPS_NODE_BIN: process.execPath,
    CTA_OPS_LOGROTATE_BIN: fakeLogrotate, CTA_OPS_TEST_ROTATION_MARKER: rotation,
  });
  return { dir, base, ops, rotation, env,
    file: async (name, content) => writeFile(path.join(base, name), content, { mode: 0o600 }),
    close: () => rm(dir, { recursive: true, force: true }),
  };
}

async function run(f, args = [], wrapper = null) {
  try {
    const result = await runFile('python3', wrapper ? ['-c', wrapper, script, ...args] : [script, ...args], { env: f.env, cwd: root, timeout: 15000, maxBuffer: 1024 * 1024 });
    return { ...result, code: 0, data: JSON.parse(result.stdout.trim()) };
  } catch (error) {
    return { stdout: error.stdout || '', stderr: error.stderr || '', code: error.code, data: error.stdout?.trim() ? JSON.parse(error.stdout.trim()) : null };
  }
}

test('templates use rename rotation, one UTC schedule and explicit apply', async () => {
  const rotate = await readFile(path.join(root, 'ops/cta/logrotate.conf.template'), 'utf8');
  assert.doesNotMatch(rotate, /^\s*copytruncate\b/m);
  assert.match(rotate, /^\s*nocreate$/m);
  assert.match(rotate, /^\s*maxage 30$/m);
  const cron = await readFile(path.join(root, 'ops/cta/cron.template'), 'utf8');
  assert.match(cron, /^CRON_TZ=UTC$/m);
  assert.equal(cron.split('\n').filter((line) => /^15 0 /.test(line)).length, 1);
  assert.match(cron, /daily-cta\.py --apply/);
});

test('default dry-run is metadata-only: no event opens, cleanup, reports or rotation', async () => {
  const f = await fixture();
  try {
    await f.file('production.jsonl', `${secretMarker}\xff`);
    await f.file('production.jsonl-20260815', secretMarker);
    await f.file('smoke.jsonl', secretMarker);
    const wrapper = `import sys, runpy, os
def audit(event, args):
    if event == 'open' and isinstance(args[0], str) and os.path.basename(args[0]).startswith(('production.jsonl', 'smoke.jsonl')):
        raise RuntimeError('EVENT_BODY_OPEN_FORBIDDEN')
sys.addaudithook(audit)
target=sys.argv[1]
sys.argv=[target]
runpy.run_path(target, run_name='__main__')`;
    const result = await run(f, [], wrapper);
    assert.equal(result.code, 0);
    assert.equal(result.data.status, 'DRY_RUN');
    assert.equal(result.data.expiredArchives, 1);
    assert.doesNotMatch(result.stdout + result.stderr, new RegExp(secretMarker));
    assert.equal(await exists(path.join(f.base, 'production.jsonl-20260815')), true);
    assert.deepEqual(await readdir(f.ops), []);
    assert.equal(await exists(f.rotation), false);
    assert.equal(await exists(path.join(f.base, 'reports')), false);
  } finally { await f.close(); }
});

test('apply retains the UTC cutoff, isolates smoke and filters the previous UTC day privately', async () => {
  const f = await fixture();
  try {
    const rows = [row('2026-09-13T23:59:59.999Z'), row('2026-09-14T00:00:00.000Z'),
      row('2026-09-14T23:59:59.999Z'), row('2026-09-15T00:00:00.000Z'), row('2026-09-14T12:00:00.000Z', 'smoke')];
    await f.file('production.jsonl', rows.map(JSON.stringify).join('\n') + '\n{"partial":');
    await f.file('smoke.jsonl', JSON.stringify(row('2026-09-14T10:00:00.000Z', 'smoke')) + '\n');
    await f.file('production.jsonl-20260815', JSON.stringify(row('2026-08-15T10:00:00.000Z')) + '\n');
    await f.file('production.jsonl-20260816', JSON.stringify(row('2026-08-16T10:00:00.000Z')) + '\n');
    await f.file('unrelated-backup', secretMarker);
    await f.file('.report-input-stale123.jsonl', secretMarker);
    const reports = path.join(f.base, 'reports');
    await mkdir(reports, { mode: 0o700 });
    for (const day of ['2026-08-15', '2026-08-16']) await mkdir(path.join(reports, day), { mode: 0o700 });
    // Keep the normal-path fixture independent of the host filesystem's
    // capacity; the dedicated critical-disk test below covers that guard.
    const normalDisk = `import importlib.util,sys
spec=importlib.util.spec_from_file_location('cta_ops',sys.argv[1])
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.disk_status=lambda base: {'diskLevel':'OK','diskUsedPercent':10,'freeBytes':50 * 1024**3}
sys.exit(module.main(sys.argv[2:]))`;
    const result = await run(f, ['--apply'], normalDisk);
    assert.equal(result.code, 0, result.stdout + result.stderr);
    assert.equal(result.data.status, 'COMPLETED');
    assert.equal(result.data.selectedRows, 2);
    assert.equal(result.data.invalidSourceLines, 1);
    assert.doesNotMatch(result.stdout + result.stderr, new RegExp(secretMarker));
    assert.equal(await exists(path.join(f.base, 'production.jsonl-20260815')), false);
    assert.equal(await exists(path.join(f.base, 'production.jsonl-20260816')), true);
    assert.equal(await exists(path.join(reports, '2026-08-15')), false);
    assert.equal(await exists(path.join(reports, '2026-08-16')), true);
    assert.equal(await exists(path.join(f.base, 'unrelated-backup')), true);
    assert.equal(await exists(path.join(f.base, '.report-input-stale123.jsonl')), false);
    assert.equal(await exists(f.rotation), true);
    assert.equal((await readdir(f.base)).some((name) => name.startsWith('.report-input-')), false);
    const report = JSON.parse(await readFile(path.join(reports, '2026-09-14/growth-report.json'), 'utf8'));
    assert.equal(report.selection.environment, 'production');
    assert.equal(report.selection.fromUtc, '2026-09-14T00:00:00.000Z');
    assert.equal(report.selection.toUtc, '2026-09-15T00:00:00.000Z');
    assert.equal(report.totals.events, 2);
    assert.equal(report.totals.confirmedRegistrations, null);
  } finally { await f.close(); }
});

test('permissions and symlinks fail before any body read or mutation', async () => {
  const f = await fixture();
  try {
    await f.file('production.jsonl', secretMarker);
    await chmod(path.join(f.base, 'production.jsonl'), 0o644);
    assert.equal((await run(f, ['--apply'])).data.reason, 'PRIVATE_PATH_PERMISSIONS');
    await chmod(path.join(f.base, 'production.jsonl'), 0o600);
    await chmod(f.base, 0o755);
    assert.equal((await run(f)).data.reason, 'PRIVATE_PATH_PERMISSIONS');
    await chmod(f.base, 0o700);
    await rm(path.join(f.base, 'production.jsonl'));
    await symlink(path.join(f.dir, 'not-an-event-file'), path.join(f.base, 'production.jsonl'));
    assert.equal((await run(f)).data.reason, 'PRIVATE_PATH_SYMLINK');
    assert.equal(await exists(f.rotation), false);
  } finally { await f.close(); }
});

test('missing production input is unknown and never creates a zero-traffic report', async () => {
  const f = await fixture();
  try {
    await f.file('smoke.jsonl', JSON.stringify(row('2026-09-14T10:00:00.000Z', 'smoke')) + '\n');
    assert.equal((await run(f)).data.inputStatus, 'INPUT_MISSING');
    const result = await run(f, ['--apply']);
    assert.equal(result.code, 1);
    assert.equal(result.data.reason, 'PRODUCTION_INPUT_MISSING');
    assert.equal(await exists(path.join(f.base, 'reports')), false);
    assert.equal(await exists(f.rotation), false);
  } finally { await f.close(); }
});

test('concurrent maintenance is rejected by flock without opening event contents', async () => {
  const f = await fixture();
  let holder;
  try {
    await f.file('production.jsonl', secretMarker);
    holder = spawn('python3', ['-c', `import os,fcntl,sys
os.umask(0o077)
lock=open(sys.argv[1],'a')
fcntl.flock(lock.fileno(),fcntl.LOCK_EX)
print('LOCK_READY',flush=True)
sys.stdin.read()`, path.join(f.ops, 'maintenance.lock')], { stdio: ['pipe', 'pipe', 'pipe'] });
    await new Promise((resolve, reject) => { holder.stdout.once('data', resolve); holder.once('error', reject); });
    const result = await run(f, ['--apply']);
    assert.equal(result.code, 75);
    assert.equal(result.data.status, 'LOCKED');
    assert.doesNotMatch(result.stdout + result.stderr, new RegExp(secretMarker));
    assert.equal(await exists(f.rotation), false);
    assert.equal(await exists(path.join(f.base, 'reports')), false);
  } finally {
    if (holder) { holder.stdin.end(); await new Promise((resolve) => holder.once('exit', resolve)); }
    await f.close();
  }
});

test('critical disk state blocks snapshots and preserves nonexpired event files', async () => {
  const f = await fixture();
  try {
    await f.file('production.jsonl', secretMarker);
    const wrapper = `import importlib.util,sys
spec=importlib.util.spec_from_file_location('cta_ops',sys.argv[1])
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.disk_status=lambda base: {'diskLevel':'CRITICAL','diskUsedPercent':90,'freeBytes':1000}
sys.exit(module.main(['--apply']))`;
    const result = await run(f, [], wrapper);
    assert.equal(result.code, 1);
    assert.equal(result.data.reason, 'DISK_THRESHOLD_REPORT_BLOCKED');
    assert.equal(await readFile(path.join(f.base, 'production.jsonl'), 'utf8'), secretMarker);
    assert.equal(await exists(f.rotation), false);
    assert.equal((await readdir(f.base)).some((name) => name.startsWith('.report-input-')), false);
  } finally { await f.close(); }
});

test('synthetic mode refuses production paths before inspecting the production directory', async () => {
  const f = await fixture();
  try {
    f.env.CTA_OPS_BASE = '/data/private/nexualpha/analytics';
    const result = await run(f, ['--apply']);
    assert.equal(result.code, 1);
    assert.match(result.data.reason, /SYNTHETIC_PATH_MUST_BE_TEMPORARY|SYNTHETIC_PRODUCTION_PATH_DENIED/);
  } finally { await f.close(); }
});
