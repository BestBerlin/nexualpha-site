import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../worker/index.js';
import {localizedPath} from '../src/data/locale-routing.js';
const base = new URL('../dist/client/', import.meta.url);
const slug='fsb-bis-stablecoin-arrangements-implementation-risk-map';
for(const locale of ['en','zh-Hans']) test(`coherent news SSR preserves exact body in hydration state: ${locale}`, async()=>{
 const manifest=JSON.parse(await readFile(new URL('prerender-manifest.json',base),'utf8'));
 const row=manifest.routes[`/news/${slug}|${locale}`];
 const payload=JSON.parse(await readFile(new URL(row.asset.slice(1),base),'utf8'));
 const assets={async fetch(request){try{return new Response(await readFile(new URL(new URL(request.url).pathname.slice(1),base)),{headers:{'content-type':'application/json'}});}catch{return new Response('missing',{status:404});}}};
 const response=await worker.fetch(new Request(`https://nexualpha.com${localizedPath(`/news/${slug}`,locale)}`,{headers:{accept:'text/html'}}),{ASSETS:assets});
 const html=await response.text(); assert.equal(response.status,200);
 const state=JSON.parse(html.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)[1]);
 assert.deepEqual(state.newsArticles[0].content,payload.newsArticles[0].content);
 assert.ok(Object.values(state.newsArticles[0].content).some(text=>/\[[^\]]+\]\(https?:/.test(text)),'fixture contains literal Markdown source links');
 assert.ok(html.includes('id="policy"')); assert.ok(!html.includes('data-client-render="true"'));
});
