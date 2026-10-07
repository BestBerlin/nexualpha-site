import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const generator = new URL('../scripts/generate-telegram-30day-review-pack.mjs', import.meta.url);
const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url));
const date = new Date();
const reviewedAt = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const stem = `telegram-30day-context-review-pack-${reviewedAt.replaceAll('-','')}`;

async function sandbox(run) {
 const dir = await realpath(await mkdtemp(path.join(tmpdir(), 'r94-telegram-archive-')));
 try {
  await mkdir(path.join(dir,'scripts'));
  const script = path.join(dir,'scripts/generate.mjs');
  await writeFile(script,(await readFile(generator,'utf8')).replaceAll('../src/',sourceRoot));
  await run({dir,script,output:path.join(dir,'docs')});
 } finally { await rm(dir,{recursive:true,force:true}); }
}
function cli(script,args) { return spawnSync(process.execPath,[script,...args],{encoding:'utf8'}); }
const args = output => ['--output-dir',output,'--reviewed-at',reviewedAt];

test('CLI refuses existing Markdown before writing JSON or historical archives',async()=>sandbox(async({script,output})=>{
 await mkdir(path.join(output,'evidence'),{recursive:true});
 await mkdir(path.join(output,'strategy'),{recursive:true});
 const oldJson = path.join(output,'evidence/telegram-30day-context-review-pack-20261001.json');
 const oldMd = path.join(output,'strategy/telegram-30day-context-review-pack-20261001.md');
 await writeFile(oldJson,'historical JSON');await writeFile(oldMd,'historical Markdown');
 await writeFile(path.join(output,`${stem}.md`),'existing current Markdown');
 const result = cli(script,args(output));
 assert.notEqual(result.status,0,'must reject conflicting archive before any writes');
 assert.equal(await readFile(oldJson,'utf8'),'historical JSON');
 assert.equal(await readFile(oldMd,'utf8'),'historical Markdown');
 assert.deepEqual((await readdir(output)).sort(),['evidence','strategy',`${stem}.md`].sort());
}));

test('CLI requires explicit output and valid review date without creating files',async()=>sandbox(async({script,output})=>{
 for(const options of [[],['--output-dir',output],['--reviewed-at',reviewedAt],['--output-dir',output,'--reviewed-at','2026-02-30']]) {
  assert.notEqual(cli(script,options).status,0);
 }
 assert.deepEqual(await readdir(path.dirname(output)),['scripts']);
}));

test('fresh output distinguishes generation from queue history and preserves source and approval state',async()=>sandbox(async({script,output})=>{
 const result=cli(script,args(output));assert.equal(result.status,0,result.stderr);
 const jsonPath=path.join(output,`${stem}.json`);
 const mdPath=path.join(output,`${stem}.md`);
 const json=await readFile(jsonPath,'utf8');const md=await readFile(mdPath,'utf8');
 const pack=JSON.parse(json);
 assert.equal(pack.reviewedAt,reviewedAt);assert.equal(pack.queueGeneratedAt,'2026-10-01');
 assert.ok(Number.isFinite(Date.parse(pack.generatedAt)));assert.notEqual(pack.generatedAt,pack.queueGeneratedAt);
 assert.match(md,new RegExp(`Generated: ${pack.generatedAt.replaceAll('.','\\.')}`));
 assert.equal(pack.createdAt,'2026-10-01');
 assert.equal(pack.slots[0].reviewTargetDate,'2026-10-01');
 assert.ok(pack.slots.every(s=>s.approvedAt===null&&s.publishedAt===null&&s.status==='draft_pending_manual_review'));
 assert.equal(pack.scope.telegramApiCalls,0);assert.equal(pack.scope.telegramMessagesSent,0);
 const {buildReviewPack}=await import(generator);
 assert.deepEqual(pack.slots,buildReviewPack().slots);
 assert.notEqual(cli(script,args(output)).status,0);
 assert.equal(await readFile(jsonPath,'utf8'),json);assert.equal(await readFile(mdPath,'utf8'),md);
}));
