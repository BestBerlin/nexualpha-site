// Owner 2026-10-14: the home page has no "快讯 · 实时更新" flash rail and no flash polling; /flash itself stays and the
// footer keeps a link to it.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("home renders no flash rail and ships no rail component", () => {
  const home = read("../src/components/v7/HomeV7.jsx");
  const below = read("../src/components/v7/home7-below.jsx");
  assert.equal(existsSync(new URL("../src/components/flash/FlashRail.jsx", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/styles/v7/flash-rail.css", import.meta.url)), false);
  for (const source of [home, below]) {
    assert.doesNotMatch(source, /FlashRail|flash-rail\.css|initialFlash|\/api\/flash\.json/);
  }
});

test("worker home SSR no longer reads the flash stream and accepts the live render by the calculator marker", () => {
  const worker = read("../worker/index.js");
  const start = worker.indexOf("let renderedLiveHome = false;");
  const block = worker.slice(start, worker.indexOf("// Live ticker bar (2026-10-13)", start));
  assert.ok(start > 0 && block.length > 0);
  assert.doesNotMatch(block, /readFlashItems|flashStreamPayload|h7-flash/);
  assert.match(block, /rendered\.includes\('id="h7-calc"'\)/);
  assert.match(block, /\.\.\.state, homeContext: activityRequestContext\(url\)/);
});

test("the footer still links the /flash page", () => {
  const footer = read("../src/components/v3/CleanFooter.jsx");
  assert.match(footer, /href\("\/flash"\)/);
});
