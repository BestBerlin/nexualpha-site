import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {validComparison} from '../src/data/browser-state.js';
const req=createRequire(new URL('../../../../pilot-01-prototype/package.json',import.meta.url));
const React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{transformSync}=req('esbuild');
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
const sources=[{id:'one',url:'https://agency.example/a?x=1&y=2',publisher:'Institutional Research Agency',title:'A long complete source title without shortening',publishedAt:null},{id:'two',url:'https://research.example/report#claim',publisher:'Research Office',title:'Source & methodology / 完整原文',publishedAt:'2026-10-01'}];
const article={slug:'cftc-fixture-no-venues',content:Object.fromEntries(locales.map(l=>[l,'Lead one.\n\nLead two.\n\nLead three.\n\nLead four.\n\nDeep preserved analysis.'])),title:'Fixture',categoryName:'Research',publishedAt:'2026-10-05',readTime:'2 min',author:'Fixture',sources,relatedVenues:[],seo:{internalLinkTargets:[]}};
const venueDatabase={binance:{slug:'binance'},okx:{slug:'okx'},bybit:{slug:'bybit'}};
const mocks={getNewsArticleBySlug:()=>article,venueDatabase,validComparison,OKX_USD_USDC_OWNER_CHECKLIST:{slug:'other'},resolveNewsContentLocale:l=>l,localizedValue:(v,l)=>typeof v==='object'?v[l]||v.en:v,localizedNewsTitle:()=> 'Fixture',localizedNewsSummary:()=> 'Summary',contextualHref:x=>x,BrandMark:()=>null,NextDecisionBridge:()=>null,OnsiteTelegramBotHandoff:()=>null,TopDecisionBox:({actions,sourceAction})=>React.createElement('div',null,[...actions,...(sourceAction?[sourceAction]:[])].map((a,i)=>React.createElement('a',{href:a.href,key:i},a.label)))};
function load(text){const module={exports:{}};vm.runInNewContext(transformSync(text+'\nexport {ArticleDecisionSummary, copy, priorityNewsDecisionSummaries};',{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,require:n=>n==='react'?React:mocks});return module.exports;}
const source=readFileSync(new URL('../src/components/v3/news/NewsDetailPage.jsx',import.meta.url),'utf8');
const Before=load(readFileSync(new URL('../../news-row-before/NewsDetailPage.jsx',import.meta.url),'utf8')),After=load(source);
const anchors=h=>[...h.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(m=>({attrs:m[1],text:m[2].replace(/<[^>]*>/g,'')}));
const section=h=>h.match(/<section class="news-detail__prose news-detail__sources"[\s\S]*?<\/section>/)?.[0];
for(const locale of locales)test(`${locale}: split complete sources into publisher/title hierarchy with exact links/text/attrs and direct source boundary`,()=>{
 const render=E=>renderToStaticMarkup(React.createElement(E.NewsDetailPage,{slug:article.slug,initialArticles:[article],locale}));const before=render(Before),after=render(After),old=section(before),next=section(after);assert.ok(old&&next);
 assert.deepEqual(anchors(next),anchors(old));assert.equal((next.match(/class="news-detail__source-title"/g)||[]).length,sources.length);assert.equal((next.match(/class="news-detail__source-meta"/g)||[]).length,sources.length);assert.equal((next.match(/translate="no" lang="en"/g)||[]).length,sources.length);
 const stack=[];for(const m of after.matchAll(/<details\b[^>]*>|<\/details>|<h2 id="article-sources">/g)){if(m[0].startsWith('<details'))stack.push(m[0]);else if(m[0]==='</details>')stack.pop();else assert.equal(stack.length,0);}
 assert.equal((after.match(/id="article-sources"/g)||[]).length,1);assert.match(after,/<details class="news-detail__article-disclosure">/);assert.ok(after.includes('Deep preserved analysis.'));assert.ok(after.includes(`data-news-content-locale="${locale}"`));
});
function actions(relatedVenues,targets=[],locale='en'){const a={...article,relatedVenues,seo:{internalLinkTargets:targets}};return anchors(renderToStaticMarkup(React.createElement(After.ArticleDecisionSummary,{article:a,locale,t:After.copy[locale],withContext:x=>x})));}
test('no venue article has only real source, no duplicate or misleading directory profile/comparison',()=>{assert.deepEqual(actions([]).map(a=>a.attrs.match(/href="([^"]*)"/)[1]),[sources[0].url.replaceAll('&','&amp;')]);});
test('valid single venue keeps profile without false comparison action',()=>{const a=actions(['binance']);assert.equal(a.length,2);assert.match(a[0].attrs,/href="\/exchanges\/binance"/);assert.equal(a[0].text,After.copy.en.claimBtn);});
test('existing supported comparison target is used before any related pair, preserves exact route',()=>{const a=actions(['binance','bybit'],['/compare/binance-vs-okx']);assert.ok(a.some(x=>x.attrs.includes('href="/compare/binance-vs-okx"')&&x.text===After.copy.en.compareBtn));assert.ok(!a.some(x=>x.attrs.includes('binance-vs-bybit')));});
test('unknown/repeated/malformed comparison targets never create comparison CTA; unknown first venue never profile',()=>{for(const targets of [['/compare/binance-vs-unknown'],['/compare/binance-vs-binance'],['https://bad.example/compare/binance-vs-okx'],['/compare/binance']]){const a=actions(['unknown','binance'],targets);assert.ok(!a.some(x=>x.text===After.copy.en.compareBtn));assert.ok(!a.some(x=>x.attrs.includes('/exchanges/unknown')));}});
test('two related venues without explicit supported internal target do not invent comparison URL',()=>{assert.ok(!actions(['binance','okx']).some(a=>a.attrs.includes('/compare/')));});
test('fallback local labels remain original across15 locales',()=>{for(const l of locales){const a=actions(['binance'],['/compare/binance-vs-okx'],l);assert.equal(a[0].text,After.copy[l].claimBtn||After.copy.en.claimBtn);assert.equal(a[1].text,After.copy[l].compareBtn||After.copy.en.compareBtn);}});
test('priority decisions are exactly unchanged',()=>{assert.equal(JSON.stringify(After.priorityNewsDecisionSummaries),JSON.stringify(Before.priorityNewsDecisionSummaries));});
test('empty sources add no orphan source heading and long strings remain full',()=>{const old=article.sources;article.sources=[];try{const h=renderToStaticMarkup(React.createElement(After.NewsDetailPage,{slug:article.slug,initialArticles:[article],locale:'en'}));assert.ok(!h.includes('id="article-sources"'));}finally{article.sources=old;}});
