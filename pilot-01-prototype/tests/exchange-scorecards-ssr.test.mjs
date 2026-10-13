import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';

const code = buildSync({ stdin: { contents: `
  import React from 'react';
  import { renderToStaticMarkup } from 'react-dom/server';
  import { ExchangeScorecard, CountryScorecards } from './src/components/compare/ExchangeScorecard.jsx';
  export const pair = (selected, locale='en', market) => renderToStaticMarkup(React.createElement(ExchangeScorecard, {selected, locale, market}));
  export const hub = (locale='en') => renderToStaticMarkup(React.createElement(CountryScorecards, {locale}));
`, resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx' }, bundle: true, write: false, external: ['react', 'react-dom/server', 'react/jsx-runtime'], platform: 'node', format: 'cjs', jsx: 'automatic', loader: { '.css': 'empty' } }).outputFiles[0].text;
const module = { exports: {} };
vm.runInNewContext(code, { module, exports: module.exports, require: createRequire(import.meta.url), console, URL, URLSearchParams, Date, Intl, setTimeout, clearTimeout });
const { pair, hub } = module.exports;

test('curated and generated pairs have server-rendered dated numeric tables and truthful schema', () => {
  for (const slugs of [['binance', 'okx'], ['kraken', 'htx']]) {
    const html = pair(slugs);
    assert.match(html, /id="exchange-scorecard"/);
    assert.match(html, /<table>/);
    assert.match(html, /SGT/);
    assert.match(html, /ItemList/);
    assert.doesNotMatch(html, /AggregateRating|ratingValue|radar/i);
    assert.doesNotMatch(html, /repo slice|Not in repo|app rating/i);
    assert.match(html, /Missing data cannot win/);
  }
});

test('Türkiye descriptive data does not award excluded venues', () => {
  const html = pair(['bitget', 'okx'], 'tr', 'tr');
  assert.match(html, /Bitget/);
  assert.doesNotMatch(html, /\/go\/bitget/);
  const verdicts = html.slice(html.indexOf('<dl'));
  assert.doesNotMatch(verdicts.split('</dl>')[0], /Bitget/);
});

test('hub renders market-specific rules and excludes unsupported country claims', () => {
  const html = hub();
  for (const name of ['Türkiye', 'Indonesia', 'Brazil', 'Mexico']) assert.ok(html.includes(name), name);
  assert.ok(!html.includes('Best exchange for Vietnam'), 'Vietnam is a no-promotion market (2026-10-13): no ranking table');
  // Owner rule: no fine print outside footer/legal.
  assert.doesNotMatch(html, /Account eligibility still requires verification/);
  // Owner rule: Türkiye rankings list only OKX, Binance and Bybit.
  const turkey = html.slice(html.indexOf('id="scorecard-tr"'), html.indexOf('id="scorecard-id"'));
  assert.deepEqual([...new Set([...turkey.matchAll(/href="\/exchanges\/([a-z-]+)"/g)].map((m) => m[1]))].sort(), ['binance', 'bybit', 'okx']);
  assert.match(html, /ItemList/);
});
