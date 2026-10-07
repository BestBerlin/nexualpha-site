import {projectApproved} from './helpers/r237-approved-inverses.mjs';
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
const base = path.resolve(root, '../../r253-directory-search-locale/candidate');
const cssFile = 'src/components/v3/venue-yellow-pages.css';
const pageFile = 'src/components/v3/VenueYellowPages.jsx';
const registryFile = 'src/data/partner-registry.js';
const locales = ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];

function sha256(file) {
  return require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function getRule(css, selector) {
  let found;
  postcss.parse(css).walkRules(selector, (rule) => {
    if (!found) found = rule;
  });
  assert.ok(found, `missing ${selector}`);
  return Object.fromEntries(found.nodes.filter((node) => node.type === 'decl').map((node) => [node.prop, node.value]));
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
  return renderToStaticMarkup(React.createElement(VenueYellowPages, { locale, venues, compact: false })).replace(' class="yellow-pages__search-input"', '');
}

test('search input reserves logical inline-end space for 44px clear button without moving inline-start rhythm', () => {
  const css = fs.readFileSync(path.join(root, cssFile), 'utf8');
  const input = getRule(css, '.yellow-pages__search-control input');
  const clear = getRule(css, '.yellow-pages__search-clear');

  assert.equal(clear['min-width'], '44px');
  assert.equal(clear['min-height'], '44px');
  assert.equal(clear['inset-inline-end'], '0.35rem');
  assert.equal(input['padding-inline-start'], '0.8rem');
  assert.equal(input['padding-inline-end'], 'calc(44px + 0.35rem + 0.75rem)');
  assert.equal(input['padding-block'], '0.65rem');
  assert.ok(!('padding' in input), 'physical padding shorthand would fail RTL reserve');
});

test('exact inverse returns only the approved CSS hunk to R253', () => {
  const current = projectApproved(cssFile, fs.readFileSync(path.join(root, cssFile), 'utf8'), 'r257-readable-mobile-integration');
  const before = fs.readFileSync(path.join(base, cssFile), 'utf8');
  const afterBlock = `  padding-block: 0.65rem;\n  padding-inline-start: 0.8rem;\n  padding-inline-end: calc(44px + 0.35rem + 0.75rem);`;
  const beforeBlock = `  padding: 0.65rem 2.5rem 0.65rem 0.8rem;`;
  assert.equal((current.match(new RegExp(afterBlock.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1);
  assert.equal(current.replace(afterBlock, beforeBlock), before);
});

test('15 locale directory SSR remains byte-identical to R253 for text, links and handlers', () => {
  for (const locale of locales) {
    const matched = ssr(root, locale, 'Bitget');
    assert.match(matched, /value="Bitget"/, locale + ' actual query injection');
    assert.match(matched, /yellow-pages__search-clear/, locale + ' actual clear state');
    assert.equal(matched, ssr(base, locale, 'Bitget'), locale);
    const unmatched = ssr(root, locale, 'NO_SUCH_PLATFORM_256');
    assert.match(unmatched, /value="NO_SUCH_PLATFORM_256"/, locale + ' actual unmatched injection');
    assert.equal(unmatched, ssr(base, locale, 'NO_SUCH_PLATFORM_256'), `${locale} empty`);
    assert.equal(ssr(root, locale, ''), ssr(base, locale, ''), `${locale} default`);
  }
});

test('partner registry remains exact', () => {
  assert.equal(sha256(path.join(root, registryFile)), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
