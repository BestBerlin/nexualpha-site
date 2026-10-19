import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import worker from "../worker/index.js";
import { BRAZIL_PAGES } from "../src/data/brazil-market.js";
import { buildHydrationBootstrap } from "../src/data/hydration-bootstrap.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const indexHtml = "<!doctype html><html><head><title>Shell</title><script type=\"module\" src=\"/assets/index.js\"></script></head><body><div id=\"root\"></div></body></html>";

async function renderBrazilPage(pathname, initialUrl) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r74-br-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { BrazilDecisionPage } from "../../src/components/v3/international/BrazilDecisionPage.jsx";

      const html = renderToStaticMarkup(React.createElement(BrazilDecisionPage, {
        pathname: ${JSON.stringify(pathname)},
        initialUrl: ${JSON.stringify(initialUrl)},
        locale: "pt-BR",
        trackGrowthDecision: () => {},
      }));
      console.log(html);
    `);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });
    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function brazilMetadata() {
  return {
    version: 1,
    pages: Object.fromEntries(BRAZIL_PAGES.map((page) => [
      page.path,
      {
        status: 200,
        title: `${page.title} — NexuAlpha`,
        description: page.description,
        canonical: `https://nexualpha.com${page.path}`,
        locale: "pt-BR",
        robots: "index,follow",
        schemas: null,
      },
    ])),
  };
}

function assetsFor(appHtmlByPath) {
  const fetches = [];
  const manifest = {
    version: "nexualpha-prerender-v1",
    routes: Object.fromEntries(Object.keys(appHtmlByPath).map((pathname) => [
      `${pathname}|pt-BR`,
      { pathname, locale: "pt-BR", asset: `/prerender/pt-BR${pathname === "/br" ? "/br" : pathname}.json` },
    ])),
  };
  return {
    fetches,
    ASSETS: {
      async fetch(request) {
        const url = new URL(request.url);
        fetches.push(url.pathname + url.search);
        if (url.pathname === "/index.html") return new Response(indexHtml, { headers: { "content-type": "text/html; charset=utf-8", etag: "\"shell\"", "last-modified": "Tue, 01 Sep 2026 00:00:00 GMT" } });
        if (url.pathname === "/content/brazil-metadata.json") return Response.json(brazilMetadata());
        if (url.pathname === "/prerender-manifest.json") return Response.json(manifest);
        const route = Object.values(manifest.routes).find((entry) => entry.asset === url.pathname);
        if (route) {
          return Response.json({ html: `${appHtmlByPath[route.pathname]}<a href="https://partner.bitget.com/bg/C6PRAF" data-test-external="bitget">Bitget</a>` });
        }
        return new Response("missing", { status: 404 });
      },
    },
  };
}

function conditionalAssetsFor(appHtmlByPath) {
  const fetches = [];
  const manifest = {
    version: "nexualpha-prerender-v1",
    routes: Object.fromEntries(Object.keys(appHtmlByPath).map((pathname) => [
      `${pathname}|pt-BR`,
      { pathname, locale: "pt-BR", asset: `/prerender/pt-BR${pathname === "/br" ? "/br" : pathname}.json` },
    ])),
  };
  return {
    fetches,
    ASSETS: {
      async fetch(request) {
        const url = new URL(request.url);
        const hasValidator = request.headers.has("if-none-match") || request.headers.has("if-modified-since");
        fetches.push({ pathname: url.pathname, search: url.search, hasValidator });
        if (url.pathname === "/assets/index.js") {
          return hasValidator
            ? new Response(null, { status: 304, headers: { etag: "\"asset\"" } })
            : new Response("console.log('asset')", { headers: { "content-type": "application/javascript" } });
        }
        if ((url.pathname === "/br" || url.pathname === "/index.html" || url.pathname === "/exchanges/binance") && hasValidator) {
          return new Response(null, { status: 304, headers: { etag: "\"conditional-shell\"", "last-modified": "Tue, 01 Sep 2026 00:00:00 GMT" } });
        }
        if (url.pathname === "/index.html") {
          return new Response(indexHtml, { headers: { "content-type": "text/html; charset=utf-8", etag: "\"shell\"", "last-modified": "Tue, 01 Sep 2026 00:00:00 GMT" } });
        }
        if (url.pathname === "/content/brazil-metadata.json") return Response.json(brazilMetadata());
        if (url.pathname === "/prerender-manifest.json") return Response.json(manifest);
        const route = Object.values(manifest.routes).find((entry) => entry.asset === url.pathname);
        if (route) return Response.json({ html: appHtmlByPath[route.pathname] });
        return new Response("missing", { status: 404 });
      },
    },
  };
}

function prerenderStateFrom(html) {
  const raw = html.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)?.[1];
  assert.ok(raw, "expected prerender state payload");
  return JSON.parse(raw);
}

function hrefByPattern(html, pattern, label) {
  const match = html.match(pattern);
  assert.ok(match, label);
  return match[1].replaceAll("&amp;", "&");
}

function keyHrefs(html) {
  return {
    chainPrimary: hrefByPattern(html, /<a class="br-chain__primary" href="([^"]+)"/, "chain primary"),
    earlyPix: hrefByPattern(html, /<a\s+href="([^"]+)"[^>]*data-cta-placement="brazil-early-next-step-pix"/, "early pix"),
    earlyResearchBinance: hrefByPattern(html, /<a\s+class="br-early-next-step__primary"\s+href="([^"]+)"[^>]*data-cta-placement="brazil-early-next-step-binance"/, "early research binance"),
    earlyCompareBinance: hrefByPattern(html, /<a\s+href="([^"]+)"[^>]*data-cta-placement="brazil-early-next-step-compare-binance"/, "early compare binance"),
  };
}

function rootHtmlFromDocument(html) {
  return html.match(/<div id="root"[^>]*>([\s\S]*?)<\/div><script type="application\/json" id="nexualpha-prerender-state"/)?.[1] || html;
}

function decodeHref(value) {
  return String(value || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'");
}

function hrefInventory(html) {
  return [...html.matchAll(/<a\b[^>]*\shref=(["'])([\s\S]*?)\1[^>]*>/gi)]
    .map((match) => decodeHref(match[2]))
    .filter((href) => href !== "https://partner.bitget.com/bg/C6PRAF");
}

function hrefContextParams(url) {
  const params = new URLSearchParams(url.search);
  const hashQuery = url.hash.includes("?") ? url.hash.split("?").slice(1).join("?") : "";
  if (hashQuery) {
    const fragmentParams = new URLSearchParams(hashQuery);
    for (const [key, value] of fragmentParams) {
      if (!params.has(key)) params.set(key, value);
    }
  }
  return params;
}

function assertProjectedAttribution(hrefs, attribution) {
  let projected = 0;
  for (const href of hrefs) {
    if (href.startsWith("#")) continue;
    const url = new URL(href, "https://nexualpha.com");
    if (url.origin !== "https://nexualpha.com") continue;
    const context = hrefContextParams(url);
    if (!context.has("market") || !context.has("product")) continue;
    projected += 1;
    assert.equal(url.search, "", `${href} keeps state out of query`);
    for (const [param, expected] of [
      ["utm_source", attribution.source || null],
      ["utm_medium", attribution.medium || null],
      ["utm_campaign", attribution.campaign || null],
    ]) {
      assert.equal(context.get(param), expected, `${href} ${param}`);
    }
  }
  assert.ok(projected > 0, "expected at least one internal BR decision href with projected attribution");
}

for (const pathname of ["/br", "/br/pix", "/br/custos", "/br/comparar"]) {
  test(`R74 worker BR projected hrefs match first React hydration hrefs for ${pathname}`, async () => {
    const neutralHtml = await renderBrazilPage(pathname, `https://nexualpha.com${pathname}?locale=pt-BR`);
    const neutralHash = neutralHtml;
    const { ASSETS } = assetsFor({ [pathname]: neutralHtml });
    const browserUrl = `https://nexualpha.com${pathname}?market=BR&product=spot&utm_source=tg_channel&utm_medium=manual_draft&utm_campaign=r74_br_cold`;
    const response = await worker.fetch(new Request(browserUrl, { headers: { accept: "text/html" } }), { ASSETS });
    const html = await response.text();
    const state = prerenderStateFrom(html);
    const bootstrap = buildHydrationBootstrap({ browserUrl, prerenderState: state, hasServerHtml: true });
    const firstPassHtml = await renderBrazilPage(pathname, bootstrap.initialUrl);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
    assert.equal(response.headers.get("etag"), null);
    assert.equal(response.headers.get("last-modified"), null);
    assert.deepEqual(state.brAttribution, { source: "tg_channel", medium: "manual_draft", campaign: "r74_br_cold" });
    assert.deepEqual(hrefInventory(rootHtmlFromDocument(html)), hrefInventory(firstPassHtml));
    assertProjectedAttribution(hrefInventory(rootHtmlFromDocument(html)), state.brAttribution);
    assert.match(html, /href="https:\/\/partner\.bitget\.com\/bg\/C6PRAF"/);
    assert.equal(neutralHtml, neutralHash, "source prerender HTML remains neutral in memory");
    assert.doesNotMatch(neutralHtml, /r74_br_cold|tg_channel|manual_draft/);
  });
}

test("R74 preserves decision-state first-value and per-field attribution sanitization", async () => {
  const neutralHtml = await renderBrazilPage("/br", "https://nexualpha.com/br?locale=pt-BR");
  const shared = assetsFor({ "/br": neutralHtml });
  const mixed = await worker.fetch(new Request("https://nexualpha.com/br?utm_source=tg_channel&utm_medium=email&utm_campaign=r74", { headers: { accept: "text/html" } }), { ASSETS: shared.ASSETS });
  const mixedHtml = await mixed.text();
  const mixedState = prerenderStateFrom(mixedHtml);
  assert.deepEqual(mixedState.brAttribution, { source: "tg_channel", medium: "", campaign: "r74" });
  const mixedBootstrap = buildHydrationBootstrap({
    browserUrl: "https://nexualpha.com/br?utm_source=tg_channel&utm_medium=email&utm_campaign=r74",
    prerenderState: mixedState,
    hasServerHtml: true,
  });
  const mixedFirstPass = await renderBrazilPage("/br", mixedBootstrap.initialUrl);
  assert.deepEqual(hrefInventory(rootHtmlFromDocument(mixedHtml)), hrefInventory(mixedFirstPass));
  assertProjectedAttribution(hrefInventory(rootHtmlFromDocument(mixedHtml)), mixedState.brAttribution);

  const duplicate = await worker.fetch(new Request("https://nexualpha.com/br?utm_source=first&utm_source=second&utm_medium=manual_draft&utm_campaign=dup", { headers: { accept: "text/html" } }), { ASSETS: shared.ASSETS });
  const duplicateHtml = await duplicate.text();
  const duplicateState = prerenderStateFrom(duplicateHtml);
  assert.deepEqual(duplicateState.brAttribution, { source: "first", medium: "manual_draft", campaign: "dup" });
  assertProjectedAttribution(hrefInventory(rootHtmlFromDocument(duplicateHtml)), duplicateState.brAttribution);

  const clean = await worker.fetch(new Request("https://nexualpha.com/br", { headers: { accept: "text/html" } }), { ASSETS: shared.ASSETS });
  const cleanHtml = await clean.text();
  assert.equal(prerenderStateFrom(cleanHtml).brAttribution, undefined);
  for (const href of hrefInventory(rootHtmlFromDocument(cleanHtml))) {
    if (href.startsWith("#")) continue;
    const url = new URL(href, "https://nexualpha.com");
    if (url.origin !== "https://nexualpha.com") continue;
    const context = hrefContextParams(url);
    assert.equal(context.get("utm_source"), null, href);
    assert.equal(context.get("utm_medium"), null, href);
    assert.equal(context.get("utm_campaign"), null, href);
  }
});

test("R74 isolates A/B/clean attribution with one shared prerender manifest", async () => {
  const neutralHtml = await renderBrazilPage("/br", "https://nexualpha.com/br?locale=pt-BR");
  const shared = assetsFor({ "/br": neutralHtml });
  const urls = [
    "https://nexualpha.com/br?utm_source=tg_channel&utm_medium=manual_draft&utm_campaign=a",
    "https://nexualpha.com/br?utm_source=creator.br-01&utm_medium=broadcast&utm_campaign=b",
    "https://nexualpha.com/br",
  ];
  const bodies = await Promise.all(urls.map(async (url) => {
    const response = await worker.fetch(new Request(url, { headers: { accept: "text/html" } }), { ASSETS: shared.ASSETS });
    return response.text();
  }));
  const [aHrefs, bHrefs, cleanHrefs] = bodies.map((body) => hrefInventory(rootHtmlFromDocument(body)));
  assertProjectedAttribution(aHrefs, { source: "tg_channel", medium: "manual_draft", campaign: "a" });
  assertProjectedAttribution(bHrefs, { source: "creator.br-01", medium: "broadcast", campaign: "b" });
  for (const href of cleanHrefs) {
    if (href.startsWith("#")) continue;
    const url = new URL(href, "https://nexualpha.com");
    if (url.origin !== "https://nexualpha.com") continue;
    const context = hrefContextParams(url);
    if (!context.has("market") && !context.has("product")) continue;
    assert.equal(url.search, "", `${href} keeps state out of query`);
    assert.equal(context.get("utm_source"), null, href);
    assert.equal(context.get("utm_medium"), null, href);
    assert.equal(context.get("utm_campaign"), null, href);
  }
});

test("R74 tracked BR shell fetch strips conditional validators and serves projected HTML body", async () => {
  const neutralHtml = await renderBrazilPage("/br", "https://nexualpha.com/br?locale=pt-BR");
  const shared = conditionalAssetsFor({ "/br": neutralHtml });
  const browserUrl = "https://nexualpha.com/br?market=BR&product=spot&utm_source=tg_channel&utm_medium=manual_draft&utm_campaign=r74_br_cold";
  const response = await worker.fetch(new Request(browserUrl, {
    headers: {
      accept: "text/html",
      "if-none-match": "\"browser-shell\"",
      "if-modified-since": "Tue, 01 Sep 2026 00:00:00 GMT",
    },
  }), { ASSETS: shared.ASSETS });
  const html = await response.text();
  const state = prerenderStateFrom(html);

  assert.equal(response.status, 200);
  assert.deepEqual(state.brAttribution, { source: "tg_channel", medium: "manual_draft", campaign: "r74_br_cold" });
  assert.match(rootHtmlFromDocument(html), /utm_source=tg_channel/);
  assertProjectedAttribution(hrefInventory(rootHtmlFromDocument(html)), state.brAttribution);
  assert.deepEqual(
    shared.fetches
      .filter((entry) => ["/br", "/index.html"].includes(entry.pathname))
      .map((entry) => [entry.pathname, entry.hasValidator]),
    [["/br", false], ["/index.html", false]],
  );
});

test("R74 invalid tracked BR queries still bypass conditional 304 and stay private", async () => {
  const neutralHtml = await renderBrazilPage("/br", "https://nexualpha.com/br?locale=pt-BR");
  const shared = conditionalAssetsFor({ "/br": neutralHtml });
  const response = await worker.fetch(new Request("https://nexualpha.com/br?utm_medium=email", {
    headers: {
      accept: "text/html",
      "if-none-match": "\"browser-shell\"",
      "if-modified-since": "Tue, 01 Sep 2026 00:00:00 GMT",
    },
  }), { ASSETS: shared.ASSETS });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(response.headers.get("etag"), null);
  assert.equal(response.headers.get("last-modified"), null);
  assert.equal(prerenderStateFrom(html).brAttribution, undefined);
  assert.match(rootHtmlFromDocument(html), /br-/);
  assert.deepEqual(
    shared.fetches
      .filter((entry) => ["/br", "/index.html"].includes(entry.pathname))
      .map((entry) => [entry.pathname, entry.hasValidator]),
    [["/br", false], ["/index.html", false]],
  );
});

test("R74 conditional stripping does not affect non-BR pages or non-HTML assets", async () => {
  const neutralHtml = await renderBrazilPage("/br", "https://nexualpha.com/br?locale=pt-BR");
  const htmlShared = conditionalAssetsFor({ "/br": neutralHtml });
  const nonBrazilHtml = await worker.fetch(new Request("https://nexualpha.com/exchanges/binance?utm_source=tg_channel&utm_medium=manual_draft&utm_campaign=r74", {
    headers: { accept: "text/html", "if-none-match": "\"browser-shell\"" },
  }), { ASSETS: htmlShared.ASSETS });
  assert.equal(nonBrazilHtml.status, 304);
  assert.equal(await nonBrazilHtml.text(), "");
  assert.deepEqual(
    htmlShared.fetches
      .filter((entry) => entry.pathname === "/exchanges/binance")
      .map((entry) => entry.hasValidator),
    [true],
  );

  const assetShared = conditionalAssetsFor({ "/br": neutralHtml });
  const asset = await worker.fetch(new Request("https://nexualpha.com/assets/index.js?utm_source=tg_channel&utm_medium=manual_draft&utm_campaign=r74", {
    headers: { accept: "application/javascript", "if-none-match": "\"asset\"" },
  }), { ASSETS: assetShared.ASSETS });
  assert.equal(asset.status, 304);
  assert.equal(await asset.text(), "");
  assert.deepEqual(
    assetShared.fetches
      .filter((entry) => entry.pathname === "/assets/index.js")
      .map((entry) => entry.hasValidator),
    [true],
  );
});
