// A neutral discovery catalog keeps known platforms visible while the Core has
// no reviewed asset-capability evidence. It carries no links, offers, coverage,
// or availability claim; those remain empty/unknown until source-backed.
export const neutralVenueCatalog = [
  ["binance", "Binance", "CEX", "www.binance.com"], ["coinbase", "Coinbase", "CEX", "www.coinbase.com"], ["bybit", "Bybit", "CEX", "www.bybit.com"], ["bitget", "Bitget", "CEX", "www.bitget.com"], ["okx", "OKX", "CEX", "www.okx.com"], ["kraken", "Kraken", "CEX", "www.kraken.com"], ["gate-io", "Gate.io", "CEX", "www.gate.com"], ["kucoin", "KuCoin", "CEX", "www.kucoin.com"], ["mexc", "MEXC", "CEX", "www.mexc.com"], ["backpack", "Backpack", "CEX", "backpack.exchange"], ["deribit", "Deribit", "CEX", "www.deribit.com"],
  ["htx", "HTX", "CEX", "www.htx.com"], ["hashkey", "HashKey Global", "CEX", "global.hashkey.com"],
  ["uniswap", "Uniswap", "DEX", "app.uniswap.org"], ["pancakeswap", "PancakeSwap", "DEX", "pancakeswap.finance"], ["jupiter", "Jupiter", "DEX", "jup.ag"], ["raydium", "Raydium", "DEX", "raydium.io"], ["aerodrome", "Aerodrome", "DEX", "aerodrome.finance"], ["curve", "Curve", "DEX", "curve.finance"],
  ["hyperliquid", "Hyperliquid", "Perp DEX", "app.hyperliquid.xyz"], ["dydx", "dYdX", "Perp DEX", "dydx.trade"], ["gmx", "GMX", "Perp DEX", "gmx.io"], ["drift", "Drift", "Perp DEX", "app.drift.trade"], ["aevo", "Aevo", "Perp DEX", "app.aevo.xyz"],
].map(([slug, name, category, officialDomain]) => ({ slug, name, category, officialDomain, availability: "unavailable", sourceStatus: "UNKNOWN", assetCapabilities: [] }));

export function marketCommand(copy, venueCatalog = []) {
  const { common, compare, markets, rail } = copy;
  return {
    finderGroups: [
      { label: common.route, items: [`TSLA · ${markets.tokenized}`, `TSLA · ${markets.perpetual}`] },
      { label: copy.nav.exchanges, items: [copy.discovery.title, copy.listings.title] },
      { label: copy.nav.signals, items: [copy.opportunity.title, copy.compare.title] },
    ],
    finderFilters: {
      regions: [common.global, copy.ui.singapore, "EU", "UK", "US", "UAE"],
      assets: [common.all, "Spot", "Derivatives", "Perpetuals", markets.title],
      venues: [common.all, "CEX", "DEX", "Perp DEX"],
      sources: [common.verifiedSource, compare.checkTerms, common.all],
    },
    marketRail: [
      { time: "UTC", type: rail.listing, asset: copy.listings.title, venue: common.verifiedSource, value: rail.conditions },
      { time: "UTC", type: rail.venue, asset: "CEX / DEX", venue: compare.checkTerms, value: copy.ui.marketRegion },
      { time: "UTC", type: rail.route, asset: markets.tokenized, venue: compare.checkTerms, value: copy.compare.cta },
      { time: "UTC", type: rail.market, asset: markets.title, venue: compare.source, value: rail.conditions },
    ],
    venueCatalog: mergeVenueCatalog(venueCatalog),
    listingFilters: [common.all, "Spot", "Perpetuals", "Launchpool", "Airdrops", copy.listings.expired],
    venueFilters: [common.all, "CEX", "DEX", "Perp DEX", copy.listings.title, markets.title, "API"],
    tradfiRoutes: [
      { id: "equity", label: markets.equity, ownership: compare.evidence, venue: common.route, hours: "UTC", settlement: compare.checkTerms },
      { id: "tokenized", label: markets.tokenized, ownership: compare.evidence, venue: compare.checkTerms, hours: "UTC", settlement: compare.checkTerms },
      { id: "perpetual", label: markets.perpetual, ownership: compare.evidence, venue: "Perp DEX", hours: "UTC", settlement: compare.checkTerms },
    ],
  };
}

// Core coverage is incremental. Enrich known identities without removing the
// remaining neutral platforms or turning missing evidence into a positive claim.
export function mergeVenueCatalog(venues = []) {
  const merged = new Map(neutralVenueCatalog.map((venue) => [venue.slug, { ...venue }]));
  for (const venue of Array.isArray(venues) ? venues : []) {
    if (!venue || typeof venue.slug !== "string" || !/^[a-z0-9-]+$/.test(venue.slug)) continue;
    const known = merged.get(venue.slug);
    if (!known && (!venue.name || !venue.category)) continue;
    merged.set(venue.slug, { ...known, ...venue, ...(known ? { name: known.name, category: known.category } : {}) });
  }
  return [...merged.values()];
}

export const analyticsEvents = [
  "hero_search_focus", "hero_search_submit", "opportunity_impression", "opportunity_open", "compare_start", "compare_add_venue", "compare_cta_click", "listing_open", "tradfi_open", "region_restricted", "alternative_click",
];

const SAFE_ANALYTICS_KEYS = new Set(["resultKind", "routePattern", "market", "product", "locale"]);

function safeAnalyticsPayload(payload) {
  if (!payload || typeof payload !== "object") return {};
  const safe = {};
  for (const key of SAFE_ANALYTICS_KEYS) {
    const value = payload[key];
    if (typeof value === "string" && /^[\p{L}\p{N}_./:#-]{1,80}$/u.test(value)) safe[key] = value;
  }
  return safe;
}

export function track(name, payload) {
  if (!analyticsEvents.includes(name) || typeof window === "undefined") return;
  // Local-only UI notification. It intentionally contains no caller metadata,
  // identity, destination, or third-party-consumable queue write.
  const detail = { name, at: Date.now(), ...safeAnalyticsPayload(payload) };
  window.dispatchEvent(new CustomEvent("pilot01:analytics", { detail }));
}

export function presentationModel(siteView, region, copy) {
  const fallback = {
    slug: "unavailable", title: copy.opportunity.title, summary: copy.opportunity.unavailable, venue: copy.compare.checkTerms, state: "Stale", updatedAt: new Date().toISOString(), sourceLabel: "unavailable", region: "unknown", action: { kind: "closed", label: "Stale" },
  };
  const localizeCoreText = (item) => ({
    ...item,
    title: item.title === "Best crypto exchanges" ? copy.discovery.title : item.title,
    summary: item.summary === "Editorial comparison awaiting commercial verification." || item.summary === "Source freshness expired" ? copy.listings.pending : item.summary,
  });
  const featured = localizeCoreText(siteView?.featured ?? fallback);
  const listings = (siteView?.listings ?? []).map(localizeCoreText);
  const venues = siteView?.venues ?? [];
  const isRestricted = region === "Restricted market";
  return {
    featured,
    listings,
    venues,
    officialUpdates: siteView?.officialUpdates ?? [],
    listingsAvailability: siteView?.listingsAvailability ?? "unavailable",
    listingsReasonCode: siteView?.listingsReasonCode,
    isRestricted,
    preview: siteView?.source !== "core" || featured.action.kind !== "external",
    disclosure: copy.opportunity.disclosure,
    availability: isRestricted ? copy.opportunity.alternatives : featured.region === "Singapore" ? copy.ui.singapore : copy.common.sourceRequired,
  };
}
