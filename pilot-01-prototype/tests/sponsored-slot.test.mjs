import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PROMOTIONS, resolvePromotions } from '../src/data/promotions.js';
let vite, Slot, Page;
test.before(async () => {
  vite = await createServer({ optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } });
  Slot = (await vite.ssrLoadModule('/src/components/shared/SponsoredSlot.jsx')).SponsoredSlot;
  Page = (await vite.ssrLoadModule('/src/components/v3/news/NewsDetailPage.jsx')).NewsDetailPage;
});
test.after(async () => vite?.close());
test('commercial label, rel, all variants, neutral fallback and no fine print', () => {
  for (const locale of ['en', 'zh-Hans']) for (const variant of ['inline', 'end', 'sidebar', 'mobile']) {
    const html = renderToStaticMarkup(React.createElement(Slot, { promotions: resolvePromotions({ venue: 'okx', locale, now: '2026-10-12' }), locale, variant }));
    assert.match(html, locale === 'en' ? /Sponsored/ : /推广/); assert.match(html, /rel="sponsored noopener"/); assert.match(html, /target="_blank"/); assert.match(html, /href="\/go\/okx\?src=/);
    assert.doesNotMatch(html, /investment advice|commission|disclaimer/i);
  }
  const html = renderToStaticMarkup(React.createElement(Slot, { promotions: resolvePromotions({}) }));
  assert.match(html, /href="\/compare/); assert.doesNotMatch(html, /rel="sponsored/);
});
test('news SSR with and without match in English and simplified Chinese', () => {
  // Freeze only this test's clock so registry staleness does not make fixtures time-dependent.
  const saved = Date.now; Date.now = () => Date.parse('2026-10-12');
  try { for (const locale of ['en', 'zh-Hans']) for (const match of [true, false]) {
    const article = { slug: 'promotion-test', status: 'PUBLISHED', title: { en: 'Title', 'zh-Hans': '标题' }, summary: { en: 'Summary', 'zh-Hans': '摘要' }, content: { en: 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.', 'zh-Hans': '第一段。\n\n第二段。\n\n第三段。' }, category: 'research', publishedAt: '2026-10-12T00:00:00Z', sources: [{ url: 'https://example.com/source', title: 'Source', publisher: 'Source' }], relatedVenues: [], ...(match ? { cta: { venue: 'okx', topic: 'stocks' } } : {}) };
    const html = renderToStaticMarkup(React.createElement(Page, { slug: article.slug, locale, initialArticles: [article] }));
    assert.match(html, /data-sponsored-slot="end"/); assert.match(html, /data-sponsored-slot="sidebar"/);
    if (match) { assert.match(html, /data-sponsored-slot="inline"/); assert.match(html, /rel="sponsored noopener"/); }
    else { assert.doesNotMatch(html, /data-sponsored-slot="inline"/); assert.doesNotMatch(html, /href="\/go\//); }
    assert.match(html, /href="https:\/\/example.com\/source" target="_blank" rel="noopener noreferrer"/);
  } } finally { Date.now = saved; }
});
test('content-led promotion cards retain desktop sidebar and document flow', () => {
  const css = readFileSync(new URL('../src/components/shared/sponsored-slot.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /min-block-size: 164px/); assert.match(css, /align-items: start/); assert.match(css, /min-block-size: 44px/); assert.match(css, /min-width: 1200px/); assert.match(css, /position: sticky/); assert.doesNotMatch(css, /position: fixed/);
});

test('article numbered Markdown steps render as lists while prose and bullets retain their structure', () => {
  for (const locale of ['en', 'zh-Hans']) {
    const article = {
      slug: 'numbered-steps-test', status: 'PUBLISHED',
      title: { [locale]: 'Numbered steps' }, summary: { [locale]: 'Step rendering regression' },
      content: { [locale]: 'Ordinary prose mentions 1. first and 2. second inline.\n\n1. **进入官网**\n2. 在账户页核对资格\n\n- Existing bullet one\n- Existing bullet two\n\n3. Resume the process\n4. Finish the checks' },
      category: 'research', publishedAt: '2026-10-12T00:00:00Z', relatedVenues: [],
    };
    const html = renderToStaticMarkup(React.createElement(Page, { slug: article.slug, locale, initialArticles: [article] }));
    assert.match(html, /<p>Ordinary prose mentions 1\. first and 2\. second inline\.<\/p>/);
    assert.match(html, /<ol><li><strong>进入官网<\/strong><\/li><li>在账户页核对资格<\/li><\/ol>/);
    assert.match(html, /<ul><li>Existing bullet one<\/li><li>Existing bullet two<\/li><\/ul>/);
    assert.match(html, /<ol start="3"><li>Resume the process<\/li><li>Finish the checks<\/li><\/ol>/);
  }
});
