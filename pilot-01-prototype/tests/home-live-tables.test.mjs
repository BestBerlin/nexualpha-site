import assert from "node:assert/strict";
import test from "node:test";
import { createSsrHarness, hydrateInJsdom, hydrationErrors, prerenderState, SHELL_HTML } from "./helpers/ssr-hydration-harness.mjs";
import worker from "../worker/index.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { fundingTable } from "../src/data/funding-rates.js";
import { createFundingFeed } from "../server/funding-feed.mjs";
import { HOME_PARTNERS } from "../src/data/home-rebate-tiers.js";
import { buildPartnersFeed } from "../src/data/partners-feed.js";

// The worker supplies its actual render clock; live fixtures must be within the validity window.
const generatedAt = new Date().toISOString();
const liveFunding = {
  generatedAt,
  venues: {
    binance: { ok: true, readAt: generatedAt, rows: [{ symbol: "BTC", rate: 0.0001, intervalH: 8, nextAt: "2026-10-13T16:00:00.000Z" }] },
    hyperliquid: { ok: true, readAt: generatedAt, rows: [{ symbol: "BTC", rate: -0.0000125, intervalH: 1, nextAt: "2026-10-13T09:00:00.000Z" }] },
  },
};


const liveMovers = {
  generatedAt,
  source: "test",
  headline: { kind: "funding", base: "BTC", binance: "+0.0100%", okx: "−0.0020%" },
  up: [{ sym: "BTC", slug: "bitcoin", name: "Bitcoin", price: "$100,000.00", change: "+2.50%", dir: "up" }],
  down: [{ sym: "ETH", slug: "ethereum", name: "Ethereum", price: "$3,000.00", change: "−1.20%", dir: "down" }],
};

const emptyFunding = {
  generatedAt,
  venues: {
    binance: { ok: true, readAt: generatedAt, rows: [] },
    okx: { ok: false, readAt: generatedAt, rows: [] },
  },
};

test("home funding hides without a feed and shows unavailable for an explicit empty snapshot", async () => {
  const harness = await createSsrHarness();
  try {
    const noFeed = harness.render("/");
    assert.doesNotMatch(noFeed, /id="h7-funding"/);
    assert.doesNotMatch(noFeed, /h7-fr-row--wait/);

    const empty = harness.render("/", { funding: emptyFunding });
    assert.match(empty, /id="h7-funding"/);
    assert.match(empty, /Unavailable/);
    assert.doesNotMatch(empty, /h7-fr-table/);
    assert.doesNotMatch(empty, /h7-fr-row--wait/);
    const invalid = { ...liveFunding, venues: { binance: { rows: [{ symbol: "BTC", rate: null, intervalH: 8 }] } } };
    assert.equal(fundingTable(invalid, "BTC").length, 0);
    const invalidHtml = harness.render("/", { funding: invalid });
    assert.match(invalidHtml, /Unavailable/);
    assert.doesNotMatch(invalidHtml, /h7-fr-table/);
  } finally {
    await harness.close();
  }
});

test("Worker serves funding cache values and identical hydration state across locales", async () => {
  const harness = await createSsrHarness();
  try {
    const routes = Object.fromEntries(["en", "zh-Hans", "ar", "id"].map((locale) => [`/|${locale}`, {
      pathname: "/", locale, html: harness.render(localizedPath("/", locale)), searchPublished: true,
    }]));
    const assets = { fetch: async (request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes });
      if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html" } });
      return new Response("missing", { status: 404 });
    } };
    for (const locale of ["en", "zh-Hans", "ar", "id"]) {
      const url = `https://nexualpha.com${localizedPath("/", locale)}`;
      const response = await worker.fetch(new Request(url), {
        ASSETS: assets, NEWS_SSR_RENDER: harness.render, FUNDING_READ: () => liveFunding,
      });
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.match(html, /id="h7-funding"/);
      assert.match(html, /\+0\.0100%/);
      assert.deepEqual(prerenderState(html).funding.venues, liveFunding.venues);
      assert.equal(prerenderState(html).funding.generatedAt, generatedAt);
      assert.ok(Number.isFinite(Date.parse(prerenderState(html).funding.renderedAt)));
      const hydrated = await hydrateInJsdom(harness.vite, html, url);
      assert.deepEqual(hydrationErrors(hydrated.errors), [], hydrated.errors.join("\n"));
    }
    // Null/throw are missing transport state; an explicit empty snapshot is data.
    const emptyHtml = await (await worker.fetch(new Request("https://nexualpha.com/"), {
      ASSETS: assets, NEWS_SSR_RENDER: harness.render, FUNDING_READ: () => emptyFunding,
    })).text();
    assert.match(emptyHtml, /id="h7-funding"/);
    assert.match(emptyHtml, /Unavailable/);
    assert.deepEqual(prerenderState(emptyHtml).funding.venues, emptyFunding.venues);
    for (const read of [() => null, () => { throw new Error("unavailable"); }]) {
      const html = await (await worker.fetch(new Request("https://nexualpha.com/"), {
        ASSETS: assets, NEWS_SSR_RENDER: harness.render, FUNDING_READ: read,
      })).text();
      assert.doesNotMatch(html, /id="h7-funding"/);
      assert.equal(prerenderState(html).funding, undefined);
    }
    const marketUrl = "https://nexualpha.com/?market=TR";
    const marketHtml = await (await worker.fetch(new Request(marketUrl, { headers: { "user-agent": "Mozilla/5.0" } }), {
      ASSETS: assets, NEWS_SSR_RENDER: harness.render, FUNDING_READ: () => liveFunding,
      HOME_HERO_EXPERIMENT_FORCE: "b",
    })).text();
    assert.equal(prerenderState(marketHtml).heroVariant, "b");
    assert.match(marketHtml, /id="h7-funding"/);
    assert.doesNotMatch(marketHtml, /href="\/go\/bitget(?:[?"/])/);
    const marketHydrated = await hydrateInJsdom(harness.vite, marketHtml, marketUrl);
    assert.deepEqual(hydrationErrors(marketHydrated.errors), [], marketHydrated.errors.join("\n"));
    const feed = createFundingFeed({ enabled: false });
    assert.equal(feed.read(), null, "cold cache reads never start or await a network request");
    feed.stop();
  } finally { await harness.close(); }
});

test("home funding table renders SSR live values and only valid symbol tabs", async () => {
  const harness = await createSsrHarness();
  try {
    const html = harness.render("/", { funding: liveFunding });
    assert.match(html, /id="h7-funding"/);
    assert.match(html, /Binance/);
    assert.match(html, /Hyperliquid/);
    assert.match(html, /\+0\.0100%/);
    assert.match(html, /−0\.0013%/);
    assert.match(html, /\+11\.0%/);
    assert.match(html, /−11\.0%/);
    assert.match(html, /aria-label="Live funding rates · BTC"/);
    assert.doesNotMatch(html, /role="tab"[^>]*>ETH<\/button>/);
    assert.doesNotMatch(html, /h7-fr-row--wait/);
  } finally {
    await harness.close();
  }
});

test("public partner feed count follows the home partner registry", () => {
  const feed = buildPartnersFeed({ generatedAt });
  const by = Object.fromEntries(feed.partners.map((partner) => [partner.slug, partner]));
  assert.equal(feed.partners.length, HOME_PARTNERS.length);
  assert.deepEqual(feed.partners.map((partner) => partner.slug), HOME_PARTNERS);
  assert.equal(by.htx.inviteCode, "nexu888");
  assert.equal(by.coinw.inviteCode, "2296057");
});


test("home movers table is hidden until a live snapshot exists", async () => {
  const harness = await createSsrHarness();
  try {
    const noFeed = harness.render("/");
    assert.match(noFeed, /<section class="h7-in h7-mv" id="h7-movers"[^>]*hidden=""/);
    assert.match(noFeed, /<!--mv-end-->/, "worker splice marker remains available");

    const html = harness.render("/", { movers: liveMovers });
    const openTag = html.match(/<section class="h7-in h7-mv" id="h7-movers"[^>]*>/)?.[0] || "";
    assert.doesNotMatch(openTag, /hidden/);
    assert.match(html, /BTC/);
    assert.match(html, /ETH/);
  } finally {
    await harness.close();
  }
});

test("client refresh recovers missing home funding and hidden movers without hydration errors", async () => {
  const harness = await createSsrHarness();
  try {
    const html = SHELL_HTML.replace('<div id="root"></div>', `<div id="root">${harness.render("/")}</div>`);
    const requests = [];
    const observed = [];
    const hydrated = await hydrateInJsdom(harness.vite, html, "https://nexualpha.com/", {
      timeoutMs: 2500,
      intersectionObserver: class {
        constructor(callback) { this.callback = callback; }
        observe(target) { observed.push(target.id); this.callback([{ target, boundingClientRect: target.getBoundingClientRect(), isIntersecting: target.id === "h7-flash" || (target.id === "h7-movers" && !target.hidden) }]); }
        disconnect() {} unobserve() {}
      },
      fetchImpl: async (input) => {
        const path = String(input);
        requests.push(path);
        if (path === "/intel/funding-rates.json") return Response.json(liveFunding);
        if (path === "/api/movers.json") return Response.json(liveMovers);
        return new Response("{}", { status: 404 });
      },
      inspect: (window) => ({
        funding: window.document.querySelector("#h7-funding")?.textContent,
        moversHidden: window.document.querySelector("#h7-movers")?.hidden,
        movers: window.document.querySelector("#h7-movers")?.textContent,
      }),
    });
    assert.ok(requests.includes("/intel/funding-rates.json"), JSON.stringify({ requests, observed }));
    assert.ok(requests.includes("/api/movers.json"));
    assert.match(hydrated.inspected.funding, /\+0\.0100%/);
    assert.equal(hydrated.inspected.moversHidden, false);
    assert.match(hydrated.inspected.movers, /\+2\.50%/);
    assert.deepEqual(hydrationErrors(hydrated.errors), [], hydrated.errors.join("\n"));
  } finally { await harness.close(); }
});
