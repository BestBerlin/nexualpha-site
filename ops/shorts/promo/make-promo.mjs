#!/usr/bin/env node
// Promo Short pipeline: (optional English clone narration) -> HyperFrames build/lint/render
// -> mux narration or silent AAC -> contact sheet per file. Nothing is uploaded.
//
//   node make-promo.mjs --spec bybit-stocks.json --out <dir> [--locales en,es] [--formats vertical,square] [--no-voice]
//
// Writes <out>/<locale>-<format>.mp4 and <out>/<locale>-<format>-contact.png.
// Intermediate files live in <out>/work. Existing narration takes are reused (delete to retake).
import { spawn } from 'node:child_process';
import { readFile, mkdir, readdir, rm, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, schedule } from './build.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const HF = join(root, '../../academy-v3/node_modules/.bin/hyperframes');
const FFMPEG = process.env.FFMPEG || '/opt/homebrew/bin/ffmpeg';
const FFPROBE = process.env.FFPROBE || '/opt/homebrew/bin/ffprobe';
const X265_LIB = '/opt/homebrew/Cellar/x265/4.2/lib';
const TTS_PYTHON = process.env.PROMO_TTS_PYTHON || '/Volumes/致态2TB/nx-agents/education/v2/.venv/bin/python';
const TTS_MODEL = 'mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit';
const REF_AUDIO = '/Volumes/致态2TB/nx-agents/education/v2/voice-en-master-reference.wav';
const REF_TEXT = "Your KYC got rejected again? Don't worry. Most rejections come down to just a few simple mistakes. Let's fix them together.";

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));
if (!args.spec || !args.out) { console.error('Usage: node make-promo.mjs --spec <json> --out <dir> [--locales a,b] [--formats vertical,square] [--no-voice]'); process.exit(2); }
const spec = JSON.parse(await readFile(resolve(args.spec), 'utf8'));
const out = resolve(args.out);
const locales = args.locales ? String(args.locales).split(',') : Object.keys(spec.copy);
const formats = args.formats ? String(args.formats).split(',') : ['vertical', 'square'];
const env = { ...process.env, DO_NOT_TRACK: '1', DYLD_LIBRARY_PATH: [X265_LIB, process.env.DYLD_LIBRARY_PATH].filter(Boolean).join(':') };

function run(cmd, argv, { collect = false, extraEnv = {} } = {}) {
  return new Promise((ok, fail) => {
    const child = spawn(cmd, argv, { env: { ...env, ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });
    child.on('error', fail);
    child.on('close', code => code === 0 ? ok(collect ? stdout : undefined) : fail(new Error(`${cmd} ${argv.slice(0, 3).join(' ')} exited ${code}\n${(stderr || stdout).slice(-2000)}`)));
  });
}
const duration = async f => Number((await run(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { collect: true })).trim());
const exists = f => access(f).then(() => true, () => false);

async function narrate(dir) {
  await mkdir(dir, { recursive: true });
  const speech = {}, files = {};
  for (const scene of spec.scenes) {
    const prefix = `${spec.id}-${scene.id}`;
    let file = join(dir, `${prefix}_000.wav`);
    if (!(await exists(file))) {
      console.log(`TTS ${scene.id}: ${scene.narration}`);
      await run(TTS_PYTHON, ['-m', 'mlx_audio.tts.generate', '--model', TTS_MODEL, '--lang_code', 'en', '--ref_audio', REF_AUDIO, '--ref_text', REF_TEXT,
        '--text', scene.narration, '--output_path', dir, '--file_prefix', prefix], { extraEnv: { HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' } });
      const made = (await readdir(dir)).filter(f => f.startsWith(prefix) && f.endsWith('.wav')).sort();
      if (!made.length) throw new Error(`TTS produced no audio for ${scene.id}`);
      file = join(dir, made[0]);
    }
    files[scene.id] = file;
    speech[scene.id] = Math.round(await duration(file) * 1000) / 1000;
  }
  return { speech, files };
}

async function mux(silent, target, voice) {
  const { scenes, total } = schedule(spec);
  const argv = ['-hide_banner', '-y', '-i', silent];
  if (voice) {
    scenes.forEach(s => argv.push('-i', voice.files[s.id]));
    const lead = spec.lead_in ?? 0.3;
    const parts = scenes.map((s, i) => `[${i + 1}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round((s.start + lead) * 1000)}:all=1[a${i}]`);
    parts.push(`${scenes.map((_, i) => `[a${i}]`).join('')}amix=inputs=${scenes.length}:normalize=0,apad,atrim=0:${total},loudnorm=I=-16:TP=-1.5:LRA=11[aout]`);
    argv.push('-filter_complex', parts.join(';'), '-map', '0:v', '-map', '[aout]');
  } else {
    argv.push('-f', 'lavfi', '-t', String(total), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000', '-map', '0:v', '-map', '1:a');
  }
  argv.push('-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-t', String(total), '-movflags', '+faststart', target);
  await run(FFMPEG, argv);
}

// One frame per scene at its settled point plus the closing frame, from the encoded MP4.
async function contactSheet(video, target, format) {
  const { scenes, total } = schedule(spec);
  const times = [...scenes.map(s => s.start + Math.min(s.duration - .3, Math.max(2.2, s.duration * .7))), total - .2];
  const w = format === 'square' ? 300 : 240;
  const argv = ['-hide_banner', '-y'];
  times.forEach(t => argv.push('-ss', t.toFixed(2), '-i', video));
  const f = times.map((_, i) => `[${i}:v]scale=${w}:-2,pad=iw+8:ih+8:4:4:color=0x333a48[v${i}]`);
  f.push(`${times.map((_, i) => `[v${i}]`).join('')}hstack=inputs=${times.length}[s]`);
  argv.push('-filter_complex', f.join(';'), '-map', '[s]', '-frames:v', '1', target);
  await run(FFMPEG, argv);
}

await mkdir(join(out, 'work'), { recursive: true });
let voice = null;
if (!args['no-voice'] && locales.includes(spec.narration_locale)) voice = await narrate(join(out, 'work/voice'));
const report = [];
for (const locale of locales) {
  const voiced = voice && locale === spec.narration_locale;
  const dirs = await build(spec, locale, formats, { speech: voiced ? voice.speech : {} });
  for (const [k, dir] of dirs.entries()) {
    const format = formats[k];
    await run(HF, ['lint', dir, '--json']).catch(e => { throw new Error(`lint failed for ${locale}-${format}: ${e.message}`); });
    const silent = join(out, 'work', `${locale}-${format}-silent.mp4`);
    await rm(silent, { force: true });
    console.log(`Render ${locale}-${format} ...`);
    await run(HF, ['render', dir, '--fps', '30', '--quality', 'high', '--workers', '4', '--strict', '--quiet', '--output', silent]);
    const target = join(out, `${locale}-${format}.mp4`);
    await mux(silent, target, voiced ? voice : null);
    await contactSheet(target, join(out, `${locale}-${format}-contact.png`), format);
    const d = await duration(target);
    report.push({ file: target, duration: d, voiced: Boolean(voiced) });
    console.log(`  -> ${target} (${d.toFixed(2)}s${voiced ? ', narrated' : ', silent track'})`);
  }
}
console.log(JSON.stringify(report, null, 2));
