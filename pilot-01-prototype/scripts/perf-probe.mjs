#!/usr/bin/env node
// Reproducible page-weight and timing probe (perf lane, 2026-10-11).
//
//   node scripts/perf-probe.mjs https://nexualpha.com --out /path/to/result.json
//   node scripts/perf-probe.mjs http://127.0.0.1:8080 --runs 3 --widths 390,1440 --pages /,/exchanges
//
// For every page x viewport it opens a fresh browser context (cold load, HTTP cache disabled through CDP), measures
// transferred bytes per resource type (encoded body size as sent over the wire; gzip estimate when the server did not
// compress text), TTFB, DOMContentLoaded, load, LCP
// (PerformanceObserver, buffered), CLS (layout-shift entries without recent input) and whether the app hydrated, then
// reports the median of N runs. The per-request list of the first run is kept so chunk lists can be diffed.
//
// Playwright for Node is not a project dependency. The probe resolves it from PERF_PROBE_NODE_MODULES (a directory that
// contains node_modules/playwright) or from the normal resolution path. Browsers come from the Playwright cache.
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const DEFAULT_PAGES = ["/", "/exchanges", "/exchanges/okx", "/compare/binance-vs-okx", "/news", "/liquidations"];
const DEFAULT_WIDTHS = [390, 1440];
const TYPES = ["document", "script", "stylesheet", "image", "font", "fetch", "other"];

function parseArgs(argv) {
  const args = { runs: 3, widths: DEFAULT_WIDTHS, pages: DEFAULT_PAGES, settle: 6000, out: null, label: null, headless: true };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[++i];
    if (arg === "--runs") args.runs = Math.max(1, Number.parseInt(next(), 10) || 3);
    else if (arg === "--widths") args.widths = next().split(",").map((w) => Number.parseInt(w, 10)).filter(Boolean);
    else if (arg === "--pages") args.pages = next().split(",").map((p) => p.trim()).filter(Boolean);
    else if (arg === "--settle") args.settle = Math.max(0, Number.parseInt(next(), 10) || 0);
    else if (arg === "--out") args.out = next();
    else if (arg === "--label") args.label = next();
    else if (arg === "--headed") args.headless = false;
    else if (arg.startsWith("--")) throw new Error(`Unknown option ${arg}`);
    else positional.push(arg);
  }
  if (!positional[0]) throw new Error("Usage: node scripts/perf-probe.mjs <baseUrl> [--out file.json] [--runs 3] [--widths 390,1440] [--pages /,/exchanges] [--settle 6000]");
  args.base = positional[0].replace(/\/+$/, "");
  return args;
}

function loadPlaywright() {
  const dir = process.env.PERF_PROBE_NODE_MODULES;
  const requireFrom = createRequire(dir ? path.join(path.resolve(dir), "package.json") : import.meta.url);
  try {
    return requireFrom("playwright");
  } catch (error) {
    throw new Error(`Playwright for Node was not found (${error.message}). Install it in a tools directory and point PERF_PROBE_NODE_MODULES at that directory.`);
  }
}

const INIT_SCRIPT = `(() => {
  const perf = { lcp: 0, cls: 0, lcpElement: "" };
  window.__nexualphaPerf = perf;
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        perf.lcp = Math.max(perf.lcp, entry.startTime);
        const el = entry.element;
        if (el) perf.lcpElement = (el.tagName || "").toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.split(/\\s+/).filter(Boolean).slice(0, 2).join(".") : "");
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) perf.cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}
})();`;

function classify(resourceType, url) {
  if (resourceType === "document") return "document";
  if (resourceType === "script") return "script";
  if (resourceType === "stylesheet") return "stylesheet";
  if (resourceType === "image") return "image";
  if (resourceType === "font") return "font";
  if (resourceType === "fetch" || resourceType === "xhr") return "fetch";
  if (/\.(?:m?js)(?:\?|$)/.test(url)) return "script";
  if (/\.css(?:\?|$)/.test(url)) return "stylesheet";
  if (/\.(?:png|jpe?g|webp|avif|gif|svg|ico)(?:\?|$)/i.test(url)) return "image";
  if (/\.(?:woff2?|ttf|otf)(?:\?|$)/i.test(url)) return "font";
  return "other";
}

function contextOptions(width) {
  if (width < 768) {
    return {
      viewport: { width, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
    };
  }
  return { viewport: { width, height: width < 1024 ? 1024 : 900 }, deviceScaleFactor: 1 };
}

async function measure(browser, url, width, settle) {
  const context = await browser.newContext({ ...contextOptions(width), locale: "en-US", serviceWorkers: "block" });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.addInitScript(INIT_SCRIPT);
  const requests = [];
  const pending = [];
  const started = Date.now();
  page.on("requestfinished", (request) => {
    pending.push((async () => {
      try {
        const sizes = await request.sizes();
        const response = await request.response();
        const type = classify(request.resourceType(), request.url());
        let bytes = sizes.responseBodySize;
        let rawBytes = null;
        let encoding = response?.headers()?.["content-encoding"] || null;
        // A bare `node server.mjs` (local before/after runs) serves text uncompressed while production nginx gzips it.
        // Estimate the wire size of uncompressed text so local and production numbers stay comparable.
        if (response && !encoding && ["document", "script", "stylesheet", "fetch"].includes(type) && response.status() === 200) {
          try {
            const body = await response.body();
            rawBytes = body.length;
            bytes = gzipSync(body, { level: 6 }).length;
            encoding = "gzip-estimate";
          } catch { /* body not available (e.g. redirect) */ }
        }
        requests.push({
          url: request.url(), type, status: response?.status() ?? null,
          bytes, rawBytes, encoding, headerBytes: sizes.responseHeadersSize, finishedAt: Date.now() - started,
        });
      } catch { /* request detached before sizes were available */ }
    })());
  });
  let status = null;
  let error = null;
  try {
    const response = await page.goto(url, { waitUntil: "load", timeout: 60000 });
    status = response?.status() ?? null;
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    if (settle) await page.waitForTimeout(settle);
  } catch (caught) {
    error = caught?.message || String(caught);
  }
  await Promise.allSettled(pending);
  let timing = null;
  if (!error) {
    timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const paint = Object.fromEntries(performance.getEntriesByType("paint").map((entry) => [entry.name, entry.startTime]));
      const perf = window.__nexualphaPerf || { lcp: 0, cls: 0 };
      return {
        ttfb: nav ? nav.responseStart : null,
        responseEnd: nav ? nav.responseEnd : null,
        dcl: nav ? nav.domContentLoadedEventEnd : null,
        load: nav ? nav.loadEventEnd : null,
        fcp: paint["first-contentful-paint"] ?? null,
        lcp: perf.lcp || null,
        lcpElement: perf.lcpElement || null,
        cls: Math.round((perf.cls || 0) * 10000) / 10000,
        hydrated: document.documentElement.dataset.nexualphaHydrated === "true",
        deferredHydration: Boolean(document.querySelector("script[data-nexualpha-deferred-hydration]")),
        htmlBytes: document.documentElement.outerHTML.length,
      };
    }).catch(() => null);
  }
  await context.close();
  const bytes = Object.fromEntries(TYPES.map((type) => [type, 0]));
  const counts = Object.fromEntries(TYPES.map((type) => [type, 0]));
  for (const request of requests) {
    bytes[request.type] += request.bytes || 0;
    counts[request.type] += 1;
  }
  const total = Object.values(bytes).reduce((sum, value) => sum + value, 0);
  // Bytes that had arrived by the load event (the deferred-hydration bridge imports the app after first paint + idle,
  // so "at load" and "settled" differ on prerendered routes).
  const loadAt = timing?.load ?? null;
  const scriptAtLoad = loadAt == null ? null : requests.filter((r) => r.type === "script" && r.finishedAt <= loadAt + 50).reduce((sum, r) => sum + (r.bytes || 0), 0);
  return { url, width, status, error, wallMs: Date.now() - started, ...(timing || {}), bytes: { ...bytes, total, scriptAtLoad }, counts, requests };
}

function median(values) {
  const sorted = values.filter((value) => typeof value === "number" && Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function summarize(runs) {
  const pick = (fn) => median(runs.map(fn));
  return {
    ttfb: pick((run) => run.ttfb), dcl: pick((run) => run.dcl), load: pick((run) => run.load), fcp: pick((run) => run.fcp),
    lcp: pick((run) => run.lcp), cls: pick((run) => run.cls), wallMs: pick((run) => run.wallMs),
    bytes: Object.fromEntries([...TYPES, "total", "scriptAtLoad"].map((type) => [type, pick((run) => run.bytes?.[type])])),
    requests: pick((run) => run.requests?.length),
    hydrated: runs.every((run) => run.hydrated === true),
    status: runs[0]?.status ?? null,
  };
}

const kb = (bytes) => (bytes == null ? "–" : `${(bytes / 1024).toFixed(0)} KB`);
const ms = (value) => (value == null ? "–" : `${Math.round(value)} ms`);

export function markdownTable(result) {
  const lines = [
    "| Page | Width | JS (settled) | JS at load | CSS | Img | Total | TTFB | DCL | LCP | CLS |",
    "|---|---|---|---|---|---|---|---|---|---|---|",
  ];
  for (const page of result.pages) {
    const m = page.median;
    lines.push(`| ${page.path} | ${page.width} | ${kb(m.bytes.script)} | ${kb(m.bytes.scriptAtLoad)} | ${kb(m.bytes.stylesheet)} | ${kb(m.bytes.image)} | ${kb(m.bytes.total)} | ${ms(m.ttfb)} | ${ms(m.dcl)} | ${ms(m.lcp)} | ${m.cls ?? "–"} |`);
  }
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ headless: args.headless });
  const result = {
    target: args.base, label: args.label, generatedAt: new Date().toISOString(), runs: args.runs, widths: args.widths,
    settleMs: args.settle, cacheDisabled: true, pages: [],
  };
  try {
    for (const pagePath of args.pages) {
      for (const width of args.widths) {
        const runs = [];
        for (let i = 0; i < args.runs; i += 1) {
          const run = await measure(browser, `${args.base}${pagePath}`, width, args.settle);
          runs.push(run);
          process.stderr.write(`${pagePath} @${width} run ${i + 1}/${args.runs}: status ${run.status} js ${kb(run.bytes.script)} css ${kb(run.bytes.stylesheet)} ttfb ${ms(run.ttfb)} dcl ${ms(run.dcl)} lcp ${ms(run.lcp)}${run.error ? ` error ${run.error}` : ""}\n`);
        }
        const requests = runs[0].requests.map(({ url, type, status, bytes, rawBytes, encoding }) => ({ url, type, status, bytes, rawBytes, encoding })).sort((a, b) => b.bytes - a.bytes);
        result.pages.push({
          path: pagePath, width, median: summarize(runs),
          runs: runs.map(({ requests: _requests, ...rest }) => rest),
          requests,
        });
      }
    }
  } finally {
    await browser.close();
  }
  const table = markdownTable(result);
  process.stdout.write(`${table}\n`);
  if (args.out) {
    await mkdir(path.dirname(path.resolve(args.out)), { recursive: true });
    await writeFile(args.out, `${JSON.stringify(result, null, 2)}\n`);
    process.stderr.write(`wrote ${args.out}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  });
}
