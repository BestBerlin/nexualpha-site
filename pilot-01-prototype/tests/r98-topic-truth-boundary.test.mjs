import {createHash} from 'node:crypto';
import {nextDecisionBridgeCopy} from '../src/data/next-decision-bridge.js';
import {acceptedTopicPresentation, withoutApprovedR183EvidenceLinks} from './r189-presentation-contract.mjs';
import {topicReviewedFaqRecords} from '../src/data/topic-reviewed-faqs.js';
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
const acceptedSource=acceptedTopicPresentation();
const r128Root=path.resolve(root,'../../r128-home-mobile/candidate');
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
  if(mode==='accepted')return args.path===component ? {contents:acceptedSource,loader:'jsx',resolveDir:path.dirname(component)} : undefined;
  if(mode==='r128'&&(args.path===component||args.path===data))return {contents:await readFile(path.join(r128Root,path.relative(root,args.path)),'utf8'),loader:args.path===component?'jsx':'js',resolveDir:path.dirname(args.path)};
  if(args.path===component||(args.path===data&&usePriorData))return {contents:await readFile(path.join(backup,path.relative(root,args.path)),'utf8'),loader:args.path===component?'jsx':'js',resolveDir:path.dirname(args.path)};
 });}}]});
 return JSON.parse(execFileSync(process.execPath,[bundle],{encoding:'utf8',maxBuffer:12*1024*1024}));
}
let current,before,currentSeo,beforeSeo,projectedBefore,r128Body,acceptedBody;
try{const prior=await render('before'),now=await render('current'),projected=await render('prior-component'),r128=await render('r128'),accepted=await render('accepted');acceptedBody=accepted.body;projectedBefore=projected.body;r128Body=r128.body;before=prior.body;current=now.body;beforeSeo=prior.seo;currentSeo=now.seo;}finally{await rm(dir,{recursive:true,force:true});}
const normalizeApprovedMemeTopicLabel=body=>body
 .replace(/(<a [^>]*href="[^"]*\/topics\/meme-coins(?:\?[^"]*)?"[^>]*><span>[^<]*<\/span><span>)[^<]*(<\/span><\/a>)/g,'$1APPROVED_MEME_TOPIC_NAV_LABEL$2')
 .replace(/(<a [^>]*href="[^"]*\/topics\/meme-coins(?:\?[^"]*)?"[^>]*>[\s\S]*?<div class="topic-matrix-card__tag">)[^<]*(<\/div>)/g,'$1APPROVED_MEME_TOPIC_NAV_LABEL$2');
const normalize=body=>normalizeApprovedMemeTopicLabel(body.replace(/([?&]|&amp;)tg_expires=\d+/g,'$1tg_expires=DYNAMIC'));
const plain=body=>body.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#x27;',"'");
const hrefs=body=>[...normalize(body).matchAll(/href="([^"]*)"/g)].map(m=>m[1]);
const hrefMultiset=body=>hrefs(body).map(x=>plain(x)).sort();

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
test('English FAQ and meme native-copy risk boundaries remain readable after the real sanitizer',()=>{
 const meme=plain(current['meme-coins:en']),derivatives=plain(current['derivatives:en']);
 assert.ok(meme.includes(topicReviewedFaqRecords('meme-coins','en')[2].answer));
 assert.ok(meme.includes('Check official notices, trading pairs, funding networks, account eligibility and regional limits before using an order book or pool.'));
 assert.ok(meme.includes('Check contract permissions, wallet approvals, token warnings, venue risk controls, reserve disclosures and exit routes as source descriptions, not guarantees.'));
 assert.doesNotMatch(meme,/not execution stated terms|not solvency stated terms/);
 assert.ok(derivatives.includes(topicReviewedFaqRecords('derivatives','en')[1].answer));
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
test('all sixty route/source/invite href multisets and source time values stay identical',()=>{
 for(const [key,body]of Object.entries(current)){
  // R125 moved the same bridge links lower on the page; R129 native copy must not change the link set.
  assert.deepEqual(hrefMultiset(withoutApprovedR183EvidenceLinks(withoutReviewedFaqSourceParagraphs(body,key),key)),hrefMultiset(before[key]),key);
  assert.deepEqual([...withoutReviewedFaqSourceParagraphs(body,key).matchAll(/<time[^>]*>([^<]*)<\/time>/g)].map(m=>m[1]),[...before[key].matchAll(/<time[^>]*>([^<]*)<\/time>/g)].map(m=>m[1]),key);
 }
});
test('all 45 non-meme renders match the pinned approved R176 plus exact R183 presentation with original R128 retained',()=>{
 let checked=0;
 for(const [key,body]of Object.entries(current)){
  const [slug]=key.split(':');
  if(slug!=='meme-coins'){assert.equal(normalize(withoutApprovedR203Disclosure(body,key)),normalize(acceptedBody[key]),key);checked++;}
 }
 assert.equal(checked,45);
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

test('approved R203 shell inverse rejects missing/duplicate/unapproved summary and cannot erase child content changes',()=>{
 const key='derivatives:ja',body=current[key],marker='<details class="topic-disclosure topic-telegram-disclosure">';
 assert.throws(()=>withoutApprovedR203Disclosure(body.replace(marker,''),key));
 assert.throws(()=>withoutApprovedR203Disclosure(body.replace(marker,marker+marker),key));
 const label=htmlText(nextDecisionBridgeCopy('ja').telegram);assert.ok(body.includes(label));
 assert.throws(()=>withoutApprovedR203Disclosure(body.replace(marker+'<summary>'+label,marker+'<summary>UNAPPROVED SUMMARY'),key));
 const mutated=body.replace('class="topic-tg-box"','class="topic-tg-box altered"');assert.notEqual(mutated,body);
 assert.notEqual(normalize(withoutApprovedR203Disclosure(mutated,key)),normalize(acceptedBody[key]),'original child changes remain visible to the restored full HTML equality');
});
