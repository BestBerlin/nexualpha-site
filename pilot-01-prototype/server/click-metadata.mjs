import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { AUTOMATED_ANALYTICS_UA, isAutomatedAnalyticsRequest } from './analytics-bots.mjs';

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

// Header signals are coarse and spoofable: "human" is a filtered click, not a verified person or signup.
export const CLICK_BOT_UA = new RegExp(`${AUTOMATED_ANALYTICS_UA.source}|Go-http-client|Discord`, 'i');
const INAPP_UAS = [
  ['telegram', /telegram/i], ['x', /(?:Twitter(?:Android| for iPhone| for iPad)?|\bXAndroid\b|\bX for iPhone\b)/i],
  ['youtube', /youtube/i], ['wechat', /micromessenger/i],
  ['instagram', /instagram/i], ['tiktok', /tiktok|musical_ly|bytedancewebview|trill/i],
];
const processHashSecret = randomBytes(32);
const list = value => String(value || '').split(',').map(x => x.trim()).filter(Boolean);

function normalizedIp(value) {
  if (typeof value !== 'string') return null;
  const ip = value.trim().replace(/^::ffff:(?=\d+\.)/i, '');
  if (!isIP(ip)) return null;
  // Canonicalize equivalent IPv6 spellings; never read client-controlled forwarding headers here.
  if (isIP(ip) === 4) return ip;
  try { return new URL(`http://[${ip}]/`).hostname.slice(1, -1); } catch { return null; }
}

export function clickIpHash(clientIp, date = new Date(), secret = processHashSecret) {
  const ip = normalizedIp(clientIp);
  if (!ip) return null;
  const day = date.toISOString().slice(0, 10);
  const dailySalt = createHmac('sha256', secret).update(`nexualpha-click:${day}`).digest();
  return createHmac('sha256', dailySalt).update(ip).digest('hex');
}

function matchesSecret(value, expected) {
  if (!value || !expected) return false;
  const a = Buffer.from(value), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isInternalClickRequest(request, { env = process.env, clientIp } = {}) {
  if (/NexuAlpha-internal\//i.test(request.headers.get('user-agent') || '')) return true;
  const ip = normalizedIp(clientIp);
  const ownIp = Boolean(ip && list(env.CLICK_INTERNAL_IPS).some(value => normalizedIp(value) === ip));
  // Header value may be "1" on an allowlisted address, or the private shared token. Never trust XFF here.
  const marker = request.headers.get('x-nexualpha-internal');
  return ownIp || matchesSecret(marker, env.CLICK_INTERNAL_TOKEN);
}

function uaFamily(ua, inapp) {
  if (CLICK_BOT_UA.test(ua)) return 'bot';
  if (inapp !== 'none') return inapp;
  for (const [family, pattern] of [['edge', /Edg(?:e|A|iOS)?\//i], ['opera', /OPR\//i],
    ['firefox', /Firefox\/|FxiOS\//i], ['chrome', /Chrome\/|CriOS\//i], ['safari', /Safari\//i]]) {
    if (pattern.test(ua)) return family;
  }
  return ua ? 'other' : 'unknown';
}

// Bounded per-process counters. Eviction may reset classification; the report still deduplicates daily hashes.
export function createBurstDetector({ limit = 12, windowMs = 10 * 60 * 1000, now = Date.now, maxKeys = 10000 } = {}) {
  const windows = new Map();
  return function burst(key) {
    if (!key) return false;
    const t = now();
    if (windows.size >= maxKeys) for (const [k, w] of windows) if (w.resetAt <= t) windows.delete(k);
    const w = windows.get(key);
    if (!w || w.resetAt <= t) {
      if (windows.size >= maxKeys && !windows.has(key)) windows.delete(windows.keys().next().value);
      windows.set(key, { count: 1, resetAt: t + windowMs });
      return false;
    }
    w.count += 1;
    return w.count > limit;
  };
}

export function clickRequestMetadata(request, { env = process.env, clientIp, ipHash = null, burst = false, duplicate = false } = {}) {
  const header = name => request.headers.get(name) || '';
  const ua = header('user-agent');
  const inapp = INAPP_UAS.find(([, pattern]) => pattern.test(ua))?.[0] || 'none';
  let cls;
  if (isInternalClickRequest(request, { env, clientIp })) cls = 'internal';
  else if (request.method === 'HEAD' || CLICK_BOT_UA.test(ua) || isAutomatedAnalyticsRequest(request, { env, clientIp }) ||
    /prefetch|prerender/i.test(`${header('purpose')} ${header('sec-purpose')} ${header('x-moz')}`)) cls = 'bot';
  else if (burst) cls = 'burst';
  else if (duplicate) cls = 'duplicate';
  else cls = ipHash && ua ? 'human' : 'unknown';
  const metadata = { cls, inapp, uaFamily: uaFamily(ua, inapp), ipHash };
  if (request.method === 'GET') {
    let hasReferrerOrigin = false;
    try { hasReferrerOrigin = /^https?:$/.test(new URL(header('referer')).protocol); } catch { /* no valid origin */ }
    Object.assign(metadata, {
      hasFetchSite: Boolean(header('sec-fetch-site')),
      hasFetchUser: header('sec-fetch-user') === '?1',
      hasReferrerOrigin,
    });
  }
  return metadata;
}

// Inject the SAME classifier into /go and /api/cta-click so beacons and redirects share burst/dedup state.
export function createClickWindowClassifier({ now = Date.now, burst = createBurstDetector({ now }),
  duplicateMs = 30 * 60 * 1000, maxKeys = 10000 } = {}) {
  const recent = new Map();
  return (key, t = now()) => {
    if (recent.size >= maxKeys) for (const [k, time] of recent) if (t - time >= duplicateMs) recent.delete(k);
    const previous = recent.get(key);
    const duplicate = previous !== undefined && t >= previous && t - previous < duplicateMs;
    if (recent.size >= maxKeys && !recent.has(key)) recent.delete(recent.keys().next().value);
    recent.set(key, t);
    return burst(key) ? 'burst' : duplicate ? 'duplicate' : 'human';
  };
}

export function createClickClassifier({ env = process.env, now = Date.now, burst,
  duplicateMs, maxKeys, classifyHuman } = {}) {
  const classifyWindow = classifyHuman || createClickWindowClassifier({ now, burst, duplicateMs, maxKeys });
  const stableSecret = typeof env.CLICK_HASH_SECRET === 'string' && Boolean(env.CLICK_HASH_SECRET.trim());
  const secret = stableSecret ? env.CLICK_HASH_SECRET : processHashSecret;
  return (request, { clientIp, partner, at = new Date(now()) } = {}) => {
    const ipHash = clickIpHash(clientIp, at, secret);
    const base = clickRequestMetadata(request, { env, clientIp, ipHash });
    if (base.cls !== 'human') return base; // internal/bot requests cannot poison a visitor's counters
    // Process-only hashes cannot support reliable daily uniqueness across restarts. Fail closed.
    if (!stableSecret) return { ...base, cls: 'unknown' };
    const key = `${ipHash}:${partner}`;
    const result = classifyWindow(key, at.getTime());
    // IPC failures cannot turn an unclassified event into a human click or break a redirect.
    if (result?.then) return result.then(cls => ({ ...base, cls }), () => ({ ...base, cls: 'unknown' }));
    return { ...base, cls: result };
  };
}
