// Server-only content inventory. The browser loads just its locale through the route cache.
import { BEGINNER_LOCALES, beginnerPath, parseBeginnerPath } from './beginner-routes.js';
import { localizedPath } from './locale-routing.js';
import { BEGINNER_COPY } from './beginner-content-all.js';
const origin = 'https://nexualpha.com';
export function beginnerAlternates(route) {
  return [...BEGINNER_LOCALES.map(locale => ({ hreflang: locale, href: `${origin}${localizedPath(beginnerPath(route.kind, locale, route.step), locale)}` })),
    { hreflang: 'x-default', href: `${origin}${beginnerPath(route.kind, 'en', route.step)}` }];
}
export function beginnerRouteSeo(pathname, locale = 'en') {
  const route = parseBeginnerPath(pathname, locale);
  if (!route) return null;
  const copy = BEGINNER_COPY[locale];
  if (!copy || route.kind === 'missing') return { status: 404 };
  const { title, description } = route.step ? copy.seo.steps[route.step - 1] : copy.seo[route.kind];
  const canonical = `${origin}${localizedPath(beginnerPath(route.kind, locale, route.step), locale)}`;
  const schemas = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: canonical, inLanguage: locale }];
  if (route.kind === 'questions') schemas.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: copy.faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })) });
  return { status: 200, title, description, canonical, indexable: true, alternatesLocales: BEGINNER_LOCALES, alternates: beginnerAlternates(route), schemas };
}
export function beginnerSitemapEntries() {
  const routes = [{ kind: 'start' }, ...Array.from({ length: 7 }, (_, i) => ({ kind: 'start', step: i + 1 })), { kind: 'questions' }, { kind: 'check' }];
  return routes.flatMap(route => BEGINNER_LOCALES.map(locale => {
    const pathname = beginnerPath(route.kind, locale, route.step);
    return { pathname, locale, loc: `${origin}${localizedPath(pathname, locale)}`, lastmod: '2026-10-14', alternates: beginnerAlternates(route) };
  }));
}
