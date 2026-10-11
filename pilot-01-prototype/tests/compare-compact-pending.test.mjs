import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
const nonEnglishLocales = locales.filter((locale) => locale !== "en");

const renderComparePages = async (cases) => {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-compare-compact-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";

      const copy = {
        common: { dimension: "Dimension" },
        assetCapabilities: { none: "Pending source review" },
      };
      const venues = Object.values(venueDatabase);
      const cases = ${JSON.stringify(cases)};
      const pages = cases.map((item) => ({
        key: item.key,
        locale: item.locale,
        selected: item.selected,
        html: renderToStaticMarkup(React.createElement(CompareDeepPage, {
          copy,
          locale: item.locale,
          selected: item.selected,
          venues,
          updates: [],
          market: "unknown",
          product: item.product || "unknown",
        })),
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
};

const matrixHtml = (html) => html.slice(html.indexOf('id="hardcore-matrix"'), html.indexOf('class="v3-matrix-expand"'));
const tableHtml = (html) => {
  // The R11 compare pass added role/aria attributes before the class; keep the contract on the actual matrix table.
  const start = html.indexOf('class="v3-matrix-table"');
  return html.slice(start, html.indexOf('</table>', start));
};

test("comparison matrix compacts all-pending rows but keeps sourced and CTA rows visible", async () => {
  const [page] = await renderComparePages([{ key: "binance-okx", locale: "en", selected: ["binance", "okx"] }]);
  const matrix = matrixHtml(page.html);
  const table = tableHtml(page.html);

  assert.match(matrix, /class="v3-matrix-pending-disclosure"/, "all-pending rows are grouped in one disclosure");
  assert.match(table, /Spot maker \/ taker fee/, "sourced spot row stays in the main matrix");
  assert.match(table, /0\.10%/, "Binance sourced spot fee remains visible");
  assert.match(table, /Proof of Reserves \(PoR\)/, "known reserve disclosures stay in the main matrix");
  assert.match(table, /Official action/, "onsite action row remains in the main matrix");
  assert.doesNotMatch(table, /User benefit status/, "all-pending user benefit row is removed from the main matrix");
  assert.match(matrix, /<strong>User benefit status<\/strong>/, "compacted disclosure preserves original field name");
  assert.match(matrix, /<strong>Maximum futures leverage<\/strong>/, "compacted disclosure preserves original leverage field");
  assert.match(page.html, /href="https:\/\/www\.binance\.com\?ref=11350287"/, "Binance protected invite URL is unchanged");
  assert.match(page.html, /href="https:\/\/www\.okx\.com\/join\/nexu888"/, "OKX invite URL is unchanged");
  assert.match(table, /data-cta-placement="compare-metric-matrix-detail"/, "matrix action routes to onsite details");
  assert.doesNotMatch(table, /href="https:\/\/www\.binance\.com\?ref=11350287"/, "matrix does not repeat Binance protected invite URL");
  assert.doesNotMatch(table, /href="https:\/\/www\.okx\.com\/join\/nexu888"/, "matrix does not repeat OKX protected invite URL");
});

test("comparison matrix preserves hero partner CTAs while routing matrix actions onsite for Bybit vs Bitget", async () => {
  const [page] = await renderComparePages([{ key: "bybit-bitget", locale: "en", selected: ["bybit", "bitget"] }]);
  const matrix = matrixHtml(page.html);
  const table = tableHtml(page.html);

  assert.match(matrix, /class="v3-matrix-pending-disclosure"/);
  assert.match(table, /Spot maker \/ taker fee/);
  assert.match(table, /Proof of Reserves \(PoR\)/);
  assert.doesNotMatch(table, /Effective net cost/, "net-cost row stays compact while both values lack source-linked commercial data");
  assert.match(matrix, /<strong>Effective net cost<\/strong>/);
  assert.match(page.html, /href="https:\/\/www\.bybit\.com\/register\?affiliate_id=48553"/);
  assert.match(page.html, /href="https:\/\/partner\.bitget\.cafe\/bg\/C6PRAF"/);
  assert.match(table, /data-cta-placement="compare-metric-matrix-detail"/);
  assert.doesNotMatch(table, /href="https:\/\/www\.bybit\.com\/register\?affiliate_id=48553"/);
  assert.doesNotMatch(table, /href="https:\/\/partner\.bitget\.cafe\/bg\/C6PRAF"/);
  assert.match(page.html, /<strong class="v3-matrix-code-val">nexu888<\/strong>/);
});

test("comparison helper labels and pending disclosure avoid English fallback in 15 locales", async () => {
  const pages = await renderComparePages(locales.map((locale) => ({ key: locale, locale, selected: ["bybit", "bitget"] })));
  assert.equal(pages.length, locales.length);

  for (const { locale, html } of pages) {
    assert.match(html, /v3-matrix-scroll-hint/, `${locale}: scroll hint rendered`);
    assert.match(html, /v3-matrix-pending-disclosure/, `${locale}: pending disclosure rendered`);
    if (!nonEnglishLocales.includes(locale)) continue;

    assert.doesNotMatch(html, /Open the detailed research comparison|Open scenario fit and next steps|Show pending fields|Swipe the matrix sideways|BTC\/ETH perpetual contracts|COMPARE FIRST|NEXT STEP|>Join ↗<|>Verify ↗<|Basic KYC \(ID only\)|Pending verification/, `${locale}: compare helpers should not fall back to English`);
  }
});
