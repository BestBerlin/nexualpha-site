import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
test('ticker duplicates are hidden from accessibility and keyboard navigation', () => {
 const source = read('src/components/ticker/TickerBar.jsx');
 assert.match(source, /aria-hidden=\{hidden/);
 assert.match(source, /tabIndex=\{hidden \? -1/);
 assert.match(source, /locale=\{locale\} hidden/);
});
test('ticker motion is transform only and reduced motion is static', () => {
 const css = read('src/components/ticker/ticker.css');
 assert.match(css, /prefers-reduced-motion: reduce/);
 assert.match(css, /animation: none !important/);
 assert.match(css, /linear infinite/);
 assert.doesNotMatch(css, /view\(/);
 for (const frame of css.matchAll(/@keyframes[^}]+(?:\}[^}]+)*?\}\s*\}/g)) assert.doesNotMatch(frame[0], /(?:top|left|width|height|background|color)\s*:/);
});
test('campaign and control cycles honor reduced motion', () => {
 const shell = read('src/styles/v5/shell.css');
 const signature = read('src/styles/v8/site-signature.css');
 assert.match(shell, /#ffe27a/);
 assert.match(shell, /nx-campaign-sheen 9s/);
 assert.match(signature, /10s/);
 for (const css of [shell, signature]) assert.match(css, /prefers-reduced-motion: reduce/);
});
