import assert from "node:assert/strict";
import test from "node:test";
import { experimentRegistry, getExperimentDefinition, resolveExperimentContext, validateExperimentDefinition, validateExperimentEventContext, validateExperimentRegistry } from "../src/data/experiment-registry.js";

const experiments = Object.values(experimentRegistry);

test("registered onsite experiments stay designed and first-party only", () => {
  for (const experiment of experiments) {
    assert.equal(experiment.status, "DESIGNED");
    assert.equal(experiment.outcomeClass, "first_party_behavior");
    assert.notEqual(experiment.control.id, experiment.treatment.id);
    assert.ok(experiment.requiredEvidence.includes("persistent_cta_events"));
    assert.ok(experiment.stopConditions.includes("persistent collector readiness is not verified"));
    assert.equal(experiment.winnerPolicy.lowSampleDecision, "INCONCLUSIVE");
    assert.equal(experiment.winnerPolicy.partnerOutcomeSubstitution, "FORBIDDEN");
    assert.ok(experiment.minimumSamplePerVariant >= 200);
    assert.deepEqual(Object.keys(experiment.guardrailLimits).sort(), [...experiment.guardrails].sort());
    assert.ok(experiment.observableOutcomes.length > 0);
    assert.ok(experiment.unavailableOutcomes.includes("partner_registration"));
    assert.ok(experiment.unavailableOutcomes.includes("partner_commission"));
    assert.ok(!experiment.requiredEvidence.includes("partner_confirmed_outcomes"));
    assert.ok(!experiment.stopConditions.some((condition) => condition.includes("partner confirmation")));
  }
});

test("Brazil comparison candidate has an activation gate but cannot activate traffic", () => {
  const experiment = getExperimentDefinition("br_compare_entry_v1");
  assert.equal(experiment.status, "DESIGNED");
  assert.equal(experiment.minimumSamplePerVariant, 200);
  assert.equal(experiment.exposureWindowDays, 14);
  assert.equal(experiment.attributionMaturityDays, 14);
  assert.deepEqual(experiment.activationGate.plannedAllocation, { control: 50, comparison: 50 });
  assert.equal(experiment.activationGate.status, "CANDIDATE_CONFIG_ONLY");
  assert.equal(experiment.activationGate.readyToActivate, false);
  assert.equal(experiment.activationGate.decision, "DO_NOT_ACTIVATE_FROM_CANDIDATE_CONFIG");
  assert.ok(experiment.activationGate.requiredChecks.some((check) => check.includes("invitation link invariants")));
  assert.deepEqual(experiment.guardrailLimits.cta_visible_rate, {
    type: "behavior_rate",
    direction: "minimum_relative_to_control",
    minimumRelativeToControl: 0.95,
    appliesAfter: { minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 },
    decision: "BLOCK_WINNER_CALL",
  });
  assert.deepEqual(experiment.guardrailLimits.referral_click_rate, {
    type: "behavior_rate",
    direction: "minimum_relative_to_control",
    minimumRelativeToControl: 0.9,
    appliesAfter: { minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 },
    decision: "BLOCK_WINNER_CALL",
  });
  assert.deepEqual(experiment.guardrailLimits.outbound_handoff_error_rate, {
    type: "technical_error_rate",
    direction: "maximum_absolute_rate",
    maximumRate: 0.005,
    appliesAfter: { minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 },
    decision: "BLOCK_WINNER_CALL",
  });
  assert.equal(validateExperimentDefinition(experiment).ok, true);
});

test("registry validates first-party outcome boundaries", () => {
  const result = validateExperimentRegistry();
  assert.equal(result.ok, true);
  assert.deepEqual(validateExperimentDefinition({ ...experimentRegistry.br_compare_entry_v1, control: { id: "same" }, treatment: { id: "same" } }), { ok: false, reason: "variants_must_differ" });
  assert.deepEqual(
    validateExperimentDefinition({
      ...experimentRegistry.br_compare_entry_v1,
      requiredEvidence: [...experimentRegistry.br_compare_entry_v1.requiredEvidence, "partner_confirmed_outcomes"],
    }),
    { ok: false, reason: "partner_outcomes_not_allowed_for_first_party_experiment" },
  );
  assert.deepEqual(
    validateExperimentDefinition({
      ...experimentRegistry.br_compare_entry_v1,
      stopConditions: [...experimentRegistry.br_compare_entry_v1.stopConditions, "partner confirmation data is unavailable for the conversion readout"],
    }),
    { ok: false, reason: "partner_confirmation_must_not_stop_first_party_experiment" },
  );
  assert.deepEqual(
    validateExperimentDefinition({
      ...experimentRegistry.br_compare_entry_v1,
      activationGate: { ...experimentRegistry.br_compare_entry_v1.activationGate, readyToActivate: true },
    }),
    { ok: false, reason: "candidate_gate_must_not_activate" },
  );
  assert.deepEqual(
    validateExperimentDefinition({
      ...experimentRegistry.br_compare_entry_v1,
      activationGate: { ...experimentRegistry.br_compare_entry_v1.activationGate, plannedAllocation: { control: 90, comparison: 5 } },
    }),
    { ok: false, reason: "activation_allocation_total_invalid" },
  );
  assert.deepEqual(
    validateExperimentDefinition({
      ...experimentRegistry.br_compare_entry_v1,
      guardrailLimits: {
        ...experimentRegistry.br_compare_entry_v1.guardrailLimits,
        unrelated_metric: experimentRegistry.br_compare_entry_v1.guardrailLimits.cta_visible_rate,
      },
    }),
    { ok: false, reason: "guardrail_limit_coverage_invalid" },
  );
  assert.deepEqual(
    validateExperimentDefinition({
      ...experimentRegistry.br_compare_entry_v1,
      guardrailLimits: {
        ...experimentRegistry.br_compare_entry_v1.guardrailLimits,
        cta_visible_rate: {
          ...experimentRegistry.br_compare_entry_v1.guardrailLimits.cta_visible_rate,
          appliesAfter: { minimumSamplePerVariant: 199, exposureWindowDays: 14, attributionMaturityDays: 14 },
        },
      },
    }),
    { ok: false, reason: "guardrail_limit_sample_window_invalid", guardrail: "cta_visible_rate" },
  );
  assert.deepEqual(
    validateExperimentDefinition({
      ...experimentRegistry.br_compare_entry_v1,
      guardrailLimits: {
        ...experimentRegistry.br_compare_entry_v1.guardrailLimits,
        outbound_handoff_error_rate: {
          ...experimentRegistry.br_compare_entry_v1.guardrailLimits.outbound_handoff_error_rate,
          maximumRate: 0.02,
        },
      },
    }),
    { ok: false, reason: "guardrail_limit_absolute_ceiling_invalid", guardrail: "outbound_handoff_error_rate" },
  );
});

test("international account-stage experiment measures onsite decisions, not registrations", () => {
  const experiment = getExperimentDefinition("international_account_stage_v1");
  assert.equal(experiment.market, "MULTI");
  assert.equal(experiment.variable, "account_stage_decision_copy");
  assert.ok(experiment.requiredEvidence.includes("account_stage_breakdown"));
  assert.ok(experiment.observableOutcomes.includes("decision_select"));
  assert.ok(!experiment.guardrails.includes("unverified_registration_rate"));
  assert.ok(experiment.guardrails.includes("unverified_outbound_click_rate"));
  assert.equal(experiment.guardrailLimits.unverified_outbound_click_rate.maximumRate, 0);
  assert.equal(experiment.guardrailLimits.unverified_outbound_click_rate.direction, "maximum_absolute_rate");
  assert.equal(validateExperimentDefinition(experiment).ok, true);
});

test("home and Bitget next-step experiment targets visible-without-click queues without partner outcome claims", () => {
  const experiment = getExperimentDefinition("home_bitget_next_step_v1");

  assert.equal(experiment.status, "DESIGNED");
  assert.equal(experiment.market, "MULTI");
  assert.deepEqual(experiment.routes, ["/", "/exchanges/bitget"]);
  assert.equal(experiment.variable, "partner_route_next_step_copy");
  assert.equal(experiment.primaryMetric, "referral_click_rate");
  assert.ok(experiment.requiredEvidence.includes("visible_no_click_queue"));
  assert.ok(experiment.observableOutcomes.includes("referral_click"));
  assert.ok(experiment.unavailableOutcomes.includes("partner_registration"));
  assert.ok(experiment.unavailableOutcomes.includes("partner_commission"));
  assert.equal(experiment.guardrailLimits.unverified_outbound_click_rate.maximumRate, 0);
  assert.ok(experiment.stopConditions.includes("constitutional invitation link invariants fail"));
  assert.equal(validateExperimentDefinition(experiment).ok, true);
});

test("partner Telegram context experiment measures handoff quality without claiming partner-side conversions", () => {
  const experiment = getExperimentDefinition("partner_telegram_context_v1");
  assert.equal(experiment.variable, "partner_telegram_context");
  assert.ok(experiment.requiredEvidence.includes("payload_validation_rows"));
  assert.ok(experiment.requiredEvidence.includes("telegram_entry_events"));
  assert.ok(experiment.observableOutcomes.includes("telegram_cta_click"));
  assert.ok(experiment.unavailableOutcomes.includes("partner_kyc"));
  assert.equal(experiment.guardrailLimits.payload_valid_rate.minimumRate, 1);
  assert.equal(experiment.guardrailLimits.privacy_suppression_rate.maximumRate, 0.001);
  assert.equal(experiment.guardrailLimits.privacy_suppression_rate.direction, "maximum_absolute_rate");
  assert.equal(validateExperimentDefinition(experiment).ok, true);
});

test("designed experiments cannot accept traffic or contaminate production events", () => {
  assert.deepEqual(resolveExperimentContext({ experiment: "br_compare_entry_v1", variant: "control", pathname: "/br", market: "BR" }), {
    ok: false,
    reason: "experiment_not_active",
    context: {},
  });
  assert.equal(validateExperimentEventContext({ experiment: "br_compare_entry_v1", variant: "control", page: "/br", market: "BR" }), false);
  assert.equal(validateExperimentEventContext({ page: "/br", market: "BR" }), true);
  assert.equal(validateExperimentEventContext({ experiment: "br_compare_entry_v1", page: "/br", market: "BR" }), false);
});

test("active experiments require an exact registered route, market and variant", () => {
  const active = { ...experimentRegistry.br_compare_entry_v1, status: "ACTIVE" };
  const registry = { br_compare_entry_v1: active };
  assert.deepEqual(resolveExperimentContext({ experiment: active.id, variant: "comparison", pathname: "/br/", market: "BR", registry }).context, {
    experiment: active.id,
    variant: "comparison",
  });
  assert.equal(resolveExperimentContext({ experiment: active.id, variant: "other", pathname: "/br", market: "BR", registry }).reason, "variant_not_registered");
  assert.equal(resolveExperimentContext({ experiment: active.id, variant: "control", pathname: "/", market: "BR", registry }).reason, "route_not_eligible");
  assert.equal(resolveExperimentContext({ experiment: active.id, variant: "control", pathname: "/br", market: "JP", registry }).reason, "market_not_eligible");
});
