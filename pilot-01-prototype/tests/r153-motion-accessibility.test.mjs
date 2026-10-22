import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../../r151-reader-integration/candidate/src/styles/fintech-premium.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const postcss = createRequire(import.meta.url)('postcss');
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const before = p => readFileSync(new URL('../../../r151-reader-integration/candidate/' + p, import.meta.url), 'utf8');
const cssPath = 'src/styles/fintech-premium.css';
const ast = postcss.parse(read(cssPath));
// Bounded actual-rule policy evaluation, not a browser style engine.
function matches(query, state) {
  return query.split(',').some(part => [...part.matchAll(/\(([^:()]+):\s*([^()]+)\)/g)].every(([, f, v]) => {
    f = f.trim(); v = v.trim();
    if (f === 'max-width') return state.width <= parseInt(v);
    if (f === 'prefers-reduced-motion') return state.motion === v;
    if (f === 'hover') return state.hover === v;
    if (f === 'pointer') return state.pointer === v;
    throw new Error('unsupported media ' + f);
  }));
}
function policy(selector, state, tree = ast) {
  const out = {};
  tree.walkRules(rule => {
    if (!rule.selector.split(',').map(s => s.trim()).includes(selector)) return;
    for (let n = rule.parent; n; n = n.parent) if (n.type === 'atrule' && n.name === 'media' && !matches(n.params, state)) return;
    rule.nodes.filter(n => n.type === 'decl').forEach(d => {
      if (!out[d.prop]?.important || d.important) out[d.prop] = { value: d.value, important: !!d.important };
    });
  });
  return out;
}
const states = [640, 780, 781, 1440].flatMap(width => ['reduce', 'no-preference'].flatMap(motion => [
  { width, motion, hover: 'none', pointer: 'coarse' },
  { width, motion, hover: 'hover', pointer: 'fine' },
]));
for (const state of states) test(`R153 media policy ${JSON.stringify(state)}`, () => {
  for (const selector of ['.frc-modal-overlay', '.frc-receipt-sheet']) {
    const d = policy(selector, state), old = policy(selector, state, postcss.parse(before(cssPath)));
    assert.equal(d.animation.value, state.motion === 'reduce' ? 'none' : old.animation.value, selector);
  }
  for (const selector of ['.button-primary:hover', '.lean-hero__btn-primary:hover', '.lean-hero__btn-secondary:hover']) {
    const d = policy(selector, state), allowed = state.motion === 'no-preference' && state.hover === 'hover' && state.pointer === 'fine';
    assert.equal(d.transform?.value, allowed ? 'translateY(-1px)' : 'none', selector);
    assert.equal(d.transform?.important, true, 'override route-lazy Hero transform');
  }
  const active = policy('button:active', state), tactile = state.motion === 'no-preference' && (state.width <= 780 || state.hover === 'none');
  assert.equal(active.transform?.value, tactile ? 'scale(0.96)' : undefined);
  assert.equal(active.transition?.value, tactile ? 'transform 0.08s ease' : undefined);
  if (state.motion === 'reduce') for (const selector of ['.button-primary', '.lean-hero__btn-primary', '.lean-hero__btn-secondary']) {
    assert.equal(policy(selector, state).transition.value, 'none');
    assert.equal(policy(selector, state).transition.important, true);
  }
});
test('R153 preserves every non-motion declaration including color, focus and hit areas', () => {
  function signature(s) {
    const out = [];
    postcss.parse(s).walkRules(rule => {
      const ds = rule.nodes.filter(n => n.type === 'decl' && !['transform', 'transition', 'animation'].includes(n.prop));
      if (ds.length) out.push([rule.selector, ds.map(d => [d.prop, d.value, !!d.important])]);
    });
    return out;
  }
  assert.deepEqual(signature(read(cssPath)), signature(before(cssPath)));
});
test('R153 reverse approved hunks restores exact original CSS; no universal resets/hiding', () => {
  const s = read(cssPath), at = s.indexOf('\n/* R153: scoped motion/input boundaries; preserve static presentation. */');
  assert.ok(at > 0);
  const end = s.indexOf('\n/* R153 hover boundary end. */', at);
  const tail = s.indexOf('\n/* R153 receipt/reduced transitions. */');
  assert.ok(end > at && tail > end);
  let restored = (s.slice(0, at) + s.slice(end + '\n/* R153 hover boundary end. */'.length + 1, tail)).replace('@media (max-width: 780px) and (prefers-reduced-motion: no-preference), (hover: none) and (prefers-reduced-motion: no-preference)', '@media (max-width: 780px), (hover: none)');
  for (const start of ['.button-primary:hover, .lean-hero__btn-primary:hover {', '.lean-hero__btn-secondary:hover {']) {
    const begin = restored.indexOf(start), end = restored.indexOf('\n}', begin);
    assert.ok(begin >= 0 && end > begin);
    restored = restored.slice(0, end) + '\n  transform: translateY(-1px) !important;' + restored.slice(end);
  }
  assert.equal(restored, before(cssPath));
  const addition = s.slice(at, end) + s.slice(tail);
  assert.doesNotMatch(addition, /(?:^|[,\n])\s*\*(?:\s|[,\n:{])/);
  assert.doesNotMatch(addition, /display\s*:|visibility\s*:|opacity\s*:|height\s*:|padding\s*:/);
});
test('R153 entry CSS is reachable; component state/links/registry untouched', () => {
  assert.match(read('src/main.jsx'), /import "\.\/styles\/fintech-premium\.css";/);
  for (const p of ['src/main.jsx', 'src/components/v3/FeeRebateCalculator.jsx', 'src/components/v3/LeanHero.jsx', 'src/components/v3/lean-hero.css', 'src/data/partner-registry.js']) assert.equal(read(p), p === 'src/components/v3/LeanHero.jsx' ? readFileSync(new URL('../../../r158-home-hierarchy/candidate/' + p, import.meta.url), 'utf8') : before(p), p);
  assert.equal(createHash('sha256').update(read('src/data/partner-registry.js')).digest('hex'), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
test('R153 scoped important overrides route-lazy Hero transforms in either stylesheet order', () => {
  const hero = postcss.parse(read('src/components/v3/lean-hero.css'));
  for (const state of states.filter(s => s.motion === 'reduce' || s.hover === 'none')) {
    for (const selector of ['.lean-hero__btn-primary:hover', '.lean-hero__btn-secondary:hover']) {
      const shared = policy(selector, state), lazy = policy(selector, state, hero);
      assert.equal(shared.transform.value, 'none');
      assert.equal(shared.transform.important, true);
      assert.equal(lazy.transform.important, false);
      // Equal selectors: important shared transform wins before or after the lazy rule.
      for (const order of [[shared, lazy], [lazy, shared]]) {
        let winner;
        for (const declarations of order) {
          const next = declarations.transform;
          if (next && (!winner?.important || next.important)) winner = next;
        }
        assert.equal(winner.value, 'none');
      }
    }
  }
});

test('R153 preserves normal hover+active cascade order on narrow fine and coarse inputs', () => {
  for (const state of states.filter(s => s.motion === 'no-preference' && (s.width <= 780 || s.hover === 'none'))) {
    for (const cls of ['.button-primary', '.lean-hero__btn-primary', '.lean-hero__btn-secondary']) {
      let winner;
      ast.walkRules(rule => {
        if (!rule.selector.split(',').map(x => x.trim()).some(x => x === cls + ':hover' || x === cls + ':active')) return;
        for (let n = rule.parent; n; n = n.parent) if (n.type === 'atrule' && n.name === 'media' && !matches(n.params, state)) return;
        rule.nodes.filter(n => n.type === 'decl' && n.prop === 'transform').forEach(d => {
          if (!winner?.important || d.important) winner = { value: d.value, important: !!d.important };
        });
      });
      assert.equal(winner.value, 'scale(0.96)', cls);
    }
  }
});
}
