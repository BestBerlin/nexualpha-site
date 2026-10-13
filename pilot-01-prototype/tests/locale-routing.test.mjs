import assert from "node:assert/strict";
import test from "node:test";

import {
  COUNTRY_ROUTE_PREFIXES,
  LOCALE_CODE_BY_PREFIX,
  LOCALE_PREFIX_BY_CODE,
  MIGRATED_PATH_LOCALES,
  isLocalePathEligible,
  legacyLocaleRedirect,
  localizedHref,
  localizedLanguageHref,
  localizedPath,
  parsePublicRoute,
} from "../src/data/locale-routing.js";

test("locale prefix contract is explicit and migrates every prefixed UI locale to path URLs", () => {
  assert.equal(LOCALE_PREFIX_BY_CODE.en, "");
  assert.equal(LOCALE_PREFIX_BY_CODE.ja, "ja");
  assert.equal(LOCALE_PREFIX_BY_CODE.ko, "ko");
  assert.equal(LOCALE_PREFIX_BY_CODE.ar, "ar");
  assert.equal(LOCALE_PREFIX_BY_CODE.tr, "tr");
  assert.equal(LOCALE_PREFIX_BY_CODE.id, "id-id");
  assert.equal(LOCALE_CODE_BY_PREFIX["id-id"], "id");
  assert.deepEqual([...MIGRATED_PATH_LOCALES], Object.keys(LOCALE_PREFIX_BY_CODE).filter((locale) => locale !== "en"));
});

test("global routes are eligible while country, embed and technical routes are excluded", () => {
  for (const pathname of ["/", "/exchanges/binance", "/compare/binance-vs-okx", "/topics/derivatives", "/factbook/bitcoin", "/activities", "/news", "/markets/turkiye", "/rates", "/onchain", "/methodology", "/partners", "/telegram"]) {
    assert.equal(isLocalePathEligible(pathname), true, pathname);
  }

  for (const pathname of ["/br", "/br/custos", "/mx", "/tw", "/id", "/id/crypto", "/vn", "/vn/crypto", "/hk", "/eu", "/uk", "/jp", "/kr", "/sg", "/int", "/ref/binance", "/api/v1/venues", "/assets/logo.svg", "/brand/mark.svg", "/content/feed.json", "/embed/calculator"]) {
    assert.equal(isLocalePathEligible(pathname), false, pathname);
  }

  assert.deepEqual(COUNTRY_ROUTE_PREFIXES.includes("/id"), true);
  assert.deepEqual(COUNTRY_ROUTE_PREFIXES.includes("/vn"), true);
  assert.deepEqual(COUNTRY_ROUTE_PREFIXES.includes("/sg"), true);
});

test("supported UI locales use path URLs for eligible global routes", () => {
  assert.equal(localizedPath("/exchanges/binance", "ja"), "/ja/exchanges/binance");
  assert.equal(localizedPath("/compare/binance-vs-okx", "ko"), "/ko/compare/binance-vs-okx");
  assert.equal(localizedPath("/exchanges/binance", "ar"), "/ar/exchanges/binance");
  assert.equal(localizedPath("/topics/derivatives", "tr"), "/tr/topics/derivatives");
  assert.equal(localizedPath("/markets/turkiye", "tr"), "/tr/markets/turkiye");
  assert.equal(localizedPath("/topics/derivatives", "fr"), "/fr/topics/derivatives");
  assert.equal(localizedPath("/rates", "zh-Hans"), "/zh-hans/rates");
  assert.equal(localizedPath("/rates", "pt-BR"), "/pt-br/rates");
  assert.equal(localizedPath("/rates", "id"), "/id-id/rates");
  assert.equal(localizedPath("/exchanges/binance", "en"), "/exchanges/binance");
  assert.equal(localizedPath("/br", "pt-BR"), "/br");
  assert.equal(localizedPath("/mx", "es"), "/mx");
  assert.equal(localizedPath("/mx", "en"), "/mx?locale=en");
  assert.equal(localizedPath("/embed/calculator", "ja"), "/embed/calculator?locale=ja");
  assert.equal(localizedHref("/embed/calculator", { locale: "ja" }), "/embed/calculator#nxa-context?locale=ja");
  assert.equal(localizedHref("/embed/calculator#fees", { locale: "ko" }), "/embed/calculator#fees?locale=ko");
  assert.equal(localizedHref("/mx", { locale: "en" }), "/mx#nxa-context?locale=en");
  assert.equal(localizedHref("/mx", { locale: "en", preserveQuery: true }), "/mx?locale=en");
  assert.equal(localizedLanguageHref("/br", { locale: "pt-BR" }), "/br");
  assert.equal(localizedLanguageHref("/mx", { locale: "es" }), "/mx");
  assert.equal(localizedLanguageHref("/mx", { locale: "ja" }), "/ja");
  assert.equal(localizedHref("https://partner.bitget.cafe/bg/C6PRAF", { locale: "fr" }), "https://partner.bitget.cafe/bg/C6PRAF");
  assert.equal(localizedHref("/exchanges?locale=en&market=BR", { locale: "fr" }), "/fr/exchanges#nxa-context?market=BR");
});

test("legacy Japanese, Korean, Arabic, Turkish and default-English query URLs redirect while preserving allowed context", () => {
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/zh-CN?market=CN&utm_source=direct&x=drop"), "/zh-hans?market=CN&utm_source=direct");
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/zh-Hans"), null);
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/zh-Hant"), null);
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/zh-CN/exchanges/binance?market=CN&utm_source=direct&x=drop"), "/zh-hans/exchanges/binance?market=CN&utm_source=direct");
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/zh-Hant/compare/binance-vs-okx?product=spot"), null);
  assert.equal(
    legacyLocaleRedirect("https://nexualpha.com/exchanges/binance?locale=ja&utm_source=telegram&market=JP&x=drop"),
    "/ja/exchanges/binance?utm_source=telegram&market=JP",
  );
  assert.equal(
    legacyLocaleRedirect("https://nexualpha.com/compare/binance-vs-okx?locale=ko&market=KR&product=spot&account_stage=kyc&funding=KRW%20bank%20transfer&utm_campaign=launch&x=drop"),
    "/ko/compare/binance-vs-okx?market=KR&product=spot&account_stage=kyc&funding=KRW+bank+transfer&utm_campaign=launch",
  );
  assert.equal(
    legacyLocaleRedirect("https://nexualpha.com/topics/derivatives?locale=tr&gclid=abc&fbclid=def&x=drop"),
    "/tr/topics/derivatives?gclid=abc&fbclid=def",
  );
  assert.equal(
    legacyLocaleRedirect("https://nexualpha.com/exchanges/binance?locale=ar&utm_source=telegram&market=AE&x=drop"),
    "/ar/exchanges/binance?utm_source=telegram&market=AE",
  );
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/?locale=ja"), "/ja");
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/?locale=ar"), "/ar");
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/?locale=en&utm_source=old"), "/?utm_source=old");
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/news/example?locale=en&market=OTHER&x=drop"), "/news/example?market=OTHER");
  assert.equal(
    legacyLocaleRedirect("https://nexualpha.com/compare/binance-vs-okx?locale=fr&market=FR&product=spot"),
    "/fr/compare/binance-vs-okx?market=FR&product=spot",
  );
  assert.equal(
    legacyLocaleRedirect("https://nexualpha.com/br?locale=ar&utm_source=telegram&market=BR&x=drop"),
    "/br?utm_source=telegram&market=BR",
  );
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/br?locale=pt-BR&market=BR"), null);
});

test("path locale parsing has priority over conflicting query locale for future rollout", () => {
  const route = parsePublicRoute("/ja/exchanges/binance", new URLSearchParams("locale=ko&market=JP"));
  assert.deepEqual(route, {
    publicPathname: "/ja/exchanges/binance",
    contentPathname: "/exchanges/binance",
    locale: "ja",
    localeSource: "path",
    isCountryRoute: false,
    canonicalPathname: "/ja/exchanges/binance",
  });

  assert.equal(
    legacyLocaleRedirect("https://nexualpha.com/ja/exchanges/binance?locale=ko&utm_source=telegram&market=JP&x=drop"),
    "/ja/exchanges/binance?utm_source=telegram&market=JP",
  );
});

test("country directory takes precedence over the Indonesian locale prefix collision", () => {
  assert.deepEqual(parsePublicRoute("/id", new URLSearchParams()), {
    publicPathname: "/id",
    contentPathname: "/id",
    locale: "id",
    localeSource: "market",
    isCountryRoute: true,
    canonicalPathname: "/id",
  });

  assert.deepEqual(parsePublicRoute("/id", new URLSearchParams("locale=ja")), {
    publicPathname: "/id",
    contentPathname: "/id",
    locale: "ja",
    localeSource: "query",
    isCountryRoute: true,
    canonicalPathname: "/id",
  });

  assert.deepEqual(parsePublicRoute("/id-id/exchanges", new URLSearchParams()), {
    publicPathname: "/id-id/exchanges",
    contentPathname: "/exchanges",
    locale: "id",
    localeSource: "path",
    isCountryRoute: false,
    canonicalPathname: "/id-id/exchanges",
  });
});

test("Vietnam country directory defaults to Vietnamese without becoming a locale prefix", () => {
  assert.deepEqual(parsePublicRoute("/vn", new URLSearchParams()), {
    publicPathname: "/vn",
    contentPathname: "/vn",
    locale: "vi",
    localeSource: "market",
    isCountryRoute: true,
    canonicalPathname: "/vn",
  });

  assert.deepEqual(parsePublicRoute("/vi/exchanges", new URLSearchParams()), {
    publicPathname: "/vi/exchanges",
    contentPathname: "/exchanges",
    locale: "vi",
    localeSource: "path",
    isCountryRoute: false,
    canonicalPathname: "/vi/exchanges",
  });
});

test("Japanese path routes are limited to eligible global content", () => {
  assert.deepEqual(parsePublicRoute("/ja/exchanges/binance", new URLSearchParams()), {
    publicPathname: "/ja/exchanges/binance",
    contentPathname: "/exchanges/binance",
    locale: "ja",
    localeSource: "path",
    isCountryRoute: false,
    canonicalPathname: "/ja/exchanges/binance",
  });
  assert.deepEqual(parsePublicRoute("/ar/exchanges/binance", new URLSearchParams()), {
    publicPathname: "/ar/exchanges/binance",
    contentPathname: "/exchanges/binance",
    locale: "ar",
    localeSource: "path",
    isCountryRoute: false,
    canonicalPathname: "/ar/exchanges/binance",
  });
  assert.equal(parsePublicRoute("/ja/api/v1/venues", new URLSearchParams()).contentPathname, "/ja/api/v1/venues");
  assert.equal(parsePublicRoute("/ja/br", new URLSearchParams()).contentPathname, "/ja/br");
});

test("localizedHref switches between path locales without carrying locale aliases or state params", () => {
  assert.equal(localizedHref("/ja/exchanges/binance?market=JP#registration-path", { locale: "ko" }), "/ko/exchanges/binance#registration-path?market=JP");
  assert.equal(localizedHref("/ja/exchanges/binance?market=JP#registration-path", { locale: "ar" }), "/ar/exchanges/binance#platform-facts?market=JP");
  assert.equal(localizedHref("/ja/exchanges/binance?market=JP#registration-path", { locale: "tr" }), "/tr/exchanges/binance#registration-path?market=JP");
  assert.equal(localizedHref("/ko/exchanges/binance?market=KR#registration-path", { locale: "fr" }), "/fr/exchanges/binance#registration-path?market=KR");
  assert.equal(localizedHref("/ja/exchanges/binance?market=JP#registration-path", { locale: "en" }), "/exchanges/binance#registration-path?market=JP");
  assert.equal(localizedHref("/exchanges/binance?market=JP#registration-path", { locale: "ja" }), "/ja/exchanges/binance#registration-path?market=JP");
  assert.equal(localizedHref("/markets/turkiye?market=TR", { locale: "tr" }), "/tr/markets/turkiye#nxa-context?market=TR");
  assert.equal(localizedHref("/compare/okx-vs-binance?market=BR&product=spot", { locale: "tr" }), "/tr/compare/binance-vs-okx#nxa-context?market=BR&product=spot");
  assert.equal(localizedHref("/compare/mexc-vs-gate-io?utm_source=gsc", { locale: "en" }), "/compare/gate-io-vs-mexc#nxa-context?utm_source=gsc");
  assert.equal(
    localizedHref("/ja/exchanges/binance?locale=ja&market=JP&utm_source=telegram#registration-path", { locale: "en", preserveQuery: true }),
    "/exchanges/binance?market=JP&utm_source=telegram#registration-path",
  );
});
