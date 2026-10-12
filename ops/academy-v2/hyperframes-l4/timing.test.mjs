import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import script from "./script.json" with { type: "json" };
import { estimateTiming, loadTiming } from "./timing.mjs";

const smallScript = {
  scenes: [
    {
      voice_zh: "你好世界",
      min_s: 1,
    },
    {
      voice_zh: "注册之前先准备证件。",
      min_s: 2,
    },
  ],
};

test("estimateTiming returns deterministic frame-rounded scene timings", () => {
  const timing = estimateTiming(smallScript);

  assert.equal(timing.version, 1);
  assert.equal(timing.fps, 30);
  assert.equal(timing.introDuration, 3);
  assert.deepEqual(
    timing.scenes.map((scene) => ({ id: scene.id, duration: scene.duration })),
    [
      { id: "scene-1", duration: 1.4 },
      { id: "scene-2", duration: 2.4 },
    ],
  );

  for (const scene of timing.scenes) {
    assert.ok(scene.words.length > 0);
    assert.equal(scene.words[0].start, 0);
    assert.equal(
      scene.words.at(-1).end,
      Number((scene.duration - 0.4).toFixed(6)),
    );
    for (let index = 1; index < scene.words.length; index += 1) {
      assert.ok(scene.words[index].start >= scene.words[index - 1].end);
    }
  }
});

test("estimateTiming validates script scene minima and voices", () => {
  assert.throws(
    () =>
      estimateTiming({
        scenes: [{ voice_zh: "有效", min_s: Number.POSITIVE_INFINITY }],
      }),
    /scene-1\.min_s/,
  );
  assert.throws(
    () => estimateTiming({ scenes: [{ voice_zh: "", min_s: 1 }] }),
    /scene-1\.voice_zh/,
  );
});

test("loadTiming accepts a real local timing override and rounds to frames", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hyperframes-timing-"));
  try {
    const overridePath = join(dir, "timing.json");
    await writeFile(
      overridePath,
      JSON.stringify({
        version: 1,
        fps: 30,
        introDuration: 3,
        scenes: [
          { id: "scene-1", seconds: 1.01 },
          { id: "scene-2", seconds: 2.41 },
        ],
      }),
    );

    const timing = await loadTiming(overridePath, smallScript);

    assert.deepEqual(
      timing.scenes.map((scene) => scene.duration),
      [1.033333, 2.433333],
    );
    assert.equal(timing.scenes[1].words.at(-1).end, 2.033333);
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
});

test("loadTiming preserves supplied per-word timing when valid", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hyperframes-timing-"));
  try {
    const overridePath = join(dir, "timing.json");
    const words = [
      { text: "你好", start: 0, end: 0.5 },
      { text: "世界", start: 0.5, end: 1.2 },
    ];
    await writeFile(
      overridePath,
      JSON.stringify({
        version: 1,
        fps: 30,
        introDuration: 3,
        scenes: [
          { id: "scene-1", duration: 1.4, words },
          { id: "scene-2", seconds: 2.4 },
        ],
      }),
    );

    const timing = await loadTiming(overridePath, smallScript);

    assert.deepEqual(timing.scenes[0].words, words);
    assert.equal(timing.scenes[0].duration, 1.4);
    assert.equal(timing.scenes[1].words.at(-1).end, 2);
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
});

test("loadTiming rejects invalid overrides before returning timing", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hyperframes-timing-"));
  try {
    const badIdPath = join(dir, "bad-id.json");
    await writeFile(
      badIdPath,
      JSON.stringify({
        version: 1,
        fps: 30,
        introDuration: 3,
        scenes: [
          { id: "scene-x", seconds: 1.1 },
          { id: "scene-2", seconds: 2.1 },
        ],
      }),
    );

    await assert.rejects(
      () => loadTiming(badIdPath, smallScript),
      /scene-1 override id/,
    );

    const tooShortPath = join(dir, "too-short.json");
    await writeFile(
      tooShortPath,
      JSON.stringify({
        version: 1,
        fps: 30,
        introDuration: 3,
        scenes: [
          { id: "scene-1", seconds: 0.9 },
          { id: "scene-2", seconds: 2.1 },
        ],
      }),
    );

    await assert.rejects(
      () => loadTiming(tooShortPath, smallScript),
      /scene-1 override seconds must be at least min_s/,
    );
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
});

test("loadTiming rejects malformed supplied word timing", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hyperframes-timing-"));
  try {
    const overlapPath = join(dir, "overlap.json");
    await writeFile(
      overlapPath,
      JSON.stringify({
        version: 1,
        fps: 30,
        introDuration: 3,
        scenes: [
          {
            id: "scene-1",
            duration: 1.4,
            words: [
              { text: "你好", start: 0, end: 0.8 },
              { text: "世界", start: 0.7, end: 1.1 },
            ],
          },
          { id: "scene-2", duration: 2.4 },
        ],
      }),
    );
    await assert.rejects(
      () => loadTiming(overlapPath, smallScript),
      /overlaps the previous word/,
    );

    const boundsPath = join(dir, "bounds.json");
    await writeFile(
      boundsPath,
      JSON.stringify({
        version: 1,
        fps: 30,
        introDuration: 3,
        scenes: [
          {
            id: "scene-1",
            duration: 1.4,
            words: [{ text: "越界", start: 0, end: 1.5 }],
          },
          { id: "scene-2", duration: 2.4 },
        ],
      }),
    );
    await assert.rejects(
      () => loadTiming(boundsPath, smallScript),
      /exceeds scene duration/,
    );

    const nanPath = join(dir, "nan.json");
    await writeFile(
      nanPath,
      JSON.stringify({
        version: 1,
        fps: 30,
        introDuration: 3,
        scenes: [
          {
            id: "scene-1",
            duration: 1.4,
            words: [{ text: "坏值", start: null, end: 1 }],
          },
          { id: "scene-2", duration: 2.4 },
        ],
      }),
    );
    await assert.rejects(
      () => loadTiming(nanPath, smallScript),
      /start must be finite/,
    );
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
});

test("loadTiming rejects an explicit missing override path", async () => {
  await assert.rejects(
    () =>
      loadTiming(
        join(tmpdir(), "missing-hyperframes-timing.json"),
        smallScript,
      ),
    /ENOENT/,
  );
});

test("real copied script estimates all local scenes with exact generated ids", () => {
  const timing = estimateTiming(script);

  assert.equal(timing.scenes.length, script.scenes.length);
  assert.deepEqual(
    timing.scenes.map((scene) => scene.id),
    script.scenes.map((_, index) => `scene-${index + 1}`),
  );
  assert.deepEqual(
    timing.scenes.map((scene) => scene.duration),
    [9.4, 11.4, 10.4, 11.4, 12.4, 10.4, 8.4, 11.4],
  );
});
