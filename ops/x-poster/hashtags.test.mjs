import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dailyKeywords, selectTags, coinsIn, stocksIn, radarTermsFromCsv, limitCashtags, BANNED, EVERGREEN } from './hashtags.mjs';
import { articleMessage, linkMessage, marketMessage, dailyMessage, weightedLength, costClass, keywordContext } from './x-poster.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const now = Date.parse('2026-10-28T03:00:00Z'); // FOMC decision day (SGT 11:00)
const fixtures = {
  calendar: { events: [{ kind: 'fomc', start: '2026-10-28T18:00:00.000Z', type: 'macro' }, { kind: 'cpi', start: '2026-11-10T12:30:00.000Z' }, { kind: 'campaign-end', start: '2026-10-28T00:00:00Z' }] },
  topEvents: { events: [{ story_asset: 'ADA', event_type: 'delisting', title_internal: 'Bitget delisting ADA pairs', score: { editorial_score: 61.3 } },
    { story_asset: 'BTC', event_type: 'etf', title_internal: 'Spot Bitcoin ETF inflows hit record', score: { editorial_score: 50 } }] },
  whales: { rows: [{ coin: 'BTC', platform: 'hyperliquid', totalUsd: 700e6 }, { coin: 'ETH', platform: 'hyperliquid', totalUsd: 600e6 }, { coin: 'HYPE', platform: 'hyperliquid', totalUsd: 150e6 }, { coin: 'SCAMX', totalUsd: 9e9 }] },
  market: { liquidations: { h1: { longUsd: 1e6, shortUsd: 2e6 }, h24: { longUsd: 300e6, shortUsd: 250e6, totalUsd: 550e6 } },
    market: { majors: [{ symbol: 'BTCUSDT', price: 81000, change24hPct: -4.2 }, { symbol: 'ETHUSDT', price: 2400, change24hPct: -1 }, { symbol: 'SOLUSDT', price: 103, change24hPct: 2 }],
      movers: [{ symbol: 'STRKUSDT', change24hPct: 31 }, { symbol: 'QUSDT', change24hPct: 87 }] } },
  radar: { terms: { BTC: 159, ETH: 76, DOGE: 62, ADA: 36, TokenizedStocks: 2 } },
  trending: ['MINTER', 'PONS', 'SUI', 'NEAR', 'TAO'],
};
const keywords = dailyKeywords(fixtures, now);
const ctx = (key, extra = {}) => ({ keywords, extraTickers: ['STRKUSDT', 'QUSDT', 'HYPE'], now, key, ...extra });
const article = (slug, title, summary, extra = {}) => ({ slug, status: 'PUBLISHED', publishedAt: new Date(now - 60000).toISOString(), title: { en: title }, summary: { en: summary }, claims: [], ...extra });
const tagLine = (text) => text.split('\n').at(-1).split(' ');
const allTags = (text) => text.match(/(?<![\w$#])(?:#[\p{L}\p{N}_]+|\$[A-Za-z][A-Za-z0-9_]*)/gu) || [];
const posts = () => [
  articleMessage(article('btc-etf', 'Spot Bitcoin ETF flows turn positive', 'BTC ETF inflows rose for a third session while ETH products saw outflows.'), 280, ctx('article:btc-etf')),
  articleMessage(article('tok', 'Tokenized stocks: NVDA and TSLA volumes on Bitget and OKX', 'Tokenized stock trading grew on Bitget, OKX and Binance this week.'), 1200, ctx('article:tok')),
  articleMessage(article('okx-acct', 'OKX Funding vs Trading Account', 'Find the account holding your OKX balance and how internal transfers work.'), 280, ctx('article:okx-acct')),
  linkMessage(article('hl', 'Hyperliquid whales add HYPE longs', 'Large Hyperliquid wallets added HYPE and SOL longs over two days.'), ctx('link:2026-10-28')),
  marketMessage({ type: 'liquidation-spike' }, fixtures.market, ctx('market:liquidation-spike:1')),
  dailyMessage(fixtures.market, ctx('daily:2026-10-28')),
];

test('daily keyword set: FOMC day ranks #FOMC first; curated coins only; deterministic', () => {
  assert.equal(keywords[0].key, 'FOMC');
  assert.deepEqual(dailyKeywords(fixtures, now), keywords);
  for (const k of ['SCAMX', 'MINTER', 'PONS', 'Q']) assert.ok(!keywords.some((x) => x.key === k), k);
  assert.ok(keywords.some((x) => x.key === 'ETF' && x.sources.includes('newsroom')));
  assert.ok(keywords.some((x) => x.key === 'Liquidations'));
  assert.ok(keywords.some((x) => x.key === 'Hyperliquid' && x.sources.includes('whales')));
  // Ordinary day without sources still yields a hot keyword.
  assert.equal(dailyKeywords({}, now)[0].key, 'BTC');
});
test('tag selection is deterministic for fixtures', () => {
  assert.deepEqual(posts(), posts());
  const a = selectTags({ text: 'BTC and ETH rally', key: 'k1', keywords, now });
  assert.deepEqual(a, selectTags({ text: 'BTC and ETH rally', key: 'k1', keywords, now }));
});
test('every post: 2-4 tags, no duplicates, ≤ limit (URL=23), cost class unchanged, tags last', () => {
  const limits = [280, 1200, 280, 280, 280, 280];
  posts().forEach((text, i) => {
    const tags = allTags(text);
    assert.ok(tags.length >= 2 && tags.length <= 4, `${tags} in\n${text}`);
    assert.equal(new Set(tags.map((t) => t.slice(1).toLowerCase())).size, tags.length, `duplicate in ${tags}`);
    assert.ok(weightedLength(text) <= limits[i], `${weightedLength(text)} > ${limits[i]}`);
    // ≤280 posts: tags on the last line. Long posts: tag line is line 3, right under the hook.
    const line = limits[i] > 280 ? text.split('\n')[2].split(' ') : tagLine(text);
    assert.ok(line.every((t) => /^[#$]\S+$/.test(t)), `tag line misplaced:\n${text}`);
    assert.ok(line.some((t) => t.startsWith('#')), 'hashtags present in the tag line');
    if (limits[i] > 280) assert.ok(weightedLength(text.split('\n').slice(0, 3).join('\n')) <= 280, 'tags visible before Show more');
    for (const t of tags) assert.ok(!BANNED.test(t.slice(1)), t);
  });
  const [, , , link, market, daily] = posts();
  assert.equal(costClass(link), 'link'); assert.equal(weightedLength(link.match(/https:\S+/)[0]), 23);
  for (const t of [posts()[0], posts()[1], market, daily]) assert.equal(costClass(t), 'plain');
});
test('cashtags match coins in the text; inline where the ticker already appears', () => {
  for (const text of posts()) {
    const body = text.replace(/\$(?=[A-Za-z])/g, '');
    for (const tag of allTags(text).filter((t) => t.startsWith('$'))) assert.ok([...coinsIn(body, ['STRKUSDT', 'QUSDT']), ...stocksIn(body)].includes(tag.slice(1)), `${tag} not in text`);
  }
  const [etf, , , , , daily] = posts();
  assert.match(etf, /\$BTC ETF inflows/); // inline, first mention
  assert.match(daily, /^\$BTC \$81,000/m); assert.match(daily, /^ETH /m);
  assert.doesNotMatch(daily, /\$SOL/);
  // X allows one cashtag per post (403 on 2026-10-21): every post, including the one with BTC and ETH, carries at most one.
  for (const text of posts()) assert.ok((text.match(/(?<![\w$#&])\$[A-Za-z]/g) || []).length <= 1, text);
  assert.equal(limitCashtags('$BTC and $ETH\n\n$SOL #FOMC'), '$BTC and ETH\n\n#SOL #FOMC');
});
test('hot keyword: the post\'s own daily keyword first, else top macro/topic; never a random alt', () => {
  const okx = posts()[2];
  assert.ok(allTags(okx).includes('#FOMC'), okx); // unrelated post gets the day's top keyword
  assert.ok(!allTags(okx).some((t) => ['#STRK', '#SUI', '#TAO'].includes(t)));
  const [etf] = posts();
  assert.ok(allTags(etf).includes('#ETF') || allTags(etf).includes('#FOMC'), etf);
  const market = posts()[4];
  assert.ok(allTags(market).includes('#Liquidations'));
});
test('venue tags follow Bitget > OKX > Binance; topics like #TokenizedStocks and #NVDA', () => {
  const tok = posts()[1];
  const tags = allTags(tok);
  assert.ok(tags.includes('#TokenizedStocks'), tok);
  assert.ok(tags.includes('$NVDA') || tags.includes('#NVDA') || tags.includes('#FOMC'));
  // A stock post carries the stock's cashtag plus the tokenized-stocks topic (owner: $TSLA $NVDA #TokenizedStocks #xStocks).
  const tsla = selectTags({ text: 'Tesla stock token TSLAx now trades 24/7 on Bybit xStocks', key: 't', keywords: [], now });
  assert.deepEqual(tsla.topics.map((t) => t.tag), ['$TSLA', '#TokenizedStocks']);
  const v = selectTags({ text: 'Binance, OKX and Bitget fees compared', key: 'v', keywords: [], now });
  assert.deepEqual(v.topics.map((t) => t.tag), ['#Bitget']);
});
test('Chinese posts get matching, localized tags', () => {
  const zh = selectTags({ text: '比特币 ETF 资金流入，代币化美股成交增长', key: 'zh1', locale: 'zh-Hans', keywords, now });
  assert.ok(zh.all.length >= 2 && zh.all.length <= 4);
  assert.ok(zh.all.includes('$BTC'));
  assert.ok(zh.all.includes('#美股代币化') || zh.all.includes('#ETF'));
  assert.ok(EVERGREEN.zh.includes(zh.evergreen), zh.evergreen);
  const en = selectTags({ text: 'Bitcoin ETF inflows; tokenized stocks volume grows', key: 'zh1', locale: 'en', keywords, now });
  assert.equal(en.hot, zh.hot); // same daily keyword in both languages
});
test('evergreen tag rotates across posts and days', () => {
  const seen = new Set();
  for (let d = 0; d < 8; d++) for (const k of ['a', 'b', 'c']) seen.add(selectTags({ text: 'market update', key: k, keywords: [], now: now + d * 86400000 }).evergreen);
  assert.ok(seen.size >= 3, [...seen].join(','));
});
test('radar snapshot parses the CSV query column', () => {
  const csv = 'market,language,query,intent,exchange,evidence,priority\nen,en,how to buy cardano on binance,buy,binance,x,1\nzh,zh,比特币怎么买,buy,,x,2\nen,en,bitcoin etf,news,,x,3\n';
  assert.deepEqual(radarTermsFromCsv(csv), { BTC: 3, ADA: 3, ETF: 1 });
});
test('keyword sources fail soft and never touch the network in tests', async () => {
  const ctxOut = await keywordContext({ env: { X_TRENDING: 'off', X_RADAR_FILE: '/nonexistent' }, market: fixtures.market, now, fetcher: async () => { throw new Error('offline'); } });
  assert.ok(ctxOut.keywords.some((k) => k.key === 'Liquidations')); // market data alone still ranks
  assert.ok(ctxOut.errors.some((e) => e.startsWith('calendar')));
});
test('no personal-account credentials referenced anywhere in ops/x-poster', () => {
  const personal = new RegExp(['ber', 'lin'].join(''), 'i');
  for (const f of readdirSync(HERE).filter((f) => /\.(?:m?js|json|md|sh|py|cron)$/.test(f))) {
    assert.doesNotMatch(readFileSync(path.join(HERE, f), 'utf8'), personal, f);
  }
});
