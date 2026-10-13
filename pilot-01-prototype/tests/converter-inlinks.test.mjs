import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

import { converterCoins, converterIndexable, converterLocales, converterPath, FIATS, converterRelatedTargets } from "../src/data/converter.js";
import { localizedHref } from "../src/data/locale-routing.js";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";

function converterRoutes() {
  return FIATS.flatMap((fiat) => converterLocales(fiat).flatMap((locale) =>
    converterCoins()
      .filter((coin) => converterIndexable(coin, fiat, locale))
      .map((coin) => ({ coin, fiat, locale, path: localizedHref(converterPath(coin, fiat), { locale }) })),
  ));
}

function relatedConverterLinks(coin, fiat, locale) {
  const { relatedFiats, peers } = converterRelatedTargets(coin, fiat, locale);
  return [
    ...relatedFiats.map(({ code, locale: targetLocale }) => localizedHref(converterPath(coin, code), { locale: targetLocale })),
    ...peers.map((row) => localizedHref(converterPath(row, fiat), { locale })),
  ];
}

test("converter related-link graph gives every indexable converter at least three plain inlinks", () => {
  const routes = converterRoutes();
  const routeSet = new Set(routes.map((route) => route.path));
  const inbound = new Map(routes.map((route) => [route.path, new Set()]));

  for (const route of routes) {
    for (const target of relatedConverterLinks(route.coin, route.fiat, route.locale)) {
      assert.ok(routeSet.has(target), `${route.path} links only to served converter route: ${target}`);
      if (target !== route.path) inbound.get(target).add(route.path);
    }
  }

  const underlinked = [...inbound].filter(([, referrers]) => referrers.size < 3).map(([path, referrers]) => ({ path, inlinks: referrers.size }));
  assert.deepEqual(underlinked, []);
});

test("converter SSR emits only served converter related links and no commercial handoff links in the related nav", { timeout: 120_000 }, async (t) => {
  const harness = await createSsrHarness();
  t.after(() => harness.close());
  const html = await harness.render("https://nexualpha.com/convert/btc-to-usd");
  const doc = new JSDOM(typeof html === "string" ? html : html.html).window.document;
  const links = [...doc.querySelectorAll("[data-converter] nav a")].map((link) => link.getAttribute("href"));
  assert.ok(links.includes("/convert/btc-to-eur"), "same-coin cross-fiat links use the served English EUR route");
  assert.ok(links.includes("/convert/eth-to-usd"), "same-fiat links stay in the served English USD route set");
  assert.equal(links.some((href) => href.includes("/go/")), false);
  assert.equal(links.some((href) => href.includes("btc-to-inr") || href.includes("btc-to-try") || href.startsWith("/tr/convert/")), false);
});
