import { existsSync as historicalFixtureExists } from 'node:fs';
const historicalFixture = new URL("../../../r147-reader-polish/candidate/src/components/v3/TelegramReturnBanner.jsx", import.meta.url);
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync}from'node:fs';import{execFileSync}from'node:child_process';import{fileURLToPath}from'node:url';import path from'node:path';import vm from'node:vm';import{buildSync,transformSync}from'esbuild';import postcss from'postcss';
const root=fileURLToPath(new URL('..',import.meta.url)),base=path.resolve(root,'../../r147-reader-polish/candidate');
const p='src/components/v3/TelegramReturnBanner.jsx',source=readFileSync(path.join(root,p),'utf8'),before=historicalFixtureExists(historicalFixture)?readFileSync(path.join(base,p),'utf8'):null;
const labels={en:'Saved context and privacy','zh-Hans':'保存的上下文与隐私','zh-Hant':'儲存的情境與隱私',ja:'保存した条件とプライバシー',ko:'저장된 조건과 개인정보',tr:'Kayıtlı bağlam ve gizlilik',es:'Contexto guardado y privacidad','pt-BR':'Contexto salvo e privacidade',fr:'Contexte enregistré et confidentialité',de:'Gespeicherter Kontext und Datenschutz',ru:'Сохранённый контекст и конфиденциальность',ar:'السياق المحفوظ والخصوصية',id:'Konteks tersimpan dan privasi',vi:'Ngữ cảnh đã lưu và quyền riêng tư',it:'Contesto salvato e privacy'};
const snapshot={version:1,anonymousOnly:true,state:{market:'BR',product:'spot',accountStage:'new_account',funding:'Pix',scenario:'venue',venue:'bitget'}};
let rows=[];
if (historicalFixtureExists(historicalFixture)) {
const temp=mkdtempSync(path.join(root,'tests/.tmp-r150-'));
try{
 for(const[name,src,original]of[['after',source,path.join(root,p)],['before',before,path.join(base,p)]]){
  const code=src.replace('import { useEffect, useMemo, useState } from "react";',`import React from 'react';let cursor=0;const useState=()=>[(cursor++%2===0)?globalThis.__returnState:globalThis.__resumeSnapshot,()=>{}];const useEffect=()=>{};const useMemo=fn=>fn();`).replace(/import "\.\/telegram-return-banner\.css";/,'').replace(/from "(\.\.[^"]+)"/g,(_,r)=>'from '+JSON.stringify(path.resolve(path.dirname(original),r)));
  writeFileSync(path.join(temp,name+'.jsx'),code);
 }
 const entry=path.join(temp,'entry.jsx'),bundle=path.join(temp,'bundle.cjs');
 writeFileSync(entry,`import React from'react';import{renderToStaticMarkup as render}from'react-dom/server';import{TelegramReturnBanner as A}from'./after.jsx';import{TelegramReturnBanner as B}from'./before.jsx';globalThis.window={location:{pathname:'/exchanges/bitget',hash:'#top'}};let rows=[];for(let locale of ${JSON.stringify(Object.keys(labels))})for(let mode of ['saved','none','restored']){globalThis.__resumeSnapshot=mode==='none'?null:${JSON.stringify(snapshot)};globalThis.__returnState=mode==='restored'?{status:'restored',object:{kind:'venue',venue:'bitget'},objectId:'bitget',market:'BR',product:'spot',expiresAt:1791190800000,cleanSearch:'market=BR&product=spot&venue=bitget'}:null;let props={locale,expectedKind:'venue',expectedId:'bitget',continueHash:'#registration-checklist'};rows.push({locale,mode,before:render(React.createElement(B,props)),after:render(React.createElement(A,props))});}console.log(JSON.stringify(rows));`);
 buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',outfile:bundle,loader:{'.css':'empty'},logLevel:'silent'});rows=JSON.parse(execFileSync(process.execPath,[bundle],{encoding:'utf8',maxBuffer:30e6}));
}finally{rmSync(temp,{recursive:true,force:true});}
}
const anchors=h=>[...h.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]).sort();
const leafText=h=>h.replace(/<[^>]+>/g,'\n').split('\n').filter(s=>s.trim());
for(const locale of Object.keys(labels))test(`${locale} actual SSR all three states preserves complete links/text and true Telegram markup`, { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname },()=>{
 for(const r of rows.filter(r=>r.locale===locale)){
  if(r.mode!=='saved'){assert.equal(r.after,r.before);if(r.mode==='none')assert.equal(r.after,'');continue;}
  assert.deepEqual(anchors(r.after),anchors(r.before));for(const t of leafText(r.before))assert.ok(leafText(r.after).includes(t),t);
  const detail=r.after.match(/<details class="v3-anonymous-resume-details">([\s\S]*?)<\/details>/);assert.ok(detail,'native closed details');assert.ok(detail[1].startsWith('<summary>'+labels[locale]+'</summary>'));
  assert.match(detail[1],/class="v3-telegram-return-banner__eyebrow"/);assert.match(detail[1],/<p>[^<]+<\/p>/);assert.match(detail[1],/<dl>/);assert.doesNotMatch(detail[1],/<a\b|<button\b|<h2>/);
  assert.equal((r.after.match(/<h2>/g)||[]).length,1);assert.equal((r.after.match(/class="v3-telegram-return-banner__clear"/g)||[]).length,1);
 }
});
function loadData(rel){const module={exports:{}};const code=buildSync({entryPoints:[path.join(root,'src',rel)],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent'}).outputFiles[0].text;vm.runInNewContext(code,{module,exports:module.exports,URL,URLSearchParams,Date,Intl});return module.exports;}
const deps={...loadData('data/decision-passport.js'),...loadData('data/locale-routing.js'),...loadData('data/telegram-decision-return.js')};
function mounted({raw,throws=false,search=''}={}){
 const map=new Map([['unrelated','keep']]);if(raw!==undefined)map.set(deps.ANONYMOUS_DECISION_RESUME_STORAGE_KEY,raw);let reads=0,writes=0,removes=[];
 const storage={getItem(k){reads++;if(throws)throw Error('denied');return map.get(k)||null;},setItem(k,v){writes++;if(throws)throw Error('denied');map.set(k,v);},removeItem(k){removes.push(k);if(throws)throw Error('denied');map.delete(k);}};
 let cursor=0,dirty=false;const slots=[],pending=[];const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(x=>x!=null&&x!==false)}),useState(initial){const i=cursor++;if(!(i in slots))slots[i]={value:initial};return[slots[i].value,v=>{if(!Object.is(slots[i].value,v)){slots[i].value=v;dirty=true;}}];},useMemo(fn){return fn();},useEffect(fn,ds){const i=cursor++;const old=slots[i];if(!old||ds.some((v,j)=>!Object.is(v,old.ds[j])))pending.push(()=>{old?.cleanup?.();slots[i]={ds,cleanup:fn()};});}};
 const win={localStorage:storage,location:{search,pathname:'/compare/binance-vs-okx',hash:'#top'},history:{replaceState(){}}},module={exports:{}};
 vm.runInNewContext(transformSync(source,{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,require:n=>n==='react'?React:deps,React,window:win,Date,Intl,URLSearchParams});
 let tree;const props={locale:'en',expectedKind:'compare',expectedId:'binance-vs-okx',continueHash:'#compare-snapshot'};
 return{map,removes,get reads(){return reads;},get writes(){return writes;},render(extra={}){Object.assign(props,extra);for(let i=0;i<5;i++){cursor=0;dirty=false;tree=module.exports.TelegramReturnBanner(props);while(pending.length)pending.shift()();if(!dirty)return tree;}throw Error('effect loop');},unmount(){for(const s of slots)s?.cleanup?.();}};
}
const nodes=t=>t&&typeof t==='object'?[t,...t.children.flatMap(nodes)]:[];
test('controlled lifecycle actual source effect loads saved state once; parent renders do not write or control native open',()=>{
 const h=mounted({raw:JSON.stringify(snapshot)});let t=h.render();assert.equal(h.reads,1);assert.equal(h.writes,0);assert.equal(t.props['data-anonymous-decision-resume'],'available');
 let d=nodes(t).find(n=>n.type==='details');assert.ok(d);assert.ok(!Object.hasOwn(d.props,'open'));assert.ok(!Object.hasOwn(d.props,'onToggle'));
 for(let i=0;i<3;i++){t=h.render();assert.equal(h.reads,1);assert.equal(h.writes,0);d=nodes(t).find(n=>n.type==='details');assert.ok(!Object.hasOwn(d.props,'open'));}
 t=h.render({locale:'de'});assert.equal(h.reads,2);assert.equal(h.writes,0);assert.ok(!Object.hasOwn(nodes(t).find(n=>n.type==='details').props,'open'));h.unmount();
});
test('controlled lifecycle invalid/tampered/unavailable storage stays null; clear removes only original key',()=>{
 for(const options of [{},{raw:'not JSON'},{raw:JSON.stringify({...snapshot,state:{referral:'nexu888'}})},{raw:JSON.stringify(snapshot),throws:true}]){const h=mounted(options);assert.equal(h.render(),null);assert.equal(h.writes,0);assert.equal(h.map.get('unrelated'),'keep');}
 const h=mounted({raw:JSON.stringify(snapshot)}),t=h.render();nodes(t).find(n=>n.type==='button').props.onClick();assert.equal(h.render(),null);assert.deepEqual(h.removes,[deps.ANONYMOUS_DECISION_RESUME_STORAGE_KEY]);assert.equal(h.map.get('unrelated'),'keep');assert.equal(h.writes,0);
});
test('state effects/helpers/clear behavior and true Telegram branch are byte-preserved', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname },()=>{
 const begin=s=>s.slice(s.indexOf('export function TelegramReturnBanner'),s.indexOf('  if (!state && resumeState)'));
 assert.equal(begin(source),begin(before));const clear=s=>s.match(/    const clearResume = \(\) => \{[\s\S]*?    \};/)?.[0];assert.equal(clear(source),clear(before));const tail=s=>s.slice(s.indexOf('  const shownMarket = state.market'));assert.equal(tail(source),tail(before));
 const helper=s=>s.slice(s.indexOf('const localeKey'),s.indexOf('export function TelegramReturnBanner'));assert.equal(helper(source),helper(before));
 for(const file of ['src/data/decision-passport.js','src/data/telegram-decision-return.js','src/data/partner-registry.js'])assert.equal(readFileSync(path.join(root,file),'utf8'),readFileSync(path.join(base,file),'utf8'));
});
test('anonymous-only styles append to exact original CSS; touch and focus44px and no clipping', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname },()=>{
 const css=readFileSync(path.join(root,'src/components/v3/telegram-return-banner.css'),'utf8'),old=readFileSync(path.join(base,'src/components/v3/telegram-return-banner.css'),'utf8');assert.ok(css.startsWith(old));let ast=postcss.parse(css.slice(old.length));assert.ok(ast.nodes.length>0);let rules=[];ast.walkRules(r=>rules.push(r));assert.ok(rules.every(r=>r.selector.includes('.v3-telegram-return-banner--anonymous')));
 assert.ok(rules.some(r=>r.nodes.some(d=>d.prop==='min-height'&&d.value==='44px')));assert.ok(rules.some(r=>r.selector.includes(':focus-visible')));for(const r of rules)assert.ok(!r.nodes.some(d=>['overflow','overflow-x','text-overflow','word-break'].includes(d.prop)));
});
test('controlled lifecycle real return effect saves only whitelisted context once; write errors preserve Telegram rendering',()=>{
 const context=deps.buildTelegramReturnContext({pair:'binance-vs-okx',market:'BR',product:'spot',locale:'en',scenario:'compare',now:Date.now()});const search=new URL(context.href,'https://nexualpha.example').search;
 const h=mounted({search});let t=h.render({expectedKind:'pair'});assert.equal(t.props['data-telegram-return-banner'],'restored');assert.equal(h.writes,1);assert.equal(h.reads,1);
 const stored=JSON.parse(h.map.get(deps.ANONYMOUS_DECISION_RESUME_STORAGE_KEY));assert.equal(stored.version,1);assert.equal(stored.anonymousOnly,true);assert.equal(stored.state.pair,'binance-vs-okx');assert.doesNotMatch(JSON.stringify(stored),/tg_|referral|invite|identity|accountId/);
 h.render();assert.equal(h.writes,1);assert.equal(h.reads,1);
 const denied=mounted({search,throws:true});t=denied.render({expectedKind:'pair'});assert.equal(t.props['data-telegram-return-banner'],'restored');assert.equal(denied.writes,1);assert.equal(denied.map.get('unrelated'),'keep');
});
