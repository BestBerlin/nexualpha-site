import assert from 'node:assert/strict';
import test, { after } from 'node:test';
const originalNow=Date.now;Date.now=()=>1791187200000;after(()=>{Date.now=originalNow;});
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import worker from '../worker/index.js';
import { render } from '../dist/ssr/entry-server.js';
import React from 'react';
import { renderToString } from 'react-dom/server';
const newsChunk=(await readdir(new URL('../dist/ssr/assets/',import.meta.url))).find(name=>/^route-news-detail-.*\.js$/.test(name));
const actualNewsComponent=(await import(new URL('../dist/ssr/assets/'+newsChunk,import.meta.url)))._.NewsDetailPage;
assert.equal(typeof actualNewsComponent,'function');
import { NEWS_DISPLAY_LOCALES, localizedNewsTitle } from '../src/data/news-feed-client.js';
import { computeRouteSeo as baselineSeo } from '../../../r217-first-decision-hierarchy/candidate/src/data/seo-injection.js';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import { localizedHref } from '../src/data/locale-routing.js';
const feedText=await readFile(new URL('../public/content/news-feed.json',import.meta.url),'utf8');
const articles=JSON.parse(feedText).articles.filter(a=>a.status==='PUBLISHED');
const slug='kraken-crypto-withdrawal-network-address-confirmation-checklist';
const article=articles.find(a=>a.slug===slug);assert.ok(article);
const fingerprint=createHash('sha256').update(feedText).digest('hex');
const shell='<!doctype html><html lang="en"><head><title>old</title></head><body><div id="root"></div></body></html>';
function envFor(mode='missing',renderNews=render){return {
 NEWS_SSR_RENDER:renderNews,
 ASSETS:{async fetch(request){const path=new URL(request.url).pathname;
 if(path==='/content/news-feed.json')return new Response(feedText);
 if(path==='/content/news-feed.sha256.txt')return new Response(fingerprint);
 if(path==='/prerender-manifest.json')return new Response(JSON.stringify({routes:mode==='stale'?{[`/news/${slug}|ar`]:{html:'STALE_BODY',newsFeedFingerprint:'0'.repeat(64)}}:{}}));
 if(path==='/index.html')return new Response(shell,{headers:{'content-type':'text/html'}});
 return new Response('missing',{status:404});
 }}
};}
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
for(const locale of NEWS_DISPLAY_LOCALES){test(`actual Worker prefix ${locale} uses actual React decision/body and immutable owner boundary`,async()=>{
 const url=new URL(localizedHref(`/news/${slug}`,{locale}),'https://nexualpha.com').href;
 const response=await worker.fetch(new Request(url,{headers:{accept:'text/html'}}),envFor());
 const html=await response.text();assert.equal(response.status,200);
 assert.match(html,new RegExp(`<html[^>]*lang="${locale}"`));
 assert.ok(html.includes(`<h1 class="news-detail__title">${escape(localizedNewsTitle(article,locale))}</h1>`));
 assert.ok(html.includes('news-detail__first-decision'));
 const actual=render(url,{newsArticles:[article]});
 assert.ok(html.includes(`<div id="root">${actual}</div>`),'full real React output, not a second template');
 const state=JSON.parse(html.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)[1]);
 assert.equal(state.locale,locale);
 const projectedRender=renderToString(React.createElement(actualNewsComponent,{slug,locale,initialArticles:state.newsArticles}));
 assert.equal(projectedRender,actual.match(/<main class="v2-page v3-page news-detail-page"[\s\S]*?<\/main>/)[0],'actual news component with raw hydration projection preserves SSR article, source text and links');
 if(!['en','zh-Hans'].includes(locale)){
 assert.match(html,/name="robots" content="noindex,follow"/);
 assert.match(html,new RegExp(`rel="canonical" href="https://nexualpha.com/${locale==='zh-Hant'?'zh-hans/':''}news/${slug}"`));
 assert.match(html,/news-detail__translation-note/);
 assert.match(html,new RegExp(`data-news-content-locale="${locale==='zh-Hant'?'zh-Hans':'en'}"`));
 }
 const client=computeRouteSeo({url,locale,article});
 assert.equal(html.match(/<title\b[^>]*>([^<]+)<\/title>/)[1],escape(client.title));
 assert.ok(html.includes(`name="description" content="${escape(client.description).replaceAll("&#x27;", "'")}"`));
 assert.ok(html.includes(`rel="canonical" href="${escape(client.canonical)}"`));
 assert.ok(html.includes(`name="robots" content="${client.robots}"`));
 assert.equal(client.htmlLocale,locale);
 const baseline=baselineSeo({url,locale,article});
 for(const key of ['canonical','robots','schemas','alternates','locale','status'])assert.deepEqual(client[key],baseline[key],`original ${key} truth boundary ${locale}`);
});}
test('query redirect retains locale and stale fingerprint never admits stale body',async()=>{
 const query=await worker.fetch(new Request(`https://nexualpha.com/news/${slug}?locale=ar`,{headers:{accept:'text/html'}}),envFor());
 assert.equal(query.status,308);assert.equal(query.headers.get('location'),`https://nexualpha.com/ar/news/${slug}`);
 const response=await worker.fetch(new Request(query.headers.get('location'),{headers:{accept:'text/html'}}),envFor('stale'));
 const html=await response.text();assert.ok(!html.includes('STALE_BODY'));assert.ok(html.includes('news-detail__first-decision'));assert.match(html,/<html[^>]*lang="ar"/);
});

test('renderer failure degrades explicitly; safe portable assets-only fallback is retained',async()=>{
 const response=await worker.fetch(new Request(`https://nexualpha.com/ar/news/${slug}`,{headers:{accept:'text/html'}}),envFor('missing',()=>{throw new Error('offline runtime missing');}));
 const html=await response.text();assert.equal(response.status,200);
 assert.equal(response.headers.get('x-nexualpha-news-render'),'fallback');
 assert.ok(html.includes('data-nexualpha-ssr-fallback="news-detail"'));
 assert.match(html,/name="robots" content="noindex,follow"/);
 assert.ok(!html.includes('news-detail__first-decision'),'failure does not falsely claim full runtime parity');
});
