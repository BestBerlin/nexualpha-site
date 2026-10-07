import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const css=fs.readFileSync(new URL('../src/styles/profile-refinement.css',import.meta.url),'utf8');
const lock=JSON.parse(fs.readFileSync(new URL('../../VISUAL-BEHAVIOR-LOCK.json',import.meta.url)));
test('whole profile visual roles remain scoped and preserve type/geometry/content',()=>{
 const s=css.replace(/\/\*[\s\S]*?\*\//g,'');
 for(const m of s.matchAll(/([^{}]+)\{/g)){const selector=m[1].trim();if(selector.startsWith('@media'))continue;for(const part of selector.split(','))assert.ok(part.trim().startsWith('.v3-profile-page'),part);}
 assert.doesNotMatch(s,/font-size:|font-family:|line-height:|max-inline-size:|max-width:|grid-template|display:|visibility:|overflow:|ellipsis|line-clamp|(?:^|[;{])\s*height:|transition:\s*all|content-visibility:|contain-intrinsic-size:/);
 assert.match(s,/similar-disclosure:not\(\[open\]\)\s*\{\s*padding-block:\s*0/);
 assert.match(s,/min-block-size:\s*56px/);
 for(const role of ['venue-identity','venue-direct-answer','venue-readiness','registration-card','v3-metric-tile','v3-por-card','v3-faq-card','v3-activity-panel--empty','v3-alternative-list'])assert.ok(s.includes(role),role);
 assert.match(s,/primary-btn \{ transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease/);
 assert.match(s,/primary-btn:hover \{ transform: none/);
 assert.match(s,/:focus-visible/);assert.match(s,/prefers-reduced-motion:\s*reduce/);assert.match(s,/pointer:\s*coarse/);
 assert.doesNotMatch(s,/outline:\s*(none|0)\b/);
});
test('source, registration logic and immutable invitation registry retain original bytes',()=>{for(const[f,h]of Object.entries(lock))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+f,import.meta.url))).digest('hex'),h,f);assert.equal(lock['src/data/partner-registry.js'],'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');});
