import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { schedule, assertPromoCopy } from './build.mjs';

const spec = JSON.parse(await readFile(new URL('./bybit-stocks.json', import.meta.url), 'utf8'));

test('bybit-stocks runs 30 seconds on whole frames', () => {
  const { scenes, total } = schedule(spec);
  assert.equal(total, 30);
  for (const s of scenes) assert.equal(Math.round(s.duration * 30), s.duration * 30);
});

test('every locale has complete copy and no banned promo lines', () => {
  const keys = Object.keys(spec.copy.en);
  for (const [locale, copy] of Object.entries(spec.copy)) {
    assert.deepEqual(Object.keys(copy).sort(), [...keys].sort(), locale);
    assert.equal(copy.facts.length, 3, locale);
    for (const [k, v] of Object.entries(copy)) assert.doesNotThrow(() => assertPromoCopy([].concat(v).join(' '), `${locale}.${k}`));
  }
  for (const s of spec.scenes) assert.doesNotThrow(() => assertPromoCopy(s.narration, s.id));
});

test('banned lines are rejected', () => {
  for (const bad of ['Capital at risk', 'Not investment advice', 'SEC-approved', 'Up to 30% rebate'])
    assert.throws(() => assertPromoCopy(bad, 'test'));
});

test('QR points at our activity page with a source tag', () => {
  assert.match(spec.qr, /^https:\/\/nexualpha\.com\/activities\/[a-z-]+\?src=short$/);
});
