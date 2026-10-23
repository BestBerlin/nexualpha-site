import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import { buildSync } from 'esbuild';
import { JSDOM } from 'jsdom';
import { CLOSE_COPY } from '../src/components/v3/LeanHeroCopyV6.js';
import { organizationDescription } from '../src/data/brand-definition.js';
import { homePartnersFor } from '../src/data/home-rebate-tiers.js';
import { partnerRebateShare } from '../src/data/partner-benefit-status.js';
import { localizedHref } from '../src/data/locale-routing.js';
import { LOCALE_PREFIX_BY_CODE } from '../src/data/locale-routing.js';
import { formatPercent } from '../src/data/format-percent.js';
import { h7Copy } from '../src/components/v7/home7-copy.js';
import { isNeutralCtaLocale } from '../src/data/locale-policy.js';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const module = { exports: {} };
const source = buildSync({ stdin: { contents: `export { ClosingBand } from './src/components/v6/ClosingBand.jsx'; export { CleanFooter } from './src/components/v3/CleanFooter.jsx';`, resolveDir: fileURLToPath(new URL('..', import.meta.url)), loader: 'jsx' }, bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react'], loader: { '.css': 'empty' } }).outputFiles[0].text;
vm.runInNewContext(source, { React, module, exports: module.exports, require, URL, URLSearchParams, Intl });
const render = (name, props) => new JSDOM(renderToStaticMarkup(React.createElement(module.exports[name], props)));

for (const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) {
  test(`${locale}: static closing buttons preserve destinations, tiles match the home data, disclosure is unchanged`, () => {
    const dom = render('ClosingBand', { locale });
    const doc = dom.window.document;
    assert.equal(doc.querySelector('h2').textContent, CLOSE_COPY[locale].title);
    const forms = [...doc.querySelectorAll('form')];
    assert.deepEqual(forms.map(form => form.getAttribute('action')), ['/exchanges', '/compare/binance-vs-okx'].map(path => localizedHref(path, { locale }).split('?')[0]));
    assert.ok(forms.every(form => form.method === 'get' && form.querySelector('button[type=submit]')));
    const tiles = [...doc.querySelectorAll('.nx-close__partners li')];
    assert.equal(tiles.length, homePartnersFor(locale).length);
    tiles.forEach((tile, i) => {
      const slug = homePartnersFor(locale)[i];
      assert.ok(tile.querySelector('img[width][height]'));
      const share = partnerRebateShare(slug);
      if (share && !isNeutralCtaLocale(locale)) assert.equal(tile.querySelector('small').textContent, `${h7Copy(locale).upTo} ${formatPercent(locale, Math.round(share * 100))}`);
      else assert.equal(tile.querySelector('small'), null);
    });
    assert.equal(doc.querySelector('[data-phase]'), null, 'no JS-armed reveal');
    dom.window.close();
    const footer = render('CleanFooter', { locale });
    const disclosure = footer.window.document.querySelector('[data-footer-disclosure]');
    assert.equal(disclosure.textContent, organizationDescription(locale));
    const official = footer.window.document.querySelector('[data-footer-partner-links]');
    if (official) assert.ok(official.contains(disclosure), 'same official-entry panel');
    assert.equal(footer.window.document.querySelectorAll('.nx-ftr__languages a').length, 17);
    assert.equal(footer.window.document.querySelectorAll('.nx-ftr__column h2 svg').length, 4);
    footer.window.close();
  });
}

test('closing market gates suppress rebate claims and Turkish unlisted venues', () => {
  const vn = render('ClosingBand', { locale: 'en', market: 'VN' });
  assert.equal(vn.window.document.querySelector('.nx-close__partners small'), null);
  vn.window.close();
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /<ClosingBand locale=\{locale\} market=\{footerMarket\}/, 'home supplies its effective market');
  const tr = render('ClosingBand', { locale: 'en', market: 'TR' });
  const html = tr.window.document.body.innerHTML;
  assert.doesNotMatch(html, /\/exchanges\/(?:bitget|coinw|hyperliquid|backpack)/);
  tr.window.close();
});

test('closing component has no hooks, observers or scripts; shell CSS reserves logos and reduced motion', () => {
  const closing = readFileSync(new URL('../src/components/v6/ClosingBand.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(closing, /useEffect|useState|useRef|IntersectionObserver|<script/);
  const css = readFileSync(new URL('../src/styles/v5/shell.css', import.meta.url), 'utf8');
  assert.match(css, /prefers-reduced-motion: reduce[^}]*\{ #top \.nx-close/s);
  assert.match(css, /\.nx-ftr__entry :is\([^}]*inline-size: 32px; block-size: 32px/);
});
