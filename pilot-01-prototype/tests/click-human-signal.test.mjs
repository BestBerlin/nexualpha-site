import test from 'node:test';
import assert from 'node:assert/strict';
import { clickIpHash, clickRequestMetadata, createBurstDetector, createClickClassifier } from '../server/click-metadata.mjs';

const ip = '203.0.113.9';
const at = new Date('2026-10-23T12:00:00Z');
const env = { CLICK_HASH_SECRET: 'test-only-key' };
const request = (ua = 'Mozilla/5.0 Chrome/130.0 Safari/537.36', headers = {}, method = 'GET') =>
  new Request('https://nexualpha.com/go/okx', { method, headers: { 'user-agent': ua, ...headers } });
const classify = (req, options = {}) => createClickClassifier({ env })(req, { clientIp: ip, partner: 'okx', at, ...options });

for (const ua of ['Twitterbot/1.0', 'Slackbot-LinkExpanding', 'facebookexternalhit/1.1', 'WhatsApp/2.24',
  'Discordbot/1.0', 'Discord/1.0', 'TelegramBot', 'LinkedInBot', 'GPTBot', 'ClaudeBot', 'PerplexityBot',
  'Googlebot', 'bingbot', 'Applebot', 'YandexBot', 'python-requests', 'curl/8.0', 'node-fetch', 'node',
  'undici', 'Go-http-client/1.1', 'Playwright/1.0', 'puppeteer', 'Mozilla/5.0 HeadlessChrome/130']) {
  test(`classifier excludes ${ua}`, () => assert.equal(classify(request(ua)).cls, 'bot'));
}
for (const header of ['purpose', 'sec-purpose', 'x-moz']) {
  test(`classifier treats ${header} prefetch as bot`, () => assert.equal(classify(request(undefined, { [header]: 'prefetch;prerender' })).cls, 'bot'));
}

test('GET and POST browsers are human; missing network/UA evidence stays unknown', () => {
  for (const method of ['GET', 'POST']) assert.equal(classify(request(undefined, {}, method)).cls, 'human');
  assert.equal(classify(request(), { clientIp: 'unknown' }).cls, 'unknown');
  assert.equal(classify(request('')).cls, 'unknown');
  assert.equal(classify(request(undefined, {}, 'HEAD')).cls, 'bot');
  assert.equal(classify(request(undefined, { 'x-forwarded-for': ip }), { clientIp: null }).ipHash, null);
});

test('internal takes precedence and unauthenticated header cannot hide traffic', () => {
  const config = { ...env, CLICK_INTERNAL_IPS: `192.0.2.1, ${ip}`, CLICK_INTERNAL_TOKEN: 'test-private-token' };
  const c = createClickClassifier({ env: config });
  const run = (headers, clientIp = '192.0.2.5') => c(request('curl/8.0 NexuAlpha-internal/qa', headers), { clientIp, partner: 'okx', at });
  assert.equal(run({}).cls, 'internal');
  assert.equal(c(request(), { clientIp: `::ffff:${ip}`, partner: 'okx', at }).cls, 'internal');
  assert.equal(c(request(undefined, { 'x-nexualpha-internal': 'test-private-token' }), { clientIp: '192.0.2.5', partner: 'okx', at }).cls, 'internal');
  assert.equal(classify(request(undefined, { 'x-nexualpha-internal': '1', 'x-real-ip': ip })).cls, 'human');
  assert.equal(classify(request(undefined, { 'x-nexualpha-internal': 'wrong' })).cls, 'human');
});

test('daily-salted hashes rotate at UTC midnight and normalize addresses without storing IPs', () => {
  assert.match(clickIpHash(ip, at, 'key'), /^[a-f0-9]{64}$/);
  assert.equal(clickIpHash(ip, at, 'key'), clickIpHash(`::ffff:${ip}`, at, 'key'));
  assert.equal(clickIpHash('2001:db8::1', at, 'key'), clickIpHash('2001:0db8:0:0:0:0:0:1', at, 'key'));
  assert.notEqual(clickIpHash(ip, at, 'key'), clickIpHash(ip, new Date('2026-10-24T00:00:00Z'), 'key'));
  assert.notEqual(clickIpHash(ip, at, 'key'), clickIpHash(ip, at, 'another-key'));
  assert.equal(clickIpHash('not-an-ip', at, 'key'), null);
});

test('duplicate is shared across source and method, independent per partner, and expires after 30 minutes', () => {
  let time = at.getTime();
  const c = createClickClassifier({ env, now: () => time });
  const run = (partner = 'okx', method = 'GET') => c(request(undefined, {}, method), { clientIp: ip, partner });
  assert.equal(run().cls, 'human');
  assert.equal(run('okx', 'POST').cls, 'duplicate');
  assert.equal(run('bitget').cls, 'human');
  time += 30 * 60 * 1000;
  assert.equal(run().cls, 'human');
});

test('burst wins over duplicate, uses hash plus partner, and expires', () => {
  let time = at.getTime();
  const c = createClickClassifier({ env, now: () => time, burst: createBurstDetector({ limit: 3, windowMs: 1000, now: () => time }) });
  const run = (partner = 'okx') => c(request(), { clientIp: ip, partner });
  assert.deepEqual(Array.from({ length: 5 }, () => run().cls), ['human', 'duplicate', 'duplicate', 'burst', 'burst']);
  assert.equal(run('bitget').cls, 'human');
  time += 1001;
  assert.equal(run().cls, 'duplicate');
  time += 30 * 60 * 1000;
  assert.equal(run().cls, 'human');
});

test('bots/internal do not poison subsequent visitor dedup or burst state', () => {
  const c = createClickClassifier({ env, burst: createBurstDetector({ limit: 1 }) });
  const options = { clientIp: ip, partner: 'okx', at };
  for (let i = 0; i < 20; i++) {
    assert.equal(c(request('curl/8.0'), options).cls, 'bot');
    assert.equal(c(request('NexuAlpha-internal/test'), options).cls, 'internal');
  }
  assert.equal(c(request(), options).cls, 'human');
});

test('bounded burst and duplicate maps admit new visitors when full', () => {
  const c = createClickClassifier({ env, maxKeys: 1, burst: createBurstDetector({ maxKeys: 1, limit: 1 }) });
  const run = clientIp => c(request(), { clientIp, partner: 'okx', at });
  assert.equal(run(ip).cls, 'human');
  assert.equal(run('192.0.2.7').cls, 'human');
  assert.equal(run(ip).cls, 'human');
});

test('persisted evidence is coarse, boolean, and excludes raw UA, address and referrer query', () => {
  const result = classify(request(undefined, { 'sec-fetch-site': 'same-origin', 'sec-fetch-user': '?1', referer: 'https://nexualpha.com/news?email=private' }));
  assert.equal(result.uaFamily, 'chrome');
  assert.deepEqual([result.hasFetchSite, result.hasFetchUser, result.hasReferrerOrigin], [true, true, true]);
  assert.doesNotMatch(JSON.stringify(result), /203\.0\.113|Mozilla|private|same-origin|https:/);
  const post = classify(request('Mozilla/5.0 Telegram-iOS/11.0', {}, 'POST'));
  assert.equal(post.inapp, 'telegram');
  assert.equal(post.uaFamily, 'telegram');
  assert.equal(post.hasFetchSite, undefined);
  assert.equal(clickRequestMetadata(request(), { ipHash: 'a'.repeat(64), burst: true, duplicate: true }).cls, 'burst');
});


test('missing stable hash secret fails closed even with otherwise human browser evidence', () => {
  const c = createClickClassifier({ env: {} });
  const result = c(request(), { clientIp: ip, partner: 'okx', at });
  assert.equal(result.cls, 'unknown');
  assert.match(result.ipHash, /^[a-f0-9]{64}$/);
});
