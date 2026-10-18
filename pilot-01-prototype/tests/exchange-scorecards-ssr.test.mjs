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

test('narrow comparison tables expose a localized cue and keyboard-accessible scroll region', () => {
  for (const [locale, hint] of [['en', 'Scroll horizontally'], ['zh-Hans', '左右滑动'], ['zh-Hant', '左右滑動']]) {
    const html = pair(['binance', 'okx'], locale);
    assert.ok(html.includes(hint), locale);
    assert.match(html, /class="exchange-scorecard__scroll" tabindex="0" role="region" aria-label="[^"]+"/);
    assert.match(html, /<th scope="col"><a href="[^\"]*\/exchanges\/binance">Binance<\/a><\/th>/);
    assert.match(html, /<th scope="col"><a href="[^\"]*\/exchanges\/okx">OKX<\/a><\/th>/);
  }
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


test('Chinese and Arabic scorecard presentation uses localized labels and hides missing values', () => {
  for (const locale of ['zh-Hans', 'zh-Hant', 'ar']) {
    const html = pair(['binance', 'okx'], locale);
    assert.doesNotMatch(html, /Data-backed scorecard|Lowest checked spot fees|Published data only|Not checked|Date not recorded|Source 1/);
  }
});

test('initial scorecard markup is stable across server and delayed browser clocks', () => {
  const original = Date.now;
  try {
    Date.now = () => Date.parse('2026-10-01T23:59:59Z');
    const server = pair(['binance', 'okx']);
    Date.now = () => Date.parse('2026-10-16T01:00:00Z');
    assert.equal(pair(['binance', 'okx']), server);
  } finally { Date.now = original; }
});

test('scorecard register status words follow the requested language', async () => {
  const { localizedScorecardValue } = await import('../src/components/compare/scorecard-copy.js');
  for (const locale of ['zh-Hans', 'zh-Hant', 'ar']) {
    const value = localizedScorecardValue('MFSA (MT): licensed; CNV (AR): registered', locale);
    assert.doesNotMatch(value, /licensed|registered/);
    assert.match(value, /MFSA \(MT\)/);
  }
});
