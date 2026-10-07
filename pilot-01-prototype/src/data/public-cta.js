import { venueDatabase } from "./venue-database.js";
import { partnerRegistry } from "./partner-registry.js";
import { publicCommercialBenefit, resolveCommercialClaim } from "./commercial-claims.js";

const CODE_QUERY_KEYS = ["ref", "inviteCode", "invite_code", "affiliate_id", "channelCode", "vipCode", "rcode", "reg"];

function codeFromRegistrationUrl(url) {
  try {
    const parsed = new URL(url);
    for (const key of CODE_QUERY_KEYS) {
      const value = parsed.searchParams.get(key);
      if (value) return value;
    }
    const segments = parsed.pathname.split("/").filter(Boolean);
    const joinIndex = segments.findIndex((segment) => /^(join|refer|ref)$/i.test(segment));
    if (joinIndex >= 0 && segments[joinIndex + 1]) return segments[joinIndex + 1];
  } catch {
    return null;
  }
  return null;
}

function routeInviteCode({ slug, registrationUrl, partner, venue }) {
  const configured = partner.inviteCode ?? venue.inviteCode ?? null;
  const routeCode = codeFromRegistrationUrl(registrationUrl);
  if (!routeCode) return configured;
  // Bitget partner short links can carry route ids that are not the referral
  // code a user may need to enter manually. Keep the configured user code.
  if (slug === "bitget") return configured || routeCode;
  return routeCode;
}

// Public CTA view model. Partner economics stay private until a record has a
// verification timestamp and a concrete HTTPS source URL.
export function publicCtaForVenue(slug, locale = "en") {
  const db = venueDatabase[slug] || {};
  const partner = partnerRegistry[slug] || {};
  const claim = resolveCommercialClaim({ partner, venue: db });
  const officialDomain = partner.officialDomain || db.officialDomain || "";
  const registrationUrl = partner.registrationUrl || db.registrationUrl || (officialDomain ? `https://${officialDomain}` : "#");
  const registrationUrls = [
    registrationUrl,
    ...(partner.alternateRegistrationUrls || db.alternateRegistrationUrls || []),
  ].filter((url, index, urls) => /^https:\/\//i.test(url || "") && urls.indexOf(url) === index);
  const hasHttpsRegistration = /^https:\/\//i.test(registrationUrl || "");
  const hasReferral = Boolean(partner.hasReferral ?? db.hasReferral);
  const hasPartnerRoute = hasReferral && hasHttpsRegistration;
  const primaryInviteCode = hasPartnerRoute
    ? routeInviteCode({ slug, registrationUrl, partner, venue: db })
    : null;
  const isZh = String(locale).startsWith("zh");
  const configuredBenefit = isZh
    ? (partner.benefit?.[locale] || partner.benefit?.["zh-Hans"] || db.benefit?.[locale] || db.benefit?.["zh-Hans"] || "")
    : (partner.benefit?.[locale] || partner.benefit?.en || db.benefit?.[locale] || db.benefit?.en || "");
  const benefit = claim.status === "verified"
    ? configuredBenefit
    : publicCommercialBenefit({ locale, venueName: db.name || slug, claim });

  return {
    slug,
    name: db.name || partner.name || slug,
    // Keep the source records available to local UI gates. Callers must still
    // use the projected fields below for public copy and outbound actions.
    db,
    partner,
    officialDomain,
    registrationUrl,
    registrationUrls,
    alternateRegistrationUrls: registrationUrls.slice(1),
    inviteCode: primaryInviteCode,
    configuredInviteCode: hasPartnerRoute ? (partner.inviteCode ?? db.inviteCode ?? null) : null,
    hasReferral,
    hasPartnerRoute,
    routeAvailable: hasPartnerRoute,
    benefitVerified: claim.status === "verified",
    rebatePercent: claim.status === "verified" ? claim.rebatePercent : 0,
    benefit,
    claim,
    commercialClaim: claim,
  };
}

export function publicCtaForTopicPlatform(platform, locale = "en") {
  const cta = publicCtaForVenue(platform?.slug, locale);
  return {
    ...platform,
    affiliateUrl: cta.registrationUrl,
    hasReferral: cta.hasReferral,
    hasPartnerRoute: cta.hasPartnerRoute,
    benefitVerified: cta.benefitVerified,
    inviteCode: cta.inviteCode,
    rebate: cta.rebatePercent,
    netFee: cta.claim.status === "verified" ? platform?.netFee : (String(locale).startsWith("zh") ? "官方费率待核验" : "Official schedule to verify"),
    benefit: cta.benefit,
    claimStatus: cta.claim.status,
    bonus: cta.claim.status === "verified" ? platform?.bonus : null,
  };
}
