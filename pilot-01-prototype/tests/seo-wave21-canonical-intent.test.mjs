import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import worker from '../worker/index.js';
import { computeRouteSeo } from '../src/data/seo-injection.js';

const shell = '<!doctype html><html lang="en"><head><title>NexuAlpha</title><meta name="description" content="base"><meta name="robots" content="index,follow"></head><body><main>app</main></body></html>';
const feed = JSON.parse(await readFile(new URL('../public/content/news-feed.json', import.meta.url), 'utf8'));

function assets() {
  return {
    fetch: async (request) => {
      const url = new URL(request.url);
      if (url.pathname === '/index.html') {
        return new Response(shell, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
      }
      if (url.pathname === '/content/news-feed.json') {
        return new Response(JSON.stringify(feed), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
      }
      return new Response('missing', { status: 404, headers: { 'content-type': 'text/plain' } });
    },
  };
}

async function htmlFor(path) {
  const response = await worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: 'text/html' } }), { ASSETS: assets() });
  return { response, html: await response.text() };
}

test('Wave21 English locale query entrypoints redirect to clean canonical URLs', async () => {
  const cases = [
    ['/', 'https://nexualpha.com/'],
    ['/news/okx-usd-to-usdc-spot-pair-migration', 'https://nexualpha.com/news/okx-usd-to-usdc-spot-pair-migration'],
    ['/compare/bybit-vs-bitget', 'https://nexualpha.com/compare/bybit-vs-bitget'],
  ];

  for (const [path, expectedLocation] of cases) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${path}?locale=en`, { headers: { accept: 'text/html' } }), { ASSETS: assets() });
    assert.equal(response.status, 308, path);
    assert.equal(response.headers.get('location'), expectedLocation, path);
  }
});

test('Wave21 canonical pages do not emit redundant locale=en canonical or internal HTML variants', async () => {
  const cases = [
    ['/news/okx-usd-to-usdc-spot-pair-migration', 'https://nexualpha.com/news/okx-usd-to-usdc-spot-pair-migration'],
    ['/compare/bybit-vs-bitget', 'https://nexualpha.com/compare/bybit-vs-bitget'],
    ['/news/hyperliquid-vs-dydx', 'https://nexualpha.com/news/hyperliquid-vs-dydx'],
    ['/compare/hyperliquid-vs-dydx', 'https://nexualpha.com/compare/hyperliquid-vs-dydx'],
  ];

  for (const [path, canonical] of cases) {
    const { response, html } = await htmlFor(path);
    assert.equal(response.status, 200, path);
    assert.match(html, new RegExp(`rel="canonical" href="${canonical.replaceAll('/', '\\/')}"`), path);
    assert.doesNotMatch(html, /[?&]locale=en(?:[&#"]|$)/, path);
  }
});

test('Wave21 Hyperliquid news article and comparison page have separate search intent roles', () => {
  const article = feed.articles.find((item) => item.slug === 'hyperliquid-vs-dydx');
  assert.ok(article, 'expected hyperliquid-vs-dydx article');
  assert.equal(article.seo.title, 'Hyperliquid vs dYdX: Perp DEX Fees, Funding, Margin and Liquidation Checks');
  assert.match(article.summary.en, /fee tiers, funding, margin and liquidation mechanics/i);
  assert.match(article.seo.description, /official sources and account conditions/i);
  assert.match(article.aeo.directAnswer, /documentation alone cannot establish a universal winner/i);
  assert.ok(article.aeo.answerBoundaries.includes('Use the comparison page for current route decisions; use this news article for the dated source-reading explainer.'));
  assert.ok(article.aeo.questions.includes('Should I read the Hyperliquid vs dYdX news explainer or the comparison page?'));
  assert.match(article.content.en, /## Decision matrix/i);
  assert.match(article.content.en, /rolling 14-day fee tiers/i);
  assert.match(article.content.en, /trailing 30-day taker-volume fee logic/i);

  const compareSeo = computeRouteSeo({ url: '/compare/hyperliquid-vs-dydx' });
  const webpage = compareSeo.schemas.find((schema) => schema['@type'] === 'WebPage');
  const faq = webpage?.subjectOf;
  assert.equal(compareSeo.title, 'Hyperliquid vs dYdX: Perp Fees, Funding, Liquidation and Access Checks — NexuAlpha');
  assert.match(JSON.stringify(faq), /news explainer or this comparison page/);
  assert.ok(webpage.relatedLink.includes('https://nexualpha.com/news/hyperliquid-vs-dydx'));
  assert.doesNotMatch(`${article.seo.description}\n${article.aeo.directAnswer}\n${JSON.stringify(compareSeo.schemas)}`, /guaranteed|lowest|risk-free|commission|返佣/i);
});
