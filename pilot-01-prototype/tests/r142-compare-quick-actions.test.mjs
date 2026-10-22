import { committedFileHash } from './r100-test-contracts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';


import { existsSync } from 'node:fs';

if (existsSync(new URL('../../../r139-reader-integration/candidate/src/components/v3/V3Pages.jsx', import.meta.url))) {
const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = path.resolve(root, '../../r139-reader-integration/candidate');
const source = readFileSync(path.join(root, 'src/components/v3/V3Pages.jsx'), 'utf8');
const registryHash = createHash('sha256').update(readFileSync(path.join(root, 'src/data/partner-registry.js'))).digest('hex');

function blocks(html, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...html.matchAll(new RegExp(`<[^>]+class="[^"]*${escaped}[^"]*"[\\s\\S]*?<\\/(?:nav|article|div|details)>`, 'g'))].map((match) => match[0]);
}

function hrefsForPlacement(html, placement) {
  return [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*data-cta-placement="([^"]*)"[^>]*>/g)]
    .filter(([, , p]) => p === placement)
    .map(([full, href]) => href)
    .sort();
}

async function renderFixture() {
  const dir = await mkdtemp(path.join(root, 'tests/.tmp-r142-compare-'));
  try {
    const entry = path.join(dir, 'entry.mjs');
    const out = path.join(dir, 'out.cjs');
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { CompareDeepPage } from '../../src/components/v3/V3Pages.jsx';
      import { CompareDeepPage as Before } from ${JSON.stringify(path.join(baseline, 'src/components/v3/V3Pages.jsx'))};
      import { venueDatabase } from '../../src/data/venue-database.js';
      const venues = Object.values(venueDatabase);
      const copy = { common: { dimension: 'Dimension' }, assetCapabilities: { none: 'Pending source review' } };
      const cases = {
        priority: { selected: ['binance', 'okx'], locale: 'en', market: 'unknown', product: 'unknown' },
        fallback: { selected: ['binance', 'okx', 'bybit'], locale: 'en', market: 'unknown', product: 'unknown' },
      };
      const render = (Cmp, props) => renderToStaticMarkup(React.createElement(Cmp, { copy, venues, updates: [], ...props }));
      console.log(JSON.stringify({
        priority: render(CompareDeepPage, cases.priority),
        priorityBefore: render(Before, cases.priority),
        fallback: render(CompareDeepPage, cases.fallback),
        fallbackBefore: render(Before, cases.fallback),
      }));
    `);
    await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, loader: { '.css': 'empty' }, logLevel: 'silent' });
    return JSON.parse(execFileSync(process.execPath, [out], { encoding: 'utf8', maxBuffer: 48 * 1024 * 1024 }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const rendered = await renderFixture();

test('priority two-venue direct-answer compare page omits redundant quick action cards before final choice', () => {
  assert.equal(blocks(rendered.priority, 'v3-compare-quick-actions').length, 0);
  assert.ok(rendered.priority.includes('id="compare-final-choice"'));
  assert.ok(rendered.priority.includes('class="v3-compare-final-choice-card"'));
  assert.ok(rendered.priority.includes('href="#hardcore-matrix"'));
});

test('three-venue fallback keeps quick actions and support card behavior', () => {
  assert.ok(blocks(rendered.fallback, 'v3-compare-quick-actions').length >= 1);
  assert.ok(rendered.fallback.includes('id="compare-versus-card"'));
  assert.ok(rendered.fallback.includes('v3-versus-card--supporting'));
});

test('final-choice registration hrefs remain unchanged from R139', () => {
  assert.deepEqual(hrefsForPlacement(rendered.priority, 'compare-final-choice-registration'), hrefsForPlacement(rendered.priorityBefore, 'compare-final-choice-registration'));
  assert.deepEqual(hrefsForPlacement(rendered.priority, 'compare-final-choice-matrix'), hrefsForPlacement(rendered.priorityBefore, 'compare-final-choice-matrix'));
  assert.ok(rendered.priority.includes('Code: <strong translate="no">11350287</strong>'));
});

test('render guard is scoped to existing priority direct-answer boolean', () => {
  assert.match(source, /\{!isPriorityTwoVenueDirectAnswer && <nav className="v3-compare-quick-actions"/);
  assert.doesNotMatch(source, /CompareFinalChoiceCard[\s\S]{0,200}&&\s*null/);
});

test('partner registry remains unchanged', () => {
  assert.equal(registryHash, committedFileHash('src/data/partner-registry.js'));
});

} else {
  test('historical regression requires original archived checkout', { skip: 'Original historical source snapshot is absent from a fresh checkout; current-source tests run separately.' }, () => {});
}
