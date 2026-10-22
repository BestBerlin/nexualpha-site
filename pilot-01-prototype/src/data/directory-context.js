// Keep the directory API stable while CTA callers import only the small context helpers.
export { directoryContext, directoryContextSearch, defaultDirectoryCategory, venueMarketStatus, regionalCtaState } from "./directory-cta-context.js";
import { directoryContext, venueMarketStatus } from "./directory-cta-context.js";
import { compareVenuePriority, orderVenues } from "./venue-priority.js";
import { buildRegionalShortlist } from "./regional-shortlist.js";

export function regionalDirectoryCandidateState(venue, { market, product = "unknown", locale = "en", accountStage = "new_account", funding = "" } = {}) {
  const context = directoryContext({ market, product, locale });
  if (!context.scoped) return { status: "unscoped", candidate: null };
  const shortlist = buildRegionalShortlist({
    market: context.market,
    product: context.product || product || "spot",
    locale: context.locale || locale,
    accountStage,
    funding,
  });
  const candidate = shortlist.candidates.find((item) => item.slug === venue?.slug) || null;
  if (!candidate) return { status: "not_in_shortlist", candidate: null };
  return { status: candidate.status, candidate };
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
