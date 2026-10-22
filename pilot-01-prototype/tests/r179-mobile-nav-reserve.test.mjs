import { existsSync as historicalFixtureExists } from 'node:fs';
// Only historical comparisons need this external review snapshot. Local checks run.
const historicalFixture = new URL("../../../r170-mobile-navigation/candidate/src/components/v3/MobileBottomNav.jsx", import.meta.url);
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { buildSync } from 'esbuild';

const req = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const base = fileURLToPath(new URL('../../../r170-mobile-navigation/candidate/', import.meta.url));
const read = (p, r = root) => readFileSync(path.join(r, p), 'utf8');

function loadMobileBottomNav() {
  const file = path.join(root, 'src/components/v3/MobileBottomNav.jsx');
  const output = buildSync({
    entryPoints: [file],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    loader: { '.css': 'empty' },
    external: ['react', 'react/jsx-runtime'],
  }).outputFiles[0].text;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: (name) => name === 'react' ? req('react') : req(name), URL, URLSearchParams });
  return module.exports;
}

function styleStore(initial = '') {
  const map = new Map(initial ? [['--mobile-bottom-nav-height', initial]] : []);
  return {
    getPropertyValue: (name) => map.get(name) || '',
    setProperty: (name, value) => map.set(name, value),
    removeProperty: (name) => map.delete(name),
    entries: () => Object.fromEntries(map),
  };
}

class FakeResizeObserver {
  static instances = [];
  constructor(callback) { this.callback = callback; this.observed = []; this.disconnected = false; FakeResizeObserver.instances.push(this); }
  observe(node) { this.observed.push(node); }
  disconnect() { this.disconnected = true; }
  emit(height) { this.callback([{ contentRect: { height } }]); }
}

test('R179 reserve helper measures rendered nav height, tracks ResizeObserver updates, and restores cleanup state', () => {
  FakeResizeObserver.instances = [];
  const mod = loadMobileBottomNav();
  assert.equal(typeof mod.syncMobileBottomNavReserve, 'function');
  const style = styleStore('72px');
  const rootNode = { style };
  let renderedHeight = 88.25;
  const nav = { getBoundingClientRect: () => ({ height: renderedHeight }) };
  const cleanup = mod.syncMobileBottomNavReserve(nav, rootNode, FakeResizeObserver);
  assert.equal(style.getPropertyValue('--mobile-bottom-nav-height'), '89px');
  assert.equal(FakeResizeObserver.instances.length, 1);
  assert.deepEqual(FakeResizeObserver.instances[0].observed, [nav]);
  renderedHeight = 104.1;
  FakeResizeObserver.instances[0].emit(64);
  assert.equal(style.getPropertyValue('--mobile-bottom-nav-height'), '105px', 'observer content box must only trigger a new border-box measurement');
  cleanup();
  assert.equal(FakeResizeObserver.instances[0].disconnected, true);
  assert.equal(style.getPropertyValue('--mobile-bottom-nav-height'), '72px');
});

test('R179 reserve helper removes the inline reserve when the dock is not rendered or measured at zero height', () => {
  FakeResizeObserver.instances = [];
  const mod = loadMobileBottomNav();
  const style = styleStore();
  const rootNode = { style };
  const nav = { getBoundingClientRect: () => ({ height: 0 }) };
  const cleanup = mod.syncMobileBottomNavReserve(nav, rootNode, FakeResizeObserver);
  assert.equal(style.getPropertyValue('--mobile-bottom-nav-height'), '');
  FakeResizeObserver.instances[0].emit(0);
  assert.deepEqual(style.entries(), {});
  cleanup();
  assert.deepEqual(style.entries(), {});
});

test('R179 CSS uses measured nav height with a small gap instead of the old fixed 80px scroll reserve', () => {
  const css = read('src/components/v3/mobile-bottom-nav.css');
  assert.match(css, /--mobile-bottom-nav-height/);
  assert.match(css, /scroll-padding-bottom:\s*calc\(var\(--mobile-bottom-nav-height, 80px\) \+ 8px\)/);
  assert.doesNotMatch(css, /scroll-padding-bottom:\s*calc\(80px \+ env\(safe-area-inset-bottom/);
});



test('R179 source is exactly R170 after reversing the reserve helper, nav ref, effect, and two CSS reserve hunks', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  const currentJsx = read('src/components/v3/MobileBottomNav.jsx')
    .replace('import React, { useEffect, useRef, useState } from "react";', 'import React, { useEffect, useState } from "react";')
    .replace(/\n\nconst MOBILE_BOTTOM_NAV_HEIGHT_VAR = "--mobile-bottom-nav-height";[\s\S]*?\n\/\/ Current location only;/, '\n// Current location only;')
    .replace('  const navRef = useRef(null);\n  useEffect(() => syncMobileBottomNavReserve(navRef.current), []);\n\n', '')
    .replace('<nav ref={navRef} className="mobile-bottom-nav"', '<nav className="mobile-bottom-nav"');
  assert.equal(currentJsx, read('src/components/v3/MobileBottomNav.jsx', base));

  const currentCss = read('src/components/v3/mobile-bottom-nav.css')
    .replace('  body:has(.mobile-bottom-nav) {\n    --mobile-bottom-nav-reserve: calc(var(--mobile-bottom-nav-height, 80px) + 8px);\n    padding-bottom: var(--mobile-bottom-nav-reserve);\n  }', '  body:has(.mobile-bottom-nav) {\n    padding-bottom: var(--mobile-bottom-nav-reserve, calc(64px + env(safe-area-inset-bottom, 12px)));\n  }')
    .replace('    scroll-padding-bottom: calc(var(--mobile-bottom-nav-height, 80px) + 8px);', '    scroll-padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));');
  assert.equal(currentCss, read('src/components/v3/mobile-bottom-nav.css', base));
});
