#!/usr/bin/env node
import http from "node:http";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const SHARED_WEB_QUALITY_ROOT = process.env.CODEX_WEB_QUALITY_ROOT || "/Users/bestberlin/.codex/shared-tools/web-quality";
const sharedRequire = createRequire(path.join(SHARED_WEB_QUALITY_ROOT, "package.json"));
const puppeteer = sharedRequire("puppeteer-core");
const Ajv = require("../../backend/node_modules/ajv");
const addFormats = require("../../backend/node_modules/ajv-formats");
const YAML = require("../../backend/node_modules/yaml");

const PROJECT_ROOT = process.cwd();
const DIST_ROOT = path.join(PROJECT_ROOT, "dist/client");
const EVIDENCE_ROOT = path.resolve(PROJECT_ROOT, "..", "artifacts/v3-repair");
const OFFER_ID = "123e4567-e89b-42d3-a456-426614174111";
const HANDOFF_ID = "123e4567-e89b-42d3-a456-426614174222";
const DISCLOSURE_VERSION = "disc-2026-09-05";
const OFFICIAL_HOST = "www.binance.com";
const DESTINATION = `https://${OFFICIAL_HOST}/register?test-only=1`;

const args = new Set(process.argv.slice(2));
const keepOpen = args.has("--keep-open");

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
const openapi = YAML.parse(await fs.readFile(path.resolve(PROJECT_ROOT, "../backend/openapi.yaml"), "utf8"));
const validateHandoffRequest = ajv.compile(openapi.components.schemas.OutboundHandoffRequest);

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

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

function send(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": contentType });
  res.end(body);
}

function contentType(filePath) {
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
  }[path.extname(filePath)] ?? "application/octet-stream";
}

function createOffer() {
  return {
    offerId: OFFER_ID,
    venueSlug: "binance",
    officialHost: OFFICIAL_HOST,
    offerVersion: 1,
    disclosureText: "TEST-ONLY original reviewed partner disclosure: verify eligibility yourself before leaving NexuAlpha.",
    disclosureVersion: DISCLOSURE_VERSION,
    country: "TW",
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  };
}

async function createServer() {
  const state = { offerMode: "ready", postMode: "success", gets: [], posts: [] };
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/__control") {
      if (url.searchParams.has("offerMode")) state.offerMode = url.searchParams.get("offerMode");
      if (url.searchParams.has("postMode")) state.postMode = url.searchParams.get("postMode");
      if (url.searchParams.get("reset") === "1") {
        state.gets = [];
        state.posts = [];
      }
      return json(res, 200, { ok: true, state: { offerMode: state.offerMode, postMode: state.postMode } });
    }
    if (url.pathname === "/__calls") return json(res, 200, { gets: state.gets, posts: state.posts });
    if (url.pathname === "/api/v1/venues/binance/outbound-offer") {
      state.gets.push({ country: url.searchParams.get("country"), at: Date.now() });
      if (state.offerMode === "hang") {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        return json(res, 200, { data: createOffer() });
      }
      if (state.offerMode === "unavailable") return json(res, 503, { status: "unavailable", reasonCode: "TEST_ONLY_UNAVAILABLE" });
      if (url.searchParams.get("country") !== "TW") return json(res, 404, { error: { code: "OFFER_NOT_FOUND" } });
      return json(res, 200, { data: createOffer() });
    }
    if (url.pathname === "/api/v1/outbound-handoffs" && req.method === "POST") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf8");
      const parsed = JSON.parse(raw);
      const openapiValid = validateHandoffRequest(parsed);
      state.posts.push({ raw, parsed, openapiValid, openapiErrors: validateHandoffRequest.errors ?? [], at: Date.now() });
      if (!openapiValid) return json(res, 400, { error: { code: "TEST_ONLY_OPENAPI_INVALID" } });
      if (state.postMode === "fail-once") {
        state.postMode = "success";
        return json(res, 503, { error: { code: "TEST_ONLY_NETWORK_FAIL" } });
      }
      if (state.postMode === "stale-404") return json(res, 404, { error: { code: "OFFER_NOT_FOUND" } });
      if (state.postMode === "stale-409") return json(res, 409, { error: { code: "OFFER_VERSION_STALE" } });
      if (state.postMode === "hang") await new Promise((resolve) => setTimeout(resolve, 10_000));
      if (state.postMode === "delay-success") await new Promise((resolve) => setTimeout(resolve, 900));
      return json(res, 201, { data: {
        id: HANDOFF_ID,
        handoffRequested: true,
        disposition: "ELIGIBLE_NO_NAVIGATION",
        navigationRecorded: false,
        conversionRecorded: false,
        destination: DESTINATION,
        officialHost: OFFICIAL_HOST,
        replayed: state.posts.length > 1,
      } });
    }

    let filePath = path.normalize(decodeURIComponent(url.pathname));
    if (filePath === "/" || !path.extname(filePath)) filePath = "/index.html";
    const target = path.join(DIST_ROOT, filePath);
    if (!target.startsWith(DIST_ROOT)) return send(res, 403, "forbidden");
    try {
      return send(res, 200, await fs.readFile(target), contentType(target));
    } catch {
      return send(res, 200, await fs.readFile(path.join(DIST_ROOT, "index.html")), "text/html; charset=utf-8");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, state, base: `http://127.0.0.1:${server.address().port}` };
}

async function main() {
  const version = JSON.parse(await fs.readFile(path.join(DIST_ROOT, "version.json"), "utf8"));
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const evidence = path.join(EVIDENCE_ROOT, `handoff-${stamp}`);
  await fs.mkdir(evidence, { recursive: true });
  const runtime = await createServer();
  const { server, base } = runtime;
  let browser;
  let userDataDir;
  let preserveResources = false;
  let cleanedUp = false;
  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    await browser?.close().catch(() => {});
    await new Promise((resolve) => server.close(resolve));
    if (userDataDir) await fs.rm(userDataDir, { recursive: true, force: true });
  };
  const handleSignal = (signal) => {
    cleanup()
      .catch((error) => console.error(error))
      .finally(() => process.exit(signal === "SIGINT" ? 130 : 143));
  };
  process.once("SIGINT", handleSignal);
  process.once("SIGTERM", handleSignal);
  try {
  userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "nexualpha-handoff-qa-"));
  const chromePath = findChromePath();
  assert.ok(chromePath, "Chrome or Chromium executable must be available for browser handoff QA");
  browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    userDataDir,
    args: ["--no-first-run", "--no-default-browser-check"],
  });
  const page = await browser.newPage();
  const interceptedNavigations = [];
  const allInterceptedNavigations = [];
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith(`https://${OFFICIAL_HOST}/`)) {
      interceptedNavigations.push(url);
      allInterceptedNavigations.push(url);
      request.abort();
      return;
    }
    request.continue();
  });

  const results = { base, evidence, version, screenshots: [], metrics: {}, interactions: {}, interceptedNavigations, allInterceptedNavigations, pageErrors };
  const control = (query) => fetch(`${base}/__control?${query}`);
  const calls = async () => (await (await fetch(`${base}/__calls`)).json());
  const goto = async (locale, width) => {
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    await page.goto(`${base}/exchanges/binance?locale=${encodeURIComponent(locale)}`, { waitUntil: "networkidle0" });
    await page.waitForSelector(".outbound-handoff");
  };
  const screenshot = async (name) => {
    await page.evaluate(async () => {
      document.querySelector(".outbound-handoff")?.scrollIntoView({ block: "center" });
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
    const file = path.join(evidence, `${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    results.screenshots.push(file);
  };
  const elementScreenshot = async (selector, name) => {
    await page.evaluate((targetSelector) => {
      document.querySelector(targetSelector)?.scrollIntoView({ block: "center" });
    }, selector);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const element = await page.$(selector);
    assert.ok(element, `${selector} must exist before taking evidence screenshot`);
    const file = path.join(evidence, `${name}.png`);
    await element.screenshot({ path: file });
    results.screenshots.push(file);
  };
  const chooseTw = async () => {
    await page.select(".outbound-handoff__country select", "TW");
    await page.waitForSelector(".outbound-handoff__host");
  };

  await control("reset=1&offerMode=ready&postMode=success");
  for (const locale of ["zh-Hans", "zh-Hant"]) {
    for (const width of [390, 1024, 1440]) {
      await goto(locale, width);
      if (locale === "zh-Hans" && width === 390) results.interactions.noLookupBeforeCountry = (await calls()).gets.length === 0;
      await chooseTw();
      await screenshot(`TEST-ONLY-ready-${locale}-${width}`);
      if (locale === "zh-Hans" && width === 1440) {
        await elementScreenshot(".v3-profile-decision", "TEST-ONLY-parent-grid-zh-Hans-1440");
      }
      if (width === 1024 || width === 1440 || width === 390) {
        results.metrics[`${locale}-${width}`] = await page.evaluate(() => {
          const card = document.querySelector(".v3-detail-grid__handoff")?.getBoundingClientRect();
          const grid = document.querySelector(".v3-profile-decision")?.getBoundingClientRect();
          const checkbox = document.querySelector(".outbound-handoff__consent")?.getBoundingClientRect();
          const button = document.querySelector(".outbound-handoff button:last-of-type")?.getBoundingClientRect();
          const editorialCards = Array.from(document.querySelectorAll(".v3-profile-decision > article:not(.v3-detail-grid__handoff)")).slice(0, 4).map((item) => {
            const rect = item.getBoundingClientRect();
            return { left: Math.round(rect.left), top: Math.round(rect.top), bottom: Math.round(rect.bottom), width: Math.round(rect.width) };
          });
          return {
            cardWidth: card?.width ?? 0,
            gridWidth: grid?.width ?? 0,
            fullWidthRatio: card && grid ? card.width / grid.width : 0,
            checkboxHitHeight: checkbox?.height ?? 0,
            buttonHeight: button?.height ?? 0,
            documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            editorialCards,
            handoffTop: card?.top ? Math.round(card.top) : 0,
          };
        });
      }
    }
  }

  await control("reset=1&offerMode=unavailable&postMode=success");
  for (const width of [390, 1440]) {
    await goto("zh-Hans", width);
    await page.select(".outbound-handoff__country select", "TW");
    await page.waitForFunction(() => document.querySelector(".outbound-handoff")?.textContent.includes("暂不可用"));
    await screenshot(`TEST-ONLY-unavailable-card-zh-Hans-${width}`);
  }
  results.interactions.unavailableHasNoSubmit = await page.evaluate(() => !Array.from(document.querySelectorAll(".outbound-handoff button")).some((button) => /打开官方网站/.test(button.textContent ?? "")));

  await control("reset=1&offerMode=hang&postMode=success");
  await goto("zh-Hans", 390);
  await page.select(".outbound-handoff__country select", "TW");
  await page.waitForFunction(() => document.querySelector(".outbound-handoff")?.textContent.includes("暂不可用"), { timeout: 9500 });
  results.interactions.getTimeoutShowsRetry = await page.evaluate(() => ({
    unavailable: document.querySelector(".outbound-handoff")?.textContent.includes("暂不可用"),
    retry: Array.from(document.querySelectorAll(".outbound-handoff button")).some((button) => /重新核对入口/.test(button.textContent ?? "")),
  }));

  await control("reset=1&offerMode=ready&postMode=success");
  await goto("zh-Hans", 390);
  await chooseTw();
  results.interactions.readyState = await page.evaluate(() => ({
    disclosureVisible: document.querySelector(".outbound-handoff")?.textContent.includes("TEST-ONLY original reviewed partner disclosure"),
    checkboxDefaultFalse: document.querySelector(".outbound-handoff input[type='checkbox']")?.checked === false,
    submitDisabledBeforeConsent: document.querySelector(".outbound-handoff button:last-of-type")?.disabled === true,
    selectHasLabel: document.querySelector("label[for='outbound-handoff-binance-country']") !== null,
    hostBidi: (() => {
      const host = document.querySelector(".outbound-handoff__host");
      return { lang: host?.getAttribute("lang"), dir: host?.getAttribute("dir"), translate: host?.getAttribute("translate") };
    })(),
  }));
  await page.click(".outbound-handoff__consent input");
  await page.click(".outbound-handoff button:last-of-type");
  await new Promise((resolve) => setTimeout(resolve, 500));
  let currentCalls = await calls();
  results.interactions.successPost = currentCalls.posts.at(-1);
  results.interactions.navigationWasIntercepted = interceptedNavigations.includes(DESTINATION);

  await control("reset=1&offerMode=ready&postMode=fail-once");
  await goto("zh-Hant", 390);
  await chooseTw();
  await page.click(".outbound-handoff__consent input");
  await page.click(".outbound-handoff button:last-of-type");
  await page.waitForSelector(".outbound-handoff__error");
  const firstTry = await calls();
  await page.click(".outbound-handoff button:last-of-type");
  await new Promise((resolve) => setTimeout(resolve, 500));
  const secondTry = await calls();
  results.interactions.retryKeepsIdempotencyKey = Boolean(firstTry.posts[0]?.parsed?.idempotencyKey && firstTry.posts[0].parsed.idempotencyKey === secondTry.posts[1]?.parsed?.idempotencyKey);
  results.interactions.retryPostedTwice = secondTry.posts.length === 2;

  await control("reset=1&offerMode=ready&postMode=hang");
  await goto("zh-Hans", 390);
  await chooseTw();
  await page.click(".outbound-handoff__consent input");
  await page.click(".outbound-handoff button:last-of-type");
  await page.waitForSelector(".outbound-handoff__error", { timeout: 9500 });
  results.interactions.postTimeoutShowsError = await page.evaluate(() => document.querySelector(".outbound-handoff__error") !== null);
  const postTimeoutFirst = await calls();
  await control("offerMode=ready&postMode=success");
  await page.click(".outbound-handoff button:last-of-type");
  await new Promise((resolve) => setTimeout(resolve, 500));
  const postTimeoutRetry = await calls();
  results.interactions.postTimeoutRetryKeepsIdempotencyKey = Boolean(postTimeoutFirst.posts[0]?.parsed?.idempotencyKey && postTimeoutFirst.posts[0].parsed.idempotencyKey === postTimeoutRetry.posts[1]?.parsed?.idempotencyKey);

  for (const statusCode of [409, 404]) {
    await control(`reset=1&offerMode=ready&postMode=stale-${statusCode}`);
    await goto("zh-Hans", 390);
    await chooseTw();
    await page.click(".outbound-handoff__consent input");
    const beforeErrors = pageErrors.length;
    await page.click(".outbound-handoff button:last-of-type");
    await page.waitForFunction(() => {
      const checkbox = document.querySelector(".outbound-handoff input[type='checkbox']");
      return document.querySelector(".outbound-handoff__host") && checkbox?.checked === false && document.querySelector(".outbound-handoff button:last-of-type")?.disabled === true;
    }, { timeout: 9500 });
    results.interactions[`stale${statusCode}RechecksWithoutCrash`] = {
      checkboxFalse: await page.$eval(".outbound-handoff input[type='checkbox']", (node) => node.checked === false),
      pageErrors: pageErrors.slice(beforeErrors),
    };
  }

  await control("reset=1&offerMode=ready&postMode=delay-success");
  interceptedNavigations.length = 0;
  await goto("zh-Hans", 390);
  await chooseTw();
  await page.click(".outbound-handoff__consent input");
  await page.click(".outbound-handoff button:last-of-type");
  await page.select("select[aria-label]", "zh-Hant");
  await page.waitForFunction(() => new URLSearchParams(window.location.search).get("locale") === "zh-Hant");
  await new Promise((resolve) => setTimeout(resolve, 1200));
  results.interactions.lateJsonDidNotNavigate = interceptedNavigations.length === 0;

  await control("reset=1&offerMode=ready&postMode=delay-success");
  interceptedNavigations.length = 0;
  await goto("zh-Hans", 390);
  await chooseTw();
  await page.click(".outbound-handoff__consent input");
  await page.click(".outbound-handoff button:last-of-type");
  await page.select(".outbound-handoff__country select", "US");
  await new Promise((resolve) => setTimeout(resolve, 1200));
  results.interactions.countryChangeAbortedLatePost = interceptedNavigations.length === 0;

  assert.equal(results.interactions.noLookupBeforeCountry, true, "country must be selected before offer lookup");
  assert.equal(results.interactions.unavailableHasNoSubmit, true, "unavailable card must not show submit");
  assert.deepEqual(results.interactions.getTimeoutShowsRetry, { unavailable: true, retry: true }, "GET timeout must show unavailable retry state");
  assert.equal(results.interactions.readyState.disclosureVisible, true, "disclosure must be visible");
  assert.equal(results.interactions.readyState.checkboxDefaultFalse, true, "checkbox must default false");
  assert.equal(results.interactions.readyState.submitDisabledBeforeConsent, true, "submit must be disabled before consent");
  assert.equal(results.interactions.readyState.selectHasLabel, true, "country select must have a label");
  assert.deepEqual(results.interactions.readyState.hostBidi, { lang: "en", dir: "ltr", translate: "no" }, "official host must be bidi-isolated");
  assert.equal(results.interactions.successPost.openapiValid, true, "browser POST body must pass backend OpenAPI schema");
  assert.deepEqual(Object.keys(results.interactions.successPost.parsed), ["offerId", "offerVersion", "country", "disclosureVersion", "accepted", "idempotencyKey"], "browser POST body keys must be exact");
  assert.equal(results.interactions.successPost.parsed.offerId, OFFER_ID, "offerId fixture must be a backend-valid UUID");
  assert.equal(results.interactions.successPost.parsed.offerVersion, 1, "offerVersion must be numeric");
  assert.equal(results.interactions.navigationWasIntercepted, true, "success must attempt a guarded external navigation");
  assert.equal(results.interactions.retryKeepsIdempotencyKey, true, "network retry must preserve idempotency key");
  assert.equal(results.interactions.retryPostedTwice, true, "network retry must submit again");
  assert.equal(results.interactions.postTimeoutShowsError, true, "POST timeout must surface recoverable feedback");
  assert.equal(results.interactions.postTimeoutRetryKeepsIdempotencyKey, true, "POST timeout retry must preserve idempotency key");
  assert.deepEqual(results.interactions.stale409RechecksWithoutCrash, { checkboxFalse: true, pageErrors: [] }, "POST 409 must recheck, clear consent, and avoid page crashes");
  assert.deepEqual(results.interactions.stale404RechecksWithoutCrash, { checkboxFalse: true, pageErrors: [] }, "POST 404 must recheck, clear consent, and avoid page crashes");
  assert.equal(results.interactions.lateJsonDidNotNavigate, true, "late POST response after locale change must not navigate");
  assert.equal(results.interactions.countryChangeAbortedLatePost, true, "late POST response after country change must not navigate");
  assert.deepEqual(results.pageErrors, [], "browser run must not emit page errors");
  assert.ok(results.allInterceptedNavigations.includes(DESTINATION), "navigation interception list must include the test destination");
  for (const [label, metric] of Object.entries(results.metrics)) {
    assert.equal(metric.documentOverflow, 0, `${label} must not horizontally overflow`);
    assert.equal(metric.fullWidthRatio, 1, `${label} handoff card must span full grid width`);
    assert.equal(metric.checkboxHitHeight >= 44, true, `${label} checkbox hit area must be at least 44px`);
    assert.equal(metric.buttonHeight >= 44, true, `${label} button hit area must be at least 44px`);
    const rowCounts = Object.values(metric.editorialCards.reduce((counts, card) => {
      counts[card.top] = (counts[card.top] ?? 0) + 1;
      return counts;
    }, {})).sort();
    if (label.endsWith("-390")) assert.deepEqual(rowCounts, [1, 1, 1, 1], `${label} editorial cards must be one column`);
    else assert.deepEqual(rowCounts, [2, 2], `${label} editorial cards must be balanced 2+2`);
    assert.equal(metric.handoffTop > Math.max(...metric.editorialCards.map((card) => card.top)), true, `${label} handoff must start after editorial rows`);
  }

  await fs.writeFile(path.join(evidence, "TEST-ONLY-handoff-browser-summary.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));

  if (keepOpen) {
    console.log(`TEST_ONLY_HANDOFF_PREVIEW=${base}/exchanges/binance?locale=zh-Hans`);
    preserveResources = true;
    await new Promise(() => {});
  }
  } finally {
    process.removeListener("SIGINT", handleSignal);
    process.removeListener("SIGTERM", handleSignal);
    if (!preserveResources) await cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
