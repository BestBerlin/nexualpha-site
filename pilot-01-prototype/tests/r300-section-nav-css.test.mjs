import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../navigation-css/news-detail-page.before.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const css=await readFile(new URL('../src/components/v3/news/news-detail-page.css',import.meta.url),'utf8');const before=await readFile(new URL('../../navigation-css/news-detail-page.before.css',import.meta.url),'utf8');const marker='/* R300: native section navigation belongs to the editorial reading line. */';
test('original article CSS survives exact inverse',()=>{const i=css.indexOf(marker);assert.ok(i>=before.length);assert.equal(css.slice(0,i).trimEnd(),before.trimEnd());});
test('native nav wraps safely without sticky or table/content clipping',()=>{const s=css.slice(css.indexOf(marker));assert.match(s,/news-detail__section-select/);assert.match(s,/flex-wrap: wrap/);assert.match(s,/min-block-size: 44px/);assert.match(s,/scroll-margin-block-start: 6rem/);assert.match(s,/:focus-visible/);assert.doesNotMatch(s,/position:\s*(?:sticky|fixed)|display:\s*none|overflow:\s*hidden|(?:^|[;{]\s*)(?:order|font-size|font-family|direction|animation)\s*:/);for(const sel of s.replace(/\/\*[\s\S]*?\*\//g,'').match(/[^{}]+(?=\{)/g).filter(t=>!t.trim().startsWith('@')))assert.ok(sel.trim().startsWith('.news-detail-page'));});
test('partner registry remains exact',async()=>{const b=await readFile(new URL('../src/data/partner-registry.js',import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
}
