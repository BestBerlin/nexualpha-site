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
import { buildFeed } from "../server/intel-feed.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDir, "public/intel/official-announcements.json");

// Refreshes the seed copy shipped with the build. The running server refreshes its own copy (server/intel-feed.mjs).
export async function run({ write = true } = {}) {
  let previous = null;
  try { previous = JSON.parse(fs.readFileSync(outputPath, "utf8")); } catch { /* first run */ }
  const feed = await buildFeed(previous);
  if (!feed) { process.stdout.write("[NexuAlpha] announcements: every source failed; seed unchanged\n"); return null; }
  if (write) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(feed, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`[NexuAlpha] announcements: ${feed.items.length} items; ${Object.entries(feed.sources).map(([k, v]) => `${k}=${v.ok ? "ok" : `fail(${v.error})`}`).join(" ")}\n`);
  return feed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await run();
