import assert from "node:assert/strict";
import test from "node:test";
import { NEWS_INDEXABLE_LOCALES } from "../src/data/news-feed-client.js";
import { PRERENDER_LOCALES, routeInventory } from "../scripts/generate-prerender-manifest.mjs";

test("hyperliquid-dydx comparison adds one prerendered route per supported locale", () => {
  const inventory = routeInventory();
  const comparison = inventory.find((route) => route.pathname === "/compare/hyperliquid-vs-dydx");

  assert.ok(comparison);
  assert.equal(comparison.index, true);
  assert.equal(comparison.locales, undefined);

  const totalRoutes = inventory.reduce((sum, route) => sum + (route.locales || PRERENDER_LOCALES).length, 0);
  const routesWithoutComparison = inventory
    .filter((route) => route.pathname !== comparison.pathname)
    .reduce((sum, route) => sum + (route.locales || PRERENDER_LOCALES).length, 0);

  assert.equal(totalRoutes - routesWithoutComparison, PRERENDER_LOCALES.length);
  assert.equal(PRERENDER_LOCALES.length, 15);
});

test("news list route prerenders the reviewed content locales", () => {
  const route = routeInventory().find((item) => item.pathname === "/news");

  assert.ok(route);
  assert.equal(route.template, "newsList");
  assert.equal(route.index, true);
  assert.deepEqual(route.locales, NEWS_INDEXABLE_LOCALES);
  assert.deepEqual(route.locales, ["en", "zh-Hans"]);
});

test("Japan regional AEO page is indexed only in Japanese", () => {
  const route = routeInventory().find((item) => item.pathname === "/jp");

  assert.ok(route);
  assert.equal(route.index, true);
  assert.deepEqual(route.locales, ["ja"]);
});

test("Korea regional AEO page is indexed only in Korean", () => {
  const route = routeInventory().find((item) => item.pathname === "/kr");

  assert.ok(route);
  assert.equal(route.index, true);
  assert.deepEqual(route.locales, ["ko"]);
});

test("Taiwan and Indonesia regional routes prerender only their owner locales", () => {
  const cases = [
    ["/tw", ["zh-Hant"]],
    ["/id", ["id"]],
  ];

  for (const [pathname, locales] of cases) {
    const route = routeInventory().find((item) => item.pathname === pathname);

    assert.ok(route, pathname);
    assert.equal(route.template, "regionalPreview", pathname);
    assert.deepEqual(route.locales, locales, pathname);
  }
});

test("Singapore regional research route is indexed only in English", () => {
  const route = routeInventory().find((item) => item.pathname === "/sg");

  assert.ok(route);
  assert.equal(route.template, "regionalPreview");
  assert.equal(route.index, true);
  assert.deepEqual(route.locales, ["en"]);
});

test("Hong Kong regional research route is indexed only in Traditional Chinese", () => {
  const route = routeInventory().find((item) => item.pathname === "/hk");

  assert.ok(route);
  assert.equal(route.template, "regionalPreview");
  assert.equal(route.index, true);
  assert.deepEqual(route.locales, ["zh-Hant"]);
});

test("topics and factbook collection hubs are reviewed English collection routes", () => {
  const inventory = routeInventory();

  for (const [pathname, template] of [["/topics", "topicCollection"], ["/factbook", "factbookCollection"]]) {
    const route = inventory.find((item) => item.pathname === pathname);
    assert.ok(route, pathname);
    assert.equal(route.template, template, pathname);
    assert.equal(route.index, true, pathname);
    assert.deepEqual(route.locales, ["en"], pathname);
  }
});

test("factbook-only legacy venues stay out of exchange and research prerender routes", () => {
  const inventory = routeInventory();
  const pathnames = new Set(inventory.map((route) => route.pathname));

  for (const slug of ["htx", "hashkey", "aevo"]) {
    assert.equal(pathnames.has(`/exchanges/${slug}`), false, slug);
    assert.equal(pathnames.has(`/activities/research/${slug}`), false, slug);

    const factbook = inventory.find((route) => route.pathname === `/factbook/${slug}`);
    assert.ok(factbook, slug);
    assert.equal(factbook.index, true, slug);
    assert.equal(factbook.template, "factbook", slug);
  }
});
