import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { newsListHeroCopy, NEWS_LIST_COPY_LOCALES } from '../src/data/news-list-copy.js';

const page = readFileSync(new URL('../src/components/v3/news/NewsListPage.jsx', import.meta.url), 'utf8');
test('all supported news eyebrows use reader language without SEO implementation jargon', () => {
  assert.equal(NEWS_LIST_COPY_LOCALES.length, 17);
  for (const locale of NEWS_LIST_COPY_LOCALES) {
    const { eyebrow } = newsListHeroCopy(locale);
    assert.ok(eyebrow.trim(), `${locale} has a localized eyebrow`);
    assert.doesNotMatch(eyebrow, /SEO|Search Engine|REPORTS|RAPPORTS SEO|INFORMES SEO|SEO-Б|SEOレポート|SEO 리포트|BÁO CÁO SEO|LAPORAN SEO/i);
    if (locale !== 'en') assert.notEqual(eyebrow, newsListHeroCopy('en').eyebrow, `${locale} avoids English fallback`);
  }
});
test('news component renders shared hero copy and retains script-region locale aliases', () => {
  assert.match(page, /import \{ newsListHeroCopy \} from/);
  assert.match(page, /newsListHeroCopy\(locale\)/);
  assert.match(page, /\{hero\.eyebrow\}/);
  assert.deepEqual(newsListHeroCopy('zh-TW'), newsListHeroCopy('zh-Hant'));
  assert.deepEqual(newsListHeroCopy('zh-CN'), newsListHeroCopy('zh-Hans'));
  assert.deepEqual(newsListHeroCopy('de-DE'), newsListHeroCopy('de'));
});
