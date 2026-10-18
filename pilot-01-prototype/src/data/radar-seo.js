import { WHALE_COINS, whaleCoinPath, coinForWhalePath, whaleRowCoin } from "./whale-routes.js";
import { LONG_SHORT_PATH, RADAR_LOCALES, WHALES_PATH, radarCopy, normalizeWhales } from "./radar.js";
import { whaleExplorerHref, whaleSentence, whalesCopy } from "./whales-home.js";
import { localizedPath } from "./locale-routing.js";

const PUBLIC_ORIGIN = "https://nexualpha.com";

export const RADAR_PATHS = Object.freeze([LONG_SHORT_PATH, WHALES_PATH, ...WHALE_COINS.map(whaleCoinPath)]);
export const LONG_SHORT_INDEX_LOCALES = Object.freeze(RADAR_LOCALES.filter((locale) => !["ur", "uk"].includes(locale)));
export const WHALES_INDEX_LOCALES = RADAR_LOCALES;
export const RADAR_INDEX_LOCALES = LONG_SHORT_INDEX_LOCALES;

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
  const coin = coinForWhalePath(pathname);
  if (coin) return { kind: "whales", path: pathname, coin };
  return null;
}

function pageCopy(kind, locale, coin) {
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
    title: coin ? `${coin} ${whalesCopy(locale).title} — NexuAlpha` : resolvedWhalesTitle(locale),
    headline: coin ? `${coin} ${whalesCopy(locale).title}` : whalesCopy(locale).title,
    description: `${coin ? `${coin} · ` : ""}${whalesCopy(locale).tabs.signals} · Hyperliquid · ${whalesCopy(locale).tabs.positions} · ${whalesCopy(locale).tabs.transfers}`,
    section: whalesCopy(locale).title,
    relatedLabel: copy.longShortTitle,
    relatedPath: LONG_SHORT_PATH,
    about: ["smart-money accumulation", "Hyperliquid whale positions", "public-chain whale transfer monitoring", "exchange address labels"],
    isBasedOn: [],
  };
}

function resolvedWhalesTitle(locale) {
  if (locale === "zh-Hans") return "巨鲸动向：Hyperliquid 巨鲸持仓与大额转账实时追踪 — NexuAlpha";
  if (locale === "zh-Hant") return "巨鯨動向：Hyperliquid 巨鯨持倉與大額轉帳即時追蹤 — NexuAlpha";
  return `${whalesCopy(locale).title} · Hyperliquid — NexuAlpha`;
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
    publisher: { "@type": "Organization", "@id": `${PUBLIC_ORIGIN}/#organization`, name: "NexuAlpha", url: PUBLIC_ORIGIN },
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

function whalesDatasetSchema(copy, canonicalUrl, locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: copy.headline,
    description: copy.description,
    url: canonicalUrl,
    inLanguage: schemaLocale(locale),
    isAccessibleForFree: true,
    creator: { "@type": "Organization", "@id": `${PUBLIC_ORIGIN}/#organization`, name: "NexuAlpha", url: PUBLIC_ORIGIN },
    variableMeasured: ["accumulation signal", "position notional", "transfer amount"],
  };
}

function whalesItemListSchema(copy, canonicalUrl, locale, snapshot, coin) {
  const rows = normalizeWhales(snapshot).rows.filter((row) => !coin || whaleRowCoin(row) === coin).slice(0, 50);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: copy.headline,
    url: canonicalUrl,
    inLanguage: schemaLocale(locale),
    numberOfItems: rows.length,
    itemListElement: rows.map((row, index) => ({
      "@type": "ListItem", position: index + 1,
      name: whaleSentence(row, locale),
      url: whaleExplorerHref(row) || canonicalUrl,
    })),
  };
}

export function radarRouteSeo(pathname, locale = "en", options = {}) {
  const route = parseRadarPath(pathname);
  if (!route) return null;
  const resolvedLocale = RADAR_LOCALES.includes(locale) ? locale : "en";
  const copy = pageCopy(route.kind, resolvedLocale, route.coin);
  const indexLocales = route.kind === "whales" ? WHALES_INDEX_LOCALES : LONG_SHORT_INDEX_LOCALES;
  const indexable = indexLocales.includes(resolvedLocale);
  const urlFor = typeof options.urlFor === "function" ? options.urlFor : (path) => publicUrl(path, resolvedLocale);
  const canonical = urlFor(route.path);
  return {
    status: 200,
    kind: route.kind,
    title: copy.title,
    description: copy.description,
    indexable,
    alternatesLocales: indexable ? indexLocales : [],
    schemas: [
      breadcrumbs(copy, canonical, resolvedLocale),
      webPageSchema(copy, canonical, resolvedLocale),
      ...(route.kind === "whales" ? [whalesDatasetSchema(copy, canonical, resolvedLocale), whalesItemListSchema(copy, canonical, resolvedLocale, options.snapshot, route.coin)] : []),
    ],
  };
}
