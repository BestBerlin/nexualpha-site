import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const fullCss = fs.readFileSync(new URL('../src/styles/compare-refinement.css', import.meta.url), 'utf8');
// This historical whole-page contract excludes only the separately locked triple-mobile append.
const patchMarker = '\n/* Three-platform mobile support:';
const patchStart = fullCss.indexOf(patchMarker);
const css = patchStart < 0 ? fullCss : fullCss.slice(0, patchStart);
const lock = JSON.parse(fs.readFileSync(new URL('../../VISUAL-BEHAVIOR-LOCK.json', import.meta.url), 'utf8'));
test('comparison visual styling stays page-scoped without behavior or geometry overrides', () => {
 const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
 for (const match of plain.matchAll(/([^{}]+)\{/g)) {
  const selectors = match[1].trim();
  if (selectors.startsWith('@media')) continue;
  for (const selector of selectors.split(',')) assert.ok(selector.trim().startsWith('.v3-compare-page'), selector);
 }
 assert.doesNotMatch(plain, /(?:display\s*:|visibility\s*:|overflow\s*:|text-overflow\s*:|line-clamp|grid-template|(?:^|[;{])\s*height\s*:|max-height\s*:|content\s*:|url\s*\()/i);
 assert.doesNotMatch(plain, /outline\s*:\s*(?:none|0)\b/i);
 assert.match(plain, /a:focus-visible\s*\{\s*outline:\s*2px solid var\(--blue-text\);\s*outline-offset:\s*3px/);
 assert.match(plain, /a:hover\s*\{\s*text-decoration-color:\s*currentColor/);
 assert.doesNotMatch(plain, /max-inline-size\s*:|line-height\s*:|text-wrap\s*:/);
 assert.match(plain, /snapshot-disclosure:not\(\[open\]\)\s*\{\s*padding-block:\s*0/);
 assert.match(plain, /width:\s*min\(var\(--content\), calc\(100% - 2 \* var\(--page-pad\)\)\)/);
 assert.doesNotMatch(plain, /compare-reading-space|margin-block\s*:/);
 assert.match(plain, /min-block-size:\s*44px/);
 for (const role of ['v3-venue-hero','v3-compare-final-choice-card','v3-matrix-table-wrap','v3-decision-side-card','v3-similar-disclosure']) assert.ok(plain.includes(role));
});
test('comparison source and immutable partner registry retain frozen bytes', () => {
 for (const [file, hash] of Object.entries(lock)) {
  const bytes = fs.readFileSync(new URL(`../${file}`, import.meta.url));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), hash, file);
 }
 assert.equal(lock['src/data/partner-registry.js'], '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
