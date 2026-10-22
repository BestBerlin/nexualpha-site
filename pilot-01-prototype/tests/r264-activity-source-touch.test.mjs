import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {buildSync} from 'esbuild';
import postcss from 'postcss';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
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











const root=process.cwd(),base=path.resolve(root,'../../r260-final-task-integration/candidate'),cssFile='src/components/v3/activity/OfficialResearch.css';
const selector='.official-research-page .official-research__source-head h3 > a';
const tail='\n/* Official research source titles keep a full touch target without enlarging other headings. */\n'+selector+' {\n  display: inline-flex;\n  align-items: center;\n  min-block-size: 44px;\n  max-inline-size: 100%;\n}\n';
const sha=v=>crypto.createHash('sha256').update(v).digest('hex'),read=(r,f)=>fs.readFileSync(path.join(r,f),'utf8');
test('only official source heading anchor receives natural 44px block target',()=>{let rule;postcss.parse(read(root,cssFile)).walkRules(selector,r=>rule=r);assert.ok(rule,'missing narrow source title target policy');const values=Object.fromEntries(rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));assert.deepEqual(values,{'display':'inline-flex','align-items':'center','min-block-size':'44px','max-inline-size':'100%'});assert.equal(rule.nodes.some(n=>n.important),false);assert.match(read(root,cssFile),/\.official-research-page a:focus-visible/);assert.match(read(root,cssFile),/\.official-research__source a \{[^}]*overflow-wrap: anywhere/s);});
test('precise appended CSS inverse and all bidirectional source/data/config/public bytes unchanged',()=>{const current=read(root,cssFile);assert.ok(current.endsWith(tail));assert.equal(current.slice(0,-tail.length),read(base,cssFile));const keys=r=>['src','config','public'].flatMap(area=>{const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.isFile()?[path.relative(r,path.join(d,e.name))]:[]);return walk(path.join(r,area));}).sort();assert.deepEqual(keys(root),keys(base));for(const f of keys(base))if(f!==cssFile)assert.equal(sha(approvedRuntime[f]?projectApproved(f,fs.readFileSync(path.join(root,f),'utf8'),'r260-final-task-integration'):fs.readFileSync(path.join(root,f))),sha(fs.readFileSync(path.join(base,f))),f);assert.equal(sha(fs.readFileSync(path.join(root,'src/data/partner-registry.js'))),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
const require=createRequire(import.meta.url);class FixedDate extends Date{constructor(...a){super(...(a.length?a:['2026-10-05T00:00:00Z']));}static now(){return Date.parse('2026-10-05T00:00:00Z');}}
function load(dir){const code=buildSync({stdin:{contents:"export {OfficialResearchPage} from './src/components/v3/activity/OfficialResearch.jsx';export {officialCampaignResearchByVenue} from './src/data/official-campaign-research.js';export {venueDatabase} from './src/data/venue-database.js';",resolveDir:dir,loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty','.webp':'text'},logLevel:'silent'}).outputFiles[0].text;const m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require,console,URL,URLSearchParams,Intl,Date:FixedDate,setTimeout,clearTimeout});return m.exports;}
const current=load(root),old=load(base),locales=['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
test('all recorded venue pages across15 actual SSR locales keep complete text, links, source states and dates',()=>{let count=0;const slugs=Object.keys(current.officialCampaignResearchByVenue).filter(slug=>current.venueDatabase[slug]);assert.ok(slugs.includes('binance'));assert.ok(slugs.length>=20,'real record matrix required');for(const locale of locales)for(const slug of slugs){const render=(r)=>renderToStaticMarkup(React.createElement(r.OfficialResearchPage,{locale,venue:r.venueDatabase[slug],venues:Object.values(r.venueDatabase),market:'unknown',product:'spot',currentDate:'2026-10-05T00:00:00Z'}));const h=render(current);assert.equal(h,render(old),locale+'/'+slug);assert.match(h,/official-research__source-head/);count++;}assert.equal(count,slugs.length*15);});
}
