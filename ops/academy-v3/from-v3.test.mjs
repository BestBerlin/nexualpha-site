import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { convertEpisode, sceneKind, parseTc } from './from-v3.mjs';
import { validateEpisode, schedule } from './contract.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const sourceRoot = root+'episodes/source';
const readSource = (id) => JSON.parse(readFileSync(`${sourceRoot}/${id}.json`, 'utf8'));

test('timecode parser keeps source durations exact', () => {
  assert.deepEqual(parseTc('01:56-02:02'), { start: 116, end: 122, duration: 6 });
  assert.throws(() => parseTc('02:02-01:56'), /Non-positive/);
});

test('scene classifier keeps open, conversion, hook and close out of content shots', () => {
  const e05 = readSource('E05');
  assert.deepEqual(e05.shots.map(sceneKind), [
    'shot',
    'open',
    'shot',
    'shot',
    'shot',
    'shot',
    'shot',
    'conversion',
    'hook',
    'close',
  ]);
  const converted = convertEpisode(e05, { sourcePath: `${sourceRoot}/E05.json` });
  assert.equal(converted.shots.length, 6);
  assert.equal(converted.shots[0].duration, 6);
  assert.equal(converted.open_visual_en, e05.shots[1].visual_en);
  assert.equal(converted.conversion_card.visual_en, e05.shots[7].visual_en);
  assert.equal(converted.end_hook.visual_en, e05.shots[8].visual_en);
  assert.equal(converted.close_visual_en, e05.shots[9].visual_en);
});

test('E05 conversion preserves supplied commercial source data without partner QR override', () => {
  const source = readSource('E05');
  const converted = validateEpisode(convertEpisode(source), 'en');
  validateEpisode(converted, 'zh-Hans');
  assert.equal(converted.production_id, 'E05');
  assert.equal(converted.slug, source.slug);
  assert.equal(converted.conversion_card.url, source.conversion_card.url);
  assert.deepEqual(converted.conversion_card.source_codes, source.conversion_card.codes);
  assert.equal(converted.conversion_card.code.en, 'Code nexu888');
  assert.equal(converted.conversion_card.disclosure.en, source.conversion_card.disclosure_en);
  assert.equal(converted.conversion_card.availability['zh-Hans'], source.conversion_card.availability_zh);
  assert.equal(schedule(converted).duration, source.duration_target_s);
  assert.equal(converted.source_metadata.explicit_scene_kinds.filter((x) => x.kind === 'conversion').length, 1);
});

test('E09 and E21 convert all dialogue and preserve full on-screen source text in metadata', () => {
  for (const id of ['E09', 'E21']) {
    const source = readSource(id);
    const converted = validateEpisode(convertEpisode(source), 'en');
    validateEpisode(converted, 'zh-Hans');
    assert.equal(schedule(converted).duration, source.duration_target_s);
    const sourceDialogue = source.shots.flatMap((shot) => shot.lines ?? []).map((line) => [line.who, line.en, line.zh]);
    const convertedDialogue = [
      ...converted.open_lines,
      ...converted.shots.flatMap((shot) => shot.lines),
      ...(converted.conversion_card?.lines ?? []),
      ...converted.end_hook.lines,
      ...converted.close_lines,
    ].map((line) => [line.source_who, line.text.en, line.text['zh-Hans']]);
    assert.deepEqual(convertedDialogue, sourceDialogue);
    for (const [index, shot] of converted.shots.entries()) {
      const sourceShot = source.shots.filter((candidate) => sceneKind(candidate) === 'shot')[index];
      assert.deepEqual(shot.source_onscreen_text, {
        en: sourceShot.onscreen_text_en,
        'zh-Hans': sourceShot.onscreen_text_zh,
      });
      assert.equal(shot.onscreen_text_en, sourceShot.onscreen_text_en[0]);
    }
  }
});

test('E09 checklist and E21 margin-flow widgets are deterministic and compact', () => {
  const e09 = convertEpisode(readSource('E09'));
  const checklist = e09.shots.find((shot) => shot.id === 'transfer-checklist');
  const matchEnds = e09.shots.find((shot) => shot.id === 'match-ends');
  assert.equal(matchEnds.widgets.length, 1);
  assert.equal(matchEnds.widgets[0].type, 'transfer-match');
  assert.equal(checklist.framing, 'detail');
  assert.equal(checklist.widgets.length, 1);
  assert.equal(checklist.widgets[0].type, 'checklist');
  assert.equal(checklist.widgets[0].items.length, 7);
  assert.ok(checklist.widgets[0].items.some((item) => item.label.en === 'Withdrawal fee'));

  const e05 = convertEpisode(readSource('E05'));
  const rejection = e05.shots.find((shot) => shot.id === 'fix-rejection');
  assert.equal(rejection.widgets.length, 1);
  assert.equal(rejection.widgets[0].type, 'id-samples');
  assert.deepEqual(rejection.widgets[0].labels.map((label) => label.en), ['Glare', 'Cropped', 'Expired']);

  const e21 = convertEpisode(readSource('E21'));
  const autoAdd = e21.shots.find((shot) => shot.id === 'auto-add-on');
  assert.equal(autoAdd.widgets.length, 1);
  assert.equal(autoAdd.widgets[0].type, 'margin-flow');
  assert.equal(autoAdd.widgets[0].balance, 900);
  assert.equal(autoAdd.widgets[0].margin, 100);
  assert.equal(autoAdd.widgets[0].autoAdd, true);
});

test('CLI copies source JSON and generates reproducible E05/E09/E21 kit inputs', () => {
  const r = spawnSync(process.execPath, ['from-v3.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  for (const id of ['E05', 'E09', 'E21']) {
    const source = JSON.parse(readFileSync(new URL(`./episodes/source/${id}.json`, import.meta.url), 'utf8'));
    const generated = JSON.parse(readFileSync(new URL(`./episodes/${id}.json`, import.meta.url), 'utf8'));
    assert.deepEqual(source, readSource(id));
    assert.equal(generated.production_id, id);
    assert.equal(generated.source_metadata.original_slug, source.slug);
    validateEpisode(generated, 'en');
    validateEpisode(generated, 'zh-Hans');
  }
});
