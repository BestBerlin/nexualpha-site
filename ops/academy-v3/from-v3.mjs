import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { samVoiceInstruct } from './narration-plan.mjs';
import { applyNarrationTiming, loadTiming } from './align-narration.mjs';
import { ALL_EPISODES } from './season.mjs';
import { EPISODE_CONFIG, VENUES, defaultPoses, registryCode } from './episode-config.mjs';
import { assertNoFinePrint } from './fine-print.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SOURCE_ROOT = join(here,'episodes/source');
const DEFAULT_EPISODES = ALL_EPISODES;

const NARRATION = {
  mode: 'CLONE',
  command_template: "python -m mlx_audio.tts.generate --model mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit --lang_code en --ref_audio /Volumes/致态2TB/nx-agents/education/v2/voice-en-master-reference.wav --ref_text \"Your KYC got rejected again? Don't worry. Most rejections come down to just a few simple mistakes. Let's fix them together.\" --text \"<line>\" --output_path <dir> --file_prefix <name>",
  english_voice_instruct: 'a cheerful young American woman in her twenties, warm and energetic, clear diction, friendly YouTube tutorial host',
  sam_voice_design_instruct: samVoiceInstruct,
  sam_voice_note: 'Task-specific brief requests Sam lines with this distinct VoiceDesign model; this overrides the older global owner note that male voice was not used.',
};

const KIND_MATCHERS = [
  ['open', /brand open/i],
  ['conversion', /conversion card/i],
  ['hook', /end hook/i],
  ['close', /branded close/i],
];

export function parseTc(tc) {
  const match = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(tc ?? '');
  if (!match) throw new Error(`Invalid timecode: ${tc}`);
  const [, sm, ss, em, es] = match.map(Number);
  const start = sm * 60 + ss;
  const end = em * 60 + es;
  if (end <= start) throw new Error(`Non-positive timecode: ${tc}`);
  return { start, end, duration: end - start };
}

export function sceneKind(shot) {
  for (const [kind, matcher] of KIND_MATCHERS) {
    if (matcher.test(shot.visual_en ?? '')) return kind;
  }
  return 'shot';
}

function localized(en, zh) {
  return { en, 'zh-Hans': zh };
}

function lineText(line) {
  return localized(line.en, line.zh);
}

function speaker(who) {
  const value = String(who ?? '').toLowerCase();
  if (value === 'nexubo') return 'nexubo';
  if (value === 'sam') return 'sam';
  return 'narrator';
}

function timedLines(lines = [], duration) {
  if (!lines.length) return [];
  const availableStart = 0.4;
  const availableEnd = Math.max(availableStart + 0.2, duration - 0.3);
  const totalChars = lines.reduce((sum, line) => sum + [...line.en].length + [...line.zh].length, 0) || lines.length;
  let cursor = availableStart;
  return lines.map((line, index) => {
    const remaining = lines.length - index;
    const share = index === lines.length - 1
      ? availableEnd - cursor
      : Math.max(0.8, (availableEnd - availableStart) * (([...line.en].length + [...line.zh].length) / totalChars));
    const start = round(cursor);
    const end = round(index === lines.length - 1 ? availableEnd : Math.min(availableEnd - (remaining - 1) * 0.8, cursor + share));
    cursor = end + 0.3;
    return {
      speaker: speaker(line.who),
      text: lineText(line),
      start,
      end: Math.min(round(availableEnd), Math.max(round(start + 0.2), end)),
      source_who: line.who,
    };
  });
}

function round(number) {
  return Math.round(number * 1000) / 1000;
}

function textArray(en = [], zh = []) {
  return { en: en.join(' · '), 'zh-Hans': zh.join(' · ') };
}

function compactHeading(values = []) {
  return values[0] ?? '';
}

function item(labelEn, labelZh, done = true) {
  return { label: localized(labelEn, labelZh), done };
}

function statusStep(labelEn, labelZh, statusEn, statusZh) {
  return { label: localized(labelEn, labelZh), status: localized(statusEn, statusZh) };
}

function sourceNote(sourceShot) {
  return {
    source_tc: sourceShot.tc,
    source_visual_zh: sourceShot.visual_zh,
    source_onscreen_text: localized(sourceShot.onscreen_text_en, sourceShot.onscreen_text_zh),
  };
}

function shotConfig(ep, outputIndex) {
  const config = EPISODE_CONFIG[ep];
  if (!config) throw new Error(`No episode-config entry for episode ${ep}`);
  const shot = config.shots[outputIndex];
  if (!shot) throw new Error(`episode-config E${ep} has no shot ${outputIndex}`);
  return { set: config.set, ...shot };
}

// Every content shot gets one configured teaching widget; t(i) reads the source on-screen text verbatim.
function shotWidget(ep, outputIndex, sourceShot) {
  const en = sourceShot.onscreen_text_en ?? [];
  const zh = sourceShot.onscreen_text_zh ?? [];
  const t = (i) => {
    if (en[i] === undefined) throw new Error(`E${ep} shot ${outputIndex}: no source on-screen text ${i}`);
    return localized(en[i], zh[i] ?? en[i]);
  };
  const spec = shotConfig(ep, outputIndex).widget(t);
  assertNoFinePrintDeep(spec, `E${ep} shot ${outputIndex} widget`);
  return spec;
}

function assertNoFinePrintDeep(value, where) {
  if (typeof value === 'string') return assertNoFinePrint(value, where);
  if (Array.isArray(value)) return value.forEach((v) => assertNoFinePrintDeep(v, where));
  if (value && typeof value === 'object') Object.values(value).forEach((v) => assertNoFinePrintDeep(v, where));
}

function characters(ep, index, antenna) {
  const [nexuboPose, nexuboExpression, samPose, samExpression] = shotConfig(ep, index).poses ?? defaultPoses(index, antenna);
  const expression = antenna === 'red' ? 'warning' : nexuboExpression;
  return {
    nexubo: { pose: nexuboPose, expression },
    sam: { pose: samPose, expression: samExpression },
  };
}

function framing(index, sourceShot, config = {}) {
  if (config.framing) return { framing: config.framing, focus: config.focus ?? (config.framing === 'close-up' ? 'sam' : 'nexubo') };
  if (index === 0) return { framing: 'close-up', focus: 'sam' };
  if ((sourceShot.onscreen_text_en ?? []).length >= 4) return { framing: 'detail', focus: 'nexubo' };
  return { framing: 'wide', focus: sourceShot.antenna === 'amber' ? 'sam' : 'nexubo' };
}

function convertShot(sourceShot, ep, outputIndex) {
  const timing = parseTc(sourceShot.tc);
  const config = shotConfig(ep, outputIndex);
  const heading = config.heading ?? localized(compactHeading(sourceShot.onscreen_text_en), compactHeading(sourceShot.onscreen_text_zh));
  for (const value of Object.values(heading)) {
    if (!value?.trim()) throw new Error(`E${ep} shot ${outputIndex}: empty heading; add one to episode-config`);
    assertNoFinePrint(value, `E${ep} shot ${outputIndex} heading`);
  }
  return {
    id: config.id,
    duration: timing.duration,
    set: config.set,
    visual_en: sourceShot.visual_en,
    visual_zh: sourceShot.visual_zh,
    onscreen_text_en: heading.en,
    'onscreen_text_zh-Hans': heading['zh-Hans'],
    antenna: sourceShot.antenna,
    ding: sourceShot.antenna === 'red',
    ...characters(ep, outputIndex, sourceShot.antenna),
    ...framing(outputIndex, sourceShot, config),
    lines: timedLines(sourceShot.lines, timing.duration),
    widgets: [shotWidget(ep, outputIndex, sourceShot)],
    ...sourceNote(sourceShot),
  };
}

function findScene(scenes, kind) {
  return scenes.find((scene) => scene.kind === kind);
}

// Owner rule: the card shows exchange name, code, QR, nexualpha.com/go/<venue> and one CTA sentence — nothing else.
// The source disclosure/availability strings stay in JSON as metadata (contract field) and are never rendered.
function convertConversion(sourceEpisode, conversionScene) {
  const card = sourceEpisode.conversion_card;
  if (!card) return null;
  const ep = Number(sourceEpisode.ep);
  const config = EPISODE_CONFIG[ep] ?? {};
  if (!config.cta) throw new Error(`E${ep}: conversion card needs a configured CTA sentence`);
  const timing = conversionScene ? parseTc(conversionScene.tc) : { duration: 6 };
  const partners = card.partners?.length ? card.partners : card.partner ? [card.partner] : [];
  const venues = partners.map((key) => {
    const venue = VENUES[key];
    if (!venue) throw new Error(`E${ep}: unknown conversion venue ${key}`);
    // Codes come from the site's partner registry (source of truth); the script's code must agree with it.
    const code = registryCode(key);
    if (card.codes?.[key] && card.codes[key] !== code) throw new Error(`E${ep}: script code ${card.codes[key]} for ${key} differs from partner registry ${code}`);
    return { key, name: venue.name, code: localized(`Code ${code}`, `邀请码 ${code}`), url: venue.url };
  });
  const names = venues.map((venue) => venue.name.en).join(' / ');
  for (const value of [...Object.values(config.cta), ...venues.flatMap((v) => [...Object.values(v.name), v.url])]) assertNoFinePrint(value, `E${ep} conversion card`);
  return {
    duration: timing.duration,
    partner_name: localized(names, names),
    venues,
    cta: config.cta,
    disclosure: localized(card.disclosure_en, card.disclosure_zh),
    disclosure_rendered: false,
    lines: timedLines(conversionScene?.lines ?? [], timing.duration),
    visual_en: conversionScene?.visual_en,
    visual_zh: conversionScene?.visual_zh,
    source_tc: conversionScene?.tc,
    source_url: card.url,
    source_line: localized(card.line_en, card.line_zh),
    source_availability: localized(card.availability_en, card.availability_zh),
    source_partner: card.partner,
    source_partners: card.partners,
    source_codes: card.codes,
    restricted_locales: card.restricted_locales,
    restricted_variant: card.restricted_variant,
  };
}

function convertHook(sourceEpisode, hookScene) {
  const timing = hookScene ? parseTc(hookScene.tc) : { duration: 4 };
  return {
    duration: timing.duration,
    pose: 'point',
    text: localized(sourceEpisode.end_hook.en, sourceEpisode.end_hook.zh),
    lines: timedLines(hookScene?.lines ?? [{ who: 'Narrator', en: sourceEpisode.end_hook.en, zh: sourceEpisode.end_hook.zh }], timing.duration),
    visual_en: hookScene?.visual_en,
    visual_zh: hookScene?.visual_zh,
    source_tc: hookScene?.tc,
  };
}

function convertClose(closeScene) {
  if (!closeScene) return { duration: 4, lines: [] };
  const timing = parseTc(closeScene.tc);
  return {
    duration: timing.duration,
    lines: timedLines(closeScene.lines ?? [], timing.duration),
    visual_en: closeScene.visual_en,
    visual_zh: closeScene.visual_zh,
    source_tc: closeScene.tc,
  };
}

function convertOpen(openScene) {
  if (!openScene) return { lines: [] };
  const timing = parseTc(openScene.tc);
  return {
    duration: timing.duration,
    lines: timedLines(openScene.lines ?? [], timing.duration),
    visual_en: openScene.visual_en,
    visual_zh: openScene.visual_zh,
    source_tc: openScene.tc,
  };
}

export function convertEpisode(sourceEpisode, options = {}) {
  const ep = Number(sourceEpisode.ep);
  const scenes = sourceEpisode.shots.map((shot) => ({ ...shot, kind: sceneKind(shot) }));
  const contentShots = scenes.filter((shot) => shot.kind === 'shot');
  const open = convertOpen(findScene(scenes, 'open'));
  const close = convertClose(findScene(scenes, 'close'));
  const output = {
    version: 1,
    production_id: `E${String(ep).padStart(2, '0')}`,
    episode: ep,
    season: sourceEpisode.season,
    slug: sourceEpisode.slug,
    title: localized(sourceEpisode.title_en, sourceEpisode.title_zh),
    direction: 'ltr',
    status: 'V3_SOURCE_CONVERTED_SILENT_DEMO',
    timing_note: 'Converted from education/v3 source JSON. Shot-local line timings are deterministic estimates until real narration alignment is written back.',
    narration: NARRATION,
    open_lines: open.lines,
    open_visual_en: open.visual_en,
    open_visual_zh: open.visual_zh,
    shots: contentShots.map((shot, index) => convertShot(shot, ep, index)),
    conversion_card: convertConversion(sourceEpisode, findScene(scenes, 'conversion')),
    end_hook: convertHook(sourceEpisode, findScene(scenes, 'hook')),
    close_duration: close.duration,
    close_lines: close.lines,
    close_visual_en: close.visual_en,
    close_visual_zh: close.visual_zh,
    source_metadata: {
      source_path: options.sourcePath,
      original_slug: sourceEpisode.slug,
      goal: localized(sourceEpisode.goal_en, sourceEpisode.goal_zh),
      duration_target_s: sourceEpisode.duration_target_s,
      page_cta: sourceEpisode.page_cta,
      exercise: sourceEpisode.exercise,
      red_lines: sourceEpisode.red_lines,
      sources: sourceEpisode.sources,
      explicit_scene_kinds: scenes.map((shot) => ({ tc: shot.tc, kind: shot.kind })),
      widget_types: [...new Set(contentShots.map((shot, index) => shotWidget(ep, index, shot).type))],
    },
  };
  return output;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

export async function generateAll({
  sourceRoot = DEFAULT_SOURCE_ROOT,
  outRoot = join(here, 'episodes'),
  ids = DEFAULT_EPISODES,
  narrationTiming = loadTiming(join(outRoot, 'narration-timing.json')),
} = {}) {
  const written = [];
  await mkdir(join(outRoot, 'source'), { recursive: true });
  for (const id of ids) {
    const sourcePath = resolve(sourceRoot, `${id}.json`);
    const sourceCopy = join(outRoot, 'source', basename(sourcePath));
    if(resolve(sourcePath) !== resolve(sourceCopy)) await copyFile(sourcePath, sourceCopy);
    const source = await readJson(sourcePath);
    // Measured narration (when present) replaces estimated line timing; convertEpisode itself stays source-exact.
    const converted = applyNarrationTiming(convertEpisode(source, { sourcePath }), narrationTiming);
    const outputPath = join(outRoot, `${id}.json`);
    await writeJson(outputPath, converted);
    written.push(sourceCopy, outputPath);
  }
  return written;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  let sourceRoot=DEFAULT_SOURCE_ROOT;
  if(args[0] === '--source-root'){args.shift();sourceRoot=args.shift();if(!sourceRoot) throw new Error('--source-root requires a directory');}
  else if(args[0] && !/^E\d{2}$/.test(args[0])) sourceRoot=args.shift();
  const ids = args.length ? args : DEFAULT_EPISODES;
  const written = await generateAll({ sourceRoot, ids });
  for (const file of written) console.log(file);
}
