import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

const pagesSource = await readFile(new URL("../src/components/v3/V3Pages.jsx", import.meta.url), "utf8");
const disclosureCss = await readFile(new URL("../src/styles/r1-compare.css", import.meta.url), "utf8");
const crossroadsCss = await readFile(new URL("../src/components/v3/crossroads-compare.css", import.meta.url), "utf8");

const previewOrigin = process.env.COMPARE_DISCLOSURE_BASE_URL || "http://localhost:4173";
const runBrowserAssertions = process.env.COMPARE_DISCLOSURE_BROWSER === "1";
const browserLocales = ["zh-Hans", "zh-Hant", "it", "de", "ar"];
const browserViewports = [
  { width: 390, height: 900 },
  { width: 768, height: 900 },
  { width: 1440, height: 900 },
];

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

test("compare disclosure section has a dedicated compact layout owner", () => {
  assert.match(
    pagesSource,
    /<section className="v2-section v3-compare-disclosure-section">\s*<details className="research-references">/,
    "CompareDeepPage must scope the deep compare disclosure section",
  );
  assert.match(
    disclosureCss,
    /#top\.v3-compare-page \.v3-compare-disclosure-section\s*\{\s*padding:\s*0;\s*\}/,
    "section padding is compact and scoped",
  );
  assert.match(
    disclosureCss,
    /\.v3-compare-disclosure-section \.research-references\s*\{\s*margin:\s*0;\s*padding:\s*0;/,
    "details margin is removed only in the compare disclosure section",
  );
  assert.match(
    disclosureCss,
    /\.v3-compare-disclosure-section \.research-references\) > summary,[^{]*\{\s*min-block-size:\s*60px;\s*padding:\s*0;/,
    "the shared disclosure row keeps its 60px hit target",
  );
  assert.match(
    crossroadsCss,
    /\.v3-compare-section-disclosure:not\(\[open\]\) > \.v2-section\s*\{\s*display: none;/,
    "closed comparison research blocks must not reserve scroll height",
  );
  assert.match(pagesSource, /const hiddenByDefault = idx >= 2 && !showAllFaqs;/);
  assert.match(pagesSource, /<details key=\{idx\} className="v3-faq-item" hidden=\{hiddenByDefault\}>/);
  assert.match(pagesSource, /v3-faq-list__expand/);
  assert.match(crossroadsCss, /\.v3-faq-list__expand\s*\{/);
});

test("compare disclosure browser layout stays compact and expandable", { skip: runBrowserAssertions ? false : "set COMPARE_DISCLOSURE_BROWSER=1 against a built preview" }, async () => {
  const previewAvailable = await fetch(previewOrigin, { signal: AbortSignal.timeout(1200) })
    .then((response) => response.ok)
    .catch(() => false);
  assert.ok(previewAvailable, `${previewOrigin} must be reachable`);

  const sharedRequire = createRequire("/Users/bestberlin/.codex/shared-tools/web-quality/package.json");
  const puppeteer = sharedRequire("puppeteer-core");
  const executablePath = chromePath();
  assert.ok(executablePath, "Chrome/Chromium executable is required");

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-extensions"],
  });

  try {
    for (const locale of browserLocales) {
      for (const viewport of browserViewports) {
        const page = await browser.newPage();
        await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
        const url = new URL("/compare/binance-vs-okx", previewOrigin);
        url.searchParams.set("locale", locale);
        await page.goto(url.href, { waitUntil: "networkidle0", timeout: 20000 });

        const collapsed = await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const details = [...document.querySelectorAll("details.research-references")].find((node) => node.querySelector(".v3-deep-compare"));
          const section = details?.closest("section");
          const summary = details?.querySelector("summary");
          const relatedGrid = document.querySelector(".v3-similar-grid");
          const relatedCards = [...relatedGrid.querySelectorAll("a")].map((node) => node.getBoundingClientRect());
          return {
            versusRegions: [...document.querySelectorAll(".v3-versus-side")].map((side) => ({
              footerBottom: side.querySelector(".v3-versus-side__footer")?.getBoundingClientRect().bottom,
              sourcesTop: side.querySelector(".v3-versus-sources-disclosure")?.getBoundingClientRect().top,
            })),
            sectionHeight: section?.getBoundingClientRect().height ?? null,
            summaryHeight: summary?.getBoundingClientRect().height ?? null,
            overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            relatedGridWidth: relatedGrid.getBoundingClientRect().width,
            relatedCardsWidth: Math.max(...relatedCards.map((rect) => rect.right)) - Math.min(...relatedCards.map((rect) => rect.left)),
          };
        });

        for (const regions of collapsed.versusRegions) {
          assert.ok(regions.sourcesTop >= regions.footerBottom, `${locale}/${viewport.width}: source disclosure must not overlap invitation action`);
        }
        assert.ok(collapsed.sectionHeight !== null, `${locale}/${viewport.width} section exists`);
        assert.ok(collapsed.sectionHeight <= 90, `${locale}/${viewport.width} collapsed section <=90px, got ${collapsed.sectionHeight}`);
        assert.ok(collapsed.summaryHeight >= 44, `${locale}/${viewport.width} summary >=44px, got ${collapsed.summaryHeight}`);
        assert.equal(collapsed.overflowX, 0, `${locale}/${viewport.width} collapsed has no horizontal overflow`);
        assert.ok(collapsed.relatedCardsWidth >= collapsed.relatedGridWidth - 1, `${locale}/${viewport.width} related cards must not reserve empty columns, got ${collapsed.relatedCardsWidth}/${collapsed.relatedGridWidth}`);

        await page.click(".v3-compare-disclosure-section summary");
        const mouseExpanded = await page.evaluate(() => {
          const details = document.querySelector(".v3-compare-disclosure-section details");
          const row = details?.querySelector(".v3-deep-compare__row");
          return {
            open: !!details?.open,
            rowText: row?.textContent ?? "",
            rowHeight: row?.getBoundingClientRect().height ?? 0,
            overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        });
        assert.equal(mouseExpanded.open, true, `${locale}/${viewport.width} mouse click expands details`);
        assert.ok(mouseExpanded.rowText.includes("CEX"), `${locale}/${viewport.width} expanded row contains original compare values`);
        assert.ok(mouseExpanded.rowHeight > 0, `${locale}/${viewport.width} expanded row is visible`);
        assert.equal(mouseExpanded.overflowX, 0, `${locale}/${viewport.width} mouse expanded has no horizontal overflow`);

        await page.click(".v3-compare-disclosure-section summary");
        await page.focus(".v3-compare-disclosure-section summary");
        await page.keyboard.press("Enter");
        const keyboardExpanded = await page.evaluate(() => {
          const details = document.querySelector(".v3-compare-disclosure-section details");
          const row = details?.querySelector(".v3-deep-compare__row");
          return {
            open: !!details?.open,
            rowText: row?.textContent ?? "",
            rowHeight: row?.getBoundingClientRect().height ?? 0,
            overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        });
        assert.equal(keyboardExpanded.open, true, `${locale}/${viewport.width} keyboard Enter expands details`);
        assert.ok(keyboardExpanded.rowText.includes("CEX"), `${locale}/${viewport.width} keyboard expanded row contains original compare values`);
        assert.ok(keyboardExpanded.rowHeight > 0, `${locale}/${viewport.width} keyboard expanded row is visible`);
        assert.equal(keyboardExpanded.overflowX, 0, `${locale}/${viewport.width} keyboard expanded has no horizontal overflow`);

        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});
