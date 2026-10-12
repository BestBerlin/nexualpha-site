// Crypto glossary model (2026-10-13): links, the A–Z grouping and the soft partner CTA. Route chunk only (route-glossary).
// CTA rules: only on terms marked `cta` in glossary-terms.js; the venue comes from the promotions resolver
// (src/data/promotions.js: registry partners with dated terms, geo-gated — Türkiye OKX/Binance/Bybit, neutral locales
// ru/ar/zh-Hant/ur/uk none); the code from the registry (publicCtaForVenue); the link is our tracked /go/<venue>?src=glossary-<slug>.
import { resolvePromotions, NEUTRAL_PROMOTION_LOCALES } from "./promotions.js";
import { publicCtaForVenue } from "./source-bound-cta.js";
import { localizedHref } from "./locale-routing.js";
import { GLOSSARY_CATEGORIES } from "./glossary-terms.js";
import { GLOSSARY_PATH, glossaryContentLocale, glossaryTermPath } from "./glossary-routes.js";

export { GLOSSARY_CATEGORIES, GLOSSARY_PATH, glossaryContentLocale, glossaryTermPath };
export const GLOSSARY_NEUTRAL_LOCALES = new Set(NEUTRAL_PROMOTION_LOCALES);
// Owner rule (DECISIONS 2026-10-12 #3, academy): Bitget is named by its domain on cards.
const DISPLAY_NAMES = { bitget: "Bitget.com" };
// Venue preference per term family; the resolver keeps only partners promotable in the reader's market.
const DEFAULT_VENUES = ["okx", "bitget", "binance", "bybit"];
const VENUES_BY_TERM = { "tokenized-stocks": ["bybit", "bitget", "okx"], "stock-perpetuals": ["bybit", "bitget", "okx", "binance"], launchpool: ["binance", "bitget", "bybit", "okx"] };

export function glossaryHref(path, locale, market) {
  const href = localizedHref(path, { locale });
  if (!market) return href;
  return `${href}${href.includes("?") ? "&" : "?"}market=${encodeURIComponent(market)}`;
}

/** Partner sign-up for a term page, or null (term not marked, neutral locale, no promotable partner). */
export function glossarySignup(term, { locale = "en", market, now } = {}) {
  if (!term?.cta || GLOSSARY_NEUTRAL_LOCALES.has(locale)) return null;
  const venues = VENUES_BY_TERM[term.slug] || DEFAULT_VENUES;
  const promotions = resolvePromotions({ topicTags: venues, locale, market, ...(now ? { now } : {}) }).filter((p) => p.kind === "signup");
  const pick = venues.map((slug) => promotions.find((p) => p.partner === slug)).find(Boolean) || promotions[0];
  if (!pick) return null;
  const cta = publicCtaForVenue(pick.partner, locale, market);
  if (!cta || cta.actionGate || !cta.registrationUrl) return null;
  return {
    venue: pick.partner,
    name: DISPLAY_NAMES[pick.partner] || pick.name || pick.partner,
    code: cta.inviteCode || null,
    href: `/go/${pick.partner}?src=${`glossary-${term.slug}`.slice(0, 48)}&locale=${encodeURIComponent(locale)}${market ? `&market=${encodeURIComponent(market)}` : ""}`,
  };
}

const LATIN_FOLD = { ı: "i", İ: "I", ş: "s", Ş: "S", ç: "c", Ç: "C", ğ: "g", Ğ: "G", ö: "o", Ö: "O", ü: "u", Ü: "U", đ: "d", Đ: "D" };
/** A–Z letter of a name (diacritics folded); CJK names group by their English name. "#" for digits/symbols. */
export function glossaryLetter(name, english) {
  const source = /^[぀-ヿ㐀-鿿가-힯]/.test(String(name || "")) ? english : name;
  const first = String(source || "").trim().charAt(0);
  const folded = (LATIN_FOLD[first] || first).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  return /^[A-Z]$/.test(folded) ? folded : "#";
}
