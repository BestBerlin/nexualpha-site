import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { oauthHeader, weightedLength, truncate, costClass, articleMessage, linkMessage, marketMessage, dailyMessage, englishArticles, config, newState, validateState, planPosts, runCycle, loadCredentials, xClient, main } from './x-poster.mjs';

const now = Date.parse('2026-10-12T13:00:00Z');
const article = (slug = 'bitcoin-news', extra = {}) => ({ slug, status: 'PUBLISHED', publishedAt: new Date(now - 60000).toISOString(), availableLocales: ['en'], type: 'news', title: { en: 'Bitcoin liquidity data changes?' }, summary: { en: 'Bitcoin trading volume increased in the measured period. Market depth remained stable.' }, claims: Array.from({ length: 4 }, (_, i) => ({ text: `Source finding ${i + 1}: the measured data covers the reported period and the named venues, with no forecast of future prices.`, sourceIds: ['source'] })), ...extra });
const market = () => ({ generatedAt: new Date(now).toISOString(), liquidations: { h1: { longUsd: 60e6, shortUsd: 2e6 }, h24: { longUsd: 100e6, shortUsd: 80e6 } }, market: { majors: ['BTC', 'ETH', 'SOL'].map((s, i) => ({ symbol: s + 'USDT', price: [80000, 2500, 110][i], change24hPct: 1.2 })), movers: [{ symbol: 'ABCUSDT', change24hPct: -12 }] }, events: [{ type: 'liquidation-spike', severity: 'high' }] });
const ready = () => ({ ...newState(), initialized: true });
const cfg = config();
const opts = (state, extra = {}) => ({ feed: { articles: [article()] }, market: market(), state, now, cfg, ...extra });

// Public invalid example credentials from X documentation; these are not account secrets.
test('OAuth HMAC-SHA1 matches current X documentation test vector', () => {
  const credentials = { consumerKey: 'xvz1evFS4wEEPTGEFPHBog', consumerSecret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw', accessToken: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb', accessSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE' };
  const options = { nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg', timestamp: 1318622958, form: { status: 'Hello Ladies + Gentlemen, a signed OAuth request!' } };
  const signature = (host) => decodeURIComponent(oauthHeader('POST', `https://${host}/1.1/statuses/update.json?include_entities=true`, credentials, options).match(/oauth_signature="([^"]+)"/)[1]);
  assert.equal(signature('api.x.com'), 'Ls93hJiZbQ3akF3HF3x1Bz8/zU4=');
});
test('weighted v3 ranges, NFC, emoji sequences, URLs and bare domains', () => {
  assert.equal(weightedLength('abc中文'), 7);
  assert.equal(weightedLength('e\u0301'), 1);
  assert.equal(weightedLength('👨‍👩‍👧‍👦🇺🇸1️⃣👍🏽'), 8);
  assert.equal(weightedLength('–…'), 3); // ellipsis U+2026 has weight 2
  assert.equal(weightedLength('https://example.com/a?long=query'), 23);
  assert.equal(weightedLength('example.com'), 23);
  assert.equal(weightedLength('https://example.com.'), 24);
  assert.equal(costClass('Visit example.com'), 'link');
  assert.equal(costClass('www.example.com/test'), 'link');
  assert.equal(costClass('普通消息 #crypto'), 'plain');
});
test('truncation preserves graphemes, word boundaries, URLs and weighted caps', () => {
  assert.equal(truncate('Hello world again', 13), 'Hello world…');
  for (const text of ['中文'.repeat(200), '👨‍👩‍👧‍👦'.repeat(200), 'hello https://example.com/very-long-path ' + 'end '.repeat(100)]) {
    const out = truncate(text, 280);
    assert.ok(weightedLength(out) <= 280);
    assert.ok(out.endsWith('…'));
    assert.ok(!out.endsWith('\u200d…'));
  }
});
test('long article uses mapped facts, hook, watch, 2-4 tags, and no URLs or partner facts', () => {
  const a = article(); a.claims.push({ text: 'OKX invite code EXAMPLE returns fees.', sourceIds: ['nexualpha-partners'] });
  const text = articleMessage(a);
  assert.ok(weightedLength(text) >= 600 && weightedLength(text) <= 1200);
  assert.ok(weightedLength(text.split('\n')[0]) <= 120);
  assert.match(text, /What to watch:/);
  assert.equal((text.match(/^• /gm) || []).length, 4);
  // Long post: tag line sits right under the hook (line 3), inside the visible part before "Show more".
  const lines = text.split('\n'), tags = lines[2].split(' ');
  assert.equal(lines[1], ''); assert.ok(weightedLength(lines.slice(0, 3).join('\n')) <= 280);
  assert.ok(!/^[#$]/.test(lines.at(-1)), 'tags not repeated at the end');
  assert.ok(tags.length >= 2 && tags.length <= 4 && tags.every((t) => /^[#$]/.test(t)), text);
  assert.equal(costClass(text), 'plain');
  assert.doesNotMatch(text, /EXAMPLE|\?/);
  assert.ok(weightedLength(articleMessage(a, 280)) <= 280);
  assert.match(articleMessage(a, 280), /What to watch:/);
  assert.match(articleMessage(a, 280), /\n\n[#$]\S+( [#$]\S+){1,3}$/);
});
test('no disclosure/commission lines: partner sentences are dropped; prohibited copy rejected', () => {
  for (const phrase of ['Get rebates with our link.', 'Use the partner code now.', 'Enter the registration code.']) {
    const a = article('partner-news', { summary: { en: `${phrase} ${'Market depth stayed stable. '.repeat(30)}` } });
    for (const text of [articleMessage(a, 280), articleMessage(a), linkMessage(a)]) {
      assert.doesNotMatch(text, /disclosed|rebate|partner code|registration code/i);
      assert.ok(weightedLength(text) <= (text.length > 400 ? 1200 : 280));
    }
  }
  // "verification code" is ordinary support copy, not commission talk.
  assert.match(articleMessage(article('otp', { summary: { en: 'Verification code not received by SMS.' } })), /Verification code/);
  for (const phrase of ['Tax avoidance', 'Bitcoin will reach $100,000', 'Price prediction']) {
    const a = article('unsafe-news', { summary: { en: phrase } });
    assert.throws(() => articleMessage(a), /content policy/);
    assert.throws(() => linkMessage(a), /content policy/);
  }
  const a = article('url-news', { summary: { en: 'See https://example.com and example.org for details.' } });
  assert.equal(costClass(articleMessage(a)), 'plain');
  assert.match(articleMessage(a), /\[URL omitted\]/);
});
test('canonical article link preserved under 280 and numbers retained in market/daily', () => {
  const a = article('long-title', { title: { en: 'Bitcoin '.repeat(70) } });
  const link = linkMessage(a);
  assert.ok(link.includes('https://nexualpha.com/news/long-title?src=x'));
  assert.ok(weightedLength(link) <= 280);
  assert.equal(costClass(link), 'link');
  const m = market(), alert = marketMessage(m.events[0], m), daily = dailyMessage(m);
  assert.match(alert, /Observed liquidations/); assert.doesNotMatch(alert, /lower bound/); assert.match(alert, /\$60.00M/);
  for (const s of ['$BTC', '$ETH', 'SOL', 'observed liquidations', 'Top mover: ABC']) assert.ok(daily.includes(s), daily);
  assert.ok(weightedLength(daily) <= 280);
  assert.equal(costClass(daily), 'plain');
  assert.throws(() => dailyMessage({ ...m, market: { majors: [], movers: [] } }), /major/);
});
test('English edition validation, dedup and configuration bounds', () => {
  assert.equal(englishArticles({ articles: [article(), article(), article('french', { availableLocales: ['fr'] }), article('../bad'), article('missing', { summary: {} })] }).length, 1);
  for (const env of [{ MAX_PLAIN_PER_DAY: '-1' }, { MAX_LINK_PER_DAY: 'bad' }, { X_MAX_WEIGHTED: '25001' }]) assert.throws(() => config(env), /invalid/);
  assert.equal(config({ MAX_PLAIN_PER_DAY: '0' }).plain, 0);
});
test('first run records baseline without posts, subsequent cycle never floods backlog', async () => {
  const state = newState(); let sends = 0, saves = 0;
  const run = (feed) => runCycle(opts(state, { feed, send: async () => { sends++; return { ok: true }; }, save: () => saves++, log: () => {} }));
  await run({ articles: [article()] });
  await run({ articles: [article()] });
  assert.equal(sends, 2); // only daily + high severity event, never baseline article/link
  assert.equal(state.baseline.length, 1);
  assert.ok(!state.posts['article:bitcoin-news']);
  assert.ok(saves > 0);
});
test('dry run prints eligible posts with lengths/classes and never mutates or sends', async () => {
  const state = ready(), before = structuredClone(state), logs = [];
  await runCycle(opts(state, { dryRun: true, log: (s) => logs.push(JSON.parse(s)), send: () => assert.fail(), save: () => assert.fail() }));
  assert.deepEqual(state, before); assert.equal(logs.length, 4);
  for (const l of logs) { assert.equal(l.weightedLength, weightedLength(l.text)); assert.equal(l.costClass, costClass(l.text)); }
  const first = newState(); await runCycle(opts(first, { dryRun: true, log: () => {}, save: () => assert.fail(), send: () => assert.fail() }));
  assert.equal(first.initialized, false);
});
test('UTC budgets hard-stop across restarts and reset at midnight', async () => {
  const state = ready(), sent = [];
  const options = opts(state, { cfg: { ...cfg, plain: 1, link: 1 }, send: async (t) => { sent.push(t); return { ok: true }; }, save: () => {}, log: () => {} });
  await runCycle(options); await runCycle({ ...options, state: JSON.parse(JSON.stringify(state)) });
  assert.equal(sent.length, 2); assert.deepEqual(state.days['2026-10-12'], { plain: 1, link: 1 });
  const midnight = Date.parse('2026-10-13T00:00:00Z');
  const p = planPosts({ ...options, now: midnight, market: { ...market(), events: [], generatedAt: new Date(midnight).toISOString() } });
  assert.ok(p.posts.some((p) => p.kind === 'article'));
  assert.equal(planPosts(opts(ready(), { cfg: { ...cfg, plain: 0, link: 0 } })).posts.length, 0);
});
test('idempotency, hourly articles, rolling 3h event throttle and once-daily link priority', async () => {
  const state = ready(); let sends = 0;
  const feed = { articles: [article('news'), article('market', { type: 'market-event' }), article('token', { type: 'tokenization' })] };
  const options = opts(state, { feed, send: async () => { sends++; return { ok: true, id: String(sends) }; }, save: () => {}, log: () => {} });
  const p = planPosts(options); assert.match(p.posts.find((p) => p.kind === 'link').text, /\/news\/market\?src=x/);
  await runCycle(options); await runCycle(options); assert.equal(sends, 4);
  assert.equal(planPosts({ ...options, now: now + 59 * 60000, market: { ...market(), generatedAt: new Date(now + 59 * 60000).toISOString() } }).posts.length, 0);
  assert.equal(planPosts({ ...options, now: now + HOUR, market: { ...market(), generatedAt: new Date(now + HOUR).toISOString() } }).posts.filter((p) => p.kind === 'article').length, 1);
  assert.equal(planPosts({ ...options, now: now + 3 * HOUR, market: { ...market(), generatedAt: new Date(now + 3 * HOUR).toISOString() } }).posts.filter((p) => p.kind === 'market').length, 1);
});
const HOUR = 3600000;
test('stale/future markets never produce market or daily posts; only high supported events', () => {
  for (const generatedAt of [new Date(now - 16 * 60000).toISOString(), new Date(now + 60000).toISOString(), 'bad']) {
    assert.deepEqual(planPosts(opts(ready(), { market: { ...market(), generatedAt } })).posts.map((p) => p.kind), ['article', 'link']);
  }
  const m = market(); m.events = [{ type: 'top-mover', severity: 'medium' }, { type: 'unknown', severity: 'high' }, ...m.events, ...m.events];
  assert.equal(planPosts(opts(ready(), { market: m })).posts.filter((p) => p.kind === 'market').length, 1);
});
test('reservation precedes send; timeout and any 4xx are not retried on next cycles', async () => {
  for (const response of [{ ok: false, status: 400 }, { ok: false, status: 403 }, { ok: false, status: 429 }, null]) {
    const state = ready(); let count = 0, saved;
    const options = opts(state, { market: null, send: async () => { assert.equal(saved.posts['article:bitcoin-news'].status, 'pending'); count++; if (!response) throw new Error('timeout'); return response; }, save: (s) => { saved = structuredClone(s); }, log: () => {} });
    await runCycle(options);
    await runCycle({ ...options, cfg: { ...cfg, link: 0 } });
    assert.equal(count, 1); assert.equal(state.days['2026-10-12'].plain, 1);
    assert.equal(state.posts['article:bitcoin-news'].status, response ? 'rejected' : 'unknown');
  }
});
test('only length-specific 403 permits one short new payload, charging both attempts', async () => {
  const state = ready(), texts = [];
  await runCycle(opts(state, { market: null, send: async (t) => { texts.push(t); return texts.length === 1 ? { ok: false, status: 403, lengthRejected: true } : { ok: true }; }, save: () => {}, log: () => {} }));
  assert.equal(texts.length, 2); assert.ok(weightedLength(texts[0]) > 280); assert.ok(weightedLength(texts[1]) <= 280);
  assert.equal(state.days['2026-10-12'].plain, 2);
  const limited = ready(); let count = 0;
  await runCycle(opts(limited, { market: null, cfg: { ...cfg, plain: 1 }, send: async () => { count++; return { ok: false, status: 403, lengthRejected: true }; }, save: () => {}, log: () => {} }));
  assert.equal(count, 1);
});
test('persist failure prevents request; corrupt state fails closed', async () => {
  await assert.rejects(runCycle(opts(ready(), { send: () => assert.fail(), save: () => { throw new Error('disk'); }, log: () => {} })), /disk/);
  for (const s of [{}, { ...ready(), days: { bad: { plain: -1, link: 0 } } }, { ...ready(), posts: { bad: {} } }]) assert.throws(() => validateState(s), /corrupt/);
});
test('X client guards identity, JSON body, specific fallback detection, and HTTP errors', async () => {
  const credentials = { consumerKey: 'test', consumerSecret: 'test', accessToken: 'test', accessSecret: 'test' };
  const calls = []; let response = { data: { username: 'NexuAlpha' } }, status = 200;
  const client = xClient(credentials, async (url, options) => { calls.push({ url, options }); return new Response(JSON.stringify(response), { status }); });
  await client.verifyAccount(); response = { data: { id: '123' } }; status = 201;
  assert.equal((await client.send('hello')).ok, true);
  assert.equal(calls[1].url, 'https://api.x.com/2/tweets');
  assert.equal(calls[1].options.body, '{"text":"hello"}');
  assert.match(calls[1].options.headers.Authorization, /^OAuth /);
  status = 403; response = { detail: 'Tweet text exceeds maximum length' }; assert.equal((await client.send('hello')).lengthRejected, true);
  response = { detail: 'Account forbidden' }; assert.equal((await client.send('hello')).lengthRejected, false);
  response = { data: { username: 'Other' } }; status = 200; await assert.rejects(client.verifyAccount(), /only @NexuAlpha/);
  status = 503; response = {}; assert.equal((await client.send('hello')).ambiguous, true);
});
test('env parser never executes shell; CLI lock, corrupt-state and dry-run integration', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'x-poster-test-')), file = path.join(dir, 'env');
  const original = globalThis.fetch;
  try {
    writeFileSync(file, 'X_API_KEY="example"\nX_API_SECRET=example\nX_ACCESS_TOKEN=example\nX_ACCESS_TOKEN_SECRET=example\n');
    assert.equal(loadCredentials(file).consumerKey, 'example');
    writeFileSync(file, 'X_API_KEY=example'); assert.throws(() => loadCredentials(file), /missing/);
    writeFileSync(path.join(dir, 'run.lock'), 'other job');
    await assert.rejects(main([], { X_STATE_DIR: dir }), /locked/);
    assert.ok(existsSync(path.join(dir, 'run.lock')));
    rmSync(path.join(dir, 'run.lock'));
    globalThis.fetch = async (url) => new Response(JSON.stringify(url.includes('news-feed') ? { articles: [article()] } : market()));
    await main(['--dry-run'], { X_STATE_DIR: dir });
    assert.ok(!existsSync(path.join(dir, 'state.json')));
    writeFileSync(path.join(dir, 'state.json'), '{bad');
    await assert.rejects(main(['--dry-run'], { X_STATE_DIR: dir }));
    assert.equal(readFileSync(path.join(dir, 'state.json'), 'utf8'), '{bad');
  } finally { globalThis.fetch = original; rmSync(dir, { recursive: true, force: true }); }
});

test('main uses one clock snapshot across eligibility and execution at 13:00', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'x-poster-clock-'));
  const originalFetch = globalThis.fetch, originalNow = Date.now;
  const state = ready(); state.baseline = [article().slug];
  let clockCalls = 0;
  try {
    writeFileSync(path.join(dir, 'state.json'), JSON.stringify(state));
    Date.now = () => { clockCalls++; return now - (clockCalls === 1 ? 100 : -100); };
    globalThis.fetch = async (url) => new Response(JSON.stringify(url.includes('news-feed') ? { articles: [article()] } : { ...market(), generatedAt: new Date(now - 1000).toISOString(), events: [] }));
    await main([], { X_STATE_DIR: dir });
    assert.equal(clockCalls, 1);
    assert.deepEqual(JSON.parse(readFileSync(path.join(dir, 'state.json'), 'utf8')), state);
    assert.ok(!existsSync(path.join(dir, 'run.lock')));
  } finally { globalThis.fetch = originalFetch; Date.now = originalNow; rmSync(dir, { recursive: true, force: true }); }
});
test('daily link groups timestamps by UTC day rather than written offset date', () => {
  const a = article('offset-news', { publishedAt: '2026-10-13T00:00:00+12:00' });
  assert.ok(planPosts(opts(ready(), { feed: { articles: [a] } })).posts.some((p) => p.kind === 'link'));
});

test('uploadImage refuses non-PNG bytes so a video can never bypass the audio gate', async () => {
  const { xClient } = await import('./x-poster.mjs');
  let called = false;
  const client = xClient({ consumerKey: 'k', consumerSecret: 's', token: 't', tokenSecret: 'ts' }, async () => { called = true; return new Response('{}'); });
  await assert.rejects(client.uploadImage(Buffer.from('\x00\x00\x00\x18ftypmp42')), /only PNG/);
  assert.equal(called, false);
});
