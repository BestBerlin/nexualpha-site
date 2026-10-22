import test from 'node:test';
import assert from 'node:assert/strict';
import { primaryVenueResearch, articleRelatedLinks, articleRelatedPool } from '../src/data/article-related-links.js';
import { createSsrHarness } from './helpers/ssr-hydration-harness.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const article = (slug, publishedAt, overrides = {}) => ({ slug, status: 'PUBLISHED', publishedAt, relatedVenues: ['okx'], title: { en: 'OKX Bitcoin research', es: 'Investigación OKX Bitcoin' }, summary: { en: 'Bitcoin', es: 'Bitcoin' }, availableLocales: ['en', 'es'], seo: { noindex: false }, ...overrides });
const current = article('current', '2026-10-22');
const older = Array.from({length: 6}, (_, i) => article(`older-${i}`, `2026-10-${21-i}`));
test('primary venue research contains four newest older locale editions and rejects invalid targets', () => {
  const rows = [current, article('newer', '2026-10-23'), article('same-time', '2026-10-22'), ...older.slice().reverse(), article('draft', '2026-10-21', { status: 'DRAFT' }), article('noindex', '2026-10-21', { seo: { noindex: true } }), article('english-only', '2026-10-21', { availableLocales: ['en'] }), article('other', '2026-10-21', { relatedVenues: ['binance'] })];
  assert.deepEqual(primaryVenueResearch(current, rows, 'es').map(a => a.slug), older.slice(0,4).map(a => a.slug));
  assert.deepEqual(primaryVenueResearch(current, articleRelatedPool(current, rows, 'es'), 'es'), primaryVenueResearch(current, rows, 'es'));
});
test('tokenized research links known stock and coin routes in the same locale', () => {
  const links = articleRelatedLinks({ ...current, title: { en: 'OKX tokenized TSLA stock perpetual and Bitcoin' } }, 'es');
  assert.ok(links.some(link => link.href === '/es/exchanges/okx'));
  assert.ok(links.some(link => link.href === '/es/coins/bitcoin'));
  assert.ok(links.some(link => link.href === '/es/tokenized-stocks/tsla'));
  assert.ok(!articleRelatedLinks({ ...current, title: { en: 'Coin market news' } }, 'es').some(link => link.href.includes('tokenized-stocks')));
});
test('SSR emits plain locale-safe older-venue anchors and directly links all archive pages', async t => {
  const harness = await createSsrHarness();
  t.after(() => harness.close());
  const { ArticleVenueResearch } = await harness.vite.ssrLoadModule('/src/components/v3/news/ArticleVenueResearch.jsx');
  const html = renderToStaticMarkup(React.createElement(ArticleVenueResearch, { article: current, articles: older, locale: 'es' }));
  assert.equal((html.match(/data-cta-placement="news-detail-venue-research"/g) || []).length, 4);
  for (const item of older.slice(0,4)) assert.ok(html.includes(`/es/news/${item.slug}`));
  assert.ok(html.includes('/es/exchanges/okx'));
  const { NewsListPage } = await harness.vite.ssrLoadModule('/src/components/v3/news/NewsListPage.jsx');
  const listing = renderToStaticMarkup(React.createElement(NewsListPage, { locale: 'es', initialArticles: [], listing: { page: 1, total: 1200, totalPages: 50 } }));
  for (let page=2;page<=50;page++) assert.ok(listing.includes(`/es/news/page/${page}`), `Archive page ${page}`);
});
