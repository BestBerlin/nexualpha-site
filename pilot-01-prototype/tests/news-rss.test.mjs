import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import worker, { renderNewsRss, renderLiveNewsSitemap } from '../worker/index.js';

const now = Date.parse('2026-10-21T12:00:00Z');
const base = { status: 'PUBLISHED', sources: [{ url: 'https://example.com' }], summary: { en: 'summary', 'zh-Hans': '摘要' }, title: { en: 'Dollar $ & <news>', 'zh-Hans': '中文标题' }, content: { en: 'x', 'zh-Hans': 'x' }, availableLocales: ['en', 'zh-Hans'], seo: { noindex: false }, aeo: { directAnswer: 'Direct & honest answer' } };
const articles = Array.from({ length: 55 }, (_, i) => ({ ...base, slug: `story-${i}`, publishedAt: new Date(now - i * 3600e3).toISOString() }));

test('RSS limits newest published native indexable articles and escapes XML', () => {
  const xml = renderNewsRss([...articles, { ...base, slug: 'hidden', publishedAt: articles[0].publishedAt, seo: { noindex: true } }, { ...base, slug: 'future', publishedAt: new Date(now + 1).toISOString() }, { ...base, slug: 'invalid-date', publishedAt: 'bad' }], 'en', now);
  const document = new JSDOM(xml, { contentType: 'application/xml' }).window.document;
  assert.equal(document.querySelectorAll('item').length, 50);
  assert.equal(document.querySelector('parsererror'), null);
  assert.equal(document.querySelector('item description').textContent, 'Direct & honest answer');
  assert.match(xml, /Dollar \$ &amp; &lt;news&gt;/);
  assert.match(xml, /<description>Direct &amp; honest answer<\/description>/);
  assert.doesNotMatch(xml, /hidden|future|invalid-date|story-50/);
  assert.ok(xml.indexOf('/story-0</link>') < xml.indexOf('/story-1</link>'));
  for (const [, date] of xml.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)) assert.ok(Number.isFinite(Date.parse(date)));
  assert.match(xml, /<guid isPermaLink="true">https:\/\/nexualpha.com\/news\/story-0<\/guid>/);
  const zh = renderNewsRss(articles, 'zh-Hans', now);
  assert.match(zh, /<title>中文标题<\/title>/);
  assert.match(zh, /\/zh-hans\/news\/story-0/);
});

test('feed endpoints serve mounted feed, correct headers and HEAD', async () => {
  let liveArticles = articles;
  const env = { ASSETS: { fetch: async (req) => new URL(req.url).pathname === '/content/news-feed.json' ? Response.json({ articles: liveArticles }) : new Response('', { status: 404 }) } };
  for (const path of ['/rss.xml', '/feed.xml', '/zh-hans/rss.xml']) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${path}`), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/rss+xml; charset=utf-8');
    assert.equal(response.headers.get('cache-control'), 'public, max-age=300');
    assert.match(await response.text(), /^<\?xml[^\n]+\n<rss version="2.0"><channel>/);
    const head = await worker.fetch(new Request(`https://nexualpha.com${path}`, { method: 'HEAD' }), env);
    assert.equal(await head.text(), '');
  }
  liveArticles = [{ ...base, slug: 'published-after-build', publishedAt: new Date(Date.now() - 1000).toISOString() }];
  const fresh = await worker.fetch(new Request('https://nexualpha.com/rss.xml'), env);
  assert.match(await fresh.text(), /published-after-build/);
});

test('news sitemap enforces exact 48-hour boundary and excludes future dates', () => {
  const data = [-1, 0, 48 * 3600e3, 48 * 3600e3 + 1].map((age, i) => ({ ...base, slug: `boundary-${i}`, publishedAt: new Date(now - age).toISOString() }));
  const xml = renderLiveNewsSitemap(data, now);
  assert.doesNotMatch(xml, /boundary-0|boundary-3/);
  assert.match(xml, /boundary-1/);
  assert.match(xml, /boundary-2/);
  assert.match(xml, /<news:publication_date>2026-10-19T12:00:00.000Z<\/news:publication_date>/);
  assert.match(xml, /<news:title>Dollar \$ &amp; &lt;news&gt;<\/news:title>/);
});
