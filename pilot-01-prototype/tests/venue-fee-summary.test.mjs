import assert from 'node:assert/strict';
import test from 'node:test';
import { buildVenueFeeSummary, feeSummaryCopy } from '../src/data/venue-fee-summary.js';

const source = 'https://www.bitget.com/fee';
const dated = { feeCheckedAt: '2026-09-22T00:00:00Z', feeSourceUrl: source };

const exactRates = {
  binance: { spot: [0.001, 0.001], futures: [0.0002, 0.0005] },
  bitget: { spot: [0.001, 0.001], futures: [0.0002, 0.0006] },
  bybit: { spot: [0.001, 0.001], futures: [0.0002, 0.00055] },
  okx: { spot: [0.0008, 0.001], futures: [0.0002, 0.0005] },
};

test('an unchecked base rate never becomes an invented VIP schedule', () => {
  assert.deepEqual(buildVenueFeeSummary({ spotFee: { makerRate: .001, takerRate: .001 } }).rates, []);
  assert.deepEqual(buildVenueFeeSummary({ ...dated, spotFee: { makerRate: null, takerRate: .001 } }).rates, []);
  assert.deepEqual(buildVenueFeeSummary({ ...dated, feeSourceUrl: '', spotFee: { makerRate: .001, takerRate: .001 } }).rates, []);
});

test('ad hoc venue-database rates stay rejected while reviewed fixtures keep exact base rows', () => {
  // Official fee rows now come only from exchange-facts/reviewed-base-fees, never ad hoc venue-database fields.
  const adHoc = buildVenueFeeSummary({ ...dated, spotFee: { makerRate: 0, takerRate: .001 }, futuresFee: { makerRate: -.0001, takerRate: .0005 } });
  assert.deepEqual(adHoc.rates, []);

  const reviewed = buildVenueFeeSummary({ slug: 'bitget', ...dated, spotFee: { makerRate: 0, takerRate: .001 } });
  assert.deepEqual(reviewed.sources, ['https://www.bitget.com/support/articles/12560603892734']);
  assert.deepEqual(reviewed.rates.map(({ product, makerRate, takerRate, tierKey, sourceUrl, checkedAt, conditions }) => ({ product, makerRate, takerRate, tierKey, sourceUrl, checkedAt, conditionsLength: conditions.length })), [
    { product: 'spot', makerRate: 0.001, takerRate: 0.001, tierKey: 'standard-non-vip', sourceUrl: 'https://www.bitget.com/support/articles/12560603892734', checkedAt: '2026-10-10', conditionsLength: 1 },
    { product: 'futures', makerRate: 0.0002, takerRate: 0.0006, tierKey: 'standard-non-vip', sourceUrl: 'https://www.bitget.com/support/articles/12560603892734', checkedAt: '2026-10-10', conditionsLength: 1 },
  ]);
  assert.equal(reviewed.rates.some(row => 'netRate' in row || 'vipTier' in row || 'rebate' in row || 'commission' in row), false);
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
    ['binance', 'spot', 'regular-user', 'https://www.binance.com/en/fee/schedule', /discounts-excluded/],
    ['bitget', 'spot', 'standard-non-vip', 'https://www.bitget.com/support/articles/12560603892734', /bgb-discount-excluded/],
    ['bybit', 'spot', 'vip-0', 'https://www.bybit.com/en/help-center/article/Trading-Fee-Structure', /special-zones-excluded/],
    ['okx', 'spot', 'regular-user', 'https://www.okx.com/fees', /official-fee-page-base-account-region-not-proven/],
    ['okx', 'futures', 'regular-user', 'https://www.okx.com/fees', /official-fee-page-base-account-region-not-proven/],
  ];
  for (const [slug, product, tierKey, sourceUrl, scopePattern] of cases) {
    const result = buildVenueFeeSummary({ slug, spotFee: { makerRate: 0.009, takerRate: 0.009 } });
    const row = result.rates.find((rate) => rate.product === product);
    assert.ok(row, `${slug} ${product}`);
    assert.deepEqual([row.makerRate, row.takerRate], exactRates[slug][product], `${slug} ${product} exact maker/taker`);
    assert.equal(row.tierKey, tierKey);
    assert.match(row.scopeKey, scopePattern);
    assert.equal(row.sourceUrl, sourceUrl);
    assert.equal(row.checkedAt, '2026-10-10');
    assert.equal(row.conditions.length, 1, `${slug} ${product} should expose one exact reviewed condition`);
    assert.equal(result.sources[0], sourceUrl);
    assert.equal('netRate' in row || 'rebate' in row || 'commission' in row, false);
  }
});

test('conditional or unreadable venues remain unknown unless a separate sourced rate is provided', () => {
  // OKX was promoted to official reviewed fee rows on 2026-10-10; Backpack still has no separate sourced fee row.
  assert.equal(buildVenueFeeSummary({ slug: 'okx', spotFee: { makerRate: 0.0008, takerRate: 0.001 } }).rates.length, 2);
  assert.deepEqual(buildVenueFeeSummary({ slug: 'backpack', spotFee: { makerRate: 0, takerRate: 0.0005 } }).rates, []);
});

test('compact fee guidance has native copy in every supported locale', () => {
  for (const locale of ['en', 'zh-Hans', 'zh-Hant', 'es', 'pt-BR', 'fr', 'de', 'ja', 'ko', 'ar', 'tr', 'ru', 'id', 'vi', 'it']) {
    const copy = feeSummaryCopy(locale);
    for (const key of ['title', 'body', 'source', 'registration', 'checked']) assert.ok(copy[key]?.trim(), `${locale}.${key}`);
    if (locale !== 'en') assert.notEqual(copy.body, feeSummaryCopy('en').body, locale);
  }
});
