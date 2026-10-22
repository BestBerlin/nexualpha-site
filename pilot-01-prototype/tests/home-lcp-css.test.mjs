import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { extractCriticalCss, stylesheetHrefs } from "../scripts/build-critical-css.mjs";
import worker from "../worker/index.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];
const built = existsSync(new URL("../dist/client/prerender/en/home.json", import.meta.url));
const originalImports = ["base", "system", "components", "home-shared-a", "pages-inner-r4", "link-grids", "tap-targets", "pages-venue-r5", "pages-inner-r5", "pages-inner-r6", "home-shared-b", "pages-inner-r7", "pages-inner-r8", "cro", "pages-inner-r9", "pages-commerce-r10", "pages-commerce-r11", "pages-content-r10", "pages-content-r11", "system-r11"];

test("v6 entry imports preserve the original shared/inner cascade", () => {
  const imports = [...read("../src/main.jsx").matchAll(/import "\.\/styles\/v6\/([^"\n]+)\.css";/g)]
    .map((match) => match[1]).filter((name) => name === "index" || name.startsWith("cascade-") || /^pages-inner-r[49]$/.test(name));
  const flattened = imports.flatMap((name) => {
    const css = read(`../src/styles/v6/${name}.css`);
    const children = [...css.matchAll(/@import "\.\/([^"\n]+)\.css";/g)].map((match) => match[1]);
    return children.length ? children : [name];
  });
  assert.deepEqual(flattened, originalImports);
});

test("inner-only revisions match no home SSR rules across every locale", { skip: !built && "run npm run build first" }, () => {
  const documents = locales.map((locale) => {
    const { html } = JSON.parse(read(`../dist/client/prerender/${locale}/home.json`));
    return new JSDOM(`<html lang="${locale}" dir="${["ar", "ur"].includes(locale) ? "rtl" : "ltr"}"><body><div id="root">${html}</div></body></html>`).window.document;
  });
  for (const revision of [4, 5, 6, 9]) {
    const { stats } = extractCriticalCss([read(`../src/styles/v6/pages-inner-r${revision}.css`)], documents);
    assert.equal(stats.kept, 0, `r${revision} must stay inner-only`);
    assert.equal(stats.unevaluable, 0, `r${revision} selectors must be evaluable`);
  }
  for (const name of ["news-signature", "directory-compare-signature", "rates-profile-signature"]) {
    const { stats } = extractCriticalCss([read(`../src/styles/v8/${name}.css`)], documents);
    assert.equal(stats.kept, 0, `${name} must stay off home`);
    assert.equal(stats.unevaluable, 0, `${name} selectors must be evaluable`);
  }
  assert.match(read("../public/motion/inner-motion.js"), /!m\.classList\.contains\("home-refinement"\)/);
  for (const document of documents) document.defaultView.close();
});

test("built v6 assets preserve every declaration and the original inner order", { skip: !built && "run npm run build first" }, () => {
  const linked = stylesheetHrefs(read("../dist/client/index.html"));
  const full = linked.find((href) => href.startsWith("/assets/core-c-"));
  const home = linked.find((href) => href.startsWith("/assets/page-home-v6-"));
  assert.ok(full && home);
  const files = readdirSync(new URL("../dist/client/assets/", import.meta.url));
  const names = ["core-c", "page-inner-c1", "core-c2", "page-inner-c2", "core-c3", "page-inner-c3", "core-c4"];
  const parts = names.map((name) => {
    const candidates = files.filter((file) => new RegExp(`^${name}-[\\w-]+\\.css$`).test(file) && `/assets/${file}` !== full);
    assert.equal(candidates.length, 1, name);
    return { name, css: read(`../dist/client/assets/${candidates[0]}`).trim() };
  });
  assert.equal(read(`../dist/client${full}`), parts.map((part) => part.css).join("\n") + "\n");
  assert.equal(read(`../dist/client${home}`), parts.filter((part) => part.name.startsWith("core-")).map((part) => part.css).join("\n") + "\n");
  assert.ok(linked.every((href) => !/^\/assets\/(?:page-inner-c|core-c[234]-)/.test(href)), "no segment requests in the final shell");
  const critical = JSON.parse(read("../dist/client/critical-css.json")).routes.home;
  assert.ok(critical.sheets.includes(home) && !critical.sheets.includes(full));
  assert.match(critical.css, /\.hx-rate-num/);
  assert.match(critical.css, /\.hx-rate-n/, "the static figure is styled from the inline CSS");
  assert.doesNotMatch(read("../src/styles/v7/home7.css"), /@keyframes hx-count\{/, "no count-up keyframes (owner 2026-10-14)");
  assert.ok(Buffer.byteLength(critical.css) < 120_000, "inline CSS covers shell/hero, not the full home page");
  // 2026-10-18: optional, not swap — preloaded Geist paints first on normal connections; slow cold loads keep the
  // metric-matched fallback instead of swapping glyphs at the top of the home (owner: "字体…冒出来").
  assert.match(critical.css, /font-family:Geist V5;[^}]*font-display:optional/);
  assert.match(read("../dist/client/index.html"), /rel="preload" href="\/fonts\/geist\/geist-sans-latin\.woff2\?v=[0-9a-f]{12}"/);
});

test("Worker selects one v6 asset and only the route's signature styles", { skip: !built && "run npm run build first" }, async () => {
  const assets = { async fetch(request) {
    const pathname = new URL(request.url).pathname;
    try { return new Response(read(`../dist/client${pathname}`), { headers: { "content-type": pathname.endsWith(".json") ? "application/json" : "text/html" } }); }
    catch { return new Response("missing", { status: 404 }); }
  } };
  for (const [pathname, v6, signature] of [
    ["/", "page-home-v6-", null], ["/zh-hans", "page-home-v6-", null],
    ["/exchanges/okx", "core-c-", "page-profile-signature-"],
    ["/compare/binance-vs-kraken", "core-c-", "page-compare-signature-"],
    ["/news", "core-c-", "page-news-signature-"], ["/rates", "core-c-", "page-profile-signature-"],
  ]) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: assets });
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    const sheets = stylesheetHrefs(html);
    assert.equal(new Set(sheets.filter((href) => /\/assets\/(?:core-c-|page-home-v6-)/.test(href))).size, 1, pathname);
    assert.ok(sheets.some((href) => href.includes(v6)), pathname);
    const signatures = sheets.filter((href) => /\/assets\/page-(?:news|compare|profile)-signature-/.test(href));
    assert.deepEqual(signatures.map((href) => href.split("/").pop().replace(/-mid1-[\w-]+\.css$/, "-")).sort(), signature ? [signature] : [], pathname);
  }
  // The embed shares home calculator styling, but must receive it on its own route too.
  const embed = await worker.fetch(new Request("https://nexualpha.com/embed/calculator"), { ASSETS: assets });
  const embedSheets = stylesheetHrefs(await embed.text());
  assert.ok(embedSheets.some((href) => href.includes("/page-home-calculator-")), "embed retains shared calculator CSS");
  // Without a runtime renderer, Flash follows the full-CSS fallback branch.
  const fallback = await worker.fetch(new Request("https://nexualpha.com/flash"), { ASSETS: assets });
  const html = await fallback.text();
  assert.match(html, /\/assets\/core-c-/);
  assert.doesNotMatch(html, /\/assets\/page-home-v6-/);
});
