import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { routeMetadata } from '../worker/index.js';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import { normalizeNewsFeed } from '../src/data/news-feed-client.js';
import { routeInventory } from '../scripts/generate-prerender-manifest.mjs';
import { loadSearchPublicationBaseline, selectSitemapPublicationEntries, articleSlugsFromPublication } from '../scripts/sitemap-publication-policy.mjs';

const slugs = ['binance-okx-proof-of-reserves-disclosure-audit', 'bybit-vs-okx-subaccounts-risk-isolation-api-controls',
  'coinbase-address-allowlist-setup-network-hold-tutorial', 'how-to-set-up-binance-anti-phishing-code',
  'jupiter-vs-raydium-solana-swap-routing-execution-controls', 'verify-official-crypto-exchange-website'];
const raw = JSON.parse(await readFile(new URL('../public/content/news-feed.json', import.meta.url), 'utf8'));
const articles = normalizeNewsFeed(raw);
const policy = loadSearchPublicationBaseline();
const publication = (feed) => selectSitemapPublicationEntries(routeInventory(feed), feed, { policy });
const assets = (feed) => ({ fetch: async (request) => new URL(request.url).pathname === '/content/news-feed.json'
  ? new Response(JSON.stringify(Array.isArray(feed) ? { ...raw, articles: feed } : feed), { headers: { 'content-type': 'application/json' } })
  : new Response('missing', { status: 404 }) });

test('all six retained research answers stay selected and client/SSR indexable within unchanged budgets', async () => {
  const selected = publication(articles);
  const selectedSlugs = new Set(articleSlugsFromPublication(selected));
  assert.equal(policy.maxReviewedNewsArticleRoutes, 312);
  assert.equal(policy.maxUrlsByTemplate.article, 624);
  assert.equal(selectedSlugs.size, 312);
  assert.ok(selected.urls.length <= policy.maxSitemapUrls);
  for (const slug of slugs) {
    assert.ok(selectedSlugs.has(slug), `${slug}: protected publication`);
    const article = articles.find((entry) => entry.slug === slug);
    for (const locale of ['en', 'zh-Hans']) {
      const url = `https://nexualpha.com/${locale === 'zh-Hans' ? 'zh-hans/' : ''}news/${slug}`;
      const client = computeRouteSeo({ url, locale, article, newsArticles: articles });
      const ssr = await routeMetadata(new URL(url), { ASSETS: assets(raw) });
      assert.equal(client.robots, 'index,follow', `${slug}/${locale}: client`);
      assert.equal(ssr.robots, 'index,follow', `${slug}/${locale}: SSR`);
    }
  }
});

test('retention protection never revives an explicitly noindex or withdrawn article', async () => {
  for (const slug of slugs) {
    const article = articles.find((entry) => entry.slug === slug);
    const noindex = { ...article, seo: { ...article.seo, noindex: true } };
    const modified = articles.map((entry) => entry.slug === slug ? noindex : entry);
    assert.ok(!articleSlugsFromPublication(publication(modified)).includes(slug));
    const url = `https://nexualpha.com/news/${slug}`;
    assert.equal(computeRouteSeo({ url, locale: 'en', article: noindex, newsArticles: modified }).robots, 'noindex,follow');
    assert.equal((await routeMetadata(new URL(url), { ASSETS: assets(modified) })).robots, 'noindex,follow');
    const sourceless = { ...article, sources: [] };
    const sourcelessFeed = articles.map((entry) => entry.slug === slug ? sourceless : entry);
    assert.ok(!articleSlugsFromPublication(publication(sourcelessFeed)).includes(slug));
    assert.equal(computeRouteSeo({ url, locale: 'en', article: sourceless, newsArticles: sourcelessFeed }).robots, 'noindex,follow');
    assert.equal((await routeMetadata(new URL(url), { ASSETS: assets(sourcelessFeed) })).robots, 'noindex,follow');
    const draft = { ...article, status: 'DRAFT' };
    const draftFeed = articles.map((entry) => entry.slug === slug ? draft : entry);
    assert.ok(!articleSlugsFromPublication(publication(draftFeed)).includes(slug));
    assert.equal(computeRouteSeo({ url, locale: 'en', article: draft, newsArticles: draftFeed }).status, 404);
    assert.equal((await routeMetadata(new URL(url), { ASSETS: assets(draftFeed) })).status, 404);
    const withdrawn = articles.filter((entry) => entry.slug !== slug);
    assert.ok(!articleSlugsFromPublication(publication(withdrawn)).includes(slug));
    assert.equal((await routeMetadata(new URL(url), { ASSETS: assets(withdrawn) })).status, 404);
  }
});


test('new PUBLISHED feed arrivals and feed order never replace the accepted 312 article roster', async () => {
  const baseline = articleSlugsFromPublication(publication(articles)).sort();
  const newArticle = { ...articles[0], slug: 'unreviewed-search-publication-arrival',
    publishedAt: '2026-10-02T00:00:00.000Z',
    seo: { ...articles[0].seo, noindex: false, canonical: 'https://nexualpha.com/news/unreviewed-search-publication-arrival' } };
  for (const feed of [[newArticle, ...articles], [...articles, newArticle], [...articles].reverse().concat(newArticle)]) {
    assert.deepEqual(articleSlugsFromPublication(publication(feed)).sort(), baseline);
    const url = `https://nexualpha.com/news/${newArticle.slug}`;
    const client = computeRouteSeo({ url, locale: 'en', article: newArticle, newsArticles: feed });
    const ssr = await routeMetadata(new URL(url), { ASSETS: assets(feed) });
    assert.equal(client.status, 200);
    assert.equal(ssr.status, 200);
    assert.equal(client.robots, 'noindex,follow');
    assert.equal(ssr.robots, 'noindex,follow');
  }
});


test('matching prerender fingerprint and searchPublished true never bypass reviewed article guard', async () => {
  const accepted = articles.find((article) => article.slug === slugs[0]);
  const fixtures = [
    { article: accepted, expected: 'index,follow' },
    { article: accepted, snapshotArticles: [], expected: 'noindex,nofollow', status: 404 },
    { article: { ...accepted, slug: 'unknown-manifest-article' }, expected: 'noindex,follow' },
    { article: { ...accepted, sources: [] }, expected: 'noindex,follow' },
    { article: { ...accepted, status: 'DRAFT' }, expected: 'noindex,follow' },
    { article: { ...accepted, seo: { ...accepted.seo, noindex: true } }, expected: 'noindex,follow' },
  ];
  for (const { article, expected, snapshotArticles = [article], status = 200 } of fixtures) {
    const contentPath = `/news/${article.slug}`;
    const body = JSON.stringify({ ...raw, articles: snapshotArticles });
    const fingerprint = createHash('sha256').update(body).digest('hex');
    const manifest = { version: 'nexualpha-prerender-v1', routes: { [`${contentPath}|en`]: {
      pathname: contentPath, locale: 'en', newsFeedFingerprint: fingerprint,
      searchPublished: true, newsArticles: snapshotArticles,
    } } };
    let usedManifest = false;
    let usedFingerprint = false;
    const ASSETS = { fetch: async (request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname === '/prerender-manifest.json') {
        usedManifest = true;
        return Response.json(manifest);
      }
      if (pathname === '/content/news-feed.sha256.txt') {
        usedFingerprint = true;
        return new Response(fingerprint);
      }
      if (pathname === '/content/news-feed.json') throw new Error('snapshot should be authoritative for this test');
      return new Response('missing', { status: 404 });
    } };
    const metadata = await routeMetadata(new URL(`https://nexualpha.com${contentPath}`), { ASSETS });
    assert.ok(usedManifest && usedFingerprint, 'tested the true snapshot branch');
    assert.equal(metadata.status, status);
    assert.equal(metadata.robots, expected, `${article.slug}: status=${article.status}, sources=${article.sources.length}`);
  }
});
