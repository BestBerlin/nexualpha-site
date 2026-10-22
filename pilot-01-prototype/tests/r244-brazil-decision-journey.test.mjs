import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {buildSync} from 'esbuild';
import {createHash} from 'node:crypto';
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

const root=fileURLToPath(new URL('../',import.meta.url)),base=fileURLToPath(new URL('../../../r243-final-experience-integration/candidate/',import.meta.url)),require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
class FixedDate extends Date { constructor(...a){super(...(a.length?a:[1791190800000]));} static now(){return 1791190800000;} }
function load(r){const code=buildSync({stdin:{contents:r===root?projectApproved('src/components/v3/international/BrazilDecisionPage.jsx',fs.readFileSync(path.join(r,'src/components/v3/international/BrazilDecisionPage.jsx'),'utf8'),'r260-final-task-integration'):fs.readFileSync(path.join(r,'src/components/v3/international/BrazilDecisionPage.jsx'),'utf8'),resolveDir:path.join(r,'src/components/v3/international'),loader:'jsx'},jsx:'automatic',bundle:true,write:false,format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}}).outputFiles[0].text,m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require,console,URL,URLSearchParams,Intl,Date:FixedDate,setTimeout,clearTimeout});return m.exports.BrazilDecisionPage;}const current=load(root),previous=load(base);
const render=(C,p,s)=>renderToStaticMarkup(React.createElement(C,{pathname:p,initialUrl:'https://nexualpha.com'+p+s,locale:'pt-BR',trackGrowthDecision:()=>{}}));
const anchors=h=>[...h.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]).sort();const texts=h=>(h.match(/>[^<>]+</g)||[]).map(x=>x.slice(1,-1).trim()).filter(Boolean).sort();
function ancestors(h,position){const stack=[];for(const m of h.slice(0,position).matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/gi)){if(m[0].startsWith('</')){const i=stack.map(t=>t.name).lastIndexOf(m[1]);if(i>=0)stack.splice(i);}else if(!/^(?:input|br|hr|img|meta|link|source|wbr)$/.test(m[1]))stack.push({name:m[1],tag:m[0]});}return stack;}
const states=['?market=BR&product=spot','?market=BR&product=spot&platform=binance&amount=2300&spot_fee_bps=12&deposit_fee_pct=0.2&deposit_fixed_brl=3&utm_source=creator&utm_campaign=source_a&account_stage=new&funding=pix','?market=BR&product=spot&platform=okx','?market=TW&product=spot&platform=binance','?market=BR&product=perpetuals&platform=okx','?market=BR&product=unknown'];
for(const s of states)test('/br main workbench and secondary continuity '+s,()=>{const h=render(current,'/br',s),old=render(previous,'/br',s);assert.match(h,/class="br-primary-workbench"/);assert.ok(h.indexOf('id="br-shortlist-title"')<h.indexOf('class="br-continuation-disclosure'));const chainAt=h.indexOf('class="br-chain '),bots=[...h.matchAll(/<a\b[^>]*href="https:\/\/t.me\/NexuAlphaAssistantBot[^>]*>/g)];assert.equal(bots.length,3);for(const at of [chainAt,...bots.map(m=>m.index)]){const d=ancestors(h,at).find(a=>a.tag.includes('br-continuation-disclosure'));assert.ok(d);assert.doesNotMatch(d.tag,/\bopen=/);}assert.equal(new Set(bots.map(m=>m[0].match(/href="([^"]*)"/)[1])).size,2);assert.deepEqual(anchors(h),anchors(old));const currentText=texts(h);const label=h.match(/class="br-continuation-disclosure[^>]*><summary>([^<]*)/)[1];currentText.splice(currentText.indexOf(label),1);assert.deepEqual(currentText,texts(old));for(const needle of ['id="br-decision-controls"','class="br-cost-options"','id="br-shortlist-title"'])assert.ok(ancestors(h,h.indexOf(needle)).some(a=>a.tag.includes('class="br-primary-workbench"')));assert.match(h,/confirme Pix, CPF, titularidade bancária/);});
for(const p of ['/br/comparar','/br/pix','/br/saque-pix','/br/custos','/br/conta','/br/kyc-cpf'])test(p+' all SSR unchanged',()=>{for(const s of states)assert.equal(render(current,p,s),render(previous,p,s));});
test('all data/config/public and registry frozen exact',()=>{for(const folder of ['src/data','config','public']){const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.isFile()?[path.join(d,e.name)]:[]);for(const f of walk(path.join(base,folder))){const file=path.relative(base,f),bytes=fs.readFileSync(path.join(root,file));assert.deepEqual(['src/data/news-feed-client.js','src/data/seo-injection.js'].includes(file)?Buffer.from(projectApproved(file,bytes.toString(),'r273-final-experience-integration')):bytes,fs.readFileSync(f),f);}}assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'src/data/partner-registry.js'))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
test('only exact bounded composition and legacy two-order assertions change',()=>{const hunks=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/r244-approved-hunks.json')));for(const [f,list]of Object.entries(hunks)){let h=fs.readFileSync(path.join(root,f),'utf8');if(['src/components/v3/international/BrazilDecisionPage.jsx','tests/brazil-decision.test.mjs'].includes(f))h=projectApproved(f,h,'r260-final-task-integration');if(f==='src/components/v3/international/brazil-decision-page.css')h=projectApproved(f,h,'r245-final-journey-integration');for(const x of [...list].reverse()){if(x.after){assert.equal(h.split(x.after).length,2,f);h=h.replace(x.after,x.before);}else assert.fail('unexpected deleted-only hunk');}assert.equal(h,fs.readFileSync(path.join(base,f),'utf8'),f);}});
}
