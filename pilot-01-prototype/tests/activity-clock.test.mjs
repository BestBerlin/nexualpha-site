import assert from "node:assert/strict";
import test from "node:test";
import { scheduleActivityClock } from "../src/components/v3/activity/activity-clock.js";
import { visibleOfficialUpdates } from "../src/components/official-updates/official-updates-model.js";

test("existing approved feed expires while mounted, without refetch or gate changes", () => {
  let now = Date.parse("2026-09-07T09:00:00Z");
  let callback;
  let delay;
  let visible;
  const target = new EventTarget();
  const visibility = new EventTarget();
  const expiresAt = new Date(now + 3000).toISOString();
  const feed = [{ id: "approved", reviewStatus: "APPROVED", fixture: false, officialSource: { url: "https://www.binance.com/en/support/announcement" }, discoveredAt: "2026-09-07T08:00:00Z", verifiedAt: "2026-09-07T08:30:00Z", expiresAt }];
  let cleared = 0;
  const stop = scheduleActivityClock((time) => { visible = visibleOfficialUpdates(feed, time); }, [expiresAt], {
    now: () => now, setTimer: (fn, ms) => { callback = fn; delay = ms; return 1; }, clearTimer: () => { cleared += 1; }, target, visibility,
  });
  assert.equal(visible.length, 1);
  assert.equal(delay, 3001);
  now += 3001;
  callback();
  assert.equal(visible.length, 0);
  assert.equal(delay, 60000);
  const before = cleared;
  target.dispatchEvent(new Event("focus"));
  assert.ok(cleared > before);
  stop();
  const stopped = cleared;
  visibility.dispatchEvent(new Event("visibilitychange"));
  callback();
  assert.equal(cleared, stopped, "listeners and timer callback stop after cleanup");
});
