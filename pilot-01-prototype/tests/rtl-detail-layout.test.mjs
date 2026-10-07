import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import test from "node:test";

const css = await readFile(new URL("../src/styles/v3-layout-stability.css", import.meta.url), "utf8");
const baseUrl = process.env.RTL_BASE_URL || "http://localhost:4174";
const artifacts = process.env.RTL_ARTIFACT_DIR;

test("detail lists use one direction-aware marker and padding owner", () => {
  const list = css.match(/\.v3-detail-list li\s*\{([^}]+)\}/)?.[1];
  const marker = css.match(/\.v3-detail-list li::before\s*\{([^}]+)\}/)?.[1];
  assert.ok(list && marker);
  assert.match(list, /padding-inline-start:\s*16px/);
  assert.match(marker, /inset-inline-start:\s*0/);
  assert.doesNotMatch(list, /padding-(?:left|right):/);
  assert.doesNotMatch(marker, /\b(?:left|right):/);
});

test("rendered detail markers follow reading direction without CJK regressions", {
  skip: process.env.RTL_BROWSER !== "1" && "set RTL_BROWSER=1 against a frozen local preview",
}, async () => {
  const version = await fetch(`${baseUrl}/version.json`, { signal: AbortSignal.timeout(2000) }).then((r) => r.json());
  if (process.env.RTL_EXPECT_BUILD_ID) assert.equal(version.buildId, process.env.RTL_EXPECT_BUILD_ID);
  const require = createRequire("/Users/bestberlin/.codex/shared-tools/web-quality/package.json");
  const browser = await require("puppeteer-core").launch({
    executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
    args: ["--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-background-networking"],
  });
  if (artifacts) await mkdir(artifacts, { recursive: true });
  try {
    for (const locale of ["ar", "en", "zh-Hans", "zh-Hant"]) {
      for (const width of [390, 768, 1440]) {
        const page = await browser.newPage();
        await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
        // Static layout test only: never burden the shared runtime or claim API health.
        await page.setRequestInterception(true);
        page.on("request", (request) => {
          const url = new URL(request.url());
          if (url.origin !== new URL(baseUrl).origin || url.pathname.startsWith("/api/")) return request.abort();
          return request.continue();
        });
        await page.goto(`${baseUrl}/exchanges/binance?locale=${locale}`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(".v3-detail-list li");
        const result = await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          const labels = [...document.querySelectorAll(".v3-profile-decision article > span")].map((node) => {
            const style = getComputedStyle(node);
            return { size: parseFloat(style.fontSize), spacing: style.letterSpacing, family: style.fontFamily };
          });
          const lists = [...document.querySelectorAll(".v3-detail-list li")].map((node) => {
            const style = getComputedStyle(node);
            const marker = getComputedStyle(node, "::before");
            return {
              direction: style.direction,
              paddingStart: parseFloat(style.paddingInlineStart),
              paddingEnd: parseFloat(style.paddingInlineEnd),
              markerLeft: marker.left,
              markerRight: marker.right,
              width: node.getBoundingClientRect().width,
              overflow: node.scrollWidth > node.clientWidth,
            };
          });
          document.querySelector(".v3-profile-decision").scrollIntoView({ block: "start", behavior: "instant" });
          return { lists, labels, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        });
        if (artifacts) await page.screenshot({ path: join(artifacts, `detail-${locale}-${width}.png`) });
        const context = `${version.buildId}/${locale}/${width}`;
        // The compact mobile profile now keeps one four-item pre-registration
        // checklist behind progressive disclosure. The geometry contract is
        // about the real rendered list, not the retired eight-item layout.
        assert.ok(result.lists.length >= 3, `${context} actual editorial checklist exists`);
        assert.equal(result.overflow, 0, `${context} no horizontal page overflow`);
        for (const item of result.lists) {
          assert.equal(item.direction, locale === "ar" ? "rtl" : "ltr", context);
          assert.equal(item.paddingStart, 16, `${context} reading-start padding`);
          assert.equal(item.paddingEnd, 0, `${context} no opposite-side padding`);
          assert.equal(parseFloat(locale === "ar" ? item.markerRight : item.markerLeft), 0, `${context} marker sits at reading start`);
          const opposite = locale === "ar" ? item.markerLeft : item.markerRight;
          assert.ok(opposite === "auto" || parseFloat(opposite) > item.width / 2, `${context} marker is not on the opposite edge`);
          assert.equal(item.overflow, false, `${context} text wraps inside list`);
        }
        if (locale === "ar") {
          assert.ok(result.labels.length >= 1, `${context} visible detail label exists`);
          for (const label of result.labels) {
            assert.ok(label.size >= 14, `${context} readable Arabic label`);
            assert.ok(label.spacing === "normal" || parseFloat(label.spacing) === 0, `${context} no Arabic letter spacing`);
            assert.doesNotMatch(label.family, /monospace|Menlo|Consolas/i, `${context} prose not data font`);
          }
        }
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});
