// Pure selection shared by request-time SSR and hydrated route components. No feed import.
import { localizedPath } from '../../data/locale-routing.js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const values = (field) => typeof field === 'string' ? [field] : field && typeof field === 'object' ? Object.values(field).flatMap(values) : [];
const escaped = (term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function researchMentions(article, terms = []) {
  const text = [article?.slug?.replaceAll('-', ' '), ...values(article?.title), ...values(article?.summary), ...(article?.topicTags || []), ...values(article?.claims), ...values(article?.researchClaims)].join('\n').toLowerCase();
  return terms.some(term => typeof term === 'string' && term.trim().length >= 2 && new RegExp(`(^|[^a-z0-9])${escaped(term.trim().toLowerCase())}([^a-z0-9]|$)`, 'i').test(text));
}
export function researchHasLocale(article, locale) {
  if (!article?.title?.[locale]?.trim()) return false;
  // Summary-feed editions are publisher-declared; full articles must actually carry the body.
  if (article.content && typeof article.content === 'object') return Boolean(article.content[locale]?.trim() && article.summary?.[locale]?.trim());
  return (article.availableLocales || article.routeProjection?.availableLocales || []).includes(locale);
}
export function selectResearch(articles = [], { locale = 'en', venueIds = [], terms = [], limit = 5, before, excludeSlug } = {}) {
  const cutoff = before ? Date.parse(before) : Infinity;
  const seen = new Set();
  return (Array.isArray(articles) ? articles : []).filter(article => {
    if (article?.status !== 'PUBLISHED' || !slugPattern.test(article.slug) || article.slug === excludeSlug || !researchHasLocale(article, locale)) return false;
    const published = Date.parse(article.publishedAt);
    if (!Number.isFinite(published) || published >= cutoff) return false;
    const matches = !venueIds.length && !terms.length || venueIds.some(id => article.relatedVenues?.includes(id)) || researchMentions(article, terms);
    return matches;
  }).sort((a,b) => Date.parse(b.publishedAt)-Date.parse(a.publishedAt) || a.slug.localeCompare(b.slug))
    .filter(article => !seen.has(article.slug) && seen.add(article.slug)).slice(0, Math.max(0, limit));
}
export function researchItems(articles, options = {}) {
  const locale = options.locale || 'en';
  return selectResearch(articles, options).map(article => ({slug: article.slug, href: localizedPath(`/news/${article.slug}`, locale), title: article.title[locale], publishedAt: article.publishedAt}));
}
