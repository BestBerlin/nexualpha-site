import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { localDay, previousDay, aeoDue, runNightly } from '../nightly.mjs';
test('Shanghai day boundaries and Monday recovery', () => {
  assert.equal(localDay(new Date('2026-10-14T16:30:00Z')), '2026-10-15');
  assert.equal(previousDay('2026-03-01'), '2026-02-28');
  assert.throws(() => previousDay('2026-02-30'));
  assert.equal(aeoDue('2026-10-19'), true);
  assert.equal(aeoDue('2026-10-15'), false);
  assert.equal(aeoDue('2026-10-15', true), true);
});
test('collectors isolate failure, redact exceptions, publish manifest and release lock', async () => {
  const dir = await mkdtemp(path.join(path.dirname(fileURLToPath(import.meta.url)), '.nightly-test-'));
  const calls = [];
  try {
    const result = await runNightly({ outputDir: dir, runDate: '2026-10-19', runners: {
      umami: async ({date}) => { calls.push(date); throw new Error('SECRET_URL'); },
      search: async ({date}) => { calls.push(date); return {status:'partial'}; },
      aeo: async ({date}) => { calls.push(date); return {status:'blocked'}; },
    }});
    assert.deepEqual(calls, ['2026-10-18','2026-10-18','2026-10-19']);
    assert.equal(result.results.umami.status, 'failed');
    assert.equal(result.results.search.status, 'partial');
    assert.equal((await readFile(path.join(dir,'daily/2026-10-18.json'),'utf8')).includes('SECRET_URL'),false);
    await mkdir(path.join(dir,'.nightly-lock'));
    await assert.rejects(runNightly({outputDir: dir}), /lock exists/);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
