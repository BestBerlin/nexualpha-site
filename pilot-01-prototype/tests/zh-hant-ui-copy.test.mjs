import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

function renderFixture(source) {
  return async () => {
    const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-zh-hant-ui-"));
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
        "--log-level=warning",
      ], { cwd: projectRoot, stdio: "pipe" });

      return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8" });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  };
}

test("zh-Hant shared CTA surfaces render Traditional Chinese copy instead of English or Simplified fallback", async () => {
  const html = await renderFixture(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { CompareDeepPage, VenueDetailPage } from "../../src/components/v3/V3Pages.jsx";
    import { FactbookPage } from "../../src/components/v3/FactbookPage.jsx";
    import { TelegramBotHub } from "../../src/components/v3/TelegramBotHub.jsx";
    import { MobileBottomNav } from "../../src/components/v3/MobileBottomNav.jsx";
    import { CompareFinalChoiceCard } from "../../src/components/v3/CompareFinalChoiceCard.jsx";
    import { CleanFooter } from "../../src/components/v3/CleanFooter.jsx";
    import { VenueFaqSection } from "../../src/components/v3/VenueFaqSection.jsx";
    import { venueDatabase } from "../../src/data/venue-database.js";
    import { v3Copy } from "../../src/data/v3-product.js";

    const pageCopy = {
      common: { dimension: "Dimension" },
      assetCapabilities: { none: "待官方來源核驗" },
    };
    const profiles = [venueDatabase.binance, venueDatabase.okx];
    const directAnswer = {
      title: "Binance 與 OKX 註冊前怎麼選？",
      body: "先比較公開條件、地區資格與官方來源，再決定是否進入官方流程。",
      checks: ["官方網域", "KYC 條件"],
      nextSteps: ["先看矩陣", "再進入平台頁"],
      sourceLinks: [],
      internalLinks: [],
    };

    const html = [
      renderToStaticMarkup(React.createElement(CompareDeepPage, {
        copy: pageCopy,
        locale: "zh-Hant",
        selected: ["bybit", "bitget"],
        venues: Object.values(venueDatabase),
        updates: [],
        market: "TW",
        product: "spot",
      })),
      renderToStaticMarkup(React.createElement(FactbookPage, { slug: "binance", locale: "zh-Hant", market: "TW", product: "spot" })),
      renderToStaticMarkup(React.createElement(TelegramBotHub, { locale: "zh-Hant", market: "TW", product: "spot" })),
      renderToStaticMarkup(React.createElement(MobileBottomNav, { locale: "zh-Hant", onSearch: () => {} })),
      renderToStaticMarkup(React.createElement(CompareFinalChoiceCard, { directAnswer, profiles, locale: "zh-Hant", market: "TW", product: "spot" })),
      renderToStaticMarkup(React.createElement(VenueDetailPage, { copy: v3Copy("zh-Hant"), locale: "zh-Hant", venue: venueDatabase.bitget, venues: Object.values(venueDatabase), updates: [], market: "TW", product: "spot" })),
      renderToStaticMarkup(React.createElement(VenueFaqSection, { venue: venueDatabase.bitget, profile: venueDatabase.bitget, locale: "zh-Hant", db: venueDatabase.bitget, partner: {} })),
      renderToStaticMarkup(React.createElement(CleanFooter, { locale: "zh-Hant" })),
    ].join("\\n");
    console.log(html);
  `)();

  for (const expected of [
    "註冊前最終怎麼選",
    "查看詳細矩陣",
    "在官網註冊",
    "現貨 Taker / Maker 費率",
    "資產儲備 (PoR)",
    "返回交易所黃頁目錄",
    "信任評分待核驗",
    "本頁面只展示可追溯的公開資料",
    "展開完整儲備資料",
    "合作開戶註冊入口",
    "比較平台",
    "平台黃頁",
    "Binance (幣安)",
    "OKX (歐易)",
    "費率、條件與費用測算",
    "在 Telegram 中監控此交易所費率與返傭",
    "高意圖搜尋問答與安全指南",
    "主題指南",
    "事實庫",
    "返傭連結",
    "傭金由平台承擔",
    "資產儲備證明",
    "防釣魚官方網域",
    "費率、返傭、準備金與門檻全維度對決",
    "硬核量化對決矩陣",
    "量化對比維度",
    "查看驗資公示",
  ]) {
    assert.match(html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `missing zh-Hant copy: ${expected}`);
  }

  for (const blocked of [
    "注册前最终怎么选",
    "查看详细矩阵",
    "在官网注册",
    "现货 Taker / Maker 费率",
    "资产储备 (PoR)",
    "返回交易所目录",
    "信任评分待核验",
    "本页面只展示可追溯的公开资料",
    "展开完整储备数据",
    "合作开户注册入口",
    "比较平台",
    "平台黄页",
    "Final call before signup",
    "Who it fits",
    "User benefit status",
    "Open partner signup route",
    "Register on Official Site",
    "Binance (币安)",
    "OKX (欧易)",
    "费率、条件与费用测算",
    "在 Telegram 中监控此交易所费率与返佣",
    "高频搜索问答与安全指南",
    "Topic Guides",
    "费率、返佣、储备金与门槛",
    "硬核量化对决矩阵",
    "本页目录",
    "查看验资公示",
    "返佣链接",
    "佣金由平台承担",
  ]) {
    assert.doesNotMatch(html, new RegExp(blocked.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `blocked fallback leaked: ${blocked}`);
  }

  assert.match(html, /href="https:\/\/partner\.bitget\.cafe\/bg\/C6PRAF"/);
  assert.match(html, /nexu888/);
});
