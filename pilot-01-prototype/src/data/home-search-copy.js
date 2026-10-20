import { organizationDescription } from "./brand-definition.js";
// Home titles retain existing locale/market policy. Descriptions share the canonical entity definition.
import { HOME_REBATE_MAX_PCT, HOME_REBATE_SHARE } from "./home-rebate-tiers.js";
import { NEUTRAL_CTA_LOCALE_LIST, isNeutralCtaLocale } from "./locale-policy.js";
import { isTurkeyPage, jurisdictionPromotionBan } from "./partner-geo-policy.js";
import { brandSlogan, brandSloganSecondary, sloganSentence, sloganTitleFragment, SLOGAN_LOCALES } from "./brand-slogan.js";
import { clampMetaDescription, titleDisplayWidth } from "./meta-description.js";

const TR_PROMOTED = ["okx", "binance", "bybit"];
export const TR_REBATE_MAX_PCT = Math.round(Math.max(...TR_PROMOTED.map((slug) => HOME_REBATE_SHARE[slug] ?? 0)) * 100);

export const HOME_TITLE_BUDGET = 60;
const BRAND_SUFFIX = " — NexuAlpha";
// Every neutral locale (lead 2026-10-13: neutral = no codes, CTAs or rebate lines; zh-Hant included).
export const NEUTRAL_HOME_DESCRIPTION_LOCALES = Object.freeze(new Set(NEUTRAL_CTA_LOCALE_LIST));

// Search keywords of the home title (the patterns pinned in tests/seo-onpage-metadata-length.test.mjs).
const HOME_TITLE_KEYWORDS = Object.freeze({
  // CTR pass 2026-10-13 (GSC 28 d: home at position 7.7, 45 impressions, 0 clicks): the number leads the benefit.
  en: "Crypto Referral Codes: Up to 60% Fee Rebates",
  "zh-Hans": "邀请码与手续费返佣",
  "zh-Hant": "加密交易所手續費比較：OKX、Bitget、幣安",
  es: "Códigos de referido y reembolso de comisiones",
  "pt-BR": "Códigos de indicação e cashback de taxas cripto",
  fr: "Codes de parrainage et remises sur frais crypto",
  de: "Krypto-Empfehlungscodes und Gebührenrabatte",
  it: "Codici referral e rimborso commissioni crypto",
  ja: "暗号資産取引所の手数料と紹介コード比較",
  ko: "암호화폐 거래소 수수료·추천코드 비교",
  ru: "Комиссии криптобирж: OKX, Bitget и Binance",
  tr: "Kripto borsası komisyon iadesi ve referans kodu",
  id: "Kode referral dan rabat biaya exchange kripto",
  vi: "Phí sàn giao dịch crypto: OKX, Bitget và Binance",
  ar: "رسوم منصات العملات الرقمية: OKX وBitget وBinance",

  // l10n: needs native review
  ur: "کرپٹو ایکسچینج فیس: OKX، Bitget اور Binance", // l10n: needs native review
  uk: "Комісії криптобірж: OKX, Bitget і Binance", // l10n: needs native review
});

// Separator between keywords and slogan A inside the title.
const TITLE_JOINER = { "zh-Hans": "｜", "zh-Hant": "｜", ja: "｜" };

// Existing home facts (2026-10-10 copy, tightened so slogan + facts fit the snippet budget without a cut).
// CTR pass 2026-10-13 (owner rule 2026-10-12): disclosure lives only in the footer and legal pages, so no locale's
// snippet carries a "partner links disclosed" sentence; the facts lead with the query words (codes, fees).
const HOME_FACTS = Object.freeze({
  en: "Official codes for OKX, Bitget and Binance; the exchange pays the rebate.",
  "zh-Hans": "OKX、Bitget、币安邀请码与官方注册入口，返佣由交易所结算。",
  "zh-Hant": "依官方費率表比較 OKX、Bitget、幣安手續費，附官方連結。",
  es: "Códigos de referido OKX, Bitget y Binance; paga el exchange.",
  "pt-BR": "Códigos de indicação da OKX, Bitget e Binance; o cashback é pago pela corretora.",
  fr: "Codes de parrainage OKX, Bitget et Binance, versé par la plateforme.",
  de: "Empfehlungscodes für OKX, Bitget, Binance – zahlt die Börse.",
  it: "Codici referral OKX, Bitget e Binance: paga l’exchange.",
  ja: "OKX・Bitget・Binance の紹介コードと公式入口。還元は取引所が支払います。",
  ko: "OKX·Bitget·Binance 추천코드와 공식 경로, 환급은 거래소가 지급.",
  ru: "Комиссии OKX, Bitget и Binance по официальным тарифам и официальные ссылки.",
  tr: "OKX, Binance, Bybit referans kodları; iadeyi borsa öder.",
  id: "Kode referral OKX, Bitget dan Binance; rabat dibayar oleh exchange.",
  vi: "So sánh phí OKX, Bitget và Binance theo biểu phí chính thức, kèm liên kết chính thức.",
  ar: "مقارنة رسوم OKX وBitget وBinance وفق الجداول الرسمية.",

  // l10n: needs native review
  ur: "OKX، Bitget اور Binance کی فیس سرکاری جدولوں کے مطابق موازنہ کریں۔", // l10n: needs native review
  uk: "Порівнюйте комісії OKX, Bitget і Binance за офіційними таблицями.", // l10n: needs native review
});

const CJK_JOIN = new Set(["zh-Hans", "zh-Hant", "ja"]);

/** Home title: keywords + slogan A when it fits HOME_TITLE_BUDGET, else keywords only; always ends " — NexuAlpha". */
export function homeTitle(locale) {
  if (locale === "en") return "NexuAlpha — Crypto Fee Comparison, Rebates & Referral Codes (Official)";
  if (locale === "zh-Hans") return "NexuAlpha — 交易所手续费对比、返佣与邀请码（官方来源）";
  const keywords = HOME_TITLE_KEYWORDS[locale] || HOME_TITLE_KEYWORDS.en;
  const withSlogan = `${keywords}${TITLE_JOINER[locale] || " | "}${sloganTitleFragment(brandSlogan(locale))}${BRAND_SUFFIX}`;
  if (titleDisplayWidth(withSlogan) <= HOME_TITLE_BUDGET) return withSlogan;
  return `${keywords}${BRAND_SUFFIX}`;
}

/** True when slogan A is part of the home title for this locale (then the description does not repeat it). */
export function homeTitleCarriesSlogan(locale) {
  return homeTitle(locale).includes(sloganTitleFragment(brandSlogan(locale)));
}

// Türkiye pages (tr-market-gaps): the venue trio "OKX, Bitget, Binance" becomes "OKX, Binance, Bybit" in every locale's
// wording (Bitget is on the SPK liquidation list; OKX > Binance > Bybit is the Türkiye order).
export function turkeyVenueTrio(text) {
  return String(text).replace(/Bitget(.{1,6}?)(Binance|币安|幣安)/gu, "$2$1Bybit");
}

/** Canonical entity definition, bounded to the locale snippet budget. */
export function homeDescription(locale, { turkey = locale === "tr" } = {}) {
  return clampMetaDescription(organizationDescription(locale), locale);
}

export const HOME_SEARCH_COPY = Object.freeze(Object.fromEntries(
  SLOGAN_LOCALES.map((locale) => [locale, Object.freeze([homeTitle(locale), homeDescription(locale)])]),
));

// A no-promotion market (Vietnam, Resolution 05/2025/NQ-CP) read in a promotable locale (?market=VN on the English
// home): the same neutral title and description as the neutral locales, in English.
export const HOME_NEUTRAL_SEARCH_COPY_EN = Object.freeze([
  "Crypto Exchange Fees: OKX, Bitget, Binance — NexuAlpha",
  "One verified gateway to the world's exchanges. Compare OKX, Bitget and Binance fees from the official schedules, with official links.",
]);
/** Home title and description for a locale and (optional) market. */
export function homeSearchCopyFor(locale, market) {
  if (market && !isNeutralCtaLocale(locale) && jurisdictionPromotionBan({ locale, market })) return HOME_NEUTRAL_SEARCH_COPY_EN;
  // Türkiye market on another edition (tr-market-gaps): no Bitget, and slogan B carries the share promoted in Türkiye.
  if (market && locale !== "tr" && isTurkeyPage({ locale, market })) {
    const copyLocale = HOME_SEARCH_COPY[locale] ? locale : "en";
    const title = turkeyVenueTrio(homeTitle(copyLocale)).replace(`${HOME_REBATE_MAX_PCT}%`, `${TR_REBATE_MAX_PCT}%`);
    return [title, homeDescription(copyLocale, { turkey: true })];
  }
  return HOME_SEARCH_COPY[locale] || HOME_SEARCH_COPY.en;
}

/** Reviewed brand-first titles keep their full wording in both head renderers. */
export function isHomeBrandTitle(title) {
  return [homeTitle("en"), homeTitle("zh-Hans")].includes(title);
}
