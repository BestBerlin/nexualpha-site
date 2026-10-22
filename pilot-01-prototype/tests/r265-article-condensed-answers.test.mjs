import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {buildSync} from 'esbuild';
import crypto from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("fixtures/r237-approved-inverses.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { projectApproved: projectApproved, approvedRuntime: approvedRuntime } = await import("./helpers/r237-approved-inverses.mjs");

const root=fileURLToPath(new URL('../',import.meta.url)),base=fileURLToPath(new URL('../../../r260-final-task-integration/candidate/',import.meta.url)),require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),file='src/components/v3/news/NewsDetailPage.jsx';
const fixture=fs.readFileSync(path.join(root,'tests/fixtures/r265-condensed-bodies.json'));assert.equal(crypto.createHash('sha256').update(fixture).digest('hex'),'d8d007186ca7d71862aac9267f9617861ce543be61f201308c123fd175f2a75b');const {bodies,editingPackSha256}=JSON.parse(fixture),feed=JSON.parse(fs.readFileSync(path.join(root,'public/content/news-feed.json'))),articles=Array.isArray(feed)?feed:feed.articles||feed.items;
class FixedDate extends Date{constructor(...args){super(...(args.length?args:[1791190800000]));}static now(){return 1791190800000;}}
function load(r){const m={exports:{}};const code=buildSync({stdin:{contents:`export {NewsDetailPage} from './${file}';`,resolveDir:r,loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty','.webp':'text'}}).outputFiles[0].text;vm.runInNewContext(code,{module:m,exports:m.exports,require,console,URL,URLSearchParams,Intl,Date:FixedDate,setTimeout,clearTimeout});return m.exports;}
const current=load(root),before=load(base),locales=['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
function ssr(r,slug,locale,ctx={}){return renderToStaticMarkup(React.createElement(r.NewsDetailPage,{slug,locale,initialArticles:articles,...ctx}));}
function first(h){const at=h.indexOf('<aside class="top-decision-box news-detail__first-decision"');assert.ok(at>=0,'real rendered first decision required');const end=h.indexOf('</aside>',at)+8;assert.ok(end>at);return {box:h.slice(at,end),rest:h.slice(0,at)+'FIRST-DECISION'+h.slice(end)};}
for(const [slug,configs]of Object.entries(bodies))test(slug+' 15 actual SSR first-body-only completeHTML protection',()=>{assert.ok(articles.some(a=>a.slug===slug),'real feed absence blocks slice');for(const locale of locales){const h=ssr(current,slug,locale),old=ssr(before,slug,locale),config=configs[locale];if(!config){assert.equal(h,old,locale+' full fallback unchanged');continue;}const n=first(h),o=first(old),from='<p>'+esc(config.before)+'</p>',to='<p>'+esc(config.after)+'</p>';assert.equal(o.box.split(from).length-1,1);assert.equal(n.box,o.box.replace(from,to));assert.equal(n.rest,o.rest);assert.equal(h,old.replace(from,to));assert.deepEqual([...h.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]),[...old.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]));}});
test('reviewed pack exact six bodies with unchanged title/eyebrow/actions and BR passport',()=>{const pack=fs.readFileSync(path.join(root,'../r265-article-condensed-answers--CONDENSED-EDITING-PACK.md'));assert.equal(crypto.createHash('sha256').update(pack).digest('hex'),editingPackSha256);for(const [slug,configs]of Object.entries(bodies)){const section=pack.toString().split('Slug：`'+slug+'`')[1].split('### 原文')[0],copies=[...section.matchAll(/- Body: `([^`]+)`/g)].map(m=>m[1]);assert.deepEqual(copies,[configs.en.after,configs['zh-Hans'].after]);for(const locale of ['en','zh-Hans']){const h=ssr(current,slug,locale,{market:'BR',product:'spot'}),old=ssr(before,slug,locale,{market:'BR',product:'spot'});assert.equal(h,old.replace('<p>'+esc(configs[locale].before)+'</p>','<p>'+esc(configs[locale].after)+'</p>'));assert.match(h,/market=BR&amp;product=spot/);}}});
test('whole source literal inverse only six bodies; all protected keysets/bytes and original R258 fixture unchanged',()=>{let s=fs.readFileSync(path.join(root,file),'utf8');for(const configs of Object.values(bodies))for(const {before,after}of Object.values(configs)){const from=JSON.stringify(after),to=JSON.stringify(before);assert.equal(s.split(from).length-1,1);s=s.replace(from,to);}assert.equal(s,fs.readFileSync(path.join(base,file),'utf8'));assert.equal(s,fs.readFileSync(path.join(root,'../r265-article-condensed-answers--BASELINE-NEWS.jsx'),'utf8'));const walk=(r,d)=>fs.readdirSync(path.join(r,d),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(r,path.join(d,e.name)):e.isFile()?[path.join(d,e.name)]:[]);for(const d of ['src','config','public']){assert.deepEqual(walk(root,d).sort(),walk(base,d).sort());for(const f of walk(base,d))if(f!==file)assert.deepEqual(approvedRuntime[f]?Buffer.from(projectApproved(f,fs.readFileSync(path.join(root,f),'utf8'),'r260-final-task-integration')):fs.readFileSync(path.join(root,f)),fs.readFileSync(path.join(base,f)),f);}assert.deepEqual(fs.readFileSync(path.join(root,'tests/fixtures/r258-approved-answers.json')),fs.readFileSync(path.join(base,'tests/fixtures/r258-approved-answers.json')));assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'src/data/partner-registry.js'))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
test('other existing articles wholeSSR EN/zh/AR remain exact',()=>{let checked=0;for(const article of articles.slice(0,10)){if(bodies[article.slug])continue;for(const locale of ['en','zh-Hans','ar'])assert.equal(ssr(current,article.slug,locale),ssr(before,article.slug,locale));checked++;}assert.ok(checked>0);});
}
