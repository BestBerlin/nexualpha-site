// Türkiye legal gate (owner 2026-10-13, native-speaker QA): Bitget is on the SPK list, so no /tr page may offer a
// Bitget sign-up — no home calculator card or hero pick, no registration link, no /go/bitget redirect, no partner URL,
// no rebate share. Bitget may still be named informationally (coin listings, comparisons), never as a headline venue.
import assert from "node:assert/strict";
import test from "node:test";
import worker, { routeMetadata, renderUpdateSitemap } from "../worker/index.js";
import { updatePath } from "../src/data/activity-update-path.js";
import { buildCampaignSitemap } from "../scripts/generate-prerender-manifest.mjs";
import { bitgetAlliancePromotable } from "../src/data/bitget-alliance.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";
import { partnerRegistry } from "../src/data/partner-registry.js";
import { coinBySlug, coinFaq } from "../src/data/coins.js";
import { coinMeta } from "../src/data/coins-seo.js";
import { localizedHref } from "../src/data/locale-routing.js";
import { homePartnersFor, homeRebateMaxPctFor, HOME_REBATE_MAX_PCT } from "../src/data/home-rebate-tiers.js";
import { ownerRebateLine } from "../src/data/owner-rebate-line.js";

const TR_PAGES = [
  "/tr", "/tr/exchanges", "/tr/exchanges/bitget", "/tr/exchanges/okx", "/tr/compare", "/tr/compare/bitget-vs-okx",
  "/tr/compare/binance-vs-bitget", "/tr/coins", "/tr/coins/bitcoin", "/tr/coins/solana", "/tr/coins/dogecoin",
  "/tr/convert/btc-to-try", "/tr/convert/btc-to-usd", "/tr/activities", "/tr/activities/bybit-stocks",
  "/tr/activities/binance-october-gifts", "/tr/activities/bitget-alliance", "/tr/glossary", "/tr/funding-rates", "/tr/academy", "/tr/academy/first-spot-trade", "/tr/flash", "/tr/rates",
];

const assets = { fetch: async (request) => new URL(request.url).pathname === "/index.html"
  ? new Response("<!doctype html><html><head></head><body></body></html>", { headers: { "content-type": "text/html" } })
  : new Response("missing", { status: 404 }) };
const bitget = partnerRegistry.bitget;
const partnerUrls = [bitget.registrationUrl, ...(bitget.alternateRegistrationUrls || [])].filter(Boolean);

/** Every way a Bitget sign-up can appear in markup; returns the offending fragments. */
export function bitgetSignupHits(html) {
  const hits = [];
  const add = (re) => { for (const m of html.matchAll(re)) hits.push(m[0].slice(0, 160)); };
  add(/exchanges\/bitget[^"'\s]*#registration-path/g);
  add(/\/go\/bitget\b/g);
  add(/C6PRAF/g);
  add(/bitget\.cafe/g);
  add(/<a\b[^>]*data-cta-kind="registration"[^>]*data-cta-platform="bitget"[^>]*>/g);
  add(/<a\b[^>]*data-cta-platform="bitget"[^>]*data-cta-kind="registration"[^>]*>/g);
  for (const url of partnerUrls) if (html.includes(url)) hits.push(url);
  return hits;
}

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

test("no /tr page family renders a Bitget sign-up (both home hero variants)", async () => {
  for (const path of TR_PAGES) {
    for (const heroVariant of path === "/tr" ? ["a", "b"] : ["a"]) {
      const html = harness.render(`https://nexualpha.com${path}`, { heroVariant });
      assert.ok(html.length > 2000, `${path} rendered`);
      assert.deepEqual(bitgetSignupHits(html), [], `${path} (${heroVariant}) carries a Bitget sign-up`);
    }
  }
});

test("the gate is Türkiye-only: the English home still offers Bitget", async () => {
  const html = harness.render("https://nexualpha.com/", {});
  assert.ok(bitgetSignupHits(html).length > 0, "control: /en home links Bitget sign-up");
});

test("home desk, headline share and rebate lines leave Bitget out on /tr", () => {
  assert.ok(!homePartnersFor("tr").includes("bitget"));
  assert.ok(!homePartnersFor("tr", "SG").includes("bitget"));
  assert.ok(!homePartnersFor("tr", "VN").includes("bitget"));
  assert.equal(homeRebateMaxPctFor("tr", "SG"), 40);
  assert.ok(homePartnersFor("en").includes("bitget"));
  assert.equal(homeRebateMaxPctFor("tr"), 40);
  assert.equal(homeRebateMaxPctFor("en"), HOME_REBATE_MAX_PCT);
  assert.equal(ownerRebateLine("bitget", "tr", "Bitget"), null);
  assert.ok(ownerRebateLine("bitget", "en", "Bitget"));
  assert.equal(localizedHref("/exchanges/bitget#registration-path", { locale: "tr" }), "/tr/exchanges/bitget#platform-facts");
  assert.equal(localizedHref("/exchanges/okx#registration-path", { locale: "tr" }), "/tr/exchanges/okx#registration-path");
});

test("/tr coin meta and FAQ never rank Bitget among the headline venues", () => {
  for (const slug of ["bitcoin", "solana", "dogecoin"]) {
    const coin = coinBySlug(slug);
    const description = coinMeta(coin, "tr").description;
    assert.doesNotMatch(description, /Bitget/, `${slug} meta`);
    for (const { answer } of coinFaq(coin, "tr", null)) {
      const names = answer.match(/OKX|Binance|Bybit|Gate|MEXC|Bitget|HTX|Kraken/g) || [];
      assert.ok(!names.slice(0, 3).includes("Bitget"), `${slug} FAQ: ${answer}`);
    }
  }
});


test("Türkiye Bitget Alliance redirects to activities, even with trailing slash or a market override", async () => {
  for (const path of ["/tr/activities/bitget-alliance", "/tr/activities/bitget-alliance/", "/tr/activities/bitget-alliance?market=US", "/activities/bitget-alliance?locale=tr"]) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${path}`), { ASSETS: assets });
    assert.equal(response.status, 301, path);
    assert.equal(response.headers.get("location"), `https://nexualpha.com/tr/activities${path.includes("market=US") ? "?market=US" : ""}`, path);
    assert.equal(await response.text(), "", "no campaign body");
  }
  const seo = computeRouteSeo({ url: "/tr/activities/bitget-alliance" });
  assert.equal(seo.status, 301);
  assert.deepEqual(seo.schemas, []);
  assert.deepEqual(seo.alternates, []);
  const sitemap = buildCampaignSitemap().xml;
  assert.doesNotMatch(sitemap, /\/tr\/activities\/bitget/);
  const metadata = await routeMetadata(new URL("https://nexualpha.com/activities/bitget-alliance"), {});
  assert.ok(metadata.alternates.length > 0, "other editions retain alternates");
  assert.ok(metadata.alternates.every((alt) => alt.hreflang !== "tr"));
});

test("Türkiye redirects live and archived Bitget campaign routes, while informational listings remain", async () => {
  const campaign = { id: "bitget:campaign-regression", venue: "bitget", category: "event", title: "Bitget campaign regression", url: "https://www.bitget.com/support/articles/campaign-regression", publishedAt: new Date().toISOString() };
  const listing = { ...campaign, id: "bitget:listing-regression", category: "listing", title: "Bitget Will List TEST" };
  for (const archived of [false, true]) {
    const env = { ASSETS: assets, INTEL_READ: async () => ({ items: archived ? [listing] : [campaign, listing] }), INTEL_ARCHIVE_READ: async () => ({ items: [campaign] }) };
    const sitemap = await renderUpdateSitemap(env);
    assert.ok(!sitemap.includes(`/tr${updatePath(campaign)}</loc>`), "no Turkish campaign sitemap URL");
    assert.ok(!sitemap.includes(`${updatePath(campaign)}</loc>`), "English campaign sitemap URL is also removed");
    const tr = new URL(`https://nexualpha.com/tr${updatePath(campaign)}?market=US`);
    const metadata = await routeMetadata(tr, env);
    assert.equal(metadata.status, 301, `archived=${archived}`);
    assert.equal(metadata.redirect, "https://nexualpha.com/tr/activities?market=US");
    const response = await worker.fetch(new Request(tr), env);
    assert.equal(response.status, 301);
    assert.equal(response.headers.get("location"), metadata.redirect);
    const en = await routeMetadata(new URL(`https://nexualpha.com${updatePath(campaign)}`), env);
    assert.equal(en.status, 200, "English campaign remains available");
    assert.equal(en.robots, "noindex,follow");
    assert.deepEqual(en.alternates, []);
    const info = await routeMetadata(new URL(`https://nexualpha.com/tr${updatePath(listing)}`), env);
    assert.equal(info.status, 200, "Turkish listing remains informational");
    assert.equal(info.robots, "noindex,follow");
    assert.deepEqual(info.alternates, []);
  }
});


test("Turkish campaign placements stay hidden even with a permissive market override", async () => {
  assert.equal(bitgetAlliancePromotable({ locale: "tr", market: "SG", now: Date.parse("2026-10-13T00:00:00Z") }), false);
  for (const path of ["/tr", "/tr/activities", "/tr/flash", "/tr/exchanges/bitget"]) {
    const html = harness.render(`https://nexualpha.com${path}?market=SG`, {});
    assert.doesNotMatch(html, /bitget-alliance/, path);
  }
});
