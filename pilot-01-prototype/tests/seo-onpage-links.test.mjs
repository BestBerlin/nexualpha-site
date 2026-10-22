import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fetchText, proposal, contextualInboundLinks } from '../ops/seo-autopilot/measure.mjs';
import worker from '../worker/index.js';
import { articleClusterLinks } from '../src/data/topic-clusters.js';
import { exchangeHubToolLinks } from '../src/data/exchange-hub-links.js';
import { PARTNER_EXCHANGE_PAGE_SLUGS } from '../src/data/partner-page-links.js';
import { ACTIVE_COMPARE_VENUE_SLUGS, CURATED_COMPARISON_SLUGS } from '../src/data/compare-slug.js';
import { hasNewsArticleLocale } from '../src/data/news-feed-client.js';

const origin = 'https://nexualpha.com';
const warningRoutes = {
  '/compare/bybit-vs-bitget?locale=en': '/compare/bybit-vs-bitget',
  '/fr/factbook/backpack': '/fr/exchanges/backpack',
  '/tr/factbook/raydium': '/tr/exchanges/raydium',
  '/exchanges?locale=es': '/es/exchanges',
  '/exchanges/bybit?locale=pt-BR': '/pt-br/exchanges/bybit',
};
test('all five snapshot unavailable URLs are canonical redirects, and the fetcher reaches their destination', async () => {
  for (const [path, destination] of Object.entries(warningRoutes)) {
    const redirect = await worker.fetch(new Request(origin + path), {}, {});
    assert.ok([301, 302, 307, 308].includes(redirect.status), path);
    assert.equal(new URL(redirect.headers.get('location')).pathname, destination);
    const canonicalUrl = redirect.headers.get('location');
    const visited = [];
    const html = await fetchText(origin + path, { fetchPage: async (url, options) => {
      assert.equal(options.redirect, 'manual');
      visited.push(url);
      return url === canonicalUrl ? new Response('<h1>Canonical edition</h1>') : redirect;
    } });
    assert.match(html, /Canonical edition/);
    assert.deepEqual(visited, [origin + path, canonicalUrl]);
  }
});
test('redirect handling rejects off-site hops, loops and genuine HTTP failures', async () => {
  let requests = 0;
  await assert.rejects(fetchText(origin + '/old', { fetchPage: async () => { requests += 1; return Response.redirect('https://example.com/'); } }), /Non-site/);
  assert.equal(requests, 1, 'external hop is never fetched');
  await assert.rejects(fetchText(origin + '/loop', { fetchPage: async () => Response.redirect(origin + '/loop') }), /Redirect loop/);
  await assert.rejects(fetchText(origin + '/missing', { fetchPage: async () => new Response('', { status: 404 }) }), /HTTP 404/);
});
test('live article metadata wins over article-free local fallback without widening eligibility', () => {
  const item = proposal({ query: 'Bybit registration', page: origin + '/news/how-to-register-bybit-account-complete-kyc-and-secure-first-login' }, '<title>Bybit registration &amp; fees</title><meta content="Bybit registration: KYC &amp; account security." name="description"><h1>Bybit registration</h1>');
  assert.equal(item.currentTitle, 'Bybit registration & fees');
  assert.equal(item.currentDescription, 'Bybit registration: KYC & account security.');
  assert.equal(item.action, 'none');
  assert.equal(item.eligible, false);
});
test('sample inbound analysis stays incomplete, deduplicates canonical sources and counts only contextual anchors', () => {
  assert.deepEqual(contextualInboundLinks(), { coverage: 'gsc-target-sample', complete: false, successfulFetches: 0, pages: 0, sourceUrls: [], observedLowerBoundInlinks: [] });
  const html = '<head><link rel="canonical" href="https://nexualpha.com/news/source"></head><header><a href="/header">Menu</a></header><main><a href="/target?utm_source=test#fees">Target fees</a><a href="/target#again">Target terms</a><a href="https://example.com/outside">Outside</a><a href="/news/source">Self</a><a data-href="/data-only">No href</a><script>"<a href=\"/script-only\">Script</a>"</script></main><footer><a href="/footer">Footer</a></footer>';
  const graph = contextualInboundLinks([
    { url: origin + '/news/source?locale=en', html },
    { url: origin + '/old/source', html },
    { url: origin + '/news/noindex', html: '<head><meta name="robots" content="noindex,follow"></head><main><a href="/target">Target</a></main>' },
    { url: origin + '/news/second', html: '<main><a href="/target">Target costs</a></main>' },
    { url: 'https://example.com/source', html },
    { url: origin + '/no-main', html: '<a href="/not-contextual">No main</a>' },
  ]);
  assert.equal(graph.coverage, 'gsc-target-sample');
  assert.equal(graph.complete, false);
  assert.equal(graph.successfulFetches, 6);
  assert.equal(graph.pages, 3);
  assert.deepEqual(graph.observedLowerBoundInlinks, [{ url: origin + '/target', count: 2, sourceUrls: [origin + '/news/second', origin + '/news/source'] }]);
});

const articles = JSON.parse(readFileSync(new URL('../public/content/news-feed.json', import.meta.url))).articles.filter((article) => article.seo?.noindex === false && (!article.status || article.status === 'PUBLISHED') && hasNewsArticleLocale(article, 'en'));
const targets = [...CURATED_COMPARISON_SLUGS.map((slug) => `/compare/${slug}`), ...PARTNER_EXCHANGE_PAGE_SLUGS.map((slug) => `/exchanges/${slug}`), '/tokenized-stocks'];
const sources = [
  ...articles.map((article) => ({ path: `/news/${article.slug}`, article, links: articleClusterLinks(article, 'en') })),
  ...ACTIVE_COMPARE_VENUE_SLUGS.map((slug) => ({ path: `/exchanges/${slug}`, links: exchangeHubToolLinks(slug, 'en') })),
];
const targetPath = (link) => new URL(link.href, origin).pathname;
test('alternative comparisons require venue context, stay bounded and respect locale gates', () => {
  const unrelated = articleClusterLinks({ slug: 'macro-calendar-update', title: { en: 'Macro calendar update' } }, 'en');
  assert.ok(!unrelated.some((link) => link.kind === 'compare'));
  const venueArticle = { slug: 'bybit-fee-account-checks', title: { en: 'Bybit fee and account checks' }, relatedVenues: ['bybit'] };
  for (const locale of ['en', 'zh-Hans', 'de', 'tr', 'ru']) {
    const links = articleClusterLinks(venueArticle, locale);
    const alternatives = links.filter((link) => link.kind === 'compare');
    assert.ok(alternatives.length <= 2);
    assert.ok(links.length <= 6);
    assert.ok(alternatives.every((link) => link.path.split('/').pop().split('-vs-').includes('bybit')));
    if (locale === 'tr') assert.ok(alternatives.every((link) => !link.path.includes('bitget')));
    if (locale === 'de') assert.ok(alternatives.every((link) => link.label.includes('vergleichen') && link.href.startsWith('/de/')));
  }
});
test('every curated comparison, partner profile and stock hub has five distinct relevant source pages', () => {
  for (const target of targets) {
    const referring = sources.filter((source) => source.path !== target && source.links.some((link) => targetPath(link) === target));
    assert.ok(referring.length >= 5, `${target}: ${referring.length}`);
    for (const source of referring) assert.ok(source.links.filter((link) => targetPath(link) === target).some((link) => link.label.trim().length > 3), source.path);
  }
});
test('five distinct referring sources for each money page render contextual plain anchors inside main', async (t) => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const dir = mkdtempSync(path.join(root, 'tests/.tmp-money-inlinks-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(path.join(dir, 'entry.jsx'), `
    import React from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import { NewsDetailPage } from '../../src/components/v3/news/NewsDetailPage.jsx';
    import { VenueDetailPage } from '../../src/components/v3/VenueDetailPageStatic.jsx';
    import { venueDatabase } from '../../src/data/venue-database.js';
    export function renderSource(source, articles) {
      if (source.article) return renderToStaticMarkup(React.createElement(NewsDetailPage, { slug: source.article.slug, locale: 'en', initialArticles: [source.article] }));
      const slug = source.path.split('/').pop();
      return renderToStaticMarkup(React.createElement(VenueDetailPage, { copy: {common: {dimension: 'Dimension'}, assetCapabilities: {none: 'Pending source review'}}, locale: 'en', venue: venueDatabase[slug], venues: Object.values(venueDatabase), updates: [], market: 'unknown', product: 'unknown' }));
    }
  `);
  execFileSync(path.join(root, 'node_modules/.bin/esbuild'), [path.join(dir, 'entry.jsx'), '--bundle', '--platform=node', '--format=cjs', `--outfile=${dir}/bundle.cjs`, '--loader:.css=empty', '--log-level=error', '--define:import.meta.env.SSR=true']);
  const { renderSource } = createRequire(import.meta.url)(path.join(dir, 'bundle.cjs'));
  const cache = new Map();
  for (const target of targets) {
    const referring = sources.filter((source) => source.path !== target && source.links.some((link) => targetPath(link) === target)).slice(0, 5);
    for (const source of referring) {
      if (!cache.has(source.path)) cache.set(source.path, renderSource(source, articles));
      const html = cache.get(source.path);
      const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || '';
      assert.ok([...main.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].some((match) => new URL(match[1].replace(/&amp;/g, '&'), origin).pathname === target && match[2].replace(/<[^>]*>/g, '').trim().length > 3), `${source.path} → ${target}`);
    }
  }
});
