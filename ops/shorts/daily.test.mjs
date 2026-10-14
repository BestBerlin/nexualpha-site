import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyDestination,main,parseDailyArgs} from './daily.mjs';
import {access,readFile,writeFile} from 'node:fs/promises';
import {writePreview} from './preview.mjs';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {buildPackage,sgtDay,validateData} from './builders.mjs';
test('daily CLI defaults to eight voiced locales; rejects typos and duplicate locales',()=>{
  assert.equal(parseDailyArgs([]).voice,true);
  assert.equal(parseDailyArgs(['--no-voice']).voice,false);
  assert.equal(parseDailyArgs(['--locales','vi','--voice']).voice,true);
  assert.deepEqual(parseDailyArgs([]).locales,['en','es','pt-BR','vi','id','tr','ru','zh-Hans']);
  assert.deepEqual(parseDailyArgs(['--locales','en,vi','--out','ops/shorts/samples/test']).locales,['en','vi']);
  assert.deepEqual(parseDailyArgs(['--locales','ar']).locales,['ar']);
  for(const args of [['--locales','en,en'],['--locales','xx'],['--out'],['--wat']]) assert.throws(()=>parseDailyArgs(args));
});
test('offline preview exposes seekable GSAP timeline with portrait/square frame metadata',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'shorts-preview-'));
  try {
    const fixture=JSON.parse(await readFile(new URL('./fixtures/market.json',import.meta.url)));
    const {slides}=buildPackage(validateData(fixture,null,Date.parse(fixture.generatedAt)),'en');
    await writePreview(slides,'en',dir);
    for(const format of ['portrait','square']) {
      const html=await readFile(path.join(dir,`${format}-preview.html`),'utf8');
      assert.match(html,/window.__timelines=\{shorts:timeline\}/);
      assert.match(html,/HYPERFRAMES_META/);
      assert.equal((html.match(/class="frame"/g)||[]).length,5);
      assert.doesNotMatch(html,/<script src="https/);
    }
  } finally {await rm(dir,{recursive:true,force:true});}
});
test('daily package names and metadata use Singapore day, including the UTC rollover', async()=>{
  const fixture=JSON.parse(await readFile(new URL('./fixtures/market.json',import.meta.url)));
  fixture.generatedAt='2026-10-12T16:05:00Z';
  fixture.funding.generatedAt=fixture.generatedAt;
  fixture.liquidations.h24.largest.at='2026-10-12T15:59:00Z';
  const out=await mkdtemp(path.join(os.tmpdir(),'shorts-sgt-'));
  try {
    const data=validateData(fixture,null,Date.parse(fixture.generatedAt));
    assert.equal(dailyDestination(out,data,true),path.join(out,'2026-10-13-fixture'));
    assert.equal(buildPackage(data,'en').meta.date,'2026-10-13');
    assert.equal(sgtDay('2026-10-12T15:59:59Z'),'2026-10-12');
    assert.equal(sgtDay('2026-10-12T16:00:00Z'),'2026-10-13');
  } finally {await rm(out,{recursive:true,force:true});}
});
test('daily package lock blocks overlapping same-day renders before output mutation', async()=>{
  const fixture=JSON.parse(await readFile(new URL('./fixtures/market.json',import.meta.url)));
  const out=await mkdtemp(path.join(os.tmpdir(),'shorts-lock-'));
  const file=path.join(out,'market.json');
  try {
    await writeFile(file,JSON.stringify(fixture));
    const lock=path.join(out,`${sgtDay(fixture.generatedAt)}-fixture.lock`);
    await writeFile(lock,'existing');
    await assert.rejects(()=>main(['--fixture',file,'--locales','en','--out',out]),/Daily package already locked: .* inspect the previous job/);
    assert.equal(await readFile(lock,'utf8'),'existing', 'a contender must preserve the active owner lock');
  } finally {await rm(out,{recursive:true,force:true});}
});

test('daily package lock is cleaned when staging directory creation fails', async()=>{
  const fixture=JSON.parse(await readFile(new URL('./fixtures/market.json',import.meta.url)));
  const out=await mkdtemp(path.join(os.tmpdir(),'shorts-mkdtemp-fail-'));
  const file=path.join(out,'market.json');
  try {
    await writeFile(file,JSON.stringify(fixture));
    const lock=path.join(out,`${sgtDay(fixture.generatedAt)}-fixture.lock`);
    await assert.rejects(
      ()=>main(['--fixture',file,'--locales','en','--out',out],{mkdtemp:async()=>{ throw new Error('forced mkdtemp failure'); }}),
      /forced mkdtemp failure/
    );
    await assert.rejects(()=>access(lock),error=>error.code==='ENOENT');
  } finally {await rm(out,{recursive:true,force:true});}
});
