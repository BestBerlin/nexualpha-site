#!/usr/bin/env node
// Crypto calendar collector (2026-10-13). Writes /intel/calendar.json (schema nexualpha.calendar.v1, read by
// src/data/crypto-calendar.js). Node 20 built-ins only: it runs on the BaoTa host inside node:20-bookworm-slim
// (ops/intel-tools/run.sh). Every event keeps the official source it came from; a source that fails keeps its events
// from the previous snapshot (marked in `status`), and the file is written via rename only when it is usable.
//
//   node scripts/intel-tools/collect-calendar.mjs [--out public/intel/calendar.json] [--prev <file>]
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CALENDAR_SCHEMA, readCalendar } from "../../src/data/crypto-calendar.js";
import { updatePath } from "../../src/data/activity-update-path.js";
import { MACRO_SOURCES, collectMacro } from "./macro-schedule.mjs";
import { UNLOCK_SOURCE, collectUnlocks } from "./token-unlocks.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const argValue = (name, fallback) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : fallback; };
const OUT = path.resolve(argValue("--out", path.join(root, "public", "intel", "calendar.json")));
const PREV = argValue("--prev", OUT);
const SITE = process.env.NEXUALPHA_ORIGIN || "https://nexualpha.com";
const UA = "NexuAlpha-calendar/1.0 (+https://nexualpha.com/calendar; contact@nexualpha.com)";
const DAY = 864e5;
const now = Date.now();
const WINDOW = { from: now - 31 * DAY, to: now + 200 * DAY };
const inWindow = (iso) => { const t = Date.parse(iso); return t >= WINDOW.from && t <= WINDOW.to; };

export async function fetchText(url, { accept = "*/*", timeoutMs = 30000 } = {}) {
  const res = await fetch(url, { headers: { "user-agent": UA, accept }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}
export const fetchJson = async (url) => JSON.parse(await fetchText(url, { accept: "application/json" }));

// ------------------------------------------------------------------ exchange listings/delistings with a date in the title
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
/**
 * The scheduled date an official title names ("… on Oct 12, 2026, 11:05AM UTC", "… on 2026-10-08"), or null. Dates in
 * parentheses are not used: on Binance and KuCoin they are the announcement date, not the event date.
 */
export function titleEventDate(title) {
  const text = String(title || "");
  let m = text.match(/\bon\s+([A-Z][a-z]{2,8})\.?\s+(\d{1,2}),?\s+(\d{4})(?:,?\s*(?:at\s*)?(\d{1,2}):(\d{2})\s*(AM|PM)?\s*\(?UTC\)?)?/i);
  const month = m ? MONTHS[m[1].toLowerCase().slice(0, 3)] : undefined;
  if (m && month != null) {
    let hour = m[4] != null ? Number(m[4]) : null;
    if (hour != null && m[6]) hour = (hour % 12) + (m[6].toUpperCase() === "PM" ? 12 : 0);
    const iso = new Date(Date.UTC(Number(m[3]), month, Number(m[2]), hour ?? 0, m[5] != null ? Number(m[5]) : 0)).toISOString();
    return { start: iso, allDay: hour == null };
  }
  m = text.match(/\bon\s+(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})\s*\(?UTC\)?)?/i);
  if (m) {
    const hour = m[4] != null ? Number(m[4]) : null;
    return { start: new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hour ?? 0, m[5] != null ? Number(m[5]) : 0)).toISOString(), allDay: hour == null };
  }
  return null;
}

const VENUE_SOURCE = { binance: "Binance announcement", okx: "OKX announcement", bitget: "Bitget announcement", bybit: "Bybit announcement", kucoin: "KuCoin announcement", kraken: "Kraken blog", gate: "Gate announcement", mexc: "MEXC announcement", htx: "HTX announcement", coinbase: "Coinbase announcement" };
export function exchangeEvents(items) {
  const out = [];
  for (const item of items) {
    if (!["listing", "delisting"].includes(item?.category) || !/^https:\/\//.test(item?.url || "")) continue;
    const when = titleEventDate(item.title);
    if (!when || !inWindow(when.start)) continue;
    out.push({
      id: `exchange:${item.id || item.url}`, type: "exchange", kind: item.category, start: when.start, allDay: when.allDay,
      title: String(item.title).slice(0, 200), venue: item.venue, sourceUrl: item.url, sourceName: VENUE_SOURCE[item.venue] || `${item.venue} announcement`,
      pagePath: updatePath(item),
    });
  }
  return out;
}

// ------------------------------------------------------------------ campaign deadlines we cover (campaign briefs)
export function campaignEvents(briefs, announcements) {
  const byId = new Map(announcements.map((item) => [item.id, item]));
  const out = [];
  for (const brief of briefs) {
    const item = byId.get(brief?.id);
    const deadline = Date.parse(brief?.deadline);
    if (!item || !Number.isFinite(deadline) || !/^https:\/\//.test(item.url || "")) continue;
    const start = new Date(deadline).toISOString();
    if (!inWindow(start)) continue;
    const titles = brief.headline && typeof brief.headline === "object" ? brief.headline : {};
    out.push({
      id: `campaign:${brief.id}`, type: "campaign", kind: "campaign-end", start, allDay: false,
      title: String(titles.en || item.title).slice(0, 200), titles, venue: item.venue, sourceUrl: item.url,
      sourceName: VENUE_SOURCE[item.venue] || `${item.venue} announcement`, pagePath: updatePath(item),
    });
  }
  return out;
}

async function collectExchangeAndCampaigns() {
  const [live, archive, briefs] = await Promise.all([
    fetchJson(`${SITE}/intel/official-announcements.json`),
    fetchJson(`${SITE}/intel/official-announcements-archive.json`).catch(() => ({ items: [] })),
    fetchJson(`${SITE}/content/campaign-briefs.json`).catch(() => ({ items: [] })),
  ]);
  const seen = new Set();
  const items = [...(live.items || []), ...(archive.items || [])].filter((item) => item?.id && !seen.has(item.id) && seen.add(item.id));
  return { exchange: exchangeEvents(items), campaign: campaignEvents(briefs.items || [], items) };
}

// ------------------------------------------------------------------ run
async function main() {
  let prev = null;
  try { prev = readCalendar(JSON.parse(await readFile(PREV, "utf8"))); } catch { prev = null; }
  const keepPrev = (type) => (prev?.events || []).filter((e) => e.type === type && inWindow(e.start));
  const status = {};
  const groups = {};
  const run = async (name, types, fn) => {
    try {
      const result = await fn();
      for (const type of types) groups[type] = result[type] || [];
      status[name] = { ok: true, events: types.reduce((n, t) => n + groups[t].length, 0) };
    } catch (error) {
      for (const type of types) groups[type] = keepPrev(type);
      status[name] = { ok: false, error: String(error?.message || error).slice(0, 200), keptPrevious: types.reduce((n, t) => n + groups[t].length, 0) };
      console.error(`[calendar] ${name} failed: ${status[name].error}`);
    }
  };
  await run("macro", ["macro"], async () => ({ macro: await collectMacro({ fetchText, fetchJson, window: WINDOW }) }));
  await run("unlocks", ["unlock"], async () => ({ unlock: await collectUnlocks({ fetchText, fetchJson, window: WINDOW, now }) }));
  await run("exchanges", ["exchange", "campaign"], collectExchangeAndCampaigns);
  const events = [...groups.macro, ...groups.unlock, ...groups.exchange, ...groups.campaign].sort((a, b) => a.start.localeCompare(b.start));
  const snapshot = {
    schema: CALENDAR_SCHEMA, generatedAt: new Date(now).toISOString(), status,
    sources: [...MACRO_SOURCES, UNLOCK_SOURCE, { name: "Official exchange announcements (NexuAlpha feed)", url: `${SITE}/intel/official-announcements.json` }],
    events,
  };
  const parsed = readCalendar(snapshot);
  if (!parsed || !parsed.events.length) throw new Error("refusing to write an empty calendar");
  const tmp = `${OUT}.tmp-${process.pid}`;
  await writeFile(tmp, `${JSON.stringify(snapshot)}\n`);
  await rename(tmp, OUT);
  console.log(`[calendar] wrote ${OUT}: ${parsed.events.length} events ${JSON.stringify(Object.fromEntries(Object.entries(status).map(([k, v]) => [k, v.ok ? v.events : `FAILED kept ${v.keptPrevious}`])))}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(`[calendar] ${error?.stack || error}`); process.exit(1); });
}
