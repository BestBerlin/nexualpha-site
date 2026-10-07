import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const source = readFileSync(new URL('../src/components/v3/RebateTickerBar.jsx', import.meta.url), 'utf8');
const registry = readFileSync(new URL('../src/data/partner-registry.js', import.meta.url));

function extractTickerArrays(src) {
  const start = src.indexOf('const tickerData = {');
  assert.ok(start >= 0, 'tickerData object must exist');
  const end = src.indexOf('\n};', start);
  assert.ok(end > start, 'tickerData object must close before component code');
  const block = src.slice(start, end);
  const localePattern = /(?:^|\n)\s*(?:"([^"]+)"|(\w[\w-]*)):\s*\[([\s\S]*?)\],/g;
  const entries = new Map();
  let match;
  while ((match = localePattern.exec(block))) {
    const locale = match[1] || match[2];
    const items = [...match[3].matchAll(/\{\s*type:\s*"([^"]+)",\s*text:\s*"([^"]+)"\s*\}/g)]
      .map((item) => ({ type: item[1], text: item[2] }));
    if (items.length) entries.set(locale, items);
  }
  return entries;
}

const tickerData = extractTickerArrays(source);

test('R121 source notes keep every displayed locale item unique after density cleanup', () => {
  assert.ok(tickerData.size >= 15, 'all locale source-note arrays should remain present');
  for (const [locale, items] of tickerData) {
    assert.ok(items.length >= 5, `${locale} keeps a useful source-note set`);
    const texts = items.map((item) => item.text);
    assert.equal(new Set(texts).size, texts.length, `${locale} source notes should not repeat identical text`);
    for (const item of items) {
      assert.match(item.type, /^[A-Z-]+$/, `${locale} item type remains a visible badge token`);
      assert.ok(item.text.trim().length > 12, `${locale} item text remains readable`);
    }
  }
});

test('R121 source notes remove only the duplicated SOURCE benefit line while preserving original mobile status', () => {
  assert.deepEqual(tickerData.get('en').map((item) => item.text).slice(0, 2), [
    'Market feed is currently unavailable · simulated prices are hidden',
    'User benefits and welcome terms must be verified in the official account',
  ]);
  assert.deepEqual(tickerData.get('zh-Hans').map((item) => item.text).slice(0, 2), [
    '市场行情源在当前候选包中不可用 · 不展示模拟价格',
    '平台用户权益与迎新条件需以官方账户页面核验',
  ]);
  assert.deepEqual(tickerData.get('zh-Hant').map((item) => item.text).slice(0, 2), [
    '市場行情源在當前候選包中不可用 · 不展示模擬價格',
    '平台用戶權益與迎新條件需以官方帳戶頁面核驗',
  ]);
  assert.doesNotMatch(source, /\{ type: "SOURCE", text: "User benefits and welcome terms must be verified in the official account" \}/);
  assert.match(source, /<p className="rebate-ticker__text">\{item\.text\}<\/p>/, 'all original notes, including first market status, stay complete inside disclosure');
  assert.match(source, /<details className="rebate-ticker__details">/, 'native disclosure replaces repeated mobile preview without deleting status text');
});

test('R121 source notes keep finite onsite destinations, single presentation, i18n fallback and invite registry untouched', () => {
  assert.match(source, /href=\{sourceNoteDestination\(role, context\)\}/, 'each original note has an explicit approved onsite destination');
  for (const target of ['/methodology#methodology-pillars-title', '/exchanges', '/topics/derivatives', '/#bleed-analyzer', '/activities']) assert.ok(source.includes('"' + target + '"'), target);
  assert.doesNotMatch(source, /rebate-ticker__loop-copy|tabIndex=\{-1\}/, 'duplicate focus-excluded loop is removed, not made focusable');
  assert.match(source, /const items = tickerData\[locale\] \|\| \(isHant \? tickerData\["zh-Hant"\] : isZh \? tickerData\["zh-Hans"\] : tickerData\.en\);/, 'language fallback gate remains unchanged');
  const sha = createHash('sha256').update(registry).digest('hex');
  assert.equal(sha, '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
