import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveMarketLocale,
  resolveMarketPolicy,
  resolveMarketProduct,
  resolveMarketPayment,
  resolveMarketAccountStage,
  resolveMarketOffer,
  resolveResidenceMarket,
  resolveTargetMarket,
  normalizeMarketValue,
} from '../src/data/market-policy.js';
import { marketEntryBrief } from '../src/data/market-entry-brief.js';

test('market policy resolves BR path, locale, and market defaults', () => {
  const policy = resolveMarketPolicy({ pathname: '/br/pix' });
  assert.equal(policy.targetMarket, 'BR');
  assert.equal(policy.defaultLocale, 'pt-BR');
  assert.equal(policy.product, 'spot');
  assert.equal(resolveMarketLocale({ pathname: '/br/comparar' }), 'pt-BR');
  assert.equal(resolveTargetMarket({ pathname: '/br', market: 'BR' }), 'BR');
  assert.equal(resolveTargetMarket({ pathname: '/other', locale: 'pt-BR' }), 'BR');
});

test('market policy preserves non-BR market defaults with non-committal offer posture', () => {
  const policy = resolveMarketPolicy({ market: 'ID' });
  assert.equal(policy.targetMarket, 'ID');
  assert.equal(policy.defaultLocale, 'id');
  assert.equal(policy.product, 'unknown');
  assert.equal(resolveMarketPolicy({ market: 'TW' }).defaultLocale, 'zh-Hant');
  assert.equal(resolveResidenceMarket({ market: 'ID' }), 'ID');
  assert.equal(resolveMarketProduct({ market: 'ID' }), 'unknown');
  assert.equal(resolveMarketPayment({ market: 'ID' }).applicable, false);
  assert.equal(resolveMarketAccountStage({ market: 'ID' }).requiresKyc, true);
  assert.equal(resolveMarketOffer({ market: 'ID' }).shareableToUsers, false);
  assert.equal(resolveMarketOffer({ market: 'ID' }).confidence, 'research-only');
  assert.equal(resolveMarketPolicy({ market: 'TR' }).defaultLocale, 'tr');
  assert.equal(resolveTargetMarket({ pathname: '/markets/turkiye' }), 'TR');
  assert.deepEqual(resolveMarketPayment({ market: 'TR' }).modes, ['TRY', 'bank_transfer', 'crypto_onchain']);

  const vietnam = resolveMarketPolicy({ market: 'VN' });
  assert.equal(vietnam.targetMarket, 'VN');
  assert.equal(vietnam.defaultLocale, 'vi');
  assert.equal(vietnam.product, 'unknown');
  assert.equal(vietnam.payment.applicable, false);
  assert.deepEqual(vietnam.payment.accountCurrency, ['VND', 'USDT']);
  assert.equal(vietnam.accountStage.requiresResidenceMatch, true);
  assert.equal(vietnam.offer.shareableToUsers, false);
  assert.equal(vietnam.offer.confidence, 'research-only');
});

test('unsupported market falls back to unknown policy and safe defaults', () => {
  assert.equal(resolveTargetMarket({ market: 'INVALID', pathname: '/tw' }), 'TW');
  assert.equal(resolveMarketProduct({ market: 'INVALID', pathname: '/tw' }), 'unknown');
  assert.equal(normalizeMarketValue('BR'), 'BR');
  assert.equal(normalizeMarketValue('usa'), 'USA');
  assert.equal(resolveMarketPolicy({ market: 'USA' }).targetMarket, 'unknown');
  assert.equal(resolveMarketOffer({ market: 'NOPE' }).shareableToUsers, false);
  assert.equal(resolveMarketOffer({ market: 'NOPE' }).confidence, 'unknown');
  assert.equal(resolveResidenceMarket({ locale: 'pt-BR', pathname: '/br', market: '' }), 'unknown');
  assert.equal(resolveResidenceMarket({ pathname: '/br', residenceMarket: '' }), 'unknown');
  assert.equal(resolveResidenceMarket({ residenceMarket: 'id' }), 'ID');
  assert.equal(resolveResidenceMarket({}), 'unknown');
});

test('MX is an explicit research policy without a market-specific offer claim', () => {
  const policy = resolveMarketPolicy({ market: 'MX' });
  assert.equal(policy.defaultLocale, 'es');
  assert.deepEqual(policy.payment.modes, ['MXN', 'SPEI', 'bank_transfer']);
  assert.equal(policy.offer.shareableToUsers, false);
  assert.equal(policy.offer.confidence, 'conditional');
});

test('international expansion markets resolve to explicit, non-committal research policies', () => {
  for (const [market, locale, prefix] of [['HK', 'zh-Hant', '/hk'], ['EU', 'en', '/eu'], ['UK', 'en', '/uk'], ['OTHER', 'en', '/int']]) {
    const policy = resolveMarketPolicy({ market });
    assert.equal(policy.targetMarket, market);
    assert.equal(policy.defaultLocale, locale);
    assert.equal(policy.offer.shareableToUsers, false);
    assert.equal(policy.offer.confidence, 'conditional');
    assert.equal(resolveTargetMarket({ pathname: prefix }), market);
  }
});



test('owner regional routes resolve one client market and locale contract', () => {
  for (const [pathname, market, locale] of [
    ['/jp', 'JP', 'ja'],
    ['/kr', 'KR', 'ko'],
    ['/tr/markets/turkiye', 'TR', 'tr'],
    ['/markets/turkiye', 'TR', 'tr'],
    ['/hk', 'HK', 'zh-Hant'],
  ]) {
    assert.equal(resolveTargetMarket({ pathname }), market, `${pathname} market`);
    assert.equal(resolveMarketLocale({ pathname }), locale, `${pathname} locale`);
  }
});

test('market entry brief separates payment evidence from account verification', () => {
  const br = marketEntryBrief({ market: 'BR', product: 'spot' });
  assert.deepEqual(br.paymentModes, ['BRL', 'Pix', 'TED', 'Bank transfer']);
  assert.equal(br.paymentKnown, true);
  assert.equal(br.requiresKyc, true);
  assert.equal(br.residenceMatchRequired, true);

  const mx = marketEntryBrief({ market: 'MX', product: 'spot' });
  assert.deepEqual(mx.paymentModes, ['MXN', 'SPEI', 'Bank transfer']);
  assert.equal(mx.paymentKnown, false);
  assert.equal(mx.offerState, 'conditional');
});

test('market entry brief keeps canonical SEPA label and account currency', () => {
  const brief = marketEntryBrief({ market: 'EU' });
  assert.ok(brief.paymentModes.includes('SEPA'));
  assert.deepEqual(brief.accountCurrency, ['EUR', 'USDT']);
});

test('market entry payment labels stay localized for regional UI languages', () => {
  const expected = {
    ar: 'تحويل بنكي',
    es: 'Transferencia bancaria',
    fr: 'Virement bancaire',
    de: 'Banküberweisung',
    ru: 'Банковский перевод',
    ja: '銀行振込',
    ko: '은행 송금',
    tr: 'Banka transferi',
    vi: 'Chuyển khoản ngân hàng',
    it: 'Bonifico bancario',
  };
  for (const [locale, label] of Object.entries(expected)) {
    const brief = marketEntryBrief({ market: 'EU', locale });
    assert.ok(brief.paymentModes.includes(label), `${locale} should localize bank transfer`);
  }
});
