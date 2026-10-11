#!/usr/bin/env node
// Mobile lab harness (scorecard T4, mobile-perf lane 2026-10-11).
//
//   node scripts/mobile-lab.mjs https://nexualpha.com --out before.json
//   node scripts/mobile-lab.mjs http://127.0.0.1:8080 --runs 5 --pages /,/exchanges --compare before.json
//   node scripts/mobile-lab.mjs https://127.0.0.1:8443 --insecure   (local HTTP/2 proxy with a self-signed certificate)
//
// Lighthouse-equivalent mobile conditions, reproduced with Playwright Chromium + CDP:
//   - Moto G-class device: 390x844 viewport, DPR 2, touch, Android Chrome user agent
//   - CPU: 4x slowdown (Emulation.setCPUThrottlingRate)
//   - Network: Lighthouse "Fast 3G"/slow-4G (Network.emulateNetworkConditions): 562.5 ms request latency,
//     1.6 Mbps down, 750 kbps up (Lighthouse's 1024-based Kbps)
//   - Cold cache: a fresh browser context per run, HTTP cache disabled, service workers blocked
// Every page is loaded N times (default 5) and the report keeps the median of each metric:
//   LCP, FCP (paint timing), CLS (layout-shift entries without recent input), TBT (sum over long tasks of the part
//   beyond 50 ms that falls between FCP and load + 5 s), transferred bytes (CDP encodedDataLength, headers included)
//   and request count.
//
// Playwright for Node is not a project dependency. It resolves from MOBILE_LAB_NODE_MODULES (a directory containing
// node_modules/playwright), then PERF_PROBE_NODE_MODULES, then normal resolution. Browsers come from the Playwright cache.
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const DEFAULT_PAGES = Object.freeze([
  "/",
  "/exchanges",
  "/exchanges/okx",
  "/news",
  "/news/binance-vs-bybit-fees-2026-spot-futures-after-rebate",
  "/liquidations",
  "/tr",
  "/vi",
]);

const KBPS = 1024 / 8; // bytes per second per Kbps (Lighthouse convention)
export const CONDITIONS = Object.freeze({
  device: "Moto G-class (390x844, DPR 2)",
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent: "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
  cpuThrottlingRate: 4,
  network: {
    offline: false,
    latency: 562.5,
    downloadThroughput: Math.round(1.6 * 1024 * KBPS),
    uploadThroughput: Math.round(750 * KBPS),
  },
  tbtWindowAfterLoadMs: 5000,
});

export const LONG_TASK_THRESHOLD_MS = 50;

// Total blocking time: for every long task, the part of its duration beyond 50 ms, counted only for the portion of
// the task that lies inside [windowStart, windowEnd] (Lighthouse clips tasks that straddle FCP the same way).
export function totalBlockingTime(tasks, windowStart, windowEnd) {
  if (!Number.isFinite(windowStart) || !Number.isFinite(windowEnd) || windowEnd <= windowStart) return 0;
  let total = 0;
  for (const task of tasks || []) {
    const start = Number(task.startTime);
    const end = start + Number(task.duration);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (end - start <= LONG_TASK_THRESHOLD_MS) continue;
    const clippedStart = Math.max(start, windowStart);
    const clippedEnd = Math.min(end, windowEnd);
    const clipped = clippedEnd - clippedStart;
    if (clipped > LONG_TASK_THRESHOLD_MS) total += clipped - LONG_TASK_THRESHOLD_MS;
  }
  return total;
}

// Cumulative layout shift as Chrome reports it today: the largest session window (shifts < 1 s apart, window <= 5 s).
export function cumulativeLayoutShift(shifts) {
  let best = 0;
  let current = 0;
  let windowStart = -Infinity;
  let previous = -Infinity;
  for (const shift of [...(shifts || [])].filter((s) => !s.hadRecentInput).sort((a, b) => a.startTime - b.startTime)) {
    if (shift.startTime - previous > 1000 || shift.startTime - windowStart > 5000) {
      current = 0;
      windowStart = shift.startTime;
    }
    current += shift.value;
    previous = shift.startTime;
    best = Math.max(best, current);
  }
  return best;
}

export function median(values) {
  const sorted = (values || []).filter((value) => typeof value === "number" && Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export const METRICS = Object.freeze(["lcp", "fcp", "tbt", "cls", "bytes", "requests"]);

export function summarizeRuns(runs) {
  const ok = (runs || []).filter((run) => !run.error);
  const out = {};
  for (const metric of METRICS) out[metric] = median(ok.map((run) => run[metric]));
  out.runs = ok.length;
  return out;
}

// Pure metric extraction from what the page observed (used by the harness and the unit test).
export function metricsFromObservations(observations) {
  const { paints = [], lcpEntries = [], longTasks = [], shifts = [], loadEventEnd = null } = observations || {};
  const fcp = paints.find((p) => p.name === "first-contentful-paint")?.startTime ?? null;
  const lcp = lcpEntries.length ? Math.max(...lcpEntries.map((e) => e.startTime)) : null;
  const windowEnd = Number.isFinite(loadEventEnd) ? loadEventEnd + CONDITIONS.tbtWindowAfterLoadMs : null;
  const tbt = fcp != null && windowEnd != null ? totalBlockingTime(longTasks, fcp, windowEnd) : null;
  return { fcp, lcp, tbt, cls: Math.round(cumulativeLayoutShift(shifts) * 10000) / 10000 };
}

function parseArgs(argv) {
  const args = { runs: 5, pages: [...DEFAULT_PAGES], out: null, compare: null, label: null, headless: true, insecure: false };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[++i];
    if (arg === "--runs") args.runs = Math.max(1, Number.parseInt(next(), 10) || 5);
    else if (arg === "--pages") args.pages = next().split(",").map((p) => p.trim()).filter(Boolean);
    else if (arg === "--out") args.out = next();
    else if (arg === "--compare") args.compare = next();
    else if (arg === "--label") args.label = next();
    else if (arg === "--headed") args.headless = false;
    else if (arg === "--insecure") args.insecure = true;
    else if (arg.startsWith("--")) throw new Error(`Unknown option ${arg}`);
    else positional.push(arg);
  }
  if (!positional[0]) throw new Error("Usage: node scripts/mobile-lab.mjs <baseUrl> [--out file.json] [--runs 5] [--pages /,/news] [--compare before.json]");
  args.base = positional[0].replace(/\/+$/, "");
  return args;
}

function loadPlaywright() {
  const dir = process.env.MOBILE_LAB_NODE_MODULES || process.env.PERF_PROBE_NODE_MODULES;
  const requireFrom = createRequire(dir ? path.join(path.resolve(dir), "package.json") : import.meta.url);
  try {
    return requireFrom("playwright");
  } catch (error) {
    throw new Error(`Playwright for Node was not found (${error.message}). Install it in a tools directory and point MOBILE_LAB_NODE_MODULES at that directory.`);
  }
}

const INIT_SCRIPT = `(() => {
  const o = { lcpEntries: [], longTasks: [], shifts: [], lcpElement: "" };
  window.__mobileLab = o;
  const watch = (type, fn) => { try { new PerformanceObserver((list) => list.getEntries().forEach(fn)).observe({ type, buffered: true }); } catch {} };
  watch("largest-contentful-paint", (e) => {
    o.lcpEntries.push({ startTime: e.startTime, size: e.size });
    const el = e.element;
    if (el) o.lcpElement = (el.tagName || "").toLowerCase() + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\\s+/).slice(0, 2).join(".") : "");
  });
  watch("longtask", (e) => o.longTasks.push({ startTime: e.startTime, duration: e.duration }));
  watch("layout-shift", (e) => o.shifts.push({ startTime: e.startTime, value: e.value, hadRecentInput: e.hadRecentInput,
    sources: (e.sources || []).slice(0, 3).map((s) => s.node ? (s.node.tagName || "#text").toLowerCase() + (typeof s.node.className === "string" && s.node.className ? "." + s.node.className.trim().split(/\\s+/).slice(0, 2).join(".") : "") : "") }));
})();`;

async function measure(browser, url, { insecure = false } = {}) {
  const context = await browser.newContext({
    ignoreHTTPSErrors: insecure,
    viewport: CONDITIONS.viewport,
    deviceScaleFactor: CONDITIONS.deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
    userAgent: CONDITIONS.userAgent,
    locale: "en-US",
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", CONDITIONS.network);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CONDITIONS.cpuThrottlingRate });
  await page.addInitScript(INIT_SCRIPT);
  const requests = new Map();
  cdp.on("Network.requestWillBeSent", (event) => {
    if (/^(data|blob):/.test(event.request.url)) return;
    const previous = requests.get(event.requestId);
    requests.set(event.requestId, { url: event.request.url, type: event.type || previous?.type || "Other", bytes: 0, redirects: (previous?.redirects || 0) + (event.redirectResponse ? 1 : 0) });
  });
  cdp.on("Network.loadingFinished", (event) => {
    const request = requests.get(event.requestId);
    if (request) request.bytes = event.encodedDataLength;
  });
  let status = null;
  let error = null;
  let observations = null;
  const started = Date.now();
  try {
    const response = await page.goto(url, { waitUntil: "load", timeout: 120000 });
    status = response?.status() ?? null;
    await page.waitForTimeout(CONDITIONS.tbtWindowAfterLoadMs + 500);
    observations = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const o = window.__mobileLab || {};
      return {
        paints: performance.getEntriesByType("paint").map((p) => ({ name: p.name, startTime: p.startTime })),
        lcpEntries: o.lcpEntries || [], longTasks: o.longTasks || [], shifts: o.shifts || [], lcpElement: o.lcpElement || "",
        loadEventEnd: nav ? nav.loadEventEnd : null,
        ttfb: nav ? nav.responseStart : null,
        redirectMs: nav ? nav.redirectEnd - nav.redirectStart : 0,
        hydrated: document.documentElement.dataset.nexualphaHydrated === "true",
      };
    });
  } catch (caught) {
    error = caught?.message || String(caught);
  }
  await context.close();
  const list = [...requests.values()];
  const metrics = observations ? metricsFromObservations(observations) : {};
  return {
    url, status, error, wallMs: Date.now() - started,
    ...metrics,
    bytes: list.reduce((sum, r) => sum + (r.bytes || 0), 0),
    requests: list.length,
    bytesByType: list.reduce((acc, r) => ({ ...acc, [r.type]: (acc[r.type] || 0) + (r.bytes || 0) }), {}),
    ttfb: observations?.ttfb ?? null,
    load: observations?.loadEventEnd ?? null,
    redirectMs: observations?.redirectMs ?? 0,
    hydrated: observations?.hydrated ?? false,
    lcpElement: observations?.lcpElement || null,
    longTasks: observations?.longTasks || [],
    shifts: (observations?.shifts || []).filter((s) => s.value >= 0.001),
  };
}

const fmtMs = (v) => (v == null ? "–" : `${Math.round(v)} ms`);
const fmtKb = (v) => (v == null ? "–" : `${Math.round(v / 1024)} KB`);
const fmtCls = (v) => (v == null ? "–" : v.toFixed(3));

export function markdownTable(result) {
  const lines = ["| Page | LCP | FCP | TBT | CLS | Transferred | Requests |", "|---|---|---|---|---|---|---|"];
  for (const page of result.pages) {
    const m = page.median;
    lines.push(`| ${page.path} | ${fmtMs(m.lcp)} | ${fmtMs(m.fcp)} | ${fmtMs(m.tbt)} | ${fmtCls(m.cls)} | ${fmtKb(m.bytes)} | ${m.requests ?? "–"} |`);
  }
  return lines.join("\n");
}

export function compareTable(before, after) {
  const lines = [
    "| Page | LCP before → after | FCP | TBT | CLS | Transferred | Requests |",
    "|---|---|---|---|---|---|---|",
  ];
  const byPath = new Map(before.pages.map((p) => [p.path, p.median]));
  for (const page of after.pages) {
    const b = byPath.get(page.path) || {};
    const a = page.median;
    const pair = (fmt, key) => `${fmt(b[key] ?? null)} → ${fmt(a[key] ?? null)}`;
    lines.push(`| ${page.path} | ${pair(fmtMs, "lcp")} | ${pair(fmtMs, "fcp")} | ${pair(fmtMs, "tbt")} | ${pair(fmtCls, "cls")} | ${pair(fmtKb, "bytes")} | ${b.requests ?? "–"} → ${a.requests ?? "–"} |`);
  }
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ headless: args.headless });
  const result = { target: args.base, label: args.label, generatedAt: new Date().toISOString(), runsPerPage: args.runs, conditions: CONDITIONS, pages: [] };
  try {
    for (const pagePath of args.pages) {
      const runs = [];
      for (let i = 0; i < args.runs; i += 1) {
        const run = await measure(browser, `${args.base}${pagePath}`, { insecure: args.insecure });
        runs.push(run);
        process.stderr.write(`${pagePath} run ${i + 1}/${args.runs}: ${run.status} lcp ${fmtMs(run.lcp)} fcp ${fmtMs(run.fcp)} tbt ${fmtMs(run.tbt)} cls ${fmtCls(run.cls)} ${fmtKb(run.bytes)} ${run.requests} req${run.error ? ` ERROR ${run.error}` : ""}\n`);
      }
      result.pages.push({ path: pagePath, median: summarizeRuns(runs), runs });
    }
  } finally {
    await browser.close();
  }
  process.stdout.write(`${markdownTable(result)}\n`);
  if (args.compare) {
    const before = JSON.parse(await readFile(args.compare, "utf8"));
    process.stdout.write(`\n${compareTable(before, result)}\n`);
  }
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
