import { newsArticleGeoView } from "./news-geo-policy.js";
import { newsArticleSeoLocales } from "./news-feed-client.js";
import { isReviewedNewsSearchArticle } from "./reviewed-news-publication.js";

// A sitemap URL must describe the same indexable canonical document the page head exposes.
export function isSelfCanonicalSitemapSeo(loc, seo) {
  const directives = new Set(String(seo?.robots || "").toLowerCase().split(",").map((value) => value.trim()));
  return seo?.status === 200 && directives.has("index") && directives.has("follow")
    && !directives.has("noindex") && !directives.has("nofollow") && seo.canonical === loc;
}

export function articleSitemapLocales(article, newsArticles = [], buildCache) {
  if (!isReviewedNewsSearchArticle(article) || article.canonicalSlug) return [];
  if (buildCache?.has(article)) return buildCache.get(article);
  // A native, search-published edition owns its clean locale URL. Canonicalized duplicates never own a sitemap URL.
  // Use the same request projection as the page head, without generating its FAQ/JSON-LD or related-link schemas.
  const locales = newsArticleSeoLocales(article).filter((locale) => {
    const projected = newsArticleGeoView(article, { locale });
    return isReviewedNewsSearchArticle(projected) && newsArticleSeoLocales(projected).includes(locale);
  });
  buildCache?.set(article, locales);
  return locales;
}
