import { localeManifest, supportedLocales } from "../content/locale-manifest";

const SUPPORTED = new Set(supportedLocales);
export const INDEXABLE_HOME_LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"]);

function internalHref(href) {
  try {
    const url = new URL(String(href || ""), "https://nexualpha.com");
    if (url.origin !== "https://nexualpha.com") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function normalizeHreflangAlternates(alternates = []) {
  const byLocale = new Map();
  for (const alternate of alternates || []) {
    const code = alternate?.hreflang;
    if (!SUPPORTED.has(code) || byLocale.has(code)) continue;
    const href = internalHref(alternate.href);
    if (!href) continue;
    byLocale.set(code, { code, href });
  }
  return [...byLocale.values()];
}

export function languageOptionsFromHreflang(alternates = []) {
  return normalizeHreflangAlternates(alternates).map((option) => ({
    ...option,
    label: localeManifest[option.code]?.language || option.code,
  }));
}

export function readDocumentHreflangAlternates(doc = globalThis.document) {
  if (!doc || typeof doc.querySelectorAll !== "function") return [];
  return [...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map((link) => ({
    hreflang: link.getAttribute("hreflang"),
    href: link.getAttribute("href"),
  }));
}
