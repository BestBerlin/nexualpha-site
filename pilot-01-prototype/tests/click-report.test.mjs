import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { clickReport, clickReportData, clickSourceGroup, EXCLUDED_CLASSES } from '../scripts/click-report.mjs';

const run = promisify(execFile);
const now = new Date('2026-10-23T12:00:00Z');
const hash = 'a'.repeat(64);
const event = (overrides = {}) => ({ t: '2026-10-22T12:00:00Z', partner: 'okx', src: 'tg-digest-zh', cls: 'human', ipHash: hash, ...overrides });
async function fixture(t, rows) {
  const dir = await mkdtemp(path.join(tmpdir(), 'click-report-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'events.jsonl');
  await writeFile(file, rows.map(row => typeof row === 'string' ? row : JSON.stringify(row)).join('\n'));
  return file;
}

function assertTotalsConserved(report) {
  for (const rows of [report.byDay, report.byPartner, report.bySourceGroup, report.daily]) {
    for (const metric of ['events', 'humanEvents', 'humanUnique', 'humanRepeatEvents']) {
      assert.equal(rows.reduce((sum, row) => sum + row[metric], 0), report.totals[metric]);
    }
    for (const cls of EXCLUDED_CLASSES) {
      assert.equal(rows.reduce((sum, row) => sum + row.excluded[cls], 0), report.totals.excluded[cls]);
    }
  }
  assert.equal(report.totals.events, report.totals.humanEvents + Object.values(report.totals.excluded).reduce((a, b) => a + b, 0));
  assert.equal(report.totals.humanEvents, report.totals.humanUnique + report.totals.humanRepeatEvents);
}

test('report excludes legacy, malformed hashes and every write-time excluded class', async t => {
  const file = await fixture(t, [
    event(), ...EXCLUDED_CLASSES.filter(cls => cls !== 'legacy-unverified').map(cls => event({ cls })),
    ...['human', 'bot', 'internal', undefined].map(cls => event({ cls, ipHash: undefined })),
    event({ ipHash: 'a'.repeat(63) }), event({ ipHash: 'z'.repeat(64) }), event({ ipHash: null }),
    event({ cls: 'unrecognised' }), event({ cls: undefined }), event({ partner: undefined }),
    event({ cls: 'prefetch' }),
  ]);
  const report = await clickReportData(file, now);
  assert.equal(report.totals.events, 17);
  assert.equal(report.totals.humanUnique, 1);
  assert.equal(report.totals.humanEvents, 1);
  assert.deepEqual(report.totals.excluded, { internal: 1, bot: 2, burst: 1, duplicate: 1, unknown: 4, 'legacy-unverified': 7 });
  assertTotalsConserved(report);
});

test('daily human uniqueness spans routes and sources; earliest timestamp wins even out of order', async t => {
  const rows = [
    event({ t: '2026-10-22T16:00:00Z', src: 'home-v7-hero', kind: 'site' }),
    event({ t: '2026-10-22T13:00:00Z', src: 'news-sponsored', kind: 'go' }),
    event({ t: '2026-10-22T12:00:00Z', src: 'tg-digest-en' }),
    event({ t: '2026-10-22T17:00:00Z', cls: 'duplicate', src: 'venue-mobile-sticky' }),
    event({ t: '2026-10-23T00:00:00Z', src: 'home-v7-hero' }),
    event({ partner: 'binance', src: 'article' }),
    event({ ipHash: 'b'.repeat(64), src: 'venue-mobile-sticky' }),
    event({ t: '2026-10-22T12:30:00Z', ipHash: hash.toUpperCase(), src: 'footer' }),
  ];
  const report = await clickReportData(await fixture(t, rows), now);
  assert.equal(report.totals.humanUnique, 4);
  assert.equal(report.totals.humanEvents, 7);
  assert.equal(report.totals.humanRepeatEvents, 3);
  assert.equal(report.totals.excluded.duplicate, 1, 'write-time duplicate count is unchanged by daily dedup');
  assert.deepEqual(Object.fromEntries(report.bySourceGroup.map(row => [row.sourceGroup, row.humanUnique])), { article: 1, home: 1, other: 0, telegram: 1, venue: 1 });
  assert.equal(report.byDay.find(row => row.day === '2026-10-22').humanUnique, 3);
  assertTotalsConserved(report);
  assert.equal(JSON.stringify(report).includes(hash), false, 'reports never return IP hashes');
  const reversed = await clickReportData(await fixture(t, [...rows].reverse()), now);
  assert.deepEqual(reversed, report, 'attribution and grouping do not depend on file order');
});

test('equal timestamp attribution is deterministic', async t => {
  const rows = [event({ src: 'home-v7-hero' }), event({ src: 'tg-digest-en' }), event({ src: 'article' })];
  const first = await clickReportData(await fixture(t, rows), now);
  const second = await clickReportData(await fixture(t, [...rows].reverse()), now);
  assert.deepEqual(first, second);
  assert.equal(first.bySourceGroup.find(row => row.sourceGroup === 'article').humanUnique, 1);
  assertTotalsConserved(first);
});

test('rolling seven-day bounds are inclusive and grouping uses UTC rather than input timezone', async t => {
  const file = await fixture(t, [
    event({ t: '2026-10-16T11:59:59.999Z' }), event({ t: '2026-10-16T12:00:00Z' }),
    event({ t: '2026-10-23T12:00:00Z' }), event({ t: '2026-10-23T12:00:00.001Z' }),
    event({ t: '2026-10-23T00:30:00+08:00', ipHash: 'b'.repeat(64) }),
  ]);
  const report = await clickReportData(file, now);
  assert.equal(report.window.start, '2026-10-16T12:00:00.000Z');
  assert.equal(report.window.end, '2026-10-23T12:00:00.000Z');
  assert.equal(report.outsideWindowRows, 2);
  assert.equal(report.totals.humanUnique, 3);
  assert.deepEqual(report.byDay.map(row => row.day), ['2026-10-16', '2026-10-22', '2026-10-23']);
});

test('malformed JSON, missing timestamps and blank lines do not become click events', async t => {
  const file = await fixture(t, ['invalid', 'null', '[]', '{}', event({ t: 'yesterday' }), event({ t: 0 }), '', '   ', event()]);
  const report = await clickReportData(file, now);
  assert.equal(report.invalidRows, 6);
  assert.equal(report.totals.events, 1);
  assertTotalsConserved(report);
  assert.match(await clickReport(file, now), /invalid rows skipped: 6/);
  await assert.rejects(clickReportData(file, new Date('invalid')), /Invalid report time/);
});

test('source grouping covers deployed placements without treating other prefixes as known groups', () => {
  const cases = {
    'tg-digest-zh': 'telegram', 'tg-alert-channel-en': 'telegram',
    article: 'article', 'article-inline': 'article', 'news-sponsored': 'article', 'news-offer-inline-funding-rates': 'article',
    home: 'home', 'home--home-v7-hero': 'home', 'home-v7-dock': 'home',
    'venue-mobile-sticky': 'venue', 'fee-summary': 'venue', 'registration-card-primary': 'venue', 'profile-main': 'venue',
    footer: 'other', 'directory-card': 'other', 'tokenized-stocks-ticker-aapl': 'other', 'tgame': 'other',
    'homebrew': 'other', 'articlefoo': 'other', '': 'other',
  };
  for (const [src, expected] of Object.entries(cases)) assert.equal(clickSourceGroup(src), expected, src);
  assert.equal(clickSourceGroup(null), 'other');
});

test('text report exposes daily source attribution and excluded classes; empty input is zero', async t => {
  const file = await fixture(t, [event(), event({ cls: 'internal' })]);
  const text = await clickReport(file, now);
  assert.match(text, /human unique: 1; human events: 1/);
  assert.match(text, /By day \/ partner \/ src group/);
  assert.match(text, /2026-10-22\tokx\ttelegram\t2\t1\t1\t0\t1\t0\t0\t0\t0\t0/);
  assert.match(text, /internal\tbot\tburst\tduplicate\tunknown\tlegacy-unverified/);
  assert.match(text, /partial boundary days/);
  const empty = await clickReportData(await fixture(t, []), now);
  assert.equal(empty.totals.events, 0);
  assert.deepEqual(empty.byDay, []);
  assert.match(await clickReport(await fixture(t, []), now), /Total: 0; human unique: 0/);
});

test('CLI --json emits only the structured contract in either argument order and errors clearly', async t => {
  const file = await fixture(t, [event({ t: new Date().toISOString() })]);
  const script = fileURLToPath(new URL('../scripts/click-report.mjs', import.meta.url));
  for (const args of [[file, '--json'], ['--json', file]]) {
    const { stdout, stderr } = await run(process.execPath, [script, ...args]);
    const report = JSON.parse(stdout);
    assert.equal(stderr, '');
    assert.equal(report.schemaVersion, 1);
    assert.equal(report.totals.humanUnique, 1);
    assert.equal(report.byDay[0].humanUnique, 1);
  }
  await assert.rejects(run(process.execPath, [script, '--bad']), error => error.code === 1 && /Usage:/.test(error.stderr));
  await assert.rejects(run(process.execPath, [script, file, '--json', '--json']), error => error.code === 1 && /Usage:/.test(error.stderr));
  await assert.rejects(run(process.execPath, [script, `${file}.missing`, '--json']), error => error.code === 1 && /ENOENT/.test(error.stderr));
});


test('campaign and site rows for the same venue share one daily partner identity', async t => {
  const report = await clickReportData(await fixture(t, [event({ partner: 'okx-page', venue: 'okx', campaign: 'page' }), event()]), now);
  assert.equal(report.totals.humanUnique, 1);
  assert.equal(report.totals.humanRepeatEvents, 1);
  assert.deepEqual(report.byPartner.map(row => row.partner), ['okx']);
  assertTotalsConserved(report);
});
