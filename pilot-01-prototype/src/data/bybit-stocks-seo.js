// Server-only (Worker head, /api/route-seo, src/data/seo-injection.js, sitemap): title, description and JSON-LD of the
// Bybit Stocks campaign page. WebPage + FAQPage (the page's own questions) + BreadcrumbList.
import { BYBIT_STOCKS_COPY } from "./bybit-stocks-copy.js";
import {
  BYBIT_STOCKS_CHECKED, BYBIT_STOCKS_INDEX_LOCALES, BYBIT_STOCKS_ORIGIN, BYBIT_STOCKS_PATH, BYBIT_STOCKS_PUBLISHED,
  bybitStocksInviteCode, parseBybitStocksPath,
} from "./bybit-stocks.js";
import { titleBudgetForLocale } from "./meta-description.js";

const ORGANIZATION = Object.freeze({ "@type": "Organization", "@id": `${BYBIT_STOCKS_ORIGIN}/#organization`, name: "NexuAlpha", url: `${BYBIT_STOCKS_ORIGIN}/` });

/** Written edition of the page for this locale (other UI locales read English). */
export const bybitStocksContentLocale = (locale) => (BYBIT_STOCKS_COPY[locale] ? locale : "en");
export function bybitStocksCopy(locale) {
  return BYBIT_STOCKS_COPY[bybitStocksContentLocale(locale)] || BYBIT_STOCKS_COPY.en;
}
export const bybitStocksIndexable = (locale) => BYBIT_STOCKS_INDEX_LOCALES.includes(locale) && Boolean(BYBIT_STOCKS_COPY[locale]);

export function bybitStocksMeta(locale, { market } = {}) {
  const t = bybitStocksCopy(locale);
  const code = bybitStocksInviteCode({ locale, market });
  const base = code ? String(t.seoTitle).replace("{code}", code) : t.seoTitleNeutral;
  const budget = titleBudgetForLocale(locale);
  const branded = `${base} — NexuAlpha`;
  return {
    title: branded.length <= budget ? branded : base,
    description: code ? t.seoDescription : t.seoDescriptionNeutral,
  };
}

export function bybitStocksSchemas(locale, { urlFor, market } = {}) {
  const t = bybitStocksCopy(locale);
  const pageUrl = urlFor(BYBIT_STOCKS_PATH);
  const meta = bybitStocksMeta(locale, { market });
  const inLanguage = bybitStocksContentLocale(locale);
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: meta.title.replace(/ — NexuAlpha$/, ""),
      description: meta.description,
      inLanguage,
      datePublished: BYBIT_STOCKS_PUBLISHED,
      dateModified: BYBIT_STOCKS_CHECKED,
      isPartOf: { "@type": "WebSite", "@id": `${BYBIT_STOCKS_ORIGIN}/#website`, url: `${BYBIT_STOCKS_ORIGIN}/`, name: "NexuAlpha" },
      publisher: ORGANIZATION,
      about: { "@type": "Organization", name: "Bybit", url: "https://www.bybit.com" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      inLanguage,
      mainEntity: t.faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [["NexuAlpha", urlFor("/")], [t.breadcrumb, urlFor("/activities")], ["Bybit Stocks", pageUrl]]
        .map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })),
    },
  ];
}

/** Head metadata for the campaign path, or null elsewhere. */
export function bybitStocksRouteSeo(pathname, locale, { urlFor, market } = {}) {
  if (!parseBybitStocksPath(pathname)) return null;
  const meta = bybitStocksMeta(locale, { market });
  return {
    status: 200,
    title: meta.title,
    description: meta.description,
    indexable: bybitStocksIndexable(locale),
    schemas: bybitStocksSchemas(locale, { urlFor, market }),
  };
}

/** Indexable URLs with their hreflang set (sitemap-campaigns.xml). */
export function bybitStocksSitemapEntries({ urlFor }) {
  const locales = BYBIT_STOCKS_INDEX_LOCALES.filter((locale) => BYBIT_STOCKS_COPY[locale]);
  return locales.map((locale) => ({
    pathname: BYBIT_STOCKS_PATH, locale, loc: urlFor(BYBIT_STOCKS_PATH, locale),
    alternates: [...locales.map((hreflang) => ({ hreflang, href: urlFor(BYBIT_STOCKS_PATH, hreflang) })), { hreflang: "x-default", href: urlFor(BYBIT_STOCKS_PATH, "en") }],
    lastmod: BYBIT_STOCKS_CHECKED,
  }));
}
