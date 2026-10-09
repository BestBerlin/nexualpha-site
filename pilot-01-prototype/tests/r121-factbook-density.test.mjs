import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import * as registry from '../src/data/factbook-registry.js';
import { neutralVenueCatalog } from '../src/data/market-command.js';
import { localizedHref } from '../src/data/locale-routing.js';
import { publicCtaForVenue } from '../src/data/source-bound-cta.js';
const req = createRequire(new URL('../package.json', import.meta.url));
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server'), { transformSync } = req('esbuild');
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];
const source=readFileSync(new URL('../src/components/v3/FactbookPage.jsx',import.meta.url),'utf8');
const baseline=readFileSync(new URL('../../../r120-editorial-quality/candidate/src/components/v3/FactbookPage.jsx',import.meta.url),'utf8');
const mocks={...registry,neutralVenueCatalog,localizedHref,publicCtaForVenue,BrandMark:()=>React.createElement('span'),DecisionPathRail:()=>null};
function compile(src){const module={exports:{}};vm.runInNewContext(transformSync(src+'\nexport { publicFactbookVenue };',{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,React,require:name=>name==='react'?React:mocks});return module.exports;}
const current=compile(source),before=compile(baseline);
const render=(module,slug,locale)=>renderToStaticMarkup(React.createElement(module.FactbookPage,{slug,locale,market:'BR',product:'spot'}));
const hrefs=html=>[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
const rates=html=>html.match(/<section class="factbook-section" id="rates">([\s\S]*?)<\/section>/)?.[1];
test('24 venues × 15 locales preserve every original route, field row, date and pending boundary',()=>{
 for(const slug of registry.FACTBOOK_SLUGS)for(const locale of locales){
  const html=render(current,slug,locale),old=render(before,slug,locale),section=rates(html);
  assert.deepEqual(hrefs(html),hrefs(old),`${slug}:${locale} hrefs`);
  assert.ok(html.includes(registry.AUDIT_DATE));assert.ok(html.includes(registry.FACTBOOK_REGISTRY[slug].auditHash));
  assert.ok(section);assert.match(section, /<p class="factbook-fee-status">[^<]+<\/p>/);
  assert.ok(section.indexOf('factbook-fee-status') < section.indexOf('factbook-fee-records'));
  assert.match(section, /factbook-fee-records__note/);
  assert.match(section,/<details class="factbook-fee-records">/);
  assert.ok(!/<details[^>]*\bopen\b/.test(section));
  assert.match(section,/factbook-table-wrapper is-expanded/);
  assert.ok(!section.includes('factbook-fee-tiers-toggle'),'all unknown rows accessible in native details');
  assert.equal([...section.matchAll(/factbook-fee-tier-row/g)].length,registry.FACTBOOK_REGISTRY[slug].vipTiers.length);
  const pub=current.publicFactbookVenue(registry.FACTBOOK_REGISTRY[slug],locale);
  for(const row of pub.vipTiers){assert.ok(section.includes(row.tier.replaceAll('&','&amp;').replaceAll('>','&gt;').replaceAll('<','&lt;')));assert.ok(section.includes(row.vol30d.replaceAll('&','&amp;').replaceAll('>','&gt;').replaceAll('<','&lt;')));}
  assert.equal(pub.feeVerified,false);
  for(const row of pub.vipTiers)for(const key of ['spotM','spotT','netSpotM','netSpotT','futM','futT','netFutM','netFutT'])assert.ok(!/^-?\d+(?:\.\d+)?%$/.test(row[key]));
  const summary=section.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1];assert.ok(summary);
  if(locale!=='en')assert.notEqual(summary,rates(render(current,slug,'en')).match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1]);
 }
 const reg=readFileSync(new URL('../src/data/partner-registry.js',import.meta.url));assert.equal(createHash('sha256').update(reg).digest('hex'),'8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
 assert.equal(readFileSync(new URL('../src/data/factbook-registry.js',import.meta.url),'utf8'),readFileSync(new URL('../../../r120-editorial-quality/candidate/src/data/factbook-registry.js',import.meta.url),'utf8'));
});
test('fee source AND date gate is independent of benefit verification',()=>{
 const raw=registry.FACTBOOK_REGISTRY.binance;
 for(const partial of [{},{feeVerifiedAt:'2026-10-05'},{feeSourceUrl:'https://www.binance.com/en/fee/trading'}]){
  const pub=current.publicFactbookVenue({...raw,...partial},'en');assert.equal(pub.feeVerified,false);assert.ok(!pub.vipTiers[0].spotM.includes('%'));
 }
 const fee={...raw,feeVerifiedAt:'2026-10-05',feeSourceUrl:'https://www.binance.com/en/fee/trading'};
 const onlyFee=current.publicFactbookVenue(fee,'en');assert.equal(onlyFee.feeVerified,true);assert.equal(onlyFee.rebate.benefitVerified,false);
 for(const [base,net]of[['spotM','netSpotM'],['spotT','netSpotT'],['futM','netFutM'],['futT','netFutT']]){assert.equal(onlyFee.vipTiers[0][base],raw.vipTiers[0][base]);assert.equal(onlyFee.vipTiers[0][net],onlyFee.vipTiers[0][base]);}
 const both=current.publicFactbookVenue({...fee,rebate:{...fee.rebate,benefitVerifiedAt:'2026-10-05',benefitSourceUrl:'https://www.binance.com/en/support'}},'en');assert.equal(both.rebate.benefitVerified,true);assert.equal(both.vipTiers[0].netSpotM,raw.vipTiers[0].netSpotM);
});
test('verified fixture remains an immediately visible matrix, empty unknown record remains explicit',()=>{
 const original=registry.FACTBOOK_REGISTRY.binance;
 try{
  registry.FACTBOOK_REGISTRY.binance={...original,feeVerifiedAt:'2026-10-05',feeSourceUrl:'https://www.binance.com/en/fee/trading'};
  let section=rates(render(current,'binance','en'));assert.ok(!section.includes('factbook-fee-records'));assert.ok(section.includes('factbook-fee-tiers-toggle'));assert.ok(section.includes(original.vipTiers[0].spotM));
  registry.FACTBOOK_REGISTRY.binance={...original,vipTiers:[]};section=rates(render(current,'binance','en'));assert.match(section,/<details class="factbook-fee-records">/);assert.ok(!section.includes('factbook-fee-tier-row'));assert.ok(section.includes('factbook-fee-status'));
 }finally{registry.FACTBOOK_REGISTRY.binance=original;}
});
