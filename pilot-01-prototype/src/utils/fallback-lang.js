// Copy that falls back to the English dictionary on a non-English page is marked as English: lang="en" (screen readers,
// hyphenation, fonts) and dir="ltr" (on RTL pages neutral punctuation would otherwise flip: "?funding routes").
// Usage: <section {...enFallback(copy, COPY.en, locale)}>; returns undefined when the copy is the page's own language.
const isEnglish = (locale) => /^en(-|$)/i.test(String(locale || "en"));
export function enFallback(picked, english, locale) {
  return picked === english && !isEnglish(locale) ? { lang: "en", dir: "ltr" } : undefined;
}
// For strings known to be English (record values, untranslated literals) on any non-English page.
export function enAttrs(locale) {
  return isEnglish(locale) ? undefined : { lang: "en", dir: "ltr" };
}
// Data-driven variant for pages written in a non-Latin script (Arabic, CJK, Cyrillic...): a string with Latin letters and
// no letters of any other script is an English fallback (record values and *En fields), so it is marked English.
const NON_LATIN_SCRIPT = /^(ar|he|fa|ur|ja|ko|zh|ru|uk|el|th|hi)(-|$)/i;
const OTHER_SCRIPT_LETTER = /(?!\p{Script=Latin})\p{L}/u;
export function enIfLatin(text, locale) {
  if (!NON_LATIN_SCRIPT.test(String(locale || ""))) return undefined;
  const s = String(text ?? "");
  if (!/[A-Za-z]/.test(s) || OTHER_SCRIPT_LETTER.test(s)) return undefined;
  return { lang: "en", dir: "ltr" };
}
