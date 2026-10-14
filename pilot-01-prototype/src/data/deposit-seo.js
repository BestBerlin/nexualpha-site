// Head metadata, JSON-LD and sitemap rows for the deposit hub, its country pages and /crypto-cards (2026-10-15).
// Used by the SSR head (seo-injection.js), the Worker head and the prerender/sitemap script; same helpers everywhere.
// Indexing: hub and cards in every locale; a country page only in its own languages (DEPOSIT_COUNTRIES[].locales) and only
// when it has at least three sourced routes from two exchanges. Other editions render with noindex and no hreflang.
import { titleBudgetForLocale } from "./meta-description.js";
import { localizedPath } from "./locale-routing.js";
import { CRYPTO_CARDS_PATH, DEPOSIT_LOCALES, depositPath, parseDepositPath } from "./deposit-routes.js";
import { depositCopy, fillDeposit } from "./deposit-copy.js";
import {
  DEPOSIT_COUNTRIES, FIAT_CHECKED, depositCards, depositCardNotes, depositCountryModel, depositHubModel, joinList, cjkSpace,
} from "./deposit.js";

const ORIGIN = "https://nexualpha.com";
const DATA_LICENSE_URL = `${ORIGIN}/methodology#data-license`;
const absolute = (path, locale) => `${ORIGIN}${localizedPath(path, locale)}`;

function fitTitle(candidates, locale) {
  const budget = titleBudgetForLocale(locale);
  return candidates.find((title) => title && title.length <= budget) || candidates[candidates.length - 1];
}
function clip(text, max = 158) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${space > max - 30 ? cut.slice(0, space) : cut}…`;
}

function alternatesFor(path, locales) {
  if (!locales.length) return [];
  const rows = locales.map((locale) => ({ hreflang: locale, href: absolute(path, locale) }));
  rows.push({ hreflang: "x-default", href: absolute(path, locales.includes("en") ? "en" : locales[0]) });
  return rows;
}

function breadcrumb(items) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })) };
}
function faqSchema(faqs, locale) {
  if (!faqs.length) return null;
  return { "@context": "https://schema.org", "@type": "FAQPage", inLanguage: locale, mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
}

export function depositMethodsLine(model, locale) {
  const t = depositCopy(locale);
  const rails = [...new Set(model.rows.filter((row) => row.k !== "card" && row.k !== "p2p" && row.r).map((row) => row.r.split(" / ")[0]))].slice(0, 3);
  const kinds = [model.rows.some((row) => row.k === "card") && t.method.card, model.rows.some((row) => row.k === "p2p") && t.method.p2p];
  return joinList([...rails, ...kinds], locale);
}

function hubSeo(locale) {
  const t = depositCopy(locale);
  const hub = depositHubModel(locale);
  const path = depositPath(locale);
  const url = absolute(path, locale);
  const answer = fillDeposit(t.hubAnswer, { n: hub.countries.length, date: FIAT_CHECKED });
  const itemList = { "@context": "https://schema.org", "@type": "ItemList", "@id": `${url}#countries`, numberOfItems: hub.countries.length,
    itemListElement: hub.countries.map((country, index) => ({ "@type": "ListItem", position: index + 1, name: country.label, url: absolute(country.href, locale) })) };
  return {
    title: fitTitle([`${t.hubTitle} — NexuAlpha`, t.hubTitle], locale),
    description: clip(t.hubMeta),
    directAnswer: answer,
    indexable: true,
    alternates: alternatesFor(depositPath("en"), DEPOSIT_LOCALES),
    canonical: url,
    schemas: [
      { "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${url}#page`, name: t.hubTitle, description: answer, url, inLanguage: locale, dateModified: FIAT_CHECKED, mainEntity: { "@id": `${url}#countries` } },
      itemList,
      breadcrumb([["NexuAlpha", `${ORIGIN}${localizedPath("/", locale)}`], [t.breadcrumb, url]]),
    ],
  };
}

function countrySeo(slug, locale) {
  const t = depositCopy(locale);
  const model = depositCountryModel(slug, locale);
  if (!model) return null;
  const path = depositPath(locale, slug);
  const url = absolute(path, locale);
  const title = cjkSpace(fillDeposit(t.countryTitle, { country: model.name }), locale);
  const methods = depositMethodsLine(model, locale);
  const sourceUrls = model.notes.map((note) => note.href && /^https?:/.test(note.href) ? note.href : null).filter(Boolean);
  const indexable = model.indexLocales.includes(locale);
  const routes = { "@context": "https://schema.org", "@type": "ItemList", "@id": `${url}#routes`, numberOfItems: model.rows.length,
    itemListElement: model.exchanges.flatMap((entry) => entry.rows.map((row) => ({ name: `${entry.name} · ${row.r || t.method[row.k]}${row.cur ? ` ${row.cur}` : ""} · ${t.dir[row.d]}` })))
      .map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })) };
  return {
    title: fitTitle([`${title}: ${methods}`, title], locale),
    description: clip(cjkSpace(fillDeposit(t.countryMeta, { country: model.name, methods, date: FIAT_CHECKED }), locale)),
    directAnswer: model.answer,
    indexable,
    alternates: indexable ? alternatesFor(depositPath("en", slug), model.indexLocales) : [],
    canonical: url,
    schemas: [
      { "@context": "https://schema.org", "@type": "WebPage", "@id": `${url}#page`, name: title, description: model.answer, url, inLanguage: locale, dateModified: FIAT_CHECKED, about: { "@type": "Country", name: model.label } },
      routes,
      { "@context": "https://schema.org", "@type": "Dataset", "@id": `${url}#dataset`, name: title, description: model.answer, url, inLanguage: locale, dateModified: FIAT_CHECKED, license: DATA_LICENSE_URL,
        creator: { "@type": "Organization", name: "NexuAlpha", url: ORIGIN }, ...(sourceUrls.length ? { isBasedOn: sourceUrls } : {}),
        variableMeasured: ["exchange", "method", "direction", "currency", "rail", "fee", "arrival time", "source"], spatialCoverage: model.label, mainEntity: { "@id": `${url}#routes` } },
      faqSchema(model.faqs, locale),
      breadcrumb([["NexuAlpha", `${ORIGIN}${localizedPath("/", locale)}`], [t.breadcrumb, absolute(depositPath(locale), locale)], [model.label, url]]),
    ].filter(Boolean),
  };
}

function cardsSeo(locale) {
  const t = depositCopy(locale);
  const cards = depositCards(locale);
  const url = absolute(CRYPTO_CARDS_PATH, locale);
  const answer = fillDeposit(t.cardsAnswer, { n: cards.length, date: FIAT_CHECKED });
  const { notes } = depositCardNotes(cards, locale);
  void notes;
  const list = { "@context": "https://schema.org", "@type": "ItemList", "@id": `${url}#cards`, numberOfItems: cards.length,
    itemListElement: cards.map((item, index) => ({ "@type": "ListItem", position: index + 1, item: {
      "@type": "PaymentCard", name: item.name, provider: { "@type": "Organization", name: item.exchangeName },
      ...(item.net ? { category: item.net } : {}),
      ...(item.regionsText ? { areaServed: item.regionsText } : {}),
      ...(item.feeList.length ? { feesAndCommissionsSpecification: item.feeList.map((fee) => `${fee.name}: ${fee.text}`).join("; ") } : {}),
    } })) };
  return {
    title: fitTitle([`${t.cardsTitle} — NexuAlpha`, t.cardsTitle], locale),
    description: clip(t.cardsMeta),
    directAnswer: answer,
    indexable: true,
    alternates: alternatesFor(CRYPTO_CARDS_PATH, DEPOSIT_LOCALES),
    canonical: url,
    schemas: [
      { "@context": "https://schema.org", "@type": "WebPage", "@id": `${url}#page`, name: t.cardsTitle, description: answer, url, inLanguage: locale, dateModified: FIAT_CHECKED, mainEntity: { "@id": `${url}#cards` } },
      list,
      breadcrumb([["NexuAlpha", `${ORIGIN}${localizedPath("/", locale)}`], [t.breadcrumb, absolute(depositPath(locale), locale)], [t.cardCol.card, url]]),
    ],
  };
}

/** Head for a content path in a locale, or null when the path is not a deposit route. */
export function depositRouteSeo(pathname, locale = "en") {
  const route = parseDepositPath(pathname, DEPOSIT_LOCALES.includes(locale) ? locale : "en");
  if (!route) return null;
  if (route.kind === "missing") return { status: 404 };
  const seo = route.kind === "cards" ? cardsSeo(locale) : route.kind === "hub" ? hubSeo(locale) : countrySeo(route.country, locale);
  return seo ? { status: 200, ...seo } : { status: 404 };
}

export function depositSitemapEntries() {
  const rows = [];
  const push = (path, locale, alternates) => rows.push({ pathname: path, locale, loc: absolute(path, locale), lastmod: FIAT_CHECKED, alternates });
  for (const locale of DEPOSIT_LOCALES) push(depositPath(locale), locale, alternatesFor(depositPath("en"), DEPOSIT_LOCALES));
  for (const locale of DEPOSIT_LOCALES) push(CRYPTO_CARDS_PATH, locale, alternatesFor(CRYPTO_CARDS_PATH, DEPOSIT_LOCALES));
  for (const country of DEPOSIT_COUNTRIES) {
    const model = depositCountryModel(country.slug, "en");
    for (const locale of model.indexLocales) push(depositPath(locale, country.slug), locale, alternatesFor(depositPath("en", country.slug), model.indexLocales));
  }
  return rows;
}

/** Every public URL (indexable or not) for IndexNow / QA sweeps. */
export function depositIndexableUrls() {
  return depositSitemapEntries().map((row) => row.loc);
}

/** Locales whose edition of this content path is indexable (search-publication lists). */
export function depositPublicationLocales(pathname) {
  const route = parseDepositPath(pathname);
  if (!route || route.kind === "missing") return [];
  if (route.kind !== "country") return DEPOSIT_LOCALES;
  return depositCountryModel(route.country, "en")?.indexLocales || [];
}
