// NexuAlpha Academy (/academy): routes, media, progress and next-step rules shared by the browser, the Worker head and
// the sitemap. The full episode index remains in academy-season1.js; shell/path-only consumers should import
// academy-shell.js or academy-path.js so they do not pull the full academy data into the app chrome.
import { ACADEMY_EPISODES } from "./academy-season1.js";
import { ACADEMY_CONTENT_LOCALES, ACADEMY_INDEX_LOCALES, ACADEMY_SHELL_COPY, academyContentLocale, academyContentModulePath, academyShellCopy } from "./academy-shell.js";
import { isPartnerPromotableIn } from "./partner-geo-policy.js";
import { NEUTRAL_CTA_LOCALES } from "./locale-policy.js";

export { ACADEMY_CONTENT_LOCALES, ACADEMY_EPISODES, ACADEMY_INDEX_LOCALES, ACADEMY_SHELL_COPY, academyContentLocale, academyContentModulePath, academyShellCopy };

export const ACADEMY_PATH = "/academy";
export const ACADEMY_ORIGIN = "https://nexualpha.com";
export const ACADEMY_UPLOAD_DATE = "2026-10-12";
// 720p web encodes and posters, served by the host (nginx /media/), not by the app bundle.
export const ACADEMY_MEDIA_BASE = "/media/academy/s1/en";
export const ACADEMY_CAPTION_BASE = "/captions/academy/s1";
export const ACADEMY_PROGRESS_KEY = "nexu.academy.s1.watched";
// Search editions live in academy-shell.js so route/head consumers can avoid the full episode index.
// Same neutral set as the campaign join block (src/components/v3/activity/CampaignJoin.jsx): no sign-up wording.
export const ACADEMY_NEUTRAL_LOCALES = NEUTRAL_CTA_LOCALES;
// Owner rule (DECISIONS 2026-10-12 #3): Bitget is named by its domain on academy cards and pages.
export const ACADEMY_DISPLAY_NAMES = Object.freeze({ bitget: "Bitget.com" });
// When an episode's own partners are not promotable in a market (e.g. Bitget in Türkiye), the card falls back to these.
const FALLBACK_VENUES = ["okx", "binance"];

export const ACADEMY_TOTAL_SECONDS = ACADEMY_EPISODES.reduce((sum, episode) => sum + episode.duration, 0);
export const ACADEMY_TOTAL_MINUTES = Math.round(ACADEMY_TOTAL_SECONDS / 60);

export const academyEpisodePath = (episode) => `${ACADEMY_PATH}/${episode.slug}`;
export const academyEpisodeBySlug = (slug) => ACADEMY_EPISODES.find((episode) => episode.slug === slug) || null;

/** { kind: "hub" } | { kind: "episode", episode } | { kind: "missing" } for /academy paths, null elsewhere. */
export function parseAcademyPath(pathname) {
  const path = String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path === ACADEMY_PATH) return { kind: "hub" };
  const match = path.match(/^\/academy\/([^/]+)$/);
  if (!match) return path.startsWith(`${ACADEMY_PATH}/`) ? { kind: "missing" } : null;
  const episode = academyEpisodeBySlug(match[1]);
  return episode ? { kind: "episode", episode } : { kind: "missing" };
}
export const isAcademyPath = (pathname) => Boolean(parseAcademyPath(pathname) && parseAcademyPath(pathname).kind !== "missing");

export function academyMedia(episode, { absolute = false } = {}) {
  const base = `${absolute ? ACADEMY_ORIGIN : ""}${ACADEMY_MEDIA_BASE}/${episode.id}`;
  return {
    landscape: `${base}-landscape.mp4`,
    portrait: `${base}-portrait.mp4`,
    posterLandscape: `${base}-landscape.jpg`,
    posterPortrait: `${base}-portrait.jpg`,
  };
}
export const academyCaptionPath = (episode, locale) => `${ACADEMY_CAPTION_BASE}/${episode.id}.${academyContentLocale(locale)}.vtt`;

export function isoDuration(seconds) {
  const total = Math.round(Number(seconds) || 0);
  const m = Math.floor(total / 60), s = total % 60;
  return `PT${m ? `${m}M` : ""}${s}S`;
}
export function clockDuration(seconds) {
  const total = Math.round(Number(seconds) || 0);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

// Telegram channel per locale (DECISIONS 2026-10-12 #6).
const TELEGRAM = { "zh-Hans": "NexuAlphaClub", ru: "NexuAlphaRU" };
export function academyTelegram(locale) {
  const name = TELEGRAM[locale] || "NexuAlphaGlobal";
  return { handle: `@${name}`, href: `https://t.me/${name}` };
}

/**
 * Sign-up venues for a conversion episode in this locale/market: the episode's partners that may be promoted there,
 * else the fallback partners. Neutral locales and non-conversion episodes get none (soft next step instead).
 */
export function academySignupVenues(episode, { locale = "en", market } = {}) {
  if (!episode?.conversion || ACADEMY_NEUTRAL_LOCALES.has(locale)) return [];
  const allowed = (slug) => isPartnerPromotableIn(slug, { locale, market });
  const own = episode.venues.filter(allowed);
  if (own.length) return own;
  const fallback = FALLBACK_VENUES.find(allowed);
  return fallback ? [fallback] : [];
}

/** Tracked partner redirect (/go/<slug>, server/go-redirect.mjs): carries the registry link and code unchanged. */
export const academyGoHref = (slug, episode) => `/go/${slug}?src=academy-${String(episode?.id || "hub").toLowerCase()}`;
export const academyVenueName = (slug, name) => ACADEMY_DISPLAY_NAMES[slug] || name || slug;
