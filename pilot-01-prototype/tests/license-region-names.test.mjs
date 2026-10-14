// Region names in SSR-rendered licence text come from a static table, not Intl.DisplayNames (2026-10-14): ICU differs
// between Node 20, Node 26 and browsers (zh-Hans HK: "中国香港特别行政区" vs "香港"), which threw React #418 on
// /zh-hans/exchanges/okx when the server and the browser disagreed.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { LICENSE_COUNTRIES, licenseCountryName } from "../src/data/licenses.js";
import { LICENSE_REGION_NAMES, licenseRegionName } from "../src/data/license-region-names.js";

const root = fileURLToPath(new URL("../src/", import.meta.url));
const UI_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "tr", "ru", "ar", "id", "vi", "ur", "uk"];

test("the static table names every licence country in every UI locale", () => {
  for (const locale of UI_LOCALES) {
    for (const { code } of LICENSE_COUNTRIES) {
      const name = LICENSE_REGION_NAMES[locale]?.[code];
      assert.ok(typeof name === "string" && name.length > 0 && name !== code, `${locale}/${code}`);
    }
  }
  assert.equal(licenseRegionName("HK", "zh-Hans"), "香港");
  assert.equal(licenseRegionName("HK", "zh-CN"), "香港");
});

test("licence country names do not depend on the runtime ICU (same text under any Intl build)", () => {
  const expected = Object.fromEntries(UI_LOCALES.map((locale) => [locale, LICENSE_COUNTRIES.map((c) => licenseCountryName(c.slug, locale))]));
  const original = Intl.DisplayNames;
  // Simulate a different ICU build (as Node 26 vs Node 20 vs a browser): any runtime lookup would change the output.
  Intl.DisplayNames = class { constructor() {} of(code) { return `ICU-${code}`; } };
  try {
    for (const locale of UI_LOCALES) assert.deepEqual(LICENSE_COUNTRIES.map((c) => licenseCountryName(c.slug, locale)), expected[locale], locale);
  } finally { Intl.DisplayNames = original; }
});

test("no Intl.DisplayNames call remains in code the app renders", () => {
  const files = [];
  const walk = (dir) => { for (const name of readdirSync(dir)) { const full = path.join(dir, name); if (statSync(full).isDirectory()) walk(full); else if (/\.(jsx?|tsx?|mjs)$/.test(name)) files.push(full); } };
  walk(root);
  // outbound-handoff-model.js keeps a runtime lookup for a full ISO select list; it must stay out of every render module.
  const allowed = new Set([path.join(root, "components/v3/outbound-handoff-model.js")]);
  const offenders = files.filter((file) => !allowed.has(file) && /new\s+Intl\.DisplayNames\s*\(/.test(readFileSync(file, "utf8")));
  assert.deepEqual(offenders.map((file) => path.relative(root, file)), []);
  const importers = files.filter((file) => /outbound-handoff-model/.test(readFileSync(file, "utf8")) && !allowed.has(file));
  assert.deepEqual(importers.map((file) => path.relative(root, file)), [], "outbound-handoff-model.js is not imported by render code");
});
