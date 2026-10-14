// Home hero copy experiment (scorecard X5, 2026-10-11): assignment, cookie and attribution helpers shared by the worker
// (assigns the variant and renders it into the SSR HTML), server.mjs (/go/<partner> and /api/cta-click record it on
// every partner click) and the browser (hydrates the same variant; v2 analytics events on the home route carry it).
//
// Contract:
// - The registry row experimentRegistry.home_hero_copy_v1.enabled is the switch. Disabled = nobody is assigned, no
//   cookie is set or read, every response is variant A ("a", control) and headers stay as they were.
// - Assignment is server-side: one first-party cookie `nx_hero=a|b` (30 days, SameSite=Lax, not HttpOnly so the
//   browser can tag its analytics events), drawn 50/50 on the first home visit and kept afterwards.
// - Crawlers, link-preview fetchers and requests without a user agent always get A and never a cookie, so the indexed
//   hero text never changes.
// - The cookie is a one-bit bucket, not an identifier: nothing else is derived from it.
import { experimentRegistry, HOME_HERO_ROUTES } from "./experiment-registry.js";

export const HOME_HERO_EXPERIMENT_ID = "home_hero_copy_v1";
export const HOME_HERO_COOKIE = "nx_hero";
export const HOME_HERO_CONTROL = "a";
export const HOME_HERO_VARIANTS = Object.freeze(["a", "b"]);
export const HOME_HERO_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
export { HOME_HERO_ROUTES };

// Union of the click-log crawler filter (server/go-redirect.mjs) and the CTA collector's automated-agent filter, plus
// the large search/SEO crawlers. "headless" also covers HeadlessChrome-based renderers (Google WRS uses "Googlebot").
export const HOME_HERO_BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|telegrambot|whatsapp|curl|wget|python|headless|lighthouse|googleother|google-inspectiontool|mediapartners|adsbot|bytespider|chatgpt-user|gptbot|claude|perplexity|applebot|yandex|baidu|duckduck|petalbot|semrush|ahrefs|mj12|dataforseo|seznam|sogou|bingpreview|embedly|quora link|pinterest|vkshare|discord|slack|skype|line\//i;

export function isHomeHeroBot(userAgent) {
  const ua = typeof userAgent === "string" ? userAgent.trim() : "";
  return !ua || HOME_HERO_BOT_UA.test(ua);
}

export function homeHeroDefinition(registry = experimentRegistry) {
  return registry?.[HOME_HERO_EXPERIMENT_ID] || null;
}

export function homeHeroEnabled(registry = experimentRegistry) {
  return homeHeroDefinition(registry)?.enabled === true;
}

export function isHomeHeroVariant(value) {
  return HOME_HERO_VARIANTS.includes(value);
}

function normalizedPath(pathname) {
  const value = String(pathname || "").split(/[?#]/, 1)[0].toLowerCase();
  return (value.length > 1 ? value.replace(/\/+$/, "") : value) || "/";
}

export function isHomeHeroRoute(pathname) {
  return HOME_HERO_ROUTES.includes(normalizedPath(pathname));
}

export function readHomeHeroCookie(cookieHeader) {
  if (typeof cookieHeader !== "string" || !cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index < 0 || part.slice(0, index).trim() !== HOME_HERO_COOKIE) continue;
    const value = part.slice(index + 1).trim();
    return isHomeHeroVariant(value) ? value : null;
  }
  return null;
}

export function homeHeroSetCookie(variant, { secure = true, maxAge = HOME_HERO_COOKIE_MAX_AGE } = {}) {
  if (!isHomeHeroVariant(variant)) return null;
  return `${HOME_HERO_COOKIE}=${variant}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

function randomUnit() {
  try {
    const buffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buffer);
    return buffer[0] / 0x100000000;
  } catch {
    return Math.random();
  }
}

/**
 * Server-side assignment for one home request.
 * `force` (non-production preview only, see server.mjs): "on" runs the experiment although the registry flag is off;
 * "a" / "b" serve that variant to every non-crawler visitor (local screenshots, LCP measurement per variant).
 * Returns { active, variant, setCookie }: `active` false means "behave exactly as before the experiment existed".
 */
export function assignHomeHeroVariant({ cookieHeader = "", userAgent = "", method = "GET", force = null, random = randomUnit, registry = experimentRegistry } = {}) {
  // "off" is the kill switch (allowed in production too): everyone gets A, no cookie, headers as before the experiment.
  if (force === "off") return { active: false, variant: HOME_HERO_CONTROL, setCookie: null };
  const forced = force === "on" || isHomeHeroVariant(force) ? force : null;
  if (!homeHeroEnabled(registry) && !forced) return { active: false, variant: HOME_HERO_CONTROL, setCookie: null };
  // HeadlessChrome is a browser execution mode: render the same experiment context as Chrome.
  // Keep the original UA for click/analytics filtering so audit visits do not become conversions.
  const renderBot = isHomeHeroBot(String(userAgent).replace(/HeadlessChrome\//gi, "Chrome/"));
  if (renderBot || (method !== "GET" && method !== "HEAD")) return { active: true, variant: HOME_HERO_CONTROL, setCookie: null, crawler: renderBot };
  if (isHomeHeroVariant(forced)) return { active: true, variant: forced, setCookie: null, forced: true };
  const existing = readHomeHeroCookie(cookieHeader);
  if (existing) return { active: true, variant: existing, setCookie: null };
  if (method !== "GET") return { active: true, variant: HOME_HERO_CONTROL, setCookie: null };
  const variant = random() < 0.5 ? "a" : "b";
  return { active: true, variant, setCookie: variant };
}

/**
 * Experiment context recorded with a partner click (server: /go/<partner>, /api/cta-click). Only a valid cookie of an
 * enabled (or preview-forced) experiment produces a context; crawlers never do.
 */
export function homeHeroClickContext({ cookieHeader = "", userAgent = "", force = null, registry = experimentRegistry } = {}) {
  if (force === "off") return null;
  const forced = force === "on" || isHomeHeroVariant(force);
  if (!homeHeroEnabled(registry) && !forced) return null;
  if (isHomeHeroBot(userAgent)) return null;
  const variant = readHomeHeroCookie(cookieHeader);
  return variant ? { experiment: HOME_HERO_EXPERIMENT_ID, variant } : null;
}

/**
 * Browser: the variant the home hero renders with.
 * - Hydrating a server-rendered home page: exactly what the server rendered (prerender state `heroVariant`, else A).
 * - Any other page (the hero may appear later through client navigation): the assignment cookie, if enabled.
 */
export function clientHomeHeroVariant({ prerenderState = null, cookie = "", registry = experimentRegistry } = {}) {
  if (prerenderState && typeof prerenderState === "object" && normalizedPath(prerenderState.pathname) === "/") {
    return isHomeHeroVariant(prerenderState.heroVariant) ? prerenderState.heroVariant : HOME_HERO_CONTROL;
  }
  if (!homeHeroEnabled(registry)) return HOME_HERO_CONTROL;
  return readHomeHeroCookie(cookie) || HOME_HERO_CONTROL;
}

/** Browser analytics: { experiment, variant } for v2 events on a home route while the experiment is enabled. */
export function homeHeroEventContext({ pathname, cookie = globalThis.document?.cookie, registry = experimentRegistry } = {}) {
  if (!homeHeroEnabled(registry) || !isHomeHeroRoute(pathname)) return {};
  const variant = readHomeHeroCookie(typeof cookie === "string" ? cookie : "");
  return variant ? { experiment: HOME_HERO_EXPERIMENT_ID, variant } : {};
}
