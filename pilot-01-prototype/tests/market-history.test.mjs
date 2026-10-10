// Collector liquidation history (ops/market-collector/market-history.mjs, 2026-10-11): hourly JSON-lines snapshots,
// 90-day retention, per-hour dedupe, atomic writes and the compact `history` summary written into market-events.json.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  HISTORY_RETENTION_DAYS, appendHourlySnapshot, dayKey, defaultHistoryFile, historySnapshot, hourKey, normalizeHistoryRows, parseHistoryLines,
  readHistoryFile, summarizeHistory,
} from "../../ops/market-collector/market-history.mjs";

const fixture = (name) => readFileSync(new URL(`./fixtures/market-data/${name}`, import.meta.url), "utf8");
const sampleFeed = JSON.parse(fixture("market-events.sample.json"));
const sampleRows = parseHistoryLines(fixture("market-history.sample.jsonl"));
const NOW = Date.parse(sampleFeed.generatedAt); // 2026-10-10T14:58:12.739Z

test("a snapshot carries the three window totals, the 24h split, largest order, top five symbols and the BTC/ETH funding average", () => {
  const row = historySnapshot(sampleFeed, NOW);
  assert.equal(row.t, "2026-10-10T14:58:12.739Z");
  assert.deepEqual(row.h24, { totalUsd: 6114135, longUsd: 1233574, shortUsd: 4880561, orders: 683 });
  assert.equal(row.h1.totalUsd, 3344668);
  assert.equal(row.h4.totalUsd, 3354553);
  assert.equal(row.longUsd, 1233574);
  assert.equal(row.shortUsd, 4880561);
  assert.equal(row.orders, 683);
  assert.deepEqual(row.largest, { symbol: "OKX:SOLUSDT", side: "short", usd: 1452978, at: "2026-10-10T14:29:53.025Z" });
  assert.equal(row.topSymbols.length, 5);
  assert.deepEqual(row.topSymbols[0], { symbol: "OKX:SOLUSDT", usd: 2680936 });
  const btc = sampleFeed.funding.rows.find((r) => r.symbol === "BTC");
  assert.equal(row.funding.btc, Number(((btc.binanceRate + btc.okxRate) / 2).toFixed(8)));
  assert.equal(historySnapshot({ generatedAt: sampleFeed.generatedAt, funding: sampleFeed.funding }, NOW), null, "no 24h window → no row, nothing invented");
  assert.equal(historySnapshot({ liquidations: { h24: { longUsd: 10, shortUsd: 5 } } }, NOW).h24.totalUsd, 15, "missing totalUsd is the sum of the sides");
  assert.equal(historySnapshot({ liquidations: { h24: { longUsd: 10, shortUsd: 5 } } }, NOW).funding.btc, null, "no funding block → null, never 0");
  assert.equal(JSON.stringify(row).length < 1200, true, "one row stays well under the atomic-append size");
});

test("JSON-lines parsing skips torn or foreign lines and the file helpers round-trip", async () => {
  const rows = parseHistoryLines(`${JSON.stringify(sampleRows[0])}\n{"t":"2026-10-07T16:05:00.000Z","h24":{"tot\nnot json\n\n${JSON.stringify(sampleRows[1])}\n{"t":"bad","h24":{}}\n`);
  assert.equal(rows.length, 2);
  assert.equal(sampleRows.length, 72, "fixture: three days of hourly rows");
  assert.equal(hourKey(sampleRows[0].t), "2026-10-07T15");
  assert.equal(dayKey(sampleRows[0].t), "2026-10-07");
  assert.equal(defaultHistoryFile("/var/lib/nexualpha-market/market-events.json"), "/var/lib/nexualpha-market/market-history.jsonl");
  assert.deepEqual(readHistoryFile("/nonexistent/market-history.jsonl"), []);
});

test("appendHourlySnapshot dedupes per UTC hour, prunes 90 days through a temp file and otherwise appends one line", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "market-history-"));
  try {
    const file = path.join(dir, "nested", "market-history.jsonl");
    const row = (t) => historySnapshot(sampleFeed, t);
    let r = appendHourlySnapshot(file, row(NOW), { now: NOW });
    assert.equal(r.appended, true);
    assert.equal(readHistoryFile(file).length, 1, "created with the directory");
    r = appendHourlySnapshot(file, row(NOW + 60e3), { now: NOW + 60e3 });
    assert.equal(r.appended, false, "same hour → no second row");
    assert.equal(readHistoryFile(file).length, 1);
    r = appendHourlySnapshot(file, row(NOW + 3600e3), { now: NOW + 3600e3 });
    assert.equal(r.appended, true);
    assert.equal(r.rows.length, 2);
    assert.equal(readFileSync(file, "utf8").split("\n").filter(Boolean).length, 2, "plain append, no rewrite");
    // an ancient row gets pruned on the next append and the file is rewritten whole
    const ancient = { ...row(NOW - (HISTORY_RETENTION_DAYS + 1) * 86400e3) };
    writeFileSync(file, `${JSON.stringify(ancient)}\n${readFileSync(file, "utf8")}`);
    assert.equal(readHistoryFile(file).length, 3);
    r = appendHourlySnapshot(file, row(NOW + 2 * 3600e3), { now: NOW + 2 * 3600e3 });
    assert.equal(r.appended, true);
    assert.equal(r.rows.length, 3, "ancient row dropped, three recent rows kept");
    assert.deepEqual(readHistoryFile(file).map((x) => x.t), r.rows.map((x) => x.t));
    assert.ok(!readdirSync(path.dirname(file)).some((n) => n.endsWith(".tmp")), "temp file renamed away");
    assert.ok(existsSync(file));
    // normalizeHistoryRows keeps the newest row per hour and sorts
    const dup = normalizeHistoryRows([row(NOW + 60e3), row(NOW), row(NOW - 3600e3)], { now: NOW + 3600e3 });
    assert.deepEqual(dup.map((x) => x.t), [new Date(NOW - 3600e3).toISOString(), new Date(NOW + 60e3).toISOString()]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("summarizeHistory: 24 hourly points, daily totals summed per UTC day with the current day partial, records and average", () => {
  const h = summarizeHistory(sampleRows, { now: NOW });
  assert.equal(h.since, sampleRows[0].t);
  assert.equal(h.updatedAt, sampleRows[sampleRows.length - 1].t);
  assert.equal(h.days, 4, "2026-10-07 (partial start) … 2026-10-10");
  assert.equal(h.hourly.length, 24);
  assert.deepEqual(Object.keys(h.hourly[0]).sort(), ["h24Usd", "longUsd", "shortUsd", "t", "totalUsd"]);
  assert.equal(h.hourly[23].t, h.updatedAt);
  assert.deepEqual(h.daily.map((d) => d.day), ["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"]);
  const oct9 = h.daily[2];
  const oct9Rows = sampleRows.filter((r) => r.t.startsWith("2026-10-09"));
  assert.equal(oct9.hours, 24);
  assert.equal(oct9.totalUsd, oct9Rows.reduce((a, r) => a + r.h1.totalUsd, 0), "daily total = sum of the day's 1h windows");
  assert.equal(oct9.longUsd + oct9.shortUsd, oct9.totalUsd);
  assert.equal(oct9.partial, false);
  const today = h.daily[3];
  assert.equal(today.partial, true);
  assert.equal(today.hours, 15, "00:05 … 14:05 UTC");
  const complete = h.daily.filter((d) => !d.partial);
  assert.equal(h.avgDailyUsd, Math.round(complete.reduce((a, d) => a + d.totalUsd, 0) / complete.length), "average over complete days only");
  const largest = h.daily.reduce((m, d) => (d.totalUsd > m.totalUsd ? d : m));
  assert.deepEqual(h.records.largestDay, { day: largest.day, totalUsd: largest.totalUsd, partial: largest.partial });
  assert.equal(h.records.daysInMonth, 4, "October days present in the window");
  const rank = [...h.daily].sort((a, b) => b.totalUsd - a.totalUsd).findIndex((d) => d.day === "2026-10-10") + 1;
  assert.equal(h.records.todayRankInMonth, rank);
  assert.equal(summarizeHistory([], { now: NOW }), null);
  // a 40-day series keeps only the last 30 daily points and 24 hourly points
  const long = [];
  for (let t = NOW - 40 * 86400e3; t <= NOW; t += 3600e3) long.push(historySnapshot(sampleFeed, t));
  const s = summarizeHistory(long, { now: NOW });
  assert.equal(s.daily.length, 30);
  assert.equal(s.hourly.length, 24);
  assert.equal(s.days, 41);
  assert.equal(JSON.stringify(s).length < 12_000, true, "compact enough to ride inside market-events.json");
});

test("the collector entrypoint wires the history file and summary without blocking the live feed", () => {
  const src = readFileSync(new URL("../../ops/market-collector/market-collector.mjs", import.meta.url), "utf8");
  assert.match(src, /MARKET_HISTORY_FILE/);
  assert.match(src, /defaultHistoryFile\(OUT_FILE\)/);
  assert.match(src, /appendHourlySnapshot\(HISTORY_FILE, snapshot\)/);
  assert.match(src, /doc\.history = history/);
  assert.match(src, /catch \(error\) \{ log\(`history failed/);
});
