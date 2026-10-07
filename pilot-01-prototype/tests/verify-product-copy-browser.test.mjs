import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const script = await readFile(new URL("../scripts/verify-product-copy-browser.mjs", import.meta.url), "utf8");

test("product copy browser harness bounds image decode waits", () => {
  assert.match(script, /function settlePageForVisualCheck/);
  assert.match(script, /pendingLazyImages/);
  assert.doesNotMatch(script, /Promise\.all\(Array\.from\(document\.images\)\.map\(\(image\) => image\.decode/);
});

test("product copy browser harness caps serialized DOM text evidence", () => {
  assert.match(script, /const compact = \(value, limit = 240\)/);
  assert.match(script, /querySelectorAll\(selector\)\)\.slice\(0, limit\)/);
});

test("product copy browser harness accepts clean path locale switches", () => {
  assert.match(script, /stripLocalePrefix/);
  assert.match(script, /localePathPrefixes = \[\.\.\.locales\.map[^\n]+"id-id"\]/);
  assert.match(script, /documentElement\.lang/);
  assert.match(script, /pathLocale/);
  assert.match(script, /language switch must preserve route path/);
});

test("targeted locale diagnostics filter source fact checks", () => {
  assert.match(script, /activeSourceFactLocales = args\.locales\.length/);
  assert.match(script, /filter\(\(locale\) => activeLocales\.includes\(locale\)\)/);
});

test("expected build verification hydrates deferred production pages", () => {
  assert.match(script, /script\[data-nexualpha-deferred-hydration\]/);
  assert.match(script, /page\.mouse\.wheel\(\{ deltaY: 1 \}\)/);
  assert.match(script, /document\.documentElement\.dataset\.build === buildId/);
});
