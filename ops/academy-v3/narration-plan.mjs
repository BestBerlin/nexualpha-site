import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ALL_EPISODES, parseEpisodeList } from './season.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const worktreeRoot = resolve(root, '../..');
const defaultEpisodeDir = resolve(root,'episodes/source');
const defaultEpisodes = ALL_EPISODES;
const defaultOut = resolve(root, 'build/narration/narration-plan.json');
const ownerRefAudio = '/Volumes/致态2TB/nx-agents/education/v2/voice-en-master-reference.wav';
const ownerRefText = "Your KYC got rejected again? Don't worry. Most rejections come down to just a few simple mistakes. Let's fix them together.";
const masterModel = 'mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit';
const samVoiceDesignModel = 'mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-bf16';
export const samVoiceInstruct = 'a friendly adult American man new to crypto, natural and conversational, clear diction, curious but not cartoonish';

const voiceProfiles = {
  englishMasterClone: {
    id: 'english-master-clone',
    mode: 'clone',
    speakers: ['narrator', 'nexubo'],
    model: masterModel,
    lang_code: 'en',
    ref_audio: ownerRefAudio,
    ref_text: ownerRefText,
    source: '/Volumes/致态2TB/nx-agents/codex/queue/academy-global/OWNER-NOTE.txt',
    command_template: [
      'python', '-m', 'mlx_audio.tts.generate',
      '--model', masterModel,
      '--lang_code', 'en',
      '--ref_audio', ownerRefAudio,
      '--ref_text', ownerRefText,
      '--text', '<line>',
      '--output_path', '<dir>',
      '--file_prefix', '<name>'
    ]
  },
  samVoiceDesign: {
    id: 'sam-voice-design',
    mode: 'voice-design',
    seed: null,
    seed_note: 'Installed mlx_audio.tts.generate CLI has no seed option; review voice consistency before final delivery.',
    speakers: ['sam'],
    model: samVoiceDesignModel,
    lang_code: 'en',
    instruct: samVoiceInstruct,
    source: '/Volumes/致态2TB/nx-agents/codex/queue/academy-v3-samples/BRIEF.md',
    command_template: [
      'python', '-m', 'mlx_audio.tts.generate',
      '--model', samVoiceDesignModel,
      '--lang_code', 'en',
      '--instruct', samVoiceInstruct,
      '--text', '<line>',
      '--output_path', '<dir>',
      '--file_prefix', '<name>'
    ]
  }
};

export function parseTimecode(tc) {
  const match = /^(\d\d):(\d\d)-(\d\d):(\d\d)$/.exec(tc);
  if (!match) throw new Error(`Unsupported timecode: ${tc}`);
  const [, sm, ss, em, es] = match.map(Number);
  const start = sm * 60 + ss;
  const end = em * 60 + es;
  if (end <= start) throw new Error(`Non-positive timecode: ${tc}`);
  return { start, end, duration: end - start };
}

const speakerId = who => {
  const value = String(who ?? '').trim().toLowerCase();
  if (value === 'sam') return 'sam';
  if (value === 'nexubo') return 'nexubo';
  if (value === 'narrator') return 'narrator';
  throw new Error(`Unsupported speaker: ${who}`);
};

const safe = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function classifyScene(episode, index) {
  const last = episode.shots.length - 1;
  if (index === last) return 'close';
  if (index === last - 1) return 'hook';
  if (episode.conversion_card && index === last - 2) return 'conversion';
  const shot = episode.shots[index];
  const { start, end } = parseTimecode(shot.tc);
  if (start === 6 && end === 9 && !shot.lines?.length) return 'open';
  return index === 0 ? 'problem' : 'lesson';
}

function allocateLineWindows(lines, start, end) {
  if (!lines.length) return [];
  const totalChars = lines.reduce((sum, line) => sum + Math.max(1, [...line.text].length), 0);
  const gap = lines.length > 1 ? Math.min(0.25, (end - start) / (lines.length * 10)) : 0;
  const available = Math.max(0.1, end - start - gap * (lines.length - 1));
  let cursor = start;
  return lines.map((line, index) => {
    const duration = index === lines.length - 1 ? end - cursor : available * Math.max(1, [...line.text].length) / totalChars;
    const lineStart = cursor;
    const lineEnd = Math.min(end, lineStart + duration);
    cursor = lineEnd + gap;
    return { ...line, start: round(lineStart), end: round(lineEnd), duration: round(lineEnd - lineStart), timing_source: 'estimated-from-scene-timecode' };
  });
}

const round = value => Math.round(value * 1000) / 1000;

function lineCommand(line, audioDir) {
  const outputPath = `${audioDir}/${line.id}_000.wav`;
  const profile = line.voice_profile === 'sam-voice-design' ? voiceProfiles.samVoiceDesign : voiceProfiles.englishMasterClone;
  const command = [
    '${PYTHON_BIN}', '-m', 'mlx_audio.tts.generate',
    '--model', profile.model,
    '--lang_code', 'en'
  ];
  if (profile.mode === 'clone') {
    command.push('--ref_audio', ownerRefAudio, '--ref_text', ownerRefText);
  } else {
    command.push('--instruct', profile.instruct);
  }
  command.push('--text', line.text, '--output_path', audioDir, '--file_prefix', line.id);
  return { command, output_path: outputPath };
}

export function buildNarrationPlan(episodes, options = {}) {
  const audioDir = options.audioDir ?? 'ops/academy-v3/build/narration/audio';
  const plan = {
    schema_version: 1,
    generated_by: 'ops/academy-v3/narration-plan.mjs',
    generated_at: new Date(0).toISOString(),
    status: 'planned-only',
    notes: [
      'Timings are estimated from the v3 episode scene timecodes until real wav alignment writes back measured durations.',
      'The runner sets HF/Transformers offline flags so cached local models are used; missing caches fail closed.',
      'No narration is claimed delivered by this plan.'
    ],
    voice_profiles: voiceProfiles,
    episodes: []
  };
  let totalLineCount = 0;
  for (const episode of episodes) {
    const episodeId = `E${String(episode.ep).padStart(2, '0')}`;
    const episodeRecord = {
      id: episodeId,
      slug: episode.slug,
      title: { en: episode.title_en, 'zh-Hans': episode.title_zh },
      duration_target_s: episode.duration_target_s,
      scenes: []
    };
    for (const [sceneIndex, shot] of episode.shots.entries()) {
      const timing = parseTimecode(shot.tc);
      const kind = classifyScene(episode, sceneIndex);
      const sceneId = `${episodeId.toLowerCase()}-${String(sceneIndex).padStart(2, '0')}-${kind}`;
      const rawLines = (shot.lines ?? []).map((line, lineIndex) => {
        const speaker = speakerId(line.who);
        const id = `${sceneId}-l${String(lineIndex + 1).padStart(2, '0')}-${safe(speaker)}`;
        return {
          id,
          speaker,
          voice_profile: speaker === 'sam' ? 'sam-voice-design' : 'english-master-clone',
          text: line.en,
          text_zh_Hans: line.zh
        };
      });
      const lines = allocateLineWindows(rawLines, timing.start, timing.end).map(line => {
        totalLineCount += 1;
        return { ...line, ...lineCommand(line, audioDir) };
      });
      episodeRecord.scenes.push({
        id: sceneId,
        kind,
        timecode: shot.tc,
        start: timing.start,
        end: timing.end,
        duration: timing.duration,
        antenna: shot.antenna,
        visual_en: shot.visual_en,
        onscreen_text_en: shot.onscreen_text_en ?? [],
        lines
      });
    }
    plan.episodes.push(episodeRecord);
  }
  plan.summary = {
    episodes: plan.episodes.map(e => e.id),
    scenes: plan.episodes.reduce((sum, e) => sum + e.scenes.length, 0),
    lines: totalLineCount,
    audio_dir: audioDir,
    next_steps: [
      'Run ops/academy-v3/narrate.sh on a Mac session with Metal access and the cached mlx_audio models.',
      'Review generated wavs for voice consistency and pronunciation before muxing.',
      'Replace estimated line timings with measured wav durations or forced alignment before final video mux.',
      'Mux narration with the rendered compositions only after alignment and SFX cues are approved.'
    ]
  };
  return plan;
}

async function loadEpisodes(episodeDir, episodeIds) {
  return Promise.all(episodeIds.map(async id => JSON.parse(await readFile(resolve(episodeDir, `${id}.json`), 'utf8'))));
}

function parseArgs(argv) {
  const args = { episodeDir: defaultEpisodeDir, episodes: defaultEpisodes, out: defaultOut };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--episode-dir') args.episodeDir = argv[++i];
    else if (arg === '--episodes') args.episodes = parseEpisodeList(argv[++i]);
    else if (arg === '--out') args.out = argv[++i];
    else if (arg === '--stdout') args.out = '-';
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function assertWorktreePath(path) {
  const resolved = resolve(path);
  if (relative(worktreeRoot, resolved).startsWith('..')) {
    throw new Error(`Refusing to write outside worktree: ${resolved}`);
  }
  return resolved;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const episodes = await loadEpisodes(args.episodeDir, args.episodes);
  const plan = buildNarrationPlan(episodes);
  const json = `${JSON.stringify(plan, null, 2)}\n`;
  if (args.out === '-') {
    process.stdout.write(json);
    return;
  }
  const out = assertWorktreePath(args.out);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, json);
  console.log(`Wrote ${out}`);
  console.log(`Planned ${plan.summary.lines} lines across ${plan.summary.scenes} scenes: ${plan.summary.episodes.join(', ')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}
