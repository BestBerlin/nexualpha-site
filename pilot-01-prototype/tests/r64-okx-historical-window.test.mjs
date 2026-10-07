import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { OKX_USD_USDC_OWNER_CHECKLIST, newsArticleExtraFaqEntries } from '../src/data/news-feed-client.js';

const feed = JSON.parse(await readFile(new URL('../public/content/news-feed.json', import.meta.url), 'utf8'));
const article = feed.articles.find((row) => row.slug === 'okx-usd-to-usdc-spot-pair-migration');

test('OKX current direct answers separate historical announced dates from present account checks', () => {
  assert.match(article.aeo.directAnswer, /historical announced schedule/i);
  assert.match(article.aeo.directAnswer, /current.*account|account.*current/i);
  assert.doesNotMatch(article.aeo.directAnswer, /coverage before the September 30 delisting window/);
  assert.match(article.content.en, /historical announced schedule/i);
  assert.match(article.content['zh-Hans'], /历史公告时间表/);
  assert.doesNotMatch(article.content.en, /then audit the account before the September 30|Check before September 30, 2026|audit before September 30, 2026/);
  assert.doesNotMatch(article.content['zh-Hans'], /2026 年 9 月 30 日前应检查|应该在 2026 年 9 月 30 日前完成|在 9 月 30 日前决定/);
  assert.match(article.content.en, /does not verify|does not confirm/);
  assert.match(article.content['zh-Hans'], /未核验|没有核验/);
});

test('OKX source scope, exact historical schedule and editorial identities stay intact', () => {
  assert.match(article.content.en, /8:00 UTC on September 23, 2026/);
  assert.match(article.content.en, /8:00 UTC on September 30, 2026/);
  assert.match(article.content.en, /USDT-USD/);
  assert.match(article.content.en, /USDG/);
  assert.match(article.content.en, /RLUSD/);
  assert.match(article.content['zh-Hans'], /2026 年 9 月 23 日 8:00 UTC/);
  assert.match(article.content['zh-Hans'], /2026 年 9 月 30 日 8:00 UTC/);
  assert.match(article.content['zh-Hans'], /15:00 到 16:00/);
  assert.equal(article.sources.length, 6);
  assert.deepEqual(article.sources.map((s) => s.url), [
    'https://www.okx.com/en-us/help/okx-to-migrate-usd-spot-trading-pairs',
    'https://www.okx.com/en-us/help/changes-to-usd-spot-trading-pairs-sg',
    'https://www.okx.com/docs-v5/log_en/',
    'https://www.okx.com/en-us/help/unified-usd-orderbook-faq',
    'https://www.circle.com/transparency',
    'https://www.circle.com/legal/usdc-terms',
  ]);
  assert.equal(article.sources[0].accessedAt, '2026-09-15T06:24:00Z');
  assert.equal(article.sources[1].accessedAt, '2026-09-15T06:24:00Z');
  assert.equal(article.publishedAt, '2026-09-07T23:41:35.000Z');
  assert.equal(article.seo.title, 'OKX USD to USDC Migration: Sep 23/30 Checklist');
  assert.equal(article.seo.canonical, 'https://nexualpha.com/news/okx-usd-to-usdc-spot-pair-migration');
});

test('OKX shared owner FAQ uses historical schedule rather than an upcoming deadline', () => {
  assert.equal(OKX_USD_USDC_OWNER_CHECKLIST.reviewedAt, '2026-09-15');
  assert.match(OKX_USD_USDC_OWNER_CHECKLIST.checklist[0], /historical announced schedule/i);
  const faq = newsArticleExtraFaqEntries(article, 'en').find((entry) => /open orders/.test(entry.question));
  assert.ok(faq);
  assert.match(faq.answer, /historical/i);
  assert.match(faq.answer, /current/i);
  assert.doesNotMatch(faq.answer, /^Before the September 30 delisting window/);
  assert.match(faq.answer, /does not confirm account-specific/);
});

test('OKX visible review note distinguishes original six-source review from bounded October correction', () => {
  assert.match(article.content.en, /Original full source review: September 15, 2026/);
  assert.match(article.content.en, /October 1, 2026: only the two OKX migration announcements were rechecked/);
  assert.match(article.content.en, /not a new review of all six sources/);
  assert.doesNotMatch(article.content.en, /Content revised: September 15, 2026|Source evidence last checked: September 15, 2026/);
  assert.match(article.content['zh-Hans'], /原有完整来源审查日期：2026 年 9 月 15 日/);
  assert.match(article.content['zh-Hans'], /2026 年 10 月 1 日仅重新核对两则 OKX 迁移公告/);
  assert.match(article.content['zh-Hans'], /不代表六项来源全部重新审查/);
  assert.doesNotMatch(article.content['zh-Hans'], /内容修订日期：2026 年 9 月 15 日|来源证据最近核验日期：2026 年 9 月 15 日/);
  assert.equal(article.updatedAt, '2026-10-01T14:38:53.478Z');
  assert.equal(article.aeo.reviewedAt, '2026-09-15T06:24:00.000Z');
});
