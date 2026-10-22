// Perf lane 2026-10-11: the browser entry must stay small and the server HTML complete.
//  - the client build drops the SSR-only eager globs (they used to make every route chunk a static import);
//  - route-matching slug lists mirror their heavy data sources without importing them;
//  - every emitted stylesheet is re-linked in index.html in the historical cascade order;
//  - DeferUntilVisible renders its children on the server for non-home deferred routes;
//  - the SSR home still contains the lower-half text through StableHomeBelowFold without restoring the old research/closing link walls.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calcSay } from "../src/components/v7/home7-hero-volume.js";
import React from "react";
import { renderToString } from "react-dom/server";
import { createServer as createViteServer } from "vite";

import viteConfig, { STYLESHEET_LINK_ORDER, dropSsrEagerGlobForClient, orderStylesheetFiles, relinkStylesheets, stylesheetChunkName } from "../vite.config.mjs";
import { TOPIC_SLUGS } from "../src/data/topic-slugs.js";
import { TOPIC_GUIDES } from "../src/data/topic-guides-data.js";
import { TOKENIZED_ASSET_SLUGS } from "../src/data/tokenized-asset-slugs.js";
import { TOKENIZED_ASSET_PAGES } from "../src/data/tokenized-assets-cluster.js";
import { DATA_PAGE_NAV, dataPageCopy as navDataPageCopy } from "../src/data/market-data-pages-nav.js";
import { DATA_PAGE_LOCALES, dataPageCopy } from "../src/data/market-data-pages.js";
import { getTelegramDeepLink as deepLinkFromPayloadModule } from "../src/data/telegram-start-payload.js";
import { TELEGRAM_CONFIG, getTelegramDeepLink } from "../src/data/telegram-config.js";
import { OFFICIAL_RESEARCH_DOMAINS, officialResearchUrl, researchRoute } from "../src/data/official-campaign-model.js";
import * as researchRouteModule from "../src/data/official-research-route.js";
import { ROUTE_MODULE_PATHS, modulePathsForRoute } from "../src/data/route-module-cache.js";
import { h7Copy } from "../src/components/v7/home7-copy.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("client builds drop the SSR-only eager globs while the SSR branch keeps them", () => {
  const source = `const a = import.meta.env.SSR ? import.meta.glob([
  "./components/v3/V3Pages.jsx",
  "./components/v3/LeanHero.jsx",
], { eager: true }) : {};
const b = import.meta.env.SSR ? {} : import.meta.glob(["./components/v3/V3Pages.jsx"]);
const c = import.meta.env.SSR ? import.meta.glob("./x.jsx", { eager: true }) : {};`;
  const client = dropSsrEagerGlobForClient(source);
  assert.ok(client);
  assert.doesNotMatch(client, /eager: true/);
  assert.match(client, /const a = import\.meta\.env\.SSR \? \{\} : \{\};/);
  assert.match(client, /const c = import\.meta\.env\.SSR \? \{\} : \{\};/);
  assert.match(client, /import\.meta\.glob\(\["\.\/components\/v3\/V3Pages\.jsx"\]\)/, "the lazy browser glob is untouched");
  assert.equal(dropSsrEagerGlobForClient("export const x = 1;"), null);
  const config = viteConfig({ command: "build", mode: "production", isSsrBuild: false });
  const plugin = config.plugins.find((entry) => entry?.name === "nexualpha-client-drops-ssr-eager-glob");
  assert.ok(plugin, "plugin registered");
  assert.equal(plugin.enforce, "pre", "must run before Vite expands import.meta.glob");
  assert.equal(plugin.transform(source, "/x/src/App.jsx", { ssr: true }), null, "SSR transform keeps the eager glob");
  assert.ok(plugin.transform(source, "/x/src/App.jsx", { ssr: false })?.code.includes("import.meta.env.SSR ? {} : {}"));
  assert.equal(plugin.transform(source, "/x/src/styles.css", { ssr: false }), null);
});

test("App.jsx and HomeV7 keep the SSR eager glob pattern the client plugin strips", async () => {
  for (const file of ["../src/App.jsx", "../src/components/v7/HomeV7.jsx"]) {
    const source = await read(file);
    assert.match(source, /import\.meta\.env\.SSR \? import\.meta\.glob\(\[[\s\S]*?\], \{ eager: true \}\) : \{\}/, file);
    assert.ok(dropSsrEagerGlobForClient(source), `${file} eager glob is recognised by the client transform`);
  }
  const closingBand = await read("../src/components/v6/ClosingBand.jsx");
  assert.doesNotMatch(closingBand, /import\.meta\.glob/, "ClosingBand no longer owns an eager SSR module table");
});

test("route-matching slug lists mirror their data sources", () => {
  assert.deepEqual([...TOPIC_SLUGS], Object.keys(TOPIC_GUIDES));
  assert.deepEqual([...TOKENIZED_ASSET_SLUGS], Object.keys(TOKENIZED_ASSET_PAGES));
});

test("data-page navigation projection matches the full copy module for every locale", () => {
  for (const locale of DATA_PAGE_LOCALES) {
    assert.deepEqual(navDataPageCopy(locale).nav, dataPageCopy(locale).nav, locale);
    assert.equal(DATA_PAGE_NAV[locale], dataPageCopy(locale).nav);
  }
  assert.deepEqual(navDataPageCopy("xx").nav, dataPageCopy("en").nav);
  assert.deepEqual(navDataPageCopy("zh-TW").nav, dataPageCopy("zh-Hans").nav);
});

test("Telegram deep links and official research helpers are re-exported unchanged", () => {
  assert.equal(getTelegramDeepLink, deepLinkFromPayloadModule);
  assert.equal(getTelegramDeepLink({ action: "compare", pair: "binance-vs-okx" }), `${TELEGRAM_CONFIG.botUrl}?start=compare_binance-vs-okx`);
  assert.equal(getTelegramDeepLink(""), TELEGRAM_CONFIG.botUrl);
  assert.equal(researchRoute, researchRouteModule.researchRoute);
  assert.equal(officialResearchUrl, researchRouteModule.officialResearchUrl);
  assert.equal(OFFICIAL_RESEARCH_DOMAINS, researchRouteModule.OFFICIAL_RESEARCH_DOMAINS);
  assert.equal(officialResearchUrl("https://www.okx.com/help/x", "okx"), "https://www.okx.com/help/x");
  assert.equal(officialResearchUrl("https://evil.example/okx", "okx"), null);
  assert.deepEqual(researchRoute("/activities/research/okx", [{ slug: "okx" }]), { name: "research", slug: "okx" });
});

test("the shell no longer imports the heavy data modules directly", async () => {
  const app = await read("../src/App.jsx");
  assert.doesNotMatch(app, /from "\.\/data\/official-campaign-model"/);
  assert.doesNotMatch(app, /from "\.\/data\/topic-guides-data\.js"/);
  assert.doesNotMatch(app, /from "\.\/data\/tokenized-assets-cluster\.js"/);
  assert.doesNotMatch(app, /from "\.\/data\/market-data-pages\.js"/);
  assert.doesNotMatch(app, /^import \{ injectSeoMetadata \}/m);
  // seo-payload lane 2026-10-11: the route SEO tables left the browser graph entirely; the client asks /api/route-seo.
  assert.doesNotMatch(app, /seo-injection\.js/, "App.jsx must not load the route SEO tables in the browser");
  assert.match(app, /import \{ syncRouteSeo \} from "\.\/data\/route-seo-client\.js"/, "route-scoped SEO client is the only injector");
  assert.match(app, /import \{ researchRoute \} from "\.\/data\/official-research-route\.js"/);
  const shortlist = await read("../src/data/regional-shortlist.js");
  assert.match(shortlist, /from "\.\/telegram-start-payload\.js"/);
  const intel = await read("../src/data/announcement-intel.js");
  assert.match(intel, /from "\.\/official-research-route\.js"/);
  assert.deepEqual(modulePathsForRoute({ name: "home" }), [], "home hydrates without deferred modules");
  assert.deepEqual(modulePathsForRoute({ name: "directory" }), [ROUTE_MODULE_PATHS.directory]);
});

test("stylesheets are re-linked in the historical cascade order", () => {
  assert.equal(stylesheetChunkName("assets/route-v3-pages-Dd6e5NGP.css"), "route-v3-pages");
  const ordered = orderStylesheetFiles([
    "assets/page-telegram-late-AAAAAAAA.css", "assets/index-BBBBBBBB.css", "assets/route-v3-pages-CCCCCCCC.css",
    "assets/route-future-DDDDDDDD.css", "assets/route-v3-registration-EEEEEEEE.css", "assets/page-home-early-FFFFFFFF.css",
    "assets/route-v3-pages-strip-GGGGGGGG.css",
  ]).map(stylesheetChunkName);
  assert.deepEqual(ordered, ["route-v3-registration", "route-v3-pages-strip", "route-v3-pages", "route-future", "page-home-early", "index", "page-telegram-late"]);
  assert.ok(STYLESHEET_LINK_ORDER.indexOf("route-v3-pages") < STYLESHEET_LINK_ORDER.indexOf("page-home-early"));
  assert.ok(STYLESHEET_LINK_ORDER.indexOf("route-news-commission") < STYLESHEET_LINK_ORDER.indexOf("route-v3-pages"), "split route styles precede their former host stylesheet");
  assert.ok(STYLESHEET_LINK_ORDER.indexOf("index") < STYLESHEET_LINK_ORDER.indexOf("core-b"));
  const html = `<!doctype html><html><head>
    <script type="module" crossorigin src="/assets/index-x.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/vendor-react-x.js">
    <link rel="stylesheet" crossorigin href="/assets/index-BBBBBBBB.css">
    <link rel="stylesheet" crossorigin href="/assets/core-b-CCCCCCCC.css">
  </head><body><div id="root"></div></body></html>`;
  const relinked = relinkStylesheets(html, ["assets/route-v3-pages-DDDDDDDD.css", "assets/index-BBBBBBBB.css", "assets/shared-decision-return-EEEEEEEE.css"]);
  const hrefs = [...relinked.matchAll(/rel="stylesheet" crossorigin href="\/assets\/([\w-]+)\.css"/g)].map((m) => m[1].replace(/-[\w-]{8}$/, ""));
  assert.deepEqual(hrefs, ["shared-decision-return", "route-v3-pages", "index", "core-b"]);
  assert.equal((relinked.match(/rel="stylesheet"/g) || []).length, 4, "no duplicate links");
  assert.ok(relinked.indexOf('rel="modulepreload"') < relinked.indexOf('rel="stylesheet"'), "links follow the module scripts");
});

let vite;
async function loadModule(path) {
  if (!vite) vite = await createViteServer({
    appType: "custom", logLevel: "error",
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  return vite.ssrLoadModule(path);
}
async function renderRoute(url) {
  const { render } = await loadModule("/src/entry-server.jsx");
  return render(url);
}
test.after(async () => { await vite?.close(); });

test("DeferUntilVisible renders its children inside a Suspense boundary on the server", async () => {
  const { DeferUntilVisible, createVisibilityGate, DEFER_OPEN_EVENTS } = await loadModule("/src/components/shared/DeferUntilVisible.jsx");
  const html = renderToString(React.createElement(DeferUntilVisible, { target: "#x" }, React.createElement("section", { id: "x" }, "deferred text")));
  assert.match(html, /<!--\$-->/, "Suspense boundary marker lets the browser leave the server HTML dehydrated");
  assert.match(html, /<section id="x">deferred text<\/section>/);
  const gate = createVisibilityGate();
  assert.equal(gate.open, false);
  let settled = false;
  gate.promise.then(() => { settled = true; });
  gate.release();
  gate.release();
  await gate.promise;
  assert.equal(gate.open, true);
  assert.equal(settled, true);
  assert.deepEqual([...DEFER_OPEN_EVENTS], ["pointerdown", "keydown", "focusin", "toggle"]);
  const source = await read("../src/components/shared/DeferUntilVisible.jsx");
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /throw gate\.promise/);
});

const textOf = (html) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

test("SSR home keeps the scroll-deferred sections' text for crawlers and no-JS readers", async () => {
  const { telegramCopy } = await loadModule("/src/components/v7/home7-telegram.jsx");
  for (const locale of ["en", "zh-Hans", "ja"]) {
    const html = await renderRoute(`/?locale=${locale}`);
    const text = textOf(html);
    const t = h7Copy(locale);
    assert.match(html, /<section class="h7-in h7-calc" id="h7-calc">/, `${locale}: calculator section`);
    const calcHeading = calcSay(locale).h; // volume framing (owner 2026-10-14)
    assert.ok(text.includes(calcHeading), `${locale}: calculator heading "${calcHeading}"`);
    assert.ok(text.includes(t.all), `${locale}: directory link`);
    assert.ok(text.includes(telegramCopy(locale).h), `${locale}: Telegram block heading`);
    assert.doesNotMatch(html, /id="research-tools"|home-research-drawer/, `${locale}: old research-tools wall stays removed`);
    assert.match(html, /<footer class="nx-ftr" id="policy">/, `${locale}: compact footer`);
    assert.match(html, /data-footer-partner-links/, `${locale}: compact referral codes row`);
    assert.doesNotMatch(html, /crawl-priority-links__groups|data-testid="brazil-entry-link"/, `${locale}: old closing link wall stays removed`);
    assert.match(html, /id="h7-below-root"/, `${locale}: stable lower-home hydration root`);
    assert.doesNotMatch(html, /<template data-nexualpha-scope-start="home-research">/, `${locale}: old research scope is not emitted`);
  }
});

test("SSR directory and news list still render through the deferred route modules", async () => {
  const directory = await renderRoute("/exchanges");
  assert.match(directory, /class="mx-page v5" id="exchanges"/, "directory renders VenueYellowPages (exchange matrix) on the server");
  assert.match(directory, /<h1 class="mx-title">/);
  const news = await renderRoute("/news");
  assert.match(news, /news-list|news-grid/, "news list renders on the server");
});
