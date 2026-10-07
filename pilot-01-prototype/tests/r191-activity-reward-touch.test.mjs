import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';

const root = fileURLToPath(new URL('..', import.meta.url));
const baseline = path.resolve(root, '../../r188-editorial-reader-integration/candidate');
const cssPath = 'src/components/v3/activity/ActivityCenterV3.css';
const componentPath = 'src/components/v3/activity/ActivityCenterV3.jsx';
const protectedFiles = [
  componentPath,
  'src/components/v3/activity/activity-copy.js',
  'src/components/v3/activity/activity-eligibility.js',
  'src/components/v3/activity/research-fields-copy.js',
  'src/components/official-updates/official-updates-model.js',
  'src/data/partner-registry.js',
];

const css = await readFile(path.join(root, cssPath), 'utf8');
const baselineCss = await readFile(path.join(baseline, cssPath), 'utf8');
const ast = postcss.parse(css);

function declarations(rule) {
  return Object.fromEntries(rule.nodes.filter((node) => node.type === 'decl').map((node) => [node.prop, node.value]));
}

function topLevelRule(selector) {
  const rules = ast.nodes.filter((node) => node.type === 'rule' && node.selector === selector);
  assert.equal(rules.length, 1, `${selector} exists once at top level`);
  return rules[0];
}

function mobileRule(selector) {
  const media = ast.nodes.filter((node) => node.type === 'atrule' && node.name === 'media' && node.params === '(max-width: 640px)');
  assert.ok(media.length >= 1, 'mobile media query exists');
  const rules = media.flatMap((node) => node.nodes || []).filter((node) => node.type === 'rule' && node.selector === selector);
  assert.equal(rules.length, 1, `${selector} exists once in max-width:640px media`);
  return rules[0];
}

function replaceRuleHeight(source, selector, fromHeight, toHeight, { inMobile = false } = {}) {
  const signature = inMobile ? '@media (max-width: 640px)' : selector;
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `${signature} found`);
  const ruleStart = inMobile ? source.indexOf(selector, start) : start;
  assert.ok(ruleStart >= start, `${selector} found`);
  const ruleEnd = source.indexOf('\n}', source.indexOf('{', ruleStart));
  assert.ok(ruleEnd > ruleStart, `${selector} rule closes`);
  const before = source.slice(ruleStart, ruleEnd);
  const after = before.replace(`min-height: ${fromHeight};`, `min-height: ${toHeight};`);
  assert.notEqual(after, before, `${selector} ${fromHeight} declaration exists`);
  return source.slice(0, ruleStart) + after + source.slice(ruleEnd);
}

const rewardActionSelector = '.activity-center-v3__reward-grid .activity-center-v3__source-actions a';

test('R191 reward research/source action links are 44px in desktop and mobile scopes', async () => {
  await postcss().process(css, { from: cssPath });
  const desktop = declarations(topLevelRule(rewardActionSelector));
  const mobile = declarations(mobileRule(rewardActionSelector));
  assert.equal(desktop['min-height'], '44px');
  assert.equal(mobile['min-height'], '44px');
  assert.equal(desktop.display, 'flex');
  assert.equal(desktop['align-items'], 'center');
  assert.equal(mobile['justify-content'], 'center');
  assert.equal(mobile['text-align'], 'center');
});

test('R191 CSS inverse is exactly R188 except the two scoped 40px to 44px touch-target changes', () => {
  let normalized = replaceRuleHeight(css, rewardActionSelector, '44px', '40px');
  normalized = replaceRuleHeight(normalized, rewardActionSelector, '44px', '40px', { inMobile: true });
  assert.equal(normalized, baselineCss);
});

test('R191 source component, eligibility/copy/source data and registry remain byte-identical to R188', async () => {
  for (const rel of protectedFiles) {
    assert.deepEqual(await readFile(path.join(root, rel)), await readFile(path.join(baseline, rel)), rel);
  }
  const registry = await readFile(path.join(root, 'src/data/partner-registry.js'));
  assert.equal(createHash('sha256').update(registry).digest('hex'), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});

test('R191 rendered activity hrefs, source labels and eligibility text stay identical to R188', async () => {
  const tmp = await mkdtemp(path.join(root, 'tests/.tmp-r191-'));
  try {
    const entry = path.join(tmp, 'entry.jsx');
    const bundle = path.join(tmp, 'bundle.cjs');
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { ActivityCenterV3 as After } from '../../src/components/v3/activity/ActivityCenterV3.jsx';
      import { ActivityCenterV3 as Before } from ${JSON.stringify(path.join(baseline, componentPath))};
      import { venueDatabase } from '../../src/data/venue-database.js';
      Date.now = () => 1791190800000;
      const rows = [];
      for (const locale of ['en', 'ru', 'ar', 'pt-BR']) {
        const props = { locale, market: 'BR', product: 'spot', venues: Object.values(venueDatabase), publicUpdates: [] };
        rows.push({ locale, before: renderToStaticMarkup(React.createElement(Before, props)), after: renderToStaticMarkup(React.createElement(After, props)) });
      }
      console.log(JSON.stringify(rows));
    `);
    await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, loader: { '.css': 'empty' }, logLevel: 'silent' });
    const rows = JSON.parse(execFileSync(process.execPath, [bundle], { encoding: 'utf8', maxBuffer: 60 * 1024 * 1024 }));
    for (const row of rows) assert.equal(row.after, row.before, row.locale);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
