import { licenseRecords } from "../src/data/licenses.js";
import assert from "node:assert/strict";
import test from "node:test";

import { buildScorecard, countryRankings, top200CoinCounts } from "../src/data/exchange-scorecards.js";

const NOW = "2026-10-13T04:00:00Z";
const rowByKey = (card, key) => card.rows.find((row) => row.key === key);
const valueFor = (row, slug) => row.values.find((value) => value.slug === slug);
const verdictByKey = (card, key) => card.verdicts.find((verdict) => verdict.key === key);

test("buildScorecard exposes deterministic pair rows without synthetic facts or CTA links", () => {
  const card = buildScorecard(["binance", "okx", "unknown"], { locale: "en", market: "br", now: NOW });
  assert.deepEqual(card.venues.map((venue) => venue.slug), ["binance", "okx", "unknown"]);
  assert.equal("ctas" in card, false);
  assert.equal(rowByKey(card, "appRatings"), undefined);

  const counts = rowByKey(card, "top200Coins");
  assert.equal(valueFor(counts, "binance").value, 135);
  assert.equal(valueFor(counts, "okx").value, 122);
  assert.equal(valueFor(counts, "unknown").value, null);
  assert.deepEqual(valueFor(counts, "binance").sources, ["/coins"]);

  const licenses = rowByKey(card, "licenses");
  assert.deepEqual(licenses.winners, []);
  const binanceLicenses = licenseRecords.filter((record) => record.exchange === "binance");
  assert.equal(valueFor(licenses, "binance").value, binanceLicenses.length);
  assert.match(valueFor(licenses, "binance").display, /SPK \(TR\): applied/);
  assert.match(valueFor(licenses, "binance").display, /Japan FSA \(JP\): registered/);
  const binanceSources = new Set(binanceLicenses.map((record) => record.sourceUrl));
  assert.ok(valueFor(licenses, "binance").sources.every((url) => url.startsWith("https://") && binanceSources.has(url)));
  assert.equal(valueFor(licenses, "unknown").value, null);
});

test("scorecards omit missing public dimensions and debug wording", () => {
  const card = buildScorecard(["binance", "okx"], { locale: "en", market: "br", now: NOW });
  const publicText = JSON.stringify(card);
  assert.equal(card.rows.some((row) => row.key === "appRatings"), false);
  assert.doesNotMatch(publicText, /repo slice|Not in repo|app-rating data file/i);
  assert.ok(card.verdicts.every((verdict) => !verdict.winners.includes("appRatings")));
});

test("scorecards hide any dimension with no public values", () => {
  const card = buildScorecard(["unknown-a", "unknown-b"], { locale: "en", market: "br", now: NOW });
  assert.equal(card.rows.some((row) => row.key === "appRatings"), false);
  assert.equal(card.rows.some((row) => row.values.every((item) => item.value == null)), false);
});

test("funding matrix participation is descriptive and never an observed venue coverage count", () => {
  const card = buildScorecard(["binance", "okx"], { locale: "en", market: "br", now: NOW });
  const funding = rowByKey(card, "fundingCoverage");
  assert.deepEqual(funding.winners, []);
  for (const item of funding.values) {
    assert.equal(item.value, true);
    assert.equal(item.observedCoverage, null);
    assert.match(item.display, /Included in funding-rate matrix/);
    assert.deepEqual(item.sources, ["/funding-rates"]);
  }
  assert.match(funding.rule, /no live observed pair count is inferred/);
});

test("campaign row requires a current campaign, not a registry signup promotion", () => {
  const card = buildScorecard(["binance", "okx"], { locale: "en", market: "br", now: NOW });
  const campaigns = rowByKey(card, "currentPromotion");
  assert.deepEqual(campaigns.winners, []);
  assert.equal(valueFor(campaigns, "binance").value, false);
  assert.equal(valueFor(campaigns, "binance").display, "No reviewed campaign offer");
  assert.deepEqual(valueFor(campaigns, "binance").sources, ["/activities"]);
});

test("verdicts use narrow deterministic rules instead of unioning descriptive row winners", () => {
  const card = buildScorecard(["binance", "okx"], { locale: "en", market: "br", now: NOW });
  assert.deepEqual(verdictByKey(card, "lowestFees").winners, ["okx"]);
  assert.deepEqual(verdictByKey(card, "mostCoins").winners, ["binance"]);
  assert.deepEqual(verdictByKey(card, "beginners").winners, ["binance", "okx"]);
  assert.match(verdictByKey(card, "futures").rule, /funding matrix participation is descriptive only/);
});

test("Türkiye rankings exclude promotion-gated venues while descriptive pair data remains available", () => {
  const pair = buildScorecard(["bitget", "okx"], { locale: "tr", market: "tr", now: NOW });
  assert.equal(valueFor(rowByKey(pair, "top200Coins"), "bitget").value > 0, true);
  assert.deepEqual(verdictByKey(pair, "beginners").winners, ["okx"]);

  const tr = countryRankings({ locale: "tr", now: NOW }).find((market) => market.key === "tr");
  assert.ok(tr);
  assert.equal(tr.venues.some((venue) => venue.slug === "bitget"), false);
  assert.equal(tr.rows.some((row) => row.values.every((item) => item.value == null)), false);
  for (const verdict of tr.verdicts) assert.equal(verdict.winners.some((venue) => venue.slug === "bitget"), false);
});

test("countryRankings returns the main market tables with numeric rows", () => {
  const markets = countryRankings({ locale: "en", now: NOW });
  // Vietnam is a no-promotion market since 2026-10-13 (Resolution 05/2025/NQ-CP): no ranking table.
  assert.deepEqual(markets.map((market) => market.key), ["tr", "id", "br", "mx", "latam"]);
  for (const market of ["tr", "id", "br", "mx"]) {
    const table = markets.find((item) => item.key === market);
    assert.ok(table?.venues?.length, market);
    assert.ok(table.rows.some((row) => row.key === "spotFees"), market);
    assert.ok(table.rows.some((row) => row.key === "top200Coins" && row.values.some((item) => typeof item.value === "number")), market);
    assert.ok(table.verdicts.every((verdict) => Array.isArray(verdict.winners)), market);
  }
});

test("top200CoinCounts keeps unknown venues null instead of scoring them as zero", () => {
  assert.deepEqual(top200CoinCounts(["binance", "not-a-venue"]), { binance: 135, "not-a-venue": null });
});
