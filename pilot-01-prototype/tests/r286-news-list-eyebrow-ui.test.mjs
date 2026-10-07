import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/components/v3/news/NewsListPage.jsx', import.meta.url), 'utf8');
const beforeSource = readFileSync(new URL('../baseline/NewsListPage.before-eyebrow-ui.jsx', import.meta.url), 'utf8');
const readingCopy = JSON.parse(readFileSync(new URL('./fixtures/r286-news-reading-copy.json', import.meta.url), 'utf8'));
const registry = readFileSync(new URL('../src/data/partner-registry.js', import.meta.url));

const expectedRegistrySha = '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a';
const eyebrowReplacements = [
  ['eyebrow: "市场观察与研究"', 'eyebrow: "MARKET INTELLIGENCE & SEO REPORTS"'],
  ['eyebrow: "市場觀察與研究"', 'eyebrow: "MARKET INTELLIGENCE & SEO REPORTS"'],
  ['eyebrow: "Market news & research"', 'eyebrow: "MARKET INTELLIGENCE & SEO REPORTS"'],
  ['eyebrow:"市場ニュースとリサーチ"', 'eyebrow:"市場インテリジェンスとSEOレポート"'],
  ['eyebrow:"시장 뉴스와 리서치"', 'eyebrow:"시장 인텔리전스 및 SEO 리포트"'],
  ['eyebrow:"Piyasa haberleri ve araştırma"', 'eyebrow:"Piyasa istihbaratı ve SEO raporları"'],
  ['eyebrow:"Notícias de mercado e pesquisa"', 'eyebrow:"INTELIGÊNCIA DE MERCADO E RELATÓRIOS SEO"'],
  ['eyebrow:"Noticias de mercado e investigación"', 'eyebrow:"INTELIGENCIA DE MERCADO E INFORMES SEO"'],
  ['eyebrow:"Actualités du marché et recherche"', 'eyebrow:"INTELLIGENCE DE MARCHÉ ET RAPPORTS SEO"'],
  ['eyebrow:"Marktnachrichten und Research"', 'eyebrow:"MARKTINTELLIGENZ UND SEO-BERICHTE"'],
  ['eyebrow:"Новости рынка и исследования"', 'eyebrow:"РЫНОЧНАЯ АНАЛИТИКА И SEO-ОТЧЁТЫ"'],
  ['eyebrow:"أخبار السوق والأبحاث"', 'eyebrow:"تحليلات السوق وتقارير SEO"'],
  ['eyebrow:"Berita pasar dan riset"', 'eyebrow:"INTELIJEN PASAR DAN LAPORAN SEO"'],
  ['eyebrow:"Tin thị trường và nghiên cứu"', 'eyebrow:"THÔNG TIN THỊ TRƯỜNG VÀ BÁO CÁO SEO"'],
  ['eyebrow:"Notizie di mercato e ricerca"', 'eyebrow:"INTELLIGENCE DI MERCATO E REPORT SEO"'],
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function reverseEyebrows(text) {
  let reversed = text;
  for (const h of readingCopy.hunks) {
    assert.equal(reversed.split(h.after).length - 1, 1, 'approved reading-copy literal must be unique');
    reversed = reversed.replace(h.after, h.before);
  }
  assert.equal(sha256(reversed), readingCopy.baselineSha, 'restore exact current eyebrow baseline before its original inverse');
  for (const [after, before] of eyebrowReplacements) {
    const escaped = after.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.equal((reversed.match(new RegExp(escaped, 'g')) || []).length, 1, `${after} must appear exactly once`);
    reversed = reversed.replace(after, before);
  }
  return reversed;
}

test('news list eyebrow copy uses natural market research language in all visible locale entries', () => {
  for (const [after] of eyebrowReplacements) {
    assert.ok(source.includes(after), `${after} should be present`);
  }
  const eyebrowOnly = [...source.matchAll(/eyebrow\s*:\s*"([^"]+)"/g)].map((match) => match[1]).join('\n');
  assert.doesNotMatch(eyebrowOnly, /SEO|Search Engine|REPORTS|RAPPORTS SEO|INFORMES SEO|SEO-Б|SEOレポート|SEO 리포트|BÁO CÁO SEO|LAPORAN SEO/i);
});

test('news list eyebrow patch reverses exactly and keeps protected registry untouched', () => {
  assert.equal(eyebrowReplacements.length, 15, 'all 15 locale eyebrow fields must be covered');
  assert.equal(sha256(reverseEyebrows(source)), sha256(beforeSource), 'only the authorized eyebrow strings should differ from the backup');
  assert.equal(sha256(registry), expectedRegistrySha, 'partner registry SHA must remain protected');
});
