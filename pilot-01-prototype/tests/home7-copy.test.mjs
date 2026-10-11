import assert from "node:assert/strict";
import test from "node:test";

import { H7_COPY, h7IsFallback } from "../src/components/v7/home7-copy.js";

const locales = ["zh-Hans", "en", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
const enKeys = Object.keys(H7_COPY.en).sort();
const enCatKeys = Object.keys(H7_COPY.en.inCat).sort();
const fnKeys = enKeys.filter((key) => typeof H7_COPY.en[key] === "function");
const samples = [
  ["cta", ["OKX"]],
  ["pw", [10]],
  ["cap", [10]],
  ["inAsOf", ["x"]],
  ["inAgo", [0]],
  ["inAgo", [5 * 36e5]],
  ["inAgo", [3 * 864e5]],
  ["lowest", ["OKX", "$1"]],
  ["most", ["OKX", "$1"]],
  ["foot", ["2026-10-01"]],
  ["lgVol", ["$100,000", "Maker"]],
  ["lgShare", ["OKX"]],
  ["lgGo", ["Binance"]],
];

test("home v7 copy exposes all 17 locales", () => {
  assert.deepEqual(Object.keys(H7_COPY).sort(), [...locales].sort());
});

test("every locale has exactly the en key set and inCat key set", () => {
  for (const locale of locales) {
    const copy = H7_COPY[locale];
    assert.deepEqual(Object.keys(copy).sort(), enKeys, `${locale} keys`);
    assert.deepEqual(Object.keys(copy.inCat).sort(), enCatKeys, `${locale} inCat keys`);
    for (const key of enCatKeys) assert.ok(typeof copy.inCat[key] === "string" && copy.inCat[key].trim(), `${locale}.inCat.${key} non-empty`);
    for (const key of enKeys) {
      if (key === "inCat" || key === "how" || fnKeys.includes(key)) continue;
      if (key === "sep") {
        assert.equal(typeof copy.sep, "string", `${locale}.sep is a string (may be empty)`);
        continue;
      }
      assert.ok(typeof copy[key] === "string" && copy[key].trim(), `${locale}.${key} non-empty string`);
    }
  }
});

test("every locale has howH and three [title, body] how steps", () => {
  for (const locale of locales) {
    const copy = H7_COPY[locale];
    assert.ok(typeof copy.howH === "string" && copy.howH.trim(), `${locale}.howH non-empty`);
    assert.ok(Array.isArray(copy.how) && copy.how.length === 3, `${locale}.how has 3 steps`);
    copy.how.forEach((step, i) => {
      assert.ok(Array.isArray(step) && step.length === 2, `${locale}.how[${i}] is a pair`);
      for (const part of step) assert.ok(typeof part === "string" && part.trim(), `${locale}.how[${i}] non-empty strings`);
    });
  }
});

test("function-valued keys are functions returning non-empty strings", () => {
  for (const locale of locales) {
    const copy = H7_COPY[locale];
    for (const key of fnKeys) assert.equal(typeof copy[key], "function", `${locale}.${key} is a function`);
    for (const [key, args] of samples) {
      const out = copy[key](...args);
      assert.equal(typeof out, "string", `${locale}.${key}(${args}) type`);
      assert.ok(out.trim().length > 0, `${locale}.${key}(${args}) non-empty`);
    }
  }
});

test("cap and foot keep {max}, h1b keeps {max}%; lgMax has a line break", () => {
  for (const locale of locales) {
    const copy = H7_COPY[locale];
    assert.ok(copy.cap(10).includes("{max}"), `${locale}.cap {max}`);
    assert.ok(copy.foot("2026-10-01").includes("{max}"), `${locale}.foot {max}`);
    assert.ok(copy.h1b.includes("{max}%"), `${locale}.h1b {max}%`);
    assert.ok(copy.lgMax.includes("\n"), `${locale}.lgMax line break`);
  }
});

test("no listed locale falls back to English", () => {
  for (const locale of locales) assert.equal(h7IsFallback(locale), false, `${locale} not fallback`);
});
