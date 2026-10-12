import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { TOPIC_GUIDES } from "../src/data/topic-guides-data.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const locales = ["en", "zh-Hans", "zh-Hant", "ja", "ko", "tr", "es", "pt-BR", "fr", "de", "ru", "ar", "id", "vi", "it", "ur", "uk"];

async function renderTopic(locale, slug = "derivatives") {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-derivatives-routes-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { TopicGuidePage } from "../../src/components/v3/TopicGuidePage.jsx";
      const html = renderToStaticMarkup(React.createElement(TopicGuidePage, {
        slug: ${JSON.stringify(slug)},
        locale: ${JSON.stringify(locale)},
        market: "unknown",
        product: "perp",
        venues: [],
      }));
      console.log(html);
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

    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function renderDerivatives(locale) {
  return renderTopic(locale, "derivatives");
}

test("derivatives guide defines four source-bound decision routes without referral links", () => {
  const derivatives = TOPIC_GUIDES.derivatives;
  assert.deepEqual(derivatives.decisionRoutes.map((route) => route.id), [
    "cex-account",
    "wallet-perp-dex",
    "specialist-options-perps",
    "gmx-pool-route",
  ]);

  for (const route of derivatives.decisionRoutes) {
    assert.ok(route.officialBasis.every((url) => /^https:\/\//.test(url)), route.id);
    assert.ok(route.links.every((link) => link.href.startsWith("/")), route.id);
    for (const locale of locales) {
      const copy = route.copy[locale];
      assert.ok(copy, `${route.id} ${locale}`);
      assert.ok(copy.title.length > 8, `${route.id} ${locale} title`);
      assert.ok(copy.body.length > 60, `${route.id} ${locale} body`);
      assert.equal(copy.checks.length, 3, `${route.id} ${locale} checks`);
    }
  }

  const routeJson = JSON.stringify(derivatives.decisionRoutes);
  assert.doesNotMatch(routeJson, /partner\.bitget|accounts\.binance|ref=|inviteCode|11350287|nexu888|affiliate_id/i);
  assert.match(routeJson, /\/topics\/derivatives#perp-cost-field-dictionary/);
});

test("derivatives SSR renders the four next-step routes and preserves the dictionary anchor", async () => {
  const html = await renderDerivatives("en");
  assert.match(html, /Choose the derivative route first/);
  assert.match(html, /data-aeo-direct-answer="true"/);
  assert.match(html, /How to choose a crypto perpetual platform/);
  assert.match(html, /Start by separating the route: CEX futures account, wallet-connected Perp DEX/);
  assert.match(html, /CEX account route/);
  assert.match(html, /Wallet-connected Perp DEX route/);
  assert.match(html, /Options \/ perps specialist route/);
  assert.match(html, /GMX pool-based perp route/);
  assert.match(html, /href="\/compare\/binance-vs-okx#nxa-context\?product=perp"/);
  assert.match(html, /href="\/compare\/hyperliquid-vs-dydx#nxa-context\?product=perp"/);
  assert.match(html, /href="\/exchanges\/deribit#nxa-context\?product=perp"/);
  assert.match(html, /href="\/exchanges\/gmx#nxa-context\?product=perp"/);
  assert.match(html, /id="perp-cost-field-dictionary"/);
  assert.match(html, /\/topics\/derivatives#perp-cost-field-dictionary\?product=perp/);

  const primaryLabels = [...html.matchAll(/topic-derivatives-route-primary[^>]*>([^<]+)<\/a>/g)].map((match) => match[1]);
  assert.deepEqual(primaryLabels, [
    "Binance vs OKX →",
    "Hyperliquid vs dYdX →",
    "Deribit profile →",
    "GMX profile →",
  ]);
  assert.doesNotMatch(html, /Primary next step:\s*→/);
});

test("derivatives SSR keeps Chinese and non-English route copy localized", async () => {
  const zhHans = await renderDerivatives("zh-Hans");
  assert.match(zhHans, /先按账户模式选择衍生品路线/);
  assert.match(zhHans, /CEX 合约账户路线/);
  assert.match(zhHans, /钱包直连 Perp DEX 路线/);

  const zhHant = await renderDerivatives("zh-Hant");
  assert.match(zhHant, /先按帳戶模式選擇衍生品路線/);
  assert.match(zhHant, /CEX 合約帳戶路線/);
  assert.match(zhHant, /Perp DEX 成本欄位字典/);
  assert.doesNotMatch(zhHant, /先按账户模式选择衍生品路线/);

  const ja = await renderDerivatives("ja");
  assert.match(ja, /先にデリバティブルートを選ぶ/);
  assert.match(ja, /ウォレット接続Perp DEXルート/);
  assert.match(ja, /Perp DEXコスト項目辞書/);
  assert.match(ja, /暗号資産の無期限契約プラットフォームを選ぶ手順/);
  assert.doesNotMatch(ja, /How to choose a crypto perpetual platform/);
  assert.doesNotMatch(ja, /Choose the derivative route first/);

  const ko = await renderDerivatives("ko");
  assert.match(ko, /먼저 파생상품 경로를 선택하세요/);
  assert.match(ko, /지갑 연결 Perp DEX 경로/);
  assert.match(ko, /크립토 무기한 계약 플랫폼을 고르는 방법/);
  assert.doesNotMatch(ko, /How to choose a crypto perpetual platform/);

  const tr = await renderDerivatives("tr");
  assert.match(tr, /Önce türev rotasını seçin/);
  assert.match(tr, /CEX vadeli hesap rotası/);
  assert.match(tr, /Kripto perpetual platformu nasıl seçilir/);
  assert.doesNotMatch(tr, /How to choose a crypto perpetual platform/);
  assert.doesNotMatch(tr, /Choose the derivative route first/);
});

test("Traditional Chinese topic SSR does not fall back to Simplified Chinese copy", async () => {
  const simplifiedFallbacks = ["账户", "选择", "费用", "资金", "来源", "核验", "专题", "查看", "用户", "字段", "钱包", "永续", "费率", "强平", "预言机", "保证金", "资产", "产品", "阶段", "访问", "提现", "确认"];
  const cases = [
    ["derivatives", /先按帳戶模式選擇衍生品路線/, /繁體中文直接答案/],
    ["no-kyc", /免 KYC 不等於永久免驗證/, /錢包直連協議、中心化帳戶與永續平台/],
    ["meme-coins", /先核對代幣合約、流動性與交易路徑/, /Meme 幣平台沒有單一最佳答案/],
  ];

  for (const [slug, expectedTitle, expectedDirectAnswer] of cases) {
    const html = await renderTopic("zh-Hant", slug);
    assert.match(html, expectedTitle, `${slug} keeps Traditional Chinese decision copy`);
    assert.match(html, expectedDirectAnswer, `${slug} keeps existing Traditional Chinese direct answer`);
    for (const fallback of simplifiedFallbacks) {
      const leakIndex = html.indexOf(fallback);
      assert.equal(leakIndex, -1, `${slug} leaked Simplified fallback ${fallback} near ${html.slice(Math.max(0, leakIndex - 60), leakIndex + 100)}`);
    }
  }
});

test("all supported locales have rendered route body and dictionary body", async () => {
  for (const locale of locales) {
    const html = await renderDerivatives(locale);
    assert.match(html, /data-testid="derivatives-decision-routes"/, locale);
    assert.match(html, /data-derivatives-route-id="cex-account"/, locale);
    assert.match(html, /data-derivatives-route-id="wallet-perp-dex"/, locale);
    assert.match(html, /data-derivatives-route-id="specialist-options-perps"/, locale);
    assert.match(html, /data-derivatives-route-id="gmx-pool-route"/, locale);
    assert.match(html, /id="perp-cost-field-dictionary"/, locale);
    assert.doesNotMatch(html, /undefined|null/, locale);
  }
});

 test("derivatives task does not modify protected invitation registry", async () => {
  const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url), "utf8");
  assert.match(partnerRegistry, /https:\/\/partner\.bitget\.cafe\/bg\/C6PRAF/);
  assert.match(partnerRegistry, /https:\/\/www\.bsmkweb\.cc\/join\?ref=11350287/);
  assert.match(partnerRegistry, /https:\/\/www\.okx\.com\/join\/nexu888/);
  assert.match(partnerRegistry, /https:\/\/www\.topzhjdgxcb\.net\/join\/CANDY007/);
  assert.match(partnerRegistry, /https:\/\/backpack\.exchange\/join\/luckybitcoin/);
});
