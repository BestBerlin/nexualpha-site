import test from'node:test';
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
const historicalFixture = new URL("../../decision-dom/PATCH.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const root=new URL('../',import.meta.url),ev=new URL('../../decision-dom/',import.meta.url),old=new URL('../../../r294-profile-research-hub/candidate/',import.meta.url),read=(u,f)=>readFileSync(new URL(f,u),'utf8'),hash=s=>createHash('sha256').update(s).digest('hex'),patch=JSON.parse(read(ev,'PATCH.json')),source=read(root,'src/components/v3/CrossroadsCompare.jsx');
function inverse(s){for(const h of patch.hunks){if(h.after){assert.equal(s.split(h.after).length,2);s=s.replace(h.after,h.before);}else{s=s.replace('              </div>\n            </div>\n            <span className="crossroads__arrow"','                <span className="crossroads__desc">{pair.desc}</span>\n              </div>\n            </div>\n            <span className="crossroads__arrow"');}}return s;}
test('complete source inverse preserves UI dictionary/brand/href/events and registry',()=>{assert.equal(inverse(source),read(ev,'CrossroadsCompare.before.jsx'));assert.equal(hash(inverse(source)),patch.sha);assert.equal(hash(read(root,'src/data/partner-registry.js')),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');assert.throws(()=>assert.equal(inverse(source).replace('product: context.product','product: "wrong"'),read(ev,'CrossroadsCompare.before.jsx')));});
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');async function load(u){const code=(await build({stdin:{contents:"export {CrossroadsCompare} from './src/components/v3/CrossroadsCompare.jsx';",resolveDir:fileURLToPath(u),loader:'jsx'},bundle:true,write:false,platform:'node',format:'cjs',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}})).outputFiles[0].text,m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require,console,Intl,URL,URLSearchParams,Date,setTimeout,clearTimeout});return m.exports;}
const a=await load(root),b=await load(old);const text=h=>[...h.matchAll(/>([^<>]+)</g)].map(m=>m[1].trim()).filter(Boolean).sort(),hrefs=h=>[...h.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'])test(locale+' actual routes retain text, full subtitles, brands and ordered URLs',()=>{for(const context of [{},{market:'BR',product:'spot'}]){const render=m=>renderToStaticMarkup(React.createElement(m.CrossroadsCompare,{locale,...context})),x=render(a),y=render(b);assert.deepEqual(text(x),text(y));assert.deepEqual(hrefs(x),hrefs(y));assert.equal((x.match(/crossroads__decision-label/g)||[]).length,4);assert.equal((x.match(/crossroads__decision-body/g)||[]).length,4);assert.deepEqual([...x.matchAll(/data-decision-path="([^"]+)"/g)].map(m=>m[1]),['cex','derivatives','onchain','perp']);assert.deepEqual([...x.matchAll(/<img[^>]+>/g)].map(m=>m[0]),[...y.matchAll(/<img[^>]+>/g)].map(m=>m[0]));}});
}
