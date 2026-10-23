import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import { buildSync } from 'esbuild';
import { bleedCopyFeedback } from '../src/data/trading-bleed-feedback.js';
import { ctaUiCopy } from '../src/data/cta-ui-copy.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const React = require('react');
const locales = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'tr', 'es', 'pt-BR', 'fr', 'de', 'ru', 'ar', 'id', 'vi', 'it', 'ur', 'uk'];
const bundles = new Map();
function walk(node, predicate, found = []) {
  if (Array.isArray(node)) for (const child of node) walk(child, predicate, found);
  else if (node && typeof node === 'object') {
    if (predicate(node)) found.push(node);
    walk(node.props?.children, predicate, found);
  }
  return found;
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('');
  if (node == null || typeof node === 'boolean') return '';
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
// Run actual clipboard handlers and state updates; child components remain React elements.
function harness(name, props, reject = false) {
  if (!bundles.has(name)) bundles.set(name, buildSync({
    entryPoints: [path.join(root, `src/components/v3/${name}.jsx`)], bundle: true, write: false,
    format: 'cjs', platform: 'node', external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty' },
  }).outputFiles[0].text);
  let cursor = 0;
  const slots = [], writes = [], timers = new Map();
  const fakeReact = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useMemo: (fn) => fn(), useCallback: (fn) => fn, useEffect() {},
  };
  const module = { exports: {} };
  vm.runInNewContext(bundles.get(name), {
    module, exports: module.exports, require: (id) => id === 'react' ? fakeReact : require(id),
    console, URL, URLSearchParams, Intl, Date,
    navigator: { clipboard: { async writeText(value) { writes.push(value); if (reject) throw new Error('denied'); } } },
    setTimeout(fn) { const id = timers.size + 1; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  return { writes, timers, render() { cursor = 0; return module.exports[name](props); } };
}
for (const locale of locales) {
  for (const [name, className, expected] of [
    ['RegistrationCard', 'registration-card__copy-btn', ctaUiCopy(locale).copied],
    ['TradingBleedAnalyzer', 'bleed-copy-code-btn font-mono', bleedCopyFeedback(locale).copied],
  ]) test(`${name} copy feedback respects ${locale} eligibility and localization`, async () => {
    const h = harness(name, { locale, venueSlug: 'okx', market: 'unknown', product: 'spot' });
    const findButton = () => walk(h.render(), (node) => node.type === 'button' && node.props.className === className)[0];
    const button = findButton();
    // Existing neutral-locale rules deliberately suppress referral codes.
    assert.ok(expected);
    if (locale !== 'en') assert.notEqual(expected, ctaUiCopy('en').copied);
    if (!button) {
      assert.equal(walk(h.render(), (node) => node.props?.className === 'registration-card__code-value' || node.props?.className === 'bleed-code-row').length, 0);
      return;
    }
    assert.equal(button.props['aria-live'], 'polite');
    const copying = button.props.onClick({ preventDefault() {} });
    assert.equal(findButton().props['data-copied'] === true, false, 'no optimistic success');
    await copying;
    const copied = findButton();
    assert.equal(copied.props['aria-live'], 'polite');
    assert.notEqual(text(copied), text(button));
    assert.ok(text(copied).includes(expected), `${locale}: ${text(copied)}`);
    assert.equal(h.writes.length, 1);
    for (const reset of h.timers.values()) reset();
    assert.equal(text(findButton()), text(button));
  });
}
test('clipboard rejection does not announce successful registration code copying', async () => {
  const h = harness('RegistrationCard', { locale: 'en', venueSlug: 'okx', market: 'unknown', product: 'spot' }, true);
  await walk(h.render(), (node) => node.props?.className === 'registration-card__copy-btn')[0].props.onClick();
  const tree = h.render();
  assert.equal(walk(tree, (node) => node.props?.['data-copied'] === true).length, 0);
  const status = walk(tree, (node) => node.props?.role === 'status' && node.props?.['aria-live'] === 'polite')[0];
  assert.ok(text(status).includes(bleedCopyFeedback('en').failed));
});
