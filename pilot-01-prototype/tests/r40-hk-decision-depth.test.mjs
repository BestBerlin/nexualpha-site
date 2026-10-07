import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { aeoQuestionsForMarket } from "../src/data/aeo-question-registry.js";
import { internationalSourcesFor } from "../src/data/international-source-registry.js";
import { regionalFundingRowsForMarket } from "../src/data/regional-funding-verification-matrix.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import { routeMetadata } from "../worker/index.js";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const forbiddenCommercialTokens = /partner\.bitget|bsmkweb|topzhjdgxcb|11350287|nexu888|LUCKX|CANDY007|INS898|1836370407|luckybitcoin|referral code|invite code|guaranteed|bonus|cashback|commission|reward/i;
const forbiddenExchangeOutbound = /href="https:\/\/(?:www\.)?(?:binance|bitget|okx|coinbase|kraken|backpack|hashkey|osl)\./i;
const shell = '<!doctype html><html lang="en"><head><title>NexuAlpha</title><meta name="description" content="base"><meta name="robots" content="index,follow"></head><body><main>app</main></body></html>';

function assets() {
  return {
    fetch: async (request) => new URL(request.url).pathname === "/index.html"
      ? new Response(shell, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } })
      : new Response("missing", { status: 404 }),
  };
}
function schemas(value) { return Array.isArray(value) ? value : [value].filter(Boolean); }
function schemaOf(value, type) { return schemas(value).find((item) => item?.["@type"] === type); }

async function renderHongKongDecisionDepth() {
  const dir = await mkdtemp(path.join(root, "tests/.tmp-r40-hk-depth-"));
  try {
    const entry = path.join(dir, "entry.mjs");
    const bundle = path.join(dir, "bundle.cjs");
    await writeFile(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { RegionalMarketDecisionDepth } from "../../src/components/v3/international/RegionalMarketDecisionDepth.jsx";
      console.log(JSON.stringify(renderToStaticMarkup(React.createElement(RegionalMarketDecisionDepth, { market: "HK" }))));
    `);
    const esbuild = path.join(root, "node_modules/.bin/esbuild");
    await access(esbuild);
    execFileSync(esbuild, [entry, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundle}`, "--loader:.css=empty", "--log-level=warning"], { cwd: root, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundle], { cwd: root, encoding: "utf8" }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("R40 Hong Kong decision depth renders Traditional Chinese account, funding and unknown boundaries", async () => {
  const html = await renderHongKongDecisionDepth();

  assert.match(html, /data-regional-decision-depth="HK"/);
  assert.match(html, /lang="zh-Hant"/);
  assert.match(html, /香港帳戶核對/);
  assert.match(html, /SFC/);
  assert.match(html, /HKD 銀行轉帳|港幣/);
  assert.match(html, /eDDA/);
  assert.match(html, /身分|地址證明|2FA|本人銀行帳戶/);
  assert.match(html, /費用|hold|產品範圍/);
  assert.match(html, /保持 unknown|不保證特定使用者能開戶/);
  assert.doesNotMatch(html, forbiddenCommercialTokens);
  assert.doesNotMatch(html, forbiddenExchangeOutbound);
});

test("R40 Hong Kong handoff uses only onsite research routes plus Telegram context", async () => {
  const html = await renderHongKongDecisionDepth();

  assert.match(html, /aria-label="HK research handoff"/);
  assert.match(html, /href="\/zh-hant\/exchanges\?market=HK&amp;product=spot"/);
  assert.match(html, /href="\/zh-hant\/rates\?market=HK&amp;product=spot"/);
  assert.match(html, /href="\/zh-hant\/compare\/binance-vs-okx\?market=HK&amp;product=spot"/);
  assert.match(html, /href="https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/);
  assert.match(html, /data-telegram-market-context="HK"/);
  assert.match(html, /data-telegram-start="[^"]*m_HK[^"]*t_spot/);
  assert.doesNotMatch(html, forbiddenCommercialTokens);
  assert.doesNotMatch(html, forbiddenExchangeOutbound);
});

test("R40 Hong Kong SEO and AEO surfaces are indexable, source-backed and Traditional Chinese", async () => {
  const route = routeInventory([]).find((item) => item.pathname === "/hk");
  assert.deepEqual({ template: route?.template, index: route?.index, locales: route?.locales }, { template: "regionalPreview", index: true, locales: ["zh-Hant"] });

  const client = computeRouteSeo({ url: "/hk", locale: "zh-Hant", route: { name: "regionalPreview", market: "HK" } });
  const server = await routeMetadata(new URL("https://nexualpha.com/hk"), { ASSETS: assets() });
  for (const [label, seo, structured] of [["client", client, client.schemas], ["server", server, server.schema]]) {
    assert.equal(seo.status, 200, label);
    assert.equal(seo.robots, "index,follow", label);
    assert.equal(seo.canonical, "https://nexualpha.com/hk", label);
    assert.equal(seo.locale, "zh-Hant", label);
    assert.match(seo.title, /香港|SFC|HKD|eDDA/, label);
    assert.match(seo.description, /身分|地址證明|費用 hold|產品範圍/, label);
    const page = schemaOf(structured, "WebPage");
    const faq = schemaOf(structured, "FAQPage");
    assert.equal(page?.url, "https://nexualpha.com/hk", label);
    assert.ok(page?.isBasedOn?.some((url) => /sfc\.hk/.test(url)), label);
    assert.ok(page?.isBasedOn?.some((url) => /hashkey\.com/.test(url) && /eDDA|48860678459801/.test(url)), label);
    assert.ok(page?.isBasedOn?.some((url) => /osl\.com/.test(url)), label);
    assert.ok(faq?.mainEntity?.length >= 3, label);
    assert.match(JSON.stringify(faq), /SFC|eDDA|地址證明|產品範圍|註冊歸因/, label);
    assert.doesNotMatch(JSON.stringify(seo), forbiddenCommercialTokens, label);
  }
  assert.deepEqual(server.alternates, [
    { hreflang: "zh-Hant", href: "https://nexualpha.com/hk" },
    { hreflang: "x-default", href: "https://nexualpha.com/hk" },
  ]);
});

test("R40 Hong Kong source matrix and llms wiring include the owner-page questions without commercial leakage", async () => {
  const sources = internationalSourcesFor("HK");
  const [funding] = regionalFundingRowsForMarket("HK");
  const questions = aeoQuestionsForMarket("HK");
  const [jsonText, csvText, llmsText, llmsScript] = await Promise.all([
    readFile(new URL("../public/research/regional-funding-verification-matrix.json", import.meta.url), "utf8"),
    readFile(new URL("../public/research/regional-funding-verification-matrix.csv", import.meta.url), "utf8"),
    readFile(new URL("../public/llms.txt", import.meta.url), "utf8"),
    readFile(new URL("../scripts/generate-public-llms.mjs", import.meta.url), "utf8"),
  ]);
  const jsonAsset = JSON.parse(jsonText);
  const publicHkFunding = jsonAsset.rows.find((item) => item.id === "hk-hkd-edda");
  const hkCsvLine = csvText.split(/\r?\n/).find((line) => line.startsWith("hk-hkd-edda,"));
  const hkLlmsLines = llmsText.split(/\r?\n/).filter((line) => /hk-|HK \/|Hong Kong research path|\/hk/.test(line)).join("\n");

  assert.ok(sources.sources.length >= 6);
  assert.equal(funding.id, "hk-hkd-edda");
  assert.equal(funding.locale, "zh-Hant");
  assert.match(JSON.stringify(funding), /SFC|HKD 銀行轉帳|eDDA|地址證明|hold|unknown|註冊歸因/);
  assert.ok(questions.some((item) => item.id === "hk-sfc-platform-status-zh-hant" && item.locale === "zh-Hant"));
  assert.ok(questions.some((item) => item.id === "hk-hkd-edda-bank-zh-hant" && item.locale === "zh-Hant"));
  assert.ok(questions.some((item) => item.id === "hk-proof-address-product-scope-zh-hant" && item.locale === "zh-Hant"));
  assert.match(JSON.stringify(publicHkFunding), /"id":"hk-hkd-edda"/);
  assert.match(JSON.stringify(publicHkFunding), /HKD 銀行轉帳|eDDA|註冊歸因/);
  assert.match(hkCsvLine, /hk-hkd-edda,HK,Hong Kong,zh-Hant,HKD/);
  assert.match(llmsScript, /hk-sfc-platform-status-zh-hant/);
  assert.match(llmsScript, /hk-hkd-edda-bank-zh-hant/);
  assert.match(llmsScript, /hk-proof-address-product-scope-zh-hant/);
  assert.match(hkLlmsLines, /香港使用者如何用 SFC 名單核對平台狀態/);
  assert.match(hkLlmsLines, /HKD 銀行轉帳或 eDDA/);
  assert.match(hkLlmsLines, /地址證明後，還要如何核對產品範圍/);
  assert.doesNotMatch(`${JSON.stringify({ sources, funding, questions, publicHkFunding })}\n${hkCsvLine}\n${hkLlmsLines}`, forbiddenCommercialTokens);
});
