// Tokenized US stocks (/tokenized-stocks hub + 12 ticker pages, home strip, exchange-profile block; owner 2026-10-15).
// Checks: every displayed fact has an official source with a date (and matches the research packet when it is mounted),
// sign-ups use the registry code through /go/<venue>?src=tokenized-stocks-*, owner order Bitget > OKX > Binance,
// Türkiye never names Bitget, neutral locales show no code / CTA / campaign, expired promotions disappear, JSON-LD
// (ItemList + FAQPage + BreadcrumbList), hreflang, sitemap, header/footer links, home placement before the whale board,
// and no fine print.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import worker from "../worker/index.js";
import { TS_EXCHANGES, TS_SOURCES, TS_TICKERS, tsAllSourceIds, tsListings, tsPromo } from "../src/data/tokenized-stocks-facts.js";
import { TS_INDEX_LOCALES, tsSignup, tsVenues } from "../src/data/tokenized-stocks.js";
import { TS_PATH, TS_TICKER_SLUGS, parseTokenizedStocksPath } from "../src/data/tokenized-stocks-routes.js";
import { TS_COPY } from "../src/data/tokenized-stocks-copy.js";
import { publicCtaForVenue } from "../src/data/source-bound-cta.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";
import { buildSplitSitemaps, buildTokenizedStocksSitemap, routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import { createSsrHarness, SHELL_HTML } from "./helpers/ssr-hydration-harness.mjs";

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
  for (const ticker of TS_TICKERS) assert.ok(tsListings(ticker).length >= 3, `${ticker}: at least three sourced listings`);
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

test("ticker pages: 12 pages render with sourced rows and CTAs; unknown ticker 404", async () => {
  for (const ticker of TS_TICKERS) {
    const response = await fetchPage(`/zh-hans/tokenized-stocks/${ticker.toLowerCase()}`);
    assert.equal(response.status, 200, ticker);
    const html = await response.text();
    const main = mainHtml(html);
    const rows = main.split('<div class="nxts-tk__row" role="row">').slice(1);
    assert.equal(rows.length, tsListings(ticker).length, ticker);
    for (const row of rows) assert.ok(row.includes('class="nxts-src'), `${ticker}: row without source`);
    assert.ok(anchors(main).some((a) => /^\/go\/[a-z-]+\?src=tokenized-stocks-ticker-/.test(a.href)), `${ticker}: CTA`);
    const types = ldJson(html).map((item) => item["@type"]);
    for (const type of ["ItemList", "FAQPage", "BreadcrumbList"]) assert.ok(types.includes(type), `${ticker}: ${type}`);
  }
  assert.equal((await fetchPage("/tokenized-stocks/zzzz")).status, 404);
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
