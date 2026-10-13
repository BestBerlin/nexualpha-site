import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const require_jsdom = () => JSDOM;
import { licenseRecords, LICENSE_COUNTRIES, LICENSE_INDEX_LOCALES, licenseCopy, licenseTitle, licenseAnswer, licenseSchemas } from '../src/data/licenses.js';
import { licenseRouteSeo, licenseSitemapEntries } from '../src/data/licenses-seo.js';
import { localizedPath } from '../src/data/locale-routing.js';
import { parseLicensesPath } from '../src/data/licenses-routes.js';
import { licenseSignup } from '../src/data/licenses-cta.js';
import worker from '../worker/index.js';
import { flushSync } from 'react-dom';
import { createSsrHarness, SHELL_HTML, hydrateInJsdom, hydrationErrors } from './helpers/ssr-hydration-harness.mjs';

const statuses = new Set(['licensed', 'registered', 'applied', 'restricted', 'banned', 'liquidation list']);
test('entity records have official register provenance, dates and unique jurisdiction keys', () => {
  assert.ok(licenseRecords.length > 0);
  const registry = readFileSync(new URL('../src/data/international-source-registry.js', import.meta.url), 'utf8');
  const keys = new Set();
  for (const row of licenseRecords) {
    for (const key of ['exchange', 'country', 'entityName', 'regulator', 'type', 'sourceUrl', 'lastChecked']) assert.ok(row[key], key);
    assert.ok(statuses.has(row.status), row.status);
    assert.ok(LICENSE_COUNTRIES.some(country => country.code === row.country));
    const url = new URL(row.sourceUrl);
    assert.equal(url.protocol, 'https:');
    // Seed rows came from reviewed repository data; later rows carry the register evidence they were read from.
    assert.ok(registry.includes(row.sourceUrl) || (typeof row.evidence === 'string' && row.evidence.length > 20), 'official source is reviewed or carries register evidence');
    assert.match(url.hostname, /(^|\.)(spk\.gov\.tr|fsa\.go\.jp|mas\.gov\.sg|sfc\.hk|esma\.europa\.eu|vara\.ae|fca\.org\.uk|austrac\.gov\.au|ojk\.go\.id|amf-france\.org|bafin\.de|cysec\.gov\.cy)$/);
    assert.ok(!/&amp;/.test(row.sourceUrl), 'source URL is not HTML-escaped');
    assert.match(row.lastChecked, /^\d{4}-\d{2}-\d{2}$/);
    const key = `${row.exchange}-${row.country}-${row.entityName}`;
    assert.ok(!keys.has(key), `duplicate ${key}`); keys.add(key);
  }
});
test('all eleven search locales have localized titles, answer and schema', () => {
  assert.equal(LICENSE_INDEX_LOCALES.length, 11);
  for (const locale of LICENSE_INDEX_LOCALES) {
    assert.ok(licenseTitle(undefined, locale));
    assert.ok(licenseAnswer(undefined, locale));
    assert.ok(licenseCopy(locale).answer);
    const schemas = licenseSchemas(undefined, locale, 'https://nexualpha.com/licenses');
    assert.ok(schemas.some(schema => schema['@type'] === 'Dataset'));
    assert.ok(schemas.some(schema => schema['@type'] === 'FAQPage'));
  }
});
test('commercial routes fail closed for negative status, restricted countries, neutral Chinese and Türkiye exceptions', () => {
  const positive = { exchange: 'okx', country: 'TR', status: 'registered' };
  assert.match(licenseSignup(positive, { locale: 'tr' }) || '', /^\/go\/okx\?/);
  for (const status of ['applied', 'pending', 'listed', 'warning', 'revoked', 'restricted', 'banned', 'liquidation list']) assert.equal(licenseSignup({ ...positive, status }, { locale: 'tr' }), null);
  for (const exchange of ['bitget', 'mexc', 'gate-io', 'kraken']) assert.equal(licenseSignup({ ...positive, exchange }, { locale: 'tr' }), null);
  assert.equal(licenseSignup({ ...positive, country: 'JP' }, { locale: 'ja' }), null);
  assert.equal(licenseSignup(positive, { locale: 'zh-Hans' }), null);
  assert.equal(licenseSignup({ ...positive, exchange: 'not-a-partner' }, { locale: 'tr' }), null);
  assert.equal(licenseSignup({ exchange: 'mexc', country: 'BR', status: 'registered' }, { locale: 'tr', market: 'TR' }), null);
  for (const row of licenseRecords.filter(row => row.country === 'TR')) {
    const signup = licenseSignup(row, { locale: 'tr' });
    assert.equal(signup, null, `${row.exchange}/${row.status}`);
  }
});
test('parser handles hub/country and rejects extra segments', () => {
  assert.deepEqual(parseLicensesPath('/licenses'), { kind: 'hub' });
  assert.equal(parseLicensesPath('/licenses/turkey').country, 'turkey');
  assert.equal(parseLicensesPath('/licenses/turkey/extra').kind, 'missing');
  assert.equal(parseLicensesPath('/exchanges'), null);
});
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const assets = { fetch: async request => {
  const path = new URL(request.url).pathname;
  if (path === '/prerender-manifest.json') return Response.json({ version: 'nexualpha-prerender-v1', routes: {} });
  if (path === '/index.html') return new Response(SHELL_HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  return new Response('missing', { status: 404 });
} };
test('English and Simplified Chinese hub and country routes SSR visible register rows and schemas', async () => {
  for (const [prefix, locale] of [['', 'en'], ['/zh-hans', 'zh-Hans']]) {
    for (const suffix of ['', `/${LICENSE_COUNTRIES[0].slug}`]) {
      const path = `${prefix}/licenses${suffix}`;
      const response = await worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: 'text/html' } }), { ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) });
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.match(html, /nx-license-table/, path);
      assert.match(html, /Dataset/);
      assert.match(html, /FAQPage/);
      assert.ok(html.includes(licenseTitle(suffix.slice(1) || undefined, locale)), path);
      assert.match(html, /<table>/);
      assert.ok(html.includes(licenseRecords[0].sourceUrl.replaceAll('&', '&amp;')));
    }
  }
});
test('exchange detail includes its register section and source link', async () => {
  const row = licenseRecords[0];
  const html = harness.render(`/exchanges/${row.exchange}`);
  assert.match(html, /id="licenses"/);
  assert.ok(html.includes(row.entityName));
  const doc = new (require_jsdom())(html).window.document;
  const appliedRow = [...doc.querySelectorAll('.nx-license-table tbody tr')].find(element => element.textContent.includes(row.entityName));
  assert.ok(appliedRow, 'applied Türkiye row is rendered');
  assert.equal(appliedRow.querySelector('[data-cta-placement="license-directory"]'), null);
});

test('hub filters update the hydrated table without changing server evidence', async () => {
  const href = 'https://nexualpha.com/licenses';
  const response = await worker.fetch(new Request(href, { headers: { accept: 'text/html' } }), { ASSETS: assets, NEWS_SSR_RENDER: (url, options) => harness.render(url, options) });
  const result = await hydrateInJsdom(harness.vite, await response.text(), href, { inspect: window => {
    const form = window.document.querySelector('.nx-license-filters');
    const [exchange, country, status] = form.querySelectorAll('select');
    const select = (element, value) => flushSync(() => { element.value = value; element.dispatchEvent(new window.Event('change', { bubbles: true })); });
    select(exchange, licenseRecords[0].exchange);
    assert.equal(window.document.querySelectorAll('.nx-license-table tbody tr').length, licenseRecords.filter(row => row.exchange === licenseRecords[0].exchange).length);
    select(country, licenseRecords[0].country);
    assert.equal(window.document.querySelectorAll('.nx-license-table tbody tr').length, licenseRecords.filter(row => row.exchange === licenseRecords[0].exchange && row.country === licenseRecords[0].country).length);
    select(status, licenseRecords[0].status);
    assert.equal(window.document.querySelectorAll('.nx-license-table tbody tr').length, 1);
    select(exchange, ''); select(country, ''); select(status, '');
    assert.equal(window.document.querySelectorAll('.nx-license-table tbody tr').length, licenseRecords.length);
    return true;
  } });
  assert.deepEqual(hydrationErrors(result.errors), []);
  assert.equal(result.inspected, true);
});

test('sitemap includes all search locales and country pages, excludes unsupported editions', () => {
  const entries = licenseSitemapEntries({ urlFor: (path, locale) => `https://nexualpha.com${localizedPath(path, locale)}` });
  assert.equal(entries.length, (LICENSE_COUNTRIES.length + 1) * 11);
  assert.equal(new Set(entries.map(entry => entry.loc)).size, entries.length);
  assert.ok(entries.some(entry => entry.loc === 'https://nexualpha.com/zh-hans/licenses'));
  assert.ok(entries.every(entry => LICENSE_INDEX_LOCALES.includes(entry.locale)));
  assert.equal(licenseRouteSeo('/licenses/not-a-country', 'en').status, 404);
  assert.equal(licenseRouteSeo('/licenses', 'ar').indexable, false);
});

test('mobile cards mirror table rows with display names, jurisdiction, entity, type, status and source', async () => {
  const html = await harness.render('/licenses');
  const doc = new (require_jsdom())(html).window.document;
  const cards = doc.querySelectorAll('.nx-license-cards .nx-license-card');
  assert.equal(cards.length, licenseRecords.length);
  assert.equal(doc.querySelectorAll('.nx-license-table tbody tr').length, licenseRecords.length);
  const text = doc.querySelector('.nx-license-cards').textContent;
  for (const name of ['Binance', 'OKX', 'Bybit']) assert.ok(text.includes(name), name);
  assert.ok(!/>(binance|okx|bybit|gate-io)</.test(doc.querySelector('.nx-license-cards').innerHTML), 'no lowercase slugs as visible names');
  for (const card of cards) {
    assert.ok(card.querySelector('dl dd'), 'card has register fields');
    assert.ok(card.querySelector('a[target="_blank"][href^="https://"]'), 'card links the official source');
  }
  const css = readFileSync(new URL('../src/components/licenses/licenses.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width:639\.98px\)\{[^]*\.nx-license-table table\{display:none\}[^]*\.nx-license-cards\{display:grid/);
});
