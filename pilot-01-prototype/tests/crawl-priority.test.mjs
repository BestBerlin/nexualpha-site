import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import worker from '../worker/index.js';
import { createSsrHarness, SHELL_HTML, prerenderState, hydrateInJsdom, hydrationErrors } from './helpers/ssr-hydration-harness.mjs';

const article = (slug, publishedAt, extra = {}) => ({
  slug, status: 'PUBLISHED', category: 'research', publishedAt,
  title: { en: `Bitcoin & funding <${slug}>`, 'zh-Hans': `比特币研究 ${slug}` },
  summary: { en: `Summary ${slug}.`, 'zh-Hans': `摘要 ${slug}` },
  aeo: { directAnswer: { en: `Direct answer & evidence for ${slug}.`, 'zh-Hans': `${slug} 的直接答案。` } },
  content: { en: `## Direct answer\n\nDirect answer & evidence for ${slug}.\n\n## Analysis\n\nBitcoin funding research.`, 'zh-Hans': `## 直接回答\n\n${slug} 的直接答案。\n\n## 分析\n\n比特币研究。` },
  sources: [{ id: 'source', url: 'https://example.com/research', publisher: 'Example' }],
  relatedVenues: ['binance'], availableLocales: ['en', 'zh-Hans'], seo: { noindex: false }, ...extra,
});
const rows = Array.from({ length: 60 }, (_, i) => article(`crawl-${String(i).padStart(2, '0')}`, new Date(Date.UTC(2026, 9, 20, 12) - i * 3600000).toISOString()));
const exclusions = [
  article('excluded-noindex', '2026-10-20T14:00:00Z', { seo: { noindex: true } }),
  article('excluded-unreviewed', '2026-10-20T14:00:00Z', { seo: {} }),
  article('excluded-invalid-date', 'not-a-date'),
  article('english-only', '2026-10-20T13:00:00Z', { availableLocales: ['en'], title: { en: 'English only' }, content: { en: '## Direct answer\n\nEnglish answer.' } }),
];
const makeEnv = (articles = [...rows, ...exclusions]) => ({ NEWS_SSR_RENDER: (href, options) => harness.render(href, options), ASSETS: { async fetch(request) {
  const path = new URL(request.url).pathname;
  if (path === '/content/news-feed.json') return Response.json({ articles });
  if (path === '/prerender-manifest.json') return Response.json({ routes: {} });
  if (path === '/index.html') return new Response(SHELL_HTML, { headers: { 'content-type': 'text/html' } });
  return new Response('missing', { status: 404 });
} } });
const fetchPage = (path, env) => worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: 'text/html' } }), env);
const parseHtml = (html) => new JSDOM(html).window.document;
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

test('English and Simplified Chinese homes expose eight native indexable articles and replay identical hydration', async () => {
  for (const [path, prefix] of [['/', ''], ['/zh-hans', '/zh-hans']]) {
    const html = await (await fetchPage(path, makeEnv())).text();
    const document = parseHtml(html);
    const block = document.querySelector('[data-home-latest]');
    assert.ok(block, path);
    const links = [...block.querySelectorAll('a')].filter(a => new RegExp(`^${prefix}/news/[^/]+$`).test(a.getAttribute('href')));
    assert.equal(links.length, 8, path);
    assert.ok(links.every(a => a.textContent.trim()), 'real titles');
    assert.ok(links.every(a => !a.href.includes('excluded-')), 'only reviewed articles with valid dates');
    if (prefix) assert.ok(links.every(a => !a.href.includes('english-only')), 'no missing-locale fallback links');
    for (const hub of ['/news', '/compare', '/data/exchange-fee-index']) assert.ok([...document.querySelectorAll('a')].some(a => a.getAttribute('href') === `${prefix}${hub}`), hub);
    assert.equal(prerenderState(html).homeLatest.length, 8);
    const hydrated = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(hydrated.errors), [], path);
  }
});

test('home latest updates from the request-time feed without rebuilding HTML', async () => {
  const env = makeEnv(rows);
  let current = rows;
  const originalFetch = env.ASSETS.fetch;
  env.ASSETS.fetch = async request => new URL(request.url).pathname === '/content/news-feed.json' ? Response.json({ articles: current }) : originalFetch(request);
  const before = await (await fetchPage('/', env)).text();
  assert.ok(!before.includes('/news/just-published'));
  current = [article('just-published', '2026-10-20T15:00:00Z'), ...rows];
  const after = await (await fetchPage('/', env)).text();
  assert.ok(parseHtml(after).querySelector('[data-home-latest] a[href="/news/just-published"]'));
});

test('RSS aliases and Chinese feed are valid XML, capped at 50 native reviewed articles with valid dates', async () => {
  for (const [path, prefix] of [['/rss.xml', ''], ['/feed.xml', ''], ['/zh-hans/rss.xml', '/zh-hans']]) {
    const response = await fetchPage(path, makeEnv());
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type'), /(?:rss\+xml|application\/xml|text\/xml)/);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=300');
    const xml = await response.text();
    const document = new JSDOM(xml, { contentType: 'application/xml' }).window.document;
    assert.equal(document.documentElement.tagName, 'rss');
    const items = [...document.querySelectorAll('channel > item')];
    assert.equal(items.length, 50);
    for (const item of items) {
      const link = item.querySelector('link').textContent;
      assert.ok(link.startsWith(`https://nexualpha.com${prefix}/news/`), link);
      assert.equal(item.querySelector('guid').textContent, link);
      assert.ok(Number.isFinite(Date.parse(item.querySelector('pubDate').textContent)));
      const slug = new URL(link).pathname.split('/').at(-1);
      assert.equal(item.querySelector('description').textContent, prefix ? `${slug} 的直接答案。` : `Direct answer & evidence for ${slug}.`);
      assert.ok(!link.includes('excluded-'));
      if (prefix) assert.ok(!link.includes('english-only'));
    }
  }
  for (const [path, feed] of [['/news', '/rss.xml'], ['/zh-hans/news', '/zh-hans/rss.xml']]) {
    const document = parseHtml(await (await fetchPage(path, makeEnv())).text());
    assert.ok(document.querySelector(`head link[rel="alternate"][type="application/rss+xml"][title="NexuAlpha"][href="${feed}"]`));
  }
});

test('article SSR links at least five native peers, including the two newest, without self or noindex links', async () => {
  for (const prefix of ['', '/zh-hans']) {
    const html = await (await fetchPage(`${prefix}/news/crawl-20`, makeEnv(rows.concat(exclusions.filter(a => a.slug !== 'english-only'))))).text();
    const document = parseHtml(html);
    const links = [...document.querySelectorAll('a[data-cta-placement="news-detail-related-article"]')].map(a => a.getAttribute('href'));
    assert.ok(links.length >= 5, `${prefix}: ${links.length} related articles`);
    assert.ok(links.every(href => href.startsWith(`${prefix}/news/`) && !href.includes('excluded-') && !href.endsWith('/crawl-20')));
    for (const slug of ['crawl-00', 'crawl-01']) assert.ok(links.includes(`${prefix}/news/${slug}`), slug);
  }
});


test('a prerendered home snapshot receives the fresh block and matching hydration state', async () => {
  for (const [path, locale] of [['/', 'en'], ['/zh-hans', 'zh-Hans']]) {
    const snapshot = await harness.render(`https://nexualpha.com/?locale=${locale}`, { homeLatest: [] });
    const env = makeEnv(rows);
    const originalFetch = env.ASSETS.fetch;
    env.ASSETS.fetch = async request => new URL(request.url).pathname === '/prerender-manifest.json'
      ? Response.json({ version: 'nexualpha-prerender-v1', routes: { [`/|${locale}`]: { pathname: '/', locale, html: snapshot } } })
      : originalFetch(request);
    const html = await (await fetchPage(path, env)).text();
    assert.equal(prerenderState(html).homeLatest.length, 8);
    const block = parseHtml(html).querySelector('[data-home-latest]');
    assert.ok(block.querySelector('a[href$="/news/crawl-00"]'));
    const hydrated = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(hydrated.errors), [], path);
  }
});

test('the news hub exposes topic research and every archive page as real anchors', async () => {
  for (const prefix of ['', '/zh-hans']) {
    const html = await (await fetchPage(`${prefix}/news`, makeEnv(rows))).text();
    const document = parseHtml(html);
    assert.ok(document.querySelector(`a[data-news-topic-hubs][href="${prefix}/topics"]`));
    const pagination = document.querySelector('.news-pagination');
    const total = Number(pagination.getAttribute('data-total-pages'));
    assert.ok(total > 1);
    for (let page = 2; page <= total; page++) assert.ok(pagination.querySelector(`a[href="${prefix}/news/page/${page}"]`), `${prefix}: archive ${page}`);
  }
});

test('home balances six fresh articles with the strongest reviewed GSC snapshot articles', async () => {
  const { strongNewsSlugs } = await import('../src/data/news-search-state.js');
  const strong = strongNewsSlugs().slice(0, 2).map((slug, i) => article(slug, `2026-09-${String(i + 1).padStart(2, '0')}T00:00:00Z`));
  const html = await (await fetchPage('/', makeEnv([...rows, ...strong]))).text();
  const links = [...parseHtml(html).querySelectorAll('[data-home-latest] li > a')].map(link => link.getAttribute('href'));
  assert.equal(links.length, 8);
  for (const fresh of rows.slice(0, 6)) assert.ok(links.includes(`/news/${fresh.slug}`));
  for (const item of strong) assert.ok(links.includes(`/news/${item.slug}`));
});

test('root home SSR and hydration preserve direct native-language news archive bridges', async () => {
  const { LOCALE_PREFIX_BY_CODE } = await import('../src/data/locale-routing.js');
  const html = await (await fetchPage('/', makeEnv(rows))).text();
  const document = parseHtml(html);
  const group = document.querySelector('[data-crawl-priority-links="home"] [data-news-editions]');
  assert.ok(group, 'lazy root related research renders its edition links on the server');
  for (const href of ['/coins', '/licenses', '/convert/btc-to-usd']) {
    const anchor = document.querySelector(`[data-crawl-priority-links="home"] a[href="${href}"]`);
    assert.ok(anchor, `${href} is directly linked from home`);
    assert.ok(anchor.textContent.trim(), href);
  }
  const links = [...group.querySelectorAll('a')];
  const editions = Object.entries(LOCALE_PREFIX_BY_CODE).filter(([locale]) => !['ur', 'uk'].includes(locale));
  assert.equal(links.length, editions.length);
  for (const [locale, prefix] of editions) {
    const anchor = group.querySelector(`a[href="${prefix ? `/${prefix}` : ""}/news"]`);
    assert.ok(anchor, locale);
    assert.equal(anchor.getAttribute('lang'), locale);
    assert.equal(anchor.getAttribute('hreflang'), locale);
    assert.ok(anchor.textContent.trim(), locale);
  }
  assert.ok(!group.querySelector('a[href="/ur/news"], a[href="/uk-ua/news"]'));
  const hydrated = await hydrateInJsdom(harness.vite, html, 'https://nexualpha.com/');
  assert.deepEqual(hydrationErrors(hydrated.errors), []);
});
