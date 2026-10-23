// Offline SSR handoff: same Worker + built renderer as deployment, no listening server.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.js';
import { render } from '../dist/news-ssr/entry-server.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const assets = path.join(root, 'dist/client');
const out = path.join(root, 'docs/evidence/inner-visual-v3');
const feed = JSON.parse(await readFile(path.join(root, 'public/content/news-feed.json'), 'utf8'));
const article = feed.articles.find(a => a.slug === 'kraken-crypto-withdrawal-network-address-confirmation-checklist' && a.status === 'PUBLISHED' && a.content?.en && a.content?.['zh-Hans']);
if (!article) throw new Error('No existing bilingual published article');
const routes = [
  ['/zh-hans/exchanges/bitget', 'venue-bitget-zh'],
  ['/exchanges/okx', 'venue-okx-en'],
  ['/zh-hans/exchanges/okx', 'venue-okx-zh'],
  ['/ar/exchanges/okx', 'venue-okx-ar'],
  [`/news/${article.slug}`, 'article-en'],
  [`/zh-hans/news/${article.slug}`, 'article-zh'],
  ['/news/how-to-onboard-gate-with-kyc-fund-password-whitelist-and-cooldown-checks', 'article-gate-en'],
  ['/zh-hans/news/how-to-onboard-gate-with-kyc-fund-password-whitelist-and-cooldown-checks', 'article-gate-zh'],
  ['/compare/binance-vs-okx', 'compare-binance-okx-en'],
  ['/zh-hans/compare/binance-vs-okx', 'compare-binance-okx-zh'],
  ['/ar/compare/binance-vs-okx', 'compare-binance-okx-ar'],
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
  // Optional static review fallback when the Node preview's listen() is sandbox-blocked.
  // These generated files keep the real route URL so the built client hydrates the same SSR page.
  if (process.argv.includes('--browser-assets')) {
    const routeDir = path.join(assets, route);
    await mkdir(routeDir, { recursive: true });
    // Review-only instrumentation, outside React's root. The archived SSR HTML above stays exact.
    const metrics = '<script>document.documentElement.dataset.innerVisualCls="0";document.documentElement.dataset.innerVisualShifts="[]";new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput){document.documentElement.dataset.innerVisualCls=String(Number(document.documentElement.dataset.innerVisualCls)+entry.value);const shifts=JSON.parse(document.documentElement.dataset.innerVisualShifts);shifts.push({value:entry.value,sources:entry.sources.map(s=>({node:s.node?.className||s.node?.nodeName,previous:s.previousRect,current:s.currentRect}))});document.documentElement.dataset.innerVisualShifts=JSON.stringify(shifts)}}).observe({type:"layout-shift",buffered:true});</script>';
    await writeFile(path.join(routeDir, 'index.html'), html.replace('<head>', () => '<head>' + metrics));
  }
  records.push({ route, file: file + '.html', status: response.status, bytes: Buffer.byteLength(html), render: response.headers.get('x-nexualpha-news-render') });
}
await writeFile(path.join(out, 'ssr-manifest.json'), JSON.stringify({ renderer: 'built Worker + dist/news-ssr/entry-server.js', article: article.slug, routes: records }, null, 2) + '\n');
console.log(JSON.stringify(records, null, 2));
