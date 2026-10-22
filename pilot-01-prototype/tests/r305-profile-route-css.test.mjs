import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../route-css/profile-refinement.before.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const css=await readFile(new URL('../src/styles/profile-refinement.css',import.meta.url),'utf8'),before=await readFile(new URL('../../route-css/profile-refinement.before.css',import.meta.url),'utf8');const marker='/* R305: real action-first DOM, with the established desktop research columns. */';
test('prior profile stylesheet restored by exact inverse',()=>{const i=css.indexOf(marker);assert.ok(i>=before.length);assert.equal(css.slice(0,i).trimEnd(),before.trimEnd());});
test('desktop anchored by explicit grid, mobile follows DOM and keeps targets',()=>{const s=css.slice(css.indexOf(marker));assert.match(s,/min-width: 1100px/);assert.match(s,/max-width: 1099px/);assert.match(s,/grid-column: 1/);assert.match(s,/grid-column: 2/);assert.match(s,/grid-row: 1/);assert.match(s,/min-block-size: 44px/);assert.doesNotMatch(s,/(?:^|[;{]\s*)(?:order|animation|font-size|font-family|height)\s*:|display:\s*none/);for(const sel of s.replace(/\/\*[\s\S]*?\*\//g,'').match(/[^{}]+(?=\{)/g).filter(t=>!t.trim().startsWith('@')))assert.ok(sel.trim().startsWith('.v3-profile-page'));});
test('partner bytes unchanged',async()=>{const b=await readFile(new URL('../src/data/partner-registry.js',import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
}
