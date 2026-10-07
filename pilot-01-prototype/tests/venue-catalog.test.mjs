import assert from "node:assert/strict";
import test from "node:test";
import { mergeVenueCatalog, neutralVenueCatalog } from "../src/data/market-command.js";
import { venueDatabase } from "../src/data/venue-database.js";

test("partial Core coverage never removes the neutral directory", () => {
  const result = mergeVenueCatalog([{ slug: "binance", name: "Translated name", category: "CEX", sourceStatus: "VERIFIED", assetCapabilities: [{ assetClass: "CRYPTO" }] }]);
  assert.equal(result.length, Object.keys(venueDatabase).length);
  assert.equal(result.find((venue) => venue.slug === "binance").name, "Binance");
  assert.equal(result.find((venue) => venue.slug === "binance").sourceStatus, "VERIFIED");
  assert.deepEqual(result.find((venue) => venue.slug === "backpack"), neutralVenueCatalog.find((venue) => venue.slug === "backpack"));
  assert.equal(neutralVenueCatalog[0].sourceStatus, "UNKNOWN");
});

test("neutral discovery catalog stays aligned with the visible venue database", () => {
  const databaseSlugs = Object.keys(venueDatabase).sort();
  const neutralSlugs = neutralVenueCatalog.map((venue) => venue.slug).sort();
  assert.deepEqual(neutralSlugs, databaseSlugs);
});

test("empty and malformed responses preserve identities without inventing evidence", () => {
  for (const value of [null, [], {}, [null, {}, { slug: "invalid/route" }]]) {
    assert.deepEqual(mergeVenueCatalog(value), neutralVenueCatalog);
  }
  const result = mergeVenueCatalog([{ slug: "new-venue", name: "New venue", category: "DEX" }]);
  assert.equal(result.length, Object.keys(venueDatabase).length + 1);
  assert.equal(result.at(-1).sourceStatus, undefined);
});
