// SEO w43 link hubs (2026-10-18): bidirectional, crawlable <a href> links in the server HTML for three hubs, plus the
// schema.org fixes on article templates.
//   1. Tokenized stocks: tokenized-stocks news articles -> /tokenized-stocks and the /tokenized-stocks/<ticker> pages they
//      name (the hub and ticker pages are owned by another lane; their links back to articles are not tested here).
//   2. Deposit (出入金): deposit hub <-> country pages <-> exchange profile deposit blocks (push order, tr/vi/ru rules).
//   3. Whales: /whales/<coin> <-> /coins/<coin>.
//   4. relatedLink only on WebPage nodes (NewsArticle / Dataset carry it on mainEntityOfPage); hasPart items are named
//      CreativeWorks with a URL.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import worker from "../worker/index.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { articleClusterLinks } from "../src/data/topic-clusters.js";
import { isTokenizedStockArticle, tsArticleLinks, tsArticleTickers } from "../src/data/tokenized-stocks-news.js";
import { WHALE_COINS, WHALE_COIN_PAGES, coinPageForWhaleCoin, whalePathForCoinSlug } from "../src/data/whale-routes.js";
import { COIN_ROWS } from "../src/data/coins-data.generated.js";
import { depositExchangeLinks, PUSH_ORDER } from "../src/data/deposit.js";
import { converterRouteSeo } from "../src/data/converter-seo.js";
import { createSsrHarness, SHELL_HTML } from "./helpers/ssr-hydration-harness.mjs";

const FEED_TEXT = readFileSync(new URL("../public/content/news-feed.json", import.meta.url), "utf8");
const FEED = JSON.parse(FEED_TEXT).articles.filter((article) => article.status === "PUBLISHED");
const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/content/news-feed.json") return new Response(FEED_TEXT, { headers: { "content-type": "application/json" } });
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const env = () => ({ ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) });
const fetchHtml = async (path) => (await worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), env())).text();
const mainHtml = (html) => (html.match(/<main\b[\s\S]*<\/main>/) || [""])[0];
const hrefs = (html) => [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((match) => match[1].replaceAll("&amp;", "&"));
const ldJson = (html) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((match) => { const value = JSON.parse(match[1]); return Array.isArray(value) ? value : (value["@graph"] || [value]); });
const newsSlugs = (html) => [...new Set(hrefs(html).map((href) => href.match(/^\/news\/([a-z0-9-]+)$/)?.[1]).filter(Boolean))];

// ---------------------------------------------------------------- tokenized stocks
test("tokenized stocks: cluster rule and ticker detection read stable fields only", () => {
  const cluster = FEED.filter(isTokenizedStockArticle);
  assert.ok(cluster.length >= 6, `repository feed has ${cluster.length} tokenized-stocks articles`);
  const sample = { slug: "bybit-xstocks-nvidia-tesla-listing", status: "PUBLISHED", title: { en: "Bybit adds xStocks for Nvidia and TSLA" }, summary: { en: "Two new stock tokens." } };
  assert.deepEqual(tsArticleTickers(sample), ["NVDA", "TSLA"]);
  assert.deepEqual(tsArticleTickers({ ...sample, title: { en: "Coinbase and Robinhood list stock tokens" } }), [], "venue names are not ticker mentions");
  assert.deepEqual(tsArticleTickers({ slug: "bitcoin-etf-flows", status: "PUBLISHED", title: { en: "NVDA earnings move bitcoin" } }), [], "outside the cluster: no ticker links");
  const links = tsArticleLinks(sample, "zh-Hans");
  assert.deepEqual(links.map((link) => link.href), ["/zh-hans/tokenized-stocks", "/zh-hans/tokenized-stocks/nvda", "/zh-hans/tokenized-stocks/tsla"]);
  // The article's "Topic hubs & tools" line carries them after the cluster families.
  const line = articleClusterLinks(sample, "en").map((link) => link.href);
  assert.ok(line.includes("/tokenized-stocks") && line.includes("/tokenized-stocks/nvda"), line.join(" "));
});

test("tokenized stocks: every cluster article links the hub inside <main> of its server HTML", async () => {
  const cluster = FEED.filter(isTokenizedStockArticle).slice(0, 3);
  for (const article of cluster) {
    for (const prefix of ["", "/zh-hans"]) {
      const main = mainHtml(await fetchHtml(`${prefix}/news/${article.slug}`));
      assert.ok(hrefs(main).includes(`${prefix}/tokenized-stocks`), `${prefix}/news/${article.slug} -> hub`);
    }
  }
  // A ticker named in the body adds that ticker page to the same line.
  const named = { ...cluster[0], content: { en: `${cluster[0].content?.en || ""}\n\nNvidia (NVDA) is one of the listed stock tokens.` } };
  assert.ok(articleClusterLinks(named, "en").some((link) => link.href === "/tokenized-stocks/nvda"));
});

// ---------------------------------------------------------------- deposit
test("deposit: hub -> countries and exchange deposit blocks in push order; tr skips Bitget; vi/ru list none", () => {
  const en = depositExchangeLinks("en").map((link) => link.slug);
  assert.deepEqual(en.slice(0, 3), ["bitget", "okx", "binance"]);
  assert.deepEqual(en, [...en].sort((a, b) => PUSH_ORDER.indexOf(a) - PUSH_ORDER.indexOf(b)));
  assert.ok(!depositExchangeLinks("tr").some((link) => link.slug === "bitget"));
  assert.deepEqual(depositExchangeLinks("vi"), []);
  assert.deepEqual(depositExchangeLinks("ru"), []);
});

test("deposit: hub <-> country <-> exchange profile links exist in the server HTML", () => {
  const hub = hrefs(harness.render("/deposit"));
  assert.ok(hub.includes("/deposit/brazil"), "hub -> country");
  assert.ok(hub.includes("/exchanges/bitget#deposits"), "hub -> exchange deposit block");

  const country = hrefs(harness.render("/deposit/brazil"));
  assert.ok(country.includes("/deposit"), "country -> hub");
  const exchanges = country.filter((href) => /^\/exchanges\/[a-z0-9-]+#deposits$/.test(href)).map((href) => href.split("/")[2].split("#")[0]);
  assert.ok(exchanges.length >= 2, `country -> ${exchanges.length} exchange pages`);
  assert.deepEqual(exchanges, [...exchanges].sort((a, b) => PUSH_ORDER.indexOf(a) - PUSH_ORDER.indexOf(b)), "push order");
  assert.equal(exchanges[0], "bitget");

  const profile = hrefs(harness.render(`/exchanges/${exchanges[0]}`));
  assert.ok(profile.includes("/deposit"), "exchange -> deposit hub");
  assert.ok(profile.includes("/deposit/brazil"), "exchange -> country");

  const trCountry = harness.render("/tr/para-yatirma/turkiye");
  assert.doesNotMatch(trCountry, /\/exchanges\/bitget/, "tr never links Bitget");
  const viHub = hrefs(harness.render("/vi/nap-rut"));
  assert.ok(!viHub.some((href) => href.endsWith("#deposits")), "vi hub lists no exchange links");
});

// ---------------------------------------------------------------- whales <-> coins
test("whales: the coin-page map matches the coin table", () => {
  for (const [symbol, [slug, name]] of Object.entries(WHALE_COIN_PAGES)) {
    assert.ok(WHALE_COINS.includes(symbol), `${symbol} is on the whale watchlist`);
    const row = COIN_ROWS.find((entry) => entry[1] === slug);
    assert.ok(row, `/coins/${slug} exists`);
    assert.equal(row[3], symbol);
    assert.equal(row[2], name);
  }
  for (const symbol of WHALE_COINS) {
    const row = COIN_ROWS.find((entry) => entry[3] === symbol);
    if (row) assert.ok(WHALE_COIN_PAGES[symbol], `${symbol} has /coins/${row[1]} and must be mapped`);
  }
});

test("whales: /whales/<coin> <-> /coins/<coin> links exist in the server HTML", () => {
  const whale = hrefs(harness.render("/whales/btc"));
  assert.ok(whale.includes(coinPageForWhaleCoin("BTC").path), "whale page -> coin page");
  const coin = hrefs(harness.render("/coins/bitcoin"));
  assert.ok(coin.includes(whalePathForCoinSlug("bitcoin")), "coin page -> whale page");
  const eth = hrefs(harness.render("/zh-hans/coins/ethereum"));
  assert.ok(eth.includes("/zh-hans/whales/eth"), "localized coin page -> whale page");
  assert.equal(whalePathForCoinSlug("dogecoin"), null);
});

// ---------------------------------------------------------------- schema
const WEB_PAGE_TYPES = new Set(["WebPage", "CollectionPage", "AboutPage", "ContactPage", "FAQPage", "ItemPage", "ProfilePage", "QAPage", "SearchResultsPage", "CheckoutPage"]);
function nodes(value, out = []) {
  if (Array.isArray(value)) { for (const item of value) nodes(item, out); return out; }
  if (value && typeof value === "object") { out.push(value); for (const item of Object.values(value)) nodes(item, out); }
  return out;
}
function assertRelatedLinkOnWebPagesOnly(graph, label) {
  for (const node of nodes(graph)) {
    if (!("relatedLink" in node)) continue;
    const types = [].concat(node["@type"]);
    assert.ok(types.some((type) => WEB_PAGE_TYPES.has(type)), `${label}: relatedLink on ${types.join("/")}`);
  }
}
function assertHasPartItemsValid(graph, label) {
  for (const node of nodes(graph)) {
    for (const part of [].concat(node.hasPart || [])) {
      assert.ok(part["@type"] && !["ItemList", "ListItem", "Thing"].includes(part["@type"]), `${label}: hasPart @type ${part["@type"]}`);
      assert.ok(part.name, `${label}: hasPart ${part["@type"]} has a name`);
      assert.ok(part.url || part["@id"], `${label}: hasPart ${part.name} has a url or @id`);
    }
  }
}

test("schema: NewsArticle has no relatedLink; its WebPage (same @id) carries it", async () => {
  const article = FEED.find((item) => item.slug === "tokenized-treasuries-structure-access-risks");
  const client = computeRouteSeo({ url: `/news/${article.slug}`, locale: "en", article });
  const html = await fetchHtml(`/news/${article.slug}`);
  for (const [label, graph] of [["client", client.schemas], ["worker", ldJson(html)]]) {
    const news = graph.find((node) => node["@type"] === "NewsArticle");
    assert.ok(news, `${label} NewsArticle`);
    assert.equal(news.relatedLink, undefined, `${label}: NewsArticle carries no relatedLink`);
    assert.equal(news.mainEntityOfPage["@type"], "WebPage");
    assert.equal(news.mainEntityOfPage["@id"], `https://nexualpha.com/news/${article.slug}`);
    assert.ok(news.mainEntityOfPage.relatedLink.includes("https://nexualpha.com/topics/tokenized-treasuries"), `${label}: links moved, not dropped`);
    assertRelatedLinkOnWebPagesOnly(graph, label);
    assertHasPartItemsValid(graph, label);
  }
});

test("schema: factbook Dataset, compare hub and converter keep relatedLink / hasPart valid", async () => {
  const factbook = computeRouteSeo({ url: "/factbook/hyperliquid", locale: "en" }).schemas;
  const dataset = factbook.find((node) => node["@type"] === "Dataset");
  assert.equal(dataset.relatedLink, undefined);
  assert.ok(dataset.mainEntityOfPage.relatedLink.length >= 3);
  assertRelatedLinkOnWebPagesOnly(factbook, "factbook");
  for (const path of ["/factbook/binance", "/compare", "/exchanges/okx", "/topics/tokenized-treasuries"]) {
    const graph = ldJson(await fetchHtml(path));
    assertRelatedLinkOnWebPagesOnly(graph, path);
    assertHasPartItemsValid(graph, path);
  }
  const converter = converterRouteSeo("/convert/btc-to-usd", "en", { urlFor: (path) => `https://nexualpha.com${path}` });
  assert.equal(converter.schemas[0].hasPart["@type"], "WebPageElement");
  assert.equal(converter.schemas[0].hasPart.mainEntity["@type"], "ItemList");
  assertHasPartItemsValid(converter.schemas, "converter");
});
