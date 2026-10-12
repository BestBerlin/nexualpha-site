import test from "node:test";
import assert from "node:assert/strict";
import { backfillLedgerLines, computeRamp, indexedVerdict, planInspections } from "./measure.mjs";

const DAY = 864e5;
const now = Date.parse("2026-10-20T01:10:00Z");

test("indexedVerdict maps GSC coverage states", () => {
  assert.equal(indexedVerdict({ verdict: "PASS", coverageState: "Submitted and indexed" }), "indexed");
  assert.equal(indexedVerdict({ verdict: "NEUTRAL", coverageState: "Discovered - currently not indexed" }), "not_indexed");
  assert.equal(indexedVerdict({ verdict: "NEUTRAL", coverageState: "URL is unknown to Google" }), "unknown_to_google");
  assert.equal(indexedVerdict(null), null);
});

test("planInspections: +7 d before +24 h, skips flagged and done, respects budget", () => {
  const articles = [
    { slug: "a", publishedAt: new Date(now - 8 * DAY).toISOString() },
    { slug: "b", publishedAt: new Date(now - 2 * DAY).toISOString() },
    { slug: "c", publishedAt: new Date(now - 3 * 3600_000).toISOString() },
    { slug: "thin", publishedAt: new Date(now - 2 * DAY).toISOString() },
    { slug: "done", publishedAt: new Date(now - 2 * DAY).toISOString() },
  ];
  const state = { inspections: { done: { h24: { verdict: "PASS" } } } };
  const plan = planInspections(articles, state, now, 10, new Set(["thin"]));
  assert.deepEqual(plan.map((item) => [item.slug, item.check]), [["a", "d7"], ["b", "h24"]]);
  assert.equal(planInspections(articles, state, now, 1).length, 1);
});

test("computeRamp: stage 0 until 7 good days, steps down after 5 bad days", () => {
  const good = (date) => ({ date, rate7: 0.7, imprPerArticle14: 2, imprPerArticlePrev14: 1 });
  const bad = (date) => ({ date, rate7: 0.1, imprPerArticle14: 0, imprPerArticlePrev14: 0 });
  assert.equal(computeRamp([{ date: "2026-10-12", rate7: null }], 0).stage, 0);
  const six = Array.from({ length: 6 }, (_, i) => good(`2026-10-${String(10 + i).padStart(2, "0")}`));
  assert.equal(computeRamp(six, 0).stage, 0);
  assert.equal(computeRamp([...six, good("2026-10-16")], 0).stage, 1);
  assert.equal(computeRamp([...six, good("2026-10-16")], 0).cap, 30);
  const falling = Array.from({ length: 7 }, (_, i) => ({ ...good(`2026-10-${10 + i}`), imprPerArticle14: 1, imprPerArticlePrev14: 2 }));
  assert.equal(computeRamp(falling, 0).stage, 0, "falling impressions block the ramp");
  const fiveBad = Array.from({ length: 5 }, (_, i) => bad(`2026-10-${20 + i}`));
  assert.equal(computeRamp(fiveBad, 1).stage, 0);
});

test("backfillLedgerLines resolves pending rows and keeps other lines byte-identical", () => {
  const lines = [
    '{"slug":"x","states":{"indexed":"pending"}}',
    '{"slug": "y", "states": {"indexed": "pending"}}',
    "",
  ];
  const inspections = { x: { h24: { verdict: "NEUTRAL", coverageState: "Discovered - currently not indexed", inspectedAt: "2026-10-13T01:00:00Z" } } };
  const { lines: out, changed } = backfillLedgerLines(lines, inspections);
  assert.equal(changed, 1);
  assert.equal(JSON.parse(out[0]).states.indexed, "not_indexed");
  assert.equal(JSON.parse(out[0]).states.gsc.check, "h24");
  assert.equal(out[1], lines[1]);
  assert.equal(backfillLedgerLines(out, inspections).changed, 0, "idempotent");
});
