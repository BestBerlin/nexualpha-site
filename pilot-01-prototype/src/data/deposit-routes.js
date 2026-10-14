// Entry-safe routing for the deposit/withdrawal hub (出入金, 2026-10-15) and the crypto-card comparison. The hub has a
// localized slug per locale (like the beginner path); country pages hang under it with English country slugs. Data, copy
// and SEO helpers stay in the route chunk (src/data/deposit.js, deposit-copy.js, deposit-seo.js).
export const DEPOSIT_SLUGS = Object.freeze({
  en: "deposit", "zh-Hans": "churujin", "zh-Hant": "churujin", es: "depositar", "pt-BR": "depositar", fr: "depot", de: "einzahlen",
  it: "deposito", ja: "nyukin", ko: "ipchulgeum", ar: "iydaa", tr: "para-yatirma", ru: "popolnenie", id: "setor-tarik",
  vi: "nap-rut", ur: "jama-nikasi", uk: "popovnennia",
});
export const DEPOSIT_LOCALES = Object.freeze(Object.keys(DEPOSIT_SLUGS));
export const DEPOSIT_ROOTS = Object.freeze([...new Set(Object.values(DEPOSIT_SLUGS))].map((slug) => `/${slug}`));
export const CRYPTO_CARDS_PATH = "/crypto-cards";
// Country pages, in hub order (regions: Asia, Americas, Europe, Africa). Malaysia and Thailand are absent: the official
// research found no sourced exchange route there.
export const DEPOSIT_COUNTRY_SLUGS = Object.freeze([
  "singapore", "hong-kong", "taiwan", "japan", "south-korea", "philippines", "indonesia", "vietnam", "india",
  "brazil", "mexico", "argentina", "eu-sepa", "united-kingdom", "turkiye", "nigeria",
]);

// Research market code -> country page slug (venue profile chips, directory links).
export const DEPOSIT_COUNTRY_BY_CODE = Object.freeze({
  SG: "singapore", HK: "hong-kong", TW: "taiwan", JP: "japan", KR: "south-korea", PH: "philippines", ID: "indonesia", VN: "vietnam",
  IN: "india", BR: "brazil", MX: "mexico", AR: "argentina", EU: "eu-sepa", GB: "united-kingdom", TR: "turkiye", NG: "nigeria",
});

export function depositPath(locale = "en", country) {
  const slug = DEPOSIT_SLUGS[locale] || DEPOSIT_SLUGS.en;
  return country ? `/${slug}/${country}` : `/${slug}`;
}

/**
 * Parses a content path (locale prefix already removed). With a locale, only that locale's slug matches; another
 * locale's slug is "missing" (404), like the beginner path. Returns null for unrelated paths.
 */
export function parseDepositPath(pathname, locale) {
  const path = String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path === CRYPTO_CARDS_PATH) return { kind: "cards" };
  if (path.startsWith(`${CRYPTO_CARDS_PATH}/`)) return { kind: "missing" };
  const [, slug, country, extra] = path.split("/");
  if (!slug || !DEPOSIT_ROOTS.includes(`/${slug}`)) return null;
  if (locale && (DEPOSIT_SLUGS[locale] || DEPOSIT_SLUGS.en) !== slug) return { kind: "missing" };
  if (extra !== undefined) return { kind: "missing" };
  if (!country) return { kind: "hub" };
  return DEPOSIT_COUNTRY_SLUGS.includes(country) ? { kind: "country", country } : { kind: "missing" };
}

const NAV = {
  en: "Deposit & withdraw", "zh-Hans": "出入金", "zh-Hant": "出入金", es: "Depositar y retirar", "pt-BR": "Depositar e sacar",
  fr: "Dépôt et retrait", de: "Ein- und Auszahlen", it: "Depositi e prelievi", ja: "入出金", ko: "입출금", ar: "الإيداع والسحب",
  tr: "Para yatırma ve çekme", ru: "Ввод и вывод", id: "Setor & tarik", vi: "Nạp & rút", ur: "جمع اور نکاسی", uk: "Поповнення і виведення",
};
export const depositNavLabel = (locale) => NAV[locale] || NAV.en;
