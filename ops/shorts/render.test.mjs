import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { buildSrt, renderShort } from './render.mjs';
import {buildPackage,validateData} from './builders.mjs';

const execFileAsync = promisify(execFile);

test('renderShort creates a 1080x1920 H264/AAC 30fps 3-slide smoke video', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexu-shorts-render-'));
  try {
    const slides = await fixtureSlides(3);
    const expectedDuration = slides.reduce((total, slide) => total + slide.duration, 0);
    const result = await renderShort(slides, tempDir, { voice: false, lang: 'en', format: 'portrait' });

    assert.equal(result.duration, expectedDuration);
    assert.equal(result.voice, false);
    assert.equal(result.animationSeconds,.8);
    assert.equal(result.crossfadeSeconds,.25);
    assert.equal(result.format, 'portrait');
    assert.equal(result.width, 1080);
    assert.equal(result.height, 1920);
    assert.equal(result.videoPath, path.join(tempDir, 'short.mp4'));
    assert.equal(result.posterPath, path.join(tempDir, 'poster.png'));
    assert.equal(result.srtPath, path.join(tempDir, 'captions.srt'));
    assert.equal(result.captions.length,3);
    assert.ok(result.captions.flat().some(c=>[...c.text].length>16), 'captions should stay as complete sentences, not 16-character fragments');
    assert.match(await fs.readFile(result.srtPath, 'utf8'), /00:00:00,000 --> 00:00:/);
    await fs.access(result.posterPath);

    const probe = await probeVideo(result);
    const video = probe.streams.find((stream) => stream.codec_type === 'video');
    const audio = probe.streams.find((stream) => stream.codec_type === 'audio');
    assert.equal(video.width, 1080);
    assert.equal(video.height, 1920);
    assert.equal(video.codec_name, 'h264');
    assert.equal(video.r_frame_rate, '30/1');
    assert.equal(audio.codec_name, 'aac');
    assert.ok(Math.abs(Number(probe.format.duration) - expectedDuration) < 0.2, `duration was ${probe.format.duration}`);
    const frame = async time => (await execFileAsync(result.ffmpeg,[
      '-v','error','-ss',String(time),'-i',result.videoPath,'-frames:v','1',
      '-vf','scale=108:192,format=gray','-f','rawvideo','pipe:1',
    ],{encoding:'buffer',env:{...process.env,DYLD_LIBRARY_PATH:'/opt/homebrew/Cellar/x265/4.2/lib'}})).stdout;
    const slideDuration = slides[0].duration;
    const [early,settled,before,mid,after]=await Promise.all([
      .1,
      1,
      slideDuration - .1,
      slideDuration + .13,
      slideDuration + .4,
    ].map(frame));
    const difference=(a,b)=>a.reduce((sum,v,i)=>sum+Math.abs(v-b[i]),0)/a.length;
    assert.ok(difference(early,settled)>1,'encoded number count-up must change pixels');
    assert.ok(difference(mid,before)>1 && difference(mid,after)>1,'cross-fade must contain a distinct intermediate frame');
    assert.ok(mid.reduce((a,b)=>a+b,0)/mid.length>10,'transition must not fade through black');
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('renderShort creates square MP4, poster, and absolute SRT output', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexu-shorts-square-'));
  try {
    const slides = await fixtureSlides(1);
    const result = await renderShort(slides, tempDir, { voice: false, lang: 'en', format: 'square' });
    assert.equal(result.format, 'square');
    assert.equal(result.width, 1080);
    assert.equal(result.height, 1080);
    await fs.access(path.join(tempDir, 'short.mp4'));
    await fs.access(path.join(tempDir, 'poster.png'));
    assert.equal(await fs.readFile(path.join(tempDir, 'captions.srt'), 'utf8'), buildSrt(result.captions, result.durations));

    const probe = await probeVideo(result);
    const video = probe.streams.find((stream) => stream.codec_type === 'video');
    assert.equal(video.width, 1080);
    assert.equal(video.height, 1080);
    assert.ok(Math.abs(Number(probe.format.duration) - result.duration) < 0.2, `duration was ${probe.format.duration}`);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('voice narration is rejected for non-English locales before synthesis', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexu-shorts-voice-reject-'));
  try {
    const slides = await fixtureSlides(1);
    await assert.rejects(
      () => renderShort(slides, tempDir, { voice: true, lang: 'vi', format: 'portrait' }),
      /English-only/,
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

async function fixtureSlides(count) {
  const fixture=JSON.parse(await fs.readFile(new URL('./fixtures/market.json',import.meta.url)));
  return buildPackage(validateData(fixture,null,Date.parse(fixture.generatedAt)),'en').slides.slice(0,count);
}

async function probeVideo(result) {
  const { stdout } = await execFileAsync(result.ffprobe, [
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
  return JSON.parse(stdout);
}
