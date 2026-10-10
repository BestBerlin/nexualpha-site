// Data-page navigation labels and route constants for the app shell (header, footer, route table).
// Split out of market-data-pages.js on 2026-10-11: the shell only needs these labels, not the full page copy of 15
// locales (~40 KB compressed) that market-data-pages.js carries for /liquidations and /funding-rates themselves.
export const MARKET_EVENTS_PATH = "/intel/market-events.json";
export const LIQUIDATIONS_PATH = "/liquidations";
export const FUNDING_RATES_PATH = "/funding-rates";
export const DATA_PAGE_PATHS = Object.freeze([LIQUIDATIONS_PATH, FUNDING_RATES_PATH]);

export const DATA_PAGE_NAV = Object.freeze({
  en: { data: "Data", liquidations: "Liquidations today", funding: "Funding rates" },
  "zh-Hans": { data: "数据", liquidations: "今日爆仓", funding: "资金费率" },
  "zh-Hant": { data: "數據", liquidations: "今日爆倉", funding: "資金費率" },
  es: { data: "Datos", liquidations: "Liquidaciones de hoy", funding: "Tasas de funding" },
  "pt-BR": { data: "Dados", liquidations: "Liquidações de hoje", funding: "Taxas de funding" },
  fr: { data: "Données", liquidations: "Liquidations du jour", funding: "Taux de funding" },
  de: { data: "Daten", liquidations: "Liquidationen heute", funding: "Funding-Raten" },
  it: { data: "Dati", liquidations: "Liquidazioni di oggi", funding: "Tassi di funding" },
  ja: { data: "データ", liquidations: "本日の清算", funding: "資金調達率" },
  ko: { data: "데이터", liquidations: "오늘의 청산", funding: "펀딩비" },
  ru: { data: "Данные", liquidations: "Ликвидации сегодня", funding: "Ставки финансирования" },
  tr: { data: "Veri", liquidations: "Bugünkü tasfiyeler", funding: "Fonlama oranları" },
  id: { data: "Data", liquidations: "Likuidasi hari ini", funding: "Funding rate" },
  vi: { data: "Dữ liệu", liquidations: "Thanh lý hôm nay", funding: "Funding rate" },
  ar: { data: "البيانات", liquidations: "تصفيات اليوم", funding: "أسعار التمويل" },
});

// Shell projection of dataPageCopy(locale): only the navigation labels. The complete page copy stays in
// market-data-pages.js (dataPageCopy there returns the same nav object plus the page sections).
export function dataPageCopy(locale) {
  const nav = DATA_PAGE_NAV[locale] || (String(locale || "").startsWith("zh") ? DATA_PAGE_NAV["zh-Hans"] : DATA_PAGE_NAV.en);
  return { nav };
}
