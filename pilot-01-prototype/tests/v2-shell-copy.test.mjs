import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { V2_SHELL_COPY_LOCALES, V2_SHELL_COPY_PATHS, V2_SHELL_COPY_ROOTS, buildV2ShellCopySnapshot, projectV2ShellCopy } from "../scripts/generate-v2-shell-copy.mjs";
import { intlLocale, v2Copy } from "../src/content/v2-copy.js";
import { intlLocale as shellIntlLocale, v2ShellCopy } from "../src/content/v2-shell-copy.js";
import { decisionWorkbenchCopy, assetCapabilityNoneCopy, routeCommonCopy } from "../src/content/v2-route-copy.js";

const USED_PATHS = V2_SHELL_COPY_PATHS;
const REQUIRED_APP_COPY_PATHS = [
  "opportunity.source",
  "decisionWorkbench.discovered",
  "common.feeSignal",
  "common.regionAvailability",
  "common.dimension",
];

function at(value, path) {
  return path.split(".").reduce((current, key) => current?.[key], value);
}

test("lazy route copy preserves its original labels in every public locale", () => {
  for (const locale of V2_SHELL_COPY_LOCALES) {
    const copy = v2Copy(locale);
    assert.deepEqual(decisionWorkbenchCopy(locale), { discovered: copy.decisionWorkbench.discovered, openOfficial: copy.decisionWorkbench.openOfficial });
    assert.equal(assetCapabilityNoneCopy(locale), copy.assetCapabilities.none);
    assert.deepEqual(routeCommonCopy(locale), Object.fromEntries(["verifiedSource", "feeSignal", "regionAvailability", "dimension"].map((key) => [key, copy.common[key]])));
  }
});

test("generated shell copy is an exact plain-data projection of original v2Copy for all shell locales", () => {
  assert.deepEqual(V2_SHELL_COPY_LOCALES, ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"]);
  assert.deepEqual(V2_SHELL_COPY_ROOTS, ["locale", "nav", "ui", "actions", "common", "hero", "finder", "markets", "discovery", "listings", "opportunity", "decisionWorkbench", "compare", "rail", "home"]);
  const snapshot = buildV2ShellCopySnapshot();
  for (const locale of V2_SHELL_COPY_LOCALES) {
    const expected = projectV2ShellCopy(v2Copy(locale));
    assert.deepEqual(snapshot[locale], expected, `${locale}: generator snapshot matches original v2Copy projection`);
    assert.deepEqual(v2ShellCopy(locale), expected, `${locale}: generated module matches original v2Copy projection`);
    for (const path of USED_PATHS) assert.deepEqual(at(v2ShellCopy(locale), path), at(v2Copy(locale), path), `${locale}: ${path}`);
    for (const path of REQUIRED_APP_COPY_PATHS) assert.notEqual(at(v2ShellCopy(locale), path), undefined, `${locale}: required App copy path ${path}`);
    assert.equal(shellIntlLocale(locale), intlLocale(locale), `${locale}: intlLocale alias`);
  }
});

test("shell copy falls back like the generated localized table and does not import the full catalog", async () => {
  assert.deepEqual(v2ShellCopy("en-US"), v2ShellCopy("en"));
  assert.deepEqual(v2ShellCopy("zz"), v2ShellCopy("en"));
  assert.equal(shellIntlLocale("zh-Hans"), "zh-CN");
  assert.equal(shellIntlLocale("pt-BR"), "pt-BR");
  const source = await readFile(new URL("../src/content/v2-shell-copy.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /^import\s/m, "shell copy must stay a generated plain table with no runtime imports");
  assert.doesNotMatch(source, /messages\.js|m\[/, "shell copy must not call Paraglide at runtime");
  assert.match(source, /"ur"/);
  assert.match(source, /"uk"/);
  assert.match(source, /"it"/);
});
