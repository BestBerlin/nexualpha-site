import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import postcss from 'postcss';
const read = (name) => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const css = read('src/styles/v3-layout-stability.css');
const app = read('src/App.jsx');
const rules = [];
postcss.parse(css).walkRules((rule) => rules.push(rule));

test('home section nav keeps its ordered research destinations and reviewed registry', () => {
  const nav = app.match(/<nav className="home-section-nav v2-shell"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav);
  assert.deepEqual([...nav.matchAll(/<a href="([^"]+)">/g)].map((match) => match[1]), ['#compare', '#bleed-analyzer', '#exchanges', '#research-tools']);
  assert.equal(createHash('sha256').update(read('src/data/partner-registry.js')).digest('hex'), '3a69b03020089ccb700370fcac011230635fe21d00a5cdae39d342284b78ef83');
});

test('mobile home section nav retains two columns with 44px naturally wrapping links', () => {
  const mobile = (selector) => rules.find((rule) => rule.selector === selector && rule.parent.params === '(max-width: 480px)');
  const properties = (rule) => Object.fromEntries(rule.nodes.filter((node) => node.type === 'decl').map((node) => [node.prop, node.value]));
  const nav = properties(mobile('.home-section-nav'));
  assert.equal(nav.display, 'grid');
  assert.equal(nav['grid-template-columns'], 'repeat(2, minmax(0, 1fr))');
  const link = properties(mobile('.home-section-nav a'));
  assert.equal(link['min-height'], '44px');
  assert.equal(link['white-space'], 'normal');
  assert.equal(link['overflow-wrap'], 'break-word');
  assert.equal(link['word-break'], 'normal');
  assert.equal(link['text-align'], 'start');
});

test('desktop section navigation remains sticky and horizontally scrollable', () => {
  const nav = rules.find((rule) => rule.selector === '.home-section-nav' && rule.parent.type === 'root');
  const declarations = Object.fromEntries(nav.nodes.filter((node) => node.type === 'decl').map((node) => [node.prop, node.value]));
  assert.equal(declarations.position, 'sticky');
  assert.equal(declarations['overflow-x'], 'auto');
  assert.equal(declarations.display, 'flex');
});
