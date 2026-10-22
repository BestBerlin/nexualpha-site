import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../home-research-focus-fix/literal-changes.json", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const root = new URL('../', import.meta.url);
const hash = v => createHash('sha256').update(v).digest('hex');
const raw = await readFile(new URL('../../home-research-focus-fix/literal-changes.json', import.meta.url), 'utf8');
assert.equal(hash(raw), '29e76edefd3a02a81fe0890103c42fa2ae08439034d28408a84972c2ea961670');
const spec = JSON.parse(raw);
const source = await readFile(new URL('src/components/v3/LeanHero.jsx', root), 'utf8');
test('exact focus-only inverse leaves text, hrefs, state and timers untouched', async () => {
  let restored = source;
  for (const [old, next] of [...spec.changes].reverse()) {
    assert.equal(restored.split(next).length, 2);
    restored = restored.replace(next, old);
  }
  assert.equal(hash(restored), spec.beforeSHA);
  assert.equal(restored, await readFile(new URL('../../home-research-focus-fix/LeanHero.before.jsx', import.meta.url), 'utf8'));
  assert.equal(hash(await readFile(new URL('src/components/v3/growth-conversion.css', root))), '258db8305297a16a69c41173bb6e61800cd00ae9da4f0c134393025079d81682');
  assert.equal(hash(await readFile(new URL('src/data/partner-registry.js', root))), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
test('actual local handler recovers only hidden null-related blur to visible toggle', () => {
  const match = source.match(/id="lean-hero-research" onBlurCapture=\{(\(event\) => \{[\s\S]*?\n          \})\}/);
  assert.ok(match, 'actual handler exists');
  const calls = [];
  const ref = { current: { getClientRects: () => [{}], focus: opts => calls.push(opts) } };
  const handler = new Function('secondaryToggleRef', `return ${match[1]}`)(ref);
  const blur = (hidden, relatedTarget) => handler({ currentTarget: { getClientRects: () => hidden ? [] : [{}] }, relatedTarget });
  blur(false, null); // Visible group/window blur does not steal focus.
  blur(false, {}); // Ordinary Tab or modal focus is already valid.
  blur(true, {}); // User close via toggle or wizard transition already has a target.
  assert.equal(calls.length, 0);
  blur(true, null); // Resize hides an active research descendant.
  assert.deepEqual(calls, [{ preventScroll: true }]);
  ref.current = null;
  blur(true, null);
  ref.current = { getClientRects: () => [], focus: () => assert.fail('hidden toggle must not take focus') };
  blur(true, null);
  assert.equal(calls.length, 1);
});
}
