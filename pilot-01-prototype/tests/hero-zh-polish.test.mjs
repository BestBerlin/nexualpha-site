import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { createSsrHarness } from './helpers/ssr-hydration-harness.mjs';
import { HERO_SAY, HERO_VOLUME_STEPS, heroVolumeText, heroSayText } from '../src/components/v7/home7-hero-volume.js';

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

test('CJK sentence stays natural at every volume and preserves manual settlement wording', () => {
  for (const locale of ['zh-Hans', 'zh-Hant', 'ja']) {
    for (const volume of HERO_VOLUME_STEPS) {
      for (const auto of [true, false]) {
        const text = heroSayText(locale, { vol: heroVolumeText(volume, locale), venue: 'Bitget', auto });
        assert.doesNotMatch(text, /[，、]/);
        assert.ok(text.includes('Bitget'));
        assert.ok(text.includes(heroVolumeText(volume, locale)));
        assert.equal(/自动|自動/.test(text), auto);
      }
    }
  }
  assert.equal(heroVolumeText(1e7, 'zh-Hans'), '1000 万 U');
  for (const copy of Object.values(HERO_SAY)) assert.ok(copy.exchange && copy.live);
});

test('SSR preserves real calculation rows, readable labels, and locale-specific heading structure', async () => {
  for (const [locale, path] of [['zh-Hans','zh-hans'], ['zh-Hant','zh-hant'], ['ja','ja'], ['en',''], ['de','de'], ['ru','ru'], ['ar','ar']]) {
    const html = await harness.render(`https://nexualpha.com/${path}`);
    const dom = new JSDOM(html);
    try {
      const doc = dom.window.document;
      const heading = doc.querySelector('h1.hx-say');
      if (['zh-Hant', 'ru', 'ar'].includes(locale)) {
        assert.equal(heading, null, `${locale}: neutral locale keeps its information-only hero`);
        assert.equal(doc.querySelector('.hx-screen'), null);
        assert.equal(doc.querySelector('.hx-go'), null);
        continue;
      }
      assert.ok(heading, locale);
      assert.equal(heading.querySelectorAll('br').length, /^(zh|ja)/.test(locale) ? 0 : 1, locale);
      const screen = doc.querySelector('.hx-screen');
      assert.equal(screen.querySelector('.hx-scr-head').firstElementChild.textContent, HERO_SAY[locale].exchange);
      assert.equal(screen.querySelector('.hx-scr-live').textContent, HERO_SAY[locale].live);
      const selected = screen.querySelector('li[data-on]');
      assert.ok(selected);
      assert.equal(selected.querySelector('.hx-scr-amt').textContent, doc.querySelector('.hx-amt').textContent);
      assert.ok(screen.querySelectorAll('.hx-scr-bar-fill b').length >= 3);
    } finally { dom.window.close(); }
  }
});

test('motion and layout safeguards remain explicit in source and generated CSS', () => {
  const source = readFileSync(new URL('../src/components/v7/HomeV7.jsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/styles/v7/home7.css', import.meta.url), 'utf8');
  assert.match(source, /cancelAnimationFrame\(frame\)/);
  assert.match(source, /\(now - start\) \/ 360/);
  assert.match(source, /reducedMotion\(\) \? 1/);
  assert.doesNotMatch(source, /bars\.current/); // Bars enter once; volume changes do not restart them.
  assert.match(css, /white-space:normal/);
  assert.match(css, /word-break:keep-all;line-break:strict/);
  assert.match(css, /font-weight:600;line-height:1\.28/);
  assert.match(css, /hx-screen-sheen 12s/);
  assert.match(css, /hx-mac-display::after\{animation:none;opacity:0\}/);
  assert.doesNotMatch(css, /animation-timeline:\s*view\(/);
});
