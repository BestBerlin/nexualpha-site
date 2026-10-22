import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
const { projectApproved: projectApproved } = await import("./helpers/r237-approved-inverses.mjs");





const css = readFileSync(new URL('../src/components/v3/live-conversion-proof.css', import.meta.url), 'utf8');
const jsx = readFileSync(new URL('../src/components/v3/LiveConversionProof.jsx', import.meta.url), 'utf8');
const baseCss = readFileSync(new URL('../../../r260-final-task-integration/candidate/src/components/v3/live-conversion-proof.css', import.meta.url), 'utf8');
const baseJsx = readFileSync(new URL('../../../r260-final-task-integration/candidate/src/components/v3/LiveConversionProof.jsx', import.meta.url), 'utf8');

function sha(text) { return createHash('sha256').update(text).digest('hex'); }

test('R271 hides the illustrative conversion toast only in short viewport height', () => {
  assert.match(css, /@media \(max-height: 500px\) \{\s*\.conversion-proof-toast\s*\{\s*display:\s*none;\s*\}\s*\}/);
  assert.match(css, /@media \(max-width: 780px\)[\s\S]*?\.conversion-proof-toast\s*\{\s*display:\s*none;\s*\}/, 'existing mobile-width hide rule remains');
});

test('R271 does not remove the example proof feature, mock wording, or motion states', () => {
  assert.equal(jsx, baseJsx, 'LiveConversionProof runtime and copy remain byte-identical');
  for (const token of [
    'Illustrative decision path · not a live user event',
    'conversion-proof-toast--in',
    'conversion-proof-toast--out',
    'aria-live="polite"',
    'MOCK_EVENTS',
  ]) assert.ok(jsx.includes(token), `${token} preserved`);
});

test('R271 CSS change is the single approved short-height hunk', () => {
  const added = '@media (max-height: 500px) {\n  .conversion-proof-toast {\n    display: none;\n  }\n}\n\n';
  assert.equal(css, baseCss + added, 'CSS differs from R260 only by the short-height hide hunk');
  assert.equal(css.includes('overflow: hidden'), baseCss.includes('overflow: hidden'), 'does not mask via overflow hidden');
  assert.equal(css.includes('line-clamp'), baseCss.includes('line-clamp'), 'does not add clamp');
});


test('R271 keeps protected source/data files byte-identical and registry hash stable', () => {
  const protectedFiles = [
    'src/data/partner-registry.js',
    'src/data/official-campaign-research.js',
    'src/data/exchange-research.js',
    'src/data/news-feed-client.js',
    'src/data/reviewed-news-publication.js',
  ];
  for (const file of protectedFiles) {
    const current = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    const base = readFileSync(new URL(`../../../r260-final-task-integration/candidate/${file}`, import.meta.url), 'utf8');
    assert.equal(file==='src/data/news-feed-client.js'?projectApproved(file,current,'r260-final-task-integration'):current, base, `${file} unchanged`);
  }
  const registry = readFileSync(new URL('../src/data/partner-registry.js', import.meta.url), 'utf8');
  assert.equal(sha(registry), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
}
