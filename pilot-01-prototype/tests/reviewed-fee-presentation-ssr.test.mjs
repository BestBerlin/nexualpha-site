import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildVenueFeeSummary } from '../src/data/venue-fee-summary.js';
import { reviewedFeeCopy } from '../src/data/reviewed-fee-copy.js';
import { publicCtaForVenue } from '../src/data/public-cta.js';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const locales = ['en', 'zh-Hans', 'zh-Hant', 'es', 'pt-BR', 'fr', 'de', 'ja', 'ko', 'ar', 'tr', 'ru', 'id', 'vi', 'it'];
const slugs = ['binance', 'bitget', 'bybit', 'okx', 'backpack'];
const escaped = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

test('all core locale profiles show reviewed fee scope and preserve invitations; unknown rates stay absent', async () => {
  const temp = await mkdtemp(path.join(root, 'tests/.tmp-reviewed-fee-'));
  try {
    const entry = path.join(temp, 'entry.mjs');
    const bundle = path.join(temp, 'bundle.cjs');
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { VenueDetailPage } from '../../src/components/v3/V3Pages.jsx';
      import { venueDatabase } from '../../src/data/venue-database.js';
      const venues = Object.values(venueDatabase);
      const copy = { common: { dimension: 'Dimension' }, assetCapabilities: { none: 'Unknown' } };
      const pages = [];
      for (const locale of ${JSON.stringify(locales)}) {
        for (const slug of ${JSON.stringify(slugs)}) {
          const html = renderToStaticMarkup(React.createElement(VenueDetailPage, {
            venue: venueDatabase[slug], venues, copy, locale, updates: [], market: 'unknown', product: 'unknown'
          }));
          const start = html.indexOf('id="fee-schedule"');
          const end = html.indexOf('</section>', start);
          if (start < 0 || end < 0) throw new Error('Missing fee section: ' + slug);
          pages.push({ locale, slug, feeHtml: html.slice(start, end) });
        }
      }
      console.log(JSON.stringify(pages));
    `);
    execFileSync(path.join(root, 'node_modules/.bin/esbuild'), [entry, '--bundle', '--platform=node', '--format=cjs', `--outfile=${bundle}`, '--loader:.css=empty', '--log-level=warning'], { cwd: root, stdio: 'pipe' });
    const pages = JSON.parse(execFileSync('node', [bundle], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
    assert.equal(pages.length, 75);
    for (const { locale, slug, feeHtml } of pages) {
      const cta = publicCtaForVenue(slug, locale);
      assert.ok(feeHtml.includes(`href="${escaped(cta.registrationUrl)}"`), `${slug}/${locale}: original invitation URL`);
      assert.ok(feeHtml.includes(escaped(cta.inviteCode)), `${slug}/${locale}: original invitation code`);
      const [rate] = buildVenueFeeSummary({ slug }).rates;
      if (!rate) {
        assert.ok(!feeHtml.includes('data-fee-product='), `${slug}/${locale}: unreviewed numbers must remain absent`);
        continue;
      }
      const copy = reviewedFeeCopy(rate, locale);
      for (const key of ['tier', 'scope', 'conditions']) {
        assert.ok(feeHtml.includes(escaped(copy[key])), `${slug}/${locale}: visible ${key}`);
      }
      assert.ok(feeHtml.includes(`href="${rate.sourceUrl}"`), `${slug}/${locale}: exact reviewed source`);
      assert.ok(feeHtml.includes(`dateTime="${rate.checkedAt}"`), `${slug}/${locale}: review date`);
      assert.ok(feeHtml.includes('data-fee-product="spot"'));
      // Futures rows are allowed only when the venue carries a reviewed futures record (data update 2026-10-08).
      const hasFutures = buildVenueFeeSummary({ slug }).rates.some((r) => r.product === 'futures');
      if (!hasFutures) assert.ok(!feeHtml.includes('data-fee-product="futures"'), 'No invented futures schedule');
      assert.ok(!feeHtml.includes('VIP 9'), 'No invented VIP tiers');
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
