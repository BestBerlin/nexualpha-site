// Mobile lab harness (scorecard T4): metric math is pure and pinned here; the browser part runs in scripts/mobile-lab.mjs.
import assert from "node:assert/strict";
import test from "node:test";
import {
  CONDITIONS,
  DEFAULT_PAGES,
  compareTable,
  cumulativeLayoutShift,
  markdownTable,
  median,
  metricsFromObservations,
  summarizeRuns,
  totalBlockingTime,
} from "../scripts/mobile-lab.mjs";

test("conditions match the Lighthouse mobile profile the scorecard names", () => {
  assert.deepEqual(CONDITIONS.viewport, { width: 390, height: 844 });
  assert.equal(CONDITIONS.deviceScaleFactor, 2);
  assert.equal(CONDITIONS.cpuThrottlingRate, 4);
  assert.equal(CONDITIONS.network.latency, 562.5);
  assert.equal(CONDITIONS.network.downloadThroughput, Math.round((1.6 * 1024 * 1024) / 8));
  assert.equal(CONDITIONS.network.uploadThroughput, Math.round((750 * 1024) / 8));
  assert.equal(CONDITIONS.tbtWindowAfterLoadMs, 5000);
  for (const page of ["/", "/exchanges", "/exchanges/okx", "/news", "/liquidations", "/tr", "/vi"]) assert.ok(DEFAULT_PAGES.includes(page), page);
  assert.ok(DEFAULT_PAGES.some((page) => /^\/news\/[a-z0-9-]+$/.test(page)), "one article page");
});

test("TBT counts only the part of each long task beyond 50 ms inside [FCP, load + 5 s]", () => {
  // 120 ms task fully inside -> 70; 50 ms task -> 0; 51 ms task -> 1.
  assert.equal(totalBlockingTime([{ startTime: 1000, duration: 120 }], 500, 10000), 70);
  assert.equal(totalBlockingTime([{ startTime: 1000, duration: 50 }], 500, 10000), 0);
  assert.equal(totalBlockingTime([{ startTime: 1000, duration: 51 }], 500, 10000), 1);
  // A task straddling FCP counts only after FCP: 400..600 with FCP 500 -> 100 ms -> 50.
  assert.equal(totalBlockingTime([{ startTime: 400, duration: 200 }], 500, 10000), 50);
  // A task straddling the window end is clipped too: 9900..10200 with end 10000 -> 100 ms -> 50.
  assert.equal(totalBlockingTime([{ startTime: 9900, duration: 300 }], 500, 10000), 50);
  // Before FCP or after the window: nothing.
  assert.equal(totalBlockingTime([{ startTime: 100, duration: 300 }, { startTime: 10001, duration: 500 }], 500, 10000), 0);
  // Sum of several tasks.
  assert.equal(totalBlockingTime([{ startTime: 600, duration: 100 }, { startTime: 2000, duration: 250 }, { startTime: 3000, duration: 40 }], 500, 10000), 50 + 200);
  // Degenerate window or bad entries.
  assert.equal(totalBlockingTime([{ startTime: 600, duration: 100 }], 1000, 1000), 0);
  assert.equal(totalBlockingTime([{ startTime: Number.NaN, duration: 100 }], 0, 1000), 0);
  assert.equal(totalBlockingTime(undefined, 0, 1000), 0);
});

test("CLS is the largest session window of shifts without recent input", () => {
  const shifts = [
    { startTime: 100, value: 0.05, hadRecentInput: false },
    { startTime: 600, value: 0.05, hadRecentInput: false }, // same window (< 1 s gap): 0.10
    { startTime: 3000, value: 0.08, hadRecentInput: false }, // new window: 0.08
    { startTime: 3200, value: 0.5, hadRecentInput: true }, // input: ignored
  ];
  assert.ok(Math.abs(cumulativeLayoutShift(shifts) - 0.1) < 1e-9);
  // A window closes after 5 s even with < 1 s gaps.
  const steady = Array.from({ length: 12 }, (_, i) => ({ startTime: i * 900, value: 0.01, hadRecentInput: false }));
  assert.ok(Math.abs(cumulativeLayoutShift(steady) - 0.06) < 1e-9);
  assert.equal(cumulativeLayoutShift([]), 0);
});

test("median of runs ignores missing values; run summaries take the median of each metric", () => {
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([null, undefined, Number.NaN]), null);
  const runs = [
    { lcp: 3000, fcp: 2000, tbt: 100, cls: 0, bytes: 700, requests: 40 },
    { lcp: 2800, fcp: 1900, tbt: 300, cls: 0.02, bytes: 710, requests: 41 },
    { lcp: 3100, fcp: 2100, tbt: 50, cls: 0.01, bytes: 690, requests: 40 },
    { error: "timeout" },
  ];
  assert.deepEqual(summarizeRuns(runs), { lcp: 3000, fcp: 2000, tbt: 100, cls: 0.01, bytes: 700, requests: 40, runs: 3 });
});

test("metrics derive FCP, LCP, TBT and CLS from what the page observed", () => {
  const metrics = metricsFromObservations({
    paints: [{ name: "first-paint", startTime: 900 }, { name: "first-contentful-paint", startTime: 1000 }],
    lcpEntries: [{ startTime: 1000 }, { startTime: 1800 }],
    longTasks: [{ startTime: 800, duration: 300 }, { startTime: 3000, duration: 80 }, { startTime: 9000, duration: 100 }],
    shifts: [{ startTime: 1200, value: 0.004, hadRecentInput: false }],
    loadEventEnd: 3500,
  });
  // 800..1100 clipped to 1000..1100 -> 50; 3000..3080 -> 30; 9000 is after load + 5 s (8500) -> 0.
  assert.deepEqual(metrics, { fcp: 1000, lcp: 1800, tbt: 80, cls: 0.004 });
  assert.deepEqual(metricsFromObservations({ paints: [], loadEventEnd: null }), { fcp: null, lcp: null, tbt: null, cls: 0 });
});

test("report tables print medians and before -> after pairs", () => {
  const before = { pages: [{ path: "/", median: { lcp: 3356, fcp: 3356, tbt: 60, cls: 0, bytes: 768000, requests: 49 } }] };
  const after = { pages: [{ path: "/", median: { lcp: 980, fcp: 980, tbt: 103, cls: 0, bytes: 797000, requests: 49 } }] };
  assert.match(markdownTable(after), /\| \/ \| 980 ms \| 980 ms \| 103 ms \| 0\.000 \| 778 KB \| 49 \|/);
  assert.match(compareTable(before, after), /\| \/ \| 3356 ms → 980 ms \| 3356 ms → 980 ms \| 60 ms → 103 ms \| 0\.000 → 0\.000 \| 750 KB → 778 KB \| 49 → 49 \|/);
});
