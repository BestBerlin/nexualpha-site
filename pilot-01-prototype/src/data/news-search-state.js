// T10 indexation recovery (2026-10-12): per-article search state on top of the publisher's feed.
//
// The content publisher owns news-feed.json; this overlay decides, at every place the feed is read (Worker loaders,
// build/prerender, sitemap and SEO scripts), which articles are kept out of search without touching the feed or the URL:
//   - "noindex-thin": thin template page. Still 200, robots noindex,follow, no hreflang, in no sitemap.
//   - "canonicalized": weaker duplicate. Still 200, robots index,follow, rel=canonical to the stronger article, in no
//     sitemap and no hreflang set.
// The publisher may also set `searchState: "noindex-thin"` or `canonicalSlug` on a feed row; both are honoured.
// Source list: ops/newsroom/thin-noindex-2026-10-12.json (compiled by scripts/generate-news-search-state.mjs).
// Browser code never imports this module: it reads the `searchState` / `canonicalSlug` fields the Worker already set.
import { NEWS_CANONICAL_TARGETS, NEWS_STRONG_SLUGS, NEWS_THIN_NOINDEX_SLUGS } from "./news-search-state.generated.js";

export const NEWS_SEARCH_STATE_THIN = "noindex-thin";
export const NEWS_SEARCH_STATE_CANONICALIZED = "canonicalized";

const SLUG = /^[a-z0-9][a-z0-9-]{0,159}$/;
const thinSlugs = new Set(NEWS_THIN_NOINDEX_SLUGS);
const strongRank = new Map(NEWS_STRONG_SLUGS.map((slug, index) => [slug, index]));

export function newsCanonicalTargetSlug(article) {
  if (!article || typeof article !== "object") return null;
  const own = typeof article.canonicalSlug === "string" ? article.canonicalSlug.trim().toLowerCase() : "";
  const target = own || NEWS_CANONICAL_TARGETS[article.slug] || "";
  return SLUG.test(target) && target !== article.slug ? target : null;
}

export function isThinNoindexArticle(article) {
  return Boolean(article && typeof article === "object"
    && (article.searchState === NEWS_SEARCH_STATE_THIN || thinSlugs.has(article.slug)));
}

/** Feed row with the T10 search state applied (same object when nothing applies). */
export function applyNewsSearchState(article) {
  if (!article || typeof article !== "object" || typeof article.slug !== "string") return article;
  const canonicalSlug = newsCanonicalTargetSlug(article);
  const thin = isThinNoindexArticle(article);
  if (!thin && !canonicalSlug) return article;
  const seo = article.seo && typeof article.seo === "object" ? article.seo : {};
  return {
    ...article,
    searchState: thin ? NEWS_SEARCH_STATE_THIN : NEWS_SEARCH_STATE_CANONICALIZED,
    ...(canonicalSlug && !thin ? { canonicalSlug } : {}),
    // seo.noindex is the single switch every sitemap, hreflang and listing-indexability check reads.
    seo: { ...seo, noindex: true },
  };
}

/** `{ articles: [...] }` feed (or a bare array) with the search state applied to every row. */
export function applyNewsSearchStateToFeed(feed) {
  if (Array.isArray(feed)) return feed.map(applyNewsSearchState);
  if (!feed || typeof feed !== "object" || !Array.isArray(feed.articles)) return feed;
  return { ...feed, articles: feed.articles.map(applyNewsSearchState) };
}

/** 0 for the article with the most Google impressions, Infinity outside the strongest 100. */
export function newsStrengthRank(slug) {
  return strongRank.has(slug) ? strongRank.get(slug) : Number.POSITIVE_INFINITY;
}

export function strongNewsSlugs() {
  return NEWS_STRONG_SLUGS;
}
