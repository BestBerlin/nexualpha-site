import test from 'node:test';
import assert from 'node:assert/strict';
import { storedLocale, validComparison, cleanSelection, scrollToHash, installHashNavigation } from '../src/data/browser-state.js';

test('blocked storage cannot prevent initial page rendering', () => {
  assert.equal(storedLocale({ getItem() { throw new Error('denied'); } }, 'locale', ['en', 'it']), 'en');
  assert.equal(storedLocale({ getItem() { return 'it'; } }, 'locale', ['en', 'it']), 'it');
  assert.equal(storedLocale({ getItem() { return 'invalid'; } }, 'locale', ['en', 'it']), 'en');
});
test('stale saved selection cannot consume invisible comparison slots', () => {
  const venues = [{slug:'binance'}, {slug:'okx'}, {slug:'bybit'}];
  assert.deepEqual(cleanSelection(['unknown','binance','binance','okx'], venues), ['binance','okx']);
  assert.deepEqual(cleanSelection(null, venues), []);
});
test('comparison must retain exactly two or three distinct known venues', () => {
  const venues = [{slug:'binance'}, {slug:'okx'}, {slug:'bybit'}];
  assert.deepEqual(validComparison('binance-vs-okx', venues), ['binance','okx']);
  for (const value of ['binance-vs-binance', 'binance-vs-okx-vs-unknown', 'binance', '']) assert.equal(validComparison(value, venues), null);
});
test('rendered hash target scrolls by ID safely, including encoded IDs', () => {
  let found; let options;
  const doc = { getElementById(id) { found = id; return id === 'registration-path' ? {scrollIntoView(value) { options = value; }} : null; } };
  assert.equal(scrollToHash(doc, '#registration%2Dpath'), true);
  assert.equal(found, 'registration-path');
  assert.equal(options.block, 'start');
  assert.equal(scrollToHash(doc, '#missing'), false);
  assert.equal(scrollToHash(doc, '#%'), false);
});

test('lazy route hash is retried when page content is ready and cleanup stops work', async () => {
  const listeners = new Map();
  const frames = new Map();
  let frameId = 0; let target = null; let scrolls = 0;
  const win = {
    location: { hash: '#treasury-evidence-checklist' },
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name, callback) { if (listeners.get(name) === callback) listeners.delete(name); },
    requestAnimationFrame(callback) { const id = ++frameId; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
  };
  const doc = { fonts: { ready: Promise.resolve() }, getElementById(id) { return id === 'treasury-evidence-checklist' ? target : null; } };
  const flush = async () => { await Promise.resolve(); for (const [id, callback] of [...frames]) { frames.delete(id); callback(); } };
  const dispose = installHashNavigation(doc, win);
  await flush();
  assert.equal(scrolls, 0, 'initial lazy target is absent');
  target = { scrollIntoView() { scrolls++; } };
  listeners.get('nexualpha:interaction-ready')({ detail: { scope: 'command-finder' } });
  await flush();
  assert.equal(scrolls, 0, 'unrelated ready signals must not steal scroll');
  listeners.get('nexualpha:interaction-ready')({ detail: { scope: 'page-content' } });
  await flush();
  assert.equal(scrolls, 1, 'the committed route target is revealed');
  listeners.get('hashchange')();
  dispose();
  await flush();
  assert.equal(scrolls, 1, 'pending font/frame work cannot scroll after disposal');
  assert.equal(listeners.size, 0);
  assert.equal(frames.size, 0);
});
