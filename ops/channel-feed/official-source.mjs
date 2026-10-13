export const OFFICIAL_SOURCE_DOMAINS = {
  binance: ["binance.com"],
  bybit: ["bybit.com"],
  kraken: ["kraken.com"],
  okx: ["okx.com"],
  bitget: ["bitget.com"],
  kucoin: ["kucoin.com"],
  mexc: ["mexc.com"],
  "gate-io": ["gate.com", "gate.io"],
  hyperliquid: ["hyperliquid.gitbook.io", "hyperliquid.xyz", "hyperliquid.medium.com"],
};

const SITEWIDE_SOURCE_VENUES = new Set(["binance", "bybit", "kraken"]);
const SITE = "https://nexualpha.com";

export function sourceUpdateIdentity(item) {
  return String(item?.id || item?.url || item?.officialSource?.url || "");
}

export function sourceUpdateHash(value) {
  let n = 2166136261;
  for (const c of String(value)) { n ^= c.charCodeAt(0); n = Math.imul(n, 16777619); }
  return (n >>> 0).toString(36);
}

export function sourceUpdatePath(item) {
  const venue = item?.venue || item?.platform?.slug;
  const id = sourceUpdateIdentity(item);
  const slug = id.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 70) || "update";
  return `/activities/updates/${encodeURIComponent(venue)}/${slug}-${sourceUpdateHash(id)}`;
}

export function safeOfficialSourceUrl(value, venueSlug) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".") || /^[\d.]+$/.test(url.hostname) || url.hostname.endsWith(".local")) return null;
    if (/(?:^|\/)(?:register|signup|sign-up|sign_in|signin|login|join)(?:\/|$)/i.test(url.pathname)) return null;
    if ([...url.searchParams.keys()].some((key) => /^(?:ref|referral|referralCode|invite|inviteCode|affiliate|affiliateId|utm_.*)$/i.test(key))) return null;
    const host = url.hostname.toLowerCase();
    return (OFFICIAL_SOURCE_DOMAINS[venueSlug] || []).some((domain) => host === domain || host.endsWith(`.${domain}`)) ? url.href : null;
  } catch { return null; }
}

export function sourceDomain(value) {
  try { return new URL(String(value)).hostname.replace(/^www\./, ""); } catch { return ""; }
}

export function officialSourceRoute(value, venueSlug, { src } = {}) {
  const safe = safeOfficialSourceUrl(value, venueSlug);
  if (!safe || !SITEWIDE_SOURCE_VENUES.has(venueSlug)) return null;
  const url = new URL(safe);
  const mainDomain = OFFICIAL_SOURCE_DOMAINS[venueSlug]?.[0];
  if (!mainDomain || !(url.hostname === mainDomain || url.hostname === `www.${mainDomain}`)) return null;
  const to = `${url.pathname || "/"}${url.search}${url.hash}`;
  const params = new URLSearchParams({ to });
  if (src) params.set("src", src);
  return `${SITE}/go/${venueSlug}-page?${params}`;
}

export function officialSourceCta(value, venueSlug, { lang = "en", src, neutral = false } = {}) {
  const safe = safeOfficialSourceUrl(value, venueSlug);
  if (!safe) return null;
  const route = neutral ? null : officialSourceRoute(safe, venueSlug, { src });
  return { url: safe, domain: sourceDomain(safe), buttonUrl: route, textOnly: !route, lang };
}
