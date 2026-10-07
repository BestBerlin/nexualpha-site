import { restoreEvidenceJs, restoreEvidenceCss } from './fixtures/r286-profile-evidence-summary-inverse.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const reportRoot = path.resolve(root, '..');
const componentPath = 'src/components/v3/V3Pages.jsx';
const cssPath = 'src/components/v3/v3.css';
const componentBackup = path.join(reportRoot, 'baseline/V3Pages.before-profile-registration-review-link.jsx');
const cssBackup = path.join(reportRoot, 'baseline/v3.before-profile-registration-review-link.css');
const registryPath = 'src/data/partner-registry.js';
const registrySha = '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a';

const read = async (file) => {
  const source = await readFile(path.join(root, file), 'utf8');
  return file === componentPath ? restoreEvidenceJs(source) : file === cssPath ? restoreEvidenceCss(source) : source;
};
const sha = (value) => createHash('sha256').update(value).digest('hex');
const authorizedLink = '<LocalLink locale={locale} href={`/exchanges/${profile.slug}?${contextSearch}#registration-path`} className="button-quiet v3-profile-registration-review-link">{text.registrationPrepCta}</LocalLink>';
const originalLink = '<LocalLink locale={locale} href={`/exchanges/${profile.slug}?${contextSearch}#registration-path`} className="button-primary">{text.registrationPrepCta}</LocalLink>';
const authorizedCssRule = '  .v3-profile-page .v3-hero-actions .v3-profile-registration-review-link {\n    grid-column: 1 / -1;\n    min-height: 44px;\n  }\n';

function restoreComponent(source) {
  assert.equal(source.split(authorizedLink).length, 2, 'authorized profile link class change must occur once');
  return source.replace(authorizedLink, originalLink);
}

function restoreCss(source) {
  assert.equal(source.split(authorizedCssRule).length, 2, 'authorized profile CSS hunk must occur once');
  return source.replace(authorizedCssRule, '');
}

function attr(attrs, name) {
  const match = attrs.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1].replace(/&amp;/g, '&') : '';
}

test('profile registration review CTA is visually secondary while href and label expression remain unchanged', async () => {
  const source = await read(componentPath);
  assert.equal(source.split(authorizedLink).length, 2);
  assert.equal(source.includes(originalLink), false);
  assert.match(source, /href=\{`\/exchanges\/\$\{profile\.slug\}\?\$\{contextSearch\}#registration-path`\}/);
  assert.match(source, />\{text\.registrationPrepCta\}<\/LocalLink>/);
});

test('only the authorized V3Pages profile CTA class hunk changed', async () => {
  const source = await read(componentPath);
  const backup = await readFile(componentBackup, 'utf8');
  assert.equal(restoreComponent(source), backup);
});

test('mobile profile review link spans the action grid and keeps a 44px target', async () => {
  const css = await read(cssPath);
  assert.match(css, /\.v3-profile-page \.v3-hero-actions \{\n    display: grid;\n    grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);\n  \}/);
  assert.ok(css.includes(authorizedCssRule));
});

test('only the authorized v3.css profile CTA rule changed', async () => {
  const css = await read(cssPath);
  const backup = await readFile(cssBackup, 'utf8');
  assert.equal(restoreCss(stripApprovedOpenSnapshot(css)), backup);
  assert.throws(() => stripApprovedOpenSnapshot(css + "\n/* rogue */\n"));
  assert.throws(() => stripApprovedOpenSnapshot(css.replace("overflow: visible;\n  -webkit-line-clamp: unset;", "overflow: hidden;\n  -webkit-line-clamp: 2;")));
});

test('SSR profile page keeps the same registration-path href and label with quiet class', async () => {
  const tmp = await mkdtemp(path.join(root, 'tests/.tmp-r286-profile-cta-'));
  try {
    const entry = path.join(tmp, 'entry.jsx');
    const bundle = path.join(tmp, 'bundle.cjs');
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { VenueDetailPage } from '../../src/components/v3/V3Pages.jsx';
      import { venueDatabase } from '../../src/data/venue-database.js';
      Date.now = () => 1791190800000;
      const copy = { common: { dimension: 'Dimension' }, assetCapabilities: { none: 'Pending source review' } };
      const venues = Object.values(venueDatabase);
      const html = renderToStaticMarkup(React.createElement(VenueDetailPage, {
        venue: venueDatabase.bitget, venues, updates: [], copy, locale: 'zh-Hans', market: 'BR', product: 'spot'
      }));
      console.log(JSON.stringify({ html }));
    `);
    await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, loader: { '.css': 'empty' }, logLevel: 'silent' });
    const { html } = JSON.parse(execFileSync(process.execPath, [bundle], { encoding: 'utf8', maxBuffer: 60 * 1024 * 1024 }));
    const matches = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((match) => ({ attrs: match[1], text: match[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() }));
    const link = matches.find((item) => attr(item.attrs, 'class').includes('v3-profile-registration-review-link'));
    assert.ok(link, 'profile registration review link renders');
    assert.equal(attr(link.attrs, 'class'), 'button-quiet v3-profile-registration-review-link');
    assert.match(attr(link.attrs, 'href'), /\/zh-hans\/exchanges\/bitget\?/);
    assert.match(attr(link.attrs, 'href'), /#registration-path$/);
    assert.match(attr(link.attrs, 'href'), /market=BR/);
    assert.match(attr(link.attrs, 'href'), /product=spot/);
    assert.ok(link.text.length > 0, 'localized label remains rendered');
    assert.ok(!attr(link.attrs, 'class').includes('button-primary'));
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('partner registry remains byte-stable and exact SHA-protected', async () => {
  const bytes = await readFile(path.join(root, registryPath));
  assert.equal(sha(bytes), registrySha);
});

const approvedOpenSnapshotHunk = "\n.v3-compare-snapshot-disclosure[open] .v3-snapshot-strip b,\n.v3-compare-snapshot-disclosure[open] .v3-snapshot-strip p {\n  display: block;\n  max-height: none;\n  overflow: visible;\n  -webkit-line-clamp: unset;\n  -webkit-box-orient: initial;\n  white-space: normal;\n  overflow-wrap: anywhere;\n}\n";
function stripApprovedOpenSnapshot(source) {
  assert.equal(source.split(approvedOpenSnapshotHunk).length, 2, "exact separately authorized open snapshot rule once");
  const restored = source.replace(approvedOpenSnapshotHunk, "");
  assert.equal(sha(restored), "9aee0ffeb8a33d4a94770c063d71a27162b8485ff4f92dc92004488715acd5a6", "all other CSS bytes remain frozen");
  return restored;
}
