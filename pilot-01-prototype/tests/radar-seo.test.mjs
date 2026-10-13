import test from "node:test";
import assert from "node:assert/strict";

import worker, { routeMetadata, routeSeoPayload } from "../worker/index.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { RADAR_INDEX_LOCALES } from "../src/data/radar-seo.js";
import { buildSitemap, routeInventory } from "../scripts/generate-prerender-manifest.mjs";

const ORIGIN = "https://nexualpha.com";
const SHELL = '<!doctype html><html lang="en"><head><title>NexuAlpha</title><meta name="description" content="shell"><link rel="canonical" href="https://nexualpha.com/"><meta name="robots" content="index,follow"></head><body><div id="root"></div></body></html>';

function assets() {
  return {
    fetch: async (request) => {
      const url = new URL(request.url);
      if (url.pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
      if (url.pathname === "/index.html" || url.pathname === "/" || url.pathname === "/long-short" || url.pathname === "/whales") {
        return new Response(SHELL, { headers: { "content-type": "text/html; charset=utf-8" } });
      }
      return new Response("missing", { status: 404 });
    },
  };
}

function prerenderState(html) {
  return JSON.parse(html.match(/<script type="application\/json" id="nexualpha-prerender-state">([\s\S]*?)<\/script>/)?.[1] || "null");
}

function schemaTypes(schemas) {
  return schemas.map((schema) => schema["@type"]);
}

test("radar metadata is canonical, indexable and schema stays visible-page truthful", async () => {
  for (const [pathname, kind] of [["/long-short", "long-short"], ["/whales", "whales"]]) {
    for (const locale of ["en", "zh-Hans", "ur", "uk"]) {
      const href = localizedPath(pathname, locale);
      const seo = computeRouteSeo({ url: href });
      const metadata = await routeMetadata(new URL(`${ORIGIN}${href}`), {});
      assert.equal(seo.status, 200, href);
      assert.equal(metadata.status, 200, href);
      assert.equal(metadata.robots, ["ur", "uk"].includes(locale) ? "noindex,follow" : "index,follow", href);
      if (["ur", "uk"].includes(locale)) assert.deepEqual(metadata.alternates, [], href);
      assert.equal(metadata.canonical, `${ORIGIN}${href}`, href);
      assert.equal(metadata.marker, "NEXUALPHA_RADAR_ROUTE_V1", href);
      assert.equal(metadata.radarPayload.kind, kind, href);
      assert.equal(metadata.radarPayload.status, "unavailable", href);
      assert.deepEqual(schemaTypes(metadata.schema), ["BreadcrumbList", "WebPage"], href);
      assert.deepEqual(schemaTypes(seo.schemas), ["BreadcrumbList", "WebPage"], href);
      assert.equal(routeSeoPayload(metadata, new URL(`${ORIGIN}${href}`)).schema["@graph"].some((entry) => entry["@type"] === "FAQPage"), false, href);
    }
  }
});

test("radar pages SSR with empty or unavailable data and hydrate through the radar state key", async () => {
  const calls = [];
  const env = {
    ASSETS: assets(),
    RADAR_READ: async (kind) => ({ kind, status: "live", rows: kind === "long-short" ? [] : [{ asset: "BTC", amountUsd: 25000000 }], updatedAt: "2026-10-13T00:00:00Z", sources: ["runtime"] }),
    NEWS_SSR_RENDER: async (url, options) => {
      calls.push({ url, options });
      return `<main class="nxr nxr--${options.radar.kind}"><h1>${options.radar.kind}</h1></main>`;
    },
  };
  const longShort = await worker.fetch(new Request(`${ORIGIN}/long-short`, { headers: { accept: "text/html" } }), env);
  const whales = await worker.fetch(new Request(`${ORIGIN}/zh-hans/whales`, { headers: { accept: "text/html" } }), env);
  assert.equal(longShort.status, 200);
  assert.equal(longShort.headers.get("cache-control"), "no-store");
  assert.equal(whales.headers.get("cache-control"), "no-store");
  assert.equal(whales.status, 200);
  assert.deepEqual(calls.map((call) => call.options.radar.kind), ["long-short", "whales"]);
  assert.deepEqual(prerenderState(await longShort.text()).radar, { kind: "long-short", status: "live", rows: [], updatedAt: "2026-10-13T00:00:00Z", sources: ["runtime"] });
  assert.equal(prerenderState(await whales.text()).radar.rows[0].asset, "BTC");

  const unavailable = await worker.fetch(new Request(`${ORIGIN}/whales`, { headers: { accept: "text/html" } }), {
    ASSETS: assets(),
    RADAR_READ: async () => { throw new Error("offline"); },
    NEWS_SSR_RENDER: async (_url, options) => `<main class="nxr"><h1>${options.radar.status}</h1></main>`,
  });
  assert.equal(prerenderState(await unavailable.text()).radar.status, "unavailable");
});

test("radar inventory and sitemap cover every locale prefix", () => {
  const inventory = routeInventory();
  for (const pathname of ["/long-short", "/whales"]) {
    const route = inventory.find((item) => item.pathname === pathname);
    assert.ok(route, pathname);
    assert.equal(route.index, true, pathname);
    assert.equal(route.template, "radarTool", pathname);
    assert.deepEqual(route.locales, RADAR_INDEX_LOCALES, pathname);
  }
  const sitemap = buildSitemap(inventory, []);
  for (const locale of RADAR_INDEX_LOCALES) {
    assert.match(sitemap, new RegExp(`<loc>${ORIGIN}${localizedPath("/long-short", locale)}</loc>`), locale);
    assert.match(sitemap, new RegExp(`<loc>${ORIGIN}${localizedPath("/whales", locale)}</loc>`), locale);
  }
});
