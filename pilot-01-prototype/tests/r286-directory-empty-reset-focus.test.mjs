import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildSync} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=fileURLToPath(new URL('../',import.meta.url)), require=createRequire(import.meta.url),file=path.join(root,'src/components/v3/VenueYellowPages.jsx'),before=fs.readFileSync(path.join(root,'../baseline/VenueYellowPages.before-empty-reset-focus.jsx'),'utf8'),source=fs.readFileSync(file,'utf8');
const old='setSearchQuery(""); }}>',next='setSearchQuery(""); requestAnimationFrame(() => searchInputRef.current?.focus?.({ preventScroll: true })); }}>';
let frames=[];
function load(s,react=React){const code=buildSync({stdin:{contents:s,resolveDir:path.dirname(file),loader:'jsx'},jsx:'automatic',bundle:true,write:false,format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty','.webp':'text'}}).outputFiles[0].text,m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require:n=>n==='react'?react:require(n),console,URL,URLSearchParams,Intl,Date,setTimeout,clearTimeout,requestAnimationFrame:f=>frames.push(f)});return m.exports.VenueYellowPages;}
const db=await import('../src/data/venue-database.js');const venues=Object.values(db.venueDatabase).slice(0,10);
function find(n,p){if(!n)return null;if(Array.isArray(n)){for(const x of n){const r=find(x,p);if(r)return r;}return null;}if(typeof n!=='object')return null;return p(n)?n:find(n.props?.children,p);}
test('actual empty reset handler preserves original resets and returns focus without scrolling',()=>{let cursor=0,rc=0;frames=[];const slots=[],refs=[],calls=[];const react={...React,useState(v){const i=cursor++;if(!(i in slots))slots[i]=typeof v==='function'?v():v;return[slots[i],n=>slots[i]=typeof n==='function'?n(slots[i]):n];},useRef(v){const i=rc++;return refs[i]??=( {current:i===1?{focus:o=>calls.push(o)}:v});},useEffect(){},useMemo:f=>f()};const C=load(source,react),render=()=>{cursor=rc=0;return C({venues,locale:'ar'});};let tree=render();find(tree,n=>n.props?.id==='yellow-pages-search').props.onChange({target:{value:'zzzz-no-platform'}});tree=render();const empty=find(tree,n=>n.props?.className==='yellow-pages__empty');assert.ok(empty);const reset=find(empty,n=>n.type==='button');assert.ok(reset);reset.props.onClick();assert.equal(slots[3],'');assert.deepEqual(JSON.parse(JSON.stringify(slots[1])),{noKyc:false,por:false,fiat:false,highLev:false});assert.equal(calls.length,0,'focus waits for commit');assert.equal(frames.length,1);let currentCalls=0;refs[1].current={focus:o=>{currentCalls++;calls.push(o);}};frames.shift()();assert.equal(currentCalls,1,'uses the current ref after commit');assert.equal(calls.length,1);assert.equal(calls[0].preventScroll,true);assert.equal(find(render(),n=>n.props?.className==='yellow-pages__empty'),null);});
test('exact single handler inverse retains all source bytes and registry',()=>{assert.equal(source.split(next).length-1,1);assert.equal(source.replace(next,old),before);assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'src/data/partner-registry.js'))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
test('15 locale real SSR retains complete ordered HTML in normal and empty states',()=>{const B=load(before);for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'])for(const q of ['', 'zzzz-no-platform']){const render=s=>{let i=0;const wrap={...React,useState:v=>React.useState(i++===3?q:v)},C=load(s,wrap);return renderToStaticMarkup(React.createElement(C,{venues,locale}));};assert.equal(render(source),render(before),locale+q);}});
