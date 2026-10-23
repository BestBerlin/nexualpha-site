#!/usr/bin/env node
// Run against `HOST=127.0.0.1 PORT=4187 WEB_WORKERS=1 node server.mjs`.
// Same ScriptDuration/TaskDuration/LayoutDuration delta and settle as qa-regression.
// Optional CPU sampling runs in a separate window so it cannot inflate the gate.
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";

const options = { base: "http://127.0.0.1:4187", chrome: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", widths: [1440], profile: false };
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === "--profile") options.profile = true;
  else if (["--base", "--chrome", "--out", "--widths"].includes(arg)) options[arg.slice(2)] = process.argv[++i];
  else throw new Error(`unknown option ${arg}`);
}
if (typeof options.widths === "string") options.widths = options.widths.split(",").map(Number);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const windowMs = 10000;
const round = n => Math.round(n * 10) / 10;
async function measure(page) {
  const a = await page.metrics();
  await sleep(windowMs);
  const b = await page.metrics();
  const per5s = key => round((((b[key] ?? 0) - (a[key] ?? 0)) * 1000) / (windowMs / 5000));
  return { windowMs, scriptMsPer5s: per5s("ScriptDuration"), taskMsPer5s: per5s("TaskDuration"), layoutMsPer5s: per5s("LayoutDuration") };
}
async function settle(page) {
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => {});
  await page.waitForFunction(() => {
    const screen = document.querySelector(".hx-stage[data-demo]");
    return !screen || screen.dataset.demo === "done" || screen.dataset.demo === "off";
  }, { timeout: 30000, polling: 500 }).catch(() => {});
  await page.evaluate(() => new Promise(resolve => {
    const frames = () => requestAnimationFrame(() => requestAnimationFrame(resolve));
    if (typeof requestIdleCallback === "function") requestIdleCallback(frames, { timeout: 3000 }); else setTimeout(frames, 200);
  }));
}
let browser;
try {
  const puppeteer = createRequire("/Users/bestberlin/.codex/shared-tools/web-quality/package.json")("puppeteer-core");
  browser = await puppeteer.launch({ executablePath: options.chrome, headless: true });
  const results = [];
  for (const path of ["/", "/zh-hans", "/tr"]) for (const width of options.widths) {
    const page = await browser.newPage();
    try {
      await page.setViewport({ width, height: 900 });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.evaluateOnNewDocument(() => {
        window.__idleCls = 0;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__idleCls += entry.value;
        }).observe({ type: "layout-shift", buffered: true });
      });
      const response = await page.goto(new URL(path, options.base).href, { waitUntil: "domcontentloaded" });
      if (!response?.ok()) throw new Error(`HTTP ${response?.status()}`);
      await settle(page);
      const first = await measure(page);
      let idle = first;
      if (idle.scriptMsPer5s > 20) { await sleep(5000); idle = await measure(page); }
      const row = { path, width, first, idle, cls: await page.evaluate(() => window.__idleCls), errors };
      if (options.profile) {
        const cdp = await page.createCDPSession();
        await cdp.send("Profiler.enable");
        await cdp.send("Profiler.setSamplingInterval", { interval: 1000 });
        await cdp.send("Profiler.start"); await sleep(windowMs);
        const { profile } = await cdp.send("Profiler.stop");
        const nodes = new Map(profile.nodes.map(node => [node.id, node.callFrame]));
        const totals = new Map();
        profile.samples?.forEach((id, index) => {
          const frame = nodes.get(id);
          const name = `${frame.functionName || "anonymous"} (${frame.url || "native"}:${frame.lineNumber})`;
          totals.set(name, (totals.get(name) || 0) + (profile.timeDeltas[index] || 0) / 1000 / (windowMs / 5000));
        });
        row.profileSamplesMsPer5s = [...totals].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([frame, ms]) => ({ frame, ms: round(ms) }));
        await cdp.detach();
      }
      results.push(row);
    } finally { await page.close(); }
  }
  const result = { method: "qa-regression page.metrics delta over 10 s normalized to 5 s", results };
  if (options.out) await writeFile(options.out, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = results.every(row => row.idle.scriptMsPer5s <= 20 && !row.errors.length) ? 0 : 1;
} catch (error) {
  console.error(error.message); process.exitCode = 2;
} finally { await browser?.close(); }
