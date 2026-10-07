import { readFile, writeFile, lstat, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReviewPack } from './generate-telegram-30day-review-pack.mjs';

const evidence = 'docs/evidence/four-week-growth-20260927/';
export const REVIEW_INDEX_INPUTS = Object.freeze({
 pack: `${evidence}r94-telegram-review-pack-20261002/telegram-30day-context-review-pack-20261002.json`,
 manual: `${evidence}r75-telegram-review-queue-20261002.json`,
 editorial: `${evidence}r80-telegram-source-editorial-review-20261002.json`,
 regional: `${evidence}r87-three-localized-draft-candidates.json`,
 affiliate: `${evidence}r93-telegram-affiliate-draft.json`,
 affiliateSources: `${evidence}r93-official-source-review.json`,
 lifecycle: '../telegram-lifecycle-candidate-20261001/candidate-evidence/candidate-manifest.json',
});
const regionalIds = ['jp-exchange-source-check','tr-spk-market-check','hk-account-language-route'];
const revisionTargets = { 'hyperliquid-fees-r80-candidate':'hyperliquid-fees', 'br-pix-ownership-r72-r80-candidate':'br-pix-ownership-r72' };
function ensure(condition, message) { if (!condition) throw new Error(message); }
function pending(row) {
 if (row.status) ensure(row.status.startsWith('draft') || row.status.startsWith('revision_candidate_pending'), 'Unsupported non-draft state');
 ensure(row.approvedAt === null && row.publishedAt === null, 'Approval/publication must remain null');
 for (const key of ['editorialApproval','nativeCertification','publicationAuthorization']) ensure(row[key] == null, `Unsupported ${key} claim`);
 ensure(!row.nativeReview || row.nativeReview === 'pending', 'Native review must remain pending');
}
function unique(rows, key='id') { ensure(new Set(rows.map(r=>r[key])).size === rows.length, `Duplicate ${key}`); }
function onsite(value) { const url=new URL(value);ensure(url.origin==='https://nexualpha.com','Offsite landing');return value; }
function official(value) { ensure(new URL(value).protocol==='https:', 'Invalid source URL');return value; }
function checkedDate(value) { ensure(typeof value==='string'&&Number.isFinite(Date.parse(value)), 'Missing source review date');return value; }
function reference(bundle, artifact) { ensure(Object.hasOwn(bundle.documents,artifact),`Missing reference: ${artifact}`);return artifact; }

export async function loadReviewIndexInputs(root = fileURLToPath(new URL('../',import.meta.url))) {
 const documents={}, hashes={};
 async function load(artifact) {
  if (Object.hasOwn(documents,artifact)) return;
  const raw=await readFile(path.resolve(root,artifact),'utf8');
  hashes[artifact]=createHash('sha256').update(raw).digest('hex');
  documents[artifact]=artifact.endsWith('.json')?JSON.parse(raw):raw;
 }
 for(const artifact of Object.values(REVIEW_INDEX_INPUTS)) await load(artifact);
 for(const row of documents[REVIEW_INDEX_INPUTS.manual].drafts) {
  for(const artifact of [row.draftSourcePath,row.sourceQueue,...(row.evidencePaths||[])]) {
   ensure(artifact?.startsWith(evidence)&&!artifact.includes('..'),'Unsupported evidence reference');
   await load(artifact);
  }
 }
 return {documents,hashes};
}

export function buildTelegramReviewIndex(bundle, { reviewedAt, generatedAt = new Date().toISOString() } = {}) {
 ensure(/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt||'') && Number.isFinite(Date.parse(`${reviewedAt}T00:00:00Z`)) && new Date(`${reviewedAt}T00:00:00Z`).toISOString().slice(0,10)===reviewedAt,'Valid explicit review date required');
 const inputs=Object.fromEntries(Object.entries(REVIEW_INDEX_INPUTS).map(([key,artifact])=>[key,bundle.documents[reference(bundle,artifact)]]));
 const {pack,manual,editorial,regional,affiliate,affiliateSources,lifecycle}=inputs;
 buildReviewPack(pack); // Reuse source/route/state contracts; package dates are not source approval.
 unique(manual.drafts);unique(editorial.reviews,'draftId');unique(editorial.revisionCandidates);unique(regional.revisionCandidates);
 ensure(editorial.originalQueueSha256===bundle.hashes[REVIEW_INDEX_INPUTS.manual],'Stale original queue reference');
 ensure(editorial.reviews.length===manual.drafts.length && editorial.reviews.every(r=>manual.drafts.some(d=>d.id===r.draftId)),'Unsupported editorial review mapping');
 ensure(editorial.revisionCandidates.length===2&&regional.revisionCandidates.length===3,'Unexpected revision inventory');
 const slots=pack.slots.map(row=>{
  pending(row);
  return {id:row.id,reference:{artifact:REVIEW_INDEX_INPUTS.pack,collection:'slots',id:row.id},locale:row.locale,market:row.market,reviewTargetDate:row.reviewTargetDate,firstOnsiteUrl:onsite(`https://nexualpha.com${row.firstOnsiteRoute}`),originalCopy:row.draftCopy,sourceEvidence:row.sourceEvidence,approvedAt:null,publishedAt:null,nativeCertification:null};
 });
 const manualDrafts=manual.drafts.map(row=>{
  pending(row);
  const artifact=reference(bundle,row.draftSourcePath);
  reference(bundle,row.sourceQueue);for(const ref of row.evidencePaths||[]) reference(bundle,ref);
  const document=bundle.documents[artifact];
  const original=typeof document==='string'?null:document.drafts?.find(d=>d.id===row.id);
  ensure(typeof document==='string'||original,'Missing original draft ID');
  if(original) {pending(original);ensure(original.firstOnsiteUrl===row.firstOnsiteUrl&&original.locale===row.locale,'Stale original draft mapping');}
  else ensure(document.includes(row.firstOnsiteUrl),'Stale Markdown landing reference');
  const review=editorial.reviews.find(r=>r.draftId===row.id);pending(review);checkedDate(review.reviewedAt);
  return {id:row.id,reference:{artifact:REVIEW_INDEX_INPUTS.manual,collection:'drafts',id:row.id},originalReference:{artifact,id:original?row.id:null},originalCopy:original?.draftCopy||document,locale:row.locale,firstOnsiteUrl:onsite(row.firstOnsiteUrl),reviewTargetDate:manual.calendar.filter(day=>day.draftIds.includes(row.id)).map(day=>day.date),originalEvidenceDates:row.originalEvidenceDates,sourceEvidence:(original?.sourceEvidence||[]),sourceReview:{artifact:REVIEW_INDEX_INPUTS.editorial,id:row.id,scope:review.sourceScope,sources:review.sourcesReadThisPass.map(url=>({url:official(url),reviewedAt:review.reviewedAt}))},approvedAt:null,publishedAt:null,nativeCertification:null};
 });
 const revisions=editorial.revisionCandidates.map(row=>{
  pending(row);
  const target=revisionTargets[row.id];ensure(target&&row.supersedesOnlyAfterApproval===target,'Unsupported revision mapping');
  const original=manualDrafts.find(d=>d.id===target);ensure(original&&original.firstOnsiteUrl===row.firstOnsiteUrl&&original.locale===row.locale,'Revision landing/locale mismatch');
  ensure(row.sourceReviewArtifact===path.basename(REVIEW_INDEX_INPUTS.editorial),'Missing revision source reference');
  return {id:`r80:${row.id}`,candidateReference:{artifact:REVIEW_INDEX_INPUTS.editorial,collection:'revisionCandidates',id:row.id},target:{kind:'manualDraft',id:target},supersedesOnlyAfterApproval:true,copy:row.draftCopy,firstOnsiteUrl:onsite(row.firstOnsiteUrl),locale:row.locale,sourceReview:original.sourceReview,approvedAt:null,publishedAt:null,nativeCertification:null};
 });
 for(const row of regional.revisionCandidates) {
  pending(row);ensure(regionalIds.includes(row.id),'Unsupported regional mapping');
  const original=slots.find(s=>s.id===row.id);ensure(original&&original.firstOnsiteUrl===row.url&&original.locale===row.locale,'Regional landing/locale mismatch');
  ensure(row.claims?.length,'Missing regional claims');
  const sources=row.claims.map(claim=>{
   ensure(original.sourceEvidence.some(source=>source.url===claim.source),'Unregistered regional claim source');
   return {url:official(claim.source),claim:claim.claim,reviewedAt:checkedDate(row.sourceCheckedAt),documentDate:regional.sourceDocumentDates[claim.source]||null};
  });
  revisions.push({id:`r87:${row.id}`,candidateReference:{artifact:REVIEW_INDEX_INPUTS.regional,collection:'revisionCandidates',id:row.id},target:{kind:'slot',id:row.id},supersedesOnlyAfterApproval:true,copy:row.copy,firstOnsiteUrl:onsite(row.url),locale:row.locale,sourceReview:{artifact:REVIEW_INDEX_INPUTS.regional,scope:row.sourceScope,sources},approvedAt:null,publishedAt:null,nativeCertification:null});
 }
 pending(affiliate);ensure(affiliate.id==='r93-uniswap-affiliate-boundary','Unsupported additional draft ID');
 ensure(affiliateSources.sources.length===2,'Missing affiliate source evidence');
 ensure(JSON.stringify(affiliateSources.sources.map(source=>source.url).sort())===JSON.stringify(['https://developers.uniswap.org/docs/trading/swapping-api/faqs','https://developers.uniswap.org/docs/trading/custom-interface-links'].sort()),'Unsupported affiliate source mapping');
 checkedDate(affiliateSources.reviewedAt);
 const additionalDrafts=[{id:affiliate.id,reference:{artifact:REVIEW_INDEX_INPUTS.affiliate,id:affiliate.id},copy:affiliate.draft,firstOnsiteUrl:onsite(affiliate.onsiteFirst),locale:'en',reviewTargetDate:null,supersedesOnlyAfterApproval:true,target:null,sourceReview:{artifact:REVIEW_INDEX_INPUTS.affiliateSources,sources:affiliateSources.sources.map(source=>({...source,url:official(source.url),reviewedAt:affiliateSources.reviewedAt}))},reviewConditions:affiliate.reviewConditions,approvedAt:null,publishedAt:null,nativeCertification:null}];
 // Similar topics are not proof of editorial replacement or a shared review slot.
 const overlapStatus={status:'UNKNOWN_NOT_MAPPED',boundary:'Manual drafts and 30day slots remain separate unless an explicit stable-ID replacement is registered. R93 has no assigned calendar slot.'};
 ensure(lifecycle.postgresTests.passed===13&&lifecycle.compiledPostgresSmoke.checks===16&&!lifecycle.productionPromoted&&!lifecycle.realAccountUiAccepted,'Lifecycle evidence drift');
 const result={generatedAt,reviewedAt,status:'draft_review_index_only',sourceApprovalBoundary:'Package dates do not refresh official sources or confer native/editorial approval.',inputHashes:bundle.hashes,slots,manualDrafts,revisions,additionalDrafts,overlapStatus,lifecycle:{artifact:REVIEW_INDEX_INPUTS.lifecycle,postgresTests:13,compiledDatabaseChecks:16,productionPromotion:'pending',privateAccountUi:'pending'},approvedAt:null,publishedAt:null,publicationAuthorization:null,telegramApiCalls:0,messagesSent:0};
 unique([...slots,...manualDrafts,...revisions,...additionalDrafts]);
 return result;
}

export async function generateTelegramReviewIndex({outputDir,reviewedAt},bundle) {
 ensure(outputDir,'Explicit output directory required');
 const index=buildTelegramReviewIndex(bundle||await loadReviewIndexInputs(),{reviewedAt});
 const stem=`r95-telegram-review-index-${reviewedAt.replaceAll('-','')}`;
 const targets=[path.join(outputDir,`${stem}.json`),path.join(outputDir,`${stem}.md`)];
 for(const target of targets){try{await lstat(target);}catch(error){if(error.code==='ENOENT')continue;throw error;}throw new Error(`Refusing existing archive: ${target}`);}
 const rows=[...index.slots.map(r=>({...r,kind:'30day original'})),...index.manualDrafts.map(r=>({...r,kind:'seven-day original'})),...index.revisions.map(r=>({...r,kind:'revision candidate'})),...index.additionalDrafts.map(r=>({...r,kind:'additional draft'}))];
 const md=`# R95 Telegram manual review index\n\nGenerated: ${index.generatedAt}. Index date: ${reviewedAt}. All approval/publication/native fields remain null; 0 calls and 0 sends. Package dates are not source-review dates. Original drafts are not replaced.\n\n| ID | Kind | Locale | Onsite URL | Replacement target |\n| --- | --- | --- | --- | --- |\n${rows.map(r=>`| ${r.id} | ${r.kind} | ${r.locale} | ${r.firstOnsiteUrl} | ${r.target?`${r.target.kind}:${r.target.id} (only after approval)`:'none / unknown'} |`).join('\n')}\n\nJSON contains exact artifact/record references, original and candidate copy, source URLs and historical review evidence. Similar topics remain UNKNOWN_NOT_MAPPED. R93 has no assigned review calendar. Lifecycle: 13 real PostgreSQL tests and 16 compiled database checks already recorded; promotion and private-account UI acceptance pending. No native certification, registration or growth claim.\n`;
 await mkdir(outputDir,{recursive:true});
 await writeFile(targets[0],`${JSON.stringify(index,null,2)}\n`,{flag:'wx'});
 await writeFile(targets[1],md,{flag:'wx'});
 return index;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]) {
 const options={};for(let i=2;i<process.argv.length;i++){const key=process.argv[i];ensure(['--output-dir','--reviewed-at'].includes(key)&&process.argv[i+1]&&!options[key]&&!process.argv[i+1].startsWith('--'),'Explicit --output-dir and --reviewed-at required');options[key]=process.argv[++i];}
 await generateTelegramReviewIndex({outputDir:options['--output-dir'],reviewedAt:options['--reviewed-at']});
}
