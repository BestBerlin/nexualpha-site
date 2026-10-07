import test from 'node:test';
import assert from 'node:assert/strict';
import { publicCommercialBenefit, resolveCommercialClaim } from '../src/data/commercial-claims.js';

test('commercial claims fail closed without timestamp and official source', () => {
  const claim = resolveCommercialClaim({ partner: { rebatePercent: 20 }, venue: {} });
  assert.deepEqual(claim, { status: 'unverified', checkedAt: null, sourceUrl: null, rebatePercent: 0 });
  assert.match(publicCommercialBenefit({ venueName: 'Binance', claim }), /official Binance account/);
});

test('commercial benefit warning is localized for every supported locale without changing brand names', () => {
  const claim = resolveCommercialClaim({ partner: { rebatePercent: 20 }, venue: {} });
  const locales = ['en', 'zh-Hans', 'zh-Hant', 'es', 'pt-BR', 'fr', 'de', 'ja', 'ko', 'ar', 'tr', 'ru', 'id', 'vi', 'it'];

  for (const locale of locales) {
    const message = publicCommercialBenefit({ locale, venueName: 'Bitget', claim });
    assert.equal(typeof message, 'string', locale);
    assert.ok(message.length > 12, locale);
    assert.match(message, /Bitget/, locale);
  }

  assert.match(publicCommercialBenefit({ locale: 'ja', venueName: 'Bitget', claim }), /公式アカウント/);
  assert.doesNotMatch(publicCommercialBenefit({ locale: 'ja', venueName: 'Bitget', claim }), /User benefit|official Bitget account/);
  assert.match(publicCommercialBenefit({ locale: 'ko', venueName: 'Bitget', claim }), /공식 계정/);
  assert.match(publicCommercialBenefit({ locale: 'tr', venueName: 'Bitget', claim }), /resmi Bitget hesabında/);
});

test('verified commercial claim can publish bounded percentage', () => {
  const claim = resolveCommercialClaim({ partner: { rebatePercent: 20, benefitVerifiedAt: '2026-09-09', benefitSourceUrl: 'https://www.binance.com/terms' } });
  assert.equal(claim.status, 'verified');
  assert.equal(claim.rebatePercent, 20);
  assert.equal(publicCommercialBenefit({ claim }), null);
});

test('invalid source or percentage remains safe', () => {
  const claim = resolveCommercialClaim({ partner: { rebatePercent: 200, benefitVerifiedAt: '2026-09-09', benefitSourceUrl: 'http://insecure.example' } });
  assert.equal(claim.status, 'unverified');
  assert.equal(claim.rebatePercent, 0);
});
