// Short link labels of /etf-flows and /calendar for /flash, the data pages and the home rail (kept off the entry).
const LINKS = {
  en: { etf: "Spot ETF flows", calendar: "Crypto calendar" },
  "zh-Hans": { etf: "现货 ETF 资金流", calendar: "加密日历" },
  "zh-Hant": { etf: "現貨 ETF 資金流", calendar: "加密日曆" },
  es: { etf: "Flujos de ETF al contado", calendar: "Calendario cripto" },
  "pt-BR": { etf: "Fluxos de ETFs à vista", calendar: "Calendário cripto" },
  tr: { etf: "Spot ETF akışları", calendar: "Kripto takvimi" },
  vi: { etf: "Dòng tiền ETF giao ngay", calendar: "Lịch crypto" },
  id: { etf: "Arus dana ETF spot", calendar: "Kalender kripto" },
  ja: { etf: "現物ETF資金フロー", calendar: "暗号資産カレンダー" },
  ko: { etf: "현물 ETF 자금 흐름", calendar: "크립토 캘린더" },
};
/** Short link labels ({ etf, calendar }) for footers, /flash and the data pages. */
export const intelToolLinks = (locale) => LINKS[locale] || (String(locale || "").startsWith("zh") ? LINKS["zh-Hans"] : LINKS.en);
