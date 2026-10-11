// Reading time per article edition (SEO audit 2026-10-11 #7): the importer used max(English words / 220, Chinese
// characters / 450), so English pages showed the Chinese edition's time (~3x too long on legacy articles). Each edition
// is now measured on its own body: words / 230 for space-separated scripts (Latin, Cyrillic, Arabic, Hangul, Vietnamese),
// characters / 450 for Han and Kana (zh-Hans, zh-Hant, ja). Shared by scripts/import-nexualpha-content.mjs, the feed
// normalizer (src/data/news-feed-client.js) and the worker, so stored and displayed values agree.
export const READ_WORDS_PER_MINUTE = 230;
export const READ_CJK_CHARS_PER_MINUTE = 450;
const CJK_LOCALES = new Set(["zh-Hans", "zh-Hant", "ja"]);
const CJK_CHAR = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu;

function readableText(markdown) {
  return String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/^::embed\b.*$/gm, " ")
    .replace(/[#>*_`|~]+/g, " ")
    .replace(/(^|\s)[-:]+(?=\s|$)/g, " ");
}

/** Whole minutes (at least 1) to read one edition's body. */
export function estimateReadMinutes(markdown, locale = "en") {
  const text = readableText(markdown);
  const cjkChars = (text.match(CJK_CHAR) || []).length;
  let minutes;
  if (CJK_LOCALES.has(locale) || cjkChars > text.length / 4) {
    const otherWords = text.replace(CJK_CHAR, " ").split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
    minutes = cjkChars / READ_CJK_CHARS_PER_MINUTE + otherWords / READ_WORDS_PER_MINUTE;
  } else {
    minutes = text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length / READ_WORDS_PER_MINUTE;
  }
  return Math.max(1, Math.ceil(minutes));
}

export function formatReadTime(minutes) {
  return `${Math.max(1, Math.round(Number(minutes) || 1))} min`;
}

/** { [locale]: "N min" } for every edition body in a localized content record. */
export function newsReadTimes(content) {
  if (!content || typeof content !== "object" || Array.isArray(content)) return {};
  return Object.fromEntries(Object.entries(content).flatMap(([locale, body]) => (
    typeof body === "string" && body.trim() ? [[locale, formatReadTime(estimateReadMinutes(body, locale))]] : []
  )));
}

/** The reading time to show for an article in `locale`: that edition's own value, else the stored one. */
export function newsReadTimeFor(article, locale = "en") {
  const byLocale = article && typeof article.readTimeByLocale === "object" && article.readTimeByLocale ? article.readTimeByLocale : null;
  return (byLocale && (byLocale[locale] || byLocale.en)) || article?.readTime || "";
}
