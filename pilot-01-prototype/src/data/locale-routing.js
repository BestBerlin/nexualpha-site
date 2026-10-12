import { canonicalComparePairSlug, parseComparePair } from "./compare-slug.js";

export const LOCALE_PREFIX_BY_CODE = Object.freeze({
  en: "",
  "zh-Hans": "zh-hans",
  "zh-Hant": "zh-hant",
  es: "es",
  "pt-BR": "pt-br",
  fr: "fr",
  de: "de",
  ja: "ja",
  ko: "ko",
  ar: "ar",
  tr: "tr",
  ru: "ru",
  id: "id-id",
  vi: "vi",
  it: "it",

  // l10n: needs native review
  ur: "ur",

  // l10n: needs native review
  uk: "uk-ua",
});

export const LOCALE_CODE_BY_PREFIX = Object.freeze(
  Object.fromEntries(
    Object.entries(LOCALE_PREFIX_BY_CODE)
      .filter(([, prefix]) => prefix)
      .map(([locale, prefix]) => [prefix, locale]),
  ),
);

export const MIGRATED_PATH_LOCALES = new Set(
  Object.keys(LOCALE_PREFIX_BY_CODE).filter((locale) => locale !== "en"),
);

export const COUNTRY_ROUTE_PREFIXES = Object.freeze([
  "/br",
  "/mx",
  "/tw",
  "/id",
  "/vn",
  "/hk",
  "/eu",
  "/uk",
  "/us",
  "/jp",
  "/kr",
  "/sg",
  "/int",
]);

const COUNTRY_LOCALE_BY_PREFIX = Object.freeze({
  "/br": "pt-BR",
  "/mx": "es",
  "/tw": "zh-Hant",
  "/id": "id",
  "/vn": "vi",
  "/hk": "zh-Hant",
  "/eu": "en",
  "/uk": "en",
  "/us": "en",
  "/jp": "ja",
  "/kr": "ko",
  "/sg": "en",
  "/int": "en",
});

const GLOBAL_ROUTE_PREFIXES = Object.freeze([
  "/exchanges",
  "/compare",
  "/topics",
  "/factbook",
  "/activities",
  "/news",
  "/markets",
  "/academy",
  "/coins",
  "/convert",
  "/glossary",
  "/flash",
]);

const GLOBAL_EXACT_ROUTES = new Set([
  "/",
  "/rates",
  "/onchain",
  "/methodology",
  "/about",
  "/editorial-policy",
  "/privacy", "/terms", "/contact",
  "/partners",
  "/telegram",
  "/liquidations",
  "/funding-rates",
]);

const NON_LOCALIZED_PREFIXES = Object.freeze([
  "/api",
  "/assets",
  "/brand",
  "/content",
  "/ref",
]);

const PRESERVED_REDIRECT_PARAMS = new Set([
  "market",
  "product",
  "account_stage",
  "funding",
  "publisher",
  "gclid",
  "fbclid",
  "msclkid",
]);

export const FRAGMENT_CONTEXT_KEYS = Object.freeze({
  market: "market",
  product: "product",
  platform: "platform",
  amount: "amount",
  spot_fee_bps: "spot_fee_bps",
  deposit_fee_pct: "deposit_fee_pct",
  deposit_fixed_brl: "deposit_fixed_brl",
  account_stage: "account_stage",
  accountStage: "account_stage",
  funding: "funding",
  basis: "basis",
  instrument: "instrument",
  order: "order",
  publisher: "publisher",
  scenario: "scenario",
  utm_source: "utm_source",
  utm_medium: "utm_medium",
  utm_campaign: "utm_campaign",
  venue: "venue",
  volume: "volume",
  locale: "locale",
  kyc: "kyc",
  usage_frequency: "usage_frequency",
  usage_scale: "usage_scale",
  return: "return",
});

function normalizePathname(pathname = "/") {
  const value = String(pathname || "/").split("#")[0].split("?")[0];
  if (!value || value === "/") return "/";
  return value.startsWith("/") ? value.replace(/\/+$/, "") || "/" : `/${value}`.replace(/\/+$/, "");
}

function hasPathPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function normalizeSearchParams(searchParams) {
  if (!searchParams) return new URLSearchParams();
  if (searchParams instanceof URLSearchParams) return new URLSearchParams(searchParams);
  if (typeof searchParams === "string") return new URLSearchParams(searchParams.startsWith("?") ? searchParams.slice(1) : searchParams);
  return new URLSearchParams(searchParams);
}

function isSupportedLocale(locale) {
  return Object.prototype.hasOwnProperty.call(LOCALE_PREFIX_BY_CODE, locale);
}

function normalizeLinkLocale(locale) {
  const value = String(locale || "en").trim();
  if (/^en(?:[-_][a-z]{2})?$/i.test(value)) return "en";
  return isSupportedLocale(value) ? value : "en";
}

function countryPrefixForPath(pathname) {
  return COUNTRY_ROUTE_PREFIXES.find((prefix) => hasPathPrefix(pathname, prefix)) || null;
}

function localePrefixForPath(pathname) {
  const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
  const locale = LOCALE_CODE_BY_PREFIX[firstSegment] || null;
  return locale ? { prefix: firstSegment, locale } : null;
}

function stripLocalePrefix(pathname, prefix) {
  const stripped = pathname.slice(prefix.length + 1);
  if (!stripped) return "/";
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

function appendLocaleQuery(pathname, locale) {
  if (!locale) return pathname;
  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}locale=${encodeURIComponent(locale)}`;
}

function canonicalContextValue(value) {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  if (!normalized || normalized.toLowerCase() === "unknown") return undefined;
  return normalized;
}

export function appendFragmentContextParams(href, context = {}) {
  const params = new URLSearchParams();
  for (const [inputKey, outputKey] of Object.entries(FRAGMENT_CONTEXT_KEYS)) {
    const value = canonicalContextValue(context[inputKey]);
    if (value) params.set(outputKey, value);
  }
  const serialized = params.toString();
  if (!serialized) return href;
  const [base, rawHash = ""] = String(href || "/").split("#");
  if (!rawHash) return `${base}#nxa-context?${serialized}`;
  const [target, existing = ""] = rawHash.split("?");
  const next = new URLSearchParams(existing);
  for (const [key, value] of params) next.set(key, value);
  return `${base}#${target || "nxa-context"}?${next.toString()}`;
}

function canonicalContentPathname(pathname) {
  const normalized = normalizePathname(pathname);
  const compareMatch = normalized.match(/^\/compare\/([^/]+)$/);
  if (!compareMatch) return normalized;
  const slugs = parseComparePair(compareMatch[1]);
  if (!slugs || slugs.length !== 2) return normalized;
  return `/compare/${canonicalComparePairSlug(slugs)}`;
}

export function isLocalePathEligible(pathname) {
  const normalized = normalizePathname(pathname);
  if (normalized === "/embed/calculator") return false;
  if (countryPrefixForPath(normalized)) return false;
  if (NON_LOCALIZED_PREFIXES.some((prefix) => hasPathPrefix(normalized, prefix))) return false;
  if (GLOBAL_EXACT_ROUTES.has(normalized)) return true;
  return GLOBAL_ROUTE_PREFIXES.some((prefix) => hasPathPrefix(normalized, prefix));
}

export function parsePublicRoute(pathname, searchParams) {
  const publicPathname = normalizePathname(pathname);
  const params = normalizeSearchParams(searchParams);
  const queryLocale = params.get("locale");
  const countryPrefix = countryPrefixForPath(publicPathname);
  const pathLocale = countryPrefix ? null : localePrefixForPath(publicPathname);

  if (pathLocale && MIGRATED_PATH_LOCALES.has(pathLocale.locale)) {
    const contentPathname = normalizePathname(stripLocalePrefix(publicPathname, pathLocale.prefix));
    if (!isLocalePathEligible(contentPathname)) {
      return {
        publicPathname,
        contentPathname: publicPathname,
        locale: "en",
        localeSource: "default",
        isCountryRoute: false,
        canonicalPathname: publicPathname,
      };
    }
    return {
      publicPathname,
      contentPathname,
      locale: pathLocale.locale,
      localeSource: "path",
      isCountryRoute: false,
      canonicalPathname: publicPathname,
    };
  }

  const isCountryRoute = Boolean(countryPrefix);
  if (queryLocale && isSupportedLocale(queryLocale)) {
    return {
      publicPathname,
      contentPathname: publicPathname,
      locale: queryLocale,
      localeSource: "query",
      isCountryRoute,
      canonicalPathname: publicPathname,
    };
  }

  if (countryPrefix) {
    return {
      publicPathname,
      contentPathname: publicPathname,
      locale: COUNTRY_LOCALE_BY_PREFIX[countryPrefix] || "en",
      localeSource: "market",
      isCountryRoute: true,
      canonicalPathname: publicPathname,
    };
  }

  return {
    publicPathname,
    contentPathname: publicPathname,
    locale: "en",
    localeSource: "default",
    isCountryRoute: false,
    canonicalPathname: publicPathname,
  };
}

export function localizedPath(pathname, locale = "en") {
  const normalized = normalizePathname(pathname);
  if (!isSupportedLocale(locale)) return normalized;
  const countryPrefix = countryPrefixForPath(normalized);
  if (countryPrefix) return locale === (COUNTRY_LOCALE_BY_PREFIX[countryPrefix] || "en") ? normalized : appendLocaleQuery(normalized, locale);
  if (locale === "en") {
    return normalized;
  }
  if (!isLocalePathEligible(normalized)) return appendLocaleQuery(normalized, locale);
  if (!MIGRATED_PATH_LOCALES.has(locale)) return appendLocaleQuery(normalized, locale);

  const prefix = LOCALE_PREFIX_BY_CODE[locale];
  return normalized === "/" ? `/${prefix}` : `/${prefix}${normalized}`;
}

export function localizedHref(href, { locale = "en", ...extra } = {}) {
  const rawHref = String(href || "/");
  const parsed = new URL(rawHref, "https://nexualpha.com");
  if (parsed.origin !== "https://nexualpha.com") return rawHref;
  const publicRoute = parsePublicRoute(parsed.pathname, parsed.searchParams);
  const targetLocale = normalizeLinkLocale(locale);
  const target = new URL(localizedPath(canonicalContentPathname(publicRoute.contentPathname), targetLocale), "https://nexualpha.com");
  const fragmentContext = {};
  if (extra.preserveQuery) {
    const params = new URLSearchParams(parsed.searchParams);
    params.delete("locale");
    Object.entries(extra).forEach(([key, value]) => {
      if (key === "preserveQuery") return;
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    });
    for (const [key, value] of params) target.searchParams.append(key, value);
  } else if (target.searchParams.has("locale")) {
    const displayLocale = target.searchParams.get("locale");
    target.searchParams.delete("locale");
    if (displayLocale) fragmentContext.locale = displayLocale;
  }
  if (!extra.preserveQuery) {
    for (const [key, value] of parsed.searchParams) {
      if (key === "locale") continue;
      if (Object.prototype.hasOwnProperty.call(FRAGMENT_CONTEXT_KEYS, key) && !(key in fragmentContext)) fragmentContext[key] = value;
    }
    for (const key of Object.keys(FRAGMENT_CONTEXT_KEYS)) {
      if (key in extra) fragmentContext[key] = extra[key];
    }
  }
  return appendFragmentContextParams(`${target.pathname}${target.search}${parsed.hash}`, fragmentContext);
}

export function localizedLanguageHref(href, { locale = "en" } = {}) {
  const parsed = new URL(String(href || "/"), "https://nexualpha.com");
  const route = parsePublicRoute(parsed.pathname, parsed.searchParams);
  if (route.isCountryRoute) {
    const prefix = countryPrefixForPath(route.contentPathname);
    const nativeLocale = COUNTRY_LOCALE_BY_PREFIX[prefix] || "en";
    if (normalizeLinkLocale(locale) !== nativeLocale) return localizedHref("/", { locale });
  }
  const context = Object.fromEntries(Object.keys(FRAGMENT_CONTEXT_KEYS)
    .filter((key) => key !== "locale" && parsed.searchParams.has(key))
    .map((key) => [key, parsed.searchParams.get(key)]));
  return localizedHref(href, { locale, ...context });
}

function preservedRedirectSearch(searchParams) {
  const next = new URLSearchParams();
  for (const [key, value] of searchParams) {
    if (key === "locale") continue;
    if (PRESERVED_REDIRECT_PARAMS.has(key) || key.startsWith("utm_")) {
      next.append(key, value);
    }
  }
  const serialized = next.toString();
  return serialized ? `?${serialized}` : "";
}

export function legacyLocaleRedirect(url) {
  const parsed = url instanceof URL ? new URL(url) : new URL(String(url), "https://nexualpha.com");
  const chinesePathMatch = String(parsed.pathname || "").match(/^\/(zh-cn)(\/.*)?$/i);
  if (chinesePathMatch) {
    const suffix = chinesePathMatch[2] || "/";
    const contentPathname = normalizePathname(suffix);
    if (contentPathname === "/" || isLocalePathEligible(contentPathname)) {
    const preserved = preservedRedirectSearch(parsed.searchParams);
      return `${localizedPath(contentPathname, "zh-Hans")}${preserved}`;
    }
  }
  const route = parsePublicRoute(parsed.pathname, parsed.searchParams);
  const queryLocale = parsed.searchParams.get("locale");

  if (route.localeSource === "path" && queryLocale) {
    return `${route.canonicalPathname}${preservedRedirectSearch(parsed.searchParams)}`;
  }

  if (queryLocale && queryLocale !== "pt-BR" && hasPathPrefix(route.contentPathname, "/br")) {
    return `${route.contentPathname}${preservedRedirectSearch(parsed.searchParams)}`;
  }

  if (!queryLocale || !isSupportedLocale(queryLocale)) return null;
  if (queryLocale === "en" && isLocalePathEligible(route.contentPathname)) {
    return `${route.contentPathname}${preservedRedirectSearch(parsed.searchParams)}`;
  }
  if (!MIGRATED_PATH_LOCALES.has(queryLocale)) return null;
  if (!isLocalePathEligible(route.contentPathname)) return null;

  return `${localizedPath(route.contentPathname, queryLocale)}${preservedRedirectSearch(parsed.searchParams)}`;
}
