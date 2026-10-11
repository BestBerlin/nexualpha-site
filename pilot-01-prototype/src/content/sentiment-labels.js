const classifications = ["Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"];
const labels = {
  en: classifications,
  "zh-Hans": ["极度恐惧", "恐惧", "中性", "贪婪", "极度贪婪"],
  "zh-Hant": ["極度恐懼", "恐懼", "中性", "貪婪", "極度貪婪"],
  es: ["Miedo extremo", "Miedo", "Neutral", "Codicia", "Codicia extrema"],
  "pt-BR": ["Medo extremo", "Medo", "Neutro", "Ganância", "Ganância extrema"],
  fr: ["Peur extrême", "Peur", "Neutre", "Cupidité", "Cupidité extrême"],
  de: ["Extreme Angst", "Angst", "Neutral", "Gier", "Extreme Gier"],
  ja: ["極度の恐怖", "恐怖", "中立", "強欲", "極度の強欲"],
  ko: ["극심한 공포", "공포", "중립", "탐욕", "극심한 탐욕"],
  ar: ["خوف شديد", "خوف", "محايد", "طمع", "طمع شديد"],
  tr: ["Aşırı korku", "Korku", "Nötr", "Açgözlülük", "Aşırı açgözlülük"],
  ru: ["Крайний страх", "Страх", "Нейтрально", "Жадность", "Крайняя жадность"],
  id: ["Ketakutan ekstrem", "Ketakutan", "Netral", "Keserakahan", "Keserakahan ekstrem"],
  vi: ["Sợ hãi tột độ", "Sợ hãi", "Trung lập", "Tham lam", "Tham lam tột độ"],
  // l10n: needs native review
  ur: ["انتہائی خوف", "خوف", "غیر جانبدار", "لالچ", "انتہائی لالچ"],
  // l10n: needs native review
  uk: ["Крайній страх", "Страх", "Нейтрально", "Жадібність", "Крайня жадібність"],
  it: ["Paura estrema", "Paura", "Neutrale", "Avidità", "Avidità estrema"],
};

export function sentimentLabel(classification, locale) {
  const index = classifications.indexOf(classification);
  return index < 0 ? classification : (labels[locale] ?? labels[String(locale || "").split("-")[0]] ?? labels.en)[index];
}
