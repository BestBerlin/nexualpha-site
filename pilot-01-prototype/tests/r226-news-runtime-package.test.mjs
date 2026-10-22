import { loopbackUnavailableReason } from './sandbox-network.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../dist/server/index.js", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { createProductionServer: createProductionServer } = await import("../server.mjs");
const root=fileURLToPath(new URL('../',import.meta.url));
const run=promisify(execFile);
const slug='kraken-crypto-withdrawal-network-address-confirmation-checklist';
test('clean isolated runtime imports and renders actual article without node_modules or external fetch',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'r226-news-runtime-'));
 try {
  await cp(path.join(root,'dist/news-ssr'),path.join(dir,'news-ssr'),{recursive:true});
  await writeFile(path.join(dir,'package.json'),'{"type":"module"}');
  const feed=JSON.parse(await readFile(path.join(root,'public/content/news-feed.json'),'utf8'));
  await writeFile(path.join(dir,'article.json'),JSON.stringify(feed.articles.find(a=>a.slug===slug)));
  const code=`globalThis.fetch=()=>{throw new Error('External network forbidden')};const {readFile}=await import('node:fs/promises');const {render}=await import(${JSON.stringify(pathToFileURL(path.join(dir,'news-ssr/entry-server.js')).href)});const article=JSON.parse(await readFile(${JSON.stringify(path.join(dir,'article.json'))},'utf8'));const html=render('https://nexualpha.com/ar/news/${slug}',{newsArticles:[article]});if(!html.includes('news-detail__first-decision')||!html.includes('data-news-content-locale="en"'))throw new Error('Runtime parity absent');console.log('OFFLINE_ISOLATED_RUNTIME_PASS');`;
  const result=await run(process.execPath,['--input-type=module','-e',code],{cwd:dir,timeout:15000});
  assert.match(result.stdout,/OFFLINE_ISOLATED_RUNTIME_PASS/);
 } finally {await rm(dir,{recursive:true,force:true});}
});
test('actual production Node HTTP adapter renders prefix locale with full SSR instead of old fallback',async(t)=>{
 const unavailable=await loopbackUnavailableReason();if(unavailable){t.skip(unavailable);return;}
 const server=await createProductionServer({appRoot:root,env:{NODE_ENV:'test'}});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try {
  const port=server.address().port;
  for(const locale of ['ar','ja','ko','tr']){
   const response=await fetch(`http://127.0.0.1:${port}/${locale}/news/${slug}`);
   const html=await response.text();assert.equal(response.status,200);
   assert.equal(response.headers.get('x-nexualpha-news-render'),'runtime');
   assert.match(html,new RegExp(`<html[^>]*lang="${locale}"`));
   assert.ok(html.includes('news-detail__first-decision'));
   assert.ok(!html.includes('data-nexualpha-ssr-fallback'));
   assert.match(html,/name="robots" content="noindex,follow"/);
   assert.match(html,/data-news-content-locale="en"/);
   assert.match(html,/<title\b[^>]*>[^<]+<\/title>/);
  }
 } finally {await new Promise(resolve=>server.close(resolve));}
});

test('actual local Sites preview adapter follows the same prefix SSR path',async(t)=>{
 const unavailable=await loopbackUnavailableReason();if(unavailable){t.skip(unavailable);return;}
 const allocator=createServer();allocator.listen(0,'127.0.0.1');await once(allocator,'listening');
 const port=allocator.address().port;await new Promise(resolve=>allocator.close(resolve));
 const child=spawn(process.execPath,['server/local-sites-preview.mjs'],{cwd:root,env:{...process.env,PORT:String(port),HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
 try {
  await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(new Error('preview readiness timeout')),10000);child.stdout.on('data',chunk=>{out+=chunk;if(out.includes('listening on')){clearTimeout(timer);resolve();}});child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',code=>{if(!out.includes('listening on')){clearTimeout(timer);reject(new Error('preview exit '+code));}});});
  for(const locale of ['ar','ja','ko','tr']){
   const response=await fetch(`http://127.0.0.1:${port}/${locale}/news/${slug}`);
   const html=await response.text();assert.equal(response.status,200);
   assert.equal(response.headers.get('x-nexualpha-news-render'),'runtime');
   assert.match(html,new RegExp(`<html[^>]*lang="${locale}"`));assert.ok(html.includes('news-detail__first-decision'));
   assert.match(html,/data-news-content-locale="en"/);assert.match(html,/name="robots" content="noindex,follow"/);
  }
 } finally {child.kill('SIGTERM');await once(child,'exit');}
});
}
