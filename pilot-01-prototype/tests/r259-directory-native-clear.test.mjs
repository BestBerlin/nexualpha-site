import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { buildSync } from 'esbuild';
import postcss from 'postcss';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const root = process.cwd();
const base = path.resolve(root, '../../r257-readable-mobile-integration/candidate');
const pageFile = 'src/components/v3/VenueYellowPages.jsx';
const cssFile = 'src/components/v3/venue-yellow-pages.css';
const registryFile = 'src/data/partner-registry.js';
const locales = ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
const inputClass = 'yellow-pages__search-input';
const cancelRule = `.yellow-pages__search-input::-webkit-search-cancel-button {\n  display: none;\n  -webkit-appearance: none;\n  appearance: none;\n}`;

function sha256(file) {
  return require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function load(candidateRoot, react = React) {
  const code = buildSync({
    stdin: {
      contents: `export { VenueYellowPages } from './${pageFile}'; export { venueDatabase } from './src/data/venue-database.js';`,
      resolveDir: candidateRoot,
      loader: 'jsx',
    },
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    external: ['react', 'react/jsx-runtime'],
    loader: { '.css': 'empty', '.webp': 'text' },
  }).outputFiles[0].text;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => name === 'react' ? react : require(name),
    console,
    URL,
    URLSearchParams,
    Intl,
    Date,
    setTimeout,
    clearTimeout,
  });
  return module.exports;
}

function ssr(candidateRoot, locale, query = 'Bitget') {
  let cursor = 0;
  const wrapped = {...React, useState(initial) { return React.useState(cursor++ === 3 ? query : initial); }};
  const { VenueYellowPages, venueDatabase } = load(candidateRoot, wrapped);
  const venues = Object.values(venueDatabase).slice(0, 10);
  return renderToStaticMarkup(React.createElement(VenueYellowPages, { locale, venues, compact: false }));
}

function normalizeR259(html) {
  return html.replace(` class="${inputClass}"`, '');
}

function projectR261Jsx(source) {
  return source
    .replace('  const restoredUrlRef = useRef(false);\n  const searchInputRef = useRef(null);\n', '  const restoredUrlRef = useRef(false);\n')
    .replace('  const clearDirectorySearch = () => {\n    setSearchQuery("");\n    searchInputRef.current?.focus?.({ preventScroll: true });\n  };\n\n', '')
    .replace('                ref={searchInputRef}\n                value={searchQuery}\n', '                value={searchQuery}\n')
    .replace('                <button type="button" className="yellow-pages__search-clear" onClick={clearDirectorySearch} aria-label={ui.clearSearch}>\n', '                <button type="button" className="yellow-pages__search-clear" onClick={() => setSearchQuery("")} aria-label={ui.clearSearch}>\n');
}

function getRule(css, selector) {
  let found;
  postcss.parse(css).walkRules(selector, (rule) => { if (!found) found = rule; });
  assert.ok(found, `missing ${selector}`);
  return Object.fromEntries(found.nodes.filter((node) => node.type === 'decl').map((node) => [node.prop, node.value]));
}

test('directory search input exposes scoped class and hides only the Chrome native search cancel button', () => {
  const css = fs.readFileSync(path.join(root, cssFile), 'utf8');
  const jsx = fs.readFileSync(path.join(root, pageFile), 'utf8');
  assert.match(jsx, /className="yellow-pages__search-input"/);
  const rule = getRule(css, '.yellow-pages__search-input::-webkit-search-cancel-button');
  assert.equal(rule.display, 'none');
  assert.equal(rule['-webkit-appearance'], 'none');
  assert.equal(rule.appearance, 'none');
  assert.equal((css.match(/::-webkit-search-cancel-button/g) || []).length, 1, 'only one native cancel override');
});

test('R256 logical padding and custom 44px clear button remain unchanged', () => {
  const css = fs.readFileSync(path.join(root, cssFile), 'utf8');
  const input = getRule(css, '.yellow-pages__search-control input');
  const clear = getRule(css, '.yellow-pages__search-clear');
  assert.equal(input['padding-inline-start'], '0.8rem');
  assert.equal(input['padding-inline-end'], 'calc(44px + 0.35rem + 0.75rem)');
  assert.equal(input['padding-block'], '0.65rem');
  assert.equal(clear['min-width'], '44px');
  assert.equal(clear['min-height'], '44px');
  assert.equal(clear['inset-inline-end'], '0.35rem');
});

test('15 locale SSR changes only by adding the input class; values, hrefs and clear labels remain exact', () => {
  for (const locale of locales) {
    for (const query of ['Bitget', 'NO_SUCH_PLATFORM_256', '']) {
      const current = ssr(root, locale, query);
      const previous = ssr(base, locale, query);
      assert.match(current, new RegExp(`<input id="yellow-pages-search" class="${inputClass}" type="search"`), `${locale} input class`);
      assert.equal(normalizeR259(current), previous, `${locale} ${query || 'default'}`);
      if (query) assert.match(current, /class="yellow-pages__search-clear"/);
    }
  }
});

test('exact inverse returns JSX and CSS to R257 and registry remains exact', () => {
  const currentJsx = fs.readFileSync(path.join(root, pageFile), 'utf8');
  const baseJsx = fs.readFileSync(path.join(base, pageFile), 'utf8');
  assert.equal(projectR261Jsx(currentJsx).replace('\n                className="yellow-pages__search-input"', ''), baseJsx);

  const currentCss = fs.readFileSync(path.join(root, cssFile), 'utf8');
  const baseCss = fs.readFileSync(path.join(base, cssFile), 'utf8');
  assert.equal((currentCss.match(/\.yellow-pages__search-input::-webkit-search-cancel-button/g) || []).length, 1);
  assert.equal(currentCss.replace(`\n\n${cancelRule}\n`, '\n'), baseCss);

  assert.equal(sha256(path.join(root, registryFile)), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
