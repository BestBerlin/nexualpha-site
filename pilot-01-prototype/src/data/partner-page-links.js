import { isNeutralCtaLocale } from "./locale-policy.js";
import { localizedHref } from "./locale-routing.js";
import { isPartnerPromotableIn, isTurkeyGated } from "./partner-geo-policy.js";
import { publicCtaForVenue } from "./source-bound-cta.js";
import { partnerRegistry } from "./partner-registry.js";
import { venueDatabase } from "./venue-database.js";
import { VENUE_PRIORITY } from "./venue-priority.js";

// Owner display priority (Bitget, OKX, Binance, ...); unknown partners would sort last.
export const PARTNER_EXCHANGE_PAGE_SLUGS = Object.freeze([
  "okx", "binance", "bybit", "bitget", "kraken", "htx", "coinw", "gate-io", "mexc", "backpack", "hyperliquid",
].sort((a, b) => (VENUE_PRIORITY.indexOf(a) + 1 || 99) - (VENUE_PRIORITY.indexOf(b) + 1 || 99)));

const GROUP_LABEL = {
  en: { referral: "Referral codes", info: "Partner exchange info" },
  "zh-Hans": { referral: "邀请码", info: "合作平台开户信息" },
  "zh-Hant": { referral: "邀請碼", info: "合作平台資訊" },
  es: { referral: "Códigos de referido", info: "Información de plataformas" },
  "pt-BR": { referral: "Códigos de indicação", info: "Informações das corretoras" },
  fr: { referral: "Codes de parrainage", info: "Infos plateformes partenaires" },
  de: { referral: "Empfehlungscodes", info: "Partnerbörsen-Infos" },
  ja: { referral: "紹介コード", info: "提携取引所情報" },
  ko: { referral: "추천 코드", info: "파트너 거래소 정보" },
  tr: { referral: "Referans kodları", info: "Platform bilgileri" },
  id: { referral: "Kode referral", info: "Info bursa partner" },
  it: { referral: "Codici referral", info: "Info piattaforme partner" },
};

const CODE_LABEL = {
  en: "referral code",
  "zh-Hans": "邀请码",
  "zh-Hant": "邀請碼",
  es: "código de referido",
  "pt-BR": "código de indicação",
  fr: "code de parrainage",
  de: "Empfehlungscode",
  ja: "紹介コード",
  ko: "추천 코드",
  tr: "referans kodu",
  id: "kode referral",
  it: "codice referral",
};

function copyFor(locale) {
  if (locale === "zh-CN") return GROUP_LABEL["zh-Hans"];
  if (locale === "zh-TW") return GROUP_LABEL["zh-Hant"];
  return GROUP_LABEL[locale] || GROUP_LABEL.en;
}

function codeWord(locale) {
  if (locale === "zh-CN") return CODE_LABEL["zh-Hans"];
  if (locale === "zh-TW") return CODE_LABEL["zh-Hant"];
  return CODE_LABEL[locale] || CODE_LABEL.en;
}

export function partnerExchangeLinkGroupLabel(locale = "en", { market } = {}) {
  const copy = copyFor(locale);
  const hasPromotablePartner = PARTNER_EXCHANGE_PAGE_SLUGS.some((slug) => {
    const cta = publicCtaForVenue(slug, locale, market);
    return cta.hasPartnerRoute && !cta.actionGate && isPartnerPromotableIn(slug, { locale, market });
  });
  return isNeutralCtaLocale(locale) || !hasPromotablePartner ? copy.info : copy.referral;
}

export function partnerExchangePageLinks(locale = "en", { includeCodes = true, market } = {}) {
  const neutral = isNeutralCtaLocale(locale);
  return PARTNER_EXCHANGE_PAGE_SLUGS
    .map((slug) => {
      const cta = publicCtaForVenue(slug, locale, market);
      const venue = venueDatabase[slug] || cta.db || {};
      const name = cta.name || venue.name || slug;
      if (!partnerRegistry[slug]?.hasReferral || !venueDatabase[slug]) return null;
      // Türkiye pages never link a partner outside the Türkiye list (Bitget, CoinW), not even informationally.
      if (isTurkeyGated(slug, { locale, market })) return null;
      const promotable = !neutral && cta.hasPartnerRoute && !cta.actionGate && isPartnerPromotableIn(slug, { locale, market });
      const hasCode = includeCodes && promotable && cta.inviteCode;
      return {
        key: `partner-${slug}`,
        slug,
        name,
        code: hasCode ? cta.inviteCode : null,
        href: localizedHref(`/exchanges/${slug}${promotable ? "#registration-path" : ""}`, { locale }),
        label: hasCode ? `${name} ${codeWord(locale)}` : name,
      };
    })
    .filter(Boolean);
}
