// Home <title> and meta description per locale. One table read by the Worker head (worker/index.js routeMetadata),
// the SSR/client router (seo-injection.js computeRouteSeo) and therefore /api/route-seo, so all three stay identical.
//
// Owner 2026-10-10 (GSC CTR work): the title carries the commercial search intent (referral code / fee rebate; ja/ko
// informational; ru/ar/ur/uk neutral, matching src/data/referral-seo.js).
// Owner 2026-10-11 (brand slogans, src/data/brand-slogan.js):
//   - title = search keywords + slogan A + " — NexuAlpha" when that fits the 60-wide budget (budgetTitle,
//     titleDisplayWidth: CJK counts double); otherwise keywords + " — NexuAlpha" and slogan A leads the description;
//   - description = [slogan A when not in the title] + slogan B + the existing facts (OKX/Bitget/Binance, settled by
//     the exchange, partner links disclosed), clamped with clampMetaDescription.
// Slogan B (a rebate share) is left out where the home copy is neutral pending local review: ru (advertising
// rules), ar (Egypt CBE law 194/2020), plus ur and uk until partner/regulator status is reviewed. These lead with slogan A and keep their neutral facts. Turkish carries
// slogan B like the other locales (owner 2026-10-11: "土耳其站照常写"). Remove a locale from
// NEUTRAL_HOME_DESCRIPTION_LOCALES to add slogan B.
import { HOME_REBATE_SHARE } from "./home-rebate-tiers.js";
import { brandSlogan, brandSloganSecondary, sloganSentence, sloganTitleFragment, SLOGAN_LOCALES } from "./brand-slogan.js";
import { clampMetaDescription, titleDisplayWidth } from "./meta-description.js";

const TR_PROMOTED = ["okx", "binance", "bybit"];
export const TR_REBATE_MAX_PCT = Math.round(Math.max(...TR_PROMOTED.map((slug) => HOME_REBATE_SHARE[slug] ?? 0)) * 100);

export const HOME_TITLE_BUDGET = 60;
const BRAND_SUFFIX = " — NexuAlpha";
export const NEUTRAL_HOME_DESCRIPTION_LOCALES = Object.freeze(new Set(["ru", "ar", "ur", "uk"]));

// Search keywords of the home title (the patterns pinned in tests/seo-onpage-metadata-length.test.mjs).
const HOME_TITLE_KEYWORDS = Object.freeze({
  en: "Crypto Exchange Referral Codes & Fee Rebates",
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
  vi: "Mã giới thiệu và hoàn phí sàn giao dịch crypto",
  ar: "رسوم منصات العملات الرقمية: OKX وBitget وBinance",

  // l10n: needs native review
  ur: "کرپٹو ایکسچینج فیس: OKX، Bitget اور Binance", // l10n: needs native review
  uk: "Комісії криптобірж: OKX, Bitget і Binance", // l10n: needs native review
});

// Separator between keywords and slogan A inside the title.
const TITLE_JOINER = { "zh-Hans": "｜", "zh-Hant": "｜", ja: "｜" };

// Existing home facts (2026-10-10 copy, tightened so slogan + facts fit the snippet budget without a cut).
const HOME_FACTS = Object.freeze({
  en: "OKX, Bitget and Binance referral codes, exchange-paid. Partner links disclosed.",
  "zh-Hans": "对比 OKX、Bitget、币安手续费与邀请码，返佣由交易所结算。官方注册入口，合作关系已披露。",
  "zh-Hant": "比較 OKX、Bitget、幣安手續費與邀請碼，返傭由交易所結算。官方註冊入口，合作關係已揭露。",
  es: "OKX, Bitget, Binance: paga el exchange. Enlaces de socio declarados.",
  "pt-BR": "OKX, Bitget e Binance, pago pela corretora. Links de parceiros informados.",
  fr: "OKX, Bitget et Binance, versé par la plateforme. Liens partenaires signalés.",
  de: "OKX, Bitget, Binance – zahlt die Börse. Partnerlinks offengelegt.",
  it: "OKX, Bitget, Binance: paga l’exchange. Link partner dichiarati.",
  ja: "OKX・Bitget・Binance の紹介コード。還元は取引所が支払い、提携関係を開示。",
  ko: "OKX·Bitget·Binance 추천코드, 거래소 지급. 제휴 공개.",
  ru: "Комиссии OKX, Bitget и Binance по официальным тарифам и официальные ссылки. Партнёрские ссылки раскрыты.",
  tr: "OKX, Binance, Bybit resmî kayıt. Ortaklık bağlantıları belirtilir.",
  id: "OKX, Bitget dan Binance, dibayar oleh exchange. Kemitraan diungkapkan.",
  vi: "OKX, Bitget, Binance do sàn chi trả. Công bố quan hệ đối tác.",
  ar: "مقارنة رسوم OKX وBitget وBinance وفق الجداول الرسمية. روابط الشراكة مُفصح عنها.",

  // l10n: needs native review
  ur: "OKX، Bitget اور Binance کی فیس سرکاری جدولوں کے مطابق موازنہ کریں۔ پارٹنر لنکس ظاہر کیے گئے ہیں۔", // l10n: needs native review
  uk: "Порівнюйте комісії OKX, Bitget і Binance за офіційними таблицями. Партнерські посилання вказані.", // l10n: needs native review
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
