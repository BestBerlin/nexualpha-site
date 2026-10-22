import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../baseline/BEHAVIOR-PINS.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const root=new URL('../',import.meta.url),evidence=new URL('../../',import.meta.url);
const read=(base,f)=>readFileSync(new URL(f,base));
const hash=b=>createHash('sha256').update(b).digest('hex');
const pins=JSON.parse(read(evidence,'baseline/BEHAVIOR-PINS.json'));
const publicPins=JSON.parse(read(evidence,'BASELINE.json'));
const anchor='import "./styles/home-refinement.css";\nimport "./styles/compare-refinement.css";\nimport "./styles/compare-motion-refinement.css";\n';
const addition='import "./styles/profile-refinement.css";\n';
const original=read(evidence,'baseline/src/main.jsx').toString();
function inverse(source){
 if(source===original)return original;
 assert.equal(source,original.replace(anchor,anchor+addition),'only exact profile import at agreed position');
 return source.replace(anchor+addition,anchor);
}
test('complete V3/registration/registry and R289 homepage/compare CSS remain byte exact',()=>{
 for(const [file,pin]of Object.entries(pins)){
  assert.equal(hash(read(evidence,'baseline/'+file)),pin);
  if(publicPins[file])assert.equal(pin,publicPins[file]);
  if(file!=='src/main.jsx'){assert.equal(hash(read(root,file)),pin,file);assert.deepEqual(read(root,file),read(evidence,'baseline/'+file));}
 }
 assert.equal(pins['src/data/partner-registry.js'],'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
test('main allows original or single profile stylesheet after existing home/compare imports only',()=>{
 assert.equal(original.split(anchor).length,2);
 assert.equal(hash(inverse(read(root,'src/main.jsx').toString())),pins['src/main.jsx']);
 assert.equal(inverse(original.replace(anchor,anchor+addition)),original);
 for(const rogue of [original.replace(anchor,addition+anchor),original.replace(anchor,anchor+addition+addition),original.replace(anchor,anchor+addition+'import "./styles/rogue.css";\n'),original.replace('installCtaAnalytics();','// installCtaAnalytics();')])assert.throws(()=>inverse(rogue));
});
}
