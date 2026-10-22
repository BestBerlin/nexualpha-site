import { committedFileHash } from './r100-test-contracts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const css = readFileSync(new URL('../src/components/v3/venue-yellow-pages.css', import.meta.url), 'utf8');
const jsx = readFileSync(new URL('../src/components/v3/VenueYellowPages.jsx', import.meta.url), 'utf8');
const registry = readFileSync(new URL('../src/data/partner-registry.js', import.meta.url));

test('R120 homepage compact yellow cards have their own containment instead of relying on directory rules', () => {
  const blockStart = css.indexOf('R120 home compact yellow-page cards');
  assert.ok(blockStart > 0, 'R120 compact homepage containment block must exist');
  const block = css.slice(blockStart);
  assert.match(block, /\.yellow-pages__grid--compact \.yellow-card,[\s\S]*\.yellow-pages__grid--compact \.yellow-card__actions > \* \{[\s\S]*min-width:\s*0;[\s\S]*max-width:\s*100%;[\s\S]*box-sizing:\s*border-box;/, 'compact card cells and action children must be shrinkable');
  assert.match(block, /\.yellow-pages__grid--compact \.yellow-card__identity \{[\s\S]*flex-wrap:\s*wrap;[\s\S]*height:\s*auto;/, 'compact top row must wrap instead of clipping right badges');
  assert.match(block, /\.yellow-pages__grid--compact \.yellow-card__badges \{[\s\S]*flex:\s*0 1 100%;[\s\S]*flex-wrap:\s*wrap;/, 'compact badges must move under the brand when narrow');
  assert.match(block, /\.yellow-pages__grid--compact \.yellow-card__category,[\s\S]*\.yellow-pages__grid--compact \.yellow-card__trust \{[\s\S]*white-space:\s*normal;[\s\S]*overflow-wrap:\s*anywhere;/, 'long locale/status badges must wrap');
});

test('R120 homepage compact CTA buttons keep two reachable columns without overflow clipping', () => {
  const block = css.slice(css.indexOf('R120 home compact yellow-page cards'));
  assert.match(block, /\.yellow-pages__grid--compact \.yellow-card__actions \{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);[\s\S]*align-items:\s*stretch;/, 'compact homepage actions keep bounded two-column tracks');
  for (const selector of ['yellow-card__btn-detail', 'yellow-card__btn-register', 'yellow-card__btn-compare']) {
    assert.match(block, new RegExp(`\\.yellow-pages__grid--compact \\.${selector}[\\s\\S]*width:\\s*100%;[\\s\\S]*min-width:\\s*0;[\\s\\S]*max-width:\\s*100%;[\\s\\S]*white-space:\\s*normal;[\\s\\S]*overflow-wrap:\\s*anywhere;`), `${selector} must wrap inside the compact card`);
  }
  assert.match(block, /@media \(max-width: 360px\)[\s\S]*\.yellow-pages__grid--compact \.yellow-card__btn-detail,[\s\S]*font-size:\s*0\.78rem;/, '320px class phones get tighter compact button text');
});

test('R120 homepage compact fix does not alter CTA href ownership or partner registry', () => {
  assert.match(jsx, /className=\{`yellow-pages__grid\$\{compact \? " yellow-pages__grid--compact" : " yellow-pages__grid--directory"\}/, 'homepage still uses compact grid class');
  assert.match(jsx, /href=\{registrationUrl\}[\s\S]*className="yellow-card__btn-register"/, 'registration button still uses resolved partner URL');
  const sha = createHash('sha256').update(registry).digest('hex');
  assert.equal(sha, committedFileHash('src/data/partner-registry.js'));
});
