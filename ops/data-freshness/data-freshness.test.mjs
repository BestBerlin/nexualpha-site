import test from "node:test";
import assert from "node:assert/strict";
import { sampleFrom, report } from "./data-freshness.mjs";

const now = Date.parse("2026-10-11T12:00:00Z");
const rows = (n) => Array.from({ length: n }, (_, i) => ({ symbol: `S${i}`, binanceRate: 0.0001 }));

test("a sample passes only with ≥ 20 funding rows younger than 10 minutes", () => {
  assert.equal(sampleFrom({ generatedAt: "2026-10-11T11:55:00Z", funding: { generatedAt: "2026-10-11T11:55:00Z", rows: rows(20) } }, now).ok, true);
  assert.equal(sampleFrom({ funding: { generatedAt: "2026-10-11T11:49:00Z", rows: rows(20) } }, now).ok, false, "11 min old");
  assert.equal(sampleFrom({ funding: { generatedAt: "2026-10-11T11:59:00Z", rows: rows(19) } }, now).ok, false, "19 rows");
  assert.equal(sampleFrom({ funding: { generatedAt: "2026-10-11T11:59:00Z", rows: [...rows(19), { symbol: "X" }] } }, now).fundingRows, 19, "rows without a rate do not count");
  assert.equal(sampleFrom({}, now).ok, false);
});

test("report covers the last 7 days only", () => {
  const s = (t, ok, age = 3) => ({ t, ok, fundingAgeMin: age });
  const r = report([s("2026-10-01T00:00:00Z", false), s("2026-10-05T12:00:00Z", true), s("2026-10-08T00:00:00Z", false, 14), s("2026-10-11T11:00:00Z", true)], now);
  assert.equal(r.samples, 3);
  assert.equal(r.ok, 2);
  assert.equal(r.passRate, 66.7);
  assert.equal(r.daysCovered, 6);
  assert.equal(r.worstFundingAgeMin, 14);
});
