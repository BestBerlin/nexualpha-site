import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { existsSync as historicalFixtureExists } from 'node:fs';
import { test as historicalFixtureTest } from 'node:test';

// This historical peer comparison requires the original review snapshot. A fresh
// checkout cannot reconstruct its evidence; retain the assertions for that setup.
const historicalFixture = new URL("../../../r283-mobile-resume-row/candidate/src/components/v3/telegram-return-banner.css", import.meta.url);
if (!historicalFixtureExists(historicalFixture)) {
  historicalFixtureTest('historical peer fixture is available', {
    skip: 'Missing historical review fixture: ' + historicalFixture.pathname,
  }, () => {});
} else {
const css = readFileSync(new URL('../src/components/v3/telegram-return-banner.css', import.meta.url), 'utf8');
const r283Css = readFileSync(new URL('../../../r283-mobile-resume-row/candidate/src/components/v3/telegram-return-banner.css', import.meta.url), 'utf8');
const jsx = readFileSync(new URL('../src/components/v3/TelegramReturnBanner.jsx', import.meta.url), 'utf8');
const r283Jsx = readFileSync(new URL('../../../r283-mobile-resume-row/candidate/src/components/v3/TelegramReturnBanner.jsx', import.meta.url), 'utf8');
const registry = readFileSync(new URL('../src/data/partner-registry.js', import.meta.url));

function blockFrom(source, marker, after = 0) {
  const start = source.indexOf(marker, after);
  assert.notEqual(start, -1, `missing ${marker}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`unterminated ${marker}`);
}

function stripAllowedR284(source) {
  return source
    .replace(/\n\n  \.v3-telegram-return-banner--anonymous \.v3-telegram-return-banner__continue,\n  \.v3-telegram-return-banner--anonymous \.v3-telegram-return-banner__clear \{\n    font-size: 0\.75rem;\n    line-height: 1\.4;\n    padding: 0\.4rem 0\.45rem;\n  \}\n/, '\n');
}

test('mobile anonymous secondary actions use smaller readable type without JS data or non-anonymous drift', () => {
  assert.equal(jsx, r283Jsx, 'TelegramReturnBanner.jsx must remain byte-identical to R283');
  assert.equal(createHash('sha256').update(registry).digest('hex'), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
  assert.equal(stripAllowedR284(css), r283Css, 'only the scoped R284 mobile anonymous action typography block may differ');

  const mobile = blockFrom(css, '@media (max-width: 760px)', css.indexOf('Anonymous browser resume'));
  assert.match(mobile, /\.v3-telegram-return-banner--anonymous \.v3-telegram-return-banner__continue,\n\s*\.v3-telegram-return-banner--anonymous \.v3-telegram-return-banner__clear\s*\{[\s\S]*?font-size:\s*0\.75rem;/, 'mobile secondary actions should use 15px at root 20px');
  assert.match(mobile, /line-height:\s*1\.4;/);
  assert.match(mobile, /padding:\s*0\.4rem\s+0\.45rem;/);
  assert.match(css, /\.v3-telegram-return-banner--anonymous \.v3-telegram-return-banner__continue,\n\.v3-telegram-return-banner--anonymous \.v3-telegram-return-banner__clear,\n\.v3-telegram-return-banner--anonymous \.v3-anonymous-resume-details > summary \{[\s\S]*?min-height:\s*44px;/, 'global target-size rule must keep 44px minimum');
  assert.doesNotMatch(mobile, /display:\s*none|visibility:\s*hidden|-webkit-line-clamp|text-overflow:\s*ellipsis/, 'R284 must reduce wrapping through type/spacing only, not hide text');
});
}
