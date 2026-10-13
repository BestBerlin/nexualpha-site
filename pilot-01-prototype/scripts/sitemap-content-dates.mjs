import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { buildSplitSitemaps, buildNewsSitemap } from './generate-prerender-manifest.mjs';
import { normalizeNewsFeed } from '../src/data/news-feed-client.js';
import { buildFlashItems, renderFlashSitemap } from '../src/data/flash-feed.js';
import { localizedPath, parsePublicRoute } from '../src/data/locale-routing.js';
import { updatePath } from '../src/data/activity-update-path.js';

const origin = 'https://nexualpha.com';
const day = (date) => Number.isFinite(Date.parse(date)) ? new Date(date).toISOString().slice(0, 10) : null;
const read = (root, name) => existsSync(path.join(root, name)) ? JSON.parse(readFileSync(path.join(root, name), 'utf8')) : null;

// Source-owned dates, recomputed independently of the stored XML and the build's generatedAt timestamp.
export function sitemapContentDates(clientRoot) {
  const inventory = read(clientRoot, 'route-inventory.json');
  const feed = read(clientRoot, 'content/news-feed.json');
  if (!inventory || !feed) throw new Error('Missing content inputs for sitemap lastmod audit');
  const articles = normalizeNewsFeed(feed);
  const split = buildSplitSitemaps(inventory.routes, articles);
  const dates = new Map();
  const addXml = (xml) => {
    for (const match of xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/g)) {
      const loc = match[1].match(/<loc>([^<]+)<\/loc>/)?.[1]?.replaceAll('&amp;', '&');
      const date = match[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
      if (loc && date) dates.set(loc, day(date));
    }
  };
  for (const { xml } of split.files.values()) addXml(xml);
  for (const key of ['academy', 'licenses', 'coins', 'dataTools', 'convert', 'glossary', 'apps', 'campaigns']) addXml(split[key].xml);
  addXml(buildNewsSitemap(articles));

  const announcements = read(clientRoot, 'intel/official-announcements.json');
  const archive = read(clientRoot, 'intel/official-announcements-archive.json');
  const updates = new Map();
  for (const item of [...(archive?.items || []), ...(announcements?.items || [])]) updates.set(updatePath(item), day(item.publishedAt));
  const briefs = read(clientRoot, 'content/campaign-briefs.json');
  const flash = buildFlashItems({ announcements, archive, briefs: briefs?.items || [], news: articles });
  // Date provenance outlives the seven-day sitemap window; a long audit must not lose a source at its cutoff.
  addXml(renderFlashSitemap(flash.items, { windowMs: 30 * 24 * 60 * 60 * 1000, urlFor: (pathname, locale) => `${origin}${localizedPath(pathname, locale)}`, alternates: () => [] }));
  return {
    expected(loc) {
      const parsed = parsePublicRoute(new URL(loc).pathname, new URL(loc).searchParams);
      return updates.has(parsed.contentPathname) ? updates.get(parsed.contentPathname) : dates.get(loc);
    },
  };
}
