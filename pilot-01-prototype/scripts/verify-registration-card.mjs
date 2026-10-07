#!/usr/bin/env node
/** Browser gate for the current public registration-card handoff surface. */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";

const require = createRequire("/Users/bestberlin/.codex/shared-tools/web-quality/package.json");
const puppeteer = require("puppeteer-core");
const base = process.env.HANDOFF_URL || "http://127.0.0.1:4173";
const outDir = path.resolve(process.env.HANDOFF_OUT || "../artifacts/registration-card");
await mkdir(outDir, { recursive: true });

const stableBrowserArgs = ["--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-extensions"];

async function latestExecutableUnder(root, suffix) {
  const matches = [];
  async function visit(directory) {
    let entries = [];
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (target.endsWith(suffix)) matches.push(target);
    }
  }
  await visit(root);
  return matches.sort().at(-1) ?? null;
}

async function browserCandidates() {
  const candidates = [
    process.env.CHROME_PATH && { label: "CHROME_PATH", executablePath: process.env.CHROME_PATH, args: stableBrowserArgs },
    { label: "system-chrome", executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args: stableBrowserArgs },
    { label: "system-chrome-canary", executablePath: "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary", args: stableBrowserArgs },
    { label: "system-chromium", executablePath: "/Applications/Chromium.app/Contents/MacOS/Chromium", args: stableBrowserArgs },
  ].filter(Boolean);

  const cachedChrome = await latestExecutableUnder(
    path.join(os.homedir(), ".cache/puppeteer/chrome"),
    "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  );
  if (cachedChrome) candidates.push({ label: "puppeteer-chrome-for-testing", executablePath: cachedChrome, args: stableBrowserArgs });

  const playwrightChrome = await latestExecutableUnder(
    path.join(os.homedir(), "Library/Caches/ms-playwright"),
    "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  );
  if (playwrightChrome) candidates.push({ label: "playwright-chrome-for-testing", executablePath: playwrightChrome, args: stableBrowserArgs });

  const cachedHeadlessShell = await latestExecutableUnder(
    path.join(os.homedir(), ".cache/puppeteer/chrome-headless-shell"),
    "chrome-headless-shell",
  );
  if (cachedHeadlessShell) {
    candidates.push({
      label: "puppeteer-headless-shell-single-process",
      executablePath: cachedHeadlessShell,
      args: [...stableBrowserArgs, "--single-process"],
    });
  }

  return candidates.filter((candidate, index, all) => (
    candidate.executablePath
    && existsSync(candidate.executablePath)
    && all.findIndex((other) => other.executablePath === candidate.executablePath && other.args.join(" ") === candidate.args.join(" ")) === index
  ));
}

async function launchBrowser() {
  const attempts = [];
  for (const candidate of await browserCandidates()) {
    const userDataDir = await mkdtemp(path.join(os.tmpdir(), "nexualpha-registration-card-"));
    try {
      const browser = await puppeteer.launch({
        executablePath: candidate.executablePath,
        headless: "new",
        userDataDir,
        args: candidate.args,
      });
      return { browser, userDataDir, launch: { ...candidate, attempts } };
    } catch (error) {
      await rm(userDataDir, { recursive: true, force: true });
      attempts.push({
        label: candidate.label,
        executablePath: candidate.executablePath,
        message: error.message,
      });
    }
  }
  throw new Error(`No usable browser executable found for registration-card QA: ${JSON.stringify(attempts, null, 2)}`);
}

const { browser, userDataDir, launch } = await launchBrowser();
const results = { base, browser: launch, routes: [], failures: [], screenshots: [] };

async function inspect(locale, width) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
  await page.setCacheEnabled(false);
  const url = new URL("/exchanges/binance", base);
  url.searchParams.set("locale", locale);
  url.searchParams.set("market", "BR");
  url.searchParams.set("product", "spot");
  url.searchParams.set("analytics_test", "1");
  try {
    const response = await page.goto(url.href, { waitUntil: "networkidle2", timeout: 30000 });
    assert.ok([200, 304].includes(response?.status()), `route must load successfully, got ${response?.status()}`);
    const state = await page.evaluate(() => {
      const card = document.querySelector(".registration-card");
      const links = [...document.querySelectorAll(".registration-card a")].map((link) => ({
        href: link.href,
        rel: link.rel,
        ctaKind: link.dataset.ctaKind || null,
        ctaPlatform: link.dataset.ctaPlatform || null,
        ctaPlacement: link.dataset.ctaPlacement || null,
        growthPlacement: link.dataset.growthPlacement || null,
      }));
      const primary = document.querySelector(".registration-card__primary-btn");
      return {
        cardCount: document.querySelectorAll(".registration-card").length,
        legacyCount: document.querySelectorAll(".outbound-handoff").length,
        text: card?.textContent?.trim() || "",
        links,
        primary: primary ? {
          href: primary.href,
          rel: primary.rel,
          ctaKind: primary.dataset.ctaKind || null,
          ctaPlatform: primary.dataset.ctaPlatform || null,
          ctaPlacement: primary.dataset.ctaPlacement || null,
          growthPlacement: primary.dataset.growthPlacement || null,
          growthMarket: primary.dataset.growthMarket || null,
          growthProduct: primary.dataset.growthProduct || null,
        } : null,
        h1: document.querySelector("h1")?.textContent?.trim() || "",
        bodyText: document.body?.textContent?.trim().length || 0,
      };
    });
    assert.equal(state.cardCount, 1, "exactly one registration card must render");
    assert.equal(state.legacyCount, 0, "legacy outbound-handoff DOM must stay absent");
    assert.match(state.text, /Official Domain|Domínio oficial|官方主域名|官方主網域/);
    assert.match(state.text, /NexuAlpha|commission|返佣|返佣披露/);
    assert.ok(state.h1 && state.bodyText > 200, "route must retain readable SSR content");
    assert.equal(state.primary?.ctaKind, "registration", "primary registration CTA must be tracked as a registration click");
    assert.equal(state.primary?.ctaPlatform, "binance", "primary registration CTA must carry the venue slug");
    assert.equal(state.primary?.ctaPlacement, "registration-card-primary", "primary registration CTA must carry a stable placement");
    assert.equal(state.primary?.growthPlacement, "registration-card-primary", "primary registration CTA must carry growth placement");
    assert.equal(state.primary?.growthMarket, "BR", "primary registration CTA must carry market context");
    assert.equal(state.primary?.growthProduct, "spot", "primary registration CTA must carry product context");
    for (const link of state.links) {
      const target = new URL(link.href);
      assert.equal(target.protocol, "https:");
      assert.ok(link.rel.includes("sponsored"), `partner link must be sponsored: ${link.href}`);
    }
    if (width <= 500) {
      const file = path.join(outDir, `binance-${locale}-${width}.png`);
      await page.screenshot({ path: file, fullPage: false });
      results.screenshots.push(file);
    }
    results.routes.push({ locale, width, cardCount: state.cardCount, links: state.links.length, errors });
  } catch (error) {
    results.failures.push({ locale, width, message: error.message, errors });
  } finally {
    await page.close();
  }
}

try {
  for (const locale of ["pt-BR", "zh-Hans", "zh-Hant"]) {
    await inspect(locale, 390);
    await inspect(locale, 1440);
  }
  await writeFile(path.join(outDir, "results.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ base, routes: results.routes.length, screenshots: results.screenshots.length, failures: results.failures }, null, 2));
  if (results.failures.length) process.exitCode = 1;
} finally {
  await browser.close();
  await rm(userDataDir, { recursive: true, force: true });
}
