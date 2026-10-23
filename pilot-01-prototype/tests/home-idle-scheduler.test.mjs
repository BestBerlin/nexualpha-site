import assert from "node:assert/strict";
import test from "node:test";
import { createVisibilityScheduler } from "../src/components/shared/visibility-scheduler.js";
import { startJsonPolling } from "../src/components/shared/json-polling.js";
import { visibilityClock } from "./helpers/visibility-clock.mjs";

test("home polls and clocks share one timer; settled unchanged feeds do not render", async () => {
  for (const route of ["/", "/zh-hans", "/tr"]) {
    const clock = visibilityClock();
    const scheduler = createVisibilityScheduler(clock);
    let renders = 0, requests = 0, clockTicks = 0;
    const stops = [6000, 60000, 60000, 60000, 300000, 300000].map(intervalMs => startJsonPolling({
      request: "/cached-feed", intervalMs, scheduler, documentRef: clock.documentRef,
      fetchImpl: async () => { requests++; return Response.json({ items: [1], status: "ok" }); },
      onData: () => { renders++; },
      setTimer: clock.setTimer, clearTimer: clock.clearTimer, now: clock.now,
    }));
    for (const delay of [30000, 30000, 60000, 60000]) stops.push(scheduler.schedule(() => { clockTicks++; }, delay, { repeat: delay }));
    await clock.advance(0);
    assert.equal(clock.timers.size, 1, route);
    const before = clock.callbacks();
    await clock.advance(10000);
    assert.equal(clock.callbacks() - before, 1, "one ticker wakeup / 10 s = 0.5 / 5 s");
    assert.equal(requests, 7);
    assert.equal(renders, 6, "identical ticker payload does not reach React/DOM delivery");
    assert.equal(clockTicks, 0);
    clock.visibility("hidden");
    assert.equal(clock.timers.size, 0);
    const hiddenCallbacks = clock.callbacks();
    await clock.advance(60000);
    assert.equal(clock.callbacks(), hiddenCallbacks, "zero hidden-page timer callbacks");
    clock.visibility("visible"); await clock.advance(0);
    assert.equal(requests, 11, "four overdue feeds refresh once, not once for each missed interval");
    assert.equal(renders, 6);
    assert.equal(clockTicks, 4);
    assert.equal(clock.timers.size, 1);
    stops.forEach(stop => stop());
    assert.equal(clock.timers.size, 0);
    assert.equal(clock.listeners.size, 0);
    console.log(`${route}: 1 native timer, 0.5 callbacks/5s settled, 0 unchanged deliveries, 0 hidden callbacks`);
  }
});

test("an unchanged payload still checks expiry, changed/unavailable data replaces the last snapshot", async () => {
  const clock = visibilityClock(), scheduler = createVisibilityScheduler(clock);
  let value = { status: "ok", price: 1 }, success = 0;
  const received = [];
  const stop = startJsonPolling({ request: "/feed", intervalMs: 1000, initialData: value,
    scheduler, documentRef: clock.documentRef, now: clock.now, setTimer: clock.setTimer, clearTimer: clock.clearTimer,
    fetchImpl: async () => Response.json(value), onData: data => received.push(data), onSuccess: () => { success++; },
  });
  await clock.advance(1000);
  assert.equal(success, 2); assert.equal(received.length, 0);
  value = { status: "unavailable" }; await clock.advance(1000);
  assert.deepEqual(received, [{ status: "unavailable" }]);
  stop();
});

test("hidden in-flight deadlines expire, ignore late data and retain failure backoff", async () => {
  const clock = visibilityClock(), scheduler = createVisibilityScheduler(clock);
  let late, errors = 0, calls = 0;
  const received = [];
  const stop = startJsonPolling({ request: "/feed", intervalMs: 1000, timeoutMs: 100,
    scheduler, documentRef: clock.documentRef, now: clock.now, setTimer: clock.setTimer, clearTimer: clock.clearTimer,
    fetchImpl: () => { calls++; return new Promise(resolve => { late = resolve; }); },
    onData: data => received.push(data), onError: () => { errors++; },
  });
  await clock.advance(0); clock.visibility("hidden"); await clock.advance(100);
  assert.equal(errors, 1); assert.equal(clock.timers.size, 0);
  late(Response.json({ late: true })); await clock.advance(0);
  assert.deepEqual(received, []);
  clock.visibility("visible"); await clock.advance(1999); assert.equal(calls, 1);
  await clock.advance(1); assert.equal(calls, 2);
  stop(); assert.equal(clock.timers.size, 0); assert.equal(clock.listeners.size, 0);
});

test("recovery delivers an identical good payload after an error changed visible status", async () => {
  const clock = visibilityClock(), scheduler = createVisibilityScheduler(clock);
  const payload = { status: "ok", items: [1] };
  let failed = false, status = "ok", deliveries = 0;
  const stop = startJsonPolling({ request: "/feed", intervalMs: 1000, initialData: payload,
    scheduler, documentRef: clock.documentRef, now: clock.now, setTimer: clock.setTimer, clearTimer: clock.clearTimer,
    fetchImpl: async () => failed ? new Response("offline", { status: 503 }) : Response.json(payload),
    onData: () => { status = "ok"; deliveries++; }, onError: () => { status = "unavailable"; },
  });
  await clock.advance(0); assert.equal(deliveries, 0);
  failed = true; await clock.advance(1000); assert.equal(status, "unavailable");
  failed = false; await clock.advance(2000);
  assert.equal(status, "ok"); assert.equal(deliveries, 1);
  stop();
});
