#!/usr/bin/env node
// Data freshness log (scorecard D2, 2026-10-11). Every run records how old the PUBLIC market feed is, as visitors see it:
// funding rows + age, market-events age. The 7-day report answers "≥ 20 funding symbols with < 10 min staleness".
//   node data-freshness.mjs            append one sample
//   node data-freshness.mjs --report   pass rate over the last 7 days
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { atomicWriteJson, atomicWriteText, boundedFetch } from "../market-collector/resilience.mjs";

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

export async function collectFreshness({ file = FILE, feed = FEED, fetchImpl = fetch, now = Date.now } = {}) {
  let sample;
  try {
    const res = await boundedFetch(fetchImpl)(`${feed}?r=${now()}`, { headers: { "user-agent": "NexuAlphaFreshness/1.0" } });
    sample = res.ok ? sampleFrom(await res.json(), now()) : { t: new Date(now()).toISOString(), error: `HTTP ${res.status}`, ok: false };
  } catch (e) {
    sample = { t: new Date(now()).toISOString(), error: String(e?.message || e).slice(0, 120), ok: false };
  }
  const updatedAt = new Date(now()).toISOString();
  sample.updatedAt = updatedAt;
  sample.sourceStatus = { marketFeed: { status: sample.error ? "error" : "ok", error: sample.error || null } };
  const lines = existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).slice(-9999) : [];
  lines.push(JSON.stringify(sample));
  atomicWriteText(file, `${lines.join("\n")}\n`);
  atomicWriteJson(`${file}.heartbeat.json`, { updatedAt, status: sample.error ? "degraded" : "ok", sourceStatus: sample.sourceStatus });
  return sample;
}

export async function collectFreshnessWithRetry({ startupBudgetMs = 300_000, now = Date.now, wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), ...options } = {}) {
  const startedAt = now();
  for (let attempt = 0; ; attempt += 1) {
    const sample = await collectFreshness({ ...options, now });
    const remaining = startupBudgetMs - (now() - startedAt);
    if (!sample.error || remaining <= 0) return sample;
    await wait(Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 10), remaining));
  }
}

async function main() {
  if (process.argv.includes("--report")) {
    const samples = existsSync(FILE) ? readFileSync(FILE, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];
    console.log(JSON.stringify(report(samples), null, 1));
    return;
  }
  const sample = await collectFreshnessWithRetry();
  console.log(JSON.stringify(sample));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
