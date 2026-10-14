import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = readFileSync(new URL('./scheduler.sh', import.meta.url), 'utf8');
const initialization = script.slice(0, script.indexOf('\nif [ "${1:-}" = run ]'));
function run(code, env = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'newsroom-scheduler-'));
  try {
    return spawnSync('bash', ['-c', `${initialization}\n${code}`], {
      env: { ...process.env, BASH_ENV: '', NEWSROOM_STATE: join(dir, 'state'), NEWSROOM_OUT: join(dir, 'out'), ...env },
      encoding: 'utf8',
    });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('per-source database failure fails the job instead of reporting zero sources as success', () => {
  const result = run(`has_command() { return 0; }
psql() { return 7; }
job_collect`, { COLLECT_MODE: 'per-source' });
  assert.equal(result.status, 7, result.stderr);
  assert.doesNotMatch(result.stdout, /0\/0 ok/);
});

test('per-source empty registry succeeds and mixed results still collect remaining sources', () => {
  for (const [output, expected] of [['', '0/0 ok'], ['first\\nsecond\\n', '1/2 ok']]) {
    const result = run(`has_command() { return 0; }
psql() { printf '${output}'; }
fixture_cli() { [[ "$3" = second ]]; }
CLI=(fixture_cli)
timeout() { shift; "$@"; }
job_collect`, { COLLECT_MODE: 'per-source' });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.includes(expected), result.stdout);
  }
});

test('daily snapshots use the SGT date even when the host timezone is UTC', () => {
  const frozenDate = process.platform === 'darwin' ? '-r 1791939600' : "-d '@1791939600'";
  const result = run(`date() {
  if [[ "$1" = +%F || "$1" = +%-H ]]; then
    command date ${frozenDate} "$1"
  else command date "$@"; fi
}
fixture_cli() { printf '{}'; }
CLI=(fixture_cli)
job_daily`, { TZ: 'UTC' });
  // 2026-10-14 01:00 UTC is the 09:00 SGT snapshot slot.
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /wrote status\/status-2026-10-14.json/);
  const zone = run('bash -c \'printf "%s" "$TZ"\'', { TZ: 'UTC' });
  assert.equal(zone.status, 0, zone.stderr);
  assert.equal(zone.stdout, 'Asia/Singapore');
});
