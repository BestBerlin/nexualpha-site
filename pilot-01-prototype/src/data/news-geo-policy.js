import { partnerRegistry } from "./partner-registry.js";
import { isPartnerPromotableIn, partnerPromotionGate } from "./partner-geo-policy.js";
import { neutralArticleView } from "./neutral-article.js";

// A locale restriction remains binding even when a permissive market is supplied.
export function newsVenueAllowed(slug, context = {}) {
  return isPartnerPromotableIn(slug, { locale: context.locale }) && isPartnerPromotableIn(slug, context);
}

const escapePattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const venuePatterns = Object.entries(partnerRegistry).map(([slug, partner]) => {
  const names = [slug, partner.name];
  for (const href of [partner.officialUrl, partner.registrationUrl, ...(partner.alternateRegistrationUrls || [])]) {
    try { names.push(new URL(href).hostname.replace(/^www\./, "")); } catch { /* absent URL */ }
  }
  return [slug, new RegExp(`(?<![a-z0-9])(?:${[...new Set(names.filter(Boolean))].map(escapePattern).join("|")})(?![a-z0-9])`, "i")];
});

// Reuse the restriction decision within a request without retaining arbitrary market strings.
const restrictedPatterns = new WeakMap();
function patternsFor(context) {
  const key = `${context.locale || ""}\0${context.market || ""}`;
  const cached = restrictedPatterns.get(context);
  if (cached?.key === key) return cached.patterns;
  // Locale alone only binds the Türkiye gate (tr pages never name Bitget). Other locale-inferred countries (ja → JP, ...)
  // keep their article bodies; an explicit request market applies its full territorial gate.
  const patterns = venuePatterns.filter(([slug]) => [{ locale: context.locale }, { market: context.market }].some(scope => {
    const gate = partnerPromotionGate(slug, scope);
    if (!gate || gate.reason === "jurisdiction-promotion-ban") return false;
    return scope.market ? true : gate.country === "TR";
  })).map(([, pattern]) => pattern);
  restrictedPatterns.set(context, { key, patterns });
  return patterns;
}

// Neutral editions keep informational research sources; neutralArticleView removes their CTAs.
// Territorial venue bans remove shared metadata and links that could reintroduce a restricted venue.
export function newsMetadataAllowed(value, context = {}) {
  const patterns = patternsFor(context);
  if (!patterns.length) return true;
  const text = typeof value === "string" ? value : JSON.stringify(value || "");
  return patterns.every(pattern => !pattern.test(text));
}

function filterMetadata(value, context) {
  if (Array.isArray(value)) return value.filter(item => newsMetadataAllowed(item, context)).map(item => filterMetadata(item, context));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .filter(([, item]) => typeof item !== "string" || newsMetadataAllowed(item, context))
    .map(([key, item]) => [key, filterMetadata(item, context)]));
  return value;
}

export function newsArticleGeoView(article, context = {}) {
  if (!article) return article;
  const view = { ...neutralArticleView(article, context.locale) };
  for (const key of ["sources", "seo", "aeo", "geo", "internalLinks", "relatedLinks", "relatedVenues", "tags", "topicTags", "cta"]) {
    if (key in view) view[key] = filterMetadata(view[key], context);
  }
  if (article.cta?.venue && !newsVenueAllowed(article.cta.venue, context)) delete view.cta;
  // A request market can restrict the requested edition too. Retain only safe text;
  // existing source-language fallback chooses a remaining verified edition.
  let projected = false;
  for (const key of ["title", "summary", "content"]) {
    if (!view[key] || typeof view[key] !== "object") continue;
    const entries = Object.entries(view[key]).filter(([, text]) => newsMetadataAllowed(text, context));
    projected ||= entries.length !== Object.keys(view[key]).length;
    view[key] = Object.fromEntries(entries);
  }
  if (projected && article.content) {
    const safeLocales = Object.keys(view.content || {}).filter(locale => view.title?.[locale] && view.summary?.[locale]);
    view.availableLocales = safeLocales;
    view.routeProjection = {
      source: "nexualpha-news-route-projection-v1", locale: context.locale,
      availableLocales: safeLocales,
    };
  }
  return view;
}

export function newsArticleGeoPool(articles, context = {}, keepSlug) {
  return (articles || []).filter(article => article.slug === keepSlug || newsMetadataAllowed([
    article.slug, article.title?.[context.locale] || article.title?.en,
    article.summary?.[context.locale] || article.summary?.en,
  ], context)).map(article => newsArticleGeoView(article, context));
}
