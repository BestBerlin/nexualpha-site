import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate, normalize, postText, renderCard, cardSvg, channelFor, sgtDay, postDaily, main } from './generate.mjs';
import { weightedLength, xClient } from '../x-poster/x-poster.mjs';
import { sendPhoto, token } from '../alert-sender/alert-sender.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/daily.json', import.meta.url), 'utf8'));
const now = Date.parse('2026-10-13T01:00:00Z');
const data = () => normalize(fixture.movers, fixture.market, now);
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
    const text = postText(data(), locale, platform), lines = text.split('\n');
    assert.equal(lines.length, 4);
    assert.ok(weightedLength(text) <= 280);
    assert.equal(weightedLength(lines.at(-1)), 23);
    assert.equal(lines.at(-1), `https://nexualpha.com/${locale === 'en' ? 'en' : 'zh-hans'}?src=${platform}-daily`);
    assert.doesNotMatch(lines.slice(0, -1).join('\n'), /\b[a-z0-9-]+\.[a-z]{2,}\b/i);
    assert.doesNotMatch(text, /#|referral|promo code|预测|disclaimer/i);
  }
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
  const summary = await main(['--out', out], {});
  assert.equal(summary.mode, 'dry-run'); assert.equal(summary.sourceTimes.movers, at);
  assert.deepEqual(urls.sort(), ['https://nexualpha.com/api/movers.json', 'https://nexualpha.com/intel/market-events.json']);
});
const bundle = () => ({ summary: { day: data().day }, png: Buffer.from('png fixture'), texts: Object.fromEntries(['en', 'zh-Hans'].flatMap((l) => ['x', 'tg'].map((p) => [`${p}-${l}.txt`, postText(data(), l, p)]))) });
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
  const id = await client.uploadImage(Buffer.from('png'));
  assert.equal(id, '1234567890123456789'); assert.match(calls[0][1].headers.Authorization, /^OAuth /);
  assert.equal(calls[0][1].body.get('media_category'), 'tweet_image'); assert.equal(calls[0][1].body.get('media').type, 'image/png');
  assert.equal(calls[0][1].headers['Content-Type'], undefined);
  assert.equal((await client.send('hello', [id])).ok, true);
  assert.deepEqual(JSON.parse(calls[1][1].body), { text: 'hello', media: { media_ids: [id] } });
  await assert.rejects(xClient(credentials, async () => Response.json({}, { status: 403 })).uploadImage(Buffer.from('png')), /upload failed/);
});
test('community token helper and sendPhoto use existing bot with multipart plain caption', async (t) => {
  const file = path.join(temp(t), 'bot.env'); writeFileSync(file, 'COMMUNITY_BOT_TOKEN="example"\n'); assert.equal(token(file), 'example');
  const result = await sendPhoto('example', '@NexuAlphaClub', Buffer.from('png'), 'caption', async (url, opts) => {
    assert.equal(url, 'https://api.telegram.org/botexample/sendPhoto'); assert.equal(opts.body.get('chat_id'), '@NexuAlphaClub');
    assert.equal(opts.body.get('caption'), 'caption'); assert.equal(opts.body.get('parse_mode'), null);
    assert.equal(opts.body.get('photo').type, 'image/png'); return Response.json({ ok: true, result: { message_id: 22 } });
  });
  assert.deepEqual(result, { ok: true, id: 22 });
  assert.equal((await sendPhoto('example', '@NexuAlphaClub', Buffer.from('png'), 'caption', async () => Response.json({ ok: false }, { status: 403 }))).ok, false);
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
      assert.equal(text.split('\n').length, 4); assert.doesNotMatch(text, /undefined/);
      assert.equal(/Top gainer|领涨/.test(text), up > 0); assert.equal(/Top loser|领跌/.test(text), down > 0);
    }
  }
});
