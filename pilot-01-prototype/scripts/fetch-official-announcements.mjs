#!/usr/bin/env node
/**
 * Fetch official exchange announcements into public/intel/official-announcements.json (not /content: production mounts managed content over that directory).
 *
 * Sources are the exchanges' own public announcement endpoints (documented):
 *   Bitget  GET https://api.bitget.com/api/v2/public/annoucements   (20 req/s/IP, last month)
 *   Bybit   GET https://api.bybit.com/v5/announcements/index
 * No scraping, no key, no workaround for blocked requests. A source that
 * fails keeps its previous items and is reported; nothing is ever invented.
 * Run it from a machine the exchanges accept (it is a plain cron job):
 *   node scripts/fetch-official-announcements.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  mergeIntel, normalizeBitgetAnnouncements, normalizeBybitAnnouncements, readIntelFeed,
} from "../src/data/announcement-intel.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDir, "public/intel/official-announcements.json");
const UA = "NexuAlphaAnnouncementReader/1.0 (+https://nexualpha.com)";

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json", "user-agent": UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const SOURCES = {
  bitget: async (now) => {
    const out = [];
    for (const annType of ["coin_listings", "latest_news", "symbol_delisting"]) {
      const url = `https://api.bitget.com/api/v2/public/annoucements?language=en_US&annType=${annType}&limit=10`;
      out.push(...normalizeBitgetAnnouncements(await getJson(url), { now }));
      await wait(300);
    }
    return out;
  },
  bybit: async (now) => {
    const out = [];
    for (const type of ["new_crypto", "latest_activities", "delistings"]) {
      const url = `https://api.bybit.com/v5/announcements/index?locale=en-US&type=${type}&limit=10`;
      out.push(...normalizeBybitAnnouncements(await getJson(url), { now }));
      await wait(300);
    }
    return out;
  },
};

export async function run({ write = true } = {}) {
  const now = Date.now();
  let previous = null;
  try { previous = JSON.parse(fs.readFileSync(outputPath, "utf8")); } catch { /* first run */ }
  const kept = readIntelFeed(previous, { now });
  const sources = {};
  const lists = [];
  for (const [venue, load] of Object.entries(SOURCES)) {
    try {
      const items = await load(now);
      sources[venue] = { ok: true, fetched: items.length, at: new Date(now).toISOString() };
      lists.push(items);
    } catch (error) {
      sources[venue] = { ok: false, error: String(error.message || error), lastGoodAt: previous?.sources?.[venue]?.lastGoodAt ?? previous?.sources?.[venue]?.at ?? null };
      lists.push(kept.filter((i) => i.venue === venue));
    }
  }
  const items = mergeIntel(lists, { now });
  const anyOk = Object.values(sources).some((s) => s.ok);
  const feed = { generatedAt: new Date(now).toISOString(), status: anyOk ? "OK" : "UNAVAILABLE", sources, items };
  if (write && anyOk) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(feed, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`[NexuAlpha] announcements: ${items.length} items; ${Object.entries(sources).map(([k, v]) => `${k}=${v.ok ? "ok" : `fail(${v.error})`}`).join(" ")}\n`);
  return feed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await run();
