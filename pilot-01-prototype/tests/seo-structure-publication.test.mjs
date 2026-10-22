import test from 'node:test';
import assert from 'node:assert/strict';
import { localizedPath, parsePublicRoute } from '../src/data/locale-routing.js';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import { routeMetadata, renderNewsLibrarySitemap } from '../worker/index.js';
import { buildNewsSitemap, buildSplitSitemaps, routeInventory } from '../scripts/generate-prerender-manifest.mjs';
import { sitemapLocalesForRoute, selectSitemapPublicationEntries } from '../scripts/sitemap-publication-policy.mjs';
import { newsArticleSeoLocales, projectNewsFeedForRoute } from '../src/data/news-feed-client.js';
const articles = Array.from({ length: 30 }, (_, i) => ({
  slug: `policy-fixture-${i}`, status: 'PUBLISHED', category: i < 5 ? 'rwa' : 'guide',
  title: { en: `Policy fixture ${i}`, 'zh-Hans': `政策文章 ${i}`, tr: `Politika araştırması ${i}` },
  summary: { en: 'Published source based research.', 'zh-Hans': '有来源的研究摘要。', tr: 'Kaynaklara dayalı araştırma özeti.' },
  content: { en: 'Research body '.repeat(40), 'zh-Hans': '研究正文。'.repeat(40), ...(i < 5 ? { tr: 'Araştırma metni '.repeat(40) } : {}) },
  availableLocales: ['en', 'zh-Hans', ...(i < 5 ? ['tr'] : [])],
  sources: [{ id: 'source', url: 'https://example.com/research', publisher: 'Example' }],
  seo: { noindex: false }, publishedAt: '2026-10-23T00:00:00Z',
}));
const envFor = (rows) => ({ ASSETS: { fetch: async request => new URL(request.url).pathname === '/content/news-feed.json'
  ? Response.json({ generatedAt: '2026-10-23T01:00:00Z', articles: rows }) : new Response('missing', { status: 404 }) } });

test('prerendered news summaries retain explicit publication authority without promoting unreviewed rows', async () => {
  const fingerprint = 'a'.repeat(64);
  for (const [source, expected] of [[articles, 'index,follow'], [articles.map(row => ({ ...row, seo: {} })), 'noindex,follow']]) {
    for (const locale of ['en', 'zh-Hans']) {
      const projected = projectNewsFeedForRoute('/news', source, locale);
      assert.ok(projected.every(row => row.seo.noindex === (expected !== 'index,follow')));
      const env = { ASSETS: { fetch: async request => {
        const path = new URL(request.url).pathname;
        if (path === '/prerender-manifest.json') return Response.json({ routes: { [`/news|${locale}`]: { newsArticles: projected, newsFeedFingerprint: fingerprint, searchPublished: true } } });
        if (path === '/content/news-feed.sha256.txt') return new Response(fingerprint);
        return new Response('missing', { status: 404 });
      } } };
      const url = new URL(localizedPath('/news', locale), 'https://nexualpha.com');
      assert.equal((await routeMetadata(url, env)).robots, expected, url.href);
    }
  }
});

test('ur/uk editions are reachable and noindex after all specialized template overrides', async () => {
  for (const locale of ['ur', 'uk']) for (const pathname of ['/', '/compare', '/compare/binance-vs-okx', '/exchanges/binance', '/topics/derivatives', '/privacy', '/news', `/news/${articles[0].slug}`]) {
    const url = new URL(localizedPath(pathname, locale), 'https://nexualpha.com');
    const metadata = await routeMetadata(url, envFor(articles));
    assert.equal(metadata.status, 200, url.href);
    assert.equal(metadata.robots, 'noindex,follow', url.href);
    assert.deepEqual(metadata.alternates, [], url.href);
    const seo = computeRouteSeo({ url: url.href, locale, newsArticles: articles, article: articles[0] });
    assert.equal(seo.robots, 'noindex,follow', `SSR ${url.href}`);
    assert.deepEqual(seo.alternates, [], `SSR ${url.href}`);
  }
  assert.equal((await routeMetadata(new URL('https://nexualpha.com/uk'), {})).robots, 'index,follow', 'UK country hub remains an English document');
});

test('archive pages stay reachable and self canonical, with noindex and no hreflang after page one', async () => {
  const env = envFor(articles);
  for (const path of ['/news/page/2', '/zh-hans/news/page/2']) {
    const meta = await routeMetadata(new URL(path, 'https://nexualpha.com'), env);
    assert.equal(meta.status, 200, path);
    assert.equal(meta.robots, 'noindex,follow', path);
    assert.equal(meta.canonical, `https://nexualpha.com${path}`);
    assert.deepEqual(meta.alternates, []);
    assert.equal(computeRouteSeo({ url: `https://nexualpha.com${path}`, newsArticles: articles }).robots, 'noindex,follow');
  }
  assert.doesNotMatch(renderNewsLibrarySitemap(articles), /\/page\/[2-9]/);
  for (const path of ['/news/page/1', '/news/category/research/page/01']) {
    const shared = computeRouteSeo({ url: `https://nexualpha.com${path}`, newsArticles: articles });
    const served = await routeMetadata(new URL(path, 'https://nexualpha.com'), env);
    assert.equal(shared.status, served.status, path);
    assert.equal(shared.robots, 'noindex,follow', path);
    assert.equal(shared.canonical, served.canonical, path);
    assert.deepEqual(shared.alternates, [], path);
  }
});

test('empty and untranslated category collections stay out of sitemaps and noindex', async () => {
  const env = envFor(articles);
  for (const path of ['/news/category/regulation', '/tr/news/category/guide']) {
    const meta = await routeMetadata(new URL(path, 'https://nexualpha.com'), env);
    assert.equal(meta.status, 200, path);
    assert.equal(meta.robots, 'noindex,follow', path);
  }
  assert.equal((await routeMetadata(new URL('https://nexualpha.com/tr/news/category/rwa'), env)).robots, 'index,follow');
  const englishGuide = await routeMetadata(new URL('https://nexualpha.com/news/category/guide'), env);
  assert.ok(!englishGuide.alternates.some(alt => alt.hreflang === 'tr'), 'hreflang never advertises the empty Turkish category');
  const xml = renderNewsLibrarySitemap(articles);
  assert.doesNotMatch(xml, /<loc>[^<]*\/tr\/news\/category\/guide<\/loc>/);
  assert.doesNotMatch(xml, /<loc>[^<]*\/news\/category\/regulation<\/loc>/);
  assert.equal((await routeMetadata(new URL('https://nexualpha.com/news'), envFor([]))).robots, 'noindex,follow');
  assert.equal((await routeMetadata(new URL('https://nexualpha.com/news'), envFor(articles.map(article => ({ ...article, seo: {} }))))).robots, 'noindex,follow', 'unreviewed editions do not make a listing indexable');
  const noindexCategory = [...articles, { ...articles[0], slug: 'private-regulation', category: 'regulation', seo: { noindex: true } }];
  assert.equal((await routeMetadata(new URL('https://nexualpha.com/news/category/regulation'), envFor(noindexCategory))).robots, 'noindex,follow');
  assert.doesNotMatch(renderNewsLibrarySitemap(noindexCategory), /<loc>[^<]*\/news\/category\/regulation<\/loc>/);
});

test('caller supplied inventories cannot bypass archive, generated-pair, or locale exclusions', () => {
  for (const route of [
    { pathname: '/news/page/2', template: 'newsList', index: true },
    { pathname: '/news/category/guide', template: 'newsList', index: true, emptyListing: true },
    { pathname: '/compare/gate-io-vs-kraken', template: 'comparison', index: true, generatedComparison: true },
  ]) assert.deepEqual(sitemapLocalesForRoute(route, ['en', 'ur', 'uk']), []);
  assert.deepEqual(sitemapLocalesForRoute({ pathname: '/', template: 'home', index: true, locales: ['ur', 'uk'] }, ['ur', 'uk']), []);
  const result = selectSitemapPublicationEntries([{ pathname: '/news', template: 'newsList', index: true }], []);
  assert.equal(result.urls.length, 0);
  assert.ok(newsArticleSeoLocales(articles[0]).includes('tr'), 'genuine Turkish article remains eligible');
  const xml = buildNewsSitemap(articles, { generatedAt: '2026-10-23T01:00:00Z' });
  assert.match(xml, /<loc>https:\/\/nexualpha.com\/tr\/news\/policy-fixture-0<\/loc>/);
  assert.doesNotMatch(xml, /<loc>[^<]*\/(?:ur|uk-ua)\//);
});


test('every generated dedicated sitemap excludes ur/uk URLs and hreflang alternates', () => {
  const split = buildSplitSitemaps(routeInventory(articles), articles);
  const children = [...split.files.entries()].map(([name, { xml }]) => [name, xml]);
  for (const key of ['academy', 'beginner', 'licenses', 'deposit', 'coins', 'dataTools', 'convert', 'glossary', 'apps', 'campaigns', 'tokenizedStocks']) children.push([key, split[key].xml]);
  children.push(['news-sitemap', buildNewsSitemap(articles, { generatedAt: '2026-10-23T01:00:00Z' })]);
  for (const [name, xml] of children) {
    assert.doesNotMatch(xml, /hreflang="(?:ur|uk)"/, name);
    for (const match of xml.matchAll(/(?:<loc>([^<]+)<\/loc>|href="([^"]+)")/g)) {
      const url = new URL((match[1] || match[2]).replaceAll('&amp;', '&'));
      assert.ok(!['ur', 'uk'].includes(parsePublicRoute(url.pathname, url.searchParams).locale), `${name}: ${url.href}`);
    }
  }
});
