import { restoreRegistrationSummary } from './fixtures/r286-registration-summary-inverse.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';

const cssPath = new URL('../src/styles/v3-layout-stability.css', import.meta.url);
const cssBeforePath = new URL('../baseline/v3-layout-stability.before-home-section-nav.css', import.meta.url);
const appPath = new URL('../src/App.jsx', import.meta.url);
const registryPath = new URL('../src/data/partner-registry.js', import.meta.url);

const css = restoreRegistrationSummary(readFileSync(cssPath, 'utf8'));
const beforeCss = readFileSync(cssBeforePath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const registry = readFileSync(registryPath, 'utf8');

const expectedRegistrySha = '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a';
const sha256 = (text) => createHash('sha256').update(text).digest('hex');

const beforeMobileBlock = `@media (max-width: 480px) {\n  .home-section-nav { gap: 8px; }\n  .home-section-nav a { white-space: normal; max-width: 28vw; overflow-wrap: anywhere; line-height: 1.15; text-align: center; }\n}\n`;

const afterMobileBlock = `@media (max-width: 480px) {\n  .home-section-nav {\n    display: grid;\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n    align-items: stretch;\n    gap: 8px;\n  }\n\n  .home-section-nav a {\n    display: flex;\n    align-items: center;\n    justify-content: flex-start;\n    min-height: 44px;\n    max-width: none;\n    padding: 0.45rem 0.55rem;\n    white-space: normal;\n    overflow-wrap: break-word;\n    word-break: normal;\n    line-height: 1.25;\n    text-align: start;\n  }\n}\n`;

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

test('home section nav keeps original route order and registry untouched', () => {
  const navMatch = app.match(/<nav className="home-section-nav v2-shell"[\s\S]*?<\/nav>/);
  assert.ok(navMatch, 'HomeSectionNav nav markup must exist');
  const hrefs = [...navMatch[0].matchAll(/<a href="([^"]+)">/g)].map((match) => match[1]);
  assert.deepEqual(hrefs, ['#compare', '#bleed-analyzer', '#exchanges', '#research-tools']);
  assert.equal(sha256(registry), expectedRegistrySha);
});

test('mobile home section nav uses two rows of 44px natural-wrap links', () => {
  assert.ok(css.includes(afterMobileBlock), 'expected exact mobile HomeSectionNav replacement block');
  assert.ok(css.includes('.home-section-nav a { color: var(--ink); font-size: 12px; text-decoration: none; white-space: nowrap; }'), 'desktop link contract remains in place');
  assert.ok(css.includes('@media (max-width: 780px)'), 'tablet/mobile shared media block remains in file');
  assert.equal((css.match(/overflow-wrap: anywhere/g) || []).filter(Boolean).length, (beforeCss.match(/overflow-wrap: anywhere/g) || []).length - 1, 'only the HomeSectionNav anywhere wrap should be removed');
});

test('home section nav change is exactly reversible to the backed-up R286 baseline', () => {
  assert.ok(beforeCss.includes(beforeMobileBlock), 'backup must contain the old compact mobile block');
  assert.ok(css.includes(afterMobileBlock), 'current CSS must contain the new compact mobile block');
  const approvedCostHunk = '  .v3-profile-cost-conditions > summary > b { grid-column: 2; grid-row: 1; }\n';
  assert.equal(css.split(approvedCostHunk).length, 2, 'exact separately authorized cost placement hunk must occur once');
  const costReverted = stripApprovedFourSummaryHunks(css).replace(approvedCostHunk, '');
  const reverted = costReverted.replace(afterMobileBlock, beforeMobileBlock);
  assert.equal(sha256(reverted), sha256(beforeCss), 'only the authorized HomeSectionNav mobile block changed since backup');
});
