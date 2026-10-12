const SAFE_PATH = /^\/[A-Za-z0-9/_.~%-]{0,199}$/;
const SAFE_LOCALE = /^[a-z]{2,3}(?:-[A-Za-z]{2,8}){0,2}$/;
const SAFE_COUNTRY = /^[A-Z]{2}$/;

const LOCALE_BY_PREFIX = new Map([
  ["zh-hans", "zh-Hans"],
  ["zh-hant", "zh-Hant"],
  ["pt-br", "pt-BR"],
  ["id-id", "id"],
  ["uk-ua", "uk"],
  ["en", "en"],
  ["es", "es"],
  ["fr", "fr"],
  ["de", "de"],
  ["ja", "ja"],
  ["ko", "ko"],
  ["ar", "ar"],
  ["tr", "tr"],
  ["ru", "ru"],
  ["vi", "vi"],
  ["it", "it"],
  ["ur", "ur"],
]);

const LOCALE_BY_SRC_SUFFIX = new Map([
  ["zh", "zh-Hans"],
  ["zh-hans", "zh-Hans"],
  ["zh-hant", "zh-Hant"],
  ["pt", "pt-BR"],
  ["pt-br", "pt-BR"],
  ["id", "id"],
  ["en", "en"],
  ["es", "es"],
  ["fr", "fr"],
  ["de", "de"],
  ["ja", "ja"],
  ["ko", "ko"],
  ["ar", "ar"],
  ["tr", "tr"],
  ["ru", "ru"],
  ["vi", "vi"],
  ["it", "it"],
  ["ur", "ur"],
  ["uk", "uk"],
]);

const COUNTRY_PREFIXES = new Set(["br", "mx", "tw", "id", "vn", "hk", "eu", "uk", "us", "jp", "kr", "sg", "int"]);

const LOCALE_BY_COUNTRY_PREFIX = new Map([
  ["br", "pt-BR"],
  ["mx", "es"],
  ["tw", "zh-Hant"],
  ["id", "id"],
  ["vn", "vi"],
  ["hk", "zh-Hant"],
  ["jp", "ja"],
  ["kr", "ko"],
]);

export function safeClickPath(value) {
  if (typeof value !== "string") return null;
  const path = value.split(/[?#]/, 1)[0] || "/";
  if (path.startsWith("//") || /%40/i.test(path)) return null;
  try {
    if (decodeURIComponent(path).includes("@")) return null;
  } catch {
    return null;
  }
  return SAFE_PATH.test(path) ? path : null;
}

function pathFromRef(ref) {
  if (typeof ref !== "string" || !ref) return null;
  if (ref.startsWith("/")) return safeClickPath(ref);
  try {
    const u = new URL(ref);
    if (u.username || u.password) return null;
    if (!/(^|\.)nexualpha\.com$/i.test(u.hostname)) return null;
    return safeClickPath(u.pathname || "/");
  } catch {
    return null;
  }
}

function localeFromPath(path) {
  const [first, second] = String(path || "").split("/").filter(Boolean).map((part) => part.toLowerCase());
  if (!first) return "en";
  if (COUNTRY_PREFIXES.has(first)) return LOCALE_BY_PREFIX.get(second) || LOCALE_BY_COUNTRY_PREFIX.get(first) || "en";
  return LOCALE_BY_PREFIX.get(first) || "en";
}

function localeFromSrc(src) {
  if (typeof src !== "string") return null;
  const lower = src.toLowerCase();
  for (const [suffix, locale] of LOCALE_BY_SRC_SUFFIX) {
    if (lower === suffix || lower.endsWith(`-${suffix}`)) return locale;
  }
  return null;
}

function normalizeLocale(locale) {
  if (typeof locale !== "string" || !SAFE_LOCALE.test(locale)) return null;
  const lower = locale.toLowerCase();
  return LOCALE_BY_SRC_SUFFIX.get(lower) || LOCALE_BY_PREFIX.get(lower) || locale;
}

function normalizeCountry(country) {
  if (typeof country !== "string") return null;
  const upper = country.toUpperCase();
  return SAFE_COUNTRY.test(upper) ? upper : null;
}

export function clickMetadata({ path = null, ref = null, src = null, locale = null, country = null } = {}) {
  const pagePath = safeClickPath(path) || pathFromRef(ref);
  const normalizedLocale = normalizeLocale(locale) || (pagePath ? localeFromPath(pagePath) : null) || localeFromSrc(src);
  const normalizedCountry = normalizeCountry(country);
  return {
    path: pagePath,
    locale: normalizedLocale,
    country: normalizedCountry,
  };
}
