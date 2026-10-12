import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { captionBand, illustration } from "./components.mjs";
import { estimateTiming } from "./timing.mjs";
const script = JSON.parse(
  await readFile(new URL("./script.json", import.meta.url), "utf8"),
);
test("caption groups retain supplied word timing and obey both composition budgets", () => {
  const timing = estimateTiming(script);
  for (const scene of timing.scenes)
    for (const limit of [12, 16]) {
      const { groups } = captionBand(scene.words, limit);
      assert.deepEqual(groups.flat(), scene.words);
      groups.forEach((group) =>
        assert.ok([...group.map((w) => w.text).join("")].length <= limit),
      );
    }
});
test("final scene keeps QR, official URL, code and disclosure together", () => {
  const html = illustration(script.scenes.at(-1), 7);
  for (const text of [
    "assets/qr.svg",
    "okx.com/join/nexu888",
    "nexu888",
    "合作推广链接，佣金由交易所支付",
  ])
    assert.ok(html.includes(text));
  assert.match(illustration(script.scenes[0], 0), /示意画面，非真实界面/);
});
test("both generated masters have full duration and distinct native composition dimensions", async () => {
  const timing = estimateTiming(script);
  const total = 3 + timing.scenes.reduce((sum, s) => sum + s.duration, 0);
  for (const [format, w, h] of [
    ["landscape", 1920, 1080],
    ["portrait", 1080, 1920],
  ]) {
    const html = await readFile(
      new URL(`./${format}/index.html`, import.meta.url),
      "utf8",
    );
    assert.ok(
      html.includes(`data-width="${w}" data-height="${h}" data-fps="30"`),
    );
    assert.ok(html.includes(`data-duration="${total}"`));
    assert.match(html, /window\.__timelines\s*=\s*\{\s*academy:\s*tl\s*\}/);
    assert.equal((html.match(/<section id="scene-/g) || []).length, 8);
    assert.ok(!html.includes("<audio"));
    assert.ok(!html.includes("https://cdn"));
  }
});
