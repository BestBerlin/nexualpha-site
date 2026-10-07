import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function renderEntry(source) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-week4-i18n-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, source);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--loader:.svg=text",
      "--loader:.webp=file",
      "--log-level=warning",
    ], { cwd: projectRoot, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function visibleText(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

test("week4 remediation keeps Japanese topic, Factbook, and JP route UI native", async () => {
  const payload = await renderEntry(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { TopicGuidePage } from "../../src/components/v3/TopicGuidePage.jsx";
    import { FactbookPage } from "../../src/components/v3/FactbookPage.jsx";
    import { RegionalMarketPreview } from "../../src/components/v3/international/RegionalMarketPreview.jsx";
    import { neutralVenueCatalog } from "../../src/data/market-command.js";
    console.log(JSON.stringify({
      topic: renderToStaticMarkup(React.createElement(TopicGuidePage, { slug: "derivatives", locale: "ja", market: "JP", product: "perpetuals", venues: neutralVenueCatalog })),
      factbook: renderToStaticMarkup(React.createElement(FactbookPage, { slug: "binance", locale: "ja", market: "JP", product: "spot" })),
      jp: renderToStaticMarkup(React.createElement(RegionalMarketPreview, { market: "JP", locale: "ja" })),
    }));
  `);
  const pages = JSON.parse(payload);
  const topic = visibleText(pages.topic);
  const factbook = visibleText(pages.factbook);
  const jp = visibleText(pages.jp);

  assert.match(topic, /プラットフォーム \/ 種別/);
  assert.match(topic, /公式基準手数料/);
  assert.match(topic, /ミームコインとオンチェーン取引確認/);
  assert.doesNotMatch(topic, /Platform \/ Type|Speed \/ Depth|Base Rates|Net Effective Fee|Slippage & KYC|Action & Rebate|Meme Coins &amp; On-chain Trading Checks|Crypto access without KYC/);

  assert.match(factbook, /ファクトブックの研究記録/);
  assert.match(factbook, /別のプラットフォームのファクトブックへ切り替え/);
  assert.doesNotMatch(factbook, /All Factbook research records|Switch to another Factbook benchmark|View Raw LLM Markdown Data|Hide Raw Markdown Preview/);

  assert.match(jp, /日本で暗号資産プラットフォームを選ぶ前に確認すること/);
  assert.match(jp, /公式ソースごとの確認範囲/);
  assert.doesNotMatch(jp, /Answer first|Onsite next steps|Source and update notes|Use this when|Operator routing|Read the full NexuAlpha page|Continue in Telegram/);
});

test("week4 remediation localizes German compare source cards", async () => {
  const html = await renderEntry(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
    import { venueDatabase } from "../../src/data/venue-database.js";
    import { v3Copy } from "../../src/data/v3-product.js";
    const locale = "de";
    const html = renderToStaticMarkup(React.createElement(CompareDeepPage, {
      copy: { ...v3Copy(locale), common: { dimension: "Dimension" }, assetCapabilities: { none: "Keine" } },
      locale,
      selected: ["binance", "okx"],
      venues: Object.values(venueDatabase),
      updates: [],
      market: "unknown",
      product: "unknown",
    }));
    console.log(html);
  `);

  assert.match(html, /Vergleich mit offiziellen Quellen/);
  assert.match(html, /Gebühren, Produkte, regionale Eignung und Quelldatum prüfen/);
  assert.doesNotMatch(html, /Official-source comparison/);
  assert.doesNotMatch(html, /Compare fees, products, regional eligibility and source dates/);
});

test("week4 remediation localizes Mexico source cards in Spanish", async () => {
  const html = await renderEntry(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { RegionalMarketPreview } from "../../src/components/v3/international/RegionalMarketPreview.jsx";
    console.log(renderToStaticMarkup(React.createElement(RegionalMarketPreview, { market: "MX", locale: "es" })));
  `);

  assert.match(html, /Información SPEI del Banco de México/);
  assert.match(html, /Marco CNBV de fintech y activos virtuales/);
  assert.match(html, /esto no prueba que una plataforma cripto o una cuenta concreta pueda usar una ruta MXN específica/);
  assert.doesNotMatch(html, /CNBV fintech and virtual-asset framework/);
  assert.doesNotMatch(html, /Use the Mexican regulator/);
});

test("week4 remediation localizes Arabic international preview cards and direct answer", async () => {
  const html = await renderEntry(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { RegionalMarketPreview } from "../../src/components/v3/international/RegionalMarketPreview.jsx";
    console.log(renderToStaticMarkup(React.createElement(RegionalMarketPreview, { market: "OTHER", locale: "ar" })));
  `);

  assert.match(html, /إجابة مباشرة من سجل الأسئلة/);
  assert.match(html, /يبقى هذا السوق كمعاينة noindex/);
  assert.match(html, /اختر أقرب مسار موثق/);
  assert.match(html, /الولايات المتحدة أو بلد غير مدرج/);
  assert.doesNotMatch(html, /Direct answer from the question registry/);
  assert.doesNotMatch(html, /This market remains a noindex preview/);
  assert.doesNotMatch(html, /Choose the closest verified path/);
  assert.doesNotMatch(html, /United States or unlisted country/);
});
