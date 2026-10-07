// Retrieval retention is independent of sitemap size budgets, but cannot
// resurrect withdrawn, noindex, redirected or unsourced documents.
export function retainRetrievalNews(article, dispositions = []) {
  if (!article || article.status !== 'PUBLISHED' || article.seo?.noindex !== false
    || !Array.isArray(article.sources) || article.sources.length === 0) return false;
  const canonical = `https://nexualpha.com/news/${article.slug}`;
  if (article.seo.canonical !== canonical) return false;
  return !dispositions.some((item) => item.url === canonical);
}
