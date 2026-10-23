import assert from "node:assert/strict";
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import test, { after, before, describe } from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { loopbackListenSkip } from "./helpers/environment.mjs";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDir = join(projectRoot, "dist", "client");
const sharedPackage = "/Users/bestberlin/.codex/shared-tools/web-quality/package.json";
const chromePath = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean).find(existsSync);
const buildSkip = !existsSync(join(distDir, "prerender", "en", "home.json")) && "requires npm run build";
const browserSkip = buildSkip || (!chromePath && "requires Chrome or CHROME_PATH") || (!existsSync(sharedPackage) && "requires shared puppeteer-core") || await loopbackListenSkip();
const locales = ["zh-Hans", "zh-Hant", "en", "ar"];
const widths = [390, 1440];
const mimeTypes = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2" };
let server, browser, baseUrl, userDataDir;

// Keep browser selectors tied to the current SSR model even when the runner cannot launch a local web server.
test("layout targets exist in current commercial and neutral SSR homes", { skip: buildSkip }, () => {
  for (const locale of locales) {
    const { html } = JSON.parse(readFileSync(join(distDir, "prerender", locale, "home.json"), "utf8"));
    const dom = new JSDOM(html);
    try {
      const doc = dom.window.document;
      for (const selector of [".h7-hero", ".h7-hc", "#h7-whales", ".h7-calc", ".h7-xr .h7-xn b", "footer"]) assert.ok(doc.querySelector(selector), `${locale}: ${selector}`);
      if (["zh-Hant", "ar"].includes(locale)) {
        assert.ok(doc.querySelector(".nh-board .nh-money[dir=ltr]"), locale);
        assert.equal(doc.querySelector(".hx-hero-panel, .hx-stage"), null, locale);
      } else {
        assert.ok(doc.querySelector(".hx-hero-panel"), locale);
        assert.ok(doc.querySelector(".hx-stage"), locale);
      }
    } finally { dom.window.close(); }
  }
});

async function sendStatic(response, pathname) {
  const target = resolve(distDir, `.${pathname === "/" ? "/index.html" : decodeURIComponent(pathname)}`);
  const fallback = join(distDir, "index.html");
  const file = target.startsWith(`${distDir}/`) ? await stat(target).then(s => s.isFile() ? target : fallback).catch(() => fallback) : fallback;
  response.writeHead(200, { "content-type": mimeTypes[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
  response.end(await readFile(file));
}

async function openHome(locale, width, rootFontSize) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/?locale=${encodeURIComponent(locale)}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".h7-hero", { timeout: 10000 });
  if (rootFontSize) await page.evaluate(size => { document.documentElement.style.fontSize = size; }, rootFontSize);
  // Load deferred home sections before measuring their real text and geometry.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 675) { scrollTo(0, y); await new Promise(resolve => setTimeout(resolve, 30)); }
    await document.fonts.ready;
    scrollTo(0, 0);
  });
  await page.waitForSelector(".h7-calc .h7-xr");
  return page;
}

async function geometry(page) {
  return page.evaluate(() => {
    const rect = selector => { const element = document.querySelector(selector); if (!element) return null; const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top + scrollY, bottom: r.bottom + scrollY, width: r.width, height: r.height }; };
    return { hero: rect(".h7-hero"), panel: rect(".hx-hero-panel"), stage: rect(".hx-stage"), copy: rect(".h7-hc"), whales: rect("#h7-whales"), calculator: rect(".h7-calc"), footer: rect("footer"), scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth };
  });
}

function noOverflow(layout, label) {
  assert.equal(layout.scrollWidth, layout.clientWidth, `${label}: no horizontal page overflow`);
  for (const key of ["hero", "whales", "calculator", "footer"]) assert.ok(layout[key]?.width > 0 && layout[key]?.height > 0, `${label}: ${key} is visible`);
}

describe("current homepage browser geometry", () => {
  before(async () => {
    if (browserSkip) return;
    const puppeteer = createRequire(sharedPackage)("puppeteer-core");
    server = createServer((request, response) => {
      const { pathname } = new URL(request.url, "http://127.0.0.1");
      // The absent-feed scenario is explicit; never fabricate market or announcement data for a layout test.
      if (pathname.startsWith("/api/") || pathname.startsWith("/intel/")) { response.writeHead(503, { "content-type": "application/json" }); response.end('{"status":"unavailable"}'); return; }
      sendStatic(response, pathname).catch(error => { response.writeHead(500); response.end(error.message); });
    });
    await new Promise((done, fail) => { server.once("error", fail); server.listen(0, "127.0.0.1", done); });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    userDataDir = await mkdtemp(join(tmpdir(), "nexualpha-home-layout-"));
    browser = await puppeteer.launch({ executablePath: chromePath, headless: "new", userDataDir, args: ["--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-extensions"] });
  });
  after(async () => {
    await browser?.close();
    if (server?.listening) await new Promise(done => server.close(done));
    if (userDataDir) await rm(userDataDir, { recursive: true, force: true });
  });

  test("hero, whale board and calculator keep their hierarchy across locales and widths", { skip: browserSkip }, async () => {
    for (const locale of locales) for (const width of widths) {
      const page = await openHome(locale, width);
      try {
        const layout = await geometry(page);
        noOverflow(layout, `${locale}/${width}`);
        assert.ok(layout.whales.top >= layout.hero.bottom - 1, "whale board follows the hero");
        assert.ok(layout.calculator.top >= layout.whales.bottom - 1, "calculator follows the whale board");
        assert.ok(layout.footer.top >= layout.calculator.bottom - 1, "footer follows the calculator");
      } finally { await page.close(); }
    }
  });

  test("commercial hero copy, calculator panel and globe stay inside the hero at Chinese breakpoints", { skip: browserSkip }, async () => {
    for (const width of [390, 1024, 1440]) {
      const page = await openHome("zh-Hans", width);
      try {
        const layout = await geometry(page);
        noOverflow(layout, `zh-Hans/${width}`);
        for (const key of ["copy", "panel", "stage"]) {
          assert.ok(layout[key]?.width > 0, key);
          assert.ok(layout[key].left >= layout.hero.left - 1 && layout[key].right <= layout.hero.right + 1, `${key}: hero contains its columns`);
        }
        assert.ok(layout.panel.right <= layout.stage.left + 1 || layout.stage.right <= layout.panel.left + 1 || layout.panel.bottom <= layout.stage.top + 1 || layout.stage.bottom <= layout.panel.top + 1, "panel and globe do not overlap");
      } finally { await page.close(); }
    }
  });

  test("unavailable live feeds leave a usable calculator and footer without an invented sentiment block", { skip: browserSkip }, async () => {
    for (const width of widths) {
      const page = await openHome("en", width);
      try {
        noOverflow(await geometry(page), `unavailable/${width}`);
        assert.equal(await page.$(".crypto-sentiment, .live-market-signal"), null, "retired sentiment bridge is absent");
        assert.equal(await page.$$eval("#h7-whales .h7-wh-list li", rows => rows.length), 0, "missing whale feed never invents rows");
      } finally { await page.close(); }
    }
  });

  test("English mobile calculator venue names remain visible without clipping", { skip: browserSkip }, async () => {
    for (const width of [320, 390]) {
      const page = await openHome("en", width);
      try {
        noOverflow(await geometry(page), `en/${width}`);
        const evidence = await page.$$eval(".h7-xr .h7-xn b", nodes => ({ count: nodes.length, clipped: nodes.filter(node => {
          const text = node.getBoundingClientRect(), cell = node.parentElement.getBoundingClientRect();
          return text.width <= 0 || text.height <= 0 || text.left < cell.left - 1 || text.right > cell.right + 1 || text.bottom > cell.bottom + 1;
        }).map(node => node.textContent) }));
        assert.ok(evidence.count > 0, "actual venue labels are measured");
        assert.deepEqual(evidence.clipped, [], `${width}: venue labels do not clip`);
      } finally { await page.close(); }
    }
  });

  test("Chinese homes remain readable at 320px with enlarged root text", { skip: browserSkip }, async () => {
    for (const locale of ["zh-Hans", "zh-Hant"]) {
      const page = await openHome(locale, 320, "32px");
      try {
        noOverflow(await geometry(page), `${locale}/enlarged`);
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize), "32px");
        const heading = await page.$eval(".h7-hero h1", node => {
          const style = getComputedStyle(node);
          return { text: node.textContent.trim(), client: node.clientHeight, scroll: node.scrollHeight, fontSize: style.fontSize, lineHeight: style.lineHeight, overflowY: style.overflowY };
        });
        assert.ok(heading.text);
        assert.ok(heading.scroll <= heading.client + 1, `${locale}: enlarged headline is not vertically clipped: ${JSON.stringify(heading)}`);
      } finally { await page.close(); }
    }
  });

  test("Arabic market figures use explicit left-to-right isolation", { skip: browserSkip }, async () => {
    const page = await openHome("ar", 1440);
    try {
      const evidence = await page.$$eval(".nh-money, .nh-venue bdi, .nh-chip bdi", nodes => ({ count: nodes.length, bad: nodes.filter(node => node.dir !== "ltr" || getComputedStyle(node).direction !== "ltr" || !["isolate", "plaintext", "embed"].includes(getComputedStyle(node).unicodeBidi)).map(node => node.textContent) }));
      assert.ok(evidence.count > 0, "actual neutral-market figures are measured");
      assert.deepEqual(evidence.bad, []);
    } finally { await page.close(); }
  });

  test("neutral Chinese hero retains the fee board and calculator instead of a commercial panel", { skip: browserSkip }, async () => {
    const page = await openHome("zh-Hant", 390);
    try {
      noOverflow(await geometry(page), "zh-Hant/neutral");
      assert.ok(await page.$(".nh-board .nh-money"));
      assert.equal(await page.$(".hx-hero-panel, .hx-stage, .hx-go"), null);
      assert.ok(await page.$(".h7-calc .h7-xr"));
    } finally { await page.close(); }
  });
});
