import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { buildSync } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import crypto from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../../r260-final-task-integration/candidate", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const require = createRequire(import.meta.url);
const root = process.cwd();
const base = path.resolve(root, '../../r260-final-task-integration/candidate');
const pageFile = 'src/components/v3/VenueYellowPages.jsx';
const registryFile = 'src/data/partner-registry.js';
const locales = ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
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

function findNode(node, predicate) {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findNode(child, predicate);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== 'object') return null;
  if (predicate(node)) return node;
  return findNode(node.props?.children, predicate);
}

function renderWithQuery(candidateRoot, locale, query = 'Bitget') {
  let cursor = 0;
  const wrapped = {...React, useState(initial) { return React.useState(cursor++ === 3 ? query : initial); }};
  const { VenueYellowPages, venueDatabase } = load(candidateRoot, wrapped);
  const venues = Object.values(venueDatabase).slice(0, 10);
  return renderToStaticMarkup(React.createElement(VenueYellowPages, { locale, venues, compact: false }));
}

test('custom directory clear restores focus to the search input after removing itself', () => {
  let cursor = 0;
  const slots = [];
  const focusCalls = [];
  const inputRef = { current: { focus: (options) => focusCalls.push(options || null) } };
  let refCursor = 0;
  const refSlots = [];
  const mockReact = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
    },
    useMemo(fn) { return fn(); },
    useEffect() {},
    useRef(initial) {
      const index = refCursor++;
      if (!refSlots[index]) refSlots[index] = index === 1 ? inputRef : { current: initial };
      return refSlots[index];
    },
  };
  const { VenueYellowPages, venueDatabase } = load(root, mockReact);
  const venues = Object.values(venueDatabase).slice(0, 10);
  const render = () => {
    cursor = 0;
    refCursor = 0;
    return VenueYellowPages({ locale: 'ar', venues, compact: false });
  };

  let tree = render();
  const input = findNode(tree, (node) => node.props?.id === 'yellow-pages-search');
  assert.ok(input, 'search input exists');
  input.props.onChange({ target: { value: 'Bitget' } });
  assert.equal(slots[3], 'Bitget', 'query is injected through original onChange');

  tree = render();
  const clear = findNode(tree, (node) => node.props?.className === 'yellow-pages__search-clear');
  assert.ok(clear, 'custom clear button exists for non-empty query');
  clear.props.onClick({ type: 'click' });
  assert.equal(slots[3], '', 'custom clear still clears query');
  assert.equal(focusCalls.length, 1, 'clear restores keyboard focus to the search input');
  assert.equal(focusCalls[0]?.preventScroll, true, 'focus uses preventScroll to avoid page jump');
  assert.equal(findNode(render(), (node) => node.props?.className === 'yellow-pages__search-clear'), null, 'clear button is removed after query clears');
});

test('15 locale SSR text, custom clear labels and hrefs remain identical to R260', () => {
  for (const locale of locales) {
    for (const query of ['Bitget', 'NO_SUCH_PLATFORM_261', '']) {
      assert.equal(renderWithQuery(root, locale, query), renderWithQuery(base, locale, query), `${locale} ${query || 'default'}`);
    }
  }
});

test('exact inverse returns VenueYellowPages to R260 and registry remains exact', () => {
  const current = fs.readFileSync(path.join(root, pageFile), 'utf8');
  const before = fs.readFileSync(path.join(base, pageFile), 'utf8');
  const projected = current
    .replace('  const restoredUrlRef = useRef(false);\n  const searchInputRef = useRef(null);\n', '  const restoredUrlRef = useRef(false);\n')
    .replace('  const clearDirectorySearch = () => {\n    setSearchQuery("");\n    searchInputRef.current?.focus?.({ preventScroll: true });\n  };\n\n', '')
    .replace('                ref={searchInputRef}\n                value={searchQuery}\n', '                value={searchQuery}\n')
    .replace('                <button type="button" className="yellow-pages__search-clear" onClick={clearDirectorySearch} aria-label={ui.clearSearch}>\n', '                <button type="button" className="yellow-pages__search-clear" onClick={() => setSearchQuery("")} aria-label={ui.clearSearch}>\n');
  assert.equal(projected, before, 'only the approved focus-restoration hunk differs from R260');
  assert.equal(sha256(path.join(root, registryFile)), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
}
