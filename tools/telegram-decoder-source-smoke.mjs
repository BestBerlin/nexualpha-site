#!/usr/bin/env node
// Read-only optional source reproduction. Bundles in memory and writes the
// executable only to a disposable directory inside the current worktree.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, transform } from '../pilot-01-prototype/node_modules/esbuild/lib/main.js';
import { patchDecoderSource } from '../ops/alert-sender/poller/apply-decoder-safety-patch.mjs';

const root = process.argv[2];
if (!root) throw new Error('usage: node tools/telegram-decoder-source-smoke.mjs <read-only-telegram-source-root>');
const file = path.join(root, 'packages/telegram/src/update-decoder.ts');
const source = await readFile(file, 'utf8');
const compiled = (await transform(source, { loader: 'ts', format: 'esm', target: 'es2022' })).code;
const storage = path.resolve('.context-excluded/telegram-audit');
await mkdir(storage, { recursive: true });
const temp = await mkdtemp(path.join(storage, 'decoder-'));
async function load(text, name) {
  const result = await build({ stdin: { contents: text, sourcefile: 'update-decoder.js', resolveDir: path.dirname(file), loader: 'js' }, bundle: true, platform: 'node', format: 'esm', write: false });
  const out = path.join(temp, `${name}.mjs`);
  await writeFile(out, result.outputFiles[0].text);
  return import(pathToFileURL(out));
}
try {
  const before = await load(compiled, 'before');
  const after = await load(patchDecoderSource(compiled).text, 'after');
  const invalidDate = 8640000000001;
  const message = { message_id: 1, date: 1788000000, chat: { id: 1, type: 'private' }, from: { id: 2 }, text: '/start' };
  const cases = [
    ['decodeBotApiUpdate', { update_id: 1, message: { ...message, date: invalidDate } }],
    ['decodeBotApiCallbackQuery', { update_id: 2, callback_query: { id: 'query', data: 'nav:hub', from: { id: 2 }, message: { ...message, date: invalidDate } } }],
    ['decodeBotApiReactionCountUpdate', { update_id: 3, message_reaction_count: { message_id: 1, date: invalidDate, chat: { id: 1 }, reactions: [] } }],
    ['decodeBotApiChannelDirectMessage', { update_id: 4, message: { ...message, date: invalidDate, chat: { id: 1, is_direct_messages: true }, direct_messages_topic: { topic_id: 1 } } }],
  ];
  const findings = [];
  for (const [name, payload] of cases) {
    assert.throws(() => before[name](payload), { name: 'ZodError' });
    assert.equal(after[name](payload), undefined);
    findings.push({ decoder: name, before: 'ZodError', after: 'rejected without throw' });
  }
  const valid = { update_id: 1, message };
  assert.deepEqual(after.decodeBotApiUpdate(valid), before.decodeBotApiUpdate(valid));
  const decoders = ['decodeBotApiUpdate', 'decodeBotApiCallbackQuery', 'decodeBotApiReactionCountUpdate', 'decodeBotApiInlineQuery', 'decodeBotApiChannelDirectMessage', 'decodeBotApiChannelDirectMessageCallbackQuery'];
  let checks = 0;
  for (const name of decoders) for (const payload of [null, undefined, [], {}, { update_id: -1 }, { update_id: Infinity }, { update_id: '1' }]) {
    assert.equal(after[name](payload), undefined); checks++;
  }
  console.log(JSON.stringify({ source_file: file, source_sha256: createHash('sha256').update(source).digest('hex'), findings, malformed_shape_checks: checks, valid_message_parity: true }, null, 2));
} finally { await rm(temp, { recursive: true, force: true }); }
