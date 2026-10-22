import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../../r192-reader-integration/candidate/src/components/v3/TopicGuidePage.jsx", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const req=createRequire(import.meta.url),React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),postcss=req('postcss'),{buildSync}=req('esbuild');
const root=fileURLToPath(new URL('../',import.meta.url)),base=fileURLToPath(new URL('../../../r192-reader-integration/candidate/',import.meta.url));
const read=(r,p)=>readFileSync(path.join(r,p),'utf8');
const file='src/components/v3/topic-guide.css',marker='\n/* R196: narrow derivatives choices use two readable columns. */\n';
const suffix=marker+'@media (max-width: 640px) {\n  .topic-derivatives-route-picker {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n}\n';

test('mobile picker has a bounded two-column override; original desktop and every other declaration unchanged',()=>{
 const css=read(root,file),original=read(base,file);assert.equal(css,original+suffix,'sole exact scoped append');
 const tree=postcss.parse(css),media=[];tree.walkAtRules('media',a=>{if(a.params==='(max-width: 640px)')a.walkRules('.topic-derivatives-route-picker',r=>media.push(r));});
 assert.equal(media.length,1);assert.deepEqual(media[0].nodes.map(n=>[n.prop,n.value]),[['grid-template-columns','repeat(2, minmax(0, 1fr))']]);
 assert.match(original,/\.topic-derivatives-route-picker\s*\{[^}]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/s);
 assert.doesNotMatch(suffix,/font-size|font-family|height|overflow|display|order|opacity|animation|transform|word-break/);
});
test('all real component and source data bytes including invite registry remain exact R192',()=>{
 for(const p of ['src/components/v3/TopicGuidePage.jsx','src/data/topic-guides-data.js','src/data/perp-cost-field-dictionary.js','src/data/partner-registry.js','src/data/locale-routing.js'])assert.equal(read(root,p),read(base,p),p);
 assert.equal(createHash('sha256').update(read(root,'src/data/partner-registry.js')).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
function load(r){const o=buildSync({entryPoints:[path.join(r,'src/components/v3/TopicGuidePage.jsx')],bundle:true,write:false,platform:'node',format:'cjs',loader:{'.css':'empty'},external:['react','react/jsx-runtime']}).outputFiles[0].text,m={exports:{}};vm.runInNewContext(o,{module:m,exports:m.exports,require:req,URL,URLSearchParams,Intl,Date,console});return m.exports.TopicGuidePage;}
const Before=load(base),After=load(root);Date.now=()=>1791190800000;
for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'])test(locale+': complete SSR remains exact including four native buttons, full title labels, research hrefs and closed records',()=>{
 const props={slug:'derivatives',locale,market:'BR',product:'perp'};const before=renderToStaticMarkup(React.createElement(Before,props)),after=renderToStaticMarkup(React.createElement(After,props));assert.equal(after,before);
 const choices=[...after.matchAll(/<button\b[^>]*data-derivatives-route-choice="([^"]+)"[^>]*>[\s\S]*?<\/button>/g)];assert.equal(choices.length,4);for(const b of choices){assert.match(b[0],/type="button"/);assert.match(b[0],/aria-pressed="false"/);assert.match(b[0],/aria-label="[^"]+"/);assert.ok(b[0].replace(/<[^>]*>/g,'').trim());}
 assert.equal([...after.matchAll(/data-cta-placement="topic-derivatives-route-evidence"/g)].length,4);assert.equal([...after.matchAll(/<details class="topic-derivatives-route-detail">/g)].length,4);
});
}
