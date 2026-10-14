// Runtime policy compiled from the provenance table by the build; do not duplicate country lists here.
import { PARTNER_RESTRICTED_COUNTRIES, PARTNER_RESTRICTED_SCOPES, PROMOTION_BANNED_COUNTRIES, TURKEY_PROMOTED_PARTNERS, COUNTRY_BY_LOCALE, COUNTRY_BY_MARKET } from "./partner-geo-policy.generated.js";
// Request market for callers that only pass a locale (tr-market-gaps): the SSR entry sets it for one synchronous render
// from the request URL; in the browser it is read from the address bar. An explicit context.market always wins.
let renderMarket;
export function withRequestMarket(market, render) {
  const previous = renderMarket;
  renderMarket = market || null;
  try { return render(); } finally { renderMarket = previous; }
}
function requestMarket() {
  if (renderMarket !== undefined) return renderMarket || undefined;
  if (typeof window === "undefined") return undefined;
  try { return new URLSearchParams(window.location?.search || "").get("market") || undefined; } catch { return undefined; }
}
// Only a Türkiye request market is applied implicitly; other markets keep needing an explicit context.market.
function requestTurkeyMarket() {
  const market = requestMarket();
  if (!market) return undefined;
  const key = String(market).replace(/^\//, "").split(/[/?#]/)[0].toUpperCase();
  return COUNTRY_BY_MARKET[key] === "TR" || key === "TR" ? market : undefined;
}
export function promotionCountries({ locale = "en", market = requestTurkeyMarket() } = {}) {
  // Explicit markets take precedence: /uk is Britain, while locale uk is Ukrainian.
  if (market && !["GLOBAL", "GLOBAL_OTHER", "OTHER", "UNKNOWN"].includes(String(market).toUpperCase())) {
    const key = String(market).replace(/^\//, "").split(/[/?#]/)[0].toUpperCase();
    const mapped = COUNTRY_BY_MARKET[key] || key;
    return Array.isArray(mapped) ? mapped : [mapped];
  }
  return COUNTRY_BY_LOCALE[locale] ? [COUNTRY_BY_LOCALE[locale]] : [];
}
const isBannedCountry = (country) => PROMOTION_BANNED_COUNTRIES.some(banned => country === banned || String(country).startsWith(`${banned}-`));
// A country where no partner may be promoted (Vietnam, owner 2026-10-13): matched from the market/country context and,
// independently, from the locale (vi pages stay information-only even when they name another market).
export function jurisdictionPromotionBan({ locale = "en", market } = {}) {
  const raw = String(locale || "");
  const localeCountry = COUNTRY_BY_LOCALE[raw] || COUNTRY_BY_LOCALE[raw.toLowerCase()] || COUNTRY_BY_LOCALE[raw.split("-")[0].toLowerCase()];
  const country = [localeCountry, ...promotionCountries({ locale, market })].find(code => code && isBannedCountry(code));
  return country ? { country, reason: "jurisdiction-promotion-ban" } : null;
}
export function partnerPromotionGate(slug, context = {}) {
  const ban = jurisdictionPromotionBan(context);
  if (ban) return ban;
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
// Owner 2026-10-13 (legal): on Türkiye pages a partner outside TURKEY_PROMOTED_PARTNERS (Bitget: SPK list) may be named
// informationally only — no sign-up card, no rebate share, no link into its registration section.
export function isTurkeyGated(slug, context = {}) { return partnerPromotionGate(slug, context)?.country === "TR"; }
// Owner 2026-10-14 (tr-bitget-sweep): Bitget is on the SPK liquidation list, so Türkiye pages (locale tr, or an explicit
// market TR) leave it out of every promotional or navigational surface — directories, fee/funding tables and boards,
// compare links and cards, related links, offers and structured data. The only remaining mention is the neutral SPK fact
// on /tr/licenses/turkey (plain text, no link). Every other edition keeps Bitget unchanged.
export const TURKEY_UNLISTED_VENUES = Object.freeze(["bitget"]);
const TURKEY_UNLISTED_PATTERN = new RegExp(TURKEY_UNLISTED_VENUES.join("|"), "i");
export function isTurkeyPage({ locale, market } = {}) {
  const effectiveMarket = market || requestTurkeyMarket();
  return String(locale || "").toLowerCase() === "tr" || (effectiveMarket ? promotionCountries({ market: effectiveMarket }).includes("TR") : false);
}
export function isTurkeyUnlistedVenue(slug, context = {}) {
  return TURKEY_UNLISTED_VENUES.includes(String(slug || "").toLowerCase()) && isTurkeyPage(context);
}
/** True when a link, label, slug or record may be shown on this page (always true outside Türkiye pages). */
export function turkeyListingAllowed(value, context = {}) {
  if (!isTurkeyPage(context)) return true;
  return !TURKEY_UNLISTED_PATTERN.test(typeof value === "string" ? value : JSON.stringify(value ?? ""));
}
/** Drops the entries that name an unlisted venue on Türkiye pages; returns the same array elsewhere. */
export function withoutTurkeyUnlisted(list, context = {}, pick = (item) => item) {
  if (!Array.isArray(list) || !isTurkeyPage(context)) return list;
  return list.filter((item) => turkeyListingAllowed(pick(item), context));
}
/** Feed shapes keyed by venue slug ({ venues: { bitget: … } }): drops unlisted venues on Türkiye pages. */
export function withoutTurkeyUnlistedVenueFeed(feed, context = {}) {
  if (!feed?.venues || typeof feed.venues !== "object" || !isTurkeyPage(context)) return feed;
  const venues = Object.fromEntries(Object.entries(feed.venues).filter(([slug]) => !isTurkeyUnlistedVenue(slug, context)));
  return Object.keys(venues).length === Object.keys(feed.venues).length ? feed : { ...feed, venues };
}
/**
 * Structured data on Türkiye pages: removes list entries (ListItems, hasPart, FAQ questions, sameAs …) that still name an
 * unlisted venue once their own children are cleaned, and renumbers ListItem positions. Objects outside arrays are kept.
 */
export function withoutTurkeyUnlistedSchema(value, context = {}) {
  if (!isTurkeyPage(context)) return value;
  const prune = (node) => {
    if (Array.isArray(node)) {
      const kept = node.map(prune).filter((item) => item === null || typeof item === "number" || typeof item === "boolean" || turkeyListingAllowed(item, context));
      let position = 0;
      return kept.map((item) => (item && typeof item === "object" && !Array.isArray(item) && item["@type"] === "ListItem" && typeof item.position === "number" ? { ...item, position: ++position } : item));
    }
    if (node && typeof node === "object") return Object.fromEntries(Object.entries(node).map(([key, item]) => [key, prune(item)]));
    return node;
  };
  return prune(value);
}
