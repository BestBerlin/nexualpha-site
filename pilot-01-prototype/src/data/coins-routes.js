// "Where to buy <coin>" pages (/coins, /coins/<slug>), 2026-10-12. Entry-safe helpers only: the header, the router and
// the route module cache import this file, so it must stay tiny (no coin table here; that is coins.js in the route chunk).

export const COINS_PATH = "/coins";
// Search editions with natural template copy and our own coin descriptions. Other UI locales render the same page
// (English descriptions) as noindex,follow.
export const COIN_INDEX_LOCALES = Object.freeze(["en", "es", "pt-BR", "tr", "vi", "id", "zh-Hans", "ja", "ko", "fr", "de"]);

export const coinContentLocale = (locale) => (COIN_INDEX_LOCALES.includes(locale) ? locale : "en");
export const coinContentModulePath = (locale) => `./data/coin-content-${coinContentLocale(locale).toLowerCase()}.js`;
export const coinPath = (slug) => `${COINS_PATH}/${slug}`;

/** { kind: "hub" } | { kind: "coin", slug } | { kind: "missing" } for /coins paths, null elsewhere. */
export function parseCoinsPath(pathname) {
  const path = String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path === COINS_PATH) return { kind: "hub" };
  const match = path.match(/^\/coins\/([a-z0-9][a-z0-9-]{0,60})$/);
  if (match) return { kind: "coin", slug: match[1] };
  return path.startsWith(`${COINS_PATH}/`) ? { kind: "missing" } : null;
}
