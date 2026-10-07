const HTTPS_URL_RE = /^https:\/\//i;

export function buildRegistrationDecisionState({ publicCta = {}, regionalCta = {}, decisionPassport = {}, officialRouteUrl = null } = {}) {
  const hasPartnerRoute = Boolean(publicCta.hasPartnerRoute);
  const hasDirectRegionalRoute = Boolean(regionalCta.direct);
  const hasProtectedHref = HTTPS_URL_RE.test(regionalCta.ctaHref || "");
  const regionState = regionalCta.ctaState || "verify";
  const hasPassportContext = Boolean(decisionPassport.market || decisionPassport.product || decisionPassport.accountStage || decisionPassport.funding);
  const canOpenThirdParty = hasPartnerRoute && hasDirectRegionalRoute && hasProtectedHref && regionState !== "blocked";

  if (regionState === "blocked") {
    return {
      state: "blocked",
      canOpenThirdParty: false,
      protectedHref: null,
      reason: "region-blocked",
      hasPassportContext,
    };
  }

  if (!canOpenThirdParty) {
    if (HTTPS_URL_RE.test(officialRouteUrl || "")) {
      return {
        state: "verify-first",
        canOpenThirdParty: false,
        protectedHref: null,
        reason: "official-verify",
        hasPassportContext,
      };
    }

    return {
      state: "blocked",
      canOpenThirdParty: false,
      protectedHref: null,
      reason: "route-blocked",
      hasPassportContext,
    };
  }

  if (regionState === "verify" || !publicCta.benefitVerified || hasPassportContext) {
    return {
      state: "verify-first",
      canOpenThirdParty: true,
      protectedHref: regionalCta.ctaHref,
      reason: regionState === "verify" ? "region-verify" : "claim-verify",
      hasPassportContext,
    };
  }

  return {
    state: "available",
    canOpenThirdParty: true,
    protectedHref: regionalCta.ctaHref,
    reason: "available",
    hasPassportContext,
  };
}
