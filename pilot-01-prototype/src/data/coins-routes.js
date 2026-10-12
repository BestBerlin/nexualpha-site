// "Where to buy <coin>" pages (/coins, /coins/<slug>), 2026-10-12. Entry-safe helpers only: the header, the router and
// the route module cache import this file, so it must stay tiny (no coin table here; that is coins.js in the route chunk).

export const COINS_PATH = "/coins";
// Search editions with natural template copy and our own coin descriptions. Other UI locales render the same page
// (English descriptions) as noindex,follow.
export const COIN_INDEX_LOCALES = Object.freeze(["en", "es", "pt-BR", "tr", "vi", "id", "zh-Hans", "ja", "ko", "fr", "de"]);
// Same neutral set as the academy and the campaign join block: no sign-up wording or partner code.
export const COIN_NEUTRAL_LOCALES = new Set(["ru", "ar", "zh-Hant", "ur", "uk"]);

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

// Footer label (entry chunk: keep tiny). Home and exchange-profile block copy lives with those blocks.
const SHELL = {
  en: { nav: "Coins" },
  "zh-Hans": { nav: "币种" },
  "zh-Hant": { nav: "幣種" },
  es: { nav: "Monedas" },
  "pt-BR": { nav: "Moedas" },
  fr: { nav: "Cryptos" },
  de: { nav: "Coins" },
  ja: { nav: "銘柄" },
  ko: { nav: "코인" },
  tr: { nav: "Coinler" },
  vi: { nav: "Coin" },
  id: { nav: "Koin" },
  ru: { nav: "Монеты" },
  ar: { nav: "العملات" },
  it: { nav: "Monete" },
  ur: { nav: "کوائنز" },
  uk: { nav: "Монети" },
};
export function coinShellCopy(locale) {
  return SHELL[locale] || (String(locale || "").startsWith("zh") ? SHELL["zh-Hans"] : SHELL.en);
}
