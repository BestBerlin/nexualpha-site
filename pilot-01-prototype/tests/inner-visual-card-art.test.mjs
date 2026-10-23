import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const code = (await build({
  entryPoints: ['src/components/shared/CardArt.jsx'], bundle: true, write: false,
  format: 'cjs', platform: 'node', jsx: 'automatic', external: ['react', 'react/jsx-runtime'],
})).outputFiles[0].text;
const mod = { exports: {} };
vm.runInNewContext(code, { module: mod, exports: mod.exports, require });
const CardArt = mod.exports.default;
const art = (item, priority = false) => renderToStaticMarkup(React.createElement(CardArt, { item, priority }));

test('shared art is deterministic and decorative, and priority logos reserve their size', () => {
  const item = { href: '/news/binance-vs-okx', categoryKey: 'comparison' };
  assert.equal(art(item), art(item));
  const html = art(item, true);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /data-n="2"/);
  assert.match(html, /data-brand-slug="binance"/);
  assert.match(html, /data-brand-slug="okx"/);
  assert.match(html, /loading="eager"/);
  assert.match(html, /width="40" height="40"/);
  assert.doesNotMatch(html, /<a\b/);
});
test('ambiguous everyday words do not invent related exchanges', () => {
  assert.doesNotMatch(art({ href: '/news/a-bullish-curve', categoryKey: 'research' }), /data-brand-slug=/);
  assert.match(art({ href: '/news/guide', categoryKey: 'guide', venues: ['curve'] }), /data-brand-slug="curve"/);
  assert.match(art({ href: '/news/unknown', categoryKey: 'unknown' }), /h7-lt-glyph/);
});
test('home consumes art from shared module with no reverse home dependency', () => {
  const shared = readFileSync('src/components/shared/CardArt.jsx', 'utf8');
  const home = readFileSync('src/components/v7/home7-below.jsx', 'utf8');
  assert.doesNotMatch(shared, /from ["'][^"']*home7/);
  assert.match(home, /import CardArt from "\.\.\/shared\/CardArt.jsx"/);
  assert.doesNotMatch(home, /function CardArt/);
  assert.match(readFileSync('src/components/shared/card-art.css', 'utf8'), /aspect-ratio:1200\/630/);
});

const builtHtml = 'dist/client/index.html';
test('built home entry excludes the extracted art and venue icon helpers', { skip: !existsSync(builtHtml) && 'run after npm run build' }, () => {
  const html = readFileSync(builtHtml, 'utf8');
  const entry = html.match(/<script\b[^>]*type="module"[^>]*src="[^"]*\/assets\/(index-[\w-]+\.js)"/)?.[1];
  assert.ok(entry, 'module entry exists');
  const seen = new Set();
  const queue = [entry];
  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    seen.add(name);
    assert.doesNotMatch(name, /^(?:shared-registration-helpers|home-below-fold|route-v3-venue)-/);
    const source = readFileSync(path.join('dist/client/assets', name), 'utf8');
    assert.doesNotMatch(source, /h7-lt-img|vx-icon/, 'art and icons remain outside entry closure');
    for (const match of source.matchAll(/import(?:\s*[^;"']*?from\s*)?\s*"\.\/([\w-]+\.js)"/g)) queue.push(match[1]);
  }
});
