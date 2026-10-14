// "Where to buy <coin>" (2026-10-12): /coins hub and /coins/<slug>. Request-time SSR through the Worker with the component
// the browser hydrates, WebPage/FAQPage/BreadcrumbList JSON-LD, sitemap-coins.xml, noindex rules (unlisted coins, locales
// without our description, non-index locales), geo-gated sign-up (Türkiye: OKX/Binance/Bybit; neutral locales: none),
// the owner's no-fine-print rule and the internal links from home and exchange profiles.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";
import { COINS, coinBySlug, coinSignup, isCoinListed, primarySignup, spotVenues } from "../src/data/coins.js";
import { COIN_DETAIL_INDEX_LOCALES, COIN_INDEX_LOCALES, parseCoinsPath } from "../src/data/coins-routes.js";
import { COIN_COPY } from "../src/data/coins-copy.js";
import { coinIndexable, coinIndexLocales, coinsIndexReport, COIN_DESCRIPTIONS_BY_LOCALE } from "../src/data/coins-seo.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { publicCtaForVenue } from "../src/data/source-bound-cta.js";
import { titleBudgetForLocale } from "../src/data/meta-description.js";
import { POPULAR_COINS } from "../src/data/coins-links.generated.js";
import { POPULAR_COINS_BY_VENUE } from "../src/data/coins-venue-links.generated.js";
import { buildCoinsSitemap, buildSplitSitemaps, routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import { createSsrHarness, SHELL_HTML, hydrateInJsdom, hydrationErrors, h1Texts } from "./helpers/ssr-hydration-harness.mjs";
// Shared neutral list (ru, ar, zh-Hant, ur, uk and, since 2026-10-13, vi): src/data/locale-policy.js.
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";

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
const fetchPage = (path, e = env()) => worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), e);
const ldJson = (html) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => { const v = JSON.parse(m[1]); return Array.isArray(v) ? v : (v["@graph"] || [v]); });
const mainHtml = (html) => (html.match(/<main\b[\s\S]*<\/main>/) || [""])[0];
const robots = (html) => (html.match(/<meta name="robots" content="([^"]+)"/) || [])[1];
const unlisted = COINS.find((coin) => !isCoinListed(coin));

// Defensive fine print the owner keeps off these pages (footer and legal pages only).
const FINE_PRINT = [
  /not (?:investment|financial) advice/i, /pays? (?:us |our )?(?:a )?commission/i, /affiliate commission/i, /we (?:may )?earn/i,
  /availability depends/i, /terms (?:and conditions )?apply/i, /partner link ·/i, /do your own research|DYOR/i,
  /非投资建议|不构成投资建议|佣金|返佣由|是否可用取决于|仅供参考/, /no es asesoramiento|não é recomendação|kein(?:e)? Anlageberatung|yatırım tavsiyesi değildir|投資助言ではありません|투자 조언이 아닙니다/i,
];
// Price predictions are not published anywhere on these pages.
const PREDICTION = /price prediction|will (?:reach|hit|rise to)|could reach \$|forecast|价格预测|预计将?涨|目标价/i;

test("coin universe: ~200 coins with unique slugs/symbols, real venue listings, descriptions in every index locale", () => {
  assert.ok(COINS.length >= 150 && COINS.length <= 220, `${COINS.length} coins`);
  assert.equal(new Set(COINS.map((c) => c.slug)).size, COINS.length);
  assert.equal(new Set(COINS.map((c) => c.symbol)).size, COINS.length);
  const btc = coinBySlug("bitcoin");
  assert.ok(btc && btc.symbol === "BTC");
  for (const venue of ["okx", "binance", "bitget"]) assert.ok(btc.venues.some((v) => v.slug === venue && v.spot.includes("USDT")), `BTC/USDT on ${venue}`);
  assert.ok(COINS.filter(isCoinListed).length >= 150, "most coins are listed somewhere");
  for (const locale of COIN_INDEX_LOCALES) {
    const described = COINS.filter((coin) => COIN_DESCRIPTIONS_BY_LOCALE[locale][coin.id]).length;
    assert.ok(described >= COINS.length * 0.9, `${locale}: ${described} descriptions`);
  }
  assert.deepEqual(parseCoinsPath("/coins"), { kind: "hub" });
  assert.deepEqual(parseCoinsPath("/coins/solana"), { kind: "coin", slug: "solana" });
  assert.equal(parseCoinsPath("/coins/a/b").kind, "missing");
  assert.equal(parseCoinsPath("/exchanges/okx"), null);
});

test("/coins and coin pages render at request time in en and zh-hans with one h1, canonical, hreflang and title budget", async () => {
  for (const [path, locale, slug] of [
    ["/coins", "en", null], ["/zh-hans/coins", "zh-Hans", null],
    ["/coins/bitcoin", "en", "bitcoin"], ["/zh-hans/coins/ethereum", "zh-Hans", "ethereum"], ["/tr/coins/solana", "tr", "solana"],
  ]) {
    const response = await fetchPage(path);
    const html = await response.text();
    assert.equal(response.status, 200, path);
    const t = COIN_COPY[locale];
    const coin = slug && coinBySlug(slug);
    const h1 = coin ? t.h1.replace("{coin}", coin.name).replace("{symbol}", coin.symbol).replace("{year}", "2026") : t.hubTitle.replace("{count}", String(COINS.length));
    assert.deepEqual(h1Texts(html), [h1], `${path}: one h1`);
    assert.match(html, /<main class="nxc /, `${path}: coins body in the SSR HTML`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://nexualpha.com${path}"`), `${path}: self canonical`);
    assert.equal(robots(html), "index,follow", `${path}: indexable`);
    const expected = coin ? coinIndexLocales(coin).length + 1 : COIN_INDEX_LOCALES.length + 1;
    assert.equal((html.match(/rel="alternate" hreflang=/g) || []).length, expected, `${path}: hreflang set`);
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/)[1];
    assert.ok(title.length <= titleBudgetForLocale(locale), `${path}: title budget (${title})`);
  }
  const btc = mainHtml(await (await fetchPage("/coins/bitcoin")).text());
  // The answer comes first and names the venues and the main pair.
  const answer = btc.match(/data-coin-answer[^>]*>([^<]+)</)[1];
  assert.match(answer, /Bitcoin \(BTC\) is listed for spot trading on .*OKX.*Binance/);
  assert.match(answer, /BTC\/USDT/);
  for (const venue of coinBySlug("bitcoin").venues) assert.match(btc, new RegExp(`data-venue="${venue.slug}"`), `${venue.slug} row`);
  assert.match(btc, /href="\/academy\/kyc-who-gets-your-id"/, "KYC lesson (E05)");
  assert.match(btc, /href="\/academy\/first-spot-trade"/, "first spot trade (E07)");
  assert.match(btc, /href="\/academy\/pre-transfer-checklist"/, "transfer checklist (E09)");
  assert.match(btc, /nxc-related"[\s\S]*href="\/coins\/[a-z0-9-]+"/, "related coins");
  assert.match(btc, /0\.08% \/ 0\.10%/, "OKX spot fee from exchange-facts");
  assert.match(btc, /SGT/, "coin snapshot time is rendered in Singapore time");
  assert.doesNotMatch(btc, /nxc-price__time[\s\S]*?UTC/, "coin snapshot time does not append UTC");
  const zh = mainHtml(await (await fetchPage("/zh-hans/coins/ethereum")).text());
  assert.ok(zh.includes(COIN_DESCRIPTIONS_BY_LOCALE["zh-Hans"].ethereum), "zh-Hans description in SSR");
  assert.match(zh, /href="\/zh-hans\/academy\/kyc-who-gets-your-id"/);
});

test("JSON-LD: WebPage with venue list, FAQPage and BreadcrumbList on coin pages; CollectionPage on the hub", async () => {
  const graph = ldJson(await (await fetchPage("/coins/bitcoin")).text());
  const page = graph.find((item) => item["@type"] === "WebPage");
  assert.equal(page.about.alternateName, "BTC");
  assert.equal(page.mainEntity.numberOfItems, coinBySlug("bitcoin").venues.length);
  const faq = graph.find((item) => item["@type"] === "FAQPage");
  assert.ok(faq && faq.mainEntity.length >= 3 && faq.mainEntity.length <= 5, "3-5 FAQ entries");
  assert.match(faq.mainEntity[0].name, /Where can I buy Bitcoin/);
  assert.ok(graph.some((item) => item["@type"] === "BreadcrumbList"));
  const hub = ldJson(await (await fetchPage("/coins")).text());
  assert.ok(hub.some((item) => item["@type"] === "CollectionPage" && item.mainEntity.numberOfItems === COINS.length));
  // The client head helper agrees with the Worker.
  const seo = computeRouteSeo({ url: "/zh-hans/coins/ethereum" });
  assert.equal(seo.status, 200);
  assert.ok(seo.schemas.some((item) => item["@type"] === "FAQPage"));
  // The visible FAQ matches the schema.
  const html = mainHtml(await (await fetchPage("/coins/bitcoin")).text());
  for (const entry of faq.mainEntity) assert.ok(html.includes(entry.name.replace(/'/g, "&#x27;")) || html.includes(entry.name), `visible FAQ: ${entry.name}`);
});

test("noindex: unlisted coins, non-index locales, unknown slugs 404", async () => {
  assert.ok(unlisted, "the universe has coins none of our venues list");
  const page = await (await fetchPage(`/coins/${unlisted.slug}`)).text();
  assert.equal(robots(page), "noindex,follow");
  assert.match(mainHtml(page), /None of the exchanges we cover list/);
  assert.match(mainHtml(page), /nxc-related"[\s\S]*href="\/coins\//, "similar listed coins");
  assert.doesNotMatch(mainHtml(page), /href="\/go\//);
  assert.equal(coinIndexable(unlisted, "en"), false);
  for (const path of ["/it/coins/bitcoin", "/ru/coins/bitcoin", "/zh-hant/coins", "/ar/coins/solana", "/ja/coins/solana", "/ko/coins/solana", "/fr/coins/solana", "/de/coins/solana"]) {
    const html = await (await fetchPage(path)).text();
    assert.equal(robots(html), "noindex,follow", path);
    assert.match(html, /<main class="nxc /, `${path}: still rendered`);
  }
  assert.equal((await fetchPage("/coins/not-a-coin")).status, 404);
  const report = coinsIndexReport();
  for (const locale of COIN_DETAIL_INDEX_LOCALES) assert.ok(report[locale].indexed >= 150, `${locale}: ${report[locale].indexed} indexed`);
  for (const locale of ["ja", "ko", "fr", "de"]) assert.equal(report[locale].indexed, 0, `${locale}: gated until release flag is enabled`);
});

test("sitemap-coins.xml lists only indexable editions with the head's hreflang set, and is in the index and robots.txt", async () => {
  const coins = buildCoinsSitemap();
  const indexable = COINS.reduce((sum, coin) => sum + coinIndexLocales(coin).length, 0) + COIN_INDEX_LOCALES.length;
  assert.equal(coins.count, indexable);
  assert.match(coins.xml, /<loc>https:\/\/nexualpha\.com\/coins\/bitcoin<\/loc>/);
  assert.match(coins.xml, /<loc>https:\/\/nexualpha\.com\/zh-hans\/coins\/ethereum<\/loc>/);
  assert.doesNotMatch(coins.xml, new RegExp(`/coins/${unlisted.slug}<`), "unlisted coin not in the sitemap");
  assert.doesNotMatch(coins.xml, /\/(?:it|ru|ar|zh-hant|ur|uk-ua)\/coins/);
  const split = buildSplitSitemaps(routeInventory([]), []);
  assert.match(split.index, /<loc>https:\/\/nexualpha\.com\/sitemap-coins\.xml<\/loc>/);
  assert.equal(split.coins.count, coins.count);
  const head = await (await fetchPage("/es/coins/solana")).text();
  const headAlternates = [...head.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => `${m[1]} ${m[2]}`).sort();
  const entry = coins.xml.split("<url>").find((block) => block.includes("<loc>https://nexualpha.com/es/coins/solana</loc>"));
  const siteAlternates = [...entry.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => `${m[1]} ${m[2]}`).sort();
  assert.deepEqual(siteAlternates, headAlternates);
  assert.match(await readFile(new URL("../public/robots.txt", import.meta.url), "utf8"), /Sitemap: https:\/\/nexualpha\.com\/sitemap-coins\.xml/);
  const sitemapResponse = await worker.fetch(new Request("https://nexualpha.com/sitemap-coins.xml"), { ASSETS: { fetch: async () => new Response(coins.xml, { headers: { "content-type": "application/xml" } }) } });
  assert.equal(sitemapResponse.status, 200);
});

test("sign-up CTA: registry codes via /go/<venue>?src=coin-<slug>, Türkiye OKX/Binance/Bybit only, none in neutral locales", async () => {
  const sol = coinBySlug("solana");
  const okx = coinSignup("okx", sol, { locale: "en" });
  assert.equal(okx.href, "/go/okx?src=coin-solana");
  assert.equal(okx.code, publicCtaForVenue("okx", "en").inviteCode, "code from the partner registry");
  for (const venue of spotVenues(sol)) {
    const tr = coinSignup(venue.slug, sol, { locale: "tr" });
    assert.equal(Boolean(tr), ["okx", "binance", "bybit"].includes(venue.slug), `tr: ${venue.slug}`);
  }
  assert.equal(coinSignup("bitget", sol, { locale: "en", market: "TR" }), null, "market=TR applies the Türkiye rule too");
  for (const locale of NEUTRAL_CTA_LOCALE_LIST) assert.equal(primarySignup(sol, { locale }), null, locale);
  assert.equal(coinSignup("okx", sol, { locale: "ja" }), null, "OKX is not promoted in Japan (geo policy)");

  const trHtml = mainHtml(await (await fetchPage("/tr/coins/solana")).text());
  const goLinks = [...trHtml.matchAll(/href="\/go\/([a-z-]+)\?src=coin-solana"/g)].map((m) => m[1]);
  assert.ok(goLinks.length > 0);
  assert.ok(goLinks.every((venue) => ["okx", "binance", "bybit"].includes(venue)), `tr links: ${goLinks}`);
  assert.match(trHtml, /data-country="TR"/, "country note for Türkiye");
  const en = mainHtml(await (await fetchPage("/coins/bitcoin")).text());
  assert.match(en, /href="\/go\/okx\?src=coin-bitcoin"/);
  assert.ok(en.includes(publicCtaForVenue("okx", "en").inviteCode));
  assert.doesNotMatch(en, /bitget\.cafe|topzhjdgxcb/, "raw partner domains never shown");
  for (const path of ["/ru/coins/bitcoin", "/zh-hant/coins/bitcoin", "/ar/coins/bitcoin"]) {
    const html = mainHtml(await (await fetchPage(path)).text());
    assert.doesNotMatch(html, /href="\/go\/|nexu888|11350287|LUCKX/i, `${path}: no sign-up in a neutral locale`);
  }
});

test("no fine print, commission notes, disclaimers or price predictions on coin pages (footer excluded)", async () => {
  const sample = [...COINS.slice(0, 25), unlisted].map((coin) => `/coins/${coin.slug}`);
  for (const locale of ["en", "zh-Hans", "tr"]) {
    for (const path of ["/coins", ...sample]) {
      const main = mainHtml(await harness.render(`https://nexualpha.com${path}?locale=${locale}`, {}));
      for (const pattern of [...FINE_PRINT, PREDICTION]) assert.doesNotMatch(main, pattern, `${path} (${locale}): ${pattern}`);
    }
  }
  for (const [locale, copy] of Object.entries(COIN_COPY)) {
    const blob = JSON.stringify(copy) + JSON.stringify(COIN_DESCRIPTIONS_BY_LOCALE[locale] || {});
    for (const pattern of [...FINE_PRINT, PREDICTION]) assert.doesNotMatch(blob, pattern, `${locale} copy/descriptions: ${pattern}`);
  }
});

test("hydration of the hub and coin pages has no mismatch (en, zh-hans, tr)", async () => {
  for (const path of ["/coins", "/zh-hans/coins/ethereum", "/tr/coins/solana"]) {
    const html = await (await fetchPage(path)).text();
    const { errors } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(errors), [], `${path}: ${errors.join("\n")}`);
  }
});

test("internal links: home whale page and exchange profile top 20", async () => {
  assert.equal(POPULAR_COINS.length, 20);
  const home = await harness.render("https://nexualpha.com/?locale=zh-Hans", {});
  const board = home.match(/<section class="[^"]*\bh7-whales\b[\s\S]*?<!--whales-end-->/)?.[0];
  assert.ok(board, "home whale module remains SSR-visible");
  assert.match(board, /href="\/zh-hans\/whales"/, "home links the whale page");
  assert.doesNotMatch(board, /\/coins\/|<li/, "home has no coin movers or invented whale rows");
  assert.match(home, /class="nx-ticker[\s\S]*href="\/zh-hans\/coins\/bitcoin"/, "top ticker keeps coin discovery");
  for (const venue of ["okx", "binance", "bitget"]) assert.equal(POPULAR_COINS_BY_VENUE[venue].length, 20, venue);
  const profile = await harness.render("https://nexualpha.com/exchanges/okx", {});
  assert.match(profile, /class="v2-section v3-venue-coins"[\s\S]*href="\/coins\/bitcoin"/, "exchange profile block");
});
