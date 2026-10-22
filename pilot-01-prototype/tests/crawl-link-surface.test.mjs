import test from 'node:test';
import assert from 'node:assert/strict';
import { crawlLinkSurface, documentLinks } from '../scripts/crawl-link-surface.mjs';

const page = (path, links = '', robots = 'index,follow') => `<html><head><link href="https://nexualpha.com${path}" rel="canonical"><meta content="${robots}" name="robots"></head><body>${links}</body></html>`;
const index = paths => `<sitemapindex>${paths.map(path => `<sitemap><loc>https://nexualpha.com${path}</loc></sitemap>`).join('')}</sitemapindex>`;
const sitemap = paths => `<urlset>${paths.map(path => `<url><loc>https://nexualpha.com${path.replaceAll('&', '&amp;')}</loc></url>`).join('')}</urlset>`;
const fetchFixture = routes => async href => {
  const path = new URL(href).pathname + new URL(href).search;
  return new Response(routes[path] || 'Missing', { status: routes[path] ? 200 : 404 });
};

test('real anchors accept entity/single/unquoted attributes, discard script/comment/template links and nofollow', () => {
  const result = documentLinks(`<script>{"html":"<a href='/fake'>"}</script><!--<a href='/comment'>--><template><a href='/template'>hidden</a></template><a href='/a?x=1&amp;y=2'>A</a><a href=/b>B</a><a href='/ignored' rel='nofollow'>No</a>`, 'http://localhost');
  assert.deepEqual(result.links, ['/a?x=1&y=2', '/b']);
});

test('complete nested sitemap coverage traverses noindex archive anchors and reports shortest BFS depths', async () => {
  const routes = {
    '/sitemap.xml': index(['/sitemap-articles.xml', '/sitemap-hubs.xml']),
    '/sitemap-articles.xml': sitemap(['/news/old', '/news/new']),
    '/sitemap-hubs.xml': sitemap(['/topics']),
    '/': page('/', `<a href='/news'>News</a><a href='/topics'>Topics</a>`),
    '/topics': page('/topics', `<a href='/news/new'>New</a>`),
    '/news': page('/news', `<a href='/news/page/2'>Archive</a>`),
    '/news/page/2': page('/news/page/2', `<a href='/news/old'>Old</a>`, 'noindex,follow'),
    '/news/old': page('/news/old'), '/news/new': page('/news/new'),
  };
  const report = await crawlLinkSurface({ fetch: fetchFixture(routes), concurrency: 2 });
  assert.equal(report.summary.passed, true);
  assert.equal(report.summary.sitemapUrls, 3);
  assert.equal(report.summary.reachableIndexableSitemapUrls, 3);
  assert.equal(report.results.find(row => row.path === '/news/old').depth, 3);
  assert.equal(report.results.find(row => row.path === '/news/new').depth, 2);
  assert.equal(report.results.find(row => row.path === '/news/old').parent, '/news/page/2');
});

test('sitemap discovery alone cannot establish depth, and depth four is a failing target', async () => {
  const routes = {
    '/sitemap.xml': sitemap(['/deep', '/orphan', '/blocked', '/three']),
    '/': page('/', `<a href='/one'>One</a><a href='/blocked'>Blocked</a>`),
    '/one': page('/one', `<a href='/two'>Two</a>`),
    '/two': page('/two', `<a href='/three'>Three</a>`),
    '/three': page('/three', `<a href='/deep'>Deep</a>`),
    '/deep': page('/deep'), '/blocked': page('/blocked', '', 'noindex,follow'),
  };
  const report = await crawlLinkSurface({ fetch: fetchFixture(routes) });
  assert.equal(report.summary.passed, false);
  assert.deepEqual(report.failures.map(({ path, reason }) => [path, reason]), [['/blocked', 'not-indexable'], ['/deep', 'depth-exceeded'], ['/orphan', 'unreachable']]);
  assert.equal(report.failures.find(row => row.path === '/deep').discoveredDepth, 4);
});

test('missing/malformed sitemap and canonical or HTTP errors fail closed', async () => {
  const routes = {
    '/sitemap.xml': index(['/missing.xml', '/bad.xml', '/valid.xml']),
    '/bad.xml': '<html>Not XML sitemap</html>', '/valid.xml': sitemap(['/wrong', '/gone']),
    '/': page('/', `<a href='/wrong'>Wrong</a><a href='/gone'>Gone</a>`),
    '/wrong': page('/different'),
  };
  const report = await crawlLinkSurface({ fetch: fetchFixture(routes) });
  assert.equal(report.summary.passed, false);
  assert.equal(report.sitemapErrors.length, 2);
  assert.equal(report.failures.length, 2);
});

test('HTTP nofollow prevents inventing a clickable crawl edge while noindex,follow remains traversable', async () => {
  const routes = { '/sitemap.xml': sitemap(['/article']), '/': page('/', '<a href="/article">Article</a>'), '/article': page('/article') };
  const fixture = fetchFixture(routes);
  const report = await crawlLinkSurface({ fetch: async href => {
    const response = await fixture(href);
    if (new URL(href).pathname === '/') response.headers.set('x-robots-tag', 'nofollow');
    return response;
  } });
  assert.equal(report.summary.passed, false);
  assert.deepEqual(report.failures.map(row => row.reason), ['unreachable']);
});

test('malformed, relative, missing and foreign sitemap locs fail instead of shrinking the checked inventory', async () => {
  const routes = {
    '/sitemap.xml': index(['/valid.xml', '/bad-index.xml']),
    '/valid.xml': `<urlset><url><loc>https://nexualpha.com/article</loc></url><url><loc>https://example.com/foreign</loc></url><url><loc>/relative</loc></url><url><loc>http://[broken</loc></url><url></url></urlset>`,
    '/bad-index.xml': `<sitemapindex><sitemap><loc>https://example.com/external.xml</loc></sitemap><sitemap><loc></loc></sitemap></sitemapindex>`,
    '/': page('/', '<a href="/article">Article</a>'), '/article': page('/article'),
  };
  const report = await crawlLinkSurface({ fetch: fetchFixture(routes) });
  assert.equal(report.summary.reachableIndexableSitemapUrls, 1, 'valid target remains checked');
  assert.equal(report.summary.sitemapErrors, 6);
  assert.equal(report.summary.passed, false);
  assert.equal(report.sitemapErrors.filter(row => row.path === '/valid.xml').length, 4);
  assert.equal(report.sitemapErrors.filter(row => row.path === '/bad-index.xml').length, 2);
});
