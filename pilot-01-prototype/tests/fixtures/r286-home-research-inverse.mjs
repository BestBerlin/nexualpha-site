import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const hash = v => createHash('sha256').update(v).digest('hex');
const raw = readFileSync(new URL('../../../home-single-dom-refinement/literal-changes.json', import.meta.url), 'utf8');
assert.equal(hash(raw), 'cfe7193454560407bae85c0e3d4be2d43bfbe9e2de37e95f679c12d5411ee410');
const spec = JSON.parse(raw);
const focusRaw = readFileSync(new URL('../../../home-research-focus-fix/literal-changes.json', import.meta.url), 'utf8');
assert.equal(hash(focusRaw), '29e76edefd3a02a81fe0890103c42fa2ae08439034d28408a84972c2ea961670');
const focusSpec = JSON.parse(focusRaw);
export function restoreHiddenResearchFocus(source) {
  let result = source;
  for (const [old, next] of [...focusSpec.changes].reverse()) {
    assert.equal(result.split(next).length, 2, 'one exact separately authorized focus hunk');
    result = result.replace(next, old);
  }
  assert.equal(hash(result), focusSpec.beforeSHA, 'focus-only inverse protects every other byte');
  return result;
}
export function restoreResearchJsx(source) {
  let result = restoreHiddenResearchFocus(source);
  for (const [old, next] of [...spec.jsxChanges].reverse()) {
    assert.equal(result.split(next).length, 2, 'one exact separately approved hero JSX hunk');
    result = result.replace(next, old);
  }
  assert.equal(hash(result), spec.jsxSHA, 'unrelated hero bytes protected');
  return result;
}
export function restoreResearchCss(source) {
  assert.equal(source.split(spec.cssAppend).length, 2, 'one exact separately approved visibility hunk');
  let result = source.replace(spec.cssAppend, '');
  for (const [old, next] of [...spec.cssChanges].reverse()) result = result.split(next).join(old);
  assert.equal(hash(result), spec.cssSHA, 'unrelated growth CSS bytes protected');
  return result;
}
