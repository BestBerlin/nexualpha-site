import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const css = readFileSync(new URL('../src/components/v3/telegram-return-banner.css', import.meta.url), 'utf8');
const jsx = readFileSync(new URL('../src/components/v3/TelegramReturnBanner.jsx', import.meta.url), 'utf8');
const r282Jsx = readFileSync(new URL('../../../r282-directory-chunk/candidate/src/components/v3/TelegramReturnBanner.jsx', import.meta.url), 'utf8');
const registry = readFileSync(new URL('../src/data/partner-registry.js', import.meta.url));

function mediaBlock(source, marker, after = 0) {
  const start = source.indexOf(marker, after);
  assert.notEqual(start, -1, `missing media ${marker}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`unterminated media ${marker}`);
}

test('mobile anonymous resume actions use fixed two-column row without touching JSX or registry', () => {
  assert.equal(jsx, r282Jsx, 'TelegramReturnBanner.jsx must remain byte-identical to R282');
  assert.equal(createHash('sha256').update(registry).digest('hex'), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
  const mobile = mediaBlock(css, '@media (max-width: 760px)', css.indexOf('Anonymous browser resume'));
  assert.match(mobile, /\.v3-telegram-return-banner--anonymous \.v3-telegram-return-banner__actions\s*\{[\s\S]*?display:\s*grid;/);
  assert.match(mobile, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/, 'mobile actions must not use auto-fit 8.5rem, which stacks under root font 20px');
  assert.doesNotMatch(mobile, /auto-fit|8\.5rem/, 'old auto-fit/min width caused vertical stacking at 390px root 20px');
  assert.doesNotMatch(mobile, /display:\s*none|visibility:\s*hidden|-webkit-line-clamp|text-overflow:\s*ellipsis/, 'mobile row must not hide or clamp labels');
});
