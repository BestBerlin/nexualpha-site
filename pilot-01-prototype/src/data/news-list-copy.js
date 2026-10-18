// News listing hero copy (2026-10-11): the one source for the /news H1, eyebrow and intro in all 15 locales.
// NewsListPage renders it in the browser and in the SSR entry; the worker uses the same strings for the fallback body
// and for the routeMetadata heading/intro, so the server HTML and the first client render can never disagree.
const HERO_COPY = Object.freeze({
  // Striking distance (GSC 2026-10-11): /news ranks ~10.8 for exchange-news queries ("okx bybit coinbase bitget kraken
  // 2026 new product launch"), so the English H1 and intro name the venues the feed actually covers most.
  en: { eyebrow: "Market news & research", title: "Crypto exchange news & research", subtitle: "News on Binance, OKX, Coinbase, Kraken and Bybit: product and API changes, account guides and regulation, each linked to official sources." },
  "zh-Hans": { eyebrow: "市场观察与研究", title: "新闻与研究", subtitle: "交易所动态、监管变化和交易成本，每天更新。" },
  "zh-Hant": { eyebrow: "市場觀察與研究", title: "新聞與研究", subtitle: "交易所動態、監管變化和交易成本，每天更新。" },
  ja: { eyebrow: "市場ニュースとリサーチ", title: "ニュースとリサーチ", subtitle: "公式資料に基づく分析で、プラットフォーム選び、取引コスト、政策の変化を確認できます。" },
  ko: { eyebrow: "시장 뉴스와 리서치", title: "뉴스와 리서치", subtitle: "공식 출처를 바탕으로 한 분석으로 플랫폼 선택, 거래 비용, 정책 변화를 살펴보세요." },
  tr: { eyebrow: "Piyasa haberleri ve araştırma", title: "Haberler ve araştırma", subtitle: "Resmî kaynaklara dayanan analizlerle platform seçimini, işlem maliyetlerini ve politika değişikliklerini inceleyin." },
  "pt-BR": { eyebrow: "Notícias de mercado e pesquisa", title: "Notícias e pesquisa", subtitle: "Entenda a escolha de plataformas, os custos de negociação e as mudanças regulatórias com análises baseadas em fontes oficiais." },
  es: { eyebrow: "Noticias de mercado e investigación", title: "Noticias e investigación", subtitle: "Explora la elección de plataformas, los costes de negociación y los cambios normativos con análisis vinculados a fuentes oficiales." },
  fr: { eyebrow: "Actualités du marché et recherche", title: "Actualités et recherche", subtitle: "Consultez des analyses fondées sur des sources officielles pour choisir une plateforme et comprendre les frais et les évolutions réglementaires." },
  de: { eyebrow: "Marktnachrichten und Research", title: "Nachrichten und Research", subtitle: "Analysen mit offiziellen Quellen helfen bei der Plattformwahl und beim Verständnis von Handelskosten und regulatorischen Änderungen." },
  ru: { eyebrow: "Новости рынка и исследования", title: "Новости и исследования", subtitle: "Изучайте выбор платформ, торговые издержки и изменения регулирования с помощью анализа на основе официальных источников." },
  ar: { eyebrow: "أخبار السوق والأبحاث", title: "الأخبار والأبحاث", subtitle: "اطّلع على تحليلات تستند إلى مصادر رسمية لفهم اختيار المنصات وتكاليف التداول والتغييرات التنظيمية." },
  id: { eyebrow: "Berita pasar dan riset", title: "Berita dan riset", subtitle: "Pelajari pilihan platform, biaya perdagangan, dan perubahan kebijakan melalui analisis yang merujuk pada sumber resmi." },
  vi: { eyebrow: "Tin thị trường và nghiên cứu", title: "Tin tức và nghiên cứu", subtitle: "Tìm hiểu cách chọn nền tảng, chi phí giao dịch và thay đổi chính sách qua các phân tích dựa trên nguồn chính thức." },
  // l10n: needs native review
  ur: { eyebrow: "مارکیٹ خبریں اور تحقیق", title: "خبریں اور تحقیق", subtitle: "سرکاری ذرائع سے منسلک تجزیوں کے ذریعے پلیٹ فارم انتخاب، ٹریڈنگ لاگت اور پالیسی تبدیلیاں سمجھیں۔" },
  // l10n: needs native review
  uk: { eyebrow: "Ринкові новини та дослідження", title: "Новини та дослідження", subtitle: "Вивчайте вибір платформ, торгові витрати й регуляторні зміни через аналіз із посиланнями на офіційні джерела." },
  it: { eyebrow: "Notizie di mercato e ricerca", title: "Notizie e ricerca", subtitle: "Approfondisci la scelta delle piattaforme, i costi di negoziazione e i cambiamenti normativi con analisi basate su fonti ufficiali." },
});

// English search head of the /news hub (Worker routeMetadata and the SSR seo-injection share it).
export const NEWS_HUB_SEO_EN = Object.freeze({
  // CTR pass 2026-10-13 (GSC 28 d: /news at position 10.2, 95 impressions, 0 clicks).
  title: "Crypto Exchange News: Binance, OKX, Bybit — NexuAlpha",
  description: "Exchange news in Singapore time: listings, delistings, API changes and account rules from Binance, OKX, Bybit, Coinbase and Kraken, linked to the notices.",
});

export const NEWS_LIST_COPY_LOCALES = Object.freeze(Object.keys(HERO_COPY));

export function newsListHeroCopy(locale = "en") {
  const key = String(locale || "en");
  if (HERO_COPY[key]) return HERO_COPY[key];
  if (key === "zh-TW" || key === "zh-HK") return HERO_COPY["zh-Hant"];
  if (key.startsWith("zh")) return HERO_COPY["zh-Hans"];
  return HERO_COPY[key.split("-")[0]] || HERO_COPY.en;
}
