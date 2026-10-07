import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { trackGrowthPageView, trackGrowthDecision } from '../src/data/cta-analytics.js';
import { validateCta } from '../server/cta-collector.mjs';

const settle = () => new Promise((resolve) => setImmediate(resolve));
const context = { market: 'BR', product: 'spot', placement: 'retry-selector', decision: 'binance' };

async function withClient(run) {
  const keys = ['window', 'navigator', 'location', 'document', 'sessionStorage', 'fetch'];
  const descriptors = new Map(keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const session = randomUUID();
  try {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { userAgent: 'Mozilla/5.0', doNotTrack: '0', webdriver: false, globalPrivacyControl: false } });
    globalThis.window = {};
    globalThis.location = { pathname: '/br', search: '', origin: 'https://nexualpha.com' };
    globalThis.document = { documentElement: { lang: 'pt-BR' } };
    globalThis.sessionStorage = { getItem: (key) => key === 'nexu-cta-session' ? session : 'direct' };
    await run();
  } finally {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

for (const failure of ['rejected-response', 'network-error']) {
  test(`page view and decision can retry after ${failure} while success stays deduped`, async () => withClient(async () => {
    const rows = [];
    let failing = true;
    globalThis.fetch = async (url, init) => {
      assert.equal(url, '/api/analytics/cta');
      const payload = JSON.parse(init.body);
      assert.equal(validateCta(payload), true);
      rows.push(payload);
      if (failing && failure === 'network-error') throw new Error('mock offline');
      return { ok: !failing };
    };
    assert.equal(trackGrowthDecision(context), true);
    assert.equal(trackGrowthDecision(context), false);
    await settle();
    failing = false;
    assert.equal(trackGrowthDecision(context), true);
    await settle();
    assert.equal(trackGrowthDecision(context), false);
    assert.equal(trackGrowthPageView(context), false);
    assert.deepEqual(rows.map((row) => row.type), ['page_view', 'decision_select', 'page_view', 'decision_select']);
  }));
}

test('an older failed decision cannot erase a newer successful identical decision after an intervening selection', async () => withClient(async () => {
  let failFirst;
  const rows = [];
  globalThis.fetch = async (_url, init) => {
    const row = JSON.parse(init.body);
    rows.push(row);
    if (row.type === 'decision_select' && rows.filter((item) => item.type === 'decision_select').length === 1) {
      return new Promise((resolve) => { failFirst = () => resolve({ ok: false }); });
    }
    return { ok: true };
  };
  trackGrowthDecision(context);
  trackGrowthDecision({ ...context, decision: 'okx' });
  trackGrowthDecision(context);
  await settle();
  failFirst();
  await settle();
  assert.equal(trackGrowthDecision(context), false);
  assert.equal(rows.filter((row) => row.type === 'decision_select').length, 3);
}));

test('privacy suppression still blocks a retry after failed delivery', async () => withClient(async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return { ok: false }; };
  trackGrowthDecision(context);
  await settle();
  navigator.globalPrivacyControl = true;
  assert.equal(trackGrowthDecision(context), false);
  assert.equal(trackGrowthPageView(context), false);
  assert.equal(calls, 2);
}));
