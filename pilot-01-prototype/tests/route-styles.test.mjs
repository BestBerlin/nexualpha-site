import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { markupTokens, stylesheetUsage, manifestStylesheets, mergeableNeighbours } from '../scripts/build-route-styles.mjs';
import worker, { applyRouteStyles, pageStylesheetAllowed } from '../worker/index.js';
import { stylesheetHrefs } from '../scripts/build-critical-css.mjs';
import { createNewsSsrRenderer } from '../server/news-ssr.mjs';

const hrefs = ['/assets/early-AAAAAAAA.css', '/assets/index-BBBBBBBB.css', '/assets/late-CCCCCCCC.css'];
const shell = `<html><head><script type="module" src="/assets/index-AAAAAAAA.js"></script>${hrefs.map((href) => `<link rel="stylesheet" href="${href}">`).join('')}</head><body></body></html>`;
const payload = { version: 1, entry: '/assets/index-AAAAAAAA.js', stylesheets: hrefs, routes: { '/': [hrefs[0], hrefs[2]] } };

test('usage derives conservative whole-asset lists from SSR tokens, keeping states and unknown selectors', () => {
  const tokens = markupTokens('<main id="root" class="home"><details class="faq"><summary class="question">Q</summary></details></main>');
  for (const css of ['.faq[open] .question:hover{color:red}', ':root{--ink:black}', '@font-face{font-family:x;src:url(x)}', ':is(.home,.other) .question{color:red}']) assert.ok(stylesheetUsage(css)(tokens), css);
  assert.equal(stylesheetUsage('.venue .table{color:red}')(tokens), false);
  assert.deepEqual([...manifestStylesheets({ a: { css: ['assets/a.css'] }, b: { file: 'assets/b.css' }, c: { file: 'assets/c.js' } })], ['/assets/a.css', '/assets/b.css']);
});

test('DOM matching distinguishes structural templates while widening interactive states', () => {
  const dom = new JSDOM('<html dir="rtl"><body><main class="home"><details class="faq"><summary class="question">Q</summary></details></main></body></html>');
  const tokens = markupTokens(dom.serialize());
  assert.equal(stylesheetUsage('body:has(.venue) .question{color:red}')(tokens, dom.window.document), false);
  assert.ok(stylesheetUsage('html[dir="rtl"] .question:hover{color:red}')(tokens, dom.window.document));
  assert.ok(stylesheetUsage('.faq[open] .question{color:red}')(tokens, dom.window.document));
  assert.equal(stylesheetUsage('.faq .absent{color:red}')(tokens, dom.window.document), false);
  dom.window.close();
});

test('exact lists preserve cascade and locale routes, with stale/incomplete builds falling back', () => {
  assert.deepEqual(stylesheetHrefs(applyRouteStyles(shell, payload, new URL('https://test/zh-hans'))), [hrefs[0], hrefs[2]]);
  for (const invalid of [null, { ...payload, entry: '/assets/old.js' }, { ...payload, stylesheets: hrefs.slice(1) }, { ...payload, routes: { '/': [hrefs[2], hrefs[0]] } }, { ...payload, routes: { '/': ['/assets/missing.css'] } }, { ...payload, routes: { '/': [] } }]) assert.equal(applyRouteStyles(shell, invalid, new URL('https://test/')), null);
  assert.equal(applyRouteStyles(shell, payload, new URL('https://test/unbuilt-route')), null);
  const templates = { news: payload.routes['/'], 'tokenized-stocks': payload.routes['/'] };
  for (const pathname of ['/ar/news/new-article', '/tokenized-stocks/nvda']) assert.deepEqual(stylesheetHrefs(applyRouteStyles(shell, { ...payload, templates }, new URL('https://test' + pathname))), payload.routes['/']);
});

test('authored page layers stay on their original templates', () => {
  assert.equal(pageStylesheetAllowed('/assets/page-profile-mid1-AAAAAAAA.css', new URL('https://test/')), false);
  assert.equal(pageStylesheetAllowed('/assets/page-home-late-AAAAAAAA.css', new URL('https://test/exchanges/bitget')), false);
  assert.ok(pageStylesheetAllowed('/assets/page-profile-mid1-AAAAAAAA.css', new URL('https://test/ar/exchanges/bitget')));
});

test('tiny merges require neighbours without JS references and flatten to the same order', () => {
  const left = { href: hrefs[0], css: '.a{}' };
  const right = { href: hrefs[1], css: '.b{}'.repeat(600) };
  assert.ok(mergeableNeighbours(left, right, new Set()));
  assert.equal(mergeableNeighbours(left, { ...right, css: "@import url(other.css);" }, new Set()), false);
  assert.equal(mergeableNeighbours(left, right, new Set([left.href])), false);
  assert.equal(mergeableNeighbours(right, { ...right, href: hrefs[2] }, new Set()), false);
  const merged = '/assets/route-css-DDDDDDDD.css';
  const result = applyRouteStyles(shell, { ...payload, routes: { '/': [merged, hrefs[2]] }, bundles: { [merged]: hrefs.slice(0, 2) } }, new URL('https://test/'));
  assert.deepEqual(stylesheetHrefs(result), [merged, hrefs[2]]);
  for (const part of [null, {}, 123]) assert.equal(applyRouteStyles(shell, { ...payload, routes: { '/': [merged] }, bundles: { [merged]: [part] } }, new URL('https://test/')), null);
});

const root = new URL('../dist/client/', import.meta.url);
const built = existsSync(new URL('route-styles.json', root));
test('Worker SSR links exact manifest lists, including deferred components before JS', { skip: !built && 'run npm run build first' }, async () => {
  const routeStyles = JSON.parse(await readFile(new URL('route-styles.json', root), 'utf8'));
  const modules = JSON.parse(await readFile(new URL('style-modules.json', root), 'utf8'));
  const { routeStyleModules } = await import(new URL('../dist/ssr/entry-server.js', import.meta.url));
  assert.ok(routeStyleModules('https://nexualpha.com/').includes('src/components/v7/home7-below.jsx'));
  assert.ok(routeStyleModules('https://nexualpha.com/exchanges/bitget').includes('src/components/v3/VenueDetailResearch.jsx'));
  for (const module of ['src/main.jsx', 'src/components/v7/HomeV7.jsx', 'src/components/v7/home7-below.jsx', 'src/components/tokenized-stocks/HomeTokenizedStrip.jsx', 'src/components/v3/VenueDetailPage.jsx', 'src/components/v3/VenueDetailResearch.jsx']) assert.ok(Object.hasOwn(modules, module), `build mapping missing ${module}`);
  const article = Object.keys(routeStyles.routes).find((pathname) => pathname.startsWith('/news/'));
  const assets = { async fetch(request) {
    const pathname = new URL(request.url).pathname;
    try { return new Response(await readFile(new URL('.' + pathname, root)), { headers: { 'content-type': pathname.endsWith('.json') ? 'application/json' : 'text/html' } }); }
    catch { return new Response('missing', { status: 404 }); }
  } };
  const env = { ASSETS: assets, NEWS_SSR_RENDER: createNewsSsrRenderer(fileURLToPath(new URL('../dist/', import.meta.url))) };
  for (const pathname of ['/', '/zh-hans', '/exchanges/bitget', article, '/compare/binance-vs-okx', '/tokenized-stocks', '/funding-rates']) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: 'text/html' } }), env);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    const expected = routeStyles.routes[pathname === '/zh-hans' ? '/' : pathname];
    assert.deepEqual([...new Set(stylesheetHrefs(html))], expected, pathname);
    const original = expected.flatMap((href) => routeStyles.bundles[href] || [href]);
    for (const module of routeStyleModules(`https://nexualpha.com${pathname}`)) {
      for (const file of modules[module]?.css || []) {
        const href = '/' + file;
        if (!routeStyles.stylesheets.includes(href) || !pageStylesheetAllowed(href, new URL(`https://nexualpha.com${pathname}`))) continue;
        assert.ok(original.includes(href), `${pathname}: owned component styles must survive empty feed states: ${href}`);
      }
    }
    assert.doesNotMatch(html, /rel=["']modulepreload["']/, pathname);
    assert.match(html, /id="nexualpha-prerender-state"/, pathname);
    assert.match(html, /<h1\b/, pathname);
    if (['/', '/zh-hans'].includes(pathname)) assert.match(html, /data-nexualpha-critical="home"/);
    for (const href of expected) assert.ok(existsSync(new URL('.' + href, root)), href);
  }
});
