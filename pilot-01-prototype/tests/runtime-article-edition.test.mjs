import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import worker, { routeMetadata, renderArticleSitemap, renderLiveNewsSitemap, refreshSitemapIndexLastmods } from '../worker/index.js';
import { buildSplitSitemaps } from '../scripts/generate-prerender-manifest.mjs';
import { newsArticleGeoView, newsMetadataAllowed, newsVenueAllowed } from '../src/data/news-geo-policy.js';
import { createSsrHarness, SHELL_HTML, prerenderState } from './helpers/ssr-hydration-harness.mjs';

// These venues cannot be promoted in Türkiye but may be named informationally.
const examples = [
  ['hyperliquid-vs-dydx', 'Hyperliquid mi dYdX mi?', 'Hyperliquid ve dYdX komisyon, fonlama ve teminat mekanizmaları.'],
  ['how-to-set-up-kraken-global-settings-lock-safely', 'Kraken Global Settings Lock nasıl kurulur?', 'Kraken hesap ayarlarını ve kilit açma koşullarını doğrulayın.'],
  ['reserve-rights-rsr-upbit-listing-46-percent-negative-funding', 'RSR Upbit listelemesi ve negatif fonlama', 'Upbit listelemesi; Hyperliquid fonlama verileri sonuçları kanıtlamaz.'],
  ['what-is-funding-rate-crypto-perpetuals-how-it-is-calculated', 'Fonlama oranı nedir ve nasıl hesaplanır?', 'Hyperliquid ve dYdX fonlama aralıklarını resmi kaynaklardan doğrulayın.'],
];
function article([slug, title, body], translated = true) {
  return { slug, status: 'PUBLISHED', publishedAt: '2026-10-01T00:00:00Z',
    title: { en: `${slug} research`, ...(translated ? { tr: title } : {}) },
    summary: { en: 'Source-backed research and account checks.', ...(translated ? { tr: body } : {}) },
    content: { en: '## Research\n\nSource-backed research and account checks.', ...(translated ? { tr: `## Araştırma\n\n${body}` } : {}) },
    availableLocales: translated ? ['en', 'tr'] : ['en'],
    sources: [{ publisher: 'Official documentation', url: 'https://docs.hyperliquid.xyz/' }], seo: { noindex: false } };
}
function assetsFor(articles) {
  const state = {};
  state.publish = rows => { state.text = JSON.stringify({ articles: rows }); state.sha = createHash('sha256').update(state.text).digest('hex'); };
  state.publish(articles);
  state.fetch = async request => {
    const path = new URL(request.url).pathname;
    if (path === '/index.html') return new Response(SHELL_HTML, { headers: { 'content-type': 'text/html' } });
    if (path === '/content/news-feed.json') return new Response(state.text);
    if (path === '/content/news-feed.sha256.txt') return new Response(state.sha);
    if (path === '/prerender-manifest.json') return Response.json(state.manifest || { routes: {} });
    return new Response('missing', { status: 404 });
  };
  return state;
}
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

test('Turkish article sitemap URLs retain native SSR body and self canonical for informational venues', async () => {
  const rows = examples.map(row => article(row));
  const env = { ASSETS: assetsFor(rows), NEWS_SSR_RENDER: harness.render };
  const inventory = rows.map(row => ({ pathname: `/news/${row.slug}`, locales: ['en', 'tr'], index: true, template: 'article', priority: 0.7 }));
  const built = buildSplitSitemaps(inventory, rows).files.get('sitemap-articles-tr.xml').xml;
  const served = await (await worker.fetch(new Request('https://nexualpha.com/sitemap-articles-tr.xml'), env)).text();
  for (const [slug, title] of examples) {
    const url = `https://nexualpha.com/tr/news/${slug}`;
    assert.ok(built.includes(`<loc>${url}</loc>`), 'build sitemap includes native edition');
    assert.ok(served.includes(`<loc>${url}</loc>`), 'runtime sitemap includes native edition');
    const response = await worker.fetch(new Request(url), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-nexualpha-news-render'), 'runtime', 'real React SSR must succeed');
    const html = await response.text();
    assert.match(html, /name="robots" content="index,follow"/);
    assert.ok(html.includes(`rel="canonical" href="${url}"`));
    assert.ok(html.includes(`<h1 class="news-detail__title">${title}</h1>`));
    assert.equal(prerenderState(html).newsArticles.find(row => row.slug === slug).content.tr, article(examples.find(row => row[0] === slug)).content.tr);
  }
});

test('an edition added after publication replaces the warmed feed and stale prerender snapshot', async () => {
  const before = article(examples[0], false);
  const ASSETS = assetsFor([before]);
  const url = new URL(`https://nexualpha.com/tr/news/${before.slug}`);
  ASSETS.manifest = { routes: { [`/news/${before.slug}|tr`]: { newsFeedFingerprint: ASSETS.sha, newsArticles: [before], searchPublished: true } } };
  const env = { ASSETS, NEWS_SSR_RENDER: harness.render };
  assert.equal((await routeMetadata(url, env)).robots, 'noindex,follow');
  await worker.fetch(new Request('https://nexualpha.com/sitemap-articles-tr.xml'), env);
  ASSETS.publish([article(examples[0])]);
  const metadata = await routeMetadata(url, env);
  assert.equal(metadata.robots, 'index,follow');
  assert.equal(metadata.canonical, url.href);
  assert.equal(metadata.newsArticles[0].content.tr, article(examples[0]).content.tr);
});

test('informational editions retain the promotional and unlisted-venue boundaries', () => {
  assert.equal(newsVenueAllowed('kraken', { locale: 'tr' }), false, 'promotion remains restricted');
  assert.equal(newsMetadataAllowed('Kraken and Hyperliquid research', { locale: 'tr' }), true);
  for (const context of [{ locale: 'tr' }, { locale: 'tr', market: 'SG' }, { locale: 'en', market: 'TR' }]) {
    assert.equal(newsMetadataAllowed('Bitget research', context), false);
    assert.equal(newsArticleGeoView({ ...article(examples[0]), content: { en: 'Research', tr: 'Bitget research' } }, context).content.tr, undefined);
  }
  assert.equal(newsMetadataAllowed('CoinW research', { locale: 'en', market: 'US' }), false);
});

test('dynamic article and Google News sitemaps exclude projected and non-self-canonical editions', async () => {
  const now = Date.parse('2026-10-22T08:00:00Z');
  const safe = { ...article(examples[0]), publishedAt: '2026-10-22T07:00:00Z' };
  const blocked = { ...article(['bitget-editorial-boundary', 'Bitget araştırması', 'Bitget research']), publishedAt: safe.publishedAt };
  const duplicate = { ...safe, slug: 'hyperliquid-duplicate-research', canonicalSlug: safe.slug };
  const rows = [safe, blocked, duplicate];
  const ASSETS = assetsFor(rows);
  const tr = await (await worker.fetch(new Request('https://nexualpha.com/sitemap-articles-tr.xml'), { ASSETS })).text();
  assert.ok(tr.includes(`/tr/news/${safe.slug}</loc>`));
  assert.doesNotMatch(tr, /bitget-editorial-boundary|hyperliquid-duplicate-research/);
  const en = renderArticleSitemap(rows, 'en');
  assert.ok(en.includes(`/news/${blocked.slug}</loc>`), 'unrestricted English research remains indexable');
  assert.doesNotMatch(en, /hyperliquid-duplicate-research/);
  assert.doesNotMatch(en, /hreflang="tr" href="https:\/\/nexualpha.com\/tr\/news\/bitget-editorial-boundary/);
  const news = renderLiveNewsSitemap(rows, now);
  assert.doesNotMatch(news, /hyperliquid-duplicate-research/);
  assert.doesNotMatch(news, /<loc>https:\/\/nexualpha.com\/tr\/news\/bitget-editorial-boundary<\/loc>/);
  const index = '<sitemapindex>\n<sitemap><loc>https://nexualpha.com/sitemap-articles-en.xml</loc></sitemap>\n<sitemap><loc>https://nexualpha.com/sitemap-articles-tr.xml</loc></sitemap>\n</sitemapindex>';
  const refreshed = refreshSitemapIndexLastmods(index, [blocked], now);
  assert.match(refreshed, /sitemap-articles-en.xml/);
  assert.doesNotMatch(refreshed, /sitemap-articles-tr.xml/);
});

test('runtime article sitemap retains eligible arrivals beyond the former 5000 article cap', () => {
  const base = article(['cap-source', 'Araştırma', 'Research'], false);
  const rows = Array.from({ length: 5001 }, (_, index) => ({ ...base, slug: `uncapped-research-${index}` }));
  const xml = renderArticleSitemap(rows, 'en');
  assert.equal([...xml.matchAll(/<url>/g)].length, rows.length);
  assert.ok(xml.includes('/news/uncapped-research-5000</loc>'));
});
