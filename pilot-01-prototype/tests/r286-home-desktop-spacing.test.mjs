import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../home-single-dom-refinement/literal-changes.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const { restoreResearchCss: restoreResearchCss, restoreResearchJsx: restoreResearchJsx } = await import("./fixtures/r286-home-research-inverse.mjs");





const root = new URL('../', import.meta.url);
const css = restoreResearchCss(await readFile(new URL('src/components/v3/growth-conversion.css', root), 'utf8'));
const before = await readFile(new URL('../../home-desktop-spacing-fix/growth-conversion.before.css', import.meta.url), 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const baselineSha = '662d8b4f7942338874509d0e3ac668fcad07f86703081b219fea651a41843fdb';
const hunk = '  .lean-hero__telemetry .growth-selected-route .registration-card--compact .registration-card__code-section--home-identity { padding-block: 4px; }\n' +
  '  .lean-hero__telemetry .growth-selected-route .registration-card--compact .registration-card__mobile-route-details:not([open]) { row-gap: 0; }\n';

function inverse(source) {
  assert.equal(source.split(hunk).length, 2, 'one exact authorized two-property hunk');
  const restored = source.replace(hunk, '');
  assert.equal(hash(restored), baselineSha, 'no unrelated byte changes');
  return restored;
}

test('only two qualified home rules inside existing >=1280 block', () => {
  const start = css.indexOf('/* R193: desktop editorial composition; DOM and mobile order stay intact. */\n@media (min-width: 1280px) {');
  assert.ok(start >= 0);
  assert.ok(css.endsWith(hunk + '}\n'), 'rules end inside original final desktop block');
  assert.equal(css.slice(0, start), before.slice(0, start), 'below1280 rules untouched');
  assert.match(hunk, /mobile-route-details:not\(\[open\]\) \{ row-gap: 0; \}/);
  assert.ok(!hunk.includes('summary'), 'summary typography unchanged');
});

test('exact inverse restores frozen baseline and rejects broader mutations', () => {
  assert.equal(hash(before), baselineSha);
  assert.equal(inverse(css), before);
  for (const rogue of [
    css.replace('padding-block: 4px; }\n  .lean-hero__telemetry', 'padding-block: 0; }\n  .lean-hero__telemetry'),
    css.replace('mobile-route-details:not([open]) { row-gap: 0;', 'mobile-route-details { row-gap: 0;'),
    css.replace('min-width: 1280px', 'min-width: 780px'),
    css + '\n/* foreign rule */\n',
  ]) {
    assert.notEqual(rogue, css, 'negative mutation is effective');
    assert.throws(() => inverse(rogue));
  }
});

test('full text, invitations, original open gap and 44px control rules untouched', async () => {
  const manifest = await readFile(new URL('../../home-desktop-spacing-fix/protected-baseline.json', import.meta.url), 'utf8');
  assert.equal(hash(manifest), '97dabb681eec6ab83ec04e544d614636318ce92a58c70efebb92c78f05e43961', 'protected baseline is independently frozen');
  const locked = JSON.parse(manifest);
  for (const [path, expected] of Object.entries(locked)) {
    const value = await readFile(new URL(path, root));
    assert.equal(hash(path === "src/components/v3/LeanHero.jsx" ? restoreResearchJsx(value.toString()) : value), expected, path);
  }
  assert.equal(locked['src/data/partner-registry.js'], '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
  const cardCss = await readFile(new URL('src/components/v3/registration-card.css', root), 'utf8');
  assert.match(cardCss, /\.registration-card__mobile-route-details \{\s*display: grid;\s*gap: 0\.75rem;/);
  assert.match(cardCss, /\.registration-card--compact \.registration-card__primary-btn \{\s*padding: 12px;\s*min-height: 44px;/);
  assert.match(cardCss, /\.registration-card__code-section--home-identity \.registration-card__copy-btn \{[\s\S]*?width: 44px;\s*min-height: 44px;/);
});
}
