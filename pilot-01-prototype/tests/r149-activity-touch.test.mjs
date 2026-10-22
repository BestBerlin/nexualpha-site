import { committedFileHash } from './r100-test-contracts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import postcss from 'postcss';

import { existsSync } from 'node:fs';

if (existsSync(new URL('../../../r147-reader-polish/candidate/src/components/v3/activity/ActivityCenterV3.css', import.meta.url))) {
const root=fileURLToPath(new URL('..',import.meta.url));
const baseline=path.resolve(root,'../../r147-reader-polish/candidate');
const cssPath='src/components/v3/activity/ActivityCenterV3.css';
const css=await readFile(path.join(root,cssPath),'utf8'),oldCss=await readFile(path.join(baseline,cssPath),'utf8');
const ast=postcss.parse(css),rules=selector=>ast.nodes.filter(n=>n.type==='rule'&&n.selector===selector);
const summary='.activity-center-v3__conditions-disclosure summary';
const declarations=r=>Object.fromEntries(r.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));

const normalizeRewardSourceActionsTouchTargets = (value) => value
  .replace(`.activity-center-v3__reward-grid .activity-center-v3__source-actions a {
  display: flex;
  align-items: center;
  min-height: 44px;`, `.activity-center-v3__reward-grid .activity-center-v3__source-actions a {
  display: flex;
  align-items: center;
  min-height: 40px;`)
  .replace(`  .activity-center-v3__reward-grid .activity-center-v3__source-actions a {
    justify-content: center;
    min-height: 44px;`, `  .activity-center-v3__reward-grid .activity-center-v3__source-actions a {
    justify-content: center;
    min-height: 40px;`);

test('only permitted condition-summary height and focus CSS differ',()=>{
 const normalized=normalizeRewardSourceActionsTouchTargets(css.replace('min-height: 44px;\n  align-content: center;\n  color: var(--blue-text);\n  cursor: pointer;\n  font-size: 12px;','min-height: 40px;\n  align-content: center;\n  color: var(--blue-text);\n  cursor: pointer;\n  font-size: 12px;').replace(/\n\.activity-center-v3__conditions-disclosure summary:focus-visible \{\n  outline: 2px solid var\(--blue-text\);\n  outline-offset: 4px;\n\}\n\n/,'\n'));
 assert.equal(normalized,oldCss);
});
const tmp=await mkdtemp(path.join(root,'tests/.tmp-r149-'));let rows;
try{
 const entry=path.join(tmp,'entry.jsx'),bundle=path.join(tmp,'bundle.cjs');
 await writeFile(entry,`import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{ActivityCenterV3 as After}from'../../src/components/v3/activity/ActivityCenterV3.jsx';import{ActivityCenterV3 as Before}from ${JSON.stringify(path.join(baseline,'src/components/v3/activity/ActivityCenterV3.jsx'))};import{venueDatabase}from'../../src/data/venue-database.js';Date.now=()=>1791190800000;let rows=[];for(let locale of ['en','de','ar']){let props={locale,market:'unknown',product:'unknown',venues:Object.values(venueDatabase),publicUpdates:[]};rows.push({locale,before:renderToStaticMarkup(React.createElement(Before,props)),after:renderToStaticMarkup(React.createElement(After,props))});}console.log(JSON.stringify(rows));`);
 await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',outfile:bundle,loader:{'.css':'empty'},logLevel:'silent'});
 rows=JSON.parse(execFileSync(process.execPath,[bundle],{encoding:'utf8',maxBuffer:40*1024*1024}));
}finally{await rm(tmp,{recursive:true,force:true});}
for(const row of rows)test(`${row.locale} actual SSR preserves original closed native conditions, text and all complete anchors`,()=>{
 assert.equal(row.after,row.before);
 const details=[...row.after.matchAll(/<details class="activity-center-v3__conditions-disclosure">([\s\S]*?)<\/details>/g)];assert.ok(details.length>0,'real original condition disclosures exist');
 for(const d of details){assert.match(d[1],/^<summary>[^<]+<\/summary>/);assert.match(d[1],/<ul class="activity-card-v3__conditions"><li>/);}
});
test('component and immutable commercial data remain byte exact',async()=>{
 for(const p of ['src/components/v3/activity/ActivityCenterV3.jsx','src/data/partner-registry.js'])assert.deepEqual(await readFile(path.join(root,p)),await readFile(path.join(baseline,p)));
 assert.equal(createHash('sha256').update(await readFile(path.join(root,'src/data/partner-registry.js'))).digest('hex'),committedFileHash('src/data/partner-registry.js'));
});

} else {
  test('historical regression requires original archived checkout', { skip: 'Original historical source snapshot is absent from a fresh checkout; current-source tests run separately.' }, () => {});
}

// Current-source checks run even when the original peer checkout is absent.
{
const css=await readFile(new URL('../src/components/v3/activity/ActivityCenterV3.css',import.meta.url),'utf8');
const ast=postcss.parse(css),rules=selector=>ast.nodes.filter(n=>n.type==='rule'&&n.selector===selector);
const summary='.activity-center-v3__conditions-disclosure summary';
const declarations=r=>Object.fromEntries(r.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
test('real condition summary minimum is44px with scoped visible keyboard focus and no clipping',()=>{
 const rule=rules(summary);assert.equal(rule.length,1);const d=declarations(rule[0]);assert.equal(d['min-height'],'44px');
 const focus=rules(summary+':focus-visible');assert.equal(focus.length,1);assert.equal(declarations(focus[0]).outline,'2px solid var(--blue-text)');assert.equal(declarations(focus[0])['outline-offset'],'4px');
 for(const p of ['overflow','text-overflow','white-space','word-break'])assert.equal(d[p],undefined,'no masking/shrinking/wrap override');
});
}
