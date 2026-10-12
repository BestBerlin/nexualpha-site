// NexuAlpha Flash (2026-10-12): /flash stream and /flash/<key>-<slug> item pages. Request-time SSR through the Worker
// with the component the browser hydrates, LiveBlogPosting / NewsArticle JSON-LD, the 30-day noindex rule, the 7-day
// flash sitemap, geo-gated sign-up (neutral locales and Türkiye), the owner's no-fine-print rule, and localized
// templates that keep every number and ticker identical to English.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";
import { FLASH_INDEX_LOCALES, FLASH_TEMPLATE_LOCALES, buildFlashItems, marketFlashItems, parseAnnouncementTitle, renderText } from "../src/data/flash-feed.js";
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
  assert.match(renderText(FUND, "en").body, /Binance −0\.1140%, OKX −0\.1354%\. Next settlement at \d\d:\d\d UTC\. Shorts pay longs\./);
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
    assert.match(main, /href="https:\/\/www\.okx\.com\/help\/okx-to-list-ct-usdt"[^>]*rel="nofollow noopener noreferrer"|rel="nofollow noopener noreferrer"[^>]*href="https:\/\/www\.okx\.com/, "official source");
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
  for (const locale of ["ru", "ar", "zh-Hant", "ur", "uk"]) assert.deepEqual(flashSignupVenues(OKX, { locale }), [], locale);

  const okx = mainHtml(await (await fetchPage(flashItemPath(OKX))).text());
  assert.match(okx, /href="\/go\/okx\?src=flash-listing"/);
  const bitgetEn = mainHtml(await (await fetchPage(flashItemPath(BITGET))).text());
  assert.match(bitgetEn, /href="\/go\/bitget\?src=flash-campaign"/);
  const bitgetTr = mainHtml(await (await fetchPage(`/tr${flashItemPath(BITGET)}`)).text());
  assert.doesNotMatch(bitgetTr, /href="\/go\/bitget/, "no Bitget sign-up in Türkiye");
  assert.match(bitgetTr, /href="\/go\/(?:okx|binance|bybit)\?src=flash-campaign"/, "a Türkiye-promotable partner instead");
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

test("header keeps five primary items with Flash under More; home has the live rail; footer links the stream", async () => {
  const home = await harness.render("https://nexualpha.com/?locale=zh-Hans", {});
  assert.match(home, /class="h7-in h7-flash"[\s\S]*href="\/zh-hans\/flash"/, "home rail");
  assert.equal((home.match(/class="h7-flash-skel"/g) || []).length, 5, "five fixed placeholder rows in the prerender");
  const header = home.match(/<header[\s\S]*?<\/header>/)?.[0] || "";
  const primary = header.match(/<nav class="nx-nav"[\s\S]*?<\/nav>/)?.[0] || "";
  assert.doesNotMatch(primary.split(/nx-more|data-more/)[0], /href="\/zh-hans\/flash"/, "not a primary item");
  assert.match(header, /href="\/zh-hans\/flash"[^>]*>快讯</, "listed under More");
  assert.match(home, /<footer[\s\S]*href="\/zh-hans\/flash"/, "footer link");
  const source = await readFile(new URL("../src/components/shell/SiteHeader.jsx", import.meta.url), "utf8");
  assert.match(source, /const PRIMARY_COUNT = 5;/);
});
