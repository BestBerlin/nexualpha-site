import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import * as registry from '../src/data/factbook-registry.js';
import { committedFileHash } from './r100-test-contracts.mjs';

const require = createRequire(new URL('../package.json', import.meta.url));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { buildSync } = require('esbuild');
const source = readFileSync(new URL('../src/components/v3/FactbookPage.jsx', import.meta.url), 'utf8');
const module = { exports: {} };
const compiled = buildSync({ stdin: { contents: source + '\nexport { publicFactbookVenue };', resolveDir: fileURLToPath(new URL('../src/components/v3', import.meta.url)), loader: 'jsx' }, bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react'], loader: { '.css': 'empty' } }).outputFiles[0].text;
vm.runInNewContext(compiled, { React, module, exports: module.exports, require, URL, URLSearchParams, Intl });
const locales = ['en','zh-Hans','zh-Hant','ja','ko','es','pt-BR','fr','de','tr','ru','ar','id','vi','it'];
const render = (locale, slug) => renderToStaticMarkup(React.createElement(module.exports.FactbookPage, { slug, locale, market: 'BR', product: 'spot' }));

test('factbook retains research identity, closed exports and explicit unknown VIP status in 15 locales', () => {
  for (const locale of locales) for (const slug of ['binance','hyperliquid']) {
    const html = render(locale, slug);
    assert.ok(html.includes('<h1'), `${slug}/${locale} identity`);
    assert.ok(html.indexOf('<h1') < html.indexOf('factbook-source-tools'), `${slug}/${locale} identity precedes exports`);
    assert.match(html, /<details class="factbook-source-tools">/);
    assert.match(html, /id="rates"/);
    const rows=[...html.matchAll(/class="[^"]*factbook-fee-tier-row/g)].length;
    assert.equal(rows, registry.FACTBOOK_REGISTRY[slug].feeVerifiedAt ? registry.FACTBOOK_REGISTRY[slug].vipTiers.length : 0, `${slug}/${locale} only reviewed VIP rows are numeric`);
    if(!registry.FACTBOOK_REGISTRY[slug].feeVerifiedAt)assert.match(html,/factbook-vip-pending/,'unreviewed VIP tiers stay explicitly pending');
    assert.match(html,/factbook-base-fees/,'reviewed base-fee ledger remains available');
    if(!registry.FACTBOOK_REGISTRY[slug].feeVerifiedAt)assert.doesNotMatch(html, /0\.1000%/, 'unverified VIP rates stay masked');
    assert.doesNotMatch(html, /SHA-256|Checksum|チェックサム|체크섬|不可偽造/);
    assert.ok(html.includes(`/exchanges/${slug}`), `${slug}/${locale} research profile route`);
  }
});

test('fee source and review date are both required; benefit verification remains independent', () => {
  const raw = registry.FACTBOOK_REGISTRY.binance;
  for (const partial of [{}, { feeVerifiedAt: '2026-10-05' }, { feeSourceUrl: 'https://www.binance.com/en/fee/trading' }]) {
    const value = module.exports.publicFactbookVenue({ ...raw, ...partial }, 'en');
    assert.equal(value.feeVerified, false);
    assert.ok(!value.vipTiers[0].spotM.includes('%'));
  }
  const checked = module.exports.publicFactbookVenue({ ...raw, feeVerifiedAt: '2026-10-05', feeSourceUrl: 'https://www.binance.com/en/fee/trading' }, 'en');
  assert.equal(checked.feeVerified, true);
  assert.equal(checked.rebate.benefitVerified, false);
  for (const [base, net] of [['spotM','netSpotM'],['spotT','netSpotT'],['futM','netFutM'],['futT','netFutT']]) assert.equal(checked.vipTiers[0][net], checked.vipTiers[0][base]);
});

test('factbook does not mutate committed partner facts', () => {
  assert.equal(createHash('sha256').update(readFileSync(new URL('../src/data/partner-registry.js', import.meta.url))).digest('hex'), committedFileHash('src/data/partner-registry.js'));
});
