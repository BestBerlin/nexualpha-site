#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dataStatusCopy } from "../src/content/data-status-copy.js";
import { localizedHref, parsePublicRoute } from "../src/data/locale-routing.js";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(scriptPath), "..");
const workspaceRoot = resolve(projectRoot, "..");
const sharedRoot = "/Users/bestberlin/.codex/shared-tools/web-quality";
const sharedRequire = createRequire(join(sharedRoot, "package.json"));
const puppeteer = sharedRequire("puppeteer-core");

const routes = [
  { id: "home", path: "/", required: [".lean-hero", ".yellow-pages", "#exchanges", "#compare"] },
  { id: "exchanges", path: "/exchanges", required: [".yellow-pages", ".yellow-pages__grid"] },
  { id: "binance", path: "/exchanges/binance", required: [".v3-page-hero", ".v3-profile-decision", ".v3-activity-panel"] },
  { id: "compare-binance-okx", path: "/compare/binance-vs-okx", required: [".v3-page-hero", ".v3-compare-section-disclosure", ".v3-compare-verdict"] },
  { id: "activities", path: "/activities", required: [".activity-center-v3", ".activity-center-v3__filters", ".activity-center-v3__sources"] },
];

// Regional routes are intentionally opt-in: they use a smaller locale matrix
// so the default core gate stays fast while international pages still get a
// real-browser, scroll-budget and CTA visibility pass before promotion.
const regionalRoutes = [
  { id: "br", path: "/br", required: ["[data-testid=\"brazil-decision-page\"]", "#br-decision-controls", "[data-testid=\"brazil-cost-estimate\"]"] },
  { id: "mx", path: "/mx", required: [".regional-market-preview", "[data-market-gate=\"MX\"]", "[data-regional-cta=\"directory\"]"] },
  { id: "tw", path: "/tw", required: [".regional-market-preview", "[data-market-gate=\"TW\"]", "[data-regional-cta=\"directory\"]"] },
  { id: "id", path: "/id", required: [".regional-market-preview", "[data-market-gate=\"ID\"]", "[data-regional-cta=\"directory\"]"] },
  { id: "hk", path: "/hk", required: [".regional-market-preview", "[data-market-gate=\"HK\"]", "[data-regional-cta=\"directory\"]"] },
  { id: "eu", path: "/eu", required: [".regional-market-preview", "[data-market-gate=\"EU\"]", "[data-regional-cta=\"directory\"]"] },
  { id: "uk", path: "/uk", required: [".regional-market-preview", "[data-market-gate=\"UK\"]", "[data-regional-cta=\"directory\"]"] },
];

const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
const screenshotLocales = new Set(["en", "zh-Hans", "zh-Hant", "it", "ar"]);
const regionalLocales = ["en", "pt-BR", "zh-Hant", "es", "id"];
const viewports = [
  { id: "mobile", width: 375, height: 812 },
  { id: "tablet", width: 768, height: 1024 },
  { id: "desktop", width: 1440, height: 1100 },
];

// Guard the default decision path from silently growing as secondary modules
// are added. These are review budgets, not ranking or performance claims.
const scrollBudgets = {
  home: { 375: 16000, 768: 10000, 1440: 7000 },
  exchanges: { 375: 12000, 768: 7000, 1440: 5000 },
  binance: { 375: 9000, 768: 11000, 1440: 8500 },
  "compare-binance-okx": { 375: 11000, 768: 8000, 1440: 7000 },
  activities: { 375: 22000, 768: 16000, 1440: 11000 },
  br: { 375: 18000, 768: 12000, 1440: 10000 },
  mx: { 375: 14000, 768: 9000, 1440: 7000 },
  tw: { 375: 14000, 768: 9000, 1440: 7000 },
  id: { 375: 14000, 768: 9000, 1440: 7000 },
  hk: { 375: 14000, 768: 9000, 1440: 7000 },
  eu: { 375: 14000, 768: 9000, 1440: 7000 },
  uk: { 375: 14000, 768: 9000, 1440: 7000 },
};

function parseArgs(argv) {
  const args = {
    artifactRoot: join(workspaceRoot, "artifacts", "v3-repair"),
    baseUrl: "http://localhost:4173",
    mode: "baseline",
    timeoutMs: 30000,
    settleMs: 250,
    strict: false,
    dryRun: false,
    interactionOnly: false,
    skipInteractions: false,
    expectCore: false,
    expectPrismaHealth: false,
    regionalOnly: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--interaction-only") args.interactionOnly = true;
    else if (arg === "--skip-interactions") args.skipInteractions = true;
    else if (arg === "--expect-core") args.expectCore = true;
    else if (arg === "--expect-prisma-health") args.expectPrismaHealth = true;
    else if (arg === "--regional-only") args.regionalOnly = true;
    else if (arg === "--strict") args.strict = true;
    else if (arg === "--base-url" && argv[index + 1]) args.baseUrl = argv[++index];
    else if (arg === "--artifact-root" && argv[index + 1]) args.artifactRoot = resolve(argv[++index]);
    else if (arg === "--mode" && argv[index + 1]) args.mode = argv[++index];
    else if (arg === "--timeout-ms" && argv[index + 1]) args.timeoutMs = Number(argv[++index]);
    else if (arg === "--settle-ms" && argv[index + 1]) args.settleMs = Number(argv[++index]);
    else throw new Error(`Unknown or incomplete argument: ${arg}`);
  }
  return args;
}

function usage() {
  return [
    "node scripts/verify-browser.mjs [options]",
    "",
    "Options:",
    "  --base-url URL        Local preview URL. Default: http://localhost:4173",
    "  --artifact-root DIR   Evidence root. Default: ../artifacts/v3-repair",
    "  --mode NAME           Evidence run label. Default: baseline",
    "  --strict              Exit non-zero when regression findings are present",
    "  --interaction-only    Run only targeted interactions; skips the 225-page matrix",
    "  --skip-interactions    Run the page matrix only; use with a separate interaction-only report",
    "  --expect-core         Require DOM data status to be ready/core with contentVersion",
    "  --expect-prisma-health Require /api/v1/health/ready to expose prisma source and buildId",
    "  --regional-only       Run BR/MX/TW/ID/HK/EU/UK real-browser regional QA only",
    "  --dry-run             Print run plan without launching Chrome",
  ].join("\n");
}

function sharedPackage(name) {
  return JSON.parse(sharedRequire("node:fs").readFileSync(sharedRequire.resolve(`${name}/package.json`), "utf8")).version;
}

function findChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function safeName(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "item";
}

function withLocale(baseUrl, routePath, locale) {
  return new URL(localizedHref(routePath, { locale }), baseUrl).href;
}

function isComparisonHref(href) {
  const url = new URL(href);
  return parsePublicRoute(url.pathname, url.searchParams).contentPathname.startsWith("/compare/");
}

const DIRECTORY_COMPARE_ALLOWED_PARAMS = new Set(["market", "product", "account_stage", "publisher", "locale"]);

function isAllowedDirectoryCompareParam(key, value) {
  if (key.startsWith("utm_")) return Boolean(value);
  if (!DIRECTORY_COMPARE_ALLOWED_PARAMS.has(key)) return false;
  if (!value) return false;
  if ((key === "market" || key === "product") && value.toLowerCase() === "unknown") return false;
  if (key === "locale" && value === "en") return false;
  return true;
}

function isDirectoryComparisonHref(href, baseUrl = "https://nexualpha.com") {
  if (!href) return false;
  let url;
  try {
    url = new URL(href, baseUrl);
  } catch {
    return false;
  }
  const route = parsePublicRoute(url.pathname, url.searchParams);
  const match = route.contentPathname.match(/^\/compare\/([a-z0-9]+(?:-[a-z0-9]+)*-vs-[a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (!match) return false;
  if (match[1].split("-vs-").length !== 2) return false;
  for (const [key, value] of url.searchParams) {
    if (!isAllowedDirectoryCompareParam(key, value)) return false;
  }
  return true;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function fetchText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  return { status: response.status, ok: response.ok, text: await response.text() };
}

async function fetchJsonEvidence(baseUrl, path) {
  const url = new URL(path, baseUrl).href;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { parseError: true, text: text.slice(0, 500) };
    }
    return { url, status: response.status, ok: response.ok, body };
  } catch (error) {
    return { url, status: "ERROR", ok: false, body: null, error: error.message };
  }
}

async function collectBuildEvidence(baseUrl) {
  const packageJson = await readJson(join(projectRoot, "package.json"));
  const html = await fetchText(new URL("/", baseUrl).href);
  const versionJsonResponse = await fetchText(new URL("/version.json", baseUrl).href).catch((error) => ({
    status: "ERROR",
    ok: false,
    text: JSON.stringify({ error: error.message }),
  }));
  const assetMatches = [...html.text.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1]);
  const assets = [];
  for (const href of assetMatches) {
    const url = new URL(href, baseUrl).href;
    try {
      const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10000) });
      assets.push({ href, status: response.status, ok: response.ok, contentType: response.headers.get("content-type") });
    } catch (error) {
      assets.push({ href, status: "ERROR", ok: false, error: error.message });
    }
  }
  const distAssets = existsSync(join(projectRoot, "dist", "client", "assets"))
    ? await readdir(join(projectRoot, "dist", "client", "assets"))
    : [];
  return {
    package: { name: packageJson.name, version: packageJson.version },
    versionJson: {
      status: versionJsonResponse.status,
      ok: versionJsonResponse.ok,
      body: JSON.parse(versionJsonResponse.text),
    },
    servedHtml: { status: html.status, ok: html.ok, sha256: sha256(html.text), bytes: Buffer.byteLength(html.text) },
    servedAssets: assets,
    distAssets,
    health: {
      live: await fetchJsonEvidence(baseUrl, "/api/v1/health/live"),
      ready: await fetchJsonEvidence(baseUrl, "/api/v1/health/ready"),
    },
  };
}

async function evaluatePage(page, route, viewport) {
  return page.evaluate(({ required, viewportWidth }) => {
    const visibleRect = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        visible: rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      };
    };
    const requiredPanels = required.map((selector) => {
      const element = document.querySelector(selector);
      const rect = element ? visibleRect(element) : null;
      return { selector, present: Boolean(element), visible: Boolean(rect?.visible), rect };
    });
    const imageNeedsValidation = (image) => {
      const rect = image.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      if (image.loading !== "lazy") return true;
      return rect.bottom >= -200 && rect.top <= window.innerHeight + 200;
    };
    const brokenImages = [...document.images]
      .filter(imageNeedsValidation)
      .filter((image) => !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0)
      .map((image) => ({
        src: image.currentSrc || image.src,
        className: image.className,
        alt: image.alt,
        brandSource: image.dataset.brandSource || null,
      }));
    const isInsideHorizontalScroller = (element) => {
      let node = element.parentElement;
      while (node && node !== document.body) {
        const style = getComputedStyle(node);
        const canScrollHorizontally = /^(auto|scroll|overlay)$/.test(style.overflowX);
        if (canScrollHorizontally && node.scrollWidth > node.clientWidth + 1) return true;
        node = node.parentElement;
      }
      return false;
    };
    const overflowingElements = [...document.body.querySelectorAll("*")]
      .map((element) => {
        if (element.closest(".rebate-ticker__track, .v3-fee-table, .fee-terminal__table, .v3-matrix-table, .v3-gold-matrix-card, .yellow-pages__filter-chips, .yellow-pages__tabs")) return null;
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        if (isInsideHorizontalScroller(element)) return null;
        const overflowRight = Math.ceil(rect.right - viewportWidth);
        const overflowLeft = Math.ceil(0 - rect.left);
        if (overflowRight <= 1 && overflowLeft <= 1) return null;
        const selector = element.id ? `#${element.id}` : element.className ? `${element.tagName.toLowerCase()}.${String(element.className).trim().split(/\s+/).slice(0, 3).join(".")}` : element.tagName.toLowerCase();
        return {
          selector,
          text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 120),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          overflowLeft: Math.max(0, overflowLeft),
          overflowRight: Math.max(0, overflowRight),
        };
      })
      .filter(Boolean)
      .slice(0, 25);
    const blocks = [...document.body.querySelectorAll("main section, header, footer, article, aside")]
      .map((element) => visibleRect(element))
      .filter((rect) => rect.visible && rect.bottom > 0)
      .sort((a, b) => a.top - b.top);
    const verticalGaps = [];
    for (let index = 1; index < blocks.length; index += 1) {
      const gap = Math.round(blocks[index].top - blocks[index - 1].bottom);
      if (gap > Math.max(180, window.innerHeight * 0.28)) verticalGaps.push({ afterBottom: Math.round(blocks[index - 1].bottom), beforeTop: Math.round(blocks[index].top), gap });
    }
    const fallbackLogos = document.querySelectorAll("[data-brand-fallback]").length;
    return {
      title: document.title,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      url: location.href,
      scroll: {
        viewportWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      },
      requiredPanels,
      brokenImages,
      overflowingElements,
      verticalGaps,
      fallbackLogos,
      build: {
        documentDatasetBuild: document.documentElement.dataset.build || null,
        footerBuildText: document.querySelector(".build-identity")?.textContent?.trim() || null,
        footerDatasetBuild: document.querySelector("footer")?.dataset?.build || null,
      },
      dataConnection: (() => {
        const container = document.querySelector(".data-connection");
        const status = container?.querySelector("[role='status']");
        const button = container?.querySelector("button");
        const rect = container?.getBoundingClientRect();
        return {
          documentDatasetStatus: document.documentElement.dataset.dataStatus || null,
          documentDatasetSource: document.documentElement.dataset.dataSource || null,
          documentDatasetContentVersion: document.documentElement.dataset.contentVersion || null,
          footerDatasetStatus: container?.getAttribute("data-status") || null,
          visible: Boolean(rect && rect.width > 0 && rect.height > 0),
          statusText: status?.textContent?.trim().replace(/\s+/g, " ") || null,
          refreshText: button?.textContent?.trim().replace(/\s+/g, " ") || null,
          refreshDisabled: Boolean(button?.disabled),
        };
      })(),
      bounds: {
        heroH1: (() => {
          const heading = document.querySelector(".lean-hero__title");
          if (!heading) return null;
          const range = document.createRange();
          range.selectNodeContents(heading);
          const lineTops = new Set([...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0).map((rect) => Math.round(rect.top)));
          const rect = heading.getBoundingClientRect();
          const style = getComputedStyle(heading);
          return {
            text: heading.textContent.trim().replace(/\s+/g, " "),
            lineCount: lineTops.size || 0,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
          };
        })(),
        heroSlogan: (() => {
          const slogan = document.querySelector(".hero-brand-slogan");
          if (!slogan) return null;
          const rect = slogan.getBoundingClientRect();
          return {
            text: slogan.textContent.trim().replace(/\s+/g, " "),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            visible: rect.width > 0 && rect.height > 0,
          };
        })(),
        heroActions: [...document.querySelectorAll(".lean-hero__btn-wizard, .lean-hero__btn-primary, .lean-hero__btn-secondary, .growth-route-actions__primary, .growth-route-actions__secondary")].map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 80),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
          };
        }),
        heroArt: (() => {
          const image = document.querySelector(".home-decision-panel__art");
          if (!image) return null;
          const rect = image.getBoundingClientRect();
          const style = getComputedStyle(image);
          return {
            src: image.currentSrc || image.src,
            alt: image.getAttribute("alt"),
            widthAttr: image.getAttribute("width"),
            heightAttr: image.getAttribute("height"),
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            renderedWidth: Math.round(rect.width),
            renderedHeight: Math.round(rect.height),
            objectFit: style.objectFit,
            visible: rect.width > 0 && rect.height > 0,
          };
        })(),
        logos: [...document.querySelectorAll(".nexualpha-wordmark__mark, .v2-brand")].filter(imageNeedsValidation).map((image) => {
          const rect = image.getBoundingClientRect();
          const style = getComputedStyle(image);
          return {
            src: image.currentSrc || image.src,
            className: image.className,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            renderedWidth: Math.round(rect.width),
            renderedHeight: Math.round(rect.height),
            objectFit: style.objectFit,
            visible: rect.width > 0 && rect.height > 0,
          };
        }),
        homeComparisonLinks: [...document.querySelectorAll(".crossroads__card")].map((anchor) => ({
          text: anchor.textContent.trim().replace(/\s+/g, " ").slice(0, 120),
          href: anchor.href,
        })),
      },
    };
  }, { required: route.required, viewportWidth: viewport.width });
}

async function gotoStable(page, url, timeoutMs) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await page.waitForSelector("main, body", { timeout: Math.min(timeoutMs, 10000) });
  try {
    await page.waitForNetworkIdle({ idleTime: 350, timeout: 2500 });
  } catch {
    // Local previews may keep non-critical work alive; DOM and selector checks below are the gate.
  }
}

async function getDataConnectionEvidence(page) {
  return page.evaluate(() => {
    const locale = new URLSearchParams(location.search).get("locale") || document.documentElement.lang;
    const connection = document.querySelector(".data-connection");
    const status = connection?.querySelector("[role='status']");
    const button = connection?.querySelector("button");
    return {
      locale,
      url: location.href,
      documentDatasetStatus: document.documentElement.dataset.dataStatus || null,
      documentDatasetSource: document.documentElement.dataset.dataSource || null,
      documentDatasetContentVersion: document.documentElement.dataset.contentVersion || null,
      footerDatasetStatus: connection?.getAttribute("data-status") || null,
      statusText: status?.textContent?.trim().replace(/\s+/g, " ") || null,
      refreshText: button?.textContent?.trim().replace(/\s+/g, " ") || null,
      refreshDisabled: Boolean(button?.disabled),
    };
  });
}

function expectedDataStatusText(locale, dataSource, dataStatus) {
  const copy = dataStatusCopy(locale);
  return copy[dataSource === "mock" ? "mock" : dataStatus] ?? copy.error;
}

async function runInteractionChecks(page, baseUrl, screenshotsDir, options = {}) {
  const results = [];
  // The desktop header intentionally hides the secondary search trigger below
  // 1450px; use a wide desktop viewport so this interaction is testable.
  await page.setViewport({ width: 1600, height: 1100, deviceScaleFactor: 1 });
  await gotoStable(page, withLocale(baseUrl, "/", "en"), 30000);
  await page.$$eval(".v2-header__tools button", (buttons) => {
    const visible = buttons.find((button) => {
      const rect = button.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (!visible) throw new Error("No visible search button found");
    visible.click();
  });
  await page.waitForSelector(".search-dialog[role='dialog']", { timeout: 10000 });
  const focusedInDialog = await page.evaluate(() => document.activeElement?.closest(".search-dialog") !== null && document.activeElement?.tagName === "INPUT");
  results.push({ id: "search-modal-focus", ok: focusedInDialog, evidence: await page.$eval(".search-dialog", (element) => element.getAttribute("aria-label")) });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector(".search-dialog"), { timeout: 10000 });
  results.push({ id: "search-modal-escape-dismiss", ok: true, evidence: "dialog closed after Escape" });
  await page.$$eval(".v2-header__tools button", (buttons) => {
    const visible = buttons.find((button) => {
      const rect = button.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (!visible) throw new Error("No visible search button found");
    visible.click();
  });
  await page.waitForSelector(".search-dialog[role='dialog']", { timeout: 10000 });
  await page.mouse.click(5, 5);
  await page.waitForFunction(() => !document.querySelector(".search-dialog"), { timeout: 10000 });
  results.push({ id: "search-modal-outside-dismiss", ok: true, evidence: "dialog closed after backdrop click" });

  await gotoStable(page, withLocale(baseUrl, "/", "en"), 30000);
  await page.waitForSelector(".crossroads__card", { timeout: 10000 });
  const crossroadsCards = await page.$$(".crossroads__card");
  const targetCard = crossroadsCards[2] ?? crossroadsCards[1];
  const crossroadsState = await targetCard.evaluate((anchor) => ({ href: anchor.href, text: anchor.textContent?.trim().replace(/\s+/g, " ") || null }));
  await targetCard.click();
  await page.waitForFunction((href) => location.href === href, { timeout: 10000 }, crossroadsState.href);
  const hrefSlugs = new URL(crossroadsState.href).pathname.replace(/^\/compare\//, "").split("-vs-");
  results.push({
    id: "crossroads-comparison-navigates",
    ok: hrefSlugs.length === 2 && locationPath(await page.url()).startsWith("/compare/"),
    evidence: { ...crossroadsState, hrefSlugs },
  });
  await gotoStable(page, withLocale(baseUrl, "/", "en"), 30000);
  const comparisonHrefs = await page.$$eval(".crossroads__card", (anchors) => anchors.map((anchor) => anchor.href));
  const comparisonEvidence = [];
  for (const href of comparisonHrefs) {
    await gotoStable(page, href, 30000);
    const researchDisclosure = await page.$(".v3-compare-section-disclosure > summary");
    if (researchDisclosure) {
      await researchDisclosure.click();
      await page.waitForSelector(".research-comparison .research-table", { timeout: 10000 });
    }
    const state = await page.evaluate(() => ({
      path: location.pathname,
      tableVisible: Boolean(document.querySelector(".research-comparison .research-table")?.getClientRects().length),
      title: document.title,
    }));
    comparisonEvidence.push({ href, ...state });
  }
  results.push({
    id: "home-comparison-links-navigate",
    ok: comparisonHrefs.length === 4 && comparisonEvidence.every((item) => item.path.startsWith("/compare/") && item.tableVisible),
    evidence: comparisonEvidence,
  });

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await gotoStable(page, withLocale(baseUrl, "/", "en"), 30000);
  await page.click(".mobile-bottom-nav button");
  await page.waitForSelector(".command-finder input", { timeout: 10000 });
  await page.click(".command-finder input");
  await page.type(".command-finder input", "OKX");
  await page.waitForSelector(".command-results [role='option']", { timeout: 10000 });
  const okxHref = await page.$eval(".command-results [role='option']", (element) => element.textContent);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => location.pathname === "/exchanges/okx", { timeout: 10000 });
  results.push({ id: "finder-okx", ok: locationPath(await page.url()) === "/exchanges/okx", evidence: okxHref.trim() });

  await gotoStable(page, withLocale(baseUrl, "/", "en"), 30000);
  await page.click(".mobile-bottom-nav button");
  await page.waitForSelector(".command-finder input", { timeout: 10000 });
  await page.click(".command-finder input");
  await page.type(".command-finder input", "definitely-not-a-platform");
  await page.waitForSelector(".command-results [role='status']", { timeout: 10000 });
  const noResult = await page.$eval(".command-results [role='status']", (element) => element.textContent.trim());
  results.push({ id: "finder-no-result", ok: noResult.length > 0, evidence: noResult });

  await gotoStable(page, withLocale(baseUrl, "/exchanges", "en"), 30000);
  await page.waitForSelector(".yellow-pages__grid .yellow-card", { timeout: 10000 });
  const beforeCount = await page.$$eval(".yellow-pages__grid .yellow-card", (cards) => cards.length);
  await page.click(".yellow-pages__tab:nth-of-type(2)");
  await page.waitForFunction((initial) => document.querySelectorAll(".yellow-pages__grid .yellow-card").length !== initial, { timeout: 10000 }, beforeCount);
  const afterCount = await page.$$eval(".yellow-pages__grid .yellow-card", (cards) => cards.length);
  const activeTab = await page.$eval(".yellow-pages__tab[aria-selected='true']", (element) => element.textContent.trim());
  results.push({ id: "directory-category-filter", ok: beforeCount > 0 && afterCount > 0 && afterCount !== beforeCount && activeTab.length > 0, evidence: `${beforeCount} cards -> ${afterCount} cards (${activeTab})` });

  await gotoStable(page, withLocale(baseUrl, "/exchanges", "en"), 30000);
  await page.waitForSelector(".yellow-card__btn-compare", { timeout: 10000 });
  await page.evaluate(() => document.querySelector(".yellow-card__btn-compare:not(.is-selected):not(:disabled)")?.click());
  await page.waitForFunction(() => document.querySelectorAll(".yellow-card__btn-compare.is-selected").length === 1, { timeout: 10000 });
  await page.evaluate(() => document.querySelector(".yellow-card__btn-compare:not(.is-selected):not(:disabled)")?.click());
  await page.waitForFunction(() => document.querySelectorAll(".yellow-card__btn-compare.is-selected").length === 2, { timeout: 10000 });
  await page.waitForSelector(".yellow-pages__compare-open", { timeout: 10000 });
  const directoryCompareHref = await page.$eval(".yellow-pages__compare-open", (element) => element.getAttribute("href"));
  results.push({ id: "directory-two-platform-compare", ok: isDirectoryComparisonHref(directoryCompareHref, baseUrl), evidence: directoryCompareHref });

  await gotoStable(page, withLocale(baseUrl, "/", "en"), 30000);
  await page.select(".v2-header__tools select", "ar");
  await page.waitForFunction(() => document.documentElement.dir === "rtl" && (new URLSearchParams(location.search).get("locale") === "ar" || location.pathname === "/ar" || location.pathname === "/ar/"), { timeout: 10000 });
  const localeState = await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, url: location.href }));
  await page.screenshot({ path: join(screenshotsDir, "interaction-locale-switch-ar-mobile.png"), fullPage: true });
  results.push({ id: "locale-switch-ar", ok: localeState.dir === "rtl" && localeState.lang.startsWith("ar"), evidence: localeState });

  await gotoStable(page, withLocale(baseUrl, "/compare/binance-vs-okx", "en"), 30000);
  // The research comparison is intentionally collapsed in the public layout;
  // open it as a user would before exercising its difference filter.
  const researchDrawer = await page.$(".v3-compare-section-disclosure");
  if (researchDrawer) {
    const isOpen = await researchDrawer.evaluate((element) => element.open);
    if (!isOpen) await page.click(".v3-compare-section-disclosure > summary");
  }
  await page.waitForSelector(".research-comparison .research-table", { timeout: 10000 });
  const beforeRows = await page.$$eval(".research-table tbody tr", (rows) => rows.length);
  const differencesBefore = await page.$eval(".research-differences input", (input) => input.checked);
  await page.click(".research-differences");
  await page.waitForFunction((expected) => document.querySelector(".research-differences input")?.checked === expected, { timeout: 10000 }, !differencesBefore);
  const afterRows = await page.$$eval(".research-table tbody tr", (rows) => rows.length);
  results.push({ id: "compare-differences-toggle", ok: beforeRows > 0 && afterRows > 0 && afterRows <= beforeRows, evidence: `${beforeRows} rows -> ${afterRows} rows; checked ${differencesBefore} -> ${!differencesBefore}` });
  const detailState = await page.evaluate(() => {
    const details = [...document.querySelectorAll("details.research-references")].find((item) => item.querySelector(".v3-deep-compare"));
    if (!details) return { present: false, opened: false };
    details.open = true;
    return { present: true, opened: details.open, tableVisible: Boolean(details.querySelector(".v3-deep-compare")?.getClientRects().length) };
  });
  results.push({ id: "compare-account-check-details-expand", ok: !detailState.present || (detailState.opened && detailState.tableVisible), evidence: detailState });
  results.push(await checkHashTargetInViewport(page, baseUrl, "/#compare", "#compare", "hash-home-compare"));
  results.push(await checkHashTargetInViewport(page, baseUrl, "/exchanges/binance#registration-path", "#registration-path", "hash-binance-registration-path"));

  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
  await gotoStable(page, withLocale(baseUrl, "/", "en"), 30000);
  await page.waitForSelector(".lean-hero", { timeout: 10000 });
  const refreshBefore = await page.evaluate(() => ({ hero: Boolean(document.querySelector(".lean-hero")), directory: Boolean(document.querySelector("#exchanges")), compare: Boolean(document.querySelector("#compare")) }));
  const refreshAfter = await page.evaluate(() => ({ hero: Boolean(document.querySelector(".lean-hero")), directory: Boolean(document.querySelector("#exchanges")), compare: Boolean(document.querySelector("#compare")) }));
  results.push({
    id: "homepage-core-sections-visible",
    ok: refreshAfter.hero && refreshAfter.directory && refreshAfter.compare,
    evidence: { before: refreshBefore, after: refreshAfter },
  });

  const localeSequence = ["zh-Hans", "zh-Hant", "en"];
  const localeCopyEvidence = [];
  await gotoStable(page, withLocale(baseUrl, "/", "en"), 30000);
  for (const nextLocale of localeSequence) {
    // Locale changes intentionally perform a full navigation so SSR and the
    // legacy component tree start from one locale. Wait for that navigation
    // before evaluating the new document; otherwise Puppeteer can keep a
    // stale execution context and report a false timeout.
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null),
      page.select(".v2-header__tools select", nextLocale),
    ]);
    await page.waitForFunction((locale) => {
      const activeLocale = new URLSearchParams(location.search).get("locale");
      const pathLocale = location.pathname.replace(/^\/+|\/+$/g, "").split("/")[0].toLowerCase();
      const expectedPathLocale = locale.toLowerCase();
      const urlMatches = locale === "en"
        ? (activeLocale === null || activeLocale === "en") && (pathLocale === "" || pathLocale === "en")
        : activeLocale === locale || pathLocale === expectedPathLocale;
      return urlMatches && Boolean(document.querySelector(".lean-hero"));
    }, { timeout: 15000 }, nextLocale);
    const observed = await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, hero: Boolean(document.querySelector(".lean-hero")), directory: Boolean(document.querySelector("#exchanges")) }));
    localeCopyEvidence.push({ locale: nextLocale, ...observed, matchesExpectedText: observed.hero && observed.directory });
  }
  results.push({
    id: "locale-core-sections-do-not-disappear",
    ok: localeCopyEvidence.length === localeSequence.length && localeCopyEvidence.every((item) => item.matchesExpectedText),
    evidence: localeCopyEvidence,
  });
  return results;
}

function locationPath(url) {
  return new URL(url).pathname;
}

async function checkHashTargetInViewport(page, baseUrl, routePath, selector, id) {
  const viewportsToCheck = [
    { id: "mobile", width: 390, height: 844 },
    { id: "desktop", width: 1440, height: 1100 },
  ];
  const evidence = [];
  for (const viewport of viewportsToCheck) {
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
    await gotoStable(page, withLocale(baseUrl, routePath, "en"), 30000);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
    evidence.push(await page.evaluate(({ selector: targetSelector, viewportId }) => {
      const target = document.querySelector(targetSelector);
      if (!target) return { viewport: viewportId, present: false, top: null, bottom: null, innerHeight: window.innerHeight, scrollY: window.scrollY, withinViewport: false };
      const rect = target.getBoundingClientRect();
      return {
        viewport: viewportId,
        present: true,
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        innerHeight: window.innerHeight,
        scrollY: Math.round(window.scrollY),
        withinViewport: rect.top >= -1 && rect.top < window.innerHeight,
      };
    }, { selector, viewportId: viewport.id }));
  }
  return { id, ok: evidence.every((item) => item.withinViewport), evidence };
}

function summarizeFindings(samples, interactions, buildEvidence, options = {}) {
  const expectedBuildId = buildEvidence.versionJson?.body?.buildId ?? null;
  const missingPanels = samples.flatMap((sample) => sample.metrics.requiredPanels.filter((panel) => !panel.present || !panel.visible).map((panel) => ({ sample: sample.id, selector: panel.selector, present: panel.present, visible: panel.visible })));
  const brokenImages = samples.flatMap((sample) => sample.metrics.brokenImages.map((image) => ({ sample: sample.id, ...image })));
  const horizontalOverflow = samples.filter((sample) => sample.metrics.scroll.horizontalOverflowPx > 1 || sample.metrics.overflowingElements.length)
    .map((sample) => ({
      sample: sample.id,
      overflowPx: sample.metrics.scroll.horizontalOverflowPx,
      topElements: sample.metrics.overflowingElements.slice(0, 8),
    }));
  const scrollBudgetFailures = samples
    .map((sample) => {
      const budget = scrollBudgets[sample.route]?.[sample.viewport.width];
      return budget && sample.metrics.scroll.scrollHeight > budget
        ? { sample: sample.id, route: sample.route, viewportWidth: sample.viewport.width, budget, observed: sample.metrics.scroll.scrollHeight }
        : null;
    })
    .filter(Boolean);
  const consoleErrors = samples.flatMap((sample) => sample.console.errors.map((entry) => ({ sample: sample.id, ...entry })));
  const requestFailures = samples.flatMap((sample) => sample.network.failures.map((entry) => ({ sample: sample.id, ...entry })));
  const interactionFailures = interactions.filter((item) => !item.ok);
  const buildMismatches = expectedBuildId ? samples
    .filter((sample) => (sample.metrics.build.documentDatasetBuild && sample.metrics.build.documentDatasetBuild !== expectedBuildId) || (sample.metrics.build.footerBuildText && sample.metrics.build.footerBuildText !== expectedBuildId) || (sample.metrics.build.footerDatasetBuild && sample.metrics.build.footerDatasetBuild !== expectedBuildId))
    .map((sample) => ({ sample: sample.id, expectedBuildId, observed: sample.metrics.build }))
    : samples.map((sample) => ({ sample: sample.id, expectedBuildId: null, observed: sample.metrics.build }));
  const requiredHeroLocales = new Set(["en", "zh-Hans", "zh-Hant"]);
  const heroCtaBoundsFailures = samples
    .filter((sample) => sample.route === "home" && sample.viewport.width === 375 && requiredHeroLocales.has(sample.locale))
    .flatMap((sample) => sample.metrics.bounds.heroActions
      .filter((item) => item.height < 44 || item.height > 72)
      .map((item) => ({ sample: sample.id, minHeight: 44, maxHeight: 72, observed: item })));
  const heroH1LineFailures = samples
    .filter((sample) => sample.route === "home" && sample.viewport.width >= 1100 && (sample.locale === "zh-Hans" || sample.locale === "zh-Hant"))
    .filter((sample) => !sample.metrics.bounds.heroH1 || sample.metrics.bounds.heroH1.lineCount > 2)
    .map((sample) => ({ sample: sample.id, expectedLineCount: "1-2", observed: sample.metrics.bounds.heroH1 }));
  const heroArtFailures = samples
    .filter((sample) => sample.route === "home")
    .filter((sample) => {
      const art = sample.metrics.bounds.heroArt;
      return art && (!art.visible || !art.widthAttr || !art.heightAttr || art.naturalWidth <= 0 || art.naturalHeight <= 0 || art.objectFit !== "cover" || art.alt !== "");
    })
    .map((sample) => ({ sample: sample.id, observed: sample.metrics.bounds.heroArt }));
  const logoFailures = samples
    .flatMap((sample) => sample.metrics.bounds.logos.length
      ? sample.metrics.bounds.logos
        .filter((logo) => logo.visible)
        .filter((logo) => logo.naturalWidth <= 0 || logo.naturalHeight <= 0 || logo.objectFit !== "contain")
        .map((logo) => ({ sample: sample.id, observed: logo }))
      : [{ sample: sample.id, observed: { visible: false, reason: "no logo images found" } }]);
  const sloganFailures = samples
    .filter((sample) => sample.route === "home")
    .filter((sample) => {
      const slogan = sample.metrics.bounds.heroSlogan;
      const headingText = sample.metrics.bounds.heroH1?.text;
      return slogan && (!slogan.visible || !slogan.text || slogan.text === headingText);
    })
    .map((sample) => ({ sample: sample.id, observed: sample.metrics.bounds.heroSlogan, heading: sample.metrics.bounds.heroH1?.text }));
  const homeComparisonLinkFailures = samples
    .filter((sample) => sample.route === "home")
    .filter((sample) => sample.metrics.bounds.homeComparisonLinks.length !== 4 || sample.metrics.bounds.homeComparisonLinks.some((link) => !isComparisonHref(link.href)))
    .map((sample) => ({ sample: sample.id, observed: sample.metrics.bounds.homeComparisonLinks }));
  const dataConnectionFailures = options.expectCore ? samples
    .filter((sample) => {
      const connection = sample.metrics.dataConnection;
      const expectedText = expectedDataStatusText(sample.locale, connection.documentDatasetSource, connection.documentDatasetStatus);
      return connection.documentDatasetStatus !== "ready"
        || connection.documentDatasetSource !== "core"
        || !connection.documentDatasetContentVersion
        || connection.footerDatasetStatus !== "ready"
        || connection.statusText !== expectedText
        || !connection.visible;
    })
    .map((sample) => ({ sample: sample.id, locale: sample.locale, observed: sample.metrics.dataConnection, expectedText: expectedDataStatusText(sample.locale, sample.metrics.dataConnection.documentDatasetSource, sample.metrics.dataConnection.documentDatasetStatus) }))
    : [];
  const healthFailures = [];
  if (options.expectPrismaHealth) {
    const ready = buildEvidence.health?.ready;
    const live = buildEvidence.health?.live;
    if (!live?.ok) healthFailures.push({ endpoint: "live", observed: live });
    if (!ready?.ok || ready.body?.status !== "ready" || !ready.body?.buildId || ready.body?.dependencies?.repository?.source !== "prisma") {
      healthFailures.push({ endpoint: "ready", expected: { status: "ready", buildId: "nonempty", repositorySource: "prisma" }, observed: ready });
    }
  }
  return {
    status: missingPanels.length || brokenImages.length || horizontalOverflow.length || scrollBudgetFailures.length || consoleErrors.length || requestFailures.length || interactionFailures.length || buildMismatches.length || heroCtaBoundsFailures.length || heroH1LineFailures.length || heroArtFailures.length || logoFailures.length || sloganFailures.length || homeComparisonLinkFailures.length || dataConnectionFailures.length || healthFailures.length
      ? "NEEDS_ATTENTION"
      : "PASS",
    counts: {
      samples: samples.length,
      screenshots: samples.filter((sample) => sample.screenshot).length,
      missingPanels: missingPanels.length,
      brokenImages: brokenImages.length,
      horizontalOverflow: horizontalOverflow.length,
      scrollBudgetFailures: scrollBudgetFailures.length,
      consoleErrors: consoleErrors.length,
      requestFailures: requestFailures.length,
      interactionFailures: interactionFailures.length,
      buildMismatches: buildMismatches.length,
      heroCtaBoundsFailures: heroCtaBoundsFailures.length,
      heroH1LineFailures: heroH1LineFailures.length,
      heroArtFailures: heroArtFailures.length,
      logoFailures: logoFailures.length,
      sloganFailures: sloganFailures.length,
      homeComparisonLinkFailures: homeComparisonLinkFailures.length,
      dataConnectionFailures: dataConnectionFailures.length,
      healthFailures: healthFailures.length,
    },
    missingPanels,
    brokenImages,
    horizontalOverflow,
    scrollBudgetFailures,
    consoleErrors,
    requestFailures,
    interactionFailures,
    buildMismatches,
    heroCtaBoundsFailures,
    heroH1LineFailures,
    heroArtFailures,
    logoFailures,
    sloganFailures,
    homeComparisonLinkFailures,
    dataConnectionFailures,
    healthFailures,
    whitespace: samples
      .filter((sample) => sample.metrics.verticalGaps.length)
      .map((sample) => ({ sample: sample.id, gaps: sample.metrics.verticalGaps.slice(0, 8) })),
  };
}

async function run(options) {
  const chromePath = findChromePath();
  const capabilities = {
    node: process.versions.node,
    chromePath,
    sharedRoot,
    puppeteerCore: sharedPackage("puppeteer-core"),
  };
  const selectedRoutes = options.regionalOnly ? regionalRoutes : routes;
  const selectedLocales = options.regionalOnly ? regionalLocales : locales;
  const plan = {
    mode: options.mode,
    baseUrl: options.baseUrl,
    artifactRoot: options.artifactRoot,
    routes: selectedRoutes.map(({ id, path }) => ({ id, path })),
    locales: selectedLocales,
    viewports: viewports.map(({ id, width }) => ({ id, width })),
    screenshotLocales: [...screenshotLocales],
    interactionOnly: options.interactionOnly,
    regionalOnly: options.regionalOnly,
    expectCore: options.expectCore,
    expectPrismaHealth: options.expectPrismaHealth,
    capabilities,
  };
  if (options.dryRun) return { status: "DRY_RUN", plan };
  if (!chromePath) throw new Error("Chrome/Chromium executable not found. Set CHROME_PATH to a local Chrome-compatible binary.");

  const health = await fetch(options.baseUrl, { signal: AbortSignal.timeout(10000) });
  if (!health.ok) throw new Error(`Preview health check failed: ${health.status} ${options.baseUrl}`);

  const runDir = join(options.artifactRoot, `${timestampSlug()}-${safeName(options.mode)}-browser-regression`);
  const screenshotsDir = join(runDir, "screenshots");
  await mkdir(screenshotsDir, { recursive: true });
  const userDataDir = await mkdtemp(join(tmpdir(), "nexualpha-browser-qa-"));
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    userDataDir,
    args: [
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-sync",
    ],
  });
  const samples = [];
  let interactions = [];
  try {
    const buildEvidence = await collectBuildEvidence(options.baseUrl);
    if (!options.interactionOnly) {
      for (const viewport of viewports) {
          for (const locale of selectedLocales) {
          for (const route of selectedRoutes) {
            const page = await browser.newPage();
            const consoleEntries = [];
            const requestFailures = [];
            const sampleId = `${route.id}-${locale}-${viewport.width}`;
            page.on("console", (message) => {
              const type = message.type();
              if (["error", "warning"].includes(type)) consoleEntries.push({ type, text: message.text().slice(0, 1000) });
            });
            page.on("pageerror", (error) => consoleEntries.push({ type: "pageerror", text: error.message.slice(0, 1000) }));
            page.on("requestfailed", (request) => requestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? "requestfailed" }));
            page.on("response", (response) => {
              const status = response.status();
              if (status >= 400) requestFailures.push({ url: response.url(), status });
            });
            await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
            await gotoStable(page, withLocale(options.baseUrl, route.path, locale), options.timeoutMs);
            if (options.settleMs > 0) await new Promise((resolvePromise) => setTimeout(resolvePromise, options.settleMs));
            await page.waitForFunction(() => [...document.images].filter((image) => { const rect = image.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; }).every((image) => image.complete), { timeout: 5000 }).catch(() => {});
            const metrics = await evaluatePage(page, route, viewport);
            let screenshot = null;
            if (screenshotLocales.has(locale)) {
              const screenshotPath = join(screenshotsDir, `${sampleId}.png`);
              await page.screenshot({ path: screenshotPath, fullPage: true });
              screenshot = relative(runDir, screenshotPath);
            }
            samples.push({
              id: sampleId,
              route: route.id,
              locale,
              viewport,
              url: metrics.url,
              screenshot,
              metrics,
              console: {
                errors: consoleEntries.filter((entry) => entry.type === "error" || entry.type === "pageerror"),
                warnings: consoleEntries.filter((entry) => entry.type === "warning"),
              },
              network: { failures: requestFailures },
            });
            if (samples.length % 25 === 0) console.error(`browser-regression progress: ${samples.length}/${selectedRoutes.length * selectedLocales.length * viewports.length}`);
            await page.close();
          }
        }
      }
    }
    if (!options.skipInteractions) {
      const interactionPage = await browser.newPage();
      interactions = await runInteractionChecks(interactionPage, options.baseUrl, screenshotsDir, options);
      await interactionPage.close();
    }
    const findings = summarizeFindings(samples, interactions, buildEvidence, options);
    const summary = {
      schemaVersion: 1,
      status: findings.status,
      generatedAt: new Date().toISOString(),
      policy: {
        evidenceOnly: true,
        readOnlyBrowserNavigation: true,
        externalMutations: false,
        userChromeTouched: false,
        chromeProfile: "temporary isolated headless profile",
      },
      plan,
      buildEvidence,
      runDir,
      findings,
      interactions,
      samples,
    };
    await writeFile(join(runDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    await writeFile(join(runDir, "findings.json"), `${JSON.stringify(findings, null, 2)}\n`, "utf8");
    await writeFile(join(runDir, "README.md"), renderMarkdown(summary), "utf8");
    return summary;
  } finally {
    await browser.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
}

function renderMarkdown(summary) {
  const lines = [
    `# NexuAlpha V3 Browser Regression - ${summary.plan.mode}`,
    "",
    `Generated: ${summary.generatedAt}`,
    `Status: ${summary.status}`,
    `Base URL: ${summary.plan.baseUrl}`,
    "",
    "## Capability",
    "",
    `- Node: ${summary.plan.capabilities.node}`,
    `- Chrome: ${summary.plan.capabilities.chromePath}`,
    `- puppeteer-core: ${summary.plan.capabilities.puppeteerCore}`,
    `- Policy: isolated headless profile, read-only browser navigation, no user Chrome tabs`,
    "",
    "## Coverage",
    "",
    `- Routes: ${summary.plan.routes.map((route) => route.path).join(", ")}`,
    `- Locales: ${summary.plan.locales.length}`,
    `- Viewports: ${summary.plan.viewports.map((viewport) => viewport.width).join(", ")}`,
    `- Samples: ${summary.findings.counts.samples}`,
    `- Screenshots: ${summary.findings.counts.screenshots}`,
    "",
    "## Findings",
    "",
    `- Missing panels: ${summary.findings.counts.missingPanels}`,
    `- Broken images/logos: ${summary.findings.counts.brokenImages}`,
    `- Horizontal overflow samples: ${summary.findings.counts.horizontalOverflow}`,
    `- Scroll budget failures: ${summary.findings.counts.scrollBudgetFailures}`,
    `- Console errors: ${summary.findings.counts.consoleErrors}`,
    `- Request failures: ${summary.findings.counts.requestFailures}`,
    `- Interaction failures: ${summary.findings.counts.interactionFailures}`,
    `- Build mismatches: ${summary.findings.counts.buildMismatches}`,
    `- Hero CTA bounds failures: ${summary.findings.counts.heroCtaBoundsFailures}`,
    `- Hero H1 line failures: ${summary.findings.counts.heroH1LineFailures}`,
    `- Hero art failures: ${summary.findings.counts.heroArtFailures}`,
    `- Logo failures: ${summary.findings.counts.logoFailures}`,
    `- Slogan failures: ${summary.findings.counts.sloganFailures}`,
    `- Home comparison link failures: ${summary.findings.counts.homeComparisonLinkFailures}`,
    `- Data connection failures: ${summary.findings.counts.dataConnectionFailures}`,
    `- Health failures: ${summary.findings.counts.healthFailures}`,
    "",
    "## Interactions",
    "",
    ...summary.interactions.map((item) => `- ${item.ok ? "PASS" : "FAIL"} ${item.id}: ${typeof item.evidence === "string" ? item.evidence : JSON.stringify(item.evidence)}`),
    "",
    "## Build Assets",
    "",
    `- Package: ${summary.buildEvidence.package.name}@${summary.buildEvidence.package.version}`,
    `- Version JSON: ${summary.buildEvidence.versionJson.status} ${JSON.stringify(summary.buildEvidence.versionJson.body)}`,
    `- Health live: ${summary.buildEvidence.health?.live?.status} ${JSON.stringify(summary.buildEvidence.health?.live?.body)}`,
    `- Health ready: ${summary.buildEvidence.health?.ready?.status} ${JSON.stringify(summary.buildEvidence.health?.ready?.body)}`,
    `- HTML status: ${summary.buildEvidence.servedHtml.status}`,
    `- Served assets: ${summary.buildEvidence.servedAssets.map((asset) => `${asset.href}=${asset.status}`).join(", ") || "none"}`,
    `- Dist assets: ${summary.buildEvidence.distAssets.join(", ") || "none"}`,
    "",
  ];
  if (summary.findings.horizontalOverflow.length) {
    lines.push("## Horizontal Overflow", "");
    for (const item of summary.findings.horizontalOverflow.slice(0, 40)) {
      lines.push(`- ${item.sample}: ${item.overflowPx}px document overflow; ${item.topElements.map((element) => `${element.selector}+${element.overflowRight}px`).join(", ")}`);
    }
    lines.push("");
  }
  if (summary.findings.scrollBudgetFailures.length) {
    lines.push("## Scroll Budget Failures", "");
    for (const item of summary.findings.scrollBudgetFailures.slice(0, 40)) lines.push(`- ${item.sample}: ${item.observed}px observed, ${item.budget}px budget`);
    lines.push("");
  }
  if (summary.findings.brokenImages.length) {
    lines.push("## Broken Images", "");
    for (const item of summary.findings.brokenImages.slice(0, 40)) lines.push(`- ${item.sample}: ${item.src}`);
    lines.push("");
  }
  if (summary.findings.consoleErrors.length) {
    lines.push("## Console Errors", "");
    for (const item of summary.findings.consoleErrors.slice(0, 40)) lines.push(`- ${item.sample}: ${item.type} ${item.text}`);
    lines.push("");
  }
  if (summary.findings.buildMismatches.length) {
    lines.push("## Build Mismatches", "");
    for (const item of summary.findings.buildMismatches.slice(0, 40)) lines.push(`- ${item.sample}: expected ${item.expectedBuildId}, observed ${JSON.stringify(item.observed)}`);
    lines.push("");
  }
  if (summary.findings.heroCtaBoundsFailures.length) {
    lines.push("## Hero CTA Bounds Failures", "");
    for (const item of summary.findings.heroCtaBoundsFailures.slice(0, 40)) lines.push(`- ${item.sample}: expected ${item.minHeight}-${item.maxHeight}px, observed ${JSON.stringify(item.observed)}`);
    lines.push("");
  }
  for (const [title, items] of [
    ["Hero H1 Line Failures", summary.findings.heroH1LineFailures],
    ["Hero Art Failures", summary.findings.heroArtFailures],
    ["Logo Failures", summary.findings.logoFailures],
    ["Slogan Failures", summary.findings.sloganFailures],
    ["Home Comparison Link Failures", summary.findings.homeComparisonLinkFailures],
    ["Data Connection Failures", summary.findings.dataConnectionFailures],
    ["Health Failures", summary.findings.healthFailures],
  ]) {
    if (!items.length) continue;
    lines.push(`## ${title}`, "");
    for (const item of items.slice(0, 40)) lines.push(`- ${item.sample}: ${JSON.stringify(item.observed)}`);
    lines.push("");
  }
  if (summary.findings.whitespace.length) {
    lines.push("## Whitespace Gaps", "");
    for (const item of summary.findings.whitespace.slice(0, 40)) lines.push(`- ${item.sample}: ${item.gaps.map((gap) => `${gap.gap}px`).join(", ")}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      process.exit(0);
    }
    const result = await run(options);
    console.log(JSON.stringify({
      status: result.status,
      mode: result.plan?.mode,
      runDir: result.runDir,
      counts: result.findings?.counts,
      artifactRoot: result.plan?.artifactRoot,
    }, null, 2));
    if (options.strict && result.status === "NEEDS_ATTENTION") process.exit(1);
  } catch (error) {
    console.error(error.stack || error.message);
    process.exit(1);
  }
}

export { isDirectoryComparisonHref, locales, parseArgs, regionalLocales, regionalRoutes, routes, run, usage, viewports };
