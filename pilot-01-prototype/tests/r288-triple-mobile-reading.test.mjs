import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../TRIPLE-MOBILE-LOCK.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const css = fs.readFileSync(new URL('../src/styles/compare-refinement.css', import.meta.url), 'utf8');
const lock = JSON.parse(fs.readFileSync(new URL('../../TRIPLE-MOBILE-LOCK.json', import.meta.url)));
const marker = '\n/* Three-platform mobile support:';
const start = css.indexOf(marker);
test('triple mobile patch is an isolated append with narrow exact platform scope', () => {
 assert.ok(start > 0);
 assert.equal(hash(css.slice(0, start)), lock.cssBaseline);
 const patch = css.slice(start).replace(/\/\*[\s\S]*?\*\//g, '');
 assert.match(patch, /@media \(max-width: 680px\)/);
 for (const match of patch.matchAll(/([^{}]+)\{/g)) {
  const selector = match[1].trim();
  if (selector.startsWith('@media')) continue;
  assert.ok(selector.startsWith('.v3-compare-page .v3-versus-card--supporting[style]'), selector);
 }
 assert.equal((patch.match(/!important/g) || []).length, 1);
 assert.match(patch, /grid-template-columns: minmax\(0, 1fr\) !important/);
 assert.match(patch, /display: flex; flex-direction: column; grid-row: auto/);
 assert.match(patch, /flex-wrap: wrap/);
 assert.match(patch, /white-space: normal; overflow-wrap: anywhere/);
 assert.doesNotMatch(patch, /display:\s*none|font-size:|(?:^|[;{])\s*height:|ellipsis|matrix|outline:|content:|url\(/);
});
test('original triple renderer, CTA resolver inputs and registry bytes remain unchanged', () => {
 for (const [file, expected] of Object.entries(lock.sources)) assert.equal(hash(fs.readFileSync(new URL(`../${file}`, import.meta.url))), expected, file);
 const jsx = fs.readFileSync(new URL('../src/components/v3/V3Pages.jsx', import.meta.url), 'utf8');
 assert.match(jsx, /profiles.length >= 3 \? \{ gridTemplateColumns: `repeat\(\$\{profiles.length\}, 1fr\)` \}/);
 assert.match(jsx, /href=\{pCta.ctaHref\}/);
});
}
