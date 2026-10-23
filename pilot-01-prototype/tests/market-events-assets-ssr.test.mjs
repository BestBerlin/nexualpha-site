import test from 'node:test';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from '../worker/index.js';
import { marketAssetSnapshot } from '../src/data/market-events-assets.js';
import { createSsrHarness, SHELL_HTML, prerenderState, rootInnerHtml, hydrateInJsdom, hydrationErrors } from './helpers/ssr-hydration-harness.mjs';
const feed = JSON.parse(await readFile(new URL('./fixtures/market-data/market-events.live-v2-2026-10-13.json', import.meta.url)));
const article = {
  slug: 'fixture-market-asset-context', status: 'PUBLISHED', category: 'research',
  categoryName: { en: 'Research', 'zh-Hans': '研究' },
  publishedAt: '2026-10-13T15:00:00.000Z', updatedAt: '2026-10-13T15:00:00.000Z', author: 'NexuAlpha Research Desk',
  title: { en: 'Bitcoin market context', 'zh-Hans': '比特币市场背景' },
  summary: { en: 'BTC source data and its limits.', 'zh-Hans': 'BTC 数据来源与局限。' },
  content: { en: '## Sources\n\nBitcoin market context uses observed collector data.', 'zh-Hans': '## 数据来源\n\n比特币市场背景使用采集器数据。' },
  sources: [{ url: 'https://example.com/fixture', publisher: 'Fixture', title: 'Test source' }],
  availableLocales: ['en', 'zh-Hans'], relatedVenues: [], seo: { noindex: false },
};
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const env = (current = article) => ({
  MARKET_EVENTS_READ: async () => ({ ...feed, stale: true }),
  NEWS_SSR_RENDER: (href, options) => harness.render(href, options),
  ASSETS: { fetch: async request => {
    const path = new URL(request.url).pathname;
    if (path === '/index.html') return new Response(SHELL_HTML, { headers: { 'content-type': 'text/html' } });
    if (path === '/content/news-feed.json') return Response.json({ articles: [current] });
    return new Response('', { status: 404 });
  } },
});

test('English and Chinese rails render in SSR with identical hydration and no initial market fetch', async () => {
  for (const prefix of ['', '/zh-hans']) {
    const href = `https://nexualpha.com${prefix}/news/${article.slug}`;
    const response = await worker.fetch(new Request(href, { headers: { accept: 'text/html' } }), env());
    assert.equal(response.status, 200);
    const html = await response.text();
    const state = prerenderState(html);
    assert.ok(state?.marketEvents);
    assert.deepEqual(state.marketEvents, { ...marketAssetSnapshot(feed, ['BTC']), stale: true });
    assert.match(html, /data-market-context="BTC"/);
    assert.ok(!JSON.stringify(state.marketEvents).includes('timeline'));
    const replay = await harness.render(href, { newsArticles: state.newsArticles, marketEvents: state.marketEvents, seoAlternates: state.seoAlternates });
    assert.equal(replay, rootInnerHtml(html), 'SSR and hydration props render byte-identical markup');
    const requests = [];
    const hydrated = await hydrateInJsdom(harness.vite, html, href, {
      timeoutMs: 100, settleMs: 10,
      fetchImpl: async input => { requests.push(String(input?.url || input)); return new Response('{}', { status: 404 }); },
      inspect: window => window.document.querySelector('[data-market-context]')?.outerHTML,
    });
    assert.deepEqual(hydrationErrors(hydrated.errors), []);
    const parsed = new JSDOM(html);
    assert.equal(hydrated.inspected, parsed.window.document.querySelector('[data-market-context]')?.outerHTML);
    parsed.window.close();
    assert.ok(!requests.some(path => /market-events/.test(path)), requests.join('\n'));
  }
});

test('cold SSR failure keeps the rail empty and recovery requests only the asset route', async () => {
  const options = env();
  options.MARKET_EVENTS_READ = async () => null;
  const href = `https://nexualpha.com/news/${article.slug}`;
  const html = await (await worker.fetch(new Request(href), options)).text();
  assert.doesNotMatch(html, /data-market-context=/);
  const requests = [];
  const hydrated = await hydrateInJsdom(harness.vite, html, href, {
    timeoutMs: 500, settleMs: 10,
    fetchImpl: async input => {
      const path = String(input?.url || input); requests.push(path);
      return path.startsWith('/api/market-events/asset?') ? Response.json({ ...marketAssetSnapshot(feed, ['BTC']), stale: true }) : new Response('{}', { status: 404 });
    },
    until: window => Boolean(window.document.querySelector('[data-market-context]')),
    inspect: window => window.document.querySelector('[data-market-context]')?.textContent,
  });
  assert.deepEqual(hydrationErrors(hydrated.errors), []);
  assert.ok(hydrated.inspected);
  assert.ok(requests.includes('/api/market-events/asset?symbols=BTC'));
  assert.ok(!requests.includes('/intel/market-events.json'));
});


test('unrelated articles skip the market reader and cold reads cannot hold article SSR', async () => {
  const unrelated = { ...article,
    title: { en: 'Exchange source policy' }, summary: { en: 'Source policy and review limits.' },
    content: { en: '## Sources\n\nReview the original exchange disclosures.' },
    availableLocales: ['en'],
  };
  const options = env(unrelated);
  let reads = 0;
  options.MARKET_EVENTS_READ = async () => { reads++; return feed; };
  const href = `https://nexualpha.com/news/${article.slug}`;
  const html = await (await worker.fetch(new Request(href), options)).text();
  assert.match(html, /Exchange source policy/);
  assert.equal(reads, 0);
  assert.equal(prerenderState(html).marketEvents, undefined);
  let release;
  const slow = env();
  slow.MARKET_EVENTS_READ = () => new Promise(resolve => { release = resolve; });
  const started = performance.now();
  const pending = worker.fetch(new Request(href), slow);
  const timeout = setTimeout(() => release?.(feed), 2000);
  try {
    const response = await pending;
    assert.equal(response.status, 200);
    assert.ok(performance.now() - started < 1500, 'cold market reads have a bounded SSR wait');
    assert.equal(prerenderState(await response.text()).marketEvents, undefined);
  } finally { clearTimeout(timeout); release?.(feed); }
});


test('a current build-time article prerender cannot bypass the live market SSR seed', async () => {
  const options = env();
  const pathname = `/news/${article.slug}`, href = `https://nexualpha.com${pathname}`;
  const snapshotHtml = await harness.render(href, { newsArticles: [article] });
  const newsFeedFingerprint = createHash('sha256').update(JSON.stringify({ articles: [article] })).digest('hex');
  const originalFetch = options.ASSETS.fetch;
  options.ASSETS.fetch = async request => new URL(request.url).pathname === '/prerender-manifest.json'
    ? Response.json({ routes: { [`${pathname}|en`]: { html: snapshotHtml, newsArticles: [article], newsFeedFingerprint, searchPublished: true } } })
    : originalFetch(request);
  const html = await (await worker.fetch(new Request(href), options)).text();
  assert.match(html, /data-market-context="BTC"/);
  assert.deepEqual(prerenderState(html).marketEvents, { ...marketAssetSnapshot(feed, ['BTC']), stale: true });
});
