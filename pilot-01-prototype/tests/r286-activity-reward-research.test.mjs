import { existsSync as historicalFixtureExists } from 'node:fs';
// Only historical comparisons need this external review snapshot. Local checks run.
const historicalFixture = new URL("../../baseline/ActivityCenterV3.before-reward-research-tasks.jsx", import.meta.url);
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const candidateRoot = path.resolve(root, '..');
const jsxPath = 'src/components/v3/activity/ActivityCenterV3.jsx';
const cssPath = 'src/components/v3/activity/ActivityCenterV3.css';
const jsxBackup = path.join(candidateRoot, 'baseline/ActivityCenterV3.before-reward-research-tasks.jsx');
const cssBackup = path.join(candidateRoot, 'baseline/ActivityCenterV3.before-reward-grid-mobile.css');
const cssDensityBackup = path.join(candidateRoot, 'baseline/ActivityCenterV3.before-reward-action-density.css');
const registryPath = 'src/data/partner-registry.js';
const expectedRegistrySha = '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a';

const read = (file) => readFile(path.join(root, file), 'utf8');
const sha = (value) => createHash('sha256').update(value).digest('hex');

function reverseJsxPatch(source) {
  let value = source;
  value = value.replace(
    'import { campaignCopy } from "./campaign-copy";\n',
    'import { campaignCopy } from "./campaign-copy";\nimport { detailHref } from "../matcher-model";\n',
  );
  value = value.replace(
    '          detailHref: `/activities/research/${encodeURIComponent(research.venueSlug)}`,\n',
    '          detailHref: contextualHref(detailHref(locale, research.venueSlug)),\n',
  );
  return value;
}

const phoneRewardGridBlock = `@media (max-width: 480px) {\n  .activity-center-v3__reward-grid {\n    grid-template-columns: minmax(0, 1fr);\n  }\n\n  .activity-center-v3__reward-grid .activity-center-v3__source-actions {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n\n  .activity-center-v3__reward-grid .activity-center-v3__source-actions a:nth-child(3) {\n    grid-column: 1 / -1;\n  }\n}\n\n`;

const phoneRewardActionsDensity = `\n\n  .activity-center-v3__reward-grid .activity-center-v3__source-actions {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n\n  .activity-center-v3__reward-grid .activity-center-v3__source-actions a:nth-child(3) {\n    grid-column: 1 / -1;\n  }`;

function reverseCssPatch(source) {
  return source.replace(phoneRewardGridBlock, '');
}

function reverseCssDensityPatch(source) {
  return source.replace(phoneRewardActionsDensity, '');
}

function attr(attrs, name) {
  const match = attrs.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1].replace(/&amp;/g, '&') : '';
}

function anchors(html) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((match) => ({
    attrs: match[1],
    href: attr(match[1], 'href'),
    placement: attr(match[1], 'data-cta-placement'),
    text: match[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
  }));
}

test('reward research cards use dedicated activity research routes while preserving the three task model', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, async () => {
  const source = await read(jsxPath);
  assert.doesNotMatch(source, /import \{ detailHref \} from "\.\.\/matcher-model";/, 'research cards must not reuse the generic exchange detail helper');
  assert.match(source, /detailHref: `\/activities\/research\/\$\{encodeURIComponent\(research\.venueSlug\)\}`,/);
  assert.match(source, /href=\{contextualHref\(`\/exchanges\/\$\{encodeURIComponent\(record\.platform\.slug\)\}`\)\}[^>]+data-cta-placement="activity-reward-venue-profile"/);
  assert.match(source, /href=\{contextualHref\(record\.detailHref\)\}[^>]+data-cta-placement="activity-reward-research"/);
  assert.match(source, /firstReadableSource\(record\) && <a href=\{firstReadableSource\(record\)\.url\} target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(source, /detailHref: contextualHref\(detailHref\(locale, research\.venueSlug\)\)/);
});

test('only the authorized ActivityCenterV3 JSX hunk changed', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, async () => {
  const source = await read(jsxPath);
  const backup = await readFile(jsxBackup, 'utf8');
  assert.equal(reverseJsxPatch(source), backup);
});

test('mobile reward research grid becomes one column only at phone width', async () => {
  const css = await read(cssPath);
  assert.match(css, /@media \(max-width: 980px\) \{[\s\S]*?\.activity-center-v3__reward-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}[\s\S]*?\}/);
  assert.match(css, /@media \(max-width: 640px\) \{[\s\S]*?\.activity-center-v3__reward-grid--collapsed > article:nth-child\(n \+ 4\) \{ display: none; \}/);
  assert.match(css, /@media \(max-width: 480px\) \{\n  \.activity-center-v3__reward-grid \{\n    grid-template-columns: minmax\(0, 1fr\);\n  \}\n\n  \.activity-center-v3__reward-grid \.activity-center-v3__source-actions \{\n    grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);\n  \}\n\n  \.activity-center-v3__reward-grid \.activity-center-v3__source-actions a:nth-child\(3\) \{\n    grid-column: 1 \/ -1;\n  \}\n\}/);
});



test('phone reward actions place the two site tasks on one row while preserving the source row', async () => {
  const css = await read(cssPath);
  assert.ok(css.includes(`@media (max-width: 480px) {\n  .activity-center-v3__reward-grid {\n    grid-template-columns: minmax(0, 1fr);\n  }\n\n  .activity-center-v3__reward-grid .activity-center-v3__source-actions {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n\n  .activity-center-v3__reward-grid .activity-center-v3__source-actions a:nth-child(3) {\n    grid-column: 1 / -1;\n  }\n}`));
  assert.match(css, /@media \(max-width: 640px\) \{[\s\S]*?\.activity-center-v3__reward-grid \.activity-center-v3__source-actions a \{[\s\S]*?min-height: 44px;/);
});

test('only the authorized phone reward action density CSS hunk changed after the single-column baseline', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, async () => {
  const css = await read(cssPath);
  const backup = await readFile(cssDensityBackup, 'utf8');
  assert.equal(reverseCssDensityPatch(css), backup);
});

test('only the authorized ActivityCenterV3 CSS hunk changed', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, async () => {
  const css = await read(cssPath);
  const backup = await readFile(cssBackup, 'utf8');
  assert.equal(reverseCssPatch(css), backup);
});

test('SSR reward actions keep platform profile, source, and contextual research route distinct', async () => {
  const tmp = await mkdtemp(path.join(root, 'tests/.tmp-r286-activity-'));
  try {
    const entry = path.join(tmp, 'entry.jsx');
    const bundle = path.join(tmp, 'bundle.cjs');
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { ActivityCenterV3 } from '../../src/components/v3/activity/ActivityCenterV3.jsx';
      import { venueDatabase } from '../../src/data/venue-database.js';
      Date.now = () => 1791190800000;
      const html = renderToStaticMarkup(React.createElement(ActivityCenterV3, {
        locale: 'zh-Hans', market: 'BR', product: 'spot', venues: Object.values(venueDatabase), publicUpdates: []
      }));
      console.log(JSON.stringify({ html }));
    `);
    await build({
      entryPoints: [entry],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: bundle,
      loader: { '.css': 'empty' },
      logLevel: 'silent',
    });
    const { html } = JSON.parse(execFileSync(process.execPath, [bundle], { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 }));
    const list = anchors(html);
    const profiles = list.filter((anchor) => anchor.placement === 'activity-reward-venue-profile');
    const research = list.filter((anchor) => anchor.placement === 'activity-reward-research');
    assert.ok(profiles.length >= 3, 'reward platform profile links render');
    assert.ok(research.length >= 3, 'reward research links render');
    for (const link of profiles.slice(0, 6)) {
      assert.match(link.href, /\/exchanges\//, link.href);
      assert.doesNotMatch(link.href, /\/activities\/research\//, link.href);
    }
    for (const link of research.slice(0, 6)) {
      assert.match(link.href, /\/activities\/research\//, link.href);
      assert.doesNotMatch(link.href, /\/exchanges\//, link.href);
      assert.match(link.href, /market=BR/, link.href);
      assert.match(link.href, /product=spot/, link.href);
      assert.ok(link.href.startsWith('/zh-hans/') || /[?&]locale=zh-Hans/.test(link.href), link.href);
    }
    assert.ok(list.some((anchor) => /target="_blank"/.test(anchor.attrs) && /^https?:\/\//.test(anchor.href)), 'official source links remain external source tasks');
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('partner registry remains byte-stable and exact SHA-protected', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, async () => {
  const bytes = await readFile(path.join(root, registryPath));
  assert.equal(sha(bytes), expectedRegistrySha);
});
