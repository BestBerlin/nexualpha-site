import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { schedule, assertPromoCopy, build } from './build.mjs';

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

// Bitget Alliance campaign spec (campaign-generic scenes: pool, split, qualify, box, cta).
const bitget = JSON.parse(await readFile(new URL('./bitget-alliance.json', import.meta.url), 'utf8'));

test('bitget-alliance runs 30 seconds on whole frames with campaign scenes', () => {
  const { scenes, total } = schedule(bitget);
  assert.equal(total, 30);
  for (const s of scenes) assert.equal(Math.round(s.duration * 30), s.duration * 30);
  assert.deepEqual(bitget.scenes.map(s => s.id), ['pool', 'split', 'qualify', 'box', 'cta']);
});

test('bitget-alliance copy is complete, clean and only in promotable locales', () => {
  assert.deepEqual(Object.keys(bitget.copy).sort(), ['en', 'zh-Hans']);
  const keys = Object.keys(bitget.copy.en);
  for (const [locale, copy] of Object.entries(bitget.copy)) {
    assert.deepEqual(Object.keys(copy).sort(), [...keys].sort(), locale);
    assert.equal(copy.qualify.length, 3, locale);
    assert.equal(copy.pools.length, bitget.pool_weights.length, locale);
    assert.equal(copy.prizes.length, 4, locale);
    for (const [k, v] of Object.entries(copy)) assert.doesNotThrow(() => assertPromoCopy([].concat(v).join(' '), `${locale}.${k}`));
  }
  for (const s of bitget.scenes) assert.doesNotThrow(() => assertPromoCopy(s.narration, s.id));
  assert.equal(bitget.code, 'DPRWSXAS');
  assert.equal(bitget.qr, 'https://nexualpha.com/activities/bitget-alliance?src=short');
  assert.ok(!/bitget\.com\//i.test(JSON.stringify(bitget)), 'no direct exchange links');
});

test('bitget-alliance builds with the code, our QR and no printed percentages', async () => {
  const [dir] = await build(bitget, 'en', ['vertical']);
  const html = await readFile(`${dir}/index.html`, 'utf8');
  for (const id of ['pool', 'split', 'qualify', 'box', 'cta']) assert.match(html, new RegExp(`data-scene="${id}"`));
  assert.match(html, /class="code code-long">DPRWSXAS</);
  const visible = html.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(visible, /%/);
  assert.match(html, /New\u00a0&amp;\u00a0existing/);
});

// Kraken 5M USDG Futures Challenge spec (same campaign scenes, reordered: pool, box, split, qualify, cta).
const kraken = JSON.parse(await readFile(new URL('./kraken-usdg.json', import.meta.url), 'utf8'));

test('kraken-usdg runs 30 seconds on whole frames with campaign scenes', () => {
  const { scenes, total } = schedule(kraken);
  assert.equal(total, 30);
  for (const s of scenes) assert.equal(Math.round(s.duration * 30), s.duration * 30);
  assert.deepEqual(kraken.scenes.map(s => s.id).sort(), ['box', 'cta', 'pool', 'qualify', 'split']);
});

test('kraken-usdg copy is complete, clean and only in promotable locales', () => {
  assert.deepEqual(Object.keys(kraken.copy).sort(), ['en', 'zh-Hans']);
  const keys = Object.keys(kraken.copy.en);
  for (const [locale, copy] of Object.entries(kraken.copy)) {
    assert.deepEqual(Object.keys(copy).sort(), [...keys].sort(), locale);
    assert.equal(copy.qualify.length, 3, locale);
    assert.equal(copy.pools.length, kraken.pool_weights.length, locale);
    assert.equal(copy.prizes.length, 3, locale);
    assert.ok(copy.qualify[0].includes('7f97gkqw'), `${locale} step 1 carries the code`);
    assert.match(copy.cta_sub, /SGT/, `${locale} end time is labelled SGT`);
    for (const [k, v] of Object.entries(copy)) assert.doesNotThrow(() => assertPromoCopy([].concat(v).join(' '), `${locale}.${k}`));
  }
  for (const s of kraken.scenes) assert.doesNotThrow(() => assertPromoCopy(s.narration, s.id));
  assert.match(kraken.scenes.find(s => s.id === 'cta').narration, /7, f, 9, 7, g, k, q, w/);
  assert.equal(kraken.code, '7f97gkqw');
  assert.equal(kraken.qr, 'https://nexualpha.com/activities/kraken-usdg-challenge?src=short');
  assert.ok(!/kraken\.com/i.test(JSON.stringify(kraken)), 'no domain-like exchange text');
});

test('kraken-usdg builds with the code, our QR and no printed percentages', async () => {
  const [dir] = await build(kraken, 'en', ['vertical']);
  const html = await readFile(`${dir}/index.html`, 'utf8');
  for (const id of ['pool', 'box', 'split', 'qualify', 'cta']) assert.match(html, new RegExp(`data-scene="${id}"`));
  assert.match(html, /class="code code-long">7f97gkqw</);
  const visible = html.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(visible, /%/);
  assert.doesNotMatch(visible, /kraken\.com/i);
  assert.match(visible, /5,000,000/);
});
