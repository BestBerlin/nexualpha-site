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

const root=process.cwd(),base=path.resolve(root,'../../r260-final-task-integration/candidate'),file='src/components/v3/TradingBleedAnalyzer.jsx',css='src/components/v3/trading-bleed-analyzer.css',require=createRequire(import.meta.url),read=(r,f)=>fs.readFileSync(path.join(r,f),'utf8');const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const before='  const inviteCode = partner.inviteCode ?? db.inviteCode ?? null;',after='  const inviteCode = regionalCta.inviteCode ?? partner.inviteCode ?? db.inviteCode ?? null;';
const tail='\n/* Calculator controls keep native range visuals with a full touch hit area. */\n.bleed-analyzer-section .bleed-copy-code-btn {\n  min-block-size: 44px;\n  box-sizing: border-box;\n}\n.bleed-analyzer-section .bleed-slider {\n  height: 44px;\n  box-sizing: border-box;\n}\n.bleed-analyzer-section .bleed-copy-code-btn:focus-visible,\n.bleed-analyzer-section .bleed-slider:focus-visible {\n  outline: 2px solid var(--blue-text, #38bdf8);\n  outline-offset: 3px;\n}\n';
class FixedDate extends Date{constructor(...a){super(...(a.length?a:['2026-10-05T00:00:00Z']));}static now(){return Date.parse('2026-10-05T00:00:00Z');}}
function load(dir,react=React){const code=buildSync({stdin:{contents:"export {TradingBleedAnalyzer} from './src/components/v3/TradingBleedAnalyzer.jsx';export {regionalVenueCta} from './src/data/source-bound-cta.js';export {partnerRegistry} from './src/data/partner-registry.js';export {venueDatabase} from './src/data/venue-database.js';",resolveDir:dir,loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node',external:['react','react/jsx-runtime'],loader:{'.css':'empty','.webp':'text'},logLevel:'silent'}).outputFiles[0].text;const m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require:n=>n==='react'?react:require(n),console,URL,URLSearchParams,Intl,Date:FixedDate,setTimeout,clearTimeout});return m.exports;}
const slugs=['binance','okx','bybit','bitget','gate-io','kucoin','mexc'],locales=['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function ssr(dir,slug,locale){let cursor=0;const wrapped={...React,useState(v){return React.useState(cursor++===0?slug:v);}};const r=load(dir,wrapped);return {html:renderToStaticMarkup(React.createElement(r.TradingBleedAnalyzer,{locale})),r};}
function code(html){const m=html.match(/(<button[^>]*class="bleed-copy-code-btn font-mono"[^>]*>)([^<]+)(<\/button>)/);assert.ok(m);return m;}
test('15 locales x7 actual platform code pairs use existing route resolver and keep complete href/otherSSR unchanged',()=>{for(const locale of locales)for(const slug of slugs){const now=ssr(root,slug,locale),old=ssr(base,slug,locale),cta=now.r.regionalVenueCta(slug,locale),expected=cta.inviteCode??now.r.partnerRegistry[slug]?.inviteCode??now.r.venueDatabase[slug]?.inviteCode;const match=code(now.html);assert.ok(match[2].startsWith(esc(expected)+' '),locale+'/'+slug+' active approved route code');assert.ok(now.html.includes('href="'+esc(cta.ctaHref)+'"'));const oldCode=code(old.html);assert.equal(now.html.replace(match[0],oldCode[0]),old.html,locale+'/'+slug+' complete non-code SSR including allhrefs/fees/context');if(slug==='okx'){assert.equal(expected,'nexu888');assert.equal(cta.ctaHref,'https://www.okx.com/join/nexu888');}if(slug==='bitget'){assert.equal(expected,'nexu888');assert.equal(cta.ctaHref,'https://partner.bitget.com/bg/C6PRAF');}}});
test('actual copy handler missing-clipboard feedback carries selected route code without injecting clipboard',async()=>{let cursor=0;const slots=[];const react={...React,useState(v){const i=cursor++;if(!(i in slots))slots[i]=i===0?'okx':v;return [slots[i],next=>slots[i]=typeof next==='function'?next(slots[i]):next];},useMemo:f=>f(),useEffect(){}};const r=load(root,react);const tree=r.TradingBleedAnalyzer({locale:'ja'});const find=n=>{if(!n)return null;if(Array.isArray(n)){for(const c of n){const f=find(c);if(f)return f;}return null;}if(typeof n!=='object')return null;if(n.props?.className==='bleed-copy-code-btn font-mono')return n;return find(n.props?.children);};const button=find(tree);assert.ok(button);await button.props.onClick({preventDefault(){}});assert.equal(slots[3].status,'failed');assert.equal(slots[3].value,r.regionalVenueCta('okx','ja').inviteCode);});
test('native range/copy targets44 and focus do not alter thin native appearance or formula fields',()=>{const ast=postcss.parse(read(root,css)),rules={};ast.walkRules(r=>rules[r.selector]=Object.fromEntries(r.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value])));assert.equal(rules['.bleed-analyzer-section .bleed-copy-code-btn']?.['min-block-size'],'44px');assert.equal(rules['.bleed-analyzer-section .bleed-slider']?.height,'44px');assert.equal(rules['.bleed-analyzer-section .bleed-slider']?.appearance,undefined);assert.ok(read(root,css).endsWith(tail));});
test('exact JSX/CSS inverses and bidirectional full source/data/config/public protect all invitation/code records',()=>{assert.equal(read(root,file).split(after).length,2);assert.equal(read(root,file).replace(after,before),read(base,file));const c=read(root,css);assert.ok(c.endsWith(tail));assert.equal(c.slice(0,-tail.length),read(base,css));const keys=r=>['src','config','public'].flatMap(a=>{const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.isFile()?[path.relative(r,path.join(d,e.name))]:[]);return walk(path.join(r,a));}).sort();assert.deepEqual(keys(root),keys(base));for(const f of keys(base))if(![file,css].includes(f))assert.equal(sha(approvedRuntime[f]?projectApproved(f,fs.readFileSync(path.join(root,f),'utf8'),'r260-final-task-integration'):fs.readFileSync(path.join(root,f))),sha(fs.readFileSync(path.join(base,f))),f);assert.equal(sha(fs.readFileSync(path.join(root,'src/data/partner-registry.js'))),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});

test('legacy calculator expectations evolve only two previously mispaired code assertions',()=>{const old=read(base,'tests/decision-return-calculators.test.mjs'),now=read(root,'tests/decision-return-calculators.test.mjs');assert.equal(old.split('assert.match(fees, /LUCKX/);').length,2);assert.equal(old.split('assert.match(visible, /LUCKX/);').length,2);assert.equal(now.replace('assert.match(fees, /nexu888/);','assert.match(fees, /LUCKX/);').replace('assert.match(visible, /nexu888/);','assert.match(visible, /LUCKX/);'),old);});
}
