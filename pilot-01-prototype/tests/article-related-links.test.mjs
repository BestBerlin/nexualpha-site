import test from 'node:test';
import assert from 'node:assert/strict';
import { articleRelatedLinks, recentEntityArticles, articleRelatedPool } from '../src/data/article-related-links.js';
import { LOCALE_PREFIX_BY_CODE } from '../src/data/locale-routing.js';
const article = { slug: 'current', category: 'research', relatedVenues: ['binance', 'okx'], title: { en: 'Bitcoin funding rates' } };
test('bounded entity network links actual exchange, compare, coin and relevant tools in every locale', () => {
  for (const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) {
    const links = articleRelatedLinks(article, locale);
    assert.ok(links.length >= 3 && links.length <= 5);
    for (const path of ['/exchanges/binance', '/compare/binance-vs-okx', '/coins/bitcoin', '/funding-rates/matrix']) assert.ok(links.some(l => l.href.endsWith(path)), `${locale}: ${path}`);
    assert.ok(links.every(l => !l.href.includes('/go') && !l.href.includes('?')));
  }
});
test('entity-free articles have informational hub links; comparisons are never invented', () => {
  const links = articleRelatedLinks({ title: { en: 'Editorial notes' }, relatedVenues: ['kraken', 'deribit'] }, 'en');
  assert.ok(links.length >= 3);
  assert.ok(!links.some(l => l.href.startsWith('/compare/')));
});
test('recent shared-entity research excludes self, unrelated and unpublished articles', () => {
  const candidate = (slug, date, extra = {}) => ({ slug, title: { en: 'Bitcoin' }, summary: { en: 'Bitcoin' }, availableLocales: ['en'], seo: { noindex: false }, publishedAt: date, ...extra });
  const selected = recentEntityArticles(article, [article, candidate('old', '2026-09-01'), candidate('new', '2026-10-12'), candidate('draft', '2026-10-13', { status: 'DRAFT' }), candidate('unrelated', '2026-10-13', { title: { en: 'Travel' } }), candidate('middle', '2026-10-01')]);
  assert.deepEqual(selected.map(a => a.slug), ['unrelated', 'new', 'middle', 'old']);
});

test('article SSR emits the bounded network and two recent related articles as plain anchors', async t => {
  const { createSsrHarness } = await import('./helpers/ssr-hydration-harness.mjs');
  const { readFileSync } = await import('node:fs');
  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const harness = await createSsrHarness();
  t.after(() => harness.close());
  const { NewsDetailPage } = await harness.vite.ssrLoadModule('/src/components/v3/news/NewsDetailPage.jsx');
  const source = JSON.parse(readFileSync(new URL('../public/content/news-feed.json', import.meta.url))).articles.find(a => a.slug === 'okx-usd-to-usdc-spot-pair-migration');
  const current = { ...source, ...article, content: { en: '## Direct answer\n\nBitcoin funding rates on Binance and OKX.' }, availableLocales: ['en'] };
  const recent = ['2026-10-12', '2026-10-11'].map((publishedAt, i) => ({ ...current, slug: `related-${i}`, publishedAt }));
  for (const locale of ['en']) {
    const html = renderToStaticMarkup(React.createElement(NewsDetailPage, { slug: current.slug, locale, initialArticles: [current, ...recent] }));
    const block = html.match(/<aside class="news-detail__decision-box"[\s\S]*?<\/aside>/g)?.find(b => b.includes('news-detail__related-articles'));
    assert.ok(block, locale);
    assert.equal((block.match(/data-cta-placement="news-detail-related-article"/g) || []).length, 2);
    const links = [...block.matchAll(/<a[^>]*href="([^"]+)"[^>]*data-cta-placement="news-detail-related-research"/g)].map(m => m[1]);
    assert.ok(links.length >= 3 && links.length <= 5, `${locale}: ${links.length}`);
    assert.ok(links.some(h => h.endsWith('/coins/bitcoin')));
    assert.ok(links.every(h => !h.includes('/go/')));
  }
});

test('chronological category neighbors give older indexable research three referring peers', async () => {
  const { newsReadingNeighbors } = await import('../src/data/news-library.js');
  const peers = Array.from({ length: 8 }, (_, i) => ({ slug: `peer-${i}`, category: 'research', status: 'PUBLISHED', publishedAt: `2026-10-${String(i + 1).padStart(2, '0')}` }));
  for (const target of peers) {
    assert.equal(peers.filter(p => newsReadingNeighbors(p, peers).some(n => n.slug === target.slug)).length, 3);
    assert.ok(newsReadingNeighbors(target, peers).every(p => p.slug !== target.slug));
  }
});

test('compact hydration pool retains exactly the recent cards and chronological reading links', async () => {
  const { newsReadingNeighbors } = await import('../src/data/news-library.js');
  const peers = Array.from({ length: 10 }, (_, i) => ({ slug: `peer-${i}`, category: 'research', status: 'PUBLISHED', title: { en: 'Bitcoin' }, summary: { en: 'Bitcoin' }, availableLocales: ['en'], seo: { noindex: false }, publishedAt: `2026-10-${String(i + 1).padStart(2, '0')}` }));
  for (const current of peers) {
    const compact = articleRelatedPool(current, peers);
    assert.ok(compact.length <= 9);
    assert.deepEqual(recentEntityArticles(current, compact), recentEntityArticles(current, peers));
    assert.deepEqual(newsReadingNeighbors(current, compact), newsReadingNeighbors(current, peers));
  }
});

test('request-time article SSR carries only rendered news links and hydrates without mismatch', async t => {
  const { default: worker } = await import('../worker/index.js');
  const { createSsrHarness, SHELL_HTML, prerenderState, hydrateInJsdom, hydrationErrors } = await import('./helpers/ssr-hydration-harness.mjs');
  const { readFileSync } = await import('node:fs');
  const harness = await createSsrHarness();
  t.after(() => harness.close());
  const source = JSON.parse(readFileSync(new URL('../public/content/news-feed.json', import.meta.url))).articles.find(a => a.slug === 'okx-usd-to-usdc-spot-pair-migration');
  const peers = Array.from({ length: 10 }, (_, i) => ({ ...source, slug: `pool-${i}`, category: 'research', status: 'PUBLISHED', relatedVenues: ['binance'], title: { en: `Bitcoin on Binance ${i}` }, summary: { en: 'Bitcoin funding rates.' }, content: { en: '## Direct answer\n\nBitcoin funding rates on Binance.' }, availableLocales: ['en'], publishedAt: new Date(Date.UTC(2026, 9, i + 1)).toISOString() }));
  const env = {
    NEWS_SSR_RENDER: harness.render,
    ASSETS: { async fetch(request) {
      const path = new URL(request.url).pathname;
      if (path === '/content/news-feed.json') return Response.json({ articles: peers });
      if (path === '/prerender-manifest.json') return Response.json({ routes: {} });
      if (path === '/index.html') return new Response(SHELL_HTML, { headers: { 'content-type': 'text/html' } });
      return new Response('missing', { status: 404 });
    } },
  };
  const url = 'https://nexualpha.com/news/pool-5';
  const fixedNow = Date.UTC(2026, 9, 13);
  const originalNow = Date.now;
  let response;
  Date.now = () => fixedNow;
  try { response = await worker.fetch(new Request(url), env); } finally { Date.now = originalNow; }
  assert.equal(response.status, 200);
  const html = await response.text();
  const state = prerenderState(html);
  assert.ok(state.newsArticles.length > 1 && state.newsArticles.length <= 9);
  const hydrated = await hydrateInJsdom(harness.vite, html, url, { timeoutMs: 500, fixedNow });
  assert.deepEqual(hydrationErrors(hydrated.errors), []);
});

test('matching comparisons use the shared complete curated route inventory', () => {
  const links = articleRelatedLinks({ title: { en: 'Bitget versus OKX fees' }, relatedVenues: ['bitget', 'okx'] }, 'en');
  assert.ok(links.some(link => link.href === '/compare/bitget-vs-okx'));
});

test('five same-locale indexable related editions include the two newest', () => {
  const peers = Array.from({ length: 9 }, (_, i) => ({ slug: `fresh-${i}`, status: 'PUBLISHED', publishedAt: new Date(Date.UTC(2026, 9, i + 1)).toISOString(), title: { en: 'News', 'zh-Hans': '新闻' }, summary: { en: 'Summary', 'zh-Hans': '摘要' }, availableLocales: ['en', 'zh-Hans'], seo: { noindex: false } }));
  peers[8].seo.noindex = true;
  for (const locale of ['en', 'zh-Hans']) {
    const selected = recentEntityArticles(article, peers, 5, locale);
    assert.equal(selected.length, 5);
    assert.deepEqual(selected.slice(0, 2).map(a => a.slug), ['fresh-7', 'fresh-6']);
    assert.ok(selected.every(a => a.seo.noindex === false));
    assert.deepEqual(recentEntityArticles(article, articleRelatedPool(article, peers, locale), 5, locale), selected);
  }
});
