// "Show all (n)" / "Show fewer" for exchange groups on /activities (2026-10-10). Each group renders every item in the
// HTML (crawlers see all of it) and collapses items after the third with CSS until the reader expands the group.
export const GROUP_PREVIEW_COUNT = 3;

const COPY = {
  en: ["Show all ({n})", "Show fewer"],
  "zh-Hans": ["展开全部（{n}）", "收起"],
  "zh-Hant": ["展開全部（{n}）", "收起"],
  es: ["Mostrar todo ({n})", "Mostrar menos"],
  "pt-BR": ["Mostrar tudo ({n})", "Mostrar menos"],
  fr: ["Tout afficher ({n})", "Afficher moins"],
  de: ["Alle anzeigen ({n})", "Weniger anzeigen"],
  it: ["Mostra tutto ({n})", "Mostra meno"],
  ja: ["すべて表示（{n}）", "表示を減らす"],
  ko: ["전체 보기 ({n})", "접기"],
  ru: ["Показать все ({n})", "Показать меньше"],
  tr: ["Tümünü göster ({n})", "Daha az göster"],
  id: ["Tampilkan semua ({n})", "Tampilkan lebih sedikit"],
  vi: ["Hiện tất cả ({n})", "Thu gọn"],
  ar: ["عرض الكل ({n})", "عرض أقل"],
};

export function showAllCopy(locale, n) {
  const [all, fewer] = COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);
  return { all: all.replace("{n}", String(n)), fewer };
}

export const SHOW_ALL_LOCALES = Object.freeze(Object.keys(COPY));
