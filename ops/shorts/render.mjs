import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {slideToSvg, captionLines, FONT_OPTIONS, FORMATS} from './layout.mjs';
import { assertAudible } from './audio-gate.mjs';
export {slideToSvg, captionLines} from './layout.mjs';

const FPS = 30;
const FADE_SECONDS = 0.25;
const DEFAULT_DURATION = 7;
const MAX_VOICE_SLIDE_SECONDS = 8;
const MIN_VOICE_SLIDE_SECONDS = 6;
const DEFAULT_FFMPEG = '/opt/homebrew/bin/ffmpeg';
const DEFAULT_FFPROBE = '/opt/homebrew/bin/ffprobe';
const LOCAL_DYLD_LIBRARY_PATH = '/opt/homebrew/Cellar/x265/4.2/lib';
const DEFAULT_TTS_PYTHON = '/opt/homebrew/bin/python3';
const LOCALE_TTS_PYTHON = process.env.SHORTS_LOCALE_TTS_PYTHON || '/Volumes/致态2TB/nx-agents/education/v2/.venv/bin/python';
const VOICE_PY = fileURLToPath(new URL('./voice/voice.py', import.meta.url));
const MUSIC_PY = fileURLToPath(new URL('./voice/music_bed.py', import.meta.url));
const MEDIA_DIR = process.env.NX_MEDIA_DIR || '/Volumes/致态2TB/nx-agents/media';
const MUSIC_GAIN = Number(process.env.SHORTS_MUSIC_GAIN || 0.2);
const QWEN_MODEL = 'mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit';
const OWNER_REF_AUDIO = '/Volumes/致态2TB/nx-agents/education/v2/voice-en-master-reference.wav';
const OWNER_REF_TEXT = "Your KYC got rejected again? Don't worry. Most rejections come down to just a few simple mistakes. Let's fix them together.";

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const pilotPackage = path.join(repoRoot, 'pilot-01-prototype/package.json');
const requireFromPilot = createRequire(pilotPackage);
const { Resvg } = requireFromPilot('@resvg/resvg-js');

export async function renderShort(slides, outDir, { voice = false, lang = 'en', format = 'portrait' } = {}) {
  if (!outDir) throw new Error('renderShort requires an output directory');
  const dimensions = renderDimensions(format);
  await fs.mkdir(outDir, { recursive: true });

  const normalizedSlides = normalizeSlides(slides, lang);
  const workDir = path.join(outDir, 'work');
  const framesDir = path.join(workDir, 'frames');
  const audioDir = path.join(workDir, 'audio');
  await fs.rm(workDir, { recursive: true, force: true });
  await fs.mkdir(framesDir, { recursive: true });
  await fs.mkdir(audioDir, { recursive: true });

  const voiceResult = voice ? await renderVoiceTrack(normalizedSlides, audioDir, lang) : null;
  const durations = voiceResult?.durations ?? normalizedSlides.map(slide => slide.duration);
  const totalDuration = sum(durations);
  if (voice && (totalDuration < 25 || totalDuration > 35)) {
    throw new Error(`voice production duration must be 25-35 seconds; got ${totalDuration.toFixed(2)}s`);
  }
  const captions = normalizedSlides.map((slide,index) => {
    if (voiceResult) return voiceResult.captions[index];
    const lines = captionLines(slide.narration, lang);
    return lines.map((text,i) => ({text,start:i*durations[index]/lines.length,end:(i+1)*durations[index]/lines.length}));
  });
  const framePaths = [], clips = [];
  for (let index=0; index<normalizedSlides.length; index++) {
    const slide = normalizedSlides[index];
    const directory = path.join(framesDir, String(index));
    await fs.mkdir(directory, {recursive:true});
    const duration = durations[index] + (index < normalizedSlides.length-1 ? FADE_SECONDS : 0);
    const times = [...new Set([0, ...Array.from({length:24},(_,i)=>(i+1)/FPS).filter(t=>t<duration),
      ...captions[index].flatMap(c=>[c.start,c.end]).filter(t=>t<duration)])].sort((a,b)=>a-b);
    const entries = [];
    for (let i=0;i<times.length;i++) {
      const time = times[i];
      const caption = captions[index].find(c=>time>=c.start && time<c.end)?.text || '';
      const svg = slideToSvg(slide,index,normalizedSlides.length,lang,{format,progress:Math.min(1,time/.8),caption});
      const png = new Resvg(svg,{font:FONT_OPTIONS}).render().asPng();
      const file = path.join(directory,`${i}.png`);
      await fs.writeFile(file,png);
      entries.push(`file '${escapeConcatPath(file)}'`, `duration ${((times[i+1] ?? duration)-time).toFixed(6)}`);
    }
    // A final repeated frame lets concat honor the last image duration.
    entries.push(`file '${escapeConcatPath(path.join(directory,`${times.length-1}.png`))}'`);
    const list = path.join(directory,'frames.txt');
    await fs.writeFile(list,entries.join('\n'));
    const finalFrame = path.join(framesDir,`slide-${String(index).padStart(2,'0')}.png`);
    await fs.writeFile(finalFrame,new Resvg(slideToSvg(slide,index,normalizedSlides.length,lang,{format}),{font:FONT_OPTIONS}).render().asPng());
    framePaths.push(finalFrame);
    const clip = path.join(workDir,`clip-${index}.mp4`);
    await run(ffmpegPath(),['-hide_banner','-y','-f','concat','-safe','0','-i',list,
      '-vf',`fps=${FPS},format=yuv420p,setsar=1`,'-t',duration.toFixed(6),'-c:v','libx264','-preset','veryfast','-crf','20',clip]);
    clips.push(clip);
  }
  const videoPath = path.join(outDir,'short.mp4');
  await renderVideo(clips,durations,voiceResult?.audioPath,videoPath);
  if (voiceResult) await assertAudible(videoPath, { platform: 'render' });
  const posterPath = path.join(outDir, 'poster.png');
  await fs.copyFile(framePaths[0], posterPath);
  const srtPath = path.join(outDir, 'captions.srt');
  await fs.writeFile(srtPath, buildSrt(captions, durations));
  await Promise.all(clips.map(file=>fs.rm(file)));
  await Promise.all(normalizedSlides.map((_,index)=>fs.rm(path.join(framesDir,String(index)),{recursive:true,force:true})));
  if (!voice) await fs.rm(audioDir,{recursive:true,force:true});
  return {
    duration: totalDuration,
    durations,
    voice: Boolean(voiceResult),
    publishable: Boolean(voiceResult),
    voiceName: voiceResult?.voiceName ?? null,
    voiceConfig: voiceResult?.config ?? null,
    speechDurations: voiceResult?.speechDurations ?? [],
    captions,
    animationSeconds: 0.8,
    crossfadeSeconds: FADE_SECONDS,
    videoPath,
    posterPath,
    srtPath,
    framePaths,
    audioPath: voiceResult?.audioPath ?? null,
    width: dimensions.width,
    height: dimensions.height,
    format,
    fps: FPS,
    ffmpeg: ffmpegPath(),
    ffprobe: ffprobePath(),
  };
}

function normalizeSlides(slides, lang) {
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
      ...slide,
      title: String(slide.title ?? `Slide ${index + 1}`).trim(),
      lines: Array.isArray(slide.lines) ? slide.lines.map((line) => String(line)) : [],
      narration: String(slide.narration ?? [slide.title, ...(slide.lines ?? [])].filter(Boolean).join('. ')),
      duration,
      bar: slide.bar,
      rates: Array.isArray(slide.rates) ? slide.rates : [],
      copy: requireCopy(slide.copy, index),
    };
  });
}

async function renderVoiceTrack(slides, audioDir, lang) {
  // English keeps the owner clone; every other locale uses ./voice/voice.py (Qwen3-TTS zh, VoxCPM2 others).
  if (lang === 'en') await ensureOwnerVoicePrerequisites();
  const voiceName = lang === 'en' ? 'Qwen3-TTS owner English clone' : `voice.py ${lang}`;
  if (lang !== 'en') {
    const all = slides.flatMap((slide, index) => captionLines(slide.narration, lang).map((text, i) => ({ id: `segment-${index}-${i}`, text })));
    const list = path.join(audioDir, 'lines.json');
    await fs.writeFile(list, JSON.stringify(all));
    await run(LOCALE_TTS_PYTHON, ['-I', VOICE_PY, '--locale', lang, '--out', audioDir, '--lines', list], { env: offlineTtsEnv(process.env) });
  }
  const clips = [], durations = [], speechDurations = [], captions = [];
  for (let index=0;index<slides.length;index++) {
    const lines = captionLines(slides[index].narration,lang);
    const segments = [];
    for (let i=0;i<lines.length;i++) {
      const file = lang === 'en' ? await synthesizeSpeech(lines[i], audioDir, `segment-${index}-${i}`) : path.join(audioDir, `segment-${index}-${i}.wav`);
      segments.push({file,text:lines[i],duration:await mediaDuration(file)});
    }
    const length = sum(segments.map(s=>s.duration));
    if (length+.45 > MAX_VOICE_SLIDE_SECONDS) {
      throw new Error(`slide ${index+1} voice cannot fit in 8 seconds; got ${(length+.45).toFixed(2)}s`);
    }
    let start=0;
    captions.push(segments.map(s=>{const caption={text:s.text,start,end:start+s.duration}; start+=s.duration; return caption;}));
    const duration=Math.ceil(Math.max(MIN_VOICE_SLIDE_SECONDS,start+.45)*FPS)/FPS;
    const list=path.join(audioDir,`segments-${index}.txt`);
    await fs.writeFile(list,segments.map(s=>`file '${escapeConcatPath(s.file)}'`).join('\n'));
    const clip=path.join(audioDir,`padded-${index}.m4a`);
    await run(ffmpegPath(),['-hide_banner','-y','-f','concat','-safe','0','-i',list,'-af',`apad,atrim=0:${duration},asetpts=N/SR/TB`,'-c:a','aac','-b:a','128k',clip]);
    clips.push(clip); durations.push(duration); speechDurations.push(start);
  }
  const list=path.join(audioDir,'voice-list.txt');
  await fs.writeFile(list,clips.map(file=>`file '${escapeConcatPath(file)}'`).join('\n'));
  const audioPath=path.join(audioDir,'voice.m4a');
  await run(ffmpegPath(),['-hide_banner','-y','-f','concat','-safe','0','-i',list,'-c:a','aac','-b:a','128k',audioPath]);
  return {audioPath,durations,voiceName,speechDurations,captions,config: voiceConfig()};
}

async function synthesizeSpeech(text, outputDir, filePrefix) {
  const before = new Set(await listFiles(outputDir));
  await run(pythonPath(), [
    '-m', 'mlx_audio.tts.generate',
    '--model', QWEN_MODEL,
    '--lang_code', 'en',
    '--ref_audio', OWNER_REF_AUDIO,
    '--ref_text', OWNER_REF_TEXT,
    '--text', text,
    '--output_path', outputDir,
    '--file_prefix', filePrefix,
  ], { env: offlineTtsEnv(process.env) });
  const created = (await listFiles(outputDir))
    .filter((file) => !before.has(file) && file.startsWith(filePrefix))
    .filter((file) => /\.(wav|aiff|m4a|mp3)$/i.test(file))
    .sort();
  if (created.length === 0) {
    throw new Error(`Qwen3-TTS did not create audio for ${filePrefix}`);
  }
  return path.join(outputDir, created[0]);
}

async function musicBed(style = 'bright') {
  const file = path.join(MEDIA_DIR, 'music', `${style}.wav`);
  try { await fs.access(file); } catch {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await run(LOCALE_TTS_PYTHON, ['-I', MUSIC_PY, file, '--style', style, '--seconds', '64']);
  }
  return file;
}

async function renderVideo(clips, durations, audioPath, videoPath) {
  const args=['-hide_banner','-y'];
  clips.forEach(clip=>args.push('-i',clip));
  const total=sum(durations);
  if(audioPath) args.push('-i',audioPath,'-stream_loop','-1','-i',await musicBed());
  else args.push('-f','lavfi','-t',String(total),'-i','anullsrc=channel_layout=stereo:sample_rate=48000'); // --no-voice layout drafts only; never publishable
  const filters=clips.map((_,i)=>`[${i}:v]fps=${FPS},settb=AVTB,setpts=PTS-STARTPTS[v${i}]`);
  let last='v0', offset=0;
  for(let i=1;i<clips.length;i++) {
    offset+=durations[i-1];
    const next=`mix${i}`;
    filters.push(`[${last}][v${i}]xfade=transition=fade:duration=${FADE_SECONDS}:offset=${offset}[${next}]`);
    last=next;
  }
  let audioMap=`${clips.length}:a`;
  if(audioPath) {
    // Light music bed ducked under the narration, then loudness-normalised for Shorts.
    filters.push(`[${clips.length}:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:${total},asplit=2[voice][key]`);
    filters.push(`[${clips.length+1}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${total},volume=${MUSIC_GAIN},afade=t=in:d=0.6,afade=t=out:st=${Math.max(0,total-1.8)}:d=1.8[bed]`);
    filters.push(`[bed][key]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[ducked]`);
    filters.push(`[voice][ducked]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[aout]`);
    audioMap='[aout]';
  }
  args.push('-filter_complex',filters.join(';'),'-map',`[${last}]`,'-map',audioMap,
    '-t',String(sum(durations)),'-c:v','libx264','-preset','veryfast','-crf','20','-profile:v','high',
    '-pix_fmt','yuv420p','-r',String(FPS),'-c:a','aac','-b:a','128k','-movflags','+faststart',videoPath);
  await run(ffmpegPath(),args);
}

export function buildSrt(captions, durations) {
  let offset = 0;
  let index = 1;
  const entries = [];
  for (let slideIndex = 0; slideIndex < captions.length; slideIndex++) {
    for (const caption of captions[slideIndex]) {
      entries.push([
        String(index++),
        `${srtTime(offset + caption.start)} --> ${srtTime(offset + caption.end)}`,
        caption.text,
      ].join('\n'));
    }
    offset += durations[slideIndex];
  }
  return `${entries.join('\n\n')}\n`;
}

function srtTime(value) {
  const milliseconds = Math.max(0, Math.round(Number(value) * 1000));
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor(milliseconds % 3600000 / 60000);
  const seconds = Math.floor(milliseconds % 60000 / 1000);
  const ms = milliseconds % 1000;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${String(ms).padStart(3, '0')}`;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function renderDimensions(format) {
  const dimensions = FORMATS[format];
  if (!dimensions) {
    throw new Error(`Unknown render format: ${format}`);
  }
  return dimensions;
}

function requireCopy(copy, index) {
  if (!copy || typeof copy !== 'object') {
    throw new Error(`slide ${index + 1} is missing localized copy`);
  }
  return copy;
}

function voiceConfig() {
  return {
    mode: 'clone',
    model: QWEN_MODEL,
    refAudio: OWNER_REF_AUDIO,
    refText: OWNER_REF_TEXT,
    langCode: 'en',
    seed: null,
    offline: true,
  };
}

async function ensureOwnerVoicePrerequisites() {
  try {
    await fs.access(OWNER_REF_AUDIO);
  } catch {
    throw new Error(`owner voice reference audio missing: ${OWNER_REF_AUDIO}`);
  }
  const modelCache = path.join(huggingFaceHubDir(), 'models--mlx-community--Qwen3-TTS-12Hz-1.7B-Base-8bit');
  try {
    await fs.access(modelCache);
  } catch {
    throw new Error(`Qwen3-TTS model cache missing: ${modelCache}; downloads are disabled for this renderer`);
  }
  try {
    await run(pythonPath(), ['-c', 'import mlx_audio'], { collect: true, env: offlineTtsEnv(process.env) });
  } catch (error) {
    throw new Error(`mlx_audio is required for English owner voice narration; no downloads or macOS voice fallback are allowed. ${error.message.split('\n')[0]}`);
  }
}

async function listFiles(directory) {
  try {
    return await fs.readdir(directory);
  } catch {
    return [];
  }
}

async function mediaDuration(file) {
  const output = await run(ffprobePath(), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { collect: true });
  const duration = Number.parseFloat(output.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`invalid media duration for ${path.basename(file)}: ${output.trim() || 'empty'}`);
  }
  return duration;
}

async function run(command, args, { collect = false, fallback = false, env = process.env } = {}) {
  try {
  return await runOnce(command,args,{collect,fallback,env});
  } catch(error) {
    if (!fallback && /dyld.*Library not loaded|Library not loaded:.*libx265/s.test(error.message) && [ffmpegPath(),ffprobePath()].includes(command)) return run(command,args,{collect,fallback:true,env});
    throw error;
  }
}
function runOnce(command, args, {collect, fallback, env}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: fallback ? ffmpegEnv(env) : env,
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

function pythonPath() {
  return process.env.SHORTS_TTS_PYTHON || DEFAULT_TTS_PYTHON;
}

function offlineTtsEnv(env) {
  return {
    ...env,
    HF_HUB_OFFLINE: '1',
    TRANSFORMERS_OFFLINE: '1',
  };
}

function huggingFaceHubDir() {
  if (process.env.HF_HUB_CACHE) return process.env.HF_HUB_CACHE;
  if (process.env.HF_HOME) return path.join(process.env.HF_HOME, 'hub');
  return path.join(os.homedir(), '.cache/huggingface/hub');
}

function ffmpegEnv(env) {
  return {
    ...env,
    DYLD_LIBRARY_PATH: env.DYLD_LIBRARY_PATH
      ? `${LOCAL_DYLD_LIBRARY_PATH}:${env.DYLD_LIBRARY_PATH}`
      : LOCAL_DYLD_LIBRARY_PATH,
  };
}

function escapeConcatPath(value) {
  return String(value).replaceAll("'", "'\\''");
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value), 0);
}


export async function renderContactSheet(videoPath, outputPath) {
  const duration = await mediaDuration(videoPath);
  const times = Array.from({length:5},(_,i)=>(i+.5)*duration/5);
  const args = ['-hide_banner', '-y'];
  times.forEach(time => args.push('-ss', String(time), '-i', videoPath));
  const filters = times.map((_,i) => `[${i}:v]scale=360:-2[v${i}]`);
  filters.push(`${times.map((_,i)=>`[v${i}]`).join('')}hstack=inputs=5[sheet]`);
  args.push('-filter_complex', filters.join(';'), '-map', '[sheet]', '-frames:v', '1', outputPath);
  await run(ffmpegPath(), args);
}
