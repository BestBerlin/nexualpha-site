import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { tokenizedResearchArticles } from '../src/components/research/hub-research.js';
import worker from '../worker/index.js';
import { normalizeNewsArticle, normalizeNewsArticleSummary } from '../src/data/news-feed-client.js';
import { createSsrHarness, SHELL_HTML, prerenderState, hydrateInJsdom, hydrationErrors } from './helpers/ssr-hydration-harness.mjs';

const articles = Array.from({ length: 8 }, (_, i) => ({
  slug: `nvda-tokenized-stocks-${i}`, status: 'PUBLISHED', relatedVenues: ['binance'],
  availableLocales: ['en'], title: { en: `NVDA tokenized stocks update ${i}` },
  summary: { en: 'Nvidia tokenized stocks on Binance.' }, publishedAt: `2026-10-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
}));

test('tokenized hub and ticker selection uses matching locale editions before the five-row cap', () => {
  assert.deepEqual(tokenizedResearchArticles(articles, { ticker: 'NVDA' }).map(a => a.slug), articles.slice(3).reverse().map(a => a.slug));
  assert.deepEqual(tokenizedResearchArticles(articles, { ticker: 'TSLA' }), []);
  assert.deepEqual(tokenizedResearchArticles(articles, { locale: 'es' }), []);
});

test('full and summary normalization preserve compact nested claims for downstream hub matching', () => {
  const article = { ...articles[0], claims: [{ evidence: { text: 'NVDA tokenized stocks' } }],
    content: { en: 'Published research body.' }, sources: [{ id: 'official', title: 'Official research', url: 'https://example.com/research', publisher: 'Official' }] };
  const full = normalizeNewsArticle(article);
  const summary = normalizeNewsArticleSummary(article);
  assert.deepEqual(full.researchClaims, ['NVDA tokenized stocks']);
  assert.deepEqual(summary.researchClaims, full.researchClaims);
  assert.equal(summary.content, undefined);
  assert.equal(summary.sources, undefined);
  assert.deepEqual(tokenizedResearchArticles([{ ...summary, slug: 'claims-update', title: { en: 'Research' }, summary: { en: 'Update.' } }], { ticker: 'NVDA' }).map(a => a.slug), ['claims-update']);
});

test('venue, compare, coin, tokenized hub and ticker expose five plain research links outside disclosures in SSR', async t => {
  const harness = await createSsrHarness();
  t.after(() => harness.close());
  for (const path of ['/exchanges/binance', '/compare/binance-vs-okx', '/coins/bitcoin', '/tokenized-stocks', '/tokenized-stocks/nvda']) {
    const pool = path.startsWith('/coins/') ? articles.map(a => ({ ...a, title: { en: a.title.en + ' Bitcoin' } })) : articles;
    const html = await harness.render(`https://nexualpha.com${path}`, { newsArticles: pool });
    const document = new JSDOM(html).window.document;
    const section = document.querySelector('[data-hub-news-links]');
    assert.ok(section, path);
    assert.equal(section.querySelectorAll('[data-hub-news-link]').length, 5, path);
    assert.equal(section.closest('details'), null, path);
    for (const link of section.querySelectorAll('[data-hub-news-link]')) {
      assert.equal(link.tagName, 'A');
      assert.match(link.getAttribute('href'), /^\/news\/nvda-tokenized-stocks-\d$/);
    }
  }
});


test('actual Worker hub requests carry only matching edition summaries and hydrate the same live research links', async t => {
  const harness = await createSsrHarness();
  t.after(() => harness.close());
  // The newest two rows have no Spanish body; translated hubs must reach older native editions instead.
  const feedArticles = Array.from({ length: 10 }, (_, i) => ({
    ...articles[i % articles.length], slug: `worker-nvda-bitcoin-tokenized-stocks-${i}`,
    publishedAt: `2026-10-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    category: 'research', seo: { noindex: false },
    title: { en: `Binance Bitcoin NVDA tokenized stocks ${i}`, ...(i < 8 ? { es: `Binance Bitcoin acciones tokenizadas NVDA ${i}` } : {}) },
    summary: { en: `Bitcoin and Nvidia tokenized stocks research ${i}.`, ...(i < 8 ? { es: `Investigación Bitcoin y NVDA ${i}.` } : {}) },
    content: { en: `# Binance Bitcoin NVDA research ${i}\n\nPublished fixture body.`, ...(i < 8 ? { es: `# Investigación Binance Bitcoin NVDA ${i}\n\nCuerpo publicado de prueba.` } : {}) },
    availableLocales: i < 8 ? ['en', 'es'] : ['en'],
    sources: [],
  }));
  // No venue, coin, ticker or tokenized-stock term appears outside this row's nested claims.
  Object.assign(feedArticles[7], {
    slug: 'worker-claim-update-7', relatedVenues: [],
    title: { en: 'Publisher claim update 7', es: 'Actualización editorial 7' },
    summary: { en: 'Published research update.', es: 'Actualización de investigación.' },
    content: { en: '# Publisher update 7\n\nPublished body.', es: '# Actualización editorial 7\n\nCuerpo publicado.' },
    claims: [{ evidence: { text: 'Binance Bitcoin NVDA tokenized stocks' } }],
  });
  const assets = { fetch: async request => {
    const path = new URL(request.url).pathname;
    if (path === '/content/news-feed.json') return new Response(JSON.stringify({ articles: feedArticles }), { headers: { 'content-type': 'application/json' } });
    if (path === '/prerender-manifest.json') return new Response(JSON.stringify({ routes: Object.fromEntries(['en', 'es'].flatMap(locale => ['/exchanges/binance', '/compare/binance-vs-okx', '/coins/bitcoin', '/tokenized-stocks', '/tokenized-stocks/nvda'].map(path => [`${path}|${locale}`, { html: '<main><h1>STALE BUILD SNAPSHOT</h1></main>' }]))) }), { headers: { 'content-type': 'application/json' } });
    if (path === '/index.html') return new Response(SHELL_HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    return new Response('missing', { status: 404 });
  } };
  const calls = [];
  const env = { ASSETS: assets, NEWS_SSR_RENDER: (href, options) => { calls.push(options); return harness.render(href, options); } };
  const fetchPage = path => worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: 'text/html' } }), env);
  const resolved = new Set();
  for (const locale of ['en', 'es']) {
    const prefix = locale === 'en' ? '' : '/es';
    const expected = feedArticles.slice(0, locale === 'en' ? 10 : 8).slice(-5).reverse().map(a => a.slug);
    for (const base of ['/exchanges/binance', '/compare/binance-vs-okx', '/coins/bitcoin', '/tokenized-stocks', '/tokenized-stocks/nvda']) {
      const path = prefix + base;
      calls.length = 0;
      const response = await fetchPage(path);
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.doesNotMatch(html, /STALE BUILD SNAPSHOT/, `${path}: stale manifest cannot bypass fresh research`);
      const state = prerenderState(html);
      assert.ok(state, `${path}: worker emits hydration state`);
      assert.deepEqual(state.newsArticles.map(a => a.slug), expected, `${path}: locale filter before newest-five cap`);
      assert.deepEqual(JSON.parse(JSON.stringify(calls.at(-1).newsArticles)), state.newsArticles, `${path}: SSR and hydration share the preselected pool`);
      assert.deepEqual(state.newsArticles.find(a => a.slug === "worker-claim-update-7")?.researchClaims, ["Binance Bitcoin NVDA tokenized stocks"], `${path}: compact claims survive the worker projection`);
      for (const article of state.newsArticles) {
        assert.equal(article.content, undefined, `${path}: no bodies cross into hub hydration`);
        assert.equal(article.sources, undefined, `${path}: no source arrays cross into hub hydration`);
      }
      const document = new JSDOM(html).window.document;
      const links = [...document.querySelectorAll('[data-hub-news-link]')].map(a => a.getAttribute('href'));
      assert.deepEqual(links, expected.map(slug => `${prefix}/news/${slug}`), `${path}: own-edition anchors`);
      const hydrated = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`, {
        timeoutMs: 250,
        inspect: window => [...window.document.querySelectorAll('[data-hub-news-link]')].map(a => a.getAttribute('href')),
      });
      assert.deepEqual(hydrationErrors(hydrated.errors), [], `${path}: no hydration mismatch`);
      assert.deepEqual(hydrated.inspected, links, `${path}: hydration retains SSR research anchors`);
      for (const href of links) {
        if (resolved.has(href)) continue;
        const target = await fetchPage(href);
        assert.equal(target.status, 200, `${path}: ${href} resolves through the actual worker`);
        const targetHtml = await target.text();
        const slug = href.split('/').at(-1);
        assert.ok(feedArticles.some(a => a.slug === slug && a.content[locale]), `${href}: declared edition has a published body`);
        assert.ok(new JSDOM(targetHtml).window.document.querySelector('h1')?.textContent.includes(slug.split('-').at(-1)), `${href}: target renders the fixture article`);
        resolved.add(href);
      }
    }
  }
});
