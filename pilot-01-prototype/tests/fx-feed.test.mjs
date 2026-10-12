// Converter FX feed: server-side daily cache for /intel/fx.json, with every converter fiat present and no fabricated rows.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { createFxFeed, CONVERTER_FIATS, FX_JSON_PATH, normalizeFxSnapshot } from "../server/fx-feed.mjs";
import { createProductionServer } from "../server.mjs";

const NOW = Date.parse("2026-10-13T08:00:00Z");
const sourcePayload = (overrides = {}) => ({
  result: "success",
  provider: "https://www.exchangerate-api.com",
  documentation: "https://www.exchangerate-api.com/docs/free",
  terms_of_use: "https://www.exchangerate-api.com/terms",
  time_last_update_unix: 1791878400,
  time_next_update_unix: 1791964800,
  base_code: "USD",
  rates: {
    USD: 1,
    EUR: 0.86,
    BRL: 5.44,
    TRY: 41.9,
    IDR: 16500,
    VND: 26300,
    MXN: 18.4,
    JPY: 152.1,
    KRW: 1420,
    CNY: 7.12,
    GBP: 0.75,
    INR: 88.7,
  },
  ...overrides,
});

test("normalizer keeps a USD-based snapshot with all converter fiats and source metadata", () => {
  const snapshot = normalizeFxSnapshot(sourcePayload(), { sourceUrl: "https://fx.test/latest/USD", now: NOW });
  assert.equal(snapshot.base, "USD");
  assert.equal(snapshot.generatedAt, "2026-10-13T08:00:00.000Z");
  assert.equal(snapshot.sourceUrl, "https://fx.test/latest/USD");
  assert.equal(snapshot.documentation, "https://www.exchangerate-api.com/docs/free");
  assert.deepEqual(Object.keys(snapshot.rates), [...CONVERTER_FIATS]);
  assert.equal(snapshot.rates.USD, 1);
  assert.equal(snapshot.rates.VND, 26300);
  assert.match(snapshot.attributionHtml, /Rates By Exchange Rate API/);
});

test("normalizer fails closed when any required fiat is missing or implausible", () => {
  const noVnd = sourcePayload({ rates: { ...sourcePayload().rates, VND: undefined } });
  assert.throws(() => normalizeFxSnapshot(noVnd), /VND FX rate/);
  const wrongBase = sourcePayload({ base_code: "EUR" });
  assert.throws(() => normalizeFxSnapshot(wrongBase), /invalid FX response envelope/);
  const badUsd = sourcePayload({ rates: { ...sourcePayload().rates, USD: 0.999 } });
  assert.throws(() => normalizeFxSnapshot(badUsd), /USD FX rate must be 1/);
  const ancient = sourcePayload({ time_last_update_unix: Math.floor((NOW - 8 * 24 * 60 * 60 * 1000) / 1000) });
  assert.throws(() => normalizeFxSnapshot(ancient, { now: NOW }), /too old/);
  const future = sourcePayload({ time_last_update_unix: Math.floor((NOW + 10 * 60 * 1000) / 1000) });
  assert.throws(() => normalizeFxSnapshot(future, { now: NOW }), /future/);
});

test("feed serves fresh rates, marks stale fallback after a failed refresh, then expires the fallback", async () => {
  let currentNow = NOW;
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls > 1) throw new Error("source down");
    return Response.json(sourcePayload());
  };
  const feed = createFxFeed({
    enabled: false,
    fetchImpl,
    now: () => currentNow,
    everyMs: 24 * 60 * 60 * 1000,
    staleMs: 2 * 24 * 60 * 60 * 1000,
    log: () => {},
  });
  await feed.refresh();
  let res = await feed.respond();
  assert.equal(res.status, 200);
  let body = await res.json();
  assert.equal(body.status, "ok");
  assert.equal(body.freshness, "fresh");
  assert.equal(body.rates.BRL, 5.44);

  currentNow += 25 * 60 * 60 * 1000;
  await feed.refresh();
  res = await feed.respond();
  assert.equal(res.status, 200);
  body = await res.json();
  assert.equal(body.status, "stale");
  assert.equal(body.freshness, "stale");
  assert.equal(body.rates.VND, 26300, "last good rates remain visible while explicitly marked stale");
  assert.match(body.lastError, /source down/);

  currentNow += 2 * 24 * 60 * 60 * 1000;
  res = await feed.respond();
  assert.equal(res.status, 503);
  body = await res.json();
  assert.equal(body.status, "unavailable");
  assert.equal(body.rates, null);
});

test("feed marks old source timestamps stale and rejects regressive source updates", async () => {
  let currentNow = NOW;
  let payload = sourcePayload();
  const feed = createFxFeed({
    enabled: false,
    fetchImpl: async () => Response.json(payload),
    now: () => currentNow,
    everyMs: 24 * 60 * 60 * 1000,
    staleMs: 7 * 24 * 60 * 60 * 1000,
    log: () => {},
  });
  await feed.refresh();
  currentNow += 25 * 60 * 60 * 1000;
  let body = await (await feed.respond()).json();
  assert.equal(body.status, "stale", "source timestamp age also makes the snapshot stale");

  payload = sourcePayload({ time_last_update_unix: Math.floor((NOW - 60 * 60 * 1000) / 1000) });
  await feed.refresh();
  body = await (await feed.respond()).json();
  assert.equal(body.generatedAt, "2026-10-13T08:00:00.000Z", "older source updates do not replace the snapshot");
  assert.match(body.lastError, /older than the snapshot/);
});

function currentSourcePayload() {
  const now = Math.floor(Date.now() / 1000);
  return sourcePayload({ time_last_update_unix: now, time_next_update_unix: now + 24 * 60 * 60 });
}

test("production server serves /intel/fx.json ahead of the worker and exposes FX_SNAPSHOT_READ", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "fx-feed-server-"));
  let sourceServer;
  let server;
  try {
    const clientRoot = path.join(dir, "dist", "client");
    await mkdir(clientRoot, { recursive: true });
    await writeFile(path.join(clientRoot, "index.html"), "<html></html>");
    sourceServer = createServer((req, res) => {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(currentSourcePayload()));
    });
    await new Promise((resolve) => sourceServer.listen(0, "127.0.0.1", resolve));
    const sourceUrl = `http://127.0.0.1:${sourceServer.address().port}/v6/latest/USD`;
    const workerHits = [];
    server = await createProductionServer({
      appRoot: dir,
      env: { DIST_ROOT: path.join(dir, "dist"), BUILD_ID: "3.0-test-build", FX_REFRESH: "on", FX_SOURCE_URL: sourceUrl },
      worker: {
        fetch: async (request, env) => {
          workerHits.push(new URL(request.url).pathname);
          const fx = await env.FX_SNAPSHOT_READ();
          return Response.json({ fxBase: fx?.base, fxVnd: fx?.rates?.VND });
        },
      },
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const res = await fetch(`${base}${FX_JSON_PATH}`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
    const fx = await res.json();
    assert.equal(fx.base, "USD");
    assert.equal(fx.rates.VND, 26300);
    assert.deepEqual(workerHits, [], "the public FX endpoint does not fall through to the Worker");

    const head = await fetch(`${base}${FX_JSON_PATH}`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");

    const page = await (await fetch(`${base}/convert/btc-to-usd`)).json();
    assert.equal(page.fxBase, "USD");
    assert.equal(page.fxVnd, 26300);
    assert.deepEqual(workerHits, ["/convert/btc-to-usd"]);
  } finally {
    if (server?.listening) await new Promise((resolve) => { server.close(resolve); server.closeIdleConnections?.(); });
    if (sourceServer?.listening) await new Promise((resolve) => sourceServer.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
