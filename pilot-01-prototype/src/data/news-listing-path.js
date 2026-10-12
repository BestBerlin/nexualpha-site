// News listing path parser (split out of news-library.js, 2026-10-12 home budget): App.jsx needs only this to route
// /news listings, and importing news-library from the router pulled the whole library and the news feed client
// (~27 KB gzip) into every page's initial JS. news-library re-exports everything here, so callers are unchanged.
export const NEWS_CATEGORY_KEYS = Object.freeze(["guide", "comparison", "exchange-update", "regulation", "rwa", "research"]);
const CATEGORY_SET = new Set(NEWS_CATEGORY_KEYS);

export function isNewsCategory(value) {
  return typeof value === "string" && CATEGORY_SET.has(value);
}

// Content paths (no locale prefix): /news, /news/page/N, /news/category/<key>, /news/category/<key>/page/N.
// Returns null when the path is not a listing path. `redirect` is set for /page/1 and other non-canonical forms.
export function parseNewsListingPath(pathname) {
  const match = String(pathname || "").match(/^\/news(?:\/category\/([a-z0-9-]+))?(?:\/page\/([0-9]{1,4}))?$/);
  if (!match) return null;
  const category = match[1] || null;
  const rawPage = match[2];
  const page = rawPage === undefined ? 1 : Number.parseInt(rawPage, 10);
  if (category && !isNewsCategory(category)) return { category, page, invalid: true };
  if (rawPage !== undefined && (!Number.isFinite(page) || page < 1)) return { category, page: 1, invalid: true };
  const canonicalPath = newsListingPath({ category, page });
  return { category, page, canonicalPath, redirect: canonicalPath !== pathname ? canonicalPath : null };
}

export function newsListingPath({ category = null, page = 1 } = {}) {
  const base = category ? `/news/category/${category}` : "/news";
  return page > 1 ? `${base}/page/${page}` : base;
}
