import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANALYTICS_EVENT_TYPES,
  isTelegramSource,
  referralClickPersistenceIdentity,
} from '../src/data/analytics-event-contract.js';

test('shared analytics contract has explicit event and Telegram source allowlists', () => {
  assert.deepEqual(ANALYTICS_EVENT_TYPES, [
    'page_view',
    'decision_impression',
    'decision_select',
    'cta_visible',
    'outbound_handoff',
    'referral_click',
    'telegram_handoff',
  ]);
  for (const source of ['telegram', 'tg', 'tg_channel', 'TG_CHANNEL']) assert.equal(isTelegramSource(source), true);
  for (const source of ['telegram_ads', 'tg-channel', 'newsletter', '', null]) assert.equal(isTelegramSource(source), false);
});

test('referral persistence identity separates attribution context but not event ids', () => {
  const base = {
    eventId: 'ignored', session: 'session', page: '/rates', market: 'BR', product: 'spot',
    platform: 'bitget', placement: 'rates-primary', accountStage: 'new_account', funding: 'Pix',
  };
  assert.equal(referralClickPersistenceIdentity(base), referralClickPersistenceIdentity({ ...base, eventId: 'different' }));
  for (const change of [
    { page: '/exchanges/bitget' }, { platform: 'binance' }, { placement: 'rates-secondary' },
    { market: 'HK' }, { product: 'perpetuals' }, { accountStage: 'existing_account' },
    { funding: 'BRL bank transfer' }, { experiment: 'exp', variant: 'control' },
  ]) assert.notEqual(referralClickPersistenceIdentity(base), referralClickPersistenceIdentity({ ...base, ...change }));
});
