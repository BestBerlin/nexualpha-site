import { createHash } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const get = (p) => readFile(new URL(p, import.meta.url), "utf8");
const css = await get("../src/components/v3/venue-yellow-pages.css");
const historical = await Promise.all(["venue-yellow-pages.before.css", "RULES.css", "MOBILE-BEFORE.css", "MOBILE-AFTER.css"].map(async (name) => {
  try { return await get(`../../style-evidence/${name}`); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}));
const [before, rulesBefore, mobileBefore, mobileAfter] = historical;
const historicalSkip = historical.some((value) => value === null) ? "Historical style-evidence directory CSS snapshots are unavailable in this checkout" : false;
const rules = css.slice(css.indexOf("/* Full directory: one primary route"), css.indexOf(".yellow-card__btn-toggle {", css.indexOf("/* Full directory: one primary route")));

test("bounded original directory action edit preserves the historical CSS snapshot", { skip: historicalSkip }, () => {
  assert.equal(css, before.replace(".yellow-card__btn-toggle {", rulesBefore + ".yellow-card__btn-toggle {").replace(mobileBefore, mobileAfter));
  assert.equal(css.replace(rulesBefore, "").replace(mobileAfter, mobileBefore), before);
});

test("utility hierarchy retains state and accessible motion-safe actions", () => {
  for (const token of ["min-block-size: 44px", "outline: 2px solid var(--blue-text)", 'aria-expanded="true"', "compare.is-selected", "compare:disabled", "prefers-reduced-motion", "pointer: coarse", "facts-heading"]) assert.ok(rules.includes(token), token);
  assert.ok(!rules.includes("transition: all"));
  assert.ok(!/display:\s*none|font-size|opacity:\s*0;/.test(rules));
});

test("mobile uses natural two-column directory actions without CSS order or concealment", () => {
  const mobile = [...css.matchAll(/\.yellow-card--directory \.yellow-card__actions\s*\{([^}]+)\}/g)].at(-1)?.[1];
  assert.ok(mobile, "mobile directory action rule exists");
  assert.ok(mobile.includes("repeat(2, minmax(0, 1fr))"));
  assert.ok(!/order:|grid-row:|grid-column:|display:/.test(mobile));
});

// Reviewed current registry snapshot includes the intentional owner-approved partner changes.
test("partner registry matches the reviewed current snapshot", async () => {
  const registry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(registry).digest("hex"), "3a69b03020089ccb700370fcac011230635fe21d00a5cdae39d342284b78ef83");
});
