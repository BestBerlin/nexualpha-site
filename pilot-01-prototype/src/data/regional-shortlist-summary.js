// Lightweight projection of source-linked regional shortlist platform candidates.
// Full localized controls stay in regional-shortlist.js; directory filtering only needs slug/status membership.
const REGIONAL_SHORTLIST_CANDIDATES = Object.freeze({
  MX: { binance: "researchable" },
  BR: { binance: "researchable", okx: "researchable" },
  HK: { hashkey: "researchable" },
  SG: { coinbase: "researchable" },
  US: { coinbase: "researchable", kraken: "researchable" },
  EU: { coinbase: "researchable" },
  UK: { coinbase: "researchable" },
});

export function regionalShortlistCandidateState({ market, slug } = {}) {
  const candidates = REGIONAL_SHORTLIST_CANDIDATES[String(market || "").toUpperCase()] || null;
  const status = candidates?.[slug];
  return status ? { status, candidate: { slug, status } } : { status: "not_in_shortlist", candidate: null };
}
