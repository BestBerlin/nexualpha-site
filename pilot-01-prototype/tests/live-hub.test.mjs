import assert from "node:assert/strict";
import test from "node:test";

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
  return { setTimer, clearTimer, advance, now: () => now, count: () => timers.size };
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

function fakeWindow() {
  const pagehide = new Set();
  const pageshow = new Set();
  return {
    addEventListener(type, fn) {
      if (type === "pagehide") pagehide.add(fn);
      if (type === "pageshow") pageshow.add(fn);
    },
    removeEventListener(type, fn) {
      if (type === "pagehide") pagehide.delete(fn);
      if (type === "pageshow") pageshow.delete(fn);
    },
    dispatchPageHide() { for (const fn of [...pagehide]) fn(); },
    dispatchPageShow() { for (const fn of [...pageshow]) fn(); },
    listenerCount: () => pagehide.size + pageshow.size,
  };
}

test("live hub fetches the combined endpoint once per locale and suppresses unchanged slice commits", async () => {
  const { subscribeLiveHub, LIVE_HUB_REFRESH_MS } = await import(`../src/components/shared/live-hub.js?case=${Date.now()}-locale`);
  const clock = fakeClock();
  const doc = fakeDocument();
  const seen = [];
  const received = [];
  let serial = 0;
  const stopFlash = subscribeLiveHub("flash", (slice, payload) => received.push({ slice, payload }), {
    locale: "zh-Hans",
    everyMs: 20,
    fetchImpl: async (url) => {
      seen.push(url);
      serial += 1;
      return { ok: true, json: async () => ({ flash: serial < 3 ? { items: [{ id: "same" }] } : { items: [{ id: "changed" }] }, funding: { rows: [serial] } }) };
    },
    documentRef: doc,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    now: clock.now,
  });
  await clock.advance(60);
  assert.equal(LIVE_HUB_REFRESH_MS, 30_000);
  assert.deepEqual(seen, [
    "/api/live.json?locale=zh-Hans",
    "/api/live.json?locale=zh-Hans",
    "/api/live.json?locale=zh-Hans",
    "/api/live.json?locale=zh-Hans",
  ]);
  assert.deepEqual(received.map((entry) => entry.slice.items[0].id), ["same", "changed"]);
  assert.equal(received[0].payload.funding.rows[0], 1);
  stopFlash();
  assert.equal(doc.listenerCount(), 0);
});

test("live hub keeps a page-locale poller and refreshes immediately after pagehide or hidden pause", async () => {
  const priorWindow = globalThis.window;
  const win = fakeWindow();
  globalThis.window = win;
  try {
    const { subscribeLiveHub } = await import(`../src/components/shared/live-hub.js?case=${Date.now()}-pagehide`);
    const clock = fakeClock();
    const doc = fakeDocument();
    const seen = [];
    const funding = [];
    const stop = subscribeLiveHub("funding", (slice) => funding.push(slice), {
      locale: "ar",
      everyMs: 20,
      fetchImpl: async (url) => { seen.push(url); return { ok: true, json: async () => ({ funding: { rows: [seen.length] } }) }; },
      documentRef: doc,
      setTimer: clock.setTimer,
      clearTimer: clock.clearTimer,
      now: clock.now,
    });
    await clock.advance(0);
    assert.deepEqual(seen, ["/api/live.json?locale=ar"]);
    assert.equal(win.listenerCount(), 2);
    win.dispatchPageShow();
    await clock.advance(0);
    assert.equal(seen.length, 1, "initial pageshow does not restart an active poll");
    win.dispatchPageHide();
    await clock.advance(100);
    assert.deepEqual(seen, ["/api/live.json?locale=ar"], "pagehide stops later polls");
    win.dispatchPageShow();
    await clock.advance(0);
    assert.deepEqual(seen, ["/api/live.json?locale=ar", "/api/live.json?locale=ar"], "pageshow resumes with an immediate hub fetch");
    doc.dispatch("hidden");
    await clock.advance(100);
    assert.equal(seen.length, 2);
    doc.dispatch("visible");
    await clock.advance(0);
    assert.equal(seen.length, 3, "visible return also refreshes immediately");
    assert.equal(funding.length, 3);
    stop();
    assert.equal(win.listenerCount(), 0);
    assert.equal(doc.listenerCount(), 0);
  } finally {
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
  }
});
