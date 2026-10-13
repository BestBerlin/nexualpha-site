// Home <title> and meta description per locale. One table read by the Worker head (worker/index.js routeMetadata),
// the SSR/client router (seo-injection.js computeRouteSeo) and therefore /api/route-seo, so all three stay identical.
//
// Owner 2026-10-10 (GSC CTR work): the title carries the commercial search intent (referral code / fee rebate; ja/ko
// informational; ru/ar/ur/uk/vi neutral, matching src/data/referral-seo.js).
// Owner 2026-10-11 (brand slogans, src/data/brand-slogan.js):
//   - title = search keywords + slogan A + " — NexuAlpha" when that fits the 60-wide budget (budgetTitle,
//     titleDisplayWidth: CJK counts double); otherwise keywords + " — NexuAlpha" and slogan A leads the description;
//   - description = [slogan A when not in the title] + slogan B + the facts (OKX/Bitget/Binance codes, settled by the
//     exchange; no disclosure line since 2026-10-13), clamped with clampMetaDescription.
// Slogan B (a rebate share) is left out where the home copy is neutral pending local review: ru (advertising
// rules), ar (Egypt CBE law 194/2020), vi (Vietnam Resolution 05/2025/NQ-CP, owner 2026-10-13), plus ur and uk until partner/regulator status is reviewed. These lead with slogan A and keep their neutral facts. Turkish carries
// slogan B like the other locales (owner 2026-10-11: "土耳其站照常写"). Remove a locale from
// NEUTRAL_HOME_DESCRIPTION_LOCALES to add slogan B.
import { HOME_REBATE_SHARE } from "./home-rebate-tiers.js";
import { NEUTRAL_CTA_LOCALE_LIST } from "./locale-policy.js";
import { brandSlogan, brandSloganSecondary, sloganSentence, sloganTitleFragment, SLOGAN_LOCALES } from "./brand-slogan.js";
import { clampMetaDescription, titleDisplayWidth } from "./meta-description.js";

const TR_PROMOTED = ["okx", "binance", "bybit"];
export const TR_REBATE_MAX_PCT = Math.round(Math.max(...TR_PROMOTED.map((slug) => HOME_REBATE_SHARE[slug] ?? 0)) * 100);

export const HOME_TITLE_BUDGET = 60;
const BRAND_SUFFIX = " — NexuAlpha";
// Same as the shared neutral list except zh-Hant, whose home description keeps slogan B (existing owner copy).
export const NEUTRAL_HOME_DESCRIPTION_LOCALES = Object.freeze(new Set(NEUTRAL_CTA_LOCALE_LIST.filter((locale) => locale !== "zh-Hant")));

// Search keywords of the home title (the patterns pinned in tests/seo-onpage-metadata-length.test.mjs).
const HOME_TITLE_KEYWORDS = Object.freeze({
  // CTR pass 2026-10-13 (GSC 28 d: home at position 7.7, 45 impressions, 0 clicks): the number leads the benefit.
  en: "Crypto Referral Codes: Up to 60% Fee Rebates",
  "zh-Hans": "邀请码与手续费返佣",
  "zh-Hant": "邀請碼與手續費返傭",
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
  "zh-Hant": "OKX、Bitget、幣安邀請碼與官方註冊入口，返傭由交易所結算。",
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
  const keywords = HOME_TITLE_KEYWORDS[locale] || HOME_TITLE_KEYWORDS.en;
  const withSlogan = `${keywords}${TITLE_JOINER[locale] || " | "}${sloganTitleFragment(brandSlogan(locale))}${BRAND_SUFFIX}`;
  if (titleDisplayWidth(withSlogan) <= HOME_TITLE_BUDGET) return withSlogan;
  return `${keywords}${BRAND_SUFFIX}`;
}

/** True when slogan A is part of the home title for this locale (then the description does not repeat it). */
export function homeTitleCarriesSlogan(locale) {
  return homeTitle(locale).includes(sloganTitleFragment(brandSlogan(locale)));
}

/** Home meta description: [slogan A] + [slogan B] + facts, clamped to the locale snippet budget. */
export function homeDescription(locale) {
  const parts = [];
  if (!homeTitleCarriesSlogan(locale)) parts.push(sloganSentence(brandSlogan(locale), locale));
  // Turkey (owner 2026-10-11): Bitget is not promoted (its Turkish entity is on the SPK liquidation list), so the share in
  // slogan B is the best confirmed share among the partners promoted in Turkey (OKX 40%), not the Bitget headline.
  if (!NEUTRAL_HOME_DESCRIPTION_LOCALES.has(locale)) parts.push(sloganSentence(brandSloganSecondary(locale, locale === "tr" ? TR_REBATE_MAX_PCT : undefined), locale));
  parts.push(HOME_FACTS[locale] || HOME_FACTS.en);
  return clampMetaDescription(parts.join(CJK_JOIN.has(locale) ? "" : " "), locale);
}

export const HOME_SEARCH_COPY = Object.freeze(Object.fromEntries(
  SLOGAN_LOCALES.map((locale) => [locale, Object.freeze([homeTitle(locale), homeDescription(locale)])]),
));
