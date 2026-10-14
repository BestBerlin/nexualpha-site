// Striking-distance lane (2026-10-11): Search Console grouping for `search-engines.mjs striking` and the on-page
// changes for site-rendered pages that rank 4–30 (/news hub, Deribit, Backpack, /topics/no-kyc).
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  closenessToTop10,
  groupStrikingRows,
  isStrikingRow,
  mergeStrikingWindows,
  strikingMarkdownTable,
} from "../scripts/striking-distance-lib.mjs";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";
import { titleDisplayWidth } from "../src/data/meta-description.js";
import { NEWS_HUB_SEO_EN, newsListHeroCopy } from "../src/data/news-list-copy.js";
import { priorityVenueAnswerFor } from "../src/data/priority-venue-answers.js";
import { referralSeoFor } from "../src/data/referral-seo.js";
import { nativeReferralFor } from "../src/data/referral-native.js";
import { topicReviewedFaqRecords } from "../src/data/topic-reviewed-faqs.js";
import { REFERRAL_PARTNERS } from "../src/data/referral-partners.generated.js";

const SITE = "https://nexualpha.com/";
const row = (query, page, impressions, position, clicks = 0) => ({ keys: [query, `${SITE}${page}`], impressions, position, clicks });

test("striking rows: position 4–30 and at least 3 impressions, both bounds inclusive", () => {
  assert.equal(isStrikingRow(row("a", "x", 3, 4)), true);
  assert.equal(isStrikingRow(row("a", "x", 3, 30)), true);
  assert.equal(isStrikingRow(row("a", "x", 2, 10)), false, "too few impressions");
  assert.equal(isStrikingRow(row("a", "x", 50, 3.9)), false, "already top 3");
  assert.equal(isStrikingRow(row("a", "x", 50, 30.1)), false, "beyond page three");
  assert.equal(isStrikingRow({ keys: ["only-query"], impressions: 9, position: 9 }), false, "needs [query, page]");
});

test("closeness to the top 10 is 1 near the top and falls linearly to page three", () => {
  assert.equal(closenessToTop10(4), 1);
  assert.equal(closenessToTop10(2), 1);
  assert.ok(Math.abs(closenessToTop10(17.5) - 0.5) < 1e-9);
  assert.ok(closenessToTop10(30) > 0 && closenessToTop10(30) < 0.05);
  assert.equal(closenessToTop10(NaN), 0);
});

test("rows group by page with impression-weighted position, best position and ranked queries", () => {
  const pages = groupStrikingRows([
    row("binance sbe", "news/binance-sbe", 9, 9.1),
    row("binance sbe market data", "news/binance-sbe", 3, 8),
    row("noise", "news/binance-sbe", 2, 5), // below the impression floor
    row("okx api doc", "news/okx-api", 9, 22.8),
    row("top3 query", "news/okx-api", 40, 2), // already on top
  ], { site: SITE });
  assert.deepEqual(pages.map((p) => p.page), ["/news/binance-sbe", "/news/okx-api"]);
  const [sbe, okx] = pages;
  assert.equal(sbe.impressions, 12);
  assert.equal(sbe.bestPosition, 8);
  assert.equal(sbe.avgPosition, 8.8);
  assert.deepEqual(sbe.topQueries.map((q) => q.query), ["binance sbe", "binance sbe market data"]);
  assert.equal(okx.impressions, 9);
  assert.ok(sbe.score > okx.score, "closer page with equal-ish volume ranks first");
});

test("markdown table escapes pipes and the merged ranking keeps pages from either window", () => {
  const long = groupStrikingRows([row("a|b", "p1", 10, 8), row("c", "p2", 5, 20)], { site: SITE });
  const short = groupStrikingRows([row("d", "p3", 6, 6)], { site: SITE });
  const md = strikingMarkdownTable(long);
  assert.match(md, /a\\\|b \(10 \/ 0 \/ 8\)/);
  assert.match(md, /\| 1 \| `\/p1` \|/);
  const merged = mergeStrikingWindows(long, short);
  assert.deepEqual(merged.map((m) => m.page).sort(), ["/p1", "/p2", "/p3"]);
  assert.equal(merged.find((m) => m.page === "/p3").d90, null);
});

const feed = JSON.parse(await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8"));
const assets = () => ({
  fetch: async (request) => {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/content/news-feed.json") return new Response(JSON.stringify(feed), { status: 200, headers: { "content-type": "application/json" } });
    if (pathname === "/content/news-feed.sha256.txt") return new Response("striking-test", { status: 200, headers: { "content-type": "text/plain" } });
    return new Response("missing", { status: 404, headers: { "content-type": "text/plain" } });
  },
});

test("/news hub: exchange-news title, description and H1 in the Worker head and the SSR head", async () => {
  assert.ok(titleDisplayWidth(NEWS_HUB_SEO_EN.title) <= 60);
  assert.ok(NEWS_HUB_SEO_EN.description.length <= 160);
  const server = await routeMetadata(new URL("https://nexualpha.com/news"), { ASSETS: assets() });
  assert.equal(server.title, NEWS_HUB_SEO_EN.title);
  assert.equal(server.description, NEWS_HUB_SEO_EN.description);
  const client = computeRouteSeo({ url: "/news", newsArticles: feed.articles });
  assert.equal(client.title, NEWS_HUB_SEO_EN.title);
  assert.equal(client.description, NEWS_HUB_SEO_EN.description);
  assert.match(newsListHeroCopy("en").title, /^Crypto exchange news/);
  // Every venue named in the intro is covered by the feed (no invented coverage).
  for (const venue of ["Binance", "OKX", "Coinbase", "Kraken", "Bybit"]) {
    assert.match(newsListHeroCopy("en").subtitle, new RegExp(venue));
    assert.ok(feed.articles.filter((a) => new RegExp(venue, "i").test(`${a.slug} ${JSON.stringify(a.title)}`)).length >= 3, venue);
  }
  // Other locales keep their own headings.
  assert.equal(newsListHeroCopy("de").title, "Nachrichten und Research");
});

test("Deribit: fees-first title within budget, H1 names fees, Worker and client agree", async () => {
  const answer = priorityVenueAnswerFor("deribit", "en");
  assert.match(answer.ownerQuestion, /fees/);
  assert.ok(titleDisplayWidth(answer.seoTitle) <= 60, answer.seoTitle);
  assert.match(answer.seoTitle, /^Deribit Fees/);
  assert.ok(answer.seoDescription.length <= 160);
  const client = computeRouteSeo({ url: "/exchanges/deribit" });
  const server = await routeMetadata(new URL("https://nexualpha.com/exchanges/deribit"), { ASSETS: assets() });
  assert.equal(client.title, server.title);
  assert.equal(client.description, server.description);
  assert.match(server.title, /^Deribit Fees \(2026\): Options, Futures and 10% Discount/);
});

test("Backpack: fees-first referral title keeps the partner-feed code and fits 60 characters", () => {
  const partner = REFERRAL_PARTNERS.find((p) => p.slug === "backpack");
  const seo = referralSeoFor("backpack", "en");
  assert.ok(seo.title.startsWith("Backpack Exchange Fees ("), seo.title);
  assert.ok(seo.title.includes(partner.inviteCode), "code comes from the partner feed");
  assert.ok(titleDisplayWidth(seo.title) <= 60, seo.title);
  // Other locales and other partners keep the shared templates.
  assert.ok(!referralSeoFor("backpack", "es").title.startsWith("Backpack Exchange Fees"));
  assert.equal(referralSeoFor("kraken", "en").title, nativeReferralFor("kraken", "en").title);
});

test("/topics/no-kyc answers 'does hyperliquid require kyc' from existing data with an official source", () => {
  for (const locale of ["en", "zh-Hans", "zh-Hant"]) {
    const records = topicReviewedFaqRecords("no-kyc", locale);
    const record = records.find((r) => r.id === "r100-no-kyc-5");
    assert.ok(record, locale);
    assert.match(record.question, /Hyperliquid/);
    assert.ok(record.sources.some((s) => s.url === "https://app.hyperliquid.xyz/terms"));
  }
  const en = topicReviewedFaqRecords("no-kyc", "en").find((r) => r.id === "r100-no-kyc-5");
  assert.equal(en.question, "Does Hyperliquid require KYC?");
  assert.match(en.answer, /Restricted Persons/);
  assert.doesNotMatch(en.answer, /guarantee|anonymous|no rules apply/i);
  const schema = computeRouteSeo({ url: "/topics/no-kyc" }).schemas.find((s) => s["@type"] === "FAQPage");
  assert.ok(schema.mainEntity.some((q) => q.name === "Does Hyperliquid require KYC?"));
});
