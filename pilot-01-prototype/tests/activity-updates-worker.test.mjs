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
const campaignBriefs = { items: [{
  id: event.id,
  updated: published(1),
  headline: { en: "Reviewed Bybit campaign", tr: "İncelenmiş Bybit kampanyası" },
  summary: { en: "Reviewed summary for account eligibility. No reward amount is inferred from the raw title." },
  key_facts: [{ label: { en: "Eligibility" }, value: "Verified account" }],
  deadline: new Date(NOW + 3_600_000).toISOString(),
  source_checked: published(1),
}] };
const SHELL = "<!doctype html><html lang=\"en\"><head><title>Shell</title><meta name=\"description\" content=\"shell\" /><link rel=\"canonical\" href=\"https://nexualpha.com/\" /><meta name=\"robots\" content=\"index,follow\" /></head><body><div id=\"root\"></div></body></html>";
const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/index.html") return new Response(SHELL, { headers: { "content-type": "text/html; charset=utf-8" } });
  if (pathname === "/intel/official-announcements.json") return Response.json(feed);
  if (pathname === "/content/campaign-briefs.json") return Response.json(campaignBriefs);
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
  for (const item of [listing, datedEvent, delisting]) {
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
    assert.ok(article.image?.length, "announcement article includes the publisher image");
    if (item === datedEvent) {
      assert.equal(eventSchema.startDate, item.startAt);
      assert.equal(eventSchema.endDate, item.endAt);
      assert.equal(eventSchema.organizer.name, "Bybit");
      assert.equal(eventSchema.eventAttendanceMode, "https://schema.org/OnlineEventAttendanceMode");
    } else assert.equal(eventSchema, undefined, `${item.id}: unknown event dates are not inferred`);
  }
});

test("activity update routes fall back to the cached official-announcements asset when INTEL_READ is absent", async () => {
  const response = await fetchPage(routePath(listing), { ASSETS: assets, NEWS_SSR_RENDER: async () => "<main><h1>Update</h1></main>" });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /NEXUALPHA_ACTIVITY_UPDATE_ROUTE_V1/);
  assert.equal(prerenderState(html).officialAnnouncements.items.some((item) => item.id === listing.id), true);
});

test("activity update SEO keeps the article alternative when only a deadline is known", async () => {
  const env = { ASSETS: assets, INTEL_READ: async () => feed, NEWS_SSR_RENDER: async () => "<main><h1>Update</h1></main>" };
  const html = await (await fetchPage(routePath(event), env)).text();
  const graph = schemaPayload(html)?.["@graph"] || [];
  const eventSchema = graph.find((entry) => entry["@type"] === "Event");
  assert.equal(eventSchema, undefined, "a deadline does not supply a real start date");
  assert.ok(graph.some((entry) => entry["@type"] === "NewsArticle"));
});

test("activity update route SEO and hydration state use campaign briefs from ASSETS", async () => {
  const path = routePath(event);
  const calls = [];
  const response = await fetchPage(`/tr${path}`, {
    ASSETS: assets,
    INTEL_READ: async () => feed,
    NEWS_SSR_RENDER: async (href, props) => {
      calls.push({ href, props });
      return `<main><h1>${props.officialAnnouncements.items.find((row) => row.id === event.id).brief.headline.tr}</h1></main>`;
    },
  });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<title[^>]*>Bybit Kampanya: İncelenmiş Bybit kampanyası/);
  assert.match(html, /Reviewed summary for account eligibility/);
  const state = prerenderState(html);
  assert.equal(state.officialAnnouncements.items.find((row) => row.id === event.id).brief.headline.tr, "İncelenmiş Bybit kampanyası");
  assert.equal(state.officialAnnouncements.campaignBriefs[0].id, event.id);
  assert.equal(calls[0].props.officialAnnouncements.items.find((row) => row.id === event.id).brief.deadline, campaignBriefs.items[0].deadline);
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

// GSC "Not found (404)", 2026-10-12: update pages whose item rotated out of the live feed returned 404 although Telegram,
// sitemaps and our own pages had linked them. Archived items stay real pages; never-published slugs redirect.
const archivedEvent = {
  id: "binance:0123456789abcdef0123456789abcdef",
  venue: "binance",
  category: "event",
  title: "Binance Archived Trading Campaign",
  url: "https://www.binance.com/en/support/announcement/detail/0123456789abcdef0123456789abcdef",
  publishedAt: published(24 * 40),
  firstSeenAt: published(24 * 40),
  lastSeenAt: published(24 * 10),
};
const oldArchivedListing = {
  id: "binance:fedcba9876543210fedcba9876543210",
  venue: "binance",
  category: "listing",
  title: "Binance Will List OLDCOIN",
  url: "https://www.binance.com/en/support/announcement/detail/fedcba9876543210fedcba9876543210",
  publishedAt: published(24 * 200),
};
const archive = { version: 1, items: [listing, archivedEvent, oldArchivedListing] };

test("unknown activity update URLs 301 to the localized activity listing, keep ?market= and never render", async () => {
  let rendered = 0;
  const env = { ASSETS: assets, INTEL_READ: async () => feed, INTEL_ARCHIVE_READ: async () => archive, NEWS_SSR_RENDER: async () => { rendered += 1; return "<main><h1>x</h1></main>"; } };
  const plain = await fetchPage("/activities/updates/binance/unknown-update", env);
  assert.equal(plain.status, 301);
  assert.equal(plain.headers.get("location"), "https://nexualpha.com/activities");
  const localized = await fetchPage("/zh-hans/activities/updates/binance/unknown-update?market=JP", env);
  assert.equal(localized.status, 301);
  assert.equal(localized.headers.get("location"), "https://nexualpha.com/zh-hans/activities?market=JP");
  const noArchive = await fetchPage("/activities/updates/okx/okx-some-old-item-abc123", { ASSETS: assets, INTEL_READ: async () => feed });
  assert.equal(noArchive.status, 301, "a missing archive still never yields a 404");
  assert.equal(rendered, 0);
});

test("archived activity updates stay 200 with the ended label, CTA and related links, and the archived row in hydration state", async () => {
  const { createSsrHarness, hydrateInJsdom, hydrationErrors } = await import("./helpers/ssr-hydration-harness.mjs");
  const harness = await createSsrHarness();
  try {
    for (const [prefix, label] of [["", "Ended"], ["/zh-hans", "已结束"]]) {
      const pageUrl = `https://nexualpha.com${prefix}${updatePath(archivedEvent)}`;
      const response = await worker.fetch(new Request(pageUrl), {
        ASSETS: assets, INTEL_READ: async () => feed, INTEL_ARCHIVE_READ: async () => archive,
        NEWS_SSR_RENDER: async (href, props) => harness.render(href, props),
      });
      const html = await response.text();
      assert.equal(response.status, 200, prefix);
      assert.equal(robots(html), "index,follow", `${prefix}: archived campaign inside 180 days stays indexable`);
      assert.match(html, new RegExp(`<link rel="canonical" href="https://nexualpha\\.com${prefix}${updatePath(archivedEvent).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
      const article = html.match(/<article>([\s\S]*?)<\/article>/)[1];
      assert.ok(article.includes(`class="update-page__ended">${label}<`), `${prefix}: ended label`);
      assert.match(article, /Binance Archived Trading Campaign/);
      assert.ok(article.includes(`href="${prefix}/exchanges/binance"`), `${prefix}: venue profile link`);
      assert.ok(article.includes(updatePath(listing)), `${prefix}: related live update link`);
      assert.doesNotMatch(article, /Announcement unavailable|公告暂不可用/);
      const state = prerenderState(html);
      assert.ok(state.officialAnnouncements.items.some((row) => row.id === archivedEvent.id && row.archived === true));
      const result = await hydrateInJsdom(harness.vite, html, pageUrl);
      assert.deepEqual(hydrationErrors(result.errors), []);
    }
  } finally { await harness.close(); }
});

test("archived activity updates older than 180 days are noindex but still 200; live pages never show the ended label", async () => {
  const env = { ASSETS: assets, INTEL_READ: async () => feed, INTEL_ARCHIVE_READ: async () => archive, NEWS_SSR_RENDER: async (href, props) => `<main><h1>${props.officialAnnouncements.items.filter((row) => row.archived).map((row) => row.id).join(",")}</h1></main>` };
  const old = await fetchPage(updatePath(oldArchivedListing), env);
  const oldHtml = await old.text();
  assert.equal(old.status, 200);
  assert.equal(robots(oldHtml), "noindex,follow");
  const live = await fetchPage(updatePath(listing), env);
  const liveHtml = await live.text();
  assert.equal(live.status, 200);
  assert.equal(robots(liveHtml), "index,follow");
  assert.equal(prerenderState(liveHtml).officialAnnouncements.items.some((row) => row.archived), false, "a live item is never served as archived");
});

test("archived activity updates resolve from the shipped archive asset when INTEL_ARCHIVE_READ is absent", async () => {
  const withArchive = { fetch: async (request) => new URL(request.url).pathname === "/intel/official-announcements-archive.json" ? Response.json(archive) : assets.fetch(request) };
  const response = await fetchPage(updatePath(archivedEvent), { ASSETS: withArchive, INTEL_READ: async () => feed, NEWS_SSR_RENDER: async () => "<main><h1>Update</h1></main>" });
  assert.equal(response.status, 200);
  assert.equal(prerenderState(await response.text()).officialAnnouncements.items.find((row) => row.id === archivedEvent.id).archived, true);
});

test("retired /starter links 301 to the localized academy (新手村 is NexuAlpha Academy since 2026-10-12)", async () => {
  const env = { ASSETS: assets };
  const en = await worker.fetch(new Request("https://nexualpha.com/starter?market=JP"), env);
  assert.equal(en.status, 301);
  assert.equal(en.headers.get("location"), "https://nexualpha.com/academy?market=JP");
  const zh = await worker.fetch(new Request("https://nexualpha.com/zh-hans/starter"), env);
  assert.equal(zh.status, 301);
  assert.equal(zh.headers.get("location"), "https://nexualpha.com/zh-hans/academy");
});

test("/sitemap-updates.xml lists live and archived-within-180-days indexable updates only", async () => {
  const { renderUpdateSitemap } = await import("../worker/index.js");
  const xml = await renderUpdateSitemap({ ASSETS: assets, INTEL_READ: async () => feed, INTEL_ARCHIVE_READ: async () => archive }, new URL("https://nexualpha.com/"), NOW);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const has = (item, prefix = "") => locs.includes(`https://nexualpha.com${prefix}${updatePath(item)}`);
  assert.ok(has(listing) && has(listing, "/zh-hans"), "live listing in every indexable locale");
  assert.ok(has(event), "live campaign");
  assert.ok(has(archivedEvent) && has(archivedEvent, "/ja"), "archived campaign within 180 days");
  assert.equal(has(oldArchivedListing), false, "archived longer than 180 days: noindex page, not in the sitemap");
  assert.equal(has(delisting), false, "noindex delisting stays out");
  assert.equal(has(staleNews), false, "news category is noindex and stays out");
  assert.equal(new Set(locs).size, locs.length, "no duplicate URLs");
  const response = await worker.fetch(new Request("https://nexualpha.com/sitemap-updates.xml"), { ASSETS: assets, INTEL_READ: async () => feed, INTEL_ARCHIVE_READ: async () => archive });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/xml/);
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
    assert.ok(article.includes('href="/academy?market=JP"'), 'starter guide (新手村) keeps the market');
    const result = await hydrateInJsdom(harness.vite, html, pageUrl);
    assert.deepEqual(hydrationErrors(result.errors), []);
  } finally { await harness.close(); }
});
