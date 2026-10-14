#!/usr/bin/env node
// Promo Short pipeline: locale voiceover (every locale, no silent output) -> HyperFrames build/lint/render
// -> mux narration + ducked background music -> hard audio gate -> contact sheet per file. Nothing is uploaded.
//
//   node make-promo.mjs --spec bybit-stocks.json --out <dir> [--locales en,es] [--formats vertical,square] [--music bright|calm|none-NOT-ALLOWED]
//
// Writes <out>/<locale>-<format>.mp4 and <out>/<locale>-<format>-contact.png.
// Intermediate files live in <out>/work. Existing narration takes are reused (delete to retake).
// Owner rule 2026-10-14: every video carries a natural voiceover in its locale plus light music, and must pass
// ../audio-gate.mjs (audio stream, mean >= -30 dB, <= 40% silence). A locale without narration lines fails.
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, rm, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, schedule, narrationFor } from './build.mjs';
import { assertAudible } from '../audio-gate.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const HF = join(root, '../../academy-v3/node_modules/.bin/hyperframes');
const FFMPEG = process.env.FFMPEG || '/opt/homebrew/bin/ffmpeg';
const FFPROBE = process.env.FFPROBE || '/opt/homebrew/bin/ffprobe';
const X265_LIB = '/opt/homebrew/Cellar/x265/4.2/lib';
const TTS_PYTHON = process.env.PROMO_TTS_PYTHON || '/Volumes/致态2TB/nx-agents/education/v2/.venv/bin/python';
const VOICE_PY = join(root, '../voice/voice.py');
const MUSIC_PY = join(root, '../voice/music_bed.py');
const MEDIA = process.env.NX_MEDIA_DIR || '/Volumes/致态2TB/nx-agents/media';
const MUSIC_GAIN = Number(process.env.PROMO_MUSIC_GAIN || 0.22); // bed level before ducking (about -13 dB under the voice)

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));
if (!args.spec || !args.out) { console.error('Usage: node make-promo.mjs --spec <json> --out <dir> [--locales a,b] [--formats vertical,square] [--music bright|calm]'); process.exit(2); }
if (args['no-voice']) { console.error('--no-voice was removed: every video needs a voiceover (owner rule 2026-10-14).'); process.exit(2); }
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

async function narrate(locale, dir) {
  await mkdir(dir, { recursive: true });
  const lines = spec.scenes.map(scene => ({ id: `${spec.id}-${locale}-${scene.id}`, scene: scene.id, text: narrationFor(spec, scene, locale) }));
  const missing = lines.filter(l => !l.text).map(l => l.scene);
  if (missing.length) throw new Error(`No ${locale} narration for scenes ${missing.join(', ')}: add spec.narration_i18n["${locale}"] (silent videos are not allowed)`);
  const todo = [];
  for (const l of lines) if (!(await exists(join(dir, `${l.id}.wav`)))) todo.push(l);
  if (todo.length) {
    const list = join(dir, `${locale}-lines.json`);
    await writeFile(list, JSON.stringify(todo.map(({ id, text }) => ({ id, text }))));
    todo.forEach(l => console.log(`TTS ${locale} ${l.scene}: ${l.text}`));
    await run(TTS_PYTHON, ['-I', VOICE_PY, '--locale', locale, '--out', dir, '--lines', list], { extraEnv: { HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' } });
  }
  const speech = {}, files = {};
  for (const l of lines) {
    const file = join(dir, `${l.id}.wav`);
    if (!(await exists(file))) throw new Error(`TTS produced no audio for ${locale} ${l.scene}`);
    files[l.scene] = file;
    speech[l.scene] = Math.round(await duration(file) * 1000) / 1000;
  }
  return { speech, files };
}

async function musicBed(style) {
  const file = join(MEDIA, 'music', `${style}.wav`);
  if (!(await exists(file))) {
    await mkdir(dirname(file), { recursive: true });
    await run(TTS_PYTHON, ['-I', MUSIC_PY, file, '--style', style, '--seconds', '64']);
  }
  return file;
}

// Voice: each scene take placed at scene start + lead-in. Music: looped bed, faded, ducked under the voice with a
// sidechain compressor, then the mix is loudness-normalised for Shorts (-16 LUFS, -1.5 dBTP).
async function mux(silent, target, voice, music) {
  const { scenes, total } = schedule(spec);
  const argv = ['-hide_banner', '-y', '-i', silent];
  scenes.forEach(s => argv.push('-i', voice.files[s.id]));
  argv.push('-stream_loop', '-1', '-i', music);
  const m = scenes.length + 1;
  const lead = spec.lead_in ?? 0.3;
  const parts = scenes.map((s, i) => `[${i + 1}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round((s.start + lead) * 1000)}:all=1[a${i}]`);
  parts.push(`${scenes.map((_, i) => `[a${i}]`).join('')}amix=inputs=${scenes.length}:normalize=0,apad,atrim=0:${total},asplit=2[voice][key]`);
  parts.push(`[${m}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${total},volume=${MUSIC_GAIN},afade=t=in:d=0.6,afade=t=out:st=${Math.max(0, total - 1.8)}:d=1.8[bed]`);
  parts.push(`[bed][key]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350:makeup=1[ducked]`);
  parts.push(`[voice][ducked]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[aout]`);
  argv.push('-filter_complex', parts.join(';'), '-map', '0:v', '-map', '[aout]');
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
const music = await musicBed(String(args.music || 'bright'));
const report = [];
for (const locale of locales) {
  const voice = await narrate(locale, join(out, 'work/voice', locale));
  const dirs = await build(spec, locale, formats, { speech: voice.speech });
  for (const [k, dir] of dirs.entries()) {
    const format = formats[k];
    await run(HF, ['lint', dir, '--json']).catch(e => { throw new Error(`lint failed for ${locale}-${format}: ${e.message}`); });
    const silent = join(out, 'work', `${locale}-${format}-silent.mp4`);
    await rm(silent, { force: true });
    console.log(`Render ${locale}-${format} ...`);
    await run(HF, ['render', dir, '--fps', '30', '--quality', 'high', '--workers', '4', '--strict', '--quiet', '--output', silent]);
    const target = join(out, `${locale}-${format}.mp4`);
    await mux(silent, target, voice, music);
    try { await assertAudible(target, { platform: 'render' }); }
    catch (e) { await rm(target, { force: true }); throw e; }
    await contactSheet(target, join(out, `${locale}-${format}-contact.png`), format);
    const d = await duration(target);
    report.push({ file: target, duration: d, voiced: true });
    console.log(`  -> ${target} (${d.toFixed(2)}s, narrated + music, audio gate passed)`);
  }
}
console.log(JSON.stringify(report, null, 2));
