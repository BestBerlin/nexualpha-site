// Compare source revisions against the same feeds and prerender state.
// A client-only bundle optimization must leave the rendered target trees intact.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
import { JSDOM } from "jsdom";
import worker from "../worker/index.js";

const baseline = process.argv[process.argv.indexOf("--baseline") + 1];
if (!process.argv.includes("--baseline") || !/^[\w./-]+$/.test(baseline || "")) throw new Error("Use --baseline <git revision>");
const root = process.cwd();
const clientRoot = path.join(root, "dist/client");
const changed = ["src/App.jsx", "src/data/route-module-cache.js", "src/components/v3/V3Pages.jsx", "src/components/v3/VenueDetailPage.jsx", "src/components/v3/VenueDetailPageStatic.jsx"];
const original = new Map(changed.map((file) => [path.join(root, file), execFileSync("git", ["show", `${baseline}:pilot-01-prototype/${file}`], { encoding: "utf8" })]));
const options = { appType: "custom", logLevel: "error", optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false } };
const before = await createServer({ ...options, plugins: [{ name: "baseline-route-source", enforce: "pre", transform(_code, id) {
  const code = original.get(id.split("?")[0]);
  return code === undefined ? null : { code, map: null };
} }] });
let after;
try {
  after = await createServer(options);
  const oldEntry = await before.ssrLoadModule("/src/entry-server.jsx");
  const newEntry = await after.ssrLoadModule("/src/entry-server.jsx");
  const feed = JSON.parse(await readFile(path.join(clientRoot, "content/news-feed.json"), "utf8"));
  const articles = Array.isArray(feed) ? feed : feed.articles || feed.items;
  const article = articles.find((item) => item.slug && item.seo?.noindex === false && (item.title?.en || item.locale === "en" || item.language === "en"));
  assert.ok(article, "published English article is required");
  const assets = { async fetch(request) {
    const file = new URL(request.url).pathname;
    try { return new Response(await readFile(path.join(clientRoot, file)), { headers: { "content-type": file.endsWith(".json") ? "application/json" : "text/html" } }); }
    catch (error) { if (error.code !== "ENOENT") throw error; return new Response("missing", { status: 404 }); }
  } };
  const rows = [];
  for (const prefix of ["", "/zh-hans", "/it", "/ar"]) {
    for (const route of ["/exchanges/bitget", `/news/${article.slug}`, "/compare/binance-vs-okx", "/funding-rates"]) {
      const pathname = prefix + route;
      const roots = [];
      let state;
      for (const render of [oldEntry.render, newEntry.render]) {
        const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: assets, NEWS_SSR_RENDER: render });
        assert.equal(response.status, 200, pathname);
        const dom = new JSDOM(await response.text());
        const rootElement = dom.window.document.getElementById("root");
        assert.ok(rootElement?.querySelector("h1"), pathname);
        roots.push(rootElement.innerHTML);
        state = JSON.parse(dom.window.document.getElementById("nexualpha-prerender-state").textContent);
        dom.window.close();
      }
      assert.equal(roots[1], roots[0], `${pathname}: SSR root changed`);
      // Also call both renderers directly: a portable/prerendered Worker path
      // can otherwise return the same asset without invoking its renderer.
      const href = `https://nexualpha.com${pathname}`;
      const oldHtml = oldEntry.render(href, structuredClone(state));
      const newHtml = newEntry.render(href, structuredClone(state));
      assert.equal(newHtml, oldHtml, `${pathname}: source renderer changed`);
      rows.push({ pathname, equal: true, sha256: createHash("sha256").update(roots[0]).digest("hex") });
    }
  }
  console.log(JSON.stringify({ baseline, method: "original and current source rendered against identical final assets", rows }, null, 2));
} finally {
  await before.close();
  await after?.close();
}
