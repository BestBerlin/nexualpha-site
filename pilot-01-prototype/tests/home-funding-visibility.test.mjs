import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { useClientNow } from '../src/components/data/useMarketEvents.js';
import { visibilityClock } from './helpers/visibility-clock.mjs';

test('late funding section clocks only while visible and survives section replacement', async (t) => {
  const clock = visibilityClock(Date.parse('2026-10-23T00:00:00Z'));
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://nexualpha.com/' });
  const doc = dom.window.document;
  const saved = new Map(), observers = [], visibilityListeners = new Set();
  const originalNow = Date.now;
  let renders = 0, root;
  const install = (name, value) => {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  };
  Object.defineProperty(doc, 'visibilityState', { configurable: true, get: () => clock.documentRef.visibilityState });
  const add = doc.addEventListener.bind(doc), remove = doc.removeEventListener.bind(doc);
  doc.addEventListener = (type, fn, options) => {
    if (type === 'visibilitychange') visibilityListeners.add(fn);
    add(type, fn, options);
  };
  doc.removeEventListener = (type, fn, options) => {
    if (type === 'visibilitychange') visibilityListeners.delete(fn);
    remove(type, fn, options);
  };
  class Observer {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
    observe(target) { this.targets.add(target); }
    disconnect() { this.disconnected = true; this.targets.clear(); }
    emit(visible) { this.callback([...this.targets].map(target => ({ target, isIntersecting: visible }))); }
  }
  dom.window.matchMedia = () => ({ matches: false });
  install('window', dom.window);
  install('document', doc);
  install('IntersectionObserver', Observer);
  install('setTimeout', clock.setTimer);
  install('clearTimeout', clock.clearTimer);
  install('IS_REACT_ACT_ENVIRONMENT', true);
  Date.now = clock.now;
  t.after(async () => {
    if (root) await act(async () => { root.unmount(); });
    Date.now = originalNow;
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name];
    }
    dom.window.close();
  });

  // FundingBoard's callback-ref/enable contract, with the production clock hook.
  // Starting without a section reproduces the previously missed hydration seed.
  function FundingClock({ available }) {
    const [target, setTarget] = useState(null);
    const now = useClientNow(Boolean(target), null, target);
    renders++;
    return available ? React.createElement('section', { id: 'funding', ref: setTarget, 'data-now': now ?? '' }) : null;
  }
  const render = async available => act(async () => { root.render(React.createElement(FundingClock, { available })); });
  const advance = async ms => act(async () => { await clock.advance(ms); });
  const visibility = async state => act(async () => {
    clock.visibility(state);
    doc.dispatchEvent(new dom.window.Event('visibilitychange'));
  });
  root = createRoot(doc.getElementById('root'));
  await render(false);
  assert.equal(doc.getElementById('funding'), null);
  assert.equal(clock.timers.size, 0, 'absent funding creates no second clock');
  assert.equal(observers.length, 0);
  const absentRenders = renders;
  await advance(5000);
  assert.equal(renders, absentRenders);

  await render(true);
  assert.equal(observers.length, 1, 'late callback ref attaches an observer');
  assert.ok(observers[0].targets.has(doc.getElementById('funding')));
  await act(async () => { observers[0].emit(false); });
  const offscreenRenders = renders, offscreenCallbacks = clock.callbacks();
  await advance(5000);
  assert.equal(clock.timers.size, 0);
  assert.equal(clock.callbacks(), offscreenCallbacks);
  assert.equal(renders, offscreenRenders, 'late offscreen funding does not re-render each second');

  await act(async () => { observers[0].emit(true); });
  assert.equal(clock.timers.size, 1, 'one clock starts when the section becomes visible');
  assert.equal(Number(doc.getElementById('funding').dataset.now), clock.now());
  const visibleCallbacks = clock.callbacks();
  await advance(5000);
  assert.equal(clock.callbacks() - visibleCallbacks, 5, 'one callback per second while visible');
  assert.equal(Number(doc.getElementById('funding').dataset.now), clock.now());
  assert.equal(clock.timers.size, 1);

  await visibility('hidden');
  assert.equal(clock.timers.size, 0, 'hidden tab removes its clock');
  const hiddenRenders = renders, hiddenCallbacks = clock.callbacks();
  await advance(5000);
  assert.equal(renders, hiddenRenders);
  assert.equal(clock.callbacks(), hiddenCallbacks);
  await visibility('visible');
  assert.equal(clock.timers.size, 1);
  assert.equal(Number(doc.getElementById('funding').dataset.now), clock.now(), 'return immediately catches up the countdown');

  await act(async () => { observers[0].emit(false); });
  const stoppedRenders = renders;
  await advance(5000);
  assert.equal(clock.timers.size, 0);
  assert.equal(renders, stoppedRenders);
  await render(false);
  assert.ok(observers[0].disconnected);
  assert.equal(visibilityListeners.size, 0);
  await render(true);
  assert.equal(observers.length, 2, 'replacement section gets its own observer');
  await act(async () => { observers[1].emit(true); });
  assert.equal(clock.timers.size, 1);
  await act(async () => { root.unmount(); });
  root = null;
  assert.ok(observers[1].disconnected);
  assert.equal(clock.timers.size, 0);
  assert.equal(visibilityListeners.size, 0, 'unmount removes hook and scheduler listeners');
});
