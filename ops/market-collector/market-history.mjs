// Liquidation history for the market collector (2026-10-11). Once an hour the collector appends one snapshot of the
// live document to a JSON-lines file next to the feed (MARKET_HISTORY_FILE, default <feed dir>/market-history.jsonl):
// the 1h/4h/24h totals, long/short split, order count, largest order, top five symbols and a BTC/ETH funding summary.
// The file keeps 90 days, is deduplicated per UTC hour and is only ever appended or rewritten through a temp file, so
// a crash mid-write never corrupts earlier rows. `summarizeHistory` turns the rows into the compact `history` block of
// market-events.json (last 24 hourly points, last 30 daily totals, records) that /liquidations renders and cites.
// Daily totals are the sum of the hourly 1h windows of that UTC day, so a day is a true calendar-day figure and the
// current day is explicitly partial. Everything here is pure except the two file helpers.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { atomicWriteText } from "./resilience.mjs";

export const HISTORY_RETENTION_DAYS = 90;
export const HISTORY_HOURLY_POINTS = 24;
export const HISTORY_DAILY_POINTS = 30;
const DAY_MS = 24 * 3600e3;

const fnum = (v) => { const n = typeof v === "number" ? v : Number.parseFloat(v); return Number.isFinite(n) ? n : null; };
const usd = (v) => Math.max(0, Math.round(fnum(v) ?? 0));
export const hourKey = (t) => new Date(t).toISOString().slice(0, 13);
export const dayKey = (t) => new Date(t).toISOString().slice(0, 10);

export function defaultHistoryFile(outFile) {
  return path.join(path.dirname(outFile), "market-history.jsonl");
}

function windowTotals(w) {
  if (!w || typeof w !== "object") return null;
  const longUsd = usd(w.longUsd), shortUsd = usd(w.shortUsd);
  return { totalUsd: fnum(w.totalUsd) != null ? usd(w.totalUsd) : longUsd + shortUsd, longUsd, shortUsd, orders: usd(w.orders) };
}

// Average of the venues that answered for one base symbol (null when the funding block or the symbol is missing).
function fundingAverage(doc, symbol) {
  const row = (doc?.funding?.rows || []).find((r) => r?.symbol === symbol);
  const rates = [row?.binanceRate, row?.okxRate].map(fnum).filter((r) => r != null);
  if (!rates.length) return null;
  return Number((rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(8));
}

// One history row from the live document, or null when the document has no 24h liquidation window.
export function historySnapshot(doc, now = Date.now()) {
  const l = doc?.liquidations;
  const h24 = windowTotals(l?.h24);
  if (!h24) return null;
  const largest = l.h24.largest && fnum(l.h24.largest.usd) > 0
    ? { symbol: String(l.h24.largest.symbol), side: l.h24.largest.side === "short" ? "short" : "long", usd: usd(l.h24.largest.usd), at: l.h24.largest.at || null }
    : null;
  const topSymbols = (Array.isArray(l.h24.topSymbols) ? l.h24.topSymbols : [])
    .filter((s) => s && s.symbol && fnum(s.usd) > 0).slice(0, 5).map((s) => ({ symbol: String(s.symbol), usd: usd(s.usd) }));
  return {
    t: new Date(now).toISOString(),
    h1: windowTotals(l.h1) || { totalUsd: 0, longUsd: 0, shortUsd: 0, orders: 0 },
    h4: windowTotals(l.h4) || { totalUsd: 0, longUsd: 0, shortUsd: 0, orders: 0 },
    h24,
    longUsd: h24.longUsd, shortUsd: h24.shortUsd, orders: h24.orders,
    largest, topSymbols,
    funding: { btc: fundingAverage(doc, "BTC"), eth: fundingAverage(doc, "ETH") },
  };
}

// Parses a JSON-lines buffer; malformed lines (a torn write, a manual edit) are skipped, never fatal.
export function parseHistoryLines(text) {
  const rows = [];
  for (const line of String(text || "").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const row = JSON.parse(trimmed);
      if (row && typeof row === "object" && Number.isFinite(Date.parse(row.t)) && row.h24) rows.push(row);
    } catch { /* skip torn line */ }
  }
  return rows;
}

export function readHistoryFile(file) {
  if (!existsSync(file)) return [];
  return parseHistoryLines(readFileSync(file, "utf8"));
}

// Keeps the newest row per UTC hour, sorted by time, within the retention window.
export function normalizeHistoryRows(rows, { now = Date.now(), retentionDays = HISTORY_RETENTION_DAYS } = {}) {
  const cutoff = now - retentionDays * DAY_MS;
  const byHour = new Map();
  for (const row of rows) {
    const t = Date.parse(row.t);
    if (!Number.isFinite(t) || t < cutoff || t > now + 3600e3) continue;
    const key = hourKey(t);
    const prev = byHour.get(key);
    if (!prev || Date.parse(prev.t) <= t) byHour.set(key, row);
  }
  return [...byHour.values()].sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
}

// Adds one row per UTC hour and atomically replaces the retained JSON-lines file.
// PIPE_BUF guarantees apply to pipes, not append writes to a regular file.
export function appendHourlySnapshot(file, row, { now = Date.now(), retentionDays = HISTORY_RETENTION_DAYS } = {}) {
  const existing = readHistoryFile(file);
  const kept = normalizeHistoryRows(existing, { now, retentionDays });
  const key = hourKey(row.t);
  if (kept.some((r) => hourKey(r.t) === key)) return { appended: false, rows: kept };
  const rows = [...kept, row];
  atomicWriteText(file, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  return { appended: true, rows };
}

const sumDay = (rows) => rows.reduce((acc, r) => {
  acc.totalUsd += usd(r.h1?.totalUsd); acc.longUsd += usd(r.h1?.longUsd); acc.shortUsd += usd(r.h1?.shortUsd); acc.orders += usd(r.h1?.orders);
  return acc;
}, { totalUsd: 0, longUsd: 0, shortUsd: 0, orders: 0 });

// Compact `history` block for market-events.json. Daily totals sum the hourly 1h windows of each UTC day (the day
// whose hours are still being collected is `partial: true`). Records: the largest day in the 30-day window and
// today's rank among the days of the current UTC month (1 = largest). avgDailyUsd averages the complete days only.
export function summarizeHistory(rows, { now = Date.now(), hourlyPoints = HISTORY_HOURLY_POINTS, dailyPoints = HISTORY_DAILY_POINTS } = {}) {
  const sorted = normalizeHistoryRows(rows, { now, retentionDays: HISTORY_RETENTION_DAYS });
  if (!sorted.length) return null;
  const today = dayKey(now);
  const hourly = sorted.slice(-hourlyPoints).map((r) => ({
    t: r.t, totalUsd: usd(r.h1?.totalUsd), longUsd: usd(r.h1?.longUsd), shortUsd: usd(r.h1?.shortUsd), h24Usd: usd(r.h24?.totalUsd),
  }));
  const byDay = new Map();
  for (const r of sorted) { const d = dayKey(r.t); if (!byDay.has(d)) byDay.set(d, []); byDay.get(d).push(r); }
  const daily = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-dailyPoints)
    .map(([day, dayRows]) => ({ day, ...sumDay(dayRows), hours: dayRows.length, partial: day === today }));
  const complete = daily.filter((d) => !d.partial);
  const avgDailyUsd = complete.length ? Math.round(complete.reduce((a, d) => a + d.totalUsd, 0) / complete.length) : null;
  const largest = daily.reduce((m, d) => (d.totalUsd > (m?.totalUsd ?? -1) ? d : m), null);
  const month = today.slice(0, 7);
  const monthDays = daily.filter((d) => d.day.startsWith(month)).sort((a, b) => b.totalUsd - a.totalUsd);
  const todayIndex = monthDays.findIndex((d) => d.day === today);
  return {
    since: sorted[0].t,
    updatedAt: sorted[sorted.length - 1].t,
    days: byDay.size,
    hourly,
    daily,
    avgDailyUsd,
    records: {
      largestDay: largest ? { day: largest.day, totalUsd: largest.totalUsd, partial: largest.partial } : null,
      todayRankInMonth: todayIndex >= 0 ? todayIndex + 1 : null,
      daysInMonth: monthDays.length,
    },
  };
}
