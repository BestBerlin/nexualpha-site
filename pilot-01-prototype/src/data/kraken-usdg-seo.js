// Server-only (Worker head, /api/route-seo, src/data/seo-injection.js, sitemap): title, description and JSON-LD of the
// Kraken 5M USDG Futures Challenge page. WebPage + FAQPage (the page's own questions) + BreadcrumbList.
import { KRAKEN_USDG_COPY } from "./kraken-usdg-copy.js";
import {
  KRAKEN_USDG_CHECKED, KRAKEN_USDG_INDEX_LOCALES, KRAKEN_USDG_ORIGIN, KRAKEN_USDG_PATH, KRAKEN_USDG_PUBLISHED,
  krakenUsdgSignup, parseKrakenUsdgPath,
} from "./kraken-usdg.js";
import { titleBudgetForLocale } from "./meta-description.js";

const ORGANIZATION = Object.freeze({ "@type": "Organization", "@id": `${KRAKEN_USDG_ORIGIN}/#organization`, name: "NexuAlpha", url: `${KRAKEN_USDG_ORIGIN}/` });

/** Written edition of the page for this locale (other UI locales read English). */
export const krakenUsdgContentLocale = (locale) => (KRAKEN_USDG_COPY[locale] ? locale : "en");
export function krakenUsdgCopy(locale) {
  return KRAKEN_USDG_COPY[krakenUsdgContentLocale(locale)] || KRAKEN_USDG_COPY.en;
}
export const krakenUsdgIndexable = (locale) => KRAKEN_USDG_INDEX_LOCALES.includes(locale) && Boolean(KRAKEN_USDG_COPY[locale]);

export function krakenUsdgMeta(locale, { market, now } = {}) {
  const t = krakenUsdgCopy(locale);
  const signup = krakenUsdgSignup({ locale, market, now });
  const base = signup ? String(t.seoTitle).replace("{code}", signup.code) : t.seoTitleNeutral;
  const budget = titleBudgetForLocale(locale);
  const branded = `${base} — NexuAlpha`;
  return {
    title: branded.length <= budget ? branded : base,
    description: signup ? t.seoDescription : t.seoDescriptionNeutral,
  };
}

export function krakenUsdgSchemas(locale, { urlFor, market } = {}) {
  const t = krakenUsdgCopy(locale);
  const pageUrl = urlFor(KRAKEN_USDG_PATH);
  const meta = krakenUsdgMeta(locale, { market });
  const inLanguage = krakenUsdgContentLocale(locale);
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: meta.title.replace(/ — NexuAlpha$/, ""),
      description: meta.description,
      inLanguage,
      datePublished: KRAKEN_USDG_PUBLISHED,
      dateModified: KRAKEN_USDG_CHECKED,
      isPartOf: { "@type": "WebSite", "@id": `${KRAKEN_USDG_ORIGIN}/#website`, url: `${KRAKEN_USDG_ORIGIN}/`, name: "NexuAlpha" },
      publisher: ORGANIZATION,
      about: { "@type": "Organization", name: "Kraken", url: "https://www.kraken.com" },
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
      itemListElement: [["NexuAlpha", urlFor("/")], [t.breadcrumb, urlFor("/activities")], [t.crumb, pageUrl]]
        .map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })),
    },
  ];
}

/** Head metadata for the campaign path, or null elsewhere. */
export function krakenUsdgRouteSeo(pathname, locale, { urlFor, market } = {}) {
  if (!parseKrakenUsdgPath(pathname)) return null;
  const meta = krakenUsdgMeta(locale, { market });
  return {
    status: 200,
    title: meta.title,
    description: meta.description,
    indexable: krakenUsdgIndexable(locale),
    schemas: krakenUsdgSchemas(locale, { urlFor, market }),
  };
}

/** Indexable URLs with their hreflang set (sitemap-campaigns.xml). */
export function krakenUsdgSitemapEntries({ urlFor }) {
  const locales = KRAKEN_USDG_INDEX_LOCALES.filter((locale) => KRAKEN_USDG_COPY[locale]);
  return locales.map((locale) => ({
    pathname: KRAKEN_USDG_PATH, locale, loc: urlFor(KRAKEN_USDG_PATH, locale),
    alternates: [...locales.map((hreflang) => ({ hreflang, href: urlFor(KRAKEN_USDG_PATH, hreflang) })), { hreflang: "x-default", href: urlFor(KRAKEN_USDG_PATH, "en") }],
    lastmod: KRAKEN_USDG_CHECKED,
  }));
}
