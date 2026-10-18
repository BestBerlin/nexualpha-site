// Tokenized US stocks (/tokenized-stocks hub + 30 ticker pages + 7 exchange-product pages, home strip, exchange-profile
// block; owner 2026-10-15 / 2026-10-18).
// Checks: every displayed fact has an official source with a date (and matches the research packet when it is mounted),
// sign-ups use the registry code through /go/<venue>?src=tokenized-stocks-*, owner order Bitget > OKX > Binance,
// Türkiye never names Bitget, neutral locales show no code / CTA / campaign, expired promotions disappear, JSON-LD
// (ItemList + FAQPage + BreadcrumbList), hreflang, sitemap, header/footer links, home placement before the whale board,
// and no fine print.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import worker from "../worker/index.js";
import { TS_EXCHANGES, TS_LATER_SOURCE_IDS, TS_SOURCES, TS_TICKERS, tsAllSourceIds, tsListings, tsPromo } from "../src/data/tokenized-stocks-facts.js";
import { TS_INDEX_LOCALES, tsSignup, tsVenues } from "../src/data/tokenized-stocks.js";
import { TS_EXCHANGE_SLUGS, TS_PATH, TS_TICKER_SLUGS, parseTokenizedStocksPath } from "../src/data/tokenized-stocks-routes.js";
import { tsTickerRows } from "../src/data/tokenized-stocks-rows.js";
import { TS_COPY } from "../src/data/tokenized-stocks-copy.js";
import { publicCtaForVenue } from "../src/data/source-bound-cta.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";
import { buildSplitSitemaps, buildTokenizedStocksSitemap, routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import { createSsrHarness, SHELL_HTML, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

// Research packet vendored into the repo (copied from /Volumes/致态2TB/nx-agents/research/tokenized-stocks, as of 2026-10-15).
const RESEARCH = new URL("../research/tokenized-stocks/exchanges.json", import.meta.url);
const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const env = () => ({ ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) });
const fetchPage = (path) => worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), env());
const ldJson = (html) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => { const v = JSON.parse(m[1]); return Array.isArray(v) ? v : (v["@graph"] || [v]); });
const mainHtml = (html) => (html.match(/<main\b[^>]*class="nxts[\s\S]*<\/main>/) || [""])[0];
const anchors = (html) => [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>/g)].map((m) => ({ tag: m[0], href: m[1].replaceAll("&amp;", "&") }));
const FINE_PRINT = [/not (?:investment|financial) advice/i, /capital (?:is )?at risk/i, /affiliate commission/i, /commission disclosure/i, /terms (?:and conditions )?apply/i, /非投资建议|不构成投资建议|资本有风险|佣金/, /we earn|our commission|我们赚|我们获得佣金/i];
const NEUTRAL = NEUTRAL_CTA_LOCALE_LIST;

test("facts: every value cites known official sources with a date", () => {
  const ids = tsAllSourceIds();
  assert.ok(ids.length > 40);
  for (const id of ids) assert.ok(TS_SOURCES[id], `unknown source ${id}`);
  for (const src of Object.values(TS_SOURCES)) {
    assert.match(src.url, /^https:\/\//, src.id);
    assert.match(src.date, /^\d{4}-\d{2}-\d{2}$/, src.id);
    assert.ok(["published", "checked"].includes(src.dateKind), src.id);
  }
  // Every fact object is { v, s:[…] } with at least one source.
  const walk = (value, where) => {
    if (!value || typeof value !== "object") return;
    if ("v" in value) assert.ok(Array.isArray(value.s) && value.s.length > 0 && value.v != null, `fact without source or value: ${where}`);
    for (const [key, child] of Object.entries(value)) walk(child, `${where}.${key}`);
  };
  for (const ex of TS_EXCHANGES) walk(ex, ex.slug);
  for (const ex of TS_EXCHANGES) if (ex.promo) assert.ok(ex.promo.s.length && ex.promo.s.every((id) => TS_SOURCES[id]) && Date.parse(ex.promo.endAt), ex.slug);
});

test("facts: sources, dates and ticker lists match the research packet", () => {
  const packet = JSON.parse(readFileSync(RESEARCH, "utf8"));
  const sources = new Map(packet.exchanges.flatMap((ex) => ex.sources.map((src) => [src.url, src])));
  for (const src of Object.values(TS_SOURCES)) {
    // Campaign sources read after the packet: official exchange hosts only.
    if (TS_LATER_SOURCE_IDS.has(src.id)) { assert.match(new URL(src.url).hostname, /(^|\.)bybit\.com$/, src.id); continue; }
    const found = sources.get(src.url);
    assert.ok(found, `source not in research packet: ${src.url}`);
    assert.equal(src.date, found.published_date || found.retrieved_at.slice(0, 10), `date of ${src.url}`);
  }
  const text = JSON.stringify(packet);
  for (const ex of TS_EXCHANGES) for (const lane of ["spot", "perp", "preipo"]) {
    for (const ticker of ex[lane]?.tickers?.v || []) assert.ok(text.toUpperCase().includes(ticker.toUpperCase()), `${ex.slug} ${lane} ${ticker} not in packet`);
  }
});

test("routes: ticker slugs mirror the ticker list; unknown tickers are missing", () => {
  assert.deepEqual(TS_TICKER_SLUGS, TS_TICKERS.map((t) => t.toLowerCase()));
  assert.deepEqual(parseTokenizedStocksPath("/tokenized-stocks"), { kind: "hub" });
  assert.deepEqual(parseTokenizedStocksPath("/tokenized-stocks/nvda"), { kind: "ticker", ticker: "NVDA" });
  assert.deepEqual(parseTokenizedStocksPath("/tokenized-stocks/xyz"), { kind: "missing" });
  for (const ticker of TS_TICKERS) assert.ok(tsTickerRows(ticker).length >= 3, `${ticker}: at least three sourced listings`);
  assert.deepEqual(parseTokenizedStocksPath("/tokenized-stocks/exchange/okx"), { kind: "exchange", slug: "okx" });
  assert.deepEqual(parseTokenizedStocksPath("/tokenized-stocks/exchange/ftx"), { kind: "missing" });
});

test("copy: every written edition exists; Türkiye never names Bitget; FAQ sources resolve", () => {
  assert.deepEqual(Object.keys(TS_COPY).sort(), [...TS_INDEX_LOCALES].sort());
  for (const [locale, t] of Object.entries(TS_COPY)) {
    for (const [, , ids] of t.faq) for (const id of ids) assert.ok(TS_SOURCES[id], `${locale} FAQ source ${id}`);
    for (const re of FINE_PRINT) assert.doesNotMatch(JSON.stringify({ ...t, promos: undefined }), re, `${locale}: ${re}`);
  }
  const values = (v) => (v && typeof v === "object" ? Object.values(v).flatMap(values) : [String(v)]);
  assert.ok(!values(TS_COPY.tr).some((text) => /bitget/i.test(text)));
});

test("sign-up gating: registry code via /go, owner order, Türkiye without Bitget, neutral locales without CTA", () => {
  assert.deepEqual(tsVenues("zh-Hans").slice(0, 3).map((ex) => ex.slug), ["bitget", "okx", "binance"]);
  assert.deepEqual(tsVenues("en").slice(0, 3).map((ex) => ex.slug), ["bitget", "okx", "binance"]);
  assert.ok(!tsVenues("tr").some((ex) => ex.slug === "bitget"));
  assert.equal(tsVenues("tr")[0].slug, "okx");
  assert.ok(!tsVenues("en", "TR").some((ex) => ex.slug === "bitget"));
  for (const ex of TS_EXCHANGES) {
    const signup = tsSignup(ex.slug, { locale: "zh-Hans", placement: "hub-row" });
    const cta = publicCtaForVenue(ex.slug, "zh-Hans");
    if (!signup) continue;
    assert.equal(signup.code, cta.inviteCode, ex.slug);
    assert.match(signup.href, new RegExp(`^/go/${ex.slug}\\?src=tokenized-stocks-hub-row`), ex.slug);
  }
  assert.ok(tsSignup("bitget", { locale: "zh-Hans" }));
  for (const locale of NEUTRAL) for (const ex of TS_EXCHANGES) assert.equal(tsSignup(ex.slug, { locale }), null, `${locale} ${ex.slug}`);
  assert.equal(tsSignup("bitget", { locale: "tr" }), null);
});

test("promotions disappear after their deadline", () => {
  const bitget = TS_EXCHANGES.find((ex) => ex.slug === "bitget");
  assert.ok(tsPromo(bitget, Date.parse("2026-10-15T00:00:00Z")));
  assert.equal(tsPromo(bitget, Date.parse(bitget.promo.endAt) + 1), null);
});

test("hub SSR (zh-Hans, en): answer first, codes via /go, every fact sourced, schema, hreflang, no fine print", async () => {
  for (const locale of ["zh-Hans", "en"]) {
    const response = await fetchPage(localizedPath(TS_PATH, locale));
    assert.equal(response.status, 200, locale);
    const html = await response.text();
    const main = mainHtml(html);
    assert.ok(main, `${locale}: server-rendered hub`);
    const t = TS_COPY[locale];
    assert.ok(main.indexOf(t.answerLabel) < main.indexOf(t.tableH), `${locale}: short answer before the table`);
    assert.match(main, /<h1[^>]*>/);
    const rows = [...main.matchAll(/<article class="nxts-row" id="ts-([a-z-]+)"/g)].map((m) => m[1]);
    assert.deepEqual(rows.slice(0, 3), ["bitget", "okx", "binance"], locale);
    // Every exchange row carries its code and a /go CTA with our src.
    for (const slug of rows) {
      const code = publicCtaForVenue(slug, locale).inviteCode;
      const row = main.split(`id="ts-${slug}"`)[1].split("<article")[0];
      assert.ok(row.includes(`>${code}</code>`), `${locale} ${slug}: code`);
      assert.ok(anchors(row).some((a) => a.href.startsWith(`/go/${slug}?src=tokenized-stocks-hub-row`)), `${locale} ${slug}: /go CTA`);
    }
    // No exchange sign-up link that bypasses /go.
    for (const a of anchors(main)) if (/data-cta-kind="signup"/.test(a.tag)) assert.match(a.href, /^\/go\//);
    // Every exchange row keeps all its sources in the DOM (one collapsed disclosure per row, de-AI pass 2026-10-18),
    // and every FAQ answer prints its source.
    const cells = main.split('<div class="nxts-cell" data-lane=').slice(1);
    assert.ok(cells.length > 15);
    for (const slug of rows) {
      const row = main.split(`id="ts-${slug}"`)[1].split("<article")[0];
      const ex = tsVenues(locale).find((venue) => venue.slug === slug);
      const ids = ["spot", "perp", "preipo"].filter((lane) => ex[lane]).flatMap((lane) => ["form", "tickers", "count", "hours", "lev", "fee", "settle"].map((key) => ex[lane][key]).filter(Boolean).flatMap((fact) => fact.s));
      assert.ok(row.includes('<details class="nxts-row__src">') && row.includes('class="nxts-src'), `${locale} ${slug}: row without sources`);
      for (const id of new Set(ids)) assert.ok(row.includes(TS_SOURCES[id].date), `${locale} ${slug}: source ${id} missing`);
    }
    const faqs = main.split("<details>").slice(1);
    assert.equal(faqs.length, t.faq.length);
    for (const faq of faqs) assert.ok(faq.includes('class="nxts-src'), `${locale}: FAQ without source`);
    for (const re of FINE_PRINT) assert.doesNotMatch(main.replace(/<[^>]+>/g, " "), re, `${locale}: ${re}`);
    const types = ldJson(html).map((item) => item["@type"]);
    for (const type of ["ItemList", "FAQPage", "BreadcrumbList"]) assert.ok(types.includes(type), `${locale}: ${type}`);
    assert.match(html, /hreflang="zh-Hans"/);
    assert.match(html, /hreflang="x-default"/);
    assert.match(html, /<meta name="robots" content="index,follow"/);
  }
});

test("hub SSR: Türkiye never names Bitget; neutral locales show no code, CTA or campaign", async () => {
  const tr = await (await fetchPage("/tr/tokenized-stocks")).text();
  assert.ok(mainHtml(tr));
  assert.doesNotMatch(tr, /bitget/i, "no Bitget anywhere in the tr page (head, JSON-LD, body, state)");
  const trTicker = await (await fetchPage("/tr/tokenized-stocks/nvda")).text();
  assert.doesNotMatch(trTicker, /bitget/i);
  for (const locale of NEUTRAL) {
    const html = await (await fetchPage(localizedPath(TS_PATH, locale))).text();
    const main = mainHtml(html);
    assert.ok(main, `${locale}: page renders`);
    assert.ok(!anchors(main).some((a) => a.href.startsWith("/go/")), `${locale}: no /go link`);
    assert.doesNotMatch(main, /class="nxts-code"|class="nxts-promo"/, `${locale}: no code or campaign`);
  }
});

test("ticker pages: every ticker renders live rows with a source each, CTAs via /go, FAQ + Dataset schema; unknown ticker 404", async () => {
  for (const ticker of TS_TICKERS) {
    const response = await fetchPage(`/zh-hans/tokenized-stocks/${ticker.toLowerCase()}`);
    assert.equal(response.status, 200, ticker);
    const html = await response.text();
    const main = mainHtml(html);
    const rows = main.split('<div class="nxts-tk2__row" role="row">').slice(1);
    assert.equal(rows.length, tsTickerRows(ticker, { locale: "zh-Hans" }).length, ticker);
    assert.ok(rows.length >= 3, `${ticker}: rows`);
    for (const row of rows) assert.ok(row.includes('class="nxts-src'), `${ticker}: row without source`);
    assert.ok(main.includes("数据更新于"), `${ticker}: SGT stamp`);
    assert.ok(anchors(main).some((a) => /^\/go\/[a-z-]+\?src=tokenized-stocks-ticker-/.test(a.href)), `${ticker}: CTA`);
    for (const a of anchors(main)) if (/data-cta-kind="signup"/.test(a.tag)) assert.match(a.href, /^\/go\//);
    // Bitget first wherever it lists the ticker (owner order).
    if (rows.some((row) => row.includes(">Bitget<"))) assert.ok(rows[0].includes(">Bitget<"), `${ticker}: Bitget first`);
    const types = ldJson(html).map((item) => item["@type"]);
    for (const type of ["ItemList", "FAQPage", "BreadcrumbList", "Dataset"]) assert.ok(types.includes(type), `${ticker}: ${type}`);
    for (const re of FINE_PRINT) assert.doesNotMatch(main, re, `${ticker}: ${re}`);
  }
  assert.equal((await fetchPage("/tokenized-stocks/zzzz")).status, 404);
});

test("ticker pages: index policy (launch twelve everywhere, the rest in the main markets), Türkiye and neutral editions", async () => {
  const launch = await (await fetchPage("/de/tokenized-stocks/nvda")).text();
  assert.match(launch, /<meta name="robots" content="index,follow"/);
  const added = await (await fetchPage("/de/tokenized-stocks/arm")).text();
  assert.match(added, /<meta name="robots" content="noindex,follow"/);
  const addedMain = await (await fetchPage("/es/tokenized-stocks/arm")).text();
  assert.match(addedMain, /<meta name="robots" content="index,follow"/);
  const tr = mainHtml(await (await fetchPage("/tr/tokenized-stocks/tsla")).text());
  assert.doesNotMatch(tr, /bitget/i);
  for (const locale of NEUTRAL) {
    const main = mainHtml(await (await fetchPage(`${localizedPath("/tokenized-stocks/nvda", locale)}`)).text());
    assert.doesNotMatch(main, /class="nxts-code"|data-cta-kind="signup"/, `${locale}: no code or CTA`);
  }
  const pre = await (await fetchPage("/tokenized-stocks/openai")).text();
  assert.match(mainHtml(pre), /pre-IPO/i);
  assert.doesNotMatch(mainHtml(pre), /dividends are reinvested/);
});

test("exchange pages: answer from live counts, CTA via /go (none in neutral locales), Bitget 404 in Türkiye", async () => {
  for (const slug of TS_EXCHANGE_SLUGS) {
    const response = await fetchPage(`/zh-hans/tokenized-stocks/exchange/${slug}`);
    assert.equal(response.status, 200, slug);
    const html = await response.text();
    const main = mainHtml(html);
    assert.ok(main.includes('class="nxts-ext__row" role="row"'), `${slug}: stocks table`);
    assert.ok(anchors(main).some((a) => new RegExp(`^/go/${slug}\\?src=tokenized-stocks-exchange-page`).test(a.href)), `${slug}: CTA`);
    const types = ldJson(html).map((item) => item["@type"]);
    for (const type of ["WebPage", "ItemList", "BreadcrumbList"]) assert.ok(types.includes(type), `${slug}: ${type}`);
  }
  assert.equal((await fetchPage("/tr/tokenized-stocks/exchange/bitget")).status, 404);
  assert.equal((await fetchPage("/tokenized-stocks/exchange/bitget?market=TR")).status, 404);
  const ru = mainHtml(await (await fetchPage("/ru/tokenized-stocks/exchange/okx")).text());
  assert.doesNotMatch(ru, /class="nxts-code"|data-cta-kind="signup"/);
});

test("home: the strip sits right after the hero, before the whale board; header and footer link the hub", async () => {
  for (const locale of ["zh-Hans", "en", "tr"]) {
    const html = harness.render(`https://nexualpha.com${localizedPath("/", locale)}`);
    const strip = html.indexOf('class="h7-in h7-ts"');
    assert.ok(strip > 0, `${locale}: strip rendered`);
    assert.ok(strip > html.indexOf('class="h7-hero"') && strip < html.indexOf('id="h7-whales"'), `${locale}: between hero and whales`);
    assert.ok(html.includes(`href="${localizedPath(TS_PATH, locale)}"`), `${locale}: hub link`);
    const header = html.split("</header>")[0];
    assert.ok(header.includes(`href="${localizedPath(TS_PATH, locale)}"`), `${locale}: header link`);
    const footer = html.slice(html.lastIndexOf("<footer"));
    assert.ok(footer.includes(`href="${localizedPath(TS_PATH, locale)}"`), `${locale}: footer link`);
  }
  const tr = harness.render("https://nexualpha.com/tr");
  assert.doesNotMatch(tr.slice(tr.indexOf('class="h7-in h7-ts"'), tr.indexOf('id="h7-whales"')), /bitget/i);
});

test("exchange profiles show the tokenized-stocks block where the exchange lists stocks", async () => {
  const okx = harness.render("https://nexualpha.com/zh-hans/exchanges/okx");
  assert.ok(okx.includes('class="v2-section vts"'));
  assert.ok(okx.includes("/zh-hans/tokenized-stocks#ts-okx"));
  const tr = harness.render("https://nexualpha.com/tr/exchanges/okx");
  assert.doesNotMatch(tr.slice(tr.indexOf('class="v2-section vts"'), tr.indexOf("</section>", tr.indexOf('class="v2-section vts"'))), /bitget/i);
});

test("sitemap: every edition with hreflang, listed in the index and robots.txt, committed copy current", async () => {
  const sitemap = buildTokenizedStocksSitemap();
  for (const locale of TS_INDEX_LOCALES) assert.ok(sitemap.xml.includes(`<loc>https://nexualpha.com${localizedPath(TS_PATH, locale)}</loc>`), locale);
  assert.ok(sitemap.xml.includes("https://nexualpha.com/zh-hans/tokenized-stocks/nvda"));
  assert.match(sitemap.xml, /hreflang="x-default"/);
  const split = buildSplitSitemaps(routeInventory([]), []);
  assert.match(split.index, /sitemap-tokenized-stocks\.xml/);
  assert.match(readFileSync(new URL("../public/robots.txt", import.meta.url), "utf8"), /Sitemap: https:\/\/nexualpha\.com\/sitemap-tokenized-stocks\.xml/);
  assert.equal(readFileSync(new URL("../public/sitemap-tokenized-stocks.xml", import.meta.url), "utf8"), sitemap.xml);
  assert.match(readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8"), /https:\/\/nexualpha\.com\/tokenized-stocks\)/);
});

test("live snapshot: parsers read only stock instruments; diff reports listings and delistings; stale lanes stay quiet", async () => {
  const { PARSE, diffLive } = await import("../scripts/build-tokenized-stocks-live.mjs");
  const bitgetPerp = PARSE.bitget.perp({ data: [
    { symbol: "TSLAUSDT", baseCoin: "TSLA", quoteCoin: "USDT", isRwa: "YES", symbolType: "perpetual", symbolStatus: "normal", maxLever: "100", makerFeeRate: "0.0002", takerFeeRate: "0.0006", openTime: "1769994062288" },
    { symbol: "XAUUSDT", baseCoin: "XAU", quoteCoin: "USDT", isRwa: "YES", symbolType: "perpetual", symbolStatus: "normal", maxLever: "100" },
    { symbol: "BTCUSDT", baseCoin: "BTC", quoteCoin: "USDT", isRwa: "NO", symbolType: "perpetual", symbolStatus: "normal", maxLever: "125" },
  ] });
  assert.deepEqual(Object.keys(bitgetPerp), ["TSLA"]);
  assert.deepEqual(bitgetPerp.TSLA, { sym: "TSLAUSDT", lev: 100, maker: 0.02, taker: 0.06, since: "2026-02-02" });
  // rTokens only where Bitget also lists the stock perpetual (RNDR is not a stock).
  assert.deepEqual(Object.keys(PARSE.bitget.spot({ data: [{ symbol: "RTSLAUSDT", status: "online" }, { symbol: "RNDRUSDT", status: "online" }] }, { perp: bitgetPerp })), ["TSLA"]);
  const okx = PARSE.okx.perp({ data: [
    { instId: "OPENAI-USDT-SWAP", instCategory: "3", state: "live", settleCcy: "USDT", instFamily: "OPENAI-USDT", lever: "20", listTime: "1778145300000", ruleType: "pre_market" },
    { instId: "BTC-USDT-SWAP", instCategory: "1", state: "live", settleCcy: "USDT", instFamily: "BTC-USDT", lever: "100" },
  ] });
  assert.deepEqual(Object.keys(okx), ["OPENAI"]);
  assert.equal(okx.OPENAI.preipo, true);
  const gate = PARSE["gate-io"].spot([
    { id: "TSLAON_USDT", base: "TSLAON", base_name: "Tesla Ondo Tokenized", quote: "USDT", trade_status: "tradable" },
    { id: "TSLAX_USDT", base: "TSLAX", base_name: "Tesla xStock", quote: "USDT", trade_status: "tradable" },
  ]);
  assert.deepEqual(gate.TSLA, { sym: "TSLAX", form: "xStocks", alt: "TSLAON", altForm: "Ondo" });
  const prev = { venues: { okx: { perp: { checkedAt: "x", items: { TSLA: { sym: "TSLA-USDT-SWAP" }, GME: { sym: "GME-USDT-SWAP" } } } }, bybit: { perp: { stale: true, items: {} } } } };
  const next = { generatedAt: "2026-10-18T00:00:00Z", venues: { okx: { perp: { checkedAt: "y", source: "s", items: { TSLA: { sym: "TSLA-USDT-SWAP" }, NVDA: { sym: "NVDA-USDT-SWAP", lev: 50 } } } }, bybit: { perp: { checkedAt: "y", items: { AAPL: { sym: "AAPLUSDT" } } } } } };
  const events = diffLive(prev, next);
  assert.deepEqual(events.map((e) => `${e.type}:${e.venue}:${e.ticker}`).sort(), ["delisted:okx:GME", "listed:okx:NVDA"]);
});

test("runtime snapshot: a newer TS_LIVE_READ table is rendered, cited with its date and shipped as prerender state", async () => {
  const { TS_LIVE_BAKED } = await import("../src/data/tokenized-stocks-live.generated.js");
  const newer = structuredClone(TS_LIVE_BAKED);
  newer.generatedAt = new Date(Date.parse(TS_LIVE_BAKED.generatedAt) + 86400e3).toISOString();
  newer.rows.NVDA["bitget:perp"] = { ...newer.rows.NVDA["bitget:perp"], sym: "NVDAUSDT", lev: 77 };
  const response = await worker.fetch(new Request("https://nexualpha.com/tokenized-stocks/nvda", { headers: { accept: "text/html" } }), { ...env(), TS_LIVE_READ: async () => newer });
  const html = await response.text();
  assert.match(mainHtml(html), /\b77x/i);
  const state = JSON.parse(html.match(/<script type="application\/json" id="nexualpha-prerender-state">([\s\S]*?)<\/script>/)[1]);
  assert.equal(state.tsLive.generatedAt, newer.generatedAt);
  // Türkiye: the shipped runtime table has no Bitget rows (page source never names Bitget).
  const tr = await (await worker.fetch(new Request("https://nexualpha.com/tr/tokenized-stocks/nvda", { headers: { accept: "text/html" } }), { ...env(), TS_LIVE_READ: async () => newer })).text();
  assert.match(tr, /"tsLive":/);
  assert.doesNotMatch(tr, /bitget/i);
  // An older runtime table never replaces the release copy.
  const older = { ...newer, generatedAt: "2026-01-01T00:00:00Z" };
  const html2 = await (await worker.fetch(new Request("https://nexualpha.com/tokenized-stocks/nvda", { headers: { accept: "text/html" } }), { ...env(), TS_LIVE_READ: async () => older })).text();
  assert.doesNotMatch(mainHtml(html2), /\b77x/i);
});

test("hydration: ticker (baked and runtime table) and exchange pages hydrate without a mismatch", async () => {
  const { TS_LIVE_BAKED } = await import("../src/data/tokenized-stocks-live.generated.js");
  const newer = { ...structuredClone(TS_LIVE_BAKED), generatedAt: new Date(Date.parse(TS_LIVE_BAKED.generatedAt) + 3600e3).toISOString() };
  const cases = [["/zh-hans/tokenized-stocks/tsla", {}], ["/tokenized-stocks/openai", { TS_LIVE_READ: async () => newer }], ["/es/tokenized-stocks/exchange/okx", {}], ["/tokenized-stocks", {}]];
  for (const [path, extra] of cases) {
    const html = await (await worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), { ...env(), ...extra })).text();
    const { errors } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(errors), [], path);
  }
});

test("campaigns drop at their end date without an edit (curated + found in the exchange's announcements)", async () => {
  const { tsCampaigns } = await import("../src/data/tokenized-stocks.js");
  const found = { campaigns: [{ venue: "bybit", title: "Stock Buzz: Trade Nvidia", url: "https://announcements.bybit.com/en-US/article/x/", startAt: "2026-10-20T00:00:00Z", endAt: "2026-11-05T00:00:00Z", tickers: ["NVDA"] }] };
  const keys = (now, ticker) => tsCampaigns({ venues: ["bybit"], ticker, live: found, locale: "en", now: Date.parse(now) }).map((c) => c.key || c.title);
  assert.ok(keys("2026-10-20T00:00:00Z", "TSLA").includes("bybitStockBuzzTsla"));
  assert.ok(!keys("2026-10-29T08:00:01Z", "TSLA").includes("bybitStockBuzzTsla"), "Tesla Stock Buzz ends 2026-10-29 08:00 UTC");
  assert.deepEqual(keys("2026-11-01T00:00:00Z", "TSLA"), []);
  assert.ok(keys("2026-10-21T00:00:00Z", "NVDA").includes("Stock Buzz: Trade Nvidia"));
  assert.ok(!keys("2026-10-19T00:00:00Z", "NVDA").includes("Stock Buzz: Trade Nvidia"), "not before its start");
  assert.ok(!keys("2026-11-06T00:00:00Z", "NVDA").includes("Stock Buzz: Trade Nvidia"));
  assert.deepEqual(tsCampaigns({ venues: ["bybit"], ticker: "TSLA", live: found, locale: "ru", now: Date.parse("2026-10-21T00:00:00Z") }), [], "neutral locale: none");
});

test("copy split: the browser ships one edition (prerender state), never the 17-locale table", async () => {
  for (const file of ["src/components/tokenized-stocks/TokenizedStocksPages.jsx", "src/components/tokenized-stocks/TokenizedStocksDetail.jsx", "src/data/tokenized-stocks-model.js", "src/data/tokenized-stocks-copy-client.js"]) {
    assert.doesNotMatch(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), /from\s+["'][^"']*tokenized-stocks-copy\.js["']/, file);
  }
  const html = await (await fetchPage("/ja/tokenized-stocks/nvda")).text();
  const state = JSON.parse(html.match(/<script type="application\/json" id="nexualpha-prerender-state">([\s\S]*?)<\/script>/)[1]);
  assert.equal(state.tsPage.copy.locale, "ja");
  assert.ok(Number.isFinite(state.tsPage.now));
  const tr = await (await fetchPage("/tr/tokenized-stocks/nvda")).text();
  assert.doesNotMatch(tr, /bitget/i);
  // The trimmed Türkiye edition never leaks into later renders (server cache holds full editions).
  assert.match(mainHtml(await (await fetchPage("/tokenized-stocks/exchange/bitget")).text()), /rToken/);
});
