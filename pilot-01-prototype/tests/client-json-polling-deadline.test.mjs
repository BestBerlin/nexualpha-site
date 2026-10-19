import assert from 'node:assert/strict';
import test from 'node:test';
import { startJsonPolling } from '../src/components/shared/json-polling.js';

const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function harness(fetchImpl) {
  let time = 0, id = 0;
  const timers = new Map(), listeners = new Set(), data = [], errors = [];
  const doc = { visibilityState: 'visible', addEventListener: (_, f) => listeners.add(f), removeEventListener: (_, f) => listeners.delete(f) };
  const advance = async (ms) => {
    const end = time + ms;
    for (;;) {
      const next = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      time = next[1].at; timers.delete(next[0]); next[1].fn(); await flush();
    }
    time = end; await flush();
  };
  const stop = startJsonPolling({ request: '/feed', intervalMs: 100, timeoutMs: 50, fetchImpl, documentRef: doc,
    onData: value => data.push(value), onError: error => errors.push(error),
    setTimer: (fn, delay) => { timers.set(++id, { fn, at: time + delay }); return id; }, clearTimer: key => timers.delete(key), now: () => time });
  return { advance, data, errors, stop, timers, listeners, visibility: state => { doc.visibilityState = state; for (const f of listeners) f(); } };
}
for (const phase of ['fetch', 'body']) {
  test(`poll deadline releases hung ${phase}, aborts and ignores its late result after recovery`, async () => {
    let resolveLate, signal, calls = 0;
    const h = harness((_, init) => {
      calls++; signal ??= init.signal;
      if (calls > 1) return Promise.resolve({ ok: true, json: async () => ({ round: calls }) });
      const pending = new Promise(resolve => { resolveLate = resolve; });
      return phase === 'fetch' ? pending : Promise.resolve({ ok: true, json: () => pending });
    });
    await h.advance(0); await h.advance(49);
    assert.equal(h.errors.length, 0);
    await h.advance(1);
    assert.equal(h.errors.length, 1, 'deadline includes response body');
    assert.equal(signal.aborted, true);
    await h.advance(200);
    assert.deepEqual(h.data, [{ round: 2 }]);
    resolveLate(phase === 'fetch' ? { ok: true, json: async () => ({ round: 1 }) } : { round: 1 });
    await flush();
    assert.deepEqual(h.data, [{ round: 2 }]);
    h.stop(); assert.equal(h.timers.size, 0);
  });
}
test('hidden deadline preserves backoff until foreground and 5xx recovery resets interval', async () => {
  let calls = 0;
  const h = harness(async () => {
    calls++;
    if (calls === 1) return new Promise(() => {});
    return { ok: calls > 2, status: 503, json: async () => ({ round: calls }) };
  });
  await h.advance(0); h.visibility('hidden'); await h.advance(1000);
  assert.equal(h.errors.length, 1); assert.equal(calls, 1);
  h.visibility('visible'); await h.advance(0);
  assert.equal(calls, 2);
  await h.advance(399); assert.equal(calls, 2);
  await h.advance(1); assert.deepEqual(h.data, [{ round: 3 }]);
  await h.advance(100); assert.equal(calls, 4);
  h.stop();
});
for (const phase of ['fetch', 'body']) {
  test(`unmount aborts active ${phase}, clears deadline and rejects late delivery`, async () => {
    let signal, finish;
    const h = harness((_, init) => {
      signal = init.signal;
      const pending = new Promise(resolve => { finish = resolve; });
      return phase === 'fetch' ? pending : Promise.resolve({ ok: true, json: () => pending });
    });
    await h.advance(0); h.stop();
    assert.equal(signal?.aborted, true);
    assert.equal(h.timers.size, 0); assert.equal(h.listeners.size, 0);
    finish(phase === 'fetch' ? { ok: true, json: async () => ({ late: true }) } : { late: true });
    await flush(); await h.advance(1000);
    assert.deepEqual(h.data, []); assert.deepEqual(h.errors, []);
  });
}
