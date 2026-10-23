import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildSync } from 'esbuild';
import { buildScorecard } from '../src/data/exchange-scorecards.js';
import { FACTS_AS_OF } from '../src/data/exchange-facts.js';

const code = buildSync({
  stdin: {
    contents: `import React from 'react'; import { renderToStaticMarkup } from 'react-dom/server';
      import { ExchangeScorecard } from './src/components/compare/ExchangeScorecard.jsx';
      export const render = (selected, locale = 'en', market) => renderToStaticMarkup(React.createElement(ExchangeScorecard, { selected, locale, market }));`,
    resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx',
  }, bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  external: ['react', 'react-dom/server', 'react/jsx-runtime'], loader: { '.css': 'empty' }, logLevel: 'silent',
}).outputFiles[0].text;
const module = { exports: {} };
new Function('require', 'module', 'exports', code)(createRequire(import.meta.url), module, module.exports);
const { render } = module.exports;
const html = render(['binance', 'okx']);
const rowHtml = (html, key) => html.match(new RegExp(`<tr data-scorecard-row="${key}"[^]*?</tr>`))?.[0];

test('the four existing best-for verdicts become icon cards with all winning logos, including ties', () => {
  const card = buildScorecard(['binance', 'okx'], { now: `${FACTS_AS_OF}T00:00:00+08:00` });
  assert.equal([...html.matchAll(/data-scorecard-verdict=/g)].length, 4);
  for (const verdict of card.verdicts) {
    const cardHtml = html.match(new RegExp(`<div data-scorecard-verdict="${verdict.key}"[^]*?</dd></div>`))?.[0];
    assert.match(cardHtml, /class="exchange-scorecard__icon" aria-hidden="true"/);
    for (const winner of verdict.winners) assert.ok(cardHtml.includes(`data-brand-slug="${winner}"`));
  }
});

test('numeric rows retain semantic cells and source text with mirrored checked maker/taker measurements', () => {
  const card = buildScorecard(['binance', 'okx'], { now: `${FACTS_AS_OF}T00:00:00+08:00` });
  assert.match(html, /<table><caption>/);
  for (const key of ['spotFees', 'perpFees']) {
    const row = card.rows.find((item) => item.key === key);
    const markup = rowHtml(html, key);
    assert.match(markup, /data-scorecard-kind="numeric"/);
    assert.match(markup, /<th scope="row">/);
    const scale = Math.max(...row.values.flatMap((cell) => [cell.maker, cell.taker]));
    const cells = [...markup.matchAll(/<td[^]*?<\/td>/g)].map(([cell]) => cell);
    for (const [index, cell] of row.values.entries()) {
      assert.ok(cells[index].includes(cell.display));
      for (const metric of ['maker', 'taker']) {
        const actual = cells[index].match(new RegExp(`data-scorecard-metric="${metric}"[^]*?--scorecard-width:([0-9.e+-]+)`));
        assert.ok(actual);
        assert.ok(Math.abs(Number(actual[1]) - cell[metric] / scale) < 1e-10);
        const metricMarkup = cells[index].match(new RegExp(`<span class="exchange-scorecard__bar"[^>]*data-scorecard-metric="${metric}"[^>]*>`))?.[0];
        assert.equal(metricMarkup.includes('data-scorecard-metric-winner=""'), cell[metric] === Math.min(...row.values.map((other) => other[metric])));
      }
      assert.equal(cells[index].includes('data-scorecard-winner=""'), row.winners.includes(cell.slug));
      if (row.winners.includes(cell.slug)) assert.match(cells[index], /aria-hidden="true">✓ /);
    }
  }
  assert.match(rowHtml(html, 'top200Coins'), /data-scorecard-metric="value"/);
  assert.match(html, /exchange-scorecard__sources/);
});

test('booleans stay chip pairs, missing checked fees never acquire bars, and geographic policy still controls winners', () => {
  const funding = rowHtml(html, 'fundingCoverage');
  assert.match(funding, /data-scorecard-kind="chips"/);
  assert.doesNotMatch(funding, /data-scorecard-bars=/);
  const unknown = render(['uniswap', 'jupiter']);
  assert.doesNotMatch(unknown, /data-scorecard-bars="(?:spotFees|perpFees)"/);
  const turkey = render(['bitget', 'okx'], 'tr', 'tr');
  const verdicts = turkey.split('<dl')[1].split('</dl>')[0];
  assert.doesNotMatch(verdicts, /data-brand-slug="bitget"/);
});

test('the enhancement stays route-scoped with a two-column phone layout and no motion or global CSS', () => {
  const css = readFileSync(new URL('../src/styles/v9/compare9.src.css', import.meta.url), 'utf8');
  assert.match(css, /^\/\* scope: #top\.v3-compare-page \*\//);
  assert.match(css, /repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:960px\).*repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\[data-scorecard-side=a\] \.exchange-scorecard__track i\{margin-inline-start:auto\}/);
  assert.match(css, /\[data-scorecard-metric-winner\] \.exchange-scorecard__track i\{background:var\(--x-ac\)\}/);
  assert.match(css, /thead th a\{[^}]*min-inline-size:44px;min-block-size:44px/);
  assert.doesNotMatch(css, /animation-timeline|view\(\)/);
});
