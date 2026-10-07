import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { mobileHeightRoutes, mobileHeightViewport } from "../scripts/measure-mobile-height-baseline.mjs";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

test("mobile height baseline targets the P1 regional routes at 390px", () => {
  assert.deepEqual(mobileHeightViewport, {
    name: "mobile-390",
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
  });
  assert.deepEqual(mobileHeightRoutes.map((route) => route.path), [
    "/jp",
    "/kr",
    "/tr/markets/turkiye",
    "/mx",
    "/id",
  ]);
});

test("mobile height baseline records CTA geometry, repeated modules, and SSR text", async () => {
  const script = await readFile(path.join(projectRoot, "scripts/measure-mobile-height-baseline.mjs"), "utf8");

  assert.match(script, /documentHeight/, "document height is captured for before-after comparison");
  assert.match(script, /firstCta/, "first CTA geometry is captured");
  assert.match(script, /repeatedModuleGroups/, "repeated module groups are captured");
  assert.match(script, /rootTextLength/, "SSR-readable content is captured");
  assert.match(script, /heightReductionGoal/, "20% reduction target is documented in the output");
});

test("mobile height baseline does not import protected invitation-link registries", async () => {
  const script = await readFile(path.join(projectRoot, "scripts/measure-mobile-height-baseline.mjs"), "utf8");

  assert.doesNotMatch(script, /partner-registry|public-cta|regional-cta|venue-database/, "baseline measurement must stay read-only and avoid referral data imports");
});
