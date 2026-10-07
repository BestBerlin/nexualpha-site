import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/styles/release-visual-gates.css', import.meta.url), 'utf8');
const helper = source.slice(source.indexOf('function activateMobileMenu('), source.indexOf('function Header('));
function setup(matches = false) {
  const listeners = new Map();
  const media = { matches, addEventListener: (key, fn) => listeners.set(`media:${key}`, fn), removeEventListener: (key) => listeners.delete(`media:${key}`) };
  const focus = [];
  const trigger = { isConnected: true, focus: () => focus.push('trigger') };
  const desktopLink = { isConnected: true, focus: () => focus.push('desktop') };
  const dialog = {
    open: false,
    addEventListener: (key, fn) => listeners.set(key, fn),
    removeEventListener: (key) => listeners.delete(key),
    showModal() { this.open = true; focus.push('native-modal'); },
    close() { this.open = false; },
    querySelector: () => ({ focus: () => focus.push('close') }),
  };
  const document = { body: { style: { overflow: 'scroll' } } };
  let closed = 0;
  const context = vm.createContext({ window: { matchMedia: (query) => { assert.equal(query, '(min-width: 781px)'); return media; } }, document });
  vm.runInContext(helper, context);
  const cleanup = context.activateMobileMenu(dialog, trigger, { querySelector: () => desktopLink }, () => closed++);
  return { listeners, media, focus, trigger, document, dialog, cleanup, get closed() { return closed; } };
}

test('opening uses native modal isolation and moves focus inside', () => {
  const state = setup();
  assert.deepEqual(state.focus, ['native-modal', 'close']);
  assert.equal(state.document.body.style.overflow, 'hidden');
  assert.equal(state.dialog.open, true);
  state.cleanup();
});
test('native Escape cancel requests close, cleanup restores focus and body', () => {
  const state = setup(); let prevented = false;
  state.listeners.get('cancel')({ preventDefault: () => prevented = true });
  assert.equal(prevented, true); assert.equal(state.closed, 1);
  state.cleanup();
  assert.equal(state.dialog.open, false);
  assert.equal(state.document.body.style.overflow, 'scroll');
  assert.equal(state.focus.at(-1), 'trigger');
  assert.equal(state.listeners.size, 0);
});
test('desktop transition closes and restores a visible desktop navigation target', () => {
  const state = setup(); state.media.matches = true;
  state.listeners.get('media:change')({ matches: true });
  assert.equal(state.closed, 1); state.cleanup();
  assert.equal(state.focus.at(-1), 'desktop');
});
test('opening at desktop never creates an invisible modal', () => {
  const state = setup(true);
  assert.equal(state.closed, 1);
  assert.deepEqual(state.focus, ['desktop']);
  assert.equal(state.document.body.style.overflow, 'scroll');
  assert.equal(state.listeners.size, 0);
});
test('cleanup does not focus disconnected trigger', () => {
  const state = setup(); state.trigger.isConnected = false;
  state.cleanup(); assert.equal(state.focus.at(-1), 'close');
});
test('menu renders a named native dialog and keeps native navigation href mapping', () => {
  const header = source.slice(source.indexOf('function Header('), source.indexOf('export function App('));
  assert.match(header, /<dialog ref=\{mobileMenuRef\}[^>]+aria-label=\{copy.ui.menu\}/);
  assert.match(header, /onKeyDown=\{\(event\) => event.stopPropagation\(\)\}/);
  assert.match(header, /<nav aria-label=\{copy.ui.menu\}>/);
  assert.match(header, /href=\{href\} onClick=\{\(\) => setMobileOpen\(false\)\}/);
});
test('short viewport menu owns scroll, safe area and full dynamic viewport', () => {
  assert.match(css, /height: 100dvh/); assert.match(css, /overflow-y: auto/);
  assert.match(css, /overscroll-behavior: contain/);
  for (const edge of ['top', 'right', 'bottom', 'left']) assert.ok(css.includes(`env(safe-area-inset-${edge})`));
  assert.match(css, /\.mobile-search-overlay > nav \{ display: contents; \}/);
});
