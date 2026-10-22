import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildSync} from 'esbuild';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../../r303-mobile-matrix-reading/candidate/src/components/v3/activity/ActivityCenterV3.jsx", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const root=new URL('../',import.meta.url);
test('research list separates original status and complete summary',()=>{const s=fs.readFileSync(new URL('src/components/v3/activity/ActivityCenterV3.jsx',root),'utf8');assert.ok(s.includes('className="activity-center-v3__research-status"'));assert.ok(s.includes('className="activity-center-v3__research-summary"'));});

const base=new URL('../../../r303-mobile-matrix-reading/candidate/',import.meta.url),require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');let full=false,slot=0;const hooks={...React,useState:init=>{const state=React.useState(init),i=slot++;return[i===1?full:state[0],state[1]];}};
function load(r){const code=buildSync({stdin:{contents:'import React from "react";\n'+fs.readFileSync(new URL('src/components/v3/activity/ActivityCenterV3.jsx',r),'utf8')+'\nexport {venueDatabase} from "../../../data/venue-database.js";',resolveDir:fileURLToPath(new URL('src/components/v3/activity/',r)),loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}}).outputFiles[0].text,m={exports:{}};class FixedDate extends Date{constructor(...args){super(...(args.length?args:['2026-10-06T00:00:00Z']));}static now(){return 1791244800000;}}vm.runInNewContext(code,{module:m,exports:m.exports,require:n=>n==='react'?hooks:require(n),console,Intl,URL,URLSearchParams,Date:FixedDate,setTimeout,clearTimeout});return m.exports;}
const a=load(root),b=load(base);function inverse(h){return h.replace(/class="activity-center-v3__research-identity" /g,'').replace(/<div class="activity-center-v3__research-body"><p class="activity-center-v3__research-status">([\s\S]*?)<\/p><p class="activity-center-v3__research-summary">([\s\S]*?)<\/p>/g,'<p>$1$2</p>').replace(/(<div class="activity-center-v3__source-actions">[\s\S]*?<\/div>)<\/div><\/article>/g,'$1</article>');}
for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'])test(locale+' actual collapsed/all research SSR preserve full facts/actions/conditions/state',()=>{for(const expanded of [false,true]){full=expanded;slot=0;const props={locale,market:'BR',product:'spot',venues:Object.values(a.venueDatabase),publicUpdates:[]},h=renderToStaticMarkup(React.createElement(a.ActivityCenterV3,props));slot=0;const old=renderToStaticMarkup(React.createElement(b.ActivityCenterV3,props));assert.equal(inverse(h),old);assert.deepEqual([...h.matchAll(/href="([^"]+)"/g)].map(m=>m[1]),[...old.matchAll(/href="([^"]+)"/g)].map(m=>m[1]));const status=(h.match(/class="activity-center-v3__research-status"/g)||[]).length;assert.ok(status>0);assert.equal(status,(h.match(/class="activity-center-v3__research-summary"/g)||[]).length);}});
test('exact runtime inverse and CSS-prefix preserve old filters/index/registry',()=>{let s=fs.readFileSync(new URL('src/components/v3/activity/ActivityCenterV3.jsx',root),'utf8');for(const p of JSON.parse(fs.readFileSync(new URL('../../activity-dom/PATCH.json',import.meta.url))).reverse()){assert.equal(s.slice(p.afterOffset,p.afterOffset+p.after.length),p.after);s=s.slice(0,p.afterOffset)+p.before+s.slice(p.afterOffset+p.after.length);}assert.equal(s,fs.readFileSync(new URL('src/components/v3/activity/ActivityCenterV3.jsx',base),'utf8'));const css=fs.readFileSync(new URL('src/components/v3/activity/ActivityCenterV3.css',root),'utf8'),before=fs.readFileSync(new URL('../../activity-dom/ActivityCenterV3.before.css',import.meta.url),'utf8');assert.ok(css.startsWith(before));const suffix=css.slice(before.length);assert.ok(!suffix.includes('nth-child'));assert.ok(!suffix.includes('ellipsis'));assert.ok(suffix.includes('min-height: 44px'));assert.equal(createHash('sha256').update(fs.readFileSync(new URL('src/data/partner-registry.js',root))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
test('existing mobile collapsed visibility stays authoritative; new layout does not override display',()=>{const css=fs.readFileSync(new URL('src/components/v3/activity/ActivityCenterV3.css',root),'utf8'),before=fs.readFileSync(new URL('../../activity-dom/ActivityCenterV3.before.css',import.meta.url),'utf8'),suffix=css.slice(before.length);assert.ok(before.includes('.activity-center-v3__reward-grid--collapsed > article:nth-child(n + 4) { display: none; }'));for(const m of suffix.matchAll(/([^{}]+)\{([^{}]*)\}/g))if(m[1].includes('> article'))assert.ok(!/display\s*:/.test(m[2]));assert.ok(!suffix.includes('!important'));});
}
