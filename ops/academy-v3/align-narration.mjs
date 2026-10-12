// Narration alignment for Academy v3 samples.
//   node align-narration.mjs measure   -> trims generated wavs, writes episodes/narration-timing.json
//   (from-v3.mjs applies narration-timing.json when it regenerates episodes/*.json)
// Timings stay shot-local seconds. Scenes only grow (frame-aligned); fixed-length contract windows
// (problem 6s, hook 3..7s, close 4..6s, conversion 4..12s) are honoured with tightened padding and,
// only when needed, an atempo of at most 1.08 (otherwise the build fails).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
export const LEAD = 0.25, GAP = 0.3, TAIL = 0.25, TIGHT = 0.15;
// Lead decision 2026-10-12: atempo never exceeds 1.08 (no compromise band); windows were widened instead.
export const ATEMPO_NORMAL = 1.08, ATEMPO_COMPROMISE = 1.08;
const round = n => Math.round(n * 1000) / 1000;
// Scene growth uses 0.1s steps (3 frames at 30fps) so durations stay frame-aligned and readable.
const frameCeil = n => Math.ceil(n * 10 - 1e-6) / 10;
const pad2 = n => String(n).padStart(2, '0');

// Proportional word timing that preserves the complete line text (spaces/punctuation join the previous token).
export function spreadWords(text, start, end, locale) {
  const tokens = [];
  for (const { segment, isWordLike } of new Intl.Segmenter(locale, { granularity: 'word' }).segment(text)) {
    if ((!isWordLike || !segment.trim()) && tokens.length) tokens[tokens.length - 1] += segment;
    else if (!tokens.length && !segment.trim()) continue;
    else tokens.push(segment);
  }
  const weight = t => Math.max(1, [...t.replace(/\s/g, '')].length);
  const total = tokens.reduce((n, t) => n + weight(t), 0);
  let cursor = start, acc = 0;
  return tokens.map((t, i) => {
    acc += weight(t);
    const wEnd = i === tokens.length - 1 ? end : round(start + (end - start) * acc / total);
    const word = { text: t, start: round(cursor), end: wEnd };
    cursor = wEnd;
    return word;
  });
}

// Places measured lines inside one container. Returns {duration, lines:[{start,end,atempo}], compromise}.
export function fitLines(seconds, { duration, min = duration, max = Infinity, label }) {
  const speech = seconds.reduce((a, b) => a + b, 0);
  const gaps = GAP * Math.max(0, seconds.length - 1);
  let lead = LEAD, tail = TAIL, atempo = 1, compromise = null;
  let needed = lead + speech + gaps + tail;
  if (needed > max) { lead = TIGHT; tail = TIGHT; needed = lead + speech + gaps + tail; }
  if (needed > max) {
    atempo = Math.ceil(speech / (max - lead - tail - gaps) * 1000) / 1000;
    if (atempo > ATEMPO_COMPROMISE) throw new Error(`${label}: narration needs atempo ${atempo} (> ${ATEMPO_COMPROMISE}) to fit ${max}s`);
    if (atempo > ATEMPO_NORMAL) compromise = `${label}: contract max ${max}s with atempo ${atempo}`;
  }
  const out = [];
  let cursor = lead;
  for (const s of seconds) {
    const len = s / atempo;
    out.push({ start: round(cursor), end: round(cursor + len), atempo });
    cursor += len + GAP;
  }
  const lastEnd = out.length ? out.at(-1).end : 0;
  const fitted = Math.min(max, Math.max(duration, min, frameCeil(lastEnd + tail)));
  if (out.length && out.at(-1).end > fitted) throw new Error(`${label}: line end ${out.at(-1).end} exceeds ${fitted}`);
  return { duration: Math.round(fitted * 10) / 10, lines: out, compromise };
}

export function planId(episodeId, sourceIndex, kind, lineIndex, speaker) {
  const k = kind === 'shot' ? (sourceIndex === 0 ? 'problem' : 'lesson') : kind;
  return `${episodeId.toLowerCase()}-${pad2(sourceIndex)}-${k}-l${pad2(lineIndex + 1)}-${speaker}`;
}

// Applies measured narration to a freshly converted episode (pure; returns a new object).
export function applyNarrationTiming(converted, timing) {
  const ep = structuredClone(converted);
  const record = timing?.lines;
  if (!record) return ep;
  const kinds = ep.source_metadata.explicit_scene_kinds.map(x => x.kind);
  let shotIndex = 0;
  const compromises = [];
  const containers = kinds.map((kind, i) => {
    if (kind === 'shot') {
      const shot = ep.shots[shotIndex++];
      return { kind, i, label: `${ep.production_id}/${shot.id}`, lines: shot.lines ?? [], set: d => { shot.duration = d; },
        window: i === 0 ? { duration: 6, min: 6, max: 6 } : { duration: shot.duration } };
    }
    if (kind === 'open') return { kind, i, label: `${ep.production_id}/open`, lines: ep.open_lines ?? [], set: () => {}, window: { duration: 3, min: 3, max: 3 } };
    if (kind === 'conversion') return { kind, i, label: `${ep.production_id}/conversion`, lines: ep.conversion_card.lines ?? [], set: d => { ep.conversion_card.duration = d; }, window: { duration: ep.conversion_card.duration, min: 4, max: 12 } };
    if (kind === 'hook') return { kind, i, label: `${ep.production_id}/hook`, lines: ep.end_hook.lines ?? [], set: d => { ep.end_hook.duration = d; }, window: { duration: ep.end_hook.duration, min: 3, max: 7 } };
    if (kind === 'close') return { kind, i, label: `${ep.production_id}/close`, lines: ep.close_lines ?? [], set: d => { ep.close_duration = d; }, window: { duration: ep.close_duration ?? 4, min: 4, max: 6 } };
    throw new Error(`Unknown scene kind ${kind}`);
  });
  for (const c of containers) {
    if (!c.lines.length) continue;
    const ids = c.lines.map((l, j) => planId(ep.production_id, c.i, c.kind, j, l.speaker));
    const seconds = ids.map(id => {
      if (!record[id]) throw new Error(`Missing measured narration for ${id}`);
      return record[id].trimmed_seconds;
    });
    const fit = fitLines(seconds, { ...c.window, label: c.label });
    if (fit.compromise) compromises.push(fit.compromise);
    c.set(fit.duration);
    c.lines.forEach((line, j) => {
      const t = fit.lines[j];
      line.start = t.start; line.end = t.end;
      line.narration = { id: ids[j], atempo: t.atempo, seconds: round(seconds[j] / t.atempo) };
      line.words = Object.fromEntries(Object.entries(line.text).map(([loc, text]) => [loc, spreadWords(text, t.start, t.end, loc)]));
    });
  }
  ep.status = 'V3_SOURCE_NARRATION_ALIGNED';
  ep.timing_note = 'Line and word timings are aligned to measured narration wavs (episodes/narration-timing.json); words are spread proportionally within each measured line. On-screen zh-Hans captions follow the English narration timing.';
  ep.narration_alignment = { lead: LEAD, gap: GAP, tail: TAIL, tightened_padding: TIGHT, atempo_normal_max: ATEMPO_NORMAL, atempo_compromise_max: ATEMPO_COMPROMISE, compromises };
  return ep;
}

export function loadTiming(path = join(root, 'episodes/narration-timing.json')) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

const ffmpegEnv = () => {
  const lib = ['/opt/homebrew/Cellar/x265/4.2/lib', '/opt/homebrew/Cellar/x265/4.3/lib'].find(existsSync);
  return lib ? { ...process.env, DYLD_LIBRARY_PATH: lib + (process.env.DYLD_LIBRARY_PATH ? ':' + process.env.DYLD_LIBRARY_PATH : '') } : process.env;
};
export const probeSeconds = file => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { env: ffmpegEnv() }).toString().trim());
export const TRIM_FILTER = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse';

// Batches merge into the existing record; `measure E01 E02` limits work to those episodes.
function measure(only = []) {
  const plan = JSON.parse(readFileSync(join(root, 'build/narration/narration-plan.json'), 'utf8'));
  const audioDir = join(root, 'build/narration/audio'), trimDir = join(root, 'build/narration/trimmed');
  mkdirSync(trimDir, { recursive: true });
  const lines = { ...(loadTiming()?.lines ?? {}) };
  for (const e of plan.episodes) for (const s of e.scenes) for (const l of s.lines) {
    if (only.length && !only.includes(e.id)) continue;
    const src = join(audioDir, `${l.id}_000.wav`), out = join(trimDir, `${l.id}.wav`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-af', TRIM_FILTER, '-ar', '48000', '-ac', '1', out], { env: ffmpegEnv() });
    const source_seconds = round(probeSeconds(src)), trimmed_seconds = round(probeSeconds(out));
    const words = l.text.trim().split(/\s+/).length;
    if (trimmed_seconds < 0.2 || trimmed_seconds > words * 1.2 + 1) throw new Error(`Suspicious narration length ${l.id}: ${trimmed_seconds}s for ${words} words`);
    lines[l.id] = { speaker: l.speaker, text: l.text, source_seconds, trimmed_seconds };
  }
  const sorted = Object.fromEntries(Object.entries(lines).sort(([a], [b]) => a.localeCompare(b)));
  const timing = { schema_version: 1, generated_by: 'ops/academy-v3/align-narration.mjs measure', trim_filter: TRIM_FILTER, lines: sorted };
  writeFileSync(join(root, 'episodes/narration-timing.json'), JSON.stringify(timing, null, 2) + '\n');
  console.log(`Measured ${Object.keys(lines).length} narration lines -> episodes/narration-timing.json`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv[2] === 'measure') measure(process.argv.slice(3));
  else { console.error('Usage: node align-narration.mjs measure [E01 ...]'); process.exit(2); }
}
