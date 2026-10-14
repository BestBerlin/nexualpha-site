// Local SSR QA only. Snapshots are recorded from public NexuAlpha endpoints, never synthetic metrics.
import { createServer as httpServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import { createServer } from '../pilot-01-prototype/node_modules/vite/dist/node/index.js';
const root = path.resolve(process.argv[2] || 'pilot-01-prototype');
const port = Number(process.argv[3] || 4319);
const evidence = path.resolve('docs/evidence/ui-to-spec');
const locales = ['zh-Hans','en','tr','ru','ar'];
let feeds;
try { feeds = JSON.parse(await readFile(`${evidence}/recorded-feeds.json`, 'utf8')); }
catch {
  feeds = { flash: {} };
  for (const type of ['ticker','movers']) {
    const response = await fetch(`https://nexualpha.com/api/${type}.json`);
    feeds[type] = response.ok ? await response.json() : null;
  }
  for(const locale of locales) {
    const response = await fetch(`https://nexualpha.com/api/flash.json?locale=${locale}&limit=5`);
    feeds.flash[locale] = response.ok ? await response.json() : null;
  }
  await writeFile(`${evidence}/recorded-feeds.json`, JSON.stringify(feeds,null,2));
}
const built = process.env.QA_BUILT === '1';
const vite = built ? null : await createServer({root,appType:'custom',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]}});
const {render} = built ? await import(pathToFileURL(path.join(root,'dist/news-ssr/entry-server.js'))) : await vite.ssrLoadModule('/src/entry-server.jsx');
const observerSource = await readFile(path.resolve('tools/ui-to-spec-observer.js'),'utf8');
const template = (await readFile(path.join(root,built?'dist/client/index.html':'index.html'),'utf8')).replace('<head>', `<head><script>${observerSource}</script>`);
const server = httpServer(async(req,res)=>{
 const url = new URL(req.url,'http://localhost');
 const locale = url.pathname.split('/')[1] === 'zh-hans' ? 'zh-Hans' : locales.includes(url.pathname.split('/')[1]) ? url.pathname.split('/')[1] : 'en';
 if (/^\/api\/(ticker|movers|flash)\.json$/.test(url.pathname)) {
  const key = url.pathname.split('/')[2].split('.')[0];
  const data = key === 'flash' ? feeds.flash[url.searchParams.get('locale') || locale] : feeds[key];
  res.writeHead(data ? 200 : 503,{'content-type':'application/json'});res.end(JSON.stringify(data || {status:'unavailable'}));return;
 }
 if (url.pathname === '/' || /^\/(zh-hans|en|tr|ru|ar)\/?$/.test(url.pathname)) {
  try {
   const options = {ticker:feeds.ticker,movers:feeds.movers,flash:feeds.flash[locale]};
   const html = render(url.pathname,options);
   const state = JSON.stringify({pathname:url.pathname,locale,...options}).replace(/</g,'\\u003c');
   const doc = template.replace('<div id="root"></div>',`<div id="root">${html}</div><script type="application/json" id="nexualpha-prerender-state">${state}</script>`);
   res.writeHead(200,{'content-type':'text/html'});res.end(built ? doc : await vite.transformIndexHtml(url.pathname,doc));
  } catch(error){ res.writeHead(500);res.end(error.stack); }
  return;
 }
 if(built) {
  const file=path.resolve(root,'dist/client','.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(path.join(root,'dist/client')+'/')){res.writeHead(403);res.end();return;}
  try{const content=await readFile(file);const ext=path.extname(file);res.writeHead(200,{'content-type':({'.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.webp':'image/webp','.avif':'image/avif'})[ext]||'application/octet-stream'});res.end(content);}catch{res.writeHead(404);res.end('Unavailable in local QA preview');}
 } else vite.middlewares(req,res,()=>{res.writeHead(404);res.end('Unavailable in local QA preview');});
});
server.listen(port,'127.0.0.1',()=>console.log(`Recorded-feed SSR preview http://127.0.0.1:${port}`));
const close=async()=>{server.close();await vite?.close();process.exit(0)};
process.on('SIGINT',close);process.on('SIGTERM',close);
