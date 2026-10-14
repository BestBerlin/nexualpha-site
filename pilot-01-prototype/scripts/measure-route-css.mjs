#!/usr/bin/env node
// Read-only local Worker/SSR measurement; gzip sizes are reproducible estimates,
// not production transfer measurements. --baseline uses the captured main build.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { JSDOM } from "jsdom";
import { createNewsSsrRenderer } from "../server/news-ssr.mjs";

const baseline = process.argv.includes("--baseline");
const clientRoot = path.resolve("dist/client");
const cssRoot = baseline ? path.resolve("dist/home-lcp-evidence/baseline-client") : clientRoot;
const workerFile = baseline ? "dist/home-lcp-evidence/baseline-worker.js" : "worker/index.js";
const { default: worker } = await import(pathToFileURL(path.resolve(workerFile)).href);
const assets = { async fetch(request) {
  const pathname = new URL(request.url).pathname;
  const root = pathname === "/index.html" || pathname.startsWith("/assets/") ? cssRoot : clientRoot;
  try {
    const body = await readFile(baseline && pathname === "/critical-css.json"
      ? path.resolve("dist/home-lcp-evidence/baseline-critical.json") : path.join(root, pathname));
    return new Response(body, { headers: { "content-type": pathname.endsWith(".json") ? "application/json" : "text/html" } });
  } catch { return new Response("missing", { status: 404 }); }
} };
const env = { ASSETS: assets, NEWS_SSR_RENDER: createNewsSsrRenderer(path.resolve("dist")) };
const rows = [];
for (const pathname of ["/", "/zh-hans", "/exchanges/okx", "/compare/binance-vs-kraken", "/exchanges/okx/app", "/activities/kraken-usdg-challenge", "/flash"]) {
  const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), env);
  if (response.status !== 200) throw new Error(`${pathname}: HTTP ${response.status}`);
  const html = await response.text();
  const dom = new JSDOM(html);
  const document = dom.window.document;
  document.querySelectorAll("noscript").forEach((node) => node.remove());
  const sheets = [...new Set([...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => link.getAttribute("href")))];
  const css = await Promise.all(sheets.map((href) => readFile(path.join(cssRoot, href))));
  const root = document.getElementById("root");
  if (!root?.querySelector("main") || !document.getElementById("nexualpha-prerender-state")) throw new Error(`${pathname}: missing SSR`);
  const inline = document.querySelector('[data-nexualpha-critical="home"]')?.textContent || "";
  rows.push({ pathname, sheets: sheets.length, cssBytes: css.reduce((n, value) => n + value.length, 0),
    cssGzipBytes: css.reduce((n, value) => n + gzipSync(value).length, 0), inlineBytes: Buffer.byteLength(inline), inlineGzipBytes: gzipSync(inline).length,
    totalCssGzipBytes: css.reduce((n, value) => n + gzipSync(value).length, 0) + gzipSync(inline).length,
    ssrSha256: createHash("sha256").update(root.innerHTML).digest("hex") });
  dom.window.close();
}
console.log(JSON.stringify(rows, null, 2));
