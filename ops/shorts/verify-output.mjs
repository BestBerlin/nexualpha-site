#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {buildSrt} from './render.mjs';
import {PLATFORM_KEYS} from './strings.mjs';
const root=process.argv[2];
if(!root) throw new Error('Usage: node ops/shorts/verify-output.mjs DAILY_DIRECTORY');
const source=JSON.parse(await readFile(path.join(root,'source.json'),'utf8'));
let count=0;
for(const entry of await readdir(root,{withFileTypes:true})) {
  if(!entry.isDirectory()) continue;
  const lang=entry.name, dir=path.join(root,lang);
  const meta=JSON.parse(await readFile(path.join(dir,'meta.json'),'utf8'));
  assert.equal(meta.generatedAt,source.market.generatedAt);
  assert.equal(meta.dataMode,source.dataMode);
  const prefix={en:'',es:'/es','pt-BR':'/pt-br',vi:'/vi',id:'/id-id',tr:'/tr',ru:'/ru','zh-Hans':'/zh-hans',ar:'/ar'}[lang];
  assert.notEqual(prefix,undefined,'Unknown locale');
  for(const platform of PLATFORM_KEYS) {
    assert.equal(meta.platforms[platform].cta.url,`https://nexualpha.com${prefix}/liquidations?src=${platform}-short`);
    assert.doesNotMatch(meta.platforms[platform].description,/\b(?:ref|invite|partner|code)=/i);
  }
  for(const [format,expectedHeight] of [['portrait',1920],['square',1080]]) {
    const render=meta.renders[format];
    const media=JSON.parse(execFileSync(process.env.FFPROBE||'/opt/homebrew/bin/ffprobe',[
      '-v','error','-show_entries','stream=codec_type,codec_name,width,height,r_frame_rate','-show_entries','format=duration','-of','json',path.join(dir,render.videoPath)
    ],{encoding:'utf8',env:{...process.env,DYLD_LIBRARY_PATH:[process.env.DYLD_LIBRARY_PATH,'/opt/homebrew/Cellar/x265/4.2/lib'].filter(Boolean).join(':')}}));
    const video=media.streams.find(stream=>stream.codec_type==='video');
    assert.equal(video.width,1080);assert.equal(video.height,expectedHeight);
    assert.equal(video.codec_name,'h264');assert.equal(video.r_frame_rate,'30/1');
    assert.equal(media.streams.find(stream=>stream.codec_type==='audio').codec_name,'aac');
    const duration=Number(media.format.duration);
    assert.ok(duration>=25&&duration<=35);
    assert.ok(Math.abs(duration-render.duration)<.2);
    const poster=await readFile(path.join(dir,render.posterPath));
    assert.equal(poster.subarray(1,4).toString(),'PNG');
    assert.equal(poster.readUInt32BE(16),1080);assert.equal(poster.readUInt32BE(20),expectedHeight);
    assert.equal(await readFile(path.join(dir,render.srtPath),'utf8'),buildSrt(render.captions,render.durations));
    assert.ok(render.captions.flat().every(caption=>/[。！？.!?]$/.test(caption.text)));
    console.log(`${lang}/${format}: ${video.width}x${video.height}, H264/AAC, 30fps, ${duration}s; poster/SRT/metadata PASS`);
    count++;
  }
}
assert.ok(count>0,'No locale packages found');
console.log(`${count} videos verified from one ${source.dataMode} snapshot (${source.market.generatedAt}).`);
