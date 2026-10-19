import test from 'node:test';
import assert from 'node:assert/strict';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import worker, { routeMetadata, routeSeoPayload } from '../worker/index.js';
import { localizedPath } from '../src/data/locale-routing.js';
import { WHALE_COINS, whaleCoinPath } from '../src/data/whale-routes.js';
import { dataPageSchemas } from '../src/data/market-data-pages.js';
import { intelToolRouteSeo } from '../src/data/intel-tools-seo.js';
import { depositRouteSeo } from '../src/data/deposit-seo.js';
import { depositPath } from '../src/data/deposit-routes.js';
import { tsSchemas } from '../src/data/tokenized-stocks-seo.js';
import { tsTickerPath } from '../src/data/tokenized-stocks-routes.js';
import { finalizeDataset } from '../src/data/dataset-schema.js';
const locales = ['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','it','ja','ko','ru','tr','id','vi','ar','ur','uk'];
function datasets(value) {
  if (!value || typeof value !== 'object') return [];
  return [ ...([value['@type']].flat().includes('Dataset') ? [value] : []), ...Object.values(value).flatMap(datasets) ];
}
function check(value, label) {
  const nodes = datasets(value);
  assert.ok(nodes.length, `${label}: no Dataset`);
  for (const node of nodes) {
    assert.equal(typeof node.description, 'string', `${label}: ${node.name} description`);
    assert.ok(node.description.length >= 50 && node.description.length <= 5000, `${label}: ${node.name} length ${node.description.length}`);
    const license = typeof node.license === 'string' ? node.license : node.license?.url;
    assert.match(license || '', /^https?:\/\//, `${label}: ${node.name} license`);
    assert.ok(new URL(license).hostname, `${label}: license hostname`);
  }
  return nodes;
}
for (const locale of locales) test(`Dataset contracts in real head builders: ${locale}`, async () => {
  for (const path of ['/whales', ...WHALE_COINS.map(whaleCoinPath), '/press', '/data/exchange-fee-index', '/data/tokenized-stock-tracker', '/data/whale-accumulation-report', '/funding-rates/matrix', '/funding-rates', '/liquidations', '/licenses', '/factbook/binance', tsTickerPath('nvda'), '/calendar', depositPath(locale, 'brazil')]) {
    const href = localizedPath(path, locale);
    const seo = computeRouteSeo({ url: href });
    const url = new URL(href, 'https://nexualpha.com');
    const metadata = await routeMetadata(url, {});
    const requiresSsrDataset = path.startsWith('/whales') || path === '/press' || path.startsWith('/data/');
    const ssr = (requiresSsrDataset || datasets(seo.schemas).length) ? check(JSON.parse(JSON.stringify(seo.schemas)), `SSR ${href}`) : [];
    const payload = routeSeoPayload(metadata, url);
    const worker = check(JSON.parse(JSON.stringify(payload.schema)), `Worker ${href}`);
    if (ssr.length) assert.deepEqual(worker.map(n => [n.description, n.license]), ssr.map(n => [n.description, n.license]), href);
  }
});

for (const locale of locales) test(`Dataset leaf generators: ${locale}`, () => {
  const urlFor = path => `https://nexualpha.com${localizedPath(path, locale)}`;
  for (const path of ['/funding-rates', '/liquidations']) check(dataPageSchemas(path, locale), `${path} ${locale}`);
  for (const path of ['/etf-flows', '/calendar']) check(intelToolRouteSeo(path, locale, { urlFor }).schemas, `${path} ${locale}`);
  check(depositRouteSeo(depositPath(locale, 'brazil'), locale).schemas, `deposit ${locale}`);
  check(tsSchemas(tsTickerPath('nvda'), locale, { urlFor }), `stocks ${locale}`);
});
test('Dataset finalizer preserves compliant copy and licences and requires factual fallback', () => {
  const node = { '@type': 'Dataset', name: 'Rates', description: 'Published funding rates from public exchange endpoints, normalized to eight hours.', license: 'https://example.com/license' };
  assert.deepEqual(finalizeDataset(node), node);
  assert.throws(() => finalizeDataset({ name: 'label', description: 'short' }), /factual page copy/);
  check(finalizeDataset({ '@type': 'Dataset', name: 'Rates', description: 'Rates' }, { descriptionParts: [node.description] }), 'fallback');
  check(finalizeDataset({ '@type': 'Dataset', name: 'Rates', description: 'x'.repeat(5001) }), 'maximum');
});

for (const locale of locales) test(`Dataset JSON-LD extracted from served heads: ${locale}`, async () => {
  const shell = '<!doctype html><html><head><title>NexuAlpha</title></head><body><div id="root"></div></body></html>';
  const env = {
    ASSETS: { fetch: async request => new URL(request.url).pathname === '/prerender-manifest.json'
      ? Response.json({ version: 'nexualpha-prerender-v1', routes: {} })
      : new Response(shell, { headers: { 'content-type': 'text/html' } }) },
    NEWS_SSR_RENDER: async () => '<main></main>',
    RADAR_READ: async () => null,
  };
  for (const path of ['/whales', whaleCoinPath('BTC'), '/press', '/data/exchange-fee-index', '/funding-rates/matrix', '/funding-rates', '/liquidations', '/licenses', tsTickerPath('nvda'), '/calendar', depositPath(locale, 'brazil')]) {
    const href = localizedPath(path, locale);
    const response = await worker.fetch(new Request(`https://nexualpha.com${href}`), env);
    assert.equal(response.status, 200, href);
    const html = await response.text();
    const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(match => JSON.parse(match[1]));
    check(blocks, href);
  }
});
