import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const main = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");

test("current route preload reuses App routeState before hydration", () => {
  assert.match(app, /export async function preloadCurrentRouteModulesForUrl\(initialUrl/);
  assert.match(app, /const route = routeState\(neutralVenueCatalog, initialUrl\)/);
  assert.match(app, /modulePathsForRoute\(route, initialUrl\)/);
  assert.doesNotMatch(app, /preloadCurrentRouteModulesForUrl[\s\S]*pathname\.match/);
});

test("browser hydration waits for current and browser URL route modules through a single-flight controller", () => {
  assert.match(main, /async function prepareCurrentRouteModules\(\{ retry = false \} = \{\}\)/);
  assert.match(main, /const urls = \[bootstrap\.initialUrl, bootstrap\.browserUrl\]/);
  assert.match(main, /await routePreparer\.prepare\(urls, \{ retry \}\)/);
  assert.match(main, /createHydrationOnceController\(\{[\s\S]*prepare: prepareCurrentRouteModules,[\s\S]*hydrate: \(\) => hydrateRoot\(root, app\)/);
  assert.match(main, /window\.nexualphaRetryHydration = \(\) => hydrationController\.retry\(\)/);
  assert.match(main, /delete window\.nexualphaRetryHydration/);
  assert.match(main, /route-preload-failed/);
});

test("deferred component wrapper reads preloaded module cache without React private lazy internals", () => {
  assert.match(app, /readRouteModuleExport\(path, exportName\)/);
  assert.doesNotMatch(app, /React\.lazy\(/);
  assert.doesNotMatch(app, /_payload|_init/);
});
