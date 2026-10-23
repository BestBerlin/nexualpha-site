// Reproduces the embedded-claims leak reported on 2026-10-23. The reported live
// packages are absent from the checked-in feed, so these are synthetic test data.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import worker from '../worker/index.js';
import { newsArticleGeoPool, newsArticleGeoView } from '../src/data/news-geo-policy.js';
import { createSsrHarness, prerenderState, rootInnerHtml, SHELL_HTML } from './helpers/ssr-hydration-harness.mjs';
import { createNewsSsrRenderer } from '../server/news-ssr.mjs';

const slugs = [
  'bitcoin-below-82000-long-liquidations-funding-split-october-2026',
  'why-is-magma-up-today-magma-finance-52-percent-binance-futures-volume-what-to-check',
  'exchange-rewards-terms', 'tokenized-stocks-source-check', 'funding-liquidations-source-check',
];
const articles = slugs.map((slug, index) => ({
  slug, status: 'PUBLISHED', category: 'research', publishedAt: `2026-10-${20 - index}T00:00:00Z`,
  availableLocales: ['en', 'tr'], relatedVenues: ['okx', 'bitget'], seo: { noindex: false },
  title: { en: `Source check ${index}`, tr: `Kaynak kontrolü ${index}` },
  summary: { en: 'Funding, liquidations and tokenized stocks: Bitget and OKX sources.', tr: 'Fonlama ve likidasyon kaynaklarını doğrulayın.' },
  content: { en: '## Sources\n\nBitget and OKX market sources.', tr: "## Kaynaklar\n\nOKX kaynaklarını doğrulayın. 200$'a kadar." },
  sources: [{ id: 'okx-rules', publisher: 'OKX', url: 'https://www.okx.com/help' }, { id: 'bitget-rules', publisher: 'Bitget', url: 'https://www.bitget.com/support' }],
  researchClaims: [{ id: 'bitget-rewards', claim: "Bitget's welcome package pays up to 6,200 USDT", sourceIds: ['bitget-rules'] }, { claim: 'OKX source check', sourceIds: ['okx-rules'] }],
  marketFacts: [{ id: 'bg-ticker', text: 'Bitget and Bybit +0.005%' }, { id: 'okx-ticker', text: 'OKX source check' }],
}));
const subject = { ...articles[0], slug: 'bitget-rewards', title: { en: 'Bitget rewards', tr: 'Bitget ödülleri' } };
const feed = { articles: [...articles, subject] };
const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const funding = json('./fixtures/funding-rates-live-2026-10-14.json');
funding.generatedAt = new Date().toISOString();
for (const venue of Object.values(funding.venues)) venue.readAt = funding.generatedAt;
funding.venues.bitget = { ...funding.venues.okx };
const marketEvents = json('./fixtures/market-data/market-events.live-v2-2026-10-13.json');
const announcements = { items: [{ id: 'bitget:fixture', venue: 'bitget', title: 'Bitget source check', category: 'event', publishedAt: new Date().toISOString(), url: 'https://www.bitget.com/support' }] };
const assets = { fetch: async request => {
  const path = new URL(request.url).pathname;
  if (path === '/index.html') return new Response(SHELL_HTML, { headers: { 'content-type': 'text/html' } });
  if (path === '/content/news-feed.json') return Response.json(feed);
  if (path === '/intel/official-announcements.json') return Response.json(announcements);
  if (path === '/prerender-manifest.json') return Response.json({ routes });
  return new Response('missing', { status: 404 });
} };
let harness;
const routes = {};
const paths = ['/', '/news', ...slugs.map(slug => `/news/${slug}`), '/exchanges', '/compare', '/compare/binance-vs-okx', '/tokenized-stocks', '/tokenized-stocks/nvda', '/activities', '/funding-rates', '/liquidations'];
test.before(async () => {
  harness = process.env.TR_BITGET_BUILT_SSR === '1'
    ? { render: createNewsSsrRenderer(fileURLToPath(new URL('../dist/', import.meta.url))) }
    : await createSsrHarness();
  for (const locale of ['en', 'tr']) for (const path of paths) {
    routes[`${path}|${locale}`] = { html: await harness.render(`https://nexualpha.com${path}?locale=${locale}`), searchPublished: true };
  }
});
test.after(async () => { await harness?.close?.(); });
const count = text => (text.match(/bitget/gi) || []).length;
async function response(path) {
  const res = await worker.fetch(new Request(`https://nexualpha.com${path}`), {
    ASSETS: assets, NEWS_SSR_RENDER: harness.render, FUNDING_READ: async () => funding,
    MARKET_EVENTS_READ: async () => marketEvents, INTEL_READ: async () => announcements,
  });
  return { status: res.status, html: await res.text() };
}

test('worker + SSR: zero Bitget in full Turkish responses; English remains rendered', async t => {
  const counts = [];
  for (const path of paths) {
    const tr = await response(`/tr${path === '/' ? '' : path}`);
    const en = await response(path);
    counts.push([path, count(tr.html), count(en.html)]);
    assert.equal(tr.status, 200, `tr ${path}`);
    assert.equal(en.status, 200, `en ${path}`);
    for (const [locale, page] of [['tr', tr], ['en', en]]) {
      assert.match(page.html, /<h1\b/, `${locale} ${path}: actual SSR body`);
      assert.ok(prerenderState(page.html), `${locale} ${path}: hydration payload`);
    }
  }
  t.diagnostic(`Full response counts [route, tr, en]: ${JSON.stringify(counts)}`);
  assert.deepEqual(counts.filter(([, tr]) => tr !== 0), [], 'Turkish response leaks');
  for (const slug of slugs) {
    assert.match((await response(`/news/${slug}`)).html, /Bitget and OKX market sources/, 'English retains source text');
    const tr = await response(`/tr/news/${slug}?market=SG`);
    assert.equal(count(tr.html), 0, 'permissive market cannot override Turkish restriction');
    for (const row of prerenderState(tr.html).newsArticles.filter(row => row.slug !== slug)) {
      assert.equal(row.researchClaims, undefined, 'related cards carry no unrendered claims');
      assert.equal(row.content, undefined, 'only the current article carries content');
    }
    const state = prerenderState(tr.html);
    const replay = await harness.render(`https://nexualpha.com/tr/news/${slug}?market=SG`, { newsArticles: state.newsArticles, seoAlternates: state.seoAlternates });
    assert.equal(replay, rootInnerHtml(tr.html), 'Turkish hydration props reproduce the exact SSR body');
  }
});

test('metadata projection covers nested values and keys without mutating source records', () => {
  const raw = { ...articles[0], entities: { bitget: { ticker: 'BGB' }, okx: { ticker: 'OKB' } }, newMetadataField: { note: 'BitGet research', safe: 'OKX' } };
  const original = JSON.stringify(raw);
  const view = newsArticleGeoView(raw, { locale: 'tr', market: 'SG' });
  assert.equal(count(JSON.stringify(view)), 0);
  assert.deepEqual(view.marketFacts, [{ id: 'okx-ticker', text: 'OKX source check' }]);
  assert.equal(view.entities.okx.ticker, 'OKB');
  assert.equal(view.newMetadataField.safe, 'OKX');
  assert.equal(JSON.stringify(raw), original);
  assert.match(JSON.stringify(newsArticleGeoView(raw, { locale: 'en' })), /BitGet research/);
  assert.deepEqual(newsArticleGeoPool([subject], { locale: 'tr' }, subject.slug), [], 'requested restricted subject is omitted');
});

test('localized article API and worker fallback exclude claims and source leaks', async () => {
  for (const slug of slugs) {
    const fallback = await worker.fetch(new Request(`https://nexualpha.com/tr/news/${slug}`), { ASSETS: assets });
    assert.equal(fallback.status, 200);
    assert.equal(count(await fallback.text()), 0);
    const api = await worker.fetch(new Request(`https://nexualpha.com/api/news/article/${slug}?locale=tr&market=SG`), { ASSETS: assets });
    assert.equal(api.status, 200);
    assert.equal(count(await api.text()), 0);
  }
  for (const path of ['/content/news-feed.json?locale=tr', '/content/news-feed-summary.json?locale=tr', '/api/news/search?locale=tr', '/api/news/search?market=TR', `/api/news/article/${slugs[0]}?market=TR`]) {
    const res = await worker.fetch(new Request(`https://nexualpha.com${path}`), { ASSETS: assets });
    assert.equal(res.status, 200, path);
    assert.equal(count(await res.text()), 0, path);
  }
});

test('fingerprint-matched prerenders cannot bypass Turkish article projection', async () => {
  const path = `/news/${slugs[0]}`;
  const fingerprint = createHash('sha256').update(JSON.stringify(feed)).digest('hex');
  const html = (await harness.render(`https://nexualpha.com/tr${path}`, { newsArticles: feed.articles }))
    .replace('<main', () => '<main data-cached-article="true"');
  const cachedAssets = { fetch: async request => {
    const asset = new URL(request.url).pathname;
    if (asset === '/content/news-feed.sha256.txt') return new Response(fingerprint);
    if (asset === '/prerender-manifest.json') return Response.json({ routes: {
      [`${path}|tr`]: { html, newsArticles: feed.articles, newsFeedFingerprint: fingerprint, searchPublished: true },
    } });
    return assets.fetch(request);
  } };
  const res = await worker.fetch(new Request(`https://nexualpha.com/tr${path}`), { ASSETS: cachedAssets });
  const body = await res.text();
  assert.equal(res.status, 200);
  assert.doesNotMatch(body, /data-cached-article="true"/, 'restricted editions bypass locale-only article snapshots');
  assert.equal(count(body), 0);
  assert.ok(prerenderState(body).newsArticles.length > 1, 'safe related rows still hydrate');
});

test('restricted article subjects redirect without echoing the requested slug into HTML', async () => {
  for (const path of ['/tr/news/bitget-rewards', '/tr/news/bitget-rewards?market=SG', '/news/bitget-rewards?market=TR']) {
    const res = await worker.fetch(new Request(`https://nexualpha.com${path}`), { ASSETS: assets, NEWS_SSR_RENDER: harness.render });
    assert.equal(res.status, 301, path);
    assert.equal(count(res.headers.get('location')), 0);
    assert.equal(await res.text(), '', 'no canonical, og:url or hydration pathname leaks');
  }
  assert.equal((await response('/news/bitget-rewards')).status, 200, 'English subject remains available');
});
