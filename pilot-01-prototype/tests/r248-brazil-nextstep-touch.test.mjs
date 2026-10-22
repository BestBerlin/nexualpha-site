import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {buildSync} from 'esbuild';
import postcss from 'postcss';
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
const { projectApproved: projectApproved } = await import("./helpers/r237-approved-inverses.mjs");

const root=fileURLToPath(new URL('../',import.meta.url)),base=fileURLToPath(new URL('../../../r245-final-journey-integration/candidate/',import.meta.url)),require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),file='src/components/v3/international/brazil-decision-page.css',component='src/components/v3/international/BrazilDecisionPage.jsx',css=fs.readFileSync(path.join(root,file),'utf8'),old=fs.readFileSync(path.join(base,file),'utf8'),addition='\n/* BR next-step controls keep the project 44px touch target. */\n.br-next-steps a { min-height: 44px; }\n';
test('ordered relevant CSS cascade gives BR next-step44 while chain retains40',()=>{const ast=postcss.parse(css);const winner=selector=>{let result;ast.walkRules(r=>{if(r.parent.type==='root'&&r.selectors.includes(selector))r.walkDecls('min-height',d=>result=d.value);});return result;};assert.equal(winner('.br-next-steps a'),'44px');assert.equal(winner('.br-chain__actions a'),'40px');assert.equal(winner('.br-chain__evidence a'),'40px');});
test('exact CSS inverse; only touch-height override added',()=>{assert.equal(css.split(addition).length,2);assert.equal(css.replace(addition,''),old);assert.equal(projectApproved(component,fs.readFileSync(path.join(root,component),'utf8'),'r260-final-task-integration'),fs.readFileSync(path.join(base,component),'utf8'));});
class FixedDate extends Date{constructor(...a){super(...(a.length?a:[1791190800000]));}static now(){return 1791190800000;}}
function load(r){const m={exports:{}};vm.runInNewContext(buildSync({stdin:{contents:r===root?projectApproved(component,fs.readFileSync(path.join(r,component),'utf8'),'r260-final-task-integration'):fs.readFileSync(path.join(r,component),'utf8'),resolveDir:path.dirname(path.join(r,component)),loader:'jsx'},jsx:'automatic',bundle:true,write:false,format:'cjs',platform:'node',external:['react'],loader:{'.css':'empty'}}).outputFiles[0].text,{module:m,exports:m.exports,require,console,URL,URLSearchParams,Intl,Date:FixedDate});return m.exports.BrazilDecisionPage;}const a=load(root),b=load(base);
for(const p of ['/br','/br/comparar','/br/pix','/br/saque-pix','/br/custos','/br/conta','/br/kyc-cpf'])test(p+' original completeSSR with Bot parameters untouched',()=>{for(const s of ['?market=BR&product=spot','?market=BR&product=spot&platform=binance','?market=BR&product=spot&platform=okx','?market=TW&product=spot','?market=BR&product=perpetuals','?market=BR&product=unknown']){const props={pathname:p,initialUrl:'https://nexualpha.com'+p+s,locale:'pt-BR',trackGrowthDecision:()=>{}};assert.equal(renderToStaticMarkup(React.createElement(a,props)),renderToStaticMarkup(React.createElement(b,props)));}});
}
