import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildNarrationPlan, parseTimecode, samVoiceInstruct } from './narration-plan.mjs';

const load = id => JSON.parse(readFileSync(`/Volumes/致态2TB/nx-agents/education/v3/episodes/${id}.json`, 'utf8'));

test('parseTimecode converts v3 minute-second ranges to seconds', () => {
  assert.deepEqual(parseTimecode('01:56-02:02'), { start: 116, end: 122, duration: 6 });
  assert.throws(() => parseTimecode('02:02-01:56'), /Non-positive/);
});

test('narration plan covers all sample scenes including conversion, hook and close', () => {
  const plan = buildNarrationPlan([load('E05'), load('E09'), load('E21')]);
  assert.deepEqual(plan.summary.episodes, ['E05', 'E09', 'E21']);
  assert.equal(plan.summary.scenes, 28);
  assert.equal(plan.summary.lines, 28);

  const e05Kinds = plan.episodes.find(e => e.id === 'E05').scenes.map(scene => scene.kind);
  assert.ok(e05Kinds.includes('conversion'));
  assert.equal(e05Kinds.at(-2), 'hook');
  assert.equal(e05Kinds.at(-1), 'close');

  const nonNarratedOpen = plan.episodes.flatMap(e => e.scenes).filter(scene => scene.kind === 'open');
  assert.equal(nonNarratedOpen.length, 3);
  assert.ok(nonNarratedOpen.every(scene => scene.lines.length === 0));
});

test('speaker routing keeps Sam on the separate VoiceDesign profile and owner clone for others', () => {
  const plan = buildNarrationPlan([load('E05')]);
  assert.equal(plan.voice_profiles.englishMasterClone.model, 'mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit');
  assert.equal(plan.voice_profiles.englishMasterClone.ref_text, "Your KYC got rejected again? Don't worry. Most rejections come down to just a few simple mistakes. Let's fix them together.");
  assert.equal(plan.voice_profiles.samVoiceDesign.model, 'mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-bf16');
  assert.equal(plan.voice_profiles.samVoiceDesign.instruct, samVoiceInstruct);

  const lines = plan.episodes[0].scenes.flatMap(scene => scene.lines);
  assert.ok(lines.some(line => line.speaker === 'sam' && line.voice_profile === 'sam-voice-design'));
  assert.ok(lines.some(line => line.speaker === 'nexubo' && line.voice_profile === 'english-master-clone'));
  assert.ok(lines.some(line => line.speaker === 'narrator' && line.voice_profile === 'english-master-clone'));
  assert.ok(lines.every(line => line.command.includes('--text') && line.output_path.endsWith(`${line.id}_000.wav`)));
});

test('alignment never exceeds atempo 1.08 and fits the widened windows', async () => {
  const { fitLines, ATEMPO_COMPROMISE } = await import('./align-narration.mjs');
  assert.equal(ATEMPO_COMPROMISE, 1.08);
  const hook = fitLines([6.5], { duration: 4, min: 3, max: 7, label: 'hook' });
  assert.ok(hook.duration <= 7 && hook.lines[0].atempo === 1);
  assert.throws(() => fitLines([8], { duration: 4, min: 3, max: 7, label: 'hook' }), /> 1\.08/);
});
