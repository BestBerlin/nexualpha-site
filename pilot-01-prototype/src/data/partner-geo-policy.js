// Runtime policy compiled from the provenance table by the build; do not duplicate country lists here.
import { PARTNER_RESTRICTED_COUNTRIES, PARTNER_RESTRICTED_SCOPES, TURKEY_PROMOTED_PARTNERS, COUNTRY_BY_LOCALE, COUNTRY_BY_MARKET } from "./partner-geo-policy.generated.js";
export function promotionCountries({ locale = "en", market } = {}) {
  // Explicit markets take precedence: /uk is Britain, while locale uk is Ukrainian.
  if (market && !["GLOBAL", "GLOBAL_OTHER", "OTHER", "UNKNOWN"].includes(String(market).toUpperCase())) {
    const key = String(market).replace(/^\//, "").split(/[/?#]/)[0].toUpperCase();
    const mapped = COUNTRY_BY_MARKET[key] || key;
    return Array.isArray(mapped) ? mapped : [mapped];
  }
  return COUNTRY_BY_LOCALE[locale] ? [COUNTRY_BY_LOCALE[locale]] : [];
}
export function partnerPromotionGate(slug, context = {}) {
  // Scope selectors require the caller to establish territorial membership; never infer it from language.
  const marketScope = String(context.market || "").replace(/^\//, "").split(/[/?#]/)[0].toUpperCase();
  const territoryGate = (PARTNER_RESTRICTED_SCOPES[slug] || []).find(scope => scope === marketScope || (scope === "EU" && COUNTRY_BY_MARKET.EU.includes(marketScope)));
  if (territoryGate) return { scope: territoryGate, reason: "partner-geo-restricted" };
  const countries = promotionCountries(context);
  if (countries.includes("TR") && !TURKEY_PROMOTED_PARTNERS.includes(slug)) {
    return { reason: "partner-geo-restricted", country: "TR" };
  }
  const country = (PARTNER_RESTRICTED_COUNTRIES[slug] || []).find(restricted => countries.some(country => country === restricted || country.startsWith(`${restricted}-`)));
  return country ? { country, reason: "partner-geo-restricted" } : null;
}
export function isPartnerPromotableIn(slug, context = {}) { return !partnerPromotionGate(slug, context); }
