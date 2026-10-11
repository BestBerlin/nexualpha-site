import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire("/Users/bestberlin/.codex/shared-tools/web-quality/package.json");
const puppeteer = require("puppeteer-core");
const base = process.env.AUDIT_URL || "http://127.0.0.1:4230";
const output = path.resolve(process.env.INTERNATIONAL_MATRIX_OUT || "artifacts/international-locale-matrix/latest.json");
const locales = ["en", "zh-Hans", "zh-Hant", "pt-BR", "es", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
const markets = ["mx", "tw", "id", "hk", "eu", "uk", "jp", "kr", "int"];
const widths = [390, 1440];

const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const failures = [];
let checked = 0;

for (const market of markets) {
  // Reuse a page within one market, then release it before the next market.
  // A single page across all 270 navigations can accumulate browser state and
  // produce false navigation timeouts even when the route is healthy.
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  for (const locale of locales) for (const width of widths) {
  const errors = [];
  const onPageError = (error) => errors.push(error.message);
  const onConsole = (message) => { if (message.type() === "error") errors.push(message.text()); };
  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  await page.setViewport({ width, height: 900 });
  // Regional previews may keep analytics or data connections open. The matrix
  // only needs the rendered DOM and explicit readiness markers, so waiting for
  // network idle can hang the entire release check indefinitely.
  const response = await page.goto(`${base}/${market}?locale=${encodeURIComponent(locale)}`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector(".regional-market-preview, [data-regional-cta]", { timeout: 5000 });
  const state = await page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== "hidden";
    };
    return {
      h1: [...document.querySelectorAll("h1")].filter(visible).length,
      overflow: document.documentElement.scrollWidth > innerWidth + 2,
      primary: document.querySelectorAll('[data-cta-placement="regional-preview-directory"]').length,
      accountStages: document.querySelectorAll('[data-cta-placement="regional-account-stage"]').length,
      sourceLinks: document.querySelectorAll('[data-cta-placement="regional-official-source"]').length,
      lang: document.documentElement.lang,
    };
  });
  checked += 1;
  if (response.status() !== 200 || state.h1 !== 1 || state.overflow || state.primary !== 1 || state.accountStages !== 3 || errors.length) {
    failures.push({ market, locale, width, status: response.status(), state, errors });
  }
  page.off("pageerror", onPageError);
  page.off("console", onConsole);
  }
  await page.close();
}

await browser.close();
const report = { generatedAt: new Date().toISOString(), base, markets, locales, widths, checked, failures: failures.length, results: failures };
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Checked ${checked}; failures ${failures.length}; wrote ${output}`);
if (failures.length) process.exitCode = 1;
