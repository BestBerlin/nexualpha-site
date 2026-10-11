// Compare / directory layout stability (QA #12, mobile-perf lane 2026-10-11). Components whose stylesheet lives in a
// lazily loaded chunk must have that stylesheet linked by the Worker on every route that renders them in SSR; otherwise
// the CSS arrives with the chunk at hydration and the page shifts (compare pages 0.02-0.05 at 390 from the hero
// disclosure line, /compare and /exchanges 0.13 from the "compare any two" picker). The hydrated markup of the compare
// hero actions must equal the SSR markup.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

import viteConfig from "../vite.config.mjs";
import { createSsrHarness, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);

function loadWorkerInternals() {
  const source = `${readFileSync(new URL("worker/index.js", root), "utf8")}\nexport { routeStylePrefixesForPath as __routeStylePrefixesForPath, optimizeRouteResourceHints as __optimizeRouteResourceHints, COMPARE_ROUTE_MARKER as __COMPARE_ROUTE_MARKER, EXCHANGES_ROUTE_MARKER as __EXCHANGES_ROUTE_MARKER };`;
  const code = buildSync({ stdin: { contents: source, resolveDir: fileURLToPath(new URL("worker/", root)), loader: "js" }, bundle: true, write: false, format: "cjs", platform: "node" }).outputFiles[0].text;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require, console, URL, URLSearchParams, Date, Response, Headers, Request, fetch, TextEncoder, TextDecoder });
  return module.exports;
}
const worker = loadWorkerInternals();
const prefixesFor = (path, marker) => worker.__routeStylePrefixesForPath(new URL(`https://nexualpha.com${path}`), { marker }) || [];

// Class rendered by the component -> chunk its stylesheet is emitted into (vite.config.mjs manualChunks).
const LAZY_STYLED_COMPONENTS = [
  { className: "commission-disclosure-line", css: "/src/components/v3/commission-disclosure-line.css", chunk: "route-news-commission" },
  { className: "compare-any", css: "/src/components/compare/compare-any-picker.css", chunk: "shared-compare-picker" },
];

test("the stylesheets of lazily loaded compare components keep their chunk names", () => {
  const config = viteConfig({ command: "build", mode: "production", isSsrBuild: false });
  const manualChunks = config.build.rollupOptions.output.manualChunks;
  const getModuleInfo = () => ({ importedIds: [], importers: [], isExternal: false });
  for (const { css, chunk } of LAZY_STYLED_COMPONENTS) assert.equal(manualChunks(`/repo/pilot-01-prototype${css}`, { getModuleInfo }), chunk, css);
});

let harness;
test.after(async () => { await harness?.close(); });

const ROUTES = [
  ["/compare/binance-vs-okx", "NEXUALPHA_COMPARE_ROUTE_V1"],
  ["/ar/compare/binance-vs-okx", "NEXUALPHA_COMPARE_ROUTE_V1"],
  ["/compare/bitget-vs-mexc", "NEXUALPHA_COMPARE_ROUTE_V1"],
  ["/compare", "NEXUALPHA_COMPARE_ROUTE_V1"],
  ["/exchanges", "NEXUALPHA_EXCHANGES_ROUTE_V1"],
  ["/de/exchanges", "NEXUALPHA_EXCHANGES_ROUTE_V1"],
];

test("every lazily styled component in the SSR markup has its stylesheet linked on that route", async () => {
  harness ??= await createSsrHarness();
  for (const [path, marker] of ROUTES) {
    const html = await harness.render(path);
    const prefixes = prefixesFor(path, marker);
    assert.ok(prefixes.length, `${path}: route has a stylesheet allow-list`);
    let found = 0;
    for (const { className, chunk } of LAZY_STYLED_COMPONENTS) {
      if (!new RegExp(`class="(?:[^"]* )?${className}(?: [^"]*)?"`).test(html)) continue;
      found += 1;
      assert.ok(prefixes.includes(`${chunk}-`), `${path} renders .${className} in SSR but does not link ${chunk}-*.css`);
    }
    assert.ok(found > 0, `${path}: expected at least one lazily styled component in SSR`);
  }
});

test("compare hero actions: SSR markup and hydrated markup are identical (no layout change at hydration)", async () => {
  harness ??= await createSsrHarness();
  for (const path of ["/compare/binance-vs-okx", "/ar/compare/binance-vs-okx"]) {
    const html = await harness.render(path);
    const document = `<!doctype html><html><head><title>t</title></head><body><div id="root">${html}</div></body></html>`;
    const ssr = /<div class="v3-compare-hero-actions"[\s\S]*?<\/p><\/div>/.exec(html)?.[0];
    assert.ok(ssr, `${path}: hero actions rendered in SSR`);
    assert.match(ssr, /commission-disclosure-line v3-compare-hero-actions__disclosure/, `${path}: disclosure line next to the sign-up buttons`);
    const { errors, inspected } = await hydrateInJsdom(harness.vite, document, `https://nexualpha.com${path}`, {
      timeoutMs: 800,
      inspect: (window) => window.document.querySelector(".v3-compare-hero-actions")?.outerHTML,
    });
    // Scoped to this block: an unrelated attribute mismatch on the Telegram handoff (data-telegram-return-href) is
    // logged separately and does not move layout.
    assert.deepEqual(hydrationErrors(errors).filter((message) => /v3-compare-hero-actions|commission-disclosure-line|CompareHeroActions/.test(message)), [], `${path}: ${errors.join("\n")}`);
    const normalize = (markup) => markup.replace(/<!--[\s\S]*?-->/g, "").replace(/=""/g, "").replace(/\s*\/>/g, ">");
    assert.equal(normalize(inspected), normalize(ssr), `${path}: hydrated hero actions differ from SSR`);
  }
});

const dist = new URL("dist/client/", root);
const built = existsSync(new URL("index.html", dist));

test("built HTML for compare and directory routes keeps the disclosure and picker stylesheets", { skip: !built && "run npm run build first" }, () => {
  const shell = readFileSync(new URL("index.html", dist), "utf8");
  const files = readdirSync(new URL("assets/", dist));
  const fileFor = (chunk) => files.find((name) => new RegExp(`^${chunk}-[\\w-]{8}\\.css$`).test(name));
  const html = shell.replace(/<div id="root"><\/div>/, '<div id="root"><main></main></div><script type="application/json" id="nexualpha-prerender-state">{}</script>');
  const expectations = [
    ["/compare/binance-vs-okx", worker.__COMPARE_ROUTE_MARKER, ["route-news-commission"]],
    ["/compare", worker.__COMPARE_ROUTE_MARKER, ["route-news-commission", "shared-compare-picker"]],
    ["/exchanges", worker.__EXCHANGES_ROUTE_MARKER, ["shared-compare-picker", "route-news-commission"]],
  ];
  for (const [path, marker, chunks] of expectations) {
    const out = worker.__optimizeRouteResourceHints(html, { status: 200, marker }, new URL(`https://nexualpha.com${path}`));
    for (const chunk of chunks) {
      const file = fileFor(chunk);
      assert.ok(file, `${chunk} stylesheet built`);
      assert.ok(out.includes(`/assets/${file}`), `${path} links ${file}`);
    }
  }
});
