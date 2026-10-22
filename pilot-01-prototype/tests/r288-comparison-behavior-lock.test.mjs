import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../BASELINE.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const candidate=new URL('../',import.meta.url);
const evidence=new URL('../../',import.meta.url);
const read=(root,file)=>readFileSync(new URL(file,root));
const hash=value=>createHash('sha256').update(value).digest('hex');
const pins=JSON.parse(read(evidence,'BASELINE.json'));
const homePins=JSON.parse(read(evidence,'baseline/HOME-PINS.json'));
const imports='import "./styles/compare-refinement.css";\nimport "./styles/compare-motion-refinement.css";\n';
const anchor='import "./styles/home-refinement.css";\n';
function restoreMain(source){
 const before=read(evidence,'baseline/src/main.jsx').toString();
 if(source===before)return source;
 assert.equal(source,before.replace(anchor,anchor+imports),'only both explicitly allowed imports in exact location');
 return source.replace(anchor+imports,anchor);
}
test('complete comparison React sources and registry retain exact baseline bytes',()=>{
 for(const file of ['src/components/v3/V3Pages.jsx','src/components/v3/CompareFinalChoiceCard.jsx','src/data/partner-registry.js']){
  assert.equal(hash(read(candidate,file)),pins[file],file);
  if(file!=='src/data/partner-registry.js')assert.equal(hash(read(evidence,'baseline/'+file)),pins[file]);
 }
 assert.equal(pins['src/data/partner-registry.js'],'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
test('R287 homepage CSS and chooser component stay byte-identical',()=>{
 for(const [file,pin] of Object.entries(homePins)){
  assert.equal(hash(read(candidate,file)),pin,file);
  assert.deepEqual(read(candidate,file),read(evidence,'baseline/'+file));
 }
});
test('entry point permits only exact two comparison imports after existing homepage import',()=>{
 const before=read(evidence,'baseline/src/main.jsx').toString();
 assert.equal(hash(before),pins['src/main.jsx']);
 assert.equal(before.split(anchor).length,2);
 assert.equal(restoreMain(read(candidate,'src/main.jsx').toString()),before);
 assert.equal(restoreMain(before.replace(anchor,anchor+imports)),before);
 for(const rogue of [before.replace(anchor,anchor+imports.split('\n')[0]+'\n'),before.replace(anchor,anchor+imports+'import "./styles/rogue.css";\n'),before.replace(anchor,imports+anchor),before.replace('installCtaAnalytics();','// installCtaAnalytics();')])assert.throws(()=>restoreMain(rogue));
});
}
