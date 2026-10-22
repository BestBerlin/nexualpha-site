import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { readFileSync } from 'node:fs';
const source = readFileSync('src/components/v7/HomeV7.jsx', 'utf8');
const css = readFileSync('src/styles/v7/home7.src.css', 'utf8');
test('stage shares actual hero state without a separate volume demo', () => {
  assert.match(source, /<RebateStage locale={locale} picks={heroPicks} venues={venues} sel={sel} volume={heroVolume}/);
  assert.doesNotMatch(source, /hx-mac|useScreenDemo|animateMotion/);
  assert.match(source, /data-final-value={Math.round\(back\)}/);
  // Globe (2026-10-22): the canvas module is a dynamic import started after load; the server renders a still SVG globe.
  assert.match(source, /import\("\.\/home7-globe\.js"\)/);
  assert.doesNotMatch(source, /^import [^\n]*home7-globe/m, 'never a static import (home entry budget)');
  assert.match(source, /requestIdleCallback/);
  assert.match(css, /\.hx-stage\[data-live\]/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  const globe = readFileSync('src/components/v7/home7-globe.js', 'utf8');
  assert.match(globe, /if \(still\) \{ draw\(0\); return; \}/, 'reduced motion paints one still frame');
  assert.match(globe, /document\.hidden/);
  assert.match(globe, /IntersectionObserver/);
});
test('localized SSR retains accessible rows and immediate values', async () => {
  const vite = await createServer({ appType:'custom', logLevel:'error', server:{middlewareMode:true} });
  try {
    const { render } = await vite.ssrLoadModule('/src/entry-server.jsx');
    for (const locale of ['zh-Hans','en','tr']) {
      const html = await render(`/?locale=${locale}`);
      assert.match(html, /class="hx-stage"/);
      assert.match(html, /class="hx-stage-art" aria-hidden="true"/);
      assert.match(html, /class="hx-globe-svg"/);
      assert.match(html, /class="h7-sr" aria-label=/);
      assert.ok((html.match(/class="hx-stage-value" data-final-value="\d+"/g)||[]).length >= 3);
      assert.doesNotMatch(html, /class="hx-mac"/);
    }
  } finally { await vite.close(); }
});
