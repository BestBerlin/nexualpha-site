// Venue-graph perf lane (2026-10-11): /exchanges/<slug> is its own route module and chunk.
//  - the route-to-module map sends the venue route to VenueDetailPage.jsx (compare, activities, 404 keep V3Pages.jsx);
//  - in the built entry, the venue module's Vite preload list excludes the compare, activity and topic-guide graphs,
//    and the browser entry never imports the venue chunk statically (Vite's preload helper stays in the shell);
//  - DeferUntilVisible interactionOnly does not open on visibility, only on interaction or an already-open <details>;
//  - the venue page's stylesheet set is still allow-listed by the Worker for /exchanges/<slug>;
//  - SSR venue and home pages hydrate in jsdom without mismatches (en, it, ar).
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToString } from "react-dom/server";

import { ROUTE_MODULE_PATHS, modulePathsForRoute } from "../src/data/route-module-cache.js";
import viteConfig, { STYLESHEET_LINK_ORDER } from "../vite.config.mjs";
import { createSsrHarness, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const dist = new URL("../dist/client/", import.meta.url);
const built = existsSync(new URL("index.html", dist));

test("the venue route preloads its own module; compare, activities and 404 keep the V3 pages module", () => {
  assert.equal(ROUTE_MODULE_PATHS.venueDetail, "./components/v3/VenueDetailPage.jsx");
  assert.equal(ROUTE_MODULE_PATHS.venueResearch, "./components/v3/VenueDetailResearch.jsx");
  assert.deepEqual(modulePathsForRoute({ name: "venue" }), [ROUTE_MODULE_PATHS.venueDetail]);
  for (const name of ["compare", "compareHub", "activity", "activities", "notFound"]) assert.deepEqual(modulePathsForRoute({ name }), [ROUTE_MODULE_PATHS.v3Pages], name);
  const app = read("../src/App.jsx");
  for (const path of ["./components/v3/VenueDetailPage.jsx", "./components/v3/VenueDetailResearch.jsx"]) {
    assert.equal(app.match(new RegExp(`^  "${path.replace(/[./]/g, "\\$&")}",$`, "gm"))?.length, 2, `${path} is listed in the browser and the SSR glob`);
  }
  assert.match(app, /deferredComponent\("\.\/components\/v3\/VenueDetailPage\.jsx", "VenueDetailPage"\)/);
  assert.match(app, /researchComponent=\{VenueDetailResearch\} prefetchResearch=\{prefetchVenueResearch\}/);
  // The venue module itself must stay free of import.meta.env / import.meta.glob: server-side tests bundle it with esbuild.
  for (const file of ["../src/components/v3/VenueDetailPage.jsx", "../src/components/v3/VenueDetailResearch.jsx", "../src/components/v3/venue-detail-shared.jsx", "../src/components/v3/v3-pages-shared.jsx"]) {
    assert.doesNotMatch(read(file), /import\.meta/, file);
  }
  const venue = read("../src/components/v3/VenueDetailPage.jsx");
  assert.match(venue, /<DeferUntilVisible target="\.v3-profile-sources-group" interactionOnly prefetch=\{prefetchResearch\}>/);
  assert.doesNotMatch(venue, /from "\.\/VenueDetailResearch\.jsx"/, "the first screen never imports the research hub statically");
  assert.doesNotMatch(venue, /official-campaign|compare-generated|compare-direct-answers|TopicGuide|FactbookPage|activity\/ActivityPages/);
  assert.doesNotMatch(read("../src/components/v3/V3Pages.jsx"), /export function VenueDetailPage/);
});

test("vite config pins the venue graph: shared helpers, CSS-only route-v3-pages-* chunks and the preload helper", () => {
  const config = viteConfig({ command: "build", mode: "production", isSsrBuild: false });
  const manualChunks = config.build.rollupOptions.output.manualChunks;
  const getModuleInfo = () => ({ importedIds: [], importers: [], isExternal: false });
  const chunk = (id) => manualChunks(`/repo/pilot-01-prototype${id}`, { getModuleInfo });
  assert.equal(manualChunks("\u0000vite/preload-helper.js", { getModuleInfo }), "core-ui");
  assert.equal(chunk("/src/components/v3/VenueDetailPage.jsx"), "route-v3-venue");
  assert.equal(chunk("/src/components/v3/venue-detail-shared.jsx"), "route-v3-venue");
  assert.equal(chunk("/src/components/v3/VenueDetailResearch.jsx"), "route-v3-venue-research");
  assert.equal(chunk("/src/components/shared/json-polling.js"), "shared-json-polling");
  assert.equal(chunk("/src/components/v3/v3-pages-shared.jsx"), "route-v3-pages-shared");
  assert.equal(chunk("/src/components/v3/TelegramReturnBanner.jsx"), "route-v3-pages-return-banner");
  assert.equal(chunk("/src/components/v3/telegram-return-banner.css"), "route-v3-pages-return-banner");
  assert.equal(chunk("/src/components/v3/profile-density.css"), "route-v3-pages-detail");
  assert.equal(chunk("/src/components/v3/HyperliquidFeeScenario.css"), "route-v3-pages-detail");
  assert.equal(chunk("/src/components/v3/growth-conversion.css"), "route-v3-pages-growth");
  assert.equal(chunk("/src/components/v3/activity/campaign-copy.js"), "data-campaign-copy");
  assert.equal(chunk("/src/components/v3/activity/ActivityPages.jsx"), "route-activity");
  for (const id of ["/src/data/reviewed-fee-copy.js", "/src/data/venue-fee-summary.js", "/src/data/reviewed-base-fees.js", "/src/data/public-copy-sanitizer.js", "/src/data/contextual-href.js", "/src/data/plural-copy.js", "/src/utils/fallback-lang.js", "/src/utils/venue-name-helper.js", "/src/components/v3/exchange-matrix-copy.js"]) {
    assert.equal(chunk(id), "shared-venue-copy", id);
  }
  assert.equal(chunk("/src/data/trading-bleed-feedback.js"), "shared-copy-feedback");
  for (const id of ["/src/components/v3/ExchangeFactsV5.jsx", "/src/components/v6/InnerLedger.jsx", "/src/components/v6/inner-r9-copy.js", "/src/lib/v5/Reveal.jsx"]) assert.equal(chunk(id), "shared-exchange-facts", id);
  // Cascade: the split stylesheets sit where their rules used to be (growth after route-v3-home; detail and the return
  // banner right after route-v3-pages, before the directory chunk).
  const at = (name) => STYLESHEET_LINK_ORDER.indexOf(name);
  assert.equal(at("route-v3-pages-growth"), at("route-v3-home") + 1);
  assert.equal(at("route-v3-pages-detail"), at("route-v3-pages") + 1);
  assert.equal(at("route-v3-pages-return-banner"), at("route-v3-pages") + 2);
  assert.equal(at("route-v3-pages-directory"), at("route-v3-pages") + 3);
});

test("the Worker keeps linking the venue page's stylesheets (all route-v3-pages-* chunks on /exchanges/<slug>)", () => {
  const worker = read("../worker/index.js");
  const venueList = worker.match(/\[VENUE_ROUTE_MARKER\]: \[([^\]]*)\]/)?.[1] ?? "";
  const venuePathList = worker.match(/if \(pathname\.startsWith\("\/exchanges\/"\)\) return \[([^\]]*)\]/)?.[1] ?? "";
  assert.ok(venuePathList.includes("...SHARED_ROUTE_STYLE_PREFIXES"));
  for (const prefix of ["page-profile-", "page-detail-", "route-v3-pages-", "route-v3-registration-", "route-v3-readiness-", "route-activity-", "route-licenses-"]) {
    assert.ok(venueList.includes(`"${prefix}"`), `marker includes ${prefix}`);
    assert.ok(venuePathList.includes(`"${prefix}"`), `venue path includes ${prefix}`);
  }
  for (const name of ["route-v3-pages-detail", "route-v3-pages-growth", "route-v3-pages-return-banner", "route-v3-pages-shared"]) assert.ok(name.startsWith("route-v3-pages-"), name);
});

// Reads the Vite preload dependency list (__vite__mapDeps) that the built entry attaches to a route module's dynamic import.
export function routePreloadList(entrySource, modulePath) {
  const table = entrySource.match(/m\.f\|\|\(m\.f=(\[[^\]]*\])\)/);
  if (!table) throw new Error("__vite__mapDeps table not found in the entry");
  const files = JSON.parse(table[1]).map((file) => file.replace(/^assets\//, ""));
  const escaped = modulePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = entrySource.match(new RegExp(`"${escaped}":\\(\\)=>\\w+\\(\\(\\)=>import\\("\\./([\\w.-]+\\.js)"\\)(?:\\.then\\([^)]*\\))?,__vite__mapDeps\\(\\[([\\d,]*)\\]\\)`));
  if (!match) throw new Error(`dynamic import of ${modulePath} not found in the entry`);
  return [...new Set([match[1], ...match[2].split(",").filter(Boolean).map((index) => files[Number(index)])])];
}

test("built entry: the venue route's preload list excludes the compare, activity and topic-guide graphs", { skip: !built && "run after `npm run build`" }, () => {
  const assets = readdirSync(new URL("assets/", dist));
  const entry = assets.find((name) => /^index-[\w-]+\.js$/.test(name));
  const source = readFileSync(new URL(`assets/${entry}`, dist), "utf8");
  const venue = routePreloadList(source, "./components/v3/VenueDetailPage.jsx");
  const chunkNames = venue.map((file) => file.replace(/-[\w-]{8}\.(?:js|css)$/, ""));
  assert.ok(chunkNames.includes("route-v3-venue"), "venue chunk is the module's own chunk");
  for (const forbidden of ["route-activity", "route-v3-pages", "route-topic-guide", "route-factbook", "route-collection-hubs", "route-v3-home", "route-v3-wizard", "route-v3-calculators", "route-rates", "home-below-fold", "route-v3-venue-research", "data-compare-generated", "data-compare-direct-answers", "data-compare-faq-locales", "data-topic-guides", "data-factbook", "data-aeo-questions", "data-official-research"]) {
    assert.ok(!chunkNames.includes(forbidden), `${forbidden} must not preload with the venue route (got ${chunkNames.join(", ")})`);
  }
  assert.ok(chunkNames.includes("route-v3-pages-detail") && chunkNames.includes("route-v3-pages-growth"), "venue CSS-only chunks ride along");
  // The research hub chunk is fetched only when the disclosure opens.
  const research = routePreloadList(source, "./components/v3/VenueDetailResearch.jsx");
  assert.ok(research.some((file) => file.startsWith("route-v3-venue-research-")), "research hub has its own chunk");
  // The shell never imports the venue chunk statically (Vite's preload helper lives in core-ui).
  assert.doesNotMatch(source, /from"\.\/route-v3-venue-[\w-]+\.js"/);
  assert.doesNotMatch(source, /import"\.\/route-(?:v3-venue|activity|factbook|topic-guide)-[\w-]+\.js"/);
  const html = readFileSync(new URL("index.html", dist), "utf8");
  const linked = [...html.matchAll(/rel="stylesheet" crossorigin href="\/assets\/([\w-]+)-[\w-]{8}\.css"/g)].map((m) => m[1]);
  for (const name of ["route-v3-pages", "route-v3-pages-detail", "route-v3-pages-growth", "route-v3-pages-return-banner", "route-v3-pages-directory"]) assert.ok(linked.includes(name), `${name} stylesheet linked in index.html`);
  assert.ok(linked.indexOf("route-v3-pages-growth") < linked.indexOf("route-v3-pages"), "growth styles keep their early (route-v3-home) slot");
});

let harness;
test.after(async () => { await harness?.close(); });

test("DeferUntilVisible interactionOnly renders the server HTML and opens only on interaction or an open <details>", async () => {
  harness ??= await createSsrHarness();
  const { DeferUntilVisible, DEFER_OPEN_EVENTS } = await harness.vite.ssrLoadModule("/src/components/shared/DeferUntilVisible.jsx");
  const html = renderToString(React.createElement(DeferUntilVisible, { target: ".x", interactionOnly: true }, React.createElement("details", { className: "x" }, React.createElement("summary", null, "s"), "deferred body")));
  assert.match(html, /<!--\$-->/);
  assert.match(html, /deferred body/);
  const source = read("../src/components/shared/DeferUntilVisible.jsx");
  assert.match(source, /interactionOnly && element\.open/, "an already-open disclosure hydrates at once");
  assert.match(source, /const observer = interactionOnly \? null : new IntersectionObserver/);
  assert.ok(DEFER_OPEN_EVENTS.includes("toggle") && DEFER_OPEN_EVENTS.includes("pointerdown"));
});

test("SSR venue and home pages hydrate without mismatches in en, it and ar", async () => {
  harness ??= await createSsrHarness();
  const cases = [
    ["/exchanges/okx", "en"], ["/it/exchanges/okx", "it"], ["/ar/exchanges/okx", "ar"],
    ["/", "en"], ["/it", "it"], ["/ar", "ar"],
  ];
  for (const [path, locale] of cases) {
    const html = await harness.render(path);
    const document = `<!doctype html><html><head><title>t</title></head><body><div id="root">${html}</div></body></html>`;
    const pageUrl = `https://nexualpha.com${path}`;
    const { errors } = await hydrateInJsdom(harness.vite, document, pageUrl, { timeoutMs: 600 });
    assert.deepEqual(hydrationErrors(errors), [], `${path} (${locale}): ${errors.join("\n")}`);
    if (path.includes("/exchanges/")) {
      assert.match(html, /class="v3-profile-sources-group"/, `${path}: sources hub rendered on the server`);
      assert.match(html, /v3-venue-metrics-grid/, `${path}: hub body (metrics) is complete in SSR HTML`);
      assert.match(html, /class="v3-mobile-sticky-bar/, `${path}: sticky bar`);
    } else {
      // ar is a neutral locale: information-only home without the rebate card (lead 2026-10-13).
      if (locale === "ar") assert.doesNotMatch(html, /class="h7-lg"/, `${path}: neutral home has no rebate card`);
      else assert.match(html, /class="[^"]*h7-lg[^"]*hx-hero-panel/, `${path}: hero rebate panel`);
    }
  }
});
