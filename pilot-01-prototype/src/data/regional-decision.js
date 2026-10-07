import { venueDatabase } from "./venue-database.js";
import { directoryContext, regionalDirectoryCandidateState, venueMarketStatus } from "./directory-context.js";

function evidenceFor(venue) {
  return venueDatabase[venue?.slug] || venue || {};
}

export function buildRegionalDecisionSet({ venues = [], market, product = "unknown", limit = 3 } = {}) {
  const context = directoryContext({ market, product });
  if (context.scoped) {
    const candidates = venues
      .map((venue) => ({ venue, evidence: evidenceFor(venue), regional: regionalDirectoryCandidateState(venue, { market, product, locale: context.locale }) }))
      .filter(({ regional }) => regional.status !== "not_in_shortlist" && regional.status !== "paused");
    return {
      market: context.market,
      label: context.label,
      primary: candidates[0] || null,
      alternatives: candidates.slice(1, Math.max(1, limit)),
      verification: candidates.length ? null : null,
    };
  }
  const candidates = venues
    .map((venue) => ({ venue, evidence: evidenceFor(venue), status: venueMarketStatus(venue, market, product) }))
    .filter(({ status }) => status !== "restricted")
    .sort((a, b) => {
      const statusRank = (status) => status === "matched" ? 0 : status === "unverified" ? 1 : 2;
      const categoryRank = (item) => product === "spot" ? (item.venue.category === "CEX" ? 0 : item.venue.category === "DEX" ? 1 : 2) : 0;
      return statusRank(a.status) - statusRank(b.status) || categoryRank(a) - categoryRank(b);
    });
  const matched = candidates.filter((item) => item.status === "matched");
  const primaryPool = matched.length ? matched : candidates;
  return {
    market: context.market,
    label: context.label,
    primary: primaryPool[0] || null,
    alternatives: primaryPool.slice(1, Math.max(1, limit)),
    verification: candidates.find((item) => item.status === "unverified") || null,
  };
}
