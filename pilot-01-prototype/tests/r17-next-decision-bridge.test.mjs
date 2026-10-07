import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { nextDecisionBridgeCopy } from "../src/data/next-decision-bridge.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const forbiddenCommercialPromise = /data-cta-kind="registration"|data-cta-kind="source"|https?:\/\/|nexu888|11350287|LUCKX|CANDY007|INS898|1836370407|luckybitcoin/i;

async function renderR17Fixtures() {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r17-bridge-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { NewsDetailPage } from "../../src/components/v3/news/NewsDetailPage.jsx";
      import { TopicGuidePage } from "../../src/components/v3/TopicGuidePage.jsx";
      import { RegionalMarketPreview } from "../../src/components/v3/international/RegionalMarketPreview.jsx";

      const article = {
        slug: "r17-next-decision-fixture",
        categoryName: { en: "Exchange operations" },
        publishedAt: "2026-09-28T00:00:00Z",
        readTime: "5 min",
        author: "NexuAlpha Research",
        title: { en: "R17 bridge fixture" },
        summary: { en: "A source-bound fixture for the R17 bridge." },
        content: { en: "## Lead\\\\nUse this article to keep the next step inside NexuAlpha.\\\\n\\\\n## Comparison at a glance\\\\nThe longer article continues here." },
        relatedVenues: ["binance", "okx"],
        sources: [{ id: "source", publisher: "Official source", title: "Official source", url: "https://example.com/source" }],
        seo: { internalLinkTargets: ["/compare/binance-vs-okx", "/exchanges/binance"] },
      };

      const fixtures = {
        news: renderToStaticMarkup(React.createElement(NewsDetailPage, {
          slug: article.slug,
          locale: "zh-Hans",
          market: "MX",
          product: "spot",
          initialArticles: [article],
        })),
        topic: renderToStaticMarkup(React.createElement(TopicGuidePage, {
          slug: "derivatives",
          locale: "en",
          market: "MX",
          product: "perp",
          venues: [],
        })),
        regional: renderToStaticMarkup(React.createElement(RegionalMarketPreview, {
          market: "MX",
          locale: "es",
        })),
      };

      console.log(JSON.stringify(fixtures));
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

    return JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 12 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function nextDecisionBridge(html, placement) {
  const bridges = [...html.matchAll(/<aside class="next-decision-bridge[^"]*"[^>]*data-next-decision-bridge="true"[\s\S]*?<\/aside>/g)].map((match) => match[0]);
  const bridge = bridges.find((item) => item.includes(`data-cta-placement="${placement}"`));
  assert.ok(bridge, `expected next decision bridge for ${placement}`);
  return bridge;
}

function assertBridgeContract(bridge, { profileHref, compareHref }) {
  const hrefs = [...bridge.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  const kinds = [...bridge.matchAll(/data-cta-kind="([^"]+)"/g)].map((match) => match[1]);
  const actions = [...bridge.matchAll(/data-next-decision-action="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(actions, ["profile", "compare", "telegram"]);
  assert.equal(hrefs.length, 3);
  assert.ok(hrefs.every((href) => href.startsWith("/")), "bridge actions must stay on-site");
  assert.ok(hrefs.some((href) => href.includes(profileHref)), `missing profile href ${profileHref}`);
  assert.ok(hrefs.some((href) => href.includes(compareHref)), `missing compare href ${compareHref}`);
  assert.ok(hrefs.some((href) => href.includes("/telegram")), "missing internal Telegram continuation path");
  assert.ok(kinds.every((kind) => ["research", "telegram"].includes(kind)));
  assert.equal(kinds.filter((kind) => kind === "telegram").length, 1);
  assert.doesNotMatch(bridge, forbiddenCommercialPromise);
}

test("R17 next decision bridge renders only profile, compare and Telegram actions across entry pages", async () => {
  const fixtures = await renderR17Fixtures();

  assertBridgeContract(nextDecisionBridge(fixtures.news, "news-detail-next-decision-bridge"), {
    profileHref: "/zh-hans/exchanges/binance",
    compareHref: "/zh-hans/compare/binance-vs-okx",
  });
  assertBridgeContract(nextDecisionBridge(fixtures.topic, "topic-next-decision-bridge"), {
    profileHref: "/exchanges/binance",
    compareHref: "/compare/binance-vs-bybit",
  });
  assertBridgeContract(nextDecisionBridge(fixtures.regional, "regional-preview-next-decision-bridge"), {
    profileHref: "/es/exchanges/binance",
    compareHref: "/es/exchanges",
  });
});

test("R17 next decision bridge owns copy for every supported interface locale", () => {
  const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
  const english = nextDecisionBridgeCopy("en");
  for (const locale of locales) {
    const copy = nextDecisionBridgeCopy(locale);
    assert.ok(copy.title && copy.profile && copy.compare && copy.telegram, `missing bridge copy for ${locale}`);
    if (locale !== "en") assert.notEqual(copy.title, english.title, `${locale} must not fall back to English`);
  }
});
