// Embeddable widgets (server/embed-widgets.mjs, 2026-10-11): /embed/liquidations and /embed/funding-rates render the
// data pages' numbers from the collector feed in a self-contained, iframe-friendly, noindex HTML page; /embed/<kind>.js
// injects the iframe. Also: the snippets the "Embed this" block shows, the beacon's landing source and the sitemap.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  EMBED_CACHE_CONTROL, EMBED_SIZE_BUDGET, createEmbedRoute, embedInjectorScript, normalizeEmbedLocale, normalizeEmbedTheme, renderEmbedHtml,
} from "../server/embed-widgets.mjs";
import { DATA_PAGE_LOCALES, EMBED_KINDS, EMBED_MAX_HEIGHT, embedKindForPath, embedSnippets, embedSource } from "../src/data/market-data-pages.js";
import { ctaClickPayload, landingSource } from "../src/data/cta-click-beacon.js";
import { renderLocaleSitemap } from "../worker/index.js";
import { createProductionServer } from "../server.mjs";

const feed = JSON.parse(readFileSync(new URL("./fixtures/market-data/market-events.history.sample.json", import.meta.url), "utf8"));
const byteLength = (s) => Buffer.byteLength(s, "utf8");

test("liquidations embed shows the page's numbers, no script, footer attribution link with ?src=embed-liquidations", () => {
  const { html, ok, generatedAt } = renderEmbedHtml("liquidations", feed, { locale: "en", theme: "dark" });
  assert.equal(ok, true);
  assert.equal(generatedAt, "2026-10-10T14:58:12.739Z");
  assert.match(html, /^<!doctype html>\n<html lang="en" dir="ltr" data-theme="dark">/);
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /<title>Crypto liquidations today — NexuAlpha<\/title>/);
  assert.ok(html.includes('<p class="big" dir="ltr">$6.11M</p>'), "24h total");
  assert.ok(html.includes("Longs liquidated $1.23M · 20%") && html.includes("Shorts liquidated $4.88M · 80%"), "split");
  assert.ok(html.includes("<dt>Last 1 hour</dt><dd dir=\"ltr\">$3.34M</dd>") && html.includes("<dt>Last 4 hours</dt><dd dir=\"ltr\">$3.35M</dd>"), "1h / 4h");
  assert.ok(html.includes("$1.45M<small translate=\"no\">SOL short · OKX</small>"), "largest order");
  assert.ok(html.includes("683 orders"));
  assert.match(html, /<i style="width:20\.2%"><\/i>/, "long share bar");
  assert.ok(!/<script/i.test(html), "no script: CSP default-src 'none' friendly");
  assert.ok(!/<link|@import|url\(/i.test(html), "no external resources");
  assert.match(html, /<footer class="f"><a href="https:\/\/nexualpha\.com\/liquidations\?src=embed-liquidations" target="_blank" rel="noopener" data-embed-source="embed-liquidations">Powered by NexuAlpha<\/a> <span dir="ltr">updated 14:58 UTC<\/span><\/footer>/);
  assert.ok(byteLength(html) <= EMBED_SIZE_BUDGET, `size ${byteLength(html)} > ${EMBED_SIZE_BUDGET}`);
  assert.match(html, new RegExp(`max-height:${EMBED_MAX_HEIGHT}px;overflow:hidden`));
  assert.match(html, /prefers-reduced-motion:no-preference/);
  // locale + theme + RTL
  const ar = renderEmbedHtml("liquidations", feed, { locale: "ar", theme: "light" }).html;
  assert.match(ar, /<html lang="ar" dir="rtl" data-theme="light">/);
  assert.ok(ar.includes("$6.11M") && ar.includes("مقدَّم من NexuAlpha"));
  assert.match(ar, /href="https:\/\/nexualpha\.com\/ar\/liquidations\?src=embed-liquidations"/, "localized full-page link");
  assert.match(ar, /background:#ffffff/, "light theme");
  const zh = renderEmbedHtml("liquidations", feed, { locale: "zh-hans" }).html;
  assert.match(zh, /<html lang="zh-Hans"/, "locale normalised case-insensitively");
  assert.ok(zh.includes("今日加密货币爆仓"));
  for (const locale of DATA_PAGE_LOCALES) {
    const out = renderEmbedHtml("liquidations", feed, { locale }).html;
    assert.ok(out.includes("$6.11M") && out.includes("embed-liquidations"), locale);
    assert.ok(byteLength(out) <= EMBED_SIZE_BUDGET, `${locale} size`);
  }
  assert.equal(normalizeEmbedLocale("PT-BR"), "pt-BR");
  assert.equal(normalizeEmbedLocale("xx"), "en");
  assert.equal(normalizeEmbedTheme("LIGHT"), "light");
  assert.equal(normalizeEmbedTheme("neon"), "dark");
  assert.equal(renderEmbedHtml("calculator", feed), null);
});

test("funding embed lists the top rows with signed rates; a missing feed renders the unavailable copy, never zeros", () => {
  const { html, ok } = renderEmbedHtml("funding-rates", feed, { locale: "de" });
  assert.equal(ok, true);
  assert.match(html, /<title>Krypto-Funding-Raten: Binance vs\. OKX — NexuAlpha<\/title>/);
  assert.match(html, /<th scope="row" translate="no">BTC<\/th><td class="num pos" dir="ltr">\+0\.0033%<\/td>/);
  assert.ok(html.includes("−0.0120%"), "negative rate with minus sign");
  assert.ok(html.includes("+3.6%"), "annualized estimate");
  assert.ok(html.includes('<th scope="row" translate="no">1000PEPE</th>'));
  assert.ok(html.includes(">—<"), "venue that did not answer stays a dash");
  assert.match(html, /href="https:\/\/nexualpha\.com\/de\/funding-rates\?src=embed-funding-rates"[^>]*data-embed-source="embed-funding-rates"/);
  assert.ok(byteLength(html) <= EMBED_SIZE_BUDGET);
  assert.ok(!/<script/i.test(html));

  const none = renderEmbedHtml("funding-rates", null, { locale: "en" });
  assert.equal(none.ok, false);
  assert.match(none.html, /<p class="u" role="status"><b>Live data is temporarily unavailable<\/b>/);
  assert.ok(!none.html.includes("0.0000%") && !none.html.includes("$0"), "nothing invented");
  assert.match(none.html, /Powered by NexuAlpha<\/a><\/footer>/, "footer without a timestamp");
  const older = renderEmbedHtml("funding-rates", { generatedAt: feed.generatedAt, liquidations: feed.liquidations }, { locale: "en" });
  assert.equal(older.ok, false, "older collector without funding → unavailable");
  const liqNone = renderEmbedHtml("liquidations", { generatedAt: "bad" }, { locale: "fr" });
  assert.equal(liqNone.ok, false);
  assert.ok(liqNone.html.includes("temporairement indisponibles") || liqNone.html.includes("indisponible"), liqNone.html.match(/<p class="u"[^<]*<b>[^<]*/)?.[0]);
});

test("the injector script inserts a responsive iframe after its own tag and honours data-locale / data-theme", () => {
  const js = embedInjectorScript("liquidations");
  assert.ok(byteLength(js) < 1200, `injector ${byteLength(js)} bytes`);
  assert.match(js, /document\.currentScript/);
  assert.match(js, /"https:\/\/nexualpha\.com\/embed\/liquidations"\+\(q\.length\?"\?"\+q\.join\("&"\):""\)/);
  assert.match(js, /encodeURIComponent\(d\.locale\)/);
  assert.match(js, /encodeURIComponent\(d\.theme\)/);
  assert.match(js, /width:100%;max-width:100%;height:360px;border:0/);
  assert.match(js, /insertBefore\(f,s\.nextSibling\)/);
  assert.match(js, /f\.title="Crypto liquidations today — NexuAlpha"/);
  assert.match(embedInjectorScript("funding-rates"), /height:400px/);
  assert.equal(embedInjectorScript("calculator"), null);
  // it runs: a minimal DOM double
  const inserted = [];
  const scriptEl = { dataset: { locale: "ja", theme: "light" }, nextSibling: "next", parentNode: { insertBefore: (node, ref) => inserted.push([node, ref]) } };
  const sandbox = { document: { currentScript: scriptEl, createElement: () => ({ style: {}, setAttribute(k, v) { this[k] = v; } }) }, encodeURIComponent };
  new Function("document", "encodeURIComponent", js)(sandbox.document, sandbox.encodeURIComponent);
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0][0].src, "https://nexualpha.com/embed/liquidations?locale=ja&theme=light");
  assert.equal(inserted[0][0].scrolling, "no");
  assert.equal(inserted[0][0].loading, "lazy");
  assert.equal(inserted[0][1], "next");
  assert.match(embedInjectorScript("liquidations", { origin: "http://127.0.0.1:4173" }), /"http:\/\/127\.0\.0\.1:4173\/embed\/liquidations"/);
});

test("route: iframe-friendly headers (no X-Frame-Options, frame-ancestors *), noindex, 5-minute public cache; unknown embeds fall through", async () => {
  const route = createEmbedRoute({ readFeed: async () => feed });
  const res = await route(new Request("https://nexualpha.com/embed/liquidations?locale=es&theme=light"));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(res.headers.get("cache-control"), EMBED_CACHE_CONTROL);
  assert.equal(res.headers.get("cache-control"), "public, max-age=300");
  assert.equal(res.headers.get("x-robots-tag"), "noindex");
  assert.equal(res.headers.get("x-frame-options"), null);
  assert.match(res.headers.get("content-security-policy"), /frame-ancestors \*/);
  assert.match(res.headers.get("content-security-policy"), /default-src 'none'; style-src 'unsafe-inline'/);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  const html = await res.text();
  assert.match(html, /<html lang="es" dir="ltr" data-theme="light">/);
  assert.ok(html.includes("$6.11M"));
  const js = await route(new Request("https://nexualpha.com/embed/funding-rates.js"));
  assert.equal(js.status, 200);
  assert.equal(js.headers.get("content-type"), "text/javascript; charset=utf-8");
  assert.equal(js.headers.get("x-robots-tag"), "noindex");
  assert.equal(js.headers.get("access-control-allow-origin"), "*");
  assert.match(await js.text(), /\/embed\/funding-rates"/);
  assert.equal(await route(new Request("https://nexualpha.com/embed/calculator")), null, "the calculator stays with the worker");
  assert.equal(await route(new Request("https://nexualpha.com/embed/liquidations/history")), null);
  assert.equal(await route(new Request("https://nexualpha.com/embed/")), null);
  assert.equal((await route(new Request("https://nexualpha.com/embed/liquidations", { method: "POST" }))).status, 405);
  const head = await route(new Request("https://nexualpha.com/embed/liquidations", { method: "HEAD" }));
  assert.equal(head.status, 200);
  assert.equal(head.body, null);
  // feed reader failing: unavailable state, short cache, still 200 and iframe-friendly
  const down = createEmbedRoute({ readFeed: async () => { throw new Error("down"); } });
  const degraded = await down(new Request("https://nexualpha.com/embed/liquidations"));
  assert.equal(degraded.status, 200);
  assert.equal(degraded.headers.get("cache-control"), "public, max-age=60");
  assert.match(await degraded.text(), /data-state="unavailable"/);
  const noFeed = await createEmbedRoute({ readFeed: async () => null })(new Request("https://nexualpha.com/embed/funding-rates"));
  assert.match(await noFeed.text(), /Live data is temporarily unavailable/);
});

test("production server serves the embeds from MARKET_EVENTS_FILE ahead of the worker and leaves /embed/calculator to it", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "embed-widgets-"));
  let server;
  try {
    const clientRoot = path.join(dir, "dist", "client");
    await mkdir(clientRoot, { recursive: true });
    await writeFile(path.join(clientRoot, "index.html"), "<html></html>");
    await writeFile(path.join(dir, "market-events.json"), JSON.stringify(feed));
    const hits = [];
    server = await createProductionServer({
      appRoot: dir,
      env: { DIST_ROOT: path.join(dir, "dist"), BUILD_ID: "3.0-test-build", MARKET_EVENTS_FILE: path.join(dir, "market-events.json") },
      worker: { fetch: async (request) => { hits.push(new URL(request.url).pathname); return new Response("site-html", { headers: { "content-type": "text/html" } }); } },
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const res = await fetch(`${base}/embed/liquidations?locale=pt-BR`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-frame-options"), null);
    assert.equal(res.headers.get("cache-control"), "public, max-age=300");
    assert.equal(res.headers.get("x-robots-tag"), "noindex");
    const html = await res.text();
    assert.ok(html.includes("$6.11M") && html.includes("Liquidações cripto de hoje"), "numbers from the mounted feed, localized");
    assert.match(html, /\/pt-br\/liquidations\?src=embed-liquidations/);
    const js = await fetch(`${base}/embed/liquidations.js`);
    assert.equal(js.headers.get("content-type"), "text/javascript; charset=utf-8");
    assert.equal(await (await fetch(`${base}/embed/calculator`)).text(), "site-html");
    assert.equal(await (await fetch(`${base}/liquidations`)).text(), "site-html");
    assert.deepEqual(hits, ["/embed/calculator", "/liquidations"], "only non-widget paths reach the worker");
  } finally {
    if (server?.listening) await new Promise((resolve) => { server.close(resolve); server.closeIdleConnections?.(); });
    await rm(dir, { recursive: true, force: true });
  }
});

test("snippets shown on the pages match the routes; embeds stay out of the locale sitemap; the beacon honours ?src=embed-*", async () => {
  assert.deepEqual(Object.keys(EMBED_KINDS), ["liquidations", "funding-rates"]);
  assert.equal(embedKindForPath("/liquidations"), "liquidations");
  assert.equal(embedKindForPath("/funding-rates"), "funding-rates");
  assert.equal(embedKindForPath("/exchanges"), null);
  assert.equal(embedSource("liquidations"), "embed-liquidations");
  const s = embedSnippets("funding-rates", "ko");
  assert.equal(s.src, "https://nexualpha.com/embed/funding-rates?locale=ko&theme=dark");
  assert.match(s.iframe, /^<iframe src="https:\/\/nexualpha\.com\/embed\/funding-rates\?locale=ko&theme=dark" title="[^"]+ — NexuAlpha" width="100%" height="400" loading="lazy" style="border:0;max-width:100%;border-radius:12px"><\/iframe>$/);
  assert.equal(s.script, '<script src="https://nexualpha.com/embed/funding-rates.js" data-locale="ko" data-theme="dark" async></script>');
  assert.equal(embedSnippets("nope", "en"), null);
  for (const kind of Object.keys(EMBED_KINDS)) assert.ok(EMBED_KINDS[kind].height <= EMBED_MAX_HEIGHT, kind);
  const xml = await renderLocaleSitemap({});
  assert.ok(!xml.includes("/embed/"), "no embed URL in the locale sitemap");
  assert.ok(xml.includes("<loc>https://nexualpha.com/liquidations</loc>"), "data pages unchanged");
  // beacon: a visitor from the widget carries ?src=embed-<kind>, which becomes the click's src
  assert.equal(landingSource("?src=embed-liquidations"), "embed-liquidations");
  assert.equal(landingSource("?src=embed-funding-rates&x=1"), "embed-funding-rates");
  assert.equal(landingSource("?src=tg-alert"), null, "non-embed sources are left to their own handling");
  assert.equal(landingSource("?src=embed-<x>"), null);
  assert.equal(landingSource(""), null);
  assert.equal(landingSource(undefined), null);
  const anchor = { dataset: { ctaKind: "registration", ctaPlatform: "okx", ctaPlacement: "news-offer-inline-liquidations" } };
  assert.deepEqual(ctaClickPayload(anchor, { pathname: "/liquidations", search: "?src=embed-liquidations" }), { partner: "okx", src: "embed-liquidations", path: "/liquidations" });
  assert.deepEqual(ctaClickPayload(anchor, { pathname: "/liquidations", search: "" }), { partner: "okx", src: "news-offer-inline-liquidations", path: "/liquidations" });
  assert.deepEqual(ctaClickPayload(anchor, { pathname: "/liquidations" }).src, "news-offer-inline-liquidations");
});
