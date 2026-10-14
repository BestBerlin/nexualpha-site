import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("home flash rail accepts an SSR snapshot, then refreshes through the shared live hub", () => {
  const rail = read("../src/components/flash/FlashRail.jsx");
  assert.match(rail, /function initialRows\(initial\)/);
  assert.match(rail, /export function FlashRail\(\{ locale = "en", initial \}\)/);
  assert.match(rail, /useState\(\(\) => initialRows\(initial\)\)/);
  assert.match(rail, /subscribeLiveHub\("flash"/);
  assert.match(rail, /FLASH_REFRESH_MS = LIVE_HUB_REFRESH_MS/);
  assert.match(rail, /entries\.some\(\(entry\) => entry\.isIntersecting\)/);
});

test("home passes initialFlash from App to HomeBelowFold and FlashRail", () => {
  const app = read("../src/App.jsx");
  const home = read("../src/components/v7/HomeV7.jsx");
  const below = read("../src/components/v7/home7-below.jsx");
  assert.match(app, /<HomeV7[^>]*initialFlash=\{initialFlash\}/);
  assert.match(home, /export function HomeV7\(\{[^}]*initialFlash[^}]*\}\)/);
  assert.match(home, /<StableHomeBelowFold[^>]*initialFlash=\{initialFlash\}/);
  assert.match(below, /export function HomeBelowFold\(\{[^}]*initialFlash[^}]*\}\)/);
  assert.match(below, /<FlashRail locale=\{locale\} initial=\{initialFlash\} \/>/);
});

test("worker home SSR renders with the live flash stream payload", () => {
  const worker = read("../worker/index.js");
  assert.match(worker, /readFlashItems\(env, url\)\.then\(\(items\) => flashStreamPayload\(items, publicRoute\.locale \|\| "en", \{ limit: 5, now: flashNow\(env\) \}\)\)/);
  assert.match(worker, /\.\.\.\(flash \? \{ flash \} : \{\}\)/);
  assert.match(worker, /rendered\.includes\('id="h7-flash"'\)/);
  assert.match(worker, /\.\.\.state, homeContext: activityRequestContext\(url\)/);
});
