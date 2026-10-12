export const NO_KYC_META_TITLE_BY_LOCALE = Object.freeze({
  en: "MEXC KYC vs Hyperliquid/dYdX self-custody",
  "zh-Hans": "MEXC 实名与 Hyperliquid/dYdX 自托管",
  "zh-Hant": "MEXC 實名與 Hyperliquid/dYdX 自託管",
  es: "MEXC KYC vs Hyperliquid/dYdX autocustodia",
  "pt-BR": "MEXC KYC vs Hyperliquid/dYdX autocustódia",
  fr: "MEXC KYC vs Hyperliquid/dYdX auto-garde",
  de: "MEXC KYC vs Hyperliquid/dYdX Selbstverwahrung",
  it: "MEXC KYC vs Hyperliquid/dYdX autocustodia",
  ja: "MEXC KYC 対 Hyperliquid/dYdX 自己管理",
  ko: "MEXC KYC 대 Hyperliquid/dYdX 자체관리",
  ru: "MEXC KYC vs Hyperliquid/dYdX: самостоятельное хранение",
  tr: "MEXC KYC vs Hyperliquid/dYdX öz saklama",
  id: "MEXC KYC vs Hyperliquid/dYdX swakelola",
  vi: "MEXC KYC vs Hyperliquid/dYdX tự lưu ký",
  ar: "MEXC KYC vs Hyperliquid/dYdX حفظ ذاتي",
});

export function noKycMetaTitle(locale) {
  return NO_KYC_META_TITLE_BY_LOCALE[locale] || NO_KYC_META_TITLE_BY_LOCALE.en;
}
