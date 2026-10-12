// Snapshot (public/intel/coins.json, written by scripts/build-coin-availability.mjs) -> compact coin rows, the format of
// coins-data.generated.js. Shared by the generator (baked rows) and the runtime overlay (coins.js), so a coins.json
// refreshed on the server renders exactly like a rebuilt bundle. Pure; no imports.
// Row: [id, slug, name, symbol, rank, category, networks, price, change24h, marketCap, { venue: [spot, perp, networks|null] }]
export function coinRowFromSnapshotCoin(coin) {
  return [coin.id, coin.slug, coin.name, coin.symbol, coin.rank, coin.category, coin.networks, coin.price, coin.change24h, coin.marketCap,
    Object.fromEntries(Object.entries(coin.venues || {}).map(([venue, v]) => [venue, [v.spot, v.perp, v.networks || null]]))];
}

export function coinVenueStatusFromSnapshot(snapshot) {
  return Object.fromEntries(Object.entries(snapshot?.venueStatus || {}).map(([k, v]) => [k, { ok: v.ok, checkedAt: v.checkedAt }]));
}

// A usable snapshot: a timestamp and a non-trivial coin list (a truncated or empty file must never empty the pages).
export function isUsableCoinSnapshot(snapshot) {
  return Boolean(snapshot && typeof snapshot === "object" && Number.isFinite(Date.parse(snapshot.generatedAt))
    && Array.isArray(snapshot.coins) && snapshot.coins.length >= 50 && snapshot.coins.every((coin) => coin && typeof coin.slug === "string"));
}
