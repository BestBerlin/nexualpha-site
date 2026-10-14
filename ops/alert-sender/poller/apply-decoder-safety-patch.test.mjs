import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { applyDecoderSafetyPatch, patchDecoderSource } from './apply-decoder-safety-patch.mjs';

const fixture = readFileSync(new URL('../fixtures/poller/update-decoder.js', import.meta.url), 'utf8');

test('all seven decoded-event contract boundaries reject invalid data instead of throwing', () => {
  const patched = patchDecoderSource(fixture);
  assert.equal(patched.status, 'patched');
  assert.equal((patched.text.match(/return nxSafeDecodedEvent\(/g) || []).length, 7);
  assert.equal(patchDecoderSource(patched.text).status, 'already');
  const helper = patched.text.slice(patched.text.indexOf('function nxSafeDecodedEvent'), patched.text.indexOf('export function decodeBotApiUpdate'));
  const safe = vm.runInNewContext(helper + '\nnxSafeDecodedEvent');
  const accepted = { id: 1 };
  assert.equal(safe({ safeParse: () => ({ success: true, data: accepted }) }, accepted), accepted);
  assert.equal(safe({ safeParse: () => ({ success: false, error: new Error('Invalid Date') }) }, {}), undefined);
});

test('changed anchors fail before writes; successful patch keeps a backup and is idempotent', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'decoder-audit-'));
  const dir = path.join(root, 'dist/packages/telegram/src');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'update-decoder.js');
  try {
    const broken = fixture.replace('return inlineQueryEventSchema.parse({', 'return otherSchema.parse({');
    writeFileSync(file, broken);
    assert.throws(() => applyDecoderSafetyPatch(root), /anchors changed/);
    assert.equal(readFileSync(file, 'utf8'), broken);
    assert.equal(readdirSync(dir).length, 1);
    writeFileSync(file, fixture);
    const result = applyDecoderSafetyPatch(root, { now: new Date('2026-10-14T12:00:00Z') });
    assert.equal(readFileSync(result.backup, 'utf8'), fixture);
    assert.equal(applyDecoderSafetyPatch(root).status, 'already');
    assert.equal(readdirSync(dir).length, 2);
    assert.throws(() => patchDecoderSource(readFileSync(file, 'utf8').replace('return result.success ? result.data : undefined;', 'return result.data;')), /incomplete/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
