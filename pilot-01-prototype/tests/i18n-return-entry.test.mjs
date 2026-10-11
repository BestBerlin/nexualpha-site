import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
const nonEnglishLocales = locales.filter((locale) => locale !== "en");

async function renderFixtures(cases) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-i18n-return-entry-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { TelegramBotHub } from "../../src/components/v3/TelegramBotHub.jsx";
      import { TopicGuidePage } from "../../src/components/v3/TopicGuidePage.jsx";
      const cases = ${JSON.stringify(cases)};
      const pages = cases.map((locale) => ({
        locale,
        telegram: renderToStaticMarkup(React.createElement(TelegramBotHub, { locale, headingLevel: 1, market: "BR", product: "spot" })),
        derivatives: renderToStaticMarkup(React.createElement(TopicGuidePage, { slug: "derivatives", locale, market: "BR", product: "perp", venues: [] })),
      }));
      console.log(JSON.stringify(pages));
    `);

    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });

    return JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function returnRail(html) {
  const start = html.indexOf('class="tg-return-rail"');
  assert.notEqual(start, -1, "return rail should render");
  const end = html.indexOf('</section>', start);
  assert.notEqual(end, -1, "return rail should close");
  return html.slice(start, end + '</section>'.length);
}


function quickStats(html) {
  const start = html.indexOf('class="topic-quick-stats"');
  assert.notEqual(start, -1, "quick stats should render");
  const end = html.indexOf('class="topic-section-disclosure"', start);
  return html.slice(start, end === -1 ? undefined : end);
}

function dictionaryFields(html) {
  const start = html.indexOf('id="perp-cost-field-dictionary"');
  assert.notEqual(start, -1, "perp dictionary should render");
  const end = html.indexOf('class="topic-section topic-spotlight"', start);
  return html.slice(start, end === -1 ? undefined : end);
}

test("Telegram return rail routes to actual onsite tools in every supported locale", async () => {
  const pages = await renderFixtures(locales);
  for (const page of pages) {
    const rail = returnRail(page.telegram);
    assert.match(rail, /data-cta-kind="internal"/, page.locale);
    assert.match(rail, /href="[^"]*compare\/binance-vs-okx/, page.locale);
    assert.match(rail, /href="[^"]*\/rates/, page.locale);
    assert.match(rail, /href="[^"]*\/activities/, page.locale);
    assert.doesNotMatch(rail, /t\.me|telegram_return|Save comparison|Continue model|Watch changes|Opt in|subscribe/i, page.locale);
  }
});

test("return rail and derivative dictionary avoid English fallback labels outside English", async () => {
  const pages = await renderFixtures(nonEnglishLocales);
  for (const page of pages) {
    const rail = returnRail(page.telegram);
    const dictionary = dictionaryFields(page.derivatives);
    const stats = quickStats(page.derivatives);
    assert.doesNotMatch(rail, /Return to the actual onsite tools|Reopen comparison|Calculate fees|View latest research/, page.locale);
    assert.doesNotMatch(dictionary, /Trading fee|Funding payment|Liquidation and backstop|Transfer and network cost|Do not compare one advertised rate/, page.locale);
    assert.doesNotMatch(stats, /topic-stat-card__label">(?:Fee source|Funding|Next step)</, page.locale);
    assert.doesNotMatch(stats, /Use pair comparisons before signup|Cadence and calculation differ by venue/, page.locale);
  }
});
