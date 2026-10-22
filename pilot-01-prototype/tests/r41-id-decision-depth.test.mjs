import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeInventory } from "../scripts/generate-prerender-manifest.mjs";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const forbiddenCommercialTokens = /partner\.bitget|bsmkweb|topzhjdgxcb|11350287|nexu888|LUCKX|CANDY007|INS898|1836370407|luckybitcoin|guaranteed|bonus|cashback|commission|reward/i;
const forbiddenExchangeOutbound = /href="https:\/\/(?:www\.)?(?:binance|bitget|okx|coinbase|kraken|backpack|tokocrypto)\./i;

async function renderIndonesiaDecisionDepth() {
  const dir = await mkdtemp(path.join(root, "tests/.tmp-r41-id-depth-"));
  try {
    const entry = path.join(dir, "entry.mjs");
    const bundle = path.join(dir, "bundle.cjs");
    await writeFile(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { RegionalMarketDecisionDepth } from "../../src/components/v3/international/RegionalMarketDecisionDepth.jsx";
      console.log(JSON.stringify(renderToStaticMarkup(React.createElement(RegionalMarketDecisionDepth, { market: "ID" }))));
    `);
    const esbuild = path.join(root, "node_modules/.bin/esbuild");
    await access(esbuild);
    execFileSync(esbuild, [entry, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundle}`, "--loader:.css=empty", "--log-level=warning"], { cwd: root, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundle], { cwd: root, encoding: "utf8" }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("R41 Indonesia decision depth renders the full IDR account decision boundary in Indonesian", async () => {
  const html = await renderIndonesiaDecisionDepth();

  assert.match(html, /data-regional-decision-depth="ID"/);
  assert.match(html, /lang="id"/);
  assert.match(html, /OJK/);
  assert.match(html, /Bappebti/);
  assert.match(html, /KYC|verifikasi identitas/);
  assert.match(html, /IDR bank virtual account/);
  assert.match(html, /QRIS/);
  assert.match(html, /wallet/);
  assert.match(html, /Biaya, hold, dan waktu proses/);
  assert.match(html, /spot, futures|spot atau futures/);
  assert.match(html, /Tetap berstatus unknown/);
  assert.match(html, /Tidak membuktikan persetujuan akun/);
  assert.doesNotMatch(html, forbiddenCommercialTokens);
  assert.doesNotMatch(html, forbiddenExchangeOutbound);
});

test("R41 Indonesia handoff keeps onsite context and returns Telegram research to the owner page", async () => {
  const html = await renderIndonesiaDecisionDepth();

  assert.match(html, /aria-label="ID research handoff"/);
  assert.match(html, /href="\/id-id\/exchanges#nxa-context\?market=ID&amp;product=spot"/);
  assert.match(html, /href="\/id-id\/rates#nxa-context\?market=ID&amp;product=spot"/);
  assert.match(html, /href="\/id-id\/compare\/binance-vs-okx#nxa-context\?market=ID&amp;product=spot"/);
  assert.match(html, /href="https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/);
  assert.match(html, /data-telegram-market-context="ID"/);
  assert.match(html, /data-telegram-start="[^"]*m_ID[^"]*t_spot/);
  assert.match(html, /data-telegram-start="[^"]+"/);
  assert.doesNotMatch(html, /data-telegram-return-href=/);
  assert.doesNotMatch(html, forbiddenCommercialTokens);
  assert.doesNotMatch(html, forbiddenExchangeOutbound);
});

test("R41 Indonesia owner route remains indexable with its canonical and owner locale", () => {
  const route = routeInventory([]).find((item) => item.pathname === "/id");
  assert.deepEqual({ template: route?.template, index: route?.index, locales: route?.locales }, { template: "regionalPreview", index: true, locales: ["id"] });

  const seo = computeRouteSeo({ url: "/id", locale: "id", route: { name: "regionalPreview", market: "ID" } });
  assert.equal(seo.robots, "index,follow");
  assert.equal(seo.canonical, "https://nexualpha.com/id");
  assert.equal(seo.locale, "id");
  assert.match(seo.title, /Indonesia|OJK|Bappebti|IDR/);
  assert.match(seo.description, /OJK|Bappebti|IDR|VA|QRIS|KYC/);
  assert.doesNotMatch(JSON.stringify(seo), forbiddenCommercialTokens);
});
