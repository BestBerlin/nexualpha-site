import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  NEUTRAL_CTA_LOCALE_LIST,
  buildListingGroupMessage,
  buildMessage,
  groupRunItems,
  isNeutralCtaLocale,
  isRiskNotice,
  itemComplete,
  itemSentToChannel,
  markItemChannelSent,
  parseChannelTargets,
  pruneState,
} from './channel-feed.mjs';
import { officialSourceCta, officialSourceRoute } from './official-source.mjs';
import { updatePath as siteUpdatePath } from '../../pilot-01-prototype/src/data/activity-update-path.js';
const script = fileURLToPath(new URL('./channel-feed.mjs', import.meta.url));
const article = slug => ({ slug, publishedAt: new Date().toISOString(), title: {en: slug, 'zh-Hans': '标题'}, summary: {en: 'A summary.', 'zh-Hans': '摘要。'}, availableLocales: ['en', 'zh-Hans'] });
test('CLI integrates articles with existing announcements, persists per channel, and guards overlaps', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'channel-rhythm-test-'));
  try {
    const bootstrap = `import {readFileSync,appendFileSync} from 'node:fs'; globalThis.fetch=async(url)=>{
      let data;
      if(url.includes('news-feed-summary')) data=JSON.parse(readFileSync(process.env.TEST_FEED,'utf8'));
      else if(url.includes('api.telegram.org')) {appendFileSync(process.env.TEST_SENDS,'sent\\n'); data={ok:true,result:{message_id:1}};}
      else if(url.includes('partners.json')) data={partners:[]};
      else data={items:[]};
      return {ok:true,status:200,json:async()=>data};
    };`;
    const feed = path.join(dir,'feed.json'), sends = path.join(dir,'sends.txt');
    writeFileSync(sends,'');
    const run = (...args) => {
      const result = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(bootstrap)}`, script, ...args], {
        encoding:'utf8', env:{...process.env, CHANNEL_FEED_STATE_DIR:dir, CHANNEL_FEED_TARGETS:'en:@en,zh:@zh', COMMUNITY_BOT_TOKEN:'test-only', TEST_FEED:feed, TEST_SENDS:sends},
      });
      assert.equal(result.status,0,result.stderr); return result.stdout;
    };
    writeFileSync(feed,JSON.stringify({articles:[article('baseline')]}));
    run(); assert.equal(readFileSync(sends,'utf8'),'');
    writeFileSync(feed,JSON.stringify({articles:[article('new'),article('baseline')]}));
    run(); assert.equal(readFileSync(sends,'utf8'),'sent\nsent\n');
    run(); assert.equal(readFileSync(sends,'utf8'),'sent\nsent\n');
    const file = path.join(dir,'articles.json');
    const before = readFileSync(file,'utf8');
    run('--dry-run'); assert.equal(readFileSync(file,'utf8'),before);
    mkdirSync(path.join(dir,'channel-feed.lock'));
    assert.match(run(),/already running/);
    assert.equal(readFileSync(sends,'utf8'),'sent\nsent\n');
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('announcement feed buttons send readers to NexuAlpha update pages first', () => {
  const item = {
    id: 'okx:evt-1',
    venue: 'okx',
    category: 'event',
    title: 'OKX Trading Festival',
    url: 'https://www.okx.com/help/okx-trading-festival',
    publishedAt: new Date().toISOString(),
  };
  const msg = buildMessage(item, { slug: 'okx', share: 0.4, autoSettle: true, settle: 'hourly', inviteCode: 'NXA' }, 'en');
  assert.equal(officialSourceCta(item.url, item.venue, { src: 'tg-channel-en' }).domain, 'okx.com');
  const official = msg.reply_markup.inline_keyboard[0][0].url;
  assert.equal(official, `https://nexualpha.com${siteUpdatePath(item)}`);
  assert.notEqual(official, item.url);
  assert.equal(msg.reply_markup.inline_keyboard[0][0].text, 'Read the explainer');
  assert.match(msg.text, /Official source: okx\.com/);
  assert.doesNotMatch(msg.text, /https:\/\/www\.okx\.com\/help\/okx-trading-festival/);
  assert.equal(msg.reply_markup.inline_keyboard[0][1].url, 'https://nexualpha.com/go/okx?src=tg-channel-en');
});

test('channel target parsing drops unsupported languages and malformed entries', () => {
  assert.deepEqual(parseChannelTargets('zh:@NexuAlphaClub, en:@NexuAlphaGlobal,ru:@ru,tr:-100123,vi:@vi'), [
    { lang: 'zh', chat: '@NexuAlphaClub' },
    { lang: 'en', chat: '@NexuAlphaGlobal' },
    { lang: 'ru', chat: '@ru' },
    { lang: 'tr', chat: '-100123' },
    { lang: 'vi', chat: '@vi' },
  ]);
  assert.deepEqual(parseChannelTargets('id:@id,es:@es,xx:@xx,zh:,missing-colon,en:@en:with-colon'), []);
  assert.deepEqual(parseChannelTargets('en:@channel,en:@CHANNEL'), [{ lang: 'en', chat: '@channel' }]);
});

test('sitewide official source buttons use /go/<venue>-page only on main domains', () => {
  const item = {
    id: 'binance:listing-1',
    venue: 'binance',
    category: 'listing',
    title: 'Binance lists ABC',
    url: 'https://www.binance.com/en/support/announcement/binance-lists-abc',
    publishedAt: new Date().toISOString(),
  };
  const msg = buildMessage(item, { slug: 'binance', share: 0.2 }, 'en');
  assert.deepEqual(msg.reply_markup.inline_keyboard[0].map((b) => b.text), ['Read the explainer', 'Official source', 'Join Binance']);
  assert.equal(msg.reply_markup.inline_keyboard[0][1].url, 'https://nexualpha.com/go/binance-page?to=%2Fen%2Fsupport%2Fannouncement%2Fbinance-lists-abc&src=tg-channel-en');

  const subdomain = buildMessage({ ...item, url: 'https://announcements.bybit.com/en-US/article/test/', venue: 'bybit', title: 'Bybit lists ABC' }, { slug: 'bybit', share: 0.2 }, 'en');
  assert.equal(subdomain.reply_markup.inline_keyboard[0].length, 2);
  assert.match(subdomain.text, /Official source: announcements\.bybit\.com/);
  assert.doesNotMatch(subdomain.text, /https:\/\/announcements\.bybit\.com\/en-US\/article\/test\//);
  assert.equal(officialSourceRoute('https://announcements.bybit.com/en-US/article/test/', 'bybit', { src: 'x' }), null);
});


test('channel route mapping works without the site source tree in its runtime bundle', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'channel-standalone-'));
  try {
    const entry = path.join(dir, 'channel-feed.mjs');
    copyFileSync(script, entry);
    writeFileSync(path.join(dir, 'article-feed.mjs'), 'export async function runArticleFeed() {}\n');
    copyFileSync(new URL('./official-source.mjs', import.meta.url), path.join(dir, 'official-source.mjs'));
    copyFileSync(new URL('./notice-classifier.mjs', import.meta.url), path.join(dir, 'notice-classifier.mjs'));
    const item = { id:'bybit:https://announcements.bybit.com/en-US/article/test/',venue:'bybit',category:'listing',title:'Listing',publishedAt:new Date().toISOString() };
    const code = `const {buildMessage}=await import(${JSON.stringify(pathToFileURL(entry).href)});console.log(buildMessage(${JSON.stringify(item)},null,'zh').reply_markup.inline_keyboard[0][0].url);`;
    const result = spawnSync(process.execPath, ['--input-type=module','--eval',code], {encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    assert.equal(result.stdout.trim(),`https://nexualpha.com/zh-hans${siteUpdatePath(item)}`);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('run groups consecutive listings while urgent risks stay immediate and capped fresh items remain pending', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'channel-announcements-test-'));
  try {
    const bootstrap = `import {readFileSync,appendFileSync} from 'node:fs'; globalThis.fetch=async(url,opts={})=>{
      let data;
      if(url.includes('official-announcements')) data=JSON.parse(readFileSync(process.env.TEST_ANN,'utf8'));
      else if(url.includes('news-feed-summary')) data={articles:[]};
      else if(url.includes('partners.json')) data={partners:[{slug:'okx',share:0.4},{slug:'binance',share:0.2},{slug:'bybit',share:0.2}]};
      else if(url.includes('api.telegram.org')) {const body=JSON.parse(opts.body); appendFileSync(process.env.TEST_SENDS, body.chat_id+'\\n'+body.text+'\\n---\\n'); data={ok:true,result:{message_id:1}};}
      else data={items:[]};
      return {ok:true,status:200,json:async()=>data};
    };`;
    const ann = path.join(dir, 'ann.json'), sends = path.join(dir, 'sends.txt'), envFile = path.join(dir, 'bot.env');
    writeFileSync(sends, '');
    writeFileSync(envFile, 'COMMUNITY_BOT_TOKEN=test-only\n');
    const run = () => {
      const result = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(bootstrap)}`, script], {
        encoding: 'utf8',
        env: { ...process.env, CHANNEL_FEED_STATE_DIR: dir, CHANNEL_FEED_ENV: envFile, CHANNEL_FEED_TARGETS: 'en:@en,zh:@zh', COMMUNITY_BOT_TOKEN: 'test-only', TEST_ANN: ann, TEST_SENDS: sends },
      });
      assert.equal(result.status, 0, result.stderr);
      return result.stdout;
    };
    const base = Date.now() - 30 * 60e3;
    const ts = (m) => new Date(base + m * 60e3).toISOString();
    writeFileSync(ann, JSON.stringify({ items: [{ id: 'base', venue: 'okx', category: 'listing', title: 'Baseline', url: 'https://www.okx.com/help/base', publishedAt: ts(0) }] }));
    run();
    const fresh = Array.from({ length: 6 }, (_, i) => ({
      id: `l${i + 1}`,
      venue: i % 2 ? 'binance' : 'okx',
      category: 'listing',
      title: `Listing ${i + 1}`,
      url: i % 2 ? `https://www.binance.com/en/support/announcement/l${i + 1}` : `https://www.okx.com/help/l${i + 1}`,
      publishedAt: ts(i + 1),
    }));
    const risk = { id: 'risk-1', venue: 'binance', category: 'product', title: 'Binance wallet outage maintenance', url: 'https://www.binance.com/en/support/announcement/outage', publishedAt: ts(10) };
    writeFileSync(ann, JSON.stringify({ items: [{ id: 'base', venue: 'okx', category: 'listing', title: 'Baseline', url: 'https://www.okx.com/help/base', publishedAt: ts(0) }, ...fresh, risk] }));
    const out = run();
    const sent = readFileSync(sends, 'utf8');
    assert.equal((sent.match(/^---$/gm) || []).length, 4, 'one grouped listing post and one risk post per channel');
    assert.match(sent, /5 new listing notices/);
    assert.match(sent, /Listing 2/);
    assert.doesNotMatch(sent, /Listing 1/);
    assert.match(sent.split('---')[0], /wallet outage maintenance/, 'urgent risk sends before routine listings');
    assert.match(out, /posted l2,l3,l4,l5,l6/);
    const state = JSON.parse(readFileSync(path.join(dir, 'state.json'), 'utf8'));
    assert.equal(state.posted.l1, undefined, 'fresh capped item remains unseen for a later run');
    assert.notEqual(state.posted['risk-1'], undefined, 'urgent risk bypasses the routine cap');
    assert.equal(itemComplete(state, risk, [{ lang: 'en', chat: '@en' }, { lang: 'zh', chat: '@zh' }]), true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('listing grouping helpers preserve per-item explainer links and cap unique signup buttons', () => {
  const items = [
    { id: 'a', venue: 'okx', category: 'listing', title: 'OKX lists AAA', url: 'https://www.okx.com/help/aaa', publishedAt: '2026-10-13T10:00:00Z' },
    { id: 'b', venue: 'binance', category: 'listing', title: 'Binance lists BBB', url: 'https://www.binance.com/en/support/announcement/bbb', publishedAt: '2026-10-13T10:01:00Z' },
    { id: 'c', venue: 'bybit', category: 'listing', title: 'Bybit lists CCC', url: 'https://www.bybit.com/en/announcement-info/ccc', publishedAt: '2026-10-13T10:02:00Z' },
    { id: 'd', venue: 'kraken', category: 'listing', title: 'Kraken lists DDD', url: 'https://www.kraken.com/listings/ddd', publishedAt: '2026-10-13T10:03:00Z' },
  ];
  assert.deepEqual(groupRunItems(items).map((g) => [g.type, g.items.length]), [['listing', 4]]);
  const msg = buildListingGroupMessage(items, Object.fromEntries(items.map((i) => [i.venue, { slug: i.venue }])), 'en');
  assert.equal(msg.reply_markup.inline_keyboard[0].length, 3);
  assert.match(msg.text, /https:\/\/nexualpha\.com\/activities\/updates\/okx\//);
  assert.match(msg.text, /https:\/\/nexualpha\.com\/activities\/updates\/binance\//);
});

test('CLI retries only failed channels after a partial announcement send', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'channel-partial-test-'));
  try {
    const bootstrap = `import {readFileSync,writeFileSync,existsSync,appendFileSync} from 'node:fs'; globalThis.fetch=async(url,opts={})=>{
      let data;
      if(url.includes('official-announcements')) data=JSON.parse(readFileSync(process.env.TEST_ANN,'utf8'));
      else if(url.includes('news-feed-summary')) data={articles:[]};
      else if(url.includes('partners.json')) data={partners:[{slug:'okx',share:0.4}]};
      else if(url.includes('api.telegram.org')) {
        const body=JSON.parse(opts.body);
        if(body.chat_id==='@zh' && !existsSync(process.env.TEST_FAIL_ONCE)) {writeFileSync(process.env.TEST_FAIL_ONCE,'1'); data={ok:false,error_code:500,description:'planned failure'};}
        else {appendFileSync(process.env.TEST_SENDS, body.chat_id+'\\n'); data={ok:true,result:{message_id:1}};}
      } else data={items:[]};
      return {ok:true,status:200,json:async()=>data};
    };`;
    const ann = path.join(dir, 'ann.json'), sends = path.join(dir, 'sends.txt'), envFile = path.join(dir, 'bot.env'), failOnce = path.join(dir, 'failed-once');
    writeFileSync(sends, '');
    writeFileSync(envFile, 'COMMUNITY_BOT_TOKEN=test-only\n');
    const run = () => spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(bootstrap)}`, script], {
      encoding: 'utf8',
      env: { ...process.env, CHANNEL_FEED_STATE_DIR: dir, CHANNEL_FEED_ENV: envFile, CHANNEL_FEED_TARGETS: 'en:@en,zh:@zh', TEST_ANN: ann, TEST_SENDS: sends, TEST_FAIL_ONCE: failOnce },
    });
    const ts = (m) => new Date(Date.now() - (30 - m) * 60e3).toISOString();
    writeFileSync(ann, JSON.stringify({ items: [{ id: 'base', venue: 'okx', category: 'listing', title: 'Baseline', url: 'https://www.okx.com/help/base', publishedAt: ts(0) }] }));
    assert.equal(run().status, 0);
    writeFileSync(ann, JSON.stringify({ items: [
      { id: 'base', venue: 'okx', category: 'listing', title: 'Baseline', url: 'https://www.okx.com/help/base', publishedAt: ts(0) },
      { id: 'new', venue: 'okx', category: 'listing', title: 'OKX lists RETRY', url: 'https://www.okx.com/help/retry', publishedAt: ts(1) },
    ] }));
    assert.equal(run().status, 1, 'planned zh failure aborts the run');
    let state = JSON.parse(readFileSync(path.join(dir, 'state.json'), 'utf8'));
    assert.equal(itemSentToChannel(state, { id: 'new' }, { lang: 'en', chat: '@en' }), true);
    assert.equal(itemSentToChannel(state, { id: 'new' }, { lang: 'zh', chat: '@zh' }), false);
    assert.equal(itemComplete(state, { id: 'new' }, [{ lang: 'en', chat: '@en' }, { lang: 'zh', chat: '@zh' }]), false);
    assert.equal(run().status, 0);
    state = JSON.parse(readFileSync(path.join(dir, 'state.json'), 'utf8'));
    assert.equal(itemComplete(state, { id: 'new' }, [{ lang: 'en', chat: '@en' }, { lang: 'zh', chat: '@zh' }]), true);
    assert.equal(readFileSync(sends, 'utf8'), '@en\n@zh\n');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('per-channel state records successful channels without marking all-channel completion early', () => {
  const channels = [{ lang: 'en', chat: '@en' }, { lang: 'zh', chat: '@zh' }];
  const item = { id: 'x' };
  const state = { posted: {}, sent: {} };
  markItemChannelSent(state, item, channels[0], 'sent-en', channels);
  assert.equal(itemSentToChannel(state, item, channels[0]), true);
  assert.equal(itemSentToChannel(state, item, channels[1]), false);
  assert.equal(itemComplete(state, item, channels), false);
  assert.equal(state.posted.x, undefined);
  markItemChannelSent(state, item, channels[1], 'sent-zh', channels);
  assert.equal(itemComplete(state, item, channels), true);
  assert.equal(state.posted.x, 'sent-zh');
});

test('state pruning removes matching per-channel send entries with old posted ids', () => {
  const state = { posted: {}, sent: {} };
  for (let i = 0; i < 6; i += 1) {
    state.posted[`id-${i}`] = 'sent';
    state.sent[`id-${i}`] = { 'en:@en': 'sent' };
  }
  pruneState(state, { max: 5, keep: 3 });
  assert.deepEqual(Object.keys(state.posted), ['id-3', 'id-4', 'id-5']);
  assert.deepEqual(Object.keys(state.sent), ['id-3', 'id-4', 'id-5']);
});


test('neutral Russian announcements omit partner codes, rebates and signup routes', () => {
  const item = {id:'okx:neutral',venue:'okx',category:'listing',title:'Listing',publishedAt:new Date().toISOString()};
  const msg = buildMessage(item,{slug:'okx',share:0.4,inviteCode:'NXA'},'ru');
  assert.doesNotMatch(msg.text,/NXA|40%/);
  assert.equal(msg.reply_markup.inline_keyboard[0].length,1);
  assert.equal(msg.reply_markup.inline_keyboard[0][0].url,`https://nexualpha.com/ru${siteUpdatePath(item)}`);
});

test("post times are Singapore time labelled SGT in every channel language", async () => {
  const { buildMessage } = await import("./channel-feed.mjs");
  const item = { title: "X", publishedAt: "2026-10-13T02:00:00Z", venue: "okx", category: "listing", url: "https://www.okx.com/x" };
  for (const lang of ["zh", "en", "ru", "tr", "vi"]) {
    const line = buildMessage(item, { slug: "okx", name: "OKX" }, lang).text.split("\n")[1];
    assert.match(line, /SGT/, lang);
    assert.match(line, /10:00/, `${lang} 02:00 UTC is 10:00 SGT`);
    assert.doesNotMatch(line, /UTC|北京时间/, lang);
  }
});

// Owner 2026-10-13: vi is information-only like ru (Vietnam Resolution 05/2025/NQ-CP).
const PARTNERS_JSON = new URL('../../pilot-01-prototype/public/intel/partners.json', import.meta.url);
const CODES = ['nexu888', '11350287', '7f97gkqw', 'DPRWSXAS', '48553', 'NXA'];
try { for (const p of JSON.parse(readFileSync(PARTNERS_JSON, 'utf8')).partners || []) if (p.inviteCode) CODES.push(p.inviteCode); } catch {}
const CODE_RE = new RegExp(CODES.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
const VI_SIGNUP = /đăng ký|mã mời|giới thiệu|hoàn tới|hoàn phí|sign ?up|register|referral/i;

test('neutral vi (and ru) listings: no sign-up route, no /go/, no code, no rebate wording', () => {
  const partner = { slug: 'okx', name: 'OKX', share: 0.4, autoSettle: true, settle: 'hourly', inviteCode: 'nexu888' };
  for (const lang of ['vi', 'ru']) {
    const item = { id: `okx:l-${lang}`, venue: 'okx', category: 'listing', title: 'OKX will list ABC', publishedAt: new Date().toISOString() };
    const msg = buildMessage(item, partner, lang);
    const all = JSON.stringify(msg);
    assert.doesNotMatch(all, /\/go\//, lang);
    assert.doesNotMatch(all, CODE_RE, lang);
    assert.doesNotMatch(all, /40%/, lang);
    if (lang === 'vi') assert.doesNotMatch(all, VI_SIGNUP);
    assert.equal(msg.reply_markup.inline_keyboard[0].length, 1, `${lang}: official notice only`);
    assert.equal(msg.reply_markup.inline_keyboard[0][0].text, lang === 'vi' ? 'Đọc phần giải thích' : 'Прочитать разбор');
    assert.equal(msg.reply_markup.inline_keyboard[0][0].url, `https://nexualpha.com/${lang}${siteUpdatePath(item)}`);
  }
});

test('neutral locales get no campaign posts; other channels still do', () => {
  const item = { id: 'kraken:evt', venue: 'kraken', category: 'event', title: 'Kraken trading campaign', publishedAt: new Date().toISOString() };
  const partner = { slug: 'kraken', name: 'Kraken', inviteCode: '7f97gkqw' };
  for (const lang of ['vi', 'ru', 'vi-VN', 'zh-Hant', 'ar']) assert.equal(buildMessage(item, partner, lang), null, lang);
  for (const lang of ['zh', 'en', 'tr']) assert.ok(buildMessage(item, partner, lang), lang);
  // campaigns filed as news/listing are recognised by their title
  for (const title of ['The $5,000,000 USDG Kraken Futures Challenge: one leaderboard', '[Exclusive Launch] Full Stocks Ahead: Share 150,000 USDC', 'Incentiv (CENT) Listing Campaign — 17,241,380 CENT to Giveaway', 'Binance Will List RWUSD and Introduce RWUSD Zero Trading Fee Promotion']) {
    const news = { id: `x:${title}`, venue: 'kraken', category: 'news', title, publishedAt: new Date().toISOString() };
    assert.equal(buildMessage(news, partner, 'vi'), null, title);
    assert.ok(buildMessage(news, partner, 'en'), `en keeps: ${title}`);
  }
  for (const title of ['OKX to list WUSD, BLURUSD X-Perps', 'Notice on the Closure of Binance Pool Services', 'KuCoin Will Delist VENOM and NFP on 2026-10-14']) {
    assert.ok(buildMessage({ id: `x:${title}`, venue: 'okx', category: 'listing', title, publishedAt: new Date().toISOString() }, partner, 'vi'), `vi keeps: ${title}`);
  }
});

test('Turkish channel suppresses Bitget notices completely', () => {
  const item = { id: 'bitget:tr', venue: 'bitget', category: 'news', title: 'Bitget support update', publishedAt: new Date().toISOString(), url: 'https://www.bitget.com/support/articles/123' };
  assert.equal(buildMessage(item, { slug: 'bitget', inviteCode: 'nexu888' }, 'tr'), null);
  assert.equal(buildListingGroupMessage([{ ...item, category: 'listing' }], { bitget: { slug: 'bitget' } }, 'tr'), null);
});

test('risk notices use one risk action plus official source and no signup buttons', () => {
  const partner = { slug: 'bitget', name: 'Bitget', share: 0.6, autoSettle: true, settle: 'daily', inviteCode: 'NXA' };
  const cases = [
    { id: 'a:liq', venue: 'okx', category: 'news', title: 'Liquidation spike on BTC perpetuals', publishedAt: new Date().toISOString(), url: 'https://www.okx.com/help/liquidation' },
    { id: 'a:delist', venue: 'kucoin', category: 'delisting', title: 'KuCoin will delist ABC', publishedAt: new Date().toISOString(), url: 'https://www.kucoin.com/news/delist-abc' },
    { id: 'a:margin', venue: 'bitget', category: 'news', title: 'Bitget suspends BTW margin trading', publishedAt: new Date().toISOString(), url: 'https://www.bitget.com/support/margin-btw' },
    { id: 'a:borrow', venue: 'bitget', category: 'product', title: 'Bitget borrow function suspended for BTW', publishedAt: new Date().toISOString(), url: 'https://www.bitget.com/support/borrow-btw' },
    { id: 'a:outage', venue: 'binance', category: 'product', title: 'Binance announces wallet outage maintenance', publishedAt: new Date().toISOString(), url: 'https://www.binance.com/en/support/announcement/outage' },
    { id: 'a:zh-margin', venue: 'bitget', category: 'news', title: 'Bitget 停用 BTW 保证金交易', publishedAt: new Date().toISOString(), url: 'https://www.bitget.com/support/margin-btw' },
    { id: 'a:zh-borrow', venue: 'bitget', category: 'product', title: 'Bitget 暂停 BTW 借贷功能', publishedAt: new Date().toISOString(), url: 'https://www.bitget.com/support/borrow-btw' },
    { id: 'a:zh-outage', venue: 'binance', category: 'product', title: 'Binance 钱包服务中断维护', publishedAt: new Date().toISOString(), url: 'https://www.binance.com/en/support/announcement/outage' },
  ];
  for (const item of cases) {
    assert.equal(isRiskNotice(item), true, item.id);
    const msg = buildMessage(item, partner, 'en');
    const all = JSON.stringify(msg);
    assert.doesNotMatch(all, /\/go\/(?![a-z0-9-]+-page\?)|Sign up|Compare fees|code NXA|60% back/, item.id);
    assert.equal(msg.reply_markup.inline_keyboard[0][0].text, 'Risk explainer', item.id);
    assert.equal(msg.reply_markup.inline_keyboard[0][0].url, `https://nexualpha.com${siteUpdatePath(item)}`, item.id);
    assert.equal(msg.reply_markup.inline_keyboard.length, 1, item.id);
    assert.ok(
      msg.reply_markup.inline_keyboard[0].some((b) => b.text === 'Official source' && /nexualpha\.com\/go\/(?:okx|binance)-page\?/.test(b.url)) || msg.text.includes('Official source:'),
      item.id,
    );
  }
});

test('non-risk commercial notices keep at most one row of signup actions', () => {
  const item = { id: 'okx:campaign', venue: 'okx', category: 'event', title: 'OKX trading campaign', publishedAt: new Date().toISOString(), url: 'https://www.okx.com/help/campaign' };
  const msg = buildMessage(item, { slug: 'okx', name: 'OKX', share: 0.4, autoSettle: true, settle: 'hourly', inviteCode: 'NXA' }, 'en');
  const signupUrls = msg.reply_markup.inline_keyboard.flat().map((b) => b.url).filter((u) => u.includes('/go/'));
  assert.deepEqual(signupUrls, ['https://nexualpha.com/go/okx?src=tg-channel-en']);
  assert.equal(msg.reply_markup.inline_keyboard[0].length, 2);
});

test('neutral locale list matches the site policy (pilot-01-prototype/src/data/locale-policy.js)', async (t) => {
  const policy = new URL('../../pilot-01-prototype/src/data/locale-policy.js', import.meta.url);
  let site;
  try { readFileSync(policy); site = await import(policy.href); } catch (e) { if (e.code === 'ENOENT') return t.skip('site locale-policy.js not in this tree'); throw e; }
  assert.deepEqual([...NEUTRAL_CTA_LOCALE_LIST].sort(), [...site.NEUTRAL_CTA_LOCALE_LIST].sort());
  for (const l of ['ru', 'vi', 'vi-VN', 'zh-Hant', 'zh-TW', 'zh-HK', 'ar', 'ur', 'uk', 'en', 'zh', 'tr', 'id', 'es', 'pt', 'zh-Hans', 'ruby', '']) {
    assert.equal(isNeutralCtaLocale(l), site.isNeutralCtaLocale(l), l);
  }
});

test('risk inflections cannot retain commercial actions or join routine listing batches', async () => {
  const { isRiskNotice } = await import('./channel-feed.mjs');
  for (const title of ['Suspension of withdrawals', 'Suspending deposits', 'Upcoming delistings', 'Service outages']) {
    const item = { id: title, venue: 'okx', category: 'listing', title, publishedAt: '2026-10-13T10:00:00Z' };
    assert.equal(isRiskNotice(item), true, title);
    const message = buildMessage(item, { slug: 'okx', inviteCode: 'NXA' }, 'en');
    assert.equal(message.reply_markup.inline_keyboard.flat().length, 1, title);
    assert.doesNotMatch(JSON.stringify(message), /Sign up|\/go\/okx\?|NXA/, title);
  }
});

test('grouped channel notices fit the text budget even with long original sources', async () => {
  const { buildListingGroupMessage } = await import('./channel-feed.mjs');
  const items = Array.from({ length: 5 }, (_, i) => ({ id: `long-${i}`, venue: 'okx', category: 'listing', title: '&'.repeat(180), publishedAt: '2026-10-13T10:00:00Z', url: `https://www.okx.com/help/${i}?detail=${'x'.repeat(4000)}` }));
  const message = buildListingGroupMessage(items, { okx: { slug: 'okx' } }, 'en');
  assert.ok(message.text.length <= 3900);
  assert.match(message.text, /5 new listing notices/);
  assert.equal(message.reply_markup.inline_keyboard.at(-1)[0].text, 'Listing');
  assert.equal(message.reply_markup.inline_keyboard.at(-1)[0].url, 'https://nexualpha.com/activities');
});

// Owner rules 2026-10-14: button labels <= 20 chars in every channel language; tr never shows Bitget; neutral
// channels carry no /go/ sign-up route; no "not financial advice" or commission wording.
test('channel buttons fit 20 characters and follow the tr / neutral rules', () => {
  const now = new Date().toISOString();
  const partner = (slug, name) => ({ slug, name, share: 0.6, autoSettle: true, settle: 'daily', inviteCode: 'nexu888' });
  const items = [
    { id: 'l1', venue: 'hyperliquid', category: 'listing', title: 'Hyperliquid lists ABC', publishedAt: now, url: 'https://hyperliquid.gitbook.io/x' },
    { id: 'l2', venue: 'binance', category: 'listing', title: 'Binance will list XYZ', publishedAt: now, url: 'https://www.binance.com/en/support/announcement/x' },
    { id: 'l3', venue: 'okx', category: 'listing', title: 'OKX to list QQQ', publishedAt: now, url: 'https://www.okx.com/help/x' },
    { id: 'e1', venue: 'bitget', category: 'event', title: 'Bitget futures challenge', publishedAt: now, url: 'https://www.bitget.com/support/x' },
    { id: 'r1', venue: 'okx', category: 'delisting', title: 'OKX will delist ABC', publishedAt: now, url: 'https://www.okx.com/help/y' },
  ];
  const partners = { hyperliquid: partner('hyperliquid', 'Hyperliquid'), binance: partner('binance', 'Binance'), okx: partner('okx', 'OKX'), bitget: partner('bitget', 'Bitget') };
  for (const lang of ['zh', 'en', 'ru', 'tr', 'vi']) {
    const msgs = [...items.map((i) => buildMessage(i, partners[i.venue], lang)), buildListingGroupMessage(items.slice(0, 3), partners, lang)].filter(Boolean);
    for (const msg of msgs) {
      for (const b of msg.reply_markup.inline_keyboard.flat()) assert.ok(b.text.length <= 20, `${lang}: "${b.text}" is ${b.text.length} chars`);
      const all = JSON.stringify(msg);
      if (lang === 'tr') assert.doesNotMatch(all, /bitget/i, 'tr shows no Bitget');
      if (lang === 'ru' || lang === 'vi') assert.doesNotMatch(all, /\/go\/(?![a-z0-9-]+-page\?)/, `${lang} has no sign-up route`);
      assert.doesNotMatch(all, /not (financial|investment) advice|不构成投资建议|返佣|commission we/i, `${lang} has no fine print`);
      if (/🕒/.test(msg.text)) assert.match(msg.text, /SGT/, `${lang} time labelled SGT`);
    }
  }
});
