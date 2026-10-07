import assert from "node:assert/strict";
import test from "node:test";
import { reviewedBaseFeesByVenue } from "../src/data/reviewed-base-fees.js";
import { reviewedFeeCopy } from "../src/data/reviewed-fee-copy.js";

const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
const venueRates = Object.fromEntries(Object.entries(reviewedBaseFeesByVenue).map(([slug, record]) => [slug, record.rates[0]]));
const requiredSymbols = {
  binance: [/USDC/, /BNB|BNB|币安币|幣安幣/],
  bitget: [/BGB/],
  bybit: [/VIP 0/, /Adventure Zone/, /xStocks/, /My Fee Rate/],
};

test("reviewedFeeCopy returns native text for every supported locale and all reviewed fee records", () => {
  for (const locale of locales) {
    for (const [slug, rate] of Object.entries(venueRates)) {
      const copy = reviewedFeeCopy(rate, locale);
      assert.deepEqual(Object.keys(copy), ["tier", "scope", "conditions"]);
      assert.equal(typeof copy.tier, "string", `${locale}.${slug}.tier`);
      assert.equal(typeof copy.scope, "string", `${locale}.${slug}.scope`);
      assert.equal(typeof copy.conditions, "string", `${locale}.${slug}.conditions`);
      assert.ok(copy.tier.trim(), `${locale}.${slug}.tier text`);
      assert.ok(copy.scope.trim(), `${locale}.${slug}.scope text`);
      assert.ok(copy.conditions.trim(), `${locale}.${slug}.conditions text`);
      assert.ok(copy.conditions.split(/[.!。！？?؟]+/).filter(Boolean).length <= 2, `${locale}.${slug}.conditions is concise`);
      for (const pattern of requiredSymbols[slug]) {
        assert.match(`${copy.scope} ${copy.conditions}`, pattern, `${locale}.${slug} preserves required symbol ${pattern}`);
      }
    }
  }
});

test("reviewedFeeCopy does not fall back to English for non-English locales", () => {
  for (const locale of locales.filter((value) => value !== "en")) {
    for (const [slug, rate] of Object.entries(venueRates)) {
      const localized = reviewedFeeCopy(rate, locale);
      const english = reviewedFeeCopy(rate, "en");
      if (localized.tier !== "VIP 0") {
        assert.notEqual(localized.tier, english.tier, `${locale}.${slug}.tier`);
      }
      assert.notEqual(localized.scope, english.scope, `${locale}.${slug}.scope`);
      assert.notEqual(localized.conditions, english.conditions, `${locale}.${slug}.conditions`);
    }
  }
});

test("reviewedFeeCopy keeps the three reviewed scopes distinct", () => {
  for (const locale of locales) {
    const copies = Object.fromEntries(Object.entries(venueRates).map(([slug, rate]) => [slug, reviewedFeeCopy(rate, locale)]));
    assert.notEqual(copies.binance.scope, copies.bitget.scope, `${locale} Binance vs Bitget scope`);
    assert.notEqual(copies.binance.scope, copies.bybit.scope, `${locale} Binance vs Bybit scope`);
    assert.notEqual(copies.bitget.scope, copies.bybit.scope, `${locale} Bitget vs Bybit scope`);
    assert.match(copies.binance.scope + copies.binance.conditions, /USDC/);
    assert.match(copies.bitget.scope + copies.bitget.conditions, /BGB/);
    assert.match(copies.bybit.scope + copies.bybit.conditions, /Adventure Zone|xStocks/);
  }
});

test("reviewedFeeCopy returns neutral native copy for unknown tier and scope", () => {
  const unknown = { tierKey: "private-tier", scopeKey: "private-scope" };
  const en = reviewedFeeCopy(unknown, "en");
  assert.equal(en.tier, "Public source tier");
  assert.equal(en.scope, "Public source/account-confirmation range");
  assert.match(en.conditions, /official source/);

  for (const locale of locales.filter((value) => value !== "en")) {
    const copy = reviewedFeeCopy(unknown, locale);
    assert.notEqual(copy.tier, en.tier, `${locale}.unknown.tier`);
    assert.notEqual(copy.scope, en.scope, `${locale}.unknown.scope`);
    assert.notEqual(copy.conditions, en.conditions, `${locale}.unknown.conditions`);
    assert.doesNotMatch(`${copy.tier} ${copy.scope} ${copy.conditions}`, /Public source|official source|account-confirmation range/);
  }
});

test("reviewedFeeCopy resolves regional locale aliases without changing supported primary locale keys", () => {
  assert.deepEqual(reviewedFeeCopy(venueRates.binance, "zh-CN"), reviewedFeeCopy(venueRates.binance, "zh-Hans"));
  assert.deepEqual(reviewedFeeCopy(venueRates.bitget, "zh-TW"), reviewedFeeCopy(venueRates.bitget, "zh-Hant"));
  assert.deepEqual(reviewedFeeCopy(venueRates.bybit, "es-MX"), reviewedFeeCopy(venueRates.bybit, "es"));
});
