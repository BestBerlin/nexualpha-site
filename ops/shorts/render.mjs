import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {slideToSvg, captionLines, FONT_OPTIONS} from './layout.mjs';
export {slideToSvg, captionLines} from './layout.mjs';

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const FADE_SECONDS = 0.25;
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

  const voiceResult = voice ? await renderVoiceTrack(normalizedSlides, audioDir, lang) : null;
  const durations = voiceResult?.durations ?? normalizedSlides.map(slide => slide.duration);
  const totalDuration = sum(durations);
  if (voice && (totalDuration < 30 || totalDuration > 45)) {
    throw new Error(`voice production duration must be 30-45 seconds; got ${totalDuration.toFixed(2)}s`);
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
      const svg = slideToSvg(slide,index,normalizedSlides.length,lang,{progress:Math.min(1,time/.8),caption});
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
    await fs.writeFile(finalFrame,new Resvg(slideToSvg(slide,index,normalizedSlides.length,lang),{font:FONT_OPTIONS}).render().asPng());
    framePaths.push(finalFrame);
    const clip = path.join(workDir,`clip-${index}.mp4`);
    await run(ffmpegPath(),['-hide_banner','-y','-f','concat','-safe','0','-i',list,
      '-vf',`fps=${FPS},format=yuv420p,setsar=1`,'-t',duration.toFixed(6),'-c:v','libx264','-preset','veryfast','-crf','20',clip]);
    clips.push(clip);
  }
  const videoPath = path.join(outDir,'short.mp4');
  await renderVideo(clips,durations,voiceResult?.audioPath,videoPath);
  await Promise.all(clips.map(file=>fs.rm(file)));
  await Promise.all(normalizedSlides.map((_,index)=>fs.rm(path.join(framesDir,String(index)),{recursive:true,force:true})));
  if (!voice) await fs.rm(audioDir,{recursive:true,force:true});
  return {
    duration: totalDuration,
    durations,
    voice: Boolean(voiceResult),
    voiceName: voiceResult?.voiceName ?? null,
    speechDurations: voiceResult?.speechDurations ?? [],
    captions,
    animationSeconds: 0.8,
    crossfadeSeconds: FADE_SECONDS,
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
      ...slide,
      title: String(slide.title ?? `Slide ${index + 1}`).trim(),
      lines: Array.isArray(slide.lines) ? slide.lines.map((line) => String(line)) : [],
      narration: String(slide.narration ?? [slide.title, ...(slide.lines ?? [])].filter(Boolean).join('. ')),
      duration,
      bar: slide.bar,
      rates: Array.isArray(slide.rates) ? slide.rates : [],
    };
  });
}

async function renderVoiceTrack(slides, audioDir, lang) {
  const voiceName = await selectVoice(lang, audioDir);
  const clips = [], durations = [], speechDurations = [], captions = [];
  for (let index=0;index<slides.length;index++) {
    const lines = captionLines(slides[index].narration,lang);
    let rate = speechRate(slides[index].narration,slides[index].duration);
    let segments;
    for (let attempt=0;attempt<5;attempt++) {
      segments = [];
      for (let i=0;i<lines.length;i++) {
        const file = path.join(audioDir,`segment-${index}-${i}.aiff`);
        await synthesizeSpeech(lines[i],file,voiceName,rate);
        segments.push({file,text:lines[i],duration:await mediaDuration(file)});
      }
      const length = sum(segments.map(s=>s.duration));
      if (length+.45<=MAX_VOICE_SLIDE_SECONDS) break;
      if (attempt===4) throw new Error(`slide ${index+1} voice cannot fit in 8 seconds`);
      rate = Math.round(clamp(rate*(length+.45)/7.5*1.05,rate+18,420));
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
  return {audioPath,durations,voiceName,speechDurations,captions};
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
      await mediaDuration(probePath);
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

async function renderVideo(clips, durations, audioPath, videoPath) {
  const args=['-hide_banner','-y'];
  clips.forEach(clip=>args.push('-i',clip));
  if(audioPath) args.push('-i',audioPath);
  else args.push('-f','lavfi','-t',String(sum(durations)),'-i','anullsrc=channel_layout=stereo:sample_rate=48000');
  const filters=clips.map((_,i)=>`[${i}:v]fps=${FPS},settb=AVTB,setpts=PTS-STARTPTS[v${i}]`);
  let last='v0', offset=0;
  for(let i=1;i<clips.length;i++) {
    offset+=durations[i-1];
    const next=`mix${i}`;
    filters.push(`[${last}][v${i}]xfade=transition=fade:duration=${FADE_SECONDS}:offset=${offset}[${next}]`);
    last=next;
  }
  args.push('-filter_complex',filters.join(';'),'-map',`[${last}]`,'-map',`${clips.length}:a`,
    '-t',String(sum(durations)),'-c:v','libx264','-preset','veryfast','-crf','20','-profile:v','high',
    '-pix_fmt','yuv420p','-r',String(FPS),'-c:a','aac','-b:a','128k','-movflags','+faststart',videoPath);
  await run(ffmpegPath(),args);
}

async function mediaDuration(file) {
  const output = await run(ffprobePath(), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { collect: true });
  const duration = Number.parseFloat(output.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`invalid media duration for ${path.basename(file)}: ${output.trim() || 'empty'}`);
  }
  return duration;
}

async function run(command, args, { collect = false, fallback = false } = {}) {
  try {
  return await runOnce(command,args,{collect,fallback});
  } catch(error) {
    if (!fallback && /dyld.*Library not loaded|Library not loaded:.*libx265/s.test(error.message) && [ffmpegPath(),ffprobePath()].includes(command)) return run(command,args,{collect,fallback:true});
    throw error;
  }
}
function runOnce(command, args, {collect, fallback}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: fallback ? ffmpegEnv(process.env) : process.env,
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

function escapeConcatPath(value) {
  return String(value).replaceAll("'", "'\\''");
}

function safeFilePart(value) {
  return String(value).replace(/[^a-z0-9._-]+/gi, '-').slice(0, 72) || 'voice';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value), 0);
}


export async function renderContactSheet(videoPath, outputPath) {
  const times = [2, 9, 16, 23, 31];
  const args = ['-hide_banner', '-y'];
  times.forEach(time => args.push('-ss', String(time), '-i', videoPath));
  const filters = times.map((_,i) => `[${i}:v]scale=360:640[v${i}]`);
  filters.push(`${times.map((_,i)=>`[v${i}]`).join('')}hstack=inputs=5[sheet]`);
  args.push('-filter_complex', filters.join(';'), '-map', '[sheet]', '-frames:v', '1', outputPath);
  await run(ffmpegPath(), args);
}
