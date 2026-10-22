import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../../../release-candidates/r128-home-mobile/candidate/src/components/v3/TopicGuidePage.jsx", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { nextDecisionBridgeCopy: nextDecisionBridgeCopy } = await import("../src/data/next-decision-bridge.js");
const { acceptedTopicPresentation: acceptedTopicPresentation, withoutApprovedR183EvidenceLinks: withoutApprovedR183EvidenceLinks } = await import("./r189-presentation-contract.mjs");
const { topicReviewedFaqRecords: topicReviewedFaqRecords } = await import("../src/data/topic-reviewed-faqs.js");







const { TOPIC_GUIDES: TOPIC_GUIDES } = await import("../src/data/topic-guides-data.js");
const root=fileURLToPath(new URL('..',import.meta.url));
const component=path.join(root,'src/components/v3/TopicGuidePage.jsx');
const data=path.join(root,'src/data/topic-guides-data.js');
const backup=path.join(root,'docs/evidence/four-week-growth-20260927/r97-before');
const r128Root=path.resolve(root,'../../r128-home-mobile/candidate');
const dir=await mkdtemp(path.join(root,'tests/.tmp-r97-render-'));
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ar','ru','id','vi','it'];
const acceptedSource=acceptedTopicPresentation();
let current,before,r128,acceptedPresentation;
async function render(prior,baseline='r97'){
 const entry=path.join(dir,'entry.mjs'),bundle=path.join(dir,prior?'before.cjs':'current.cjs');
 await writeFile(entry,`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {TopicGuidePage} from '../../src/components/v3/TopicGuidePage.jsx';import {TOPIC_GUIDES} from '../../src/data/topic-guides-data.js';const r={};for(const slug of ['meme-coins','derivatives','compliant-exchanges','no-kyc'])for(const locale of ${JSON.stringify(locales)})r[slug+':'+locale]=renderToStaticMarkup(React.createElement(TopicGuidePage,{slug,locale}));const owner=TOPIC_GUIDES['compliant-exchanges'],saved=owner.platforms;owner.platforms=[saved.find(p=>p.slug==='okx'),...saved.filter(p=>p.slug!=='okx')];r['okx-first:zh-Hant']=renderToStaticMarkup(React.createElement(TopicGuidePage,{slug:'compliant-exchanges',locale:'zh-Hant'}));owner.platforms=saved;console.log(JSON.stringify(r));`);
 const plugin={name:'prior-snapshot',setup(b){b.onLoad({filter:/TopicGuidePage\.jsx$|topic-guides-data\.js$/},async args=>{
  if(!prior)return;
  if(baseline==='accepted')return args.path===component ? {contents:acceptedSource,loader:'jsx',resolveDir:path.dirname(component)} : undefined;
  if(baseline==='r128'&&(args.path===component||args.path===data))return {contents:await readFile(path.join(r128Root,path.relative(root,args.path)),'utf8'),loader:args.path===component?'jsx':'js',resolveDir:path.dirname(args.path)};
  if(args.path===component)return {contents:await readFile(path.join(backup,'src/components/v3/TopicGuidePage.jsx'),'utf8'),loader:'jsx',resolveDir:path.dirname(component)};
  // R98 data scope has independent whole-registry restoration coverage.
  // Keep data equal on both sides when checking the earlier component change.
  if(args.path===data)return {contents:await readFile(data,'utf8'),loader:'js',resolveDir:path.dirname(data)};
 });}};
 await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',outfile:bundle,loader:{'.css':'empty'},plugins:[plugin],logLevel:'silent'});
 return JSON.parse(execFileSync(process.execPath,[bundle],{encoding:'utf8',maxBuffer:10*1024*1024}));
}
try{before=await render(true);r128=await render(true,'r128');acceptedPresentation=await render(true,'accepted');current=await render(false);}finally{await rm(dir,{recursive:true,force:true});}
const normalizeApprovedMemeTopicLabel=body=>body
 .replace(/(<a [^>]*href="[^"]*\/topics\/meme-coins(?:\?[^"]*)?"[^>]*><span>[^<]*<\/span><span>)[^<]*(<\/span><\/a>)/g,'$1APPROVED_MEME_TOPIC_NAV_LABEL$2')
 .replace(/(<a [^>]*href="[^"]*\/topics\/meme-coins(?:\?[^"]*)?"[^>]*>[\s\S]*?<div class="topic-matrix-card__tag">)[^<]*(<\/div>)/g,'$1APPROVED_MEME_TOPIC_NAV_LABEL$2');
const normalize=body=>normalizeApprovedMemeTopicLabel(body.replace(/([?&]|&amp;)tg_expires=\d+/g,'$1tg_expires=DYNAMIC'));
const hrefs=body=>[...normalize(body).matchAll(/href="([^"]*)"/g)].map(m=>m[1]);
const hrefMultiset=body=>hrefs(body).map(x=>plain(x)).sort();
const plain=body=>body.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#x27;',"'");

function withoutReviewedFaqSourceParagraphs(body,key){
 const [slug,locale]=key.split(':');const records=topicReviewedFaqRecords(slug,locale);
 if(!records.length)return body;
 const paragraphs=[...body.matchAll(/<p class="topic-faq-a"><a [\s\S]*?<\/p>/g)].map(m=>m[0]);
 const expected=records.flatMap(r=>r.sources);
 assert.deepEqual(paragraphs.flatMap(p=>hrefs(p)).map(x=>plain(x)),expected.map(s=>s.url),key+' exact added FAQ URLs');
 assert.deepEqual(paragraphs.flatMap(p=>[...p.matchAll(/<time[^>]*>([^<]*)<\/time>/g)].map(x=>x[1])),expected.flatMap(s=>s.updatedAt?[s.reviewedAt,s.updatedAt]:[s.reviewedAt]),key+' exact added FAQ dates');
 for(const [i,p]of paragraphs.entries())assert.ok(plain(p).includes(expected[i].label),key+' source label');
 return body.replace(/<p class="topic-faq-a"><a [\s\S]*?<\/p>/g,'');
}

assert.equal(createHash('sha256').update(await readFile(path.join(root,'src/data/next-decision-bridge.js'))).digest('hex'),'1b66b7aa1d9a91c528591561fd3be14f8d24750cc01c7c2512708b71728919a1','approved R203 summary dictionary is immutable');
// R227: reverse only the approved R203 shell; its two original children remain under full HTML guards.
const htmlText=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
function withoutApprovedR203Disclosure(body,key){
 const [,locale]=key.split(':');
 const marker='<details class="topic-disclosure topic-telegram-disclosure">';
 assert.equal(body.split(marker).length,2,key+' exactly one approved continuation shell');
 const start=body.indexOf(marker),tail=body.slice(start);let depth=0,end=-1;
 for(const token of tail.matchAll(/<details\b[^>]*>|<\/details>/g)){depth+=token[0].startsWith('</')?-1:1;if(depth===0){end=token.index+token[0].length;break;}}
 assert.ok(end>0,key+' balanced native continuation');
 const shell=tail.slice(0,end),prefix=marker+'<summary>'+htmlText(nextDecisionBridgeCopy(locale).telegram)+'<span aria-hidden="true">+</span></summary><div class="topic-disclosure__body">',suffix='</div></details>';
 assert.ok(shell.startsWith(prefix),key+' exact existing native locale summary/attributes');
 assert.ok(shell.endsWith(suffix),key+' exact closing shell');
 const original=shell.slice(prefix.length,-suffix.length);
 assert.ok(original.includes('topic-tg-box'),key+' original topic terminal remains');
 assert.ok(original.includes('topic-onsite-bot-handoff-'),key+' distinct original onsite handoff remains');
 return body.slice(0,start)+original+tail.slice(end);
}
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
test('all 46 non-meme renders match the pinned approved R176 plus exact R183 presentation with original R128 retained',()=>{
 let checked=0;
 for(const [key,body]of Object.entries(current)){
  const [slug]=key.split(':');
  if(slug!=='meme-coins'){assert.equal(normalize(withoutApprovedR203Disclosure(body,key)),normalize(acceptedPresentation[key]),key);checked++;}
 }
 assert.equal(checked,46);
});
test('all sixty standard and one reordered route/source/invite/Telegram href multisets remain identical',()=>{
 for(const [key,body]of Object.entries(current)){
  // R125 changed presentation order; the contract here is that R129 native copy does not add, remove, or rewrite hrefs.
  assert.deepEqual(hrefMultiset(withoutApprovedR183EvidenceLinks(withoutReviewedFaqSourceParagraphs(body,key),key)),hrefMultiset(before[key]),key);
 }
});

test('an OKX-first render exercises both top-decision and next-step bridge names',()=>{
 const body=current['okx-first:zh-Hant'];
 assert.ok((body.match(/OKX（歐易）/g)||[]).length>=4);
 assert.doesNotMatch(body,/OKX \(欧易\)/);
 assert.ok(before['okx-first:zh-Hant'].includes('OKX (欧易)'));
});

test('approved R203 shell inverse rejects missing/duplicate/unapproved summary and cannot erase child content changes',()=>{
 const key='derivatives:ja',body=current[key],marker='<details class="topic-disclosure topic-telegram-disclosure">';
 assert.throws(()=>withoutApprovedR203Disclosure(body.replace(marker,''),key));
 assert.throws(()=>withoutApprovedR203Disclosure(body.replace(marker,marker+marker),key));
 const label=htmlText(nextDecisionBridgeCopy('ja').telegram);assert.ok(body.includes(label));
 assert.throws(()=>withoutApprovedR203Disclosure(body.replace(marker+'<summary>'+label,marker+'<summary>UNAPPROVED SUMMARY'),key));
 const mutated=body.replace('class="topic-tg-box"','class="topic-tg-box altered"');assert.notEqual(mutated,body);
 assert.notEqual(normalize(withoutApprovedR203Disclosure(mutated,key)),normalize(acceptedPresentation[key]),'original child changes remain visible to the restored full HTML equality');
});
}
