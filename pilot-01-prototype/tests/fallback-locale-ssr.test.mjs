// Locale fallback SSR (QA #10, 2026-10-11): locale editions the build-time prerender manifest does not carry
// (/ja/topics, /ar/factbook, /ko/topics/tokenized-assets, …) are served noindex with a canonical to the owner edition,
// but their SSR body used to be the empty app shell (844 px document, 0 links, no <main>); the client then rendered the
// full page (CLS 0.3-0.9 at 390, nothing for no-JS readers). The worker now renders them at request time through
// NEWS_SSR_RENDER with the same component, props and bootstrap URL the browser hydrates. The 404 page gets the same
// treatment; the shell is kept only when the renderer throws or returns no page.
import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker/index.js";
import { createSsrHarness, SHELL_HTML, prerenderState, rootInnerHtml, h1Texts, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

// Assets-only fixture: shell + an empty prerender manifest (none of these editions is prerendered at build time either).
const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  return new Response("missing", { status: 404 });
} };

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

const fetchPage = (pathname, env) => worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), env);
const linkCount = (html) => (html.match(/<a\s[^>]*href=/g) || []).length;
const robotsOf = (html) => html.match(/<meta name="robots" content="([^"]*)"/)?.[1];
const canonicalOf = (html) => html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];

// path, locale, content pathname, canonical (owner edition), minimum links in the SSR body
const cases = [
  { path: "/ja/topics", locale: "ja", content: "/topics", canonical: "https://nexualpha.com/topics", minLinks: 30 },
  { path: "/ar/factbook", locale: "ar", content: "/factbook", canonical: "https://nexualpha.com/factbook", minLinks: 40 },
  { path: "/de/factbook/binance", locale: "de", content: "/factbook/binance", canonical: "https://nexualpha.com/de/factbook/binance", minLinks: 30 },
  { path: "/ko/topics/tokenized-assets", locale: "ko", content: "/topics/tokenized-assets", canonical: "https://nexualpha.com/topics/tokenized-assets", minLinks: 30 },
];

test("locale fallback editions are server-rendered with the client component: main landmark, one H1, links, minimal payload", async () => {
  const calls = [];
  const env = { ASSETS: assets, NEWS_SSR_RENDER: async (href, options) => { calls.push({ href, options }); return harness.render(href, options); } };
  for (const { path, locale, content, minLinks } of cases) {
    calls.length = 0;
    const response = await fetchPage(path, env);
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("x-nexualpha-fallback-render"), "runtime", `${path}: rendered at request time`);
    assert.equal(calls.length, 1, `${path}: rendered once`);
    assert.equal(calls[0].href, `https://nexualpha.com${content}?locale=${locale}`, `${path}: renders the hydration bootstrap URL`);
    assert.deepEqual(calls[0].options, {}, `${path}: no feed props`);
    assert.doesNotMatch(html, /data-nexualpha-client-render="true"/, `${path}: hydrates instead of re-rendering`);
    const body = rootInnerHtml(html);
    assert.ok(body, `${path}: SSR body present`);
    assert.match(body, /<main\b/, `${path}: main landmark`);
    const headings = h1Texts(body);
    assert.equal(headings.length, 1, `${path}: exactly one H1 (${headings.join(" | ")})`);
    // The client renders the same component with the same props: its H1 is the SSR H1.
    const clientHtml = await harness.render(`https://nexualpha.com${content}?locale=${locale}`, {});
    assert.deepEqual(headings, h1Texts(clientHtml), `${path}: SSR H1 equals the client H1`);
    assert.ok(linkCount(body) >= minLinks, `${path}: ${linkCount(body)} links in the SSR body (>= ${minLinks})`);
    const state = prerenderState(html);
    assert.deepEqual(state, { pathname: content, locale, version: "nexualpha-prerender-v1" }, `${path}: minimal hydration payload`);
    assert.doesNotMatch(html, /rel="modulepreload"/, `${path}: speculative module preloads removed`);
  }
});

test("metadata policy is unchanged: noindex,follow, canonical to the owner edition, no hreflang", async () => {
  const env = { ASSETS: assets, NEWS_SSR_RENDER: harness.render };
  for (const { path, canonical } of cases) {
    const html = await (await fetchPage(path, env)).text();
    assert.equal(robotsOf(html), "noindex,follow", `${path}: robots`);
    assert.equal(canonicalOf(html), canonical, `${path}: canonical`);
    assert.doesNotMatch(html, /rel="alternate" hreflang=/, `${path}: fallback editions carry no hreflang`);
  }
  // The owner editions keep their policy and (still) render with a body.
  for (const [path, robots] of [["/topics", "index,follow"], ["/factbook", "index,follow"], ["/zh-hans/topics/tokenized-assets", "index,follow"]]) {
    const html = await (await fetchPage(path, env)).text();
    assert.equal(robotsOf(html), robots, `${path}: robots`);
    assert.match(rootInnerHtml(html) || "", /<main\b/, `${path}: body`);
  }
});

test("the served HTML hydrates in jsdom without hydration errors", async () => {
  const env = { ASSETS: assets, NEWS_SSR_RENDER: harness.render };
  for (const { path } of cases) {
    const html = await (await fetchPage(path, env)).text();
    const { errors, text } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(errors), [], `${path}: hydration errors: ${errors.join(" || ")}`);
    assert.ok(text.length > 200, `${path}: hydrated root keeps its content`);
  }
});

test("the 404 page is server-rendered (NotFoundPage) and stays 404 noindex,nofollow", async () => {
  const env = { ASSETS: assets, NEWS_SSR_RENDER: harness.render };
  for (const path of ["/ja/topics/not-a-topic", "/de/factbook/not-a-venue", "/ar/this-page-does-not-exist"]) {
    const response = await fetchPage(path, env);
    const html = await response.text();
    assert.equal(response.status, 404, path);
    assert.equal(robotsOf(html), "noindex,nofollow", `${path}: robots`);
    const body = rootInnerHtml(html);
    assert.ok(body, `${path}: SSR body present`);
    assert.match(body, /<main\b[^>]*v3-page--empty/, `${path}: NotFoundPage landmark`);
    assert.deepEqual(h1Texts(body), ["404"], `${path}: 404 heading`);
    const { errors } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(errors), [], `${path}: hydration errors: ${errors.join(" || ")}`);
  }
});

test("a renderer failure is logged and falls back to the shell; hosts without a renderer keep the shell", async () => {
  const logged = [];
  const originalError = console.error;
  console.error = (...args) => logged.push(args.join(" "));
  try {
    const throwing = { ASSETS: assets, NEWS_SSR_RENDER: async () => { throw new Error("renderer exploded"); } };
    let response = await fetchPage("/ja/topics", throwing);
    let html = await response.text();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-nexualpha-fallback-render"), null);
    assert.match(html, /<div id="root"><\/div>/, "shell served when the renderer throws");
    assert.ok(logged.some((line) => /route fallback SSR failed for \/topics \(ja\): renderer exploded/.test(line)), `logged: ${logged.join(" || ")}`);

    logged.length = 0;
    const empty = { ASSETS: assets, NEWS_SSR_RENDER: async () => "<div></div>" };
    response = await fetchPage("/ar/factbook", empty);
    html = await response.text();
    assert.match(html, /<div id="root"><\/div>/, "shell served when the renderer returns no page");
    assert.ok(logged.some((line) => /route fallback SSR returned no page body for \/factbook \(ar\)/.test(line)), `logged: ${logged.join(" || ")}`);

    response = await fetchPage("/ja/topics", { ASSETS: assets });
    html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /<div id="root"><\/div>/, "assets-only host keeps the shell");
    assert.equal(robotsOf(html), "noindex,follow");
  } finally {
    console.error = originalError;
  }
});
