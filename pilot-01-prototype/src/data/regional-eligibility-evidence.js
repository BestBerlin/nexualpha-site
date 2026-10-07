// Regional eligibility is a separate evidence layer from venue taxonomy.
// A supported-region string is useful for discovery, but it is not enough to
// authorize a direct registration handoff.

export const REGIONAL_ELIGIBILITY_EVIDENCE = Object.freeze({});

const MARKET_RE = /^[A-Z]{2,3}$/;

function normalize(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function validDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function regionalEligibilityEvidenceFor(slug, market, product = "unknown") {
  const normalizedSlug = typeof slug === "string" ? slug.trim().toLowerCase() : "";
  const normalizedMarket = normalize(market);
  const normalizedProduct = typeof product === "string" ? product.trim().toLowerCase() : "unknown";
  if (!normalizedSlug || !MARKET_RE.test(normalizedMarket)) return null;
  return REGIONAL_ELIGIBILITY_EVIDENCE[normalizedMarket]?.[normalizedProduct]?.[normalizedSlug] || null;
}

export function isCurrentRegionalEligibilityEvidence(evidence, { now = new Date() } = {}) {
  if (!evidence || evidence.status !== "eligible") return false;
  if (!Array.isArray(evidence.sourceUrls) || evidence.sourceUrls.length === 0) return false;
  if (!evidence.checkedAt || !evidence.expiresAt || !validDate(evidence.checkedAt) || !validDate(evidence.expiresAt)) return false;
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  const expiresMs = Date.parse(evidence.expiresAt);
  return Number.isFinite(nowMs) && expiresMs > nowMs;
}

export function regionalEligibilityState({ slug, market, product = "unknown", now } = {}) {
  const evidence = regionalEligibilityEvidenceFor(slug, market, product);
  if (!evidence) return { status: "unverified", evidence: null };
  if (evidence.status === "restricted") return { status: "restricted", evidence };
  if (isCurrentRegionalEligibilityEvidence(evidence, { now })) return { status: "matched", evidence };
  return { status: "unverified", evidence };
}
