import assert from "node:assert/strict";
import test from "node:test";

import {
  ROUTE_MODULE_PATHS,
  clearRouteModuleCache,
  createHydrationOnceController,
  createHydrationRoutePreparer,
  modulePathsForRoute,
  preloadRouteModule,
  readRouteModuleExport,
  registerRouteModuleLoaders,
  routeModuleStatus,
} from "../src/data/route-module-cache.js";

const delayed = () => {
  let resolve;
  let reject;
  const promise = new Promise((ok, fail) => {
    resolve = ok;
    reject = fail;
  });
  return { promise, resolve, reject };
};

test.afterEach(() => {
  clearRouteModuleCache();
});

test("route module cache suspends while pending, then returns the preloaded export synchronously", async () => {
  const gate = delayed();
  let calls = 0;
  registerRouteModuleLoaders({
    "./current.jsx": () => {
      calls += 1;
      return gate.promise;
    },
    "./other.jsx": () => ({ Other: () => "other" }),
  });

  const preload = preloadRouteModule("./current.jsx");
  await Promise.resolve();
  assert.equal(calls, 1, "current route loader starts once");
  assert.equal(routeModuleStatus("./current.jsx"), "pending");

  assert.throws(
    () => readRouteModuleExport("./current.jsx", "Current"),
    (thrown) => thrown === preload,
    "pending current module throws the same promise React Suspense would catch",
  );
  assert.equal(routeModuleStatus("./other.jsx"), "idle", "unrelated route modules remain lazy");

  function Current() { return "current"; }
  gate.resolve({ Current });
  await preload;

  assert.equal(readRouteModuleExport("./current.jsx", "Current"), Current);
  assert.equal(calls, 1, "fulfilled module is reused synchronously");
});

test("retry during a pending load reuses the existing promise instead of starting a competing load", async () => {
  const first = delayed();
  let calls = 0;
  registerRouteModuleLoaders({
    "./pending.jsx": () => {
      calls += 1;
      return first.promise;
    },
  });

  const preload = preloadRouteModule("./pending.jsx");
  const retry = preloadRouteModule("./pending.jsx", { retry: true });
  assert.equal(preload, retry, "pending retry must reuse the in-flight load");
  await Promise.resolve();
  assert.equal(calls, 1, "retry while pending must not start a second loader");

  function Pending() { return "pending"; }
  first.resolve({ Pending });
  await retry;
  assert.equal(readRouteModuleExport("./pending.jsx", "Pending"), Pending);
  assert.equal(routeModuleStatus("./pending.jsx"), "fulfilled");
});

test("failed current-route preload leaves hydration caller in control and supports explicit retry", async () => {
  let attempt = 0;
  registerRouteModuleLoaders({
    "./flaky.jsx": () => {
      attempt += 1;
      if (attempt === 1) return Promise.reject(new Error("temporary chunk failure"));
      return Promise.resolve({ Flaky: () => "ready" });
    },
  });

  await assert.rejects(preloadRouteModule("./flaky.jsx"), /temporary chunk failure/);
  assert.equal(routeModuleStatus("./flaky.jsx"), "rejected");
  assert.throws(() => readRouteModuleExport("./flaky.jsx", "Flaky"), /temporary chunk failure/);

  await preloadRouteModule("./flaky.jsx", { retry: true });
  assert.equal(routeModuleStatus("./flaky.jsx"), "fulfilled");
  assert.equal(typeof readRouteModuleExport("./flaky.jsx", "Flaky"), "function");
  assert.equal(attempt, 2);
});

test("hydration preparer waits before hydrate and does not call ready on preload failure", async () => {
  const events = [];
  let fail = true;
  const preparer = createHydrationRoutePreparer({
    preloadForUrl: async (url, options = {}) => {
      events.push(["preload", url, Boolean(options.retry)]);
      if (fail) throw new Error("chunk unavailable");
    },
  });

  await assert.rejects(() => preparer.prepare(["https://nexualpha.com/exchanges/hyperliquid"]), /chunk unavailable/);
  assert.deepEqual(preparer.failedUrls(), ["https://nexualpha.com/exchanges/hyperliquid"]);
  assert.deepEqual(events, [["preload", "https://nexualpha.com/exchanges/hyperliquid", false]]);

  fail = false;
  await preparer.retry();
  assert.deepEqual(events, [
    ["preload", "https://nexualpha.com/exchanges/hyperliquid", false],
    ["preload", "https://nexualpha.com/exchanges/hyperliquid", true],
  ]);
});

test("route-to-module mapping keeps proven long SSR routes narrow", () => {
  // Venue and activity routes have independent hydration modules; compare keeps V3Pages.
  assert.deepEqual(modulePathsForRoute({ name: "venue" }), [ROUTE_MODULE_PATHS.venueDetail]);
  assert.deepEqual(modulePathsForRoute({ name: "compare" }), [ROUTE_MODULE_PATHS.v3Pages]);
  assert.deepEqual(modulePathsForRoute({ name: "activities" }), [ROUTE_MODULE_PATHS.activityPages]);
  // Perf lane 2026-10-11: the v7 home hydrates with no deferred module; the research drawer and closing index load
  // when they scroll near (DeferUntilVisible). The directory, news list and data pages became route modules, so the
  // routes that render them preload exactly their own module (expected values updated with that change).
  assert.deepEqual(modulePathsForRoute({ name: "home" }), []);
  assert.deepEqual(modulePathsForRoute({ name: "factbook" }), [ROUTE_MODULE_PATHS.factbook]);
  assert.deepEqual(modulePathsForRoute({ name: "methodology" }), [ROUTE_MODULE_PATHS.methodology]);
  assert.deepEqual(modulePathsForRoute({ name: "directory" }), [ROUTE_MODULE_PATHS.directory]);
  assert.deepEqual(modulePathsForRoute({ name: "newsList" }), [ROUTE_MODULE_PATHS.newsList]);
  assert.deepEqual(modulePathsForRoute({ name: "liquidations" }), [ROUTE_MODULE_PATHS.liquidations]);
  assert.deepEqual(modulePathsForRoute({ name: "fundingRates" }), [ROUTE_MODULE_PATHS.fundingRates]);
});


test("hydration controller is single-flight, hydrates once, clears failure, and can recover after preload failure", async () => {
  const events = [];
  let shouldFail = true;
  let hydrateCalls = 0;
  const controller = createHydrationOnceController({
    prepare: async ({ retry = false } = {}) => {
      events.push(["prepare", retry]);
      if (shouldFail) throw new Error("missing chunk");
    },
    hydrate: () => {
      hydrateCalls += 1;
      events.push(["hydrate"]);
      return { root: true };
    },
    onFailure: (error) => events.push(["failure", error.message]),
    onSuccess: () => events.push(["success"]),
  });

  const first = controller.start();
  const second = controller.start();
  assert.equal(first, second, "concurrent hydration starts should share one flight");
  await assert.rejects(first, /missing chunk/);
  assert.equal(controller.state(), "failed");
  assert.equal(hydrateCalls, 0, "hydrate must not touch SSR DOM after preload failure");

  shouldFail = false;
  const recovered = await controller.retry();
  const alreadyHydrated = await controller.start();
  assert.deepEqual(recovered, { root: true });
  assert.equal(alreadyHydrated, recovered, "successful hydration result is reused");
  assert.equal(hydrateCalls, 1, "hydrateRoot must run at most once");
  assert.deepEqual(events, [
    ["prepare", false],
    ["failure", "missing chunk"],
    ["prepare", true],
    ["hydrate"],
    ["success"],
  ]);
});
