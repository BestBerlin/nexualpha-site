import { hreflangAlternates } from "./news-feed-client.js";
import { titleBudgetForLocale } from "./meta-description.js";
import { parseLicensesPath } from "./licenses-routes.js";
import {
  LICENSE_COUNTRIES,
  LICENSE_INDEX_LOCALES,
  LICENSE_PATH,
  licenseCountry,
  licensePath,
  licenseRecordsForCountry,
  licenseAnswer,
  licenseSchemas,
  licenseTitle,
  licenseLastmod,
} from "./licenses.js";

function fitTitle(candidates, locale) {
  const budget = titleBudgetForLocale(locale);
  return candidates.find((title) => title && title.length <= budget) || candidates[candidates.length - 1];
}

function clip(text, max = 160) {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20))}...`;
}

function urlForPath(urlFor, path, locale) {
  return typeof urlFor === "function" ? urlFor(path, locale) : path;
}

export function licenseMeta(countrySlug, locale) {
  const title = licenseTitle(countrySlug, locale);
  return {
    title: fitTitle([`${title} — NexuAlpha`, title], locale),
    description: clip(licenseAnswer(countrySlug, locale)),
  };
}

export function licenseRouteSeo(pathname, locale, { urlFor } = {}) {
  const route = parseLicensesPath(pathname);
  if (!route) return null;
  if (route.kind === "missing") return { status: 404 };
  const countrySlug = route.kind === "country" ? route.country : null;
  if (countrySlug && !licenseCountry(countrySlug)) return { status: 404 };
  const path = licensePath(countrySlug);
  const meta = licenseMeta(countrySlug, locale);
  const hasRecords = !countrySlug || licenseRecordsForCountry(countrySlug).length > 0;
  const alternatesLocales = hasRecords ? LICENSE_INDEX_LOCALES : [];
  return {
    status: 200,
    ...meta,
    indexable: LICENSE_INDEX_LOCALES.includes(locale) && (!countrySlug || licenseRecordsForCountry(countrySlug).length > 0),
    alternatesLocales,
    directAnswer: licenseAnswer(countrySlug, locale),
    schemas: licenseSchemas(countrySlug, locale, urlForPath(urlFor, path, locale)),
  };
}

export function licenseSitemapEntries({ urlFor }) {
  const lastmodFor = licenseLastmod;
  const entry = (pathname, lastmod) => LICENSE_INDEX_LOCALES.map((locale) => ({
    pathname,
    locale,
    loc: urlFor(pathname, locale),
    lastmod,
    alternates: hreflangAlternates(LICENSE_INDEX_LOCALES, (hreflang) => urlFor(pathname, hreflang)),
  }));
  return [
    ...entry(LICENSE_PATH, lastmodFor()),
    ...LICENSE_COUNTRIES.filter(country => licenseRecordsForCountry(country.slug).length > 0).flatMap((country) => entry(licensePath(country.slug), lastmodFor(country.slug))),
  ];
}

