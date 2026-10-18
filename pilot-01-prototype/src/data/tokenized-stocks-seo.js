// Server-only (Worker head, /api/route-seo, seo-injection.js, sitemap): title, description and JSON-LD of the tokenized
// stocks hub (CollectionPage + ItemList of exchanges + FAQPage + BreadcrumbList), the ticker pages (WebPage + Dataset of
// the listing table + ItemList of listings + FAQPage with the page's own questions + BreadcrumbList) and the
// exchange-product pages (WebPage + ItemList of stocks + FAQPage + BreadcrumbList). The answer text, the FAQ and the meta
// description come from the same model as the visible page (tokenized-stocks-model.js), read from the same live table.
import { TS_COPY } from "./tokenized-stocks-copy.js";
import { TS_CHECKED, TS_PREIPO, TS_PUBLISHED } from "./tokenized-stocks-facts.js";
import { TS_INDEX_LOCALES, TS_ORIGIN, fillTs, tsList, tsVenues } from "./tokenized-stocks.js";
import { TS_EXCHANGE_SLUGS, TS_LAUNCH_SLUGS, TS_PATH, TS_TICKER_SLUGS, parseTokenizedStocksPath, tsExchangePath, tsTickerPath } from "./tokenized-stocks-routes.js";
import { exchangePageModel, tickerPageModel } from "./tokenized-stocks-model.js";
import { tsLive } from "./tokenized-stocks-rows.js";
import { titleBudgetForLocale } from "./meta-description.js";

const ORGANIZATION = Object.freeze({ "@type": "Organization", "@id": `${TS_ORIGIN}/#organization`, name: "NexuAlpha", url: `${TS_ORIGIN}/` });
const WEBSITE = Object.freeze({ "@type": "WebSite", "@id": `${TS_ORIGIN}/#website`, url: `${TS_ORIGIN}/`, name: "NexuAlpha" });
const DATASET_URL = `${TS_ORIGIN}/intel/tokenized-stocks.json`;

// Editions in the index: the hub and the twelve launch tickers in every written locale; the ticker pages added on
// 2026-10-18 and the exchange-product pages in the main markets only (quality first), rendered but noindex elsewhere.
export const TS_MAIN_LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "id", "tr", "ja", "ko", "vi"]);

export const tsContentLocale = (locale) => (TS_COPY[locale] ? locale : String(locale || "").startsWith("zh") ? "zh-Hans" : "en");
export const tsCopyFor = (locale) => TS_COPY[tsContentLocale(locale)];
const withoutKeys = (value, re) => (value && typeof value === "object" && !Array.isArray(value)
  ? Object.fromEntries(Object.entries(value).filter(([key]) => !re.test(key)).map(([key, v]) => [key, withoutKeys(v, re)])) : value);
/** The edition a page ships to the browser; Türkiye drops every Bitget-keyed entry (the text never names it already). */
export const tsCopyForPage = (locale, market) => (locale === "tr" || String(market || "").toUpperCase() === "TR" ? withoutKeys(tsCopyFor(locale), /bitget/i) : tsCopyFor(locale));
const copyFor = tsCopyFor;
const branded = (base, locale) => { const full = `${base} — NexuAlpha`; return full.length <= titleBudgetForLocale(locale) ? full : base; };

/** Written editions of a path that may be indexed (Türkiye never gets the Bitget page). */
export function tsPathLocales(pathname) {
  const route = parseTokenizedStocksPath(pathname);
  if (!route || route.kind === "missing") return [];
  const all = TS_INDEX_LOCALES.filter((locale) => TS_COPY[locale]);
  if (route.kind === "hub") return all;
  if (route.kind === "ticker" && TS_LAUNCH_SLUGS.includes(route.ticker.toLowerCase())) return all;
  const main = TS_MAIN_LOCALES.filter((locale) => TS_COPY[locale]);
  return route.kind === "exchange" && route.slug === "bitget" ? main.filter((locale) => locale !== "tr") : main;
}
export const tsIndexable = (locale, pathname = TS_PATH) => tsPathLocales(pathname).includes(locale);

export function tsMeta(pathname, locale, { market, live } = {}) {
  const route = parseTokenizedStocksPath(pathname);
  if (!route || route.kind === "missing") return null;
  const t = copyFor(locale);
  if (route.kind === "hub") return { title: branded(t.seoTitle, locale), description: t.seoDescription };
  if (route.kind === "exchange") {
    const model = exchangePageModel(route.slug, { locale, market, live, t });
    return { title: branded(model.title, locale), description: model.description };
  }
  const { sum, name } = tickerPageModel(route.ticker, { locale, market, live, t });
  const vars = { n: sum.names.length, name, ticker: route.ticker, list: tsList(sum.names, locale), lev: sum.maxLev || "" };
  const preipo = TS_PREIPO.has(route.ticker);
  return {
    title: branded(fillTs(preipo ? t.tk.preSeoTitle : t.tk.seoTitle, vars), locale),
    description: fillTs(preipo ? t.tk.preSeoDescription : t.tk.seoDescription, vars),
  };
}

const breadcrumb = (items) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })),
});
const faqPage = (id, inLanguage, items) => ({
  "@context": "https://schema.org", "@type": "FAQPage", "@id": id, inLanguage,
  mainEntity: items.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
});
const dayOf = (iso) => (Number.isFinite(Date.parse(iso)) ? new Date(Date.parse(iso) + 8 * 3600e3).toISOString().slice(0, 10) : TS_CHECKED);

export function tsSchemas(pathname, locale, { urlFor, market, live } = {}) {
  const route = parseTokenizedStocksPath(pathname);
  if (!route || route.kind === "missing") return [];
  const t = copyFor(locale);
  const inLanguage = tsContentLocale(locale);
  const meta = tsMeta(pathname, locale, { market, live });
  const hubUrl = urlFor(TS_PATH);
  const data = tsLive(live);
  const modified = dayOf(data.generatedAt);
  if (route.kind === "hub") {
    const venues = tsVenues(locale, market);
    return [
      {
        "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${hubUrl}#webpage`, url: hubUrl,
        name: meta.title.replace(/ — NexuAlpha$/, ""), description: meta.description, inLanguage,
        datePublished: TS_PUBLISHED, dateModified: modified > TS_CHECKED ? modified : TS_CHECKED, isPartOf: WEBSITE, publisher: ORGANIZATION,
        mainEntity: { "@id": `${hubUrl}#exchanges` },
      },
      {
        "@context": "https://schema.org", "@type": "ItemList", "@id": `${hubUrl}#exchanges`, name: t.tableH, numberOfItems: venues.length,
        itemListElement: venues.map((ex, index) => ({ "@type": "ListItem", position: index + 1, name: ex.name, url: TS_EXCHANGE_SLUGS.includes(ex.slug) ? urlFor(tsExchangePath(ex.slug)) : `${hubUrl}#ts-${ex.slug}` })),
      },
      faqPage(`${hubUrl}#faq`, inLanguage, t.faq),
      breadcrumb([["NexuAlpha", urlFor("/")], [t.breadcrumb, hubUrl]]),
    ];
  }
  if (route.kind === "exchange") {
    const pageUrl = urlFor(tsExchangePath(route.slug));
    const model = exchangePageModel(route.slug, { locale, market, live, t });
    return [
      {
        "@context": "https://schema.org", "@type": "WebPage", "@id": `${pageUrl}#webpage`, url: pageUrl,
        name: meta.title.replace(/ — NexuAlpha$/, ""), description: meta.description, inLanguage,
        datePublished: "2026-10-18", dateModified: modified, isPartOf: WEBSITE, publisher: ORGANIZATION,
        about: { "@type": "Organization", name: model.ex?.name || route.slug },
      },
      {
        "@context": "https://schema.org", "@type": "ItemList", "@id": `${pageUrl}#stocks`, name: fillTs(t.ex.tableH, { name: model.exName }), numberOfItems: model.tickers.length,
        itemListElement: model.tickers.map((row, index) => ({ "@type": "ListItem", position: index + 1, name: [row.ticker, row.spot?.sym, row.perp?.sym].filter(Boolean).join(" · "), url: urlFor(tsTickerPath(row.ticker)) })),
      },
      ...(model.faq.length ? [faqPage(`${pageUrl}#faq`, inLanguage, model.faq)] : []),
      breadcrumb([["NexuAlpha", urlFor("/")], [t.breadcrumb, hubUrl], [model.exName, pageUrl]]),
    ];
  }
  const pageUrl = urlFor(tsTickerPath(route.ticker));
  const model = tickerPageModel(route.ticker, { locale, market, live, t });
  const crumb = TS_PREIPO.has(route.ticker) ? model.name : route.ticker;
  return [
    {
      "@context": "https://schema.org", "@type": "WebPage", "@id": `${pageUrl}#webpage`, url: pageUrl,
      name: meta.title.replace(/ — NexuAlpha$/, ""), description: meta.description, inLanguage,
      datePublished: TS_LAUNCH_SLUGS.includes(route.ticker.toLowerCase()) ? TS_PUBLISHED : "2026-10-18", dateModified: modified,
      isPartOf: WEBSITE, publisher: ORGANIZATION, mainEntity: { "@id": `${pageUrl}#listings` },
    },
    {
      "@context": "https://schema.org", "@type": "Dataset", "@id": `${pageUrl}#dataset`, name: meta.title.replace(/ — NexuAlpha$/, ""),
      description: model.answer.join(" "), inLanguage, dateModified: data.generatedAt, creator: ORGANIZATION, isAccessibleForFree: true,
      license: `${TS_ORIGIN}/terms`, variableMeasured: ["symbol", "product", "max leverage", "maker fee", "taker fee", "trading hours", "dividends"],
      distribution: [{ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: DATASET_URL }],
    },
    {
      "@context": "https://schema.org", "@type": "ItemList", "@id": `${pageUrl}#listings`, name: fillTs(t.tickerH1, { name: model.name, ticker: route.ticker }), numberOfItems: model.rows.length,
      itemListElement: model.rows.map((row, index) => ({ "@type": "ListItem", position: index + 1, name: `${row.exchange.name} ${row.symbol} (${t.lanes[row.lane]})`, url: TS_EXCHANGE_SLUGS.includes(row.exchange.slug) ? urlFor(tsExchangePath(row.exchange.slug)) : `${hubUrl}#ts-${row.exchange.slug}` })),
    },
    faqPage(`${pageUrl}#faq`, inLanguage, model.faq),
    breadcrumb([["NexuAlpha", urlFor("/")], [t.breadcrumb, hubUrl], [crumb, pageUrl]]),
  ];
}

/** Head metadata for /tokenized-stocks paths ({ status: 404 } for unknown pages and Bitget in Türkiye), or null elsewhere. */
export function tokenizedStocksRouteSeo(pathname, locale, { urlFor, market, live } = {}) {
  const route = parseTokenizedStocksPath(pathname);
  if (!route) return null;
  if (route.kind === "missing") return { status: 404 };
  if (route.kind === "exchange" && route.slug === "bitget" && (locale === "tr" || String(market || "").toUpperCase() === "TR")) return { status: 404 };
  const meta = tsMeta(pathname, locale, { market, live });
  return { status: 200, title: meta.title, description: meta.description, indexable: tsIndexable(locale, pathname), alternatesLocales: tsPathLocales(pathname), schemas: tsSchemas(pathname, locale, { urlFor, market, live }) };
}

/** Every indexable URL with its hreflang set (sitemap). */
export function tokenizedStocksSitemapEntries({ urlFor }) {
  const lastmod = dayOf(tsLive().generatedAt);
  const paths = [TS_PATH, ...TS_TICKER_SLUGS.map((slug) => `${TS_PATH}/${slug}`), ...TS_EXCHANGE_SLUGS.map(tsExchangePath)];
  return paths.flatMap((pathname) => {
    const locales = tsPathLocales(pathname);
    const xDefault = locales.includes("en") ? "en" : locales[0];
    return locales.map((locale) => ({
      pathname, locale, loc: urlFor(pathname, locale),
      alternates: [...locales.map((hreflang) => ({ hreflang, href: urlFor(pathname, hreflang) })), { hreflang: "x-default", href: urlFor(pathname, xDefault) }],
      lastmod,
    }));
  });
}
