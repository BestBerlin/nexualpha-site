/**
 * News article data contract.
 *
 * Public news pages are populated from /content/news-feed.json at runtime.
 * This module intentionally keeps no hard-coded article fallback so missing or
 * invalid feed data fails closed instead of showing unsourced promotional copy.
 */

export const newsArticlesDatabase = [];

export function getNewsArticleBySlug(slug, articles = newsArticlesDatabase) {
  if (!slug || !Array.isArray(articles)) return null;
  return articles.find((article) => article.slug === slug) || null;
}
