import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {TOPIC_GUIDES} from '../src/data/topic-guides-data.js';
import {TOPIC_GUIDES as priorData} from '../docs/evidence/four-week-growth-20260927/r98-before/src/data/topic-guides-data.js';
const root=fileURLToPath(new URL('..',import.meta.url));
const backup=path.join(root,'docs/evidence/four-week-growth-20260927/r98-before');
const component=path.join(root,'src/components/v3/TopicGuidePage.jsx');
const data=path.join(root,'src/data/topic-guides-data.js');
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ar','ru','id','vi','it'];
const owners=['meme-coins','derivatives','no-kyc'];
const dir=await mkdtemp(path.join(root,'tests/.tmp-r98-render-'));
async function render(mode){
 const prior=mode!=='current',usePriorData=mode==='before';
 const entry=path.join(dir,'entry.mjs'),bundle=path.join(dir,mode+'.cjs');
 await writeFile(entry,`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {TopicGuidePage} from '../../src/components/v3/TopicGuidePage.jsx';import {computeRouteSeo} from '../../src/data/seo-injection.js';const result={},seo={};for(const slug of ['meme-coins','derivatives','compliant-exchanges','no-kyc'])for(const locale of ${JSON.stringify(locales)}){result[slug+':'+locale]=renderToStaticMarkup(React.createElement(TopicGuidePage,{slug,locale}));const prefix={en:'', 'zh-Hans':'/zh-hans','zh-Hant':'/zh-hant','pt-BR':'/pt-br',id:'/id-id'}[locale]??('/'+locale);seo[slug+':'+locale]=computeRouteSeo({pathname:prefix+'/topics/'+slug,locale});}console.log(JSON.stringify({body:result,seo}));`);
 await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',outfile:bundle,loader:{'.css':'empty'},logLevel:'silent',plugins:[{name:'r98-backup',setup(b){b.onLoad({filter:/TopicGuidePage\.jsx$|topic-guides-data\.js$/},async args=>{
  if(!prior)return;
  if(args.path===component||(args.path===data&&usePriorData))return {contents:await readFile(path.join(backup,path.relative(root,args.path)),'utf8'),loader:args.path===component?'jsx':'js',resolveDir:path.dirname(args.path)};
 });}}]});
 return JSON.parse(execFileSync(process.execPath,[bundle],{encoding:'utf8',maxBuffer:12*1024*1024}));
}
let current,before,currentSeo,beforeSeo,projectedBefore;
try{const prior=await render('before'),now=await render('current'),projected=await render('prior-component');projectedBefore=projected.body;before=prior.body;current=now.body;beforeSeo=prior.seo;currentSeo=now.seo;}finally{await rm(dir,{recursive:true,force:true});}
const normalize=body=>body.replace(/([?&]|&amp;)tg_expires=\d+/g,'$1tg_expires=DYNAMIC');
const plain=body=>body.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#x27;',"'");
const hrefs=body=>[...normalize(body).matchAll(/href="([^"]*)"/g)].map(m=>m[1]);
const expected={en:['Use official sources to check published fees, access rules, execution risks and withdrawal conditions. Unverified figures remain pending.','Evidence status','Applicable fee terms','Content updated','These checks do not ensure capital safety or recovery of funds.'], 'zh-Hans':['通过官方来源核对公开费率、准入规则、执行风险与提现条件；尚未核验的数值保持待核验。','证据状态','适用费率条款','内容更新','这些检查不保证本金安全，也不保证资金能够追回。'],'zh-Hant':['透過官方來源核對公開費率、准入規則、執行風險與提領條件；尚未核驗的數值維持待核驗。','證據狀態','適用費率條款','內容更新','這些檢查不保證本金安全，也不保證資金能夠追回。']};
test('nine actual topic renders use explicit source-bound leads and evidence table labels',()=>{
 for(const slug of owners)for(const [locale,phrases]of Object.entries(expected)){
  const body=plain(current[slug+':'+locale]);for(const phrase of phrases)assert.ok(body.includes(phrase),slug+':'+locale+' missing '+phrase);
  assert.doesNotMatch(body,/Audited side-by-side comparison|统一量化引擎|統一量化引擎|实盘挂单深度|實盤掛單深度|守护本金万无一失|守護本金萬無一失/);
 }
});
test('No-KYC pain/evaluation cards are conditional checks rather than blanket capability or misconduct claims',()=>{
 const owner=TOPIC_GUIDES['no-kyc'];
 for(const key of ['painPoints','evaluationPillars']){
  assert.equal(owner[key].length,priorData['no-kyc'][key].length);
  owner[key].forEach((card,index)=>{
   for(const field of ['titleZh','descZh','titleEn','descEn'])assert.notEqual(card[field],priorData['no-kyc'][key][index][field],key+index+field);
   assert.equal(typeof card.titleZhHant,'string');assert.equal(typeof card.descZhHant,'string');
   for(const locale of ['en','zh-Hans','zh-Hant']){
    const text=plain(current['no-kyc:'+locale]);assert.ok(text.includes(card[locale==='en'?'descEn':locale==='zh-Hant'?'descZhHant':'descZh']));
   }
  });
 }
 const text=plain(current['no-kyc:en']);assert.doesNotMatch(text,/ensuring capital can be withdrawn|deliberately enforce retroactive|Tests large-scale withdrawal speed|grading Web3 wallet-only signatures as top tier/);
 assert.match(text,/chain, contract and account state|chain.*contract.*account/i);
});
test('two English FAQ negative risk statements remain readable after the real sanitizer',()=>{
 const meme=plain(current['meme-coins:en']),derivatives=plain(current['derivatives:en']);
 assert.ok(meme.includes('no route ensures approval.'));
 assert.ok(meme.includes('Private routing or MEV tools are additional checks and do not establish execution certainty.'));
 assert.ok(meme.includes('Reserves and controls are source descriptions and do not establish solvency.'));
 assert.doesNotMatch(meme,/not execution stated terms|not solvency stated terms/);
 assert.ok(derivatives.includes('but those mechanics do not establish safety.'));
 assert.doesNotMatch(meme,/no route stated terms approval/);assert.doesNotMatch(derivatives,/not a safety stated terms/);
 for(const slug of owners)for(const locale of ['en','zh-Hans','zh-Hant'])assert.equal((current[slug+':'+locale].match(/class="topic-faq-item"/g)||[]).length,slug==='no-kyc'?4:3,slug+locale);
});
test('all four pending-stat gates survive and no raw score, fee or self-custody guarantee is exposed',()=>{
 for(const slug of owners)for(const locale of ['en','zh-Hans','zh-Hant']){
  const body=current[slug+':'+locale],values=[...body.matchAll(/class="topic-stat-card__value"[^>]*>([^<]*)</g)].map(m=>m[1]);
  assert.equal(values.length,4);assert.ok(values.every(v=>['Pending','待核验','待核驗'].includes(v)),slug+locale);
  assert.doesNotMatch(body,/zero identity collection, 100% self-custody with unlimited withdrawals|9\.9\s*\/\s*10/);
 }
});
test('all sixty route/source/invite hrefs and source time values stay identical',()=>{
 for(const [key,body]of Object.entries(current)){
  assert.deepEqual(hrefs(body),hrefs(before[key]),key);
  assert.deepEqual([...body.matchAll(/<time[^>]*>([^<]*)<\/time>/g)].map(m=>m[1]),[...before[key].matchAll(/<time[^>]*>([^<]*)<\/time>/g)].map(m=>m[1]),key);
 }
});
test('all 51 renders outside shared-copy scope match the prior component with only approved data repairs projected',()=>{
 let checked=0;
 for(const [key,body]of Object.entries(current))if(!owners.some(slug=>['en','zh-Hans','zh-Hant'].some(locale=>key===slug+':'+locale))){assert.equal(normalize(body),normalize(projectedBefore[key]),key);checked++;}
 assert.equal(checked,51);
});
test('restoring seven No-KYC cards, two FAQ answers and two R99 negative-risk clauses restores the whole data registry',()=>{
 const restored=structuredClone(TOPIC_GUIDES);
 for(const key of ['painPoints','evaluationPillars'])restored['no-kyc'][key]=structuredClone(priorData['no-kyc'][key]);
 for(const slug of ['meme-coins','derivatives']){
  const changed=restored[slug].faqs.map((faq,i)=>faq.aEn!==priorData[slug].faqs[i].aEn?i:null).filter(i=>i!==null);
  assert.equal(changed.length,1,slug);restored[slug].faqs[changed[0]].aEn=priorData[slug].faqs[changed[0]].aEn;
 }
 for (const [key,index] of [['painPoints',1],['evaluationPillars',3]]) {
  assert.notEqual(restored['meme-coins'][key][index].descEn,priorData['meme-coins'][key][index].descEn);
  restored['meme-coins'][key][index].descEn=priorData['meme-coins'][key][index].descEn;
 }
 assert.deepEqual(restored,priorData);
});

test('all sixty curated route metadata contracts remain unchanged; no new shared FAQ parity is implied',()=>{assert.deepEqual(currentSeo,beforeSeo);});
