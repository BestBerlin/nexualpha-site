// Internal QA traffic is labelled and paced (perf diagnosis 2026-10-22).
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { configuredRps, createPacer, internalFetch, internalUserAgent, isLoopbackUrl } from "../scripts/lib/internal-http.mjs";

test("internal UA token is set or appended once", () => {
  assert.equal(internalUserAgent("qa-http-sweep"), "NexuAlpha-internal/qa-http-sweep");
  assert.equal(internalUserAgent("qa-regression", "Mozilla/5.0 X"), "Mozilla/5.0 X NexuAlpha-internal/qa-regression");
  assert.equal(internalUserAgent("x", "A NexuAlpha-internal/y"), "A NexuAlpha-internal/y");
});

test("remote requests are spaced to the configured rate; loopback is not paced", async () => {
  let clock = 0;
  const sleeps = [];
  const wait = createPacer({ rps: 2, now: () => clock, sleep: async (ms) => { sleeps.push(ms); } });
  await Promise.all([wait("https://nexualpha.com/a"), wait("https://nexualpha.com/b"), wait("https://nexualpha.com/c")]);
  assert.deepEqual(sleeps, [500, 1000]);
  await wait("http://127.0.0.1:8080/");
  await wait("http://localhost:5174/");
  assert.equal(sleeps.length, 2);
  assert.ok(isLoopbackUrl("http://[::1]:80/") && !isLoopbackUrl("https://nexualpha.com/"));
  assert.equal(configuredRps({}), 2);
  assert.equal(configuredRps({ NEXUALPHA_INTERNAL_RPS: "0" }), 0);
});

test("internalFetch sends the UA and keeps other headers", async () => {
  let seen;
  const fetch = internalFetch("unit", { pace: async () => {}, fetchImpl: async (_url, init) => { seen = init.headers; return new Response("ok"); } });
  await fetch("https://nexualpha.com/", { headers: { accept: "text/html", "user-agent": "Device" } });
  assert.equal(seen.get("accept"), "text/html");
  assert.equal(seen.get("user-agent"), "Device NexuAlpha-internal/unit");
});

test("site-facing QA scripts use the internal fetch", () => {
  for (const name of ["qa-content-sweep", "qa-l10n-gaps", "qa-crawl", "qa-crosslinks", "qa-http-sweep", "qa-regression", "crawl-link-surface", "production-smoke", "verify-sitemap-vs-pages", "smoke-position-radar"]) {
    const source = readFileSync(new URL(`../scripts/${name}.mjs`, import.meta.url), "utf8");
    assert.match(source, new RegExp(`const fetch = internalFetch\\("${name}"\\);`), name);
  }
});
