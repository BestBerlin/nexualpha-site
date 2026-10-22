import { committedFileHash } from './r100-test-contracts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { TELEGRAM_30DAY_REVIEW_QUEUE as queue } from '../src/data/telegram-30day-review-queue.js';
import { TELEGRAM_WEEK4_CONTEXT_RETURN_PACK as prior, buildTelegramStartPayload, parseTelegramWebsiteStartPayload } from '../src/data/telegram-config.js';
import { buildReviewPack } from '../scripts/generate-telegram-30day-review-pack.mjs';
const clone = () => structuredClone(buildReviewPack());

test('30-day inventory preserves old return contexts and adds sixteen independent decision questions', () => {
 const pack = buildReviewPack();
 assert.equal(pack.validation.checkedSlots, 30);
 assert.deepEqual(pack.slots.map(s=>s.day), Array.from({length:30}, (_,i)=>i+1));
 assert.equal(new Set(pack.slots.map(s=>s.id)).size,30);
 assert.equal(new Set(pack.slots.map(s=>s.title)).size,30);
 assert.equal(pack.slots[0].reviewTargetDate,'2026-10-01');
 assert.equal(pack.slots[29].reviewTargetDate,'2026-10-30');
 for (const [i, old] of prior.slots.entries()) {
  assert.deepEqual(pack.slots[i].returnContext,old.returnContext);
  assert.equal(pack.slots[i].firstOnsiteRoute,old.firstOnsiteRoute);
 }
 const first = new Set(pack.slots.slice(0,14).map(s=>s.reviewFocus));
 assert.ok(pack.slots.slice(14).every(s=>!first.has(s.reviewFocus)));
 assert.ok(pack.slots.every(s=>s.approvedAt===null && s.publishedAt===null && s.sourceEvidence.length && s.reviewConditions.length>=6));
 assert.deepEqual(pack.validation.problems,[]);
});

test('review generator rejects missing sources, approval claims and duplicate calendars',()=>{
 for(const mutate of [q=>q.slots[4].sourceEvidence=[], q=>q.slots[1].approvedAt='2026-10-01',q=>q.slots[2].publishedAt='2026-10-01',q=>q.slots[29].reviewTargetDate=q.slots[0].reviewTargetDate,q=>q.slots[29].id=q.slots[0].id]){
  const q=clone();mutate(q);assert.throws(()=>buildReviewPack(q));
 }
});

test('review generator rejects private context, offsite/unsafe landing and return-route drift',()=>{
 for(const mutate of [q=>q.slots[0].returnContext.userId='private',q=>q.slots[0].firstOnsiteRoute='//evil.example/mx',q=>q.slots[0].firstOnsiteRoute='/mx?ref=secret',q=>q.slots[0].firstOnsiteRoute='/br?market=MX&product=spot&locale=es',q=>q.slots[0].draftCopy+=' nexu888']){
  const q=clone();mutate(q);assert.throws(()=>buildReviewPack(q));
 }
});

test('dated artifacts preserve draft-only inventory across the scoped OKX source recheck',async()=>{
 const recorded=JSON.parse(await readFile(new URL('../docs/evidence/telegram-30day-context-review-pack-20261001.json',import.meta.url),'utf8'));
 const current=structuredClone(buildReviewPack());
 // October source verification does not rewrite the September evidence date
 // in an already archived October1 draft pack. Every other field stays exact.
 for (const slot of current.slots) {
  for (const source of slot.sourceEvidence) {
   if (source.registry==='src/data/brazil-market.js' && source.sourceId==='okx-brl-pix-deposit') {
    const historical=recorded.slots.find(s=>s.id===slot.id).sourceEvidence.find(s=>s.registry===source.registry && s.sourceId===source.sourceId && s.sourceOwner===source.sourceOwner);
    assert.ok(historical);
    assert.equal(historical.recordedReviewDate,'2026-09-08T00:00:00.000Z');
    assert.equal(source.recordedReviewDate,'2026-10-02T00:00:00.000Z');
    source.recordedReviewDate=historical.recordedReviewDate;
   }
  }
 }
 // These two newly reviewed Uniswap documents did not exist in the dated
 // October1 inventory. Exclude only the exact additions after checking all
 // provenance fields; every prior source and remaining field stays exact.
 const addedUniswapUrls = ['https://developers.uniswap.org/docs/trading/swapping-api/faqs','https://developers.uniswap.org/docs/trading/custom-interface-links'];
 const addedSlotIds = ['kr-dex-domain-check','uniswap-wallet-preview'];
 for (const slot of current.slots) {
  const additions = slot.sourceEvidence.filter(source => addedUniswapUrls.includes(source.url));
  assert.equal(additions.length, addedSlotIds.includes(slot.id) ? 2 : 0, slot.id);
  if (additions.length) {
   assert.equal(slot.status,'draft_pending_manual_review');
   assert.equal(slot.approvedAt,null);assert.equal(slot.publishedAt,null);
   for (const source of additions) {
    assert.equal(source.recordedReviewDate,'2026-10-02');
    assert.equal(source.registry,'src/data/priority-venue-answers.js');
    assert.equal(source.sourceOwner,'/exchanges/uniswap');
    assert.equal(source.scope,'platform_mechanics');assert.equal(source.locale,'en');
    assert.equal(source.provesRegionQualification,false);
    assert.equal(recorded.slots.find(s=>s.id===slot.id).sourceEvidence.some(s=>s.url===source.url),false);
   }
   slot.sourceEvidence=slot.sourceEvidence.filter(source => !addedUniswapUrls.includes(source.url));
  }
 }
 // Keep the dated October1 HK monitor action as historical evidence. The
 // current review queue uses a generic regional action; neither is a send record.
 const recordedHk=recorded.slots.find(s=>s.id==='hk-account-language-route');
 assert.deepEqual(recordedHk.botDeepLinkAction,prior.slots.find(s=>s.id===recordedHk.id).botDeepLinkAction);
 current.slots.find(s=>s.id===recordedHk.id).botDeepLinkAction=structuredClone(recordedHk.botDeepLinkAction);
 assert.deepEqual(recorded,current);
 assert.equal(recorded.scope.telegramApiCalls,0);
 assert.equal(recorded.scope.telegramMessagesSent,0);
 assert.equal(recorded.scope.externalSubmissions,0);
 assert.equal(recorded.productionLandingReview,'pending_manual_review');
 // Class b: 84b6426 intentionally switched Binance to its official primary referral domain.
 const partner=await readFile(new URL('../src/data/partner-registry.js',import.meta.url));
 assert.equal(createHash('sha256').update(partner).digest('hex'),committedFileHash("src/data/partner-registry.js"));
 const generator=await readFile(new URL('../scripts/generate-telegram-30day-review-pack.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(generator,/\bfetch\s*\(|sendMessage|api\.telegram\.org|execFile|child_process/);
});

test('source evidence separates KR regional context from Uniswap mechanics and labels rates support honestly',()=>{
 const kr=queue.slots.find(s=>s.day===4);
 assert.ok(kr.sourceEvidence.some(s=>s.registry==='src/data/international-source-registry.js' && s.sourceOwner==='KR' && s.scope==='region_qualification_context'));
 assert.ok(kr.sourceEvidence.some(s=>s.registry==='src/data/priority-venue-answers.js' && s.sourceOwner==='/exchanges/uniswap' && s.scope==='platform_mechanics' && s.locale==='en'));
 assert.ok(kr.sourceEvidence.some(s=>/deploy|address/i.test(s.label||s.url)));
 assert.ok(kr.sourceEvidence.every(s=>s.provesRegionQualification===false));
 const rates=queue.slots.find(s=>s.day===30);
 assert.ok(rates.sourceEvidence.every(s=>s.registry==='src/data/compare-direct-answers.js' && s.sourceOwner==='/compare/binance-vs-okx' && s.scope==='supporting_context_only'));
});

test('new Uniswap source dates remain scoped while historical sources and draft state stay unchanged',()=>{
 const pack=buildReviewPack();
 const added=['https://developers.uniswap.org/docs/trading/swapping-api/faqs','https://developers.uniswap.org/docs/trading/custom-interface-links'];
 for(const id of ['kr-dex-domain-check','uniswap-wallet-preview']){
  const slot=pack.slots.find(s=>s.id===id);
  const mechanics=slot.sourceEvidence.filter(s=>s.sourceOwner==='/exchanges/uniswap');
  assert.equal(mechanics.filter(s=>added.includes(s.url)).length,2);
  for(const source of mechanics) assert.equal(source.recordedReviewDate,added.includes(source.url)?'2026-10-02':'2026-09-22');
  assert.equal(slot.status,'draft_pending_manual_review');assert.equal(slot.approvedAt,null);assert.equal(slot.publishedAt,null);
 }
 assert.equal(pack.scope.telegramApiCalls,0);assert.equal(pack.scope.telegramMessagesSent,0);assert.equal(pack.scope.externalSubmissions,0);
});

test('generator rejects forged source ownership/scope and unsupported owner fallback',()=>{
 for(const mutate of [q=>q.slots[29].sourceEvidence[0].registry='src/data/priority-venue-answers.js',q=>q.slots[29].sourceEvidence[0].scope='platform_mechanics',q=>q.slots[3].sourceEvidence=q.slots[3].sourceEvidence.filter(s=>s.scope!=='platform_mechanics'),q=>q.slots[24].returnContext.venue='unknown-venue']){
  const q=clone();mutate(q);assert.throws(()=>buildReviewPack(q),/Source owner|Missing registered source/);
 }
});


test('Japan source-check draft uses generic action aligned with FSA/bitFlyer landing, without mutating legacy template',()=>{
 const jp=buildReviewPack().slots.find(s=>s.id==='jp-exchange-source-check');
 const direct=queue.slots.find(s=>s.id==='jp-exchange-source-check');
 assert.deepEqual(direct.botDeepLinkAction,jp.botDeepLinkAction);
 assert.equal(direct.botDeepLinkAction.venue,undefined);
 assert.equal(direct.status,'draft_pending_manual_review');
 assert.equal(direct.approvedAt,null);assert.equal(direct.publishedAt,null);
 assert.ok(queue.slots.every(s=>s.status==='draft_pending_manual_review'&&s.approvedAt===null&&s.publishedAt===null));
 assert.deepEqual(jp.botDeepLinkAction,{action:'partner_desk',market:'JP',locale:'ja',product:'spot',campaign:jp.returnContext.campaign});
 assert.equal(jp.returnContext.route,'/jp');
 assert.equal(jp.botDeepLinkAction.venue,undefined);
 const parsed=parseTelegramWebsiteStartPayload(buildTelegramStartPayload(jp.botDeepLinkAction));
 assert.equal(parsed.action,'partner_desk');
 assert.equal(parsed.market,'JP');
 assert.equal(parsed.locale,'ja');
 assert.equal(parsed.venue,undefined);
 assert.ok(jp.sourceEvidence.some(s=>new URL(s.url).hostname==='bitflyer.com'));
 assert.ok(jp.sourceEvidence.some(s=>new URL(s.url).hostname==='www.fsa.go.jp'));
 assert.equal(prior.slots.find(s=>s.id===jp.id).botDeepLinkAction.venue,'bitget');
 assert.equal(jp.status,'draft_pending_manual_review');
 assert.equal(jp.approvedAt,null);assert.equal(jp.publishedAt,null);
});

test('Japan draft validation rejects restored Bitget action, forced venue and changed market intent',()=>{
 for(const mutate of [s=>s.botDeepLinkAction={...s.botDeepLinkAction,action:'verify_domain',venue:'bitget'},s=>s.botDeepLinkAction.venue='bitflyer',s=>s.botDeepLinkAction.market='GLOBAL',s=>s.returnContext.route='/exchanges/bitget']){
  const q=clone();mutate(q.slots.find(s=>s.id==='jp-exchange-source-check'));assert.throws(()=>buildReviewPack(q),/Japan draft action/);
 }
});


test('Hong Kong source-check action preserves generic HK context instead of an inherited platform monitor',()=>{
 const hk=buildReviewPack().slots.find(s=>s.id==='hk-account-language-route');
 assert.deepEqual(hk.botDeepLinkAction,{action:'partner_desk',market:'HK',locale:'zh-Hant',product:'spot',campaign:hk.returnContext.campaign});
 const parsed=parseTelegramWebsiteStartPayload(buildTelegramStartPayload(hk.botDeepLinkAction));
 assert.equal(parsed.action,'partner_desk');assert.equal(parsed.market,'HK');assert.equal(parsed.locale,'zh-Hant');assert.equal(parsed.venue,undefined);
 assert.equal(hk.returnContext.route,'/hk');assert.equal(hk.returnContext.venue,undefined);
 assert.equal(prior.slots.find(s=>s.id===hk.id).botDeepLinkAction.venue,'okx');
 assert.equal(hk.approvedAt,null);assert.equal(hk.publishedAt,null);
});

test('Hong Kong draft validator rejects wrong market, platform monitor and changed regional scope',()=>{
 for(const mutate of [s=>s.botDeepLinkAction={...s.botDeepLinkAction,action:'monitor',venue:'okx'},s=>s.botDeepLinkAction.market='GLOBAL',s=>s.botDeepLinkAction.locale='en',s=>s.botDeepLinkAction.campaign='wrong_campaign',s=>s.returnContext.venue='okx',s=>s.returnContext.route='/exchanges/okx']){
  const q=clone();mutate(q.slots.find(s=>s.id==='hk-account-language-route'));assert.throws(()=>buildReviewPack(q),/Hong Kong draft action/);
 }
});
