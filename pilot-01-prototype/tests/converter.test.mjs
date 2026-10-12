import test from "node:test";
import assert from "node:assert/strict";
import { converterCoins, converterCoin, converterPath, converterIndexable, converterVenues, FIATS, unitPrice, convertedAmount, QUICK_AMOUNTS, fiatSpotVenues, converterCopy } from "../src/data/converter.js";
import { coinSignup } from "../src/data/coins.js";
import { parseConverterPath } from "../src/data/converter-routes.js";
import { parsePublicRoute } from "../src/data/locale-routing.js";
import { modulePathsForRoute, ROUTE_MODULE_PATHS } from "../src/data/route-module-cache.js";

test("fixed top 30 coins and 12 fiat routes with strict syntax", () => {
  assert.equal(converterCoins().length, 30);
  assert.equal(FIATS.length, 12);
  assert.equal(converterPath(converterCoin("btc"), "USD"), "/convert/btc-to-usd");
  assert.deepEqual(parseConverterPath("/convert/btc-to-usd/"), { kind: "pair", symbol: "btc", fiat: "USD" });
  assert.equal(parseConverterPath("/coins/bitcoin"), null);
  for (const path of ["/convert", "/convert/btc-to-xxx", "/convert/BTC-to-usd", "/convert/btc-to-usd/more"]) assert.equal(parseConverterPath(path).kind, "missing");
  assert.equal(converterCoin("nonexistent"), null);
  for (const prefix of ["tr", "pt-br", "id-id", "vi", "ja", "ko", "zh-hans", "ar", "uk-ua"]) {
    assert.equal(parsePublicRoute(`/${prefix}/convert/btc-to-usd`).contentPathname, "/convert/btc-to-usd");
  }
});
test("only relevant locale markets index; unsupported market editions stay noindex", () => {
  const coin = converterCoin("btc");
  for (const [fiat, locale] of [["USD", "en"], ["EUR", "de"], ["BRL", "pt-BR"], ["TRY", "tr"], ["IDR", "id"], ["VND", "vi"], ["MXN", "es"], ["JPY", "ja"], ["KRW", "ko"], ["CNY", "zh-Hans"], ["GBP", "en"]]) assert.ok(converterIndexable(coin, fiat, locale));
  for (const [fiat, locale] of [["TRY", "en"], ["BRL", "es"], ["INR", "en"], ["USD", "ar"]]) assert.equal(converterIndexable(coin, fiat, locale), false);
  assert.equal(converterIndexable({ venues: [] }, "USD", "en"), false);
});
test("bidirectional conversion rejects invalid inputs and missing rates", () => {
  const fx = { rates: { EUR: 0.9, USD: 1 } };
  assert.equal(unitPrice(100, "EUR", fx), 90);
  assert.equal(unitPrice(100, "USD", null), 100);
  assert.equal(unitPrice(100, "JPY", fx), null);
  assert.equal(unitPrice(0, "USD", fx), null);
  assert.equal(unitPrice(Number.MAX_VALUE, "VND", { rates: { VND: Number.MAX_VALUE } }), null);
  assert.equal(convertedAmount("2", 90), 180);
  assert.equal(convertedAmount("180", 90, true), 2);
  assert.equal(convertedAmount("0", 90), 0);
  for (const value of ["", " ", "abc", "-1", "Infinity", "1e999"]) assert.equal(convertedAmount(value, 90), null);
  assert.equal(convertedAmount("1e308", 90), null);
  assert.deepEqual(QUICK_AMOUNTS.slice(0, 5), [0.01, 0.1, 1, 5, 10]);
});
test("on-ramp referrals require existing guidance and inherited geo gates", () => {
  const coin = converterCoin("btc");
  assert.deepEqual(converterVenues(coin, "JPY", { locale: "ja" }), []);
  assert.deepEqual(converterVenues(coin, "BRL", { locale: "ar" }), []);
  for (const venue of converterVenues(coin, "BRL", { locale: "en", market: "US" })) assert.ok(coinSignup(venue.slug, coin, { locale: "en", market: "US" }));
  for (const venue of converterVenues(coin, "BRL", { locale: "pt-BR" })) {
    assert.match(venue.signup.href, /^\/go\/(binance|okx)\?src=convert-btc-brl$/);
    assert.match(venue.guide, /^https:\/\//);
  }
  assert.deepEqual(fiatSpotVenues({ venues: [{ slug: "x", spot: ["USDT"] }] }, "USD"), []);
});
test("converter route uses one deferred module and fiat notes differ", () => {
  assert.deepEqual(modulePathsForRoute({ name: "converter" }), [ROUTE_MODULE_PATHS.converter]);
  for (const locale of ["en", "es", "fr", "de", "pt-BR", "tr", "id", "vi", "ja", "ko", "zh-Hans"]) {
    const t = converterCopy(locale);
    assert.equal(Object.keys(t.methods).length, 12);
    assert.equal(new Set(Object.values(t.methods)).size, 12);
  }
});
