export const UK_MARKET_DECISION_REVIEWED_AT = "2026-09-28";

export const UK_MARKET_DECISION_SCOPE =
  "UK research checklist for service entity, onboarding, GBP funding, and product or marketing scope before a venue is shown as actionable.";

export const UK_MARKET_DECISION_BOUNDARY =
  "Research-only: this data does not decide account acceptance, funding access, product access, fee outcome, tax status, suitability, or promotional treatment for a specific user.";

const sourceRef = (key, label, role) =>
  Object.freeze({
    key,
    label,
    role,
    reviewedAt: UK_MARKET_DECISION_REVIEWED_AT,
  });

const checklistStep = (entry) =>
  Object.freeze({
    ...entry,
    status: "research-only",
    checks: Object.freeze(entry.checks),
    uiFlags: Object.freeze(entry.uiFlags),
    sourceRefs: Object.freeze(entry.sourceRefs),
  });

export const UK_MARKET_DECISION_SOURCE_REFS = Object.freeze([
  sourceRef("fca-cryptoasset-register-context", "FCA cryptoasset registration and AML/CTF register context", "official-regulatory-reference"),
  sourceRef("fca-crypto-financial-promotions", "FCA cryptoasset financial promotions conduct context", "official-regulatory-reference"),
  sourceRef("coinbase-uk-account-creation", "Coinbase UK account creation, identity, client categorisation and appropriateness flow", "official-platform-guidance"),
  sourceRef("coinbase-uk-gbp-funding", "Coinbase UK GBP funding, payment-method and bank-name matching flow", "official-platform-guidance"),
]);

export const UK_MARKET_DECISION_VISIBLE_CHECKLIST = Object.freeze([
  checklistStep({
    id: "fca-service-entity",
    order: 1,
    title: "FCA / service entity",
    decisionQuestion: "Which UK-facing entity and FCA context would the user rely on?",
    checks: [
      "Confirm the platform's UK-facing service entity before treating a route as UK-relevant.",
      "Separate FCA AML/CTF registration context from user account, product, custody, and trading outcomes.",
      "Show the entity check as unresolved when the service entity or UK-facing firm context is not visible in official materials.",
    ],
    uiFlags: ["entity-check", "regulatory-context", "no-user-outcome"],
    sourceRefs: ["fca-cryptoasset-register-context", "fca-crypto-financial-promotions"],
  }),
  checklistStep({
    id: "identity-appropriateness-onboarding",
    order: 2,
    title: "Identity + appropriateness / onboarding",
    decisionQuestion: "Has the official account flow shown the required UK onboarding gates?",
    checks: [
      "Treat legal name, date of birth, address, government photo ID, email, phone, and device requirements as account-flow inputs.",
      "Track client categorisation, any waiting period, and appropriateness assessment as visible account gates before buy or trade actions.",
      "Keep tax-residency and TIN collection as a separate account-stage check when the official flow requests it.",
    ],
    uiFlags: ["identity-check", "client-categorisation", "appropriateness-assessment", "account-stage"],
    sourceRefs: ["coinbase-uk-account-creation", "fca-crypto-financial-promotions"],
  }),
  checklistStep({
    id: "gbp-funding-bank-name-deposit-withdrawal",
    order: 3,
    title: "GBP funding + bank-name / deposit-withdrawal",
    decisionQuestion: "Which GBP route is visible for this account, and does the bank name match?",
    checks: [
      "Confirm GBP balance availability, Faster Payments, Easy Bank Transfer, card, PayPal, Apple Pay, Google Pay, or SEPA only where the official account screen shows them.",
      "Verify identity, mobile phone, payment method, and bank-account name match before treating a GBP route as usable.",
      "Model add-cash and cash-out separately because a payment method can support one direction but not the other.",
      "Keep settlement time, rejection handling, amount limits, fees, and bank-side currency support pending until shown in the official flow.",
    ],
    uiFlags: ["gbp-balance", "bank-name-match", "deposit-direction", "withdrawal-direction", "fee-timing-pending"],
    sourceRefs: ["coinbase-uk-gbp-funding"],
  }),
  checklistStep({
    id: "product-marketing-scope",
    order: 4,
    title: "Product / marketing scope",
    decisionQuestion: "What product and communication scope is actually visible for UK users?",
    checks: [
      "Separate buy, sell, trade, custody, transfer, staking, derivatives, and other product surfaces before displaying a route as ready.",
      "Treat risk warnings, cooling-off, client categorisation, and appropriateness as product-scope gates for qualifying cryptoasset communications.",
      "Keep benefits, campaigns, commercial incentives, and promotional copy blocked unless official UK terms and current account flow support the exact treatment.",
    ],
    uiFlags: ["product-scope", "marketing-scope", "risk-warning", "commercial-copy-blocked"],
    sourceRefs: ["fca-crypto-financial-promotions", "coinbase-uk-account-creation"],
  }),
]);

export const UK_MARKET_DECISION = Object.freeze({
  id: "uk-market-decision",
  market: "UK",
  marketName: "United Kingdom",
  locale: "en-GB",
  fiatCurrency: "GBP",
  status: "research-only",
  reviewedAt: UK_MARKET_DECISION_REVIEWED_AT,
  scope: UK_MARKET_DECISION_SCOPE,
  boundary: UK_MARKET_DECISION_BOUNDARY,
  sourceRefs: UK_MARKET_DECISION_SOURCE_REFS,
  visibleChecklist: UK_MARKET_DECISION_VISIBLE_CHECKLIST,
  cannotConclude: Object.freeze([
    "Specific user account acceptance.",
    "Specific GBP funding access.",
    "Specific product access.",
    "Specific benefit, campaign, fee, timing, tax, or suitability outcome.",
  ]),
});

export function ukMarketDecisionSummary() {
  return {
    market: UK_MARKET_DECISION.market,
    reviewedAt: UK_MARKET_DECISION.reviewedAt,
    status: UK_MARKET_DECISION.status,
    checklistIds: UK_MARKET_DECISION.visibleChecklist.map((step) => step.id),
    sourceKeys: UK_MARKET_DECISION.sourceRefs.map((source) => source.key),
  };
}
