import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { COMPACT_NAV, compactNavLabel } from '../src/components/shell/shell-copy.js';
const css = readFileSync(new URL('../src/styles/v5/shell.css', import.meta.url), 'utf8');
const header = readFileSync(new URL('../src/components/shell/SiteHeader.jsx', import.meta.url), 'utf8');
test('desktop compact labels cover all 17 locales with bounded natural labels', () => {
  assert.deepEqual(Object.keys(COMPACT_NAV).sort(), ['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','it','ja','ko','ru','tr','id','vi','ar','ur','uk'].sort());
  for (const [locale, labels] of Object.entries(COMPACT_NAV)) {
    assert.equal(labels.length, 2);
    for (const label of labels) assert.ok(label.length > 0 && label.length <= 14, `${locale}: ${label}`);
    assert.equal(compactNavLabel(locale, `/${locale}/news`, 'fallback'), labels[0]);
    assert.equal(compactNavLabel(locale, `/${locale}/tokenized-stocks`, 'fallback'), labels[1]);
    assert.equal(compactNavLabel(locale, '/exchanges', 'Exchanges'), 'Exchanges');
  }
});
test('CSS priority tiers preserve full More links without hydration measurements', () => {
  assert.match(css, /container: header-fit \/ inline-size/);
  for (const width of [1199,999]) assert.ok(css.includes(`@container header-fit (max-width: ${width}px)`));
  for (const index of [1,2,3,5]) {
    assert.ok(css.includes(`[data-priority="${index}"] { display: none; }`) || css.includes(`[data-priority="${index}"]`));
    assert.ok(css.includes(`[data-overflow-priority="${index}"]`));
  }
  assert.match(css, /max-width: 1499px/);
  assert.match(css, /min-block-size: 44px/);
  assert.match(header, /pages\.map\(\(\[label, href\], index\)/);
  assert.doesNotMatch(header, /ResizeObserver/);
});

test('SSR includes every priority destination in More, even with no original secondary links', async () => {
  const { buildSync } = await import('esbuild');
  const { createRequire } = await import('node:module');
  const vm = await import('node:vm');
  const require = createRequire(import.meta.url);
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { JSDOM } = require('jsdom');
  const mod = { exports: {} };
  const bundled = buildSync({ entryPoints: [fileURLToPath(new URL('../src/components/shell/SiteHeader.jsx', import.meta.url))], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react'] }).outputFiles[0].text;
  vm.runInNewContext(bundled, { module: mod, exports: mod.exports, require, URL, URLSearchParams });
  const nav = [['Exchanges','/exchanges'],['Stocks','/tokenized-stocks'],['Compare','/compare'],['Academy','/academy'],['Full campaign label','/activities'],['Full news label','/news']];
  for (const locale of Object.keys(COMPACT_NAV)) {
    const html = renderToStaticMarkup(React.createElement(mod.exports.SiteHeader, {
      copy: { ui: { menu: 'Menu', language: 'Language' } }, locale, nav, homeHref: '/',
      navState: () => ({}), localeOptions: [{ code: locale, label: locale, href: '/' }],
    }));
    const doc = new JSDOM(html).window.document;
    assert.equal(doc.querySelectorAll('.nx-nav > ul > [data-priority]').length, 6);
    assert.equal(doc.querySelectorAll('.nx-more__panel [data-overflow-priority]').length, 6);
    assert.ok(doc.querySelector('.nx-more[data-overflow-only="true"]'));
    assert.ok(doc.querySelector('.nx-more__panel[hidden]'));
    assert.deepEqual([...doc.querySelectorAll('.nx-more__panel a')].map(a => a.getAttribute('href')), nav.map(([, href]) => href));
    assert.equal(doc.querySelector('[data-priority="5"] a').textContent, COMPACT_NAV[locale][0]);
  }
});
