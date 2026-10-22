#!/usr/bin/env node
// Offline Worker HTML + static import graphs, not observed browser transfers.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import worker from '../worker/index.js';
import { createNewsSsrRenderer } from '../server/news-ssr.mjs';

const root = path.resolve('dist/client');
const shell = await readFile(path.join(root, 'index.html'), 'utf8');
const entry = /<script\b[^>]*type="module"[^>]*src="([^"]+)"/.exec(shell)?.[1];
const entrySource = await readFile(path.join(root, entry), 'utf8');
const table = JSON.parse(entrySource.match(/m\.f\|\|\(m\.f=(\[[^\]]*\])/)[1]);
const feed = JSON.parse(await readFile(path.join(root, 'content/news-feed.json'), 'utf8'));
const articles = Array.isArray(feed) ? feed : feed.articles || feed.items;
const article = articles.find((item) => (item.locale === 'en' || item.language === 'en') && item.slug && item.seo?.noindex === false) || articles.find((item) => item.slug && item.seo?.noindex === false);
if (!article) throw new Error('No published article to measure');
export const measuredPaths = ['/', '/zh-hans', '/exchanges/bitget', `/news/${article.slug}`, '/compare/binance-vs-okx', '/tokenized-stocks', '/funding-rates'];
const assets = { async fetch(request) {
  const pathname = new URL(request.url).pathname;
  try { return new Response(await readFile(path.join(root, pathname)), { headers: { 'content-type': pathname.endsWith('.json') ? 'application/json' : 'text/html' } }); }
  catch { return new Response('missing', { status: 404 }); }
} };
const env = { ASSETS: assets, NEWS_SSR_RENDER: createNewsSsrRenderer(path.resolve('dist')) };
// Sample routes use the application's existing hydration module policy.
const { modulePathsForRoute } = await import('../src/data/route-module-cache.js');
const names = ['home', 'home', 'venue', 'newsDetail', 'compare', 'tokenizedStocksHub', 'fundingRates'];
const rows = [];
for (const [index, pathname] of measuredPaths.entries()) {
  const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: 'text/html' } }), env);
  if (response.status !== 200) throw new Error(`${pathname}: HTTP ${response.status}`);
  const html = await response.text();
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const sheets = [...new Set([...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => link.getAttribute('href')))];
  const roots = [entry];
  const route = { name: names[index] };
  for (const module of modulePathsForRoute(route, pathname)) {
    const escaped = module.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = entrySource.match(new RegExp(`"${escaped}":\\(\\)=>\\w+\\(\\(\\)=>import\\("\\./([\\w.-]+\\.js)"\\)(?:\\.then\\([^)]*\\))?,__vite__mapDeps\\(\\[([\\d,]*)\\]\\)`));
    if (!match) {
      const prefix = path.basename(module).replace(/\.[^.]+$/, '') + '-';
      const candidates = (await readdir(path.join(root, 'assets'))).filter((file) => file.startsWith(prefix) && file.endsWith('.js'));
      if (candidates.length !== 1) throw new Error(`No unique built loader for ${module}`);
      roots.push('/assets/' + candidates[0]);
      continue;
    }
    roots.push(`/assets/${match[1]}`, ...match[2].split(',').filter(Boolean).map((number) => `/${table[Number(number)].replace(/^\//, '')}`));
  }
  const js = new Map();
  for (const href of roots) {
    if (!href.endsWith('.js') || js.has(href)) continue;
    const body = await readFile(path.join(root, href));
    js.set(href, body);
    for (const match of body.toString().matchAll(/import(?:\s*[^;"']*?from\s*)?\s*"\.\/([\w-]+\.js)"/g)) roots.push(`/assets/${match[1]}`);
  }
  const css = await Promise.all(sheets.map((href) => readFile(path.join(root, href))));
  const sizes = (values) => ({ bytes: values.reduce((sum, body) => sum + body.length, 0), gzipBytes: values.reduce((sum, body) => sum + gzipSync(body, { level: 6 }).length, 0) });
  const app = document.getElementById('root');
  if (!app?.querySelector('h1') || !document.getElementById('nexualpha-prerender-state')) throw new Error(`${pathname}: SSR content missing`);
  rows.push({ pathname, cssRequests: sheets.length, css: sizes(css), jsRequests: js.size, js: sizes([...js.values()]), modulepreloads: document.querySelectorAll('link[rel="modulepreload"]').length, inlineCriticalBytes: Buffer.byteLength(document.querySelector('[data-nexualpha-critical]')?.textContent || ''), ssrSha256: createHash('sha256').update(app.innerHTML).digest('hex'), sheets });
  dom.window.close();
}
const output = JSON.stringify({ method: 'Worker SSR links and entry + route preload static JS closure; raw and per-file gzip level 6 estimates; no browser network or CLS measurement', rows }, null, 2) + '\n';
const outputIndex = process.argv.indexOf('--output');
if (outputIndex !== -1) await writeFile(process.argv[outputIndex + 1], output);
else process.stdout.write(output);
