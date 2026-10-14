import { regionalVenueCta as baseRegionalVenueCta } from "./regional-cta.js";
import { directoryContextSearch } from "./directory-context.js";
import { localizedHref } from "./locale-routing.js";
import { partnerPromotionGate } from "./partner-geo-policy.js";
import { NEUTRAL_CTA_LOCALES } from "./locale-policy.js";
import {
  failClosedPublicCta,
  publicCtaForTopicPlatform,
  publicCtaForVenue,
  registryCasedInviteCode,
  placeholderGate,
  sourceBoundActionGate,
} from "./source-bound-public-cta.js";

const NEUTRAL_SIGNUP_GATE = Object.freeze({ reason: "neutral-locale-signup-disabled" });
function neutralSignupGate(locale) {
  return NEUTRAL_CTA_LOCALES.has(locale) ? NEUTRAL_SIGNUP_GATE : null;
}

export { publicCtaForTopicPlatform, publicCtaForVenue, sourceBoundActionGate };
export { PLACEHOLDER_INVITE_CODE } from "./source-bound-public-cta.js";

export { venueGoHref } from "./source-bound-public-cta.js";

export function regionalVenueCta(slug, locale = "en", market, product, context = {}) {
  const cta = registryCasedInviteCode(slug, baseRegionalVenueCta(slug, locale, market, product));
  const gate = neutralSignupGate(locale) || partnerPromotionGate(slug, { locale, market }) || sourceBoundActionGate(slug) || placeholderGate(cta);
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
