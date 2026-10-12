import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker/index.js";
import { updatePath } from "../src/data/activity-update.js";

const NOW = Math.floor(Date.now() / 60_000) * 60_000;
const published = (hoursAgo) => new Date(NOW - hoursAgo * 3_600_000).toISOString();

const listing = {
  id: "binance:abcdef1234567890",
  venue: "binance",
  category: "listing",
  title: "Binance Will List TESTCOIN",
  url: "https://www.binance.com/en/support/announcement/detail/abcdef1234567890",
  publishedAt: published(1),
};
const event = {
  id: "bybit:https://announcements.bybit.com/en-US/article/trading-campaign/",
  venue: "bybit",
  category: "event",
  title: "Bybit Trading Campaign",
  url: "https://announcements.bybit.com/en-US/article/trading-campaign/",
  publishedAt: published(2),
};
const datedEvent = {
  id: "bybit:https://announcements.bybit.com/en-US/article/dated-trading-campaign/",
  venue: "bybit",
  category: "event",
  title: "Bybit Dated Trading Campaign",
  url: "https://announcements.bybit.com/en-US/article/dated-trading-campaign/",
  publishedAt: published(2),
  startAt: published(1),
  endAt: new Date(NOW + 3_600_000).toISOString(),
};
const delisting = {
  id: "okx:delist-test",
  venue: "okx",
  category: "delisting",
  title: "OKX to Delist TESTCOIN",
  url: "https://www.okx.com/help/okx-to-delist-testcoin",
  publishedAt: published(3),
};
const staleNews = {
  id: "bitget:news-test",
  venue: "bitget",
  category: "news",
  title: "Bitget Product Notice",
  url: "https://www.bitget.com/support/articles/news-test",
  publishedAt: published(4),
};


const coreListing = {
  id: "core-listing-approved",
  kind: "LISTING",
  platform: { slug: "okx", name: "OKX" },
  title: { en: "OKX Will List COREFEED", "zh-Hans": "OKX 将上线 COREFEED" },
  summary: { en: "Approved core listing update." },
  officialSource: { url: "https://www.okx.com/help/okx-will-list-corefeed" },
  discoveredAt: published(1),
  verifiedAt: published(1),
  expiresAt: new Date(NOW + 86_400_000).toISOString(),
  reviewStatus: "APPROVED",
  fixture: false,
};
const coreListingItem = {
  id: coreListing.id,
  kind: coreListing.kind,
  platform: coreListing.platform,
  title: coreListing.title,
  summary: coreListing.summary,
  officialSource: coreListing.officialSource,
  discoveredAt: coreListing.discoveredAt,
  verifiedAt: coreListing.verifiedAt,
  expiresAt: coreListing.expiresAt,
};

const feed = { generatedAt: new Date(NOW).toISOString(), items: [listing, event, datedEvent, delisting, staleNews] };
const SHELL = "<!doctype html><html lang=\"en\"><head><title>Shell</title><meta name=\"description\" content=\"shell\" /><link rel=\"canonical\" href=\"https://nexualpha.com/\" /><meta name=\"robots\" content=\"index,follow\" /></head><body><div id=\"root\"></div></body></html>";
const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/index.html") return new Response(SHELL, { headers: { "content-type": "text/html; charset=utf-8" } });
  if (pathname === "/intel/official-announcements.json") return Response.json(feed);
  return new Response("missing", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
} };

const fetchPage = (pathname, env) => worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), env);
const prerenderState = (html) => JSON.parse(html.match(/<script type="application\/json" id="nexualpha-prerender-state">([\s\S]*?)<\/script>/)?.[1] || "null");
const schemaPayload = (html) => JSON.parse(html.match(/<script id="nexualpha-route-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || "null");
const robots = (html) => html.match(/<meta name="robots" content="([^"]+)"/)?.[1] || "";
const routePath = (item) => updatePath(item);

test("activity update pages SSR from INTEL_READ with all validated feed categories in the hydration payload", async () => {
  const calls = [];
  const listingPath = routePath(listing);
  const env = {
    ASSETS: assets,
    INTEL_READ: async () => feed,
    NEWS_SSR_RENDER: async (href, options) => {
      calls.push({ href, options });
      return `<main class="activity-update-page"><h1>${new URL(href).pathname}</h1></main>`;
    },
  };

  const response = await fetchPage(listingPath, env);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].href, `https://nexualpha.com${listingPath}?locale=en`);
  assert.match(html, /class="activity-update-page"/);
  assert.equal(response.headers.get("x-nexualpha-news-render"), null);
  const state = prerenderState(html);
  assert.equal(state.pathname, listingPath);
  assert.equal(state.locale, "en");
  const categories = new Set(state.officialAnnouncements.items.map((item) => item.category));
  for (const category of ["listing", "event", "delisting", "news"]) assert.ok(categories.has(category), `${category} survives compacting`);
  assert.ok(state.officialAnnouncements.items.some((item) => item.id === listing.id), "the current listing item is present");
  assert.ok(state.officialAnnouncements.items.some((item) => item.id === datedEvent.id && item.startAt && item.endAt), "real event dates survive compacting");
});

test("activity update SEO indexes listings and campaigns, noindexes delistings, and never invents Event dates", async () => {
  const env = { ASSETS: assets, INTEL_READ: async () => feed, NEWS_SSR_RENDER: async () => "<main><h1>Update</h1></main>" };
  for (const item of [listing, event, delisting]) {
    const response = await fetchPage(routePath(item), env);
    const html = await response.text();
    const schema = schemaPayload(html);
    const graph = schema?.["@graph"] || [];
    const article = graph.find((entry) => entry["@type"] === "NewsArticle");
    const eventSchema = graph.find((entry) => entry["@type"] === "Event");
    assert.equal(response.status, 200, item.id);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://nexualpha\\.com${routePath(item).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), item.id);
    assert.equal(robots(html), item.category === "delisting" ? "noindex,follow" : "index,follow", item.id);
    assert.ok(article, `${item.id}: NewsArticle schema is present`);
    assert.equal(article.citation, item.url, `${item.id}: schema cites the original announcement`);
    assert.equal(eventSchema, undefined, `${item.id}: Event schema is omitted without real start/end dates`);
  }
});

test("activity update routes fall back to the cached official-announcements asset when INTEL_READ is absent", async () => {
  const response = await fetchPage(routePath(listing), { ASSETS: assets, NEWS_SSR_RENDER: async () => "<main><h1>Update</h1></main>" });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /NEXUALPHA_ACTIVITY_UPDATE_ROUTE_V1/);
  assert.equal(prerenderState(html).officialAnnouncements.items.some((item) => item.id === listing.id), true);
});

test("activity update SEO emits Event schema only when real event dates are present", async () => {
  const env = { ASSETS: assets, INTEL_READ: async () => feed, NEWS_SSR_RENDER: async () => "<main><h1>Update</h1></main>" };
  const html = await (await fetchPage(routePath(datedEvent), env)).text();
  const graph = schemaPayload(html)?.["@graph"] || [];
  const eventSchema = graph.find((entry) => entry["@type"] === "Event");
  assert.ok(eventSchema, "dated campaign carries Event schema");
  assert.equal(eventSchema.startDate, datedEvent.startAt);
  assert.equal(eventSchema.endDate, datedEvent.endAt);
});

test("localized activity update routes keep internal canonical, hreflang, and translated common listing headline", async () => {
  const env = { ASSETS: assets, INTEL_READ: async () => feed, NEWS_SSR_RENDER: async () => "<main><h1>Update</h1></main>" };
  const path = routePath(listing);
  const response = await fetchPage(`/zh-hans${path}`, env);
  const html = await response.text();
  assert.equal(response.status, 200);
  // SEO title budget (PR seo-crawl-fixes) may truncate the brand suffix; the translated headline must lead the title.
  assert.match(html, /<title[^>]*>Binance 上币: 币安将上线 TESTCOIN/);
  assert.match(html, new RegExp(`<link rel="canonical" href="https://nexualpha\\.com/zh-hans${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(html, /hreflang="zh-Hans"/);
});

test("unknown activity update URLs are real 404s and do not call the runtime renderer", async () => {
  const response = await fetchPage("/activities/updates/binance/unknown-update", {
    ASSETS: assets,
    INTEL_READ: async () => feed,
  });
  assert.equal(response.status, 404);
  assert.equal(robots(await response.text()), "noindex,nofollow");
});

test("activity update routes merge approved non-fixture core official-updates rows with the cached update feed", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (request) => {
    const url = new URL(request.url);
    if (url.origin === "https://core.example" && url.pathname === "/api/v1/official-updates") {
      return Response.json({ data: [
        coreListing,
        { ...coreListing, id: "core-listing-draft", reviewStatus: "DRAFT" },
        { ...coreListing, id: "core-listing-fixture", fixture: true },
        { ...coreListing, id: "core-listing-unverified", verifiedAt: null },
        { ...coreListing, id: "core-listing-review-missing", reviewStatus: undefined, fixture: undefined },
      ] });
    }
    return originalFetch(request);
  };
  try {
    const path = routePath(coreListingItem);
    const response = await fetchPage(path, {
      ASSETS: assets,
      CORE_API_ORIGIN: "https://core.example",
      NEWS_SSR_RENDER: async () => "<main><h1>Update</h1></main>",
    });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal(robots(html), "index,follow");
    const stateItems = prerenderState(html).officialAnnouncements.items;
    assert.ok(stateItems.some((item) => item.id === coreListing.id && item.category === "listing"), "approved core listing is merged");
    assert.equal(stateItems.some((item) => item.id === "core-listing-draft"), false, "draft core updates stay out");
    assert.equal(stateItems.some((item) => item.id === "core-listing-fixture"), false, "fixture core updates stay out");
    assert.equal(stateItems.some((item) => item.id === "core-listing-unverified"), false, "unverified core updates stay out");
    assert.equal(stateItems.some((item) => item.id === "core-listing-review-missing"), false, "missing review authority stays out");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('request-time update SSR and hydration retain the blocked market gate', async () => {
  const { createSsrHarness, hydrateInJsdom, hydrationErrors } = await import('./helpers/ssr-hydration-harness.mjs');
  const harness = await createSsrHarness();
  try {
    const item = { ...delisting, id: 'okx:market-event', category: 'event', title: 'OKX Trading Event' };
    const pageUrl = `https://nexualpha.com${updatePath(item)}?market=JP`;
    const response = await worker.fetch(new Request(pageUrl), {
      ASSETS: assets, INTEL_READ: async () => ({ items: [item, delisting] }),
      NEWS_SSR_RENDER: async (href, props) => {
        assert.equal(new URL(href).searchParams.get('market'), 'JP');
        return harness.render(href, props);
      },
    });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal(prerenderState(html).activityContext.market, 'JP');
    const article = html.match(/<article>([\s\S]*?)<\/article>/)[1];
    assert.doesNotMatch(article, /data-cta-kind="registration"|data-cta-code=|40%/);
    assert.ok(article.includes(`${updatePath(delisting)}?market=JP`));
    assert.ok(article.includes('href="/activities?market=JP"'));
    assert.ok(article.includes('href="/starter?market=JP"'));
    const result = await hydrateInJsdom(harness.vite, html, pageUrl);
    assert.deepEqual(hydrationErrors(result.errors), []);
  } finally { await harness.close(); }
});
