// No browser/server: capture the production SSR renderer and built route CSS for lead review.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { render } from '../dist/ssr/entry-server.js';
import { applyRouteStyles } from '../worker/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = path.join(root, 'docs/evidence/footer-redesign');
await mkdir(output, { recursive: true });
const shell = await readFile(path.join(root, 'dist/client/index.html'), 'utf8');
const routeStyles = JSON.parse(await readFile(path.join(root, 'dist/client/route-styles.json'), 'utf8'));
const feed = JSON.parse(await readFile(path.join(root, 'public/content/news-feed.json'), 'utf8'));
const articles = feed.articles || feed;
const article = articles.find(row => row.status === 'PUBLISHED' && row.content?.en && row.title?.en);
assert.ok(article, 'use an existing published article, never a synthetic fixture');
const routes = [
  ['home-en', '/', 'en'], ['home-zh-hans', '/zh-hans', 'zh-Hans'], ['home-ar', '/ar', 'ar'],
  ['venue-bitget', '/exchanges/bitget', 'en'], ['article-en', `/news/${article.slug}`, 'en'],
];
const manifest = [];
for (const [name, url, locale] of routes) {
  const markup = render(url, { newsArticles: articles });
  assert.match(markup, /class="nx-ftr"/);
  let html = shell.replace(/<html\b[^>]*>/, () => `<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}">`)
    .replace(/<div id="root">[\s\S]*?<\/div>/, () => `<div id="root">${markup}</div>`);
  html = applyRouteStyles(html, routeStyles, new URL(url, 'https://nexualpha.com'));
  // Static evidence: never execute hydration or request runtime feeds on opening the saved file.
  html = html.replace(/<script\b[^>]*\bsrc="[^"]+"[^>]*>[\s\S]*?<\/script>/g, () => '')
    .replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, () => '');
  const dom = new JSDOM(html);
  const styles = [...dom.window.document.querySelectorAll('link[rel=stylesheet]')].map(link => link.getAttribute('href'));
  const css = (await Promise.all(styles.map(href => readFile(path.join(root, 'dist/client', href), 'utf8')))).join('\n');
  assert.ok(css.includes('.nx-ftr__socials') && css.includes('.nx-ftr__languages'), `${url}: footer CSS linked before hydration`);
  if (name.startsWith('home')) assert.ok(css.includes('.nx-close__panel') && css.includes('.research-library__cards'), `${url}: closing/research CSS linked before hydration`);
  assert.equal(dom.window.document.querySelectorAll('.nx-ftr__column').length, 4);
  const title = dom.window.document.querySelector('h1')?.textContent.trim();
  assert.ok(title && !/page not found/i.test(title), `${url}: real route content`);
  dom.window.close();
  await writeFile(path.join(output, `${name}.html`), html);
  manifest.push({ file: `${name}.html`, url, locale, h1: title, bytes: Buffer.byteLength(html), sha256: createHash('sha256').update(html).digest('hex'), stylesheets: styles });
}
const vn = new JSDOM(render('/?market=VN', { newsArticles: articles }));
assert.equal(vn.window.document.querySelector('.nx-close__partners small'), null, 'built App forwards VN market');
vn.window.close();
await writeFile(path.join(output, 'ssr-manifest.json'), JSON.stringify({ renderer: 'dist/ssr/entry-server.js', browserOpened: false, routeCssVerified: true, routes: manifest }, null, 2) + '\n');
console.log(`Saved ${manifest.length} real SSR documents; footer CSS present on every route; built VN promotion gate passed.`);
