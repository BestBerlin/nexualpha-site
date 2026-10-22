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
const historicalFixture = new URL("../../../r167-editorial-decision-integration/candidate/src/components/v3/registration-card.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { withoutR181: withoutR181 } = await import("./r182-peer-scope.mjs");
const { withoutR180Copy: withoutR180Copy } = await import("./r180-source-scope.mjs");
const { expectedRegistrationSource: expectedRegistrationSource } = await import("./r176-peer-source.mjs");

const root=fileURLToPath(new URL('../',import.meta.url)),base=fileURLToPath(new URL('../../../r167-editorial-decision-integration/candidate/',import.meta.url));const read=(r,p)=>readFileSync(path.join(r,p),'utf8'),file='src/components/v3/registration-card.css',css=read(root,file),before=read(base,file),selector='.v3-profile-main-registration .registration-card--compact';
const ast=postcss.parse(css);function get(s,parent){let d={};ast.walkRules(s,r=>{if(!parent||parent(r.parent))r.walkDecls(x=>d[x.prop]=x.value);});return d;}
test('narrow container stacks copy under unbroken full code; no type reduction',()=>{assert.equal(get(selector)['container-type'],'inline-size');assert.equal(get(selector)['container-name'],'profile-registration');assert.equal(get(selector+' .registration-card__code-section',p=>p.type==='atrule'&&p.name==='container'&&p.params==='profile-registration (max-width: 24rem)')['grid-template-columns'],'minmax(0, 1fr)');const d=get(selector+' .registration-card__code-value');assert.equal(d['white-space'],'normal');assert.equal(d['overflow-wrap'],'anywhere');assert.equal(d['word-break'],'normal');assert.equal(get('.registration-card__code-value')['font-size'],'1.375rem');assert.equal(get('.registration-card__copy-btn')['min-height'],'44px');assert.ok(css.includes('.registration-card__copy-btn:focus-visible'));});
test('new CSS only reaches profile compact; baseline cascade remains exact',()=>{assert.ok(css.startsWith(before));postcss.parse(css.slice(before.length)).walkRules(r=>assert.ok(r.selector.startsWith(selector),r.selector));postcss.parse(css.slice(before.length)).walkDecls(d=>assert.ok(!['font-size','height','overflow','display','visibility','color','background','padding'].includes(d.prop)));});
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];let rows;const dir=await mkdtemp(path.join(root,'tests/.tmp-r171-'));try{const entry=path.join(dir,'entry.mjs'),out=path.join(dir,'out.cjs');await writeFile(entry,`import React from'react';import{renderToStaticMarkup as render}from'react-dom/server';import{RegistrationCard as Now}from'../../src/components/v3/RegistrationCard.jsx';import{RegistrationCard as Old}from ${JSON.stringify(fileURLToPath(new URL('../../../r172-registration-nextstep-locales/candidate/src/components/v3/RegistrationCard.jsx',import.meta.url)))};Date.now=()=>1791190800000;console.log(JSON.stringify(${JSON.stringify(locales)}.flatMap(locale=>['binance','bitget','backpack'].flatMap(venueSlug=>[true,false].map(compact=>{const p={locale,venueSlug,compact,market:'unknown',product:'unknown'};return{...p,before:render(React.createElement(Old,p)),after:render(React.createElement(Now,p))};})))));`);execFileSync(path.join(root,'node_modules/.bin/esbuild'),[entry,'--bundle','--platform=node','--format=cjs','--outfile='+out,'--loader:.css=empty','--log-level=error'],{cwd:root,stdio:'pipe'});rows=JSON.parse(execFileSync(process.execPath,[out],{cwd:root,encoding:'utf8',maxBuffer:50*1024*1024}));}finally{await rm(dir,{recursive:true,force:true});}
for(const locale of locales)test(locale+': all complete copy/code/href/attrs remain exact',()=>{for(const r of rows.filter(r=>r.locale===locale)){assert.equal(r.after,r.before);assert.ok(r.after.includes('>'+({binance:'11350287',bitget:'nexu888',backpack:'luckybitcoin'}[r.venueSlug])+'</span>'));}});
test('all JS and registry stay frozen',()=>{for(const f of ['src/components/v3/RegistrationCard.jsx','src/components/v3/V3Pages.jsx','src/components/v3/LeanHero.jsx','src/data/partner-registry.js'])assert.equal(f==='src/components/v3/RegistrationCard.jsx'?withoutR180Copy(read(root,f)):withoutR181(read(root,f),f),f==='src/components/v3/RegistrationCard.jsx'?expectedRegistrationSource():read(f==='src/components/v3/RegistrationCard.jsx'?fileURLToPath(new URL('../../../r172-registration-nextstep-locales/candidate/',import.meta.url)):f==='src/components/v3/LeanHero.jsx'?fileURLToPath(new URL('../../../r175-ja-home-compact-labels/candidate/',import.meta.url)):base,f),f);});
}
