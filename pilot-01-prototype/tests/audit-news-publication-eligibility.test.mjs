import test from 'node:test';
import assert from 'node:assert/strict';
import { newsArticleSeoLocales, normalizeNewsFeedSummaries, newsListingNativeArticleCounts } from '../src/data/news-feed-client.js';
import { routeInventory, buildSitemap, buildNewsSitemap } from '../scripts/generate-prerender-manifest.mjs';
import { sitemapHreflangAlternates, selectSitemapPublicationEntries } from '../scripts/sitemap-publication-policy.mjs';
import { buildNewsSeoFiles } from '../scripts/update-news-seo.mjs';

const slugs = ['hyperliquid-vs-dydx', 'reserve-rights-rsr-upbit-listing-46-percent-negative-funding', 'what-is-funding-rate-crypto-perpetuals-how-it-is-calculated', 'how-to-set-up-kraken-global-settings-lock-safely'];
function article(slug, noindex) {
  const locales = ['en', 'tr', 'id', 'vi'];
  return { slug, status: 'PUBLISHED', publishedAt: '2026-10-19T00:00:00Z',
    title: Object.fromEntries(locales.map(l => [l, 'Title'])), summary: Object.fromEntries(locales.map(l => [l, 'Summary'])),
    content: Object.fromEntries(locales.map(l => [l, 'Native article body.'])),
    sources: [{ url: 'https://example.com/source', title: 'Source' }], seo: { noindex } };
}

test('F12 noindex news rows never supply sitemap or sibling hreflang locales', () => {
  for (const slug of slugs) {
    const row = article(slug, true);
    assert.deepEqual(newsArticleSeoLocales(row), []);
    const route = routeInventory([row]).find(r => r.pathname === `/news/${slug}`);
    assert.deepEqual(route.locales, []);
    assert.deepEqual(route.prerenderLocales, ['en', 'tr', 'id', 'vi']);
    assert.deepEqual(sitemapHreflangAlternates(`/news/${slug}`, { article: row }), []);
    const staleInventory = [{ pathname: `/news/${slug}`, template: 'article', index: true, locales: ['en', 'tr', 'id', 'vi'] }];
    assert.equal(selectSitemapPublicationEntries(staleInventory, [row]).urls.length, 0);
    assert.doesNotMatch(buildSitemap(staleInventory, [row]), new RegExp(`/news/${slug}`));
    assert.doesNotMatch(buildNewsSitemap([row], { generatedAt: '2026-10-19T01:00:00Z' }), new RegExp(`/news/${slug}`));
    const files = buildNewsSeoFiles({ generatedAt: '2026-10-19T01:00:00Z', articles: [row] });
    assert.doesNotMatch(Object.values(files.sitemapFiles).join(''), new RegExp(`/news/${slug}`));
  }
});

test('F12 published news preserves readable editions and only trusted published projection alternates', () => {
  const row = article('audit-published-editions', false);
  assert.deepEqual(newsArticleSeoLocales(row), ['en', 'tr', 'id', 'vi']);
  assert.deepEqual(routeInventory([row]).find(r => r.pathname === `/news/${row.slug}`).locales, newsArticleSeoLocales(row));
  const draft = { ...row, status: 'DRAFT' };
  assert.deepEqual(newsArticleSeoLocales(draft), []);
});

test('F12 summary projection retains a full row publication gate for listing eligibility', () => {
  const summaries = normalizeNewsFeedSummaries({ articles: [article('audit-summary-gate', true)] });
  assert.deepEqual(newsListingNativeArticleCounts(summaries), {});
});

test('F12 stale Turkish inventory cannot index an English fallback or advertise it to ID/VI siblings', () => {
 for (const slug of slugs) {
  const row=article(slug,false); delete row.content.tr;
  const expected=['en','id','vi'];
  assert.deepEqual(newsArticleSeoLocales(row),expected);
  const inventory=[{pathname:`/news/${slug}`,template:'article',index:true,locales:['en','tr','id','vi']}];
  const selected=selectSitemapPublicationEntries(inventory,[row]);
  assert.ok(selected.urls.every(url=>!JSON.stringify(url).includes('/tr/')));
  const alternates=sitemapHreflangAlternates(`/news/${slug}`,{article:row});
  assert.ok(alternates.every(a=>a.hreflang!=='tr'));
  assert.doesNotMatch(buildSitemap(inventory,[row]),new RegExp(`/tr/news/${slug}`));
 }
});
