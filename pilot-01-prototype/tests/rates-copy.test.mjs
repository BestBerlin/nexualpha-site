import assert from "node:assert/strict";
import test from "node:test";
import { matrixCopy as authoritative } from "../src/components/v3/exchange-matrix-copy.js";
import { matrixCopy as ratesCopy } from "../src/data/rates-matrix-copy.js";
import { costBasisCopy as ratesBasisCopy } from "../src/data/rates-matrix-copy.js";
import { partnerBenefitStatus as publicStatus } from "../src/data/partner-benefit-status.js";
import { partnerBenefitStatus } from "../src/data/partner-benefit-record.js";
import { costBasisCopy as publicBasis } from "../src/data/cost-decision-copy.js";
import { costBasisCopy } from "../src/data/cost-basis-copy.js";
import { supportedLocales } from "../src/content/locale-manifest.ts";

test("rates labels preserve the full matrix copy for every locale and alias", () => {
  for (const locale of [...supportedLocales, "zh-CN", "zh-TW", "pt", "pt-br", "en-US", "unknown", null]) {
    assert.deepEqual(ratesCopy(locale), Object.fromEntries(["all", "maker", "perp", "spot", "unchecked"].map((key) => [key, authoritative(locale)[key]])), String(locale));
    assert.deepEqual(ratesBasisCopy(locale), { rebate: costBasisCopy(locale).rebate }, String(locale));
  }
  assert.equal(publicBasis, costBasisCopy, "calculator API reexports the same cost-basis labels");
  assert.equal(publicStatus, partnerBenefitStatus, "partner labels and numeric consumers share one record implementation");
});
