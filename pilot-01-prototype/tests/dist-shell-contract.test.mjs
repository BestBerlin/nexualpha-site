// Build-output contract for the shell CSS. Run after `vite build` + prerender (CI "Dist shell contract" step):
//   node --test tests/dist-shell-contract.test.mjs
// The v6 shell selectors encode the DOM shape (body:has(> #root > main…), html:has(> body > #root > main > …),
// #root > main > section > .regional-mobile-decision-dock). A wrapper element around <main>, or a CSS chunk that
// silently drops the key component rules, would un-style the header, footer, dock or hero without any build error.
// Uses only node built-ins.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const dist = new URL("../dist/client/", import.meta.url);
const read = (rel) => readFileSync(new URL(rel, dist), "utf8");
const built = existsSync(new URL("index.html", dist)) && existsSync(new URL("prerender-manifest.json", dist));

// Top-level element tags (and class lists) of an HTML fragment, plus the parent chain of the first match of `cls`.
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
function outline(html) {
  const stack = [];
  const top = [];
  const chains = new Map();
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  let m;
  while ((m = re.exec(html))) {
    if (!m[2]) continue;
    const [, close, rawTag, attrs, selfClose] = m;
    const tag = rawTag.toLowerCase();
    if (close) {
      const at = stack.map((e) => e.tag).lastIndexOf(tag);
      if (at >= 0) stack.length = at;
      continue;
    }
    const cls = (/\bclass="([^"]*)"/.exec(attrs) || [])[1] || "";
    const id = (/\bid="([^"]*)"/.exec(attrs) || [])[1] || "";
    const el = { tag, cls: cls.split(/\s+/).filter(Boolean), id };
    if (!stack.length) top.push(el);
    for (const c of el.cls) if (!chains.has(c)) chains.set(c, [...stack, el]);
    if (tag === "script" || tag === "style") { // raw text
      const end = html.indexOf(`</${tag}`, re.lastIndex);
      re.lastIndex = end < 0 ? html.length : end;
      continue;
    }
    if (!VOID.has(tag) && !selfClose) stack.push(el);
  }
  return { top, chains };
}

const manifest = built ? JSON.parse(read("prerender-manifest.json")) : { routes: {} };
const SAMPLE = ["/|en", "/|de", "/|ar", "/|ja", "/exchanges|en", "/exchanges/binance|en", "/compare/binance-vs-okx|en", "/rates|en",
  "/factbook|en", "/factbook/binance|en", "/telegram|en", "/activities|en", "/methodology|en", "/topics|en", "/br|pt-BR", "/mx|es",
  "/tw|zh-Hant", "/eu|en", "/markets/turkiye|tr"];

test("prerendered routes keep <main> as a direct child of #root", { skip: !built && "dist not built" }, () => {
  const keys = SAMPLE.filter((k) => manifest.routes[k]);
  assert.ok(keys.length >= 15, `sampled ${keys.length} prerendered routes`);
  for (const key of keys) {
    const { html } = JSON.parse(read(manifest.routes[key].asset.replace(/^\//, "")));
    const { top, chains } = outline(html);
    const mains = top.filter((e) => e.tag === "main");
    assert.equal(mains.length, 1, `${key}: expected exactly one <main> at #root level, got ${top.map((e) => e.tag).join(",")}`);
    const nav = chains.get("mobile-bottom-nav");
    if (nav) {
      const parents = nav.slice(0, -1).map((e) => e.tag).join(">");
      assert.ok(parents === "" || parents === "main", `${key}: .mobile-bottom-nav must be a #root or #root>main child, found under ${parents}`);
    }
    const sticky = chains.get("v3-mobile-sticky-bar");
    if (sticky) assert.equal(sticky.slice(0, -1).map((e) => e.tag).join(">"), "main", `${key}: .v3-mobile-sticky-bar must be a #root>main child`);
    const dock = chains.get("regional-mobile-decision-dock");
    if (dock) assert.equal(dock.slice(0, -1).map((e) => e.tag).join(">"), "main>section", `${key}: regional dock must sit at #root>main>section`);
  }
});

test("client shell template has an empty #root for the SSR body", { skip: !built && "dist not built" }, () => {
  assert.match(read("index.html"), /<div id="root"><\/div>/);
});

test("dist CSS keeps the shell and key v6 component selectors, linked in cascade order", { skip: !built && "dist not built" }, () => {
  const html = read("index.html");
  const linked = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="\/assets\/([^"]+\.css)"/g)].map((m) => m[1]);
  const css = (f) => readFileSync(new URL(`assets/${f}`, dist), "utf8");
  // The former single entry stylesheet is a sequence: [*-early] index [*-mid1] core-b [*-mid2] core-c [*-late].
  // Every route links index + core-*; the worker adds the page-* chunks the route uses. Order = cascade order.
  const slot = (f) => /^index-/.test(f) ? 1 : /-early-/.test(f) ? 0 : /-mid1-/.test(f) ? 2 : /^core-b-/.test(f) ? 3
    : /-mid2-/.test(f) ? 4 : /^core-c-/.test(f) ? 5 : /-late-/.test(f) ? 6 : -1;
  const ordered = linked.filter((f) => slot(f) >= 0);
  assert.equal(ordered.filter((f) => /^index-/.test(f)).length, 1, `one entry stylesheet linked, got ${ordered.join(",")}`);
  for (const name of ["core-b", "core-c"]) assert.ok(ordered.some((f) => f.startsWith(`${name}-`)), `${name} chunk linked`);
  assert.deepEqual(ordered.map(slot), [...ordered.map(slot)].sort((x, y) => x - y), `stylesheets out of cascade order: ${ordered.join(" ")}`);
  assert.ok(linked.indexOf(ordered[0]) === linked.length - ordered.length, "split stylesheets come after every other chunk stylesheet");
  const shell = ordered.filter((f) => /^(index|core)-/.test(f)).map(css).join("\n");
  // shell rules every route depends on: in the always-linked shared stylesheets
  for (const needle of [".v6", ".nx-hdr", ".nx-ftr", ".mobile-bottom-nav", "body:has(>#root>main", "html:has(>body>#root>main"]) {
    assert.ok(shell.includes(needle), `shared shell CSS lacks ${needle}`);
  }
  // key home / directory components: in the CSS the shell template links
  const all = linked.map(css).join("\n");
  for (const needle of [".rf-svg", ".dir6-row", ".vb__route", ".rf-grid", ".cl-chip"]) {
    assert.ok(all.includes(needle), `linked CSS lacks ${needle}`);
  }
});
