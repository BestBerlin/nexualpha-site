import test from "node:test";
import assert from "node:assert/strict";
import { sampleFrom, report, collectFreshness, collectFreshnessWithRetry } from "./data-freshness.mjs";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

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

test("a failed freshness fetch writes a failure sample and current heartbeat atomically", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "freshness-resilience-"));
  const file = path.join(dir, "samples.jsonl");
  try {
    const sample = await collectFreshness({ file, now: () => now, fetchImpl: async () => { throw new Error("EAI_AGAIN"); } });
    assert.equal(sample.ok, false);
    assert.equal(sample.sourceStatus.marketFeed.status, "error");
    assert.equal(JSON.parse(readFileSync(file)).error, "EAI_AGAIN");
    assert.equal(JSON.parse(readFileSync(`${file}.heartbeat.json`)).updatedAt, new Date(now).toISOString());
    assert.equal(readdirSync(dir).some((name) => name.endsWith(".tmp")), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("freshness startup retries network failures and exits cleanly after its bounded budget", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "freshness-retry-"));
  let clock = now;
  const waits = [];
  try {
    const sample = await collectFreshnessWithRetry({
      file: path.join(dir, "samples.jsonl"), now: () => clock, startupBudgetMs: 3_000,
      wait: async (ms) => { waits.push(ms); clock += ms; },
      fetchImpl: async () => { throw new Error("EAI_AGAIN"); },
    });
    assert.equal(sample.ok, false);
    assert.deepEqual(waits, [1_000, 2_000]);
    assert.equal(sample.updatedAt, new Date(now + 3_000).toISOString());
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
