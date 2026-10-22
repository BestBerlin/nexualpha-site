import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { buildSplitSitemaps, buildNewsSitemap, routeInventory, UI_LOCALES } from './generate-prerender-manifest.mjs';
import { normalizeNewsFeed } from '../src/data/news-feed-client.js';
import { applyNewsSearchStateToFeed } from '../src/data/news-search-state.js';
import { parsePublicRoute } from '../src/data/locale-routing.js';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import { generatedComparePairs } from '../src/data/compare-generated.js';
import { renderNewsLibrarySitemap } from '../worker/index.js';
const root = resolve(import.meta.dirname, '..');
function counts(xml) {
  const byLocale = {};
  for (const [, loc] of String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = new URL(loc.replaceAll('&amp;', '&'));
    const locale = parsePublicRoute(url.pathname, url.searchParams).locale;
    byLocale[locale] = (byLocale[locale] || 0) + 1;
  }
  return { total: Object.values(byLocale).reduce((sum, n) => sum + n, 0), byLocale };
}
export function collectSeoStructureCounts() {
  const raw = JSON.parse(readFileSync(resolve(root, 'public/content/news-feed.json'), 'utf8'));
  const articles = normalizeNewsFeed(applyNewsSearchStateToFeed(raw));
  const inventory = routeInventory(articles);
  const split = buildSplitSitemaps(inventory, articles);
  const generated = Object.fromEntries([...split.files].map(([file, info]) => [file, counts(info.xml)]));
  for (const key of ['academy', 'beginner', 'licenses', 'deposit', 'coins', 'dataTools', 'convert', 'glossary', 'apps', 'campaigns', 'tokenizedStocks']) generated[key] = counts(split[key].xml);
  generated['news-sitemap.xml'] = counts(buildNewsSitemap(articles, { generatedAt: raw.generatedAt }));
  generated['news-library-sitemap.xml'] = counts(renderNewsLibrarySitemap(articles));
  const advertisedGenerated = { total: 0, byLocale: {} };
  for (const [name, count] of Object.entries(generated)) {
    if (['news-library-sitemap.xml', 'news-sitemap.xml'].includes(name)) continue;
    advertisedGenerated.total += count.total;
    for (const [locale, total] of Object.entries(count.byLocale)) advertisedGenerated.byLocale[locale] = (advertisedGenerated.byLocale[locale] || 0) + total;
  }
  const noindexed = { total: 0, byLocale: {}, byTemplate: {} };
  const paths = new Map([['/', 'home']]);
  for (const pair of generatedComparePairs()) paths.set(`/compare/${pair}`, 'comparison');
  for (const [pathname, template] of paths) for (const locale of UI_LOCALES) {
    const seo = computeRouteSeo({ pathname, locale });
    if (seo?.status !== 200 || !String(seo.robots).includes('noindex')) continue;
    noindexed.total++;
    noindexed.byLocale[locale] = (noindexed.byLocale[locale] || 0) + 1;
    noindexed.byTemplate[template] = (noindexed.byTemplate[template] || 0) + 1;
  }
  return { feedGeneratedAt: raw.generatedAt, feedArticles: articles.length, generated, advertisedGenerated, noindexed, noindexedScope: 'Home plus all generated comparisons across UI_LOCALES; count 200/noindex shared SSR metadata only. Article, archive and auxiliary templates are not enumerated.', trackedPublic: Object.fromEntries(readdirSync(resolve(root, 'public')).filter(file => /^(?:sitemap.*|news-sitemap)\.xml$/.test(file) && file !== 'sitemap.xml').map(file => [file, counts(readFileSync(resolve(root, 'public', file), 'utf8'))])) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) console.log(JSON.stringify(collectSeoStructureCounts(), null, 2));
