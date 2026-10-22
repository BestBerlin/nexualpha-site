import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { relativeWhaleTime, startBoardMotion, tweenValue } from '../src/components/v7/home7-board-motion.js';

test('LIVE labels cover every supported locale and only the two feed headings', () => {
  const source = readFileSync('src/components/v7/home7-board-motion.jsx', 'utf8');
  for (const locale of ['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','it','ja','ko','ru','tr','id','vi','ar','ur','uk']) {
    assert.match(source, new RegExp(`(?:"${locale}"|\\b${locale}):`));
    assert.ok(relativeWhaleTime('2026-10-19T00:00:00Z', Date.parse('2026-10-19T00:03:00Z'), locale));
  }
  assert.equal(relativeWhaleTime('invalid', Date.now(), 'en'), null);
  assert.match(source, /requestIdleCallback/);
});

test('whale motion detects newly inserted IDs, retains old rows and clears lifecycle resources', () => {
  let mutation, interval, cleared = false, disconnected = false;
  const original = Object.fromEntries(['window','document','MutationObserver','setInterval','clearInterval'].map(k => [k, globalThis[k]]));
  const row = id => ({ dataset: { mvKey: id }, classList: { add(name) { this.name = name; }, remove() {} } });
  const first = row('old'), second = row('new');
  let rows = [first];
  globalThis.window = { matchMedia: () => ({ matches: false }) };
  globalThis.document = { visibilityState: 'visible' };
  globalThis.MutationObserver = class { constructor(fn) { mutation = fn; } observe() {} disconnect() { disconnected = true; } };
  globalThis.setInterval = (fn, ms) => { interval = [fn, ms]; return 1; };
  globalThis.clearInterval = () => { cleared = true; };
  try {
    const time = { dateTime: '2026-10-19T00:00:00Z' };
    const root = { querySelectorAll: q => q.startsWith('time') ? [time] : rows, querySelector: () => ({}) };
    const stop = startBoardMotion(root, 'en');
    assert.equal(first.classList.name, undefined);
    rows = [first, second]; mutation();
    assert.equal(first.classList.name, undefined);
    assert.equal(second.classList.name, 'h7-wh-new');
    assert.equal(interval[1], 30000);
    assert.ok(time.textContent);
    stop(); assert.ok(cleared && disconnected);
  } finally { Object.assign(globalThis, original); }
});

test('value tween ends exactly at the target and reduced motion schedules no frames', () => {
  const original = { window: globalThis.window, requestAnimationFrame: globalThis.requestAnimationFrame, cancelAnimationFrame: globalThis.cancelAnimationFrame, document: globalThis.document };
  let frame, count = 0;
  globalThis.document = { visibilityState: 'visible' };
  globalThis.window = { matchMedia: () => ({ matches: false }) };
  globalThis.requestAnimationFrame = fn => { frame = fn; count++; return count; };
  globalThis.cancelAnimationFrame = () => {};
  try {
    const node = {}; const stop = tweenValue(node, 1, 3, n => n.toFixed(2));
    frame(performance.now() + 500); assert.equal(node.textContent, '3.00'); stop();
    globalThis.window.matchMedia = () => ({ matches: true });
    tweenValue(node, 3, 4, String); assert.equal(count, 1);
  } finally { Object.assign(globalThis, original); }
});

test('whale times switch to hours and days after one hour, in every locale', async () => {
  const { whaleAgoLabel } = await import('../src/data/whales-home.js');
  const at = '2026-10-19T00:00:00Z', t = (min) => Date.parse(at) + min * 60000;
  assert.match(relativeWhaleTime(at, t(394), 'zh-Hans'), /6\s*小时/);
  assert.doesNotMatch(relativeWhaleTime(at, t(394), 'zh-Hans'), /分钟/);
  assert.match(whaleAgoLabel(at, t(59), 'en'), /59 min/);
  assert.match(whaleAgoLabel(at, t(3 * 1440 + 5), 'en'), /3 days/);
  for (const locale of ['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','it','ja','ko','ru','tr','id','vi','ar','ur','uk']) {
    assert.notEqual(whaleAgoLabel(at, t(394), locale), whaleAgoLabel(at, t(30), locale), locale);
  }
});

test('whale rows carry size tier and direction; at most three displayed $5M+ buy/sell rows pulse', async () => {
  const { whalesBodyHtml, whaleTier } = await import('../src/data/whales-home.js');
  const { pickPulseRows } = await import('../src/components/v7/home7-board-motion.js');
  assert.deepEqual([whaleTier(4_999_999), whaleTier(5e6), whaleTier(2e7)], [0, 1, 2]);
  const signals = [3e6, 6e6, 25e6].map((totalUsd, i) => ({ id: `s${i}`, coin: 'SOL', side: 'long', signalType: 'accumulation', totalUsd, time: '2026-10-19T00:00:00Z' }));
  const html = whalesBodyHtml({ status: 'ok', updatedAt: '2026-10-19T00:00:00Z', signals }, 'en');
  assert.match(html, /data-mv-key="s2" data-dir="in" data-tier="2" data-usd="25000000"/);
  assert.match(html, /data-mv-key="s0" data-dir="in" data-tier="0"/);
  const row = (tier, dir, usd, shown = true) => ({ dataset: { tier: String(tier), dir, usd: String(usd) }, offsetParent: shown ? {} : null });
  const rows = [row(1, 'in', 6e6), row(2, 'out', 30e6), row(0, 'in', 2e6), row(1, 'flat', 9e6), row(1, 'in', 7e6), row(1, 'out', 8e6), row(2, 'in', 50e6, false)];
  pickPulseRows(rows);
  assert.deepEqual(rows.map(r => r.dataset.pulse), [undefined, '1', undefined, undefined, '3', '2', undefined]);
});
