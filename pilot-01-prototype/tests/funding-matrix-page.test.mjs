import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fundingMatrixCopy } from "../src/data/funding-matrix-copy.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const sampleFeed = {
  generatedAt: "2099-10-13T02:15:00.000Z",
  fundingMatrix: {
    generatedAt: "2099-10-13T02:15:00.000Z",
    ttlSeconds: 60,
    source: "test collector",
    quotes: [
      { symbol: "BTC", venue: "binance", rate: 0.0001, intervalHours: 8, nextFundingAt: "2099-10-13T08:00:00.000Z" },
      { symbol: "BTC", venue: "okx", rate: -0.00002, intervalHours: 8, nextFundingAt: "2099-10-13T08:00:00.000Z" },
      { symbol: "BTC", venue: "bybit", rate: 0.00004, intervalHours: 4, nextFundingAt: "2099-10-13T04:00:00.000Z" },
      { symbol: "BTC", venue: "bitget", rate: 0.00008, intervalHours: 8, nextFundingAt: "2099-10-13T08:00:00.000Z" },
      { symbol: "BTC", venue: "hyperliquid", rate: 0.0000125, intervalHours: 1, nextFundingAt: "2099-10-13T03:00:00.000Z" },
      { symbol: "ETH", venue: "binance", rate: -0.00003, intervalHours: 8, nextFundingAt: "2099-10-13T08:00:00.000Z" },
      { symbol: "ETH", venue: "okx", rate: 0.00006, intervalHours: 8, nextFundingAt: "2099-10-13T08:00:00.000Z" },
      { symbol: "ETH", venue: "bybit", rate: 0.00003, intervalHours: 8, nextFundingAt: "2099-10-13T08:00:00.000Z" },
    ],
  },
};

async function runBundled(source) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-funding-matrix-page-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, source);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [entryPath, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundlePath}`, "--loader:.css=empty", "--log-level=warning"], { cwd: projectRoot, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function renderSamples() {
  return runBundled(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { FundingMatrixPage, formatFundingPct, normalizeFundingMatrixFeed } from "../../src/components/data/FundingMatrixPage.jsx";
    const feed = ${JSON.stringify(sampleFeed)};
    const matrix = normalizeFundingMatrixFeed(feed);
    const unavailableMatrix = { ...matrix, coverage: { htx: { count: 0, status: "unavailable", lastSuccessAt: null } } };
    const out = {
      unavailable: renderToStaticMarkup(React.createElement(FundingMatrixPage, { locale: "en", initialFeed: unavailableMatrix })),
      summary: {
        rows: matrix.rows.length,
        venues: matrix.venues.map((v) => v.slug),
        btcBybit8h: matrix.rows[0].venues.bybit.rate8h,
        btcHyperliquid8h: matrix.rows[0].venues.hyperliquid.rate8h,
        btcSpread: matrix.rows[0].maxSpread.spread8h,
        btcAnnualized: matrix.rows[0].maxSpread.annualized,
        pct: formatFundingPct(0.00012),
        neg: formatFundingPct(-0.00002),
      },
      en: renderToStaticMarkup(React.createElement(FundingMatrixPage, { locale: "en", initialFeed: feed })),
      zh: renderToStaticMarkup(React.createElement(FundingMatrixPage, { locale: "zh-Hans", initialFeed: feed })),
      ru: renderToStaticMarkup(React.createElement(FundingMatrixPage, { locale: "ru", initialFeed: feed, market: "TR" })),
      tr: renderToStaticMarkup(React.createElement(FundingMatrixPage, { locale: "tr", market: "TR", initialFeed: feed })),
      bundleCheck: renderToStaticMarkup(React.createElement(FundingMatrixPage, { locale: "ja", initialFeed: feed })).length,
    };
    console.log(JSON.stringify(out));
  `);
}

test("normalizes collector quotes through the shared funding-matrix model", async () => {
  const { summary } = await renderSamples();
  assert.equal(summary.rows, 2);
  assert.equal(summary.venues.length, 8);
  assert.ok(summary.venues.includes("binance") && summary.venues.includes("hyperliquid"));
  assert.equal(summary.btcBybit8h, 0.00008);
  assert.equal(summary.btcHyperliquid8h, 0.0001);
  assert.ok(Math.abs(summary.btcSpread - 0.00012) < 1e-12);
  assert.ok(Math.abs(summary.btcAnnualized - 0.1314) < 1e-12);
  assert.equal(summary.pct, "+0.0120%");
  assert.equal(summary.neg, "−0.0020%");
});

test("copy exposes SEO fields and localized core labels for all supported locales", () => {
  const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];
  const english = fundingMatrixCopy("en");
  assert.match(english.title, /Funding Rate Matrix/);
  assert.match(english.description, /arbitrage/i);
  assert.equal(english.h1, "Crypto funding-rate matrix");
  assert.equal(english.internalLinkLabel, "Funding matrix");
  const zh = fundingMatrixCopy("zh-Hans");
  assert.equal(zh.h1, "加密货币资金费率矩阵");
  assert.equal(zh.calculatorTitle, "资金费率套利计算器");
  for (const locale of locales) {
    const copy = fundingMatrixCopy(locale);
    for (const key of ["title", "description", "h1", "internalLinkLabel", "tableTitle", "calculatorTitle", "symbol", "longVenue", "shortVenue", "feeSide", "notional", "estimatedFunding", "checkedFees", "netEstimate"]) {
      assert.equal(typeof copy[key], "string", `${locale} ${key}`);
      assert.ok(copy[key].length > 1, `${locale} ${key}`);
    }
    if (locale !== "en") assert.notEqual(copy.h1, english.h1, `${locale} h1 localized`);
  }
});

test("SSR renders table, anchors, calculator, tracked CTAs and neutral locales without fine-print paragraphs", async () => {
  const { en, zh, ru } = await renderSamples();
  assert.match(en, /<main[^>]*data-testid="funding-matrix-page"/);
  assert.match(en, /<header class="nxd-hero nxdm-hero v2-shell">/);
  assert.match(en, /<h1>Crypto funding-rate matrix<\/h1>/);
  assert.match(en, /Data updated 2099-10-13 10:15 SGT/); // freshness stamp format, 2026-10-18
  assert.match(en, /<table class="nxdm-table" dir="ltr">/);
  assert.match(en, /aria-sort="descending"><button type="button" class="nxdm-thbutton" aria-pressed="true">Max spread \/ 8h<\/button>/);
  assert.match(en, /aria-sort="none"><button type="button" class="nxdm-thbutton" aria-pressed="false">HTX<\/button>/);
  assert.match(en, /<tr id="symbol-BTC"><th scope="row" translate="no">BTC<\/th>/);
  assert.ok(en.includes("+0.0120%"), "max spread is SSR-visible");
  assert.ok(en.includes("+13.1%"), "annualized spread is SSR-visible");
  assert.ok(en.includes("Interval: 4h"), "4h venue interval is visible");
  assert.ok(en.includes("Interval: 1h"), "1h venue interval is visible");
  assert.ok(en.includes("Raw: +0.0013% / 1h"), "raw per-period rate is visible");
  assert.ok(en.includes("Annualized carry: +11.0%"), "per-venue APR is visible");
  assert.match(en, /href="\/exchanges\/binance"/);
  assert.match(en, /href="\/go\/binance\?src=funding-matrix" rel="nofollow sponsored"/);
  assert.match(en, /Funding arbitrage calculator/);
  assert.match(en, /Prorated estimate based on current rates/);
  assert.match(en, /Fee side/);
  assert.match(en, /<option value="maker">Maker<\/option>/);
  assert.match(en, /Checked trading fees/);
  assert.match(en, /entry and exit|before \$/);
  assert.doesNotMatch(en, /not investment advice|disclaimer|commission-disclosure-line|data-disclosure-placement=|exchange-facts\.js/i);

  assert.match(zh, /<h1>加密货币资金费率矩阵<\/h1>/);
  assert.match(zh, /资金费率套利计算器/);
  assert.match(zh, /基于当前费率的按比例估算/);
  assert.match(zh, /BTC：在 OKX 做多、在 Binance 做空/);
  assert.match(zh, /去 Binance 交易/);

  assert.ok(!ru.includes("/go/binance?src=funding-matrix"), "neutral locale blocks CTA before explicit TR market");
  assert.match(ru, /Только профиль/);
});

test("Turkey CTA allowlist only exposes allowed partner routes after geo gating", async () => {
  const { tr } = await renderSamples();
  assert.ok(tr.includes("/go/binance?src=funding-matrix"));
  assert.ok(tr.includes("/go/okx?src=funding-matrix"));
  assert.ok(tr.includes("/go/bybit?src=funding-matrix"));
  assert.ok(!tr.includes("/go/bitget?src=funding-matrix"));
  assert.ok(!tr.includes("/go/hyperliquid?src=funding-matrix"));
});

test("component bundles with CSS ignored for the SSR worker build path", async () => {
  const { bundleCheck } = await renderSamples();
  assert.ok(bundleCheck > 5000);
});

 test("unavailable HTX is announced once and has no repeated table cells", async () => {
  const { unavailable } = await renderSamples();
  assert.equal((unavailable.match(/HTX: Data unavailable/g) || []).length, 1);
  assert.doesNotMatch(unavailable, /data-label="HTX"/);
  assert.match(unavailable, /Binance/);
});
