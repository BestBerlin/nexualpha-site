// Server-only (Worker head, /api/route-seo, seo-injection.js, sitemap): title, description and JSON-LD of the tokenized
// stocks hub (CollectionPage + ItemList of exchanges + FAQPage + BreadcrumbList) and of the ticker pages (WebPage +
// ItemList of listings + FAQPage with the page's short answer + BreadcrumbList).
import { TS_COPY } from "./tokenized-stocks-copy.js";
import { TS_CHECKED, TS_PUBLISHED, tsListings } from "./tokenized-stocks-facts.js";
import { TS_INDEX_LOCALES, TS_ORIGIN, fillTs, tsList, tsVenues } from "./tokenized-stocks.js";
import { TS_PATH, TS_TICKER_SLUGS, parseTokenizedStocksPath, tsTickerPath } from "./tokenized-stocks-routes.js";
import { titleBudgetForLocale } from "./meta-description.js";

const ORGANIZATION = Object.freeze({ "@type": "Organization", "@id": `${TS_ORIGIN}/#organization`, name: "NexuAlpha", url: `${TS_ORIGIN}/` });
const WEBSITE = Object.freeze({ "@type": "WebSite", "@id": `${TS_ORIGIN}/#website`, url: `${TS_ORIGIN}/`, name: "NexuAlpha" });

export const tsContentLocale = (locale) => (TS_COPY[locale] ? locale : String(locale || "").startsWith("zh") ? "zh-Hans" : "en");
const copyFor = (locale) => TS_COPY[tsContentLocale(locale)];
export const tsIndexable = (locale) => TS_INDEX_LOCALES.includes(locale) && Boolean(TS_COPY[locale]);
const branded = (base, locale) => { const full = `${base} — NexuAlpha`; return full.length <= titleBudgetForLocale(locale) ? full : base; };

function tickerFacts(ticker, locale, market) {
  const t = copyFor(locale);
  const slugs = new Set(tsVenues(locale, market).map((ex) => ex.slug));
  const rows = tsListings(ticker).filter((row) => slugs.has(row.exchange.slug));
  const names = [...new Set(rows.map((row) => row.exchange.name))];
  const name = t.names[ticker] || ticker;
  return { t, rows, names, name, answer: fillTs(t.tickerAnswer, { n: names.length, ticker, list: tsList(names, locale) }) };
}

export function tsMeta(pathname, locale, { market } = {}) {
  const route = parseTokenizedStocksPath(pathname);
  if (!route || route.kind === "missing") return null;
  const t = copyFor(locale);
  if (route.kind === "hub") return { title: branded(t.seoTitle, locale), description: t.seoDescription };
  const { names, name } = tickerFacts(route.ticker, locale, market);
  return {
    title: branded(fillTs(t.tickerSeoTitle, { name, ticker: route.ticker }), locale),
    description: fillTs(t.tickerSeoDescription, { n: names.length, name, ticker: route.ticker, list: tsList(names, locale) }),
  };
}

const breadcrumb = (items) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })),
});

export function tsSchemas(pathname, locale, { urlFor, market } = {}) {
  const route = parseTokenizedStocksPath(pathname);
  if (!route || route.kind === "missing") return [];
  const t = copyFor(locale);
  const inLanguage = tsContentLocale(locale);
  const meta = tsMeta(pathname, locale, { market });
  const hubUrl = urlFor(TS_PATH);
  if (route.kind === "hub") {
    const venues = tsVenues(locale, market);
    return [
      {
        "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${hubUrl}#webpage`, url: hubUrl,
        name: meta.title.replace(/ — NexuAlpha$/, ""), description: meta.description, inLanguage,
        datePublished: TS_PUBLISHED, dateModified: TS_CHECKED, isPartOf: WEBSITE, publisher: ORGANIZATION,
        mainEntity: { "@id": `${hubUrl}#exchanges` },
      },
      {
        "@context": "https://schema.org", "@type": "ItemList", "@id": `${hubUrl}#exchanges`, name: t.tableH, numberOfItems: venues.length,
        itemListElement: venues.map((ex, index) => ({ "@type": "ListItem", position: index + 1, name: ex.name, url: `${hubUrl}#ts-${ex.slug}` })),
      },
      {
        "@context": "https://schema.org", "@type": "FAQPage", "@id": `${hubUrl}#faq`, inLanguage,
        mainEntity: t.faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
      },
      breadcrumb([["NexuAlpha", urlFor("/")], [t.breadcrumb, hubUrl]]),
    ];
  }
  const pageUrl = urlFor(tsTickerPath(route.ticker));
  const { rows, name, answer } = tickerFacts(route.ticker, locale, market);
  const question = fillTs(t.tickerH1, { name, ticker: route.ticker });
  return [
    {
      "@context": "https://schema.org", "@type": "WebPage", "@id": `${pageUrl}#webpage`, url: pageUrl,
      name: meta.title.replace(/ — NexuAlpha$/, ""), description: meta.description, inLanguage,
      datePublished: TS_PUBLISHED, dateModified: TS_CHECKED, isPartOf: WEBSITE, publisher: ORGANIZATION,
    },
    {
      "@context": "https://schema.org", "@type": "ItemList", "@id": `${pageUrl}#listings`, name: question, numberOfItems: rows.length,
      itemListElement: rows.map((row, index) => ({ "@type": "ListItem", position: index + 1, name: `${row.exchange.name} ${row.symbol} (${t.lanes[row.lane]})`, url: `${hubUrl}#ts-${row.exchange.slug}` })),
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage", "@id": `${pageUrl}#faq`, inLanguage,
      mainEntity: [{ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } }],
    },
    breadcrumb([["NexuAlpha", urlFor("/")], [t.breadcrumb, hubUrl], [route.ticker, pageUrl]]),
  ];
}

/** Head metadata for /tokenized-stocks paths ({ status: 404 } for unknown tickers), or null elsewhere. */
export function tokenizedStocksRouteSeo(pathname, locale, { urlFor, market } = {}) {
  const route = parseTokenizedStocksPath(pathname);
  if (!route) return null;
  if (route.kind === "missing") return { status: 404 };
  const meta = tsMeta(pathname, locale, { market });
  return { status: 200, title: meta.title, description: meta.description, indexable: tsIndexable(locale), alternatesLocales: TS_INDEX_LOCALES, schemas: tsSchemas(pathname, locale, { urlFor, market }) };
}

/** Every indexable URL with its hreflang set (sitemap). */
export function tokenizedStocksSitemapEntries({ urlFor }) {
  const locales = TS_INDEX_LOCALES.filter((locale) => TS_COPY[locale]);
  const paths = [TS_PATH, ...TS_TICKER_SLUGS.map((slug) => `${TS_PATH}/${slug}`)];
  return paths.flatMap((pathname) => locales.map((locale) => ({
    pathname, locale, loc: urlFor(pathname, locale),
    alternates: [...locales.map((hreflang) => ({ hreflang, href: urlFor(pathname, hreflang) })), { hreflang: "x-default", href: urlFor(pathname, "en") }],
    lastmod: TS_CHECKED,
  })));
}
