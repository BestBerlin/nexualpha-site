/**
 * Experiments are deliberately registered before traffic is assigned.
 * A registry row is a design contract, not evidence that an experiment ran.
 */

// Home hero copy A/B (scorecard X5, 2026-10-11). The ONLY switch: while `enabled` is false nobody is assigned, no cookie
// is set, every visitor and crawler sees variant A and the home HTML/headers are byte-for-byte what they were before.
// Flipping it to true (owner approval of the variant B copy in src/components/v7/home7-hero-variants.js) makes the
// worker assign a stable 50/50 first-party cookie on the 15 localized home routes; see src/data/home-hero-experiment.js.
const HOME_HERO_COPY_ENABLED = false;
// Home routes in the 15 UI locales (localizedHref("/", { locale }), pinned by tests/home-hero-experiment.test.mjs).
export const HOME_HERO_ROUTES = Object.freeze(["/", "/zh-hans", "/zh-hant", "/es", "/pt-br", "/fr", "/de", "/it", "/ja", "/ko", "/ru", "/tr", "/id-id", "/vi", "/ar"]);

export const experimentRegistry = Object.freeze({
  home_hero_copy_v1: Object.freeze({
    id: "home_hero_copy_v1",
    enabled: HOME_HERO_COPY_ENABLED,
    status: HOME_HERO_COPY_ENABLED ? "ACTIVE" : "DESIGNED",
    market: "MULTI",
    routes: HOME_HERO_ROUTES,
    variable: "home_hero_headline_copy",
    hypothesis: "A hero headline that names the visitor's own fees and states the disclosed commission up front will raise partner sign-up clicks per home visitor without lowering CTA visibility.",
    control: Object.freeze({ id: "a", description: "current hero headline and subline (crawlers and the disabled flag always get this)" }),
    treatment: Object.freeze({ id: "b", description: "alternative hero headline and subline with the same claims: up to the headline rebate share, partner invite link, commission disclosed" }),
    primaryMetric: "referral_click_rate",
    guardrails: Object.freeze(["cta_visible_rate", "outbound_handoff_error_rate", "unverified_outbound_click_rate"]),
    guardrailLimits: Object.freeze({
      cta_visible_rate: Object.freeze({
        type: "behavior_rate",
        direction: "minimum_relative_to_control",
        minimumRelativeToControl: 0.95,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
      outbound_handoff_error_rate: Object.freeze({
        type: "technical_error_rate",
        direction: "maximum_absolute_rate",
        maximumRate: 0.005,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
      unverified_outbound_click_rate: Object.freeze({
        type: "safety_rate",
        direction: "maximum_absolute_rate",
        maximumRate: 0,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
    }),
    outcomeClass: "first_party_behavior",
    observableOutcomes: Object.freeze(["cta_visible", "referral_click", "outbound_handoff", "site_click_beacon", "go_redirect_click"]),
    unavailableOutcomes: Object.freeze(["partner_registration", "partner_kyc", "partner_deposit", "partner_trade", "partner_commission"]),
    winnerPolicy: Object.freeze({ lowSampleDecision: "INCONCLUSIVE", fullExposureWindowRequired: true, partnerOutcomeSubstitution: "FORBIDDEN" }),
    assignment: Object.freeze({ unit: "first_party_cookie", cookie: "nx_hero", allocation: Object.freeze({ a: 50, b: 50 }), crawlers: "a", server: "worker" }),
    minimumSamplePerVariant: 200,
    exposureWindowDays: 14,
    attributionMaturityDays: 14,
    stopConditions: Object.freeze([
      "persistent collector readiness is not verified",
      "constitutional invitation link invariants fail",
      "home mobile LCP median exceeds 2.5 s for either variant",
      "a guardrail regresses materially after the full exposure window",
    ]),
    requiredEvidence: Object.freeze(["persistent_cta_events", "cta_visible_events", "referral_click_events", "click_log_variant_split"]),
  }),
  br_compare_entry_v1: Object.freeze({
    id: "br_compare_entry_v1",
    status: "DESIGNED",
    market: "BR",
    routes: Object.freeze(["/br", "/br/comparar"]),
    variable: "comparison_entry",
    hypothesis: "A visible two-option comparison entry will produce more qualified decisions than a single platform-first CTA.",
    control: Object.freeze({ id: "control", description: "single platform-first CTA" }),
    treatment: Object.freeze({ id: "comparison", description: "two-option comparison entry" }),
    primaryMetric: "decision_select_rate",
    guardrails: Object.freeze(["cta_visible_rate", "referral_click_rate", "outbound_handoff_error_rate"]),
    guardrailLimits: Object.freeze({
      cta_visible_rate: Object.freeze({
        type: "behavior_rate",
        direction: "minimum_relative_to_control",
        minimumRelativeToControl: 0.95,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
      referral_click_rate: Object.freeze({
        type: "behavior_rate",
        direction: "minimum_relative_to_control",
        minimumRelativeToControl: 0.9,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
      outbound_handoff_error_rate: Object.freeze({
        type: "technical_error_rate",
        direction: "maximum_absolute_rate",
        maximumRate: 0.005,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
    }),
    outcomeClass: "first_party_behavior",
    observableOutcomes: Object.freeze(["decision_select", "cta_visible", "referral_click", "outbound_handoff"]),
    unavailableOutcomes: Object.freeze(["partner_registration", "partner_kyc", "partner_deposit", "partner_trade", "partner_commission"]),
    winnerPolicy: Object.freeze({ lowSampleDecision: "INCONCLUSIVE", fullExposureWindowRequired: true, partnerOutcomeSubstitution: "FORBIDDEN" }),
    activationGate: Object.freeze({
      status: "CANDIDATE_CONFIG_ONLY",
      readyToActivate: false,
      plannedAllocation: Object.freeze({ control: 50, comparison: 50 }),
      requiredChecks: Object.freeze([
        "production registry remains DESIGNED until explicit launch change",
        "persistent CTA collector readiness is verified",
        "both configured variants have at least 200 measurable sessions",
        "14 full UTC exposure days are complete",
        "14 attribution maturity days are complete after exposure closes",
        "constitutional invitation link invariants pass unchanged",
      ]),
      decision: "DO_NOT_ACTIVATE_FROM_CANDIDATE_CONFIG",
    }),
    minimumSamplePerVariant: 200,
    exposureWindowDays: 14,
    attributionMaturityDays: 14,
    stopConditions: Object.freeze([
      "persistent collector readiness is not verified",
      "source or market context is missing",
      "a guardrail regresses materially after the full exposure window",
    ]),
    requiredEvidence: Object.freeze(["persistent_cta_events", "decision_select_events", "cta_visible_events", "referral_click_events"]),
  }),
  home_bitget_next_step_v1: Object.freeze({
    id: "home_bitget_next_step_v1",
    status: "DESIGNED",
    market: "MULTI",
    routes: Object.freeze(["/", "/exchanges/bitget"]),
    variable: "partner_route_next_step_copy",
    hypothesis: "Showing the exact next signup check beside the homepage and Bitget partner CTA will reduce visible-without-click drop-off without increasing unverified outbound exits.",
    control: Object.freeze({ id: "generic_cta_copy", description: "generic registration CTA and route facts" }),
    treatment: Object.freeze({ id: "next_step_code_copy", description: "localized next-step copy that tells the user to confirm the referral code before submitting" }),
    primaryMetric: "referral_click_rate",
    guardrails: Object.freeze(["cta_visible_rate", "outbound_handoff_error_rate", "unverified_outbound_click_rate"]),
    guardrailLimits: Object.freeze({
      cta_visible_rate: Object.freeze({
        type: "behavior_rate",
        direction: "minimum_relative_to_control",
        minimumRelativeToControl: 0.95,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
      outbound_handoff_error_rate: Object.freeze({
        type: "technical_error_rate",
        direction: "maximum_absolute_rate",
        maximumRate: 0.005,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
      unverified_outbound_click_rate: Object.freeze({
        type: "safety_rate",
        direction: "maximum_absolute_rate",
        maximumRate: 0,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
    }),
    outcomeClass: "first_party_behavior",
    observableOutcomes: Object.freeze(["cta_visible", "referral_click", "outbound_handoff", "visible_no_click_queue"]),
    unavailableOutcomes: Object.freeze(["partner_registration", "partner_kyc", "partner_deposit", "partner_trade", "partner_commission"]),
    winnerPolicy: Object.freeze({ lowSampleDecision: "INCONCLUSIVE", fullExposureWindowRequired: true, partnerOutcomeSubstitution: "FORBIDDEN" }),
    minimumSamplePerVariant: 200,
    exposureWindowDays: 14,
    attributionMaturityDays: 14,
    stopConditions: Object.freeze([
      "persistent collector readiness is not verified",
      "constitutional invitation link invariants fail",
      "a guardrail regresses materially after the full exposure window",
    ]),
    requiredEvidence: Object.freeze(["persistent_cta_events", "cta_visible_events", "referral_click_events", "visible_no_click_queue"]),
  }),
  international_account_stage_v1: Object.freeze({
    id: "international_account_stage_v1",
    status: "DESIGNED",
    market: "MULTI",
    routes: Object.freeze(["/mx", "/tw", "/id", "/hk", "/eu", "/uk", "/int"]),
    variable: "account_stage_decision_copy",
    hypothesis: "Showing the user's account stage beside the directory CTA will increase qualified decision selections without increasing unverified outbound exits.",
    control: Object.freeze({ id: "without_stage_copy", description: "regional directory CTA without an account-stage explanation" }),
    treatment: Object.freeze({ id: "with_stage_copy", description: "regional directory CTA with localized account-stage explanation" }),
    primaryMetric: "decision_select_rate",
    guardrails: Object.freeze(["cta_visible_rate", "outbound_handoff_error_rate", "unverified_outbound_click_rate"]),
    guardrailLimits: Object.freeze({
      cta_visible_rate: Object.freeze({
        type: "behavior_rate",
        direction: "minimum_relative_to_control",
        minimumRelativeToControl: 0.95,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
      outbound_handoff_error_rate: Object.freeze({
        type: "technical_error_rate",
        direction: "maximum_absolute_rate",
        maximumRate: 0.005,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
      unverified_outbound_click_rate: Object.freeze({
        type: "safety_rate",
        direction: "maximum_absolute_rate",
        maximumRate: 0,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
    }),
    outcomeClass: "first_party_behavior",
    observableOutcomes: Object.freeze(["decision_select", "cta_visible", "referral_click", "outbound_handoff", "account_stage_breakdown"]),
    unavailableOutcomes: Object.freeze(["partner_registration", "partner_kyc", "partner_deposit", "partner_trade", "partner_commission"]),
    winnerPolicy: Object.freeze({ lowSampleDecision: "INCONCLUSIVE", fullExposureWindowRequired: true, partnerOutcomeSubstitution: "FORBIDDEN" }),
    minimumSamplePerVariant: 200,
    exposureWindowDays: 14,
    attributionMaturityDays: 14,
    stopConditions: Object.freeze([
      "persistent collector readiness is not verified",
      "account stage is missing or outside the controlled enum",
      "a guardrail regresses materially after the full exposure window",
    ]),
    requiredEvidence: Object.freeze(["persistent_cta_events", "account_stage_breakdown", "decision_select_events", "referral_click_events"]),
  }),
  partner_telegram_context_v1: Object.freeze({
    id: "partner_telegram_context_v1",
    status: "DESIGNED",
    market: "MULTI",
    routes: Object.freeze(["/partners", "/telegram"]),
    variable: "partner_telegram_context",
    hypothesis: "Carrying market, locale and product context into the partner Telegram handoff will improve qualified follow-up without claiming partner-side conversions.",
    control: Object.freeze({ id: "generic_partner_deep_link", description: "partner Telegram deep link without market context" }),
    treatment: Object.freeze({ id: "contextual_partner_deep_link", description: "partner Telegram deep link with controlled market, locale and product context" }),
    primaryMetric: "telegram_cta_click_rate",
    guardrails: Object.freeze(["payload_valid_rate", "privacy_suppression_rate", "outbound_handoff_error_rate"]),
    guardrailLimits: Object.freeze({
      payload_valid_rate: Object.freeze({
        type: "technical_quality_rate",
        direction: "minimum_absolute_rate",
        minimumRate: 1,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
      privacy_suppression_rate: Object.freeze({
        type: "privacy_boundary_rate",
        direction: "maximum_absolute_rate",
        maximumRate: 0.001,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
      outbound_handoff_error_rate: Object.freeze({
        type: "technical_error_rate",
        direction: "maximum_absolute_rate",
        maximumRate: 0.005,
        appliesAfter: Object.freeze({ minimumSamplePerVariant: 200, exposureWindowDays: 14, attributionMaturityDays: 14 }),
        decision: "BLOCK_WINNER_CALL",
      }),
    }),
    outcomeClass: "first_party_behavior",
    observableOutcomes: Object.freeze(["telegram_cta_click", "outbound_handoff", "payload_validation", "privacy_suppression"]),
    unavailableOutcomes: Object.freeze(["partner_registration", "partner_kyc", "partner_deposit", "partner_trade", "partner_commission"]),
    winnerPolicy: Object.freeze({ lowSampleDecision: "INCONCLUSIVE", fullExposureWindowRequired: true, partnerOutcomeSubstitution: "FORBIDDEN" }),
    minimumSamplePerVariant: 200,
    exposureWindowDays: 14,
    attributionMaturityDays: 14,
    stopConditions: Object.freeze([
      "persistent collector readiness is not verified",
      "context contains uncontrolled identifiers",
      "payload validation or privacy suppression regresses",
    ]),
    requiredEvidence: Object.freeze(["persistent_cta_events", "payload_validation_rows", "telegram_entry_events"]),
  }),
});

export function getExperimentDefinition(id, registry = experimentRegistry) {
  return typeof id === "string" ? registry[id] ?? null : null;
}

function normalizedExperimentPath(pathname) {
  const value = typeof pathname === "string" ? pathname.split(/[?#]/, 1)[0] : "";
  if (!/^\/[a-zA-Z0-9/_-]{0,199}$/.test(value)) return null;
  return value.length > 1 ? value.replace(/\/$/, "") : value;
}

export function resolveExperimentContext({ experiment, variant, pathname, market, registry = experimentRegistry } = {}) {
  const definition = getExperimentDefinition(experiment, registry);
  if (!definition) return { ok: false, reason: "experiment_unregistered", context: {} };
  if (definition.status !== "ACTIVE") return { ok: false, reason: "experiment_not_active", context: {} };
  const path = normalizedExperimentPath(pathname);
  if (!path || !definition.routes.map(normalizedExperimentPath).includes(path)) {
    return { ok: false, reason: "route_not_eligible", context: {} };
  }
  if (definition.market !== "MULTI" && definition.market !== market) {
    return { ok: false, reason: "market_not_eligible", context: {} };
  }
  const allowedVariants = new Set([definition.control.id, definition.treatment.id]);
  if (!allowedVariants.has(variant)) return { ok: false, reason: "variant_not_registered", context: {} };
  return { ok: true, reason: null, context: { experiment: definition.id, variant } };
}

export function validateExperimentEventContext(event, registry = experimentRegistry) {
  const hasExperiment = Object.hasOwn(event || {}, "experiment");
  const hasVariant = Object.hasOwn(event || {}, "variant");
  if (!hasExperiment && !hasVariant) return true;
  if (!hasExperiment || !hasVariant) return false;
  return resolveExperimentContext({
    experiment: event.experiment,
    variant: event.variant,
    pathname: event.page,
    market: event.market,
    registry,
  }).ok;
}

export function validateExperimentDefinition(definition) {
  if (!definition || typeof definition !== "object") return { ok: false, reason: "definition_missing" };
  const required = ["id", "market", "routes", "variable", "primaryMetric", "control", "treatment", "guardrails", "guardrailLimits", "stopConditions", "requiredEvidence", "outcomeClass", "observableOutcomes", "unavailableOutcomes", "winnerPolicy", "minimumSamplePerVariant", "exposureWindowDays", "attributionMaturityDays"];
  const missing = required.filter((field) => !(field in definition));
  if (missing.length) return { ok: false, reason: "required_fields_missing", missing };
  if (definition.status !== "DESIGNED" && definition.status !== "ACTIVE" && definition.status !== "PAUSED") return { ok: false, reason: "invalid_status" };
  if (definition.control.id === definition.treatment.id) return { ok: false, reason: "variants_must_differ" };
  if (!Array.isArray(definition.routes) || definition.routes.length === 0 || definition.routes.some((route) => !normalizedExperimentPath(route))) return { ok: false, reason: "routes_invalid" };
  if (!Number.isInteger(definition.minimumSamplePerVariant) || definition.minimumSamplePerVariant < 1) return { ok: false, reason: "minimum_sample_invalid" };
  if (!Number.isInteger(definition.exposureWindowDays) || definition.exposureWindowDays < 1) return { ok: false, reason: "exposure_window_invalid" };
  if (!Number.isInteger(definition.attributionMaturityDays) || definition.attributionMaturityDays < 1) return { ok: false, reason: "attribution_maturity_invalid" };
  if (!Array.isArray(definition.guardrails) || definition.guardrails.length === 0) return { ok: false, reason: "guardrails_missing" };
  const guardrailLimitResult = validateGuardrailLimits(definition);
  if (!guardrailLimitResult.ok) return guardrailLimitResult;
  if (!Array.isArray(definition.requiredEvidence) || definition.requiredEvidence.length === 0) return { ok: false, reason: "evidence_requirements_missing" };
  if (!Array.isArray(definition.observableOutcomes) || definition.observableOutcomes.length === 0) return { ok: false, reason: "observable_outcomes_missing" };
  if (!Array.isArray(definition.unavailableOutcomes) || definition.unavailableOutcomes.length === 0) return { ok: false, reason: "unavailable_outcomes_missing" };
  if (!definition.winnerPolicy || definition.winnerPolicy.lowSampleDecision !== "INCONCLUSIVE") return { ok: false, reason: "winner_policy_missing" };
  if (definition.outcomeClass === "first_party_behavior" && definition.requiredEvidence.includes("partner_confirmed_outcomes")) {
    return { ok: false, reason: "partner_outcomes_not_allowed_for_first_party_experiment" };
  }
  if (definition.outcomeClass === "first_party_behavior" && definition.stopConditions.some((condition) => condition.includes("partner confirmation"))) {
    return { ok: false, reason: "partner_confirmation_must_not_stop_first_party_experiment" };
  }
  if (definition.activationGate) {
    const gate = definition.activationGate;
    if (gate.status !== "CANDIDATE_CONFIG_ONLY") return { ok: false, reason: "activation_gate_status_invalid" };
    if (gate.readyToActivate !== false) return { ok: false, reason: "candidate_gate_must_not_activate" };
    if (gate.decision !== "DO_NOT_ACTIVATE_FROM_CANDIDATE_CONFIG") return { ok: false, reason: "activation_gate_decision_invalid" };
    if (!gate.plannedAllocation || typeof gate.plannedAllocation !== "object") return { ok: false, reason: "activation_allocation_missing" };
    const allocationEntries = Object.entries(gate.plannedAllocation);
    const variants = new Set([definition.control.id, definition.treatment.id]);
    if (allocationEntries.length !== variants.size || allocationEntries.some(([variant, percent]) => !variants.has(variant) || percent <= 0)) {
      return { ok: false, reason: "activation_allocation_variants_invalid" };
    }
    const allocationTotal = allocationEntries.reduce((sum, [, percent]) => sum + percent, 0);
    if (allocationTotal !== 100) return { ok: false, reason: "activation_allocation_total_invalid" };
    if (!Array.isArray(gate.requiredChecks) || gate.requiredChecks.length < 4) return { ok: false, reason: "activation_required_checks_missing" };
    for (const phrase of ["200 measurable sessions", "14 full UTC exposure days", "14 attribution maturity days", "invitation link invariants"]) {
      if (!gate.requiredChecks.some((check) => check.includes(phrase))) return { ok: false, reason: "activation_required_check_boundary_missing" };
    }
  }
  return { ok: true };
}

function validateGuardrailLimits(definition) {
  const limits = definition.guardrailLimits;
  if (!limits || typeof limits !== "object" || Array.isArray(limits)) return { ok: false, reason: "guardrail_limits_missing" };
  const guardrails = new Set(definition.guardrails);
  const limitNames = Object.keys(limits);
  if (limitNames.length !== guardrails.size) return { ok: false, reason: "guardrail_limit_coverage_invalid" };
  for (const guardrail of definition.guardrails) {
    if (!Object.hasOwn(limits, guardrail)) return { ok: false, reason: "guardrail_limit_missing", guardrail };
  }
  for (const guardrail of limitNames) {
    if (!guardrails.has(guardrail)) return { ok: false, reason: "guardrail_limit_unknown", guardrail };
    const limit = limits[guardrail];
    if (!limit || typeof limit !== "object" || Array.isArray(limit)) return { ok: false, reason: "guardrail_limit_invalid", guardrail };
    if (limit.decision !== "BLOCK_WINNER_CALL") return { ok: false, reason: "guardrail_limit_decision_invalid", guardrail };
    if (!limit.type || typeof limit.type !== "string") return { ok: false, reason: "guardrail_limit_type_invalid", guardrail };
    const appliesAfter = limit.appliesAfter;
    if (!appliesAfter || typeof appliesAfter !== "object" || Array.isArray(appliesAfter)) return { ok: false, reason: "guardrail_limit_window_missing", guardrail };
    if (appliesAfter.minimumSamplePerVariant !== definition.minimumSamplePerVariant) return { ok: false, reason: "guardrail_limit_sample_window_invalid", guardrail };
    if (appliesAfter.exposureWindowDays !== definition.exposureWindowDays) return { ok: false, reason: "guardrail_limit_exposure_window_invalid", guardrail };
    if (appliesAfter.attributionMaturityDays !== definition.attributionMaturityDays) return { ok: false, reason: "guardrail_limit_maturity_window_invalid", guardrail };
    if (limit.direction === "minimum_relative_to_control") {
      if (!Number.isFinite(limit.minimumRelativeToControl) || limit.minimumRelativeToControl <= 0 || limit.minimumRelativeToControl > 1) {
        return { ok: false, reason: "guardrail_limit_relative_floor_invalid", guardrail };
      }
      continue;
    }
    if (limit.direction === "maximum_absolute_rate") {
      if (!Number.isFinite(limit.maximumRate) || limit.maximumRate < 0 || limit.maximumRate > 0.01) {
        return { ok: false, reason: "guardrail_limit_absolute_ceiling_invalid", guardrail };
      }
      continue;
    }
    if (limit.direction === "minimum_absolute_rate") {
      if (!Number.isFinite(limit.minimumRate) || limit.minimumRate < 0.95 || limit.minimumRate > 1) {
        return { ok: false, reason: "guardrail_limit_absolute_floor_invalid", guardrail };
      }
      continue;
    }
    return { ok: false, reason: "guardrail_limit_direction_invalid", guardrail };
  }
  return { ok: true };
}

export function validateExperimentRegistry(registry = experimentRegistry) {
  const results = Object.values(registry).map((definition) => ({ id: definition.id, ...validateExperimentDefinition(definition) }));
  return { ok: results.every((result) => result.ok), results };
}
