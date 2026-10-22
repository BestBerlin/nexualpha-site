import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../WIZARD-COLOR-BASELINE.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const current = readFileSync(new URL('../src/components/v3/trader-wizard.css', import.meta.url), 'utf8');
const original = readFileSync(new URL('../../WIZARD-COLOR-BASELINE.css', import.meta.url), 'utf8');
const baselineSha = '25052625a57fadf79c29488d2b4032e36f365e67800034b6a623c26b1f201db7';
const owned = ['.wizard-step__d', '.wizard-result__category'];
function rule(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const found = [...source.matchAll(new RegExp(escaped + '\\s*\\{([^}]+)\\}', 'g'))];
  assert.equal(found.length, 1, selector + ' must be uniquely owned');
  return found[0][1];
}
function luminance(hex) {
  const cs = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return cs[0] * .2126 + cs[1] * .7152 + cs[2] * .0722;
}
test('only the two approved wizard colors differ from the literal baseline', () => {
  assert.equal(createHash('sha256').update(original).digest('hex'), baselineSha);
  let inverse = current;
  for (const selector of owned) {
    const oldRule = rule(original, selector);
    const newRule = rule(current, selector);
    assert.match(oldRule, /color: #64748b;/);
    assert.match(newRule, /color: #94a3b8;/);
    assert.equal(newRule.replace('color: #94a3b8;', 'color: #64748b;'), oldRule);
    inverse = inverse.replace(newRule, oldRule);
  }
  assert.equal(inverse, original, 'every other CSS byte must remain unchanged');
});
test('the approved existing description color exceeds small text contrast on modal and result card', () => {
  const fg = luminance('#94a3b8');
  const ratio = (fg + .05) / (luminance('#0d1017') + .05);
  assert.ok(ratio > 7, String(ratio));
  const blended = [13,16,23].map(v => Math.round(255 * .03 + v * .97));
  const bg = '#' + blended.map(v => v.toString(16).padStart(2,'0')).join('');
  assert.ok((fg + .05) / (luminance(bg) + .05) >= 4.5);
  for (const selector of owned) assert.match(rule(current, selector), /color: #94a3b8;/);
});
}
