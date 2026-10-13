import { normalizeNewsFeed } from '../src/data/news-feed-client.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { exchangeHubNewsItems, coinHubNewsItems } from '../src/data/hub-entity-news.js';
import { exchangeHubToolLinks } from '../src/data/exchange-hub-links.js';
import { LOCALE_PREFIX_BY_CODE } from '../src/data/locale-routing.js';
import { coinBySlug } from '../src/data/coins.js';
import { createSsrHarness, hydrateInJsdom, hydrationErrors } from './helpers/ssr-hydration-harness.mjs';
const source = JSON.parse(fs.readFileSync(new URL('../public/content/news-feed.json', import.meta.url))).articles.find(a => a.slug === 'okx-usd-to-usdc-spot-pair-migration');
const articles = Array.from({ length: 8 }, (_, i) => ({ ...source, slug: `binance-bitcoin-${i}`, status: 'PUBLISHED', relatedVenues: ['binance'], title: { en: `Binance Bitcoin update ${i}` }, summary: { en: 'Bitcoin (BTC) on Binance.' }, publishedAt: `2026-10-${String(i + 1).padStart(2, '0')}T00:00:00Z` }));
test('entity hubs select six newest published matching articles and informational tool links in every locale', () => {
  for (const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) {
    const items = exchangeHubNewsItems([...articles, { ...articles[7], slug: 'draft', status: 'DRAFT' }], { slug: 'binance', name: 'Binance', locale });
    assert.equal(items.length, 6);
    assert.deepEqual(items.map(a => a.slug), articles.slice(2).reverse().map(a => a.slug));
    assert.equal(coinHubNewsItems(articles, { coin: coinBySlug('bitcoin'), locale }).length, 6);
    const tools = exchangeHubToolLinks('binance', locale);
    if (locale === 'tr') assert.ok(!exchangeHubToolLinks('bitget', locale).some(t => t.key === 'campaigns'));
    assert.ok(tools.some(a => a.key === 'fees'));
    assert.ok(tools.some(a => a.key === 'app'));
    assert.ok([...items, ...tools].every(a => a.href.startsWith('/') && !a.href.includes('/go/')));
  }
});
test('exchange and coin hubs SSR render plain anchors and hydrate with the same news state', async t => {
  const harness = await createSsrHarness();
  t.after(() => harness.close());
  for (const path of ['/exchanges/binance', '/coins/bitcoin']) {
    const html = await harness.render(`https://nexualpha.com${path}`, { newsArticles: articles });
    const section = html.match(/<section[^>]*data-hub-news-links[^>]*>[\s\S]*?<\/section>/)?.[0];
    assert.ok(section, path);
    assert.equal((section.match(/data-hub-news-link=/g) || []).length, 6);
    assert.doesNotMatch(section, /href="\/go\//);
    const document = `<!doctype html><html><body><div id="root">${html}</div><script type="application/json" id="nexualpha-prerender-state">${JSON.stringify({ pathname: path, locale: 'en', newsArticles: normalizeNewsFeed(articles) })}</script></body></html>`;
    const hydrated = await hydrateInJsdom(harness.vite, document, `https://nexualpha.com${path}`, { timeoutMs: 500 });
    assert.deepEqual(hydrationErrors(hydrated.errors), [], path);
  }
});

test('single-letter coin tickers cannot match unrelated running text', () => {
  assert.deepEqual(coinHubNewsItems(articles, { coin: { slug: 'vaulta', id: 'vaulta', name: 'Vaulta', symbol: 'A' } }), []);
  assert.deepEqual(coinHubNewsItems(articles, { coin: { slug: 'wormhole', id: 'wormhole', name: 'Wormhole', symbol: 'W' } }), []);
});
