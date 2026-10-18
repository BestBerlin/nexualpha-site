import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const forbiddenCommercialPromise = /guaranteed signup|guaranteed registration|guaranteed approval|private commission|bonus guaranteed|risk-free|profit guaranteed|nexu888|11350287|LUCKX|CANDY007|INS898|1836370407|luckybitcoin/i;

async function renderFixture(kind, locale = "en") {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-top-decision-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { NewsDetailPage } from "../../src/components/v3/news/NewsDetailPage.jsx";
      import { TopicGuidePage } from "../../src/components/v3/TopicGuidePage.jsx";

      const article = {
        slug: "hyperliquid-vs-dydx",
        categoryName: { en: "Perp DEX" },
        publishedAt: "2026-09-20T00:00:00Z",
        readTime: "7 min",
        author: "NexuAlpha Research",
        title: {
          en: "Hyperliquid vs dYdX source-bound comparison",
          "zh-Hant": "Hyperliquid vs dYdX 來源核對比較",
        },
        summary: {
          en: "A source-bound comparison of perp venue mechanics.",
          "zh-Hant": "一份以來源為邊界的永續平台機制比較。",
        },
        content: { en: "## Lead\\nUse this source-bound article to compare collateral, funding, liquidation and custody routes.\\n\\n## Comparison at a glance\\nLong-form comparison begins here." },
        relatedVenues: ["hyperliquid", "dydx"],
        sources: [
          { id: "hyperliquid-docs", publisher: "Hyperliquid docs", title: "Hyperliquid referral documentation", url: "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/referrals" },
          { id: "dydx-docs", publisher: "dYdX docs", title: "dYdX docs", url: "https://docs.dydx.xyz/" },
        ],
        seo: { internalLinkTargets: ["/compare/hyperliquid-vs-dydx", "/topics/derivatives"] },
      };

      const html = ${JSON.stringify(kind)} === "news"
        ? renderToStaticMarkup(React.createElement(NewsDetailPage, {
            slug: "hyperliquid-vs-dydx",
            locale: ${JSON.stringify(locale)},
            market: "unknown",
            product: "perp",
            initialArticles: [article],
          }))
        : renderToStaticMarkup(React.createElement(TopicGuidePage, {
            slug: "derivatives",
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
      "--loader:.svg=text",
      "--loader:.webp=file",
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });

    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 12 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function firstDecisionBox(html) {
  const match = html.match(/<aside class="top-decision-box[^"]*"[^>]*data-top-decision-box="true"[\s\S]*?<\/aside>/);
  assert.ok(match, "top decision box should render");
  return match[0];
}

function countLinks(html) {
  return (html.match(/<a\b/g) || []).length;
}

test("news detail SSR renders one compact top decision before long article content", async () => {
  const html = await renderFixture("news");
  const box = firstDecisionBox(html);

  assert.ok(html.indexOf('data-top-decision-box="true"') < html.indexOf('class="news-detail__partners-box"'));
  // SEO audit 2026-10-11 #5 (owner-approved): the lead answer precedes the decision box in the document.
  assert.ok(html.indexOf('news-detail__prose--lead') < html.indexOf('data-top-decision-box="true"'));
  assert.equal(countLinks(box), 3);
  assert.equal((box.match(/data-cta-kind="research"/g) || []).length, 2);
  assert.equal((box.match(/data-cta-kind="source"/g) || []).length, 1);
  assert.match(box, /href="\/compare\/hyperliquid-vs-dydx\?product=perp"/);
  assert.match(box, /href="https:\/\/hyperliquid\.gitbook\.io\/hyperliquid-docs\/trading\/referrals"/);
  assert.doesNotMatch(box, forbiddenCommercialPromise);
});

test("news detail SSR localizes zh-Hant top decision and source-language notice without English priority fallback", async () => {
  const html = await renderFixture("news", "zh-Hant");
  const box = firstDecisionBox(html);

  assert.match(box, /先讀這裡/);
  assert.match(box, /行動前先看/);
  assert.match(box, /把本文作為已核對來源的研究起點/);
  assert.doesNotMatch(box, /Before you choose a perpetual venue/);
  assert.doesNotMatch(box, /Separate the venue decision/);
  assert.match(html, /已核驗來源語言文章/);
  assert.match(html, /完整正文會保持在已複核的來源語言/);
  assert.doesNotMatch(html, /Verified source-language article/);
  assert.doesNotMatch(html, /The full article body below stays in the reviewed source language/);
});

test("topic guide SSR renders the same compact decision contract before source and route sections", async () => {
  const html = await renderFixture("topic");
  const box = firstDecisionBox(html);

  assert.ok(html.indexOf('class="top-decision-box topic-decision-rail topic-top-decision"') < html.indexOf('class="topic-section topic-source-register"'));
  assert.ok(html.indexOf('class="top-decision-box topic-decision-rail topic-top-decision"') < html.indexOf('data-testid="derivatives-decision-routes"'));
  assert.equal(countLinks(box), 3);
  assert.equal((box.match(/data-cta-kind="research"/g) || []).length, 2);
  assert.equal((box.match(/data-cta-kind="source"/g) || []).length, 1);
  assert.match(box, /How to choose a crypto perpetual platform/);
  assert.match(box, /href="\/exchanges\/binance\?market=unknown&amp;product=perp"/);
  assert.match(box, /href="https:\/\//);
  assert.doesNotMatch(box, /data-cta-kind="registration"/);
  assert.doesNotMatch(box, forbiddenCommercialPromise);
});

test("topic guide SSR keeps zh-Hant decision and research UI out of Simplified Chinese fallbacks", async () => {
  const html = await renderFixture("topic", "zh-Hant");
  const box = firstDecisionBox(html);

  assert.match(box, /繁體中文直接答案/);
  assert.match(box, /先按帳戶模式分流/);
  for (const simplifiedFallback of ["手续费", "账户", "来源登记", "唤醒电报机器人", "邀请码", "交易者高频", "最后量化更新"]) {
    const leakIndex = html.indexOf(simplifiedFallback);
    assert.equal(leakIndex, -1, `zh-Hant SSR leaked Simplified fallback: ${simplifiedFallback} near ${html.slice(Math.max(0, leakIndex - 80), leakIndex + 120)}`);
  }
  assert.doesNotMatch(box, /START HERE|Review the venue profile before opening an account/);
});
