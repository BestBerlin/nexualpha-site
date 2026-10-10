import { getBrazilPage, getBrazilSource } from './brazil-market.js';
import { NEXUALPHA_PUBLISHER, RESEARCH_DESK } from './brand-entity.js';

const ORIGIN = 'https://nexualpha.com';
// Shared publisher / editorial-team references (same Organization @id as the rest of the site).

function faqEntities(page) {
  const seen = new Set();
  return [...(page.faq || []), ...(page.aeoAnswers || [])]
    .filter(({ question, answer }) => {
      if (!question || !answer || seen.has(question)) return false;
      seen.add(question);
      return true;
    })
    .map(({ question, answer }) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } }));
}

function pageSources(page) {
  return (page.sourceIds || []).map((id) => getBrazilSource(id)).filter(Boolean);
}

function dateOnly(value) {
  return String(value || '').slice(0, 10);
}

function latestSourceReviewDate(sources) {
  return sources
    .map((source) => Date.parse(source.checkedAt))
    .filter(Number.isFinite)
    .sort((a, b) => b - a)
    .map((timestamp) => new Date(timestamp).toISOString().slice(0, 10))[0] || null;
}

// All five routes have original Portuguese content, not fifteen translated copies.
export function getBrazilSeo(pathname) {
  const page = getBrazilPage(pathname);
  if (!page) return null;
  const canonical = `${ORIGIN}${page.path}`;
  const sources = pageSources(page);
  const reviewedAt = latestSourceReviewDate(sources);
  const mainSourceUrls = sources.slice(0, 4).map((source) => source.url);
  const crumbs = [{ '@type': 'ListItem', position: 1, name: 'NexuAlpha Brasil', item: `${ORIGIN}/br` }];
  if (page.path !== '/br') crumbs.push({ '@type': 'ListItem', position: 2, name: page.title, item: canonical });
  const schemas = [
    { '@context': 'https://schema.org', '@type': 'WebPage', '@id': `${canonical}#page`, name: page.title,
      description: page.description, url: canonical, inLanguage: 'pt-BR', spatialCoverage: { '@type': 'Country', name: 'Brasil' },
      author: RESEARCH_DESK, publisher: NEXUALPHA_PUBLISHER,
      ...(reviewedAt ? { dateModified: dateOnly(reviewedAt) } : {}),
      ...(mainSourceUrls.length >= 2 ? { isBasedOn: mainSourceUrls, citation: mainSourceUrls } : {}) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs },
  ];
  const mainEntity = faqEntities(page);
  if (mainEntity.length) schemas.push({ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: 'pt-BR', mainEntity });
  return { status: 200, title: `${page.title} | NexuAlpha`, description: page.description,
    canonical, locale: 'pt-BR', htmlLocale: 'pt-BR', robots: 'index,follow', ogType: 'website', schemas,
    alternates: [{ hreflang: 'pt-BR', href: canonical }, { hreflang: 'x-default', href: canonical }] };
}
