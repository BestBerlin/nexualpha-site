import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../../r280-inline-research-example/candidate/src/components/v3/TelegramReturnBanner.jsx", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const css = readFileSync(new URL('../src/components/v3/telegram-return-banner.css', import.meta.url), 'utf8');
const jsx = readFileSync(new URL('../src/components/v3/TelegramReturnBanner.jsx', import.meta.url), 'utf8');
const r280Jsx = readFileSync(new URL('../../../r280-inline-research-example/candidate/src/components/v3/TelegramReturnBanner.jsx', import.meta.url), 'utf8');
const registry = readFileSync(new URL('../src/data/partner-registry.js', import.meta.url));

function ruleBlock(source, selector) {
  const start = source.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `missing rule ${selector}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`unterminated rule ${selector}`);
}

test('anonymous Telegram return banner compacts existing three children without JS/data drift', () => {
  assert.equal(jsx, r280Jsx, 'TelegramReturnBanner.jsx must remain byte-identical to R280');
  assert.equal(createHash('sha256').update(registry).digest('hex'), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');

  const anonymous = ruleBlock(css, '.v3-telegram-return-banner--anonymous');
  assert.match(anonymous, /grid-template-columns:\s*minmax\(12rem,\s*1fr\)\s+auto\s+auto;/, 'desktop anonymous banner should lay out title/actions/privacy as a compact row');
  assert.match(anonymous, /align-items:\s*center;/);

  const actions = ruleBlock(css, '.v3-telegram-return-banner--anonymous .v3-telegram-return-banner__actions');
  assert.match(actions, /flex-direction:\s*row;/, 'resume and forget controls should share a compact action row');
  assert.match(actions, /flex-wrap:\s*wrap;/, 'long localized labels may wrap without clipping');

  const opened = ruleBlock(css, '.v3-telegram-return-banner--anonymous .v3-anonymous-resume-details\[open\]');
  assert.match(opened, /grid-column:\s*1\s*\/\s*-1;/, 'opened privacy details should expand naturally across the full banner');

  const targets = ruleBlock(css, '.v3-telegram-return-banner--anonymous .v3-telegram-return-banner__continue,\n.v3-telegram-return-banner--anonymous .v3-telegram-return-banner__clear,\n.v3-telegram-return-banner--anonymous .v3-anonymous-resume-details > summary');
  assert.match(targets, /min-height:\s*44px;/, 'resume, forget, and privacy targets stay at least 44px');
});

test('mobile anonymous banner keeps actions visible and does not hide privacy text', () => {
  const mobileMarker = '@media (max-width: 760px)';
  const mobileStart = css.indexOf(mobileMarker, css.indexOf('Anonymous browser resume'));
  assert.notEqual(mobileStart, -1, 'anonymous mobile media block should exist after anonymous rules');
  const mobile = css.slice(mobileStart);
  assert.match(mobile, /\.v3-telegram-return-banner--anonymous\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
  assert.match(mobile, /\.v3-telegram-return-banner--anonymous \.v3-telegram-return-banner__actions\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/);
  assert.doesNotMatch(mobile, /display:\s*none|visibility:\s*hidden|-webkit-line-clamp|text-overflow:\s*ellipsis/, 'mobile compacting must not hide or clamp resume/privacy text');
});
}
