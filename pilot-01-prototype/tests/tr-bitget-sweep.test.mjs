// Türkiye sweep (owner 2026-10-14, tr-bitget-sweep): Bitget is on the SPK liquidation list, so no /tr page names it in
// any promotional or navigational surface — funding/fee tables and boards, compare links and cards, venue directories,
// pickers, related links, notice feeds, hydration state or structured data. The only remaining mention is the neutral
// SPK fact on /tr/licenses/turkey, as plain text with no link. Checks the full worker HTML (head, JSON-LD, hrefs,
// data attributes, hydration payload), not just visible text. Other editions keep Bitget unchanged.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import worker from "../worker/index.js";
import { createSsrHarness, SHELL_HTML } from "./helpers/ssr-hydration-harness.mjs";
import { isTurkeyPage, withoutTurkeyUnlisted, withoutTurkeyUnlistedSchema, withoutTurkeyUnlistedVenueFeed } from "../src/data/partner-geo-policy.js";

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const funding = json("./fixtures/funding-rates-live-2026-10-14.json");
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

const SWEPT = ["/tr", "/tr/exchanges", "/tr/compare", "/tr/funding-rates", "/tr/rates", "/tr/sorular", `/tr/news/${rewardsSlug}`];
const LICENSE = "/tr/licenses/turkey";

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

/** Full response HTML through the worker: prerendered body (home with the build-time notice feed, as the build renders
 * it) from the manifest plus every request-time feed. */
async function serve(path) {
  const url = new URL(`https://nexualpha.com${path}`);
  const locale = path.startsWith("/tr") ? "tr" : "en";
  const pathname = path.replace(/^\/tr(?=\/|$)/, "") || "/";
  const routes = { [`${pathname}|${locale}`]: { pathname, locale, html: harness.render(url.href, pathname === "/" ? { officialAnnouncements: intel } : {}), searchPublished: true } };
  const assets = { fetch: async (request) => {
    const asset = new URL(request.url).pathname;
    if (asset === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes });
    if (asset === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html" } });
    if (asset === "/content/news-feed.json") return Response.json(newsFeed);
    if (asset === "/intel/official-announcements.json") return Response.json(intel);
    return new Response("missing", { status: 404 });
  } };
  const response = await worker.fetch(new Request(url), { ASSETS: assets, NEWS_SSR_RENDER: harness.render,
    FUNDING_READ: async () => funding, MARKET_EVENTS_READ: async () => marketEvents, INTEL_READ: async () => intel });
  assert.equal(response.status, 200, path);
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
  assert.match(en, /class="h7-fr-row" href="\/exchanges\/bitget"/, "control: English board lists Bitget");
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
