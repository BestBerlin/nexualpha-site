import assert from "node:assert/strict";
import test from "node:test";
import {
  EU_MARKET_DECISION_BOUNDARY,
  EU_MARKET_DECISION_ROWS,
  EU_MARKET_DECISION_SCOPE,
  EU_MARKET_DECISION_SOURCE_DEPENDENCIES,
  euMarketDecisionFor,
  euMarketDecisionRowsFor,
  euMarketDecisionSummary,
} from "../src/data/eu-market-decision.js";

const forbiddenPublicPromise =
  /https?:\/\/|nexu888|11350287|LUCKX|CANDY007|INS898|1836370407|luckybitcoin|invite code|referral link|approved|approval|available|availability|signup|sign-up|register|registration|可用|批准|注册/i;

test("R18 EU market decision data exposes only France and Germany source-pending rows", () => {
  assert.match(EU_MARKET_DECISION_SCOPE, /Research-only EU member-state/);
  assert.match(EU_MARKET_DECISION_BOUNDARY, /source-pending and account-specific/);
  assert.deepEqual(EU_MARKET_DECISION_SOURCE_DEPENDENCIES, [
    "internationalSourceRegistry.EU",
    "REGIONAL_FUNDING_VERIFICATION_MATRIX.eu-eur-sepa",
  ]);
  assert.deepEqual(EU_MARKET_DECISION_ROWS.map((row) => row.memberState), ["FR", "DE"]);

  for (const row of EU_MARKET_DECISION_ROWS) {
    assert.match(row.id, /^eu-(fr|de)-source-pending$/);
    assert.equal(row.market, "EU");
    assert.equal(row.fiatCurrency, "EUR");
    assert.equal(row.sourceStatus, "source-pending");
    assert.ok(row.memberStateName);
    assert.ok(row.serviceAccountEntity.includes("service entity"));
    assert.equal(row.sepaBank.status, "source-pending");
    assert.equal(row.card.status, "source-pending");
    assert.equal(row.productScope.status, "source-pending");
    assert.match(row.sepaBank.signal, /SEPA|bank transfer/);
    assert.match(row.card.signal, /card funding/);
    assert.match(row.productScope.signal, /Spot, derivatives, staking, rewards and campaign/);
    assert.ok(row.unknowns.length >= 3);
    assert.match(row.unknowns.join(" "), /legal service entity|account entity/);
    assert.equal(row.action.kind, "research-only");
    assert.match(row.action.label, /source-pending/);
  }

  assert.doesNotMatch(JSON.stringify(EU_MARKET_DECISION_ROWS), forbiddenPublicPromise);
});

test("R18 EU market decision helpers provide UI-ready lookup without widening scope", () => {
  assert.equal(euMarketDecisionFor("fr").memberStateName, "France");
  assert.equal(euMarketDecisionFor(" DE ").memberStateName, "Germany");
  assert.equal(euMarketDecisionFor("IT"), null);
  assert.deepEqual(euMarketDecisionRowsFor(["DE", "IT"]).map((row) => row.memberState), ["DE"]);

  const summary = euMarketDecisionSummary(["FR", "DE"]);
  assert.equal(summary.reviewedAt, "2026-09-28");
  assert.deepEqual(summary.memberStates, ["FR", "DE"]);
  assert.deepEqual(summary.sourceStatuses, ["source-pending"]);
  assert.equal(summary.rows.length, 2);
  assert.doesNotMatch(JSON.stringify(summary), forbiddenPublicPromise);
});
