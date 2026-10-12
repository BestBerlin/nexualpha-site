// Builds one narration track per episode from aligned episode JSON and muxes it into the silent renders.
//   node mux-narration.mjs E05 [E09 E21]
// Track: each trimmed wav (build/narration/trimmed, see align-narration.mjs) placed at scene start + line start,
// atempo from line.narration, two-pass loudnorm to -16 LUFS. Output: renders/final/<EP>-<locale>-<format>.mp4.
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { schedule } from './contract.mjs';
import { probeSeconds } from './align-narration.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const lib = ['/opt/homebrew/Cellar/x265/4.2/lib', '/opt/homebrew/Cellar/x265/4.3/lib'].find(existsSync);
const env = lib ? { ...process.env, DYLD_LIBRARY_PATH: lib } : process.env;
const ffmpeg = (args, opts = {}) => execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...args], { env, maxBuffer: 1 << 26, ...opts });
const LOUDNORM = 'I=-16:TP=-1.5:LRA=11';

export function placements(episode) {
  const out = [];
  for (const scene of schedule(episode).scenes) {
    const lines = scene.kind === 'shot' ? scene.shot.lines ?? [] : scene.lines ?? [];
    for (const line of lines) {
      if (!line.narration?.id) throw new Error(`Line without measured narration in ${scene.kind}`);
      out.push({ id: line.narration.id, at: scene.start + line.start, atempo: line.narration.atempo ?? 1 });
    }
  }
  return out;
}

function buildTrack(id) {
  const episode = JSON.parse(readFileSync(join(root, `episodes/${id}.json`), 'utf8'));
  const total = schedule(episode).duration;
  const items = placements(episode);
  const dir = join(root, 'build/narration/tracks');
  mkdirSync(dir, { recursive: true });
  const inputs = ['-f', 'lavfi', '-t', String(total), '-i', 'anullsrc=r=48000:cl=stereo'];
  const chains = [];
  items.forEach((item, i) => {
    const wav = join(root, 'build/narration/trimmed', `${item.id}.wav`);
    if (!existsSync(wav)) throw new Error(`Missing trimmed narration ${wav}; run node align-narration.mjs measure`);
    inputs.push('-i', wav);
    const ms = Math.round(item.at * 1000);
    chains.push(`[${i + 1}:a]${item.atempo !== 1 ? `atempo=${item.atempo},` : ''}aresample=48000,aformat=channel_layouts=stereo,adelay=${ms}|${ms}[a${i}]`);
  });
  const mix = `[0:a]${items.map((_, i) => `[a${i}]`).join('')}amix=inputs=${items.length + 1}:duration=first:normalize=0,atrim=0:${total}`;
  const raw = join(dir, `${id}-raw.wav`), out = join(dir, `${id}.wav`);
  ffmpeg([...inputs, '-filter_complex', `${chains.join(';')};${mix}[mix]`, '-map', '[mix]', '-c:a', 'pcm_s16le', raw]);
  return { total, raw, out };
}

function loudnormPass2(track) {
  // Pass 1 measures (stats are printed on stderr), pass 2 applies linear normalisation.
  const r = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "$1" -af "loudnorm=${LOUDNORM}:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p'`, '_', track.raw], { env, encoding: 'utf8' });
  const m = JSON.parse(r);
  const af = `loudnorm=${LOUDNORM}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000,atrim=0:${track.total}`;
  ffmpeg(['-i', track.raw, '-af', af, '-ar', '48000', '-c:a', 'pcm_s16le', track.out]);
  return m;
}

const ids = process.argv.slice(2);
if (!ids.length) { console.error('Usage: node mux-narration.mjs E05 [E09 ...]'); process.exit(2); }
mkdirSync(join(root, 'renders/final'), { recursive: true });
for (const id of ids) {
  const track = buildTrack(id);
  const m = loudnormPass2(track);
  const check = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "$1" -af ebur128 -f null - 2>&1 | grep -E '^\\s+I:' | tail -1`, '_', track.out], { env, encoding: 'utf8' }).trim();
  console.log(`${id}: track ${track.total}s, input ${m.input_i} LUFS -> ${check}`);
  for (const locale of ['en', 'zh-Hans']) for (const format of ['landscape', 'portrait']) {
    const video = join(root, `renders/${id}-${locale}-${format}.mp4`);
    if (!existsSync(video)) continue;
    const final = join(root, `renders/final/${id}-${locale}-${format}.mp4`);
    ffmpeg(['-i', video, '-i', track.out, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(track.total), '-movflags', '+faststart', final]);
    const v = probeSeconds(video), f = probeSeconds(final);
    if (Math.abs(f - track.total) > 0.1 || Math.abs(v - track.total) > 0.1) throw new Error(`${final}: duration ${f}s (video ${v}s) vs ${track.total}s`);
    console.log(`  ${final} ${f.toFixed(3)}s`);
  }
}
