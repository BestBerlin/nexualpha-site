import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, writeFileSync, existsSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { moversWithFallback, generate, dailySlotDue, normalize, feedSources, MAX_SOURCE_AGE_MS, postText, renderCard, cardSvg, channelFor, sgtDay, postDaily, main, CARD_LABELS, CJK_FONT, redact, failureLine } from './generate.mjs';
import { weightedLength, xClient } from '../x-poster/x-poster.mjs';
import { sendPhoto, token } from '../alert-sender/alert-sender.mjs';

// A real 1x1 RGBA PNG (valid IHDR/IDAT/IEND with CRCs), so tests exercise the PNG-only upload guard honestly.
const TINY_PNG = readFileSync(new URL('./fixtures/tiny.png', import.meta.url));
const fixture = JSON.parse(readFileSync(new URL('./fixtures/daily.json', import.meta.url), 'utf8'));
const now = Date.parse('2026-10-13T01:00:00Z');
const data = () => normalize(fixture.movers, fixture.market, now);
test('recent last-good snapshots and failed market sub-sources cannot publish during recovery', () => {
  assert.throws(() => normalize({ ...fixture.movers, stale: true }, fixture.market, now), /movers feed stale/);
  assert.throws(() => normalize(fixture.movers, { ...fixture.market, stale: true }, now), /market feed stale/);
  assert.throws(() => normalize(fixture.movers, { ...fixture.market, stale: false, sourceStatus: { markets: { status: 'open' } } }, now), /markets unavailable/);
});
const temp = (t) => { const dir = mkdtempSync(path.join(tmpdir(), 'daily-social-')); t.after(() => rmSync(dir, { recursive: true, force: true })); return dir; };
test('fixture renders an actual 1200x675 PNG and brand/logo/funding/ten rows', () => {
  const png = renderCard(data());
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 1200); assert.equal(png.readUInt32BE(20), 675);
  const svg = cardSvg(data());
  for (const label of ['#070a0e', 'data:image/svg+xml;base64,', 'SGT', 'TOP 5 GAINERS', 'TOP 5 LOSERS', 'Largest single: BTC long $2.38M', 'Binance +0.0085% / OKX −0.0012%']) assert.ok(svg.includes(label), label);
  for (const row of [...fixture.movers.up, ...fixture.movers.down]) assert.ok(svg.includes(row.sym));
});
test('four concise owner-page texts have one 23-unit URL, <=280 weighted units, no domain names or codes', () => {
  for (const locale of ['zh-Hans', 'en']) for (const platform of ['x', 'tg']) {
    const text = postText(data(), locale, platform);
    // X gets one trailing tag line after a blank line; Telegram stays tag-free.
    const [body, tagLine] = platform === 'x' ? text.split('\n\n') : [text, null];
    const lines = body.split('\n');
    assert.equal(lines.length, 4);
    assert.ok(weightedLength(text) <= 280);
    assert.equal(weightedLength(lines.at(-1)), 23);
    assert.equal(lines.at(-1), `https://nexualpha.com/${locale === 'en' ? 'en' : 'zh-hans'}?src=${platform}-daily`);
    assert.doesNotMatch(lines.slice(0, -1).join('\n'), /\b[a-z0-9-]+\.[a-z]{2,}\b/i);
    assert.doesNotMatch(body, /#|referral|promo code|预测|disclaimer/i);
    if (platform === 'x') {
      const tags = tagLine.split(' ').concat(body.match(/\$[A-Z][A-Z0-9]+/g) || []).filter((t, i, a) => a.indexOf(t) === i);
      assert.ok(tags.length >= 2 && tags.length <= 4, tags.join(' '));
      assert.ok(tagLine.split(' ').every((t) => /^[#$]\S+$/.test(t)), tagLine);
      assert.ok(tagLine.split(' ').some((t) => (locale === 'en' ? ['#crypto', '#Bitcoin', '#CryptoNews', '#Web3'] : ['#加密货币', '#比特币', '#crypto', '#CryptoNews']).includes(t)), tagLine);
      assert.equal(text, postText(data(), locale, platform), 'deterministic');
    } else assert.doesNotMatch(text, /#/);
  }
});
test('X daily text carries today\'s hot keyword and inline cashtags for listed movers', () => {
  const keywords = [{ key: 'FOMC', score: 150, sources: ['calendar'] }, { key: 'BTC', score: 60, sources: ['whales'] }];
  const text = postText(data(), 'en', 'x', { keywords, now });
  assert.match(text, /#FOMC/);
  const syms = [...data().up, ...data().down].slice(0, 1).map((r) => r.sym);
  assert.match(text, new RegExp(`\\$${syms[0]}\\b`));
});
test('SGT date rolls over eight hours ahead of UTC', () => {
  assert.equal(sgtDay('2026-10-12T16:00:00Z'), '2026-10-13');
  assert.equal(sgtDay('2026-10-12T15:59:59Z'), '2026-10-12');
});
test('neutral and unknown locales fail closed, including inherited property names', () => {
  for (const locale of ['ru', 'tr', 'vi', 'zh', 'id', 'constructor', 'toString']) {
    assert.throws(() => channelFor(locale)); assert.throws(() => postText(data(), locale, 'tg'));
  }
  assert.equal(channelFor('en'), '@NexuAlphaGlobal'); assert.equal(channelFor('zh-Hans'), '@NexuAlphaClub');
});
test('untrusted domains, malformed numbers, stale/future data and incomplete boards are rejected', () => {
  for (const edit of [
    (f) => { f.movers.up[0].sym = 'gate.io'; },
    (f) => { f.movers.down[0].sym = 'MEXC.COM'; },
    (f) => { f.movers.up[0].change = 'Infinity%'; },
    (f) => { f.movers.up[0].change = '-2%'; },
    (f) => { f.movers.up = f.movers.up.slice(0, 2); f.movers.down = f.movers.down.slice(0, 2); },
    (f) => { delete f.movers.down; },
    (f) => { f.market.liquidations.h24.totalUsd = null; },
    (f) => { f.market.liquidations.h24.largest.symbol = 'gate.io'; },
    (f) => { f.market.funding.rows[0].binanceRate = null; f.market.funding.rows[0].okxRate = null; },
    (f) => { f.market.funding.generatedAt = '2026-10-12T01:00:00Z'; },
    (f) => { f.market.generatedAt = '2026-10-13T01:01:00Z'; },
    (f) => { f.movers.generatedAt = '2026-10-12T01:00:00Z'; },
  ]) {
    const f = structuredClone(fixture); edit(f); assert.throws(() => normalize(f.movers, f.market, now));
  }
});
test('unavailable funding venue and zero liquidations retain truthful values', () => {
  const f = structuredClone(fixture); f.market.funding.rows[0].okxRate = null;
  f.market.liquidations.h24 = { totalUsd: 0, largest: null };
  const d = normalize(f.movers, f.market, now);
  assert.match(cardSvg(d), /None observed/); assert.match(cardSvg(d), /OKX unavailable/);
  assert.match(postText(d, 'en', 'x'), /≥\$0/);
});
test('dry-run CLI writes dated card/texts/JSON without requiring credentials', async (t) => {
  const out = temp(t); const log = console.log; const logs = []; console.log = (s) => logs.push(s); t.after(() => { console.log = log; });
  const summary = await main(['--fixture', fileURLToPath(new URL('./fixtures/daily.json', import.meta.url)), '--at', '2026-10-13T01:00:00Z', '--out', out], {});
  assert.equal(summary.mode, 'dry-run'); assert.equal(summary.day, '2026-10-13');
  assert.ok(existsSync(summary.card)); assert.equal(Object.keys(summary.texts).length, 4);
  assert.deepEqual(JSON.parse(logs[0]), summary);
  for (const v of Object.values(summary.texts)) assert.ok(readFileSync(v.file, 'utf8').endsWith('\n'));
});
test('post cannot use a fixture, artificial clock, dry-run or prohibited locale', async () => {
  for (const args of [['--post', '--fixture', 'x'], ['--post', '--at', 'x'], ['--post', '--dry-run'], ['--x-locale', 'ru'], ['--at', 'x'], ['--out'], ['--unknown']]) await assert.rejects(main(args, {}));
});
test('production dry-run reads both owner endpoints and checks freshness after fetching', async (t) => {
  const out = temp(t), originalFetch = globalThis.fetch, originalNow = Date.now, originalLog = console.log;
  t.after(() => { globalThis.fetch = originalFetch; Date.now = originalNow; console.log = originalLog; });
  let clock = now; const urls = [];
  Date.now = () => clock; console.log = () => {};
  const f = structuredClone(fixture);
  const at = new Date(now + 500).toISOString();
  f.movers.generatedAt = at; f.market.generatedAt = at; f.market.funding.generatedAt = at;
  globalThis.fetch = async (url) => { urls.push(url); clock = now + 500; return Response.json(url.endsWith('/api/movers.json') ? f.movers : f.market); };
  const summary = await main(['--out', out], { X_TRENDING: 'off' });
  assert.equal(summary.mode, 'dry-run'); assert.equal(summary.sourceTimes.movers, at);
  // Feeds: exactly the two owner endpoints (keyword sources are separate, optional and fail soft).
  assert.deepEqual(urls.filter((u) => /movers|market-events/.test(u)).sort(), ['https://nexualpha.com/api/movers.json', 'https://nexualpha.com/intel/market-events.json']);
});
const bundle = () => ({ summary: { day: data().day }, png: TINY_PNG, texts: Object.fromEntries(['en', 'zh-Hans'].flatMap((l) => ['x', 'tg'].map((p) => [`${p}-${l}.txt`, postText(data(), l, p)]))) });

test('same-day catch-up is due after 09:00 SGT; reboot preview never publishes or changes a journal', async (t) => {
  assert.equal(dailySlotDue('2026-10-15T00:59:59Z'), false);
  assert.equal(dailySlotDue('2026-10-15T01:00:00Z'), true);
  assert.equal(dailySlotDue('2026-10-15T06:00:00Z'), true);
  assert.equal(dailySlotDue('2026-10-15T16:00:00Z'), false);
  const out = temp(t), file = path.join(out, 'fixture.json');
  writeFileSync(file, JSON.stringify(fixture).replaceAll('2026-10-13T01:00:00Z', '2026-10-13T02:00:00Z'));
  assert.deepEqual(await main(['--catch-up', '--dry-run', '--fixture', file, '--at', '2026-10-13T00:30:00Z', '--out', out], {}), { day: '2026-10-13', mode: 'not-due' });
  for (let i = 0; i < 2; i++) assert.equal((await main(['--catch-up', '--dry-run', '--fixture', file, '--at', '2026-10-13T02:00:00Z', '--out', out], {})).mode, 'dry-run');
  assert.equal(existsSync(path.join(out, '2026-10-13.json')), false);
});

test('reboot-left stale lock can recover without replaying pending deliveries', async (t) => {
  const stateDir = temp(t), b = bundle(), sent = [];
  const lock = path.join(stateDir, 'run.lock');
  writeFileSync(lock, 'crashed process');
  utimesSync(lock, new Date(Date.now() - 11 * 60000), new Date(Date.now() - 11 * 60000));
  writeFileSync(path.join(stateDir, `${b.summary.day}.json`), JSON.stringify({ x: { status: 'pending', at: new Date().toISOString() } }));
  const opts = { bundle: b, stateDir, client: { verifyAccount: () => assert.fail('do not repeat pending X'), send: () => assert.fail('do not repeat pending X') },
    telegramSend: async (chat) => { sent.push(chat); return { ok: true, id: sent.length }; } };
  await postDaily(opts);
  await postDaily(opts);
  assert.deepEqual(sent, ['@NexuAlphaClub', '@NexuAlphaGlobal']);
  assert.equal(JSON.parse(readFileSync(path.join(stateDir, `${b.summary.day}.json`))).x.status, 'pending');
});
test('mock posting uploads image, posts one X locale and only two owner channels; repeat skips all', async (t) => {
  const stateDir = temp(t), calls = [], b = bundle();
  const client = { verifyAccount: async () => calls.push('verify'), uploadImage: async (png) => { assert.equal(png, b.png); calls.push('upload'); return '123'; },
    send: async (text, ids) => { assert.equal(text, b.texts['x-en.txt']); assert.deepEqual(ids, ['123']); calls.push('x'); return { ok: true, id: '99' }; } };
  const telegramSend = async (chat, png, caption) => { assert.equal(png, b.png); assert.match(caption, /src=tg-daily/); calls.push(chat); return { ok: true, id: 1 }; };
  const result = await postDaily({ bundle: b, stateDir, client, telegramSend });
  assert.deepEqual(calls, ['verify', 'upload', 'x', '@NexuAlphaClub', '@NexuAlphaGlobal']);
  assert.ok(Object.values(result).every((v) => v.status === 'sent'));
  await postDaily({ bundle: b, stateDir, client, telegramSend }); assert.equal(calls.length, 5);
});
test('ambiguous send is journaled and never retried; later run can finish unsent channels', async (t) => {
  const stateDir = temp(t), b = bundle(); let attempts = 0, telegram = 0;
  const client = { verifyAccount: async () => {}, uploadImage: async () => '1', send: async () => { attempts++; throw new Error('timeout secret-url'); } };
  const telegramSend = async () => { telegram++; return { ok: true, id: 1 }; };
  await assert.rejects(postDaily({ bundle: b, stateDir, client, telegramSend }), /Daily x delivery unconfirmed/);
  assert.equal(telegram, 0);
  assert.equal(JSON.parse(readFileSync(path.join(stateDir, `${b.summary.day}.json`))).x.status, 'unknown');
  await postDaily({ bundle: b, stateDir, client, telegramSend });
  assert.equal(attempts, 1); assert.equal(telegram, 2);
});
test('exclusive lock, invalid journal and account mismatch prevent publication', async (t) => {
  const stateDir = temp(t), b = bundle(); let sends = 0;
  const client = { verifyAccount: async () => { throw new Error('wrong account'); }, send: async () => sends++ };
  const opts = { bundle: b, stateDir, client, telegramSend: async () => sends++ };
  writeFileSync(path.join(stateDir, 'run.lock'), 'existing'); await assert.rejects(postDaily(opts), /EEXIST/);
  rmSync(path.join(stateDir, 'run.lock')); await assert.rejects(postDaily(opts), /wrong account/);
  writeFileSync(path.join(stateDir, `${b.summary.day}.json`), '{bad'); await assert.rejects(postDaily(opts));
  assert.equal(sends, 0); assert.equal(existsSync(path.join(stateDir, 'run.lock')), false);
});
test('existing OAuth1 X helper uploads multipart PNG and attaches media ID', async () => {
  const calls = [], credentials = { consumerKey: 'example', consumerSecret: 'example', accessToken: 'example', accessSecret: 'example' };
  const client = xClient(credentials, async (url, opts) => { calls.push([url, opts]); return Response.json(url.includes('media/upload') ? { media_id_string: '1234567890123456789' } : { data: { id: '77' } }); });
  const id = await client.uploadImage(TINY_PNG);
  assert.equal(id, '1234567890123456789'); assert.match(calls[0][1].headers.Authorization, /^OAuth /);
  assert.equal(calls[0][1].body.get('media_category'), 'tweet_image'); assert.equal(calls[0][1].body.get('media').type, 'image/png');
  assert.equal(calls[0][1].headers['Content-Type'], undefined);
  assert.equal((await client.send('hello', [id])).ok, true);
  assert.deepEqual(JSON.parse(calls[1][1].body), { text: 'hello', media: { media_ids: [id] } });
  await assert.rejects(xClient(credentials, async () => Response.json({}, { status: 403 })).uploadImage(TINY_PNG), /upload failed/);
});
test('community token helper and sendPhoto use existing bot with multipart plain caption', async (t) => {
  const file = path.join(temp(t), 'bot.env'); writeFileSync(file, 'COMMUNITY_BOT_TOKEN="example"\n'); assert.equal(token(file), 'example');
  const result = await sendPhoto('example', '@NexuAlphaClub', TINY_PNG, 'caption', async (url, opts) => {
    assert.equal(url, 'https://api.telegram.org/botexample/sendPhoto'); assert.equal(opts.body.get('chat_id'), '@NexuAlphaClub');
    assert.equal(opts.body.get('caption'), 'caption'); assert.equal(opts.body.get('parse_mode'), null);
    assert.equal(opts.body.get('photo').type, 'image/png'); return Response.json({ ok: true, result: { message_id: 22 } });
  });
  assert.deepEqual(result, { ok: true, id: 22 });
  assert.equal((await sendPhoto('example', '@NexuAlphaClub', TINY_PNG, 'caption', async () => Response.json({ ok: false }, { status: 403 }))).ok, false);
});
test('one-sided market (one gainer, five losers) still renders truthfully', () => {
  for (const [up, down] of [[1, 5], [0, 5], [5, 0]]) {
    const f = structuredClone(fixture); f.movers.up = f.movers.up.slice(0, up); f.movers.down = f.movers.down.slice(0, down);
    const d = normalize(f.movers, f.market, now), svg = cardSvg(d);
    assert.equal(d.up.length, up); assert.equal(d.down.length, down);
    assert.ok(svg.includes(up ? `TOP ${up} GAINERS` : 'None in the tracked set'));
    assert.equal(renderCard(d).readUInt32BE(16), 1200);
    for (const locale of ['zh-Hans', 'en']) {
      const text = postText(d, locale, 'x');
      assert.equal(text.split('\n\n')[0].split('\n').length, 4); assert.doesNotMatch(text, /undefined/);
      assert.equal(/Top gainer|领涨/.test(text), up > 0); assert.equal(/Top loser|领跌/.test(text), down > 0);
    }
  }
});
test('zh-Hans card uses Chinese labels with bundled glyphs and goes to @NexuAlphaClub and zh-Hans X', async (t) => {
  const svg = cardSvg(data(), 'zh-Hans');
  for (const label of ['今日异动', '涨幅前 5 · 24H', '跌幅前 5 · 24H', '24 小时已观测爆仓 ≥$133.4M', '最大单笔：BTC 多单 $2.38M', 'BTC 资金费率 / 周期：Binance']) assert.ok(svg.includes(label), label);
  assert.doesNotMatch(svg, /Today's movers|GAINERS|Largest single/);
  const zh = renderCard(data(), 'zh-Hans'); assert.equal(zh.readUInt32BE(16), 1200); assert.ok(!zh.equals(renderCard(data())));
  // Every CJK glyph in the labels must exist in the subset font (no system fonts on the scheduler).
  const { Resvg } = createRequire(new URL('../../pilot-01-prototype/package.json', import.meta.url))('@resvg/resvg-js');
  const L = CARD_LABELS['zh-Hans'], all = [L.title, L.gainers(1), L.gainers(0), L.losers(1), L.losers(0), L.none, L.liquidations(''), L.largest(''), L.noneObserved, L.side.long, L.side.short, L.funding(''), L.unavailable].join('');
  const glyph = (c) => new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><text x="10" y="60" font-size="40" font-family="Noto Sans SC">${c}</text></svg>`, { font: { loadSystemFonts: false, fontFiles: [CJK_FONT] } }).render().asPng();
  const notdef = glyph('\ue000'); assert.ok(glyph('龙').equals(notdef)); // a glyph outside the subset renders as .notdef
  for (const c of new Set([...all].filter((ch) => /[\u3000-\u9fff\uff00-\uffef]/.test(ch)))) assert.ok(!glyph(c).equals(notdef), `missing glyph ${c}`);
  const out = temp(t), b = generate({ ...structuredClone(fixture), now, out });
  assert.ok(existsSync(b.summary.cards['zh-Hans'])); assert.equal(b.png, b.pngs.en);
  const sent = [], client = { verifyAccount: async () => {}, uploadImage: async (png) => { sent.push(['x', png]); return '5'; }, send: async () => ({ ok: true, id: '9' }) };
  await postDaily({ bundle: b, stateDir: temp(t), xLocale: 'zh-Hans', client, telegramSend: async (chat, png) => { sent.push([chat, png]); return { ok: true, id: 1 }; } });
  assert.deepEqual(sent.map(([k, png]) => [k, png === b.pngs['zh-Hans'] ? 'zh-Hans' : png === b.pngs.en ? 'en' : '?']), [['x', 'zh-Hans'], ['@NexuAlphaClub', 'zh-Hans'], ['@NexuAlphaGlobal', 'en']]);
});
test('failed deliveries log HTTP status and API message with secrets redacted', async (t) => {
  const stateDir = temp(t), b = bundle(), tok = '123456789:AAHexampleexampleexampleexampleexample';
  const credentials = { consumerKey: 'ckey-example', consumerSecret: 'csecret-example', accessToken: 'atoken-example', accessSecret: 'asecret-example' };
  const client = xClient(credentials, async (url) => url.includes('/users/me') ? Response.json({ data: { username: 'NexuAlpha' } })
    : Response.json({ errors: [{ message: 'Your app is not permitted to access ckey-example' }] }, { status: 403 }));
  await assert.rejects(client.uploadImage(TINY_PNG), /upload failed: HTTP 403 Your app is not permitted/);
  const telegramSend = (chat, png, caption) => sendPhoto(tok, chat, png, caption, async () => Response.json({ ok: false, description: `Bad Request: chat not found bot${tok}` }, { status: 400 }));
  const err = await postDaily({ bundle: b, stateDir, client, telegramSend, secrets: [tok, ...Object.values(credentials)] }).catch((e) => e);
  assert.match(err.message, /Daily x delivery unconfirmed \(X image upload failed: HTTP 403 Your app is not permitted to access <redacted>\)/);
  const journal = JSON.parse(readFileSync(path.join(stateDir, `${b.summary.day}.json`)));
  assert.equal(journal.x.status, 'unknown'); assert.match(journal.x.error, /HTTP 403/);
  const tgOnly = { ...client, verifyAccount: async () => {} };
  const err2 = await postDaily({ bundle: b, stateDir, client: tgOnly, telegramSend, secrets: [] }).catch((e) => e);
  assert.match(err2.message, /zh-Hans delivery unconfirmed \(send not confirmed: HTTP 400 Bad Request: chat not found bot<redacted>\)/);
  assert.doesNotMatch(readFileSync(path.join(stateDir, `${b.summary.day}.json`), 'utf8'), /AAHexample|ckey-example/);
  const line = failureLine(Object.assign(new Error('fetch failed'), { cause: { code: 'ECONNRESET' } }), [], new Date(0));
  assert.equal(line.split('. ')[0], '1970-01-01T00:00:00.000Z Daily social generation/post failed: fetch failed / cause: ECONNRESET');
  assert.equal(redact('OAuth oauth_signature="abc", oauth_token="xyz" Bearer qq'), 'OAuth oauth_signature="<redacted>", oauth_token="<redacted>" Bearer <redacted>');
});

test('freshness tolerates the collector cadence (<=20 min) and names the stale source and its age', () => {
  assert.equal(MAX_SOURCE_AGE_MS, 20 * 60000);
  const at = (min) => new Date(now - min * 60000).toISOString();
  const f = structuredClone(fixture);
  f.movers.generatedAt = at(19); f.market.generatedAt = at(19); f.market.funding.generatedAt = at(19);
  assert.doesNotThrow(() => normalize(f.movers, f.market, now));
  f.market.generatedAt = at(69);
  assert.throws(() => normalize(f.movers, f.market, now), /stale market: generatedAt .* is stale \(69 min old\)/);
});
test('feed sources default to the public site and accept local-origin overrides', () => {
  assert.deepEqual(feedSources({}), { movers: 'https://nexualpha.com/api/movers.json', market: 'https://nexualpha.com/intel/market-events.json', marketFile: null });
  const local = feedSources({ DAILY_SOCIAL_MOVERS_URL: 'http://127.0.0.1:18361/api/movers.json', DAILY_SOCIAL_MARKET_FILE: '/var/lib/market/market-events.json' });
  assert.equal(local.movers, 'http://127.0.0.1:18361/api/movers.json'); assert.equal(local.marketFile, '/var/lib/market/market-events.json');
  assert.throws(() => feedSources({ DAILY_SOCIAL_MOVERS_URL: 'http://127.0.0.1:18361/other' }));
});
test('CLI reads the market feed from DAILY_SOCIAL_MARKET_FILE instead of the network', async (t) => {
  const dir = temp(t), file = path.join(dir, 'market.json'), stamp = new Date().toISOString();
  const f = structuredClone(fixture); f.market.generatedAt = stamp; f.market.funding.generatedAt = stamp; f.movers.generatedAt = stamp;
  writeFileSync(file, JSON.stringify(f.market));
  const realFetch = globalThis.fetch, urls = [];
  globalThis.fetch = async (url) => { urls.push(String(url)); return new Response(JSON.stringify(f.movers), { status: 200 }); };
  t.after(() => { globalThis.fetch = realFetch; });
  const summary = await main(['--out', dir], { DAILY_SOCIAL_MARKET_FILE: file, DAILY_SOCIAL_MOVERS_URL: 'http://127.0.0.1:18361/api/movers.json', X_TRENDING: 'off' });
  assert.deepEqual(urls.filter((u) => /movers|market-events/.test(u)), ['http://127.0.0.1:18361/api/movers.json']);
  assert.equal(summary.sourceTimes.market, stamp);
});

test('stale web movers fall back to the collector market file with the site builder; stale market does not', async () => {
  const at = Date.parse(fixture.market.generatedAt);
  const coins = { coins: ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'LINK', 'SUI', 'AVAX', 'TAO', 'NEAR'].map((symbol, i) => ({ rank: i + 1, symbol, slug: symbol.toLowerCase(), name: symbol, category: 'layer1', price: 1 })) };
  const market = structuredClone(fixture.market);
  market.market = { majors: [{ symbol: 'BTCUSDT', price: 81000, change24hPct: -1.2 }, { symbol: 'ETHUSDT', price: 2400, change24hPct: 2.1 }, { symbol: 'SOLUSDT', price: 103, change24hPct: -3 }],
    movers: [{ symbol: 'TAOUSDT', change24hPct: 12, quoteVolume24h: 9e7 }, { symbol: 'SUIUSDT', change24hPct: -9, quoteVolume24h: 9e7 }, { symbol: 'NEARUSDT', change24hPct: 5, quoteVolume24h: 9e7 }] };
  const staleWeb = { ...fixture.movers, generatedAt: new Date(at - 24 * 3600000).toISOString(), stale: true };
  const fb = await moversWithFallback({ movers: staleWeb, market, now: at + 1000, readCoins: async () => coins });
  assert.equal(fb.source, 'market-events-fallback');
  assert.equal(Date.parse(fb.movers.generatedAt), Date.parse(market.generatedAt));
  const d = normalize(fb.movers, market, at + 1000);
  assert.equal(d.up[0].sym, 'TAO'); assert.equal(d.down[0].sym, 'SUI');
  const fresh = await moversWithFallback({ movers: fixture.movers, market, now: at + 1000, readCoins: () => assert.fail('not needed') });
  assert.equal(fresh.source, 'web');
  const deadMarket = { ...market, generatedAt: new Date(at - 3600000).toISOString() };
  assert.equal((await moversWithFallback({ movers: staleWeb, market: deadMarket, now: at + 1000, readCoins: async () => coins })).source, 'web');
});
test('X upload guard accepts the real PNG fixture and still refuses non-PNG bytes', async () => {
  assert.equal(TINY_PNG.subarray(0, 8).toString('hex'), '89504e470d0a1a0a'); assert.equal(TINY_PNG.readUInt32BE(16), 1);
  let called = false;
  const client = xClient({ consumerKey: 'k', consumerSecret: 's', accessToken: 't', accessSecret: 'ts' }, async () => { called = true; return Response.json({ media_id_string: '1' }); });
  assert.equal(await client.uploadImage(TINY_PNG), '1'); called = false;
  await assert.rejects(client.uploadImage(Buffer.from('\x00\x00\x00\x18ftypmp42')), /only PNG/); assert.equal(called, false);
});
