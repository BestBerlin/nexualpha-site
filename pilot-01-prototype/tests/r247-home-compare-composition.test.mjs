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

const root=fileURLToPath(new URL('../',import.meta.url)),base=fileURLToPath(new URL('../../../r243-final-experience-integration/candidate/',import.meta.url)),require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),file='src/components/v3/crossroads-compare.css',component='src/components/v3/CrossroadsCompare.jsx';
const css=projectApproved(file,fs.readFileSync(path.join(root,file),'utf8'),'r249-br-touch-integration'),oldcss=fs.readFileSync(path.join(base,file),'utf8'),ast=postcss.parse(css);
function rules(selector){const out=[];ast.walkRules(selector,r=>out.push(r));return out;}function value(r,p){return r.nodes.find(n=>n.prop===p)?.value;}
test('four comparison routes deliberately use two columns while mobile remains one',()=>{const r=rules('.crossroads__grid');assert.equal(value(r[0],'grid-template-columns'),'repeat(2, minmax(0, 1fr))');assert.equal(r.length,2);assert.equal(r[1].parent.params,'(max-width: 767px)');assert.equal(value(r[1],'grid-template-columns'),'1fr');});
test('existing descriptor fully wraps rather than truncates',()=>{const r=rules('.crossroads__desc');assert.equal(r.length,1);assert.equal(value(r[0],'white-space'),'normal');assert.equal(value(r[0],'overflow'),'visible');assert.equal(value(r[0],'text-overflow'),'clip');});
test('precise literal inverse preserves all comparison page and other CSS bytes',()=>{const afterGrid='.crossroads__grid {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));',beforeGrid='.crossroads__grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));',afterDesc='overflow: visible;\n  text-overflow: clip;\n  white-space: normal;',beforeDesc='overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;';assert.equal(css.split(afterGrid).length,2);assert.equal(css.split(afterDesc).length,2);assert.equal(css.replace(afterGrid,beforeGrid).replace(afterDesc,beforeDesc),oldcss);});
function load(r){const code=buildSync({entryPoints:[path.join(r,component)],bundle:true,write:false,format:'cjs',platform:'node',external:['react'],loader:{'.css':'empty'}}).outputFiles[0].text,m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require,console,URL,URLSearchParams,setTimeout,clearTimeout});return m.exports.CrossroadsCompare;}
const a=load(root),b=load(base);for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'])test(locale+' actual home comparison SSR full subtree unchanged',()=>{for(const context of [{market:'unknown',product:'unknown'},{market:'BR',product:'spot'}]){const p={locale,...context},h=renderToStaticMarkup(React.createElement(a,p)),old=renderToStaticMarkup(React.createElement(b,p));assert.equal(h,old);assert.equal((h.match(/class="crossroads__card"/g)||[]).length,4);const routes=[...h.matchAll(/data-growth-decision="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(routes,['binance-vs-okx','bybit-vs-bitget','uniswap-vs-jupiter','hyperliquid-vs-dydx']);}});
test('no runtime JSX data/config/public edits',()=>{assert.deepEqual(fs.readFileSync(path.join(root,component)),fs.readFileSync(path.join(base,component)));for(const folder of ['src/data','config','public']){const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.isFile()?[path.join(d,e.name)]:[]);for(const f of walk(path.join(base,folder))){const file=path.relative(base,f),bytes=fs.readFileSync(path.join(root,file));assert.deepEqual(['src/data/news-feed-client.js','src/data/seo-injection.js'].includes(file)?Buffer.from(projectApproved(file,bytes.toString(),'r273-final-experience-integration')):bytes,fs.readFileSync(f),f);}}});
}
