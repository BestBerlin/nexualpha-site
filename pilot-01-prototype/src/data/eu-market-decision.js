export const EU_MARKET_DECISION_REVIEWED_AT = "2026-09-28";

export const EU_MARKET_DECISION_SCOPE =
  "Research-only EU member-state funding and product-scope signals for UI decision surfaces.";

export const EU_MARKET_DECISION_BOUNDARY =
  "Each row is source-pending and account-specific. It does not establish service onboarding, fiat rail access, card support, product scope, user benefits, fees, timing or outcome for any user.";

export const EU_MARKET_DECISION_SOURCE_DEPENDENCIES = Object.freeze([
  "internationalSourceRegistry.EU",
  "REGIONAL_FUNDING_VERIFICATION_MATRIX.eu-eur-sepa",
]);

const freezeList = (items) => Object.freeze([...(items || [])]);

const action = (label, detail) => Object.freeze({
  kind: "research-only",
  label,
  detail,
});

const row = (entry) => Object.freeze({
  market: "EU",
  fiatCurrency: "EUR",
  sourceStatus: "source-pending",
  reviewedAt: EU_MARKET_DECISION_REVIEWED_AT,
  ...entry,
  sepaBank: Object.freeze(entry.sepaBank),
  card: Object.freeze(entry.card),
  productScope: Object.freeze(entry.productScope),
  unknowns: freezeList(entry.unknowns),
  action: Object.freeze(entry.action),
});

export const EU_MARKET_DECISION_ROWS = Object.freeze([
  row({
    id: "eu-fr-source-pending",
    memberState: "FR",
    memberStateName: "France",
    locale: "fr",
    serviceAccountEntity: "EU service entity and account entity require official source review for the specific account flow.",
    sepaBank: {
      status: "source-pending",
      signal: "Check whether EUR SEPA or bank transfer is shown for a France-resident account before any UI handoff.",
    },
    card: {
      status: "source-pending",
      signal: "Check whether card funding is shown for the account, country and product before treating it as a decision input.",
    },
    productScope: {
      status: "source-pending",
      signal: "Spot, derivatives, staking, rewards and campaign scope remain separate account-screen checks.",
    },
    unknowns: [
      "Which legal service entity and account entity apply to the France-resident flow.",
      "Whether EUR SEPA, bank transfer or card appears for the account stage.",
      "Whether product scope, fees, limits, timing, identity status and benefit terms are shown in the official account flow.",
    ],
    action: action(
      "Keep France as source-pending",
      "Show a neutral research row and send the user to internal comparison or checklist context until official account evidence is reviewed.",
    ),
  }),
  row({
    id: "eu-de-source-pending",
    memberState: "DE",
    memberStateName: "Germany",
    locale: "de",
    serviceAccountEntity: "EU service entity and account entity require official source review for the specific account flow.",
    sepaBank: {
      status: "source-pending",
      signal: "Check whether EUR SEPA or bank transfer is shown for a Germany-resident account before any UI handoff.",
    },
    card: {
      status: "source-pending",
      signal: "Check whether card funding is shown for the account, country and product before treating it as a decision input.",
    },
    productScope: {
      status: "source-pending",
      signal: "Spot, derivatives, staking, rewards and campaign scope remain separate account-screen checks.",
    },
    unknowns: [
      "Which legal service entity and account entity apply to the Germany-resident flow.",
      "Whether EUR SEPA, bank transfer or card appears for the account stage.",
      "Whether product scope, fees, limits, timing, identity status and benefit terms are shown in the official account flow.",
    ],
    action: action(
      "Keep Germany as source-pending",
      "Show a neutral research row and send the user to internal comparison or checklist context until official account evidence is reviewed.",
    ),
  }),
]);

const normalizeMemberState = (value) => (typeof value === "string" ? value.trim().toUpperCase() : "");

export function euMarketDecisionRowsFor(memberStates = ["FR", "DE"]) {
  const selected = new Set(memberStates.map(normalizeMemberState).filter(Boolean));
  return EU_MARKET_DECISION_ROWS.filter((item) => selected.has(item.memberState));
}

export function euMarketDecisionFor(memberState) {
  const selected = normalizeMemberState(memberState);
  return EU_MARKET_DECISION_ROWS.find((item) => item.memberState === selected) || null;
}

export function euMarketDecisionSummary(memberStates = ["FR", "DE"]) {
  const rows = euMarketDecisionRowsFor(memberStates);
  return Object.freeze({
    reviewedAt: EU_MARKET_DECISION_REVIEWED_AT,
    scope: EU_MARKET_DECISION_SCOPE,
    boundary: EU_MARKET_DECISION_BOUNDARY,
    memberStates: Object.freeze(rows.map((item) => item.memberState)),
    sourceStatuses: Object.freeze([...new Set(rows.map((item) => item.sourceStatus))]),
    rows: Object.freeze(rows),
  });
}
