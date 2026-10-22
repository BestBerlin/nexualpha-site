import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import postcss from 'postcss';
import {createHash} from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../before-VenueYellowPages.jsx", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const root=fileURLToPath(new URL('../',import.meta.url));
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
const src=readFileSync(path.join(root,'src/components/v3/VenueYellowPages.jsx'),'utf8'),oldsrc=readFileSync(new URL('../../before-VenueYellowPages.jsx',import.meta.url),'utf8');
const css=readFileSync(path.join(root,'src/components/v3/venue-yellow-pages.css'),'utf8'),oldcss=readFileSync(new URL('../../before-venue-yellow-pages.css',import.meta.url),'utf8');
const ast=postcss.parse(css),marker='\n/* R197: visible sorting focus and scoped reduced-motion directory feedback. */';
const temp=await fs.mkdtemp(path.join(root,'tests/.tmp-r197-'));let rows;
try{
 const entry=path.join(temp,'entry.jsx'),bundle=path.join(temp,'bundle.cjs'),before=path.resolve(root,'../before-VenueYellowPages.jsx');
 // Resolve baseline imports relative to its original component directory, not the evidence copy.
 const baseline=path.resolve(root,'../../r192-reader-integration/candidate/src/components/v3/VenueYellowPages.jsx');
 await fs.writeFile(entry,`import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{VenueYellowPages}from'../../src/components/v3/VenueYellowPages.jsx';import{VenueYellowPages as Before}from${JSON.stringify(baseline)};import{venueDatabase}from'../../src/data/venue-database.js';Date.now=()=>1791190800000;const rows=[];for(const locale of ${JSON.stringify(locales)})for(const compact of [false,true])for(const context of [{market:'unknown',product:'unknown'},{market:'BR',product:'spot'},{market:'DE',product:'perpetuals'}]){const props={locale,compact,...context,venues:['binance','okx','uniswap','hyperliquid'].map(s=>venueDatabase[s]).filter(Boolean)};rows.push({locale,compact,context,before:renderToStaticMarkup(React.createElement(Before,props)),after:renderToStaticMarkup(React.createElement(VenueYellowPages,props))});}console.log(JSON.stringify(rows));`);
 await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',outfile:bundle,loader:{'.css':'empty'},logLevel:'silent'});rows=JSON.parse(execFileSync(process.execPath,[bundle],{encoding:'utf8',maxBuffer:30*1024*1024}));
}finally{await fs.rm(temp,{recursive:true,force:true});}
const normalize=h=>h.replace(/(<div class="yellow-pages__tabs") role="group" aria-label="[^"]*"/g,'$1 role="tablist"').replace(/(<button type="button") aria-pressed="(true|false)"( class="yellow-pages__tab")/g,'$1 role="tab" aria-selected="$2"$3');
for(const locale of locales)test(locale+': named native filter group has correct pressed state; full HTML and ordered hrefs unchanged after exact role normalization',()=>{
 for(const row of rows.filter(r=>r.locale===locale)){assert.match(row.after,/<div class="yellow-pages__tabs" role="group" aria-label="[^"]+">/);assert.doesNotMatch(row.after,/role="tab(?:list)?"|aria-selected=/);const group=row.after.match(/<div class="yellow-pages__tabs"[\s\S]*?<\/div>/)[0],buttons=[...group.matchAll(/<button\b([^>]*)>/g)];assert.equal(buttons.length,4);assert.equal(buttons.filter(b=>b[1].includes('aria-pressed="true"')).length,1);for(const b of buttons)assert.equal(b[1].includes('aria-pressed="true"'),b[1].includes('data-active="true"'));assert.equal(normalize(row.after),row.before);assert.deepEqual([...row.after.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]),[...row.before.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]));}
});
test('JSX inverse is exactly three semantic substitutions; all handlers/storage/URL/gates unchanged',()=>{
 const reverse=src.replace('<div className="yellow-pages__tabs" role="group" aria-label={ui.sectionTitle}>','<div className="yellow-pages__tabs" role="tablist">').replace('<button key={cat.id} type="button"\n              aria-pressed={selectedCategory === cat.id}','<button key={cat.id} type="button" role="tab"\n              aria-selected={selectedCategory === cat.id}');assert.equal(reverse,oldsrc);assert.notEqual(src,oldsrc);assert.equal(createHash('sha256').update(readFileSync(path.join(root,'src/data/partner-registry.js'))).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
function rules(selector,media){const out=[];ast.walkRules(r=>{if(!r.selectors.includes(selector))return;const ancestors=[];for(let p=r.parent;p;p=p.parent)if(p.type==='atrule'&&p.name==='media')ancestors.push(p.params);if(media?ancestors.includes(media):!ancestors.length)out.push(r);});return out;}
const values=(rs,prop)=>rs.flatMap(r=>r.nodes.filter(n=>n.type==='decl'&&n.prop===prop).map(n=>n.value));
test('sort keyboard focus is independent 2px ring; CSS addition precisely reverses',()=>{assert.ok(css.includes(marker));assert.equal(css.slice(0,css.indexOf(marker)),oldcss);const focus=rules('.yellow-pages__sort-select:focus-visible');assert.deepEqual(values(focus,'outline'),['2px solid var(--blue-text, #8fb0ff)']);assert.deepEqual(values(focus,'outline-offset'),['3px']);});
test('reduce normal policy covers mobile/desktop and coarse/fine without canceling positioning transforms',()=>{
 const media='(prefers-reduced-motion: reduce)';for(const width of [390,1440])for(const hover of ['none','hover'])for(const pointer of ['coarse','fine']){
  for(const selector of ['.yellow-pages .yellow-card::before','.yellow-pages .yellow-card__por-pill::before','.yellow-pages .yellow-card__reward-badge::before','.yellow-pages .yellow-pages__toast'])assert.deepEqual(values(rules(selector,media),'animation'),['none'],`${width}/${hover}/${pointer} ${selector}`);
  for(const selector of ['.yellow-pages .yellow-card:hover','.yellow-pages .yellow-card:active','.yellow-pages .yellow-card__code--btn:hover','.yellow-pages .yellow-pages__tab:active','.yellow-pages .yellow-pages__chip:active','.yellow-pages .yellow-card__btn-detail:active','.yellow-pages .yellow-card__btn-register:active'])assert.deepEqual(values(rules(selector,media),'transform'),['none']);
 }
 assert.equal(values(rules('.yellow-pages .yellow-pages__toast',media),'transform').length,0,'toast translateX is layout and must survive');
 const suffix=css.slice(css.indexOf(marker));assert.doesNotMatch(suffix,/display:\s*none|font-size|opacity:\s*0|height:\s*0|\.yellow-pages\s+\*/);assert.equal((suffix.match(/@media/g)||[]).length,1);assert.ok(oldcss.includes('animation: yc-beam-spin 5s linear infinite paused;'));assert.ok(oldcss.includes('transform: translateY(-3px);'));
});

test('actual loaded important shorthand/longhand cascade yields zero-duration reduced card transitions regardless lazy load order',()=>{
 const main=readFileSync(path.join(root,'src/main.jsx'),'utf8');
 assert.ok(main.includes('import "./styles/fintech-premium.css";'));assert.ok(main.includes('import "./styles/tokens.css";'));
 const premium=postcss.parse(readFileSync(path.join(root,'src/styles/fintech-premium.css'),'utf8')),tokens=postcss.parse(readFileSync(path.join(root,'src/styles/tokens.css'),'utf8'));
 // Bounded resolver for exact card element selectors; important shorthand expands duration.
 function winningDuration(sheets,reduce){const entries=[];let order=0;
  for(const sheet of sheets)sheet.walkRules(r=>{
   for(const selector of r.selectors){if(!['*','.yellow-card','.yellow-pages .yellow-card'].includes(selector))continue;
    const media=[];for(let p=r.parent;p;p=p.parent)if(p.type==='atrule'&&p.name==='media')media.push(p.params);
    if(media.some(m=>m.includes('prefers-reduced-motion: reduce')&&!reduce||m.includes('prefers-reduced-motion: no-preference')&&reduce))continue;
    if(media.some(m=>!m.includes('prefers-reduced-motion:')&&!/max-width: 780px/.test(m)))continue;
    for(const d of r.nodes){if(d.type!=='decl'||!['transition','transition-duration'].includes(d.prop))continue;
     const duration=d.prop==='transition-duration'?d.value:d.value==='none'?'0s':(d.value.match(/(?:\d*\.)?\d+(?:ms|s)\b/g)||[]).join(',');
     entries.push({selector,value:d.value,duration,important:!!d.important,specificity:(selector.match(/\./g)||[]).length,order:order++});
    }
   }
  });
  assert.ok(entries.some(e=>e.selector==='.yellow-card'&&e.important&&e.duration.includes('0.22s')),'real premium shorthand exists');
  return entries.sort((a,b)=>Number(a.important)-Number(b.important)||a.specificity-b.specificity||a.order-b.order).at(-1);
 }
 for(const sheets of [[tokens,premium,ast],[ast,premium,tokens]]){
  const reduced=winningDuration(sheets,true);assert.equal(reduced.selector,'.yellow-pages .yellow-card');assert.equal(reduced.duration,'0s');assert.equal(reduced.important,true);
  const normal=winningDuration(sheets,false);assert.equal(normal.selector,'.yellow-card');assert.ok(normal.duration.includes('0.22s'));
 }
});
}
