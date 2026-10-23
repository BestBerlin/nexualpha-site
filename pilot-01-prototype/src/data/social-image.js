// Which server-rendered social card (GET /og/<kind>/<id>.png, server/og-image.mjs) a public page URL gets.
// Shared by the production server and the worker metadata builder so pages built in parallel branches pick a card
// up by route kind. Returns a site-relative path or null (keep the default brand image).
export const SOCIAL_IMAGE_VERSION = "2";
export const SOCIAL_IMAGE_WIDTH = 1200;
export const SOCIAL_IMAGE_HEIGHT = 630;

export function socialImagePathForRoute(pathname, locale = "en") {
  const clean = String(pathname || "/").replace(/\/+$/, "") || "/";
  const suffix = `?v=${SOCIAL_IMAGE_VERSION}${locale && locale !== "en" ? `&locale=${encodeURIComponent(locale)}` : ""}`;
  const news = clean.match(/^\/news\/([a-z0-9][a-z0-9-]{0,159})$/);
  if (news) return `/og/news/${news[1]}.png${suffix}`;
  const venue = clean.match(/^\/exchanges\/([a-z0-9][a-z0-9-]{0,159})$/);
  if (venue) return `/og/venue/${venue[1]}.png${suffix}`;
  const compare = clean.match(/^\/compare\/([a-z0-9-]+(?:-vs-[a-z0-9-]+){1,2})$/);
  if (compare) return `/og/compare/${compare[1]}.png${suffix}`;
  if (clean === "/liquidations") return `/og/liquidations/24h.png${suffix}`;
  if (clean === "/funding-rates") return `/og/funding/rates.png${suffix}`;
  // Home (owner 2026-10-11): the default card carries slogan A under the wordmark, localized per edition.
  if (clean === "/" || clean === "/rates") return `/og/default/site.png${suffix}`;
  return null;
}

// schema.org ImageObject for a page's social card (audit 2026-10-11 #2): NewsArticle JSON-LD carries the same 1200x630
// /og/... card as og:image, in the SSR head (src/data/seo-injection.js) and the worker metadata (/api/route-seo).
export function socialImageObject(pathname, locale = "en", origin = "https://nexualpha.com") {
  const imagePath = socialImagePathForRoute(pathname, locale);
  if (!imagePath) return null;
  return { "@type": "ImageObject", url: `${origin}${imagePath}`, width: SOCIAL_IMAGE_WIDTH, height: SOCIAL_IMAGE_HEIGHT };
}
