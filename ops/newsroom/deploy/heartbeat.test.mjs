import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { heartbeat, healthy } from './heartbeat.mjs';
import { atomicJson } from '../lib/runtime.mjs';

test('atomic heartbeat retains failed jobs and per-source status and rejects a stuck job', () => {
  const state = mkdtempSync(join(tmpdir(), 'newsroom-heartbeat-'));
  try {
    const now = Date.now();
    for (const name of ['collect', 'pipeline', 'daily']) atomicJson(join(state, `${name}.heartbeat.json`), { updatedAt: new Date(now).toISOString(), status: 'completed', exitCode: name === 'collect' ? 1 : 0 });
    atomicJson(join(state, 'collect-sources.json'), { sources: [{ source_id: 'slow', status: 'temporarily-failing' }] });
    atomicJson(join(state, 'heartbeat.json'), heartbeat(state, now));
    assert.equal(healthy(state, now), true);
    const value = JSON.parse(readFileSync(join(state, 'heartbeat.json')));
    assert.equal(value.jobs.collect.exitCode, 1);
    assert.equal(value.sources.sources[0].status, 'temporarily-failing');
    assert.equal(healthy(state, now + 600001), false);
    atomicJson(join(state, 'pipeline.heartbeat.json'), { updatedAt: new Date(now - 660001).toISOString() });
    atomicJson(join(state, 'heartbeat.json'), heartbeat(state, now));
    assert.equal(healthy(state, now), false);
    assert.equal(readdirSync(state).some(name => name.endsWith('.tmp')), false);
  } finally { rmSync(state, { recursive: true, force: true }); }
});
