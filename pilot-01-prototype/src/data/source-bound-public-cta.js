import { partnerPromotionGate } from "./partner-geo-policy.js";
import {
  publicCtaForTopicPlatform as basePublicCtaForTopicPlatform,
  publicCtaForVenue as basePublicCtaForVenue,
} from "./public-cta.js";
import { NEUTRAL_CTA_LOCALES } from "./locale-policy.js";
import { CUSTOM_INVITE_CODES } from "./partner-registry.js";

// This projection never edits or replaces protected referral records. It only
// prevents the UI from opening a commercial route while current venue-owned
// sources do not support the action claims required for a safe handoff.
const SOURCE_REVIEW_GATES = Object.freeze({
  drift: Object.freeze({
    reason: "venue-source-review-required",
    reviewedAt: "2026-09-29",
  }),
});

// These locales publish research only; territory inferred from a language must
// never reopen an account or campaign action on their pages.
const NEUTRAL_SIGNUP_GATE = Object.freeze({ reason: "neutral-locale-signup-disabled" });
function neutralSignupGate(locale) {
  return NEUTRAL_CTA_LOCALES.has(locale) ? NEUTRAL_SIGNUP_GATE : null;
}

export function sourceBoundActionGate(slug) {
  return SOURCE_REVIEW_GATES[String(slug || "").toLowerCase()] || null;
}

// QA 2026-10-10: "NEXU_KUCOIN" / "NEXU_DERIBIT" / "NEXU_GMX" are registry placeholders (待补充), not codes the
// exchange issued. Showing them sends readers to a sign-up with an invalid code; route them to the official site
// instead until the owner supplies the real code.
export const PLACEHOLDER_INVITE_CODE = /^NEXU_[A-Z0-9]+$/;
const PLACEHOLDER_GATE = Object.freeze({ reason: "placeholder-invite-code" });
export function placeholderGate(cta) {
  return [cta?.inviteCode, cta?.configuredInviteCode].some((code) => typeof code === "string" && PLACEHOLDER_INVITE_CODE.test(code)) ? PLACEHOLDER_GATE : null;
}

export function failClosedPublicCta(cta, gate) {
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

// The code a reader types must match the registry value exactly. Registration URLs and older venue records may carry
// the same code in another case (Backpack: backpack.exchange/join/luckybitcoin vs registry LuckyBitcoin), so a
// case-only difference is displayed as the registry value. Different codes are never rewritten.
export function registryCasedInviteCode(slug, cta) {
  const registry = CUSTOM_INVITE_CODES[slug];
  if (!cta || typeof registry !== "string") return cta;
  const cased = (code) => (typeof code === "string" && code !== registry && code.toLowerCase() === registry.toLowerCase() ? registry : code);
  const inviteCode = cased(cta.inviteCode);
  const configuredInviteCode = cased(cta.configuredInviteCode);
  if (inviteCode === cta.inviteCode && configuredInviteCode === cta.configuredInviteCode) return cta;
  return { ...cta, inviteCode, configuredInviteCode };
}

export function publicCtaForVenue(slug, locale = "en", market) {
  const cta = registryCasedInviteCode(slug, basePublicCtaForVenue(slug, locale));
  return failClosedPublicCta(cta, neutralSignupGate(locale) || partnerPromotionGate(slug, { locale, market }) || sourceBoundActionGate(slug) || placeholderGate(cta));
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

const CTA_SRC_RE = /^[a-z0-9][a-z0-9_-]{0,47}$/;
export function venueGoHref(slug, src = "signup", locale = "en", market) {
  const cta = publicCtaForVenue(slug, locale, market);
  if (!cta?.hasReferral || !cta.routeAvailable) return null;
  const safeSrc = CTA_SRC_RE.test(String(src || "")) ? String(src) : "signup";
  const params = new URLSearchParams({ src: safeSrc });
  if (locale && locale !== "en") params.set("locale", locale);
  if (market) params.set("market", market);
  return `/go/${encodeURIComponent(String(slug || "").toLowerCase())}?${params.toString()}`;
}
