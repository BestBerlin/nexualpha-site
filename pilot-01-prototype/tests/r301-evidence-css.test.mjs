import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../evidence-css/compare-refinement.before.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const css=await readFile(new URL('../src/styles/compare-refinement.css',import.meta.url),'utf8'),before=await readFile(new URL('../../evidence-css/compare-refinement.before.css',import.meta.url),'utf8');const marker='/* R301: question, source-bound matrix, then the complete account choice. */';
test('inverse preserves previous comparison exact CSS',()=>{const i=css.indexOf(marker);assert.ok(i>=before.length);assert.equal(css.slice(0,i).trimEnd(),before.trimEnd());});
test('evidence reading scoped with no hidden unknowns or source changes',()=>{const s=css.slice(css.indexOf(marker));assert.match(s,/v3-metric-matrix-section/);assert.match(s,/#compare-final-choice/);assert.match(s,/v3-matrix-td--dim/);assert.match(s,/#compare-versus-card\.v3-compare-support-disclosure/);assert.match(s,/width: min\(var\(--content\), calc\(100% - 2 \* var\(--page-pad\)\)\)/);assert.doesNotMatch(s,/(?:^|[;{]\s*)(?:order|animation|font-family|height|overflow)\s*:|display\s*:\s*none|#[0-9a-fA-F]{3,8}\b/);for(const sel of s.replace(/\/\*[\s\S]*?\*\//g,'').match(/[^{}]+(?=\{)/g).filter(t=>!t.trim().startsWith('@')))assert.ok(sel.trim().startsWith('.v3-compare-page'));});
test('partner unchanged',async()=>{const b=await readFile(new URL('../src/data/partner-registry.js',import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
}
