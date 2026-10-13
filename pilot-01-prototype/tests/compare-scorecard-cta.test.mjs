import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVenueCta } from '../src/data/compare-cta.js';

test('available comparison actions use tracked internal redirects', () => {
  const cta = compareVenueCta('bybit', ['bybit', 'bitget'], 'en', 'unknown', 'unknown');
  assert.equal(cta.direct, true);
  const url = new URL(cta.ctaHref, 'https://nexualpha.com');
  assert.equal(url.pathname, '/go/bybit');
  assert.equal(url.searchParams.get('src'), 'compare-bybit-vs-bitget');
});

test('Türkiye and restricted markets cannot acquire a tracked signup action', () => {
  for (const [slug, locale, market] of [['bitget', 'tr', 'tr'], ['bybit', 'en', 'US']]) {
    const cta = compareVenueCta(slug, ['bybit', 'bitget'], locale, market, 'unknown');
    assert.equal(cta.direct, false);
    assert.ok(!cta.ctaHref.startsWith('/go/'));
  }
});
