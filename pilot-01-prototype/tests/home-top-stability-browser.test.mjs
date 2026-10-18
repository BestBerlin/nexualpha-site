// Top-of-home stability (owner 2026-10-18: "首页最上方…轻微的抖动…字体与其他字体相撞冒出来").
// Causes found on production: (1) the section after the logo strip starts inside the first viewport but was not in
// the critical CSS, so it reflowed 200+ px when deferred CSS landed (phone CLS 0.026–0.043); (2) Geist swapped in
// 0.8–3.4 s after first paint and moved the ticker track. This test locks both out over the built SSR site:
//   a) first-screen block geometry with deferred stylesheets blocked == geometry with all CSS (critical CSS is complete);
//   b) cold-load CLS above the fold < 0.02;
//   c) header, ticker and hero headline never overlap.
// Real Chrome over server/local-sites-preview.mjs on dist. Skips when there is no build.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const hasBuild = existsSync(join(projectRoot, "dist", "client", "prerender-manifest.json"));
const chromePath = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean).find((candidate) => existsSync(candidate));
const sharedPackage = "/Users/bestberlin/.codex/shared-tools/web-quality/package.json";
const skip = !hasBuild ? "no dist build" : !chromePath ? "no Chrome" : !existsSync(sharedPackage) ? "no puppeteer-core" : false;

const PAGES = { en: "/", "zh-Hans": "/zh-hans" };
const DESKTOP_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const VIEWPORTS = [
  { width: 1440, height: 900, ua: DESKTOP_UA },
  { width: 1280, height: 800, ua: DESKTOP_UA },
  { width: 390, height: 844, ua: IPHONE_UA, mobile: true },
  { width: 360, height: 780, ua: IPHONE_UA, mobile: true },
  { width: 344, height: 760, ua: IPHONE_UA, mobile: true },
];

let child, browser, base;
const freePort = () => new Promise((done, fail) => { const srv = createServer(); srv.once("error", fail); srv.listen(0, "127.0.0.1", () => { const { port } = srv.address(); srv.close(() => done(port)); }); });

before(async () => {
  if (skip) return;
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ["server/local-sites-preview.mjs"], { cwd: projectRoot, env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" }, stdio: "ignore" });
  for (let i = 0; i < 80; i += 1) {
    const ok = await fetch(`${base}/zh-hans`).then((r) => r.ok).catch(() => false);
    if (ok) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  const puppeteer = createRequire(sharedPackage)("puppeteer-core");
  browser = await puppeteer.launch({ executablePath: chromePath, headless: "new" });
});

after(async () => {
  await browser?.close();
  child?.kill();
});

// Blocks that start inside the first viewport: shell children and the home sections, keyed by structural path.
const measureFirstScreen = () => {
  const out = {};
  const hero = document.querySelector(".h7-hero");
  const blocks = [...document.querySelectorAll("body > *, #root > *, #root > * > *, main > *, .h7 > *, .h7-hero > *")];
  for (const el of blocks) {
    const box = el.getBoundingClientRect();
    if (box.height === 0 || box.top >= innerHeight || getComputedStyle(el).position === "fixed") continue;
    const key = [];
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      key.unshift(`${node.tagName.toLowerCase()}${node.classList[0] ? `.${node.classList[0]}` : ""}:${[...(node.parentElement?.children || [])].indexOf(node)}`);
    }
    // Page wrappers around the hero span the whole document and grow with below-fold CSS; only their top must hold.
    // Every other block that starts in the first screen (hero, strip, the next section) must keep its full height.
    const wrapper = el !== hero && hero && el.contains(hero);
    out[key.join(">")] = { top: Math.round(box.top), height: wrapper ? null : Math.round(box.height) };
  }
  return out;
};

async function openCold(viewport, path, { blockDeferredCss = false } = {}) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setUserAgent(viewport.ua);
  await page.setViewport({ width: viewport.width, height: viewport.height, isMobile: Boolean(viewport.mobile), hasTouch: Boolean(viewport.mobile) });
  await page.setCacheEnabled(false);
  if (blockDeferredCss) {
    await page.setRequestInterception(true);
    page.on("request", (request) => (request.resourceType() === "stylesheet" ? request.abort() : request.continue()));
  }
  await page.evaluateOnNewDocument(() => {
    window.__shifts = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        const sources = (entry.sources || []).map((s) => (s.node?.className && String(s.node.className).slice(0, 40)) || s.node?.nodeName || "?");
        window.__shifts.push({ value: entry.value, sources });
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(`${base}${path}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 600));
  return { page, context };
}

test("first-screen geometry is final in critical CSS, CLS < 0.02, header/ticker/headline never overlap", { skip, timeout: 240_000 }, async () => {
  const problems = [];
  for (const viewport of VIEWPORTS) {
    for (const [locale, path] of Object.entries(PAGES)) {
      const tag = `${locale} @${viewport.width}`;
      const critical = await openCold(viewport, path, { blockDeferredCss: true });
      const before = await critical.page.evaluate(measureFirstScreen);
      await critical.context.close();

      const full = await openCold(viewport, path);
      const afterGeometry = await full.page.evaluate(measureFirstScreen);
      const { cls, worst, overlaps } = await full.page.evaluate(() => {
        const shifts = window.__shifts || [];
        const worstShift = shifts.slice().sort((a, b) => b.value - a.value)[0];
        const rect = (selector) => {
          const el = document.querySelector(selector);
          const box = el?.getBoundingClientRect();
          return box && box.height > 0 ? { selector, top: box.top, bottom: box.bottom } : null;
        };
        const stack = [rect(".nx-header") || rect("header"), rect(".nx-ticker"), rect(".h7 h1") || rect("main h1")].filter(Boolean);
        const hits = [];
        for (let i = 0; i < stack.length; i += 1) {
          for (let j = i + 1; j < stack.length; j += 1) {
            const a = stack[i], b = stack[j];
            const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (overlap > 0.5) hits.push(`${a.selector} ∩ ${b.selector} = ${Math.round(overlap)}px`);
          }
        }
        return { cls: shifts.reduce((sum, s) => sum + s.value, 0), worst: worstShift, overlaps: hits };
      });
      await full.context.close();

      for (const [key, box] of Object.entries(afterGeometry)) {
        const was = before[key];
        if (!was) continue; // only blocks present in both runs (deferred-only widgets may be absent without their CSS)
        const heightMoved = was.height !== null && box.height !== null && Math.abs(was.height - box.height) > 1;
        if (Math.abs(was.top - box.top) > 1 || heightMoved) {
          problems.push(`${tag}: ${key.split(">").slice(-2).join(">")} critical ${was.top}/${was.height} → full ${box.top}/${box.height}`);
        }
      }
      if (cls >= 0.02) problems.push(`${tag}: CLS ${cls.toFixed(4)} (worst ${worst?.value.toFixed(4)} from ${worst?.sources.join(",")})`);
      for (const hit of overlaps) problems.push(`${tag}: overlap ${hit}`);
    }
  }
  assert.deepEqual(problems, []);
});
