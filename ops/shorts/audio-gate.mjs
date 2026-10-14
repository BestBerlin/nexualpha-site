#!/usr/bin/env node
// Hard audio gate (owner rule 2026-10-14): no video leaves this machine without audible sound.
// Fails when there is no audio stream, the mean volume is below -30 dB, or more than 40% of the
// duration is silent (silencedetect at -50 dB for 0.5 s or longer). Every result is logged.
//
//   node ops/shorts/audio-gate.mjs FILE [FILE...] [--platform youtube]   (exit 0 pass, 3 fail)
//   import { assertAudible } from './audio-gate.mjs'; await assertAudible(file, { platform: 'x' });
import { spawn } from 'node:child_process';
import { appendFile, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIMITS = { minMeanDb: -30, maxSilentRatio: 0.4, silenceNoise: '-50dB', silenceMin: 0.5 };
const FFMPEG = process.env.FFMPEG || '/opt/homebrew/bin/ffmpeg';
const FFPROBE = process.env.FFPROBE || '/opt/homebrew/bin/ffprobe';
const LOG = process.env.AUDIO_GATE_LOG || '/Volumes/致态2TB/nx-agents/media/audio-gate.log';

function run(cmd, argv) {
  return new Promise((ok, fail) => {
    const child = spawn(cmd, argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });
    child.on('error', fail);
    child.on('close', code => ok({ code, stdout, stderr }));
  });
}

// Pure parser so the thresholds are testable without media files.
export function evaluate({ audioStreams, duration, volumedetect = '' }) {
  const reasons = [];
  const result = { audioStreams, duration, meanDb: null, maxDb: null, silentRatio: null };
  if (!audioStreams) return { ...result, ok: false, reasons: ['no audio stream'] };
  const mean = volumedetect.match(/mean_volume:\s*(-?[\d.]+) dB/);
  const max = volumedetect.match(/max_volume:\s*(-?[\d.]+) dB/);
  result.meanDb = mean ? Number(mean[1]) : null;
  result.maxDb = max ? Number(max[1]) : null;
  const starts = [...volumedetect.matchAll(/silence_start:\s*(-?[\d.]+)/g)].map(m => Number(m[1]));
  const ends = [...volumedetect.matchAll(/silence_end:\s*(-?[\d.]+)/g)].map(m => Number(m[1]));
  let silent = 0;
  starts.forEach((s, i) => { silent += Math.max(0, Math.min(ends[i] ?? duration, duration) - Math.max(0, s)); });
  result.silentRatio = duration > 0 ? Math.round(silent / duration * 1000) / 1000 : 1;
  if (result.meanDb === null || result.meanDb < LIMITS.minMeanDb) reasons.push(`mean volume ${result.meanDb ?? '-inf'} dB < ${LIMITS.minMeanDb} dB`);
  if (result.silentRatio > LIMITS.maxSilentRatio) reasons.push(`${Math.round(result.silentRatio * 100)}% silent > ${LIMITS.maxSilentRatio * 100}%`);
  return { ...result, ok: reasons.length === 0, reasons };
}

export async function checkAudio(file) {
  const path = resolve(file);
  try { await stat(path); } catch { return { file: path, ok: false, reasons: ['file missing'] }; }
  const probe = await run(FFPROBE, ['-v', 'error', '-show_entries', 'stream=codec_type:format=duration', '-of', 'json', path]);
  let info = {};
  try { info = JSON.parse(probe.stdout || '{}'); } catch { /* treated as no streams */ }
  const audioStreams = (info.streams || []).filter(s => s.codec_type === 'audio').length;
  const duration = Number(info.format?.duration || 0);
  let volumedetect = '';
  if (audioStreams) {
    const v = await run(FFMPEG, ['-hide_banner', '-nostats', '-i', path, '-map', '0:a:0', '-af',
      `volumedetect,silencedetect=noise=${LIMITS.silenceNoise}:d=${LIMITS.silenceMin}`, '-f', 'null', '-']);
    volumedetect = v.stderr;
  }
  return { file: path, ...evaluate({ audioStreams, duration, volumedetect }) };
}

async function log(result, platform) {
  try {
    await mkdir(dirname(LOG), { recursive: true });
    await appendFile(LOG, JSON.stringify({ ts: new Date().toISOString(), platform, result: result.ok ? 'PASS' : 'BLOCKED', ...result }) + '\n');
  } catch { /* logging must never mask the verdict */ }
}

export class AudioGateError extends Error {}

export async function assertAudible(file, { platform = 'unknown' } = {}) {
  const result = await checkAudio(file);
  await log(result, platform);
  if (!result.ok) throw new AudioGateError(`[audio-gate] upload BLOCKED for ${platform}: ${result.file}: ${result.reasons.join('; ')}`);
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  let platform = 'cli';
  const i = argv.indexOf('--platform');
  if (i >= 0) { platform = argv[i + 1]; argv.splice(i, 2); }
  if (!argv.length) { console.error('Usage: node audio-gate.mjs FILE [FILE...] [--platform name]'); process.exit(2); }
  let bad = 0;
  for (const f of argv) {
    const r = await checkAudio(f);
    await log(r, platform);
    console.log(`${r.ok ? 'PASS' : 'FAIL'} ${JSON.stringify(r)}`);
    if (!r.ok) bad++;
  }
  process.exit(bad ? 3 : 0);
}
