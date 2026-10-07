import { restoreEvidenceJs, restoreEvidenceCss } from './fixtures/r286-profile-evidence-summary-inverse.mjs';
import { restoreResearchCss } from "./fixtures/r286-home-research-inverse.mjs";
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const hash = v => createHash('sha256').update(v).digest('hex');
const css = restoreEvidenceCss(await readFile(new URL('src/components/v3/v3.css', root), 'utf8'));
const baseline = await readFile(new URL('../../compare-open-snapshot-fix/v3.before.css', import.meta.url), 'utf8');
const baselineSha = '9aee0ffeb8a33d4a94770c063d71a27162b8485ff4f92dc92004488715acd5a6';
const hunk = '\n.v3-compare-snapshot-disclosure[open] .v3-snapshot-strip b,\n.v3-compare-snapshot-disclosure[open] .v3-snapshot-strip p {\n  display: block;\n  max-height: none;\n  overflow: visible;\n  -webkit-line-clamp: unset;\n  -webkit-box-orient: initial;\n  white-space: normal;\n  overflow-wrap: anywhere;\n}\n';
function inverse(source) {
  assert.equal(source.split(hunk).length, 2);
  const restored = source.replace(hunk, '');
  assert.equal(hash(restored), baselineSha);
  return restored;
}
test('opened compare snapshot text reset is exactly bounded and preserves all preceding CSS', () => {
  assert.ok(css.endsWith(hunk));
  assert.equal(hash(baseline), baselineSha);
  assert.equal(inverse(css), baseline);
  for (const rogue of [css.replace('disclosure[open] .v3-snapshot-strip p', 'disclosure .v3-snapshot-strip p'), css.replace('overflow: visible;\n  -webkit-line-clamp: unset;', 'overflow: hidden;\n  -webkit-line-clamp: 2;'), css + '\n/* rogue */\n']) {
    assert.notEqual(rogue, css);
    assert.throws(() => inverse(rogue));
  }
});
test('full compare text/hrefs, original 44px summary, invitation registry and home CSS are fixed', async () => {
  for (const [path, expected] of [
    ['src/components/v3/V3Pages.jsx', '2bb5f13bd8ffb4e2b69cb6d44c48454aeed7d35fcb438229d570021c706b7046'],
    ['src/components/v3/growth-conversion.css', '1b79c0628f042d82cd42a05037b81ec9ea26fceaa0cf1bebf02346516269bc23'],
    ['src/data/partner-registry.js', '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a'],
  ]) {
    const raw = await readFile(new URL(path, root));
    const value = path === "src/components/v3/V3Pages.jsx" ? restoreEvidenceJs(raw.toString()) : raw;
    assert.equal(hash(path === "src/components/v3/growth-conversion.css" ? restoreResearchCss(value.toString()) : value), expected, path);
  }
  assert.match(css, /\.v3-compare-snapshot-disclosure > summary \{\s*min-height: 44px;/);
});
