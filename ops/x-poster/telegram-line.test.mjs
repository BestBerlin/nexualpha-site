import test from 'node:test';
import assert from 'node:assert/strict';
// Owner 2026-10-22: every X post carries our Telegram channel (production default: X_TELEGRAM_LINE unset).
delete process.env.X_TELEGRAM_LINE;
const { articleMessage, linkMessage, dailyMessage, costClass, weightedLength } = await import('./x-poster.mjs');
const now = Date.parse('2026-10-28T03:00:00Z');
const a = { slug: 'btc-etf', status: 'PUBLISHED', publishedAt: new Date(now - 60000).toISOString(), title: { en: 'Spot Bitcoin ETF flows turn positive' }, summary: { en: 'BTC ETF inflows rose for a third session.' }, claims: [] };
const market = { liquidations: { h24: { longUsd: 3e8, shortUsd: 2.5e8, totalUsd: 5.5e8 } }, market: { majors: [{ symbol: 'BTCUSDT', price: 81000, change24hPct: -4.2 }, { symbol: 'ETHUSDT', price: 2400, change24hPct: -1 }, { symbol: 'SOLUSDT', price: 103, change24hPct: 2 }], movers: [{ symbol: 'STRKUSDT', change24hPct: 31 }] } };
test('article, link and daily posts all end their body with the Telegram channel, once, within limits', () => {
  for (const [text, max] of [[articleMessage(a, 280, { now, key: 'a' }), 280], [articleMessage(a, 1200, { now, key: 'b' }), 1200], [linkMessage(a, { now }), 280], [dailyMessage(market, { now }), 280]]) {
    assert.equal(text.split('https://t.me/NexuAlphaGlobal').length - 1, 1, text);
    assert.equal(costClass(text), 'link');
    assert.ok(weightedLength(text) <= max, text);
  }
});
