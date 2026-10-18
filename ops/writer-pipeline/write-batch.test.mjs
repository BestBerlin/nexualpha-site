import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { csv, duplicate, safeTopic, selectTopics, dailyTopics, feedHistory, run, main, nextLocale, normalizeMarkdown, htmlToText, linkTokenizedStocks } from './write-batch.mjs';
import { checkDraft } from './validate-drafts.mjs';

test('quoted CSV, bilingual live titles and near-duplicate intents', () => {
  assert.equal(csv('query,used\n"deposit, bank",\n')[0].query, 'deposit, bank');
  assert.throws(() => csv('query\n"open'), /Malformed/);
  assert(duplicate('OKX funding account transfer checks', 'OKX funding account transfer'));
  assert.deepEqual(feedHistory({ articles: [{ slug: 'a', title: { en: 'Title', 'zh-Hans': '标题' } }] }), ['a', 'Title', '标题']);
  assert.throws(() => feedHistory({ unknown: [] }));
});
test('heterogeneous ledger counts unique new topics, retains daily authority', () => {
  const rows = [{ date: 'today', slug: 'a', countedNewTopic: true }, { date: 'today', slug: 'a', type: 'localized-edition', countedNewTopic: false }, { date: 'today', dailyNewTopics: 10 }];
  assert.equal(dailyTopics(rows, 'today'), 10); assert.equal(dailyTopics(rows, 'yesterday'), 0);
});
test('selects unused radar, prioritizes tokenized stocks, blocks stale/no-news filler', () => {
  const rows = [{ query: 'native draft reserve', rank: 0, language: 'tr', draft: '/untrusted/draft' }, { query: 'okx bank deposit', rank: 1, language: 'en' }, { query: 'beginner wallet safety', rank: 3, language: 'en', lanes: 'beginner' }, { query: 'market tools usage', rank: 4, language: 'vi' }];
  const events = ['ordinary listing','new tokenized stocks listing'].map((title_internal, id) => ({ id, title_internal, state: 'new', event_type: 'product_launch', source_published_at: new Date().toISOString() }));
  const topics = selectTopics(rows, events, [], 'vi', Date.now(), true);
  assert.equal(topics[0].query, 'beginner wallet safety'); assert.equal(topics[1].event.id, 1);
  assert.throws(() => selectTopics(rows, [], [], 'vi'), /No fresh/);
  const optional = selectTopics(rows, [], [], 'vi', Date.now(), true, { newsOptional: true });
  assert.deepEqual(optional.map(t => t.lane), ['search', 'localized']);
  assert.deepEqual(selectTopics(rows, [], [], 'vi', Date.now(), true, { limit: 1 }).map(t => t.lane), ['search']);
  assert.throws(() => selectTopics(rows, events, rows.map(r => r.query), 'vi'), /No unused/);
  assert(!safeTopic({ query: 'mã giới thiệu', language: 'vi' }));
  assert(!safeTopic({ query: 'Bitget stocks', language: 'tr' }));
});
test('process timeout kills provider group and never returns stderr secrets', async () => {
  await assert.rejects(run(process.execPath, ['-e', 'setTimeout(()=>{},10000)'], { timeout: 50 }), /timed out/);
  await assert.rejects(run(process.execPath, ['-e', 'console.error("SECRET");process.exit(1)']), e => !e.message.includes('SECRET'));
});
test('draft gate rejects fabricated review, unfetched claims and prohibited locale text', () => {
  const errors = checkDraft({ status: 'needs_review', titles: { vi: 'Sign up' }, sources: [{ id: 'x', url: 'https://invented', primary: true }], claims: [{ sourceIds: ['missing'] }] }, { vi: '# Sign up\n\n## Answer\nregister with referral code 2026' }, { sources: [], partners: { partners: [] } }, { status: 'STAGED', review: { verdict: 'PASS' } });
  assert(errors.some(e => e.includes('must not claim')));
  assert(errors.some(e => e.includes('not fetched')));
  assert(errors.some(e => e.includes('valid source IDs')));
  assert(errors.some(e => e.includes('neutral edition')));
});

// This tests orchestration with synthetic provider/build adapters, never editorial or live-model quality.
async function fixture() {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'writer-pipeline-'));
  const engine = path.join(tmp, 'engine'), root = path.join(tmp, 'writers'), keywords = path.join(tmp, 'keywords');
  for (const d of ['state','staging']) await mkdir(path.join(engine, d), { recursive: true });
  await mkdir(path.join(keywords, 'radar'), { recursive: true });
  await writeFile(path.join(engine, 'state/claude-daily-ledger.jsonl'), '');
  await writeFile(path.join(engine, 'state/article-ledger.jsonl'), '');
  await writeFile(path.join(engine, 'CLAUDE-CONTENT-RUNBOOK.md'), 'Test rules');
  const date = new Date().toISOString().slice(0,10);
  await writeFile(path.join(keywords, 'radar', `keywords-radar-${date}.csv`), 'language,query,rank,suggested NexuAlpha URL\nen,account transfer checks,1,https://example.com/guide\ntr,wallet safety lessons,2,https://example.com/guide\n');
  const events = path.join(tmp, 'events.json');
  await writeFile(events, JSON.stringify({ generated_at: new Date().toISOString(), events: [{ title_internal: 'Fresh exchange outage status', event_type: 'outage', state: 'new', source_published_at: new Date().toISOString(), evidence: [{ url: 'https://example.com/one' }, { url: 'https://example.com/two' }] }] }));
  let n = 0;
  return { tmp, config: { engine, root, keywords, events, nativeDrafts: path.join(tmp, 'absent'), nativeBriefs: path.join(tmp, 'absent'),
    fetchSource: async url => url.includes('news-feed') ? JSON.stringify({ articles: [] }) : url.includes('partners.json') ? JSON.stringify({ partners: [] }) : `${'Research evidence '.repeat(20)}<a href="https://www.okx.com/help/one">Official one</a><a href="https://www.okx.com/help/two">Official two</a>`,
    generate: async (_prompt, dir) => {
      n++;
      const research = JSON.parse(await readFile(path.join(dir, 'research.json')));
      const title = `Independent manuscript ${n}`, zhTitle = `独立文稿第${n}篇`;
      const english = Array.from({ length: 110 }, (_, i) => `Paragraph ${i} explains a different factual test example with enough useful words.`).join('\n\n');
      const chinese = Array.from({ length: 110 }, (_, i) => `第${i}段用于验证中文稿件长度检查及工作流程中的状态变化。`).join('\n\n');
      const articles = { en: `# ${title}\n\n## The short answer\n\n${english}\n\n## Quick answers\n\nWhat next?`, 'zh-Hans': `# ${zhTitle}\n\n## 简短回答\n\n${chinese}\n\n## 常见问题速答\n\n如何操作？` };
      const titles = { en: title, 'zh-Hans': zhTitle };
      if (research.topic.locale) { titles.tr = 'Yerel örnek'; articles.tr = `# Yerel örnek\n\n## Kısa yanıt\n\n${english}\n\n## Sorular\n\nTest?`; }
      return { provider: 'synthetic-test', attempts: [], payload: { articles, meta: { slug: ['amber','violet','silver'][n-1], titles, sources: research.sources.map((s,i)=>({ id: `s${i}`, url: s.url, primary: true })), claims: [{ sourceIds: ['s0'] }] } } };
    },
    build: async dir => writeFile(path.join(dir, 'article.json'), JSON.stringify({ status: 'STAGED', review: { verdict: 'PASS', reviewedAt: 'test', passes: ['test'] } })),
  } };
}
test('three draft orchestration resets builder approvals, queues review, retains reservations', async () => {
  const f = await fixture();
  try {
    const result = await main(f.config);
    assert.equal(result.status, 'needs_review');
    const manifest = JSON.parse(await readFile(path.join(result.batch,'manifest.json')));
    assert.equal(manifest.packages.length, 3);
    for (const p of manifest.packages) {
      const built = JSON.parse(await readFile(path.join(p.directory,'article.json')));
      assert.equal(built.review.verdict, 'PENDING'); assert.equal(built.status, 'needs_review');
    }
    assert.match(await readFile(path.join(f.config.root,'REVIEW-QUEUE.md'),'utf8'), /needs_review/);
    await assert.rejects(main(f.config), /No unused/);
    assert(!(await readdir(f.config.root)).includes('.writer.lock'));
  } finally { await rm(f.tmp, { recursive: true, force: true }); }
});
test('provider failure leaves blocked reservations and releases process lock', async () => {
  const f = await fixture(); f.config.generate = async () => { throw new Error('Synthetic provider unavailable'); };
  try {
    await assert.rejects(main(f.config), /Synthetic provider/);
    const dates = await readdir(path.join(f.config.engine,'staging'));
    const batches = await readdir(path.join(f.config.engine,'staging',dates[0]));
    const manifest = JSON.parse(await readFile(path.join(f.config.engine,'staging',dates[0],batches[0],'manifest.json')));
    assert.equal(manifest.status, 'blocked');
    assert.match(await readFile(path.join(f.config.root,'REVIEW-QUEUE.md'),'utf8'), /blocked/);
    assert(!(await readdir(f.config.root)).includes('.writer.lock'));
  } finally { await rm(f.tmp, { recursive: true, force: true }); }
});

test('pending reservations advance locale beyond published ledger authority', () => {
  assert.equal(nextLocale([{ nextLocale: 'vi', completedAt: '2026-10-18T06:00:00Z' }], [{ locale: 'vi', createdAt: '2026-10-18T08:00:00Z' }]), 'ru');
  assert.equal(nextLocale([{ nextLocale: 'vi', completedAt: '2026-10-18T10:00:00Z' }], [{ locale: 'tr', createdAt: '2026-10-18T08:00:00Z' }]), 'vi');
});

test('builder failure after manifest creation cannot leave automatic review PASS', async () => {
  const f = await fixture();
  f.config.build = async dir => {
    await writeFile(path.join(dir, 'article.json'), JSON.stringify({ status: 'STAGED', review: { verdict: 'PASS' } }));
    throw new Error('Synthetic builder failure');
  };
  try {
    await assert.rejects(main(f.config), /Synthetic builder failure/);
    const [date] = await readdir(path.join(f.config.engine, 'staging'));
    const [batch] = await readdir(path.join(f.config.engine, 'staging', date));
    const built = JSON.parse(await readFile(path.join(f.config.engine, 'staging', date, batch, 'topic-1/article.json')));
    assert.equal(built.status, 'needs_review'); assert.equal(built.review.verdict, 'PENDING');
  } finally { await rm(f.tmp, { recursive: true, force: true }); }
});

test('blocked search topic is skipped for the next radar candidate and stays reserved', async () => {
  const f = await fixture();
  const radar = (await readdir(path.join(f.config.keywords, 'radar')))[0];
  await writeFile(path.join(f.config.keywords, 'radar', radar), 'language,query,rank,suggested NexuAlpha URL\nen,account transfer checks,1,https://example.com/guide\nen,card funding limits,2,https://example.com/guide\ntr,wallet safety lessons,3,https://example.com/guide\n');
  const generate = f.config.generate;
  let calls = 0;
  f.config.generate = async (prompt, dir, ...rest) => { if (++calls === 1) return { provider: 'synthetic-test', attempts: [], payload: { blocked: 'insufficient sources' } }; return generate(prompt, dir, ...rest); };
  f.config.limit = 1;
  try {
    const result = await main(f.config);
    const manifest = JSON.parse(await readFile(path.join(result.batch, 'manifest.json')));
    assert.equal(manifest.status, 'needs_review');
    assert.equal(manifest.topics[0].primaryQuery, 'card funding limits');
    assert.deepEqual(manifest.skipped.map(s => s.query), ['account transfer checks']);
    assert.equal(manifest.packages.length, 1);
  } finally { await rm(f.tmp, { recursive: true, force: true }); }
});

test('markdown normalisation separates headings and lists for the builder', () => {
  assert.equal(normalizeMarkdown('# T\n\n## The short answer\nText.\n## Steps\nIntro\n1. a\n2. b\n'), '# T\n\n## The short answer\n\nText.\n\n## Steps\n\nIntro\n\n1. a\n2. b\n');
});

test('source bodies keep readable text, not head/script markup', () => {
  const html = `<html><head><script>var big = "${'x'.repeat(30000)}";</script><style>.a{}</style></head><body><h1>Restricted</h1><p>Bybit does not serve the United States &amp; Hong Kong.</p></body></html>`;
  const text = htmlToText(html);
  assert.match(text, /United States & Hong Kong/);
  assert.equal(text.includes('var big'), false);
  assert.equal(htmlToText('{"json":true}'), '{"json":true}');
});

test('tokenized-stock hub and first ticker mentions are linked, existing links untouched', () => {
  assert.equal(linkTokenizedStocks('Trade tokenized stocks like AAPL and [NVDA tokenized stock](/tokenized-stocks/nvda).\n', 'en'),
    'Trade [tokenized stocks](/tokenized-stocks) like [AAPL](/tokenized-stocks/aapl) and [NVDA tokenized stock](/tokenized-stocks/nvda).\n');
  assert.equal(linkTokenizedStocks('No stocks here, AAPL only.\n', 'en'), 'No stocks here, AAPL only.\n');
});

test('localized editions get locale-prefixed tokenized-stock links', () => {
  assert.equal(linkTokenizedStocks('美股代币：[NVDA](/tokenized-stocks/nvda) 和 [枢纽](/tokenized-stocks)\n', 'zh-Hans'),
    '美股代币：[NVDA](/zh-hans/tokenized-stocks/nvda) 和 [枢纽](/zh-hans/tokenized-stocks)\n');
});
