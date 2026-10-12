// Season 1 production checks over every episode: build both formats, seek the real GSAP timeline,
// one visible scene at each hero time, quiz answers revealed only after the beat, no fine print on frames,
// conversion cards only where the lead decided, and logo/mascot present.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { ALL_EPISODES } from './season.mjs';
import { schedule } from './contract.mjs';
import { FINE_PRINT } from './fine-print.mjs';
const require = createRequire(new URL('../../pilot-01-prototype/package.json', import.meta.url));
const { JSDOM } = require('jsdom');
const gsap = readFileSync(new URL('./node_modules/gsap/dist/gsap.min.js', import.meta.url), 'utf8');
const CARDS = ['E04', 'E05', 'E07', 'E12', 'E13', 'E24'];

for (const ep of ALL_EPISODES) test(`${ep}: season build, timeline and owner rules`, () => {
  const episode = JSON.parse(readFileSync(new URL(`./episodes/${ep}.json`, import.meta.url), 'utf8'));
  const r = spawnSync(process.execPath, ['build.mjs', `episodes/${ep}.json`, 'en'], { cwd: new URL('.', import.meta.url), encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  for (const format of ['landscape', 'portrait']) {
    const html = readFileSync(new URL(`build/${ep}-en-${format}/index.html`, import.meta.url), 'utf8');
    const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
    const w = dom.window; w.eval(gsap); w.eval(w.document.querySelectorAll('script')[1].textContent);
    assert.equal(w.__timelines.academy.duration(), schedule(episode).duration);
    const timeline = JSON.parse(readFileSync(new URL(`evidence/timeline-${ep}-en-${format}.json`, import.meta.url)));
    for (const scene of timeline.scenes) {
      w.academySeek(scene.hero);
      const visible = [...w.document.querySelectorAll('.scene')].filter((n) => w.getComputedStyle(n).visibility === 'visible');
      assert.deepEqual(visible.map((n) => n.id), [scene.id]);
      assert.ok(w.document.querySelector(`#${scene.id} .character.nexubo svg`), `${scene.id} mascot`);
    }
    assert.ok(w.document.querySelector('#brand-corner'), 'corner logo');
    // Frame text excluding spoken captions.
    const frame = w.document.querySelector('#academy').cloneNode(true);
    frame.querySelectorAll('.caption-band').forEach((n) => n.remove());
    const text = frame.textContent.replace(/\s+/g, ' ');
    for (const pattern of FINE_PRINT) assert.doesNotMatch(text, pattern);
    assert.doesNotMatch(text, /bitget\.cafe/i);
    const card = w.document.querySelector('.conversion-card');
    assert.equal(Boolean(card), CARDS.includes(ep));
    if (card) {
      assert.match(card.textContent, /nexualpha\.com\/go\/(okx|bitget|binance)/);
      assert.match(card.textContent, /Code /);
      assert.equal(card.querySelectorAll('.disclosure').length, 0);
    }
    const quiz = w.document.querySelector('.quiz');
    if (quiz) {
      const scene = quiz.closest('.scene'); const s = timeline.scenes.find((x) => x.id === scene.id);
      const verdict = quiz.querySelector('.quiz-verdict'), mark = quiz.querySelector('.quiz-mark');
      w.academySeek(s.start + 0.3);
      if (verdict) assert.equal(w.getComputedStyle(verdict).visibility, 'hidden', 'verdict hidden before the answer');
      if (mark) assert.equal(w.getComputedStyle(mark).visibility, 'hidden');
      w.academySeek(s.start + s.duration - 0.3);
      if (verdict) assert.equal(w.getComputedStyle(verdict).visibility, 'visible', 'verdict shown after the answer');
      w.academySeek(s.start + s.duration + 0.5);
      if (verdict) assert.equal(w.getComputedStyle(verdict).visibility, 'hidden', 'verdict does not leak into later scenes');
    }
    dom.window.close();
  }
});
