// Brand slogans (owner decision 2026-10-11). One source of truth for every surface that prints them:
//   A (primary)   — Organization JSON-LD `slogan`, footer line under the brand mark, default/home social card,
//                   llms*.txt lead line, Organization description lead, home <title> where it fits the 60-wide budget
//                   (otherwise the home meta description).
//   B (secondary) — home meta description. Its percentage is never typed here: "{max}" is replaced with
//                   HOME_REBATE_MAX_PCT (src/data/home-rebate-tiers.js) through formatPercent, so the slogan follows the
//                   headline constant and Turkish renders "%60".
// Imported by the Worker (worker/index.js), the client router (seo-injection.js), the footer, the OG card renderer
// (server/og-image.mjs) and scripts/generate-public-llms.mjs. Keep all 15 UI locales in both tables.
import { HOME_REBATE_MAX_PCT } from "./home-rebate-runtime.js";
import { formatPercent } from "./format-percent.js";

export const SLOGAN_LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"]);

// A: "One verified gateway to the world’s exchanges." / 全球交易所，一个官方入口
export const BRAND_SLOGAN_PRIMARY = Object.freeze({
  en: "One verified gateway to the world’s exchanges.",
  "zh-Hans": "全球交易所，一个官方入口",
  "zh-Hant": "全球交易所，一個官方入口",
  es: "Un acceso verificado a los exchanges del mundo.",
  "pt-BR": "Um acesso verificado às exchanges do mundo.",
  fr: "Un accès vérifié aux plateformes du monde entier.",
  de: "Ein geprüfter Zugang zu den Börsen der Welt.",
  it: "Un accesso verificato agli exchange del mondo.",
  ja: "世界の取引所へ、ひとつの公式入口",
  ko: "전 세계 거래소로 통하는 하나의 공식 관문",
  ru: "Единый проверенный вход на биржи всего мира.", // l10n: needs native review
  tr: "Dünya borsalarına tek ve doğrulanmış giriş.", // l10n: needs native review
  id: "Satu gerbang terverifikasi menuju bursa-bursa dunia.", // l10n: needs native review
  vi: "Một cổng đã xác minh tới các sàn giao dịch toàn cầu.", // l10n: needs native review
  ar: "بوابة واحدة موثّقة إلى منصات التداول حول العالم.", // l10n: needs native review
  ur: "دنیا کی ایکسچینجز تک ایک تصدیق شدہ دروازہ۔", // l10n: needs native review
  uk: "Єдиний перевірений шлях до світових бірж.", // l10n: needs native review
});

// B: "Your fees, returned. Up to {max}." / 你的手续费，最高返还 {max} — "{max}" = formatPercent(locale, HOME_REBATE_MAX_PCT).
export const BRAND_SLOGAN_SECONDARY_TEMPLATE = Object.freeze({
  en: "Your fees, returned. Up to {max}.",
  "zh-Hans": "你的手续费，最高返还 {max}",
  "zh-Hant": "你的手續費，最高返還 {max}",
  es: "Tus comisiones, de vuelta. Hasta el {max}.",
  "pt-BR": "Suas taxas de volta. Até {max}.",
  fr: "Vos frais, reversés. Jusqu’à {max}.",
  de: "Ihre Gebühren, zurückerstattet. Bis zu {max}.",
  it: "Le tue commissioni, restituite. Fino al {max}.",
  ja: "あなたの手数料を、最大{max}還元。",
  ko: "수수료, 최대 {max} 환급.",
  ru: "Ваши комиссии — обратно. До {max}.", // l10n: needs native review
  tr: "Komisyonlarınız geri döner. En fazla {max}.", // l10n: needs native review
  id: "Biaya Anda kembali. Hingga {max}.", // l10n: needs native review
  vi: "Phí giao dịch được hoàn lại. Lên đến {max}.", // l10n: needs native review
  ar: "رسومك تعود إليك. حتى {max}.", // l10n: needs native review
  ur: "آپ کی فیس واپس۔ {max} تک۔", // l10n: needs native review
  uk: "Ваші комісії повертаються. До {max}.", // l10n: needs native review
});

const CJK_SENTENCE_LOCALES = new Set(["zh-Hans", "zh-Hant", "ja"]);

/** Maps any locale spelling (zh-CN, pt, id-ID …) to one of the 15 slogan locales; unknown → en. */
export function sloganLocale(locale) {
  const raw = String(locale || "en");
  if (SLOGAN_LOCALES.includes(raw)) return raw;
  const lower = raw.toLowerCase();
  const exact = SLOGAN_LOCALES.find((code) => code.toLowerCase() === lower);
  if (exact) return exact;
  if (lower === "zh-cn" || lower === "zh-sg" || lower === "zh") return "zh-Hans";
  if (lower === "zh-tw" || lower === "zh-hk" || lower === "zh-mo") return "zh-Hant";
  const base = lower.split(/[-_]/)[0];
  if (base === "pt") return "pt-BR";
  return SLOGAN_LOCALES.find((code) => code === base) || "en";
}

/** Slogan A as displayed (footer, OG card, JSON-LD). */
export function brandSlogan(locale) {
  return BRAND_SLOGAN_PRIMARY[sloganLocale(locale)];
}

/** Slogan B with the headline share from HOME_REBATE_MAX_PCT, formatted for the locale ("60%", Turkish "%60"). */
export function brandSloganSecondary(locale, max = HOME_REBATE_MAX_PCT) {
  const code = sloganLocale(locale);
  return BRAND_SLOGAN_SECONDARY_TEMPLATE[code].replace("{max}", formatPercent(code, max));
}

/** A slogan as a sentence inside running text: adds "。" (zh/ja) or "." when the display form has no full stop. */
export function sloganSentence(text, locale) {
  const value = String(text || "").trim();
  if (!value || /[.!?。！？]$/u.test(value)) return value;
  return `${value}${CJK_SENTENCE_LOCALES.has(sloganLocale(locale)) ? "。" : "."}`;
}

/** A slogan as a title fragment: no trailing full stop. */
export function sloganTitleFragment(text) {
  return String(text || "").trim().replace(/[.。]$/u, "");
}
