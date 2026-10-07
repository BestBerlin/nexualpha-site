import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// SSR paints before lazy route modules execute. Critical comparison geometry
// must be in the linked entry stylesheet, independently of ResearchPanels.
test('comparison first paint has its final column, title and disclosure geometry', () => {
  const html = readFileSync(new URL('../dist/client/index.html', import.meta.url), 'utf8');
  const entryCss = html.match(/href="(\/assets\/index-[^"]+\.css)"/);
  assert.ok(entryCss, 'compiled entry stylesheet exists');
  const css = readFileSync(new URL('../dist/client' + entryCss[1], import.meta.url), 'utf8');
  assert.match(css, /\.v3-compare-page \.v3-page-hero\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.match(css, /\.v3-compare-page \.v3-page-hero \.v3-venue-hero\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/);
  assert.match(css, /\.v3-compare-page \.v3-page-hero h1\s*\{[^}]*font-size:\s*clamp\(30px,\s*3vw,\s*46px\)/);
  assert.match(css, /\.v3-compare-support-disclosure>summary\s*\{[^}]*display:\s*flex/);
});
