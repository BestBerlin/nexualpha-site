import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { neutralVenueCatalog } from "../src/data/market-command.js";

const bundled = await build({
  entryPoints: [fileURLToPath(new URL("../src/data/site-data.ts", import.meta.url))],
  bundle: true, write: false, format: "esm", platform: "node",
  define: { "import.meta.env.PROD": "true", "import.meta.env.VITE_DATA_SOURCE": '"core"' },
});
const adapter = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);

function coreVenueFromNeutral(venue) {
  return {
    slug: venue.slug,
    name: venue.name,
    type: venue.category === "Perp DEX" ? "PERP_DEX" : venue.category,
    officialDomains: [venue.officialDomain],
    verifiedBrandKey: `official:${venue.slug}`,
    products: ["spot"],
    assetCapabilities: [],
    availability: { serviceState: "unknown" },
    source: { freshness: "VERIFIED" },
  };
}

const coreVenueSeed = neutralVenueCatalog.map(coreVenueFromNeutral);

function clientFor({ updates = [], bootstrapFails = false, venues = coreVenueSeed, feedsUnavailable = false } = {}) {
  const calls = { bootstrap: 0, opportunities: 0, venues: 0, venue: 0, listings: 0, officialUpdates: 0, assetPulse: 0, exchangeSnapshots: 0, resolveCommercial: 0 };
  const client = {
    calls,
    bootstrap: async () => { calls.bootstrap += 1; if (bootstrapFails) throw new Error("503"); return { contentVersion: { id: "integration-test-only" } }; },
    opportunities: async () => { calls.opportunities += 1; return { data: [] }; },
    venues: async () => { calls.venues += 1; return feedsUnavailable ? { status: "unavailable", data: [] } : { status: "available", data: venues }; },
    venue: async () => { calls.venue += 1; throw new Error("venue detail endpoint must not be called during full-site load"); },
    listings: async () => { calls.listings += 1; return { availability: "unavailable", reasonCode: "NO_COMPARABLE_AUTHORIZED_SOURCE", data: [] }; },
    officialUpdates: async () => { calls.officialUpdates += 1; return feedsUnavailable ? { status: "unavailable", data: [] } : { status: "available", data: updates }; },
    assetPulse: async () => { calls.assetPulse += 1; throw new Error("optional provider unavailable"); },
    exchangeSnapshots: async () => { calls.exchangeSnapshots += 1; throw new Error("optional provider unavailable"); },
    resolveCommercial: async () => { calls.resolveCommercial += 1; throw new Error("must not resolve without opportunity"); },
  };
  return client;
}

test("initial Core load only bootstraps the content version", async () => {
  const client = clientFor();
  const result = await adapter.loadCoreSiteView("zh-Hans", client);

  assert.equal(result.status, "ready");
  assert.equal(result.view.source, "core");
  assert.equal(result.view.venues.length, 0);
  assert.equal(result.view.contentVersion, "integration-test-only");
  assert.deepEqual(result.view.listings, []);
  assert.equal(result.view.featured.action.kind, "closed");
  assert.equal(result.view.market.status, "unavailable");
  assert.equal(client.calls.bootstrap, 1);
  assert.equal(client.calls.opportunities, 0);
  assert.equal(client.calls.venues, 0);
  assert.equal(client.calls.listings, 0);
  assert.equal(client.calls.officialUpdates, 0);
  assert.equal(client.calls.assetPulse, 0);
  assert.equal(client.calls.exchangeSnapshots, 0);
  assert.equal(client.calls.resolveCommercial, 0);
  assert.equal(client.calls.venue, 0);
});

test("configured route demand loads only the slices used by the active route", async () => {
  const client = clientFor();
  const result = await adapter.loadCoreSiteDataDemand(["venues", "officialUpdates"], client);

  assert.equal(result.venues.length, 25);
  assert.equal(result.venues.some((venue) => venue.slug === "drift"), true);
  assert.deepEqual(result.officialUpdates, []);
  assert.equal(client.calls.bootstrap, 0);
  assert.equal(client.calls.opportunities, 0);
  assert.equal(client.calls.venues, 1);
  assert.equal(client.calls.listings, 0);
  assert.equal(client.calls.officialUpdates, 1);
  assert.equal(client.calls.assetPulse, 0);
  assert.equal(client.calls.exchangeSnapshots, 0);
  assert.equal(client.calls.resolveCommercial, 0);
});

test("a genuinely unavailable backend stays unavailable, not a successful local mock", async () => {
  const result = await adapter.loadCoreSiteView("en", clientFor({ bootstrapFails: true }));

  assert.equal(result.status, "error");
  assert.equal(result.view, undefined);
});

test("the prerender unavailable signal skips Core requests", async () => {
  const client = clientFor();
  const result = await adapter.loadSiteView("en", { coreApi: "unavailable" });

  assert.equal(result.status, "error");
  assert.equal(result.view, undefined);
  assert.equal(client.calls.bootstrap, 0);
});

test("not_configured also skips Core requests before the browser adapter fetches", async () => {
  const result = await adapter.loadSiteView("en", { coreApi: "not_configured" });

  assert.equal(result.status, "error");
  assert.equal(result.view, undefined);
});

test("fixture, unreviewed and expired updates cannot appear through a bootstrap-only initial load", async () => {
  const published = {
    id: "test-only-current",
    title: "Test only",
    fixture: false,
    reviewStatus: "APPROVED",
    platform: { slug: "binance", name: "Binance" },
    officialSource: { type: "OFFICIAL", url: "https://www.binance.com/" },
    discoveredAt: "2026-01-01T00:00:00Z",
    verifiedAt: "2026-01-02T00:00:00Z",
    expiresAt: null,
  };
  const updates = [
    published,
    { ...published, id: "fixture", fixture: true },
    { ...published, id: "unreviewed", reviewStatus: "PENDING" },
    { ...published, id: "expired", expiresAt: "2026-01-03T00:00:00Z" },
  ];
  const result = await adapter.loadCoreSiteView("en", clientFor({ updates }));

  assert.equal(result.status, "ready");
  assert.deepEqual(result.view.officialUpdates.map((update) => update.id), []);
});
