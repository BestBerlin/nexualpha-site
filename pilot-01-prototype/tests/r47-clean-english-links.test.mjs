import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { contextualHref } from "../src/data/contextual-href.js";
import { localizedHref } from "../src/data/locale-routing.js";

test("R47 English internal links use clean paths and remove legacy locale aliases", () => {
  const cases = [
    ["/?locale=en", "/"],
    ["/exchanges?locale=en", "/exchanges"],
    ["/news/okx-usd-to-usdc-spot-pair-migration?locale=en#sources", "/news/okx-usd-to-usdc-spot-pair-migration#sources"],
    ["/ja/exchanges/binance?locale=en&market=JP#registration-path", "/exchanges/binance?market=JP#registration-path"],
  ];

  for (const [input, expected] of cases) {
    assert.equal(localizedHref(input, { locale: "en" }), expected, input);
  }

  assert.equal(localizedHref("/compare/binance-vs-okx?locale=en", { locale: "EN" }), "/compare/binance-vs-okx");
  assert.equal(localizedHref("/compare/binance-vs-okx?locale=en", { locale: "en-US" }), "/compare/binance-vs-okx");
});

test("R47 non-English links retain path locale routing and controlled decision context", () => {
  assert.equal(
    contextualHref("/compare/binance-vs-okx?locale=en", {
      locale: "ja",
      market: "JP",
      product: "spot",
      account_stage: "ready",
      utm_source: "home",
    }),
    "/ja/compare/binance-vs-okx?account_stage=ready&utm_source=home&market=JP&product=spot",
  );

  assert.equal(
    contextualHref("/compare/binance-vs-okx?locale=en", {
      locale: "en",
      market: "SG",
      product: "spot",
      account_stage: "ready",
      funding: "FAST",
    }),
    "/compare/binance-vs-okx?account_stage=ready&funding=FAST&market=SG&product=spot",
  );
});

test("R47 unknown market and product sentinels never become English URL variants", () => {
  const href = contextualHref("/exchanges?locale=en", {
    locale: "en",
    market: "unknown",
    product: "unknown",
  });

  assert.equal(href, "/exchanges");
  assert.doesNotMatch(href, /[?&]locale=en(?:[&#]|$)/);
  assert.doesNotMatch(href, /[?&](?:market|product)=unknown(?:[&#]|$)/);
});

test("R47 client and worker regional source graphs do not hard-code English query locale", async () => {
  const [clientSeo, worker] = await Promise.all([
    readFile(new URL("../src/data/seo-injection.js", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.js", import.meta.url), "utf8"),
  ]);

  for (const [name, source] of [["client SEO graph", clientSeo], ["worker SEO graph", worker]]) {
    assert.doesNotMatch(source, /[?&]locale=en(?:[&#"']|$)/, `${name} must use the clean English route`);
    assert.match(source, /\/exchanges\?market=SG&product=spot/);
    assert.match(source, /\/rates\?market=SG&product=spot/);
    assert.match(source, /\/compare\/binance-vs-okx\?market=SG&product=spot/);
  }
});
