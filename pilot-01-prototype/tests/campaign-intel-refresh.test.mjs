import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildFeed, createIntelFeed, SOURCES } from "../server/intel-feed.mjs";
import { normalizeBitgetAnnouncements } from "../src/data/announcement-intel.js";

const now = Date.parse("2026-10-12T08:00:00Z");

function withImmediateSpacing(fn) {
  const original = globalThis.setTimeout;
  globalThis.setTimeout = (callback) => {
    callback();
    return 0;
  };
  return Promise.resolve()
    .then(fn)
    .finally(() => { globalThis.setTimeout = original; });
}

function hexCode(seed) {
  return String(seed).padStart(2, "0") + "a".repeat(30);
}

function okJson(data) {
  return { ok: true, json: async () => data };
}

function okText(text) {
  return { ok: true, text: async () => text };
}

function mockedFetch(calls) {
  return async (url) => {
    calls.push(url);
    const parsed = new URL(url);

    if (parsed.hostname === "www.okx.com") {
      const annType = parsed.searchParams.get("annType") || "announcements-latest-announcements";
      const page = parsed.searchParams.get("page") || "1";
      return okJson({ code: "0", data: [{ details: [{ annType, title: `OKX ${annType} page ${page}`, url: `https://www.okx.com/help/${annType}-${page}`, pTime: String(now - Number(page) * 1000) }] }] });
    }

    if (parsed.hostname === "www.binance.com") {
      const catalogId = Number(parsed.searchParams.get("catalogId"));
      return okJson({ code: "000000", data: { catalogs: [{ catalogId, articles: [{ code: hexCode(catalogId), title: `Binance ${catalogId}`, releaseDate: now - catalogId }] }] } });
    }

    if (parsed.hostname === "api.kucoin.com") {
      const annType = parsed.searchParams.get("annType");
      return okJson({ code: "200000", data: { items: [{ annId: annType, annTitle: `KuCoin ${annType}`, annUrl: `https://www.kucoin.com/announcement/${annType}`, cTime: now - 2000 }] } });
    }

    if (parsed.hostname === "api.bitget.com") {
      const annType = parsed.searchParams.get("annType");
      return okJson({ code: "00000", data: [{ annId: annType, annTitle: `Bitget ${annType}`, annType, cTime: String(now - 3000), annUrl: `https://www.bitget.com/en/support/articles/${annType}` }] });
    }

    if (parsed.hostname === "api.bybit.com") {
      const type = parsed.searchParams.get("type");
      return okJson({ retCode: 0, result: { list: [{ title: `Bybit ${type}`, type: { key: type }, url: `https://announcements.bybit.com/en-US/article/${type}/`, publishTime: now - 4000 }] } });
    }

    if (parsed.hostname === "blog.kraken.com") {
      return okText(`<rss><channel><item><title>Kraken news</title><link>https://blog.kraken.com/news/campaign</link><pubDate>${new Date(now - 5000).toUTCString()}</pubDate></item></channel></rss>`);
    }

    throw new Error(`unexpected URL ${url}`);
  };
}

test("campaign intel sources request broader official windows", async () => {
  const calls = [];
  await withImmediateSpacing(async () => {
    await SOURCES.okx(now, mockedFetch(calls));
    await SOURCES.binance(now, mockedFetch(calls));
    await SOURCES.kucoin(now, mockedFetch(calls));
    await SOURCES.bitget(now, mockedFetch(calls));
    await SOURCES.bybit(now, mockedFetch(calls));
  });

  assert.ok(calls.includes("https://www.okx.com/api/v5/support/announcements?page=2&annType=latest-events"));
  assert.equal(calls.filter((url) => url.includes("pageSize=20&catalogId=")).length, 4);
  assert.equal(calls.filter((url) => url.includes("api.kucoin.com") && url.includes("pageSize=20")).length, 4);
  // Bitget rejects limit > 10 with code 40017 (every Bitget refresh failed from 2026-10-10 until 2026-10-12).
  assert.ok(calls.includes("https://api.bitget.com/api/v2/public/annoucements?language=en_US&annType=trading_competitions_promotions&limit=10"));
  assert.equal(calls.filter((url) => url.includes("api.bitget.com") && url.includes("limit=10")).length, 4);
  assert.equal(calls.filter((url) => url.includes("api.bybit.com") && url.includes("limit=20")).length, 3);
});

test("bitget trading competitions normalize as event intel", () => {
  const [item] = normalizeBitgetAnnouncements({ code: "00000", data: [{ annId: "campaign", annTitle: "Trading competition", annType: "trading_competitions_promotions", cTime: String(now - 1000), annUrl: "https://www.bitget.com/en/support/articles/campaign" }] }, { now });
  assert.equal(item.category, "event");
});

test("buildFeed keeps per-venue fallback items and merges up to 240", async () => {
  const previousOkx = { id: "okx:last-good", venue: "okx", category: "event", title: "Last good OKX event", url: "https://www.okx.com/help/last-good-event", publishedAt: new Date(now - 1000).toISOString(), sourceType: "official_api" };
  const previous = { sources: { okx: { ok: true, at: new Date(now - 86400e3).toISOString() } }, items: [previousOkx] };
  const many = Array.from({ length: 260 }, (_, index) => ({ id: `bitget:${index}`, venue: "bitget", category: "news", title: `Bitget item ${index}`, url: `https://www.bitget.com/en/support/articles/${index}`, publishedAt: new Date(now - index * 1000).toISOString(), sourceType: "official_api" }));
  const feed = await buildFeed(previous, { now, sources: {
    okx: async () => { throw new Error("temporary OKX outage"); },
    bitget: async () => many,
  } });

  assert.equal(feed.sources.okx.ok, false);
  assert.equal(feed.sources.okx.lastGoodAt, previous.sources.okx.at);
  assert.equal(feed.sources.bitget.ok, true);
  assert.equal(feed.items.length, 240);
  assert.ok(feed.items.some((item) => item.id === "okx:last-good"));
});

test("createIntelFeed refreshes on a five-minute default interval", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "nexualpha-intel-"));
  const originalSetInterval = globalThis.setInterval;
  let intervalMs = null;
  globalThis.setInterval = (callback, ms) => {
    intervalMs = ms;
    return { callback, unref() {} };
  };

  try {
    await mkdir(path.join(root, "intel"));
    await writeFile(path.join(root, "intel", "official-announcements.json"), JSON.stringify({ generatedAt: new Date(now).toISOString(), status: "OK", sources: {}, items: [] }));
    await withImmediateSpacing(async () => {
      const feed = createIntelFeed(root, { fetchImpl: mockedFetch([]), log: () => {} });
      assert.equal(intervalMs, 5 * 60 * 1000);
      await feed.refresh();
      feed.stop();
    });
  } finally {
    globalThis.setInterval = originalSetInterval;
    await rm(root, { recursive: true, force: true });
  }
});

test("createIntelFeed archives every served item so rotated-out updates stay resolvable", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "nexualpha-intel-archive-"));
  const archiveFile = path.join(root, "state", "official-announcements-archive.json");
  const item = (id, hoursAgo) => ({ id: `okx:https://www.okx.com/help/${id}`, venue: "okx", category: "event", title: `OKX ${id}`, url: `https://www.okx.com/help/${id}`, publishedAt: new Date(Date.now() - hoursAgo * 3600e3).toISOString(), sourceType: "official_api" });
  try {
    await mkdir(path.join(root, "intel"));
    await writeFile(path.join(root, "intel", "official-announcements.json"), JSON.stringify({ generatedAt: new Date().toISOString(), items: [item("seed-event", 5)] }));
    // Another writer (the other container during a cutover, or the host cron) already archived one item.
    await mkdir(path.dirname(archiveFile));
    await writeFile(archiveFile, JSON.stringify({ version: 1, items: [item("older-event", 48)] }));
    const feed = createIntelFeed(root, { enabled: false, archiveFile, log: () => {} });
    assert.ok((await feed.read()).items.some((row) => row.id === item("seed-event", 5).id));
    await feed.flush();
    const archive = await feed.readArchive();
    assert.deepEqual(archive.items.map((row) => row.id).sort(), [item("older-event", 48).id, item("seed-event", 5).id].sort());
    const stored = JSON.parse(await readFile(archiveFile, "utf8"));
    assert.equal(stored.items.length, 2, "read-merge-write keeps the other writer's rows");
    const seen = stored.items.find((row) => row.id === item("seed-event", 5).id);
    assert.ok(seen.firstSeenAt && seen.lastSeenAt, "served items record when they were seen");
    const response = await feed.respondArchive();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).items.length, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
