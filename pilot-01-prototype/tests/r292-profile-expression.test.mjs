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
const historicalFixture = new URL("../../expression/PATCH.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const root=new URL('../',import.meta.url),ev=new URL('../../expression/',import.meta.url),old=new URL('../../../r291-profile-editorial-language/candidate/',import.meta.url),read=(b,f)=>readFileSync(new URL(f,b),'utf8'),hash=s=>createHash('sha256').update(s).digest('hex'),patch=JSON.parse(read(ev,'PATCH.json')),source=read(root,'src/components/v3/V3Pages.jsx');
function restore(value){for(const h of patch.hunks){assert.equal(value.split(h.after).length,2);value=value.replace(h.after,h.before);}return value;}
function unwrap(html){html=html.replace('<div class="v3-profile-reading-layout"><div class="v3-profile-reading-overview">','');html=html.replace('</div><div class="v3-profile-action-column">','');html=html.replace('</div></div><details class="v3-registration-notes v3-venue-invitation-disclosure">','<details class="v3-registration-notes v3-venue-invitation-disclosure">');return html;}
test('exact conditional title-only inverse protects complete V3 source',()=>{assert.equal(source.split(patch.after).length,2);assert.equal(restore(source),read(ev,'V3Pages.before.jsx'));assert.equal(hash(restore(source)),patch.sha);assert.throws(()=>assert.equal(restore(source).replace('onClick={handleCopyCode}', 'onClick={() => {}}'),read(ev,'V3Pages.before.jsx')));assert.equal(hash(read(root,'src/data/partner-registry.js')),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');async function load(u){const code=(await build({stdin:{contents:"export {VenueDetailPage} from './src/components/v3/V3Pages.jsx';export {venueDatabase} from './src/data/venue-database.js';export {priorityVenueAnswerFor} from './src/data/priority-venue-answers.js';export {v3Copy} from './src/data/v3-product.js';",resolveDir:fileURLToPath(u),loader:'jsx'},bundle:true,write:false,platform:'node',format:'cjs',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}})).outputFiles[0].text,m={exports:{}};class FixedDate extends Date{constructor(...a){super(...(a.length?a:[1791264000000]));}static now(){return 1791264000000;}}vm.runInNewContext(code,{module:m,exports:m.exports,require,console,Intl,URL,URLSearchParams,Date:FixedDate,setTimeout,clearTimeout});return m.exports;}
const a=await load(root),b=await load(old);let matched=0;
for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'])test(locale+' real detail DOM differs only for exact repeated priority title',()=>{for(const slug of ['binance','hyperliquid','uniswap','gmx','drift','deribit']){const props=m=>({locale,venue:m.venueDatabase[slug],venues:Object.values(m.venueDatabase),updates:[],copy:{common:{dimension:'Dimension'},assetCapabilities:{none:'Pending source review'}},market:'unknown',product:'unknown'});const normalizeIds=html=>{const ids=[...html.matchAll(/\bid="(_R_[^" ]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);for(const [i,id]of ids.entries()){assert.ok(html.includes(`for="${id}"`)||html.includes(`aria-describedby="${id}"`)||html.includes(`aria-labelledby="${id}"`),"generated id retains association");html=html.replaceAll(id,`REACT_USEID_${i}`);}return html;};const x=normalizeIds(unwrap(renderToStaticMarkup(React.createElement(a.VenueDetailPage,props(a))))),y=normalizeIds(renderToStaticMarkup(React.createElement(b.VenueDetailPage,props(b)))),answer=a.priorityVenueAnswerFor(slug,locale);if(answer&&answer.ownerQuestion===answer.title){const strong=renderToStaticMarkup(React.createElement('strong',null,answer.title));const bodyStart=y.indexOf('class="v3-venue-direct-answer"');const idx=y.indexOf(strong,bodyStart);assert.ok(idx>=0);assert.equal(x,y.slice(0,idx)+y.slice(idx+strong.length));assert.ok(x.includes('aria-label="'+answer.title.replaceAll('&','&amp;').replaceAll('"','&quot;')+'"'));matched++;}else { let n=0;while(n<Math.max(x.length,y.length)&&x[n]===y[n])n++; assert.equal(x,y,`first diff ${n}: ${x.slice(n-90,n+150)} VS ${y.slice(n-90,n+150)}`); }}});
test('actual duplicate exists in current records',()=>{console.log({actualRemovedDuplicateTitles:matched});assert.ok(matched>0);});
}
