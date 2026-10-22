import { existsSync as historicalFixtureExists } from 'node:fs';
const historicalFixture=new URL("../../../r235-compare-condition-completeness/candidate",import.meta.url);
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.resolve(root, '../../r235-compare-condition-completeness/candidate');
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
import vm from 'node:vm';
import { buildSync } from 'esbuild';
function loadCompareFinalChoiceCard(projectRoot) {
  const source = `import { CompareFinalChoiceCard } from './src/components/v3/CompareFinalChoiceCard.jsx'; export { CompareFinalChoiceCard };`;
  const code = buildSync({
    stdin: { contents: source, resolveDir: projectRoot, loader: 'jsx' },
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    external: ['react', 'react/jsx-runtime'],
    loader: { '.css': 'empty' },
  }).outputFiles[0].text;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require, console, URL, URLSearchParams, Intl, setTimeout, clearTimeout });
  return module.exports;
}
const { CompareFinalChoiceCard } = loadCompareFinalChoiceCard(root);
const { CompareFinalChoiceCard: BaselineCompareFinalChoiceCard } = historicalFixtureExists(historicalFixture)?loadCompareFinalChoiceCard(base):{};

const read = (projectRoot, rel) => fs.readFileSync(path.join(projectRoot, rel), 'utf8');
const normalizeAssets = (html) => html.replace(/data-v-[a-z0-9_-]+/gi, 'data-v-ASSET');
const cssRule = (css, selector) => {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `missing CSS selector ${selector}`);
  const end = css.indexOf('}', start);
  assert.notEqual(end, -1, `missing CSS block close for ${selector}`);
  return css.slice(start, end + 1);
};

const directAnswer = {
  title: 'Binance vs OKX decision check',
  body: 'Use source-linked official schedules before registration.',
  reviewedAt: '2026-09-15',
  reviewedLabel: 'Official sources reviewed September 15, 2026',
  checks: ['Fees: published schedules', 'KYC: account review'],
  boundary: 'Official account flow is the final check.',
  sourceLinks: [
    ['Binance Trading Fees', 'https://www.binance.com/en/fee/trading'],
    ['Binance Identity Verification', 'https://www.binance.com/en/support/faq/detail/360027287111'],
    ['OKX Fees', 'https://www.okx.com/fees'],
    ['OKX Identity Verification', 'https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported'],
  ],
  internalLinks: [
    ['Open Binance detail', '/exchanges/binance'],
    ['Open OKX detail', '/exchanges/okx'],
    ['Use the public fee scenario tool', '/rates?product=spot'],
  ],
  decisionCard: {
    title: 'Choose Binance for depth; choose OKX for Web3 routing.',
    evidenceLabel: 'Review sources and decision notes',
    matrixLabel: 'Full matrix',
    picks: {
      binance: { fit: 'Broad CEX product shelf.', verify: 'KYC and fiat rails.' },
      okx: { fit: 'CEX plus Web3 wallet.', verify: 'Regional eligibility.' },
    },
  },
};
const profiles = [
  { slug: 'binance', name: 'Binance', category: 'CEX', checks: ['KYC'], useCases: ['Spot'] },
  { slug: 'okx', name: 'OKX', category: 'CEX', checks: ['KYC'], useCases: ['Web3'] },
];

function renderWith(Component, locale = 'en') {
  return renderToStaticMarkup(React.createElement(Component, {
    directAnswer,
    profiles,
    locale,
    market: 'unknown',
    product: 'spot',
    accountStage: 'ready',
    funding: 'fiat',
  }));
}
function render(locale = 'en') {
  return renderWith(CompareFinalChoiceCard, locale);
}
function renderBaseline(locale = 'en') {
  return renderWith(BaselineCompareFinalChoiceCard, locale);
}

test('R239 keeps compare final evidence source and decision href/text output unchanged',{skip: !historicalFixtureExists(historicalFixture) && 'Missing historical review fixture: '+historicalFixture.pathname}, () => {
  const html = render('en');
  const baselineHtml = renderBaseline('en');
  const baseModule = fs.readFileSync(path.join(base, 'src/components/v3/CompareFinalChoiceCard.jsx'), 'utf8');
  const currentModule = read(root, 'src/components/v3/CompareFinalChoiceCard.jsx');
  assert.equal(currentModule, baseModule, 'component source must remain byte-identical; R239 is CSS-only');

  const linkBlock = html.match(/<div class="v3-compare-direct-answer__links">([\s\S]*?)<\/div>/)?.[1] || '';
  const baselineLinkBlock = baselineHtml.match(/<div class="v3-compare-direct-answer__links">([\s\S]*?)<\/div>/)?.[1] || '';
  assert.ok(linkBlock, 'direct answer source link block renders');
  assert.equal(linkBlock, baselineLinkBlock, 'R239 must not change evidence link markup, hrefs, labels, or ordering');
  const hrefs = [...linkBlock.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(hrefs, [
    'https://www.binance.com/en/fee/trading',
    'https://www.binance.com/en/support/faq/detail/360027287111',
    'https://www.okx.com/fees',
    'https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported',
    '/exchanges/binance?product=spot',
    '/exchanges/okx?product=spot',
    '/rates?product=spot',
    '/exchanges/binance?market=unknown&amp;product=spot#registration-path',
    '/exchanges/okx?market=unknown&amp;product=spot#registration-path',
  ]);
  assert.match(linkBlock, /Binance Trading Fees ↗/);
  assert.match(linkBlock, /OKX Identity Verification ↗/);
  assert.match(linkBlock, /Use the public fee scenario tool/);
  assert.match(linkBlock, /Verify regional eligibility first: Binance →/);
});

test('R239 gives compare evidence source and decision links a 44px touch target without global link changes', () => {
  const css = read(root, 'src/components/v3/crossroads-compare.css');
  const exactRule = /\.v3-compare-final-choice-card__evidence \.v3-compare-direct-answer__links a\s*\{[\s\S]*?display:\s*inline-flex;[\s\S]*?align-items:\s*center;[\s\S]*?min-height:\s*44px;[\s\S]*?padding:\s*0\.62rem 0\.72rem;[\s\S]*?border-radius:\s*10px;[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?\}/;
  assert.match(css, exactRule);
  assert.match(css, /\.v3-compare-final-choice-card__evidence \.v3-compare-direct-answer__links a:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--accent, #8fb0ff\);[\s\S]*?outline-offset:\s*3px;[\s\S]*?\}/);
  assert.doesNotMatch(css, /\.v3-compare-page a\s*\{[\s\S]*?min-height:\s*44px/);
  const genericLinkRule = cssRule(css, '.v3-compare-direct-answer__links a');
  assert.doesNotMatch(genericLinkRule, /width:\s*100%/);
  assert.doesNotMatch(genericLinkRule, /min-height:\s*44px/);
});

test('R239 preserves RTL and long-locale evidence markup while relying on scoped CSS target size', () => {
  const ar = normalizeAssets(render('ar'));
  const de = normalizeAssets(render('de'));
  for (const html of [ar, de]) {
    assert.match(html, /class="v3-compare-final-choice-card__evidence"/);
    assert.match(html, /data-cta-placement="compare-direct-answer-source"/);
    assert.match(html, /data-cta-placement="compare-direct-answer-internal"/);
    assert.match(html, /data-cta-placement="compare-final-choice-detail"/);
    assert.equal((html.match(/class="v3-compare-direct-answer__links"/g) || []).length, 1);
    assert.equal((html.match(/data-cta-placement="compare-direct-answer-source"/g) || []).length, 4);
    assert.equal((html.match(/data-cta-placement="compare-direct-answer-internal"/g) || []).length, 3);
    assert.equal((html.match(/data-cta-placement="compare-final-choice-detail"/g) || []).length, 2);
  }
});
