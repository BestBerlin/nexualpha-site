import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../news-before.jsx", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { nextDecisionBridgeCopy: nextDecisionBridgeCopy } = await import("../src/data/next-decision-bridge.js");
const { validComparison: validComparison } = await import("../src/data/browser-state.js");
const req=createRequire(new URL('../package.json',import.meta.url));
const React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{transformSync}=req('esbuild');
const current=fs.readFileSync('src/components/v3/news/NewsDetailPage.jsx','utf8'),baseline=fs.readFileSync(new URL('../../news-before.jsx',import.meta.url),'utf8');
const css=fs.readFileSync('src/components/v3/news/news-detail-page.css','utf8'),oldcss=fs.readFileSync(new URL('../../news-before.css',import.meta.url),'utf8');
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
const owner={slug:'owner-fixture',eyebrow:'Original owner eyebrow',title:'Original checklist',summary:'Original summary',reviewedAt:'2026-09-01',checklist:['Original check'],faq:[{id:'one',question:'Original question?',answer:'Original answer.'}]};
let article;
const mocks={nextDecisionBridgeCopy,validComparison,OKX_USD_USDC_OWNER_CHECKLIST:owner,getNewsArticleBySlug:()=>article,venueDatabase:{binance:{name:'Binance',officialDomain:'www.binance.com'},okx:{name:'OKX',officialDomain:'www.okx.com'}},resolveNewsContentLocale:l=>l==='zh-Hans'?l:'en',localizedValue:(v,l)=>typeof v==='object'?v[l]||v.en:v,localizedNewsTitle:()=> 'Original headline',localizedNewsSummary:()=> 'Original summary',contextualHref:x=>x,BrandMark:()=>null,NextDecisionBridge:()=>React.createElement('a',{href:'/exchanges/binance?ref=unchanged'},'Original bridge'),OnsiteTelegramBotHandoff:()=>React.createElement('a',{href:'/telegram?x=1'},'Original Bot'),TopDecisionBox:({actions=[],sourceAction})=>React.createElement('aside',{'data-decision':'original'},[...actions,...(sourceAction?[sourceAction]:[])].map((a,i)=>React.createElement('a',{href:a.href,key:i},a.label)))};
function load(s){const module={exports:{}};vm.runInNewContext(transformSync(s,{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,require:n=>n==='react'?React:mocks});return module.exports.NewsDetailPage;}
const Before=load(baseline),After=load(current);
function fixture(mode){return {slug:mode==='owner'?owner.slug:'complete-fixture',status:'PUBLISHED',content:{en:'Lead one.\n\nLead two.\n\nLead three.\n\nLead four.\n\n## Original deep heading\n\nFull preserved deep body.', 'zh-Hans':'原完整正文。\n\n第二段。\n\n第三段。\n\n第四段。\n\n## 完整深入标题\n\n完整深入正文。'},title:'Original headline',summary:'Original summary',categoryName:'Research',publishedAt:'2026-10-05T00:00:00Z',readTime:'5 min',author:'Original Author',sources:[{id:'a',url:'https://source.example/a?x=1&y=2',publisher:'Publisher',title:'Complete original title'},{id:'b',url:'https://source.example/a?x=1&y=2',publisher:'Duplicate publisher',title:'Repeated URL still preserved'}],relatedVenues:mode==='none'?[]:['binance','okx'],seo:{noindex:true,internalLinkTargets:['/exchanges/binance','/compare/binance-vs-okx']}};}
const anchors=h=>[...h.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(m=>m[0]);
function section(h){const pos=h.indexOf('<section class="news-detail__content"');assert.ok(pos>=0);const rest=h.slice(pos);let count=0;for(const m of rest.matchAll(/<section\b[^>]*>|<\/section>/g)){count+=m[0].startsWith('</')?-1:1;if(!count)return rest.slice(0,m.index+m[0].length);}assert.fail('unclosed section');}
function outside(h){const stack=[];for(const m of h.matchAll(/<details\b[^>]*>|<\/details>|<h2 id="article-sources">/g)){if(m[0].startsWith('<details'))stack.push(m[0]);else if(m[0]==='</details>')stack.pop();else assert.equal(stack.length,0);}}
for(const locale of locales)test(`${locale}: original content/source and full anchors preserved, research native closed after body`,()=>{
 for(const mode of ['owner','venues','none']){article=fixture(mode);const render=C=>renderToStaticMarkup(React.createElement(C,{slug:article.slug,locale,initialArticles:[article]}));const old=render(Before),now=render(After);
 assert.equal(section(now),section(old));assert.deepEqual(anchors(now).sort(),anchors(old).sort());outside(now);assert.match(now,/<details class="news-detail__article-disclosure">/);
 if(mode==='none'){assert.equal(now,old);continue;}
 assert.match(now,/<details class="news-detail__research-disclosure">/);assert.ok(now.indexOf('data-decision="original"')<now.indexOf('class="news-detail__content"'));
 assert.ok(now.indexOf('class="news-detail__research-disclosure"')>now.indexOf('id="article-sources"'));assert.ok(now.indexOf('class="news-detail__research-disclosure"')<now.indexOf('Original Bot'));
 assert.ok(now.includes(`<summary>${nextDecisionBridgeCopy(locale).title}</summary>`));if(locale!=='en')assert.notEqual(nextDecisionBridgeCopy(locale).title,nextDecisionBridgeCopy('en').title);
 const partner=h=>h.match(/<aside class="news-detail__partners-box">[\s\S]*?<\/aside>/)?.[0]||'',own=h=>h.match(/<aside class="news-detail__owner-checklist"[\s\S]*?<\/aside>/)?.[0]||'';
 assert.equal(partner(now),partner(old));assert.equal(own(now),own(old));assert.deepEqual(anchors(now.replace(partner(now),'').replace(own(now),'')),anchors(old.replace(partner(old),'').replace(own(old),'')));
 assert.ok(now.includes(`data-news-content-locale="${locale==='zh-Hans'?'zh-Hans':'en'}"`));
 }
});
test('exact reverse source/CSS prevents SEO, state, other content or copy changes',()=>{
 const start=baseline.indexOf('        <OwnerChecklist article={article} />'),end=baseline.indexOf('        {/* 文章正文 */}',start),moved=baseline.slice(start,end);
 const block='        {(article.slug === OKX_USD_USDC_OWNER_CHECKLIST.slug || article.relatedVenues?.length > 0) && (\n        <details className="news-detail__research-disclosure">\n          <summary>{nextDecisionBridgeCopy(locale).title}</summary>\n'+moved+'        </details>\n        )}\n\n';assert.equal(current.split(block).length,2);
 const restored=current.replace(block,'').replace('        {/* 文章正文 */}',moved+'        {/* 文章正文 */}').replace('import { nextDecisionBridgeCopy } from "../../../data/next-decision-bridge.js";\n','');assert.equal(restored,baseline);
 const marker='\n/* R194: reading first, optional research after complete content and sources. */';assert.ok(css.includes(marker));assert.equal(css.slice(0,css.indexOf(marker)),oldcss);
 const suffix=css.slice(css.indexOf(marker));assert.match(suffix,/min-height: 44px/);assert.match(suffix,/:focus-visible/);assert.match(suffix,/display: list-item/);assert.doesNotMatch(suffix,/font-size|display:\s*none|overflow:\s*hidden/);
});
}
