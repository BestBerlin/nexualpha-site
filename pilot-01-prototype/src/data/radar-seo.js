import { LONG_SHORT_PATH, RADAR_LOCALES, WHALES_PATH, radarCopy } from "./radar.js";
import { localizedPath } from "./locale-routing.js";

const PUBLIC_ORIGIN = "https://nexualpha.com";

export const RADAR_PATHS = Object.freeze([LONG_SHORT_PATH, WHALES_PATH]);
export const RADAR_INDEX_LOCALES = Object.freeze(RADAR_LOCALES.filter(locale => !["ur", "uk"].includes(locale)));

const LONG_SHORT_SOURCE_URLS = Object.freeze([
  "https://fapi.binance.com/futures/data/globalLongShortAccountRatio",
  "https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio",
  "https://api.bybit.com/v5/market/account-ratio",
]);

function schemaLocale(locale) {
  return RADAR_LOCALES.includes(locale) ? locale : "en";
}

function publicUrl(pathname, locale) {
  return `${PUBLIC_ORIGIN}${localizedPath(pathname, locale)}`;
}

export function parseRadarPath(pathname) {
  if (pathname === LONG_SHORT_PATH) return { kind: "long-short", path: LONG_SHORT_PATH };
  if (pathname === WHALES_PATH) return { kind: "whales", path: WHALES_PATH };
  return null;
}

function pageCopy(kind, locale) {
  const copy = radarCopy(locale);
  if (kind === "long-short") {
    return {
      title: `${copy.longShortTitle} — NexuAlpha`,
      headline: copy.longShortTitle,
      description: `${copy.longShortLead} ${copy.longShortSummary}`,
      section: copy.longShortTitle,
      relatedLabel: copy.whalesTitle,
      relatedPath: WHALES_PATH,
      about: ["perpetual futures long short ratio", "open interest", "top trader positioning"],
      isBasedOn: LONG_SHORT_SOURCE_URLS,
    };
  }
  return {
    title: `${copy.whalesTitle} — NexuAlpha`,
    headline: copy.whalesTitle,
    description: `${copy.whalesLead} ${copy.whalesSummary}`,
    section: copy.whalesTitle,
    relatedLabel: copy.longShortTitle,
    relatedPath: LONG_SHORT_PATH,
    about: ["public-chain whale transfer monitoring", "exchange address labels", "stablecoin and BTC transfer direction"],
    isBasedOn: [],
  };
}

function breadcrumbs(copy, canonicalUrl, locale) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "NexuAlpha", item: publicUrl("/", locale) },
      { "@type": "ListItem", position: 2, name: copy.section, item: canonicalUrl },
    ],
  };
}

function webPageSchema(copy, canonicalUrl, locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: copy.title,
    headline: copy.headline,
    description: copy.description,
    url: canonicalUrl,
    inLanguage: schemaLocale(locale),
    isAccessibleForFree: true,
    publisher: { "@type": "Organization", name: "NexuAlpha", url: PUBLIC_ORIGIN },
    about: copy.about,
    ...(copy.isBasedOn.length ? { isBasedOn: copy.isBasedOn } : {}),
    relatedLink: [
      publicUrl("/flash", locale),
      publicUrl(copy.relatedPath, locale),
      publicUrl("/coins/bitcoin", locale),
      publicUrl("/funding-rates", locale),
      publicUrl("/liquidations", locale),
    ],
  };
}

export function radarRouteSeo(pathname, locale = "en", options = {}) {
  const route = parseRadarPath(pathname);
  if (!route) return null;
  const resolvedLocale = RADAR_LOCALES.includes(locale) ? locale : "en";
  const copy = pageCopy(route.kind, resolvedLocale);
  const urlFor = typeof options.urlFor === "function" ? options.urlFor : (path) => publicUrl(path, resolvedLocale);
  const canonical = urlFor(route.path);
  return {
    status: 200,
    kind: route.kind,
    title: copy.title,
    description: copy.description,
    indexable: RADAR_INDEX_LOCALES.includes(resolvedLocale),
    alternatesLocales: RADAR_INDEX_LOCALES.includes(resolvedLocale) ? RADAR_INDEX_LOCALES : [],
    schemas: [
      breadcrumbs(copy, canonical, resolvedLocale),
      webPageSchema(copy, canonical, resolvedLocale),
    ],
  };
}
