// /activities SSR (2026-10-11): the live campaign cards are rendered on the server from the official announcement feed
// (INTEL_READ) with the same LiveCampaigns the browser hydrates, so the research section, notes and disclosure below
// them no longer move when the client fetches the feed (CLS 0.34-0.57 at 390). Without a feed the prerendered page keeps
// a fixed-height three-card placeholder. Hydration must be mismatch-free in every locale (QA: React #418 on /tr/activities).
import assert from "node:assert/strict";
import test from "node:test";
import worker, { compactOfficialAnnouncements } from "../worker/index.js";
import { updateHref } from "../src/data/activity-update.js";
import { createSsrHarness, SHELL_HTML, prerenderState, rootInnerHtml, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

// Relative to the real clock: the worker filters with Date.now() (future-dated rows are dropped as unverifiable).
const NOW = Math.floor(Date.now() / 60_000) * 60_000;
const hoursAgo = (hours) => new Date(NOW - hours * 3_600_000).toISOString();
const intelFeed = {
  generatedAt: new Date(NOW).toISOString(),
  status: "OK",
  sources: { okx: { ok: true }, binance: { ok: true }, bitget: { ok: true } },
  items: [
    { id: "okx:evt-1", venue: "okx", category: "event", title: "OKX Trading Festival: share 100,000 USDT", url: "https://www.okx.com/help/okx-trading-festival", publishedAt: hoursAgo(2), sourceType: "official_api", extra: "dropped" },
    { id: "okx:evt-2", venue: "okx", category: "event", title: "OKX Earn airdrop week", url: "https://www.okx.com/help/okx-earn-airdrop-week", publishedAt: hoursAgo(5), sourceType: "official_api" },
    { id: "okx:evt-3", venue: "okx", category: "event", title: "OKX futures competition round 3", url: "https://www.okx.com/help/okx-futures-competition-3", publishedAt: hoursAgo(9), sourceType: "official_api" },
    { id: "okx:evt-4", venue: "okx", category: "event", title: "OKX Jumpstart launch event", url: "https://www.okx.com/help/okx-jumpstart-launch", publishedAt: hoursAgo(20), sourceType: "official_api" },
    { id: "binance:evt-1", venue: "binance", category: "event", title: "Binance Alpha trading competition (2026-10-09)", summary: "Trade and share rewards.", url: "https://www.binance.com/en/support/announcement/detail/evt-1", publishedAt: hoursAgo(30), sourceType: "official_api" },
    { id: "bitget:evt-1", venue: "bitget", category: "event", title: "Bitget Launchpool: stake to earn", url: "https://www.bitget.com/support/articles/evt-1", publishedAt: hoursAgo(40), sourceType: "official_api" },
    { id: "okx:listing-1", venue: "okx", category: "listing", title: "OKX lists ABC", url: "https://www.okx.com/help/okx-lists-abc", publishedAt: hoursAgo(1), sourceType: "official_api" },
    { id: "okx:evt-old", venue: "okx", category: "event", title: "Expired campaign", url: "https://www.okx.com/help/expired", publishedAt: hoursAgo(24 * 45), sourceType: "official_api" },
    { id: "spoof:evt", venue: "okx", category: "event", title: "Not an official host", url: "https://okx.example.com/promo", publishedAt: hoursAgo(1), sourceType: "official_api" },
  ],
};

const manifest = { version: "nexualpha-prerender-v1", routes: {
  "/activities|en": { pathname: "/activities", locale: "en", html: "<main class=\"v6 v2-page v3-page v3-activity-center\"><h1>Prerendered activities</h1><section class=\"live-campaigns\"><section class=\"live-campaigns__group--skeleton\"></section></section></main>" },
} };
const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/prerender-manifest.json") return Response.json(manifest);
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

const fetchPage = (pathname, env) => worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), env);

test("compactOfficialAnnouncements keeps official event rows of the last 30 days with card fields only", () => {
  const compact = compactOfficialAnnouncements(intelFeed, NOW);
  assert.equal(compact.generatedAt, intelFeed.generatedAt);
  assert.deepEqual(compact.items.map((item) => item.id), ["okx:evt-1", "okx:evt-2", "okx:evt-3", "okx:evt-4", "binance:evt-1", "bitget:evt-1"]);
  assert.deepEqual(Object.keys(compact.items[0]).sort(), ["category", "id", "publishedAt", "title", "url", "venue"]);
  assert.equal(compact.items[4].summary, "Trade and share rewards.");
  assert.equal(compactOfficialAnnouncements(null), null);
  assert.equal(compactOfficialAnnouncements({ generatedAt: "x" }), null);
});

test("/activities is rendered at request time from the announcement feed: campaign cards, join links and footer-only disclosure in the SSR HTML", async () => {
  const calls = [];
  const env = { ASSETS: assets, INTEL_READ: async () => intelFeed, NEWS_SSR_RENDER: async (href, options) => { calls.push({ href, options }); return harness.render(href, options); } };
  // vi is neutral since 2026-10-13 (Vietnam Resolution 05/2025/NQ-CP): its cards keep the official link, no join CTA.
  for (const [path, locale] of [["/activities", "en"], ["/vi/activities", "vi"], ["/tr/activities", "tr"]]) {
    calls.length = 0;
    const response = await fetchPage(path, env);
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.equal(calls.length, 1, `${path}: rendered once`);
    assert.equal(calls[0].href, `https://nexualpha.com/activities?locale=${locale}`);
    assert.doesNotMatch(html, /Prerendered activities/, `${path}: not the build-time manifest body`);
    assert.doesNotMatch(html, /live-campaigns__group--skeleton/, `${path}: no placeholder when the feed is readable`);
    const cards = (html.match(/class="live-campaigns__card(?:\s[^"]*)?"/g) || []).length;
    assert.equal(cards, locale === "tr" ? 5 : 6, `${path}: every visible current event is a card (${cards})`);
    for (const venue of locale === "tr" ? ["okx", "binance"] : ["okx", "binance", "bitget"]) assert.match(html, new RegExp(`data-campaign-group="${venue}"`), `${path}: ${venue} group`);
    if (locale === "tr") assert.doesNotMatch(html, /data-campaign-group="bitget"/, `${path}: Bitget campaigns are hidden in Turkish`);
    assert.match(html, /data-group-overflow="true"/, `${path}: the fourth OKX card folds behind "Show all"`);
    const expectedUpdateHref = updateHref(intelFeed.items[0], locale);
    assert.match(html, new RegExp(`href="${expectedUpdateHref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), `${path}: campaign details link stays on NexuAlpha`);
    assert.doesNotMatch(html, /href="https:\/\/www\.okx\.com\/help\/okx-trading-festival"/, `${path}: campaign cards do not link directly to the exchange`);
    if (locale === "vi") assert.doesNotMatch(html, /data-cta-placement="activities-live-campaign"[^>]*data-cta-code=|data-cta-code=/, `${path}: neutral locale, no sign-up link or code`);
    else assert.match(html, /data-cta-placement="activities-live-campaign"[^>]*data-cta-code=/, `${path}: sign-up link with the invite code`);
    // Owner rule 2026-10-12: commission disclosure only in the footer and legal pages, never with the list.
    assert.doesNotMatch(html, /data-disclosure-placement=/, `${path}: no in-section commission disclosure`);
    assert.match(html, /class="clean-footer__summary"/, `${path}: the footer keeps the single disclosure statement`);
    assert.match(html, /href="[^"]*\/methodology#disclosure"/, `${path}: the footer links the disclosure`);
    assert.doesNotMatch(html, /okx\.example\.com|Expired campaign|OKX lists ABC/, `${path}: non-event, expired and unofficial rows stay out`);
    const state = prerenderState(html);
    assert.equal(state.pathname, "/activities");
    assert.equal(state.locale, locale);
    assert.equal(state.officialAnnouncements.items.length, 6);
    assert.ok(state.officialAnnouncements.items.every((item) => !("extra" in item) && !("sourceType" in item)), "payload is compact");
    const replay = await harness.render(`https://nexualpha.com/activities?locale=${locale}`, { officialAnnouncements: state.officialAnnouncements });
    assert.equal(replay, rootInnerHtml(html), `${path}: hydration props reproduce the SSR body`);
  }
});

test("hydrateRoot in jsdom reports no hydration mismatch on /activities for tr, ar, zh-Hans, en and vi", async () => {
  const env = { ASSETS: assets, INTEL_READ: async () => intelFeed, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) };
  for (const path of ["/tr/activities", "/ar/activities", "/zh-hans/activities", "/activities", "/vi/activities"]) {
    const pageUrl = `https://nexualpha.com${path}`;
    const html = await (await fetchPage(path, env)).text();
    const { errors, text } = await hydrateInJsdom(harness.vite, html, pageUrl);
    assert.deepEqual(hydrationErrors(errors), [], `${path}: hydration errors: ${errors.join("\n")}`);
    assert.match(text, /OKX Trading Festival/, `${path}: campaign cards survive hydration`);
  }
});

test("without a readable feed the prerendered page is served and the component renders a fixed-height placeholder", async () => {
  const logged = [];
  const originalError = console.error;
  console.error = (...args) => logged.push(args.join(" "));
  try {
    const failing = { ASSETS: assets, INTEL_READ: async () => { throw new Error("feed down"); }, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) };
    const html = await (await fetchPage("/activities", failing)).text();
    assert.match(html, /Prerendered activities/, "manifest body when the feed cannot be read");
    assert.ok(logged.some((line) => /announcement feed.*feed down/.test(line)), `logged: ${logged.join(" | ")}`);
  } finally {
    console.error = originalError;
  }
  const noFeedHtml = await harness.render("https://nexualpha.com/activities?locale=en", {});
  assert.match(noFeedHtml, /live-campaigns__group--skeleton/, "no feed: three-card placeholder");
  assert.equal((noFeedHtml.match(/live-campaigns__card--skeleton/g) || []).length, 3);
  const assetsOnly = await fetchPage("/activities", { ASSETS: assets });
  assert.equal(assetsOnly.status, 200);
  assert.match(await assetsOnly.text(), /Prerendered activities/, "assets-only host keeps the prerendered page");
});
