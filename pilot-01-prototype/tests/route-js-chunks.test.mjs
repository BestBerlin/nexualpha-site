import assert from "node:assert/strict";
import test from "node:test";
import { createRouteJsChunks } from "../scripts/route-js-chunks.mjs";
import cssChunks from "../scripts/route-css-chunks.json" with { type: "json" };
import { existsSync, readFileSync } from "node:fs";
import { staticJavaScriptClosure, moduleAsset } from "../scripts/measure-route-js.mjs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

const main = "/repo/src/main.jsx";
const venue = "/repo/src/components/v3/VenueDetailPage.jsx";
const compare = "/repo/src/components/v3/V3Pages.jsx";
const news = "/repo/src/components/v3/news/NewsDetailPage.jsx";
const funding = "/repo/src/components/data/FundingRatesPage.jsx";
const shared = "/repo/src/data/shared.js";
const copy = "/repo/src/data/copy.js";
const css = "/repo/src/components/v3/profile-density.css";
const deferred = "/repo/src/components/v3/VenueDetailResearch.jsx";

function graph(rows) {
  return { getModuleIds: () => Object.keys(rows), getModuleInfo: (id) => ({ importedIds: rows[id] || [] }) };
}

test("static consumer sets separate route-only dependencies, shell and deferred research", () => {
  const api = graph({ [main]: [shared], [venue]: [shared, copy, css], [compare]: [copy], [news]: [], [funding]: [], [shared]: [], [copy]: [] });
  const chunks = createRouteJsChunks();
  assert.equal(chunks.chunk(main, api), null);
  assert.equal(chunks.chunk(shared, api), "core-shared");
  assert.equal(chunks.chunk(venue, api), "route-v3-venue-main");
  assert.equal(chunks.chunk(compare, api), "route-v3-pages-main");
  assert.equal(chunks.chunk(copy, api), "shared-route-6");
  assert.equal(chunks.chunk(css, api), null, "CSS keeps its original manual ownership");
  assert.equal(chunks.chunk(deferred, api), null, "dynamic imports are not static consumers");
});

test("cycles are bounded and per-build reset drops stale ownership", () => {
  const api = graph({ [main]: [], [venue]: [shared], [shared]: [copy], [copy]: [shared] });
  const chunks = createRouteJsChunks();
  assert.equal(chunks.chunk(copy, api), "shared-route-2");
  assert.equal(chunks.chunk(shared, api), "shared-route-2");
  chunks.reset();
  assert.equal(chunks.chunk(copy, graph({ [main]: [copy], [copy]: [] })), "core-shared");
});

test("baseline stylesheet ownership references real CSS and preserves first-paint names", () => {
  for (const [source, chunk] of Object.entries(cssChunks)) {
    assert.ok(existsSync(new URL(`../${source}`, import.meta.url)), source);
    assert.match(source, /\.css$/);
    assert.match(chunk, /^[\w-]+$/);
  }
  assert.equal(cssChunks["src/components/v3/news/news-detail-page.css"], "route-news-shared");
  assert.equal(cssChunks["src/components/v3/profile-density.css"], "route-v3-pages-detail");
  assert.equal(cssChunks["src/components/data/data-pages.css"], "route-data");
});

const manifestUrl = new URL("../dist/client/.vite/manifest.json", import.meta.url);
test("built hydration graphs do not contain static JavaScript cycles or unrelated page modules", { skip: !existsSync(manifestUrl) }, () => {
  const manifest = JSON.parse(readFileSync(manifestUrl, "utf8"));
  const modules = JSON.parse(readFileSync(new URL("../dist/client/style-modules.json", import.meta.url), "utf8"));
  const copies = JSON.parse(readFileSync(new URL("../dist/client/locale-copy-manifest.json", import.meta.url), "utf8"));
  const cssBaseline = JSON.parse(readFileSync(new URL("../docs/venue-js-diet-css-before.json", import.meta.url), "utf8"));
  for (const [source, files] of Object.entries(cssBaseline.sources)) {
    // Content hashes move whenever a stylesheet is edited; ownership (file names and order) is what must hold.
    const names = (list) => (list || []).map((file) => file.replace(/-[\w-]{8}\.css$/, ".css"));
    assert.deepEqual(names(modules[source]?.css), names(files), `${source}: baseline CSS ownership and order remain unchanged`);
  }
  const shell = new Set(staticJavaScriptClosure(manifest, [manifest["index.html"].file]));
  assert.ok(!shell.has(copies.runtime), "copy loading stays outside the home entry's static closure");
  const byFile = new Map(Object.values(manifest).map((chunk) => [chunk.file, chunk]));
  const complete = new Set();
  const visit = (current, trail = []) => {
    assert.ok(!trail.includes(current), `static cycle: ${[...trail, current].join(" -> ")}`);
    if (complete.has(current)) return;
    for (const dependency of byFile.get(current)?.imports || []) visit(manifest[dependency].file, [...trail, current]);
    complete.add(current);
  };
  for (const chunk of byFile.values()) if (chunk.file.endsWith(".js")) visit(chunk.file);
  for (const root of [venue, compare, news, funding]) {
    const file = moduleAsset(root.replace("/repo/src/", "./"), modules);
    const closure = new Set(staticJavaScriptClosure(manifest, [file]));
    for (const other of ["src/components/v3/activity/ActivityPages.jsx", "src/components/v3/TopicGuidePage.jsx", "src/components/v3/VenueDetailResearch.jsx", "src/components/v3/HyperliquidFeeScenario.jsx"]) {
      assert.ok(!closure.has(modules[other]?.file), `${root} must not load ${other}`);
    }
  }
});

test("every emitted dynamic chunk that needs copy prepares it before evaluation, including merged routes", { skip: !existsSync(manifestUrl) }, () => {
  const manifest = JSON.parse(readFileSync(manifestUrl, "utf8"));
  const copies = JSON.parse(readFileSync(new URL("../dist/client/locale-copy-manifest.json", import.meta.url), "utf8"));
  const excluded = new Set([copies.runtime, ...Object.values(copies.locales)]);
  const chunks = Object.values(manifest).filter((chunk) => chunk.file.endsWith(".js"));
  const requiresCopy = new Set(chunks.filter((chunk) => staticJavaScriptClosure(manifest, [chunk.file]).includes(copies.runtime)).map((chunk) => chunk.file));
  let checked = 0;
  for (const chunk of chunks) {
    if (excluded.has(chunk.file) || !chunk.dynamicImports?.length) continue;
    const code = readFileSync(new URL(`../dist/client/${chunk.file}`, import.meta.url), "utf8");
    (traverseModule.default || traverseModule)(parse(code, { sourceType: "module" }), {
      CallExpression(node) {
        if (node.node.callee.type !== "Import" || node.node.arguments[0]?.type !== "StringLiteral") return;
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(chunk.file), node.node.arguments[0].value));
        if (excluded.has(target) || !requiresCopy.has(target)) return;
        const then = node.parentPath.parentPath.node;
        const prepare = then.callee?.object?.callee;
        assert.ok(node.parentPath.isArrowFunctionExpression() && then.type === "CallExpression"
          && then.callee.property?.name === "then" && prepare?.object?.name === "globalThis"
          && prepare.property?.name === "__NEXUALPHA_PREPARE_LOCALE_COPY__", `${chunk.file} must prepare copy before importing ${target}`);
        checked++;
      },
    });
  }
  assert.ok(checked >= 4, "the four hydration route loaders were inspected");
});
