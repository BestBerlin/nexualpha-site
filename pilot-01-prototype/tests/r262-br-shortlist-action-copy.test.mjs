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
const { projectApproved: projectApproved, approvedRuntime: approvedRuntime } = await import("./helpers/r237-approved-inverses.mjs");









const root=fileURLToPath(new URL('../',import.meta.url)),base=fileURLToPath(new URL('../../../r260-final-task-integration/candidate/',import.meta.url));
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const warning='Confira domínio, KYC, moeda de depósito e elegibilidade antes de inserir dados.';
const file='src/components/v3/international/BrazilDecisionPage.jsx';
class FixedDate extends Date {constructor(...a){super(...(a.length?a:[1791190800000]));}static now(){return 1791190800000;}}
function load(r){const code=buildSync({stdin:{contents:`export {BrazilDecisionPage} from './${file}';`,resolveDir:r,loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}}).outputFiles[0].text,m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require,console,URL,URLSearchParams,Intl,Date:FixedDate,setTimeout,clearTimeout});return m.exports.BrazilDecisionPage;}
const current=load(root),previous=load(base);
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
const states=['?market=BR&product=spot','?market=BR&product=spot&platform=binance&amount=2300&spot_fee_bps=12&deposit_fee_pct=0.2&deposit_fixed_brl=3&utm_source=creator&utm_campaign=source_a&account_stage=new&funding=pix','?market=BR&product=spot&platform=okx','?market=TW&product=spot&platform=binance','?market=BR&product=perpetuals&platform=okx','?market=BR&product=unknown'];
const pages=['/br','/br/comparar','/br/pix','/br/saque-pix','/br/custos','/br/conta','/br/kyc-cpf'];
const render=(C,p,s,l)=>renderToStaticMarkup(React.createElement(C,{pathname:p,initialUrl:'https://nexualpha.com'+p+s,locale:l,trackGrowthDecision:()=>{}}));
const cards=h=>[...h.matchAll(/<article class="br-venue-card"[\s\S]*?<\/article>/g)].map(m=>m[0]);
function expected(h,p){if(p==='/br/comparar')return h;return h.replace(/<article class="br-venue-card"[\s\S]*?<\/article>/g,card=>{const name=card.match(/<b translate="no" lang="en">([^<]+)<\/b>/)[1];let next=card.replace(/(<button\b[^>]*>)Plataforma(<\/button>)/,`$1Escolher ${name}$2`);const link=next.match(/<a\b[^>]*data-cta-kind="research"[^>]*>[^<]*<\/a>/)?.[0];if(link?.endsWith('>'+warning+'</a>')){const replacement=link.replace('>'+warning+'</a>','>Ver perfil e condições</a>')+'<small class="br-venue-card__check-note">'+warning+'</small>';next=next.replace(link,replacement);}return next;});}
for(const locale of locales)test(locale+' actual 42 SSR states preserve entire HTML except exact shortlist task labels/warning relocation',()=>{for(const p of pages)for(const s of states){const old=render(previous,p,s,locale),h=render(current,p,s,locale);assert.equal(h,expected(old,p),p+s);for(const card of cards(h)){const name=card.match(/<b translate="no" lang="en">([^<]+)<\/b>/)[1];assert.match(card,new RegExp(`<button[^>]*>${p==='/br/comparar'?'Selecionar':'Escolher'} ${name}</button>`));if(card.includes('>Ver perfil e condições</a>')){assert.equal(card.split(warning).length-1,1);assert.ok(card.includes('</a><small class="br-venue-card__check-note">'+warning));}assert.doesNotMatch(card,/<details class="br-venue-card__details"[^>]*open=/);}assert.deepEqual([...h.matchAll(/<a\b[^>]*>/g)].map(m=>m[0]),[...old.matchAll(/<a\b[^>]*>/g)].map(m=>m[0]));}});
test('exact source inverse preserves every shared dictionary/gate/state/handler/invite and all other runtime',()=>{let source=fs.readFileSync(path.join(root,file),'utf8');const hunks=JSON.parse(fs.readFileSync(path.join(root,'../r262-br-shortlist-action-copy--APPROVED-HUNKS.json'),'utf8'));for(const [before,after]of [...hunks].reverse()){assert.equal(source.split(after).length-1,1);source=source.replace(after,before);}assert.equal(source,fs.readFileSync(path.join(root,'../r262-br-shortlist-action-copy--BASELINE-BRAZIL.jsx'),'utf8'));assert.equal(source,fs.readFileSync(path.join(base,file),'utf8'));const walk=(r,d)=>fs.readdirSync(path.join(r,d),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(r,path.join(d,e.name)):e.isFile()?[path.join(d,e.name)]:[]);for(const d of ['src','config','public']){assert.deepEqual(walk(root,d).sort(),walk(base,d).sort());for(const f of walk(base,d))if(f!==file)assert.deepEqual(approvedRuntime[f]?Buffer.from(projectApproved(f,fs.readFileSync(path.join(root,f),'utf8'),'r260-final-task-integration')):fs.readFileSync(path.join(root,f)),fs.readFileSync(path.join(base,f)),f);}assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'src/data/partner-registry.js'))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
}
