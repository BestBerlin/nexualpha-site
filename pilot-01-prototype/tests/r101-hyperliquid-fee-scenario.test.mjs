import { committedFileHash } from './r100-test-contracts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { calculateHyperliquidFeeScenario, hyperliquidFeeSnapshot, hyperliquidFeeScenarioCopy, formatHyperliquidFee } from '../src/data/hyperliquid-fee-scenario.js';
import { priorityVenueAnswerFor } from '../src/data/priority-venue-answers.js';

const calculate = (input, snapshot = hyperliquidFeeSnapshot) => calculateHyperliquidFeeScenario({ amount: '1000', liquidity: 'taker', fills: 1, ...input }, snapshot);
test('perpetual basis-point units, single and two same-notional fills', () => {
  assert.equal(calculate({}).feeUsd, 0.45);
  assert.equal(calculate({ liquidity: 'maker' }).feeUsd, 0.15);
  assert.equal(calculate({ fills: 2 }).feeUsd, 0.9);
  assert.equal(calculate({ liquidity: 'maker', fills: 2 }).feeUsd, 0.3);
  assert.equal(calculate({ amount: '0.01', liquidity: 'maker' }).feeUsd, 0.0000015);
  assert.match(formatHyperliquidFee(0.0000015, 'en'), /0\.0000015/);
  assert.equal(calculate({ amount: '1000000000' }).feeUsd, 450000);
});
test('invalid amounts and unsupported controls never become zero-fee success', () => {
  for (const amount of ['', ' ', '-1', '0', '0.00', '1e3', 'Infinity', 'NaN', '1,000', '1.001', '1000000000.01', 'abc', null, 1000]) {
    assert.deepEqual(calculate({ amount }), { status: 'invalid-input' }, String(amount));
  }
  for (const input of [{ liquidity: 'spot' }, { fills: 0 }, { fills: '2' }, { fills: 3 }]) assert.equal(calculate(input).status, 'invalid-input');
});
test('missing provenance, wrong products, and absent or unsafe rates fail closed', () => {
  for (const snapshot of [null, {}, { ...hyperliquidFeeSnapshot, sourceHref: '' }, { ...hyperliquidFeeSnapshot, reviewedAt: null }, { ...hyperliquidFeeSnapshot, reviewedAt: '2026-02-31T02:01:16Z' }, { ...hyperliquidFeeSnapshot, reviewedAt: '2026-02-30T02:01:16Z' }, { ...hyperliquidFeeSnapshot, reviewedAt: '2026-10-02' }, { ...hyperliquidFeeSnapshot, sourceHref: 'https://example.com/fees' }, { ...hyperliquidFeeSnapshot, scope: 'hip-3' }, { ...hyperliquidFeeSnapshot, product: 'spot' }, { ...hyperliquidFeeSnapshot, rates: {} }, { ...hyperliquidFeeSnapshot, rates: { maker: 0.015, taker: 0.045 } }, { ...hyperliquidFeeSnapshot, rates: { maker: NaN, taker: Infinity } }]) {
    assert.deepEqual(calculate({}, snapshot), { status: 'unavailable' });
  }
  assert.ok(Object.isFrozen(hyperliquidFeeSnapshot));
  assert.ok(Object.isFrozen(hyperliquidFeeSnapshot.rates));
});
test('supported locales have explicit copy; broad source-list review date stays unchanged', () => {
  for (const locale of ['ja', 'toString', '__proto__', 'unknown']) assert.equal(hyperliquidFeeScenarioCopy(locale), null);
  for (const locale of ['en', 'zh-Hans', 'zh-Hant']) {
    const copy = hyperliquidFeeScenarioCopy(locale);
    for (const value of Object.values(copy)) assert.ok(typeof value === 'string' && value.length > 0);
    assert.equal(priorityVenueAnswerFor('hyperliquid', locale).reviewedAt, '2026-09-22');
  }
});
test('full owner-page SSR exposes closed localized controls, source and contextual comparison only for scoped venue/locales', () => {
  const temp = mkdtempSync(new URL('./.tmp-r101-', import.meta.url));
  try {
    const entry = `${temp}/entry.jsx`;
    writeFileSync(entry, `import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {VenueDetailPage} from '../../src/components/v3/VenueDetailPageStatic.jsx'; import {venueDatabase} from '../../src/data/venue-database.js'; const pages=[]; for(const locale of ['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','ja','ko','ar','tr','ru','id','vi','it']) for(const slug of ['hyperliquid','dydx']) pages.push({locale,slug,html:renderToStaticMarkup(<VenueDetailPage locale={locale} venue={venueDatabase[slug]} venues={Object.values(venueDatabase)} copy={{common:{dimension:'Dimension'},assetCapabilities:{none:'Pending'}}} updates={[]} market="tw" product="unknown" />)}); console.log(JSON.stringify(pages));`);
    execFileSync('node_modules/.bin/esbuild', [entry, '--bundle', '--platform=node', '--format=cjs', `--outfile=${temp}/bundle.cjs`, '--loader:.css=empty', '--log-level=warning']);
    const pages = JSON.parse(execFileSync('node', [`${temp}/bundle.cjs`], { encoding: 'utf8', maxBuffer: 16e6 }));
    for (const { locale, slug, html } of pages) {
      if (slug !== 'hyperliquid' || !['en', 'zh-Hans', 'zh-Hant'].includes(locale)) { assert.doesNotMatch(html, /data-hyperliquid-fee-scenario/); continue; }
      const start = html.indexOf('<details class="v3-hyperliquid-fee-scenario"');
      assert.ok(start > html.indexOf('data-priority-answer="hyperliquid"'));
      const section = html.slice(start, html.indexOf('</details>', start));
      assert.doesNotMatch(section.slice(0, section.indexOf('>')), /open=/);
      const copy = hyperliquidFeeScenarioCopy(locale);
      assert.ok(section.includes(copy.title));
      assert.match(section, /inputMode="decimal"/i);
      assert.match(section, /<label/);
      assert.match(section, /<select/);
      for (const name of ["hypothetical-notional-usd", "hypothetical-fill-type", "hypothetical-fill-count"]) assert.ok(section.includes(`name="${name}"`));
      assert.match(section, /data-cta-placement="hyperliquid-fee-scenario-source"/);
      assert.match(section, /data-cta-placement="hyperliquid-fee-scenario-compare"/);
      assert.match(section, /data-growth-decision="compare_hyperliquid_dydx"/);
      assert.match(section, /data-growth-market="tw"/);
      assert.match(section, /data-growth-product="perpetuals"/);
      assert.match(section, /aria-live="polite"/);
      assert.ok(section.includes(hyperliquidFeeSnapshot.sourceHref));
      assert.ok(section.includes(hyperliquidFeeSnapshot.reviewedAt));
      assert.match(section, /hyperliquid-vs-dydx#nxa-context\?[^" ]*market=tw[^" ]*product=perpetuals/);
      if (locale !== 'en') assert.ok(section.includes(`/${locale.toLowerCase()}/compare/`));
      assert.doesNotMatch(section, /data-cta-kind="registration"|sponsored|localStorage|referralCode/);
    }
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
test('immutable commercial destination file hashes stay unchanged', () => {
  // Class b: 84b6426 made the official binance.com referral route the accepted protected registry bytes.
  const hashes = { 'partner-registry.js':'e53261a6e7e39e64bd35bbedda4ef4a36c1521521750a77eaff3d26c52925d69', 'venue-database.js':'0ce124afbe9f4758ce9ec093c79372550ce2e2e90a7342aa05ecc8d3482e1d52', 'public-cta.js':'675875240d5fbb05498284a37f90a14488d6ace73d19b102caeb5add9e33f8e3', 'regional-cta.js':'a2542bb137b6b6ff123a0d3c6b3a01b09e1e3a785ee223e3b4e04a3fe8aab665' };
  for (const [file, hash] of Object.entries(hashes)) assert.equal(createHash('sha256').update(readFileSync(new URL(`../src/data/${file}`,import.meta.url))).digest('hex'), committedFileHash(`src/data/${file}`));
});
