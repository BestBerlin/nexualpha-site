// Server-only (Worker head, /api/route-seo, src/data/seo-injection.js, sitemap): titles, descriptions, robots and JSON-LD
// of the crypto glossary (2026-10-13). Indexing rules:
//   - /glossary (hub): indexable in GLOSSARY_INDEX_LOCALES;
//   - /glossary/<slug>: indexable in an index locale when the entry is written in that locale (not the English fallback);
//     other UI locales and fallback entries are noindex,follow. hreflang lists only the written editions.
// JSON-LD: hub = DefinedTermSet + BreadcrumbList; term = DefinedTerm (in the set) + FAQPage + BreadcrumbList.
import { GLOSSARY_CONTENT_BY_LOCALE } from "./glossary-content-all.js";
import { GLOSSARY_INDEX_LOCALES, GLOSSARY_PATH, glossaryContentLocale, glossaryTermPath, parseGlossaryPath } from "./glossary-routes.js";
import { GLOSSARY_TERMS, glossaryTermBySlug } from "./glossary-terms.js";
import { glossaryCopy, fill } from "./glossary-copy.js";
import { titleBudgetForLocale } from "./meta-description.js";
import { ACADEMY_INDEX_LOCALES } from "./academy.js";

export const GLOSSARY_REVIEWED_AT = "2026-10-13";
const ORIGIN = "https://nexualpha.com";
const ORGANIZATION = Object.freeze({ "@type": "Organization", "@id": `${ORIGIN}/#organization`, name: "NexuAlpha", url: `${ORIGIN}/` });
export const GLOSSARY_CANONICAL_DISPOSITIONS = Object.freeze({
  "cross-margin": { targetPath: "/academy/cross-margin", kind: "academy", reason: "academy_lesson_is_stronger_course_page" },
  "isolated-margin": { targetPath: "/academy/isolated-margin", kind: "academy", reason: "academy_lesson_is_stronger_course_page" },
});

const contentFor = (locale) => GLOSSARY_CONTENT_BY_LOCALE[glossaryContentLocale(locale)];
/** The term page data in this locale (written entry or the English fallback, see contentLocale). */
export const glossaryEntry = (slug, locale) => contentFor(locale)?.terms?.[slug] || null;
export const glossaryWrittenIn = (slug, locale) => GLOSSARY_INDEX_LOCALES.includes(locale) && glossaryEntry(slug, locale)?.contentLocale === locale;
/** Locales in which the term page is indexable (its hreflang set). */
export const glossaryTermLocales = (slug) => GLOSSARY_INDEX_LOCALES.filter((locale) => glossaryWrittenIn(slug, locale));
/** Hub editions: index locales with at least half of the terms written natively. */
export const glossaryHubLocales = () => GLOSSARY_INDEX_LOCALES.filter((locale) => GLOSSARY_TERMS.filter((t) => glossaryWrittenIn(t.slug, locale)).length * 2 >= GLOSSARY_TERMS.length);

export function glossaryCanonicalDisposition(slug, locale, { urlFor }) {
  const disposition = GLOSSARY_CANONICAL_DISPOSITIONS[slug];
  if (!disposition) return null;
  const targetLocale = ACADEMY_INDEX_LOCALES.includes(locale) ? locale : "en";
  return {
    ...disposition,
    targetLocale,
    canonical: urlFor(disposition.targetPath, targetLocale),
  };
}

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
const plain = (value) => (typeof value === "string" ? value : value.map((part) => (typeof part === "string" ? part : part[0])).join(""));
const crumbs = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })) });

export function glossaryHubMeta(locale) {
  const t = glossaryCopy(locale);
  const vars = { count: GLOSSARY_TERMS.length };
  return {
    title: fitTitle([`${fill(t.seoHubTitle, vars)} — NexuAlpha`, fill(t.seoHubTitle, vars)], locale),
    description: clip(fill(t.seoHubDescription, vars)),
  };
}
export function glossaryTermMeta(entry, locale) {
  return {
    title: fitTitle([`${entry.title} — NexuAlpha`, entry.title], locale),
    description: clip(entry.description || entry.short),
  };
}

function termSetNode(locale, urlFor) {
  const t = glossaryCopy(locale);
  const hubUrl = urlFor(GLOSSARY_PATH);
  return { "@type": "DefinedTermSet", "@id": `${hubUrl}#set`, name: `${t.brand} — NexuAlpha`, url: hubUrl, inLanguage: glossaryContentLocale(locale), publisher: ORGANIZATION };
}

export function glossarySchemas(pathname, locale, { urlFor }) {
  const route = parseGlossaryPath(pathname);
  if (!route || route.kind === "missing") return [];
  const t = glossaryCopy(locale);
  const hubUrl = urlFor(GLOSSARY_PATH);
  const set = termSetNode(locale, urlFor);
  if (route.kind === "hub") {
    const index = contentFor(locale).index.terms;
    return [
      { "@context": "https://schema.org", ...set, description: t.hubLead, dateModified: GLOSSARY_REVIEWED_AT,
        hasDefinedTerm: index.map(([slug, name, short]) => ({ "@type": "DefinedTerm", "@id": `${urlFor(glossaryTermPath(slug))}#term`, name, description: short, url: urlFor(glossaryTermPath(slug)) })) },
      crumbs([["NexuAlpha", urlFor("/")], [t.brand, hubUrl]]),
    ];
  }
  const entry = glossaryEntry(route.slug, locale);
  if (!entry) return [];
  const pageUrl = urlFor(glossaryTermPath(route.slug));
  const description = [entry.short, ...entry.body.map(plain)].join(" ");
  return [
    {
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      "@id": `${pageUrl}#term`,
      name: entry.term,
      ...(entry.aka?.length ? { alternateName: entry.aka } : {}),
      description: entry.short,
      url: pageUrl,
      termCode: route.slug,
      inLanguage: entry.contentLocale,
      inDefinedTermSet: set,
      subjectOf: { "@type": "WebPage", "@id": pageUrl, url: pageUrl, name: entry.title, description: clip(description, 300), dateModified: GLOSSARY_REVIEWED_AT, publisher: ORGANIZATION, inLanguage: entry.contentLocale },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      inLanguage: entry.contentLocale,
      mainEntity: entry.faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
    },
    crumbs([["NexuAlpha", urlFor("/")], [t.brand, hubUrl], [entry.term, pageUrl]]),
  ];
}

/** Head metadata of a glossary path, or null when the path is not a glossary route. */
export function glossaryRouteSeo(pathname, locale, { urlFor }) {
  const route = parseGlossaryPath(pathname);
  if (!route) return null;
  if (route.kind === "missing" || (route.kind === "term" && !glossaryTermBySlug(route.slug))) return { status: 404 };
  if (route.kind === "hub") {
    const meta = glossaryHubMeta(locale);
    const locales = glossaryHubLocales();
    return { status: 200, ...meta, indexable: locales.includes(locale), alternatesLocales: locales, schemas: glossarySchemas(pathname, locale, { urlFor }) };
  }
  const entry = glossaryEntry(route.slug, locale);
  if (!entry) return { status: 404 };
  const canonicalDisposition = glossaryCanonicalDisposition(route.slug, locale, { urlFor });
  return {
    status: 200, ...glossaryTermMeta(entry, locale),
    indexable: glossaryWrittenIn(route.slug, locale),
    alternatesLocales: canonicalDisposition ? [] : glossaryTermLocales(route.slug),
    canonical: canonicalDisposition?.canonical || null,
    canonicalDisposition,
    schemas: glossarySchemas(pathname, locale, { urlFor }),
  };
}

/** Every indexable glossary URL with its hreflang set (sitemap-glossary.xml). */
export function glossarySitemapEntries({ urlFor }) {
  const pages = [[GLOSSARY_PATH, glossaryHubLocales()], ...GLOSSARY_TERMS
    .filter((term) => !GLOSSARY_CANONICAL_DISPOSITIONS[term.slug])
    .map((term) => [glossaryTermPath(term.slug), glossaryTermLocales(term.slug)])];
  return pages.flatMap(([pathname, locales]) => locales.map((locale) => ({
    pathname, locale, loc: urlFor(pathname, locale),
    alternates: [...locales.map((hreflang) => ({ hreflang, href: urlFor(pathname, hreflang) })), ...(locales.includes("en") ? [{ hreflang: "x-default", href: urlFor(pathname, "en") }] : [])],
    lastmod: GLOSSARY_REVIEWED_AT,
  })));
}
