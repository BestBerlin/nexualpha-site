import { createHash } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const get = (p) => readFile(new URL(p, import.meta.url), "utf8");
const css = await get("../src/components/v3/activity/ActivityCenterV3.css");
const historical = await Promise.all(["before.css", "RULES.css", "MODE.css"].map(async (name) => {
  try { return await get(`../../style-evidence/${name}`); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}));
const [before, historicalRules, historicalMode] = historical;
const evidenceSkip = historical.some((value) => value === null) ? "Historical style-evidence/{before,RULES,MODE}.css snapshots are unavailable in this checkout" : false;
const rules = css.slice(css.indexOf(".activity-research-desk .activity-research-desk__heading {"), css.indexOf(".activity-research-desk:has("));
const mode = css.slice(css.indexOf(".activity-research-desk:has("), css.indexOf(".activity-center-v3__index-drawer {", css.indexOf(".activity-research-desk:has(")));

test("research desk scope preserves the historical CSS snapshot", { skip: evidenceSkip }, () => {
  assert.equal(css, before.replace(".activity-center-v3__index-drawer {", historicalRules + historicalMode + ".activity-center-v3__index-drawer {"));
  assert.equal(css.replace(historicalRules + historicalMode, ""), before);
});

test("native query entry and heading are readable without hiding, motion or new materials", () => {
  assert.ok(rules.includes("min-block-size: 44px"));
  assert.ok(rules.includes("focus-visible"));
  assert.ok(rules.includes("white-space: normal"));
  assert.ok(!/display:\s*none|animation:|(?:^|[;\s])transform:|transition:\s*all|background:/.test(rules));
});

test("native open swaps only direct summary grid and heading button, never source-index children", () => {
  assert.equal((mode.match(/display: none/g) || []).length, 1);
  assert.ok(mode.includes(":has(> .activity-center-v3__index-drawer[open]) > .activity-center-v3__reward-grid"));
  assert.ok(mode.includes(":has(> .activity-center-v3__index-drawer[open]) > .activity-research-desk__heading > button"));
  assert.ok(!mode.includes("summary {"));
  assert.ok(!mode.includes("__index-drawer >"));
  assert.ok(!mode.includes("!important"));
});

// Reviewed current registry snapshot includes the intentional owner-approved partner changes.
test("partner registry matches the reviewed current snapshot", async () => {
  const registry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(registry).digest("hex"), "3a69b03020089ccb700370fcac011230635fe21d00a5cdae39d342284b78ef83");
});
