import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync}from'node:fs';
import{mkdtemp,writeFile,rm}from'node:fs/promises';
import{execFileSync}from'node:child_process';
import{fileURLToPath}from'node:url';
import path from'node:path';
import postcss from'postcss';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../../r171-profile-code-layout/candidate/src/components/v3/registration-card.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { withoutR181: withoutR181 } = await import("./r182-peer-scope.mjs");
const { withoutR180Copy: withoutR180Copy } = await import("./r180-source-scope.mjs");
const { expectedRegistrationSource: expectedRegistrationSource } = await import("./r176-peer-source.mjs");

const root=fileURLToPath(new URL('../',import.meta.url)),base=fileURLToPath(new URL('../../../r171-profile-code-layout/candidate/',import.meta.url));const read=(r,p)=>readFileSync(path.join(r,p),'utf8'),file='src/components/v3/registration-card.css',css=read(root,file),before=read(base,file),selector='.v3-profile-main-registration .registration-card--compact';
const ast=postcss.parse(css);function get(s,parent){let d={};ast.walkRules(s,r=>{if(!parent||parent(r.parent))r.walkDecls(x=>d[x.prop]=x.value);});return d;}


test('inverse sole fallback change and appended scoped rules recover frozen CSS exactly',()=>{const split=css.indexOf('/* R174:');assert.ok(split>=0);const normalized=css.slice(0,split).trimEnd().replace('white-space: normal;\n  overflow-wrap: anywhere;\n  word-break: normal;','white-space: nowrap;\n  overflow-wrap: normal;\n  word-break: normal;');assert.equal(normalized,before.trimEnd());postcss.parse(css.slice(split)).walkRules(r=>assert.ok(r.selector.startsWith(selector),r.selector));postcss.parse(css.slice(split)).walkDecls(d=>assert.ok(!['font-size','height','overflow','display','visibility','color','background'].includes(d.prop)));});
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];let rows;const dir=await mkdtemp(path.join(root,'tests/.tmp-r174-'));try{const entry=path.join(dir,'entry.mjs'),out=path.join(dir,'out.cjs');await writeFile(entry,`import React from'react';import{renderToStaticMarkup as render}from'react-dom/server';import{RegistrationCard as Now}from'../../src/components/v3/RegistrationCard.jsx';import{RegistrationCard as Old}from ${JSON.stringify(fileURLToPath(new URL('../../../r172-registration-nextstep-locales/candidate/src/components/v3/RegistrationCard.jsx',import.meta.url)))};Date.now=()=>1791190800000;console.log(JSON.stringify(${JSON.stringify(locales)}.flatMap(locale=>['binance','bitget','backpack'].flatMap(venueSlug=>[true,false].map(compact=>{const p={locale,venueSlug,compact,market:'unknown',product:'unknown'};return{...p,before:render(React.createElement(Old,p)),after:render(React.createElement(Now,p))};})))));`);execFileSync(path.join(root,'node_modules/.bin/esbuild'),[entry,'--bundle','--platform=node','--format=cjs','--outfile='+out,'--loader:.css=empty','--log-level=error'],{cwd:root,stdio:'pipe'});rows=JSON.parse(execFileSync(process.execPath,[out],{cwd:root,encoding:'utf8',maxBuffer:50*1024*1024}));}finally{await rm(dir,{recursive:true,force:true});}
for(const locale of locales)test(locale+': all complete copy/code/href/attrs remain exact',()=>{for(const r of rows.filter(r=>r.locale===locale)){assert.equal(r.after,r.before);assert.ok(r.after.includes('>'+({binance:'11350287',bitget:'nexu888',backpack:'luckybitcoin'}[r.venueSlug])+'</span>'));}});
test('all JS and registry stay frozen',()=>{for(const f of ['src/components/v3/RegistrationCard.jsx','src/components/v3/V3Pages.jsx','src/components/v3/LeanHero.jsx','src/data/partner-registry.js'])assert.equal(f==='src/components/v3/RegistrationCard.jsx'?withoutR180Copy(read(root,f)):withoutR181(read(root,f),f),f==='src/components/v3/RegistrationCard.jsx'?expectedRegistrationSource():read(f==='src/components/v3/RegistrationCard.jsx'?fileURLToPath(new URL('../../../r172-registration-nextstep-locales/candidate/',import.meta.url)):f==='src/components/v3/LeanHero.jsx'?fileURLToPath(new URL('../../../r175-ja-home-compact-labels/candidate/',import.meta.url)):base,f),f);});
}

// Current CSS and interaction contracts do not require the historical peer.
{
const root=fileURLToPath(new URL('../',import.meta.url)),css=readFileSync(path.join(root,'src/components/v3/registration-card.css'),'utf8'),selector='.v3-profile-main-registration .registration-card--compact';const ast=postcss.parse(css);function get(s,parent){let d={};ast.walkRules(s,r=>{if(!parent||parent(r.parent))r.walkDecls(x=>d[x.prop]=x.value)});return d;}
test('narrow profile recovers space without reducing invitation typography or44px Copy',()=>{const media=p=>p.type==='atrule'&&p.name==='media'&&p.params==='(max-width: 780px)';assert.equal(get(selector,media)['padding-inline'],'12px');assert.equal(253-2-2*12,227);assert.ok(227>=225.078);assert.equal(get('.registration-card__code-value')['font-size'],'1.375rem');assert.equal(get('.registration-card__copy-btn')['min-height'],'44px');assert.ok(css.includes('.registration-card__copy-btn:focus-visible'));const narrow=p=>p.type==='atrule'&&p.name==='container'&&p.params==='profile-registration (max-width: 24rem)';const domain=get(selector+' .registration-card__domain-box',narrow);assert.equal(domain['flex-basis'],'100%');assert.equal(domain['flex-direction'],'column');assert.equal(domain['align-items'],'flex-start');});
test('long complete codes retain emergency wrap instead of forced overflow',()=>{const d=get(selector+' .registration-card__code-value');assert.equal(d['white-space'],'normal');assert.equal(d['overflow-wrap'],'anywhere');assert.equal(d['word-break'],'normal');const stress='ABCDEFGHIJKLMNOPQRST';assert.equal(stress.length,20);assert.ok(20*27.5*.6>227,'stress text requires fallback at observed font');assert.notEqual(get(selector+' .registration-card__code-value')['white-space'],'nowrap');});
}
