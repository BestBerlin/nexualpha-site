import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { localizedHref } from '../src/data/locale-routing.js';

const require = createRequire(new URL('../package.json', import.meta.url));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { buildSync } = require('esbuild');
const sourceUrl = new URL('../src/components/v3/CleanFooter.jsx', import.meta.url);
const baselineUrl = new URL('../../footer-before/CleanFooter.jsx', import.meta.url);
function component(source) {
  const module = { exports: {} };
  const compiled = buildSync({ stdin: { contents: source, resolveDir: fileURLToPath(new URL('.', sourceUrl)), loader: 'jsx' }, bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react'], loader: { '.css': 'empty' } }).outputFiles[0].text;
  vm.runInNewContext(compiled, { React, module, exports: module.exports, require, URL, URLSearchParams, Intl });
  return module.exports.CleanFooter;
}
const Current = component(readFileSync(sourceUrl, 'utf8'));
const Before = existsSync(baselineUrl) ? component(readFileSync(baselineUrl, 'utf8')) : null;
const render = (Component, locale, brazil = false) => renderToStaticMarkup(React.createElement(Component, { locale, brazil }));
const locales = ['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];
const hrefs = html => [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1]).sort();

for (const locale of locales) {
  test(`${locale}: historical footer destinations remain unchanged`, { skip: !Before && 'Original footer-before source snapshot is absent; current footer checks still run' }, () => {
    for (const brazil of [false, true]) assert.deepEqual(hrefs(render(Current, locale, brazil)), hrefs(render(Before, locale, brazil)));
  });
  test(`${locale}: current footer keeps legal routes, named navigation and identity visible`, () => {
    const html = render(Current, locale);
    assert.match(html, /<footer class="nx-ftr" id="policy">/);
    assert.match(html, /nx-ftr__definition/);
    assert.match(html, /nx-ftr__slogan/);
    assert.match(html, /nx-ftr__copyright/);
    assert.equal([...html.matchAll(/<section class="nx-ftr__column"/g)].length, 4, 'four named discovery columns');
    for (const path of ['/privacy','/terms','/methodology#disclosure','/editorial-policy','/contact']) {
      assert.ok(html.includes(`href="${localizedHref(path,{locale})}"`), `${locale} retains ${path}`);
    }
    assert.doesNotMatch(html, /<details\b|\shidden(?:=|\s|>)/, 'legal navigation needs no expansion');
  });
}

test('footer remains responsive, wraps its legal row and provides visible focus and touch targets', () => {
  const css = readFileSync(new URL('../src/styles/v5/shell.css', import.meta.url), 'utf8');
  assert.match(css, /\.nx-ftr \.nx-ftr__legal-row \{[^}]*flex-wrap: wrap/);
  assert.match(css, /\.nx-ftr \.nx-ftr__column a \{[^}]*min-block-size: 36px/);
  assert.match(css, /\.nx-ftr [^{]*:focus-visible/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});
