// Brazil BCB 30-Oct-2026 deadline topic (owner plan 2026-10-12): the page has a Portuguese slug for the pt-BR edition and
// an English slug for the English edition. Route matching (App.jsx), the SSR head, the Worker head, the prerender
// inventory and the sitemap import this small module, so the article copy (brazil-vasp-deadline.js) stays in its route
// chunk.
//
// Indexable editions: /topics/<en> in English and /pt-br/topics/<pt> in Portuguese. Every other locale/slug pair renders
// with noindex and a canonical to the edition of its language (pt-BR -> Portuguese slug, everything else -> English).
export const BRAZIL_DEADLINE_SLUG_EN = "brazil-crypto-exchange-deadline-2026";
export const BRAZIL_DEADLINE_SLUG_PT = "prazo-banco-central-corretoras-cripto-2026";
export const BRAZIL_DEADLINE_SLUGS = Object.freeze([BRAZIL_DEADLINE_SLUG_EN, BRAZIL_DEADLINE_SLUG_PT]);
export const BRAZIL_DEADLINE_PATH_EN = `/topics/${BRAZIL_DEADLINE_SLUG_EN}`;
export const BRAZIL_DEADLINE_PATH_PT = `/topics/${BRAZIL_DEADLINE_SLUG_PT}`;

export function isBrazilDeadlineSlug(slug) {
  return BRAZIL_DEADLINE_SLUGS.includes(String(slug || ""));
}

export function isBrazilDeadlinePath(pathname) {
  return pathname === BRAZIL_DEADLINE_PATH_EN || pathname === BRAZIL_DEADLINE_PATH_PT;
}

/** Article language of a locale: Portuguese for pt-BR, English for every other locale. */
export function brazilDeadlineContentLocale(locale) {
  return locale === "pt-BR" ? "pt-BR" : "en";
}

/** Content path (no locale prefix) of the edition a locale belongs to. */
export function brazilDeadlinePathFor(locale) {
  return brazilDeadlineContentLocale(locale) === "pt-BR" ? BRAZIL_DEADLINE_PATH_PT : BRAZIL_DEADLINE_PATH_EN;
}

/** Locales in which a content path is search-published (one each). */
export function brazilDeadlineIndexLocales(pathname) {
  if (pathname === BRAZIL_DEADLINE_PATH_EN) return ["en"];
  if (pathname === BRAZIL_DEADLINE_PATH_PT) return ["pt-BR"];
  return [];
}

export function brazilDeadlineIndexable(pathname, locale) {
  return brazilDeadlineIndexLocales(pathname).includes(locale);
}

/** hreflang pairs of the two editions, with an English x-default. `canonical(path, locale)` builds the absolute URL. */
export function brazilDeadlineAlternates(canonical) {
  return [
    { hreflang: "en", href: canonical(BRAZIL_DEADLINE_PATH_EN, "en") },
    { hreflang: "pt-BR", href: canonical(BRAZIL_DEADLINE_PATH_PT, "pt-BR") },
    { hreflang: "x-default", href: canonical(BRAZIL_DEADLINE_PATH_EN, "en") },
  ];
}
