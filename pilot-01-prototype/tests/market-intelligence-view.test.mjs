import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { sentimentLabel } from "../src/content/sentiment-labels.js";
import { normalizeMarketIntelligence, unavailableMarketIntelligence, readableCryptoSentiment } from "../src/data/market-intelligence-view.js";

const source = {
  status: "available",
  provider: "Reviewed Market Provider",
  sourceUrl: "https://data.example.test/market",
  fetchedAt: "2026-09-05T10:00:00.000Z",
  freshness: "fresh",
  attribution: "Data provided by Reviewed Market Provider",
  reasonCode: null,
};

test("sentiment cannot crash formatting or present future or expired data", () => {
  const now = Date.parse("2026-09-05T10:00:00Z");
  const valid = { provider: "alternative-me", sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/", freshness: "fresh", value: 42, classification: "Fear", asOf: "2026-09-05T00:00:00Z" };
  assert.equal(readableCryptoSentiment(valid, now), true);
  for (const asOf of ["broken-date", "2026-09-06T00:00:00Z", "2026-09-01T00:00:00Z"]) {
    assert.equal(readableCryptoSentiment({ ...valid, asOf }, now), false);
  }
  assert.equal(readableCryptoSentiment({ ...valid, provider: "unknown" }, now), false);
  assert.equal(readableCryptoSentiment({ ...valid, value: 101 }, now), false);
});

test("sentiment classification is localized and refresh cancels obsolete reads", () => {
  const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
  for (const locale of locales) for (const classification of ["Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"]) assert.ok(sentimentLabel(classification, locale));
  assert.equal(sentimentLabel("Fear", "zh-Hans"), "恐惧");
  assert.equal(sentimentLabel("Fear", "zh-Hant"), "恐懼");
  const component = readFileSync(new URL("../src/components/market-rail/CryptoSentiment.jsx", import.meta.url), "utf8");
  assert.match(component, /\[refreshRevision\]/);
  assert.match(component, /active = false/);
  assert.match(component, /if \(active\) setSnapshot/);
  assert.match(component, /clearTimeout\(timeout\)/);
});

test("market view starts unavailable without inventing prices or volumes", () => {
  const view = unavailableMarketIntelligence();
  assert.equal(view.status, "unavailable");
  assert.deepEqual(view.assetPulse.data, []);
  assert.deepEqual(view.exchangeSnapshots.data, []);
  assert.deepEqual(view.exchangeSnapshotsBySlug, {});
  assert.equal(JSON.stringify(view).includes("0"), false);
});

test("market view keeps only source-bound known assets and venue slugs", () => {
  const view = normalizeMarketIntelligence(
    {
      ...source,
      quoteCurrency: "USD",
      data: [
        { symbol: "ETH", priceUsd: 4200, change24hPct: -1.25, asOf: "2026-09-05T09:59:00.000Z" },
        { symbol: "BTC", priceUsd: 120000, change24hPct: 2.5, asOf: "2026-09-05T09:59:00.000Z" },
        { symbol: "DOGE", priceUsd: 1, change24hPct: 99, asOf: "2026-09-05T09:59:00.000Z" },
      ],
    },
    {
      ...source,
      data: [
        { venueSlug: "binance", volume24hUsd: 10_000_000, volumeChange24hPct: 3.2, asOf: "2026-09-05T09:58:00.000Z" },
        { venueSlug: "unknown", volume24hUsd: 999, volumeChange24hPct: 99, asOf: "2026-09-05T09:58:00.000Z" },
      ],
    },
    ["binance", "coinbase"],
  );
  assert.equal(view.status, "available");
  assert.deepEqual(view.assetPulse.data.map((point) => point.symbol), ["BTC", "ETH"]);
  assert.deepEqual(Object.keys(view.exchangeSnapshotsBySlug), ["binance"]);
  assert.equal(view.exchangeSnapshotsBySlug.binance.volume24hUsd, 10_000_000);
});

test("malformed or unattributed available payloads collapse to unavailable", () => {
  const view = normalizeMarketIntelligence(
    { ...source, attribution: null, quoteCurrency: "USD", data: [{ symbol: "BTC", priceUsd: 1, change24hPct: 1, asOf: "2026-09-05T09:59:00.000Z" }] },
    { ...source, data: [{ venueSlug: "binance", volume24hUsd: null, volumeChange24hPct: null, asOf: "2026-09-05T09:58:00.000Z" }] },
    ["binance"],
  );
  assert.equal(view.status, "unavailable");
  assert.deepEqual(view.assetPulse.data, []);
  assert.deepEqual(view.exchangeSnapshots.data, []);
});
