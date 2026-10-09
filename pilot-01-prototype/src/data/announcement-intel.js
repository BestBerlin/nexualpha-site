/**
 * Official announcement intel: pure normalizers shared by the fetch script,
 * the tests and the home "latest" block.
 *
 * Contract (fail-closed):
 *  - an item is only produced from a payload an exchange published itself,
 *    and its link must be https on that exchange's own domain;
 *  - the item carries a title, a time and a link, nothing else. It never
 *    carries reward, eligibility or "offer" claims. Those stay with the
 *    reviewed activity model (official-campaign-model.js).
 */
import { officialResearchUrl } from "./official-campaign-model.js";

export const INTEL_CATEGORIES = Object.freeze(["listing", "event", "delisting", "news", "product", "security"]);
export const MAX_FUTURE_SKEW_MS = 60 * 60 * 1000;

const BITGET_TYPES = Object.freeze({
  coin_listings: "listing",
  symbol_delisting: "delisting",
  latest_news: "news",
  product_updates: "product",
  security: "security",
});

const BYBIT_TYPES = Object.freeze({
  new_crypto: "listing",
  latest_activities: "event",
  delistings: "delisting",
  latest_bybit_news: "news",
  product_updates: "product",
});

const cleanTitle = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 220) : "");

function toIso(ms, now) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > now + MAX_FUTURE_SKEW_MS) return null;
  return new Date(n).toISOString();
}

export function normalizeBitgetAnnouncements(payload, { now = Date.now() } = {}) {
  if (!payload || payload.code !== "00000" || !Array.isArray(payload.data)) return [];
  const items = [];
  for (const row of payload.data) {
    const category = BITGET_TYPES[row?.annType];
    const title = cleanTitle(row?.annTitle);
    const url = officialResearchUrl(row?.annUrl, "bitget");
    const publishedAt = toIso(row?.cTime, now);
    if (!category || !title || !url || !publishedAt || !row?.annId) continue;
    items.push({ id: `bitget:${row.annId}`, venue: "bitget", category, title, url, publishedAt, sourceType: "official_api" });
  }
  return items;
}

export function normalizeBybitAnnouncements(payload, { now = Date.now() } = {}) {
  const list = payload?.retCode === 0 ? payload?.result?.list : null;
  if (!Array.isArray(list)) return [];
  const items = [];
  for (const row of list) {
    const category = BYBIT_TYPES[row?.type?.key];
    const title = cleanTitle(row?.title);
    const url = officialResearchUrl(row?.url, "bybit");
    const publishedAt = toIso(row?.publishTime ?? row?.dateTimestamp, now);
    if (!category || !title || !url || !publishedAt) continue;
    items.push({ id: `bybit:${row.url}`, venue: "bybit", category, title, url, publishedAt, sourceType: "official_api" });
  }
  return items;
}

/** Merge, de-duplicate by id, drop anything older than maxAgeMs, newest first. */
export function mergeIntel(lists, { now = Date.now(), maxAgeMs = 30 * 24 * 60 * 60 * 1000, limit = 60 } = {}) {
  const byId = new Map();
  for (const item of lists.flat()) {
    if (!item?.id || !item.url || !item.publishedAt) continue;
    if (now - Date.parse(item.publishedAt) > maxAgeMs) continue;
    byId.set(item.id, item);
  }
  return [...byId.values()].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, limit);
}

/** Re-validate a stored feed before showing it. Anything malformed is dropped, never repaired. */
export function readIntelFeed(feed, { now = Date.now(), venues = null } = {}) {
  const items = Array.isArray(feed?.items) ? feed.items : [];
  return items.filter((item) => (
    typeof item?.id === "string"
    && typeof item.title === "string" && item.title
    && INTEL_CATEGORIES.includes(item.category)
    && (!venues || venues.includes(item.venue))
    && officialResearchUrl(item.url, item.venue) === item.url
    && Number.isFinite(Date.parse(item.publishedAt))
    && Date.parse(item.publishedAt) <= now + MAX_FUTURE_SKEW_MS
  ));
}
