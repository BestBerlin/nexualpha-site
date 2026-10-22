import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { buildBotPromosFeed, promoButton } from '../src/data/bot-promos-feed.js';
import { feeFact } from '../src/data/exchange-facts.js';
import { HOME_REBATE_SHARE } from '../src/data/home-rebate-tiers.js';
import { heroRebateAmount, heroMoneyText } from '../src/components/v7/home7-hero-volume.js';
import { isPartnerPromotableIn } from '../src/data/partner-geo-policy.js';
const now = Date.parse('2026-10-22T12:00:00Z');
const campaign = (venue = 'okx', extra = {}) => ({ id: `${venue}-test`, venue, category: 'campaign',
  title: { en: '🎁 Official campaign with a long title', 'zh-Hans': '官方活动' }, summary: { en: 'Existing source summary.' },
  startAt: '2026-10-20T00:00:00Z', endAt: '2026-10-24T00:00:00Z', url: `https://www.${venue}.com/campaign/test`, ...extra });

test('schema, empty fallback and checked home hero savings', () => {
  const feed = buildBotPromosFeed({ now });
  assert.equal(feed.schema, 'nexualpha.bot-promos.v1');
  assert.equal(feed.generatedAt, new Date(now).toISOString());
  assert.deepEqual(feed.promos, []);
  assert.deepEqual(feed.savings.volumes, [1e6, 1e7, 1e8]);
  assert.deepEqual(feed.savings.rows.map(r => r.slug), ['bitget', 'okx', 'binance', 'hyperliquid']);
  for (const row of feed.savings.rows) {
    const fee = feeFact(row.slug, 'perp');
    assert.equal(row.takerPct, fee.taker);
    assert.equal(row.source, `perp taker, checked ${fee.checkedOn}`);
    assert.equal(row.share, HOME_REBATE_SHARE[row.slug]);
    assert.equal(row.benefitType, 'rebate'); // Hyperliquid's share is the owner's 30% since 2026-10-22
    for (const volume of feed.savings.volumes) assert.ok(Math.abs(volume * row.takerPct / 100 * row.share - heroRebateAmount(volume, fee.taker, row.share)) < 1e-6);
  }
  assert.equal(heroMoneyText(heroRebateAmount(1e7, feed.savings.rows[0].takerPct, feed.savings.rows[0].share), 'en'), '$3,600');
});

test('dates, official sources and review state fail closed', () => {
  const item = campaign();
  assert.equal(buildBotPromosFeed({ now: Date.parse(item.startAt), campaigns: [item] }).promos.length, 1);
  for (const extra of [{ endAt: new Date(now).toISOString() }, { startAt: '2026-10-23T00:00:00Z' }, { startAt: null }, { endAt: null }, { endAt: null, expiresAt: '2026-10-24T00:00:00Z' }, { startAt: 'invalid' }, { endAt: '2026-10-19T00:00:00Z' }, { status: 'ENDED' }, { reviewStatus: 'PENDING' }, { fixture: true }, { url: 'https://evil.example/campaign' }, { url: null }]) {
    assert.deepEqual(buildBotPromosFeed({ now, campaigns: [campaign('okx', extra)] }).promos, [], JSON.stringify(extra));
  }
  assert.deepEqual(buildBotPromosFeed({ now, campaigns: [null, {}, 7] }).promos, []);
});

test('neutral, Türkiye, partner and explicit locale policies', () => {
  const feed = buildBotPromosFeed({ now, campaigns: ['okx', 'binance', 'bybit', 'bitget', 'kraken'].map(v => campaign(v)) });
  for (const promo of feed.promos) {
    for (const locale of ['ru', 'ar', 'zh-Hant', 'ur', 'uk', 'vi']) {
      assert.ok(!promo.locales.includes(locale));
      for (const field of ['page', 'button', 'title', 'summary']) assert.equal(promo[field][locale], undefined);
    }
    for (const locale of promo.locales) {
      assert.ok(isPartnerPromotableIn(promo.partner, { locale }));
      for (const field of ['page', 'button', 'title', 'summary']) assert.deepEqual(Object.keys(promo[field]), promo.locales);
      assert.ok(promo.button[locale].length <= 20);
    }
    assert.equal(promo.locales.includes('tr'), ['okx', 'binance', 'bybit'].includes(promo.partner));
    assert.match(promo.page.en, /^\/activities\/updates\//);
    assert.match(promo.page['zh-Hans'], /^\/zh-hans\/activities\/updates\//);
  }
  assert.deepEqual(buildBotPromosFeed({ now, campaigns: [campaign('okx', { locales: ['zh-Hans'] })] }).promos[0].locales, ['zh-Hans']);
});

test('priority then recency, max five and announcement title only', () => {
  const campaigns = Array.from({ length: 8 }, (_, i) => campaign('okx', { id: `test-${i}`, startAt: `2026-10-${10 + i}T00:00:00Z`, priority: i === 0 ? 10 : 0 }));
  assert.deepEqual(buildBotPromosFeed({ now, campaigns }).promos.map(p => p.id), ['test-0', 'test-7', 'test-6', 'test-5', 'test-4']);
  const announcement = buildBotPromosFeed({ now, campaigns: [campaign('okx', { category: 'announcement' })] }).promos[0];
  assert.ok(Object.values(announcement.summary).every(s => s === ''));
  assert.equal(announcement.title.en, campaigns[0].title.en);
  assert.equal(promoButton('🎁'.repeat(20)), '🎁'.repeat(10));
  assert.equal(promoButton('a'.repeat(19) + '🎁'), 'a'.repeat(19));
});

test('build publishes feed beside partners in public and client output', (t) => {
  const script = readFileSync(new URL('../scripts/generate-prerender-manifest.mjs', import.meta.url), 'utf8');
  assert.match(script, /buildBotPromosFeed\(\)/);
  assert.match(script, /writeFileSync\(path.join\(dir, "bot-promos.json"\), botPromosFeed\)/);
  const output = new URL('../dist/client/intel/bot-promos.json', import.meta.url);
  assert.match(script, /for \(const dir of \[path\.join\(projectRoot, "public", "intel"\), path\.join\(clientDir, "intel"\)\]\)/);
  if (!existsSync(output)) { t.skip('Built bot promo feed is unavailable; run npm run build first'); return; }
  const feed = JSON.parse(readFileSync(output));
  assert.equal(feed.schema, 'nexualpha.bot-promos.v1');
  // Tracked public snapshots are restored after builds; compare the fresh output
  // to the current generator at its recorded time, rather than an older snapshot.
  assert.deepEqual(feed, buildBotPromosFeed({ now: Date.parse(feed.generatedAt) }));
});
