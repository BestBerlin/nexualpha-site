#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { localizedHref, parsePublicRoute } from "../src/data/locale-routing.js";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workspaceRoot = resolve(projectRoot, "..");
const sharedRoot = "/Users/bestberlin/.codex/shared-tools/web-quality";
const sharedRequire = createRequire(join(sharedRoot, "package.json"));
const puppeteer = sharedRequire("puppeteer-core");
const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
const routes = ["/news", "/activities", "/rates", "/factbook/binance"];
// Keep the verifier aligned with the canonical local Sites preview port. CI or
// production runs can still override this with RAIL_LOCALE_URL.
const baseUrl = process.env.RAIL_LOCALE_URL || "http://127.0.0.1:4173";
const artifactPath = resolve(workspaceRoot, "artifacts", "international-locale-matrix", "decision-rail-locale-qa.json");
const navigationTimeout = Number(process.env.RAIL_NAV_TIMEOUT_MS || 12000);
const selectorTimeout = Number(process.env.RAIL_SELECTOR_TIMEOUT_MS || 5000);

function chromePath() {
  return [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean).find((path) => existsSync(path));
}

const browser = await puppeteer.launch({
  executablePath: chromePath(),
  headless: "new",
  args: ["--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-background-networking"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
const rows = [];
function railHrefMatchesLocale(href, locale) {
  if (!href) return false;
  const parsed = new URL(href, baseUrl);
  return parsePublicRoute(parsed.pathname, parsed.searchParams).locale === locale;
}

const withTimeout = (promise, ms, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
]);
try {
  for (const locale of locales) {
    for (const route of routes) {
      const path = localizedHref(route, { locale, market: "unknown", product: "spot" });
      const url = `${baseUrl}${path}`;
      try {
        await withTimeout(page.goto(url, { waitUntil: "domcontentloaded", timeout: navigationTimeout }), navigationTimeout + 1000, "navigation");
        await page.waitForSelector(".decision-path-rail", { timeout: selectorTimeout });
        const result = await page.$eval(".decision-path-rail", (rail) => ({
          label: rail.querySelector(".decision-path-rail__label")?.textContent?.trim() || "",
          links: [...rail.querySelectorAll(".decision-path-rail__link")].map((link) => ({ text: link.textContent.trim(), href: link.getAttribute("href"), kind: link.dataset.ctaKind })),
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        }));
        const valid = result.label.length > 0 && result.links.length === 3 && result.links.every((link) => link.kind === "research" && railHrefMatchesLocale(link.href, locale)) && !result.overflow;
        rows.push({ locale, route, url, valid, ...result });
      } catch (error) {
        rows.push({ locale, route, url, valid: false, error: String(error?.message || error) });
      }
    }
  }
} finally {
  await browser.close();
}
const summary = { generatedAt: new Date().toISOString(), baseUrl, locales, routes, samples: rows.length, passed: rows.filter((row) => row.valid).length, failed: rows.filter((row) => !row.valid).length, rows };
await mkdir(resolve(artifactPath, ".."), { recursive: true });
await writeFile(artifactPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ status: summary.failed ? "FAIL" : "PASS", artifactPath, samples: summary.samples, passed: summary.passed, failed: summary.failed }));
if (summary.failed) process.exitCode = 1;
