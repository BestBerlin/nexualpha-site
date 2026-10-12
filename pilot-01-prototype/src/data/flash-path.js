// NexuAlpha Flash (/flash, 2026-10-12): paths, keys and the header label. Tiny on purpose: App.jsx (browser entry)
// imports it for routing and the nav; the UI strings live in flash.js inside the route chunk.
export const FLASH_PATH = "/flash";
export const FLASH_FEED_URL = "/content/flash.json";
export const FLASH_SITEMAP_PATH = "/sitemap-flash.xml";
export const FLASH_TYPES = Object.freeze(["listing", "delisting", "campaign", "liquidation-spike", "sharp-move", "funding-extreme", "news"]);
// Items older than this stay reachable (200) but are served noindex,follow.
export const FLASH_INDEX_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const FLASH_SITEMAP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const FLASH_REFRESH_MS = 60 * 1000;
export const FLASH_PAGE_SIZE = 40;
/** { kind: "stream" } | { kind: "item", key, segment } | { kind: "missing" } for /flash paths, null elsewhere. */
export function parseFlashPath(pathname) {
  const path = String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path === FLASH_PATH) return { kind: "stream" };
  if (!path.startsWith(`${FLASH_PATH}/`)) return null;
  const segment = path.slice(FLASH_PATH.length + 1);
  const match = segment.match(/^([0-9a-z]{10})(?:-[a-z0-9-]*)?$/);
  return match ? { kind: "item", key: match[1], segment } : { kind: "missing" };
}
export const isFlashPath = (pathname) => Boolean(parseFlashPath(pathname) && parseFlashPath(pathname).kind !== "missing");

// Header / footer label (the stream itself is "Flash" in Latin-script locales).
const NAV = { "zh-Hans": "快讯", "zh-Hant": "快訊", ja: "速報", ko: "속보", ru: "Флеш", uk: "Флеш", tr: "Flaş", vi: "Tin nhanh", ar: "عاجل", ur: "فلیش" };
export const flashNavLabel = (locale) => NAV[locale] || (String(locale || "").startsWith("zh") ? NAV["zh-Hans"] : "Flash");
