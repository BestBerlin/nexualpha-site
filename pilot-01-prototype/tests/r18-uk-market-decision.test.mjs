import assert from "node:assert/strict";
import test from "node:test";
import {
  UK_MARKET_DECISION,
  UK_MARKET_DECISION_BOUNDARY,
  UK_MARKET_DECISION_REVIEWED_AT,
  UK_MARKET_DECISION_SCOPE,
  UK_MARKET_DECISION_SOURCE_REFS,
  UK_MARKET_DECISION_VISIBLE_CHECKLIST,
  ukMarketDecisionSummary,
} from "../src/data/uk-market-decision.js";

const unsafePublicPattern = /https?:\/\/|www\.|invite|invitation|referral|referrer|approved|guaranteed|guarantee|邀请码|注册链接|外链/i;

test("UK market decision exposes a four-step visible research checklist", () => {
  assert.equal(UK_MARKET_DECISION_REVIEWED_AT, "2026-09-28");
  assert.match(UK_MARKET_DECISION_SCOPE, /UK research checklist/);
  assert.match(UK_MARKET_DECISION_BOUNDARY, /Research-only/);
  assert.equal(UK_MARKET_DECISION.status, "research-only");
  assert.equal(UK_MARKET_DECISION.market, "UK");
  assert.equal(UK_MARKET_DECISION.fiatCurrency, "GBP");

  assert.deepEqual(
    UK_MARKET_DECISION_VISIBLE_CHECKLIST.map((step) => step.id),
    [
      "fca-service-entity",
      "identity-appropriateness-onboarding",
      "gbp-funding-bank-name-deposit-withdrawal",
      "product-marketing-scope",
    ],
  );
  assert.deepEqual(
    UK_MARKET_DECISION_VISIBLE_CHECKLIST.map((step) => step.order),
    [1, 2, 3, 4],
  );
  assert.deepEqual(
    UK_MARKET_DECISION_VISIBLE_CHECKLIST.map((step) => step.title),
    [
      "FCA / service entity",
      "Identity + appropriateness / onboarding",
      "GBP funding + bank-name / deposit-withdrawal",
      "Product / marketing scope",
    ],
  );

  for (const step of UK_MARKET_DECISION_VISIBLE_CHECKLIST) {
    assert.equal(step.status, "research-only");
    assert.ok(step.decisionQuestion);
    assert.ok(step.checks.length >= 3, step.id);
    assert.ok(step.uiFlags.length >= 3, step.id);
    assert.ok(step.sourceRefs.length >= 1, step.id);
  }
});

test("UK market decision keeps conclusions research-only and free of commercial CTA tokens", () => {
  const serialized = JSON.stringify(UK_MARKET_DECISION);
  assert.doesNotMatch(serialized, unsafePublicPattern);
  assert.doesNotMatch(JSON.stringify(UK_MARKET_DECISION_SOURCE_REFS), unsafePublicPattern);
  assert.match(UK_MARKET_DECISION.boundary, /does not decide account acceptance/);
  assert.match(UK_MARKET_DECISION.cannotConclude.join(" "), /Specific user account acceptance/);
  assert.match(UK_MARKET_DECISION.cannotConclude.join(" "), /Specific GBP funding access/);
  assert.match(UK_MARKET_DECISION.cannotConclude.join(" "), /Specific product access/);
});

test("UK market decision covers FCA entity, onboarding, GBP funding, and marketing scope details", () => {
  const [entity, onboarding, funding, marketing] = UK_MARKET_DECISION.visibleChecklist;

  assert.match(entity.checks.join(" "), /UK-facing service entity/);
  assert.match(entity.checks.join(" "), /AML\/CTF registration context/);
  assert.match(entity.checks.join(" "), /custody/);
  assert.deepEqual(entity.sourceRefs, ["fca-cryptoasset-register-context", "fca-crypto-financial-promotions"]);

  assert.match(onboarding.checks.join(" "), /government photo ID/);
  assert.match(onboarding.checks.join(" "), /client categorisation/);
  assert.match(onboarding.checks.join(" "), /appropriateness assessment/);
  assert.match(onboarding.checks.join(" "), /TIN/);

  assert.match(funding.checks.join(" "), /GBP balance/);
  assert.match(funding.checks.join(" "), /Faster Payments/);
  assert.match(funding.checks.join(" "), /Easy Bank Transfer/);
  assert.match(funding.checks.join(" "), /bank-account name match/);
  assert.match(funding.checks.join(" "), /add-cash and cash-out separately/);
  assert.match(funding.checks.join(" "), /settlement time/);

  assert.match(marketing.checks.join(" "), /buy, sell, trade, custody, transfer, staking, derivatives/);
  assert.match(marketing.checks.join(" "), /risk warnings/);
  assert.match(marketing.checks.join(" "), /cooling-off/);
  assert.match(marketing.checks.join(" "), /commercial incentives/);
  assert.match(marketing.checks.join(" "), /blocked unless official UK terms/);
});

test("UK market decision summary is UI-friendly and source references stay URL-free", () => {
  const summary = ukMarketDecisionSummary();
  assert.deepEqual(summary, {
    market: "UK",
    reviewedAt: UK_MARKET_DECISION_REVIEWED_AT,
    status: "research-only",
    checklistIds: UK_MARKET_DECISION.visibleChecklist.map((step) => step.id),
    sourceKeys: UK_MARKET_DECISION.sourceRefs.map((source) => source.key),
  });

  assert.equal(UK_MARKET_DECISION_SOURCE_REFS.length, 4);
  for (const source of UK_MARKET_DECISION_SOURCE_REFS) {
    assert.match(source.key, /^[a-z0-9-]+$/);
    assert.ok(source.label);
    assert.ok(source.role);
    assert.equal(source.reviewedAt, UK_MARKET_DECISION_REVIEWED_AT);
    assert.equal(Object.hasOwn(source, "url"), false);
  }
});
