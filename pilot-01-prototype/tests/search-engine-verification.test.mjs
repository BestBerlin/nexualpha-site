// Search-engine ownership files must be served as static files, not routed as pages (live 404, 2026-10-10).
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import sitesWorker from "../worker/index.js";

const files = ["google5f573d8163ebe176.html", "yandex_ba7ea80763a6bdf2.html"];

test("verification files exist in public/ and the worker serves them from assets", async () => {
  for (const name of files) {
    assert.ok(existsSync(new URL(`../public/${name}`, import.meta.url)), name);
    const assets = { fetch: async (req) => new Response(`asset ${new URL(req.url).pathname}`, { headers: { "content-type": "text/html" } }) };
    const res = await sitesWorker.fetch(new Request(`https://nexualpha.com/${name}`), { ASSETS: assets });
    assert.equal(res.status, 200, name);
    assert.equal(await res.text(), `asset /${name}`);
  }
  assert.ok(existsSync(new URL("../public/BingSiteAuth.xml", import.meta.url)));
});

test("other .html paths keep page routing (unknown page stays 404)", async () => {
  const assets = { fetch: async () => new Response("<!doctype html><html><head><title>x</title></head><body><div id=\"root\"></div></body></html>", { headers: { "content-type": "text/html" } }) };
  const res = await sitesWorker.fetch(new Request("https://nexualpha.com/googleXYZ.html", { headers: { accept: "text/html" } }), { ASSETS: assets });
  assert.equal(res.status, 404);
});
