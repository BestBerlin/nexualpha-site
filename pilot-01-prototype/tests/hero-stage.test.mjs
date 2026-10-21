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
  assert.match(css, /500ms cubic-bezier\(\.2,\.8,\.2,1\)/);
  assert.match(css, /animation-play-state:paused/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
test('localized SSR retains accessible rows and immediate values', async () => {
  const vite = await createServer({ appType:'custom', logLevel:'error', server:{middlewareMode:true} });
  try {
    const { render } = await vite.ssrLoadModule('/src/entry-server.jsx');
    for (const locale of ['zh-Hans','en','tr']) {
      const html = await render(`/?locale=${locale}`);
      assert.match(html, /class="hx-stage"/);
      assert.match(html, /class="hx-stage-art" aria-hidden="true"/);
      assert.match(html, /class="h7-sr" aria-label=/);
      assert.ok((html.match(/class="hx-stage-value" data-final-value="\d+"/g)||[]).length >= 3);
      assert.doesNotMatch(html, /class="hx-mac"/);
    }
  } finally { await vite.close(); }
});
