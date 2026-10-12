/**
 * Append-only archive of official announcements (2026-10-12, GSC "Not found (404)").
 *
 * The live feed (/intel/official-announcements.json) keeps only the newest items (30 days, 240 rows), so an update page
 * /activities/updates/<venue>/<slug> used to 404 once its item rotated out, although it had been linked from Telegram,
 * sitemaps and our own pages. Every item that was ever in the live feed is kept here, keyed by id, so its page stays a
 * real page. Items are stored exactly as the feed published them (title, time, official link) plus when we saw them.
 *
 * Pure helpers shared by the server (writer), the Worker (reader) and the tests.
 */
import { readIntelFeed } from "./announcement-intel.js";

export const ARCHIVE_PATH = "/intel/official-announcements-archive.json";
const DAY_MS = 24 * 60 * 60 * 1000;
/** An archived update page is indexable this long after publication; afterwards it is noindex but still 200. */
export const ARCHIVE_INDEXABLE_MS = 180 * DAY_MS;
/** Entries are kept this long after publication; past it the URL redirects to the venue's activity listing. */
export const ARCHIVE_RETENTION_MS = 400 * DAY_MS;
/** Hard bound on the file (about 300 bytes a row). */
export const ARCHIVE_MAX_ITEMS = 6000;

const FIELDS = ["id", "venue", "category", "title", "url", "publishedAt", "sourceType", "summary", "startAt", "endAt", "expiresAt"];

function pick(item) {
  const row = {};
  for (const key of FIELDS) if (typeof item?.[key] === "string" && item[key]) row[key] = item[key];
  return row;
}

/** Valid archive rows (same fail-closed checks as the live feed), newest first. */
export function archiveItems(archive, { now = Date.now() } = {}) {
  return readIntelFeed({ items: Array.isArray(archive?.items) ? archive.items : [] }, { now })
    .filter((item) => now - Date.parse(item.publishedAt) <= ARCHIVE_RETENTION_MS);
}

/**
 * Merge feed items into the archive. Existing rows keep firstSeenAt; lastSeenAt moves forward. Nothing is ever repaired
 * or invented: rows that fail validation are dropped. Returns { archive, changed }.
 */
export function mergeArchive(archive, items, { now = Date.now(), seenAt = new Date(now).toISOString() } = {}) {
  const byId = new Map();
  for (const row of archiveItems(archive, { now })) byId.set(row.id, row);
  let changed = !archive || (Array.isArray(archive.items) ? archive.items.length : 0) !== byId.size;
  for (const item of readIntelFeed({ items: Array.isArray(items) ? items : [] }, { now })) {
    if (now - Date.parse(item.publishedAt) > ARCHIVE_RETENTION_MS) continue;
    const previous = byId.get(item.id);
    const next = { ...(previous || {}), ...pick(item), firstSeenAt: previous?.firstSeenAt || item.firstSeenAt || seenAt, lastSeenAt: seenAt };
    if (previous && previous.lastSeenAt && Date.parse(previous.lastSeenAt) > Date.parse(seenAt)) next.lastSeenAt = previous.lastSeenAt;
    if (!previous || JSON.stringify(previous) !== JSON.stringify(next)) changed = true;
    byId.set(item.id, next);
  }
  const rows = [...byId.values()]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.id.localeCompare(b.id))
    .slice(0, ARCHIVE_MAX_ITEMS);
  if (rows.length !== byId.size) changed = true;
  return {
    archive: { version: 1, updatedAt: changed ? new Date(now).toISOString() : archive?.updatedAt || new Date(now).toISOString(), items: rows },
    changed,
  };
}

/** Union of two archives (two server containers can write the same file during a cutover). */
export function unionArchives(a, b, { now = Date.now() } = {}) {
  const older = mergeArchive(a, [], { now }).archive;
  const rows = archiveItems(b, { now });
  const byId = new Map(older.items.map((row) => [row.id, row]));
  for (const row of rows) {
    const prev = byId.get(row.id);
    if (!prev) { byId.set(row.id, row); continue; }
    const first = [prev.firstSeenAt, row.firstSeenAt].filter(Boolean).sort()[0];
    const last = [prev.lastSeenAt, row.lastSeenAt].filter(Boolean).sort().at(-1);
    byId.set(row.id, { ...prev, ...row, ...(first ? { firstSeenAt: first } : {}), ...(last ? { lastSeenAt: last } : {}) });
  }
  return mergeArchive({ items: [...byId.values()] }, [], { now }).archive;
}

/** Archived update pages are indexable for ARCHIVE_INDEXABLE_MS after publication. */
export function isArchiveIndexable(item, now = Date.now()) {
  const published = Date.parse(item?.publishedAt);
  return Number.isFinite(published) && now - published <= ARCHIVE_INDEXABLE_MS;
}
