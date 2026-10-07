import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const req=createRequire(import.meta.url), React=req('react'), {renderToStaticMarkup}=req('react-dom/server'), {buildSync}=req('esbuild');
const base=new URL('../../../r151-reader-integration/candidate/',import.meta.url),current=process.env.R156_BASELINE_TEST==='1'?base:new URL('../',import.meta.url);
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
for(const locale of locales)test(`R156 ${locale} actual SSR content/link parity and earlier route`,()=>{
 for(const [q,slug,mode]of [['','binance','direct'],['','bitget','direct'],['okx','okx','direct'],['unmatchablezzz','binance','direct'],['','binance','compare']]){
  const a=panel(oldHero,locale,q,slug,mode),b=panel(newHero,locale,q,slug,mode);
  assert.deepEqual(anchors(b),anchors(a),`${q}/${slug}/${mode} full anchor markup`);assert.deepEqual(text(b),text(a),`${q}/${slug}/${mode} all copy/conditions/codes`);
  if(mode==='compare')assert.equal(b,a,'comparison subtree byte unchanged');
  else{assert.ok(b.indexOf('growth-platform-list')<b.indexOf('growth-selected-route'));assert.ok(b.indexOf('growth-selected-route')<b.indexOf('growth-platform-search'),'search follows CTA channel DOM');assert.ok(b.indexOf('registration-card__preflight')<b.indexOf('registration-card__primary-btn'),'full preflight remains before action');assert.match(b,/growth-direct-workbench/);}
 }
 for(const slug of ['binance','bitget','coinbase'])for(const compact of [false,true]){
  sequence=null;const render=P=>renderToStaticMarkup(React.createElement(P,{venueSlug:slug,locale,compact}));const a=render(oldReg),b=render(newReg);
  if(!compact)assert.equal(b,a,'noncompact exact HTML');else{assert.deepEqual(anchors(b),anchors(a));assert.deepEqual(text(b),text(a));assert.ok(b.indexOf('registration-card__preflight')<b.indexOf('registration-card__primary-btn'));if(slug!=='coinbase')assert.match(b,/registration-card__code-benefit/);}
 }
});
test('R156 only HomeDecisionPanel render changes, all state/CTA functions and noncompact code preserved',()=>{
 const p='src/components/v3/LeanHero.jsx',a=read(base,p),b=read(current,p),start=s=>s.indexOf('  return (',s.indexOf('function HomeDecisionPanel(')),end=s=>s.indexOf('\nexport function LeanHero(');
 assert.equal(b.slice(0,start(b)),a.slice(0,start(a)));assert.equal(b.slice(end(b)),a.slice(end(a)));
 for(const p of ['src/data/partner-registry.js','src/data/source-bound-cta.js','src/components/v3/registration-decision-state.js'])assert.equal(read(current,p),read(base,p));
});
test('R156 CSS only scoped additions preserve original fontsize, conditions visibility, focus and normal stylesheet prefix',()=>{
 for(const p of ['src/components/v3/growth-conversion.css','src/components/v3/registration-card.css']){
  const a=read(base,p),b=read(current,p);assert.ok(b.startsWith(a),p+' original CSS prefix');const extra=b.slice(a.length);
  assert.doesNotMatch(extra,/font-size\s*:|display\s*:\s*none|visibility\s*:\s*hidden|overflow\s*:\s*hidden|(?:^|[;{\n])\s*(?:max-)?height\s*:\s*[0-9]/);
  assert.doesNotMatch(extra,/^\s*(?:\*|button|a|body|html)\s*[{,:]/m);
 }
 const css=read(current,'src/components/v3/growth-conversion.css');assert.match(css,/@media \(min-width: 1025px\)[\s\S]*?\.growth-direct-workbench\s*\{[\s\S]*?grid-template-columns: minmax\(0, 0\.85fr\) minmax\(0, 1\.15fr\)/);
 assert.match(css,/\.growth-decision-panel \.growth-intent-switch button \{ min-height: 44px;/);
 const reg=read(current,'src/components/v3/registration-card.css');assert.match(reg,/\.registration-card--compact \.registration-card__code-benefit\s*\{\s*grid-column: 1 \/ -1;/);
});
test('R156 RegistrationCard JSX change is exclusively compact benefit placement; no copy/status/CTA handler edits',()=>{
 const p='src/components/v3/RegistrationCard.jsx',a=read(base,p),b=read(current,p);
 const removal='\n            {compact && benefitText && <span className="registration-card__benefit registration-card__code-benefit">{benefitText}</span>}';
 const restored=b.replace(removal,'').replace('{!compact && benefitText && <span className="registration-card__benefit">','{benefitText && <span className="registration-card__benefit">');
 assert.equal(restored,a);
});
