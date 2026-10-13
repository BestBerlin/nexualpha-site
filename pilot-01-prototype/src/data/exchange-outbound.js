// Every click that leaves NexuAlpha for an exchange carries our invite code (owner 2026-10-13: "任何页面，无论一级、二级、
// 三级页面，甚至各个板块里的注册入口，都必须带邀请码，否则就是给交易所做嫁衣").
//
// - Info/citation links (fee schedules, help articles, proof-of-reserves, announcements) to a venue whose referral
//   parameter works on any page of its main site (owner-verified: Binance ref, Bybit affiliate_id, Kraken ref) go through
//   /go/<venue>-page?to=<path>; the server adds the registry code to the official page (server/go-redirect.mjs).
// - Any other page of a referral venue (OKX help, Bitget support, Backpack docs, subdomains, APIs) is not linked in body
//   content: callers render the source as plain text (title + domain) and keep the sign-up-with-code button nearby.
// - Neutral locales and the VN market carry no CTA, so there every exchange citation is plain text; Türkiye never gets a
//   Bitget link.
// - Real external links remain only on the legal and methodology pages (callers pass { allowDirect: true }).
// Codes and parameter names are read from the partner registry, never typed here.
import { partnerRegistry } from "./partner-registry.js";

/** Venues whose referral query parameter is honoured on every page of their main site (owner list 2026-10-13). */
export const SITEWIDE_PARAM_VENUES = Object.freeze(["binance", "bybit", "kraken"]);
/** Locales that never show a sign-up CTA or an attributed exchange link (same set as the attribution guard, plus vi). */
export const OUTBOUND_NEUTRAL_LOCALES = new Set(["ru", "ar", "zh-Hant", "ur", "uk", "vi"]);
const NO_CTA_MARKETS = new Set(["VN"]);

const baseDomain = (host) => String(host || "").toLowerCase().replace(/^(?:www|app|partner|accounts)\./, "");

// Registrable domains of every venue that has a referral route (official domain + registration/alternate hosts).
const EXCHANGE_DOMAINS = (() => {
  const map = new Map();
  for (const [venue, partner] of Object.entries(partnerRegistry)) {
    if (!partner.hasReferral) continue;
    const hosts = [partner.officialDomain, partner.registrationUrl, ...(partner.alternateRegistrationUrls || [])];
    for (const value of hosts) {
      try { map.set(baseDomain(/^https?:/.test(value) ? new URL(value).hostname : value), venue); } catch { /* skip */ }
    }
  }
  // Sister domains of the same venues (gate.io, bitget.com behind bitget.cafe registration links).
  for (const [host, venue] of [["gate.io", "gate-io"], ["gate.com", "gate-io"], ["bitget.com", "bitget"], ["okx.com", "okx"]]) {
    if (partnerRegistry[venue]?.hasReferral) map.set(host, venue);
  }
  return map;
})();

/** Referral venue owning a URL's host (exact or subdomain), or null. */
export function exchangeVenueForUrl(href) {
  let url;
  try { url = href instanceof URL ? href : new URL(String(href)); } catch { return null; }
  if (!/^https?:$/.test(url.protocol)) return null;
  const host = url.hostname.toLowerCase();
  let best = null;
  for (const [domain, venue] of EXCHANGE_DOMAINS) {
    if ((host === domain || host.endsWith(`.${domain}`)) && (!best || domain.length > best[0].length)) best = [domain, venue];
  }
  return best?.[1] || null;
}

/** The registry referral parameter of a sitewide venue: { host, param, code } or null. */
export function sitewideReferral(venue) {
  if (!SITEWIDE_PARAM_VENUES.includes(venue)) return null;
  const partner = partnerRegistry[venue];
  if (!partner?.hasReferral || !partner.inviteCode) return null;
  let registration;
  try { registration = new URL(partner.registrationUrl); } catch { return null; }
  const entry = [...registration.searchParams].find(([, value]) => value === partner.inviteCode);
  if (!entry) return null;
  return { host: new URL(`https://${partner.officialDomain}`).hostname, param: entry[0], code: partner.inviteCode };
}

/** True when the URL already carries the venue's registry code (query value or /join|/ref|/signup path segment). */
export function urlCarriesVenueCode(href, venue = exchangeVenueForUrl(href)) {
  const partner = partnerRegistry[venue];
  if (!partner?.hasReferral) return false;
  let url;
  try { url = new URL(String(href)); } catch { return false; }
  const codes = new Set([partner.inviteCode, ...(partner.inviteCodes || [])].filter(Boolean).map((code) => String(code).toLowerCase()));
  for (const href2 of [partner.registrationUrl, ...(partner.alternateRegistrationUrls || [])]) {
    try {
      const registered = new URL(href2);
      if (registered.hostname === url.hostname && registered.pathname === url.pathname && registered.search === url.search && registered.hash === url.hash) return true;
      for (const [key, value] of registered.searchParams) if (!key.startsWith("utm_") && url.searchParams.get(key) === value) return true;
    } catch { /* skip */ }
  }
  for (const value of url.searchParams.values()) if (codes.has(value.toLowerCase())) return true;
  const last = url.pathname.split("/").filter(Boolean).at(-1)?.toLowerCase();
  return /\/(?:join|signup|ref|refer|invite|b|bg)\//i.test(url.pathname) && codes.has(last);
}

/** /go/<venue>-page?to=… for a sitewide venue's main-site URL, else null. */
export function venuePageRoute(href, { src } = {}) {
  let url;
  try { url = new URL(String(href)); } catch { return null; }
  const venue = exchangeVenueForUrl(url);
  const referral = sitewideReferral(venue);
  if (!referral) return null;
  if (url.hostname !== referral.host && url.hostname !== baseDomain(referral.host)) return null;
  url.searchParams.delete(referral.param);
  const to = `${url.pathname || "/"}${url.search}${url.hash}`;
  const params = new URLSearchParams({ to });
  if (src) params.set("src", src);
  return `/go/${venue}-page?${params}`;
}

/**
 * Outbound href policy for one link. Returns
 *   { href, external: true }            a non-exchange URL, unchanged;
 *   { href: "/go/…", external: false, venue, sponsored: true }   an exchange page routed through our code;
 *   { href, external: true, venue, sponsored: true }             an exchange URL that already carries our code;
 *   null                                 render the source as plain text (title + domain), no link.
 */
export function outboundLink(href, { locale = "en", market = null, allowDirect = false, src } = {}) {
  const raw = String(href || "").trim();
  let url;
  try { url = new URL(raw); } catch { return { href: raw, external: false }; }
  if (!/^https?:$/.test(url.protocol)) return { href: raw, external: false };
  const venue = exchangeVenueForUrl(url);
  if (!venue) return { href: raw, external: true };
  if (allowDirect) return { href: raw, external: true, venue };
  const neutral = OUTBOUND_NEUTRAL_LOCALES.has(locale) || NO_CTA_MARKETS.has(String(market || "").toUpperCase())
    || (locale === "tr" && venue === "bitget") || (String(market || "").toUpperCase() === "TR" && venue === "bitget");
  if (neutral) return null;
  if (urlCarriesVenueCode(url.href, venue)) return { href: raw, external: true, venue, sponsored: true };
  const route = venuePageRoute(url.href, { src });
  return route ? { href: route, external: false, venue, sponsored: true } : null;
}

/** Display label of a plain-text source: the host without www. */
export const sourceDomain = (href) => {
  try { return new URL(String(href)).hostname.replace(/^www\./, ""); } catch { return ""; }
};
