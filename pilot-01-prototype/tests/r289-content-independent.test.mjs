import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../CONTENT-FIX-SPEC.md", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { officialCampaignResearchByVenue: officialCampaignResearchByVenue } = await import("../src/data/official-campaign-research.js");
const root=fileURLToPath(new URL('../',import.meta.url));
const old=new URL('../../../r288-comparison-whole-page/candidate/',import.meta.url);
const read=(base,f)=>readFileSync(new URL(f,base),'utf8');
const source=read(new URL('../',import.meta.url),'src/components/v3/V3Pages.jsx');
const spec=read(new URL('../../',import.meta.url),'CONTENT-FIX-SPEC.md');
const literal=source.match(/const compareFaqScopeCopy = (\{[\s\S]*?\n\});/)[1];
const scope=vm.runInNewContext('('+literal+')');
const expected=vm.runInNewContext('('+spec.match(/```js\n(\{[\s\S]*?\n\})\n```/)[1]+')');
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
test('15 scope labels exactly match independently prescribed limited-pair copy; FAQ data untouched',()=>{
 assert.equal(JSON.stringify(scope),JSON.stringify(expected));
 assert.deepEqual(Object.keys(scope),locales);
 for(const f of ['src/data/compare-faq-locales.js','src/data/official-campaign-research.js','src/data/partner-registry.js'])assert.equal(read(new URL('../',import.meta.url),f),read(old,f),f);
});
test('only AR condition display uses existing English with accurate language metadata',()=>{
 const exact='<span {...(locale === "ar" ? { lang: "en", dir: "ltr" } : {})}>{locale === "ar" ? cond.en : cond[locale] || cond[textLocaleKey(locale)] || cond["zh-Hans"] || cond.en}</span>';
 assert.equal(source.split(exact).length,2);
 let count=0;for(const r of Object.values(officialCampaignResearchByVenue))for(const c of r.signupReward.conditions){assert.ok(c.en.trim());assert.equal(c.ar,undefined);count++;}
 assert.equal(count,51);
});
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
async function load(dir){const code=(await build({stdin:{contents:"export {CompareFaqSection} from './src/components/v3/V3Pages.jsx'; export {venueDatabase} from './src/data/venue-database.js';",resolveDir:dir,loader:'jsx'},bundle:true,write:false,platform:'node',format:'cjs',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}})).outputFiles[0].text;const m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require,console,URL,URLSearchParams,Intl,Date,setTimeout,clearTimeout});return m.exports;}
const current=await load(root),baseline=await load(fileURLToPath(old));
for(const locale of locales)test(locale+' actual FAQ SSR keeps two-platform output exact and adds scope only for three',()=>{
 for(const slugs of [['binance','okx'],['binance','kraken'],['binance','okx','bybit']]){
 const render=mod=>renderToStaticMarkup(React.createElement(mod.CompareFaqSection,{locale,profiles:slugs.map(s=>mod.venueDatabase[s])}));
 const a=render(current),b=render(baseline);
 if(slugs.length===2)assert.equal(a,b);
 else{const scopeHtml=renderToStaticMarkup(React.createElement('p',{className:'v3-faq-card__lead',lang:locale},scope[locale]));assert.equal(a.split(scopeHtml).length,2);assert.equal(a.replace(scopeHtml,''),b);}
 }
});
}
