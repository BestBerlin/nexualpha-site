import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { placementReport, placementMarkdown, run } from './placement-report.mjs';

const fixture = readFileSync(new URL('./fixtures/clicks.jsonl', import.meta.url), 'utf8');
const now = Date.parse('2026-10-12T12:00:00Z');
test('aggregates all event kinds, dimensions and exact rolling boundaries', () => {
  const r = placementReport(fixture, { now, placements: ['home-v7-hero', 'unused', 'old', 'unused'] });
  assert.deepEqual([1, 7, 28].map((d) => r.windows[d].total), [3, 4, 5]);
  assert.equal(r.windows[1].rows[0].clicks, 2);
  assert.deepEqual(r.windows[1].rows[0], { venue: 'okx', src: 'home-v7-hero', locale: 'zh-Hans', path: '/zh-hans', country: 'CN', clicks: 2 });
  assert.equal(r.windows[1].rows[1].path, null, 'host-only historical ref cannot recover page');
  assert.deepEqual(r.zeroClickPlacements7d, ['old', 'unused']);
  assert.throws(() => placementReport('', { now: NaN }), /Invalid/);
});
test('unknown dimensions stay separate and sensitive extra fields never appear', () => {
  const r = placementReport(JSON.stringify({ t: '2026-10-12T11:00:00Z', partner: 'okx', src: 'bad<script>', ref: 'https://evil.test/user@example.com?token=secret', ip: 'secret-ip', ua: 'secret-ua' }), { now });
  assert.equal(r.windows[1].rows[0].src, 'unknown');
  assert.equal(r.windows[1].rows[0].path, null);
  assert.doesNotMatch(JSON.stringify(r), /secret|example.com|script/);
});
test('Markdown caps each window at 30 rows, keeps complete JSON and escapes cells', () => {
  const text = Array.from({ length: 35 }, (_, i) => JSON.stringify({ t: '2026-10-12T11:00:00Z', partner: i === 0 ? '<venue>|x' : `venue-${i}`, src: 'button' })).join('\n');
  const r = placementReport(text, { now });
  const md = placementMarkdown(r);
  assert.equal(r.windows[7].rows.length, 35);
  assert.equal((md.match(/Showing 30 of 35/g) || []).length, 3);
  assert.match(md, /&lt;venue&gt;&#124;x/);
  assert.match(placementMarkdown(placementReport('', { now })), /No logged clicks/);
});
test('CLI writes parseable JSON and Markdown and fails for missing logs or clobbering input', () => {
  const dir = mkdtempSync(join(tmpdir(), 'placement-report-'));
  try {
    const input = fileURLToPath(new URL('./fixtures/clicks.jsonl', import.meta.url));
    const json = join(dir, 'report.json'), md = join(dir, 'report.md');
    const r = run(['--input', input, '--json', json, '--markdown', md, '--now', '2026-10-12T12:00:00Z']);
    assert.deepEqual(JSON.parse(readFileSync(json, 'utf8')), r);
    assert.match(readFileSync(md, 'utf8'), /Placements with zero clicks/);
    assert.throws(() => run(['--input', join(dir, 'missing'), '--json', join(dir, 'never.json'), '--markdown', md]), /ENOENT/);
    assert.equal(existsSync(join(dir, 'never.json')), false);
    assert.throws(() => run(['--input', input, '--json', input, '--markdown', md]), /must differ/);
    assert.throws(() => run(['--bad', 'x']), /Usage/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
