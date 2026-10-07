import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { REVIEW_INDEX_INPUTS as refs, loadReviewIndexInputs, buildTelegramReviewIndex, generateTelegramReviewIndex } from '../scripts/generate-telegram-review-index.mjs';
const inputs=await loadReviewIndexInputs();
const options={reviewedAt:'2026-10-02'};
const clone=()=>structuredClone(inputs);

test('index keeps 30 original slots, five manual drafts and explicit revision references separate',()=>{
 const result=buildTelegramReviewIndex(inputs,options);
 assert.equal(result.slots.length,30);assert.equal(result.manualDrafts.length,5);assert.equal(result.revisions.length,5);assert.equal(result.additionalDrafts.length,1);
 const jp=result.slots.find(r=>r.id==='jp-exchange-source-check');
 const revision=result.revisions.find(r=>r.target.id===jp.id);
 assert.ok(jp.sourceEvidence.every(s=>s.recordedReviewDate==='2026-09-15'));
 assert.equal(revision.sourceReview.sources.length,2);
 assert.ok(revision.sourceReview.sources.every(s=>s.reviewedAt==='2026-10-01T20:49:53.909663+00:00'));
 assert.equal(revision.sourceReview.sources[0].documentDate,'2026-09-01');
 assert.notEqual(jp.originalCopy,revision.copy);
 assert.equal(result.additionalDrafts[0].reviewTargetDate,null);
 assert.equal(result.overlapStatus.status,'UNKNOWN_NOT_MAPPED');
 assert.ok(result.revisions.every(r=>r.supersedesOnlyAfterApproval===true));
 assert.ok([...result.slots,...result.manualDrafts,...result.revisions,...result.additionalDrafts].every(r=>r.approvedAt===null&&r.publishedAt===null&&r.nativeCertification===null));
 assert.equal(result.lifecycle.postgresTests,13);assert.equal(result.lifecycle.compiledDatabaseChecks,16);
 assert.equal(result.lifecycle.privateAccountUi,'pending');assert.equal(result.lifecycle.productionPromotion,'pending');
 assert.equal(result.telegramApiCalls,0);assert.equal(result.messagesSent,0);
 assert.deepEqual(result.inputHashes,inputs.hashes);
});

test('stale queue hashes, missing artifact/record references and duplicate candidates are rejected',()=>{
 const mutations=[
  b=>b.documents[refs.editorial].originalQueueSha256='stale',
  b=>delete b.documents[refs.manual],
  b=>delete b.documents[b.documents[refs.manual].drafts[0].draftSourcePath],
  b=>b.documents[b.documents[refs.manual].drafts[0].draftSourcePath].drafts.shift(),
  b=>b.documents[refs.regional].revisionCandidates[1].id=b.documents[refs.regional].revisionCandidates[0].id,
  b=>b.documents[refs.editorial].revisionCandidates[0].sourceReviewArtifact='missing.json',
  b=>b.documents[refs.editorial].revisionCandidates[0].supersedesOnlyAfterApproval='uniswap-testnet',
  b=>b.documents[refs.regional].revisionCandidates[0].claims[0].source='https://example.invalid/unsupported',
  b=>b.documents[refs.regional].revisionCandidates[0].sourceCheckedAt=null,
  b=>b.documents[refs.affiliateSources].sources[0].url='https://example.invalid/unsupported',
 ];
 for(const mutate of mutations){const b=clone();mutate(b);assert.throws(()=>buildTelegramReviewIndex(b,options));}
});

test('approval, native certification, stale landing and lifecycle completion claims fail closed',()=>{
 const mutations=[
  b=>b.documents[refs.pack].slots[0].approvedAt='2026-10-02',
  b=>b.documents[refs.manual].drafts[0].publishedAt='2026-10-02',
  b=>b.documents[refs.manual].drafts[0].status='approved',
  b=>b.documents[refs.editorial].reviews[0].editorialApproval=true,
  b=>b.documents[refs.regional].revisionCandidates[0].nativeCertification=true,
  b=>b.documents[refs.affiliate].nativeReview='approved',
  b=>b.documents[refs.editorial].revisionCandidates[0].firstOnsiteUrl='https://nexualpha.com/exchanges/uniswap',
  b=>b.documents[refs.regional].revisionCandidates[0].url='https://outside.invalid/jp',
  b=>b.documents[refs.lifecycle].realAccountUiAccepted=true,
 ];
 for(const mutate of mutations){const b=clone();mutate(b);assert.throws(()=>buildTelegramReviewIndex(b,options));}
});

test('local output requires explicit date, preserves inputs and refuses either destination before writing',async()=>{
 const outputDir=await mkdtemp(path.join(tmpdir(),'r95-review-index-'));
 try {
  await assert.rejects(generateTelegramReviewIndex({outputDir},inputs));
  await assert.rejects(generateTelegramReviewIndex({outputDir,reviewedAt:'2026-02-30'},inputs));
  const md=path.join(outputDir,'r95-telegram-review-index-20261002.md');
  await writeFile(md,'historical sentinel');
  await assert.rejects(generateTelegramReviewIndex({outputDir,...options},inputs),/Refusing existing archive/);
  assert.deepEqual(await readdir(outputDir),[path.basename(md)]);
  assert.equal(await readFile(md,'utf8'),'historical sentinel');
  await rm(md);
  await generateTelegramReviewIndex({outputDir,...options},inputs);
  const json=await readFile(path.join(outputDir,'r95-telegram-review-index-20261002.json'),'utf8');
  await assert.rejects(generateTelegramReviewIndex({outputDir,...options},inputs),/Refusing existing archive/);
  assert.equal(await readFile(path.join(outputDir,'r95-telegram-review-index-20261002.json'),'utf8'),json);
  assert.deepEqual((await loadReviewIndexInputs()).hashes,inputs.hashes);
 } finally {await rm(outputDir,{recursive:true,force:true});}
});
