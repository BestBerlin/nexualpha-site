import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../hero-action-material-fix/exact-patch.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const root = new URL('../', import.meta.url);
const report = new URL('../../hero-action-material-fix/', import.meta.url);
const hash = v => createHash('sha256').update(v).digest('hex');
const raw = await readFile(new URL('exact-patch.json', report), 'utf8');
assert.equal(hash(raw), 'c00089f1a84e473dfe059ceba89c6c7678d247b23efc5aef654d2499502b75e0');
const spec = JSON.parse(raw);
const css = await readFile(new URL('src/components/v3/lean-hero.css', root), 'utf8');
function inverse(source) {
  assert.equal(source.split(spec.append).length, 2);
  const partial = source.replace(spec.append, '');
  assert.equal(partial.split(spec.new).length, 2);
  const restored = partial.replace(spec.new, spec.old);
  assert.equal(hash(restored), '127154d3ddb5c19bd158b6ef836e8703eedae556c8d44c3a9252e54799f3b754');
  return restored;
}
test('exact scoped material patch leaves all palette, gradients, fonts and geometry bytes intact', async () => {
  assert.equal(inverse(css), await readFile(new URL('lean-hero.before.css', report), 'utf8'));
  const removeOnly = source => source.split('\n').filter(line => !(line.includes('box-shadow:') && !line.includes('none !important')) && !line.includes('transition: all ')).join('\n');
  assert.equal(removeOnly(spec.old), spec.new, 'only4 shadow and3 transition deletions');
  assert.throws(() => inverse(css.replace('min-height: 44px;', 'min-height: 32px;')));
  assert.throws(() => inverse(css + '\n/* rogue */\n'));
});
test('global important shadows/transitions are overridden only inside existing research actions', () => {
  assert.ok(css.endsWith(spec.append));
  assert.match(spec.append, /\.lean-hero__actions \.lean-hero__btn-primary:hover \{ box-shadow: none !important; \}/);
  assert.ok(!spec.append.includes('box-shadow: inset') && !spec.append.includes('transition: all'));
  assert.ok(!spec.append.includes('.button-primary'), 'no global primary changes');
  assert.match(spec.append, /@media \(hover: none\), \(pointer: coarse\)/);
  assert.match(spec.append, /\.lean-hero__actions \.lean-hero__btn-wizard:hover:not\(:active\) \{ transform: none !important; \}/);
  assert.match(spec.append, /\.lean-hero__btn-secondary:is\(:active, :not\(:active\)\) \{ transition: none !important; \}/);
  assert.ok(!spec.append.includes('.lean-hero__btn-secondary:hover { box-shadow'), 'secondary material stays original');
  assert.ok(spec.append.includes(':not(:active)'), 'existing active-only touch transition remains eligible');
  assert.throws(() => inverse(css.replace('.lean-hero__btn-wizard:hover:not(:active) { transform: none !important;', '.lean-hero__btn-wizard:hover { transform: none !important;')), 'coarse hover must not override active scale');
  const reduced = spec.append.slice(spec.append.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.ok(reduced.includes('.lean-hero__btn-wizard:hover { transform: none !important; }'), 'reduce hover remains neutral even when active');
  assert.throws(() => inverse(css.replace('@media (prefers-reduced-motion: reduce) {\n  .lean-hero__actions .lean-hero__btn-wizard:hover { transform: none !important; }', '@media (prefers-reduced-motion: reduce) {')), 'missing reduce active hover neutral rejected');
  for (const action of ['wizard', 'primary', 'secondary']) {
    assert.ok(reduced.includes(`.lean-hero__actions .lean-hero__btn-${action}:is(:active, :not(:active))`), 'same specificity and later source order overrides normal important transition');
  }
  assert.throws(() => inverse(css.replace('.lean-hero__btn-secondary:is(:active, :not(:active)) { transition: none !important;', '.lean-hero__btn-secondary { transition: none !important;')), 'reduce specificity regression rejected');
});
test('JSX text/actions/focus and immutable invitation registry remain fixed', async () => {
  assert.equal(hash(await readFile(new URL('src/components/v3/LeanHero.jsx', root))), 'db65ca647f44b5f7905847aa67034cb765064050b1c55344f54537cd0013f15f');
  assert.equal(hash(await readFile(new URL('src/data/partner-registry.js', root))), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
}
