// Deposit SSR marker (2026-10-19): the worker accepted the request-time render only when it contained `class="nxd "`
// (trailing space), but DepositPages renders `<main className="nxd" ...>`, so every deposit page logged "deposit SSR
// returned no page body" and fell back. These tests render deposit pages through the real worker path and assert the
// SSR body is served.
import assert from "node:assert/strict";
import test from "node:test";
import worker, { isDepositPageBody } from "../worker/index.js";
import { createSsrHarness, SHELL_HTML } from "./helpers/ssr-hydration-harness.mjs";

const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

async function fetchDeposit(path) {
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => { errors.push(args.map(String).join(" ")); };
  try {
    const env = { ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) };
    const response = await worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), env);
    return { response, body: await response.text(), errors };
  } finally {
    console.error = originalError;
  }
}

test("deposit marker matches the nxd class token wherever it sits on the deposit <main>", () => {
  assert.ok(isDepositPageBody('<main class="nxd" id="top" lang="en" dir="ltr" data-deposit-page="hub">'));
  assert.ok(isDepositPageBody('<main id="top" class="v6 nxd nxd--wide" data-deposit-page="country" data-deposit-country="brazil">'));
  assert.ok(!isDepositPageBody('<main class="v6 v2-page v3-page nxd nxd--funding" id="top">'), "data pages share nxd but are not deposit pages");
  assert.ok(!isDepositPageBody('<main class="nxd-stat" data-deposit-page="hub">'), "nxd-* is a different class");
  assert.ok(!isDepositPageBody('<div id="root"></div>'));
});

for (const [path, page] of [["/deposit", "hub"], ["/deposit/brazil", "country"], ["/pt-br/depositar/brazil", "country"], ["/crypto-cards", "cards"]]) {
  test(`worker serves the request-time deposit SSR body for ${path}`, async () => {
    const { response, body, errors } = await fetchDeposit(path);
    assert.equal(response.status, 200, path);
    assert.match(body, new RegExp(`<div id="root">[\\s\\S]*<main class="nxd"[^>]*data-deposit-page="${page}"`), `${path}: SSR body injected into the shell`);
    assert.deepEqual(errors.filter((line) => /deposit SSR/.test(line)), [], `${path}: no deposit SSR fallback logged`);
  });
}
