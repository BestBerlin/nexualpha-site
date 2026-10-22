import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../cost-summary-fix/baseline/v3-layout-stability.before-cost-b.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { restoreRegistrationSummary: restoreRegistrationSummary } = await import("./fixtures/r286-registration-summary-inverse.mjs");
const { restoreEvidenceJs: restoreEvidenceJs, restoreEvidenceCss: restoreEvidenceCss } = await import("./fixtures/r286-profile-evidence-summary-inverse.mjs");




const css = restoreRegistrationSummary(await readFile(new URL('../src/styles/v3-layout-stability.css', import.meta.url), 'utf8'));
const before = await readFile(new URL('../../cost-summary-fix/baseline/v3-layout-stability.before-cost-b.css', import.meta.url), 'utf8');
const hash = v => createHash('sha256').update(v).digest('hex');
const baselineSha = 'a48a92654b1ff4302596c873229a0a335b64bf4bd1d682534bddcf1f3ed89e99';
const hunk = '  .v3-profile-cost-conditions > summary > b { grid-column: 2; grid-row: 1; }\n';
function stripApprovedFourSummaryHunks(source) {
  let restored = source;
  const selectors = ['.home-research-drawer', '.home-analyzer-drawer', '.v3-profile-evidence-drawer', '.v3-compare-research-paths'];
  for (const selector of selectors) {
    const hunk = `  ${selector} > summary > b { grid-column: 2; grid-row: 1; }\n`;
    assert.equal(restored.split(hunk).length, 2, 'one exact separately approved summary hunk');
    restored = restored.replace(hunk, '');
  }
  return restored;
}

function inverse(source) {
  assert.equal(source.split(hunk).length, 2, 'exact cost-only rule once');
  const restored = stripApprovedFourSummaryHunks(source).replace(hunk, '');
  assert.equal(hash(restored), baselineSha);
  return restored;
}
test('cost plus gets explicit first-row second-column placement only in existing 780px mobile block', () => {
  const start = css.indexOf('@media (max-width: 780px) {\n  .home-section-nav');
  const end = css.indexOf('\n}\n', start);
  assert.ok(start > -1 && end > start);
  assert.equal(css.slice(start, end).split(hunk).length, 2);
  assert.ok(css.slice(start, end).includes('.v3-profile-cost-conditions > summary span,\n  .v3-profile-evidence-drawer > summary span { grid-column: 1 / -1; }'));
});
test('whole source inverse restores frozen backup and rejects other edits', () => {
  assert.equal(hash(before), baselineSha);
  assert.equal(inverse(css), before);
  assert.throws(() => inverse(css + '\n/* foreign rule */\n'));
  assert.throws(() => inverse(css.replace('> summary > b { grid-column: 2; grid-row: 1;', '> summary > b { grid-column: 1; grid-row: 3;')));
});
test('registry and cost JSX direct order remain intact', async () => {
  assert.equal(hash(await readFile(new URL('../src/data/partner-registry.js', import.meta.url))), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
  const jsx = restoreEvidenceJs(await readFile(new URL('../src/components/v3/V3Pages.jsx', import.meta.url), 'utf8'));
  const cost = jsx.slice(jsx.indexOf('<details className="v3-profile-cost-conditions">'));
  assert.match(cost, /^<details className="v3-profile-cost-conditions">\s*<summary>\s*<strong>[\s\S]*?<\/strong>\s*<span>[\s\S]*?<\/span>\s*<b aria-hidden="true">＋<\/b>\s*<\/summary>/);
});
}
