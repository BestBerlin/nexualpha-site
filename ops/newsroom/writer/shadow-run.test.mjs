import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shadowRun } from './shadow-run.mjs';

test('shadow-run claims, writes a review plan, and releases every event', async () => {
  const calls = [];
  const writes = [];
  const result = await shadowRun(['--start', '2026-10-13T00:00:00Z', '--writer', 'writer-a', '--limit', '2', '--out', '/tmp/plan.json'], {
    now: '2026-10-13T12:00:00Z',
    async cli(args) {
      calls.push(args);
      if (args[0] === 'claim') return JSON.stringify([
        { id: 1, title_internal: 'A', event_type: 'listing', suggested_format: 'flash', cta_hints: [], entities: [], evidence: [] },
        { id: 2, title_internal: 'B', event_type: 'dispute', suggested_format: 'dispute', cta_hints: [], entities: [], evidence: [] },
      ]);
      if (args[0] === 'release') return JSON.stringify([{ id: Number(args[1]) }]);
      throw new Error(`unexpected ${args[0]}`);
    },
    files: {
      async mkdir(dir, opts) { writes.push(['mkdir', dir, opts.recursive]); },
      async writeFile(file, body) { writes.push(['write', file, JSON.parse(body)]); },
    },
  });
  assert.equal(result.claimed, 2);
  assert.equal(result.released, 2);
  assert.deepEqual(calls[0], ['claim', '--limit', '2', '--writer', 'writer-a']);
  assert.deepEqual(calls.slice(1), [
    ['release', '1', '--writer', 'writer-a'],
    ['release', '2', '--writer', 'writer-a'],
  ]);
  assert.equal(writes[1][2].publish, false);
  assert.equal(writes[1][2].events.length, 2);
});

test('shadow-run releases claims after a plan write failure and reports the failure', async () => {
  const calls = [];
  await assert.rejects(shadowRun(['--start', '2026-10-13T00:00:00Z', '--writer', 'writer-a'], {
    now: '2026-10-13T12:00:00Z',
    async cli(args) {
      calls.push(args);
      if (args[0] === 'claim') return JSON.stringify([{ id: 1, evidence: [], entities: [], cta_hints: [] }]);
      if (args[0] === 'release') return JSON.stringify([{ id: Number(args[1]) }]);
      throw new Error('unexpected');
    },
    files: {
      async mkdir() {},
      async writeFile() { throw new Error('disk full'); },
    },
  }), /plan write failed: disk full/);
  assert.deepEqual(calls.slice(1), [['release', '1', '--writer', 'writer-a']]);
});

test('shadow-run exposes release failures after attempting every release', async () => {
  const calls = [];
  await assert.rejects(shadowRun(['--start', '2026-10-13T00:00:00Z', '--writer', 'writer-a'], {
    now: '2026-10-13T12:00:00Z',
    async cli(args) {
      calls.push(args);
      if (args[0] === 'claim') return JSON.stringify([{ id: 1, evidence: [], entities: [], cta_hints: [] }, { id: 2, evidence: [], entities: [], cta_hints: [] }]);
      if (args[0] === 'release' && args[1] === '1') throw new Error('lease changed');
      if (args[0] === 'release') return JSON.stringify([{ id: Number(args[1]) }]);
      throw new Error('unexpected');
    },
    files: { async mkdir() {}, async writeFile() {} },
  }), error => {
    assert.match(error.message, /release failed for 1/);
    assert.deepEqual(error.released, [2]);
    return true;
  });
  assert.equal(calls.filter(args => args[0] === 'release').length, 2);
});

test('shadow-run rejects clocks outside the explicit one-week window', async () => {
  await assert.rejects(
    shadowRun(['--start', '2026-10-13T00:00:00Z', '--writer', 'writer-a'], { now: '2026-10-20T00:00:00Z' }),
    /outside one-week window/,
  );
});

test('shadow-run rejects duplicate options and empty release receipts', async () => {
  await assert.rejects(shadowRun(['--start', '2026-10-13T00:00:00Z', '--writer', 'a', '--limit', '1', '--limit', '2'], { now: '2026-10-13T01:00:00Z' }), /duplicate --limit/);
  await assert.rejects(shadowRun(['--start', '2026-10-13T00:00:00Z', '--writer', 'a'], {
    now: '2026-10-13T01:00:00Z',
    async cli(args) {
      if (args[0] === 'claim') return JSON.stringify([{ id: 1, evidence: [], entities: [], cta_hints: [] }]);
      if (args[0] === 'release') return '[]';
      throw new Error('unexpected');
    },
    files: { async mkdir() {}, async writeFile() {} },
  }), /release failed for 1/);
});
