// QA 2026-10-10 (Q8): a market the official source says does not exist is "not offered", never "not yet checked".
import test from "node:test";
import assert from "node:assert/strict";
import { feeFact, feeDisplay, EXCHANGE_FACTS } from "../src/data/exchange-facts.js";
import { matrixCopy } from "../src/components/v3/exchange-matrix-copy.js";
const SUPPORTED_LOCALES = ["en", "zh-Hans", "zh-Hant", "ja", "ko", "tr", "es", "pt-BR", "fr", "de", "ru", "ar", "id", "vi", "it"];

test("dYdX spot is not offered while its perp fee stays checked", () => {
  assert.equal(feeFact("dydx", "spot").state, "none");
  assert.equal(feeDisplay("dydx", "spot"), null);
  assert.equal(feeFact("dydx", "perp").state, "checked");
});

test("unknown fees stay unchecked, not 'none' or zero", () => {
  for (const [slug, f] of Object.entries(EXCHANGE_FACTS)) {
    for (const p of ["spot", "perp"]) {
      const field = f.fields[p];
      if (field.state === "none") assert.equal(slug, "dydx", `${slug} ${p} marked not offered without a source note`);
      if (field.state !== "checked") assert.ok(field.maker == null && field.taker == null, `${slug} ${p} shows a figure while ${field.state}`);
    }
  }
});

test("every locale has its own not-offered label", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const c = matrixCopy(locale);
    assert.ok(c.notOffered && c.notOffered !== c.unchecked, locale);
  }
});
