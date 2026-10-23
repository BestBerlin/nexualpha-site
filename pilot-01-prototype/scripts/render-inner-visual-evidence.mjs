// Offline SSR handoff: same Worker + built renderer as deployment, no listening server.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.js';
import { render } from '../dist/news-ssr/entry-server.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const assets = path.join(root, 'dist/client');
const out = path.join(root, 'docs/evidence/inner-visual-v2');
const feed = JSON.parse(await readFile(path.join(root, 'public/content/news-feed.json'), 'utf8'));
const article = feed.articles.find(a => a.slug === 'how-to-onboard-gate-with-kyc-fund-password-whitelist-and-cooldown-checks' && a.status === 'PUBLISHED' && a.content?.en && a.content?.['zh-Hans']);
if (!article) throw new Error('No existing bilingual published article');
const routes = [
  ['/zh-hans/exchanges/bitget', 'venue-bitget-zh'],
  ['/exchanges/okx', 'venue-okx-en'],
  [`/news/${article.slug}`, 'article-en'],
  [`/zh-hans/news/${article.slug}`, 'article-zh'],
  ['/compare/binance-vs-okx', 'compare-binance-okx-en'],
];
await mkdir(out, { recursive: true });
const records = [];
for (const [route, file] of routes) {
  const response = await worker.fetch(new Request('https://nexualpha.com' + route, { headers: { accept: 'text/html' } }), {
    NEWS_SSR_RENDER: render,
    ASSETS: { async fetch(request) {
      const url = new URL(request.url);
      try {
        const text = await readFile(path.join(assets, url.pathname === '/' ? 'index.html' : url.pathname.slice(1)));
        return new Response(text, { headers: { 'content-type': url.pathname.endsWith('.json') ? 'application/json' : 'text/html' } });
      } catch { return new Response('Not found', { status: 404 }); }
    } },
  });
  const html = await response.text();
  if (response.status !== 200 || !html.includes('<h1') || html.includes('data-nexualpha-ssr-fallback')) throw new Error(`${route}: SSR failed (${response.status})`);
  await writeFile(path.join(out, file + '.html'), html);
  records.push({ route, file: file + '.html', status: response.status, bytes: Buffer.byteLength(html), render: response.headers.get('x-nexualpha-news-render') });
}
await writeFile(path.join(out, 'ssr-manifest.json'), JSON.stringify({ renderer: 'built Worker + dist/news-ssr/entry-server.js', article: article.slug, routes: records }, null, 2) + '\n');
console.log(JSON.stringify(records, null, 2));
