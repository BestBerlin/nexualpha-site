import assert from 'node:assert/strict';
import test from 'node:test';
import { buildVenueFeeSummary, feeSummaryCopy } from '../src/data/venue-fee-summary.js';

const source = 'https://www.bitget.com/fee';
const dated = { feeCheckedAt: '2026-09-22T00:00:00Z', feeSourceUrl: source };

test('an unchecked base rate never becomes an invented VIP schedule', () => {
  assert.deepEqual(buildVenueFeeSummary({ spotFee: { makerRate: .001, takerRate: .001 } }).rates, []);
  assert.deepEqual(buildVenueFeeSummary({ ...dated, spotFee: { makerRate: null, takerRate: .001 } }).rates, []);
  assert.deepEqual(buildVenueFeeSummary({ ...dated, feeSourceUrl: '', spotFee: { makerRate: .001, takerRate: .001 } }).rates, []);
});

test('only complete sourced base rates are shown, without tier or discount multiplication', () => {
  const result = buildVenueFeeSummary({ ...dated, spotFee: { makerRate: 0, takerRate: .001 }, futuresFee: { makerRate: -.0001, takerRate: .0005 } });
  assert.equal(result.rates.length, 2);
  assert.equal(result.rates[0].makerRate, 0);
  assert.equal(result.rates[1].makerRate, -.0001);
  assert.equal(result.rates[1].takerRate, .0005);
  assert.equal(result.rates[0].sourceUrl, source);
  assert.equal(result.rates[0].tierKey, 'spot-published-base');
  assert.equal(result.rates[0].scopeKey, 'explicit-db-source-account-region-not-proven');
  assert.equal(result.rates.some(row => 'netRate' in row || 'vipTier' in row), false);
});

test('missing numbers do not become zero and invalid source/date cannot verify numbers', () => {
  for (const feeCheckedAt of ['', 'not-a-date']) {
    assert.equal(buildVenueFeeSummary({ ...dated, feeCheckedAt, spotFee: { makerRate: 0, takerRate: 0 } }).rates.length, 0);
  }
  assert.equal(buildVenueFeeSummary({ ...dated, feeSourceUrl: 'javascript:alert(1)', spotFee: { makerRate: 0, takerRate: 0 } }).rates.length, 0);
});

test('only explicit fee research sources appear and duplicate source URLs are combined', () => {
  const research = { facts: [{ axis: 'fees', sourceUrl: source }, { axis: 'fees', sourceUrl: source }, { axis: 'access', sourceUrl: 'https://www.bitget.com/kyc' }] };
  assert.deepEqual(buildVenueFeeSummary({}, research).sources, [source]);
});

test('reviewed official spot base rates are keyed by venue slug and include display scope fields', () => {
  const cases = [
    ['binance', 'regular-user', 'https://www.binance.com/en/fee/trading', /discounts-excluded/],
    ['bitget', 'standard-non-vip', 'https://www.bitget.com/support/articles/12560603892734', /bgb-discount-excluded/],
    ['bybit', 'vip-0', 'https://www.bybit.com/en/help-center/article/Trading-Fee-Structure', /special-zones-excluded/],
  ];
  for (const [slug, tierKey, sourceUrl, scopePattern] of cases) {
    const result = buildVenueFeeSummary({ slug, spotFee: { makerRate: 0.009, takerRate: 0.009 } });
    assert.equal(result.rates.length, 1, slug);
    const [spot] = result.rates;
    assert.equal(spot.product, 'spot');
    assert.equal(spot.makerRate, 0.001);
    assert.equal(spot.takerRate, 0.001);
    assert.equal(spot.tierKey, tierKey);
    assert.match(spot.scopeKey, scopePattern);
    assert.equal(spot.sourceUrl, sourceUrl);
    assert.equal(spot.checkedAt, '2026-09-22');
    assert.ok(spot.conditions.length >= 2, `${slug} should expose account/region/discount conditions`);
    assert.equal(result.sources[0], sourceUrl);
    assert.equal('netRate' in spot || 'rebate' in spot || 'commission' in spot, false);
  }
});

test('conditional or unreadable venues remain unknown unless a separate sourced rate is provided', () => {
  assert.deepEqual(buildVenueFeeSummary({ slug: 'okx', spotFee: { makerRate: 0.0008, takerRate: 0.001 } }).rates, []);
  assert.deepEqual(buildVenueFeeSummary({ slug: 'backpack', spotFee: { makerRate: 0, takerRate: 0.0005 } }).rates, []);
});

test('compact fee guidance has native copy in every supported locale', () => {
  for (const locale of ['en', 'zh-Hans', 'zh-Hant', 'es', 'pt-BR', 'fr', 'de', 'ja', 'ko', 'ar', 'tr', 'ru', 'id', 'vi', 'it', "ur", "uk"]) {
    const copy = feeSummaryCopy(locale);
    for (const key of ['title', 'body', 'source', 'registration', 'checked']) assert.ok(copy[key]?.trim(), `${locale}.${key}`);
    if (locale !== 'en') assert.notEqual(copy.body, feeSummaryCopy('en').body, locale);
  }
});
