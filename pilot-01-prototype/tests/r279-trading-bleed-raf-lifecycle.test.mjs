import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const r278TradingBleedPath = fileURLToPath(new URL('../../../r278-leading-research-action/candidate/src/components/v3/TradingBleedAnalyzer.jsx', import.meta.url));
const currentTradingBleedPath = process.env.R279_CURRENT_TRADING_BLEED_SOURCE || fileURLToPath(new URL('../src/components/v3/TradingBleedAnalyzer.jsx', import.meta.url));

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function animatedNumberBlock(source) {
  const start = source.indexOf('// Animated Number Component using requestAnimationFrame for 60fps smooth count-up');
  const end = source.indexOf('\nexport function TradingBleedAnalyzer', start);
  assert.notEqual(start, -1, 'AnimatedNumber block start should exist');
  assert.notEqual(end, -1, 'AnimatedNumber block end should exist');
  return source.slice(start, end);
}

async function bundleAndRunAnimatedNumber(sourcePath) {
  const source = await readFile(sourcePath, 'utf8');
  const block = animatedNumberBlock(source);
  const tempDir = await mkdtemp(path.join(projectRoot, 'tests/.tmp-r279-trading-bleed-'));
  try {
    const entryPath = path.join(tempDir, 'entry.jsx');
    const bundlePath = path.join(tempDir, 'bundle.cjs');
    await writeFile(entryPath, `
      let env = null;
      const React = {
        createElement() { return null; },
        useEffect(callback) { env.cleanup = callback(); },
      };
      const useState = () => [0, (value) => { env.values.push(value); }];
      const install = () => {
        env = { values: [], frames: new Map(), cancelled: [], nextFrameId: 0, cleanup: null };
        globalThis.requestAnimationFrame = (callback) => {
          const id = ++env.nextFrameId;
          env.frames.set(id, callback);
          return id;
        };
        globalThis.cancelAnimationFrame = (id) => {
          env.cancelled.push(id);
          env.frames.delete(id);
        };
        return env;
      };
      ${block}
      const runCleanupScenario = () => {
        const state = install();
        AnimatedNumber({ value: 100, prefix: '', suffix: '' });
        const first = state.frames.get(1);
        state.frames.delete(1);
        first(1000);
        const recursive = state.frames.get(2);
        const framesAfterFirst = [...state.frames.keys()];
        state.cleanup();
        const framesAfterCleanup = [...state.frames.keys()];
        const valuesBeforeStale = state.values.length;
        recursive(1200);
        return {
          framesAfterFirst,
          framesAfterCleanup,
          cancelled: state.cancelled,
          values: state.values,
          staleWrote: state.values.length > valuesBeforeStale,
        };
      };
      const runMidpointScenario = () => {
        const state = install();
        AnimatedNumber({ value: 100, prefix: '', suffix: '' });
        const first = state.frames.get(1);
        state.frames.delete(1);
        first(2000);
        const recursive = state.frames.get(2);
        state.frames.delete(2);
        recursive(2200);
        return { values: state.values };
      };
      console.log(JSON.stringify({ cleanup: runCleanupScenario(), midpoint: runMidpointScenario() }));
    `);
    execFileSync(path.join(projectRoot, 'node_modules/.bin/esbuild'), [
      entryPath,
      '--bundle',
      '--platform=node',
      '--format=cjs',
      `--outfile=${bundlePath}`,
      '--loader:.css=empty',
      '--log-level=warning',
    ], { cwd: projectRoot, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    return JSON.parse(execFileSync('node', [bundlePath], { cwd: projectRoot, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test('R278 AnimatedNumber source reproduces the recursive RAF cleanup leak', async () => {
  const result = await bundleAndRunAnimatedNumber(r278TradingBleedPath);
  assert.deepEqual(result.cleanup.framesAfterFirst, [2], 'old source schedules recursive frame id=2');
  assert.deepEqual(result.cleanup.cancelled, [1], 'old cleanup cancels only initial frame id=1');
  assert.deepEqual(result.cleanup.framesAfterCleanup, [2], 'recursive frame remains live after old cleanup');
  assert.equal(result.cleanup.staleWrote, true, 'stale recursive callback mutates state after old cleanup');
});

test('current AnimatedNumber source cancels the latest recursive RAF and guards stale callbacks', async () => {
  const result = await bundleAndRunAnimatedNumber(currentTradingBleedPath);
  assert.deepEqual(result.cleanup.framesAfterFirst, [2]);
  assert.deepEqual(result.cleanup.cancelled, [2], 'cleanup cancels the latest recursive frame');
  assert.deepEqual(result.cleanup.framesAfterCleanup, [], 'recursive frame is removed during cleanup');
  assert.equal(result.cleanup.staleWrote, false, 'active guard blocks manually invoked stale callback');
  assert.deepEqual(result.midpoint.values.slice(0, 2), [0, 88], '400ms easeOutCubic midpoint remains Math.round(87.5)');
});

test('AnimatedNumber source keeps lifecycle local and partner registry untouched', async () => {
  const source = await readFile(new URL('../src/components/v3/TradingBleedAnalyzer.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /createAnimatedNumberFrameController/);
  assert.match(source, /const duration = 400; \/\/ 400ms smooth count/);
  assert.match(source, /let active = true;/);
  assert.match(source, /let frameId = null;/);
  assert.match(source, /frameId = requestAnimationFrame\(step\);/);
  assert.match(source, /active = false;/);
  assert.doesNotMatch(source, /if \(progress < 1\) \{\s*requestAnimationFrame\(step\);\s*\}/);

  const registry = await readFile(new URL('../src/data/partner-registry.js', import.meta.url), 'utf8');
  assert.equal(sha256(registry), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});
