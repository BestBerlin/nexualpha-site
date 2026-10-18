import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PSQL_MAX_BUFFER_MB_DEFAULT, psqlMaxBuffer, runPsql } from '../bin/newsroom.mjs';

test('psql output buffer defaults well above the 18 MB dedupe read seen in production', () => {
  assert.ok(PSQL_MAX_BUFFER_MB_DEFAULT >= 64);
  assert.equal(psqlMaxBuffer({}), PSQL_MAX_BUFFER_MB_DEFAULT * 1024 * 1024);
  assert.equal(psqlMaxBuffer({ NEWSROOM_PSQL_MAX_BUFFER_MB: '256' }), 256 * 1024 * 1024);
  assert.equal(psqlMaxBuffer({ NEWSROOM_PSQL_MAX_BUFFER_MB: 'nope' }), PSQL_MAX_BUFFER_MB_DEFAULT * 1024 * 1024);
});

test('runPsql passes the buffer to spawn and names ENOBUFS instead of a generic failure', () => {
  let seen;
  const ok = runPsql('SELECT 1', {}, (_cmd, _args, opts) => { seen = opts.maxBuffer; return { status: 0, stdout: ' 1 \n' }; });
  assert.equal(ok, '1');
  assert.equal(seen, PSQL_MAX_BUFFER_MB_DEFAULT * 1024 * 1024);
  const overflow = () => ({ status: null, stdout: '', error: Object.assign(new Error('spawnSync psql ENOBUFS'), { code: 'ENOBUFS' }) });
  assert.throws(() => runPsql('SELECT 1', {}, overflow), /exceeded the 128 MB output buffer/);
  assert.throws(() => runPsql('SELECT 1', {}, () => ({ status: 3, stdout: '' })), /PostgreSQL command failed/);
});

test('connection refusal and startup DNS recover with bounded backoff', () => {
  let clock = 0, calls = 0;
  const sleeps = [];
  const result = runPsql('SELECT 1', {}, (_cmd, _args, opts) => {
    assert.ok(opts.timeout <= 45000);
    assert.equal(opts.env.PGCONNECT_TIMEOUT, '10');
    assert.match(opts.input, /statement_timeout=30000/);
    return ++calls < 4 ? { status: 2, stderr: calls === 1 ? 'could not translate host name' : 'connection refused' } : { status: 0, stdout: '1' };
  }, { now: () => clock, sleep: ms => { sleeps.push(ms); clock += ms; } });
  assert.equal(result, '1');
  assert.deepEqual(sleeps, [1000, 2000, 4000]);
});

test('database reconnect stops at five minutes without leaking connection details', () => {
  let clock = 0, calls = 0;
  assert.throws(() => runPsql('SELECT 1', {}, () => {
    calls++;
    return { status: 2, stderr: 'connection refused SECRET_HOST' };
  }, { now: () => clock, sleep: ms => { clock += ms; } }), error => /PostgreSQL command failed/.test(error.message) && !error.message.includes('SECRET_HOST'));
  assert.equal(clock, 300000);
  assert.ok(calls < 20);
});

test('SQL errors, auth failures, killed commands and ambiguous in-flight disconnects are not replayed', () => {
  for (const result of [
    { status: 3, stderr: 'SQL error' },
    { status: 2, stderr: 'password authentication failed' },
    { status: 2, stderr: 'server closed the connection unexpectedly; connection refused' },
    { status: null, error: Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }) },
  ]) {
    let calls = 0;
    assert.throws(() => runPsql('INSERT INTO event_scores DEFAULT VALUES', {}, () => { calls++; return result; }), /PostgreSQL command failed/);
    assert.equal(calls, 1);
  }
});
