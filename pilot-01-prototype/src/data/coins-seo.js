// Server-only (Worker head, /api/route-seo, src/data/seo-injection.js, sitemap): titles, descriptions, robots and JSON-LD
// of the "Where to buy <coin>" pages. Indexing rules:
//   - /coins (hub): indexable in COIN_INDEX_LOCALES;
//   - /coins/<slug>: indexable in an index locale when at least one covered exchange lists the coin AND we have our
//     own description of the coin in that locale; otherwise noindex,follow (the page still renders and helps the reader).
import { COIN_DESCRIPTIONS as EN } from "./coin-content-en.js";
import { COIN_DESCRIPTIONS as ZH_HANS } from "./coin-content-zh-hans.js";
import { COIN_DESCRIPTIONS as ES } from "./coin-content-es.js";
import { COIN_DESCRIPTIONS as PT_BR } from "./coin-content-pt-br.js";
import { COIN_DESCRIPTIONS as FR } from "./coin-content-fr.js";
import { COIN_DESCRIPTIONS as DE } from "./coin-content-de.js";
import { COIN_DESCRIPTIONS as JA } from "./coin-content-ja.js";
import { COIN_DESCRIPTIONS as KO } from "./coin-content-ko.js";
import { COIN_DESCRIPTIONS as TR } from "./coin-content-tr.js";
import { COIN_DESCRIPTIONS as VI } from "./coin-content-vi.js";
import { COIN_DESCRIPTIONS as ID } from "./coin-content-id.js";
import {
  COINS, COINS_GENERATED_AT, COIN_INDEX_LOCALES, COINS_PATH, COIN_YEAR, coinAnswer, coinBySlug, coinCopy, coinFaq, coinPath,
  fill, isCoinListed, joinList, spotVenues, perpVenues,
} from "./coins.js";
import { parseCoinsPath } from "./coins-routes.js";
import { titleBudgetForLocale } from "./meta-description.js";
import { hreflangAlternates } from "./news-feed-client.js";

export const COIN_DESCRIPTIONS_BY_LOCALE = Object.freeze({ en: EN, "zh-Hans": ZH_HANS, es: ES, "pt-BR": PT_BR, fr: FR, de: DE, ja: JA, ko: KO, tr: TR, vi: VI, id: ID });
const ORGANIZATION = Object.freeze({ "@type": "Organization", "@id": "https://nexualpha.com/#organization", name: "NexuAlpha", url: "https://nexualpha.com/" });

/** Our description of the coin in this locale ({ text, locale }), falling back to English (then null). */
export function coinDescription(coin, locale) {
  const own = COIN_DESCRIPTIONS_BY_LOCALE[locale]?.[coin.id];
  if (own) return { text: own, locale };
  const en = EN[coin.id];
  return en ? { text: en, locale: "en" } : null;
}
export const coinHasDescription = (coin, locale) => Boolean(COIN_DESCRIPTIONS_BY_LOCALE[locale]?.[coin.id]);
export const coinIndexable = (coin, locale) => Boolean(coin) && COIN_INDEX_LOCALES.includes(locale) && isCoinListed(coin) && coinHasDescription(coin, locale);
/** Locales in which this coin's page is indexable (its hreflang set). */
export const coinIndexLocales = (coin) => COIN_INDEX_LOCALES.filter((locale) => coinIndexable(coin, locale));
export const coinsHubCount = () => COINS.length;

function fitTitle(candidates, locale) {
  const budget = titleBudgetForLocale(locale);
  return candidates.find((title) => title && title.length <= budget) || candidates[candidates.length - 1];
}
function clip(text, max = 160) {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20))}…`;
}

export function coinMeta(coin, locale) {
  const t = coinCopy(locale);
  const vars = { coin: coin.name, symbol: coin.symbol, year: COIN_YEAR };
  const listedOn = (spotVenues(coin, locale).length ? spotVenues(coin, locale) : perpVenues(coin, locale)).map((venue) => venue.name);
  // "OKX, Binance, Bybit and 5 more exchanges" (QA 2026-10-13: the old "... and 5 exchanges" read as a total).
  const venues = listedOn.length > 4
    ? fill(t.venuesMore || "{list} and {n} more exchanges", { list: listedOn.slice(0, 3).join(t.listJoin), n: listedOn.length - 3 })
    : joinList(listedOn, locale);
  return {
    title: fitTitle([`${fill(t.seoTitle, vars)}`, `${fill(t.seoTitleShort, vars)} — NexuAlpha`, fill(t.seoTitleShort, vars), `${coin.name} (${coin.symbol})`], locale),
    description: clip(isCoinListed(coin) ? fill(t.seoDescription, { ...vars, venues }) : fill(t.seoDescriptionNone, vars)),
  };
}
export function coinsHubMeta(locale) {
  const t = coinCopy(locale);
  const vars = { count: COINS.length };
  return {
    title: fitTitle([`${fill(t.hubSeoTitle, vars)} — NexuAlpha`, fill(t.hubSeoTitle, vars)], locale),
    description: clip(fill(t.hubSeoDescription, vars)),
  };
}

const crumbs = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })) });

export function coinSchemas(coin, locale, { urlFor }) {
  const t = coinCopy(locale);
  const url = urlFor(coinPath(coin.slug));
  const description = coinDescription(coin, locale);
  const faq = coinFaq(coin, locale, description?.locale === locale ? description.text : null);
  const meta = coinMeta(coin, locale);
  const h1 = fill(t.h1, { coin: coin.name, symbol: coin.symbol, year: COIN_YEAR });
  return [
    {
      "@context": "https://schema.org", "@type": "WebPage", "@id": `${url}#webpage`, url, name: h1, description: meta.description,
      inLanguage: locale, dateModified: String(COINS_GENERATED_AT || "").slice(0, 10) || undefined, publisher: ORGANIZATION,
      about: { "@type": "Thing", name: coin.name, alternateName: coin.symbol, ...(description ? { description: description.text } : {}) },
      mainEntity: { "@type": "ItemList", name: fill(t.tableTitle, { symbol: coin.symbol }), numberOfItems: coin.venues.length,
        itemListElement: coin.venues.map((venue, index) => ({ "@type": "ListItem", position: index + 1, name: venue.name, url: urlFor(`/exchanges/${venue.slug}`) })) },
    },
    ...(faq.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: locale, mainEntity: faq.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer } })) }] : []),
    crumbs([["NexuAlpha", urlFor("/")], [t.hubName, urlFor(COINS_PATH)], [`${coin.name} (${coin.symbol})`, url]]),
  ];
}

export function coinsHubSchemas(locale, { urlFor }) {
  const t = coinCopy(locale);
  const url = urlFor(COINS_PATH);
  const meta = coinsHubMeta(locale);
  return [
    { "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${url}#webpage`, url, name: meta.title.replace(/ — NexuAlpha$/, ""), description: meta.description, inLanguage: locale, publisher: ORGANIZATION,
      mainEntity: { "@type": "ItemList", numberOfItems: COINS.length, itemListElement: COINS.slice(0, 100).map((coin, index) => ({ "@type": "ListItem", position: index + 1, name: `${coin.name} (${coin.symbol})`, url: urlFor(coinPath(coin.slug)) })) } },
    crumbs([["NexuAlpha", urlFor("/")], [t.hubName, url]]),
  ];
}

/** Head metadata of a /coins path, or null when the path is not a coins route. */
export function coinsRouteSeo(pathname, locale, { urlFor }) {
  const route = parseCoinsPath(pathname);
  if (!route) return null;
  if (route.kind === "missing") return { status: 404 };
  if (route.kind === "hub") {
    const meta = coinsHubMeta(locale);
    return { status: 200, ...meta, indexable: COIN_INDEX_LOCALES.includes(locale), alternatesLocales: COIN_INDEX_LOCALES, schemas: coinsHubSchemas(locale, { urlFor }) };
  }
  const coin = coinBySlug(route.slug);
  if (!coin) return { status: 404 };
  const meta = coinMeta(coin, locale);
  return { status: 200, ...meta, indexable: coinIndexable(coin, locale), alternatesLocales: coinIndexLocales(coin), schemas: coinSchemas(coin, locale, { urlFor }) };
}

/** Every indexable coins URL with its hreflang set (sitemap-coins.xml). */
export function coinsSitemapEntries({ urlFor }) {
  const lastmod = String(COINS_GENERATED_AT || "").slice(0, 10);
  const entry = (pathname, locales) => locales.map((locale) => ({
    pathname, locale, loc: urlFor(pathname, locale), lastmod,
    alternates: hreflangAlternates(locales, (hreflang) => urlFor(pathname, hreflang)),
  }));
  return [
    ...entry(COINS_PATH, COIN_INDEX_LOCALES),
    ...COINS.flatMap((coin) => entry(coinPath(coin.slug), coinIndexLocales(coin))),
  ];
}

/** Indexed / noindex counts per index locale (reporting). */
export function coinsIndexReport() {
  return Object.fromEntries(COIN_INDEX_LOCALES.map((locale) => {
    const indexed = COINS.filter((coin) => coinIndexable(coin, locale)).length;
    return [locale, { indexed, noindex: COINS.length - indexed }];
  }));
}
export { coinAnswer };
