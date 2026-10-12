// Server-only (Worker head, /api/route-seo, src/data/seo-injection.js, sitemap): title, description and JSON-LD of the
// Binance October campaign page. WebPage + FAQPage (the page's own questions) + BreadcrumbList.
import { BINANCE_OCTOBER_COPY } from "./binance-october-copy.js";
import {
  BINANCE_OCTOBER_CHECKED, BINANCE_OCTOBER_INDEX_LOCALES, BINANCE_OCTOBER_ORIGIN, BINANCE_OCTOBER_PATH, BINANCE_OCTOBER_PUBLISHED,
  binanceOctoberSignupGate, parseBinanceOctoberPath,
} from "./binance-october.js";
import { titleBudgetForLocale } from "./meta-description.js";

const ORGANIZATION = Object.freeze({ "@type": "Organization", "@id": `${BINANCE_OCTOBER_ORIGIN}/#organization`, name: "NexuAlpha", url: `${BINANCE_OCTOBER_ORIGIN}/` });

export const binanceOctoberContentLocale = (locale) => (BINANCE_OCTOBER_COPY[locale] ? locale : "en");
export const binanceOctoberCopy = (locale) => BINANCE_OCTOBER_COPY[binanceOctoberContentLocale(locale)] || BINANCE_OCTOBER_COPY.en;
export const binanceOctoberIndexable = (locale) => BINANCE_OCTOBER_INDEX_LOCALES.includes(locale) && Boolean(BINANCE_OCTOBER_COPY[locale]);

export function binanceOctoberMeta(locale, { market } = {}) {
  const t = binanceOctoberCopy(locale);
  const offered = !binanceOctoberSignupGate({ locale, market });
  const base = offered ? t.seoTitle : t.seoTitleNeutral;
  const branded = `${base} — NexuAlpha`;
  return { title: branded.length <= titleBudgetForLocale(locale) ? branded : base, description: offered ? t.seoDescription : t.seoDescriptionNeutral };
}

export function binanceOctoberSchemas(locale, { urlFor, market } = {}) {
  const t = binanceOctoberCopy(locale);
  const pageUrl = urlFor(BINANCE_OCTOBER_PATH);
  const meta = binanceOctoberMeta(locale, { market });
  const inLanguage = binanceOctoberContentLocale(locale);
  return [
    {
      "@context": "https://schema.org", "@type": "WebPage", "@id": `${pageUrl}#webpage`, url: pageUrl,
      name: meta.title.replace(/ — NexuAlpha$/, ""), description: meta.description, inLanguage,
      datePublished: BINANCE_OCTOBER_PUBLISHED, dateModified: BINANCE_OCTOBER_CHECKED,
      isPartOf: { "@type": "WebSite", "@id": `${BINANCE_OCTOBER_ORIGIN}/#website`, url: `${BINANCE_OCTOBER_ORIGIN}/`, name: "NexuAlpha" },
      publisher: ORGANIZATION, about: { "@type": "Organization", name: "Binance", url: "https://www.binance.com" },
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage", "@id": `${pageUrl}#faq`, inLanguage,
      mainEntity: t.faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [["NexuAlpha", urlFor("/")], [t.breadcrumb, urlFor("/activities")], [t.crumb, pageUrl]]
        .map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })),
    },
  ];
}

/** Head metadata for the campaign path, or null elsewhere. */
export function binanceOctoberRouteSeo(pathname, locale, { urlFor, market } = {}) {
  if (!parseBinanceOctoberPath(pathname)) return null;
  const meta = binanceOctoberMeta(locale, { market });
  return { status: 200, title: meta.title, description: meta.description, indexable: binanceOctoberIndexable(locale), schemas: binanceOctoberSchemas(locale, { urlFor, market }) };
}

/** Indexable URLs with their hreflang set (sitemap-campaigns.xml). */
export function binanceOctoberSitemapEntries({ urlFor }) {
  const locales = BINANCE_OCTOBER_INDEX_LOCALES.filter((locale) => BINANCE_OCTOBER_COPY[locale]);
  return locales.map((locale) => ({
    pathname: BINANCE_OCTOBER_PATH, locale, loc: urlFor(BINANCE_OCTOBER_PATH, locale),
    alternates: [...locales.map((hreflang) => ({ hreflang, href: urlFor(BINANCE_OCTOBER_PATH, hreflang) })), { hreflang: "x-default", href: urlFor(BINANCE_OCTOBER_PATH, "en") }],
    lastmod: BINANCE_OCTOBER_CHECKED,
  }));
}
