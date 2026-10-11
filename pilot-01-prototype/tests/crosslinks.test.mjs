// Tool <-> article cross-links and topic clusters (links-l10n lane 2026-10-11; scorecard D4 + C5).
// - Tool pages (/liquidations, /funding-rates, /rates, /compare, /activities, compare pairs) render a server-side
//   "Related research" block with the newest matching articles, computed by the Worker from the live feed and carried in
//   the prerender state, so hydration reproduces it (no mismatch) and crawlers see the links.
// - Articles link the main page of every query family / tool they belong to ("Topic hubs & tools" line), from the same
//   mapping (src/data/topic-clusters.js), in all 15 locales.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import worker from "../worker/index.js";
import {
  ARTICLE_CLUSTER_LINK_LIMIT, TOOL_CLUSTER_IDS, TOPIC_CLUSTERS, articleClusterLineLabel, articleClusterLinks, articleMatchesCluster,
  clusterForQuery, clusterLabel, toolArticleLinks, toolArticles, toolKeyForPath, toolKeyForRoute,
} from "../src/data/topic-clusters.js";
import { ROUTE_MODULE_PATHS } from "../src/data/route-module-cache.js";
import { createSsrHarness, SHELL_HTML, prerenderState, rootInnerHtml, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"];
const repoFeed = JSON.parse(fs.readFileSync(path.join(root, "public/content/news-feed.json"), "utf8")).articles;

const NOW = Date.now();
const daysAgo = (days) => new Date(NOW - days * 86_400_000).toISOString();
const article = (slug, en, extra = {}) => ({
  slug, status: "PUBLISHED", category: extra.category || "research", categoryName: { en: "Research", "zh-Hans": "研究" },
  publishedAt: extra.publishedAt || daysAgo(1), updatedAt: null, readTime: "6 min", author: "NexuAlpha Research Desk",
  title: { en, "zh-Hans": `${en}（中文）`, ...(extra.title || {}) }, summary: { en: extra.summary || `${en} summary.`, "zh-Hans": "摘要。", ...(extra.localSummary || {}) },
  content: { en: `## The short answer\n\n${en} body text.\n\n## Detail\n\nMore text.`, "zh-Hans": "## 简短回答\n\n正文。", ...(extra.localContent || {}) },
  sources: [{ id: "s1", url: "https://example.com/source", publisher: "Example", title: "Source" }],
  relatedVenues: extra.relatedVenues || [], availableLocales: extra.availableLocales || ["en", "zh-Hans"],
  seo: { noindex: extra.noindex ?? false, primaryKeyword: extra.keyword || "" },
});
const feedArticles = [
  article("funding-rate-explainer", "What is the funding rate on perpetual futures", { publishedAt: daysAgo(1) }),
  article("binance-okx-funding-caps", "Binance vs OKX funding rate caps", { relatedVenues: ["binance", "okx"], publishedAt: daysAgo(2), category: "comparison" }),
  article("bybit-funding-interval-change", "Bybit funding interval change checklist", { relatedVenues: ["bybit"], publishedAt: daysAgo(3) }),
  article("okx-perp-listing", "OKX perpetual listing checklist", { summary: "The contract's funding rate is capped at 0.75%.", relatedVenues: ["okx"], publishedAt: daysAgo(4) }),
  article("liquidation-cascade-review", "October liquidation cascade one year later", { publishedAt: daysAgo(1) }),
  article("binance-margin-call-update", "Binance margin call ratio update", { relatedVenues: ["binance"], publishedAt: daysAgo(2) }),
  article("insurance-fund-adl", "Insurance fund and auto-deleveraging disclosure radar", { publishedAt: daysAgo(5) }),
  article("tr-native-leverage", "Leverage limits in Turkey", { title: { tr: "Türkiye'de kaldıraç sınırları" }, localSummary: { tr: "Özet." }, localContent: { tr: "## Kısa cevap\n\nMetin." }, availableLocales: ["en", "zh-Hans", "tr"], publishedAt: daysAgo(6) }),
  article("old-noindex-liquidation", "Liquidation note", { noindex: true, publishedAt: daysAgo(30) }),
];
const feedText = JSON.stringify({ version: 1, articles: feedArticles });
const feedSha = "a".repeat(64);

test("every cluster has a main page, a label in all 15 locales and an article rule; tools are the five data/tool pages", () => {
  assert.deepEqual([...TOOL_CLUSTER_IDS].sort(), ["activities", "compare", "funding-rates", "liquidations", "rates"]);
  const ids = new Set();
  for (const cluster of TOPIC_CLUSTERS) {
    assert.ok(!ids.has(cluster.id), `unique id ${cluster.id}`);
    ids.add(cluster.id);
    assert.match(cluster.path, /^\/[a-z0-9/-]*$/, `${cluster.id}: content path`);
    assert.ok(cluster.query instanceof RegExp && cluster.match, `${cluster.id}: query + article rule`);
    const english = clusterLabel(cluster, "en");
    for (const locale of LOCALES) {
      const label = clusterLabel(cluster, locale);
      assert.ok(label && label !== cluster.path, `${cluster.id}/${locale}: label`);
      if (locale !== "en") assert.notEqual(label, english, `${cluster.id}/${locale}: label is translated`);
    }
  }
  for (const locale of LOCALES) assert.ok(articleClusterLineLabel(locale), `${locale}: line label`);
  assert.equal(new Set(LOCALES.map(articleClusterLineLabel)).size, LOCALES.length, "line label translated per locale");
});

test("GSC queries map to their family: pairs and exchanges own their queries, generic intent goes to tools and hubs", () => {
  assert.equal(clusterForQuery("bybit vs bitget")?.id, "bybit-vs-bitget");
  assert.equal(clusterForQuery("kraken vs binance")?.id, "binance-vs-kraken");
  assert.equal(clusterForQuery("hyperliquid fees")?.id, "hyperliquid");
  assert.equal(clusterForQuery("which crypto exchange has the best funding rate")?.id, "funding-rates");
  assert.equal(clusterForQuery("okx gebühren")?.id, "rates");
  assert.equal(clusterForQuery("tokenized treasury bills")?.id, "tokenized-treasuries");
  assert.equal(clusterForQuery("gemini verify identity")?.id, "account-setup");
  assert.equal(clusterForQuery("أفضل عملات الميم")?.id, "meme-coins");
  assert.equal(clusterForQuery("dxxbzqgqsobnq2ltza4xsxn9ewuimgkveuc7h8b8j1qm"), null);
});

test("tool pages list matching articles newest first, search-published first, with localized links and honest titles", () => {
  const funding = toolArticles("funding-rates", feedArticles).map((row) => row.slug);
  assert.deepEqual(funding, ["funding-rate-explainer", "binance-okx-funding-caps", "bybit-funding-interval-change", "okx-perp-listing"], "title or summary match");
  const liquidations = toolArticles("liquidations", feedArticles).map((row) => row.slug);
  assert.deepEqual(liquidations.slice(0, 4), ["liquidation-cascade-review", "binance-margin-call-update", "insurance-fund-adl", "tr-native-leverage"]);
  assert.equal(liquidations.at(-1), "old-noindex-liquidation", "noindex articles come after search-published ones");
  const tr = toolArticleLinks("liquidations", feedArticles, "tr");
  assert.equal(tr.tool, "liquidations");
  assert.equal(tr.locale, "tr");
  const native = tr.items.find((item) => item.slug === "tr-native-leverage");
  assert.deepEqual([native.href, native.title, native.lang], ["/tr/news/tr-native-leverage", "Türkiye'de kaldıraç sınırları", "tr"]);
  const english = tr.items.find((item) => item.slug === "liquidation-cascade-review");
  assert.deepEqual([english.href, english.title, english.lang], ["/news/liquidation-cascade-review?locale=tr", "October liquidation cascade one year later", "en"], "no generic placeholder title");
  const pair = toolArticles("compare:binance-vs-okx", feedArticles).map((row) => row.slug);
  assert.equal(pair[0], "binance-okx-funding-caps", "an article naming both venues leads the pair page");
  assert.equal(toolArticleLinks("compare", [], "en"), null, "no articles: no block");
  assert.equal(toolKeyForPath("/compare/binance-vs-okx"), "compare:binance-vs-okx");
  assert.equal(toolKeyForPath("/news"), null);
});

test("tool pages prerendered at build time (/rates, curated compare pairs) list >= 3 repository-feed articles that link back", () => {
  // /liquidations, /funding-rates, /compare and /activities render from the live feed at request time (Worker); the
  // crawl check scripts/qa-crosslinks.mjs covers them against a running site.
  for (const tool of ["rates", "compare:binance-vs-okx", "compare:bybit-vs-bitget", "compare:binance-vs-kraken"]) {
    const rows = toolArticles(tool, repoFeed);
    assert.ok(rows.length >= 3, `${tool}: ${rows.length} articles`);
    if (tool === "rates") for (const row of rows) assert.ok(articleClusterLinks(row, "en").some((link) => link.path === "/rates"), `${row.slug} links back to /rates`);
  }
});

test("every article's cluster line fits the link limit, so no matching family is dropped", () => {
  for (const item of repoFeed) {
    const matching = TOPIC_CLUSTERS.filter((cluster) => articleMatchesCluster(item, cluster)).length;
    assert.ok(matching <= ARTICLE_CLUSTER_LINK_LIMIT, `${item.slug}: ${matching} families`);
  }
  const links = articleClusterLinks(feedArticles[1], "de");
  assert.deepEqual(links.map((link) => link.path), ["/funding-rates", "/compare", "/compare/binance-vs-okx"]);
  assert.equal(links[0].href, "/de/funding-rates");
  assert.equal(links[2].label, "Binance und OKX vergleichen");
  assert.equal(articleClusterLinks({ ...feedArticles[0], slug: "binance-sbe-vs-coinbase-websocket-market-data-schema-control-checklist", title: { en: "Binance SBE market data API" } }, "en").some((link) => link.id === "exchange-api"), false, "the pillar article does not link to itself");
});

test("App's tool key mirror agrees with the mapping and the block hydrates in its own boundary", () => {
  const app = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");
  for (const [name, key] of [["liquidations", "liquidations"], ["fundingRates", "funding-rates"], ["rateTerminal", "rates"], ["compareHub", "compare"], ["activities", "activities"]]) {
    assert.equal(toolKeyForRoute({ name }), key);
    assert.match(app, new RegExp(`${name}: "${key}"`), `App.jsx toolKeyOf maps ${name}`);
  }
  assert.equal(toolKeyForRoute({ name: "compare", slugs: ["binance", "okx"] }), "compare:binance-vs-okx");
  assert.ok(Object.values(ROUTE_MODULE_PATHS).includes("./components/shared/ToolArticleLinks.jsx"), "the block is a registered route module");
  assert.match(app, /<React\.Suspense fallback=\{null\}><ToolArticleLinks /, "own Suspense boundary: the server HTML stays until the chunk loads");
  assert.match(fs.readFileSync(path.join(root, "scripts/prepare-sites-build.mjs"), "utf8"), /"topic-clusters\.js"/, "the server bundle ships the mapping the Worker imports");
});

// ---- Worker + SSR + hydration ---------------------------------------------------------------------------------------
const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  if (pathname === "/content/news-feed.json") return new Response(feedText, { headers: { "content-type": "application/json" } });
  if (pathname === "/content/news-feed.sha256.txt") return new Response(`${feedSha}\n`);
  return new Response("missing", { status: 404 });
} };

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const fetchPage = (pathname, env) => worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), env);

test("data pages render the related-articles block at request time from the live feed and hydrate with it", async () => {
  const env = { ASSETS: assets, MARKET_EVENTS_READ: async () => null, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) };
  for (const [pagePath, tool, locale] of [["/liquidations", "liquidations", "en"], ["/tr/liquidations", "liquidations", "tr"], ["/ar/funding-rates", "funding-rates", "ar"], ["/zh-hans/funding-rates", "funding-rates", "zh-Hans"]]) {
    const html = await (await fetchPage(pagePath, env)).text();
    assert.match(html, new RegExp(`<section[^>]*data-tool-articles="${tool}"`), `${pagePath}: block in the SSR HTML`);
    const slugs = [...html.matchAll(/data-tool-article="([a-z0-9-]+)"/g)].map((match) => match[1]);
    assert.ok(slugs.length >= 3, `${pagePath}: ${slugs.length} article links`);
    const state = prerenderState(html);
    assert.equal(state.toolArticles.tool, tool);
    assert.equal(state.toolArticles.locale, locale);
    assert.deepEqual(state.toolArticles.items.map((item) => item.slug), slugs, `${pagePath}: payload matches the links`);
    const replay = await harness.render(`https://nexualpha.com${pagePath.replace(/^\/(?:tr|ar|zh-hans)/, "")}?locale=${locale}`, { toolArticles: state.toolArticles });
    assert.ok(replay.includes(`data-tool-articles="${tool}"`), `${pagePath}: hydration props reproduce the block`);
  }
  const ar = await (await fetchPage("/ar/funding-rates", env)).text();
  assert.match(ar, /data-tool-articles="funding-rates" dir="rtl"/, "Arabic block is RTL");
  assert.match(ar, /أبحاث ذات صلة/, "Arabic heading");
});

test("hydrateRoot in jsdom reports no mismatch on tool pages carrying the block", async () => {
  const env = { ASSETS: assets, MARKET_EVENTS_READ: async () => null, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) };
  for (const pagePath of ["/liquidations", "/tr/funding-rates", "/ar/liquidations"]) {
    const html = await (await fetchPage(pagePath, env)).text();
    const { errors, text } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${pagePath}`);
    assert.deepEqual(hydrationErrors(errors), [], `${pagePath}: hydration errors: ${errors.join("\n")}`);
    assert.ok(/funding|liquidation|kaldıraç|leverage/i.test(text), `${pagePath}: article links survive hydration`);
  }
});

test("GET /api/news/tool-articles serves the same list for client-side route changes and rejects unknown tools", async () => {
  const env = { ASSETS: assets };
  const response = await worker.fetch(new Request("https://nexualpha.com/api/news/tool-articles?tool=funding-rates&locale=vi"), env);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.tool, "funding-rates");
  assert.equal(payload.locale, "vi");
  assert.deepEqual(payload.items.map((item) => item.slug), toolArticleLinks("funding-rates", feedArticles, "vi").items.map((item) => item.slug));
  const pair = await (await worker.fetch(new Request("https://nexualpha.com/api/news/tool-articles?tool=compare:binance-vs-okx&locale=en"), env)).json();
  assert.equal(pair.items[0].slug, "binance-okx-funding-caps");
  const bad = await worker.fetch(new Request("https://nexualpha.com/api/news/tool-articles?tool=../../etc&locale=en"), env);
  assert.equal(bad.status, 400);
});

test("articles carry the Topic hubs & tools line in the React page and in the Worker fallback body", async () => {
  const html = await harness.render("https://nexualpha.com/news/binance-okx-funding-caps?locale=ja", { newsArticles: feedArticles });
  assert.match(html, /data-news-cluster-links=""/, "line rendered");
  assert.match(html, /関連テーマとツール/, "Japanese label");
  for (const target of ["/ja/funding-rates", "/ja/compare", "/ja/compare/binance-vs-okx"]) assert.ok(html.includes(`href="${target}"`), `links ${target}`);
  const fallback = await (await fetchPage("/news/binance-okx-funding-caps", { ASSETS: assets })).text();
  assert.match(fallback, /data-news-cluster-links=""[\s\S]*href="https:\/\/nexualpha\.com\/funding-rates"|data-news-cluster-links=""[\s\S]*href="\/funding-rates"/, "fallback body links the tool");
});
