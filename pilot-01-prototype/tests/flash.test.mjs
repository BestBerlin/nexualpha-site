// NexuAlpha Flash (2026-10-12): /flash stream and /flash/<key>-<slug> item pages. Request-time SSR through the Worker
// with the component the browser hydrates, LiveBlogPosting / NewsArticle JSON-LD, the 30-day noindex rule, the 7-day
// flash sitemap, geo-gated sign-up (neutral locales and Türkiye), the owner's no-fine-print rule, and localized
// templates that keep every number and ticker identical to English.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";
import { FLASH_INDEX_LOCALES, FLASH_TEMPLATE_LOCALES, buildFlashItems, flashItemIndexLocales, marketFlashItems, parseAnnouncementTitle, renderText } from "../src/data/flash-feed.js";
import { flashItemPath, flashSignupVenues, flashUiCopy, parseFlashPath } from "../src/data/flash.js";
import { buildSplitSitemaps, routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import { createSsrHarness, SHELL_HTML, hydrateInJsdom, hydrationErrors, h1Texts, decodeEntities } from "./helpers/ssr-hydration-harness.mjs";

const NOW = Date.now();
const ago = (ms) => new Date(NOW - ms).toISOString();
const H = 60 * 60 * 1000, D = 24 * H;

const ANNOUNCEMENTS = { generatedAt: ago(0), items: [
  { id: "okx:ct-spot", venue: "okx", category: "listing", title: "OKX to list CT/USDT (Concrete) for spot trading", url: "https://www.okx.com/help/okx-to-list-ct-usdt", publishedAt: ago(2 * H), sourceType: "official_api" },
  { id: "kucoin:venom", venue: "kucoin", category: "delisting", title: "KuCoin Will Delist VENOM and NFP on 2026-10-14", url: "https://www.kucoin.com/announcement/en-kucoin-will-delist-venom", publishedAt: ago(3 * H), sourceType: "official_api" },
  { id: "bitget:pool", venue: "bitget", category: "event", title: "Bitget Futures carnival: share a 280,000 USDT prize pool", url: "https://www.bitget.com/support/articles/280000", publishedAt: ago(4 * H), sourceType: "official_api" },
  { id: "binance:kgst", venue: "binance", category: "event", title: "Binance Will Waive Trading Fees on KGST/USDT", url: "https://www.binance.com/en/support/announcement/detail/kgst", publishedAt: ago(5 * H), sourceType: "official_api" },
] };
const ARCHIVE = { items: [
  { id: "okx:old-listing", venue: "okx", category: "listing", title: "OKX to list perpetual futures for QNT crypto", url: "https://www.okx.com/help/qnt", publishedAt: ago(40 * D), firstSeenAt: ago(40 * D) },
] };
const BRIEFS = { items: [{ id: "binance:kgst", updated: ago(5 * H),
  headline: { en: "Zero trading fees on KGST/USDT at Binance for three months", "zh-Hans": "币安 KGST/USDT 三个月零手续费", tr: "Binance’te KGST/USDT için üç ay sıfır işlem ücreti" },
  summary: { en: "From 2026-10-14 00:00 UTC to 2027-01-13 23:59 UTC, Binance charges no maker or taker fees on the KGST/USDT spot pair. There is nothing to register for.", "zh-Hans": "2026-10-14 00:00 UTC 至 2027-01-13 23:59 UTC 期间，币安对 KGST/USDT 现货交易对免收挂单和吃单手续费。无需报名。" } }] };
const MARKET = {
  generatedAt: ago(5 * 60 * 1000),
  history: { hourly: [{ t: ago(H), totalUsd: 10270332, longUsd: 21707, shortUsd: 10248625 }, { t: ago(2 * H), totalUsd: 600000, longUsd: 300000, shortUsd: 300000 }] },
  market: { majors: [{ symbol: "BTCUSDT", price: 83329.7, change1hPct: -2.31, change24hPct: 0.21 }, { symbol: "ETHUSDT", price: 2544.09, change1hPct: -0.04, change24hPct: 1.52 }],
    movers: [{ symbol: "GTCUSDT", change24hPct: 54.72, quoteVolume24h: 147017542 }, { symbol: "TINYUSDT", change24hPct: 80, quoteVolume24h: 1000 }] },
  funding: { generatedAt: ago(5 * 60 * 1000), rows: [{ symbol: "BZ", binanceRate: -0.00113958, binanceNextAt: new Date(NOW + 3 * H).toISOString(), okxRate: -0.0013536950717777 }, { symbol: "BTC", binanceRate: 0.00006517, okxRate: 0.0000818 }] },
};
const NEWS = { articles: [{ slug: "why-is-rsr-up-today", status: "PUBLISHED", publishedAt: ago(30 * 60 * 1000), title: { en: "Why Is RSR Up 46% Today?", "zh-Hans": "RSR 今天为什么涨 46%？" },
  summary: { en: "Reserve Rights rose about 46% after an Upbit listing. Funding turned deeply negative.", "zh-Hans": "Reserve Rights 在 Upbit 上线后上涨约 46%。资金费率转为深度负值。" }, availableLocales: ["en", "zh-Hans"], relatedVenues: ["binance"], content: { en: "x" } }] };

const ASSET_JSON = {
  "/intel/official-announcements.json": ANNOUNCEMENTS, "/intel/official-announcements-archive.json": ARCHIVE,
  "/content/campaign-briefs.json": BRIEFS, "/intel/market-events.json": MARKET, "/content/news-feed.json": NEWS,
};
const makeAssets = () => ({ fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  if (ASSET_JSON[pathname]) return Response.json(ASSET_JSON[pathname]);
  return new Response("missing", { status: 404 });
} });
let harness;
const sharedAssets = makeAssets();
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const env = () => ({ ASSETS: sharedAssets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) });
const fetchPage = (path, e = env()) => worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), e);
const ldJson = (html) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => { const v = JSON.parse(m[1]); return Array.isArray(v) ? v : (v["@graph"] || [v]); });
const mainHtml = (html) => (html.match(/<main\b[\s\S]*<\/main>/) || [""])[0];
const robots = (html) => html.match(/<meta name="robots" content="([^"]+)"/)?.[1];

const { items } = buildFlashItems({ announcements: ANNOUNCEMENTS, archive: ARCHIVE, briefs: BRIEFS.items, market: MARKET, news: NEWS.articles, now: NOW });
const byId = (id) => items.find((item) => item.id === id);
const OKX = byId("a:okx:ct-spot"), KUCOIN = byId("a:kucoin:venom"), BITGET = byId("a:bitget:pool"), BRIEF = byId("a:binance:kgst"), OLD = byId("a:okx:old-listing");
const LIQ = items.find((item) => item.type === "liquidation-spike"), FUND = items.find((item) => item.type === "funding-extreme"), NEWS_ITEM = items.find((item) => item.type === "news");

const FINE_PRINT = [
  /not (?:investment|financial) advice/i, /lower bound/i, /not the whole market/i, /pays our commission/i, /affiliate commission/i, /commission/i,
  /availability depends/i, /terms (?:and conditions )?apply/i, /do your own research|DYOR/i,
  /非投资建议|不构成投资建议|下限|佣金|是否可用取决于/, /非投資建議|傭金/,
];

test("feed: every source type becomes a flash item with a stable key and path", () => {
  assert.deepEqual([OKX, KUCOIN, BITGET, BRIEF, OLD, LIQ, FUND, NEWS_ITEM].map((item) => item?.type), ["listing", "delisting", "campaign", "campaign", "listing", "liquidation-spike", "funding-extreme", "news"]);
  assert.equal(items.filter((item) => item.type === "sharp-move").length, 2, "BTC 1h move + GTC 24h mover; thin-volume mover skipped");
  assert.ok(!items.some((item) => item.id.includes("ETH")), "small moves are not flash items");
  assert.ok(!items.some((item) => item.id.startsWith("fund:BTC")), "ordinary funding is not a flash item");
  assert.equal(renderText(OKX, "en").headline, "OKX lists CT/USDT (spot)");
  assert.equal(renderText(KUCOIN, "en").headline, "KuCoin delists VENOM, NFP");
  assert.equal(renderText(BITGET, "en").headline, "Bitget campaign: 280,000 USDT prize pool");
  assert.equal(renderText(BRIEF, "zh-Hans").headline, "币安 KGST/USDT 三个月零手续费", "campaign briefs keep their localized text");
  assert.equal(renderText(LIQ, "en").headline, "Liquidations hit $10.27M in 1 hour, 100% shorts");
  assert.match(renderText(FUND, "en").body, /Binance −0\.1140%, OKX −0\.1354%\. Next settlement at \d\d:\d\d SGT\. Shorts pay longs\./);
  const path = flashItemPath(OKX);
  assert.match(path, /^\/flash\/[0-9a-z]{10}-okx-lists-ct-usdt-spot$/);
  assert.deepEqual(parseFlashPath(path), { kind: "item", key: OKX.key, segment: path.slice(7) });
  assert.equal(parseFlashPath("/flash").kind, "stream");
  assert.equal(parseFlashPath("/flash/not-a-key").kind, "missing");
  // Market items persist: the first sighting wins over a later snapshot of the same hour/window.
  const later = buildFlashItems({ market: { ...MARKET, generatedAt: ago(0), funding: { ...MARKET.funding, generatedAt: ago(0) } }, remembered: marketFlashItems(MARKET, { now: NOW }), now: NOW });
  assert.equal(later.items.find((item) => item.type === "funding-extreme").time, FUND.time);
});

test("announcement titles: assets, market kind, effective time and prize pool are parsed, never invented", () => {
  const bybit = parseAnnouncementTitle("New listing: Listing of YPFUSDT on Bybit TradFi Perpetual on Oct 12, 2026, 11:05AM UTC");
  assert.deepEqual([bybit.assets, bybit.market, bybit.when], [["YPFUSDT"], "perp", "2026-10-12 11:05 UTC"]);
  assert.deepEqual(parseAnnouncementTitle("Binance Will List Hyperliquid (HYPE) with Seed Tag Applied").assets, ["HYPE"]);
  assert.deepEqual(parseAnnouncementTitle("OKX to list Unified Tokenized Stocks xLUNR, xOSCR and more for spot trading").assets, ["xLUNR", "xOSCR"]);
  assert.deepEqual(parseAnnouncementTitle("KII Alpha Token Splash— Grab a share of the 2,000,000 KII prize pool .").prize, { amount: "2,000,000", asset: "KII" });
  assert.deepEqual(parseAnnouncementTitle("Binance Futures Will Launch Multiple TradFi USDⓈ-Margined Perpetual Contracts (2026-10-12)").assets, []);
  assert.equal(renderText({ ...OKX, assets: [], data: { ...OKX.data } }, "en").headline, "OKX posts a new listing notice", "no assets found: a generic, still true headline");
});

test("localized templates keep every number and ticker identical to English", () => {
  const templated = [OKX, KUCOIN, BITGET, LIQ, FUND, ...items.filter((item) => item.type === "sharp-move")];
  assert.deepEqual([...FLASH_TEMPLATE_LOCALES].sort(), [...FLASH_INDEX_LOCALES].sort(), "templates for every search locale");
  for (const item of templated) {
    const en = renderText(item, "en");
    assert.ok(en.facts.length > 0, item.id);
    for (const locale of FLASH_INDEX_LOCALES) {
      const text = renderText(item, locale);
      assert.equal(text.localized, true, `${item.id} ${locale}`);
      assert.notEqual(locale === "en" ? null : text.headline, en.headline, `${item.id} ${locale}: headline is localized`);
      const blob = `${text.headline} ${text.body}`;
      for (const fact of en.facts) assert.ok(blob.includes(fact), `${item.id} ${locale}: "${fact}" missing in "${blob}"`);
      for (const asset of item.assets) assert.ok(text.headline.includes(asset) || blob.includes(asset), `${item.id} ${locale}: ticker ${asset}`);
      assert.doesNotMatch(blob, /\{\w+\}|undefined|NaN/, `${item.id} ${locale}: unfilled template`);
    }
  }
  assert.equal(renderText(OKX, "ur").localized, false, "Urdu falls back to English text (served noindex)");
});

test("/flash renders at request time in en and zh-hans with canonical, hreflang and LiveBlogPosting", async () => {
  for (const [path, locale] of [["/flash", "en"], ["/zh-hans/flash", "zh-Hans"]]) {
    const response = await fetchPage(path);
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.deepEqual(h1Texts(html), [flashUiCopy(locale).h1], `${path}: one h1`);
    const main = decodeEntities(mainHtml(html));
    assert.match(main, /<main class="nxf nxf--stream"/);
    for (const item of [OKX, LIQ, FUND]) assert.ok(main.includes(renderText(item, locale).headline), `${path}: ${item.id} in SSR`);
      assert.match(html, new RegExp(`<link rel="canonical" href="https://nexualpha.com${path}"`));
    assert.equal(robots(html), "index,follow");
    assert.equal((html.match(/rel="alternate" hreflang=/g) || []).length, FLASH_INDEX_LOCALES.length + 1, `${path}: hreflang set`);
    const live = ldJson(html).find((item) => item["@type"] === "LiveBlogPosting");
    assert.ok(live && live.liveBlogUpdate.length >= 5, `${path}: LiveBlogPosting`);
    assert.match(html, /id="nexualpha-prerender-state">[^<]*"flash":\{"kind":"stream"/, "hydration payload");
  }
  assert.equal(robots(await (await fetchPage("/ur/flash")).text()), "noindex,follow", "a locale without templates is noindex");
});

test("item pages: H1, NewsArticle schema, related links, 301 for old slugs and unknown keys, 404 for junk", async () => {
  for (const [prefix, locale] of [["", "en"], ["/zh-hans", "zh-Hans"]]) {
    const path = `${prefix}${flashItemPath(OKX)}`;
    const response = await fetchPage(path);
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.deepEqual(h1Texts(html), [renderText(OKX, locale).headline]);
    assert.equal(robots(html), "index,follow");
    const article = ldJson(html).find((item) => item["@type"] === "NewsArticle");
    assert.equal(article.headline, renderText(OKX, locale).headline);
    assert.equal(article.datePublished, OKX.time);
    assert.equal(article.isBasedOn, "https://www.okx.com/help/okx-to-list-ct-usdt");
    assert.ok(ldJson(html).some((item) => item["@type"] === "BreadcrumbList"));
    const main = mainHtml(html);
    assert.match(main, new RegExp(`href="${prefix}/exchanges/okx"`), "venue profile link");
    assert.match(main, new RegExp(`href="${prefix}/activities/updates/okx/`), "announcement update page link");
    // Owner 2026-10-13: OKX help pages take no referral parameter, so the official source is a plain label + domain.
    assert.doesNotMatch(main, /href="https:\/\/www\.okx\.com/, "no uncoded OKX link");
    assert.match(main, /data-source-plain="okx\.com"/, "official source");
    assert.ok((html.match(/rel="alternate" hreflang=/g) || []).length > 2, "hreflang for indexable editions");
  }
  const liq = mainHtml(await (await fetchPage(flashItemPath(LIQ))).text());
  assert.match(liq, /href="\/liquidations"/, "liquidation items link the dashboard");
  const stale = await fetchPage(`/flash/${OKX.key}-old-slug`);
  assert.equal(stale.status, 301);
  assert.equal(stale.headers.get("location"), `https://nexualpha.com${flashItemPath(OKX)}`);
  const unknown = await fetchPage("/ja/flash/zzzzzzzzzz-gone?market=TR");
  assert.equal(unknown.status, 301);
  assert.equal(unknown.headers.get("location"), "https://nexualpha.com/ja/flash?market=TR");
  assert.equal((await fetchPage("/flash/nope")).status, 404);
});

test("item pages: Turkish Bitget campaign flash routes redirect to activities while English stays available", async () => {
  const tr = await fetchPage(`/tr${flashItemPath(BITGET)}?market=US`);
  assert.equal(tr.status, 301);
  assert.equal(tr.headers.get("location"), "https://nexualpha.com/tr/activities?market=US");
  assert.equal(await tr.text(), "");
  const stale = await fetchPage(`/tr/flash/${BITGET.key}-old-slug`);
  assert.equal(stale.status, 301);
  assert.equal(stale.headers.get("location"), "https://nexualpha.com/tr/activities");
  const en = await fetchPage(flashItemPath(BITGET));
  const html = await en.text();
  assert.equal(en.status, 200);
  assert.equal(robots(html), "index,follow");
  assert.deepEqual(h1Texts(html), [renderText(BITGET, "en").headline]);
  assert.doesNotMatch(html, /hreflang="tr"/);
});

test("noindex rule: items older than 30 days, news items and fallback-language editions stay 200 but noindex", async () => {
  const old = await fetchPage(flashItemPath(OLD));
  const oldHtml = await old.text();
  assert.equal(old.status, 200);
  assert.equal(robots(oldHtml), "noindex,follow");
  assert.equal((oldHtml.match(/rel="alternate" hreflang=/g) || []).length, 0);
  const news = await (await fetchPage(flashItemPath(NEWS_ITEM))).text();
  assert.equal(robots(news), "noindex,follow", "the article itself is the search page");
  assert.match(mainHtml(news), /href="\/news\/why-is-rsr-up-today"/);
  assert.equal(robots(await (await fetchPage(`/uk-ua${flashItemPath(OKX)}`)).text()), "noindex,follow", "Ukrainian edition falls back to English text");
});

test("sign-up block: the item's exchange via /go/<venue>?src=flash-<type>, geo-gated, none in neutral locales", async () => {
  assert.deepEqual(flashSignupVenues(BITGET, { locale: "tr" }).includes("bitget"), false, "Bitget is not promoted in Türkiye");
  assert.ok(flashSignupVenues(BITGET, { locale: "tr" }).every((slug) => ["okx", "binance", "bybit"].includes(slug)));
  for (const locale of NEUTRAL_CTA_LOCALE_LIST) assert.deepEqual(flashSignupVenues(OKX, { locale }), [], locale);

  const okx = mainHtml(await (await fetchPage(flashItemPath(OKX))).text());
  assert.match(okx, /href="\/go\/okx\?src=flash-listing"/);
  const bitgetEn = mainHtml(await (await fetchPage(flashItemPath(BITGET))).text());
  assert.match(bitgetEn, /href="\/go\/bitget\?src=flash-campaign"/);
  const funding = mainHtml(await (await fetchPage(flashItemPath(FUND))).text());
  assert.match(funding, /href="\/go\/binance\?src=flash-funding-extreme"/);
  for (const prefix of ["/ru", "/ar", "/zh-hant"]) {
    const html = mainHtml(await (await fetchPage(`${prefix}${flashItemPath(OKX)}`)).text());
    assert.doesNotMatch(html, /href="\/go\/|news-offer__go/, `${prefix}: no sign-up in a neutral locale`);
  }
});

test("sitemap-flash.xml: last 7 days, indexable editions with hreflang and Google News tags; listed in the index and robots", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/sitemap-flash.xml"), env());
  const xml = await response.text();
  assert.equal(response.status, 200);
  assert.match(xml, new RegExp(`<loc>https://nexualpha\\.com${flashItemPath(OKX)}</loc>`));
  assert.match(xml, new RegExp(`<loc>https://nexualpha\\.com/zh-hans${flashItemPath(OKX)}</loc>`));
  assert.doesNotMatch(xml, new RegExp(OLD.key), "older than 7 days");
  assert.doesNotMatch(xml, new RegExp(NEWS_ITEM.key), "news items are listed by the news sitemaps");
  assert.doesNotMatch(xml, /\/ur\/flash|\/uk-ua\/flash/);
  assert.match(xml, /<news:news>[\s\S]*?<news:language>zh-cn<\/news:language>/);
  assert.match(xml, /hreflang="x-default" href="https:\/\/nexualpha\.com\/flash\//);
  const split = buildSplitSitemaps(routeInventory([]), []);
  assert.match(split.index, /<loc>https:\/\/nexualpha\.com\/sitemap-flash\.xml<\/loc>/);
  assert.match(await readFile(new URL("../public/robots.txt", import.meta.url), "utf8"), /Sitemap: https:\/\/nexualpha\.com\/sitemap-flash\.xml/);
});

test("JSON feed: localized rows, cursor and single-item lookup; no templates needed in the browser", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/content/flash.json?locale=zh-Hans&limit=6"), env());
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.items.length, 6);
  assert.ok(data.hasMore);
  assert.ok(data.items.every((row) => row.headline && row.typeLabel && row.path.startsWith("/flash/")));
  assert.ok(data.items.some((row) => row.headline === renderText(NEWS_ITEM, "zh-Hans").headline));
  const next = await (await worker.fetch(new Request(`https://nexualpha.com/content/flash.json?locale=en&limit=50&before=${encodeURIComponent(data.items[2].time)}`), env())).json();
  assert.ok(next.items.every((row) => Date.parse(row.time) < Date.parse(data.items[2].time)));
  const one = await (await worker.fetch(new Request(`https://nexualpha.com/content/flash.json?locale=ja&key=${LIQ.key}`), env())).json();
  assert.equal(one.item.headline, renderText(LIQ, "ja").headline);
  const hidden = await worker.fetch(new Request(`https://nexualpha.com/content/flash.json?locale=tr&key=${BITGET.key}`), env());
  assert.equal(hidden.status, 404, "blocked Turkish Bitget campaign item detail is not served by the JSON API");
  assert.equal((await worker.fetch(new Request("https://nexualpha.com/content/flash.json?key=zzzzzzzzzz"), env())).status, 404);
});

test("no fine print, commission notes or 'not investment advice' on flash pages (footer excluded)", async () => {
  const paths = ["/flash", "/zh-hans/flash", ...[OKX, KUCOIN, BITGET, BRIEF, LIQ, FUND].flatMap((item) => [flashItemPath(item), `/zh-hans${flashItemPath(item)}`])];
  for (const path of paths) {
    const main = mainHtml(await (await fetchPage(path)).text());
    for (const pattern of FINE_PRINT) assert.doesNotMatch(main, pattern, `${path}: ${pattern}`);
  }
  for (const locale of FLASH_INDEX_LOCALES) {
    const blob = JSON.stringify(flashUiCopy(locale)) + [OKX, KUCOIN, BITGET, LIQ, FUND].map((item) => JSON.stringify(renderText(item, locale))).join(" ");
    for (const pattern of FINE_PRINT) assert.doesNotMatch(blob, pattern, `${locale}: ${pattern}`);
  }
});

test("hydration of the stream and an item page has no mismatch (en, zh-hans, ar)", async () => {
  for (const path of ["/flash", `/zh-hans${flashItemPath(OKX)}`, `/ar${flashItemPath(LIQ)}`]) {
    const html = await (await fetchPage(path)).text();
    const { errors } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(errors), [], `${path}: ${errors.join("\n")}`);
  }
});

test("header keeps five primary items with Flash under More; home has the live rail", async () => {
  const home = await harness.render("https://nexualpha.com/?locale=zh-Hans", {});
  assert.match(home, /class="h7-in h7-flash"[\s\S]*href="\/zh-hans\/flash"/, "home rail");
  assert.equal((home.match(/class="h7-flash-skel"/g) || []).length, 5, "five fixed placeholder rows in the prerender");
  const header = home.match(/<header[\s\S]*?<\/header>/)?.[0] || "";
  const primary = header.match(/<nav class="nx-nav"[\s\S]*?<\/nav>/)?.[0] || "";
  assert.doesNotMatch(primary.split(/nx-more|data-more/)[0], /href="\/zh-hans\/flash"/, "not a primary item");
  assert.match(header, /href="\/zh-hans\/flash"[^>]*>快讯</, "listed under More");
  const source = await readFile(new URL("../src/components/shell/SiteHeader.jsx", import.meta.url), "utf8");
  assert.match(source, /const PRIMARY_COUNT = 5;/);
});

// ------------------------------------------------------------------------------------- Important level (2026-10-13)
import { FLASH_IMPORTANT_RULES, FLASH_TOP_COINS, flashImportance, flashStreamPayload, flashView } from "../src/data/flash-feed.js";
// Shared neutral list (ru, ar, zh-Hant, ur, uk and, since 2026-10-13, vi): src/data/locale-policy.js.
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";

const IMPORTANT_SOURCES = {
  announcements: { items: [
    { id: "kucoin:xmr-halt", venue: "kucoin", category: "news", title: "KuCoin Has Temporarily Closed the Deposit and Withdrawal Services of Monero (XMR)", url: "https://www.kucoin.com/announcement/xmr", publishedAt: ago(20 * 60 * 1000) },
    { id: "okx:outage", venue: "okx", category: "news", title: "OKX trading services degraded: investigating an outage", url: "https://www.okx.com/help/outage", publishedAt: ago(25 * 60 * 1000) },
    { id: "okx:gravity", venue: "okx", category: "product", title: "OKX to cease deposits and withdrawals on the Gravity Alpha Mainnet network", url: "https://www.okx.com/help/gravity", publishedAt: ago(30 * 60 * 1000) },
    { id: "kucoin:pix", venue: "kucoin", category: "news", title: "Notice on Temporary Suspension of Pix Services", url: "https://www.kucoin.com/announcement/pix", publishedAt: ago(35 * 60 * 1000) },
    { id: "kraken:promo", venue: "kraken", category: "news", title: "The $5,000,000 USDG Kraken Futures Challenge", url: "https://blog.kraken.com/x", publishedAt: ago(40 * 60 * 1000) },
    { id: "binance:sol", venue: "binance", category: "listing", title: "Binance Will List Solana (SOL) on Binance Alpha", url: "https://www.binance.com/sol", publishedAt: ago(45 * 60 * 1000) },
    { id: "binance:tiny", venue: "binance", category: "listing", title: "Binance Will List Tinycoin (TINY)", url: "https://www.binance.com/tiny", publishedAt: ago(50 * 60 * 1000) },
  ] },
  market: {
    generatedAt: ago(60 * 1000),
    history: { hourly: [{ t: ago(H), totalUsd: 64e6, longUsd: 50e6, shortUsd: 14e6 }, { t: ago(2 * H), totalUsd: 9e6, longUsd: 5e6, shortUsd: 4e6 }] },
    market: { majors: [{ symbol: "BTCUSDT", price: 80000, change1hPct: -3.4, change24hPct: -5 }, { symbol: "SOLUSDT", price: 150, change1hPct: 4.2, change24hPct: 6 }], movers: [] },
  },
};
const IMP = buildFlashItems({ ...IMPORTANT_SOURCES, now: NOW }).items;
const impBy = (id) => IMP.find((item) => item.id === id);

test("important level: rule-based marker for liquidations, BTC/ETH hours, top-20 listings and outages / withdrawal halts", () => {
  assert.ok(FLASH_TOP_COINS.length === 20 && FLASH_TOP_COINS.includes("BTC") && FLASH_TOP_COINS.includes("SOL"), FLASH_TOP_COINS.join(" "));
  assert.ok(!FLASH_TOP_COINS.includes("USDT") && !FLASH_TOP_COINS.includes("USDC"), "stablecoins excluded");
  assert.equal(FLASH_IMPORTANT_RULES.liquidationHourUsd, 50e6);
  const liq = IMP.filter((item) => item.type === "liquidation-spike");
  assert.deepEqual(liq.map(flashImportance).sort(), [null, "liquidations"].sort(), "only the $64M hour");
  const moves = IMP.filter((item) => item.type === "sharp-move");
  assert.equal(flashImportance(moves.find((item) => item.assets[0] === "BTC")), "major-move");
  assert.equal(flashImportance(moves.find((item) => item.assets[0] === "SOL")), null, "big hours count for BTC/ETH only");
  assert.equal(impBy("a:binance:sol").type, "listing");
  assert.equal(flashImportance(impBy("a:binance:sol")), "top-coin");
  assert.equal(flashImportance(impBy("a:binance:tiny")), null);
  // Official service notices become "incident" items; only outages and halts that matter are important.
  assert.equal(impBy("a:kucoin:xmr-halt").type, "incident");
  assert.equal(flashImportance(impBy("a:kucoin:xmr-halt")), "withdrawals");
  assert.equal(flashImportance(impBy("a:okx:outage")), "outage");
  assert.equal(impBy("a:okx:gravity").type, "incident");
  assert.equal(flashImportance(impBy("a:okx:gravity")), null, "one small network is not important");
  assert.equal(impBy("a:kucoin:pix").type, "incident");
  assert.equal(flashImportance(impBy("a:kucoin:pix")), null);
  assert.equal(impBy("a:kraken:promo"), undefined, "ordinary news posts are not flash items");
  const view = flashView(impBy("a:kucoin:xmr-halt"), "en");
  assert.equal(view.important, true);
  assert.equal(view.importance, "withdrawals");
  assert.equal(flashView(impBy("a:binance:tiny"), "en").important, undefined);
});

test("incident items: localized headline and body in every template locale, tickers kept, CJK sentences joined cleanly", () => {
  const item = impBy("a:kucoin:xmr-halt");
  for (const locale of FLASH_TEMPLATE_LOCALES) {
    const text = renderText(item, locale);
    assert.ok(text.headline && text.body, locale);
    assert.ok(text.headline.includes("XMR"), `${locale}: ${text.headline}`);
    assert.doesNotMatch(text.headline + text.body, /\{\w+\}|undefined/, locale);
    assert.equal(flashUiCopy(locale).types.incident.length > 0, true, locale);
  }
  assert.match(renderText(item, "zh-Hans").body, /公告。充值/);
  assert.match(renderText(impBy("a:kucoin:pix"), "en").headline, /^KuCoin posts a service notice$/);
});

test("stream payload and JSON feed: important=1 keeps only important items", async () => {
  const payload = flashStreamPayload(IMP, "en", { important: true, now: NOW });
  assert.ok(payload.items.length >= 4);
  assert.ok(payload.items.every((row) => row.important === true));
  const response = await worker.fetch(new Request("https://nexualpha.com/api/flash.json?locale=en&important=1"), env());
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.ok(data.items.every((row) => row.important === true), "worker honours important=1");
});

test("stream payload: Turkish Bitget campaigns are excluded, but Bitget listings remain", () => {
  const tr = flashStreamPayload(items, "tr", { now: NOW, limit: 100 });
  assert.ok(tr.items.some((row) => row.id === OKX.id), "other venue campaign/listing rows remain");
  assert.ok(!tr.items.some((row) => row.id === BITGET.id), "Bitget event campaign hidden in /tr flash");
  const listing = {
    ...BITGET,
    id: "a:bitget:listing",
    type: "listing",
    assets: ["TEST"],
    data: { market: "spot" },
    key: "btglisting",
    slug: "bitget-lists-test",
  };
  const withListing = flashStreamPayload([BITGET, listing], "tr", { now: NOW, limit: 100 });
  assert.deepEqual(withListing.items.map((row) => row.id), ["a:bitget:listing"]);
  assert.equal(withListing.venues.some((row) => row.slug === "bitget"), true);
  assert.equal(flashItemIndexLocales(BITGET, { now: NOW }).includes("tr"), false, "no Turkish hreflang/sitemap for Bitget campaign flash item");
  assert.equal(flashItemIndexLocales(listing, { now: NOW }).includes("tr"), true, "Turkish Bitget listing flash item remains indexable");
});

const TICKER = { generatedAt: ago(10 * 1000), source: "binance-usdm", items: [
  { sym: "BTC", price: "$82,576", change: "−1.26%", dir: "down" }, { sym: "ETH", price: "$2,484.45", change: "+0.52%", dir: "up" },
  { sym: "SOL", price: "$151.20", change: "+3.10%", dir: "up" }, { sym: "BNB", price: "$612.30", change: "0.00%", dir: "flat" }, { sym: "XRP", price: "$2.41", change: "−0.80%", dir: "down" },
], mover: { sym: "GTC", change: "+53.12%", dir: "up" } };
const impAssets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/intel/official-announcements.json") return Response.json(IMPORTANT_SOURCES.announcements);
  if (pathname === "/intel/market-events.json") return Response.json(IMPORTANT_SOURCES.market);
  return sharedAssets.fetch(request);
} };
const impEnv = () => ({ ASSETS: impAssets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options), TICKER_READ: async () => TICKER });

test("/flash: red Important marker, 'Important only' chip, opt-in notification and sound toggles, Telegram CTA, ticker frame", async () => {
  const html = await (await fetchPage("/flash", impEnv())).text();
  const main = mainHtml(html);
  assert.match(main, /data-important="true"/);
  assert.match(main, /class="nxf-imp"[^>]*data-importance="(?:withdrawals|outage|liquidations|major-move|top-coin)"/);
  assert.match(main, /class="nxf-chip-imp" aria-pressed="false"[^>]*>[\s\S]*?Important only</);
  assert.match(main, /class="nxf-toggle" aria-pressed="false"[^>]*>[\s\S]*?Notify me</, "notifications off until the reader opts in");
  assert.match(main, /class="nxf-toggle" role="switch" aria-checked="false"[^>]*>[\s\S]*?Sound</, "sound off by default");
  assert.match(main, /href="https:\/\/t\.me\/NexuAlphaAssistantBot\?start=alerts-en"[^>]*data-cta-placement="flash-telegram-alerts"[^>]*>Get alerts on Telegram/);
  const bar = html.match(/<div class="nx-ticker"[\s\S]*?<\/ul><\/div><\/div><\/div>/)?.[0] || "";
  assert.match(bar, /data-tk="BTC-p">\$82,576</, "ticker first frame rendered on the server");
  assert.match(bar, /data-sym="BTC" data-dir="down"/);
  assert.match(bar, /data-tk="mover-sym">GTC</);
  assert.ok(html.indexOf("nx-ticker") < html.indexOf("<main"), "the bar sits under the header, above the page");
  const zh = mainHtml(await (await fetchPage("/zh-hans/flash", impEnv())).text());
  assert.match(zh, /只看重要/);
  assert.match(zh, /start=alerts-zh"[^>]*>订阅 Telegram 实时提醒/);
  for (const pattern of FINE_PRINT) assert.doesNotMatch(main, pattern);
});

test("/flash with the ticker and important items hydrates without mismatch (en, zh-hans, ar)", async () => {
  for (const path of ["/flash", "/zh-hans/flash", `/ar${flashItemPath(impBy("a:kucoin:xmr-halt"))}`]) {
    const html = await (await fetchPage(path, impEnv())).text();
    assert.ok(html.includes("\"ticker\":"), `${path}: ticker state shipped`);
    const { errors } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(errors), [], `${path}: ${errors.join("\n")}`);
  }
});

test("flash alerts module: preferences survive blocked storage, notifications need permission, chime fails soft", async () => {
  const mod = await import("../src/components/flash/flash-alerts.js");
  assert.equal(mod.notificationPermission(), "unsupported");
  assert.equal(mod.readFlashPref("sound"), false);
  assert.doesNotThrow(() => mod.writeFlashPref("sound", true));
  assert.equal(mod.notifyImportant([{ id: "x", headline: "h" }]), 0);
  assert.equal(mod.chime(), false);
  let last = null;
  globalThis.Notification = class { static permission = "granted"; constructor(title, options) { this.title = title; this.options = options; last = this; } close() {} };
  try {
    assert.equal(mod.notifyImportant([{ id: "a", headline: "BTC −3.4% in 1 hour", body: "b" }, { id: "b", headline: "x" }, { id: "c", headline: "y" }, { id: "d", headline: "z" }], { label: "Important" }), 3, "at most three per refresh");
    assert.equal(last.options.tag, "nexualpha-flash-c");
    assert.equal(last.title, "Important: y");
  } finally { delete globalThis.Notification; }
});

test("the browser reads the flash JSON from /api/ (nginx serves /content/ statically); the old path still answers", async () => {
  const { FLASH_FEED_URL } = await import("../src/data/flash.js");
  assert.equal(FLASH_FEED_URL, "/api/flash.json");
  const rail = await readFile(new URL("../src/components/flash/FlashRail.jsx", import.meta.url), "utf8");
  assert.match(rail, /const FLASH_FEED_URL = "\/api\/flash\.json";/);
  for (const path of ["/api/flash.json?locale=en&limit=3", "/content/flash.json?locale=en&limit=3"]) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${path}`), env());
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("cache-control"), "public, max-age=10, stale-while-revalidate=60", path);
    assert.equal((await response.json()).items.length, 3, path);
  }
});

test("flash JSON serves the last good payload stale when all runtime sources fail", async () => {
  const assets = makeAssets();
  const e = { ASSETS: assets, WORKER_POLLED_JSON_TTL_MS: 0 };
  const request = new Request("https://nexualpha.com/api/flash.json?limit=3&locale=en&ignored=1");
  const first = await worker.fetch(request, e);
  const good = await first.json();
  assert.equal(first.status, 200);
  assert.equal(good.items.length, 3);
  assets.fetch = async () => new Response("missing", { status: 404 });
  const staleResponse = await worker.fetch(new Request("https://nexualpha.com/api/flash.json?ignored=2&locale=en&limit=3"), e);
  const stale = await staleResponse.json();
  assert.equal(staleResponse.status, 200);
  assert.equal(stale.stale, true);
  assert.equal(stale.generatedAt, good.generatedAt, "stale response keeps the original generatedAt");
  assert.deepEqual(stale.items.map((item) => item.id), good.items.map((item) => item.id));
});


test("SGT formatter rolls dates over and keeps the clock when adding relative labels", async () => {
  const { formatSgt, formatReaderTime, readerDayKey } = await import("../src/data/local-time.js");
  const iso = "2026-10-12T23:42:00Z";
  assert.equal(formatSgt(iso, "en", "clock"), "07:42 SGT");
  assert.equal(formatSgt(iso, "en"), "2026-10-13 · 07:42 SGT");
  assert.equal(readerDayKey(iso), "2026-10-13");
  assert.equal(formatSgt("2026-10-31T15:59:00Z", "en-GB", "end"), "31 Oct 23:59 SGT");
  assert.equal(formatSgt("2026-12-31T16:00:00Z"), "2027-01-01 · 00:00 SGT");
  assert.equal(formatSgt("2026-10-12T23:42:00+02:00", "en", "clock"), "05:42 SGT");
  assert.equal(formatSgt("invalid"), "");
  assert.equal(formatSgt(null), "");
  const fresh = formatReaderTime(iso, "en", Date.parse(iso) + 180000);
  assert.equal(fresh.label, "07:42 SGT");
  assert.equal(fresh.relative, "3 min. ago");
  assert.equal(formatReaderTime(iso, "zh-Hans", Date.parse(iso) + 180000).relative, "3分钟前");
  assert.equal(formatReaderTime(iso).relative, "");
  assert.equal(formatReaderTime(iso, "en", Date.parse(iso) + 3600000).relative, "");
  assert.equal(formatReaderTime(iso, "en", Date.parse(iso) - 60000).relative, "");
});

test("flash SSR and hydration retain SGT clocks in different host timezones", async () => {
  const previous = process.env.TZ;
  try {
    for (const tz of ["Asia/Shanghai", "America/New_York"]) {
      process.env.TZ = tz;
      for (const path of ["/flash", `/zh-hans${flashItemPath(OKX)}`]) {
        const html = await (await fetchPage(path)).text();
        assert.match(html, /<time[^>]+title="[^"]*SGT"/);
        const result = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`, {
          fixedNow: NOW, timeoutMs: 2000,
          inspect: (window) => [...window.document.querySelectorAll(".nxf-row__time time, .nxf-article__meta time")].map((el) => ({ iso: el.dateTime, clock: el.querySelector("bdi").textContent, title: el.title })),
        });
        assert.deepEqual(hydrationErrors(result.errors), []);
        assert.ok(result.inspected.length);
        const { formatSgt } = await import("../src/data/local-time.js");
        for (const time of result.inspected) {
          const locale = path.startsWith("/zh-hans") ? "zh-Hans" : "en";
          assert.equal(time.clock, formatSgt(time.iso, locale, path === "/flash" ? "clock" : "stamp"));
          assert.equal(time.title, formatSgt(time.iso, locale));
          assert.ok(html.includes(time.iso), "machine timestamp stays ISO");
        }
      }
    }
  } finally {
    if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
  }
});
