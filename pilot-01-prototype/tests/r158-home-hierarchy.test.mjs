import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const req=createRequire(import.meta.url), React=req('react'), {renderToStaticMarkup}=req('react-dom/server'), {buildSync}=req('esbuild');
const base=new URL('../../../r156-home-firstfold/candidate/',import.meta.url),current=process.env.R158_BASELINE_TEST==='1'?base:new URL('../',import.meta.url);
const read=(root,p)=>readFileSync(new URL(p,root),'utf8');
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
let sequence=null,idx=0;
class FixedDate extends Date { constructor(...args){super(...(args.length?args:[1791172800000]));} static now(){return 1791172800000;} }
const hooks={...React,useState:(init)=>sequence&&idx<sequence.length?[sequence[idx++],()=>{}]:React.useState(init)};
function load(root,p,extra=''){
 const text=read(root,p)+extra, file=fileURLToPath(new URL(p,root));
 const output=buildSync({stdin:{contents:text,resolveDir:path.dirname(file),sourcefile:file,loader:'jsx'},jsx:'automatic',bundle:true,write:false,format:'cjs',platform:'node',external:['react','react-dom','react/jsx-runtime'],loader:{'.css':'empty'}}).outputFiles[0].text;
 const module={exports:{}};vm.runInNewContext(output,{module,exports:module.exports,require:name=>name==='react'?hooks:req(name),URL,URLSearchParams,Intl,Date:FixedDate,console,setTimeout,clearTimeout});return module.exports;
}
const oldHero=load(base,'src/components/v3/LeanHero.jsx','\nexport { HomeDecisionPanel, getUi };'),newHero=load(current,'src/components/v3/LeanHero.jsx','\nexport { HomeDecisionPanel, getUi };');
const oldReg=load(base,'src/components/v3/RegistrationCard.jsx').RegistrationCard,newReg=load(current,'src/components/v3/RegistrationCard.jsx').RegistrationCard;
function panel(m,locale,q='',slug='binance',mode='direct') {sequence=[q,slug,mode];idx=0;try{return renderToStaticMarkup(React.createElement(m.HomeDecisionPanel,{locale,ui:m.getUi(locale)}));}finally{sequence=null;}}
const anchors=h=>[...h.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]).sort();
const text=h=>h.replace(/<[^>]+>/g,'\n').split('\n').map(x=>x.trim()).filter(Boolean).sort();
for(const locale of locales)test(`R158 ${locale} actual SSR content/link parity and earlier route`,()=>{
 for(const [q,slug,mode]of [['','binance','direct'],['','bitget','direct'],['okx','okx','direct'],['unmatchablezzz','binance','direct'],['','binance','compare']]){
  const a=panel(oldHero,locale,q,slug,mode),b=panel(newHero,locale,q,slug,mode);
  assert.deepEqual(anchors(b),anchors(a),`${q}/${slug}/${mode} full anchor markup`);assert.deepEqual(text(b.replace(/<summary class="growth-decision-explanation__summary"[^>]*>[\s\S]*?<\/summary>/,'')),text(a),`${q}/${slug}/${mode} all copy/conditions/codes`);
  if(mode==='compare')assert.equal(b,a,'comparison subtree byte unchanged');
  else{assert.match(b,/<details class="growth-decision-explanation">/);assert.ok(b.indexOf('growth-platform-search')<b.indexOf('growth-decision-explanation'));assert.ok(b.indexOf('growth-platform-list')<b.indexOf('growth-selected-route'));assert.ok(b.indexOf('growth-selected-route')<b.indexOf('growth-platform-search'),'search follows CTA channel DOM');assert.ok(b.indexOf('registration-card__preflight')<b.indexOf('registration-card__primary-btn'),'full preflight remains before action');assert.match(b,/growth-direct-workbench/);}
 }
 for(const slug of ['binance','bitget','coinbase'])for(const compact of [false,true]){
  sequence=null;const render=P=>renderToStaticMarkup(React.createElement(P,{venueSlug:slug,locale,compact}));const a=render(oldReg),b=render(newReg);
  if(!compact)assert.equal(b,a,'noncompact exact HTML');else{assert.deepEqual(anchors(b),anchors(a));assert.deepEqual(text(b),text(a));assert.ok(b.indexOf('registration-card__preflight')<b.indexOf('registration-card__primary-btn'));if(slug!=='coinbase')assert.match(b,/registration-card__code-benefit/);}
 }
});
test('R158 only HomeDecisionPanel render changes, all state/CTA functions and noncompact code preserved',()=>{
 const p='src/components/v3/LeanHero.jsx',a=read(base,p),b=read(current,p),start=s=>s.indexOf('  return (',s.indexOf('function HomeDecisionPanel(')),end=s=>s.indexOf('\nexport function LeanHero(');
 assert.equal(b.slice(0,start(b)),a.slice(0,start(a)));assert.equal(b.slice(end(b)),a.slice(end(a)));
 for(const p of ['src/data/partner-registry.js','src/data/source-bound-cta.js','src/components/v3/registration-decision-state.js'])assert.equal(read(current,p),read(base,p));
});
test('R158 CSS only appends scoped alignment, never reducing text size or hiding reader content',()=>{
 for(const p of ['src/components/v3/growth-conversion.css','src/components/v3/registration-card.css']){
  const a=read(base,p),b=read(current,p);assert.ok(b.startsWith(a));const extra=b.slice(a.length);
  assert.doesNotMatch(extra,/font-size\s*:|display\s*:\s*none|visibility\s*:\s*hidden|overflow\s*:\s*hidden/);
  assert.doesNotMatch(extra,/^\s*(?:\*|button|a|body|html)\s*[{,:]/m);
 }
 assert.match(read(current,'src/components/v3/registration-card.css'),/padding: 12px;/);
 assert.match(read(current,'src/components/v3/growth-conversion.css'),/growth-decision-explanation__summary/);
});
test('R158 RegistrationCard JSX remains exactly frozen R156',()=>assert.equal(read(current,'src/components/v3/RegistrationCard.jsx'),read(base,'src/components/v3/RegistrationCard.jsx')));
test('R158 native explanation is closed, contains only repeated intro, retains stable labelledby target',()=>{
 for(const locale of locales)for(const mode of ['direct','compare']){
  const html=panel(newHero,locale,'','binance',mode);
  assert.equal([...html.matchAll(/id="growth-decision-title"/g)].length,1);
  assert.match(html,/aria-labelledby="growth-decision-title"/);
  if(mode==='direct'){
   const d=html.match(/<details class="growth-decision-explanation">([\s\S]*?)<\/details>/);assert.ok(d);assert.doesNotMatch(d[1],/registration-card|growth-platform-list|growth-platform-search/);assert.match(d[1],/id="growth-decision-title"/);
   assert.ok(html.indexOf('registration-card__primary-btn')<html.indexOf('growth-decision-explanation'));
  }else assert.doesNotMatch(html,/growth-decision-explanation/);
 }
});
