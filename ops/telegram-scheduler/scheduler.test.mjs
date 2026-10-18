import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync, existsSync, chmodSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const directory = fileURLToPath(new URL('.', import.meta.url));
const script = readFileSync(new URL('./scheduler.sh', import.meta.url), 'utf8');
// Load the actual initialization/functions without starting any scheduler loops.
const initialization = script.slice(0, script.indexOf('\njob market-sync '));
const discussion = script.match(/job discussion-close[^\n]+ -- \\\n\s+([^\n]+)/)[1].trim();
const expectedPath = '/srv/agent/stacks/crypto-telegram-ops/community-poller.env';

function run(code, variables = {}) {
  const env = { ...process.env };
  delete env.STACK;
  delete env.COMMUNITY_POLLER_ENV_FILE;
  for (const key of Object.keys(env)) if (key.startsWith('BASH_FUNC_')) delete env[key];
  delete env.BASH_ENV;
  return spawnSync('bash', ['-c', `${initialization}\n${code}`], {
    env: { ...env, ...variables }, encoding: 'utf8',
  });
}

for (const [name, variables] of [
  ['unset', {}], ['empty', { COMMUNITY_POLLER_ENV_FILE: '' }],
]) {
  test(`${name} env path exports the stack default to child Bash`, () => {
    const result = run('bash -c \'printf "%s" "$COMMUNITY_POLLER_ENV_FILE"\'', variables);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, expectedPath);
    assert.equal(result.stderr, '');
  });
}

test('scheduler defaults runtime timestamps to Singapore time', () => {
  const result = run('bash -c \'printf "%s" "$TZ"\'');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'Asia/Singapore');
  assert.equal(result.stderr, '');
});

test('scheduler forces Singapore time even when inherited environment says UTC', () => {
  const result = run('bash -c \'printf "%s" "$TZ"\'', { TZ: 'UTC' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'Asia/Singapore');
  assert.equal(result.stderr, '');
});

test('discussion-close child loads override with spaces and exports credentials to the command', () => {
  const temp = mkdtempSync(join(directory, '.test-env-'));
  try {
    const envPath = join(temp, 'custom poller.env');
    writeFileSync(envPath, 'FIXTURE_SECRET=private-fixture-value\n');
    const commandPath = join(temp, 'fixture-command');
    writeFileSync(commandPath, `#!/usr/bin/env bash
[[ "$FIXTURE_SECRET" = private-fixture-value ]] || exit 2
[[ "$1" = fixture-release/2026-09-05-market-04/infra/staging/close-due-market-discussions.mjs ]] || exit 3
printf loaded
`, { mode: 0o700 });
    const result = run(`NODE="$FIXTURE_COMMAND"
REL=fixture-release
${discussion}`,
      { COMMUNITY_POLLER_ENV_FILE: envPath, FIXTURE_COMMAND: commandPath });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'loaded');
    assert.equal(result.stderr, '');
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('missing override emits one path diagnostic and never executes the command', () => {
  const temp = mkdtempSync(join(directory, '.test-env-'));
  try {
    const envPath = join(temp, 'missing poller.env');
    const result = run(`bash -c 'poller_env bash -c "echo command-ran"'`,
      { COMMUNITY_POLLER_ENV_FILE: envPath });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, `ERROR: community poller env file missing or unreadable: ${envPath}\n`);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('directory override fails once before sourcing', () => {
  const result = run(`bash -c 'poller_env bash -c "echo command-ran"'`,
    { COMMUNITY_POLLER_ENV_FILE: directory });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, `ERROR: community poller env file missing or unreadable: ${directory}\n`);
});

test('unreadable file fails once without leaking contents', {
  skip: process.getuid?.() === 0 ? 'Root bypasses file read permissions' : false,
}, () => {
  const temp = mkdtempSync(join(directory, '.test-env-'));
  const envPath = join(temp, 'unreadable.env');
  try {
    writeFileSync(envPath, 'FIXTURE_SECRET=private-fixture-value\n', { mode: 0o000 });
    const result = run(`bash -c 'poller_env bash -c "echo command-ran"'`,
      { COMMUNITY_POLLER_ENV_FILE: envPath });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, `ERROR: community poller env file missing or unreadable: ${envPath}\n`);
  } finally {
    chmodSync(envPath, 0o600);
    rmSync(temp, { recursive: true, force: true });
  }
});

test('exported function retains default when child loses both path variables', {
  skip: existsSync(expectedPath) ? 'Do not source real production credentials in tests' : false,
}, () => {
  // Intercept exec so this check cannot run a production job even on a server.
  const result = run(`bash -c 'unset STACK COMMUNITY_POLLER_ENV_FILE; exec() { printf stopped; }; poller_env true'`);
  // Local checkout has no production env; guard must report the full default path.
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, `ERROR: community poller env file missing or unreadable: ${expectedPath}\n`);
});

test('failed source stops the job with its original exit status', () => {
  const temp = mkdtempSync(join(directory, '.test-env-'));
  try {
    const envPath = join(temp, 'invalid.env');
    writeFileSync(envPath, 'return 7\n');
    const result = run(`bash -c 'poller_env bash -c "echo command-ran"'`,
      { COMMUNITY_POLLER_ENV_FILE: envPath });
    assert.equal(result.status, 7);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('startup DNS failures retry with backoff, recover, and atomically publish a job heartbeat', () => {
  const temp = mkdtempSync(join(directory, '.test-env-'));
  try {
    const result = run(`SCHEDULER_STATE_DIR="$FIXTURE_STATE"
timeout() {
  local n=0
  [[ -f "$FIXTURE_STATE/attempts" ]] && n=$(cat "$FIXTURE_STATE/attempts")
  n=$((n+1)); printf '%s' "$n" > "$FIXTURE_STATE/attempts"
  [[ $n -ge 3 ]]
}
sleep() { printf '%s\\n' "$1" >> "$FIXTURE_STATE/delays"; [[ "$1" != 30 ]] || exit 0; }
job fixture 0 30 10 "$FIXTURE_STATE" -- true
wait`, { FIXTURE_STATE: temp });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(join(temp, 'attempts'), 'utf8'), '3');
    assert.equal(readFileSync(join(temp, 'delays'), 'utf8'), '0\n5\n10\n30\n');
    const heartbeat = JSON.parse(readFileSync(join(temp, 'scheduler-jobs/fixture.json'), 'utf8'));
    assert.equal(heartbeat.status, 'ok');
    assert.equal(heartbeat.exitCode, 0);
    assert.ok(Date.now() - Date.parse(heartbeat.updatedAt) < 5000);
    assert.match(result.stdout, /exit=1/);
    assert.match(result.stdout, /exit=0/);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
