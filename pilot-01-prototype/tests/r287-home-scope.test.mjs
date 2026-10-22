import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../baseline/src/App.jsx", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const read=p=>readFileSync(p,'utf8');
test('home-only class preserves every original App byte after exact inverse',()=>{
 assert.equal(read('src/App.jsx').replace('className="v2-page home-refinement"','className="v2-page"'),read('../baseline/src/App.jsx'));
});
test('entry only imports scoped refinement sheet',()=>{
 assert.equal(read('src/main.jsx').replace('\nimport "./styles/home-refinement.css";',''),read('../baseline/src/main.jsx'));
});
test('partner registry remains immutable',()=>{
 assert.equal(createHash('sha256').update(readFileSync('src/data/partner-registry.js')).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});

test('refinement keeps accepted first iteration bytes and limits nested surfaces to homepage',()=>{
 const s=read('src/styles/home-refinement.css');
 const b=read('../iteration-2/home-refinement.before.css');
 assert.ok(s.startsWith(b));
 const suffix=s.slice(b.length).split('/* Intentional feedback;')[0];
 const selectors=suffix.split('}').map(x=>x.slice(x.lastIndexOf('*/')+2).split('{')[0].trim()).filter(Boolean);
 assert.equal(selectors.length,5);
 assert.ok(selectors.every(x=>x.startsWith('.home-refinement .lean-hero__telemetry ')));
 assert.ok(!/display:\s*none|overflow:\s*hidden/.test(suffix));
});
}
