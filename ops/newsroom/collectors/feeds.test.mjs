import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed, poll, supports } from './feeds.mjs';

const fixture = name => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const now = new Date('2026-10-12T12:30:00Z');
const entities = [
  {
    id: 'binance',
    status: 'active',
    priority: 1,
    display_name: { en: 'Binance', 'zh-Hans': '币安' },
    aliases: ['BNB', '@binance'],
  },
  {
    id: 'okx',
    kind: 'exchange',
    status: 'active',
    priority: 1,
    display_name: { en: 'OKX', 'zh-Hans': '欧易' },
    aliases: [],
  },
];
const keywords = [
  { term: 'withdrawals suspended', lang: 'en', event_type: 'withdrawal_halt', weight: 2, status: 'active' },
  { term: '暂停提币', lang: 'zh-Hans', event_type: 'withdrawal_halt', weight: 2, status: 'active' },
  { term: 'bridge exploit', lang: 'en', event_type: 'hack_exploit', weight: 1.5, status: 'active' },
  { term: 'new listing', lang: 'en', event_type: 'listing', weight: 1, status: 'active' },
];
const googleNewsSource = {
  id: 'google-news-crypto',
  platform: 'google_news',
  access_method: 'rss',
  url: 'https://news.google.com/rss/search?q=crypto%20when:1d',
  status: 'connected',
};
const source = {
  id: 'cointelegraph-rss',
  platform: 'media',
  access_method: 'rss',
  url: 'https://cointelegraph.com/rss',
  status: 'connected',
};
const ctx = (responses, extra = {}) => ({
  entities,
  keywords,
  env: {},
  config: {},
  now,
  request: async url => {
    const value = responses[url] ?? responses.default;
    if (value == null) throw new Error(`unexpected URL ${url}`);
    return value;
  },
  ...extra,
});

test('parseFeed converts RSS media items into raw feed rows', () => {
  const rows = parseFeed(fixture('rss-media.xml'));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].external_id, 'fixture-1');
  assert.equal(rows[0].url, 'https://example.com/story?utm_source=rss&id=1');
  assert.equal(rows[0].title, 'Binance pauses withdrawals after bridge exploit report');
  assert.match(rows[0].body_excerpt, /withdrawals were paused/);
  assert.equal(rows[0].published_at, '2026-10-12T10:00:00.000Z');
  assert.equal(rows[0].author, 'Ana Reporter');
});

test('parseFeed converts Atom entries and rejects malformed XML', () => {
  const rows = parseFeed(fixture('atom.xml'));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].external_id, 'tag:example.com,2026:atom-1');
  assert.equal(rows[0].url, 'https://example.com/atom/okx-listing?ref=rss');
  assert.equal(rows[0].author, 'News Desk');
  assert.throws(() => parseFeed(fixture('malformed.xml')), /Malformed feed XML/);
});

test('poll normalizes RSS items, caps excerpts and maps event keywords', async () => {
  const rows = await poll(source, '2026-10-12T09:59:59Z', ctx({ default: fixture('rss-media.xml') }));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].source_id, 'cointelegraph-rss');
  assert.equal(rows[0].external_id, 'fixture-1');
  assert.equal(rows[0].canonical_url, 'https://example.com/story?id=1');
  assert.deepEqual(rows[0].entities, ['binance']);
  assert.equal(rows[0].event_type_guess, 'hack_exploit');
  assert.ok(rows[0].body_excerpt.length <= 600);
  assert.equal(rows[0].fetched_at, now.toISOString());
});

test('Bloomberg feed stores headline and link only', async () => {
  const rows = await poll(
    { ...source, id: 'bloomberg-markets-rss', url: 'https://feeds.bloomberg.com/markets/news.rss' },
    null,
    ctx({ default: fixture('bloomberg.xml') }),
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].title, 'Crypto Stocks Rally as Bitcoin Rebounds');
  assert.equal(rows[0].url, 'https://www.bloomberg.com/news/articles/2026-10-12/crypto-stocks-rally');
  assert.equal(rows[0].body_excerpt, null);
});

test('Bloomberg keeps matching exchange or project headlines and drops unrelated markets', async () => {
  const rows = await poll(
    { ...source, id: 'bloomberg-markets-rss', url: 'https://feeds.bloomberg.com/markets/news.rss' },
    null,
    ctx({
      default: `<?xml version="1.0"?><rss><channel>
        <item><title>OKX Shares Listing Timeline With Investors</title><link>https://www.bloomberg.com/news/articles/2026-10-12/okx-listing</link><guid>bbg-okx</guid><pubDate>Mon, 12 Oct 2026 10:00:00 GMT</pubDate><description>Subscriber-only summary.</description></item>
        <item><title>Treasury Yields Rise as Oil Falls</title><link>https://www.bloomberg.com/news/articles/2026-10-12/yields-oil</link><guid>bbg-rates</guid><pubDate>Mon, 12 Oct 2026 10:05:00 GMT</pubDate><description>Subscriber-only summary.</description></item>
      </channel></rss>`,
    }),
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].external_id, 'bbg-okx');
  assert.equal(rows[0].body_excerpt, null);
});

test('Google News expands watchlist entity and multilingual keyword queries with a hard cap', async () => {
  const seen = [];
  const pollCtx = ctx({ default: fixture('google-news.xml') }, {
    config: { google_news_max_queries: 3 },
    now: new Date('1970-01-01T00:00:00Z'),
    request: async url => {
      seen.push(new URL(url));
      return fixture('google-news.xml');
    },
  });
  const rows = await poll(
    googleNewsSource,
    null,
    pollCtx,
  );
  assert.equal(seen.length, 3);
  assert.match(seen[0].searchParams.get('q'), /"Binance" "withdrawals suspended" when:1d/);
  assert.match(seen[1].searchParams.get('q'), /"Binance" "暂停提币" when:1d/);
  assert.equal(rows.length, 3);
  assert.match(pollCtx.partial, /Google News query window 3\/24/);
});

test('Google News rotates bounded query windows over UTC time', async () => {
  const first = [];
  const second = [];
  await poll(googleNewsSource, null, ctx({ default: fixture('google-news.xml') }, {
    config: { google_news_max_queries: 2 },
    now: new Date('1970-01-01T00:00:00Z'),
    request: async url => { first.push(new URL(url).searchParams.get('q')); return fixture('google-news.xml'); },
  }));
  await poll(googleNewsSource, null, ctx({ default: fixture('google-news.xml') }, {
    config: { google_news_max_queries: 2 },
    now: new Date('1970-01-01T01:00:00Z'),
    request: async url => { second.push(new URL(url).searchParams.get('q')); return fixture('google-news.xml'); },
  }));
  assert.notDeepEqual(first, second);
  assert.match(first.join(' '), /withdrawals suspended/);
  assert.match(first.join(' '), /暂停提币/);
});

test('Google News keeps successful query results when another query fails', async () => {
  let calls = 0;
  const pollCtx = ctx({ default: fixture('google-news.xml') }, {
    config: { google_news_max_queries: 2 },
    now: new Date('1970-01-01T00:00:00Z'),
    request: async () => {
      calls += 1;
      if (calls === 1) throw new Error('fixture network failure');
      return fixture('google-news.xml');
    },
  });
  const rows = await poll(googleNewsSource, null, pollCtx);
  assert.equal(rows.length, 1);
  assert.match(pollCtx.partial, /Google News query failed/);
});

test('Google Trends keeps only watchlist or keyword matches', async () => {
  const rows = await poll(
    {
      id: 'google-trends-us',
      platform: 'google_trends',
      access_method: 'rss',
      url: 'https://trends.google.com/trending/rss?geo=US',
      status: 'connected',
    },
    null,
    ctx({ default: fixture('trends.xml') }),
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].external_id, 'trend-1');
});

test('RSSHub Telegram only supports verified valid channels and defaults to localhost', async () => {
  const valid = {
    id: 'rsshub-telegram-wublockchainenglish',
    platform: 'telegram',
    access_method: 'rsshub',
    url: 'http://rsshub.invalid/telegram/channel/wublockchainenglish',
    status: 'connected',
    verified_official: true,
  };
  const seen = [];
  const rows = await poll(valid, null, ctx({ default: fixture('rss-media.xml') }, {
    request: async url => {
      seen.push(url);
      return fixture('rss-media.xml');
    },
  }));
  assert.equal(seen[0], 'http://127.0.0.1:1200/telegram/channel/wublockchainenglish');
  assert.equal(rows.length, 1);
  assert.equal(supports({ ...valid, verified_official: false }), false);
  assert.equal(supports({ ...valid, url: 'http://127.0.0.1:1200/telegram/channel/bad-channel!' }), false);
});

test('verified t.me preview sources route through RSSHub without dropping WuBlockchain', async () => {
  const sources = [
    {
      id: 'wublockchain-preview',
      platform: 'media',
      access_method: 'html',
      url: 'https://t.me/s/wublockchainenglish',
      status: 'connected',
      verified_official: true,
    },
    {
      id: 'telegram-nexualphaclub-preview',
      platform: 'telegram',
      access_method: 'html',
      url: 'https://t.me/s/NexuAlphaClub',
      status: 'connected',
      verified_official: true,
    },
  ];
  const seen = [];
  for (const tmeSource of sources) {
    assert.equal(supports(tmeSource), true);
    await poll(tmeSource, null, ctx({ default: fixture('rss-media.xml') }, {
      request: async url => {
        seen.push(url);
        return fixture('rss-media.xml');
      },
    }));
  }
  assert.deepEqual(seen, [
    'http://127.0.0.1:1200/telegram/channel/wublockchainenglish',
    'http://127.0.0.1:1200/telegram/channel/NexuAlphaClub',
  ]);
});

test('public RSS missing authorization remains supported for recovery probes', () => {
  assert.equal(supports({ ...source, status: 'missing-authorization' }), true);
  assert.equal(supports({ ...source, status: 'missing-authorization', url: 'file:///private/feed.xml' }), false);
});

test('unsupported non-feed platforms are rejected before request', async () => {
  assert.equal(supports({ ...source, platform: 'instagram', access_method: 'html', status: 'missing-authorization' }), false);
  await assert.rejects(
    poll({ ...source, platform: 'instagram', access_method: 'html' }, null, ctx({ default: fixture('rss-media.xml') })),
    /Unsupported feed source/,
  );
});
