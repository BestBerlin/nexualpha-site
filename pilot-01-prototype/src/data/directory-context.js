import { compareVenuePriority, orderVenues } from "./venue-priority.js";
import { resolveMarketPolicy } from "./market-policy.js";
import { venueDatabase } from "./venue-database.js";
import { regionalEligibilityState } from "./regional-eligibility-evidence.js";
import { readDecisionPassport } from "./decision-passport.js";
import { regionalShortlistCandidateState } from "./regional-shortlist-summary.js";

const REGION_TERMS = {
  BR: ["brazil", "latam", "global", "worldwide"],
  MX: ["mexico", "latam", "global", "worldwide"],
  TW: ["taiwan", "台灣", "taiwan fsc", "vasp", "twd", "personal bank account", "asia", "global", "worldwide"],
  ID: ["indonesia", "ojk", "bappebti", "idr", "qris", "virtual account", "va bank", "tokocrypto", "asia", "global", "worldwide"],
  HK: ["hong kong", "asia", "global", "worldwide"],
  EU: ["eu", "europe", "global", "worldwide"],
  UK: ["uk", "united kingdom", "europe", "global", "worldwide"],
  JP: ["japan", "fsa", "jfsa", "jpy", "bank transfer", "asia", "global", "worldwide"],
  KR: ["korea", "south korea", "fsc", "krw", "real-name bank account", "asia", "global", "worldwide"],
  SG: ["singapore", "mas", "sgd", "paynow", "fast", "asia", "global", "worldwide"],
  TR: ["turkey", "türkiye", "turkiye", "spk", "try", "global", "worldwide"],
  US: ["united states", "usa", "us", "america", "usd", "ach", "wire", "new york", "global", "worldwide"],
  VN: ["vietnam", "vnd", "asia", "global", "worldwide"],
};

const MARKET_LABELS = {
  BR: "Brazil",
  MX: "México",
  TW: "台灣",
  ID: "Indonesia",
  HK: "Hong Kong",
  EU: "European Union",
  UK: "United Kingdom",
  JP: "Japan",
  KR: "Korea",
  SG: "Singapore",
  TR: "Türkiye",
  US: "United States",
  VN: "Vietnam",
};

const normalized = (value) => String(value || "").trim().toLowerCase();

function appendKnownParam(params, key, value) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue || normalizedValue.toLowerCase() === "unknown") return;
  params.set(key, normalizedValue);
}

export function directoryContext({ market, product, locale } = {}) {
  const policy = resolveMarketPolicy({ market });
  const targetMarket = policy.targetMarket;
  const resolvedProduct = product || policy.product || "unknown";
  return {
    market: targetMarket === "unknown" ? undefined : targetMarket,
    product: resolvedProduct === "unknown" ? undefined : resolvedProduct,
    locale: locale || policy.defaultLocale || "en",
    label: MARKET_LABELS[targetMarket] || "Global",
    terms: REGION_TERMS[targetMarket] || [],
    scoped: Boolean(REGION_TERMS[targetMarket]),
  };
}

export function directoryContextSearch({ market, product, locale, accountStage, funding } = {}) {
  const context = directoryContext({ market, product, locale });
  const passport = readDecisionPassport("", { market: context.market, product: context.product, accountStage, funding });
  const params = new URLSearchParams();
  appendKnownParam(params, "market", context.market);
  appendKnownParam(params, "product", context.product);
  appendKnownParam(params, "account_stage", passport.accountStage);
  appendKnownParam(params, "funding", passport.funding);
  if (context.locale !== "en") params.set("locale", context.locale);
  if (context.scoped) {
    params.set("utm_source", "regional_preview");
    params.set("utm_campaign", `${context.market.toLowerCase()}-research-preview`);
  }
  return params.toString();
}

export function defaultDirectoryCategory({ market, product } = {}) {
  const context = directoryContext({ market, product });
  if (!context.scoped) return "all";
  if (context.product === "spot") return "CEX";
  if (context.product === "perpetuals") return "Perp DEX";
  return "all";
}

export function venueMarketStatus(venue, market, product = "unknown") {
  const context = directoryContext({ market });
  if (!context.scoped) return "unscoped";
  const evidence = venueDatabase[venue?.slug] || venue;
  // Production venue records must have a dedicated, dated eligibility record.
  // The legacy field heuristic remains available for isolated caller-provided
  // research rows and tests, but it cannot authorize a real venue handoff.
  if (venueDatabase[venue?.slug]) {
    const eligibility = regionalEligibilityState({ slug: venue.slug, market: context.market, product });
    if (eligibility.status !== "unverified" || eligibility.evidence !== null) return eligibility.status;
    return "unverified";
  }
  const supported = Array.isArray(evidence?.supportedRegions) ? evidence.supportedRegions.map(normalized) : [];
  const restricted = Array.isArray(evidence?.restrictedRegions) ? evidence.restrictedRegions.map(normalized) : [];
  const restrictedMatch = context.terms.some((term) => restricted.some((value) => value.includes(term) || term.includes(value)));
  const explicitTerms = context.terms.filter((term) => term !== "global" && term !== "worldwide");
  const supportedMatch = explicitTerms.some((term) => supported.some((value) => value.includes(term) || term.includes(value)));
  if (restrictedMatch && !supportedMatch) return "restricted";
  if (supportedMatch) return "matched";
  return "unverified";
}

export function regionalCtaState({ market, status } = {}) {
  const context = directoryContext({ market });
  if (!context.scoped || status === "matched" || status === "unscoped") return "available";
  if (status === "restricted" || status === "paused") return "blocked";
  return "verify";
}

export function regionalDirectoryCandidateState(venue, { market, product = "unknown", locale = "en" } = {}) {
  const context = directoryContext({ market, product, locale });
  if (!context.scoped) return { status: "unscoped", candidate: null };
  if (venueMarketStatus(venue, context.market, context.product || product) === "restricted") return { status: "not_in_shortlist", candidate: null };
  return regionalShortlistCandidateState({ market: context.market, slug: venue?.slug });
}

export function filterDirectoryVenues(venues = [], market, options = {}) {
  const context = directoryContext({ market, product: options.product, locale: options.locale });
  venues = orderVenues(venues, context.locale);
  if (context.scoped) {
    return venues
      .map((venue) => ({ venue, regional: regionalDirectoryCandidateState(venue, { ...options, market: context.market }) }))
      .filter(({ regional }) => regional.status !== "not_in_shortlist")
      .sort((a, b) => {
        const rank = (status) => status === "researchable" ? 0 : status === "account_confirm" ? 1 : status === "paused" ? 2 : 3;
        return rank(a.regional.status) - rank(b.regional.status) || compareVenuePriority(a.venue, b.venue);
      })
      .map(({ venue }) => venue);
  }
  const statuses = venues.map((venue) => venueMarketStatus(venue, market));
  return venues
    .map((venue, index) => ({ venue, status: statuses[index] }))
    .filter(({ status }) => status !== "restricted")
    .sort((a, b) => (a.status === "matched" ? 0 : 1) - (b.status === "matched" ? 0 : 1))
    .map(({ venue }) => venue);
}
