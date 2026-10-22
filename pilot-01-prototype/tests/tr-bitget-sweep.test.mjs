// Türkiye sweep (owner 2026-10-14, tr-bitget-sweep): Bitget is on the SPK liquidation list, so no /tr page names it in
// any promotional or navigational surface — funding/fee tables and boards, compare links and cards, venue directories,
// pickers, related links, notice feeds, hydration state or structured data. The only remaining mention is the neutral
// SPK fact on /tr/licenses/turkey, as plain text with no link. Checks the full worker HTML (head, JSON-LD, hrefs,
// data attributes, hydration payload), not just visible text. Other editions keep Bitget unchanged.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import worker from "../worker/index.js";
import { createSsrHarness, prerenderState, SHELL_HTML } from "./helpers/ssr-hydration-harness.mjs";
import { isTurkeyPage, withRequestMarket, withoutTurkeyUnlisted, withoutTurkeyUnlistedSchema, withoutTurkeyUnlistedVenueFeed } from "../src/data/partner-geo-policy.js";
import { buildHydrationBootstrap } from "../src/data/hydration-bootstrap.js";

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const funding = json("./fixtures/funding-rates-live-2026-10-14.json");
// Use current source timestamps: this suite tests regional filtering, not hard expiry.
funding.generatedAt = new Date().toISOString();
for (const source of Object.values(funding.venues)) source.readAt = funding.generatedAt;
// The live collector also reads Bitget funding; the fixture predates it.
funding.venues.bitget = { ok: true, readAt: funding.generatedAt, rows: ["BTC", "ETH"].map((symbol) => ({ symbol, rate: 0.0001, intervalH: 8, nextAt: "2026-10-14T00:00:00.000Z" })) };
const marketEvents = json("./fixtures/market-data/market-events.live-v2-2026-10-13.json");
const intel = json("../public/intel/official-announcements.json");
intel.items = [...(intel.items || []), { id: "bitget:sweep", venue: "bitget", category: "event", title: "Bitget sweep campaign", url: "https://www.bitget.com/support/articles/sweep", publishedAt: new Date().toISOString() }];
const rewardsSlug = "exchange-new-user-rewards-roundup-october-2026-verified-terms";
const rewards = { slug: rewardsSlug, status: "PUBLISHED", publishedAt: "2026-10-14T00:00:00Z", availableLocales: ["en", "tr"],
  title: { en: "Exchange rewards", tr: "Yeni kullanıcı ödülleri" }, summary: { en: "Bitget and OKX terms", tr: "OKX koşulları." },
  content: { en: "## Rewards\n\nBitget and OKX rewards.", tr: "## Ödüller\n\nOKX koşullarını doğrulayın." },
  sources: [{ publisher: "Bitget", title: "Rewards", url: "https://www.bitget.com/support/articles/rewards" }, { publisher: "OKX", title: "Rewards", url: "https://www.okx.com/help/rewards" }],
  relatedVenues: ["bitget", "okx"], seo: { noindex: false, internalLinkTargets: ["/exchanges/bitget", "/compare/bitget-vs-okx", "/exchanges/okx"] },
  internalLinks: ["/tr/exchanges/bitget", "/tr/exchanges/okx"], cta: { venue: "bitget" } };
const newsFeed = { articles: [rewards, { ...rewards, slug: "bitget-rewards", title: { en: "Bitget rewards", tr: "Bitget ödülleri" } }] };
// Live campaign briefs (Bitget Alliance brief included) and a runtime coins snapshot newer than the baked table.
const campaignBriefs = json("../public/content/campaign-briefs.json");
const coinsSnapshot = { ...json("../public/intel/coins.json"), generatedAt: new Date().toISOString() };

const SWEPT = ["/tr", "/tr/exchanges", "/tr/compare", "/tr/funding-rates", "/tr/rates", "/tr/sorular", `/tr/news/${rewardsSlug}`];
const LICENSE = "/tr/licenses/turkey";

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

/** Full response HTML through the worker: prerendered body (home with the build-time notice feed, as the build renders
 * it) from the manifest plus every request-time feed. */
async function serve(path, { status = 200 } = {}) {
  const url = new URL(`https://nexualpha.com${path}`);
  const prefix = url.pathname.match(/^\/(tr|de|ja)(?=\/|$)/)?.[1];
  const locale = prefix || "en";
  const pathname = (prefix ? url.pathname.slice(prefix.length + 1) : url.pathname) || "/";
  // The manifest holds the locale-only build (no query), as in production; coin pages are never in it (request-time).
  const routes = pathname.startsWith("/coins") ? {} : { [`${pathname}|${locale}`]: { pathname, locale, html: harness.render(`${url.origin}${url.pathname}`, pathname === "/" ? { officialAnnouncements: intel } : {}), searchPublished: true } };
  const assets = { fetch: async (request) => {
    const asset = new URL(request.url).pathname;
    if (asset === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes });
    if (asset === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html" } });
    if (asset === "/content/news-feed.json") return Response.json(newsFeed);
    if (asset === "/intel/official-announcements.json") return Response.json(intel);
    if (asset === "/content/campaign-briefs.json") return Response.json(campaignBriefs);
    return new Response("missing", { status: 404 });
  } };
  const response = await worker.fetch(new Request(url), { ASSETS: assets, NEWS_SSR_RENDER: harness.render,
    FUNDING_READ: async () => funding, MARKET_EVENTS_READ: async () => marketEvents, INTEL_READ: async () => intel,
    COINS_SNAPSHOT_READ: async () => coinsSnapshot });
  assert.equal(response.status, status, path);
  const html = await response.text();
  assert.ok(html.length > 10000, `${path} rendered`);
  return html;
}

const hits = (html) => [...html.matchAll(/[\s\S]{0,80}bitget[\s\S]{0,40}/gi)].map((m) => m[0].replace(/\s+/g, " "));
// The licence fact renders twice (table row and the narrow-screen card); both are the same SPK register record.
const LICENSE_FACT = /<tr>(?:(?!<\/tr>)[\s\S])*Bitget Teknoloji AŞ(?:(?!<\/tr>)[\s\S])*<\/tr>|<li class="nx-license-card[^"]*">(?:(?!<\/li>)[\s\S])*Bitget Teknoloji AŞ(?:(?!<\/li>)[\s\S])*<\/li>/g;

test("Türkiye pages carry no Bitget anywhere in the served HTML", async () => {
  for (const path of SWEPT) {
    const html = await serve(path);
    assert.match(html, /application\/ld\+json/, `${path} has structured data`);
    assert.deepEqual(hits(html), [], `${path} still names Bitget`);
  }
});

test("the home funding board and hydration state drop Bitget on /tr only", async () => {
  const tr = await serve("/tr");
  assert.match(tr, /id="h7-funding"/);
  assert.match(tr, /h7-fr-row/);
  const en = await serve("/");
  const document = new JSDOM(en).window.document;
  const bitget = document.querySelector('table.h7-fr-table tbody tr td a[href="/exchanges/bitget"]');
  assert.ok(bitget, "control: English native funding table lists Bitget with its venue link");
  assert.ok(bitget.closest('tr').classList.contains('h7-fr-row'));
});

test("/tr/licenses/turkey keeps only the SPK fact, as plain text", async () => {
  const html = await serve(LICENSE);
  const facts = html.match(LICENSE_FACT) || [];
  assert.ok(facts.length >= 1, "SPK liquidation-list record is shown");
  for (const fact of facts) {
    assert.match(fact, /SPK/);
    assert.doesNotMatch(fact, /<a\b[^>]*bitget|(?:href|src|value|content|data-[\w-]+)="[^"]*bitget/i, "no link or attribute to Bitget");
  }
  assert.deepEqual(hits(html.replace(LICENSE_FACT, "")), [], "no Bitget outside the licence fact");
});

test("other editions keep Bitget exactly where it was", async () => {
  for (const path of ["/exchanges", "/compare", "/rates", "/licenses/turkey"]) {
    assert.ok(hits(await serve(path)).length > 0, `${path} still lists Bitget`);
  }
  assert.ok(hits(harness.render("https://nexualpha.com/de/compare", {})).length > 0, "/de/compare still lists Bitget");
});

test("shared filters are scoped to Türkiye pages", () => {
  assert.equal(isTurkeyPage({ locale: "tr" }), true);
  assert.equal(isTurkeyPage({ locale: "en", market: "TR" }), true);
  assert.equal(isTurkeyPage({ locale: "en" }), false);
  assert.equal(isTurkeyPage({ locale: "ja" }), false);
  const pairs = ["binance-vs-okx", "bybit-vs-bitget"];
  assert.deepEqual(withoutTurkeyUnlisted(pairs, { locale: "tr" }), ["binance-vs-okx"]);
  assert.equal(withoutTurkeyUnlisted(pairs, { locale: "en" }), pairs);
  assert.deepEqual(Object.keys(withoutTurkeyUnlistedVenueFeed(funding, { locale: "tr" }).venues).includes("bitget"), false);
  assert.equal(withoutTurkeyUnlistedVenueFeed(funding, { locale: "en" }), funding);
  const schema = { "@type": "ItemList", itemListElement: ["okx", "bitget", "bybit"].map((slug, i) => ({ "@type": "ListItem", position: i + 1, url: `https://nexualpha.com/tr/exchanges/${slug}` })) };
  assert.deepEqual(withoutTurkeyUnlistedSchema(schema, { locale: "tr" }).itemListElement.map((item) => [item.position, item.url.split("/").pop()]), [[1, "okx"], [2, "bybit"]]);
  assert.equal(withoutTurkeyUnlistedSchema(schema, { locale: "en" }), schema);
});

test("coin meta descriptions on Türkiye pages name the same venues as the page body (no Bitget)", async () => {
  const { coinMeta } = await import("../src/data/coins-seo.js");
  const { COINS, coinBySlug } = await import("../src/data/coins.js");
  const bgb = coinBySlug("bitget-token");
  assert.ok(bgb, "fixture: BGB is a covered coin");
  assert.match(coinMeta(bgb, "en").description, /Bitget(?! Token)/, "control: English names Bitget as a listing venue");
  for (const coin of COINS) {
    const description = coinMeta(coin, "tr").description.replaceAll(coin.name, "");
    assert.doesNotMatch(description, /bitget/i, `/tr/coins/${coin.slug} meta description`);
  }
});

// tr-market-gaps (2026-10-14 production QA): an explicit ?market=TR on another edition is a Türkiye page too. The worker
// renders it at request time (never the locale-only prerender), with the market in the render URL and the hydration
// state, so the head, body, JSON-LD and hydration payload carry no Bitget.
const MARKET_TR = ["/?market=TR", "/exchanges?market=TR", "/compare?market=TR", "/rates?market=TR", "/funding-rates?market=TR",
  "/coins?market=TR", "/coins/bitcoin?market=TR", "/activities?market=TR", "/exchanges/okx?market=TR", "/compare/binance-vs-okx?market=TR",
  "/de?market=TR", "/ja/exchanges?market=TR"];

test("English (and other) editions with ?market=TR carry no Bitget anywhere in the served HTML", async () => {
  for (const path of MARKET_TR) {
    const html = await serve(path);
    assert.deepEqual(hits(html), [], `${path} still names Bitget`);
  }
});

test("?market=TR home: Türkiye head copy, no Bitget funding row, market carried into hydration", async () => {
  const html = await serve("/?market=TR");
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] || "";
  assert.match(description, /crypto exchange fees.*official sources/);
  assert.doesNotMatch(description,/Bitget/i);
  assert.match(html, /class="h7-fr-row"/, "funding board still renders");
  const state = prerenderState(html);
  assert.equal(state.marketContext?.market, "TR");
  assert.equal(Object.keys(state.funding?.venues || {}).includes("bitget"), false, "hydration funding has no Bitget");
  const bootstrap = buildHydrationBootstrap({ browserUrl: "https://nexualpha.com/?market=TR", prerenderState: state, hasServerHtml: true });
  assert.equal(new URL(bootstrap.initialUrl).searchParams.get("market"), "TR", "first client pass renders the same market");
  // Control: the plain English home keeps Bitget, and its state carries no market context.
  const en = await serve("/");
  assert.ok(hits(en).length > 0);
  assert.equal(prerenderState(en).marketContext, undefined);
});

test("/tr hydration payloads drop Bitget campaign briefs and coin venue status", async () => {
  assert.ok(campaignBriefs.items.some((brief) => brief.id.startsWith("bitget:")), "fixture: a Bitget brief exists");
  assert.ok("bitget" in (coinsSnapshot.venueStatus || {}), "fixture: the coins snapshot reads Bitget");
  for (const path of ["/tr/activities", "/activities?market=TR", "/tr/coins", "/coins?market=TR", "/tr/coins/bitcoin"]) {
    const html = await serve(path);
    const state = JSON.stringify(prerenderState(html));
    assert.doesNotMatch(state, /bitget/i, `${path} hydration state names Bitget`);
    assert.deepEqual(hits(html), [], `${path} still names Bitget`);
  }
  // Control: English pages keep the Bitget brief and venue status.
  assert.match(JSON.stringify(prerenderState(await serve("/activities"))), /bitget:12560603896118/);
  assert.match(JSON.stringify(prerenderState(await serve("/coins"))), /"bitget":\{"ok"/);
});

test("BGB (Bitget's own token) has no Türkiye page and is left out of the Türkiye coin hub", async () => {
  for (const path of ["/tr/coins/bitget-token", "/coins/bitget-token?market=TR"]) {
    const html = await serve(path, { status: 404 });
    assert.match(html, /<meta name="robots" content="noindex/);
    // Only the requested URL itself (canonical, og:url, language switcher) may contain the slug.
    const body = html.replace(/(?:href|content)="[^"]*\/coins\/bitget-token[^"]*"/g, "").replace(/"pathname":"\/coins\/bitget-token"/g, "");
    assert.deepEqual(hits(body), [], `${path} body`);
  }
  for (const path of ["/tr/coins", "/coins?market=TR"]) assert.doesNotMatch(await serve(path), /data-coin-row="bitget-token"/);
  assert.match(await serve("/coins/bitget-token"), /<h1[^>]*>[^<]*Bitget Token/, "control: English BGB page");
  assert.match(await serve("/coins"), /data-coin-row="bitget-token"/, "control: English hub lists BGB");
  const { coinsSitemapEntries } = await import("../src/data/coins-seo.js");
  const bgb = coinsSitemapEntries({ urlFor: (pathname, locale) => `${locale}:${pathname}` }).filter((entry) => entry.pathname === "/coins/bitget-token");
  assert.equal(bgb.some((entry) => entry.locale === "tr" || entry.alternates.some((alt) => alt.hreflang === "tr")), false, "no tr sitemap/hreflang entry");
});

test("the request market applies to locale-only policy checks during one render, and only a Türkiye market", () => {
  assert.equal(isTurkeyPage({ locale: "en" }), false);
  assert.equal(withRequestMarket("TR", () => isTurkeyPage({ locale: "en" })), true);
  assert.equal(withRequestMarket("BR", () => isTurkeyPage({ locale: "en" })), false);
  assert.equal(withRequestMarket(null, () => isTurkeyPage({ locale: "en" })), false);
  assert.equal(isTurkeyPage({ locale: "en" }), false, "restored after the render");
  assert.equal(withRequestMarket("TR", () => isTurkeyPage({ locale: "en", market: "BR" })), false, "an explicit market wins");
});
