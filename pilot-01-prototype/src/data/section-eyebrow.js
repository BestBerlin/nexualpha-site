// Section eyebrow above every inner-page H1 (owner 2026-10-10: the kicker names the section, not always
// "FEES & REBATES"). Rendered through `data-eyebrow` on <main> and read by site-signature.css via attr().
// The home keeps its own kicker (home7-copy); pages without a section keep the CSS default.
export const SECTION_EYEBROW_KEYS = Object.freeze(["news", "campaigns", "telegram", "compare", "exchanges"]);

const LABELS = Object.freeze({
  en: { news: "NEWS & RESEARCH", campaigns: "CAMPAIGNS", telegram: "TELEGRAM", compare: "COMPARE", exchanges: "EXCHANGES" },
  "zh-Hans": { news: "新闻与研究", campaigns: "活动", telegram: "TELEGRAM", compare: "对比", exchanges: "交易所" },
  "zh-Hant": { news: "新聞與研究", campaigns: "活動", telegram: "TELEGRAM", compare: "比較", exchanges: "交易所" },
  es: { news: "NOTICIAS E INVESTIGACIÓN", campaigns: "CAMPAÑAS", telegram: "TELEGRAM", compare: "COMPARAR", exchanges: "EXCHANGES" },
  "pt-BR": { news: "NOTÍCIAS E PESQUISA", campaigns: "CAMPANHAS", telegram: "TELEGRAM", compare: "COMPARAR", exchanges: "CORRETORAS" },
  fr: { news: "ACTUALITÉS ET RECHERCHE", campaigns: "CAMPAGNES", telegram: "TELEGRAM", compare: "COMPARER", exchanges: "PLATEFORMES" },
  de: { news: "NEWS & RESEARCH", campaigns: "AKTIONEN", telegram: "TELEGRAM", compare: "VERGLEICH", exchanges: "BÖRSEN" },
  it: { news: "NOTIZIE E RICERCA", campaigns: "CAMPAGNE", telegram: "TELEGRAM", compare: "CONFRONTO", exchanges: "EXCHANGE" },
  ja: { news: "ニュースと調査", campaigns: "キャンペーン", telegram: "TELEGRAM", compare: "比較", exchanges: "取引所" },
  ko: { news: "뉴스와 리서치", campaigns: "이벤트", telegram: "TELEGRAM", compare: "비교", exchanges: "거래소" },
  ru: { news: "НОВОСТИ И ИССЛЕДОВАНИЯ", campaigns: "АКЦИИ", telegram: "TELEGRAM", compare: "СРАВНЕНИЕ", exchanges: "БИРЖИ" },
  tr: { news: "HABERLER VE ARAŞTIRMA", campaigns: "KAMPANYALAR", telegram: "TELEGRAM", compare: "KARŞILAŞTIRMA", exchanges: "BORSALAR" },
  id: { news: "BERITA & RISET", campaigns: "KAMPANYE", telegram: "TELEGRAM", compare: "BANDINGKAN", exchanges: "BURSA" },
  vi: { news: "TIN TỨC & NGHIÊN CỨU", campaigns: "SỰ KIỆN", telegram: "TELEGRAM", compare: "SO SÁNH", exchanges: "SÀN GIAO DỊCH" },
  ar: { news: "الأخبار والأبحاث", campaigns: "الحملات", telegram: "TELEGRAM", compare: "المقارنة", exchanges: "المنصات" },
});

export const SECTION_EYEBROW_LOCALES = Object.freeze(Object.keys(LABELS));

function labelsFor(locale) {
  const value = String(locale || "en");
  if (LABELS[value]) return LABELS[value];
  if (value.toLowerCase() === "pt-br" || value.startsWith("pt")) return LABELS["pt-BR"];
  if (value === "zh-TW" || value === "zh-HK" || value === "zh-Hant") return LABELS["zh-Hant"];
  if (value.startsWith("zh")) return LABELS["zh-Hans"];
  return LABELS[value.split("-")[0]] || LABELS.en;
}

export function sectionEyebrow(locale, key) {
  const label = labelsFor(locale)[key];
  return label ? `NEXUALPHA · ${label}` : undefined;
}

// Spread on <main>: data-eyebrow for tests and tooling, --section-eyebrow for the CSS kicker (content: var()).
export function sectionEyebrowAttrs(locale, key) {
  const text = sectionEyebrow(locale, key);
  if (!text) return {};
  return { "data-eyebrow": text, style: { "--section-eyebrow": JSON.stringify(text) } };
}
