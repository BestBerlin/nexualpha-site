import { BITGET_GUIDE_PATH, BITGET_GUIDE_LOCALES, isBitgetGuidePath, bitgetGuideAvailable } from './bitget-guide-routes.js';
import { bitgetGuideCopy } from './bitget-guide.js';
import { localizedPath } from './locale-routing.js';
const origin = 'https://nexualpha.com';
export function bitgetGuideAlternates() {
  return [...BITGET_GUIDE_LOCALES.map(locale => ({ hreflang: locale, href: origin + localizedPath(BITGET_GUIDE_PATH, locale) })), { hreflang: 'x-default', href: origin + BITGET_GUIDE_PATH }];
}
export function bitgetGuideSeo(pathname, locale = 'en', market) {
  if (!isBitgetGuidePath(pathname)) return null;
  if (!bitgetGuideAvailable(locale, market)) return { status: 404 };
  const copy = bitgetGuideCopy(locale);
  const canonical = origin + localizedPath(BITGET_GUIDE_PATH, locale);
  return { status: 200, title: copy.title, description: copy.description, canonical, indexable: true, alternatesLocales: BITGET_GUIDE_LOCALES, alternates: bitgetGuideAlternates(), schemas: [
    { '@context': 'https://schema.org', '@type': 'HowTo', name: copy.title, description: copy.description, inLanguage: locale, url: canonical, step: copy.steps.map((step, i) => ({ '@type': 'HowToStep', position: i + 1, name: step.title, text: step.paragraphs.join(' '), url: `${canonical}#step-${i + 1}` })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: locale, mainEntity: copy.faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })) },
  ] };
}
export function bitgetGuideSitemapEntries() {
  return BITGET_GUIDE_LOCALES.map(locale => ({ pathname: BITGET_GUIDE_PATH, locale, loc: origin + localizedPath(BITGET_GUIDE_PATH, locale), lastmod: '2026-10-14', alternates: bitgetGuideAlternates() }));
}
