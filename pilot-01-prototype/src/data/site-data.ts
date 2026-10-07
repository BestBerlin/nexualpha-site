import { CoreClient } from "../../../backend/src/sdk/core-client.ts";
import { normalizeMarketIntelligence, unavailableMarketIntelligence } from "./market-intelligence-view.js";

export type DataSource = "mock" | "core";
export type OpportunityState = "Active" | "Upcoming" | "Ending soon" | "Expired" | "Restricted" | "Pending" | "Stale" | "No offer" | "Partner" | "Sponsored";
export type CommercialAction = { kind: "closed"; label: "No offer" | "Restricted" | "Expired" | "Stale" };
export type OpportunityViewModel = {
  slug: string;
  title: string;
  summary: string;
  venue: string;
  state: OpportunityState;
  updatedAt: string;
  sourceLabel: "verified" | "unavailable";
  region: "Singapore" | "Restricted market" | "unknown";
  action: CommercialAction;
};
export type VenueViewModel = {
  slug: string;
  name: string;
  category: "CEX" | "DEX" | "Perp DEX";
  officialDomain: string;
  verifiedBrandKey: string;
  products: string;
  availability: "verified" | "unavailable";
  sourceStatus: "VERIFIED" | "STALE" | "UNKNOWN";
  assetCapabilities: readonly AssetCapabilityViewModel[];
};
export type AssetCapabilityViewModel = { assetClass: "DIGITAL_ASSETS" | "ONCHAIN_RWA" | "TOKENIZED_EQUITIES" | "COMMODITIES" | "FX" | "MULTI_ASSET"; verifiedAt: string; expiresAt: string | null; sourceUrl: string; };
export type OfficialUpdateViewModel = { id: string; kind: string; platform: { slug: string; name: string }; title: string; officialSource: { type: string; url: string }; discoveredAt: string; verifiedAt: string; expiresAt: string | null; };
export type MarketAssetPulsePointViewModel = { symbol: "BTC" | "ETH" | "SOL"; priceUsd: number; change24hPct: number; asOf: string; };
export type MarketExchangeSnapshotViewModel = { venueSlug: string; volume24hUsd: number | null; volumeChange24hPct: number | null; asOf: string; };
export type MarketFeedViewModel<T> = { status: "available" | "unavailable"; provider: string | null; sourceUrl: string | null; fetchedAt: string | null; freshness: "fresh" | "stale" | "unavailable"; attribution: string | null; reasonCode: string | null; data: readonly T[]; };
export type MarketIntelligenceViewModel = { status: "available" | "unavailable"; assetPulse: MarketFeedViewModel<MarketAssetPulsePointViewModel> & { quoteCurrency: "USD" }; exchangeSnapshots: MarketFeedViewModel<MarketExchangeSnapshotViewModel>; exchangeSnapshotsBySlug: Readonly<Record<string, MarketExchangeSnapshotViewModel>>; };
export type SiteViewModel = {
  featured: OpportunityViewModel;
  listings: readonly OpportunityViewModel[];
  venues: readonly VenueViewModel[];
  listingsAvailability: "available" | "unavailable";
  listingsReasonCode?: "NO_COMPARABLE_AUTHORIZED_SOURCE";
  officialUpdates: readonly OfficialUpdateViewModel[];
  market: MarketIntelligenceViewModel;
  source: DataSource;
  contentVersion?: string;
};
export type SiteLoadResult =
  | { status: "ready"; view: SiteViewModel }
  | { status: "empty"; view?: undefined }
  | { status: "error"; view?: undefined }
  | { status: "stale"; view: SiteViewModel };

const corePrefix = "/api/v1";

function configuredDataSource(): DataSource {
  const requested = import.meta.env.VITE_DATA_SOURCE;
  if (requested === "mock" && import.meta.env.PROD) throw new Error("DATA_SOURCE=mock is not permitted in production");
  if (requested === "mock" || requested === "core") return requested;
  return import.meta.env.PROD ? "core" : "mock";
}

export const DATA_SOURCE = configuredDataSource();

async function coreFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = new URL(typeof input === "string" ? input : input.toString(), window.location.origin);
  if (!url.pathname.startsWith(`${corePrefix}/`)) url.pathname = `${corePrefix}${url.pathname}`;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init?.signal?.aborted) abort();
  init?.signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, 8000);
  try {
    return await window.fetch(url.toString(), { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    init?.signal?.removeEventListener("abort", abort);
  }
}

function coreClient() {
  // CoreClient owns request construction and OpenAPI-derived response types. The browser adapter only restores
  // the versioned API prefix because the SDK currently supplies endpoint paths from the origin root.
  return new CoreClient({ baseUrl: window.location.origin, fetch: coreFetch });
}

type ClosedActionLabel = Extract<CommercialAction, { kind: "closed" }>["label"];
const closed = (label: ClosedActionLabel): CommercialAction => ({ kind: "closed", label });

const unavailableFeature: OpportunityViewModel = {
    slug: "neutral-platform-directory",
    title: "Best crypto exchanges",
    summary: "Editorial comparison awaiting commercial verification.",
    venue: "",
    state: "Pending",
    updatedAt: "",
    sourceLabel: "unavailable",
    region: "unknown",
    action: { kind: "closed", label: "No offer" },
};

export const mockSiteView: SiteViewModel = {
  source: "mock",
  featured: unavailableFeature,
  listings: [],
  venues: [],
  listingsAvailability: "unavailable",
  listingsReasonCode: "NO_COMPARABLE_AUTHORIZED_SOURCE",
  officialUpdates: [],
  market: unavailableMarketIntelligence() as MarketIntelligenceViewModel,
};

type CoreOpportunity = Awaited<ReturnType<CoreClient["opportunities"]>>["data"][number];
type CoreCommercial = Awaited<ReturnType<CoreClient["resolveCommercial"]>>["data"];
type CoreBootstrap = Awaited<ReturnType<CoreClient["bootstrap"]>>;
type CoreVenue = Awaited<ReturnType<CoreClient["venue"]>>["data"];
type CoreListingFeed = Awaited<ReturnType<CoreClient["listings"]>>;
type CoreOfficialUpdates = Awaited<ReturnType<CoreClient["officialUpdates"]>>;
type CoreAssetPulse = Awaited<ReturnType<CoreClient["assetPulse"]>>["data"];
type CoreExchangeSnapshots = Awaited<ReturnType<CoreClient["exchangeSnapshots"]>>["data"];

function commercialAction(commercial: CoreCommercial | undefined): CommercialAction {
  // Legacy CommercialResolveResponse can contain an href. It is intentionally
  // not mapped until an approved OutboundOffer has a separate, reviewed UI
  // integration; this public view never receives a navigation destination.
  if (commercial && commercial.decision.outcome === "ALLOW" && commercial.cta) return closed("No offer");
  if (commercial && commercial.decision.reason === "CAMPAIGN_EXPIRED") return closed("Expired");
  if (commercial && (commercial.decision.reason === "HARD_DENY" || commercial.decision.reason === "GLOBAL_KILL_SWITCH")) return closed("Restricted");
  if (commercial && commercial.decision.reason === "POLICY_EVALUATION_FAILED") return closed("Stale");
  return closed("No offer");
}

function opportunityState(opportunity: CoreOpportunity, action: CommercialAction): OpportunityState {
  if (action.label === "Expired" || action.label === "Restricted" || action.label === "Stale") return action.label;
  return opportunity.commercialStatus === "verified" ? "No offer" : "Pending";
}

function toOpportunityViewModel(opportunity: CoreOpportunity, commercial?: CoreCommercial): OpportunityViewModel {
  const action = commercialAction(commercial);
  return {
    slug: opportunity.slug,
    title: opportunity.title,
    summary: opportunity.summary,
    venue: "",
    state: opportunityState(opportunity, action),
    updatedAt: opportunity.updatedAt,
    sourceLabel: "unavailable",
    region: "unknown",
    action,
  };
}

function toVenueViewModel(venue: CoreVenue): VenueViewModel {
  const now = Date.now();
  return {
    slug: venue.slug,
    name: venue.name,
    category: venue.type === "PERP_DEX" ? "Perp DEX" : venue.type,
    officialDomain: venue.officialDomains[0] ?? "",
    verifiedBrandKey: venue.verifiedBrandKey,
    products: venue.products.join(" · "),
    availability: venue.availability.serviceState === "verified_allow" && venue.source.freshness === "VERIFIED" ? "verified" : "unavailable",
    sourceStatus: venue.source.freshness,
    // Brand verification and product labels cannot be promoted to market
    // coverage. Keep only reviewed, real, time-valid capability evidence.
    assetCapabilities: venue.assetCapabilities.filter((capability) => capability.reviewStatus === "VERIFIED" && capability.fixture === false && capability.verifiedAt !== null && Number.isFinite(Date.parse(capability.verifiedAt)) && (!capability.expiresAt || Date.parse(capability.expiresAt) > now)).map((capability) => ({ assetClass: capability.assetClass, verifiedAt: capability.verifiedAt!, expiresAt: capability.expiresAt, sourceUrl: capability.sourceUrl })),
  };
}

function coreView(bootstrap: CoreBootstrap, opportunities: readonly CoreOpportunity[], venues: readonly CoreVenue[], listings: CoreListingFeed, officialUpdates: CoreOfficialUpdates, market: MarketIntelligenceViewModel, commercial?: CoreCommercial): SiteViewModel {
  const featured = opportunities[0] ? toOpportunityViewModel(opportunities[0], commercial) : unavailableFeature;
  return {
    source: "core",
    featured,
    listings: opportunities.map((opportunity) => toOpportunityViewModel(opportunity, opportunity.slug === featured.slug ? commercial : undefined)),
    venues: venues.map(toVenueViewModel),
    listingsAvailability: listings.availability,
    listingsReasonCode: listings.reasonCode === "NO_COMPARABLE_AUTHORIZED_SOURCE" ? listings.reasonCode : undefined,
    officialUpdates: officialUpdates.data.filter((item) => item.reviewStatus === "APPROVED" && item.fixture === false && Number.isFinite(Date.parse(item.discoveredAt)) && item.verifiedAt !== null && Number.isFinite(Date.parse(item.verifiedAt)) && (!item.expiresAt || Date.parse(item.expiresAt) > Date.now())).map((item) => ({ ...item, verifiedAt: item.verifiedAt! })),
    market,
    contentVersion: bootstrap.contentVersion.id,
  };
}

export async function loadSiteView(locale: string): Promise<SiteLoadResult> {
  if (DATA_SOURCE === "mock") return { status: "ready", view: mockSiteView };
  return loadCoreSiteView(locale, coreClient());
}

export async function loadCoreSiteView(locale: string, client: CoreClient): Promise<SiteLoadResult> {
  try {
    const [bootstrap, opportunityResponse, venueResponse, listingResponse, officialUpdateResponse, assetPulseResponse, exchangeSnapshotResponse] = await Promise.all([
      client.bootstrap(locale),
      client.opportunities(),
      client.venues(),
      client.listings(),
      client.officialUpdates(),
      client.assetPulse().then((response) => response.data).catch(() => undefined),
      client.exchangeSnapshots().then((response) => response.data).catch(() => undefined),
    ]);
    // The preview worker deliberately returns HTTP200 fail-closed envelopes.
    // They are not successful empty data and must not be labelled connected.
    if (!bootstrap.contentVersion?.id || [bootstrap, opportunityResponse, venueResponse, officialUpdateResponse].some(
      (response) => "status" in response && response.status === "unavailable",
    )) return { status: "error" };
    const commercial = await (opportunityResponse.data.length
        ? client.resolveCommercial(opportunityResponse.data[0]!.slug).then((response) => response.data).catch(() => undefined)
        : undefined);
    // VenueListResponse already contains the full, identical Venue schema.
    // Avoid a second network wave of 21 duplicate per-platform requests.
    const venues = venueResponse.data;
    const market = normalizeMarketIntelligence(assetPulseResponse as CoreAssetPulse | undefined, exchangeSnapshotResponse as CoreExchangeSnapshots | undefined, venues.map((venue) => venue.slug)) as MarketIntelligenceViewModel;
    const view = coreView(bootstrap, opportunityResponse.data, venues, listingResponse, officialUpdateResponse, market, commercial);
    return { status: "ready", view };
  } catch {
    return { status: "error" };
  }
}
