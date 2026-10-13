import { localizedNewsSummary, localizedNewsTitle, newsArticleUrl } from "./news-feed-client.js";

const clean = (value) => String(value || "").trim();
const words = (values) => values.map(clean).filter(Boolean);
const compactSlug = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "");

function localizedHaystack(article) {
  const fields = [article?.slug, article?.category, ...(article?.relatedVenues || []), ...(article?.topicTags || [])];
  for (const field of ["title", "summary"]) {
    const value = article?.[field];
    if (value && typeof value === "object") fields.push(...Object.values(value));
    else fields.push(value);
  }
  return fields.map(clean).join(" \n ").toLowerCase();
}

function articleMentions(article, terms) {
  const normalized = localizedHaystack(article);
  const compact = compactSlug(normalized);
  return terms.some((term) => {
    const value = clean(term).toLowerCase();
    if (value.length < 2) return false;
    if (/^[a-z0-9]{2,8}$/.test(value)) return new RegExp(`(^|[^a-z0-9])${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(normalized);
    return normalized.includes(value) || compact.includes(compactSlug(value));
  });
}

function newestFirst(left, right) {
  return Date.parse(right?.publishedAt || right?.updatedAt || 0) - Date.parse(left?.publishedAt || left?.updatedAt || 0);
}

export function hubNewsArticles(articles = [], { terms = [], limit = 6 } = {}) {
  const seen = new Set();
  return (Array.isArray(articles) ? articles : [])
    .filter((article) => article?.slug && !seen.has(article.slug) && seen.add(article.slug))
    .filter((article) => article.status === "PUBLISHED")
    .filter((article) => articleMentions(article, terms))
    .sort(newestFirst)
    .slice(0, limit);
}

export function hubNewsItems(articles = [], { locale = "en", terms = [], limit = 6 } = {}) {
  return hubNewsArticles(articles, { terms, limit })
    .map((article) => ({
      slug: article.slug,
      href: newsArticleUrl(article.slug, locale, article),
      title: localizedNewsTitle(article, locale),
      summary: localizedNewsSummary(article, locale),
      publishedAt: article.publishedAt,
      category: article.category,
    }));
}

export function exchangeHubNewsArticles(articles, { slug, name, limit = 6 } = {}) {
  return hubNewsArticles(articles, { limit, terms: words([slug, name, ...(slug ? [slug.replace(/-/g, " ")] : [])]) });
}

export function exchangeHubNewsItems(articles, { slug, name, locale = "en", limit = 6 } = {}) {
  return hubNewsItems(articles, { locale, limit, terms: words([slug, name, ...(slug ? [slug.replace(/-/g, " ")] : [])]) });
}

export function coinHubNewsArticles(articles, { coin, limit = 6 } = {}) {
  return hubNewsArticles(articles, { limit, terms: words([coin?.slug, coin?.id, coin?.name, coin?.symbol?.length >= 3 ? coin.symbol : null]) });
}

export function coinHubNewsItems(articles, { coin, locale = "en", limit = 6 } = {}) {
  return hubNewsItems(articles, {
    locale,
    limit,
    terms: words([coin?.slug, coin?.id, coin?.name, coin?.symbol?.length >= 3 ? coin.symbol : null]),
  });
}
