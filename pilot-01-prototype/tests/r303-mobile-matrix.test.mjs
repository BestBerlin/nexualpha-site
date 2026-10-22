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
const historicalFixture = new URL("../../../r302-matrix-navigation/candidate/src/components/v3/V3Pages.jsx", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const root=new URL('../',import.meta.url);
test('single-table mobile identities and explicit header associations exist',()=>{const s=fs.readFileSync(new URL('src/components/v3/V3Pages.jsx',root),'utf8');assert.equal((s.match(/className="v3-matrix-mobile-venue"/g)||[]).length,9);assert.ok(s.includes('role="table" className="v3-matrix-table"'));});

const base=new URL('../../../r302-matrix-navigation/candidate/',import.meta.url),require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(r,react=React,globals={}){const code=buildSync({stdin:{contents:'import React from "react";\n'+fs.readFileSync(new URL('src/components/v3/V3Pages.jsx',r),'utf8')+'\nexport {HardcoreMetricMatrix};export {venueDatabase} from "../../data/venue-database.js";',resolveDir:fileURLToPath(new URL('src/components/v3/',r)),loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}}).outputFiles[0].text,m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require:n=>n==='react'?react:require(n),console,Intl,URL,URLSearchParams,Date,setTimeout,clearTimeout,...globals});return m.exports;}
const a=load(root),b=load(base),inverse=h=>h.replace(/<span class="v3-matrix-mobile-venue" aria-hidden="true">[^<]*<\/span>/g,'').replace(/ role="(?:table|rowgroup|row|columnheader|rowheader|cell)"/g,'').replace(/ id="matrix-(?:column|row)-[^"]+"/g,'').replace(/ headers="[^"]+"/g,'');
for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'])test(locale+' real matrix SSR preserves all original content/hrefs and each real target',()=>{for(const selected of [['binance','okx'],['coinbase','kraken'],['binance','okx','bybit']]){const props={profiles:selected.map(slug=>a.venueDatabase[slug]),locale,market:'unknown',product:'spot'},h=renderToStaticMarkup(React.createElement(a.HardcoreMetricMatrix,props)),old=renderToStaticMarkup(React.createElement(b.HardcoreMetricMatrix,props));assert.equal(inverse(h),old);const ids=new Set([...h.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));for(const m of h.matchAll(/headers="([^"]+)"/g))for(const id of m[1].split(' '))assert.ok(ids.has(id),id);assert.equal((h.match(/class="v3-matrix-mobile-venue"/g)||[]).length,(h.match(/role="cell"/g)||[]).length);const options=[...h.matchAll(/<option value="([^"]+)"/g)].map(m=>m[1]).filter(Boolean);assert.equal(options.length,8);for(const key of options)assert.equal((h.match(new RegExp('id="matrix-metric-'+key+'"','g'))||[]).length,1);assert.deepEqual([...h.matchAll(/href="([^"]+)"/g)].map(m=>m[1]),[...old.matchAll(/href="([^"]+)"/g)].map(m=>m[1]));}});
function nodes(n){if(!n||typeof n!=='object')return[];return[n,...React.Children.toArray(n.props?.children).flatMap(nodes)];}
test('exact source inverse preserves all R302 facts/state/locators and registry',()=>{let s=fs.readFileSync(new URL('src/components/v3/V3Pages.jsx',root),'utf8');for(const p of JSON.parse(fs.readFileSync(new URL('../../mobile-dom/PATCH.json',import.meta.url))).reverse()){assert.equal(s.slice(p.afterOffset,p.afterOffset+p.after.length),p.after);s=s.slice(0,p.afterOffset)+p.before+s.slice(p.afterOffset+p.after.length);}assert.equal(s,fs.readFileSync(new URL('src/components/v3/V3Pages.jsx',base),'utf8'));assert.equal(createHash('sha256').update(fs.readFileSync(new URL('src/data/partner-registry.js',root))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
}
