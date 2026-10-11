#!/usr/bin/env node
// Data freshness log (scorecard D2, 2026-10-11). Every run records how old the PUBLIC market feed is, as visitors see it:
// funding rows + age, market-events age. The 7-day report answers "≥ 20 funding symbols with < 10 min staleness".
//   node data-freshness.mjs            append one sample
//   node data-freshness.mjs --report   pass rate over the last 7 days
import { appendFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const FILE = process.env.DATA_FRESHNESS_FILE || "/var/lib/crypto-telegram-ops/data-freshness.jsonl";
const FEED = process.env.DATA_FRESHNESS_FEED || "https://nexualpha.com/intel/market-events.json";
export const MAX_AGE_MIN = 10;
export const MIN_ROWS = 20;

const ageMin = (iso, now) => (Number.isFinite(Date.parse(iso)) ? Math.round(((now - Date.parse(iso)) / 60000) * 10) / 10 : null);

export function sampleFrom(feed, now = Date.now()) {
  const rows = Array.isArray(feed?.funding?.rows) ? feed.funding.rows.filter((r) => r?.symbol && (Number.isFinite(r.binanceRate) || Number.isFinite(r.okxRate))) : [];
  const fundingAgeMin = ageMin(feed?.funding?.generatedAt, now);
  const eventsAgeMin = ageMin(feed?.generatedAt, now);
  return { t: new Date(now).toISOString(), fundingRows: rows.length, fundingAgeMin, eventsAgeMin, ok: rows.length >= MIN_ROWS && fundingAgeMin !== null && fundingAgeMin < MAX_AGE_MIN };
}

export function report(samples, now = Date.now(), days = 7) {
  const since = now - days * 86400e3;
  const window = samples.filter((s) => Date.parse(s.t) >= since);
  const ok = window.filter((s) => s.ok).length;
  const first = window[0]?.t || null;
  const covered = first ? Math.round(((now - Date.parse(first)) / 86400e3) * 10) / 10 : 0;
  const worst = window.reduce((m, s) => Math.max(m, s.fundingAgeMin ?? Infinity), 0);
  return { samples: window.length, ok, passRate: window.length ? Math.round((ok / window.length) * 1000) / 10 : 0, daysCovered: covered, worstFundingAgeMin: worst, failures: window.filter((s) => !s.ok).slice(-5) };
}

async function main() {
  if (process.argv.includes("--report")) {
    const samples = existsSync(FILE) ? readFileSync(FILE, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];
    console.log(JSON.stringify(report(samples), null, 1));
    return;
  }
  let sample;
  try {
    const res = await fetch(`${FEED}?r=${Date.now()}`, { headers: { "user-agent": "NexuAlphaFreshness/1.0" }, signal: AbortSignal.timeout(15000) });
    sample = res.ok ? sampleFrom(await res.json()) : { t: new Date().toISOString(), error: `HTTP ${res.status}`, ok: false };
  } catch (e) {
    sample = { t: new Date().toISOString(), error: String(e?.message || e).slice(0, 120), ok: false };
  }
  mkdirSync(path.dirname(FILE), { recursive: true });
  appendFileSync(FILE, `${JSON.stringify(sample)}\n`);
  // keep ~35 days at one sample per 5 minutes
  const lines = readFileSync(FILE, "utf8").split("\n").filter(Boolean);
  if (lines.length > 11000) writeFileSync(FILE, `${lines.slice(-10000).join("\n")}\n`);
  console.log(JSON.stringify(sample));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
