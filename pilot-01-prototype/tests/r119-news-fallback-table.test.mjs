import { committedFileHash } from './r100-test-contracts.mjs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import worker from '../worker/index.js';
import {localizedPath} from '../src/data/locale-routing.js';


import { existsSync } from 'node:fs';

const baselineUrl=new URL('../../../r118-r110-visual/promotion-runtime-r118-20261005/worker/index.js', import.meta.url);
const baseline=existsSync(baselineUrl)?(await import(baselineUrl)).default:null;
const locales = ['en','zh-Hans','zh-Hant','ja','ko','es','pt-BR','fr','de','tr','ru','ar','id','vi','it'];
const slug = 'r119-fallback-table-fixture';
const table = '| Check | Meaning | Action | Unknown |\n| --- | --- | --- | --- |\n| first-cell | second-cell | third-cell | last-cell |';
const article = { slug, status:'PUBLISHED', searchPublished:false,
  title:Object.fromEntries(locales.map(locale=>[locale,`${locale} Table fixture`])),
  summary:Object.fromEntries(locales.map(locale=>[locale,`Fixture summary\n\n${table}\n\n${table}`])),
  content:Object.fromEntries(locales.map(locale=>[locale,`## Evidence\n\n${table}\n\n${table}`])),
  publishedAt:'2026-10-05T00:00:00Z', sources:[], relatedVenues:['bitget'] };
const feed = JSON.stringify({articles:[article]});
const shell = '<!doctype html><html><head><title>Shell</title></head><body><div id="root"></div></body></html>';
function assets(locale, mode) {
  const requests=[], responses=[];
  const record=(path,response)=>{ responses.push({path,status:response.status}); return response; };
  return { requests, responses, async fetch(request) {
    const path = new URL(request.url).pathname; requests.push(path);
    if(path==='/index.html') return new Response(shell,{headers:{'content-type':'text/html'}});
    if(path==='/content/news-feed.json') return new Response(feed,{headers:{'content-type':'application/json'}});
    if(path==='/content/news-feed.sha256.txt') return new Response(createHash('sha256').update(feed).digest('hex'));
    if(path==='/prerender-manifest.json') {
      if(mode==='unavailable') return record(path,new Response('missing',{status:404}));
      return record(path,Response.json({version:'nexualpha-prerender-v1',routes:{[`/news/${slug}|${locale}`]:{asset:'/prerender/stale.json',newsFeedFingerprint:['coherent','asset-unavailable'].includes(mode) ? createHash('sha256').update(feed).digest('hex') : 'stale',newsArticles:[article]}}}));
    }
    if(path==='/prerender/stale.json') return record(path,mode==='asset-unavailable' ? new Response('missing',{status:404}) : Response.json({html:mode==='coherent' ? '<main><h1>Coherent original body</h1></main>' : '<h1>STALE BODY MUST NOT APPEAR</h1>',newsFeedFingerprint:mode==='coherent' ? createHash('sha256').update(feed).digest('hex') : 'stale',newsArticles:[article]}));
    return new Response('missing',{status:404});
  }};
}
function select(html,re) { const match=html.match(re); assert.ok(match,`missing ${re}`); return match[0]; }
for(const mode of ['mismatch','unavailable','asset-unavailable']) for(const locale of locales) test(`${mode}: ${locale} Worker HTTP fallback keeps 4 columns, local keyboard region and SEO parity`,{skip:!baseline&&'Original Worker baseline is absent; live fallback checks still run'},async()=>{
  const request=()=>new Request(`https://nexualpha.com${localizedPath(`/news/${slug}`,locale)}`,{headers:{accept:'text/html'}});
  const afterAssets=assets(locale,mode);
  const after=await worker.fetch(request(),{ASSETS:afterAssets}); const html=await after.text();
  const before=await baseline.fetch(request(),{ASSETS:assets(locale,mode==='mismatch' ? 'unavailable' : mode)});const old=await before.text();
  assert.equal(after.status,200);assert.equal(before.status,200);
  assert.match(html,/data-nexualpha-ssr-fallback="news-detail"/);
  assert.match(html,/data-nexualpha-client-render="true"/);
  assert.ok(!html.includes('STALE BODY MUST NOT APPEAR'));
  assert.equal(afterAssets.requests.filter(path=>path==='/prerender-manifest.json').length,mode==='unavailable' ? 2 : 1);
  assert.deepEqual(afterAssets.responses.filter(row=>row.path==='/prerender-manifest.json'),Array.from({length:mode==='unavailable' ? 2 : 1},()=>({path:'/prerender-manifest.json',status:mode==='unavailable' ? 404 : 200})));
  if(mode==='asset-unavailable') {
    assert.equal(afterAssets.requests.filter(path=>path==='/prerender/stale.json').length,1,'matching fingerprint must reach the absent asset');
    assert.deepEqual(afterAssets.responses.filter(row=>row.path==='/prerender/stale.json'),[{path:'/prerender/stale.json',status:404}]);
  } else {
    assert.equal(afterAssets.requests.includes('/prerender/stale.json'),false,'mismatch or absent manifest must short-circuit asset fetch');
  }
  assert.equal((html.match(/class="news-detail__table-scroll" role="region" aria-labelledby="news-table-hint-\d+" tabindex="0"/g)||[]).length,2);
  assert.equal((html.match(/<th scope="col">/g)||[]).length,8);
  for(const cell of ['first-cell','second-cell','third-cell','last-cell']) assert.equal((html.match(new RegExp(`<td>${cell}</td>`,'g'))||[]).length,2);
  const hints=[...html.matchAll(/<p class="news-detail__table-hint" id="(news-table-hint-\d+)">([^<]+)<\/p>/g)];
  assert.equal(hints.length,2);assert.notEqual(hints[0][1],hints[1][1]);
  assert.ok(hints[0][2]);if(locale!=='en')assert.ok(!hints[0][2].startsWith('Article table:'));
  assert.match(html,/<style data-news-fallback-tables>/);
  assert.match(html,/overflow-x:auto/);assert.match(html,/min-width:calc\(var\(--news-table-columns,4\)\*10rem\)/);
  for(const re of [/<link rel="canonical"[^>]*>/,/<meta name="robots"[^>]*>/,/<h1 class="news-detail__title">[^<]+<\/h1>/]) assert.equal(select(html,re),select(old,re));
  assert.equal(after.headers.get('x-robots-tag'),before.headers.get('x-robots-tag'));
  assert.match(html,/<meta name="robots" content="noindex,follow"/);
  const links=html=>[...html.matchAll(/\bhref="([^"]+)"/g)].map(x=>x[1]);assert.deepEqual(links(html),links(old));
});
for(const locale of ['en','zh-Hans']) test(`${locale}: coherent cached SSR remains intact without fallback styles`,async()=>{
  const response=await worker.fetch(new Request(`https://nexualpha.com${localizedPath(`/news/${slug}`,locale)}`,{headers:{accept:'text/html'}}),{ASSETS:assets(locale,'coherent')});
  const html=await response.text(); assert.equal(response.status,200);
  assert.ok(html.includes('<h1>Coherent original body</h1>'));
  assert.ok(!html.includes('data-nexualpha-ssr-fallback')); assert.ok(!html.includes('data-news-fallback-tables'));
});
test('React and Worker table guidance keeps supported locale parity and reviewed wording',()=>{
  const reactSource=readFileSync(new URL('../src/components/v3/news/NewsDetailPage.jsx',import.meta.url),'utf8');
  const workerSource=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
  const mapping=(source,name)=>JSON.parse(JSON.stringify(runInNewContext('('+source.split(`const ${name} = `)[1].split('\n};')[0]+'\n})')));
  const workerHints=mapping(workerSource,'newsTableScrollHints');
  const reactHints=mapping(reactSource,'tableScrollHints');
  assert.deepEqual(Object.keys(workerHints).sort(),Object.keys(reactHints).sort());
  // Urdu remains marked for native review in both owners; equivalent wording differs.
  for(const locale of Object.keys(workerHints)) {
    if(locale==='ur') {
      for(const hint of [workerHints[locale],reactHints[locale]]) {
        assert.match(hint,/\p{Script=Arabic}/u);
        assert.doesNotMatch(hint,/Article table:/);
      }
    } else assert.equal(workerHints[locale],reactHints[locale],locale);
  }
});
test('protected invitation registry bytes remain the project constitutional pin',()=>{
  const sha=createHash('sha256').update(readFileSync(new URL('../src/data/partner-registry.js',import.meta.url))).digest('hex');
  assert.equal(sha,committedFileHash('src/data/partner-registry.js'));
});

test('separator-only Markdown table cannot throw in Worker HTTP fallback',async()=>{
  const fixture={...article,content:{en:'| --- | --- |\n| --- | --- |'}};
  const fallback=assets('en','unavailable');
  const response=await worker.fetch(new Request(`https://nexualpha.com/news/${slug}`,{headers:{accept:'text/html'}}),{ASSETS:{async fetch(request){
    if(new URL(request.url).pathname==='/content/news-feed.json')return Response.json({articles:[fixture]});
    return fallback.fetch(request);
  }}});
  const html=await response.text();assert.equal(response.status,200);
  assert.match(html,/data-nexualpha-ssr-fallback="news-detail"/);
  assert.match(html,/<thead><tr><\/tr><\/thead><tbody><\/tbody>/);
  assert.match(html,/<meta name="robots" content="noindex,follow"/);
});
