import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const req=createRequire(new URL('../package.json',import.meta.url));
const React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{transformSync}=req('esbuild');
const source=readFileSync(new URL('../src/components/v3/OnChainLiquidityBoard.jsx',import.meta.url),'utf8');
const before=readFileSync(new URL('../../../r123-interaction-repair/candidate/src/components/v3/OnChainLiquidityBoard.jsx',import.meta.url),'utf8');
function compile(text){const module={exports:{}};vm.runInNewContext(transformSync(text,{loader:'jsx',format:'cjs'}).code,{React,module,exports:module.exports,require:name=>name==='react'?React:{BrandMark:()=>null,partnerRegistry:{},venueDatabase:{}}});return module.exports.OnChainLiquidityBoard;}
const render=(Page,locale)=>renderToStaticMarkup(React.createElement(Page,{locale,headingLevel:1}));
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
test('all locale explanations stay available while actual review steps precede closed detail',()=>{
 for(const locale of locales){const html=render(compile(source),locale),old=render(compile(before),locale);
 assert.match(html,/<details class="onchain-board__method">/);
 assert.equal((html.match(/type="checkbox"/g)||[]).length,3);
 assert.ok(!html.includes('checked=""'));
 for(const match of old.matchAll(/<(?:p|small|li|h[12])[^>]*>([^<]+)<\//g))assert.ok(html.includes(match[1]),`${locale} preserves original copy`);
 assert.ok(html.indexOf('onchain-board__checklist')<html.indexOf('onchain-board__method'));
 assert.equal((html.match(/<h1/g)||[]).length,1);
 assert.ok(!html.includes('<table'));
 assert.match(html,/data-source-reviewed-at="2026-09-15"/);
 }
});
test('review checklist cannot create or alter partner routes',()=>{const hash=createHash('sha256').update(readFileSync(new URL('../src/data/partner-registry.js',import.meta.url))).digest('hex');assert.equal(hash,'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');assert.match(source,/const LIQUIDITY_VENUES = \[\]/);assert.ok(!/localStorage|fetch\(/.test(source));});
