import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const prior=p=>readFileSync(new URL('../../../r128-home-mobile/candidate/'+p,import.meta.url),'utf8');
const css=()=>read('src/styles/reader-foundation.css');
function rule(selector){const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const m=css().match(new RegExp(escaped+'\\s*\\{([^}]+)\\}'));assert.ok(m,selector);return m[1];}
test('reader stylesheet reaches shared index CSS on SSR and hydration without route filtering',()=>{
 const main=read('src/main.jsx'),imports=[...main.matchAll(/import "([^\"]+\.css)"/g)].map(m=>m[1]);
 const foundation=imports.indexOf('./styles/reader-foundation.css');assert.ok(foundation>=0);
 assert.equal(imports.filter(x=>x==='./styles/reader-foundation.css').length,1);
 for(const earlier of ['./styles/fintech-premium.css','./styles/breakpoints.css'])assert.ok(imports.indexOf(earlier)>=0&&foundation>imports.indexOf(earlier),earlier);
 // R130 material may follow the reader foundation. It must not undo reading,
 // wrapping, touch/focus geometry, content, or semantic reader variables.
 for(const path of imports.slice(foundation+1)){
  const later=read('src/'+path.slice(2)).replace(/\/\*[\s\S]*?\*\//g,'');
  assert.ok(!/(?:^|[;{])\s*(?:font(?:-[a-z-]+)?|line-height|letter-spacing|white-space|text-overflow|overflow(?:-[a-z-]+)?|min-block-size|content|--reader-(?:support|meta)[a-z-]*)\s*:/m.test(later),path);
 }
 assert.equal(css(),readFileSync(new URL('../../../r129-editorial-system/candidate/src/styles/reader-foundation.css',import.meta.url),'utf8'));

 assert.ok(read('worker/index.js').includes('SHARED_ROUTE_STYLE_PREFIXES = Object.freeze(["index-"'));
 assert.ok(!read('vite.config.mjs').includes('reader-foundation')); // no route-only classification
});
test('source reading uses rem roles, complete wrapped source titles and 44px touch targets',()=>{
 assert.match(css(),/--reader-support-size:\s*\.875rem/);assert.match(css(),/--reader-meta-size:\s*\.8125rem/);
 for(const s of ['.v3-page .v3-source-list a','.topic-guide-page .topic-source-register__item a','.v3-page .v3-versus-source-link']){
 const d=rule(s);assert.match(d,/min-block-size:\s*44px/);assert.match(d,/white-space:\s*normal/);assert.match(d,/overflow-wrap:\s*anywhere/);
 }
 const link=rule('.v3-page .v3-versus-source-link');assert.match(link,/max-width:\s*100%/);assert.match(link,/overflow:\s*visible/);
 assert.match(rule('.v3-page .v3-versus-source-link .v3-versus-source-name'),/min-width:\s*0/);
 assert.match(rule('.topic-guide-page .topic-source-register__item > small'),/var\(--reader-meta-size\)/);
 assert.match(rule('.v3-page .v3-source-list__meta span'),/letter-spacing:\s*0/);
 assert.match(css(),/:focus-visible/);assert.match(css(),/text-decoration:\s*underline/);
});
test('narrow foundation never overrides browser preferences, surfaces, CTA fill or content',()=>{
 const t=css();assert.ok(!/!important|--surface-|--blue\s*:|--muted\s*:|html\s*\{|body\s*\{|button\s*\{|display:\s*none|content\s*:/.test(t));
 assert.match(rule('.crawl-priority-links__groups .crawl-priority-links__group > span'),/color:\s*var\(--blue-text\)/);
 for(const f of ['src/styles/tokens.css','src/styles/fintech-premium.css','src/components/v3/v3.css','src/data/partner-registry.js','src/data/topic-source-registry.js'])assert.equal(read(f),prior(f),f);
 assert.equal(createHash('sha256').update(read('src/data/partner-registry.js')).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});

test('actual SourceList SSR preserves complete source URLs/titles/language attributes and unknown gate',async()=>{
 const {createRequire}=await import('node:module'),{default:vm}=await import('node:vm');
 const req=createRequire(new URL('../../../../pilot-01-prototype/package.json',import.meta.url));
 const React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{transformSync}=req('esbuild');
 const extract=t=>t.slice(t.indexOf('function SourceList('),t.indexOf('\nfunction ActivityCards(',t.indexOf('function SourceList(')));
 const current=extract(read('src/components/v3/V3Pages.jsx')),before=extract(prior('src/components/v3/V3Pages.jsx'));assert.equal(current,before);
 const module={exports:{}};vm.runInNewContext(transformSync('import React from "react";'+current+'\nexport {SourceList};',{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,require:()=>React,URL});
 const profile={officialDomain:'example.org',sourceHost:'docs.example.org',sourceHubs:[{url:'https://docs.example.org/complete?ref=preserve&source=full#method',label:'A complete lengthy source title / 日本語 / 한국어 / العربية'}]};
 for(const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it']){
  const text={sourceIntake:`${locale} sources`,officialDomain:`${locale} domain`,sourceHost:`${locale} host`,pendingReview:`${locale} pending`};
  const html=renderToStaticMarkup(React.createElement(module.exports.SourceList,{text,profile}));
  assert.ok(html.includes('https://docs.example.org/complete?ref=preserve&amp;source=full#method'));assert.ok(html.includes(profile.sourceHubs[0].label));assert.ok(html.includes('translate="no" lang="en" dir="ltr"'));assert.ok(!html.includes('<details'));
  const pending=renderToStaticMarkup(React.createElement(module.exports.SourceList,{text,profile:{sourceHubs:[]}}));assert.ok(pending.includes(text.pendingReview));assert.ok(!pending.includes('<a '));
 }
});
