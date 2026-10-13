import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NEUTRAL_CTA_LOCALE_LIST, buildMessage, isNeutralCtaLocale } from './channel-feed.mjs';
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
  const official = msg.reply_markup.inline_keyboard[0][0].url;
  assert.equal(official, `https://nexualpha.com${siteUpdatePath(item)}`);
  assert.notEqual(official, item.url);
  assert.equal(msg.reply_markup.inline_keyboard[0][1].url, 'https://nexualpha.com/go/okx?src=tg-channel-en');
});


test('channel route mapping works without the site source tree in its runtime bundle', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'channel-standalone-'));
  try {
    const entry = path.join(dir, 'channel-feed.mjs');
    copyFileSync(script, entry);
    writeFileSync(path.join(dir, 'article-feed.mjs'), 'export async function runArticleFeed() {}\n');
    const item = { id:'bybit:https://announcements.bybit.com/en-US/article/test/',venue:'bybit',category:'listing',title:'Listing',publishedAt:new Date().toISOString() };
    const code = `const {buildMessage}=await import(${JSON.stringify(pathToFileURL(entry).href)});console.log(buildMessage(${JSON.stringify(item)},null,'zh').reply_markup.inline_keyboard[0][0].url);`;
    const result = spawnSync(process.execPath, ['--input-type=module','--eval',code], {encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    assert.equal(result.stdout.trim(),`https://nexualpha.com/zh-hans${siteUpdatePath(item)}`);
  } finally { rmSync(dir,{recursive:true,force:true}); }
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

test('neutral locale list matches the site policy (pilot-01-prototype/src/data/locale-policy.js)', async (t) => {
  const policy = new URL('../../pilot-01-prototype/src/data/locale-policy.js', import.meta.url);
  let site;
  try { readFileSync(policy); site = await import(policy.href); } catch (e) { if (e.code === 'ENOENT') return t.skip('site locale-policy.js not in this tree'); throw e; }
  assert.deepEqual([...NEUTRAL_CTA_LOCALE_LIST].sort(), [...site.NEUTRAL_CTA_LOCALE_LIST].sort());
  for (const l of ['ru', 'vi', 'vi-VN', 'zh-Hant', 'zh-TW', 'zh-HK', 'ar', 'ur', 'uk', 'en', 'zh', 'tr', 'id', 'es', 'pt', 'zh-Hans', 'ruby', '']) {
    assert.equal(isNeutralCtaLocale(l), site.isNeutralCtaLocale(l), l);
  }
});
