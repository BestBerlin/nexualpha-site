import { mkdtempSync, readFileSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const backupScript = fileURLToPath(new URL('./backup.sh', import.meta.url));

function fakeDocker(version) {
  const dir = mkdtempSync(join(tmpdir(), 'newsroom-backup-test-'));
  const bin = join(dir, 'docker');
  writeFileSync(bin, `#!/usr/bin/env bash
set -euo pipefail
if [[ "$1 $2 $3" == "exec pg16 psql" ]]; then
  echo 160006
  exit 0
fi
if [[ "$1 $2 $3" == "exec pg16 pg_dump" ]]; then
  echo "pg_dump (PostgreSQL) ${version}.10"
  exit 0
fi
echo "unexpected docker call: $*" >&2
exit 2
`);
  chmodSync(bin, 0o755);
  return { dir, bin };
}

test('backup dry-run requires pg_dump major to match the server major inside the postgres container', () => {
  const ok = fakeDocker(16);
  try {
    const result = spawnSync('bash', [backupScript, '--dry-run'], {
      env: { ...process.env, NEWSROOM_DOCKER: ok.bin, NEWSROOM_POSTGRES_CONTAINER: 'pg16' },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /pg_dump major 16 matches PostgreSQL server major 16/);
  } finally {
    rmSync(ok.dir, { recursive: true, force: true });
  }

  const mismatch = fakeDocker(15);
  try {
    const result = spawnSync('bash', [backupScript, '--dry-run'], {
      env: { ...process.env, NEWSROOM_DOCKER: mismatch.bin, NEWSROOM_POSTGRES_CONTAINER: 'pg16' },
      encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /pg_dump major mismatch: server=16 pg_dump=15/);
  } finally {
    rmSync(mismatch.dir, { recursive: true, force: true });
  }
});

test('deployment checks backup compatibility before switching the active release', () => {
  const script = readFileSync(new URL('./deploy.sh', import.meta.url), 'utf8');
  assert.ok(script.indexOf('backup.sh --dry-run') >= 0);
  assert.ok(script.indexOf('backup.sh --dry-run') < script.indexOf('ln -sfn'));
});
