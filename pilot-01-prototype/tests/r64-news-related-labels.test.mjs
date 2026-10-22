import feed from '../public/content/news-feed.json' with { type: 'json' };
import { articleRelatedLinks } from '../src/data/article-related-links.js';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { contextualHref } from '../src/data/contextual-href.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const locales = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'tr', 'pt-BR', 'es', 'de', 'fr', 'it', 'ru', 'ar', 'id', 'vi'];
const targets = ['/exchanges/okx', '/factbook/okx', '/compare/binance-vs-okx', '/topics/no-kyc', '/methodology'];

async function renderRelatedResearch() {
  const temporary = await mkdtemp(path.join(root, 'tests/.tmp-r64-related-'));
  try {
    const entry = path.join(temporary, 'entry.jsx');
    const bundle = path.join(temporary, 'bundle.cjs');
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { NewsDetailPage } from '../../src/components/v3/news/NewsDetailPage.jsx';
      import feed from '../../public/content/news-feed.json';
      const source = feed.articles.find(article => article.slug === 'okx-usd-to-usdc-spot-pair-migration');
      const article = {...source, seo: {...source.seo, internalLinkTargets: ${JSON.stringify(targets)}}};
      console.log(JSON.stringify(${JSON.stringify(locales)}.map(locale => ({locale, html: renderToStaticMarkup(React.createElement(NewsDetailPage, {slug: article.slug, locale, market: 'BR', product: 'spot', initialArticles: [article]}))}))));
    `);
    execFileSync(path.join(root, 'node_modules/.bin/esbuild'), [entry, '--bundle', '--platform=node', '--format=cjs', `--outfile=${bundle}`, '--loader:.css=empty', '--loader:.svg=text', '--loader:.webp=file', '--loader:.json=json', '--log-level=warning'], {cwd: root, stdio: 'pipe'});
    return JSON.parse(execFileSync('node', [bundle], {cwd: root, encoding: 'utf8', maxBuffer: 12 * 1024 * 1024}));
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
}

const decode = value => value.replaceAll('&amp;', '&');

test('related research labels render complete copy in all 15 locales without changing destination or decision context', async () => {
  const pages = await renderRelatedResearch();
  assert.equal(pages.length, 15);
  for (const {locale, html} of pages) {
    const links = [...html.matchAll(/<a\b([^>]*data-cta-placement="news-detail-related-research"[^>]*)>(.*?)<\/a>/gs)];
    const article = feed.articles.find((entry) => entry.slug === 'okx-usd-to-usdc-spot-pair-migration');
    const expectedLinks = articleRelatedLinks(article, locale);
    assert.equal(links.length, expectedLinks.length, locale);
    const labels = links.map(([, , body]) => body.match(/<span>(.*?)<\/span>/s)?.[1]);
    assert.ok(labels.every(label => typeof label === 'string' && label.trim() && !/undefined|null/.test(label)), `${locale}: ${labels.join(' | ')}`);
    assert.deepEqual(links.map(([, attrs]) => decode(attrs.match(/href="([^"]+)"/)[1])), expectedLinks.map(({href}) => contextualHref(href, {locale, market: 'BR', product: 'spot'})), `${locale}: exact hrefs and context`);
    if (locale === 'zh-Hans') assert.equal(labels[0], 'OKX 档案');
    if (locale === 'zh-Hant') assert.equal(labels[0], 'OKX 檔案');
  }
});
