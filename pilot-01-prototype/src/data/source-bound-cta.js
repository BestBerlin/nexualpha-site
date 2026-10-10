import {
  publicCtaForTopicPlatform as basePublicCtaForTopicPlatform,
  publicCtaForVenue as basePublicCtaForVenue,
} from "./public-cta.js";
import { regionalVenueCta as baseRegionalVenueCta } from "./regional-cta.js";
import { directoryContextSearch } from "./directory-context.js";
import { localizedHref } from "./locale-routing.js";

// This projection never edits or replaces protected referral records. It only
// prevents the UI from opening a commercial route while current venue-owned
// sources do not support the action claims required for a safe handoff.
const SOURCE_REVIEW_GATES = Object.freeze({
  drift: Object.freeze({
    reason: "venue-source-review-required",
    reviewedAt: "2026-09-29",
  }),
});

export function sourceBoundActionGate(slug) {
  return SOURCE_REVIEW_GATES[String(slug || "").toLowerCase()] || null;
}

// QA 2026-10-10: "NEXU_KUCOIN" / "NEXU_DERIBIT" / "NEXU_GMX" are registry placeholders (待补充), not codes the
// exchange issued. Showing them sends readers to a sign-up with an invalid code; route them to the official site
// instead until the owner supplies the real code.
export const PLACEHOLDER_INVITE_CODE = /^NEXU_[A-Z0-9]+$/;
const PLACEHOLDER_GATE = Object.freeze({ reason: "placeholder-invite-code" });
function placeholderGate(cta) {
  return [cta?.inviteCode, cta?.configuredInviteCode].some((code) => typeof code === "string" && PLACEHOLDER_INVITE_CODE.test(code)) ? PLACEHOLDER_GATE : null;
}

function failClosedPublicCta(cta, gate) {
  if (!gate) return cta;
  return {
    ...cta,
    registrationUrl: null,
    registrationUrls: [],
    alternateRegistrationUrls: [],
    inviteCode: null,
    configuredInviteCode: null,
    hasReferral: false,
    hasPartnerRoute: false,
    routeAvailable: false,
    actionGate: gate,
  };
}

export function publicCtaForVenue(slug, locale = "en") {
  const cta = basePublicCtaForVenue(slug, locale);
  return failClosedPublicCta(cta, sourceBoundActionGate(slug) || placeholderGate(cta));
}

export function regionalVenueCta(slug, locale = "en", market, product, context = {}) {
  const cta = baseRegionalVenueCta(slug, locale, market, product);
  const gate = sourceBoundActionGate(slug) || placeholderGate(cta);
  const contextSearch = directoryContextSearch({
    market,
    product,
    locale,
    accountStage: context?.accountStage,
    funding: context?.funding,
  });
  if (!gate && cta.ctaState === "available") return cta;
  if (!gate) {
    return {
      ...cta,
      direct: false,
      regionEligible: false,
      ctaHref: localizedHref(`/exchanges/${slug}?${contextSearch}#registration-path`, { locale }),
      actionGate: Object.freeze({ reason: "regional-verification-required" }),
    };
  }
  return {
    ...failClosedPublicCta(cta, gate),
    direct: false,
    ctaState: "blocked",
    regionEligible: false,
    ctaHref: localizedHref(`/exchanges/${slug}?${contextSearch}#source-review`, { locale }),
  };
}

export function publicCtaForTopicPlatform(platform, locale = "en") {
  const base = basePublicCtaForTopicPlatform(platform, locale);
  const cta = publicCtaForVenue(platform?.slug, locale);
  if (!cta.actionGate) return base;
  return {
    ...base,
    affiliateUrl: null,
    hasReferral: false,
    hasPartnerRoute: false,
    benefitVerified: false,
    inviteCode: null,
    rebate: 0,
    bonus: null,
    actionGate: cta.actionGate,
  };
}
