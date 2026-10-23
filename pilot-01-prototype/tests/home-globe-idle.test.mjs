import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const { mountGlobe } = await import(process.env.GLOBE_TEST_MODULE || '../src/components/v7/home7-globe.js');
const source = readFileSync(new URL('../src/components/v7/home7-globe.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/v7/home7.src.css', import.meta.url), 'utf8');

function browser(t, { still = false, observers = true, media = true } = {}) {
  const dom = new JSDOM('<figure class="hx-stage"><svg><circle class="hx-globe-rim"/></svg><div class="hx-globe"></div><div class="hx-stage-node" data-venue="bitget"></div><div class="hx-stage-node" data-venue="okx"></div></figure>');
  const { document } = dom.window, stage = document.querySelector('figure'), host = stage.querySelector('.hx-globe');
  const chips = [...stage.querySelectorAll('.hx-stage-node')];
  const mediaHandlers = new Set(), observersList = [], resizes = [];
  let reads = 0, hidden = false, size = 400, globe;
  host.getBoundingClientRect = () => { reads++; return { width: size, height: size, left: 0, top: 0 }; };
  stage.querySelector('.hx-globe-rim').getBoundingClientRect = () => { reads++; return { width: size * .68, left: size * .16, top: size * .16 }; };
  chips.forEach((chip, index) => { chip.getBoundingClientRect = () => { reads++; return { left: index * (size - 80), right: index * (size - 80) + 80, top: 0, bottom: 40 }; }; });
  Object.defineProperty(document, 'hidden', { get: () => hidden });
  const motion = {
    matches: still,
    addEventListener(_, fn) { mediaHandlers.add(fn); },
    removeEventListener(_, fn) { mediaHandlers.delete(fn); },
  };
  class Observer {
    constructor(fn) { this.fn = fn; this.targets = []; observersList.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnected = true; }
  }
  class Resize extends Observer { constructor(fn) { super(fn); resizes.push(this); } }
  const forbidden = () => { throw new Error('The globe must never schedule animation frames or timers'); };
  const replacements = {
    document, window: { matchMedia: media ? () => motion : undefined },
    requestAnimationFrame: forbidden, setInterval: forbidden, setTimeout: forbidden,
    IntersectionObserver: observers ? Observer : undefined, ResizeObserver: observers ? Resize : undefined,
  };
  const saved = new Map();
  for (const [key, value] of Object.entries(replacements)) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  t.after(() => {
    globe?.destroy();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
    dom.window.close();
  });
  globe = mountGlobe(host, stage, still);
  const image = host.querySelector('img');
  return {
    globe, document, host, stage, image, chips, motion, observers: observersList, resizes,
    get reads() { return reads; }, get mediaListeners() { return mediaHandlers.size; },
    load() { image.onload?.(); },
    intersect(visible) { observersList[0].fn([{ isIntersecting: visible }]); },
    hide(value) { hidden = value; document.dispatchEvent(new dom.window.Event('visibilitychange')); },
    preference(value) { motion.matches = value; for (const fn of mediaHandlers) fn({ matches: value }); },
    resize(value) { size = value; resizes[0].fn(); },
  };
}

test('globe has no animation frame loop or timers; CSS owns the continuous 72-second rotation', () => {
  assert.doesNotMatch(source, /\b(?:requestAnimationFrame|cancelAnimationFrame|setInterval|setTimeout)\s*\(/);
  assert.match(css, /animation:hx-earth-turn 72s linear infinite/);
  assert.match(css, /@keyframes hx-earth-turn\{to\{transform:translateX\(-50%\)\}\}/);
  assert.match(css, /@keyframes hx-earth-flow\{to\{offset-distance:100%\}\}/);
  assert.doesNotMatch(source, /pointermove|pointerenter|IDLE_MS|performance\.now/);
});

test('one texture covers two periods, waits for readiness, and survives selection/resize without rebuilding', (t) => {
  const b = browser(t);
  assert.equal(b.stage.hasAttribute('data-live'), false, 'SSR is kept while the texture loads');
  assert.equal(b.stage.dataset.paused, 'false', 'visible globe keeps turning without an idle deadline');
  b.load();
  assert.ok(b.stage.hasAttribute('data-live'));
  const texture = b.image.src;
  const svg = new JSDOM(decodeURIComponent(texture.split(',').slice(1).join(',')), { contentType: 'image/svg+xml' });
  assert.equal(svg.window.document.documentElement.getAttribute('viewBox'), '0 0 1440 360');
  assert.equal(svg.window.document.querySelectorAll('use').length, 2);
  assert.equal(svg.window.document.querySelectorAll('use')[1].getAttribute('x'), '720');
  assert.ok(svg.window.document.querySelector('path').getAttribute('d').length > 10000, 'real dotted land mask');
  svg.window.close();
  assert.equal(b.host.querySelector('.hx-earth-disc').style.width, '272px', 'matches sphere rim, not halo');
  b.globe.select('okx');
  assert.equal(b.host.querySelector('.hx-earth-routes [data-on="true"]').dataset.venue, 'okx');
  b.chips[1].dataset.venue = 'binance';
  b.globe.select('binance');
  assert.equal(b.host.querySelector('.hx-earth-routes [data-on="true"]').dataset.venue, 'binance', 'React can replace the last chip');
  b.resize(600);
  assert.ok(Math.abs(parseFloat(b.host.querySelector('.hx-earth-disc').style.width) - 408) < 1e-9);
  assert.equal(b.image.src, texture);
  assert.equal(b.host.querySelector('img'), b.image);
  assert.equal(b.host.querySelectorAll('img').length, 1);
  assert.equal(b.stage.dataset.paused, 'false');
  assert.equal(b.resizes[0].targets.length, 3, 'host plus variable-width chips');
  const reads = b.reads;
  b.hide(true); b.hide(false); b.intersect(false); b.intersect(true);
  assert.equal(b.reads, reads, 'pause/resume never reads layout');
});

test('hidden/offscreen globes pause CSS and resume without requiring interaction', (t) => {
  const b = browser(t);
  b.intersect(false);
  assert.equal(b.stage.dataset.paused, 'true');
  b.hide(true); b.intersect(true);
  assert.equal(b.stage.dataset.paused, 'true');
  b.hide(false);
  assert.equal(b.stage.dataset.paused, 'false');
  b.intersect(false); b.hide(false);
  assert.equal(b.stage.dataset.paused, 'true');
  b.intersect(true);
  assert.equal(b.stage.dataset.paused, 'false');
  assert.match(css, /\[data-paused="true"\] \.hx-earth \*\{animation-play-state:paused!important\}/);
});

test('reduced motion remains static on selection and responds to preference changes', (t) => {
  const b = browser(t, { still: true });
  assert.equal(b.stage.dataset.paused, 'true');
  b.globe.select('okx'); b.intersect(true); b.hide(false);
  assert.equal(b.stage.dataset.paused, 'true');
  b.preference(false);
  assert.equal(b.stage.dataset.paused, 'false');
  b.preference(true);
  assert.equal(b.stage.dataset.paused, 'true');
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{@ \.hx-earth\{transition:none\}@ \.hx-earth \*\{animation:none!important\}@ \.hx-earth-pulse\{display:none\}\}/);
});

test('missing optional observer/media APIs preserve a static reduced-motion fallback', (t) => {
  const b = browser(t, { still: true, observers: false, media: false });
  b.load(); b.globe.select('okx');
  assert.equal(b.stage.dataset.paused, 'true');
  b.hide(true); b.hide(false);
  assert.equal(b.stage.dataset.paused, 'true');
  assert.equal(b.observers.length, 0);
});

test('destroy removes the renderer, listeners and observers; late callbacks are harmless', (t) => {
  const b = browser(t), lateLoad = b.image.onload;
  const root = b.host.firstElementChild;
  b.load();
  b.globe.destroy();
  assert.equal(b.host.children.length, 0);
  assert.equal(b.stage.hasAttribute('data-live'), false);
  assert.equal(b.stage.hasAttribute('data-paused'), false);
  assert.equal(b.mediaListeners, 0);
  assert.ok(b.observers.every(o => o.disconnected));
  assert.equal(b.image.onload, null);
  const reads = b.reads;
  lateLoad(); b.intersect(true); b.hide(true); b.resize(600); b.globe.select('okx'); b.globe.destroy();
  assert.equal(b.reads, reads);
  assert.equal(b.stage.hasAttribute('data-live'), false);
  assert.equal(b.stage.hasAttribute('data-paused'), false);
  assert.ok(!root.isConnected);
});
