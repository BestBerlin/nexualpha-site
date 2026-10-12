import test from "node:test";
import assert from "node:assert/strict";
import { nexubo, sam } from "./characters.mjs";

const NEXUBO_POSES = [
  "wave",
  "point",
  "hold-phone",
  "shield",
  "thumbs-up",
  "facepalm",
];

const NEXUBO_EXPRESSIONS = [
  "neutral",
  "happy",
  "thinking",
  "careful",
  "surprised",
  "warning",
  "worried",
  "celebrating",
  "confused",
];

const SAM_POSES = ["rest", "point", "wave", "hold-phone"];
const SAM_EXPRESSIONS = [
  "neutral",
  "happy",
  "confused",
  "worried",
  "surprised",
];

const NEXUBO_RIG_HOOKS = [
  "rig-body",
  "rig-eyes",
  "rig-mouth",
  "rig-arm-left",
  "rig-arm-right",
  "rig-antenna-light",
];

const SAM_RIG_HOOKS = [
  "rig-body",
  "rig-eyes",
  "rig-mouth",
  "rig-arm-left",
  "rig-arm-right",
];

const collectIds = (svg) =>
  [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);

test("nexubo covers every requested pose and expression combo", async () => {
  for (const pose of NEXUBO_POSES) {
    for (const expression of NEXUBO_EXPRESSIONS) {
      const id = `nexubo-${pose}-${expression}`;
      const svg = await nexubo({ id, pose, expression, antenna: "blue" });
      assert.match(svg, /^<svg /);
      assert.ok(svg.includes('data-character="nexubo"'));
      assert.ok(svg.includes(`data-pose="${pose}"`));
      assert.ok(svg.includes(`data-expression="${expression}"`));
      for (const hook of NEXUBO_RIG_HOOKS) assert.ok(svg.includes(hook));
      assert.ok(svg.includes(`id="${id}-title"`));
      assert.ok(svg.includes(`aria-labelledby="${id}-title ${id}-desc"`));
    }
  }
});

test("sam covers every pose and expression combo through async API", async () => {
  for (const pose of SAM_POSES) {
    for (const expression of SAM_EXPRESSIONS) {
      const id = `sam-${pose}-${expression}`;
      const svg = await sam({ id, pose, expression });
      assert.match(svg, /^<svg /);
      assert.ok(svg.includes('data-character="sam"'));
      assert.ok(svg.includes(`data-pose="${pose}"`));
      assert.ok(svg.includes(`data-expression="${expression}"`));
      for (const hook of SAM_RIG_HOOKS) assert.ok(svg.includes(hook));
      assert.ok(svg.includes(`id="${id}-title"`));
      assert.ok(svg.includes(`aria-labelledby="${id}-title ${id}-desc"`));
    }
  }
});

test("multi-instance character markup has distinct namespaced ids", async () => {
  const instances = await Promise.all([
    nexubo({ id: "scene-nexubo-a", pose: "wave", expression: "happy" }),
    nexubo({ id: "scene-nexubo-b", pose: "shield", expression: "warning" }),
    sam({ id: "scene-sam-a", pose: "point", expression: "confused" }),
    sam({ id: "scene-sam-b", pose: "hold-phone", expression: "surprised" }),
  ]);
  const ids = collectIds(instances.join("\n"));
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(!ids.includes("title"));
  assert.ok(!ids.includes("desc"));
  for (const prefix of [
    "scene-nexubo-a",
    "scene-nexubo-b",
    "scene-sam-a",
    "scene-sam-b",
  ]) {
    assert.ok(ids.some((id) => id.startsWith(`${prefix}-`)));
  }
});

test("nexubo preserves the Bitcoin belly coin vector path", async () => {
  const svg = await nexubo({
    id: "coin-check",
    pose: "thumbs-up",
    expression: "celebrating",
  });
  assert.ok(svg.includes('class="rig-coin"'));
  assert.ok(svg.includes('fill="#f7931a"'));
  assert.ok(
    svg.includes(
      "M-8 -16 L-8 16 M-8 -16 H3 A7.5 8 0 0 1 3 0 H-8 M-8 0 H5 A8 8 0 0 1 5 16 H-8 M-3 -21 V-16 M3 -21 V-16 M-3 16 V21 M3 16 V21",
    ),
  );
});

test("nexubo antenna tint writes explicit child fills", async () => {
  const svg = await nexubo({
    id: "antenna-check",
    pose: "facepalm",
    expression: "confused",
    antenna: "#ed5969",
  });
  const antennaGroup = svg.match(
    /<g id="antenna-check-antenna-light" class="rig-antenna-light"[^>]*>.*?<\/g>/,
  )?.[0];
  assert.ok(antennaGroup);
  assert.equal((antennaGroup.match(/fill="#ed5969"/g) || []).length, 2);
  assert.ok(antennaGroup.includes('fill="#ffffff"'));
});
