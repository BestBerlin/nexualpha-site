import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const adapter = await readFile(new URL("../src/data/site-data.ts", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const featured = await readFile(new URL("../src/components/opportunity/FeaturedOpportunity.jsx", import.meta.url), "utf8");
const marketCommand = await readFile(new URL("../src/data/market-command.js", import.meta.url), "utf8");
const listings = await readFile(new URL("../src/components/listings/ListingsStream.jsx", import.meta.url), "utf8");

test("Shared Core adapter uses the existing SDK and all required v1 endpoints", () => {
  assert.match(adapter, /import \{ CoreClient \} from "\.\.\/\.\.\/\.\.\/backend\/src\/sdk\/core-client\.ts"/);
  for (const method of ["client.bootstrap(locale)", "client.opportunities()", "client.venues()", "client.listings()", "client.officialUpdates()", "client.assetPulse()", "client.exchangeSnapshots()", "client.resolveCommercial("]) assert.match(adapter, new RegExp(method.replace(/[()]/g, "\\$&")));
  assert.doesNotMatch(adapter, /client\.venue\(/, "the list already includes complete Venue records");
  assert.match(adapter, /item\.reviewStatus === "APPROVED" && item\.fixture === false/);
  assert.match(adapter, /resolveCommercial\(opportunityResponse\.data\[0\]!\.slug\)\.then\(\(response\) => response\.data\)/);
  assert.match(adapter, /const corePrefix = "\/api\/v1"/);
  assert.match(adapter, /type CoreVenue = Awaited<ReturnType<CoreClient\["venue"\]>>\["data"\]/);
  assert.match(adapter, /verifiedBrandKey: venue\.verifiedBrandKey/);
  assert.match(adapter, /capability\.reviewStatus === "VERIFIED" && capability\.fixture === false/);
  assert.match(adapter, /assetCapabilities: venue\.assetCapabilities\.filter/);
  assert.match(adapter, /listingsAvailability: listings\.availability/);
  assert.match(adapter, /normalizeMarketIntelligence/);
  assert.match(adapter, /assetPulse\(\)\.then\(\(response\) => response\.data\)\.catch\(\(\) => undefined\)/);
  assert.match(adapter, /exchangeSnapshots\(\)\.then\(\(response\) => response\.data\)\.catch\(\(\) => undefined\)/);
});

test("production cannot silently select mock data", () => {
  assert.match(adapter, /requested === "mock" && import\.meta\.env\.PROD/);
  assert.match(adapter, /return import\.meta\.env\.PROD \? "core" : "mock"/);
  assert.doesNotMatch(adapter, /catch[^{}]*\{[^{}]*mockSiteView/s);
});

test("site data keeps no durable browser cache and fails closed when Core is unavailable", () => {
  assert.doesNotMatch(adapter, /localStorage|sessionStorage|document\.cookie|cacheKey|function persist|function restore/);
  assert.match(adapter, /catch \{\s*return \{ status: "error" \};\s*\}/);
  assert.match(adapter, /commercial && commercial\.decision\.outcome === "ALLOW" && commercial\.cta/);
  assert.match(adapter, /return closed\("No offer"\)/);
  assert.doesNotMatch(adapter, /kind: "external"|href: commercial\.cta\.href/);
});

test("the React surface clears failed data and delegates commercial eligibility to the view model", () => {
  assert.match(app, /catch\(\(\) => \{\s*if \(!alive\) return;\s*setSiteView\(null\);\s*setDataStatus\("error"\)/);
  assert.match(app, /dataset\.dataSource = siteView\?\.source \?\? "local-research"/);
  assert.match(app, /setDataStatus\("error"\)/);
  assert.match(app, /presentationModel\(siteView, region, copy\)/);
  assert.doesNotMatch(featured, /href=|partner_link_click|opportunity_cta_click/);
  assert.doesNotMatch(app, /commercialStatus ===/);
});

test("Core venue and listing envelopes retain a closed neutral discovery fallback", () => {
  assert.match(marketCommand, /marketCommand\(copy, venueCatalog = \[\]\)/);
  assert.match(marketCommand, /neutralVenueCatalog/);
  assert.match(marketCommand, /\["backpack", "Backpack", "CEX", "backpack\.exchange"\]/);
  assert.match(app, /marketCommand\(copy, model\.venues\)/);
  assert.match(listings, /availability === "unavailable"/);
  assert.match(adapter, /NO_COMPARABLE_AUTHORIZED_SOURCE/);
});
