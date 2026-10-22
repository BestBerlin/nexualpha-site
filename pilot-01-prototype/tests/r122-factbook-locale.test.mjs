import { committedFileHash } from './r100-test-contracts.mjs';
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

import { existsSync } from 'node:fs';

if (existsSync(new URL('../../../r121-reader-density/candidate/src/components/v3/FactbookPage.jsx', import.meta.url))) {
const req=createRequire(new URL('../package.json',import.meta.url));
const React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{transformSync}=req('esbuild');
const locales=['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];
const source=readFileSync(new URL('../src/components/v3/FactbookPage.jsx',import.meta.url),'utf8');
const baseline=readFileSync(new URL('../../../r121-reader-density/candidate/src/components/v3/FactbookPage.jsx',import.meta.url),'utf8');
function compile(src,cta=publicCtaForVenue){const module={exports:{}};vm.runInNewContext(transformSync(src+'\nexport { publicFactbookVenue, factbookStateLabels };',{loader:'jsx',format:'cjs'}).code,{module,exports:module.exports,React,require:name=>name==='react'?React:{...registry,neutralVenueCatalog,localizedHref,publicCtaForVenue:cta,BrandMark:()=>React.createElement('span'),DecisionPathRail:()=>null}});return module.exports;}
const current=compile(source);
// Previous implementation has no new labels helper; baseline exports only the page.
const before=compile(baseline+'\nfunction factbookStateLabels() {}');
const render=(module,slug,locale)=>renderToStaticMarkup(React.createElement(module.FactbookPage,{slug,locale,market:'BR',product:'spot'}));
const hrefs=html=>[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
const htmlEscape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
test('360 locale/venue SSR records preserve routes, dates, identifiers, fee rows and unknown authority',()=>{
 for(const slug of registry.FACTBOOK_SLUGS)for(const locale of locales){
  const html=render(current,slug,locale),old=render(before,slug,locale),labels=current.factbookStateLabels(locale);
  assert.deepEqual(hrefs(html),hrefs(old),`${slug}:${locale}`);
  assert.ok(html.includes(registry.AUDIT_DATE));assert.ok(html.includes(registry.FACTBOOK_REGISTRY[slug].auditHash));
  assert.equal((html.match(/factbook-fee-tier-row/g)||[]).length,registry.FACTBOOK_REGISTRY[slug].vipTiers.length);
  assert.match(html,/<details class="factbook-fee-records">/);assert.ok(!html.includes('factbook-fee-tiers-toggle'));
  const pub=current.publicFactbookVenue(registry.FACTBOOK_REGISTRY[slug],locale);assert.equal(pub.feeVerified,false);assert.equal(pub.rebate?.benefitVerified,false);
  for(const key of ['totalRatio','cleanRatio','nativeTokenShare','auditor'])assert.equal(pub.por[key],labels.pendingReview);
  assert.equal(pub.por.securityFund,labels.officialDisclosure);assert.equal(pub.por.fundAmount,labels.amountUnpublished);assert.equal(pub.por.cleanRatioNoteEn,labels.noSource);
  const activation=html.match(/<section class="factbook-section factbook-activation-section"[\s\S]*?<\/section>/)?.[0];
  if(activation){
   for(const key of ['activationEyebrow','signupTitle','signupButton','rebatePercentLabel'])assert.ok(activation.includes(htmlEscape(labels[key])),`${slug}:${locale}:${key}`);
   if(publicCtaForVenue(slug,locale).inviteCode)assert.ok(activation.includes(htmlEscape(labels.inviteCodeLabel)));
   if(locale!=='en')assert.ok(!/OFFICIAL REFERRAL ACTIVATION|Referral Code|User benefit status|Open partner signup route|partner signup route/.test(activation));
  }
  if(locale!=='en')for(const key of ['pendingReview','officialDisclosure','amountUnpublished','noSource','noItemSource','cardTotalPor','cardCleanPor','cardCleanBadge','cardNativeToken','cardSecurityFund','assetCoverageTitle','auditorLabel','merkleLink'])assert.notEqual(labels[key],current.factbookStateLabels('en')[key]);
 }
 assert.equal(createHash('sha256').update(readFileSync(new URL('../src/data/partner-registry.js',import.meta.url))).digest('hex'),committedFileHash('src/data/partner-registry.js'));
 assert.equal(readFileSync(new URL('../src/data/factbook-registry.js',import.meta.url),'utf8'),readFileSync(new URL('../../../r121-reader-density/candidate/src/data/factbook-registry.js',import.meta.url),'utf8'));
});
test('verified CTA fixture uses translated labels without changing the exact partner route or source gate',()=>{
 const verified=compile(source,(slug,locale)=>({...publicCtaForVenue(slug,locale),benefitVerified:true,rebatePercent:20,benefit:'Fixture benefit'}));
 for(const locale of locales){
  const html=render(verified,'binance',locale),labels=current.factbookStateLabels(locale);
  assert.ok(html.includes(htmlEscape(labels.activateBtn)));assert.ok(html.includes(htmlEscape(labels.welcomePackage)));
  assert.deepEqual(hrefs(html),hrefs(render(current,'binance',locale)));assert.ok(!html.includes('% Net'));
  assert.equal(current.publicFactbookVenue(registry.FACTBOOK_REGISTRY.binance,locale).rebate.benefitVerified,false,'fixture is not real user benefits');
 }
});

} else {
  test('historical regression requires original archived checkout', { skip: 'Original historical source snapshot is absent from a fresh checkout; current-source tests run separately.' }, () => {});
}
