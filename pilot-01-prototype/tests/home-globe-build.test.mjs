// Run after npm run build: pins the lazy globe's transfer size and its exclusion from the home entry.
import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';

const assets = new URL('../dist/client/assets/', import.meta.url);
test('built globe includes its mask within 8 KB gzip and stays outside the home static closure', {
  skip: !existsSync(assets) && 'Run npm run build first',
}, (t) => {
  const files = readdirSync(assets).filter(name => /^home-globe-[\w-]+\.js$/.test(name));
  assert.equal(files.length, 1, 'one separately lazy-loaded globe chunk');
  const code = readFileSync(new URL(files[0], assets));
  const gzipBytes = gzipSync(code, { level: 6 }).length;
  assert.ok(gzipBytes <= 8000, `${files[0]}: ${gzipBytes} gzip bytes, maximum 8000`);
  assert.doesNotMatch(code.toString(), /\bimport(?:\s|\()/, 'mask and texture builder are self-contained');
  const run = spawnSync(process.execPath, ['scripts/verify-build-budget.mjs', '--strict'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const budget = JSON.parse(run.stdout);
  const home = budget.checks.find(check => check.label.startsWith('home initial JS'));
  assert.ok(home?.pass);
  assert.ok(home.chunks.every(chunk => chunk.name !== files[0]), 'home imports globe only dynamically');
  t.diagnostic(`${files[0]}: ${gzipBytes} bytes gzip; home static closure ${home.bytes}/${home.maxBytes} bytes`);
});
