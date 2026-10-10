// Pure helpers for the /liquidations "Last 30 days" section: the stacked-bar chart geometry (rendered as inline SVG by
// src/components/data/LiquidationHistory.jsx, no chart library) and the two facts written in words. Everything is
// deterministic so the server and the browser produce identical markup; nothing is estimated when data is missing.
import { formatUsdCompact } from "./market-data-pages.js";

export const CHART_WIDTH = 640;
export const CHART_HEIGHT = 220;
// Phone variant: same 30 bars in a narrower viewBox so axis labels stay legible when the SVG scales to ~340 px.
export const CHART_COMPACT_WIDTH = 360;
export const CHART_COMPACT_HEIGHT = 200;
const padFor = (width) => ({ top: 10, right: 8, bottom: 26, left: width < 480 ? 46 : 56 });
const NEAR_AVERAGE_PCT = 5;

const finite = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);
const r2 = (v) => Math.round(v * 100) / 100;

// Smallest "nice" ceiling (1, 2, 2.5, 5 × 10^n) at or above `max`, so the y axis ends on a round number.
export function niceCeiling(max) {
  if (!(max > 0)) return 1;
  const exp = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * exp >= max) return m * exp;
  return 10 * exp;
}

// Bars and axes for up to 30 daily totals inside a CHART_WIDTH × CHART_HEIGHT viewBox. Longs are drawn from the
// baseline, shorts stacked on top. Every coordinate is finite and inside the viewBox; the caller never sees NaN.
export function historyChartModel(daily, { width = CHART_WIDTH, height = CHART_HEIGHT, days = 30 } = {}) {
  const rows = (Array.isArray(daily) ? daily : []).slice(-days);
  const PAD = padFor(width);
  const plotW = width - PAD.left - PAD.right, plotH = height - PAD.top - PAD.bottom;
  const baseline = PAD.top + plotH;
  const max = niceCeiling(Math.max(0, ...rows.map((d) => finite(d.totalUsd))));
  const slot = plotW / Math.max(rows.length, 1);
  const barW = r2(Math.max(2, Math.min(28, slot * 0.68)));
  const scale = (usd) => (plotH * Math.min(1, Math.max(0, finite(usd) / max)));
  const bars = rows.map((d, i) => {
    const longH = r2(scale(d.longUsd)), shortH = r2(scale(d.shortUsd));
    const x = r2(PAD.left + i * slot + (slot - barW) / 2);
    return {
      day: d.day, label: String(Number(d.day.slice(8, 10)) || d.day.slice(8, 10)), partial: d.partial === true,
      totalUsd: finite(d.totalUsd), longUsd: finite(d.longUsd), shortUsd: finite(d.shortUsd),
      x, width: barW,
      long: { y: r2(baseline - longH), height: longH },
      short: { y: r2(baseline - longH - shortH), height: shortH },
    };
  });
  const ticks = [0, 0.5, 1].map((f) => ({ value: max * f, y: r2(baseline - plotH * f), label: f === 0 ? "0" : formatUsdCompact(max * f) }));
  // x labels: first, last and every fifth bar in between (never two labels closer than two slots)
  const step = rows.length > 12 ? 5 : rows.length > 6 ? 2 : 1;
  const xLabels = bars.filter((_, i) => i === 0 || i === bars.length - 1 || (i % step === 0 && i < bars.length - 2))
    .map((b) => ({ x: r2(b.x + b.width / 2), y: height - 8, label: b.label }));
  return { width, height, plot: { x: PAD.left, y: PAD.top, width: plotW, height: plotH, baseline }, max, bars, ticks, xLabels };
}

// Facts in words. `now24hUsd` is the live rolling 24h total; the average covers complete days only. Direction is
// "near" within ±5 % so the sentence never claims a difference that is noise.
export function historyFacts(history, now24hUsd) {
  if (!history || history.collecting) return null;
  const avg = history.avgDailyUsd;
  const today = history.daily.find((d) => d.partial) || null;
  const current = Number.isFinite(now24hUsd) ? now24hUsd : today?.totalUsd ?? null;
  let vsAverage = null;
  if (avg > 0 && current != null) {
    const pct = Math.round(Math.abs(current / avg - 1) * 100);
    vsAverage = { direction: pct <= NEAR_AVERAGE_PCT ? "near" : current > avg ? "above" : "below", pct, now: formatUsdCompact(current), avg: formatUsdCompact(avg), nowUsd: current, avgUsd: avg };
  }
  const rank = history.records.todayRankInMonth, daysInMonth = history.records.daysInMonth;
  return {
    vsAverage,
    rank: rank && daysInMonth >= 2 ? { rank, days: daysInMonth } : null,
    largestDay: history.records.largestDay,
    today,
    days: history.days,
  };
}
