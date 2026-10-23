import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { buildSync } from 'esbuild';
import { JSDOM } from 'jsdom';
import { nativeReferralFor } from '../src/data/referral-native.js';
import { decisionForVenue } from '../src/data/venue-decision-content.js';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const compiled = buildSync({
  stdin: { contents: `
    import React from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import { ReferralNativeAnswers } from './src/components/v3/ReferralNativeAnswers.jsx';
    import { VenueAudienceCard, venueAudienceChips } from './src/components/v3/VenueDetailPageVisuals.jsx';
    import { ResearchComparisonCard } from './src/components/shared/ResearchComparisonCard.jsx';
    export const render = (kind, props) => renderToStaticMarkup(React.createElement({flow: ReferralNativeAnswers, audience: VenueAudienceCard, pair: ResearchComparisonCard}[kind], props));
    export { venueAudienceChips };
  `, resolveDir: root, loader: 'jsx' },
  bundle: true, write: false, format: 'cjs', platform: 'node',
  external: ['react', 'react-dom/server'], loader: { '.css': 'empty' },
}).outputFiles[0].text;
const mod = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, mod, mod.exports);
const { render, venueAudienceChips } = mod.exports;

test('registration stages retain helper-bound codes, cadence, qualifications and disclosure', () => {
  for (const slug of ['okx', 'binance', 'bitget', 'bybit', 'htx', 'kraken']) {
    for (const locale of ['en', 'zh-Hans', 'tr', 'id', 'es', 'pt-BR']) {
      const data = nativeReferralFor(slug, locale);
      if (!data) continue;
      const dom = new JSDOM(render('flow', { slug, locale, disclosure: 'Affiliate disclosure fixture' }));
      const doc = dom.window.document;
      const stages = [...doc.querySelectorAll('[data-registration-stage]')];
      assert.deepEqual(stages.map(stage => stage.dataset.registrationStage), ['entry', 'code', 'payout']);
      assert.equal(stages[0].querySelector('dd').textContent, data.entry);
      assert.equal(stages[1].querySelector('dd').textContent, data.code);
      assert.equal(stages[2].querySelector('dd').textContent, data.payout);
      assert.equal(doc.querySelector('.vx-registration-later dd').textContent, data.later);
      assert.equal(doc.querySelector('.vx-registration-disclosure').textContent, 'Affiliate disclosure fixture');
      assert.equal(stages.every(stage => stage.querySelector('svg[focusable="false"]')), true);
      dom.window.close();
    }
  }
});

test('neutral referral flow keeps its no-code/no-benefit policy', () => {
  const dom = new JSDOM(render('flow', { slug: 'okx', locale: 'zh-Hant' }));
  assert.equal(dom.window.document.querySelector('[data-registration-stage="code"]'), null);
  assert.equal(dom.window.document.querySelector('.vx-registration-benefit'), null);
  assert.equal(render('flow', { slug: 'okx', locale: 'vi' }), '');
  dom.window.close();
});

test('audience chips are exact excerpts of current editorial copy and do not invent features', () => {
  for (const locale of ['en', 'zh-Hans', 'zh-Hant', 'ar']) {
    const summary = decisionForVenue('okx', locale).fit;
    const chips = venueAudienceChips(summary);
    assert.ok(chips.length >= 3);
    for (const chip of chips) assert.ok(summary.includes(chip.label));
    const dom = new JSDOM(render('audience', { summary, label: 'Best for', locale }));
    assert.equal(dom.window.document.querySelector('.v3-venue-summary').textContent, summary);
    assert.equal(dom.window.document.querySelectorAll('.vx-audience-chips li').length, chips.length);
    dom.window.close();
  }
  assert.deepEqual(venueAudienceChips('No product is specified.'), []);
});

test('shared comparison card retains its exact destination, label and reserved paired-logo sizes', () => {
  const href = '/zh-hans/compare/binance-vs-okx';
  const dom = new JSDOM(render('pair', { href, pair: ['binance', 'okx'], label: 'Binance vs OKX' }));
  assert.equal(dom.window.document.querySelector('a').getAttribute('href'), href);
  assert.equal(dom.window.document.querySelector('.research-library__card-label').textContent, 'Binance vs OKX');
  const images = [...dom.window.document.querySelectorAll('img')];
  assert.equal(images.length, 2);
  images.forEach(image => { assert.equal(image.width, 40); assert.equal(image.height, 40); });
  dom.window.close();
});

test('built home entry static closure excludes every v3 visual enhancement', { skip: !existsSync(path.join(root, 'dist/client/.vite/manifest.json')) }, () => {
  const manifest = JSON.parse(readFileSync(path.join(root, 'dist/client/.vite/manifest.json'), 'utf8'));
  const seen = new Set();
  const walk = key => {
    if (seen.has(key)) return '';
    seen.add(key);
    const item = manifest[key];
    assert.ok(item, key);
    return readFileSync(path.join(root, 'dist/client', item.file), 'utf8') + (item.imports || []).map(walk).join('');
  };
  const entry = Object.keys(manifest).find(key => manifest[key].isEntry && key === 'index.html');
  assert.ok(entry);
  const closure = walk(entry);
  for (const marker of ['vx-audience-card', 'vx-registration-flow', 'research-library__pair', 'exchange-scorecard__bars', 'news-detail__resource-art']) {
    assert.equal(closure.includes(marker), false, `${marker} must remain deferred/route-owned`);
  }
});
