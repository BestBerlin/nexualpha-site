import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {build} from 'esbuild';
import postcss from 'postcss';
import crypto from 'node:crypto';
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
const { skipApprovedAdded: skipApprovedAdded } = await import("./helpers/r237-approved-inverses.mjs");
const { assertProjectedTree: assertProjectedTree, projectApproved: projectApproved, projectNewsBotPlugin: projectNewsBotPlugin } = await import("./helpers/r237-approved-inverses.mjs");

const root=fileURLToPath(new URL('../',import.meta.url)),base=fileURLToPath(new URL('../../../r231-coherent-reader-polish/candidate/',import.meta.url)),require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),file='src/components/v3/v3.css',read=(r,f)=>fs.readFileSync(path.join(r,f),'utf8');const before='  .v3-profile-page .v3-venue-summary {\n    display: -webkit-box;\n    -webkit-box-orient: vertical;\n    -webkit-line-clamp: 3;\n    overflow: hidden;\n    margin-bottom: 0.9rem !important;\n  }',after='  .v3-profile-page .v3-venue-summary {\n    display: block;\n    overflow: visible;\n    margin-bottom: 0.9rem !important;\n  }';
test('actual profile mobile summary is complete block, only exact clamp hunk changes',()=>{const css=read(root,file);assert.equal(css.split(after).length,2);assert.equal(css.replace(after,before),read(base,file));const ast=postcss.parse(css),rules=[];ast.walkRules('.v3-profile-page .v3-venue-summary',r=>rules.push(r));assert.equal(rules.length,1);const d={};rules[0].walkDecls(x=>d[x.prop]=x.value);assert.equal(d.display,'block');assert.equal(d.overflow,'visible');assert.equal(d['margin-bottom'],'0.9rem');assert.ok(!('-webkit-line-clamp'in d));assert.ok(!('-webkit-box-orient'in d));assert.equal(rules[0].parent.type,'atrule');assert.equal(rules[0].parent.name,'media');assert.equal(rules[0].parent.params,postcss.parse(read(base,file)).nodes.find(n=>n.type==='atrule'&&n.toString().includes(before)).params);assert.match(css,/\.v3-profile-page \.v3-relationship-note \{[\s\S]*?-webkit-line-clamp: 3;/);});
class FixedDate extends Date{constructor(...a){super(...(a.length?a:[1791190800000]));}static now(){return 1791190800000;}}
async function load(r){const code=(await build({stdin:{contents:`export {VenueDetailPage} from './src/components/v3/V3Pages.jsx';export {venueDatabase} from './src/data/venue-database.js';`,resolveDir:r,loader:'jsx'},bundle:true,write:false,plugins:r===root?[projectOwnedRuntimePlugin('r207-coherent-topic-navigation')]:[],format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}})).outputFiles[0].text,m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require,console,URL,URLSearchParams,Intl,Date:FixedDate,setTimeout,clearTimeout});return m.exports;}
const a=await load(root),b=await load(base);for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'])test(locale+' actual Bitget/Backpack profile all SSR text/orderedhref/SEO/conditions exact',()=>{for(const slug of ['bitget','backpack']){const props={copy:{common:{dimension:'Dimension'},assetCapabilities:{none:'Pending source review'}},locale,venue:a.venueDatabase[slug],venues:Object.values(a.venueDatabase),updates:[],market:'unknown',product:'unknown'};const html=renderToStaticMarkup(React.createElement(a.VenueDetailPage,props)),old=renderToStaticMarkup(React.createElement(b.VenueDetailPage,{...props,venue:b.venueDatabase[slug],venues:Object.values(b.venueDatabase)}));assert.equal(html,old);assert.match(html,/<p class="v3-venue-summary"[^>]*>[^<]+<\/p>/);assert.equal((html.match(/id="registration-path"/g)||[]).length,1);}});
test('whole src/config/public permits only one scoped CSS change, registry/feed exact',()=>{const changes=[];function walk(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.isFile()){if(skipApprovedAdded(f,fs.readFileSync(path.join(root,f))))continue;assert.ok(fs.existsSync(path.join(base,f)));if((f===file?read(root,f):projectApproved(f,read(root,f),'r231-coherent-reader-polish'))!==read(base,f))changes.push(f);}}}for(const area of ['src','config','public'])walk(area);assert.deepEqual(changes,[file]);assertProjectedTree(root,base,'r231-coherent-reader-polish',[file]);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'src/data/partner-registry.js'))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});

test('single old frontend assertion evolves precisely and broad clamp deletion/margin mutation is rejected',()=>{const h=JSON.parse(read(root,'tests/fixtures/r232-frontend-contract-hunk.json'));assert.equal(read(base,'tests/frontend-contract.test.mjs').split(h.before).length,2);assert.equal(read(base,'tests/frontend-contract.test.mjs').replace(h.before,h.after),projectApproved('tests/frontend-contract.test.mjs',read(root,'tests/frontend-contract.test.mjs'),'r237-coherent-experience-integration'));const css=read(root,file),original=read(base,file);for(const altered of [css.replace('-webkit-line-clamp: 2;', '-webkit-line-clamp: unset;'),css.replace('-webkit-line-clamp: 3;', '-webkit-line-clamp: unset;'),css.replace('margin-bottom: 0.9rem !important;', 'margin-bottom: 0;')]){assert.notEqual(altered,css);assert.throws(()=>assert.equal(altered.replace(after,before),original));}});
}
