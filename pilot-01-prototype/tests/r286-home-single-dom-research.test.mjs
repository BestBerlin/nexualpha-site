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
const { restoreHiddenResearchFocus: restoreHiddenResearchFocus } = await import("./fixtures/r286-home-research-inverse.mjs");
const root = new URL('../', import.meta.url);
const report = new URL('../../home-single-dom-refinement/', import.meta.url);
const hash = v => createHash('sha256').update(v).digest('hex');
const raw = await readFile(new URL('literal-changes.json', report), 'utf8');
assert.equal(hash(raw), 'cfe7193454560407bae85c0e3d4be2d43bfbe9e2de37e95f679c12d5411ee410');
const spec = JSON.parse(raw);
const jsx = await readFile(new URL('src/components/v3/LeanHero.jsx', root), 'utf8');
const css = await readFile(new URL('src/components/v3/growth-conversion.css', root), 'utf8');
function restoreJsx(source) {
  let result = restoreHiddenResearchFocus(source);
  for (const [old, next] of [...spec.jsxChanges].reverse()) {
    assert.equal(result.split(next).length, 2, 'exact unique JSX change');
    result = result.replace(next, old);
  }
  assert.equal(hash(result), spec.jsxSHA);
  return result;
}
function restoreCss(source) {
  assert.equal(source.split(spec.cssAppend).length, 2);
  let result = source.replace(spec.cssAppend, '');
  for (const [old, next] of [...spec.cssChanges].reverse()) result = result.split(next).join(old);
  assert.equal(hash(result), spec.cssSHA);
  return result;
}
test('single existing research follows toggle and registration without duplicated actions or text', async () => {
  const toggle = jsx.indexOf('<button type="button" className="lean-hero__secondary-toggle"');
  const research = jsx.indexOf('id="lean-hero-research"');
  const support = jsx.indexOf('id="lean-hero-support"');
  assert.ok(jsx.indexOf('<HomeDecisionPanel locale={locale} ui={ui} />') < toggle);
  assert.ok(toggle < research && research < support);
  for (const token of ['{ui.subtitle}', '{ui.wizardBtn}', '{ui.explore}', '{ui.compare}', 'id="lean-hero-research"', 'id="lean-hero-support"']) assert.equal(jsx.split(token).length, 2, token);
  assert.ok(jsx.includes('aria-expanded={secondaryOpen} aria-controls="lean-hero-support" onClick={() => setSecondaryOpen(open => !open)}'));
  assert.equal(restoreJsx(jsx), await readFile(new URL('LeanHero.before.jsx', report), 'utf8'));
  assert.throws(() => restoreJsx(jsx.replace('{ui.subtitle}', '{ui.badge}')));
  assert.throws(() => restoreJsx(jsx + '\n/* rogue */\n'));
});
test('only >=1280 research preview; support and mobile closed remain hidden with min44 toggle', async () => {
  assert.ok(css.endsWith(spec.cssAppend));
  assert.match(spec.cssAppend, /@media \(min-width: 1280px\) \{\n  \.lean-hero__secondary\[data-open="false"\] > \.lean-hero__research \{ display: flex; \}/);
  assert.ok(!spec.cssAppend.includes('order:'));
  assert.match(css, /\.lean-hero__secondary > \.lean-hero__secondary-toggle \{[\s\S]*?min-height: 44px;/);
  assert.equal(restoreCss(css), await readFile(new URL('growth.before.css', report), 'utf8'));
  assert.throws(() => restoreCss(css.replace('data-open="false"] > .lean-hero__support { display: none;', 'data-open="false"] > .lean-hero__support { display: flex;')));
  assert.throws(() => restoreCss(css + '\n/* rogue */\n'));
});
test('partner registry remains immutable', async () => {
  assert.equal(hash(await readFile(new URL('src/data/partner-registry.js', root))), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
}
