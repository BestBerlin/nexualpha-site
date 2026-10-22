import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../summary-placement-fix/baseline/v3-layout-stability.before-four-summary.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { restoreRegistrationSummary: restoreRegistrationSummary } = await import("./fixtures/r286-registration-summary-inverse.mjs");




const css = restoreRegistrationSummary(await readFile(new URL('../src/styles/v3-layout-stability.css', import.meta.url), 'utf8'));
const baseline = await readFile(new URL('../../summary-placement-fix/baseline/v3-layout-stability.before-four-summary.css', import.meta.url), 'utf8');
const sha = x => createHash('sha256').update(x).digest('hex');
const beforeSha = '639ec3b2b81e96bad3d889feff9b2480b92d19fe4e21c7f02bafe095397f21b6';
const selectors = ['.home-research-drawer', '.home-analyzer-drawer', '.v3-profile-evidence-drawer', '.v3-compare-research-paths'];
const hunks = selectors.map(s => `  ${s} > summary > b { grid-column: 2; grid-row: 1; }\n`);
function inverse(source) {
  let restored = source;
  for (const hunk of hunks) {
    assert.equal(restored.split(hunk).length, 2, 'one exact authorized literal per selector');
    restored = restored.replace(hunk, '');
  }
  assert.equal(sha(restored), beforeSha);
  return restored;
}
test('four plus controls have explicit first-row placement only in existing 780 block', () => {
  const start = css.indexOf('@media (max-width: 780px) {\n  .home-section-nav');
  const end = css.indexOf('\n}\n', start);
  assert.ok(start > -1 && end > start);
  const block = css.slice(start, end);
  for (const hunk of hunks) assert.equal(block.split(hunk).length, 2);
});
test('four literal inverse restores fixed previous source and rejects foreign/broadened edits', () => {
  assert.equal(sha(baseline), beforeSha);
  assert.equal(inverse(css), baseline);
  assert.throws(() => inverse(css + '\n/* unapproved style */\n'));
  for (const hunk of hunks) assert.throws(() => inverse(css.replace(hunk, hunk.replace('grid-row: 1', 'grid-row: 3'))));
});
test('registry stays frozen and activity index is not added to this slice', async () => {
  assert.equal(sha(await readFile(new URL('../src/data/partner-registry.js', import.meta.url))), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
  assert.doesNotMatch(css, /\.activity-center-v3__index-drawer > summary > b/);
});
}
