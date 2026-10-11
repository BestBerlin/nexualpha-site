import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { parseSayVoices, renderShort, voiceCandidates } from './render.mjs';

const execFileAsync = promisify(execFile);

test('renderShort creates a 1080x1920 H264/AAC 30fps 21s smoke video', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexu-shorts-render-'));
  try {
    const result = await renderShort([
      {
        title: 'BTC market snapshot',
        lines: ['Spot reference price: 68420 dollars.', 'Open interest change: plus 2.4 percent.'],
        narration: 'BTC market snapshot. Spot reference price is 68420 dollars. Open interest change is plus 2.4 percent.',
        duration: 7,
        bar: { longShare: 0.63 },
      },
      {
        title: 'Funding pressure',
        lines: ['BTC perpetual funding: +0.020 percent.', 'ETH perpetual funding: -0.010 percent.'],
        narration: 'Funding pressure. BTC perpetual funding is plus 0.020 percent. ETH perpetual funding is minus 0.010 percent.',
        duration: 7,
        rates: [{ text: 'BTC perp +0.020%', rate: 0.02 }, { text: 'ETH perp -0.010%', rate: -0.01 }],
      },
      {
        title: 'Exchange comparison',
        lines: ['Long accounts: 63 percent.', 'Short accounts: 37 percent.'],
        narration: 'Exchange comparison. Long accounts are 63 percent. Short accounts are 37 percent.',
        duration: 7,
      },
    ], tempDir, { voice: false, lang: 'en' });

    assert.equal(result.duration, 21);
    assert.equal(result.voice, false);

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
