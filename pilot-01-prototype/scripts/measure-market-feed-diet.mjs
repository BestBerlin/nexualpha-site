#!/usr/bin/env node
// Offline response-body measurements, not a browser network trace. Run once per built revision.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createNewsSsrRenderer } from '../server/news-ssr.mjs';
import { createMarketEventsReader } from '../server/market-events-feed.mjs';
import { detectArticleAssets } from '../src/components/v3/news/article-market-context.js';
import { compactMarketEvents } from '../src/data/market-data-pages.js';
import { createSsrHarness, hydrateInJsdom, hydrationErrors, prerenderState } from '../tests/helpers/ssr-hydration-harness.mjs';
const phase = process.argv[2];
assert.ok(['before', 'after'].includes(phase), 'usage: node scripts/measure-market-feed-diet.mjs before|after');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = 'tests/fixtures/market-data/market-events.live-v2-2026-10-13.json';
const feedText = await readFile(path.join(root, fixture), 'utf8');
const feed = JSON.parse(feedText);
const sizes = text => ({ rawBytes: Buffer.byteLength(text), gzipBytes: gzipSync(text).length });
const sha256 = text => createHash('sha256').update(text).digest('hex');
const { default: worker } = await import(pathToFileURL(path.join(root, 'dist/server/index.js')));
const render = createNewsSsrRenderer(path.join(root, 'dist'));
const market = createMarketEventsReader({ file: path.join(root, fixture) });
const localAssets = { fetch: async request => {
  const pathname = new URL(request.url).pathname;
  if (pathname === '/intel/market-events.json') return new Response(feedText, { headers: { 'content-type': 'application/json' } });
  try {
    const body = await readFile(path.join(root, 'dist/client', pathname));
    return new Response(body, { headers: { 'content-type': pathname.endsWith('.html') ? 'text/html' : pathname.endsWith('.json') ? 'application/json' : 'text/plain' } });
  } catch { return new Response('', { status: 404 }); }
} };
const env = { ASSETS: localAssets, NEWS_SSR_RENDER: render, MARKET_EVENTS_READ: market.read,
  TICKER_READ: async () => null, MOVERS_READ: async () => null, FX_SNAPSHOT_READ: async () => null,
};
const fetchLocal = async href => {
  const request = new Request(new URL(href, 'https://nexualpha.com'), { headers: { accept: href.startsWith('/api/') ? 'application/json' : 'text/html' } });
  if (new URL(request.url).pathname === '/intel/market-events.json') return localAssets.fetch(request);
  return worker.fetch(request, env);
};
const articles = JSON.parse(await readFile(path.join(root, 'public/content/news-feed.json'))).articles;
const sample = articles.find(article => typeof article.content?.en === 'string' && typeof article.content?.['zh-Hans'] === 'string'
  && detectArticleAssets({ title: `${article.title?.en}\n${article.title?.['zh-Hans']}`, summary: article.summary?.en, body: article.content.en }).length);
assert.ok(sample, 'need a checked-in English + Chinese article mentioning supported assets');
const coins = JSON.parse(await readFile(path.join(root, 'public/intel/coins.json')));
const coin = (coins.coins || coins.rows || []).find(row => String(row.symbol).toUpperCase() === 'BTC');
const coinPath = '/coins/' + (coin?.slug || 'bitcoin');
const pages = [`/news/${sample.slug}`, `/zh-hans/news/${sample.slug}`, '/exchanges/okx', '/compare/binance-vs-okx', coinPath];
const harness = await createSsrHarness();
const measurements = [];
try {
  for (const pathname of pages) {
    const response = await fetchLocal(pathname), html = await response.text();
    assert.equal(response.status, 200, pathname);
    const requests = [];
    const hydrated = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${pathname}`, {
      timeoutMs: 700, settleMs: 20,
      fetchImpl: async input => {
        const href = String(input?.url || input);
        const response = await fetchLocal(href), body = await response.text();
        requests.push({ path: href, status: response.status, ...sizes(body) });
        return new Response(body, { status: response.status, headers: response.headers });
      },
      inspect: window => ({ rail: window.document.querySelector('[data-market-context]')?.outerHTML || null }),
    });
    const marketRequests = requests.filter(row => /market-events/.test(row.path));
    assert.deepEqual(hydrationErrors(hydrated.errors), [], pathname);
    if (phase === 'after' && pathname.includes('/news/')) {
      assert.ok(prerenderState(html)?.marketEvents, 'built article must carry its SSR market seed');
      assert.equal(marketRequests.length, 0, 'hydration must not insert the market rail from a client fetch');
    }
    measurements.push({ path: pathname, status: response.status, html: { ...sizes(html), sha256: sha256(html) },
      marketRequests, allObservedJsonRequests: requests,
      initialHtmlPlusMarketJson: {
        rawBytes: sizes(html).rawBytes + marketRequests.reduce((sum, row) => sum + row.rawBytes, 0),
        gzipBytes: sizes(html).gzipBytes + marketRequests.reduce((sum, row) => sum + row.gzipBytes, 0),
      },
      hydrationErrors: hydrationErrors(hydrated.errors), hasRailAfterHydration: Boolean(hydrated.inspected?.rail),
    });
  }
} finally { await harness.close(); }
const assetResponses = [];
for (const query of ['symbol=BTC', 'symbols=BTC,ETH']) {
  const response = await fetchLocal(`/api/market-events/asset?${query}`), body = await response.text();
  assetResponses.push({ query, status: response.status, ...sizes(body), body: response.status === 200 ? JSON.parse(body) : undefined });
}
const summaryResponse = await fetchLocal('/api/market-events/summary'), summaryText = await summaryResponse.text();
const summary = JSON.parse(summaryText);
const dataPages = {};
for (const pathname of ['/liquidations', '/liquidations/heatmap', '/funding-rates']) {
  const fullHtml = await render(pathname, { marketEvents: feed });
  const summaryHtml = await render(pathname, { marketEvents: summary });
  const trimmed = pathname === '/funding-rates' ? { generatedAt: feed.generatedAt, funding: feed.funding }
    : { generatedAt: feed.generatedAt, liquidations: feed.liquidations, history: feed.history };
  const trimmedHtml = await render(pathname, { marketEvents: trimmed });
  dataPages[pathname] = { fullVsSummaryRenderedHtmlByteIdentical: fullHtml === summaryHtml,
    fullHtmlSha256: sha256(fullHtml), summaryHtmlSha256: sha256(summaryHtml),
    trimmedCandidate: { ...sizes(JSON.stringify(trimmed)), renderedHtmlByteIdentical: fullHtml === trimmedHtml, htmlSha256: sha256(trimmedHtml) },
    currentSsrProjection: sizes(JSON.stringify(compactMarketEvents(feed, { timeline: pathname !== '/funding-rates', firstScreen: true }))),
  };
}
const output = { phase, node: process.version, fixture, fixtureGeneratedAt: feed.generatedAt, fixtureSha256: sha256(feedText),
  methodology: 'In-process built Worker + bundled runtime SSR; jsdom hydration observes local JSON requests for 700 ms. Body bytes only; gzipSync estimate excludes headers, TLS, caches, JS, CSS and images. Historical checked-in feed, not the reported 2.4 MB production feed. No external requests.',
  fullFeed: sizes(feedText), summary: { status: summaryResponse.status, ...sizes(summaryText) }, assetResponses, pages: measurements, dataPages,
};
await writeFile(path.join(root, 'docs/evidence/market-feed-diet', `${phase}.json`), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ phase, fullFeed: output.fullFeed, summary: output.summary, assetResponses: assetResponses.map(({ body, ...row }) => row),
  pages: measurements.map(({ path, initialHtmlPlusMarketJson, hydrationErrors }) => ({ path, ...initialHtmlPlusMarketJson, hydrationErrors: hydrationErrors.length })) }, null, 2));
