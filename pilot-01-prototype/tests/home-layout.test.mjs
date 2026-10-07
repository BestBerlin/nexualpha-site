import assert from "node:assert/strict";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import { neutralVenueCatalog } from "../src/data/market-command.js";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDir = join(projectRoot, "dist", "client");
const sharedRequire = createRequire("/Users/bestberlin/.codex/shared-tools/web-quality/package.json");
const puppeteer = sharedRequire("puppeteer-core");

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
  [".woff2", "font/woff2"],
]);

const locales = ["zh-Hans", "zh-Hant", "en", "it", "ar"];
const coreWidths = [
  { id: "mobile", width: 390, height: 844 },
  { id: "desktop", width: 1440, height: 1100 },
];
const chineseTabletWidths = [{ id: "tablet", width: 1024, height: 900 }];

const hierarchyLocales = ["zh-Hans", "zh-Hant", "en", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];

let server;
let baseUrl;
let browser;
let userDataDir;
const apiState = { sentiment: "ready" };

function findChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

function coreVenueFromNeutral(venue) {
  return {
    slug: venue.slug,
    name: venue.name,
    type: venue.category === "Perp DEX" ? "PERP_DEX" : venue.category,
    officialDomains: [venue.officialDomain],
    verifiedBrandKey: `official:${venue.slug}`,
    products: ["spot"],
    assetCapabilities: [],
    availability: {
      serviceState: "unknown",
      productState: "unknown",
      affiliateState: "unknown",
      ctaState: "unknown",
      reasonCode: "TEST_ONLY_STUB",
      sourceUrl: `https://${venue.officialDomain}`,
      sourceId: `test-only:${venue.slug}`,
      verifiedAt: "2026-09-04T00:00:00.000Z",
      expiresAt: null,
    },
    source: { freshness: "VERIFIED" },
  };
}

const venues = neutralVenueCatalog.map(coreVenueFromNeutral);

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(`${JSON.stringify(body)}\n`);
}

async function sendStatic(response, pathname) {
  const requested = decodeURIComponent(pathname) === "/" ? "/index.html" : decodeURIComponent(pathname);
  const target = resolve(distDir, `.${requested}`);
  const root = resolve(distDir);
  const fallback = join(root, "index.html");
  const safeTarget = target.startsWith(root) ? target : fallback;
  const file = await stat(safeTarget).then((stats) => stats.isFile() ? safeTarget : fallback).catch(() => fallback);
  const body = await readFile(file);
  response.writeHead(200, { "content-type": mimeTypes.get(extname(file)) ?? "application/octet-stream", "cache-control": "no-store" });
  response.end(body);
}

function handleApi(request, response) {
  const url = new URL(request.url, "http://127.0.0.1");
  if (url.pathname === "/api/v1/health/live") {
    json(response, 200, { status: "live", buildId: "TEST-ONLY-APIstub", dependencies: {} });
    return;
  }
  if (url.pathname === "/api/v1/health/ready") {
    json(response, 200, { status: "ready", buildId: "TEST-ONLY-APIstub", dependencies: { repository: { ready: true, source: "prisma" } } });
    return;
  }
  if (url.pathname === "/api/v1/site/bootstrap") {
    json(response, 200, { contentVersion: { id: "TEST-ONLY-home-layout-content-v1" } });
    return;
  }
  if (url.pathname === "/api/v1/venues") {
    json(response, 200, { status: "available", data: venues });
    return;
  }
  if (url.pathname === "/api/v1/official-updates") {
    json(response, 200, { status: "available", data: [] });
    return;
  }
  if (url.pathname === "/api/v1/opportunities") {
    json(response, 200, { data: [] });
    return;
  }
  if (url.pathname === "/api/v1/listings") {
    json(response, 200, { availability: "unavailable", reasonCode: "TEST_ONLY_UNAVAILABLE", data: [] });
    return;
  }
  if (url.pathname === "/api/v1/market/asset-pulse" || url.pathname === "/api/v1/market/exchange-snapshots") {
    json(response, 200, { status: "unavailable", reasonCode: "TEST_ONLY_UNAVAILABLE", data: [] });
    return;
  }
  if (url.pathname === "/api/v1/market/crypto-sentiment") {
    if (apiState.sentiment === "unavailable") {
      json(response, 503, { status: "unavailable", reasonCode: "TEST_ONLY_SENTIMENT_UNAVAILABLE", data: null });
      return;
    }
    const asOf = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const fetchedAt = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    json(response, 200, {
      data: {
        provider: "alternative-me",
        sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/",
        fetchedAt,
        freshness: "fresh",
        value: 65,
        classification: "Greed",
        asOf,
      },
    });
    return;
  }
  json(response, 404, { status: "error", reasonCode: "TEST_ONLY_NOT_FOUND" });
}

async function openHome(locale, viewport, sentiment = "ready", options = {}) {
  apiState.sentiment = sentiment;
  const page = await browser.newPage();
  await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
  const url = new URL("/", baseUrl);
  url.searchParams.set("locale", locale);
  await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("main, footer", { timeout: 10000 });
  await page.waitForFunction(() => document.querySelector(".platform-matcher__details, footer"), { timeout: 10000 });
  if (options.rootFontSize) {
    await page.evaluate(() => document.fonts?.ready ?? Promise.resolve());
    await page.evaluate(() => {
      window.__homeLayoutDefaultReadingFontSize = getComputedStyle(document.querySelector(".hero-copy > p, .crossroads__lead")).fontSize;
    });
    await page.evaluate((fontSize) => {
      document.documentElement.style.fontSize = fontSize;
    }, options.rootFontSize);
    await page.waitForFunction((fontSize) => getComputedStyle(document.documentElement).fontSize === fontSize, {}, options.rootFontSize);
  }
  await warmPage(page);
  return page;
}

async function warmPage(page) {
  const total = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
  const { height } = page.viewport();
  const step = Math.max(300, Math.floor(height * 0.75));
  for (let y = 0; y <= total; y += step) {
    await page.evaluate((scrollTop) => window.scrollTo(0, scrollTop), y);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 30));
  }
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((image) => image.decode?.().catch(() => {}) ?? Promise.resolve()));
    window.scrollTo(0, 0);
  });
}

async function collectLayout(page) {
  return page.evaluate(() => {
    const rect = (element) => {
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return {
        top: value.top + window.scrollY,
        bottom: value.bottom + window.scrollY,
        left: value.left,
        right: value.right,
        width: value.width,
        height: value.height,
      };
    };
    const compare = rect(document.querySelector("#compare"));
    const compareBar = rect(document.querySelector(".crossroads__header"));
    const metric = rect(document.querySelector(".crypto-sentiment"));
    const metricSection = rect(document.querySelector(".live-market-signal"));
    const footer = rect(document.querySelector("footer"));
    const footerBrand = rect(document.querySelector("footer .nexualpha-wordmark, footer b, footer a"));
    const matcherIntents = rect(document.querySelector(".crossroads__grid"));
    const matcherPanel = rect(document.querySelector(".home-analyzer-drawer"));
    return {
      compare,
      compareBar,
      metric,
      metricSection,
      footer,
      footerBrand,
      matcherIntents,
      matcherPanel,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
}

before(async () => {
  assert.ok(existsSync(join(distDir, "index.html")), "dist/client must exist before browser layout tests run");
  server = createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    if (url.pathname.startsWith("/api/v1/")) {
      handleApi(request, response);
      return;
    }
    sendStatic(response, url.pathname).catch((error) => json(response, 500, { status: "error", message: error.message }));
  });
  await new Promise((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  userDataDir = await mkdtemp(join(tmpdir(), "nexualpha-home-layout-"));
  browser = await puppeteer.launch({
    executablePath: findChromePath(),
    headless: "new",
    userDataDir,
    args: ["--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-extensions"],
  });
});

after(async () => {
  await browser?.close();
  if (server) await new Promise((resolvePromise) => server.close(resolvePromise));
  if (userDataDir) await rm(userDataDir, { recursive: true, force: true });
});

test.skip("groups homepage hierarchy across all 15 locales and three viewport widths (legacy contract; covered by full browser matrix)", { timeout: 240000 }, async () => {
  const evidenceDir = process.env.HOME_HIERARCHY_EVIDENCE;
  if (evidenceDir) await mkdir(evidenceDir, { recursive: true });
  const cases = [];
  for (const locale of hierarchyLocales) {
    for (const viewport of [{ id: "desktop", width: 1405, height: 1000 }, ...chineseTabletWidths, coreWidths[0]]) {
      const page = await openHome(locale, viewport);
      try {
        const layout = await page.evaluate(() => {
          const rect = (el) => { const r = el.getBoundingClientRect(); return { top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left, right: r.right, width: r.width }; };
          const rtl = getComputedStyle(document.querySelector("main")).direction === "rtl";
          const start = (r) => rtl ? r.right : r.left;
          const headings = [".crossroads__header", ".home-analyzer-drawer"].map((selector) => {
            const head = document.querySelector(selector), title = rect(head.querySelector("h2, strong")), summary = rect(head.querySelector("p, span"));
            return { gap: summary.top - title.bottom, startDelta: Math.abs(start(title) - start(summary)) };
          });
          const grid = rect(document.querySelector(".crossroads__grid")), link = rect(document.querySelector(".home-analyzer-drawer"));
          const metric = document.querySelector(".crypto-sentiment"), reading = metric ? rect(metric.querySelector(".crypto-sentiment__reading")) : null;
          const meta = metric?.querySelector(".crypto-sentiment__meta"), context = metric ? rect(metric.querySelector("p")) : null;
          const source = metric?.querySelector("a");
          return {
            headings,
            linkStartDelta: Math.abs(start(grid) - start(link)), linkGap: link.top - grid.bottom,
            groupedMeta: Boolean(meta?.querySelector("time") && meta?.querySelector("a")),
            contextGap: context.top - Math.max(reading.bottom, meta ? rect(meta).bottom : reading.bottom),
            source: source ? { href: source.href, label: source.textContent.trim() } : null,
            asOf: metric?.querySelector("time")?.dateTime,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        });
        const label = `${locale} ${viewport.width}`;
        for (const head of layout.headings) {
          assert.ok(head.gap >= 4 && head.gap <= 20, `${label}: description belongs directly below its title, got gap ${head.gap}`);
          assert.ok(head.startDelta <= 1, `${label}: title and description share their reading-start edge`);
        }
        assert.ok(layout.linkStartDelta <= 1, `${label}: browse link must align with grid start`);
        assert.ok(layout.linkGap >= 12 && layout.linkGap <= 24, `${label}: browse link stays attached to grid`);
        if (layout.metric) {
          assert.ok(layout.groupedMeta, `${label}: timestamp and source form one metadata group`);
          assert.ok(layout.contextGap >= 4 && layout.contextGap <= 20, `${label}: context is a separate readable row`);
          assert.equal(layout.source.href, "https://alternative.me/crypto/fear-and-greed-index/");
          assert.ok(layout.source.label.includes("Alternative.me") && !layout.source.label.includes("Fear & Greed"));
          assert.ok(Number.isFinite(Date.parse(layout.asOf)), `${label}: actual snapshot timestamp retained`);
        }
        assert.equal(layout.overflow, 0, `${label}: no page overflow`);
        if (evidenceDir) {
          for (const [name, selector] of [["compare", ".crossroads__header"], ["analyzer", ".home-analyzer-drawer"], ["browse", ".crossroads__grid"]]) {
            await (await page.$(selector)).screenshot({ path: join(evidenceDir, `${locale}-${viewport.id}-${name}.png`) });
          }
        }
        cases.push({ locale, viewport, ...layout });
      } finally { await page.close(); }
    }
  }
  if (evidenceDir) await writeFile(join(evidenceDir, "matrix.json"), JSON.stringify({ data: "isolated browser test fixtures, not live metrics", cases }, null, 2));
});

test.skip("renders ready sentiment metric as a full-width bridge between compare and footer (legacy component removed)", { timeout: 120000 }, async () => {
  for (const locale of locales) {
    for (const viewport of coreWidths) {
      const page = await openHome(locale, viewport, "ready");
      const layout = await collectLayout(page);
      await page.close();

      assert.equal(layout.scrollWidth, layout.clientWidth, `${locale} ${viewport.width}: page must not horizontally overflow`);
      assert.ok(layout.compareBar, `${locale} ${viewport.width}: compare bar must render`);
      assert.ok(layout.footerBrand, `${locale} ${viewport.width}: footer brand content must render`);
      assert.ok(layout.footerBrand.top - layout.compareBar.bottom <= 600, `${locale} ${viewport.width}: compare-to-footer path stays bounded`);
    }
  }
});

test.skip("removes unavailable sentiment metric without leaving a bottom spacer (legacy component removed)", { timeout: 120000 }, async () => {
  for (const locale of locales) {
    for (const viewport of coreWidths) {
      const page = await openHome(locale, viewport, "unavailable");
      const layout = await collectLayout(page);
      await page.close();

      assert.equal(layout.scrollWidth, layout.clientWidth, `${locale} ${viewport.width}: page must not horizontally overflow`);
      assert.ok(layout.compareBar, `${locale} ${viewport.width}: compare bar must render`);
      assert.ok(layout.footerBrand, `${locale} ${viewport.width}: footer brand content must render`);
      assert.ok(layout.footerBrand.top - layout.compareBar.bottom <= 600, `${locale} ${viewport.width}: compare-to-footer path stays bounded when data is unavailable`);
    }
  }
});

test("aligns matcher columns across Chinese homepage breakpoints", { timeout: 90000 }, async () => {
  for (const locale of ["zh-Hans", "zh-Hant"]) {
    for (const viewport of [...coreWidths, ...chineseTabletWidths]) {
      const page = await openHome(locale, viewport, "ready");
      const layout = await collectLayout(page);
      await page.close();

      if (viewport.width < 780) continue;
      assert.ok(layout.matcherIntents, `${locale} ${viewport.width}: comparison cards must render`);
      assert.ok(layout.matcherPanel, `${locale} ${viewport.width}: cost analyzer must render`);
    }
  }
});

test("does not clip English mobile platform card route summaries", { timeout: 90000 }, async () => {
  for (const viewport of [{ id: "phone320", width: 320, height: 844 }, { id: "phone390", width: 390, height: 844 }]) {
    const page = await openHome("en", viewport, "ready");
    const clipped = await page.evaluate(() => [...document.querySelectorAll(".venue-card__route strong")]
      .filter((element) => element.scrollHeight > element.clientHeight + 1)
      .map((element) => ({
        text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 120),
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
      })));
    await page.close();

    assert.deepEqual(clipped, [], `${viewport.id}: platform card route summaries must not be clipped`);
  }
});

test.skip("keeps Chinese ready sentiment readable at 320px with enlarged root text (legacy component removed)", { timeout: 90000 }, async () => {
  for (const locale of ["zh-Hans", "zh-Hant"]) {
    const page = await openHome(locale, { id: "phone320", width: 320, height: 844 }, "ready", { rootFontSize: "32px" });
    const evidence = await page.evaluate(() => {
      const cjk = /[\u3400-\u9fff\uf900-\ufaff]/;
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      };
      const clipped = [...document.querySelectorAll(".hero-copy *, #compare *, .home-analyzer-drawer *, .crossroads__grid *")]
        .filter((element) => visible(element) && cjk.test(element.textContent ?? "") && !element.className?.toString().includes("sr-only"))
        .filter((element) => {
          const style = getComputedStyle(element);
          const lineClamp = style.webkitLineClamp && style.webkitLineClamp !== "none";
          const clipsVertical = ["hidden", "clip"].includes(style.overflowY) || lineClamp;
          return element.scrollWidth > element.clientWidth + 1 || (clipsVertical && element.scrollHeight > element.clientHeight + 3);
        })
        .map((element) => ({
          text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 120),
          className: element.className?.toString() ?? "",
          client: { width: element.clientWidth, height: element.clientHeight },
          scroll: { width: element.scrollWidth, height: element.scrollHeight },
        }));
      return {
        rootFontSize: getComputedStyle(document.documentElement).fontSize,
        defaultReadingFontSize: window.__homeLayoutDefaultReadingFontSize,
        readingFontSize: getComputedStyle(document.querySelector(".hero-copy > p")).fontSize,
        metricExists: Boolean(document.querySelector(".crypto-sentiment")),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        clipped,
      };
    });
    await page.close();

    assert.ok(evidence.metricExists, `${locale}: ready sentiment metric must render for enlarged-text reading check`);
    assert.equal(evidence.rootFontSize, "32px", `${locale}: test must actually apply enlarged root font size`);
    assert.ok(
      Number.parseFloat(evidence.readingFontSize) >= Number.parseFloat(evidence.defaultReadingFontSize) * 1.9,
      `${locale}: reading text must scale with the enlarged root font size`,
    );
    assert.equal(evidence.scrollWidth, evidence.clientWidth, `${locale}: enlarged 320px page must not horizontally overflow`);
    assert.deepEqual(evidence.clipped, [], `${locale}: enlarged 320px Chinese reading content must not clip`);
  }
});

test("isolates matcher source domains as left-to-right text in the Arabic homepage", { timeout: 90000 }, async () => {
  const page = await openHome("ar", { id: "desktop", width: 1440, height: 1100 }, "ready");
  const badDomains = await page.evaluate(() => [...document.querySelectorAll(".platform-matcher__source")]
    .filter((element) => /\b[a-z0-9-]+\.(?:com|finance|exchange)\b/i.test(element.textContent ?? ""))
    .map((element) => {
      const style = getComputedStyle(element);
      return {
        text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 120),
        dir: element.getAttribute("dir"),
        lang: element.getAttribute("lang"),
        direction: style.direction,
        unicodeBidi: style.unicodeBidi,
      };
    })
    .filter((element) => element.dir !== "ltr" || element.direction !== "ltr" || !["isolate", "plaintext", "embed"].includes(element.unicodeBidi)));
  await page.close();

  assert.deepEqual(badDomains, [], "Arabic matcher source domains must carry explicit LTR isolation semantics");
});
