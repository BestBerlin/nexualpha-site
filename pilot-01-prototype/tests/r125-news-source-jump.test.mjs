import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const req=createRequire(new URL('../package.json',import.meta.url));
const React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{transformSync}=req('esbuild');
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
const sources=[{id:'one',url:'https://official.example/a?x=1&y=2',publisher:'Official Agency',title:'Primary evidence'},{url:'https://research.example/report#data',publisher:'Research Office',title:'Source & methodology'},{id:'three',url:'https://official.example/rules',publisher:'Official Rules',title:'Full conditions'}];
const article={slug:'fixture',content:Object.fromEntries(locales.map(l=>[l,'Lead one.\n\nLead two.\n\nLead three.\n\nLead four.\n\nDeep preserved analysis.'])),title:'Fixture',categoryName:'Research',publishedAt:'2026-10-05',readTime:'2 min',author:'Fixture',sources};
const mocks={getNewsArticleBySlug:()=>article,venueDatabase:{},OKX_USD_USDC_OWNER_CHECKLIST:{slug:'other'},resolveNewsContentLocale:l=>l,localizedValue:(v,l)=>typeof v==='object'?v[l]||v.en:v,localizedNewsTitle:()=> 'Fixture',localizedNewsSummary:()=> 'Summary',contextualHref:x=>x,BrandMark:()=>null,NextDecisionBridge:()=>null,OnsiteTelegramBotHandoff:()=>null,TopDecisionBox:()=>null};
function load(text){const module={exports:{}};vm.runInNewContext(transformSync(text,{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,require:n=>n==='react'?React:mocks});return module.exports.NewsDetailPage;}
const Page=load(readFileSync(new URL('../src/components/v3/news/NewsDetailPage.jsx',import.meta.url),'utf8'));
const Before=load(readFileSync(new URL('../../news-sources-before/NewsDetailPage.jsx',import.meta.url),'utf8'));
const render=(P,l)=>renderToStaticMarkup(React.createElement(P,{slug:'fixture',initialArticles:[article],locale:l}));
const list=html=>html.match(/<h2 id="article-sources">[\s\S]*?<\/ul>/)?.[0];
for(const locale of locales)test(`${locale}: direct source anchor escapes closed full-analysis while preserving exact original source list`,()=>{
 const html=render(Page,locale),before=render(Before,locale);
 assert.equal(list(html)?.replace(/<\/?span[^>]*>/g,''),list(before)?.replace(/<\/?span[^>]*>/g,''),'complete source text/hrefs/attributes retained across presentation spans');
 assert.equal((html.match(/id="article-sources"/g)||[]).length,1);
 const stack=[];for(const token of html.matchAll(/<details\b[^>]*>|<\/details>|<h2 id="article-sources">/g)){if(token[0].startsWith('<details'))stack.push(token[0]);else if(token[0]==='</details>')stack.pop();else assert.equal(stack.length,0,'source anchor has no closed disclosure ancestor');}
 assert.match(html,/<details class="news-detail__article-disclosure">/);
 assert.ok(html.includes('Deep preserved analysis.'));
 assert.ok(html.includes(`data-news-content-locale="${locale}"`));
});
test('empty sources add no empty heading or disclosure and keep body available',()=>{article.sources=[];try{const html=render(Page,'en');assert.ok(!html.includes('id="article-sources"'));assert.ok(html.includes('Deep preserved analysis.'));}finally{article.sources=sources;}});
