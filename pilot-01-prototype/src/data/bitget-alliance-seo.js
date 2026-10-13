// Server-only (Worker head, /api/route-seo, src/data/seo-injection.js, sitemap): title, description and JSON-LD of the
// Bitget Alliance campaign page. WebPage + FAQPage (the page's own questions) + BreadcrumbList.
import { BITGET_ALLIANCE_COPY } from "./bitget-alliance-copy.js";
import {
  BITGET_ALLIANCE_CHECKED, BITGET_ALLIANCE_INDEX_LOCALES, BITGET_ALLIANCE_ORIGIN, BITGET_ALLIANCE_PATH, BITGET_ALLIANCE_PUBLISHED,
  bitgetAllianceSignup, parseBitgetAlliancePath,
} from "./bitget-alliance.js";
import { titleBudgetForLocale } from "./meta-description.js";

const ORGANIZATION = Object.freeze({ "@type": "Organization", "@id": `${BITGET_ALLIANCE_ORIGIN}/#organization`, name: "NexuAlpha", url: `${BITGET_ALLIANCE_ORIGIN}/` });

/** Written edition of the page for this locale (other UI locales read English). */
export const bitgetAllianceContentLocale = (locale) => (BITGET_ALLIANCE_COPY[locale] ? locale : "en");
export function bitgetAllianceCopy(locale) {
  return BITGET_ALLIANCE_COPY[bitgetAllianceContentLocale(locale)] || BITGET_ALLIANCE_COPY.en;
}
export const bitgetAllianceIndexable = (locale) => BITGET_ALLIANCE_INDEX_LOCALES.includes(locale) && Boolean(BITGET_ALLIANCE_COPY[locale]);

export function bitgetAllianceMeta(locale, { market, now } = {}) {
  const t = bitgetAllianceCopy(locale);
  const signup = bitgetAllianceSignup({ locale, market, now });
  const base = signup ? String(t.seoTitle).replace("{code}", signup.code) : t.seoTitleNeutral;
  const budget = titleBudgetForLocale(locale);
  const branded = `${base} — NexuAlpha`;
  return {
    title: branded.length <= budget ? branded : base,
    description: signup ? t.seoDescription : t.seoDescriptionNeutral,
  };
}

export function bitgetAllianceSchemas(locale, { urlFor, market } = {}) {
  const t = bitgetAllianceCopy(locale);
  const pageUrl = urlFor(BITGET_ALLIANCE_PATH);
  const meta = bitgetAllianceMeta(locale, { market });
  const inLanguage = bitgetAllianceContentLocale(locale);
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: meta.title.replace(/ — NexuAlpha$/, ""),
      description: meta.description,
      inLanguage,
      datePublished: BITGET_ALLIANCE_PUBLISHED,
      dateModified: BITGET_ALLIANCE_CHECKED,
      isPartOf: { "@type": "WebSite", "@id": `${BITGET_ALLIANCE_ORIGIN}/#website`, url: `${BITGET_ALLIANCE_ORIGIN}/`, name: "NexuAlpha" },
      publisher: ORGANIZATION,
      about: { "@type": "Organization", name: "Bitget", url: "https://www.bitget.com" },
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
      itemListElement: [["NexuAlpha", urlFor("/")], [t.breadcrumb, urlFor("/activities")], ["Bitget Alliance", pageUrl]]
        .map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })),
    },
  ];
}

/** Head metadata for the campaign path, or null elsewhere. */
export function bitgetAllianceRouteSeo(pathname, locale, { urlFor, market } = {}) {
  if (!parseBitgetAlliancePath(pathname)) return null;
  const meta = bitgetAllianceMeta(locale, { market });
  return {
    status: 200,
    title: meta.title,
    description: meta.description,
    indexable: bitgetAllianceIndexable(locale),
    schemas: bitgetAllianceSchemas(locale, { urlFor, market }),
  };
}

/** Indexable URLs with their hreflang set (sitemap-campaigns.xml). */
export function bitgetAllianceSitemapEntries({ urlFor }) {
  const locales = BITGET_ALLIANCE_INDEX_LOCALES.filter((locale) => BITGET_ALLIANCE_COPY[locale]);
  return locales.map((locale) => ({
    pathname: BITGET_ALLIANCE_PATH, locale, loc: urlFor(BITGET_ALLIANCE_PATH, locale),
    alternates: [...locales.map((hreflang) => ({ hreflang, href: urlFor(BITGET_ALLIANCE_PATH, hreflang) })), { hreflang: "x-default", href: urlFor(BITGET_ALLIANCE_PATH, "en") }],
    lastmod: BITGET_ALLIANCE_CHECKED,
  }));
}
