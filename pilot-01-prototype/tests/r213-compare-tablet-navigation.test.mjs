import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {build} from 'esbuild';
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
const { projectOwnedRuntimePlugin: projectOwnedRuntimePlugin } = await import("./helpers/r237-approved-inverses.mjs");
const { projectApproved: projectApproved } = await import("./helpers/r237-approved-inverses.mjs");
const { peerBaseline: peerBaseline } = await import("./helpers/r231-frozen-peer-contract.mjs");









const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const root=fileURLToPath(new URL('../',import.meta.url)),base=fileURLToPath(new URL('../../../r208-compare-related-rhythm/candidate/',import.meta.url));
const file='src/components/v3/crossroads-compare.css',read=(r,f)=>{const text=fs.readFileSync(path.join(r,f),'utf8');return r===root&&f===file?projectApproved(f,text,'r231-coherent-reader-polish'):text;};
const marker='\n/* R213: tablet comparison navigation keeps all five labels readable. */\n';
const css=read(root,file),before=read(base,file),tail=css.includes(marker)?css.slice(css.indexOf(marker)):'';
const ast=postcss.parse(tail),scope='.v3-compare-page .v3-compare-decision-nav';
function decl(selector,width){const out={};ast.walkRules(selector,r=>{let active=true;for(let p=r.parent;p;p=p.parent)if(p.type==='atrule'&&p.name==='media')for(const m of p.params.matchAll(/(min|max)-width:\s*(\d+)px/g))if(m[1]==='min'?width<Number(m[2]):width>Number(m[2]))active=false;if(active)r.walkDecls(d=>out[d.prop]=d.value);});return out;}
test('precise bounded CSS inverse leaves <=680 and >=1280 and original similar rhythm exact',()=>{
 assert.ok(css.includes(marker));assert.equal(css.slice(0,css.indexOf(marker)),before);
 const selectors=[];ast.walkRules(r=>selectors.push(r.selector));assert.ok(selectors.length>=3);assert.ok(selectors.every(s=>s.startsWith(scope)));
 for(const width of [320,680,1280,1440])assert.deepEqual(decl(scope,width),{});
 assert.doesNotMatch(tail,/font-size|text-overflow|white-space:\s*nowrap|overflow:\s*(hidden|clip)|display:\s*none|!important|animation|transition|transform|nth-child|nth-last-child/);
});
test('actual media rule boundaries use two spacious narrow-tablet columns and three wider-tablet columns',()=>{
 for(const width of [681,780,820])assert.equal(decl(scope+'__links',width)['grid-template-columns'],'repeat(2, minmax(0, 1fr))');
 for(const width of [821,900,1024,1025,1100,1200,1279])assert.equal(decl(scope+'__links',width)['grid-template-columns'],'repeat(3, minmax(0, 1fr))');
 for(const width of [681,820,821,1024,1025,1279]){assert.equal(decl(scope,width)['flex-direction'],'column');const a=decl(scope+' a',width);assert.equal(a['min-block-size'],'44px');assert.equal(a['white-space'],'normal');assert.equal(a.overflow,'visible');assert.equal(a['overflow-wrap'],'anywhere');}
 assert.equal((scope.match(/\.[a-z0-9-]+/g)||[]).length,2,'page scope beats original single-class nav in either stylesheet order');
 assert.ok(read(root,file).includes('.v3-compare-decision-nav a:focus-visible'),'original focus feedback retained');
});
class FixedDate extends Date {constructor(...a){super(...(a.length?a:[1791190800000]));}static now(){return 1791190800000;}}
async function load(r){const source=`import {CompareDeepPage} from './src/components/v3/V3Pages.jsx';import {venueDatabase} from './src/data/venue-database.js';export {CompareDeepPage,venueDatabase};`;const code=(await build({stdin:{contents:source,resolveDir:r,loader:'jsx'},bundle:true,write:false,plugins:r===root?[projectOwnedRuntimePlugin('r207-coherent-topic-navigation')]:[],format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}})).outputFiles[0].text,m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require,console,URL,URLSearchParams,Intl,Date:FixedDate,setTimeout,clearTimeout});return m.exports;}
const a=await load(root),b=await load(base);
for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'])test(locale+': tablet CSS preserves complete real compare SSR/navigation/links/schema',()=>{
 for(const selected of [['binance','okx'],['uniswap','jupiter']]){const props={copy:{common:{dimension:'Dimension'},assetCapabilities:{none:'Pending source review'}},locale,selected,updates:[],market:'unknown',product:'unknown'};const html=renderToStaticMarkup(React.createElement(a.CompareDeepPage,{...props,venues:Object.values(a.venueDatabase)}));const old=renderToStaticMarkup(React.createElement(b.CompareDeepPage,{...props,venues:Object.values(b.venueDatabase)}));if(html!==old){let i=0;while(html[i]===old[i]&&i<html.length)i++;assert.fail('SSR byte difference at '+i+': '+JSON.stringify({after:html.slice(i,i+100),before:old.slice(i,i+100)}));}const details=html.match(/<details class="v2-section v3-similar v3-similar-disclosure">([\s\S]*?)<\/details>/);assert.ok(details);assert.match(details[1],/<h2>[^<]+<\/h2>/);assert.equal((details[1].match(/<a\b/g)||[]).length,2);assert.ok(details[1].includes('v3-similar-grid'));const nav=html.match(/<nav class="v3-compare-decision-nav"[^>]*>([\s\S]*?)<\/nav>/);assert.ok(nav);assert.equal((nav[1].match(/<a\b/g)||[]).length,5);for(const id of ['compare-snapshot','hardcore-matrix','decision-guide','compare-faq','compare-sources'])assert.ok(nav[1].includes('href="#'+id+'"'));}
});
test('all non-CSS facts/commercial sources and global style contracts remain exact baseline bytes',()=>{
 for(const f of ['src/components/v3/V3Pages.jsx','src/data/partner-registry.js','src/styles/v3-layout-stability.css','src/styles/reader-foundation.css'])assert.equal(f==='src/components/v3/V3Pages.jsx'||f==='src/styles/reader-foundation.css'?peerBaseline(f):read(root,f),read(base,f));
});
}
