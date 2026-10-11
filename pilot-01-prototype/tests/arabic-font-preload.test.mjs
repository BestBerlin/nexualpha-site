// Arabic pages preload the Arabic face next to the Geist preloads (2026-10-11: the late swap re-wrapped the /ar/news
// intro and shifted the page, CLS 0.35 at 768 px). Other locales do not pay for the extra 37 KB.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import worker from "../worker/index.js";

const shell = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };
const page = async (pathname) => (await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: assets })).text();
const PRELOAD = /<link rel="preload" href="\/fonts\/ar-400\.woff2" as="font" type="font\/woff2" crossorigin \/>/g;

test("Arabic pages preload the Arabic font once, right after the Geist preloads", async () => {
  for (const pathname of ["/ar/news", "/ar/about"]) {
    const html = await page(pathname);
    assert.match(html, /<html[^>]*lang="ar"[^>]*dir="rtl"/, pathname);
    assert.equal((html.match(PRELOAD) || []).length, 1, pathname);
    assert.ok(html.indexOf("ar-400.woff2") > html.indexOf("geist-mono-latin.woff2"), pathname);
  }
});

test("non-Arabic pages do not preload the Arabic font", async () => {
  for (const pathname of ["/news", "/zh-hans/news", "/tr/about"]) assert.equal((await page(pathname)).includes("ar-400.woff2"), false, pathname);
});
