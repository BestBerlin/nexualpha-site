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
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../baseline/App.before-news-nav-copy.jsx", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url),file=path.join(root,'src/App.jsx'),source=fs.readFileSync(file,'utf8'),before=fs.readFileSync(path.join(root,'../baseline/App.before-news-nav-copy.jsx'),'utf8');
const old='? "即時新聞" : locale.startsWith("zh") ? "实时新闻"',next='? "新聞與研究" : locale.startsWith("zh") ? "新闻与研究"';
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];
function load(s,open){const header=s.slice(s.indexOf('function Header('),s.indexOf('export function App('));const content=`import React,{useState,useRef,useEffect} from 'react';import {v2Copy} from './content/v2-copy';import {v3Copy} from './data/v3-product';import {localeManifest,supportedLocales} from './content/locale-manifest';import {localizedHref} from './data/locale-routing.js';import {NexuAlphaWordmark} from './components/brand/NexuAlphaWordmark';const withLocale=(locale,href)=>localizedHref(href,{locale});${header};export {Header,v2Copy};`;const code=buildSync({stdin:{contents:content,resolveDir:path.join(root,'src'),loader:'jsx'},jsx:'automatic',bundle:true,write:false,format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}}).outputFiles[0].text,m={exports:{}},wrapped={...React,useState:v=>React.useState(open?true:v)};vm.runInNewContext(code,{module:m,exports:m.exports,require:n=>n==='react'?wrapped:require(n),console,URL,URLSearchParams,Intl,Date});return m.exports;}
function render(s,locale,open,brazil=false){const m=load(s,open);return renderToStaticMarkup(React.createElement(m.Header,{copy:m.v2Copy(locale),locale,brazil,onLocaleChange(){},onSearch(){}}));}
test('only the two Chinese news literals change, whole App inverse and partner identity exact',()=>{assert.equal(source.split(next).length-1,1);assert.equal(source.replace(next,old),before);assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'src/data/partner-registry.js'))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
test('15 locale actual desktop/mobile-open Header SSR preserves ordered full anchors and other HTML',()=>{for(const locale of locales)for(const open of[false,true]){const h=render(source,locale,open),b=render(before,locale,open);let restored=h;if(locale==='zh-Hans'||locale==='zh-Hant'){const label=locale==='zh-Hans'?'新闻与研究':'新聞與研究',previous=locale==='zh-Hans'?'实时新闻':'即時新聞';assert.equal(h.split('>'+label+'</a>').length-1,open?2:1);restored=h.split('>'+label+'</a>').join('>'+previous+'</a>');}assert.equal(restored,b,locale+open);assert.deepEqual(h.match(/href="[^"]*"/g),b.match(/href="[^"]*"/g));}});
test('BR-specific menu is fully unchanged for all locales and open states',()=>{for(const locale of locales)for(const open of[false,true])assert.equal(render(source,locale,open,true),render(before,locale,open,true));});
}
