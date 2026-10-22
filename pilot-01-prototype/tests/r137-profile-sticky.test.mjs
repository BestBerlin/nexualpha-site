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

if (existsSync(new URL('../../../r134-reader-decisions/candidate/src/components/v3/V3Pages.jsx', import.meta.url))) {
const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = path.resolve(root, '../../r134-reader-decisions/candidate');
const source = readFileSync(path.join(root, 'src/components/v3/V3Pages.jsx'), 'utf8');
const css = readFileSync(path.join(root, 'src/styles/fintech-premium.css'), 'utf8');

function hrefs(html) {
  return [...html.matchAll(/<a\b[^>]*href="([^"]*)"/g)]
    .map((match) => match[1].replace(/tg_expires=\d+/g, 'tg_expires=FIXED'))
    .sort();
}

async function renderFixture() {
  const dir = await mkdtemp(path.join(root, 'tests/.tmp-r137-profile-sticky-'));
  try {
    const entry = path.join(dir, 'entry.mjs');
    const out = path.join(dir, 'out.cjs');
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { VenueDetailPage } from '../../src/components/v3/V3Pages.jsx';
      import { VenueDetailPage as Before } from ${JSON.stringify(path.join(baseline, 'src/components/v3/V3Pages.jsx'))};
      import { venueDatabase } from '../../src/data/venue-database.js';
      const venues = Object.values(venueDatabase);
      const copy = { common: { dimension: 'Dimension' }, assetCapabilities: { none: 'Pending source review' } };
      const props = { copy, locale: 'en', venue: venueDatabase.binance, venues, updates: [], market: 'unknown', product: 'unknown' };
      console.log(JSON.stringify({ after: renderToStaticMarkup(React.createElement(VenueDetailPage, props)), before: renderToStaticMarkup(React.createElement(Before, props)) }));
    `);
    await build({
      entryPoints: [entry],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: out,
      loader: { '.css': 'empty' },
      logLevel: 'silent',
    });
    return JSON.parse(execFileSync(process.execPath, [out], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const rendered = await renderFixture();





test('SSR keeps profile mobile sticky hidden and out of tab order until the client gate activates', () => {
  const sticky = rendered.after.match(/<aside class="v3-mobile-sticky-bar"[\s\S]*?<\/aside>/)?.[0] || '';
  assert.ok(sticky, 'profile mobile sticky exists in SSR markup');
  assert.match(sticky, /aria-hidden="true"/);
  assert.match(sticky, /inert=""/);
  assert.doesNotMatch(sticky, /is-active/);
  assert.match(sticky, /data-cta-placement="venue-mobile-sticky"/);
});



test('R137 keeps R134 profile anchors and partner registry unchanged', () => {
  assert.deepEqual(hrefs(rendered.after), hrefs(rendered.before));
  const hash = createHash('sha256').update(readFileSync(path.join(root, 'src/data/partner-registry.js'))).digest('hex');
  assert.equal(hash, committedFileHash('src/data/partner-registry.js'));
});

} else {
  test('historical regression requires original archived checkout', { skip: 'Original historical source snapshot is absent from a fresh checkout; current-source tests run separately.' }, () => {});
}

// Current-source checks run even when the original peer checkout is absent.
{
const source=readFileSync(new URL('../src/components/v3/VenueDetailPage.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles/fintech-premium.css',import.meta.url),'utf8');
test('profile mobile sticky source gate requires mobile viewport and hero quick-registration bottom <= 0', () => {
  const detail = source.slice(source.indexOf('export function VenueDetailPage'), source.indexOf('export function CompareDeepPage'));
  assert.match(detail, /const shouldShowMobileSticky = \(anchorRect, isMobileViewport\) => \{/);
  assert.match(detail, /if \(!isMobileViewport \|\| !anchorRect\) return false;/);
  assert.match(detail, /return Number\.isFinite\(bottom\) && bottom <= 0;/);
  assert.match(detail, /setMobileStickyActive\(shouldShowMobileSticky\(anchor\?\.getBoundingClientRect\(\), isMobileViewport\)\)/);
});
test('profile sticky observes only the hero quick-registration card and mobile viewport gate', () => {
  const detail = source.slice(source.indexOf('export function VenueDetailPage'), source.indexOf('export function CompareDeepPage'));
  assert.match(detail, /document\.querySelector\('\[data-cta-surface="venue-profile-main-registration"\]'\)/);
  assert.match(detail, /window\.matchMedia\("\(max-width: 780px\)"\)/);
  assert.match(detail, /window\.addEventListener\("scroll", updateMobileSticky, \{ passive: true \}\)/);
  assert.match(detail, /window\.addEventListener\("resize", updateMobileSticky\)/);
  assert.match(detail, /mediaQuery\?\.addEventListener\?\.\("change", updateMobileSticky\)/);
  assert.doesNotMatch(detail, /compare-versus-card|compare-hero|setStickyCtaActive/);
});
test('profile sticky CSS is visually and interactively hidden until is-active is present', () => {
  assert.match(css, /\.v3-mobile-sticky-bar \{[\s\S]*opacity:\s*0;[\s\S]*pointer-events:\s*none;[\s\S]*transform:\s*translateY\(110%\);/);
  assert.match(css, /\.v3-mobile-sticky-bar\.is-active \{[\s\S]*opacity:\s*1;[\s\S]*pointer-events:\s*auto;[\s\S]*transform:\s*translateY\(0\);/);
  assert.match(css, /@media \(max-width: 780px\) \{[\s\S]*\.v3-mobile-sticky-bar \{[\s\S]*display:\s*block;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.v3-mobile-sticky-bar \{[\s\S]*transition:\s*none;/);
});
}
