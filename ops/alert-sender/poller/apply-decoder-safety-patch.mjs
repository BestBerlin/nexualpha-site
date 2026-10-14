#!/usr/bin/env node
// Offline release patch only. The lead applies/rebuilds it through the release lane.
// Raw Bot API schemas can accept a number that produces an invalid JS Date.
// Final contract validation must reject that update rather than poison polling.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const MARKER = '// nx-safe-decoded-event v1';
const COUNTS = { inboundEventSchema: 3, channelDirectMessageCallbackEventSchema: 1, reactionCountEventSchema: 1, inlineQueryEventSchema: 1, channelDirectMessageEventSchema: 1 };
const HELPER = `${MARKER}\nfunction nxSafeDecodedEvent(schema, payload) {\n    const result = schema.safeParse(payload);\n    return result.success ? result.data : undefined;\n}\n`;
const ANCHORS = ['export function decodeBotApiUpdate(payload) {', 'function decodeBotApiUpdate(payload) {'];
const count = (text, part) => text.split(part).length - 1;

export function patchDecoderSource(source) {
  if (source.includes(MARKER)) {
    if (!source.includes(HELPER) || Object.entries(COUNTS).some(([schema, expected]) =>
      count(source, `return nxSafeDecodedEvent(${schema}, {`) !== expected || source.includes(`return ${schema}.parse({`))) {
      throw new Error('incomplete decoder safety patch; nothing changed');
    }
    return { status: 'already', text: source };
  }
  const anchor = ANCHORS.find(value => source.includes(value));
  if (!anchor || count(source, anchor) !== 1 || Object.entries(COUNTS).some(([schema, expected]) => count(source, `return ${schema}.parse({`) !== expected)) {
    throw new Error('decoder anchors changed; nothing changed');
  }
  let text = source.replace(anchor, () => HELPER + anchor);
  for (const schema of Object.keys(COUNTS)) text = text.replaceAll(`return ${schema}.parse({`, `return nxSafeDecodedEvent(${schema}, {`);
  return { status: 'patched', text };
}

export function applyDecoderSafetyPatch(releaseDir, { now = new Date() } = {}) {
  const file = path.join(releaseDir, 'dist/packages/telegram/src/update-decoder.js');
  const result = patchDecoderSource(readFileSync(file, 'utf8'));
  let backup = null;
  if (result.status === 'patched') {
    backup = `${file}.bak-${now.toISOString().replace(/[:.]/g, '-')}`;
    copyFileSync(file, backup);
    writeFileSync(file, result.text);
  }
  return { status: result.status, file, backup };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!process.argv[2]) { console.error('usage: node apply-decoder-safety-patch.mjs <offline-release-dir>'); process.exit(2); }
  try { console.log(JSON.stringify(applyDecoderSafetyPatch(path.resolve(process.argv[2])))); }
  catch (error) { console.error(`decoder safety patch: ${error.message}`); process.exitCode = 1; }
}
