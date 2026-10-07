#!/usr/bin/env node
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dataStatusCopy } from "../src/content/data-status-copy.js";
import { neutralVenueCatalog } from "../src/data/market-command.js";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = resolve(scriptPath, "..", "..");
const workspaceRoot = resolve(projectRoot, "..");
const sharedRoot = "/Users/bestberlin/.codex/shared-tools/web-quality";
const sharedRequire = createRequire(join(sharedRoot, "package.json"));
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

function parseArgs(argv) {
  const args = {
    artifactRoot: join(workspaceRoot, "artifacts", "v3-repair"),
    distDir: join(projectRoot, "dist", "client"),
    mode: "core-recovery",
    timeoutMs: 30000,
    dryRun: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--artifact-root" && argv[index + 1]) args.artifactRoot = resolve(argv[++index]);
    else if (arg === "--dist-dir" && argv[index + 1]) args.distDir = resolve(argv[++index]);
    else if (arg === "--mode" && argv[index + 1]) args.mode = argv[++index];
    else if (arg === "--timeout-ms" && argv[index + 1]) args.timeoutMs = Number(argv[++index]);
    else throw new Error(`Unknown or incomplete argument: ${arg}`);
  }
  return args;
}

function usage() {
  return [
    "node scripts/verify-core-recovery.mjs [options]",
    "",
    "Runs test-only browser fault recovery checks against current dist/client with a local API stub.",
    "",
    "Options:",
    "  --artifact-root DIR  Evidence root. Default: ../artifacts/v3-repair",
    "  --dist-dir DIR       Built client directory. Default: dist/client",
    "  --mode NAME          Evidence run label. Default: core-recovery",
    "  --dry-run            Print run plan without launching Chrome",
  ].join("\n");
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

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function collectDistEvidence(distDir) {
  const html = await readFile(join(distDir, "index.html"), "utf8");
  const versionJson = await readJson(join(distDir, "version.json")).catch((error) => ({ error: error.message }));
  const assetHrefs = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1]);
  const assets = [];
  for (const href of assetHrefs) {
    const assetPath = join(distDir, href.replace(/^\//, ""));
    const bytes = await readFile(assetPath).catch(() => null);
    assets.push({
      href,
      exists: Boolean(bytes),
      sha256: bytes ? sha256(bytes) : null,
      bytes: bytes ? bytes.length : 0,
    });
  }
  return {
    versionJson,
    html: { sha256: sha256(html), bytes: Buffer.byteLength(html) },
    assets,
  };
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
const currentUpdate = {
  id: "test-only-approved-current",
  kind: "PLATFORM_ACTIVITY",
  platform: { slug: "binance", name: "Binance" },
  title: "TEST-ONLY approved current activity",
  officialSource: { type: "OFFICIAL", url: "https://www.binance.com/en/support/announcement/test-only" },
  discoveredAt: "2026-09-04T01:00:00.000Z",
  reviewStatus: "APPROVED",
  verifiedAt: "2026-09-04T02:00:00.000Z",
  expiresAt: "2099-01-01T00:00:00.000Z",
  fixture: false,
};
const rejectedUpdates = [
  { ...currentUpdate, id: "test-only-fixture", title: "TEST-ONLY fixture should not render", fixture: true },
  { ...currentUpdate, id: "test-only-pending", title: "TEST-ONLY pending should not render", reviewStatus: "PENDING" },
  { ...currentUpdate, id: "test-only-expired", title: "TEST-ONLY expired should not render", expiresAt: "2026-01-01T00:00:00.000Z" },
  { ...currentUpdate, id: "test-only-revoked", title: "TEST-ONLY revoked should not render", reviewStatus: "REVOKED" },
];

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(`${JSON.stringify(body)}\n`);
}

async function sendStatic(response, distDir, pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const requested = decodedPath === "/" ? "/index.html" : decodedPath;
  const target = resolve(distDir, `.${requested}`);
  const root = resolve(distDir);
  const fallback = join(root, "index.html");
  const safeTarget = target.startsWith(root) ? target : fallback;
  const file = await stat(safeTarget).then((stats) => stats.isFile() ? safeTarget : fallback).catch(() => fallback);
  const body = await readFile(file);
  response.writeHead(200, { "content-type": mimeTypes.get(extname(file)) ?? "application/octet-stream", "cache-control": "no-store" });
  response.end(body);
}

function createApiState() {
  return { phase: "ready-mixed", sentiment: "valid", requests: [] };
}

function sentimentSnapshot(kind) {
  const base = {
    provider: "alternative-me",
    sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/",
    fetchedAt: "2026-09-04T03:00:00.000Z",
    freshness: "fresh",
    value: 65,
    classification: "Greed",
    asOf: "2026-09-04T02:00:00.000Z",
  };
  if (kind === "malformed") return { ...base, value: "65" };
  if (kind === "future") return { ...base, asOf: "2099-01-01T00:00:00.000Z" };
  if (kind === "expired") return { ...base, asOf: "2026-01-01T00:00:00.000Z" };
  if (kind === "bad-source") return { ...base, sourceUrl: "https://example.invalid/not-alternative-me" };
  return base;
}

function handleApi(request, response, state) {
  const url = new URL(request.url, "http://127.0.0.1");
  state.requests.push({ phase: state.phase, method: request.method, pathname: url.pathname });
  if (state.phase === "offline" && !url.pathname.startsWith("/api/v1/health/")) {
    json(response, 503, { status: "error", reasonCode: "TEST_ONLY_OFFLINE" });
    return;
  }
  if (url.pathname === "/api/v1/health/live") {
    json(response, 200, { status: "live", buildId: "TEST-ONLY-APIstub", dependencies: {} });
    return;
  }
  if (url.pathname === "/api/v1/health/ready") {
    json(response, 200, { status: "ready", buildId: "TEST-ONLY-APIstub", dependencies: { repository: { ready: true, source: "prisma" } } });
    return;
  }
  if (url.pathname === "/api/v1/site/bootstrap") {
    json(response, 200, { contentVersion: { id: "TEST-ONLY-APIstub-content-v1" } });
    return;
  }
  if (url.pathname === "/api/v1/opportunities") {
    json(response, 200, { data: [] });
    return;
  }
  if (url.pathname === "/api/v1/venues") {
    json(response, 200, state.phase === "unavailable" ? { status: "unavailable", data: [] } : { status: "available", data: venues });
    return;
  }
  if (url.pathname === "/api/v1/listings") {
    json(response, 200, { availability: "unavailable", reasonCode: "NO_COMPARABLE_AUTHORIZED_SOURCE", data: [] });
    return;
  }
  if (url.pathname === "/api/v1/official-updates") {
    const data = state.phase === "ready-empty" ? [] : state.phase === "ready-revoked" ? [{ ...currentUpdate, reviewStatus: "REVOKED" }] : [currentUpdate, ...rejectedUpdates];
    json(response, 200, state.phase === "unavailable" ? { status: "unavailable", data: [] } : { status: "available", data });
    return;
  }
  if (url.pathname === "/api/v1/market/asset-pulse" || url.pathname === "/api/v1/market/exchange-snapshots") {
    json(response, 200, { status: "unavailable", provider: null, sourceUrl: null, fetchedAt: null, freshness: "unavailable", attribution: null, reasonCode: "TEST_ONLY_UNAVAILABLE", data: [] });
    return;
  }
  if (url.pathname === "/api/v1/market/crypto-sentiment") {
    json(response, 200, { data: sentimentSnapshot(state.sentiment) });
    return;
  }
  json(response, 404, { status: "error", reasonCode: "TEST_ONLY_NOT_FOUND" });
}

async function startServer(distDir, state) {
  const server = createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    if (url.pathname.startsWith("/api/v1/")) {
      handleApi(request, response, state);
      return;
    }
    sendStatic(response, distDir, url.pathname).catch((error) => json(response, 500, { status: "error", message: error.message }));
  });
  await new Promise((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function gotoStable(page, url, timeoutMs) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await page.waitForSelector("main, footer", { timeout: Math.min(timeoutMs, 10000) });
  try {
    await page.waitForNetworkIdle({ idleTime: 250, timeout: 2500 });
  } catch {
    // API fault states intentionally settle through React data-status checks below.
  }
}

function withLocale(baseUrl, path, locale = "en") {
  const url = new URL(path, baseUrl);
  url.searchParams.set("locale", locale);
  return url.href;
}

async function readConnection(page) {
  return page.evaluate(() => {
    const container = document.querySelector(".data-connection");
    const status = container?.querySelector("[role='status']");
    return {
      url: location.href,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      dataStatus: document.documentElement.dataset.dataStatus || null,
      dataSource: document.documentElement.dataset.dataSource || null,
      contentVersion: document.documentElement.dataset.contentVersion || null,
      buildId: document.documentElement.dataset.build || null,
      footerBuildId: document.querySelector(".build-identity")?.textContent?.trim() || null,
      footerStatus: container?.getAttribute("data-status") || null,
      statusText: status?.textContent?.trim().replace(/\s+/g, " ") || null,
      refreshDisabled: Boolean(container?.querySelector("button")?.disabled),
    };
  });
}

async function waitForDataStatus(page, status, timeoutMs) {
  await page.waitForFunction((expected) => document.documentElement.dataset.dataStatus === expected, { timeout: timeoutMs }, status);
  return readConnection(page);
}

function assertResult(condition, id, evidence) {
  if (!condition) {
    const error = new Error(`${id} failed`);
    error.evidence = evidence;
    throw error;
  }
}

async function waitForApiRequestAfter(state, pathname, previousCount, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const count = state.requests.filter((request) => request.pathname === pathname).length;
    if (count > previousCount) return count;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 25));
  }
  throw new Error(`Timed out waiting for ${pathname} request after ${previousCount}`);
}

async function blockExternalRequests(page, baseUrl, externalRequests) {
  const origin = new URL(baseUrl).origin;
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith(origin) || url.startsWith("data:") || url.startsWith("blob:")) {
      request.continue();
      return;
    }
    externalRequests.push(url);
    request.abort("blockedbyclient");
  });
}

async function runBrowserChecks({ page, baseUrl, screenshotsDir, state, timeoutMs, distEvidence }) {
  const results = [];

  state.phase = "offline";
  await gotoStable(page, withLocale(baseUrl, "/", "en"), timeoutMs);
  const offline = await waitForDataStatus(page, "error", timeoutMs);
  assertResult(offline.dataSource !== "core" && offline.statusText === dataStatusCopy("en").error, "offline-shows-error-not-connected", offline);
  results.push({ id: "offline-shows-error-not-connected", ok: true, evidence: offline });

  state.phase = "ready-mixed";
  await page.click(".data-connection button");
  const recovered = await waitForDataStatus(page, "ready", timeoutMs);
  assertResult(
    recovered.dataSource === "core"
      && recovered.contentVersion === "TEST-ONLY-APIstub-content-v1"
      && recovered.statusText === dataStatusCopy("en").ready
      && recovered.buildId === distEvidence.versionJson.buildId
      && recovered.footerBuildId === distEvidence.versionJson.buildId,
    "refresh-recovers-to-core-ready",
    { recovered, expectedBuildId: distEvidence.versionJson.buildId },
  );
  await page.screenshot({ path: join(screenshotsDir, "TEST-ONLY-APIstub-offline-refresh-ready.png"), fullPage: true });
  results.push({ id: "refresh-recovers-to-core-ready", ok: true, evidence: recovered });

  state.phase = "unavailable";
  await gotoStable(page, withLocale(baseUrl, "/", "en"), timeoutMs);
  const unavailable = await waitForDataStatus(page, "error", timeoutMs);
  assertResult(unavailable.dataSource !== "core" && unavailable.statusText === dataStatusCopy("en").error, "http-200-unavailable-shows-error", unavailable);
  results.push({ id: "http-200-unavailable-shows-error", ok: true, evidence: unavailable });

  state.phase = "ready-mixed";
  await gotoStable(page, withLocale(baseUrl, "/", "en"), timeoutMs);
  for (const locale of ["zh-Hans", "zh-Hant", "en"]) {
    await page.select(".v2-header__tools select", locale);
  }
  await page.waitForFunction(() => new URLSearchParams(location.search).get("locale") === "en" && document.documentElement.dataset.dataStatus === "ready", { timeout: timeoutMs });
  const localeState = await readConnection(page);
  assertResult(localeState.statusText === dataStatusCopy("en").ready && localeState.lang === "en", "rapid-locale-switch-keeps-current-copy", localeState);
  results.push({ id: "rapid-locale-switch-keeps-current-copy", ok: true, evidence: localeState });

  state.phase = "ready-empty";
  await gotoStable(page, withLocale(baseUrl, "/exchanges", "en"), timeoutMs);
  const directory = await waitForDataStatus(page, "ready", timeoutMs);
  const directoryCount = await page.$$eval(".venue-card", (cards) => cards.length);
  assertResult(directoryCount === 21 && directory.dataSource === "core", "empty-updates-preserve-21-directory-venues", { directory, directoryCount });
  await gotoStable(page, withLocale(baseUrl, "/activities", "en"), timeoutMs);
  await waitForDataStatus(page, "ready", timeoutMs);
  const emptyActivityState = await page.evaluate(() => ({
    cards: document.querySelectorAll(".activity-card-v3").length,
    sourceCardsBeforeExpand: document.querySelectorAll(".activity-center-v3__source-grid article").length,
    showAllButton: Boolean(document.querySelector(".activity-center-v3__sources-head button")),
  }));
  if (emptyActivityState.showAllButton) await page.click(".activity-center-v3__sources-head button");
  const sourceCardsAfterExpand = await page.$$eval(".activity-center-v3__source-grid article", (cards) => cards.length);
  await page.screenshot({ path: join(screenshotsDir, "TEST-ONLY-APIstub-empty-updates-directory-21.png"), fullPage: true });
  assertResult(emptyActivityState.cards === 0 && sourceCardsAfterExpand === 21, "empty-updates-activity-sources-preserve-21-venues", { ...emptyActivityState, sourceCardsAfterExpand });
  results.push({ id: "empty-updates-preserve-21-directory-venues", ok: true, evidence: { directoryCount, sourceCardsAfterExpand } });

  state.phase = "ready-mixed";
  await gotoStable(page, withLocale(baseUrl, "/activities", "en"), timeoutMs);
  await waitForDataStatus(page, "ready", timeoutMs);
  const activityList = await page.evaluate(() => ({
    cards: [...document.querySelectorAll(".activity-card-v3")].map((card) => card.textContent.trim().replace(/\s+/g, " ")),
    detailHref: document.querySelector(".activity-card-v3 .activity-center-v3__source-actions a")?.href || null,
  }));
  assertResult(activityList.cards.length === 1 && activityList.cards[0].includes(currentUpdate.title) && !activityList.cards[0].includes("fixture should not render") && !activityList.cards[0].includes("expired should not render") && !activityList.cards[0].includes("revoked should not render"), "only-current-approved-nonfixture-activity-renders", activityList);
  results.push({ id: "only-current-approved-nonfixture-activity-renders", ok: true, evidence: activityList });

  await gotoStable(page, activityList.detailHref, timeoutMs);
  await waitForDataStatus(page, "ready", timeoutMs);
  const detail = await page.evaluate(() => ({
    path: location.pathname,
    heading: document.querySelector(".v3-page-hero h1")?.textContent?.trim() || null,
    matrixVisible: Boolean(document.querySelector(".v3-matrix")?.getClientRects().length),
  }));
  await page.screenshot({ path: join(screenshotsDir, "TEST-ONLY-APIstub-activity-detail.png"), fullPage: true });
  assertResult(detail.path === `/activities/${currentUpdate.id}` && detail.heading === currentUpdate.title && detail.matrixVisible, "activity-center-detail-link-opens-detail-route", detail);
  results.push({ id: "activity-center-detail-link-opens-detail-route", ok: true, evidence: detail });

  state.phase = "ready-revoked";
  await gotoStable(page, withLocale(baseUrl, "/activities", "en"), timeoutMs);
  await waitForDataStatus(page, "ready", timeoutMs);
  const beforeRevokeRefresh = await page.$$eval(".activity-card-v3", (cards) => cards.length);
  await page.click(".data-connection button");
  await waitForDataStatus(page, "ready", timeoutMs);
  const revoked = await page.evaluate(() => ({
    cards: document.querySelectorAll(".activity-card-v3").length,
    emptyVisible: Boolean(document.querySelector(".activity-center-v3__empty[role='status']")?.getClientRects().length),
  }));
  assertResult(beforeRevokeRefresh === 0 && revoked.cards === 0 && revoked.emptyVisible, "expired-or-revoked-refresh-disappears", { beforeRevokeRefresh, revoked });
  results.push({ id: "expired-or-revoked-refresh-disappears", ok: true, evidence: { beforeRevokeRefresh, revoked } });

  state.phase = "ready-mixed";
  state.sentiment = "valid";
  await gotoStable(page, withLocale(baseUrl, "/", "en"), timeoutMs);
  await waitForDataStatus(page, "ready", timeoutMs);
  await page.waitForSelector(".crypto-sentiment", { timeout: timeoutMs });
  const validSentiment = await page.$eval(".crypto-sentiment", (element) => element.textContent.trim().replace(/\s+/g, " "));
  assertResult(validSentiment.includes("65") && /Greed|贪婪|貪婪|Greed/i.test(validSentiment), "valid-sentiment-renders-source-bound-snapshot", validSentiment);
  results.push({ id: "valid-sentiment-renders-source-bound-snapshot", ok: true, evidence: validSentiment });

  const rejectedSentimentEvidence = [];
  for (const sentiment of ["malformed", "future", "expired", "bad-source"]) {
    state.sentiment = sentiment;
    const previousSentimentRequests = state.requests.filter((request) => request.pathname === "/api/v1/market/crypto-sentiment").length;
    await page.click(".data-connection button");
    await waitForApiRequestAfter(state, "/api/v1/market/crypto-sentiment", previousSentimentRequests, timeoutMs);
    await waitForDataStatus(page, "ready", timeoutMs);
    await page.waitForFunction(() => !document.querySelector(".crypto-sentiment"), { timeout: timeoutMs });
    const stateAfterRefresh = await page.evaluate((currentSentiment) => ({
      sentiment: currentSentiment,
      sentimentVisible: Boolean(document.querySelector(".crypto-sentiment")),
      mainVisible: Boolean(document.querySelector("main")?.getClientRects().length),
      footerStatus: document.querySelector(".data-connection")?.getAttribute("data-status") || null,
    }), sentiment);
    rejectedSentimentEvidence.push(stateAfterRefresh);
  }
  assertResult(rejectedSentimentEvidence.every((item) => item.mainVisible && item.footerStatus === "ready" && !item.sentimentVisible), "invalid-sentiment-refresh-fails-closed", rejectedSentimentEvidence);
  results.push({ id: "invalid-sentiment-refresh-fails-closed", ok: true, evidence: rejectedSentimentEvidence });

  return results;
}

async function run(options) {
  const chromePath = findChromePath();
  const capabilities = {
    node: process.versions.node,
    chromePath,
    sharedRoot,
    puppeteerCore: JSON.parse(await readFile(sharedRequire.resolve("puppeteer-core/package.json"), "utf8")).version,
  };
  const plan = {
    mode: options.mode,
    artifactRoot: options.artifactRoot,
    distDir: options.distDir,
    capabilities,
    policy: "TEST-ONLY API stub, ephemeral local HTTP server, isolated Chrome profile, no real backend or third-party requests",
  };
  if (options.dryRun) return { status: "DRY_RUN", plan };
  if (!chromePath) throw new Error("Chrome/Chromium executable not found. Set CHROME_PATH to a local Chrome-compatible binary.");
  if (!existsSync(join(options.distDir, "index.html"))) throw new Error(`dist client index.html not found: ${options.distDir}`);
  const distEvidence = await collectDistEvidence(options.distDir);

  const runDir = join(options.artifactRoot, `${timestampSlug()}-${safeName(options.mode)}-${safeName(distEvidence.versionJson.buildId ?? "unknown-build")}-TEST-ONLY-APIstub-core-recovery`);
  const screenshotsDir = join(runDir, "screenshots");
  await mkdir(screenshotsDir, { recursive: true });

  const state = createApiState();
  const { server, baseUrl } = await startServer(options.distDir, state);
  const userDataDir = await mkdtemp(join(tmpdir(), "nexualpha-core-recovery-"));
  const externalRequests = [];
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    userDataDir,
    args: ["--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-background-networking", "--disable-sync"],
  });

  try {
    const page = await browser.newPage();
    await blockExternalRequests(page, baseUrl, externalRequests);
    const results = await runBrowserChecks({ page, baseUrl, screenshotsDir, state, timeoutMs: options.timeoutMs, distEvidence });
    await page.close();
    const summary = {
      schemaVersion: 1,
      status: results.every((result) => result.ok) && externalRequests.length === 0 ? "PASS" : "NEEDS_ATTENTION",
      generatedAt: new Date().toISOString(),
      testOnly: true,
      warning: "TEST-ONLY/APIstub evidence proves frontend recovery behavior only; it is not real DB/Core backend evidence.",
      plan: { ...plan, baseUrl },
      distEvidence,
      runDir,
      counts: { checks: results.length, externalRequests: externalRequests.length, apiRequests: state.requests.length, screenshots: 3, assets: distEvidence.assets.length },
      results,
      externalRequests,
      apiRequests: state.requests,
    };
    await writeFile(join(runDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    await writeFile(join(runDir, "README.md"), renderMarkdown(summary), "utf8");
    return summary;
  } finally {
    await browser.close();
    await rm(userDataDir, { recursive: true, force: true });
    await new Promise((resolvePromise) => server.close(resolvePromise));
  }
}

function renderMarkdown(summary) {
  return `${[
    `# TEST-ONLY/APIstub Core Recovery Browser QA - ${summary.plan.mode}`,
    "",
    `Generated: ${summary.generatedAt}`,
    `Status: ${summary.status}`,
    `Base URL: ${summary.plan.baseUrl}`,
    `Build ID: ${summary.distEvidence.versionJson.buildId ?? "unknown"}`,
    "",
    "> This evidence uses a local ephemeral API stub and isolated Chrome profile. It does not prove real Core DB connectivity.",
    "",
    "## Results",
    "",
    ...summary.results.map((result) => `- ${result.ok ? "PASS" : "FAIL"} ${result.id}: ${JSON.stringify(result.evidence)}`),
    "",
    "## Counts",
    "",
    `- Checks: ${summary.counts.checks}`,
    `- Screenshots: ${summary.counts.screenshots}`,
    `- API requests: ${summary.counts.apiRequests}`,
    `- Blocked external requests: ${summary.counts.externalRequests}`,
    `- Assets: ${summary.distEvidence.assets.map((asset) => `${asset.href} ${asset.sha256}`).join(", ")}`,
    "",
  ].join("\n")}\n`;
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
      mode: result.plan.mode,
      runDir: result.runDir,
      counts: result.counts,
    }, null, 2));
    if (result.status !== "PASS") process.exit(1);
  } catch (error) {
    console.error(error.stack || error.message);
    if (error.evidence) console.error(JSON.stringify(error.evidence, null, 2));
    process.exit(1);
  }
}

export { parseArgs, run, usage };
