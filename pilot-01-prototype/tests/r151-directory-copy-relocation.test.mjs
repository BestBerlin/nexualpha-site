import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const fixture = JSON.parse(await readFile(new URL('./fixtures/r151-directory-relocation-before.json', import.meta.url), 'utf8'));
const locales = ['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];
const tmp = await mkdtemp(path.join(root, 'tests/.tmp-r151-relocation-'));
let rows;
try {
  const entry = path.join(tmp, 'entry.jsx');
  const bundle = path.join(tmp, 'bundle.cjs');
  await writeFile(entry, `import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{VenueYellowPages}from'../../src/components/v3/VenueYellowPages.jsx';import{venueDatabase}from'../../src/data/venue-database.js';Date.now=()=>1791190800000;const locales=${JSON.stringify(locales)};const rows=[];for(const locale of locales)for(const compact of [false,true]){const props={locale,compact,venues:['binance','okx','uniswap'].map(slug=>venueDatabase[slug]),market:'unknown',product:'unknown'};rows.push({locale,compact,html:renderToStaticMarkup(React.createElement(VenueYellowPages,props))});}console.log(JSON.stringify(rows));`);
  await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, loader: { '.css': 'empty' }, logLevel: 'silent' });
  rows = JSON.parse(execFileSync(process.execPath, [bundle], { encoding: 'utf8', maxBuffer: 60 * 1024 * 1024 }));
} finally {
  await rm(tmp, { recursive: true, force: true });
}

test('directoryLocaleCopy relocation preserves exact SSR HTML for all locales and compact modes', () => {
  assert.equal(rows.length, fixture.length);
  for (const row of rows) {
    const before = fixture.find((item) => item.locale === row.locale && item.compact === row.compact);
    assert.ok(before, `${row.locale}/${row.compact} fixture`);
    assert.equal(row.html, before.html, `${row.locale}/${row.compact} HTML must stay byte exact after copy-module relocation`);
  }
});

test('directory copy source lives in the shared copy chunk without touching registry or href owners', async () => {
  const page = await readFile(path.join(root, 'src/components/v3/VenueYellowPages.jsx'), 'utf8');
  const copy = await readFile(path.join(root, 'src/components/v3/venue-yellow-pages-copy.js'), 'utf8');
  assert.match(page, /import \{ accountStageCopy, decisionCopy, directoryCopy, productPathLabel \} from "\.\/venue-yellow-pages-copy\.js";/);
  assert.doesNotMatch(page, /const directoryLocaleCopy = \{/);
  assert.match(copy, /const directoryLocaleCopy = \{/);
  assert.match(copy, /export const directoryCopy = \(locale\) => directoryLocaleCopy\[locale\]/);
  for (const marker of ['Contexto de investigación', 'Contexte de recherche', 'Recherchekontext', 'سياق البحث']) assert.ok(copy.includes(marker), marker);
});
