import test from "node:test";
import assert from "node:assert/strict";
import { buildRegistrationDecisionState } from "../src/components/v3/registration-decision-state.js";

test("registration decision state marks a fully verified partner route available", () => {
  assert.deepEqual(
    buildRegistrationDecisionState({
      publicCta: { hasPartnerRoute: true, benefitVerified: true },
      regionalCta: { direct: true, ctaState: "available", ctaHref: "https://partner.example/join?ref=keep-me" },
      decisionPassport: {},
    }),
    {
      state: "available",
      canOpenThirdParty: true,
      protectedHref: "https://partner.example/join?ref=keep-me",
      reason: "available",
      hasPassportContext: false,
    },
  );
});

test("registration decision state preserves protected hrefs while requiring first-page verification", () => {
  const decision = buildRegistrationDecisionState({
    publicCta: { hasPartnerRoute: true, benefitVerified: false },
    regionalCta: { direct: true, ctaState: "verify", ctaHref: "https://www.bsmkweb.cc/join?ref=11350287&utm_medium=web_share_copy" },
    decisionPassport: { market: "HK", product: "spot", accountStage: "new_account", funding: "HKD bank transfer" },
  });

  assert.equal(decision.state, "verify-first");
  assert.equal(decision.canOpenThirdParty, true);
  assert.equal(decision.protectedHref, "https://www.bsmkweb.cc/join?ref=11350287&utm_medium=web_share_copy");
  assert.equal(decision.reason, "region-verify");
  assert.equal(decision.hasPassportContext, true);
});

test("registration decision state blocks external jumps for blocked regions", () => {
  const decision = buildRegistrationDecisionState({
    publicCta: { hasPartnerRoute: true, benefitVerified: true },
    regionalCta: { direct: false, ctaState: "blocked", ctaHref: "/exchanges/binance#registration-path" },
    decisionPassport: { market: "US", product: "perpetuals" },
    officialRouteUrl: "https://www.binance.com",
  });

  assert.equal(decision.state, "blocked");
  assert.equal(decision.canOpenThirdParty, false);
  assert.equal(decision.protectedHref, null);
  assert.equal(decision.reason, "region-blocked");
});

test("registration decision state treats official source routes as verify-first", () => {
  const decision = buildRegistrationDecisionState({
    publicCta: { hasPartnerRoute: false, benefitVerified: false },
    regionalCta: { direct: false, ctaState: "verify", ctaHref: "/exchanges/coinbase#registration-path" },
    officialRouteUrl: "https://www.coinbase.com/signup",
  });

  assert.equal(decision.state, "verify-first");
  assert.equal(decision.canOpenThirdParty, false);
  assert.equal(decision.reason, "official-verify");
});

test("tracked official routes preserve verification state without opening partner actions", () => {
  for (const officialRouteUrl of ["/go/coinbase?src=registration-card-official-route", "/go/uniswap"]) {
    const decision = buildRegistrationDecisionState({ publicCta: { hasPartnerRoute: false }, regionalCta: { ctaState: "verify" }, officialRouteUrl });
    assert.equal(decision.state, "verify-first");
    assert.equal(decision.reason, "official-verify");
    assert.equal(decision.canOpenThirdParty, false);
  }
  for (const officialRouteUrl of ["//evil.test/go/coinbase", "/go/../coinbase", "/go/coinbase#anything"]) {
    assert.equal(buildRegistrationDecisionState({ officialRouteUrl }).state, "blocked");
  }
  assert.equal(buildRegistrationDecisionState({ regionalCta: { ctaState: "blocked" }, officialRouteUrl: "/go/coinbase" }).reason, "region-blocked");
});
