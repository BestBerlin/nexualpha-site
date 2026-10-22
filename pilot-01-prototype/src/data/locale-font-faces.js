// Script fonts per page locale (perf 2026-10-22). The CJK, Korean and Arabic faces used to be declared globally in
// font-faces.css; every shared font stack lists "Pilot Noto SC/TC/JP" after system-ui, so a stray CJK character on an
// English page (the language switcher's 简体中文 / 繁體中文 / 日本語) made the browser fetch zh-Hans, then zh-Hant, then ja
// (161 KB), and /zh-hans fetched all three as well. Now a face is declared only on a page whose <html lang> needs it:
// the worker inlines the matching @font-face block into the SSR head, and ensureLocaleFontFaces() adds it after a
// client-side locale change. Families with no declared face are skipped by the browser (system CJK fonts take over).
//
// URLs carry ?v=<first 12 hex of the file's SHA-256>: server.mjs serves versioned /fonts/* as immutable for a year.
// tests/locale-font-faces.test.mjs fails if a file changes without its version.

export const FONT_VERSIONS = Object.freeze({
  "latin-400-700.woff2": "be8f7625cbb4",
  "zh-Hans-400.woff2": "fbb0aa7d1023",
  "zh-Hant-400.woff2": "22abd8c53892",
  "ja-400.woff2": "5fa4508492b6",
  "ko-400.woff2": "aa41ee125319",
  "ar-400.woff2": "e2aa4c8a812d",
  "geist/geist-sans-latin.woff2": "fd90607dcdac",
  "geist/geist-mono-latin.woff2": "18da015f4a96",
});

export const fontUrl = (file) => `/fonts/${file}?v=${FONT_VERSIONS[file]}`;

const CJK_RANGE = "U+2E80-2FDF, U+3000-303F, U+3040-30FF, U+3100-312F, U+3190-31FF, U+3200-33FF, U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF, U+FE30-FE4F, U+FF00-FF0A, U+FF0C-FFEF, U+20000-2FA1F";
const face = (family, file, range, display = "swap") => `@font-face{font-family:"${family}";font-style:normal;font-weight:100 900;font-display:${display};src:url("${fontUrl(file)}") format("woff2");unicode-range:${range}}`;

// Arabic keeps font-display optional (2026-10-11: a late swap re-wrapped /ar/news, CLS 0.35 at 768 px).
const ARABIC = face("Pilot Noto Arabic", "ar-400.woff2", "U+0600-06FF, U+0750-077F, U+0870-08FF, U+FB50-FDFF, U+FE70-FEFF", "optional");
const FACES = Object.freeze({
  "zh-Hans": face("Pilot Noto SC", "zh-Hans-400.woff2", CJK_RANGE),
  "zh-Hant": face("Pilot Noto TC", "zh-Hant-400.woff2", CJK_RANGE),
  ja: face("Pilot Noto JP", "ja-400.woff2", CJK_RANGE),
  ko: face("Pilot Noto KR", "ko-400.woff2", "U+1100-11FF, U+3000-303F, U+3130-318F, U+3200-32FF, U+A960-A97F, U+AC00-D7FF, U+FF00-FF0A, U+FF0C-FFEF"),
  ar: ARABIC,
  ur: ARABIC,
});

export function localeFontKey(locale) {
  const value = String(locale || "");
  if (FACES[value]) return value;
  const lower = value.toLowerCase();
  if (lower === "zh-cn" || lower === "zh-sg" || lower === "zh-hans") return "zh-Hans";
  if (lower.startsWith("zh")) return "zh-Hant";
  const base = lower.split("-")[0];
  return FACES[base] ? base : null;
}

/** The @font-face CSS a page in `locale` needs, or "" (Latin-script locales use the global Inter/Geist faces). */
export function localeFontFaceCss(locale) {
  const key = localeFontKey(locale);
  return key ? FACES[key] : "";
}

export const LOCALE_FONT_STYLE_ATTR = "data-nexualpha-locale-fonts";

/** Inline <style> for the SSR head, or "". */
export function localeFontStyleTag(locale) {
  const css = localeFontFaceCss(locale);
  return css ? `<style ${LOCALE_FONT_STYLE_ATTR}="${localeFontKey(locale)}">${css}</style>` : "";
}

/** Browser: keep the declared faces in step with <html lang> across client-side locale changes. */
export function ensureLocaleFontFaces(doc = typeof document === "undefined" ? null : document) {
  if (!doc?.documentElement) return;
  const sync = () => {
    const key = localeFontKey(doc.documentElement.lang);
    if (!key || doc.querySelector(`style[${LOCALE_FONT_STYLE_ATTR}="${key}"]`)) return;
    const style = doc.createElement("style");
    style.setAttribute(LOCALE_FONT_STYLE_ATTR, key);
    style.textContent = FACES[key];
    doc.head.appendChild(style);
  };
  sync();
  if (typeof MutationObserver === "function") new MutationObserver(sync).observe(doc.documentElement, { attributes: true, attributeFilter: ["lang"] });
}
