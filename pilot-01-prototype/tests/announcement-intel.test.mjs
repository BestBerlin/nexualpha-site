import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeIntel, normalizeBitgetAnnouncements, normalizeBybitAnnouncements, readIntelFeed,
} from "../src/data/announcement-intel.js";

const now = Date.parse("2026-10-09T10:00:00Z");

// Payload shapes follow the exchanges' documented response fields (test fixtures only).
const bitget = {
  code: "00000",
  data: [
    { annId: "1", annTitle: "CTUSDT now launched", annType: "coin_listings", cTime: String(now - 3600e3), annUrl: "https://www.bitget.com/en/support/articles/1" },
    { annId: "2", annTitle: "Off-domain link", annType: "coin_listings", cTime: String(now - 3600e3), annUrl: "https://evil.example/bitget/2" },
    { annId: "3", annTitle: "Tracking params", annType: "latest_news", cTime: String(now - 3600e3), annUrl: "https://www.bitget.com/en/support/articles/3?utm_source=x" },
    { annId: "4", annTitle: "Future dated", annType: "latest_news", cTime: String(now + 86400e3), annUrl: "https://www.bitget.com/en/support/articles/4" },
    { annId: "5", annTitle: "Maintenance is out of scope", annType: "maintenance_system_updates", cTime: String(now - 3600e3), annUrl: "https://www.bitget.com/en/support/articles/5" },
    { annId: "6", annTitle: "", annType: "latest_news", cTime: String(now - 3600e3), annUrl: "https://www.bitget.com/en/support/articles/6" },
  ],
};

test("bitget: keeps only well-formed official items", () => {
  const items = normalizeBitgetAnnouncements(bitget, { now });
  assert.deepEqual(items.map((i) => i.id), ["bitget:1"]);
  assert.equal(items[0].category, "listing");
  assert.equal(items[0].publishedAt, new Date(now - 3600e3).toISOString());
  assert.deepEqual(Object.keys(items[0]).sort(), ["category", "id", "publishedAt", "sourceType", "title", "url", "venue"]);
});

test("bitget: error payloads yield nothing", () => {
  assert.deepEqual(normalizeBitgetAnnouncements({ code: "40001", data: [] }, { now }), []);
  assert.deepEqual(normalizeBitgetAnnouncements(null, { now }), []);
});

test("bybit: maps documented types and rejects foreign hosts", () => {
  const items = normalizeBybitAnnouncements({
    retCode: 0,
    result: { list: [
      { title: "New Listing: ABC", type: { key: "new_crypto" }, url: "https://announcements.bybit.com/en-US/article/abc/", dateTimestamp: now - 7200e3 },
      { title: "Bad host", type: { key: "new_crypto" }, url: "https://bybit.evil.example/x", dateTimestamp: now - 7200e3 },
      { title: "Unknown type", type: { key: "mystery" }, url: "https://announcements.bybit.com/en-US/article/z/", dateTimestamp: now - 7200e3 },
    ] },
  }, { now });
  assert.equal(items.length, 1);
  assert.equal(items[0].venue, "bybit");
  assert.equal(items[0].category, "listing");
});

test("mergeIntel de-duplicates, sorts newest first and drops stale items", () => {
  const a = { id: "x:1", url: "https://a", publishedAt: new Date(now - 1e6).toISOString() };
  const b = { id: "x:2", url: "https://b", publishedAt: new Date(now - 5e5).toISOString() };
  const old = { id: "x:3", url: "https://c", publishedAt: new Date(now - 90 * 86400e3).toISOString() };
  assert.deepEqual(mergeIntel([[a, b], [a, old]], { now }).map((i) => i.id), ["x:2", "x:1"]);
});

test("readIntelFeed re-validates stored items", () => {
  const good = normalizeBitgetAnnouncements(bitget, { now })[0];
  const feed = { items: [good, { ...good, id: "bitget:9", url: "https://evil.example/x" }, { ...good, id: "bitget:8", category: "reward" }, { id: "nope" }] };
  assert.deepEqual(readIntelFeed(feed, { now }).map((i) => i.id), ["bitget:1"]);
  assert.deepEqual(readIntelFeed(null, { now }), []);
});
