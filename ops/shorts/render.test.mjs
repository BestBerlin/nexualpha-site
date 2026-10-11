import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { parseSayVoices, renderShort, voiceCandidates } from './render.mjs';
import {buildPackage,validateData} from './builders.mjs';

const execFileAsync = promisify(execFile);

test('renderShort creates a 1080x1920 H264/AAC 30fps 21s smoke video', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexu-shorts-render-'));
  try {
    const fixture=JSON.parse(await fs.readFile(new URL('./fixtures/market.json',import.meta.url)));
    const slides=buildPackage(validateData(fixture,null,Date.parse(fixture.generatedAt)),'en').slides.slice(0,3);
    const result = await renderShort(slides, tempDir, { voice: false, lang: 'en' });

    assert.equal(result.duration, 21);
    assert.equal(result.voice, false);
    assert.equal(result.animationSeconds,.8);
    assert.equal(result.crossfadeSeconds,.25);
    assert.equal(result.captions.length,3);
    assert.ok(result.captions.flat().every(c=>[...c.text].length<=16));

    const ffprobe = process.env.FFPROBE || '/opt/homebrew/bin/ffprobe';
    const { stdout } = await execFileAsync(ffprobe, [
      '-v', 'error',
      '-show_entries', 'stream=index,codec_type,codec_name,width,height,r_frame_rate',
      '-show_entries', 'format=duration',
      '-of', 'json',
      result.videoPath,
    ], {
      env: {
        ...process.env,
        DYLD_LIBRARY_PATH: process.env.DYLD_LIBRARY_PATH
          ? `/opt/homebrew/Cellar/x265/4.2/lib:${process.env.DYLD_LIBRARY_PATH}`
          : '/opt/homebrew/Cellar/x265/4.2/lib',
      },
    });
    const probe = JSON.parse(stdout);
    const video = probe.streams.find((stream) => stream.codec_type === 'video');
    const audio = probe.streams.find((stream) => stream.codec_type === 'audio');
    assert.equal(video.width, 1080);
    assert.equal(video.height, 1920);
    assert.equal(video.codec_name, 'h264');
    assert.equal(video.r_frame_rate, '30/1');
    assert.equal(audio.codec_name, 'aac');
    assert.ok(Math.abs(Number(probe.format.duration) - 21) < 0.2, `duration was ${probe.format.duration}`);
    const frame = async time => (await execFileAsync(result.ffmpeg,[
      '-v','error','-ss',String(time),'-i',result.videoPath,'-frames:v','1',
      '-vf','scale=108:192,format=gray','-f','rawvideo','pipe:1',
    ],{encoding:'buffer',env:{...process.env,DYLD_LIBRARY_PATH:'/opt/homebrew/Cellar/x265/4.2/lib'}})).stdout;
    const [early,settled,before,mid,after]=await Promise.all([.1,1,6.9,7.13,7.4].map(frame));
    const difference=(a,b)=>a.reduce((sum,v,i)=>sum+Math.abs(v-b[i]),0)/a.length;
    assert.ok(difference(early,settled)>1,'encoded number count-up must change pixels');
    assert.ok(difference(mid,before)>1 && difference(mid,after)>1,'cross-fade must contain a distinct intermediate frame');
    assert.ok(mid.reduce((a,b)=>a+b,0)/mid.length>10,'transition must not fade through black');
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('voiceCandidates keeps full localized Flo names and prefers zh_CN', () => {
  const voices = parseSayVoices(`
Flo (英语（美国）)        en_US    # Hello! My name is Flo.
Flo (中文（中国大陆）)      zh_CN    # 你好！我叫Flo。
Flo (中文（台湾）)        zh_TW    # 你好，我叫Flo。
Samantha            en_US    # Hello! My name is Samantha.
Tingting            zh_CN    # 你好！我叫婷婷。
Meijia              zh_CN    # 你好！我叫美佳。
`);

  assert.deepEqual(voiceCandidates(voices, 'zh-CN').map((voice) => voice.name), [
    'Tingting',
    'Flo (中文（中国大陆）)',
    'Meijia',
  ]);
  assert.deepEqual(voiceCandidates(voices, 'en').map((voice) => voice.name), [
    'Samantha',
    'Flo (英语（美国）)',
  ]);
});
