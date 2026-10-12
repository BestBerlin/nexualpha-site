// Re-takes narration lines that failed the listen check (verify-narration.py) or do not fit a contract window.
//   node retake-narration.mjs <line-id> [<line-id> ...] [--takes 3] [--prefer shortest|first]
// Each take uses the line's exact voice profile from build/narration/narration-plan.json (same command as narrate.sh),
// is transcribed with the cached faster-whisper model, and the first passing take (or the shortest passing take with
// --prefer shortest) replaces build/narration/audio/<id>_000.wav. The original is kept in takes/original/.
import { readFileSync, existsSync, mkdirSync, copyFileSync, rmSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { probeSeconds, TRIM_FILTER } from './align-narration.mjs';

const root = dirname(fileURLToPath(import.meta.url));
// Compare takes by speech length (edge silence trimmed exactly as align-narration measure does).
function spokenSeconds(wav) {
  const out = `${wav}.trim.wav`;
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', wav, '-af', TRIM_FILTER, '-ar', '48000', '-ac', '1', out]);
  const seconds = probeSeconds(out); rmSync(out, { force: true }); return seconds;
}
const PYTHON_BIN = process.env.PYTHON_BIN ?? '/Volumes/致态2TB/nx-agents/education/v2/.venv/bin/python';
const WHISPER_PYTHON = process.env.WHISPER_PYTHON ?? '/usr/bin/python3';
const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); if (i < 0) return fallback; const [, v] = args.splice(i, 2); return v; };
const takes = Number(opt('--takes', 3));
const prefer = opt('--prefer', 'first');
const ids = args;
if (!ids.length) { console.error('Usage: node retake-narration.mjs <line-id> ... [--takes 3] [--prefer shortest|first]'); process.exit(2); }

const plan = JSON.parse(readFileSync(join(root, 'build/narration/narration-plan.json'), 'utf8'));
const lines = new Map(plan.episodes.flatMap((e) => e.scenes.flatMap((s) => s.lines)).map((l) => [l.id, l]));
const env = { ...process.env, HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1', HF_DATASETS_OFFLINE: '1', HF_HUB_DISABLE_TELEMETRY: '1', TOKENIZERS_PARALLELISM: 'false' };
let failed = 0;
for (const id of ids) {
  const line = lines.get(id);
  if (!line) throw new Error(`Unknown narration line ${id}`);
  const profile = line.voice_profile === 'sam-voice-design' ? plan.voice_profiles.samVoiceDesign : plan.voice_profiles.englishMasterClone;
  const audio = join(root, 'build/narration/audio', `${id}_000.wav`);
  const originalDir = join(root, 'build/narration/takes/original');
  mkdirSync(originalDir, { recursive: true });
  if (existsSync(audio) && !existsSync(join(originalDir, `${id}_000.wav`))) copyFileSync(audio, join(originalDir, `${id}_000.wav`));
  // --prefer shortest (window fitting): the original, already listen-checked take competes too. Default mode replaces a failed take.
  const original = join(originalDir, `${id}_000.wav`);
  const passing = prefer === 'shortest' && existsSync(original) ? [{ wav: original, seconds: spokenSeconds(original), n: 0 }] : [];
  for (let n = 1; n <= takes; n++) {
    const dir = join(root, 'build/narration/takes', id, `take${n}`);
    rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
    const cmd = ['-m', 'mlx_audio.tts.generate', '--model', profile.model, '--lang_code', 'en'];
    if (profile.mode === 'clone') cmd.push('--ref_audio', profile.ref_audio, '--ref_text', profile.ref_text);
    else cmd.push('--instruct', profile.instruct);
    cmd.push('--text', line.text, '--output_path', dir, '--file_prefix', id);
    const gen = spawnSync(PYTHON_BIN, cmd, { env, encoding: 'utf8' });
    const wav = join(dir, `${id}_000.wav`);
    if (gen.status !== 0 || !existsSync(wav) || statSync(wav).size === 0) { console.error(`${id} take${n}: generation failed`); continue; }
    const check = spawnSync(WHISPER_PYTHON, [join(root, 'verify-narration.py'), '--ids', id, '--audio-dir', dir, '--out', join(dir, 'verify.json')], { encoding: 'utf8' });
    const verdict = JSON.parse(readFileSync(join(dir, 'verify.json'), 'utf8'))[id];
    const seconds = spokenSeconds(wav);
    console.log(`${id} take${n}: ${verdict.pass ? 'PASS' : 'FAIL'} ${seconds.toFixed(2)}s heard="${verdict.heard}"`);
    if (verdict.pass) { passing.push({ wav, seconds, n }); if (prefer === 'first') break; }
  }
  if (!passing.length) { console.error(`${id}: no passing take; original kept`); failed++; continue; }
  const best = passing.sort((a, b) => a.seconds - b.seconds)[0];
  copyFileSync(best.wav, audio);
  console.log(`${id}: using ${best.n ? `take${best.n}` : 'original'} (${best.seconds.toFixed(2)}s spoken)`);
}
process.exit(failed ? 1 : 0);
