import assert from "node:assert/strict";
import test from "node:test";
import { REGIONAL_FUNDING_VERIFICATION_MATRIX } from "../src/data/regional-funding-verification-matrix.js";
import { sanitizeDecisionFunding } from "../src/data/decision-passport.js";
import { directoryContextSearch, regionalCtaState, venueMarketStatus } from "../src/data/directory-context.js";
import * as ctaContext from "../src/data/directory-cta-context.js";
import * as directoryContext from "../src/data/directory-context.js";
import { REGIONAL_FUNDING_RAILS } from "../src/data/regional-funding-rails.generated.js";

test("compact funding projection exactly matches the source matrix", () => {
  assert.deepEqual(REGIONAL_FUNDING_RAILS, Object.fromEntries(REGIONAL_FUNDING_VERIFICATION_MATRIX.map(({ market, paymentRails }) => [market, paymentRails])));
});

test("the directory re-exports the same lightweight CTA helpers", () => {
  for (const [name, helper] of Object.entries(ctaContext)) assert.equal(directoryContext[name], helper, name);
});

test("passport accepts every source funding rail with unchanged spelling and rejects other markets", () => {
  for (const row of REGIONAL_FUNDING_VERIFICATION_MATRIX) {
    for (const rail of row.paymentRails) {
      assert.equal(sanitizeDecisionFunding(` ${rail.toLocaleUpperCase("en-US")} `, row.market), rail);
      assert.equal(sanitizeDecisionFunding(rail, "XX"), null);
    }
  }
  assert.equal(sanitizeDecisionFunding("HKD 銀行轉帳", "HK"), "HKD 銀行轉帳");
  assert.equal(sanitizeDecisionFunding("invented funding rail", "BR"), null);
});

test("regional CTA context retains fail-closed states and source funding parameters", () => {
  for (const market of ["BR", "ID", "TW", "HK", "TR", "JP", "US"]) {
    const row = REGIONAL_FUNDING_VERIFICATION_MATRIX.find((item) => item.market === market);
    const funding = row.paymentRails[0];
    const params = new URLSearchParams(directoryContextSearch({ market, product: "spot", locale: "tr", accountStage: "new_account", funding }));
    assert.equal(params.get("market"), market);
    assert.equal(params.get("funding"), funding);
    assert.equal(params.get("locale"), "tr");
    assert.equal(params.get("utm_campaign"), `${market.toLowerCase()}-research-preview`);
    assert.equal(regionalCtaState({ market, status: "unverified" }), "verify");
    assert.equal(regionalCtaState({ market, status: "restricted" }), "blocked");
    assert.equal(venueMarketStatus({ supportedRegions: [market === "JP" ? "japan" : "global"] }, market), market === "JP" ? "matched" : "unverified");
  }
});
