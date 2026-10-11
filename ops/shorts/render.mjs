import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DARK = '#0b0d10';
const BLUE = '#4f7cff';
const GREEN = '#3ddc97';
const RED = '#ff5c5c';
const FADE_SECONDS = 0.35;
const DEFAULT_DURATION = 7;
const MAX_VOICE_SLIDE_SECONDS = 8;
const MIN_VOICE_SLIDE_SECONDS = 6;
const DEFAULT_FFMPEG = '/opt/homebrew/bin/ffmpeg';
const DEFAULT_FFPROBE = '/opt/homebrew/bin/ffprobe';
const LOCAL_DYLD_LIBRARY_PATH = '/opt/homebrew/Cellar/x265/4.2/lib';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const pilotPackage = path.join(repoRoot, 'pilot-01-prototype/package.json');
const requireFromPilot = createRequire(pilotPackage);
const { Resvg } = requireFromPilot('@resvg/resvg-js');

export async function renderShort(slides, outDir, { voice = false, lang = 'en' } = {}) {
  if (!outDir) throw new Error('renderShort requires an output directory');
  await fs.mkdir(outDir, { recursive: true });

  const normalizedSlides = normalizeSlides(slides);
  const workDir = path.join(outDir, 'work');
  const framesDir = path.join(workDir, 'frames');
  const audioDir = path.join(workDir, 'audio');
  await fs.rm(workDir, { recursive: true, force: true });
  await fs.mkdir(framesDir, { recursive: true });
  await fs.mkdir(audioDir, { recursive: true });

  const framePaths = [];
  for (let index = 0; index < normalizedSlides.length; index += 1) {
    const svg = slideToSvg(normalizedSlides[index], index, normalizedSlides.length, lang);
    const png = new Resvg(svg, {
      fitTo: { mode: 'original' },
      font: {
        loadSystemFonts: true,
        defaultFontFamily: 'PingFang SC',
      },
    }).render().asPng();
    const framePath = path.join(framesDir, `slide-${String(index).padStart(2, '0')}.png`);
    await fs.writeFile(framePath, png);
    framePaths.push(framePath);
  }

  const voiceResult = voice
    ? await renderVoiceTrack(normalizedSlides, audioDir, lang)
    : null;
  const durations = voiceResult?.durations ?? normalizedSlides.map((slide) => slide.duration);
  const totalDuration = sum(durations);
  if (voice && (totalDuration < 30 || totalDuration > 45)) {
    throw new Error(`voice production duration must be 30-45 seconds; got ${totalDuration.toFixed(2)}s`);
  }

  const videoPath = path.join(outDir, 'short.mp4');
  await renderVideo(framePaths, durations, voiceResult?.audioPath, videoPath);
  return {
    duration: totalDuration,
    durations,
    voice: Boolean(voiceResult),
    voiceName: voiceResult?.voiceName ?? null,
    speechDurations: voiceResult?.speechDurations ?? [],
    videoPath,
    framePaths,
    audioPath: voiceResult?.audioPath ?? null,
    width: WIDTH,
    height: HEIGHT,
    fps: FPS,
    ffmpeg: ffmpegPath(),
    ffprobe: ffprobePath(),
  };
}

function normalizeSlides(slides) {
  if (!Array.isArray(slides) || slides.length === 0) {
    throw new Error('renderShort requires at least one slide');
  }
  const source = slides;
  return source.map((slide, index) => {
    const duration = Number(slide.duration ?? DEFAULT_DURATION);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error(`slide ${index + 1} has an invalid duration`);
    }
    return {
      title: String(slide.title ?? `Slide ${index + 1}`).trim(),
      lines: Array.isArray(slide.lines) ? slide.lines.map((line) => String(line)) : [],
      narration: String(slide.narration ?? [slide.title, ...(slide.lines ?? [])].filter(Boolean).join('. ')),
      duration,
      bar: slide.bar,
      rates: Array.isArray(slide.rates) ? slide.rates : [],
    };
  });
}

function slideToSvg(slide, index, total, lang) {
  const titleLines = wrapText(slide.title, 13);
  if (titleLines.length > 3) {
    throw new Error(`slide ${index + 1} title wraps to ${titleLines.length} lines; maximum is 3`);
  }
  const bodyLines = wrapCaptionLines(slide.lines, 21);
  if (bodyLines.length > 8) {
    throw new Error(`slide ${index + 1} captions wrap to ${bodyLines.length} lines; maximum is 8`);
  }
  const rateLines = slide.rates.map((rate) => ({
    text: String(rate.text ?? ''),
    color: Number(rate.rate) < 0 ? RED : GREEN,
  }));
  if (rateLines.length > 3) {
    throw new Error(`slide ${index + 1} rate rows exceed 3`);
  }
  const titleBlock = textBlock(titleLines, 92, 300, 92, 1.12, '800', '#f7f9ff');
  const bodyBlock = textBlock(bodyLines, 74, titleLines.length > 2 ? 650 : 570, 55, 1.24, '650', '#e7ebf3');
  const rateBlock = textBlock(rateLines, 88, 1290, 44, 1.35, '650', '#b8c1d6');
  const bar = slide.bar && Number.isFinite(Number(slide.bar.longShare))
    ? longShareBar(Number(slide.bar.longShare), lang)
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${DARK}"/>
  <rect x="64" y="64" width="952" height="1792" rx="44" fill="#11151d" stroke="#222a39" stroke-width="2"/>
  <circle cx="920" cy="194" r="118" fill="${BLUE}" opacity="0.15"/>
  <circle cx="156" cy="1510" r="160" fill="${GREEN}" opacity="0.11"/>
  <text x="88" y="126" font-family="PingFang SC, Hiragino Sans GB, Arial, sans-serif" font-size="28" font-weight="700" fill="${BLUE}" letter-spacing="0">NexuAlpha Shorts</text>
  <text x="88" y="172" font-family="PingFang SC, Hiragino Sans GB, Arial, sans-serif" font-size="24" fill="#7f8aa3" letter-spacing="0">${escapeXml(lang.toUpperCase())} · ${index + 1}/${total}</text>
  ${titleBlock}
  ${bodyBlock}
  ${bar}
  ${rateBlock}
  <rect x="88" y="1748" width="904" height="4" rx="2" fill="#293244"/>
  <rect x="88" y="1748" width="${Math.round(904 * ((index + 1) / total))}" height="4" rx="2" fill="${BLUE}"/>
</svg>`;
}

function textBlock(lines, x, y, fontSize, lineHeight, weight, fill) {
  return lines.map((line, i) => {
    const dy = i * fontSize * lineHeight;
    const content = typeof line === 'object' ? line.text : line;
    const color = typeof line === 'object' ? line.color : fill;
    return `<text x="${x}" y="${y + dy}" font-family="PingFang SC, Hiragino Sans GB, Arial, sans-serif" font-size="${fontSize}" font-weight="${weight}" fill="${color}" letter-spacing="0">${escapeXml(content)}</text>`;
  }).join('\n  ');
}

function longShareBar(longShare, lang) {
  const clamped = clamp(longShare, 0, 1);
  const longWidth = Math.round(780 * clamped);
  const shortWidth = 780 - longWidth;
  const labels = /^zh/i.test(lang)
    ? { title: '多空占比', long: '多头', short: '空头' }
    : { title: 'Long / short share', long: 'Long', short: 'Short' };
  return `
  <text x="88" y="1160" font-family="PingFang SC, Hiragino Sans GB, Arial, sans-serif" font-size="38" font-weight="700" fill="#aab4cb" letter-spacing="0">${labels.title}</text>
  <rect x="88" y="1210" width="780" height="44" rx="22" fill="#202838"/>
  <rect x="88" y="1210" width="${longWidth}" height="44" rx="22" fill="${GREEN}"/>
  <rect x="${88 + longWidth}" y="1210" width="${shortWidth}" height="44" rx="22" fill="${RED}" opacity="0.88"/>
  <text x="88" y="1310" font-family="PingFang SC, Hiragino Sans GB, Arial, sans-serif" font-size="42" font-weight="800" fill="${GREEN}" letter-spacing="0">${labels.long} ${Math.round(clamped * 100)}%</text>
  <text x="560" y="1310" font-family="PingFang SC, Hiragino Sans GB, Arial, sans-serif" font-size="42" font-weight="800" fill="${RED}" letter-spacing="0">${labels.short} ${Math.round((1 - clamped) * 100)}%</text>`;
}

function wrapCaptionLines(lines, maxChars) {
  return lines.flatMap((line) => {
    const color = captionColor(line);
    return wrapText(line, maxChars).map((text) => ({ text, color }));
  });
}

function captionColor(line) {
  if (/^\s*(long|多头|\+)/i.test(line)) return GREEN;
  if (/^\s*(short|空头|-)/i.test(line)) return RED;
  return '#e7ebf3';
}

function wrapText(value, maxChars) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return [];
  const cjk = /[\u3400-\u9fff]/.test(text);
  const units = cjk ? Array.from(text) : text.split(' ');
  const lines = [];
  let line = '';
  for (const unit of units) {
    const pieces = visualLength(unit) > maxChars ? chunkUnit(unit, maxChars) : [unit];
    for (const piece of pieces) {
      const candidate = cjk
      ? `${line}${piece}`
        : [line, piece].filter(Boolean).join(' ');
      if (visualLength(candidate) > maxChars && line) {
        lines.push(line);
        line = piece;
      } else {
        line = candidate;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function renderVoiceTrack(slides, audioDir, lang) {
  const voiceName = await selectVoice(lang, audioDir);
  const clips = [];
  const durations = [];
  const speechDurations = [];
  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    const target = clamp(slide.duration, MIN_VOICE_SLIDE_SECONDS, MAX_VOICE_SLIDE_SECONDS);
    const aiffPath = path.join(audioDir, `voice-${String(index).padStart(2, '0')}.aiff`);
    const measured = await synthesizeSpeechToFit(slide.narration, aiffPath, voiceName, target, index);
    const duration = Math.max(MIN_VOICE_SLIDE_SECONDS, measured + 0.45);
    if (duration > MAX_VOICE_SLIDE_SECONDS) {
      throw new Error(`slide ${index + 1} voice is ${duration.toFixed(2)}s, above ${MAX_VOICE_SLIDE_SECONDS}s`);
    }
    const paddedPath = path.join(audioDir, `padded-${String(index).padStart(2, '0')}.m4a`);
    await run(ffmpegPath(), [
      '-hide_banner', '-y',
      '-i', aiffPath,
      '-af', `apad,atrim=0:${duration.toFixed(3)},asetpts=N/SR/TB`,
      '-t', duration.toFixed(3),
      '-c:a', 'aac',
      '-b:a', '128k',
      paddedPath,
    ]);
    clips.push(paddedPath);
    durations.push(duration);
    speechDurations.push(measured);
  }

  const listPath = path.join(audioDir, 'voice-list.txt');
  await fs.writeFile(listPath, clips.map((clip) => `file '${escapeConcatPath(clip)}'`).join('\n'));
  const audioPath = path.join(audioDir, 'voice.m4a');
  await run(ffmpegPath(), ['-hide_banner', '-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c:a', 'aac', '-b:a', '128k', audioPath]);
  return { audioPath, durations, voiceName, speechDurations };
}

async function synthesizeSpeechToFit(text, output, voiceName, targetSeconds, slideIndex) {
  let rate = speechRate(text, targetSeconds);
  let measured = Number.POSITIVE_INFINITY;
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await synthesizeSpeech(text, output, voiceName, rate);
    try {
      measured = await mediaDuration(output);
    } catch (error) {
      lastError = error;
      break;
    }
    if (measured + 0.45 <= MAX_VOICE_SLIDE_SECONDS) return measured;
    const ratio = (measured + 0.45) / 7.5;
    rate = Math.round(clamp(rate * ratio * 1.05, rate + 18, 420));
  }
  const reason = lastError ? lastError.message : `last measured ${(measured + 0.45).toFixed(2)}s`;
  throw new Error(`slide ${slideIndex + 1} voice narration cannot fit under ${MAX_VOICE_SLIDE_SECONDS}s (${reason}, last rate ${rate})`);
}

async function synthesizeSpeech(text, output, voiceName, rate) {
  const args = ['-v', voiceName, '-r', String(rate), '-o', output, text];
  await run('/usr/bin/say', args);
}

async function selectVoice(lang, audioDir) {
  const listing = await run('/usr/bin/say', ['-v', '?'], { collect: true });
  const voices = parseSayVoices(listing);
  const candidates = voiceCandidates(voices, lang);
  const failures = [];
  for (const candidate of candidates) {
    const probePath = path.join(audioDir, `voice-probe-${safeFilePart(candidate.name)}.aiff`);
    try {
      await synthesizeSpeech(greetingForVoice(lang), probePath, candidate.name, 180);
      const duration = await mediaDuration(probePath);
      return candidate.name;
    } catch (error) {
      failures.push(`${candidate.name}: ${error.message.split('\n')[0]}`);
    }
  }
  throw new Error(`no usable macOS voice found for ${lang}; tried ${candidates.map((voice) => voice.name).join(', ') || 'none'}; failures: ${failures.join(' | ') || 'no matching voices'}`);
}

export function parseSayVoices(listing) {
  return String(listing).split(/\r?\n/).flatMap((line) => {
    const match = /^(.*?)\s{2,}([a-z]{2}_[A-Z]{2})\s+#/.exec(line);
    if (!match) return [];
    return [{ name: match[1].trim(), locale: match[2] }];
  });
}

export function voiceCandidates(voices, lang) {
  const normalized = String(lang).toLowerCase();
  if (normalized.startsWith('zh')) {
    const zhCn = voices.filter((voice) => voice.locale === 'zh_CN');
    return [
      ...zhCn.filter((voice) => voice.name === 'Tingting'),
      ...zhCn.filter((voice) => voice.name.startsWith('Flo ')),
      ...zhCn.filter((voice) => voice.name !== 'Tingting' && !voice.name.startsWith('Flo ')),
    ];
  }
  const enUs = voices.filter((voice) => voice.locale === 'en_US');
  return [
    ...enUs.filter((voice) => voice.name === 'Samantha'),
    ...enUs.filter((voice) => voice.name.startsWith('Flo ')),
    ...enUs.filter((voice) => voice.name !== 'Samantha' && !voice.name.startsWith('Flo ')),
  ];
}

function greetingForVoice(lang) {
  return /^zh/i.test(lang) ? '语音测试。' : 'Voice test.';
}

function speechRate(text, targetSeconds) {
  const raw = String(text).trim();
  const units = /[\u3400-\u9fff]/.test(raw)
    ? Array.from(raw).filter((char) => /\S/.test(char)).length / 1.8
    : raw.split(/\s+/).filter(Boolean).length;
  return Math.round(clamp((Math.max(6, units) / targetSeconds) * 60, 135, 260));
}

async function renderVideo(framePaths, durations, audioPath, videoPath) {
  const args = ['-hide_banner', '-y'];
  for (let i = 0; i < framePaths.length; i += 1) {
    args.push('-loop', '1', '-t', String(durations[i]), '-i', framePaths[i]);
  }
  if (audioPath) {
    args.push('-i', audioPath);
  } else {
    args.push('-f', 'lavfi', '-t', sum(durations).toFixed(3), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000');
  }

  const videoFilters = durations.map((duration, index) => {
    const fadeOutStart = Math.max(0, duration - FADE_SECONDS);
    return `[${index}:v]fps=${FPS},scale=${WIDTH}:${HEIGHT},format=yuv420p,setsar=1,fade=t=in:st=0:d=${FADE_SECONDS},fade=t=out:st=${fadeOutStart.toFixed(3)}:d=${FADE_SECONDS}[v${index}]`;
  }).join(';');
  const concatInputs = durations.map((_, index) => `[v${index}]`).join('');
  const audioIndex = framePaths.length;
  args.push(
    '-filter_complex',
    `${videoFilters};${concatInputs}concat=n=${durations.length}:v=1:a=0[v]`,
    '-map', '[v]',
    '-map', `${audioIndex}:a`,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-profile:v', 'high',
    '-pix_fmt', 'yuv420p',
    '-r', String(FPS),
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-shortest',
    videoPath,
  );
  await run(ffmpegPath(), args);
}

async function mediaDuration(file) {
  const output = await run(ffprobePath(), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { collect: true });
  const duration = Number.parseFloat(output.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`invalid media duration for ${path.basename(file)}: ${output.trim() || 'empty'}`);
  }
  return duration;
}

function run(command, args, { collect = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: ffmpegEnv(process.env),
      stdio: collect ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(collect ? stdout : undefined);
      } else {
        reject(new Error(`${command} exited ${code}\n${stderr}`));
      }
    });
  });
}

function ffmpegPath() {
  return process.env.FFMPEG || DEFAULT_FFMPEG;
}

function ffprobePath() {
  return process.env.FFPROBE || DEFAULT_FFPROBE;
}

function ffmpegEnv(env) {
  return {
    ...env,
    DYLD_LIBRARY_PATH: env.DYLD_LIBRARY_PATH
      ? `${LOCAL_DYLD_LIBRARY_PATH}:${env.DYLD_LIBRARY_PATH}`
      : LOCAL_DYLD_LIBRARY_PATH,
  };
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function escapeConcatPath(value) {
  return String(value).replaceAll("'", "'\\''");
}

function safeFilePart(value) {
  return String(value).replace(/[^a-z0-9._-]+/gi, '-').slice(0, 72) || 'voice';
}

function visualLength(value) {
  return Array.from(value).reduce((total, char) => total + (/[\u3400-\u9fff]/.test(char) ? 1.2 : 1), 0);
}

function chunkUnit(unit, maxChars) {
  const chunks = [];
  let chunk = '';
  for (const char of Array.from(unit)) {
    if (visualLength(`${chunk}${char}`) > maxChars && chunk) {
      chunks.push(chunk);
      chunk = char;
    } else {
      chunk += char;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value), 0);
}

