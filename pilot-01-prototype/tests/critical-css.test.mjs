// Home critical CSS (mobile-perf lane 2026-10-11, scorecard T4): the build keeps every rule that can match the
// prerendered home markup, the Worker inlines it and loads the full stylesheets without blocking the first paint.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

import { extractCriticalCss, homeCriticalSubjects, matchableSelector, requiredTokens, splitSelectorList, stylesheetHrefs, subjectTokens } from "../scripts/build-critical-css.mjs";
import { homeRouteStylePrefixes, inlineCriticalStylesheets } from "../worker/index.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("selectors are widened to every interaction state before matching, never narrowed", () => {
  const cases = {
    "a:hover > b::before": "a>b",
    ".x:not(.y:hover)": ".x", // a :not() that held a state pseudo is ignored as a whole
    ".x:not(.y)": ".x:not(.y)",
    ":is(.a:focus,.b) .c": ":is(.a,.b) .c",
    "body:has(>#root>main.home .h7) .nx": "body:has(>#root>main.home .h7) .nx",
    "li:has(+ .z:hover)": "li:has(+.z)",
    ":focus-visible": "*",
    ".a:nth-child(2n + 1) ~ .b": ".a:nth-child(2n + 1)~.b",
    "[data-x=\"a > b\"] .c": "[data-x=\"a > b\"] .c",
    ".sm\\:p-2:hover": ".sm\\:p-2",
    "input::placeholder": "input",
    "html[dir=rtl] .h7:first-child": "html[dir=rtl] .h7:first-child",
    ".faq[open] > p": ".faq>p",
    ".faq:not([open]) p": ".faq p",
  };
  for (const [input, expected] of Object.entries(cases)) assert.equal(matchableSelector(input).selector, expected, input);
  assert.equal(matchableSelector(".a .b").changed, false);
  assert.equal(matchableSelector(".a:hover").changed, true);
  assert.deepEqual(splitSelectorList(".a, :is(.b, .c) .d,[x=\",\"]"), [".a", ":is(.b, .c) .d", "[x=\",\"]"]);
  assert.deepEqual(requiredTokens(".a .b:is(.c,.d) > #e[data-x=\".f\"]:not(.g)"), [".a", ".b", "#e"]);
  assert.deepEqual(subjectTokens(".a .b > #e.k:not(.g)"), ["#e", ".k"]);
});

test("extraction keeps matching rules in cascade order, their at-rule wrappers, fonts and referenced keyframes", () => {
  const doc = new JSDOM(`<!doctype html><html lang="en"><body><div id="root"><main class="home"><h1 class="hero">Hi</h1><a class="btn" href="/x">Go</a><details class="faq"><summary>Q</summary><p class="answer">A</p></details></main></div></body></html>`).window.document;
  const first = `:root{--ink:#fff}.hero{color:var(--ink);animation:pulse 2s}.unused{color:red}@media (min-width:600px){.hero{font-size:40px}.unused-wide{margin:0}}@keyframes pulse{to{opacity:.5}}@keyframes orphan{to{opacity:0}}@font-face{font-family:X;src:url(x.woff2)}`;
  const second = `.btn:hover,.ghost:hover{color:blue}.faq[open] .answer{display:block}.modal-open .sheet{display:block}@supports (display:grid){.home{display:grid}.nope{display:grid}}@page{margin:0}`;
  const { css, stats } = extractCriticalCss([first, second], [doc]);
  assert.equal(css, [
    `:root{--ink:#fff}.hero{color:var(--ink);animation:pulse 2s}@media (min-width:600px){.hero{font-size:40px}}@keyframes pulse{to{opacity:.5}}@font-face{font-family:X;src:url(x.woff2)}`,
    `.btn:hover{color:blue}.faq[open] .answer{display:block}@supports (display:grid){.home{display:grid}}`,
  ].join("\n"));
  assert.equal(stats.rules, 10);
  assert.equal(stats.kept, 6);
});

test("first-screen extraction uses full DOM context while deferring below-hero subjects", () => {
  const dom = new JSDOM(`<html><body><div id="root"><main><header class="header">Nav</header><div class="h7"><section class="h7-hero"><p class="h7-num">40%</p><details class="faq"><summary>Help</summary></details></section><section class="lower">More</section></div><footer class="footer">End</footer></main></div></body></html>`);
  const doc = dom.window.document;
  const { css } = extractCriticalCss([
    `.header{height:48px}body:has(.footer) .h7-num{font-size:44px}.faq[open] summary{color:red}.h7-hero:last-child{padding:20px}.lower{height:500px}.footer{padding:40px}`,
  ], [doc], { subjects: homeCriticalSubjects(doc) });
  assert.equal(css, `.header{height:48px}body:has(.footer) .h7-num{font-size:44px}.faq[open] summary{color:red}`);
  assert.throws(() => homeCriticalSubjects(new JSDOM("<main></main>").window.document), /missing home hero\/LCP/);
  dom.window.close();
});

test("the partner logo strip right after the hero is first-screen content (hero v3: above the fold at 1440×900)", () => {
  const dom = new JSDOM(`<html><body><div id="root"><main><div class="h7"><section class="h7-hero"><p class="h7-num">$3,600</p></section><section class="h7-strip"><ul class="h7-pw"><li><a>Bitget</a></li></ul></section><section class="lower">More</section><section class="later">Later</section></div></main></div></body></html>`);
  const doc = dom.window.document;
  const { css } = extractCriticalCss([`.h7-num{font-size:44px}.h7-pw a{display:grid}.lower{height:500px}.later{height:9px}`], [doc], { subjects: homeCriticalSubjects(doc) });
  assert.equal(css, `.h7-num{font-size:44px}.h7-pw a{display:grid}.lower{height:500px}`, "the first section after the strip is first-screen too");
  dom.window.close();
});

test("a selector list Chrome may reject as a whole is kept as written", () => {
  const doc = new JSDOM(`<!doctype html><html><body><input class="field"></body></html>`).window.document;
  const { css } = extractCriticalCss([`.field::-webkit-inner-spin-button,.other{margin:0}.field,.gone{color:red}`], [doc]);
  assert.equal(css, `.field::-webkit-inner-spin-button,.other{margin:0}.field{color:red}`);
});

const SHELL = (links) => `<!doctype html><html><head><title>x</title>\n    ${links.map((href) => `<link rel="stylesheet" crossorigin href="${href}">`).join("\n    ")}\n</head><body><div id="root"><main></main></div><script type="application/json" id="nexualpha-prerender-state">{}</script></body></html>`;

test("the Worker inlines the critical CSS and defers the same stylesheets in the same order", () => {
  const sheets = ["/assets/route-v3-home-AAAAAAAA.css", "/assets/index-BBBBBBBB.css", "/assets/core-c-CCCCCCCC.css"];
  const html = inlineCriticalStylesheets(SHELL(sheets), { sheets, css: ".h7{color:#fff}.x{content:\"</style>\"}" });
  const style = html.indexOf('<style data-nexualpha-critical="home">');
  assert.ok(style > -1, "critical CSS inlined");
  assert.ok(style < html.indexOf(sheets[0]), "critical CSS comes before the first stylesheet");
  assert.doesNotMatch(html.slice(style, html.indexOf("</style>", style + 10)), /<\/style>"/, "a closing style tag inside the CSS is escaped");
  const deferred = [...html.matchAll(/<link rel="stylesheet" crossorigin href="([^"]+)" media="print" data-nexualpha-deferred-css>/g)].map((m) => m[1]);
  assert.deepEqual(deferred, sheets, "every stylesheet is deferred, order unchanged");
  assert.match(html, /<script>\(\(\)=>\{const l=\[\.\.\.document\.querySelectorAll\("link\[data-nexualpha-deferred-css\]"\)\]/);
  assert.match(html, new RegExp(`<noscript>${sheets.map((href) => `<link rel="stylesheet" crossorigin href="${href.replace(/[.]/g, "\\.")}">`).join("")}</noscript>`), "no-JS readers get the blocking links");
  // The switch flips every deferred sheet to media=all once all of them have loaded.
  const dom = new JSDOM(html, { runScripts: "dangerously" });
  const links = [...dom.window.document.querySelectorAll("link[data-nexualpha-deferred-css]")];
  assert.ok(links.every((link) => link.media === "print"));
  for (const link of links.slice(0, -1)) link.dispatchEvent(new dom.window.Event("load"));
  assert.ok(links.every((link) => link.media === "print"), "nothing switches before the last sheet arrives");
  links.at(-1).dispatchEvent(new dom.window.Event("load"));
  assert.ok(links.every((link) => link.media === "all"), "all sheets switch on together");
});

test("the Worker keeps blocking links when the build's sheet list does not match the page (fail safe)", () => {
  const sheets = ["/assets/index-BBBBBBBB.css", "/assets/core-c-CCCCCCCC.css"];
  const page = SHELL(sheets);
  assert.equal(inlineCriticalStylesheets(page, { sheets: ["/assets/index-OTHERHSH.css", sheets[1]], css: ".a{}" }), page);
  assert.equal(inlineCriticalStylesheets(page, { sheets: [sheets[1], sheets[0]], css: ".a{}" }), page);
  assert.equal(inlineCriticalStylesheets(page, { sheets: sheets.slice(0, 1), css: ".a{}" }), page);
  assert.equal(inlineCriticalStylesheets(page, { sheets, css: "" }), page);
  assert.equal(inlineCriticalStylesheets(page, null), page);
});

test("the build step runs after the prerender and before the Sites bundle; the Worker serves it on home routes only", () => {
  const build = JSON.parse(read("../package.json")).scripts.build;
  assert.ok(build.indexOf("generate-prerender-manifest.mjs") < build.indexOf("build-critical-css.mjs"));
  assert.ok(build.indexOf("build-critical-css.mjs") < build.indexOf("prepare-sites-build.mjs"));
  const worker = read("../worker/index.js");
  assert.match(worker, /if \(isCriticalCssHomeRoute\(html, metadata, url\)\) \{\n\s+html = inlineCriticalStylesheets\(html, \(await loadCriticalCss\(env, url\)\)\?\.routes\?\.home\);/);
  assert.match(worker, /return normalizePathname\(publicRoute\.contentPathname \|\| url\.pathname\) === "\/";/);
  for (const prefix of ["index-", "core-b-", "page-home-", "route-v3-home-"]) assert.ok(homeRouteStylePrefixes().includes(prefix), prefix);
  assert.ok(!homeRouteStylePrefixes().some((prefix) => "core-c-full.css".startsWith(prefix)), "home excludes the full inner v6 cascade");
});

const dist = new URL("../dist/client/", import.meta.url);
const built = existsSync(new URL("critical-css.json", dist));

test("built critical CSS covers exactly the stylesheets the Worker links on the home route", { skip: !built && "run npm run build first" }, () => {
  const payload = JSON.parse(readFileSync(new URL("critical-css.json", dist), "utf8"));
  assert.equal(payload.version, 1);
  const { sheets, css } = payload.routes.home;
  const prefixes = homeRouteStylePrefixes();
  const expected = stylesheetHrefs(readFileSync(new URL("index.html", dist), "utf8")).filter((href) => prefixes.some((prefix) => href.split("/").pop().startsWith(prefix)));
  assert.deepEqual(sheets, expected);
  for (const href of sheets) assert.ok(existsSync(new URL(`.${href}`, dist)), href);
  assert.ok(css.length > 20_000 && css.length < 400_000, `critical CSS size ${css.length}`);
  for (const selector of [".h7", ".nx-hdr", "@font-face"]) assert.ok(css.includes(selector), selector);
});
