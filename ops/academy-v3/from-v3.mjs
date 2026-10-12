import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { samVoiceInstruct } from './narration-plan.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SOURCE_ROOT = join(here,'episodes/source');
const DEFAULT_EPISODES = ['E05', 'E09', 'E21'];

const NARRATION = {
  mode: 'CLONE',
  command_template: "python -m mlx_audio.tts.generate --model mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit --lang_code en --ref_audio /Volumes/致态2TB/nx-agents/education/v2/voice-en-master-reference.wav --ref_text \"Your KYC got rejected again? Don't worry. Most rejections come down to just a few simple mistakes. Let's fix them together.\" --text \"<line>\" --output_path <dir> --file_prefix <name>",
  english_voice_instruct: 'a cheerful young American woman in her twenties, warm and energetic, clear diction, friendly YouTube tutorial host',
  sam_voice_design_instruct: samVoiceInstruct,
  sam_voice_note: 'Task-specific brief requests Sam lines with this distinct VoiceDesign model; this overrides the older global owner note that male voice was not used.',
};

const EPISODE_STYLE = {
  5: {
    set: 'study-desk',
    ids: ['problem', 'official-flow', 'kyc-steps', 'fix-rejection', 'review-status', 'official-only'],
    poses: [
      ['shield', 'warning', 'rest', 'worried'],
      ['shield', 'happy', 'rest', 'confused'],
      ['hold-phone', 'thinking', 'hold-phone', 'neutral'],
      ['point', 'thinking', 'rest', 'confused'],
      ['hold-phone', 'thinking', 'point', 'neutral'],
      ['thumbs-up', 'happy', 'point', 'happy'],
    ],
  },
  9: {
    set: 'transfer-station',
    ids: ['problem', 'match-ends', 'route-analogy', 'transfer-checklist', 'test-transfer', 'dont-send'],
    poses: [
      ['shield', 'warning', 'point', 'surprised'],
      ['point', 'thinking', 'rest', 'neutral'],
      ['hold-phone', 'thinking', 'rest', 'confused'],
      ['point', 'thinking', 'hold-phone', 'neutral'],
      ['thumbs-up', 'happy', 'hold-phone', 'happy'],
      ['thumbs-up', 'happy', 'point', 'happy'],
    ],
  },
  21: {
    set: 'trading-desk',
    ids: ['problem', 'own-margin', 'box-risk', 'auto-add-on', 'settings-check', 'auto-add-answer'],
    poses: [
      ['point', 'thinking', 'point', 'confused'],
      ['point', 'happy', 'rest', 'neutral'],
      ['shield', 'thinking', 'rest', 'worried'],
      ['shield', 'warning', 'point', 'surprised'],
      ['hold-phone', 'thinking', 'hold-phone', 'neutral'],
      ['thumbs-up', 'happy', 'point', 'happy'],
    ],
  },
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

function shotWidget(ep, outputIndex, sourceShot) {
  const en = sourceShot.onscreen_text_en ?? [];
  const zh = sourceShot.onscreen_text_zh ?? [];
  if (ep === 5) {
    const widgets = [
      { type: 'warning', message: localized(en[0] ?? 'Private-message KYC offer', zh[0] ?? '私信代办认证') },
      { type: 'checklist', items: [item('Official domain', '官方域名'), item('Official verification entry', '官方认证入口'), item('No chat agents', '不找私信代办')] },
      { type: 'checklist', items: [item('Real details', '真实信息'), item('Valid ID', '有效证件'), item('Photo / face check', '照片／本人验证'), item('SAMPLE ID · fictional', '样张 · 虚构')] },
      { type: 'id-samples', labels: [localized('Glare', '反光'), localized('Cropped', '裁切'), localized('Expired', '过期')], note: localized('SAMPLE ID · rejection → clean state', '样张 · 拒绝状态 → 清晰状态') },
      { type: 'checklist', items: [item('Under review', '审核中'), item('Official help', '官方帮助'), item('No countdown promise', '不承诺审核时限')] },
      { type: 'checklist', items: [item('Official verification page', '官网认证入口'), item("Private 'agent'", '私信代办', false), item('Course chat upload', '课程聊天区上传', false)] },
    ];
    return widgets[outputIndex] ?? { type: 'checklist', items: en.map((label, i) => item(label, zh[i] ?? label)) };
  }
  if (ep === 9) {
    const widgets = [
      { type: 'warning', message: localized(en[0] ?? 'Network must match', zh[0] ?? '网络必须匹配') },
      { type: 'transfer-match', sender: localized('Sender', '发送方'), receiver: localized('Receiver', '接收方'), coin: localized('USDT', 'USDT'), network: localized('Supported network', '支持的网络'), note: localized('Check receiving platform support', '核对接收平台支持情况') },
      { type: 'checklist', items: [item('Network = route', '网络＝路线'), item('Address = destination', '地址＝目的地'), item('Analogy only', '仅帮助理解')] },
      { type: 'checklist', title: localized('Pre-transfer checklist', '转账前检查清单'), items: [item('Coin', '币种'), item('Network', '网络'), item('Full address', '完整地址'), item('Memo / Tag if required', 'Memo / Tag（如需）'), item('Minimum deposit', '最低充值'), item('Withdrawal fee', '提币费用'), item('Estimated arrival', '预计到账')] },
      { type: 'checklist', items: [item('Small test credited', '小额测试已入账'), item('Re-check before the next one', '下一笔前重新核对')] },
      { type: 'warning', message: localized(en[0] ?? "DON'T SEND", zh[0] ?? '不能转') },
    ];
    return widgets[outputIndex] ?? { type: 'checklist', items: en.map((label, i) => item(label, zh[i] ?? label)) };
  }
  if (ep === 21) {
    const widgets = [
      { type: 'margin-flow', balance: 900, margin: 100, autoAdd: false, label: localized('Box 100 · Balance 900', '小盒子 100 · 余额 900'), note: localized('Teaching model', '教学模型') },
      { type: 'margin-flow', balance: 900, margin: 100, autoAdd: false, label: localized('Isolated = own margin', '逐仓 = 单独保证金'), note: localized('"Forever" removed', '去掉“永远”') },
      { type: 'margin-flow', balance: 900, margin: 100, autoAdd: false, label: localized('100 can still be lost', '这100仍可能亏损'), note: localized('Isolated is not a stop-loss', '逐仓不是止损') },
      { type: 'margin-flow', balance: 900, margin: 100, autoAdd: true, label: localized('Auto-add margin: ON · 100 → more', '自动追加：开 · 100 → 更多'), note: localized('Teaching model · not exchange rules', '教学模型 · 非交易所规则') },
      { type: 'checklist', items: [item('Mode', '模式'), item('Auto-add', '自动追加'), item('Fee deduction', '费用扣取'), item('Total committed', '可投入总额')] },
      { type: 'margin-flow', balance: 900, margin: 100, autoAdd: true, label: localized('Isolated + auto-add = only 100?', '逐仓 + 自动追加 = 只用100？'), note: localized('No', '不能') },
    ];
    return widgets[outputIndex] ?? { type: 'margin-flow', balance: 900, margin: 100, autoAdd: false, label: textArray(en, zh), note: localized('Teaching model', '教学模型') };
  }
  return { type: 'checklist', items: en.map((label, i) => item(label, zh[i] ?? label)) };
}

function characters(ep, index, antenna) {
  const [nexuboPose, nexuboExpression, samPose, samExpression] = EPISODE_STYLE[ep]?.poses[index] ?? ['point', 'happy', 'rest', 'neutral'];
  const expression = antenna === 'red' ? 'warning' : nexuboExpression;
  return {
    nexubo: { pose: nexuboPose, expression },
    sam: { pose: samPose, expression: samExpression },
  };
}

function framing(index, sourceShot) {
  if(/sender card|auto-add margin.*toggle|Isolated with auto-add on/i.test(sourceShot.visual_en)) return {framing:'detail',focus:'nexubo'};
  if (index === 0) return { framing: 'close-up', focus: 'sam' };
  if ((sourceShot.onscreen_text_en ?? []).length >= 4) return { framing: 'detail', focus: 'nexubo' };
  return { framing: 'wide', focus: sourceShot.antenna === 'amber' ? 'sam' : 'nexubo' };
}

function convertShot(sourceShot, ep, outputIndex) {
  const timing = parseTc(sourceShot.tc);
  const ids = EPISODE_STYLE[ep]?.ids ?? [];
  const id = ids[outputIndex] ?? `shot-${String(outputIndex + 1).padStart(2, '0')}`;
  return {
    id,
    duration: timing.duration,
    set: EPISODE_STYLE[ep]?.set ?? 'study-desk',
    visual_en: sourceShot.visual_en,
    visual_zh: sourceShot.visual_zh,
    onscreen_text_en: compactHeading(sourceShot.onscreen_text_en),
    'onscreen_text_zh-Hans': compactHeading(sourceShot.onscreen_text_zh),
    antenna: sourceShot.antenna,
    ding: sourceShot.antenna === 'red',
    ...characters(ep, outputIndex, sourceShot.antenna),
    ...framing(outputIndex, sourceShot),
    lines: timedLines(sourceShot.lines, timing.duration),
    widgets: [shotWidget(ep, outputIndex, sourceShot)],
    ...sourceNote(sourceShot),
  };
}

function findScene(scenes, kind) {
  return scenes.find((scene) => scene.kind === kind);
}

function convertConversion(sourceEpisode, conversionScene) {
  const card = sourceEpisode.conversion_card;
  if (!card) return null;
  const timing = conversionScene ? parseTc(conversionScene.tc) : { duration: 6 };
  const partners = card.partners?.length ? card.partners : card.partner ? [card.partner] : [];
  const partnerName = partners.length === 1 ? partners[0].toUpperCase() : partners.map((p) => p.toUpperCase()).join(' / ');
  const codes = Object.values(card.codes ?? {}).filter(Boolean);
  const codeText = codes.length ? codes.map((code) => `Code ${code}`).join(' · ') : undefined;
  const codeZh = codes.length ? codes.map((code) => `邀请码 ${code}`).join(' · ') : undefined;
  return {
    duration: timing.duration,
    partner_name: partnerName ? localized(partnerName, partnerName) : undefined,
    code: codeText ? localized(codeText, codeZh) : undefined,
    rebate_line: localized(card.line_en, card.line_zh),
    disclosure: localized(card.disclosure_en, card.disclosure_zh),
    availability: localized(card.availability_en, card.availability_zh),
    url: card.url,
    lines: timedLines(conversionScene?.lines ?? [], timing.duration),
    visual_en: conversionScene?.visual_en,
    visual_zh: conversionScene?.visual_zh,
    source_tc: conversionScene?.tc,
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
      required_contract_extensions: [
        ...(ep === 5 ? ['widget type id-samples {labels, note}'] : []),
        ...(ep === 9 ? ['widget type transfer-match {coin, network, note}'] : []),
        ...(ep === 21 ? ['widget type margin-flow {balance, margin, autoAdd, label, note}'] : []),
      ],
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
} = {}) {
  const written = [];
  await mkdir(join(outRoot, 'source'), { recursive: true });
  for (const id of ids) {
    const sourcePath = resolve(sourceRoot, `${id}.json`);
    const sourceCopy = join(outRoot, 'source', basename(sourcePath));
    if(resolve(sourcePath) !== resolve(sourceCopy)) await copyFile(sourcePath, sourceCopy);
    const source = await readJson(sourcePath);
    const converted = convertEpisode(source, { sourcePath });
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
