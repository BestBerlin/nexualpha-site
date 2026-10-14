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
