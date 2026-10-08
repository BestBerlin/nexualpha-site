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
  id: { skip: "Lewati ke konten", more: "Lainnya" },
  vi: { skip: "Chuyển đến nội dung", more: "Thêm" },
  it: { skip: "Vai al contenuto", more: "Altro" },
};

export function shellCopy(locale) {
  const key = locale === "zh-CN" ? "zh-Hans" : locale === "zh-TW" ? "zh-Hant" : locale;
  return COPY[key] || COPY[String(key || "").split("-")[0]] || COPY.en;
}
