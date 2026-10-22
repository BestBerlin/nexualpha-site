import { committedFileHash } from './r100-test-contracts.mjs';
import {build} from 'esbuild';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {interfaceCopyByLocale} from '../src/content/v3-interface-copy.js';

import { existsSync } from 'node:fs';

if (existsSync(new URL('../../../r130-material-hierarchy/candidate/src/components/v3/V3Pages.jsx', import.meta.url))) {
const root=fileURLToPath(new URL('../',import.meta.url));
const baseline=fileURLToPath(new URL('../../../r130-material-hierarchy/candidate/',import.meta.url));
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];
const cases=['binance','bitget','okx','backpack','hyperliquid','kraken','uniswap'].flatMap(slug=>locales.map(locale=>({slug,locale,market:'unknown',product:'unknown'}))).concat([{slug:'binance',locale:'en',market:'US',product:'spot'},{slug:'binance',locale:'ja',market:'BR',product:'spot'}]);
const dir=await mkdtemp(path.join(root,'tests/.tmp-r133-profile-'));
let results;
try{
 const entry=path.join(dir,'entry.mjs'),out=path.join(dir,'out.cjs');
 await writeFile(entry,`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {VenueDetailPage} from '../../src/components/v3/V3Pages.jsx';import {VenueDetailPage as Before} from ${JSON.stringify(baseline+'src/components/v3/V3Pages.jsx')};import {venueDatabase} from '../../src/data/venue-database.js';const NativeDate=Date;globalThis.Date=class extends NativeDate{constructor(...a){super(...(a.length?a:['2026-10-05T09:00:00Z']));}static now(){return 1791190800000;}};const venues=Object.values(venueDatabase);const cases=${JSON.stringify(cases)};const copy={common:{dimension:'Dimension'},assetCapabilities:{none:'Pending source review'}};console.log(JSON.stringify(cases.map(c=>{const props={...c,venue:venueDatabase[c.slug],venues,updates:[],copy};return {...c,before:renderToStaticMarkup(React.createElement(Before,props)),after:renderToStaticMarkup(React.createElement(VenueDetailPage,props))};})));`);
 await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',outfile:out,loader:{'.css':'empty'},logLevel:'error',plugins:[{name:'exact-frozen-R163-registration-peer',setup(b){b.onLoad({filter:/RegistrationCard\.jsx$/},args=>args.path.startsWith(baseline)?{contents:readFileSync(new URL('../../../r172-registration-nextstep-locales/candidate/src/components/v3/RegistrationCard.jsx',import.meta.url),'utf8'),loader:'jsx',resolveDir:path.dirname(fileURLToPath(new URL('../../../r172-registration-nextstep-locales/candidate/src/components/v3/RegistrationCard.jsx',import.meta.url)))}:undefined);}}]});
 results=JSON.parse(execFileSync(process.execPath,[out],{cwd:root,encoding:'utf8',maxBuffer:96*1024*1024}));
}finally{await rm(dir,{recursive:true,force:true});}
const anchors=h=>[...h.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]).sort();
const textNodes=h=>h.replace(/<[^>]*>/g,'\u0000').split('\u0000').map(t=>t.trim()).filter(Boolean);
const counts=a=>a.reduce((m,x)=>m.set(x,(m.get(x)||0)+1),new Map());
test('all107 true SSR profile cases preserve original complete anchors, source/claim content and unknown state',()=>{
 for(const r of results){assert.deepEqual(anchors(r.after),anchors(r.before),`${r.slug}/${r.locale}/${r.market} raw anchors`);const old=counts(textNodes(r.before)),next=counts(textNodes(r.after));for(const [t,n]of old)assert.ok((next.get(t)||0)>=n,`${r.slug}/${r.locale} missing original text ${t}`);
 const readiness=h=>h.match(/<section class="venue-readiness"[\s\S]*?<\/section>/)?.[0];assert.equal(readiness(r.after),readiness(r.before));
 const pending=h=>[...h.matchAll(/class="[^"]*(?:pending|fee-status)[^"]*"[^>]*>[\s\S]*?<\//g)].map(m=>m[0]).sort();assert.deepEqual(pending(r.after),pending(r.before));}
});
test('comparison sits beside original quick review, full secondary context and Telegram are native closed',()=>{
 for(const r of results){const h=r.after;const quick=h.indexOf('data-cta-surface="venue-profile-main-registration"'),compare=h.indexOf('data-profile-task="primary"');assert.ok(quick>=0&&compare>quick);assert.ok(compare<h.indexOf('data-profile-task="telegram"'));
 assert.ok(h.includes('<details class="v3-profile-secondary-research" data-profile-task="telegram">'));assert.equal((h.match(/data-profile-task="telegram"/g)||[]).length,1);
 const research=h.slice(h.indexOf('<details class="v3-profile-secondary-research"'));assert.ok(research.indexOf('data-cta-placement="venue-hero-telegram"')<research.indexOf('</details>'));assert.ok(research.indexOf('onsite-telegram-handoff')<research.indexOf('</details>'));
 if(h.includes('class="v3-venue-decision-strip"'))assert.ok(h.includes('<details class="v3-profile-decision-context" data-profile-task="context">'));
 assert.ok(!/<details[^>]*data-profile-task="(?:telegram|context)"[^>]*\bopen(?:\s|=|>)/.test(h));
 }
});
test('all107 SSR cases give every context disclosure a visible localized label beyond the decorative plus',()=>{
 const escape=t=>t.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
 let checked=0;const covered=new Set();
 for(const r of results){
  const context=r.after.match(/<details class="v3-profile-decision-context" data-profile-task="context"><summary>([\s\S]*?)<\/summary>/);
  if(!context){assert.ok(!r.after.includes('class="v3-venue-decision-strip"'),`${r.slug}/${r.locale} context must wrap an existing strip`);continue;}
  checked++;covered.add(r.locale);
  const visible=textNodes(context[1]).filter(t=>t!=='＋').join(' ').trim();
  assert.ok(visible.length>0,`${r.slug}/${r.locale}/${r.market} context summary cannot be empty or only ＋`);
  assert.equal(visible,escape(interfaceCopyByLocale[r.locale].profileSignal),`${r.slug}/${r.locale} context title uses existing native interface copy`);
  assert.match(context[1],/<span aria-hidden="true">＋<\/span>/);
 }
 assert.ok(checked>0,'real non-priority context disclosures were checked');
 assert.deepEqual([...covered].sort(),[...locales].sort(),'native context labels are exercised in all15 locales');
});
test('only VenueDetailPage presentation and its dedicated style import may change; data and registry remain exact',()=>{
 const p='src/components/v3/V3Pages.jsx';assert.equal(readFileSync(root+p,'utf8'),readFileSync(new URL('../../../r165-profile-hierarchy/candidate/'+p,import.meta.url),'utf8'),'integrated full page equals exact frozen R165 peer');const a=readFileSync(new URL('../../../r160-hierarchy-touch-integration/candidate/'+p,import.meta.url),'utf8'),b=readFileSync(baseline+p,'utf8');const outside=s=>s.slice(0,s.indexOf('export function VenueDetailPage('))+s.slice(s.indexOf('\nexport function ',s.indexOf('export function VenueDetailPage(')+1));
 // Integrated R140 copy and R142 compare changes are exact bounded exceptions,
 // not permission to alter any other component or original commercial markup.
 const integratedBaseline=readFileSync(new URL('../../../r139-reader-integration/candidate/'+p,import.meta.url),'utf8');
 const copyBaseline=readFileSync(new URL('../../../r140-copy-feedback/candidate/'+p,import.meta.url),'utf8');
 const copyRegion=x=>x.slice(x.indexOf('const clipboardFeedbackCopy ='),x.indexOf('function compareTelegramLabel('));
 assert.equal(copyRegion(a),copyRegion(copyBaseline),'copy helper/domain region must equal frozen independent R140 implementation');
 const originalDomain=integratedBaseline.slice(integratedBaseline.indexOf('function VenueAntiPhishingSecurity('),integratedBaseline.indexOf('function compareTelegramLabel('));
 const normalized=a.replace(copyRegion(a),originalDomain)
  .replace('is-expanded" : ""}`} role="region" tabIndex={0}', 'is-expanded" : ""}`} tabIndex={0}')
  .replace('import { useEffect, useRef, useState } from "react";','import { useEffect, useState } from "react";')
  .replace('{!isPriorityTwoVenueDirectAnswer && <nav className="v3-compare-quick-actions"','<nav className="v3-compare-quick-actions"')
  .replace('</nav>}\n        <div id="compare-final-choice">','</nav>\n        <div id="compare-final-choice">');
 assert.equal(outside(normalized),outside(integratedBaseline),'all unrelated components remain byte exact after authorized copy/compare normalization');
 assert.equal(outside(integratedBaseline).replace('import "./profile-density.css";\n',''),outside(b),'original R130 outside-profile protection still holds for integration baseline');
 for(const p of ['src/data/partner-registry.js','src/data/public-cta.js','src/data/priority-venue-answers.js','src/components/v3/VenueReadinessChecklist.jsx','src/components/v3/VenueReadinessChecklist.css'])assert.deepEqual(readFileSync(root+p),readFileSync(baseline+p),p);
 assert.equal(createHash('sha256').update(readFileSync(root+'src/data/partner-registry.js')).digest('hex'),committedFileHash('src/data/partner-registry.js'));
});
test('dedicated styles preserve keyboard/touch disclosure and cannot affect other page families',()=>{
 const css=readFileSync(root+'src/components/v3/profile-density.css','utf8');const rules=[...css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]+)\}/g)];
 for(const m of rules)for(const selector of m[1].split(','))assert.ok(selector.trim().startsWith('.v3-profile-page '),selector);
 assert.match(css,/min-block-size:\s*44px/);assert.match(css,/:focus-visible/);assert.ok(!/!important|--surface-|--blue\s*:|--positive\s*:|overflow:\s*hidden/.test(css));
 const jsx=readFileSync(root+'src/components/v3/V3Pages.jsx','utf8');assert.ok(jsx.startsWith('import "./profile-density.css";'));assert.ok(readFileSync(root+'worker/index.js','utf8').includes('if (pathname.startsWith("/exchanges/")) return [...SHARED_ROUTE_STYLE_PREFIXES, "route-v3-pages-"'));
});

} else {
  test('historical regression requires original archived checkout', { skip: 'Original historical source snapshot is absent from a fresh checkout; current-source tests run separately.' }, () => {});
}
