import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDailyArgs} from './daily.mjs';
import {readFile} from 'node:fs/promises';
import {writePreview} from './preview.mjs';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {buildPackage,validateData} from './builders.mjs';
test('daily CLI defaults to eight locales; rejects typos, duplicate locales and voice without English',()=>{
  assert.deepEqual(parseDailyArgs([]).locales,['en','es','pt-BR','vi','id','tr','ru','zh-Hans']);
  assert.deepEqual(parseDailyArgs(['--locales','en,vi','--out','ops/shorts/samples/test']).locales,['en','vi']);
  assert.deepEqual(parseDailyArgs(['--locales','ar']).locales,['ar']);
  for(const args of [['--locales','en,en'],['--locales','xx'],['--out'],['--wat'],['--locales','vi','--voice']]) assert.throws(()=>parseDailyArgs(args));
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
