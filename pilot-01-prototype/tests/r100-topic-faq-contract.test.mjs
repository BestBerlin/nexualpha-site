import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdtemp,writeFile,rm,readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {AEO_QUESTION_REGISTRY} from '../src/data/aeo-question-registry.js';
import {REVIEWED_TOPIC_FAQS,topicReviewedFaqRecords} from '../src/data/topic-reviewed-faqs.js';
import {spawnSync} from 'node:child_process';
import worker from '../worker/index.js';
import {computeRouteSeo} from '../src/data/seo-injection.js';
const root=fileURLToPath(new URL('..',import.meta.url));
const owners=['meme-coins','derivatives','no-kyc'];
const locales=['en','zh-Hans','zh-Hant'];
const dir=await mkdtemp(path.join(root,'tests/.tmp-r100-faq-'));
let renders;
try{
 const entry=path.join(dir,'entry.mjs'),out=path.join(dir,'out.cjs');
 await writeFile(entry,`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {TopicGuidePage} from '../../src/components/v3/TopicGuidePage.jsx';const r={};for(const slug of ${JSON.stringify(owners)})for(const locale of ${JSON.stringify(locales)})r[slug+':'+locale]=renderToStaticMarkup(React.createElement(TopicGuidePage,{slug,locale}));console.log(JSON.stringify(r));`);
 await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',outfile:out,loader:{'.css':'empty'},logLevel:'silent'});
 renders=JSON.parse(execFileSync(process.execPath,[out],{encoding:'utf8',maxBuffer:5*1024*1024}));
}finally{await rm(dir,{recursive:true,force:true});}
const plain=s=>s.replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
const faqNodes=html=>[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{const j=JSON.parse(m[1]);return j['@graph']||[j]}).filter(s=>s['@type']==='FAQPage');
for(const slug of owners)for(const locale of locales){
 test(`${slug}/${locale}: visible FAQ owns one exact client and Worker answer group`,async()=>{
  const body=renders[slug+':'+locale];
  const visible=[...body.matchAll(/<div class="topic-faq-item">([\s\S]*?)<\/div>/g)].map(m=>({question:plain(m[1].match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1]).replace(/^Q\d+:\s*/,''),answer:plain(m[1].match(/<p class="topic-faq-a">([\s\S]*?)<\/p>/)[1])}));
  assert.equal(visible.length,slug==='no-kyc'?5:3);
  const pathname=(locale==='en'?'':locale==='zh-Hans'?'/zh-hans':'/zh-hant')+'/topics/'+slug;
  const schema=computeRouteSeo({pathname,locale}).schemas.filter(x=>x['@type']==='FAQPage');
  assert.equal(schema.length,1,'one shared client FAQ owner');
  const project=s=>s.mainEntity.map(q=>({question:q.name,answer:q.acceptedAnswer.text}));
  assert.deepEqual(project(schema[0]),visible,'exact visible/client FAQ text');
  for(const q of schema[0].mainEntity){assert.ok(q.acceptedAnswer.citation?.length,'item-specific citations');for(const url of q.acceptedAnswer.citation)assert.ok(body.includes(url));}
  const response=await worker.fetch(new Request('https://nexualpha.com'+pathname,{headers:{accept:'text/html'}}),{ASSETS:{fetch:async r=>new URL(r.url).pathname.endsWith('.json')?new Response('missing',{status:404}):new Response('<!doctype html><html><head><title>base</title></head><body>'+body+'</body></html>',{headers:{'content-type':'text/html'}})}});
  assert.equal(response.status,200);const nodes=faqNodes(await response.text());assert.equal(nodes.length,1);assert.deepEqual(nodes[0].mainEntity,schema[0].mainEntity);
 });
}

test('all sixty non-FAQ metadata contracts and all 51 outside-scope FAQ contracts preserve the frozen baseline',async()=>{
 const before=JSON.parse(await readFile(path.join(root,'docs/evidence/four-week-growth-20260927/r100-before/route-seo-60.json'),'utf8'));
 for(const [key,value]of Object.entries(before)){
  const [slug,locale]=key.split(':');const prefix={en:'','zh-Hans':'/zh-hans','zh-Hant':'/zh-hant','pt-BR':'/pt-br',id:'/id-id'}[locale]??'/'+locale;
  const now=computeRouteSeo({pathname:prefix+'/topics/'+slug,locale});
  const scoped=owners.includes(slug)&&locales.includes(locale);
  const withoutFaq=x=>({...x,schemas:x.schemas.filter(s=>s['@type']!=='FAQPage')});
  assert.deepEqual(scoped?withoutFaq(now):now,scoped?withoutFaq(value):value,key);
 }
});
test('exactly eleven stable reviewed question IDs append without changing any old130records',async()=>{
 const old=JSON.parse(await readFile(path.join(root,'docs/evidence/four-week-growth-20260927/r100-before/aeo-question-registry.json'),'utf8'));
 const ids=owners.flatMap(slug=>Array.from({length:slug==='no-kyc'?5:3},(_,i)=>'r100-'+slug+'-'+(i+1)));
 assert.deepEqual(AEO_QUESTION_REGISTRY.filter(q=>ids.includes(q.id)).map(q=>q.id),ids);
 assert.deepEqual(AEO_QUESTION_REGISTRY.filter(q=>!ids.includes(q.id)),old);
});
test('thirty retrieved answers use the same text, sources, dates and locale canonical as the visible owner',async()=>{
 const output=await mkdtemp(path.join(root,'tests/.tmp-r100-llms-'));
 try{
  const result=spawnSync(process.execPath,['scripts/generate-public-llms.mjs'],{cwd:root,env:{...process.env,NEXUALPHA_LLMS_OUTPUT_DIR:output},encoding:'utf8',timeout:30000});assert.equal(result.status,0,result.stderr);
  for(const file of ['llms.txt','llms-full.txt']){
   const text=await readFile(path.join(output,file),'utf8');
   for(const slug of owners)for(const locale of locales)for(const record of topicReviewedFaqRecords(slug,locale)){
    const prefix=locale==='en'?'':locale==='zh-Hans'?'/zh-hans':'/zh-hant';
    assert.ok(text.includes(`### ${record.question}\n\n- Canonical: https://nexualpha.com${prefix}/topics/${slug}\n- Language: ${locale}\n- Direct answer: ${record.answer}`));
    assert.ok(text.includes('### '+record.question));assert.ok(text.includes('- Direct answer: '+record.answer));
    for(const source of record.sources)assert.ok(text.includes(`[${source.label}](${source.url}) — reviewed: ${source.reviewedAt}; document updated: ${source.updatedAt??'not stated'}`));
   }
  }
 }finally{await rm(output,{recursive:true,force:true});}
});

test('unsupported owners/locales never inherit reviewed English answers',()=>{
 for(const slug of owners)for(const locale of ['ja','ko','tr','es','pt-BR','fr','de','ar','ru','id','vi','it'])assert.deepEqual(topicReviewedFaqRecords(slug,locale),[]);
 assert.deepEqual(topicReviewedFaqRecords('unknown','en'),[]);
});
test('missing locale, source or valid date blocks a reviewed record instead of silently publishing it',()=>{
 const record=REVIEWED_TOPIC_FAQS['meme-coins'][0],saved=structuredClone(record);
 for(const corrupt of [r=>{r.aHant='';},r=>{r.sources=[];},r=>{r.sources[0].reviewedAt='invalid';},r=>{r.sources[0].updatedAt='tomorrow';}]){
  try{corrupt(record);assert.throws(()=>topicReviewedFaqRecords('meme-coins','en'),/Invalid/);}finally{for(const k of Object.keys(record))delete record[k];Object.assign(record,structuredClone(saved));}
 }
});

test('invalid reviewed source stops the retrieval generator before writing any output',async()=>{
 const dir=await mkdtemp(path.join(root,'tests/.tmp-r100-invalid-'));
 try{
  const helper=path.join(dir,'invalid-faq.mjs'),entry=path.join(dir,'generator.mjs'),output=path.join(dir,'output');
  const helperSource=await readFile(path.join(root,'src/data/topic-reviewed-faqs.js'),'utf8');
  await writeFile(helper,helperSource+"\nREVIEWED_TOPIC_FAQS['meme-coins'][0].sources[0].reviewedAt='invalid';\n");
  const original=new URL('../scripts/generate-public-llms.mjs',import.meta.url);
  let script=await readFile(original,'utf8');
  script=script.replace(/from "(\.\.?\/[^"]+)"/g,(_,specifier)=>'from '+JSON.stringify(specifier==='../src/data/topic-reviewed-faqs.js'?new URL('file://'+helper).href:new URL(specifier,original).href));
  script=script.replaceAll('import.meta.url',JSON.stringify(original.href));await writeFile(entry,script);
  const result=spawnSync(process.execPath,[entry],{cwd:root,env:{...process.env,NEXUALPHA_LLMS_OUTPUT_DIR:output},encoding:'utf8',timeout:30000});
  assert.notEqual(result.status,0);assert.match(result.stderr,/Invalid reviewedAt/);
  assert.deepEqual(await readdir(output).catch(e=>{if(e.code==='ENOENT')return [];throw e;}),[]);
 }finally{await rm(dir,{recursive:true,force:true});}
});
