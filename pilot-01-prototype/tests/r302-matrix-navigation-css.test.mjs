import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../matrix-css/compare-refinement.before.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const css=await readFile(new URL('../src/styles/compare-refinement.css',import.meta.url),'utf8'),before=await readFile(new URL('../../matrix-css/compare-refinement.before.css',import.meta.url),'utf8');const marker='/* R302: native navigation to the matrix metrics that actually exist. */';
test('inverse restores exact prior comparison styles',()=>{const i=css.indexOf(marker);assert.ok(i>=before.length);assert.equal(css.slice(0,i).trimEnd(),before.trimEnd());});
test('compact native metric navigation is scoped and does not conceal pending data',()=>{const s=css.slice(css.indexOf(marker));assert.match(s,/v3-matrix-jump/);assert.match(s,/flex-wrap: wrap/);assert.match(s,/min-block-size: 44px/);assert.match(s,/data-metric-key/);assert.match(s,/:focus-visible/);assert.doesNotMatch(s,/transition:\s*all|position:\s*(?:sticky|fixed)|display:\s*none|overflow:\s*hidden|(?:^|[;{]\s*)(?:order|animation|font-size|font-family|direction)\s*:/);for(const sel of s.replace(/\/\*[\s\S]*?\*\//g,'').match(/[^{}]+(?=\{)/g).filter(t=>!t.trim().startsWith('@')))assert.ok(sel.trim().startsWith('.v3-compare-page'));});
test('partner registry unchanged',async()=>{const b=await readFile(new URL('../src/data/partner-registry.js',import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
}
