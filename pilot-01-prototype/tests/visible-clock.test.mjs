import assert from "node:assert/strict";
import test from "node:test";

test("visible clock shares one minute timer, pauses page lifecycle, and refreshes when visible again", async () => {
  const priorDocument = globalThis.document;
  const priorWindow = globalThis.window;
  const priorSetInterval = globalThis.setInterval;
  const priorClearInterval = globalThis.clearInterval;
  const priorDateNow = Date.now;
  const visibilityListeners = new Set();
  const pagehideListeners = new Set();
  const pageshowListeners = new Set();
  const timers = new Map();
  let nextTimer = 0;
  let now = 1_000;
  globalThis.document = {
    visibilityState: "visible",
    addEventListener(type, fn) { if (type === "visibilitychange") visibilityListeners.add(fn); },
    removeEventListener(type, fn) { if (type === "visibilitychange") visibilityListeners.delete(fn); },
  };
  globalThis.window = {
    addEventListener(type, fn) {
      if (type === "pagehide") pagehideListeners.add(fn);
      if (type === "pageshow") pageshowListeners.add(fn);
    },
    removeEventListener(type, fn) {
      if (type === "pagehide") pagehideListeners.delete(fn);
      if (type === "pageshow") pageshowListeners.delete(fn);
    },
  };
  globalThis.setInterval = (fn, delay) => { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; };
  globalThis.clearInterval = (id) => timers.delete(id);
  Date.now = () => now;
  try {
    const { subscribeVisibleClock } = await import(`../src/components/shared/visible-clock.js?case=${Date.now()}`);
    const a = [];
    const b = [];
    const stopA = subscribeVisibleClock((value) => a.push(value), { everyMs: 30_000 });
    const stopB = subscribeVisibleClock((value) => b.push(value), { everyMs: 60_000 });
    assert.equal(visibilityListeners.size, 1);
    assert.equal(pagehideListeners.size, 1);
    assert.equal(pageshowListeners.size, 1);
    assert.equal(timers.size, 1, "both subscribers share one timer");
    assert.deepEqual([...timers.values()].map((timer) => timer.delay), [60_000]);
    now = 61_000;
    [...timers.values()][0].fn();
    assert.deepEqual(a, [1_000, 61_000]);
    assert.deepEqual(b, [1_000, 61_000]);
    globalThis.document.visibilityState = "hidden";
    for (const fn of [...visibilityListeners]) fn();
    assert.equal(timers.size, 0, "hidden tabs do not keep the clock interval running");
    globalThis.document.visibilityState = "visible";
    now = 62_000;
    for (const fn of [...visibilityListeners]) fn();
    assert.equal(a.at(-1), 62_000, "visible return refreshes consumers immediately");
    assert.equal(timers.size, 1);
    for (const fn of [...pagehideListeners]) fn();
    assert.equal(timers.size, 0, "pagehide clears the shared interval");
    now = 63_000;
    for (const fn of [...pageshowListeners]) fn();
    assert.equal(b.at(-1), 63_000, "pageshow refreshes consumers immediately");
    assert.equal(timers.size, 1);
    stopA();
    stopB();
    assert.equal(visibilityListeners.size, 0);
    assert.equal(pagehideListeners.size, 0);
    assert.equal(pageshowListeners.size, 0);
    assert.equal(timers.size, 0);
  } finally {
    if (priorDocument === undefined) delete globalThis.document;
    else globalThis.document = priorDocument;
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
    globalThis.setInterval = priorSetInterval;
    globalThis.clearInterval = priorClearInterval;
    Date.now = priorDateNow;
  }
});
