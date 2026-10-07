import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {TOPIC_GUIDES} from '../src/data/topic-guides-data.js';
const root=fileURLToPath(new URL('..',import.meta.url));
const component=path.join(root,'src/components/v3/TopicGuidePage.jsx');
const data=path.join(root,'src/data/topic-guides-data.js');
const backup=path.join(root,'docs/evidence/four-week-growth-20260927/r97-before');
const dir=await mkdtemp(path.join(root,'tests/.tmp-r97-render-'));
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ar','ru','id','vi','it'];
let current,before;
async function render(prior){
 const entry=path.join(dir,'entry.mjs'),bundle=path.join(dir,prior?'before.cjs':'current.cjs');
 await writeFile(entry,`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {TopicGuidePage} from '../../src/components/v3/TopicGuidePage.jsx';import {TOPIC_GUIDES} from '../../src/data/topic-guides-data.js';const r={};for(const slug of ['meme-coins','derivatives','compliant-exchanges','no-kyc'])for(const locale of ${JSON.stringify(locales)})r[slug+':'+locale]=renderToStaticMarkup(React.createElement(TopicGuidePage,{slug,locale}));const owner=TOPIC_GUIDES['compliant-exchanges'],saved=owner.platforms;owner.platforms=[saved.find(p=>p.slug==='okx'),...saved.filter(p=>p.slug!=='okx')];r['okx-first:zh-Hant']=renderToStaticMarkup(React.createElement(TopicGuidePage,{slug:'compliant-exchanges',locale:'zh-Hant'}));owner.platforms=saved;console.log(JSON.stringify(r));`);
 const plugin={name:'prior-snapshot',setup(b){b.onLoad({filter:/TopicGuidePage\.jsx$|topic-guides-data\.js$/},async args=>{
  if(!prior)return;
  if(args.path===component)return {contents:await readFile(path.join(backup,'src/components/v3/TopicGuidePage.jsx'),'utf8'),loader:'jsx',resolveDir:path.dirname(component)};
  if(args.path===data)return {contents:await readFile(path.join(backup,'topic-guides-data.js'),'utf8'),loader:'js',resolveDir:path.dirname(data)};
 });}};
 await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',outfile:bundle,loader:{'.css':'empty'},plugins:[plugin],logLevel:'silent'});
 return JSON.parse(execFileSync(process.execPath,[bundle],{encoding:'utf8',maxBuffer:10*1024*1024}));
}
try{before=await render(true);current=await render(false);}finally{await rm(dir,{recursive:true,force:true});}
const normalize=body=>body.replace(/([?&]|&amp;)tg_expires=\d+/g,'$1tg_expires=DYNAMIC');
const hrefs=body=>[...normalize(body).matchAll(/href="([^"]*)"/g)].map(m=>m[1]);
const plain=body=>body.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#x27;',"'");
test('all four Traditional Chinese topic views consume repaired summary and shared labels',()=>{
 for(const slug of ['meme-coins','derivatives','compliant-exchanges','no-kyc']){
  const body=plain(current[slug+':zh-Hant']);
  assert.ok(body.includes('先核對平台檔案'),slug);
  assert.ok(body.includes('直達最關鍵交易決策，拒絕模稜兩可與行銷套話。'),slug);
  assert.ok(body.includes('檢視專題指南 →'),slug);
  assert.doesNotMatch(body,/先核對平台档案|最关键交易决策|Meme 币與鏈上交易检查/);
  for(const other of ['meme-coins','no-kyc']){
   assert.ok(body.includes(TOPIC_GUIDES[other].categoryZhHant));
   assert.ok(body.includes(TOPIC_GUIDES[other].titleZhHant));
   assert.ok(body.includes(TOPIC_GUIDES[other].descZhHant));
  }
 }
});
test('locale-only OKX display projection reaches every source and platform entry without raw Chinese name',()=>{
 const body=current['compliant-exchanges:zh-Hant'];
 assert.match(body,/<strong translate="no" lang="zh-Hant">OKX（歐易）<\/strong>/);
 assert.match(body,/<span class="topic-platform-name">OKX（歐易）<\/span>/);
 assert.doesNotMatch(body,/OKX \(欧易\)/);
});
test('all 56 non-Hant topic locale renderings remain byte-identical',()=>{
 for(const [key,body]of Object.entries(current))if(!key.endsWith(':zh-Hant'))assert.equal(normalize(body),normalize(before[key]),key);
});
test('all sixty standard and one reordered route/source/invite/Telegram href arrays remain identical',()=>{
 for(const [key,body]of Object.entries(current))assert.deepEqual(hrefs(body),hrefs(before[key]),key);
});

test('an OKX-first render exercises both top-decision and next-step bridge names',()=>{
 const body=current['okx-first:zh-Hant'];
 assert.ok((body.match(/OKX（歐易）/g)||[]).length>=4);
 assert.doesNotMatch(body,/OKX \(欧易\)/);
 assert.ok(before['okx-first:zh-Hant'].includes('OKX (欧易)'));
});
