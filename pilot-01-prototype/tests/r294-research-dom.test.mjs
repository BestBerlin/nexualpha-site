import test from 'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{build}from'esbuild';
import{createRequire}from'node:module';
import vm from'node:vm';
import{fileURLToPath}from'node:url';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../research-dom/PATCH.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const root=new URL('../',import.meta.url),ev=new URL('../../research-dom/',import.meta.url),old=new URL('../../../r293-home-platform-index/candidate/',import.meta.url),read=(b,f)=>readFileSync(new URL(f,b),'utf8'),hash=s=>createHash('sha256').update(s).digest('hex'),patch=JSON.parse(read(ev,'PATCH.json')),source=read(root,'src/components/v3/V3Pages.jsx');
function restore(value){for(const h of patch.hunks){assert.equal(value.split(h.after).length,2);value=value.replace(h.after,h.before);}return value;}
test('whole source exact inverse preserves all existing atoms and registry',()=>{assert.equal(hash(restore(source)),patch.sha);assert.equal(restore(source),read(ev,'V3Pages.before.jsx'));for(const atom of [...Object.values(patch.atoms),patch.iteration2.costBody,patch.iteration2.decisionBody])assert.equal(source.split(atom).length,2);assert.throws(()=>assert.equal(restore(source).replace('onClick={handleCopyCode}','onClick={() => {}}'),read(ev,'V3Pages.before.jsx')));assert.equal(hash(read(root,'src/data/partner-registry.js')),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');async function load(u){const code=(await build({stdin:{contents:"export {VenueDetailPage} from './src/components/v3/V3Pages.jsx';export {venueDatabase} from './src/data/venue-database.js';export {priorityVenueAnswerFor} from './src/data/priority-venue-answers.js';export {v3Copy} from './src/data/v3-product.js';",resolveDir:fileURLToPath(u),loader:'jsx'},bundle:true,write:false,platform:'node',format:'cjs',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}})).outputFiles[0].text,m={exports:{}};class FixedDate extends Date{constructor(...a){super(...(a.length?a:[1791264000000]));}static now(){return 1791264000000;}}vm.runInNewContext(code,{module:m,exports:m.exports,require,console,Intl,URL,URLSearchParams,Date:FixedDate,setTimeout,clearTimeout});return m.exports;}
const a=await load(root),b=await load(old);
function textNodes(html){return [...html.matchAll(/>([^<>]+)</g)].map(x=>x[1].trim()).filter(x=>x&&x!=="＋").sort();}
const links=html=>[...html.matchAll(/href="([^"]*)"/g)].map(m=>m[1]).sort();
for(const locale of Object.keys(patch.rows))test(locale+' real task chapters preserve original content and all href multiplicities',()=>{for(const slug of ['binance','hyperliquid','uniswap','gmx','drift','deribit']){const props=m=>({locale,venue:m.venueDatabase[slug],venues:Object.values(m.venueDatabase),updates:[],copy:{common:{dimension:'Dimension'},assetCapabilities:{none:'Pending source review'}},market:'unknown',product:'unknown'});const current=renderToStaticMarkup(React.createElement(a.VenueDetailPage,props(a))),before=renderToStaticMarkup(React.createElement(b.VenueDetailPage,props(b)));let body=current;
for(const title of patch.rows[locale]){const h=renderToStaticMarkup(React.createElement('h2',{className:'v3-profile-research-chapter__heading'},title));assert.equal(body.split(h).length,2);body=body.replace(h,'');}
const newTask=renderToStaticMarkup(React.createElement("strong",null,patch.accountSummaryRows[locale]));assert.equal(body.split(newTask).length,2);body=body.replace(newTask,"");assert.deepEqual(textNodes(body),textNodes(before));const originalReviewTags=[...before.matchAll(/<a\b[^>]*class="button-quiet v3-profile-registration-review-link"[^>]*>/g)].map(m=>m[0]);assert.equal(originalReviewTags.length,1);assert.ok(originalReviewTags[0].includes("#registration-path"));const expectedBefore=before.replace(originalReviewTags[0],originalReviewTags[0].replace("#registration-path","#registration-checklist"));assert.deepEqual(links(current),links(expectedBefore));const changedReviewTags=[...current.matchAll(/<a\b[^>]*class="button-quiet v3-profile-registration-review-link"[^>]*>/g)].map(m=>m[0]);assert.equal(changedReviewTags.length,1);assert.ok(changedReviewTags[0].includes("#registration-checklist"));for(const task of ['account','sources','follow-up'])assert.equal((current.match(new RegExp('data-research-task="'+task+'"','g'))||[]).length,1);
const ids=[...current.matchAll(/\bid="([^" ]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);for(const id of ids.filter(x=>x.startsWith('_R_')))assert.ok(current.includes(`for="${id}"`)||current.includes(`aria-describedby="${id}"`)||current.includes(`aria-labelledby="${id}"`));for(const id of ['registration-path','registration-checklist','fee-schedule','proof-of-reserves','anti-phishing','platform-facts','telegram-monitor','faq'])assert.equal(current.includes(`id="${id}"`),before.includes(`id="${id}"`));assert.equal((current.match(/v3-profile-account-disclosure/g)||[]).length,1);assert.ok(!current.includes('<details class="v3-profile-cost-conditions"'));assert.ok(!current.includes('<details class="v3-registration-notes">'));assert.ok(current.indexOf('v3-profile-research-hub')>current.indexOf('registration-path'));
}});
}
