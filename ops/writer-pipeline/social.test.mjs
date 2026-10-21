import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkSocialDraft, ourLink, tagsIn } from './social-rules.mjs';
import { buildBrief, finishX, finishTelegram, finishYoutube, main, promptFor } from './social-batch.mjs';
import { postDraft, review, loadXCredentials } from './social-post.mjs';
import { socialSections } from './social-queue.mjs';

const partners = [{ slug: 'bitget', name: 'Bitget', inviteCode: 'nexu888' }, { slug: 'binance', name: 'Binance', inviteCode: '11350287' }];
const x = (text, locale = 'en') => ({ channel: 'x', locale, text });
const tg = (text, locale = 'en') => ({ channel: 'telegram', locale, text: `${text}\n\n#Bitcoin #Crypto` }); // tag line as finishTelegram writes it
const NOW = Date.parse('2026-10-18T12:00:00Z');

test('clean X and Telegram drafts pass', () => {
  assert.deepEqual(checkSocialDraft(x('Tesla tokenized stock $TSLA volume doubled to $40M today.\nhttps://nexualpha.com/tokenized-stocks/tsla?src=x-social\n\n#TokenizedStocks #crypto'), { partners }), []);
  assert.deepEqual(checkSocialDraft(tg('<b>BTC whale adds $12M long</b>\nObserved on Hyperliquid.\n\n<a href="https://nexualpha.com/vi/whales?src=tg-social-vi">Xem thêm</a>', 'vi'), { partners }), []);
});

test('fine print, earnings, predictions and owner identity are rejected', () => {
  const errs = (t) => checkSocialDraft(x(`${t} #crypto #BTC`), { partners });
  assert.match(errs('BTC up 5%. Not financial advice.').join(), /fine print/);
  assert.match(errs('BTC up 5%. DYOR').join(), /fine print/);
  assert.match(errs('Sign up and we earn a commission').join(), /earn/);
  assert.match(errs('Your inviter gets 20% too').join(), /earn/);
  assert.match(errs('邀请人也获得返佣').join(), /earn/);
  assert.deepEqual(errs('The Securities and Exchange Commission approved it'), []);
  assert.match(errs('BTC will rise to 100k').join(), /prediction/);
  assert.match(errs('By BestBerlin').join(), /anonymity/);
  assert.match(errs('柏萬億 says hi').join(), /anonymity/);
});

test('links must be our pages, never exchanges or /go', () => {
  assert.equal(ourLink('https://nexualpha.com/news/x?src=x'), true);
  assert.equal(ourLink('https://nexualpha.com/go/bitget?src=x'), false);
  assert.equal(ourLink('https://nexualpha.com/es/go/okx'), false);
  assert.equal(ourLink('https://nexualpha.com/news/x?ref=abc'), false);
  assert.match(checkSocialDraft(x('Join https://www.bitget.com/register #crypto #BTC'), { partners }).join(), /not to our page/);
  assert.match(checkSocialDraft(x('Trade on Gate.io now #crypto #BTC'), { partners }).join(), /not to our page/);
  assert.match(checkSocialDraft(tg('<a href="https://nexualpha.com/go/okx">go</a>'), { partners }).join(), /our page/);
});

test('neutral locales carry no code/CTA; tr has no Bitget; codes must exist', () => {
  for (const locale of ['ru', 'vi', 'ar', 'zh-Hant', 'ur', 'uk']) {
    assert.match(checkSocialDraft(tg('<b>BTC</b> sign up now', locale), { partners }).join(), /neutral/, locale);
    assert.match(checkSocialDraft(tg('<b>BTC</b> nexu888', locale), { partners }).join(), /partner code/, locale);
  }
  assert.match(checkSocialDraft(tg('<b>Bitcoin</b> регистрация', 'ru'), { partners }).join(), /neutral/);
  assert.match(checkSocialDraft(tg('<b>Bitcoin</b> mã giới thiệu ABC123', 'vi'), { partners }).join(), /code/);
  assert.deepEqual(checkSocialDraft(tg('<b>Bitget</b> invite code nexu888', 'en'), { partners }), []);
  assert.match(checkSocialDraft(tg('<b>Bitget</b> invite code ZZZ999', 'en'), { partners }).join(), /unknown partner code/);
  assert.match(checkSocialDraft(tg('<b>Bitget listing</b>', 'tr'), { partners }).join(), /tr: Bitget/);
  assert.deepEqual(checkSocialDraft(tg('<b>OKX listing</b> referans kodu nexu888', 'tr'), { partners }), []);
});

test('channel shape rules: X 280 + 2-4 tags, Telegram HTML subset, YouTube cartoon script', () => {
  assert.match(checkSocialDraft(x('BTC up #crypto'), {}).join(), /1 tags/);
  assert.match(checkSocialDraft(x(`${'a'.repeat(290)} #crypto #BTC`), {}).join(), /> 280/);
  assert.match(checkSocialDraft(x('a #a #b #c #d #e'), {}).join(), /5 tags/);
  assert.match(checkSocialDraft(tg('<script>x</script>'), {}).join(), /not allowed/);
  assert.match(checkSocialDraft({ channel: 'telegram', locale: 'en', text: '<b>BTC</b> no tag line' }, {}).join(), /0 tags on the last line/);
  assert.match(checkSocialDraft(x('$BTC and $ETH up #crypto #BTC'), {}).join(), /one cashtag/);
  const yt = { channel: 'youtube', locale: 'en', title: 'Tesla on-chain', scenes: [1, 2, 3].map(() => ({ visual: 'cartoon mascot points at a chart', narration: 'Tesla tokens traded more today.' })) };
  assert.deepEqual(checkSocialDraft(yt, {}), []);
  const desc = 'Tesla tokens explained.\nFull course: https://nexualpha.com/academy?src=yt-en\nTelegram: https://t.me/NexuAlphaGlobal\n\n#Shorts #Crypto #NexuAlpha';
  assert.deepEqual(checkSocialDraft({ ...yt, description: desc, link: 'https://nexualpha.com/academy?src=yt-en' }, {}), []);
  assert.match(checkSocialDraft({ ...yt, description: desc.replace('/academy?src=yt-en', '/news/tesla?src=yt-en') }, {}).join(), /not academy/);
  assert.match(checkSocialDraft({ ...yt, description: desc.replace(' #NexuAlpha', '') }, {}).join(), /three hashtags/);
  assert.match(checkSocialDraft({ ...yt, link: 'https://nexualpha.com/news/tesla' }, {}).join(), /academy page/);
  assert.match(checkSocialDraft({ ...yt, scenes: yt.scenes.map((s) => ({ ...s, visual: 'stock footage' })) }, {}).join(), /cartoon/);
  assert.match(checkSocialDraft({ ...yt, scenes: yt.scenes.slice(0, 2) }, {}).join(), /3-8 scenes/);
  assert.match(checkSocialDraft({ ...yt, locale: 'ru', cta: 'Register on OKX' }, {}).join(), /neutral/);
});

const events = [
  { id: 1, title_internal: 'Bitcoin ETF outflows hit $300M', event_type: 'flows', story_asset: 'BTC', source_published_at: '2026-10-18T10:00:00Z', score: { editorial_score: 80 }, evidence: [{ excerpt: 'Outflows were $300M.' }] },
  { id: 2, title_internal: 'Tesla tokenized stock TSLA volume doubles on Bybit', event_type: 'price_move', story_asset: 'TSLA', source_published_at: '2026-10-18T09:00:00Z', score: { editorial_score: 40 } },
  { id: 3, title_internal: 'Old event', source_published_at: '2026-10-10T09:00:00Z' },
];
const feed = { articles: [{ slug: 'nvda-tokenized-stock-guide', status: 'PUBLISHED', publishedAt: '2026-10-18T08:00:00Z', title: { en: 'NVDA tokenized stock: what changed' }, summary: { en: 'Short.' }, availableLocales: ['en', 'es'] }] };
const whales = { rows: [{ id: 'w1', coin: 'ETH', side: 'long', totalUsd: 5e6, time: '2026-10-18T11:00:00Z', period: '24h', explanation: '0xab…cd added ETH longs, net $5,000,000.' },
  { id: 'w2', coin: 'DOGE', totalUsd: 1000, time: '2026-10-18T11:00:00Z', period: '24h', explanation: 'small' },
  { id: 'w3', coin: 'SOL', side: 'long', totalUsd: 9e6, time: '2026-10-18T11:00:00Z' }] }; // w3: bare snapshot (no period/explanation) is not offered

test('brief puts tokenized-stock topics first and drops stale/small items', () => {
  const b = buildBrief({ events, whales, feed, now: NOW });
  assert.equal(b.events[0].ref, 'event:2');
  assert.equal(b.events.length, 2);
  assert.deepEqual(b.whales.map((w) => w.coin), ['ETH']);
  assert.equal(b.tokenizedFirst, true);
  const p = promptFor('x', b, ['en', 'tr']);
  assert.match(p, /https:\/\/nexualpha\.com\/tr\/tokenized-stocks\/tsla\?src=x-social/);
  assert.match(p, /https:\/\/nexualpha\.com\/news\/nvda-tokenized-stock-guide/); // tr has no edition -> en article (X only)
  assert.doesNotMatch(promptFor('telegram', b, ['vi']), /vi\/activities/);
  const linksOf = (prompt) => JSON.parse(prompt.match(/LINKS: (\{.*\})\nDATA:/)[1]);
  assert.ok(!linksOf(promptFor('telegram', b, ['tr'])).tr.some((u) => u.includes('nvda-tokenized-stock-guide'))); // Telegram: never the English article in a tr channel
  assert.ok(linksOf(promptFor('telegram', b, ['es'])).es.includes('https://nexualpha.com/es/news/nvda-tokenized-stock-guide?src=tg-social-es'));
  assert.equal(b.events[0].atSgt, '18 Oct 17:00 SGT'); assert.equal(b.events[0].officialSource, null); // media-only
  // Stale (>18 h) and already-posted topics are not offered; posted refs are recorded on the brief.
  const old = buildBrief({ events, whales, feed, now: NOW + 17 * 3600000 });
  assert.deepEqual(old.events.map((e) => e.ref), []); // 18-19 h old now
  const b2 = buildBrief({ events, whales, feed, now: NOW, posted: ['event:2', 'article:nvda-tokenized-stock-guide'] });
  assert.deepEqual(b2.events.map((e) => e.ref), ['event:1']); assert.equal(b2.articles.length, 0);
});

test('finishX adds 2-4 tags incl. stock cashtag and hot keyword, strips writer tags, keeps link', () => {
  const tagging = { keywords: [{ key: 'TokenizedStocks', score: 50 }, { key: 'BTC', score: 10 }], extraTickers: [] };
  const out = finishX({ locale: 'en', text: 'Tesla tokenized stock: TSLA volume doubled to $40M on Bybit. #spam', link: 'https://nexualpha.com/tokenized-stocks/tsla?src=x-social' }, tagging, NOW);
  const tags = tagsIn(out.text);
  assert.ok(tags.length >= 2 && tags.length <= 4, out.text);
  assert.ok(tags.includes('$TSLA') && tags.includes('#TokenizedStocks'), out.text);
  assert.doesNotMatch(out.text, /#spam/);
  assert.match(out.text, /\nhttps:\/\/nexualpha\.com\/tokenized-stocks\/tsla\?src=x-social/);
  const dup = finishX({ locale: 'en', text: 'Chip perps crashed.\nhttps://nexualpha.com/news/a?src=x-social', link: 'https://nexualpha.com/news/a?src=x-social' }, tagging, NOW);
  assert.equal(dup.text.split('https://nexualpha.com/news/a').length - 1, 1, dup.text);
  assert.deepEqual(checkSocialDraft({ channel: 'x', locale: 'en', ...out }, { partners }), []);
  const bad = finishX({ locale: 'en', text: 'x', link: 'https://bitget.com' }, tagging, NOW);
  assert.equal(bad.link, null);
  const ru = finishTelegram({ locale: 'ru', text: '<b>BTC</b> #spam', link: 'https://nexualpha.com/ru/whales' }, tagging, NOW);
  assert.match(ru.text, /Подробнее/); assert.doesNotMatch(ru.text, /#spam/);
  assert.deepEqual(checkSocialDraft({ channel: 'telegram', locale: 'ru', ...ru }, { partners }), []);
  const yt = finishYoutube({ locale: 'es', title: 'Tesla', hook: 'x', description: 'Dos líneas.\nhttps://bitget.com #spam', scenes: [{ visual: 'cartoon mascot', narration: 'Tesla tokens doubled.' }] }, tagging, NOW);
  assert.equal(yt.link, 'https://nexualpha.com/es/academy?src=yt-es');
  assert.match(yt.description, /^Dos líneas\.\nFull course: https:\/\/nexualpha\.com\/es\/academy\?src=yt-es\nTelegram: https:\/\/t\.me\/NexuAlphaGlobal\n\n#\S+ #\S+ #\S+$/);
  assert.doesNotMatch(yt.description, /bitget|#spam/);
});

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'social-'));
  const eventsFile = path.join(root, 'events.json');
  await writeFile(eventsFile, JSON.stringify({ events }));
  const generate = async (prompt) => {
    if (/YouTube Shorts SCRIPT/.test(prompt)) return { provider: 'agy-flash', writerInfo: { responseModel: 'gemini-3.8-flash-tiered' }, attempts: [], payload: { scripts: [
      { locale: 'en', topicRef: 'event:2', title: 'Tesla stock on crypto rails', hook: 'Tesla, but on-chain?', scenes: [1, 2, 3, 4].map((i) => ({ visual: `cartoon Bitcoin mascot scene ${i}`, narration: 'Tesla tokens doubled their volume today.', onScreen: 'TSLA' })), cta: 'Follow for more', link: 'https://nexualpha.com/tokenized-stocks/tsla?src=yt-en' },
      { locale: 'ru', topicRef: 'event:2', title: 'Tesla', hook: 'x', scenes: [1, 2, 3].map(() => ({ visual: 'cartoon mascot', narration: 'Зарегистрируйтесь с бонусом' })), cta: 'регистрация' }] } };
    if (/Telegram channel post/.test(prompt)) return { provider: 'codex', writerInfo: {}, attempts: [{ provider: 'agy-flash', result: 'failed' }], payload: { posts: [
      { locale: 'en', topicRef: 'event:1', text: '<b>ETF outflows $300M</b>\nBiggest in a week.', link: 'https://nexualpha.com/news?src=tg-social-en' },
      { locale: 'vi', topicRef: 'event:1', text: '<b>ETF</b> đăng ký ngay mã giới thiệu nexu888', link: null }] } };
    return { provider: 'agy-flash', writerInfo: { responseModel: 'gemini-3.8-flash-tiered' }, attempts: [], payload: { posts: [
      { locale: 'en', topicRef: 'event:2', text: 'Tesla tokenized stock TSLA volume doubled today.', link: null },
      { locale: 'en', topicRef: 'event:1', text: 'BTC ETF outflows hit $300M. Not financial advice.', link: null },
      { locale: 'de', text: 'ignored locale' }] } };
  };
  return { root, cfg: { root, engine: path.join(root, 'engine'), events: eventsFile, now: NOW, generate, tagging: { keywords: [{ key: 'BTC', score: 10 }] },
    fetchJson: async (u) => (/news-feed/.test(u) ? feed : /whales/.test(u) ? whales : /partners/.test(u) ? { partners } : {}) } };
}

test('batch writes needs_review drafts, separates invalid ones, and rebuilds the per-channel queue', async () => {
  const { root, cfg } = await fixture();
  try {
    const r = await main(cfg);
    assert.equal(r.status, 'needs_review');
    assert.deepEqual(r.byChannel, { x: 1, telegram: 1, youtube: 1 });
    const data = JSON.parse(await readFile(path.join(r.dir, 'drafts.json'), 'utf8'));
    assert.equal(data.invalid.length, 3); // prediction/fine print X, neutral vi Telegram, neutral ru script
    assert.ok(data.drafts.every((d) => d.status === 'needs_review'));
    assert.equal(data.drafts.find((d) => d.channel === 'telegram').chat, '@NexuAlphaGlobal');
    const queue = await readFile(path.join(root, 'REVIEW-QUEUE.md'), 'utf8');
    assert.match(queue, /## X drafts \(@NexuAlpha\)\n\n- \[ \] .*-x-en-1 — en — needs_review/);
    assert.match(queue, /## Telegram channel drafts\n\n- \[ \] .*@NexuAlphaGlobal/);
    assert.match(queue, /## YouTube Shorts scripts/);
  } finally { await rm(root, { recursive: true }); }
});

test('review: approve re-validates, post is a dry run by default, live post journals and caps', async () => {
  const { root, cfg } = await fixture();
  try {
    const r = await main(cfg);
    const data = JSON.parse(await readFile(path.join(r.dir, 'drafts.json'), 'utf8'));
    const xd = data.drafts.find((d) => d.channel === 'x'), td = data.drafts.find((d) => d.channel === 'telegram'), yd = data.drafts.find((d) => d.channel === 'youtube');
    const opts = { root, engine: cfg.engine, now: NOW + 3600000, log: () => {} };
    await assert.rejects(postDraft(xd.id, opts), /approve it first/);
    await assert.rejects(review('approve', xd.id, { ...opts, text: 'Edited. We earn a commission. #crypto #BTC' }), /earn/);
    await review('approve', xd.id, opts);
    let sends = 0;
    const dry = await postDraft(xd.id, { ...opts, sendX: async () => { sends++; return { ok: true, id: '1' }; } });
    assert.equal(dry.dryRun, true); assert.equal(sends, 0);
    const done = await postDraft(xd.id, { ...opts, live: true, sendX: async (t) => { sends++; assert.equal(t, xd.text); return { ok: true, id: '99' }; } });
    assert.equal(done.status, 'posted'); assert.equal(sends, 1);
    await assert.rejects(postDraft(xd.id, { ...opts, live: true, sendX: async () => ({ ok: true }) }), /posted; approve/);
    await review('approve', td.id, opts);
    const t = await postDraft(td.id, { ...opts, live: true, sendTelegram: async (chat) => { assert.equal(chat, '@NexuAlphaGlobal'); return { ok: false, ambiguous: true }; } });
    assert.equal(t.status, 'post_unknown');
    await assert.rejects(postDraft(td.id, { ...opts, live: true }), /post_unknown/);
    await assert.rejects(postDraft(yd.id, opts), /never posted/);
    await review('approve', yd.id, opts);
    await review('handoff', yd.id, opts);
    assert.ok(JSON.parse(await readFile(path.join(root, 'social/youtube-approved', `${yd.id}.json`), 'utf8')).scenes.length >= 3);
    await assert.rejects(review('reject', xd.id, opts), /reason/);
    assert.doesNotMatch(await socialSections(root, NOW), new RegExp(xd.id));
  } finally { await rm(root, { recursive: true }); }
});

test('stale drafts and caps block posting', async () => {
  const { root, cfg } = await fixture();
  try {
    const r = await main(cfg);
    const xd = JSON.parse(await readFile(path.join(r.dir, 'drafts.json'), 'utf8')).drafts.find((d) => d.channel === 'x');
    await review('approve', xd.id, { root, engine: cfg.engine, now: NOW });
    await assert.rejects(postDraft(xd.id, { root, now: NOW + 20 * 3600000, log: () => {} }), /stale/);
    await assert.rejects(postDraft(xd.id, { root, now: NOW, xPerDay: 0, log: () => {} }), /cap/);
  } finally { await rm(root, { recursive: true }); }
});

test('X credentials: @NexuAlpha keys only, personal X_BERLIN_* ignored', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'xenv-'));
  const f = path.join(dir, 'x.env');
  await writeFile(f, 'X_API_KEY=a\nX_API_SECRET=b\nX_ACCESS_TOKEN=c\nX_ACCESS_SECRET=d\nX_BERLIN_ACCESS_TOKEN=zzz\n');
  assert.deepEqual(loadXCredentials(f), { consumerKey: 'a', consumerSecret: 'b', accessToken: 'c', accessSecret: 'd' });
  await writeFile(f, 'X_API_KEY=a\nX_API_SECRET=b\nX_BERLIN_ACCESS_TOKEN=c\nX_BERLIN_ACCESS_SECRET=d\n');
  assert.throws(() => loadXCredentials(f), /incomplete/);
  await rm(dir, { recursive: true });
});
