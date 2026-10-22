import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../POR-PROFILE-BASELINE.jsx", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const req=createRequire(import.meta.url),React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{transformSync}=req('esbuild');
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const source=read('../src/components/v3/V3Pages.jsx'),before=read('../../POR-PROFILE-BASELINE.jsx');
const oldClass='className="v3-metric-tile__val text-green" translate="no">{porVerified ? porRatio';
const newClass='className={`v3-metric-tile__val${porVerified ? " text-green" : ""}`} translate="no">{porVerified ? porRatio';
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];
function render(text,porVerified,locale){
 const row=text.split('\n').filter(x=>x.includes('v3-metric-tile__val') && x.includes('>{porVerified ? porRatio'));
 assert.equal(row.length,1);
 const code='export function Subject(props){ const {porVerified,porRatio,locale}=props;const isZhLocale=locale.startsWith("zh"); const zhText=(l,a,b)=>l==="zh-Hant"?b:a;const runtimeUi={pendingVerification:"PENDING_"+locale}; return ('+row[0].trim()+'); }';
 const module={exports:{}};vm.runInNewContext(transformSync(code,{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,React});
 return renderToStaticMarkup(React.createElement(module.exports.Subject,{porVerified,porRatio:'VERIFIED_RATIO',locale}));
}
test('unknown PoR inherits neutral base style; verified remains green across both rendered states and 15 locale branches',()=>{
 for(const locale of locales){
  const verified=render(source,true,locale);assert.equal(verified,render(before,true,locale));assert.match(verified,/class="v3-metric-tile__val text-green"/);
  const pending=render(source,false,locale);assert.match(pending,/class="v3-metric-tile__val"/);assert.doesNotMatch(pending,/text-green/);
  assert.equal(pending.replace('class="v3-metric-tile__val"','class="v3-metric-tile__val text-green"'),render(before,false,locale));
 }
});
const changes=[[oldClass,newClass],['className="v3-por-metric-value text-green" translate="no">{porVerified ? porRatio','className={`v3-por-metric-value${porVerified ? " text-green" : ""}`} translate="no">{porVerified ? porRatio'], ...['106.2%','104.8%','108.5%'].map(v=>['className="text-green" translate="no">{porVerified ? "'+v+'"','className={porVerified ? "text-green" : ""} translate="no">{porVerified ? "'+v+'"'])];
test('the one approved class expression inverse restores every original source byte including all text gates and hrefs',()=>{
 assert.equal(createHash('sha256').update(before).digest('hex'),'60f70061723c7e56f9f3f78bf9f0e16a146dd4555d5b009f5af806e6753d9689');assert.equal(source.split(newClass).length-1,1);assert.equal(before.split(oldClass).length-1,1);let restored=source;for(const [oldValue,newValue] of changes){assert.equal(restored.split(newValue).length-1,1);assert.equal(before.split(oldValue).length-1,1);restored=restored.replace(newValue,oldValue);}assert.equal(restored,before);
 assert.match(source,/const porVerified = Boolean\(db.porVerifiedAt && db.porAuditUrl\);/);
 assert.match(source,/porVerified \? \(db.auditFirm/);
});
test('the existing base value has no success color and immutable partner registry remains exact',()=>{
 const css=read('../src/styles/fintech-premium.css');const rule=css.match(/\.v3-metric-tile__val \{([^}]+)\}/)[1];assert.doesNotMatch(rule,/color:/);
 assert.equal(createHash('sha256').update(read('../src/data/partner-registry.js')).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});

test('all five real PoR value JSX branches keep positive green and remove it only for unknown state',()=>{
 for(const [oldValue,newValue] of changes){
  const oldRow=before.split('\n').find(line=>line.includes(oldValue));
  const row=source.split('\n').find(line=>line.includes(newValue));assert.ok(row,'approved conditional row required');
  for(const locale of locales){
   function renderRow(line,porVerified){const module={exports:{}};const code='export function Subject(props){const {porVerified,locale}=props;const porRatio="VERIFIED_RATIO",isZh=locale.startsWith("zh"),isZhLocale=isZh,zhText=(l,a,b)=>l==="zh-Hant"?b:a,ui={pending:"PENDING_"+locale},runtimeUi={pendingVerification:"PENDING_"+locale};return ('+line.trim()+');}';vm.runInNewContext(transformSync(code,{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,React});return renderToStaticMarkup(React.createElement(module.exports.Subject,{porVerified,locale}));}
   assert.equal(renderRow(row,true),renderRow(oldRow,true));
   const pending=renderRow(row,false),oldPending=renderRow(oldRow,false);assert.doesNotMatch(pending,/text-green/);
   assert.equal(pending.replace(/class="([^"]*)"/,(_,cls)=>'class="'+(cls?cls+' ':'')+'text-green"'),oldPending);
  }
 }
});
}
