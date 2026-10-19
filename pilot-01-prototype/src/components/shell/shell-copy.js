// Small shell-only strings. Nav and footer legal copy live with their existing owners.
const COPY = {
  en: { skip: "Skip to content", more: "More" },
  "zh-Hans": { skip: "跳到主要内容", more: "更多" },
  "zh-Hant": { skip: "跳到主要內容", more: "更多" },
  ja: { skip: "本文へスキップ", more: "その他" },
  ko: { skip: "본문으로 건너뛰기", more: "더 보기" },
  tr: { skip: "İçeriğe geç", more: "Daha fazla" },
  es: { skip: "Saltar al contenido", more: "Más" },
  "pt-BR": { skip: "Ir para o conteúdo", more: "Mais" },
  fr: { skip: "Aller au contenu", more: "Plus" },
  de: { skip: "Zum Inhalt springen", more: "Mehr" },
  ru: { skip: "Перейти к содержимому", more: "Ещё" },
  ar: { skip: "انتقل إلى المحتوى", more: "المزيد" },
  // l10n: needs native review
  ur: { skip: "مواد پر جائیں", more: "مزید" },
  // l10n: needs native review
  uk: { skip: "Перейти до вмісту", more: "Більше" },
  id: { skip: "Lewati ke konten", more: "Lainnya" },
  vi: { skip: "Chuyển đến nội dung", more: "Thêm" },
  it: { skip: "Vai al contenuto", more: "Altro" },
};

export function shellCopy(locale) {
  const key = locale === "zh-CN" ? "zh-Hans" : locale === "zh-TW" ? "zh-Hant" : locale;
  return COPY[key] || COPY[String(key || "").split("-")[0]] || COPY.en;
}

// Desktop-only compact wording; full destination labels remain in More and the mobile sheet.
export const COMPACT_NAV = {
  en: ["News", "US stocks"], "zh-Hans": ["新闻", "美股"], "zh-Hant": ["新聞", "美股"],
  es: ["Noticias", "Acciones US"], "pt-BR": ["Notícias", "Ações EUA"], fr: ["Actualités", "Actions US"],
  de: ["Nachrichten", "US-Aktien"], it: ["Notizie", "Azioni USA"], ja: ["ニュース", "米国株"],
  ko: ["뉴스", "미국 주식"], ru: ["Новости", "Акции США"], tr: ["Haberler", "ABD hisseleri"],
  id: ["Berita", "Saham AS"], vi: ["Tin tức", "Cổ phiếu Mỹ"], ar: ["الأخبار", "أسهم أمريكية"],
  ur: ["خبریں", "امریکی حصص"], uk: ["Новини", "Акції США"],
};
export function compactNavLabel(locale, href, fallback) {
  const labels = COMPACT_NAV[locale] || COMPACT_NAV.en;
  if (/\/news(?:$|[/?#])/.test(href)) return labels[0];
  if (/\/tokenized-stocks(?:$|[/?#])/.test(href)) return labels[1];
  return fallback;
}
