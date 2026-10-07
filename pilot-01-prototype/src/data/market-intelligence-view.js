const assetSymbols = ["BTC", "ETH", "SOL"];
const assetSymbolSet = new Set(assetSymbols);

const validTime = (value) => typeof value === "string" && Number.isFinite(Date.parse(value));
const validNumber = (value) => typeof value === "number" && Number.isFinite(value);

export function readableCryptoSentiment(data, now = Date.now()) {
  if (!data || data.provider !== "alternative-me" || data.sourceUrl !== "https://alternative.me/crypto/fear-and-greed-index/" || !validTime(data.asOf)) return false;
  const age = now - Date.parse(data.asOf);
  return (data.freshness === "fresh" || data.freshness === "stale") && Number.isInteger(data.value) && data.value >= 0 && data.value <= 100 && typeof data.classification === "string" && data.classification.trim().length > 0 && age >= 0 && age <= 48 * 60 * 60 * 1000;
}
const validHttpsUrl = (value) => {
  if (typeof value !== "string") return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};
const validSource = (value) => value && typeof value === "object" && typeof value.provider === "string" && value.provider.trim() && validHttpsUrl(value.sourceUrl) && typeof value.attribution === "string" && value.attribution.trim() && validTime(value.fetchedAt) && (value.freshness === "fresh" || value.freshness === "stale");

function unavailableFeed(reasonCode = "MARKET_DATA_UNAVAILABLE") {
  return { status: "unavailable", provider: null, sourceUrl: null, fetchedAt: null, freshness: "unavailable", attribution: null, reasonCode, data: [] };
}

export function unavailableMarketIntelligence() {
  return {
    status: "unavailable",
    assetPulse: { ...unavailableFeed(), quoteCurrency: "USD" },
    exchangeSnapshots: unavailableFeed(),
    exchangeSnapshotsBySlug: {},
  };
}

function normalizeAssetPulse(value) {
  if (!value || value.status !== "available" || !validSource(value) || value.quoteCurrency !== "USD" || !Array.isArray(value.data)) return { ...unavailableFeed(value?.reasonCode), quoteCurrency: "USD" };
  const bySymbol = new Map();
  for (const point of value.data) {
    if (!point || !assetSymbolSet.has(point.symbol) || !validNumber(point.priceUsd) || point.priceUsd < 0 || !validNumber(point.change24hPct) || !validTime(point.asOf)) continue;
    bySymbol.set(point.symbol, { symbol: point.symbol, priceUsd: point.priceUsd, change24hPct: point.change24hPct, asOf: new Date(point.asOf).toISOString() });
  }
  const data = assetSymbols.flatMap((symbol) => bySymbol.has(symbol) ? [bySymbol.get(symbol)] : []);
  if (!data.length) return { ...unavailableFeed("NO_SOURCE_BOUND_ASSET_POINTS"), quoteCurrency: "USD" };
  return { status: "available", provider: value.provider.trim(), sourceUrl: value.sourceUrl, fetchedAt: new Date(value.fetchedAt).toISOString(), freshness: value.freshness, quoteCurrency: "USD", attribution: value.attribution.trim(), reasonCode: null, data };
}

function normalizeExchangeSnapshots(value, knownVenueSlugs) {
  if (!value || value.status !== "available" || !validSource(value) || !Array.isArray(value.data)) return unavailableFeed(value?.reasonCode);
  const known = new Set(knownVenueSlugs);
  const bySlug = new Map();
  for (const point of value.data) {
    if (!point || typeof point.venueSlug !== "string" || !known.has(point.venueSlug) || !validTime(point.asOf)) continue;
    const volume = validNumber(point.volume24hUsd) && point.volume24hUsd >= 0 ? point.volume24hUsd : null;
    const change = validNumber(point.volumeChange24hPct) ? point.volumeChange24hPct : null;
    if (volume === null && change === null) continue;
    bySlug.set(point.venueSlug, { venueSlug: point.venueSlug, volume24hUsd: volume, volumeChange24hPct: change, asOf: new Date(point.asOf).toISOString() });
  }
  const data = [...bySlug.values()];
  if (!data.length) return unavailableFeed("NO_SOURCE_BOUND_EXCHANGE_POINTS");
  return { status: "available", provider: value.provider.trim(), sourceUrl: value.sourceUrl, fetchedAt: new Date(value.fetchedAt).toISOString(), freshness: value.freshness, attribution: value.attribution.trim(), reasonCode: null, data };
}

export function normalizeMarketIntelligence(assetPulse, exchangeSnapshots, knownVenueSlugs = []) {
  const normalizedAssets = normalizeAssetPulse(assetPulse);
  const normalizedExchanges = normalizeExchangeSnapshots(exchangeSnapshots, knownVenueSlugs);
  return {
    status: normalizedAssets.status === "available" || normalizedExchanges.status === "available" ? "available" : "unavailable",
    assetPulse: normalizedAssets,
    exchangeSnapshots: normalizedExchanges,
    exchangeSnapshotsBySlug: Object.fromEntries(normalizedExchanges.data.map((point) => [point.venueSlug, point])),
  };
}
