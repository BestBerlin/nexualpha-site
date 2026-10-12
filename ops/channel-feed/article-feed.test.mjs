import test from 'node:test';
import assert from 'node:assert/strict';
import { articleEdition, articleMessage, runArticleFeed, ARTICLE_INTERVAL_MS, ARTICLE_LANGS } from './article-feed.mjs';
const now = Date.parse('2026-10-12T08:00:00Z');
const copy = { zh: ['中文标题', '第一句。第二句。'], en: ['English title', 'First sentence. Second sentence.'], ru: ['Заголовок', 'Первая фраза. Вторая фраза.'], tr: ['Başlık', 'İlk cümle. İkinci cümle.'], vi: ['Tiêu đề', 'Câu đầu. Câu sau.'] };
const locales = { zh: 'zh-Hans', en: 'en', ru: 'ru', tr: 'tr', vi: 'vi' };
const article = (slug, age = 0, langs = ARTICLE_LANGS) => ({ slug, publishedAt: new Date(now - age).toISOString(),
  title: Object.fromEntries(langs.map(l => [locales[l], copy[l][0]])), summary: Object.fromEntries(langs.map(l => [locales[l], copy[l][1]])), availableLocales: langs.map(l => locales[l]) });
for (const lang of ARTICLE_LANGS) test(`article message ${lang}`, () => {
  const e = articleEdition(article('test-item'), lang), m = articleMessage(e, lang);
  assert.ok(m.text.includes(copy[lang][0]));
  assert.equal(e.summary, copy[lang][1].split(lang === 'zh' ? '。' : '.')[0] + (lang === 'zh' ? '。' : '.'));
  assert.ok(m.text.includes(`?src=tg-article-${lang}`));
  assert.ok(!m.text.includes('<i>'));
});
test('editions fail closed, declared availability wins, HTML escaped', () => {
  const a = article('test-item', 0, ['en']);
  a.title['zh-Hans'] = '翻译'; a.summary['zh-Hans'] = '摘要。';
  assert.equal(articleEdition(a, 'zh'), null);
  assert.equal(articleEdition(a, 'ru'), null);
  assert.equal(articleEdition(a, 'de'), null);
  assert.equal(articleEdition({ ...a, slug: '../evil' }, 'en'), null);
  assert.equal(articleEdition({ ...a, summary: {} }, 'en'), null);
  const e = articleEdition({ ...a, title: { en: '<script>&"' } }, 'en');
  assert.ok(articleMessage(e, 'en').text.includes('&lt;script&gt;&amp;&quot;'));
});
const channels = [{ lang: 'en', chat: '@en' }, { lang: 'zh', chat: '@zh' }];
test('first run no backlog; newest first; 90-minute boundary and no repost', async () => {
  let state = {}, sent = [];
  const cycle = async (articles, time = now, dryRun = false) => runArticleFeed({ feed: { articles }, channels, state, now: time, dryRun,
    send: async (chat, m) => sent.push([chat, m.text]), save: async s => { state = structuredClone(s); } });
  await cycle([article('old', 1000)]); assert.equal(sent.length, 0);
  await cycle([article('old', 1000), article('newer'), article('new', 500)]); assert.equal(sent.length, 2); assert.ok(sent.every(s => s[1].includes('/newer?')));
  await cycle([article('new', 500)], now + ARTICLE_INTERVAL_MS - 1); assert.equal(sent.length, 2);
  await cycle([article('new', 500)], now + ARTICLE_INTERVAL_MS); assert.equal(sent.length, 4);
  await cycle([article('new', 500), article('newer')], now + ARTICLE_INTERVAL_MS * 2); assert.equal(sent.length, 4);
});
test('a new locale edition posts only to its channel; new channels baseline', async () => {
  let state = {}, sent = [];
  const cycle = async (a, targets = channels) => runArticleFeed({ feed: { articles: [a] }, channels: targets, state, now, send: async chat => sent.push(chat), save: async s => { state = structuredClone(s); } });
  await cycle(article('test-item', 0, ['en']));
  await cycle(article('test-item', 0, ['en', 'zh'])); assert.deepEqual(sent, ['@zh']);
  await cycle(article('test-item'), [...channels, { lang: 'ru', chat: '@ru' }]); assert.deepEqual(sent, ['@zh']);
});
test('partial failure saves successful channel; retry only failed channel', async () => {
  let state = {}, sent = [];
  const opts = { feed: { articles: [] }, channels, state, now, send: async () => {}, save: async s => { state = structuredClone(s); } };
  await runArticleFeed(opts);
  await assert.rejects(runArticleFeed({ ...opts, state, feed: { articles: [article('new')] }, send: async chat => { if (chat === '@zh') throw new Error('denied'); sent.push(chat); } }), /denied/);
  await runArticleFeed({ ...opts, state, feed: { articles: [article('new')] }, send: async chat => sent.push(chat) });
  assert.deepEqual(sent, ['@en', '@zh']);
});
test('dry run and invalid feeds do not change state', async () => {
  const state = { channels: { 'en:@en': { initialized: true, seen: {}, lastPostedAt: null } } };
  const before = structuredClone(state);
  const opts = { feed: { articles: [article('new')] }, channels: [channels[0]], state, now, dryRun: true, send: async () => {}, save: () => assert.fail('dry write') };
  await runArticleFeed(opts); assert.deepEqual(state, before);
  await assert.rejects(runArticleFeed({ ...opts, feed: {} }), /invalid article feed/);
});

test('corrupt persisted state fails closed before delivery', async () => {
  for (const state of [null, [], { channels: [] }, { channels: { 'en:@en': { initialized: true, seen: {}, lastPostedAt: 'bad' } } }]) {
    await assert.rejects(runArticleFeed({ feed: { articles: [article('new')] }, channels, state, now,
      send: () => assert.fail('must not send'), save: () => assert.fail('must not save') }), /corrupt article/);
  }
});
