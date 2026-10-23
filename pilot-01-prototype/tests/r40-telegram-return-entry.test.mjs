import { JSDOM } from 'jsdom';
import { committedFileHash } from './r100-test-contracts.mjs';
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildTelegramWebsiteFunnelContext } from "../src/data/telegram-config.js";
import { readTelegramReturnContext } from "../src/data/telegram-decision-return.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const NOW = Date.UTC(2026, 8, 29, 12, 0, 0);

const protectedHashes = Object.freeze({
  "src/data/partner-registry.js": committedFileHash('src/data/partner-registry.js'),
  "src/data/venue-database.js": committedFileHash('src/data/venue-database.js'),
  "src/data/public-cta.js": committedFileHash('src/data/public-cta.js'),
  "src/data/regional-cta.js": committedFileHash('src/data/regional-cta.js'),
});

const protectedMaterial =
  /accounts\.binance\.com|bsmkweb\.cc|partner\.bitget|bitget\.com\/(?:expressly|register|referral|signup)|okx\.com\/(?:join|register|referral)|topzhjdgxcb|backpack\.exchange\/join|11350287|nexu888|luckybitcoin|LUCKX|CANDY007|INS898|1836370407|NEXU888/i;

async function bundleAndRun(source) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r40-telegram-return-entry-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, source, "utf8");
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

test("R40 contextual Telegram return supports fee and regional first-party routes", () => {
  const rates = buildTelegramWebsiteFunnelContext({
    intent: "fees",
    venue: "all",
    returnRoute: "/rates",
    market: "GLOBAL",
    locale: "en",
    product: "spot",
    campaign: "r40-rates-owner-telegram-return",
    now: NOW,
  });
  const ratesReturn = readTelegramReturnContext(new URL(`https://nexualpha.example${rates.returnHref}`).search, { now: NOW });
  assert.match(rates.deepLink, /^https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/);
  assert.match(rates.returnHref, /^\/rates\?/);
  assert.deepEqual(ratesReturn.object, { kind: "route", route: "/rates" });
  assert.equal(ratesReturn.status, "restored");

  const br = buildTelegramWebsiteFunnelContext({
    intent: "compare",
    pair: "binance-vs-okx",
    returnRoute: "/br/conta",
    market: "BR",
    locale: "pt-BR",
    product: "spot",
    campaign: "r40-br-owner-telegram-return",
    now: NOW,
  });
  const brReturn = readTelegramReturnContext(new URL(`https://nexualpha.example${br.returnHref}`).search, { now: NOW });
  assert.match(br.returnHref, /^\/br\/conta\?/);
  assert.deepEqual(brReturn.object, { kind: "route", route: "/br/conta" });
  assert.equal(brReturn.market, "BR");
  assert.equal(brReturn.locale, "pt-BR");

  for (const funnel of [rates, br]) {
    assert.ok(funnel.startPayload.length <= 64);
    assert.doesNotMatch(funnel.deepLink + funnel.returnHref, protectedMaterial);
    assert.doesNotMatch(funnel.deepLink + funnel.returnHref, /commission|raw user|kyc submission/i);
  }
});

test("R43 content pages preserve onsite Telegram return to news and topic routes", () => {
  const news = buildTelegramWebsiteFunnelContext({
    intent: "monitor",
    returnRoute: "/news/okx-usd-to-usdc-spot-pair-migration",
    market: "GLOBAL",
    locale: "zh-Hans",
    product: "spot",
    campaign: "r43-news-content-telegram-return",
    now: NOW,
  });
  const newsReturn = readTelegramReturnContext(new URL(`https://nexualpha.example${news.returnHref}`).search, { now: NOW });
  assert.match(news.returnHref, /^\/zh-hans\/news\/okx-usd-to-usdc-spot-pair-migration\?/);
  assert.deepEqual(newsReturn.object, { kind: "route", route: "/news/okx-usd-to-usdc-spot-pair-migration" });
  assert.equal(newsReturn.status, "restored");
  assert.equal(newsReturn.locale, "zh-Hans");

  const topic = buildTelegramWebsiteFunnelContext({
    intent: "monitor",
    returnRoute: "/topics/derivatives",
    market: "MX",
    locale: "es",
    product: "perpetuals",
    campaign: "r43-topic-content-telegram-return",
    now: NOW,
  });
  const topicReturn = readTelegramReturnContext(new URL(`https://nexualpha.example${topic.returnHref}`).search, { now: NOW });
  assert.match(topic.returnHref, /^\/es\/topics\/derivatives\?/);
  assert.deepEqual(topicReturn.object, { kind: "route", route: "/topics/derivatives" });
  assert.equal(topicReturn.status, "restored");
  assert.equal(topicReturn.market, "MX");

  for (const funnel of [news, topic]) {
    assert.ok(funnel.startPayload.length <= 64);
    assert.doesNotMatch(funnel.deepLink + funnel.returnHref, protectedMaterial);
    assert.doesNotMatch(funnel.deepLink + funnel.returnHref, /commission|raw user|kyc submission|ref=/i);
  }
});

test("R40 onsite handoff renders anonymous owner-level attributes for venue compare rates and BR", async () => {
  const output = await bundleAndRun(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { OnsiteTelegramBotHandoff } from "../../src/components/v3/OnsiteTelegramBotHandoff.jsx";

    const cases = [
      { canonicalPath: "/exchanges/bitget", venue: "bitget", locale: "en", market: "GLOBAL", product: "spot", placement: "r40-venue", campaign: "r40-venue-owner-telegram-return" },
      { canonicalPath: "/compare/bybit-vs-bitget", pair: "bybit-vs-bitget", locale: "ja", market: "JP", product: "perpetuals", placement: "r40-compare", campaign: "r40-compare-owner-telegram-return" },
      { canonicalPath: "/rates", intent: "fees", venue: "all", returnRoute: "/rates", locale: "en", market: "GLOBAL", product: "spot", placement: "r40-rates", campaign: "r40-rates-owner-telegram-return" },
      { canonicalPath: "/br/conta", intent: "compare", pair: "binance-vs-okx", returnRoute: "/br/conta", locale: "pt-BR", market: "BR", product: "spot", placement: "r40-br", campaign: "r40-br-owner-telegram-return" },
    ];
    const html = cases.map((props) => renderToStaticMarkup(React.createElement(OnsiteTelegramBotHandoff, props))).join("\\n");
    console.log(JSON.stringify({ html }));
  `);
  const { html } = JSON.parse(output);
  assert.equal((html.match(/data-r40-contextual-telegram="true"/g) || []).length, 8);
  assert.equal((html.match(/data-telegram-owner-level="true"/g) || []).length, 4);
  assert.equal((html.match(/data-cta-kind="telegram"/g) || []).length, 8);
  assert.equal((html.match(/data-cta-kind="registration"/g) || []).length, 0);
  assert.match(html, /data-telegram-return-route="\/exchanges\/bitget"/);
  assert.match(html, /data-telegram-return-route="\/compare\/bybit-vs-bitget"/);
  assert.match(html, /data-telegram-return-route="\/rates"/);
  assert.match(html, /data-telegram-return-route="\/br\/conta"/);
  assert.doesNotMatch(html, protectedMaterial);
  assert.doesNotMatch(html, /data-telegram-return-href=/);
  assert.doesNotMatch(html, /private commission|raw registration link|user identifier/i);
});

test("R43 news and topic owners mount contextual Telegram handoff back to their content route", async () => {
  const output = await bundleAndRun(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { NewsDetailPage } from "../../src/components/v3/news/NewsDetailPage.jsx";
    import { TopicGuidePage } from "../../src/components/v3/TopicGuidePage.jsx";

    const article = {
      slug: "r43-content-bridge-fixture",
      categoryName: { en: "Exchange operations" },
      publishedAt: "2026-09-29T00:00:00Z",
      readTime: "5 min",
      author: "NexuAlpha Research",
      title: { en: "R43 content bridge fixture" },
      summary: { en: "A source-bound fixture for content handoff." },
      content: { en: "## Direct answer\\\\nUse this article to continue the same source-bound context.\\\\n\\\\n## Comparison at a glance\\\\nThe longer article continues here." },
      relatedVenues: ["okx", "binance"],
      sources: [{ id: "source", publisher: "Official source", title: "Official source", url: "https://example.com/source" }],
      seo: { internalLinkTargets: ["/compare/binance-vs-okx", "/exchanges/okx"] },
    };

    const html = [
      renderToStaticMarkup(React.createElement(NewsDetailPage, {
        slug: article.slug,
        locale: "zh-Hans",
        market: "GLOBAL",
        product: "spot",
        initialArticles: [article],
      })),
      renderToStaticMarkup(React.createElement(TopicGuidePage, {
        slug: "derivatives",
        locale: "es",
        market: "MX",
        product: "perpetuals",
        venues: [],
      })),
    ].join("\\n");
    console.log(JSON.stringify({ html }));
  `);
  const { html } = JSON.parse(output);
  assert.match(html, /data-telegram-return-route="\/news\/r43-content-bridge-fixture"/);
  assert.match(html, /data-telegram-return-route="\/news\/r43-content-bridge-fixture"/);
  assert.match(html, /data-telegram-return-route="\/topics\/derivatives"/);
  assert.match(html, /data-telegram-return-route="\/topics\/derivatives"/);
  // Article sponsored slots may carry codes; contextual Telegram handoffs may not.
  const document = new JSDOM(html).window.document;
  const handoffs = [...document.querySelectorAll('[data-telegram-owner-level="true"]')];
  assert.equal(handoffs.length, 2);
  for (const handoff of handoffs) {
    assert.doesNotMatch(handoff.outerHTML, protectedMaterial);
    assert.equal(handoff.getAttribute('data-cta-kind'), 'telegram');
    assert.equal(handoff.querySelectorAll('a[href^="/go/"]').length, 0);
  }
});

test("R40 page owners mount contextual Telegram handoff without editing protected CTA registries", async () => {
  const venuePage = await readFile(new URL("../src/components/v3/VenueDetailResearch.jsx", import.meta.url), "utf8");
  const v3Pages = await readFile(new URL("../src/components/v3/V3Pages.jsx", import.meta.url), "utf8");
  const ratesPage = await readFile(new URL("../src/components/v3/FeeBenchmarkTerminal.jsx", import.meta.url), "utf8");
  const brazilPage = await readFile(new URL("../src/components/v3/international/BrazilDecisionPage.jsx", import.meta.url), "utf8");

  assert.match(venuePage, /canonicalPath=\{`\/exchanges\/\$\{profile\.slug\}`\}/);
  assert.match(v3Pages, /canonicalPath=\{`\/compare\/\$\{compareSlugKey\}`\}/);
  assert.match(ratesPage, /canonicalPath="\/rates"/);
  assert.match(ratesPage, /returnRoute="\/rates"/);
  assert.match(brazilPage, /placement="brazil-owner-telegram-handoff"/);
  assert.match(brazilPage, /returnRoute=\{page\.path\}/);

  for (const [relativePath, expectedHash] of Object.entries(protectedHashes)) {
    const file = await readFile(new URL(`../${relativePath}`, import.meta.url));
    assert.equal(createHash("sha256").update(file).digest("hex"), expectedHash, relativePath);
  }
});
