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

// Header signals are coarse and spoofable; never persist raw UA or network identifiers.
export const CLICK_BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|discord|curl|wget|python|node-fetch|headless|lighthouse/i;
const INAPP_UAS = [
  ['telegram', /telegram/i], ['x', /(?:Twitter(?:Android| for iPhone| for iPad)?|\bXAndroid\b|\bX for iPhone\b)/i],
  ['youtube', /youtube/i], ['wechat', /micromessenger/i],
  ['instagram', /instagram/i], ['tiktok', /tiktok|musical_ly|bytedancewebview|trill/i],
];

// Burst detector (2026-10-21: one headless browser clicked every sign-up button on the home page 1,590 times in
// three hours and every row was classed "human" because Sec-Fetch headers are trivial to send). A client address
// that records more than `limit` clicks inside `windowMs` is classed "burst" from then on in that window; a real
// visitor compares a few venues, not forty. Memory is bounded: idle addresses are dropped on the next sweep.
export function createBurstDetector({ limit = 12, windowMs = 10 * 60 * 1000, now = Date.now, maxKeys = 10000 } = {}) {
  const windows = new Map();
  return function burst(key) {
    if (!key) return false;
    const t = now();
    if (windows.size >= maxKeys) for (const [k, w] of windows) if (w.resetAt <= t) windows.delete(k);
    const w = windows.get(key);
    if (!w || w.resetAt <= t) { windows.set(key, { count: 1, resetAt: t + windowMs }); return false; }
    w.count += 1;
    return w.count > limit;
  };
}

export function clickRequestMetadata(request, { burst = false } = {}) {
  const header = name => request.headers.get(name) || '';
  const ua = header('user-agent');
  const inapp = INAPP_UAS.find(([, pattern]) => pattern.test(ua))?.[0] || 'none';
  let cls = 'unknown';
  if (request.method === 'HEAD' || CLICK_BOT_UA.test(ua)) cls = 'bot';
  else if (burst) cls = 'burst';
  else if (/prefetch|prerender/i.test(`${header('purpose')} ${header('sec-purpose')} ${header('x-moz')}`)) cls = 'prefetch';
  else if (request.method === 'GET' && (inapp !== 'none' ||
    (header('sec-fetch-dest').toLowerCase() === 'document' && header('sec-fetch-mode').toLowerCase() === 'navigate'))) cls = 'human';
  return { cls, inapp };
}
