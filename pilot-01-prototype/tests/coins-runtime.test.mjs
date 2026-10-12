// Runtime coin snapshot (2026-10-12): coin pages render from the host's refreshed coins.json (COINS_FILE) without a
// redeploy; the browser hydrates with the same rows (prerender state "coins").
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import worker from "../worker/index.js";
import { COINS_GENERATED_AT as BAKED_AT } from "../src/data/coins-data.generated.js";
import { applyCoinOverlay, coinBySlug, coinOverlayFromSnapshot, COINS, COINS_GENERATED_AT } from "../src/data/coins.js";
import { coinRowFromSnapshotCoin, isUsableCoinSnapshot } from "../src/data/coins-snapshot.js";
import { COIN_ROWS } from "../src/data/coins-data.generated.js";
import { createCoinsSnapshotReader } from "../server/coins-feed.mjs";
import { createSsrHarness, SHELL_HTML, hydrateInJsdom, hydrationErrors, prerenderState } from "./helpers/ssr-hydration-harness.mjs";

const baked = JSON.parse(await readFile(new URL("../public/intel/coins.json", import.meta.url), "utf8"));
const fresher = () => {
  const snapshot = structuredClone(baked);
  snapshot.generatedAt = new Date(Date.parse(BAKED_AT) + 86_400_000).toISOString();
  const btc = snapshot.coins.find((coin) => coin.slug === "bitcoin");
  btc.price = 12345.67;
  delete btc.venues.kraken;
  snapshot.coins.push({ ...snapshot.coins[1], id: "not-in-build", slug: "not-in-build" });
  return snapshot;
};

test("the shipped coins.json is the baked table", () => {
  assert.ok(isUsableCoinSnapshot(baked));
  assert.equal(baked.generatedAt, BAKED_AT);
  assert.deepEqual(baked.coins.map(coinRowFromSnapshotCoin), COIN_ROWS.map((row) => [...row]));
  assert.equal(coinOverlayFromSnapshot(baked), null, "same snapshot: nothing to overlay");
  assert.equal(coinOverlayFromSnapshot({ ...baked, coins: baked.coins.slice(0, 10), generatedAt: new Date().toISOString() }), null, "truncated file");
});

test("reader: missing, implausible and valid files", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "coins-feed-"));
  try {
    const file = path.join(dir, "coins.json");
    let now = 0;
    const reader = createCoinsSnapshotReader({ file, ttlMs: 1000, now: () => now });
    assert.equal(await reader.read(), null);
    assert.equal(await reader.respond(), null, "no file: the static copy answers");
    await writeFile(file, JSON.stringify({ generatedAt: new Date().toISOString(), coins: [] }));
    now += 2000;
    assert.equal(await reader.read(), null, "implausible file ignored");
    const snapshot = fresher();
    await writeFile(file, JSON.stringify(snapshot));
    now += 2000;
    assert.equal((await reader.read()).generatedAt, snapshot.generatedAt);
    const res = await reader.respond();
    assert.equal(res.status, 200);
    assert.equal((await res.json()).generatedAt, snapshot.generatedAt);
    await writeFile(file, "{ truncated");
    now += 2000;
    assert.equal((await reader.read()).generatedAt, snapshot.generatedAt, "a broken rewrite keeps the last good snapshot");
  } finally { await rm(dir, { recursive: true, force: true }); }
});

const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

test("worker without a runtime snapshot renders the baked table and marks the page server-rendered", async () => {
  const html = await (await worker.fetch(new Request("https://nexualpha.com/coins/bitcoin", { headers: { accept: "text/html" } }), { ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) })).text();
  assert.deepEqual(prerenderState(html).coins, { generatedAt: BAKED_AT, rows: [] });
});

test("worker renders coin pages from the runtime snapshot and hydrates with the same rows", async () => {
  const snapshot = fresher();
  const env = { ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options), COINS_SNAPSHOT_READ: async () => snapshot };
  const html = await (await worker.fetch(new Request("https://nexualpha.com/coins/bitcoin", { headers: { accept: "text/html" } }), env)).text();
  const state = prerenderState(html).coins;
  assert.equal(state.generatedAt, snapshot.generatedAt);
  assert.deepEqual(state.rows.map((row) => row[1]), ["bitcoin"], "only changed baked coins travel");
  assert.match(html, /\$12,346/, "server HTML shows the runtime price");
  assert.equal(COINS_GENERATED_AT, snapshot.generatedAt, "worker head helpers use the runtime table");
  assert.equal(coinBySlug("bitcoin").venues.some((venue) => venue.slug === "kraken"), false);
  assert.equal(coinBySlug("not-in-build"), null, "the page set stays the baked one");
  assert.equal(COINS.length, COIN_ROWS.length);
  const { errors } = await hydrateInJsdom(harness.vite, html, "https://nexualpha.com/coins/bitcoin");
  assert.deepEqual(hydrationErrors(errors), [], errors.join("\n"));
  assert.equal(applyCoinOverlay(state), false, "idempotent");
});
