import assert from "node:assert/strict";
import test from "node:test";
import { JSON_POLL_BACKOFF_MAX_MS, startJsonPolling } from "../src/components/shared/json-polling.js";

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

function fakeClock() {
  let now = 0, id = 0;
  const timers = new Map();
  const setTimer = (fn, delay) => {
    const key = ++id;
    timers.set(key, { fn, at: now + delay });
    return key;
  };
  const clearTimer = (key) => timers.delete(key);
  const nextAt = () => Math.min(...[...timers.values()].map((t) => t.at));
  const advance = async (ms) => {
    const end = now + ms;
    for (;;) {
      let nextKey = null, next = null;
      for (const [key, value] of timers) {
        if (value.at <= end && (!next || value.at < next.at)) { nextKey = key; next = value; }
      }
      if (!next) break;
      now = next.at;
      timers.delete(nextKey);
      next.fn();
      await flush();
    }
    now = end;
    await flush();
  };
  return { setTimer, clearTimer, advance, now: () => now, nextDelay: () => nextAt() - now, count: () => timers.size };
}

function fakeDocument(state = "visible") {
  const listeners = new Set();
  return {
    visibilityState: state,
    addEventListener(type, fn) { if (type === "visibilitychange") listeners.add(fn); },
    removeEventListener(type, fn) { if (type === "visibilitychange") listeners.delete(fn); },
    dispatch(stateNext) {
      this.visibilityState = stateNext;
      for (const fn of [...listeners]) fn();
    },
    listenerCount: () => listeners.size,
  };
}

test("json polling backs off exponentially up to two minutes and resets after a good payload", async () => {
  assert.equal(JSON_POLL_BACKOFF_MAX_MS, 120_000);
  const clock = fakeClock();
  const calls = [];
  const fetchImpl = async () => {
    calls.push(Date.now());
    return calls.length < 3 ? new Response("no", { status: 503 }) : Response.json({ ok: true });
  };
  const received = [];
  const stop = startJsonPolling({
    request: "/api/ticker.json",
    intervalMs: 1000,
    fetchImpl,
    onData: (data) => received.push(data),
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    now: clock.now,
  });
  await clock.advance(0);
  assert.equal(calls.length, 1);
  assert.equal(clock.nextDelay(), 2000);
  await clock.advance(1999);
  assert.equal(calls.length, 1);
  await clock.advance(1);
  assert.equal(calls.length, 2);
  assert.equal(clock.nextDelay(), 4000);
  await clock.advance(4000);
  assert.equal(calls.length, 3);
  assert.deepEqual(received, [{ ok: true }]);
  assert.equal(clock.nextDelay(), 1000);
  stop();

  const capped = fakeClock();
  let cappedCalls = 0;
  const stopCapped = startJsonPolling({
    request: "/api/flash.json",
    intervalMs: 70_000,
    fetchImpl: async () => { cappedCalls += 1; return new Response("no", { status: 503 }); },
    onData: () => {},
    setTimer: capped.setTimer,
    clearTimer: capped.clearTimer,
    now: capped.now,
  });
  await capped.advance(0);
  assert.equal(cappedCalls, 1);
  assert.equal(capped.nextDelay(), JSON_POLL_BACKOFF_MAX_MS);
  stopCapped();
});

test("json polling pauses hidden tabs, resumes visible tabs, and keeps one fetch in flight", async () => {
  const clock = fakeClock();
  const doc = fakeDocument("hidden");
  const pending = [];
  const fetchImpl = () => new Promise((resolve) => pending.push(resolve));
  const received = [];
  let resolveData;
  const dataSeen = new Promise((resolve) => { resolveData = resolve; });
  const stop = startJsonPolling({
    request: "/api/movers.json",
    intervalMs: 1000,
    fetchImpl,
    documentRef: doc,
    onData: (data) => { received.push(data); resolveData(); },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    now: clock.now,
  });
  await clock.advance(10_000);
  assert.equal(pending.length, 0, "hidden tabs do not start a request");
  doc.dispatch("visible");
  await clock.advance(0);
  assert.equal(pending.length, 1);
  await clock.advance(10_000);
  assert.equal(pending.length, 1, "no overlapping fetch while the first request is unresolved");
  pending[0](Response.json({ rows: [1] }));
  await dataSeen;
  await flush();
  assert.deepEqual(received, [{ rows: [1] }]);
  assert.equal(clock.nextDelay(), 1000);
  doc.dispatch("hidden");
  assert.equal(clock.count(), 0, "scheduled visible-tab poll is cancelled when hidden");
  stop();
  assert.equal(doc.listenerCount(), 0);
});

test("json polling can keep hidden flash-page polling only after notification opt-in", async () => {
  const clock = fakeClock();
  const doc = fakeDocument("hidden");
  let notify = false, calls = 0;
  const stop = startJsonPolling({
    request: () => "/api/flash.json?locale=en&limit=30",
    intervalMs: 1000,
    immediate: false,
    fetchImpl: async () => { calls += 1; return Response.json({ items: [{ id: String(calls) }] }); },
    documentRef: doc,
    shouldPoll: () => doc.visibilityState !== "hidden" || notify,
    isData: (data) => Array.isArray(data?.items),
    onData: () => {},
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    now: clock.now,
  });
  await clock.advance(5000);
  assert.equal(calls, 0);
  notify = true;
  doc.dispatch("hidden");
  await clock.advance(1000);
  assert.equal(calls, 1, "notification opt-in keeps hidden flash polling alive");
  stop();
});

test("json polling preserves the due time and backoff while paused", async () => {
  const clock = fakeClock();
  const doc = fakeDocument("visible");
  let allow = true, calls = 0;
  const stop = startJsonPolling({
    request: "/api/movers.json",
    intervalMs: 1000,
    fetchImpl: async () => { calls += 1; return new Response("no", { status: 503 }); },
    documentRef: doc,
    shouldPoll: () => allow && doc.visibilityState === "visible",
    onData: () => {},
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    now: clock.now,
  });
  await clock.advance(0);
  assert.equal(calls, 1);
  assert.equal(clock.nextDelay(), 2000);
  allow = false;
  stop.sync();
  assert.equal(clock.count(), 0, "pause clears the timer without forgetting the due time");
  await clock.advance(1999);
  allow = true;
  stop.sync();
  assert.equal(clock.nextDelay(), 1, "resume keeps the original backoff due time");
  await clock.advance(1);
  assert.equal(calls, 2);
  assert.equal(clock.nextDelay(), 4000);
  doc.dispatch("hidden");
  assert.equal(clock.count(), 0);
  await clock.advance(2000);
  doc.dispatch("visible");
  assert.equal(clock.nextDelay(), 2000, "hidden/visible does not reset the error backoff to zero");
  stop();
});
