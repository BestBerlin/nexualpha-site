import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { parsePublicRoute } from "../src/data/locale-routing.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { regionalAeoCoverageSummary } from "../src/data/regional-preview-copy.js";
import { routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import worker, { routeMetadata } from "../worker/index.js";

const forbiddenCommercialTokens = /https?:\/\/(?:www\.)?(?:bsmkweb|binance|bitget|okx|backpack)|nexu888|11350287|LUCKX|CANDY007|INS898|1836370407|luckybitcoin|guaranteed|bonus|cashback|reward|commission|referral code|invite code/i;

const shell = "<!doctype html><html lang=\"en\"><head><title>NexuAlpha</title><meta name=\"description\" content=\"base\"><meta name=\"robots\" content=\"index,follow\"></head><body><main>app</main></body></html>";

function assets() {
  return {
    fetch: async (request) => {
      const url = new URL(request.url);
      return url.pathname === "/index.html"
        ? new Response(shell, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } })
        : new Response("missing", { status: 404, headers: { "content-type": "text/plain" } });
    },
  };
}

function schemaArray(schema) {
  return Array.isArray(schema) ? schema : [schema].filter(Boolean);
}

function schemaOf(schema, type) {
  return schemaArray(schema).find((item) => item?.["@type"] === type);
}

test("R19 /us is an English owner country route with clean canonical parsing", () => {
  assert.deepEqual(parsePublicRoute("/us", new URLSearchParams()), {
    publicPathname: "/us",
    contentPathname: "/us",
    locale: "en",
    localeSource: "market",
    isCountryRoute: true,
    canonicalPathname: "/us",
  });

  const route = routeInventory([]).find((item) => item.pathname === "/us");
  assert.ok(route);
  assert.equal(route.template, "regionalPreview");
  assert.equal(route.index, true);
  assert.deepEqual(route.locales, ["en"]);
});

test("R19 /us client and Worker SEO stay indexable, source-backed and promise-free", async () => {
  const client = computeRouteSeo({ url: "/us", locale: "en", route: { name: "regionalPreview", market: "US" } });
  const server = await routeMetadata(new URL("https://nexualpha.com/us"), { ASSETS: assets() });

  for (const [label, seo, schemas] of [
    ["client", client, client.schemas],
    ["server", server, server.schema],
  ]) {
    assert.equal(seo.status, 200, label);
    assert.equal(seo.robots, "index,follow", label);
    assert.equal(seo.canonical, "https://nexualpha.com/us", label);
    assert.equal(seo.locale, "en", label);
    assert.match(seo.title, /United States|U\.S\./, label);
    assert.match(seo.description, /FinCEN|state|USD|identity|product/i, label);
    assert.doesNotMatch(JSON.stringify(seo), forbiddenCommercialTokens, label);

    const webPage = schemaOf(schemas, "WebPage");
    const faq = schemaOf(schemas, "FAQPage");
    assert.equal(webPage?.url, "https://nexualpha.com/us", label);
    assert.ok(webPage?.isBasedOn?.some((url) => /fincen\.gov/.test(url)), label);
    assert.ok(webPage?.isBasedOn?.some((url) => /nmlsconsumeraccess\.org/.test(url)), label);
    assert.ok(faq?.mainEntity?.length >= 3, label);
    assert.match(JSON.stringify(faq), /FinCEN MSB|NMLS|NYDFS|ACH|wire/i, label);
    assert.doesNotMatch(JSON.stringify(schemas), forbiddenCommercialTokens, label);
  }

  assert.deepEqual(server.alternates, [
    { hreflang: "en", href: "https://nexualpha.com/us" },
    { hreflang: "x-default", href: "https://nexualpha.com/us" },
  ]);
});

test("R19 /us SSR shell exposes the indexed U.S. research boundary", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/us", { headers: { accept: "text/html" } }), { ASSETS: assets() });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<html[^>]+lang="en"/);
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(html, /rel="canonical" href="https:\/\/nexualpha\.com\/us"/);
  assert.match(html, /United States crypto account checks|FinCEN MSB|NMLS|NYDFS|USD/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.doesNotMatch(html, forbiddenCommercialTokens);
});

test("R19 /us is present in public discovery generators", async () => {
  const prerenderSource = await readFile(new URL("../scripts/generate-prerender-manifest.mjs", import.meta.url), "utf8");
  const llmsSource = await readFile(new URL("../scripts/generate-public-llms.mjs", import.meta.url), "utf8");

  assert.match(prerenderSource, /"\/us": \["en"\]/);
  assert.match(prerenderSource, /"\/us"/);
  assert.match(llmsSource, /https:\/\/nexualpha\.com\/us/);
  assert.match(llmsSource, /us-fincen-msb-non-endorsement/);
});

test("R19 /us visible AEO status matches its indexable publication state", () => {
  const summary = regionalAeoCoverageSummary({ market: "US", locale: "en" });
  assert.match(summary.publicationStatus, /Current public carrier: \/us\./i);
  assert.doesNotMatch(summary.publicationStatus, /noindex preview/i);
});
