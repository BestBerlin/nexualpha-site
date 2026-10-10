// Official-source research: URL safety, official-domain allow-list and the /activities/research route (split out of
// official-campaign-model.js on 2026-10-11 so the app shell and the announcement feed no longer carry the 580 KB of
// localized campaign research text with them). official-campaign-model.js re-exports everything here.
export const OFFICIAL_RESEARCH_DOMAINS = {
  binance: ["binance.com"], coinbase: ["coinbase.com"], bybit: ["bybit.com"], bitget: ["bitget.com"], okx: ["okx.com"], kraken: ["kraken.com"],
  "gate-io": ["gate.com"], kucoin: ["kucoin.com"], mexc: ["mexc.com"], backpack: ["backpack.exchange"], deribit: ["deribit.com"],
  uniswap: ["uniswap.org"], pancakeswap: ["pancakeswap.finance"], jupiter: ["jup.ag"], raydium: ["raydium.io"], aerodrome: ["aerodrome.finance"],
  curve: ["curve.finance"], hyperliquid: ["hyperliquid.gitbook.io", "hyperliquid.xyz", "hyperliquid.medium.com"], dydx: ["dydx.xyz"], gmx: ["gmx.io"], drift: ["drift.trade"],
};

export function safeResearchUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".") || /^[\d.]+$/.test(url.hostname) || url.hostname.endsWith(".local")) return null;
    if (/(?:^|\/)(?:register|signup|sign-up|sign_in|signin|login|join)(?:\/|$)/i.test(url.pathname)) return null;
    if ([...url.searchParams.keys()].some((key) => /^(?:ref|referral|referralCode|invite|inviteCode|affiliate|affiliateId|utm_.*)$/i.test(key))) return null;
    return url.href;
  } catch { return null; }
}

export function officialResearchUrl(value, venueSlug) {
  const url = safeResearchUrl(value);
  if (!url) return null;
  const host = new URL(url).hostname;
  return (OFFICIAL_RESEARCH_DOMAINS[venueSlug] ?? []).some((domain) => host === domain || host.endsWith(`.${domain}`)) ? url : null;
}

// Research slugs share the catalogue, but never resolve as human-reviewed IDs.
export function researchRoute(pathname, venues = []) {
  if (!pathname.startsWith("/activities/research/")) return null;
  const match = pathname.match(/^\/activities\/research\/([a-z0-9-]+)$/);
  return match && venues.some((venue) => venue.slug === match[1])
    ? { name: "research", slug: match[1] }
    : { name: "notFound" };
}
