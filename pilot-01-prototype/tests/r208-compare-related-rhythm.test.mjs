import {projectOwnedRuntimePlugin} from './helpers/r237-approved-inverses.mjs';
import {withoutR213,peerBaseline} from './helpers/r231-frozen-peer-contract.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {build} from 'esbuild';
import postcss from 'postcss';
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const root=fileURLToPath(new URL('../',import.meta.url)),base=fileURLToPath(new URL('../../../r204-compare-mobile-navigation/candidate/',import.meta.url));
const file='src/components/v3/crossroads-compare.css',read=(r,f)=>fs.readFileSync(path.join(r,f),'utf8');
const marker='\n/* R208: comparison related research follows compact native disclosure rhythm. */\n';
const css=withoutR213(read(root,file)),before=read(base,file),tail=css.includes(marker)?css.slice(css.indexOf(marker)):'';
const rules=postcss.parse(tail),decl=selector=>{const out={};rules.walkRules(selector,r=>r.walkDecls(d=>out[d.prop]=d.value));return out;};
const scope='.v3-compare-page > .v2-section.v3-similar-disclosure',summary=scope+' > .v3-similar-disclosure__summary';
test('bounded CSS inverse preserves all prior mobile navigation/profile/opened body rules',()=>{
 assert.ok(css.includes(marker));assert.equal(css.slice(0,css.indexOf(marker)),before);
 const selectors=[];rules.walkRules(r=>selectors.push(r.selector));assert.ok(selectors.length>=5);assert.ok(selectors.every(s=>s.startsWith(scope)));
 assert.doesNotMatch(tail,/!important|overflow:\s*(hidden|clip)|text-overflow|display:\s*none|height:\s*[0-9]+px|animation|transition|\.v3-similar-grid|\.v3-similar-disclosure__body/);
 assert.equal(decl(scope)['padding-block'],'12px');assert.equal(decl(scope+':not([open])')['content-visibility'],'visible');assert.equal(decl(scope+':not([open])')['contain-intrinsic-size'],'none');
 assert.equal(decl(scope+'[open] > .v3-similar-disclosure__summary')['margin-block-end'],'18px','original open summary-to-body gap remains exact');
});
test('specific summary overrides the competing generic section-lead rhythm with readable full text and aligned toggle',()=>{
 const d=decl(summary);assert.equal(d.display,'grid');assert.equal(d['grid-template-columns'],'minmax(0, 1fr) auto');assert.equal(d['grid-template-areas'],'"title toggle" "description toggle"');assert.equal(d['min-block-size'],'44px');assert.equal(d['margin-block-end'],'0');
 const title=decl(summary+' > h2'),description=decl(summary+' > span');assert.equal(title['grid-area'],'title');assert.equal(title['font-size'],'0.9rem');assert.equal(title['max-inline-size'],'none');assert.equal(description['grid-area'],'description');assert.equal(description['margin-inline-start'],'0');assert.equal(description['text-align'],'start');assert.equal(decl(summary+' > b')['grid-area'],'toggle');
 assert.ok(decl(summary+':focus-visible').outline);
 // Specificity of scoped summary (4 classes) beats the actual shared .v3-page .section-lead (2).
 assert.equal((summary.match(/\.[a-z0-9-]+/g)||[]).length,4);
 assert.match(read(root,'src/styles/v3-layout-stability.css'),/\.v3-page \.section-lead/);
 assert.equal((scope.match(/\.[a-z0-9-]+/g)||[]).length,3,'section padding beats the shared 2-class rule in either stylesheet load order');
});
class FixedDate extends Date {constructor(...a){super(...(a.length?a:[1791190800000]));}static now(){return 1791190800000;}}
async function load(r){const source=`import {CompareDeepPage} from './src/components/v3/V3Pages.jsx';import {venueDatabase} from './src/data/venue-database.js';export {CompareDeepPage,venueDatabase};`;const code=(await build({stdin:{contents:source,resolveDir:r,loader:'jsx'},bundle:true,write:false,plugins:r===root?[projectOwnedRuntimePlugin('r207-coherent-topic-navigation')]:[],format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}})).outputFiles[0].text,m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require,console,URL,URLSearchParams,Intl,Date:FixedDate,setTimeout,clearTimeout});return m.exports;}
const a=await load(root),b=await load(base);
for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'])test(locale+': real compare SSR retains complete original summary/content/links/schema',()=>{
 for(const selected of [['binance','okx'],['uniswap','jupiter']]){const props={copy:{common:{dimension:'Dimension'},assetCapabilities:{none:'Pending source review'}},locale,selected,updates:[],market:'unknown',product:'unknown'};const html=renderToStaticMarkup(React.createElement(a.CompareDeepPage,{...props,venues:Object.values(a.venueDatabase)}));const old=renderToStaticMarkup(React.createElement(b.CompareDeepPage,{...props,venues:Object.values(b.venueDatabase)}));if(html!==old){let i=0;while(html[i]===old[i]&&i<html.length)i++;assert.fail('SSR byte difference at '+i+': '+JSON.stringify({after:html.slice(i,i+100),before:old.slice(i,i+100)}));}const details=html.match(/<details class="v2-section v3-similar v3-similar-disclosure">([\s\S]*?)<\/details>/);assert.ok(details);assert.match(details[1],/<h2>[^<]+<\/h2>/);assert.equal((details[1].match(/<a\b/g)||[]).length,2);assert.ok(details[1].includes('v3-similar-grid'));}
});
test('all non-CSS facts/commercial sources and global style contracts remain exact baseline bytes',()=>{
 for(const f of ['src/components/v3/V3Pages.jsx','src/data/partner-registry.js','src/styles/v3-layout-stability.css','src/styles/reader-foundation.css'])assert.equal(f==='src/components/v3/V3Pages.jsx'||f==='src/styles/reader-foundation.css'?peerBaseline(f):read(root,f),read(base,f));
});
