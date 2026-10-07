import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import worker, { routeMetadata } from "../worker/index.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { AUDIT_DATE as FACTBOOK_SOURCE_REVIEW_DATE } from "../src/data/factbook-registry.js";

function assets() {
  return { fetch: async () => new Response("missing", { status: 404, headers: { "content-type": "text/plain" } }) };
}

function htmlAssets() {
  return {
    fetch: async () => new Response('<!doctype html><html><head><title>Old</title><meta name="robots" content="noindex" /></head><body><div id="root"></div></body></html>', {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
  };
}

function clientSchemas(path, options = {}) {
  return computeRouteSeo({ url: path, ...options }).schemas || [];
}

function serverSchemas(path) {
  return routeMetadata(new URL(`https://nexualpha.com${path}`), { ASSETS: assets() }).then((metadata) => {
    const graph = metadata.schema?.["@graph"] || metadata.schema || [];
    return Array.isArray(graph) ? graph : [graph];
  });
}

function findSchema(schemas, type) {
  return schemas.find((schema) => schema?.["@type"] === type || schema?.["@type"]?.includes?.(type));
}

function assertTrust(schema, label, expectedDate) {
  assert.equal(schema.author?.name, "NexuAlpha Research Desk", `${label} author`);
  assert.equal(schema.reviewedBy?.name, "NexuAlpha Research Desk", `${label} reviewer`);
  assert.equal(schema.publisher?.name, "NexuAlpha", `${label} publisher`);
  assert.equal(schema.isAccessibleForFree, true, `${label} free access`);
  if (expectedDate) assert.equal(schema.dateModified, expectedDate, `${label} dateModified`);
  assert.ok(schema.citation.includes("https://nexualpha.com/methodology"), `${label} methodology citation`);
  assert.ok(schema.citation.includes("https://nexualpha.com/llms.txt"), `${label} llms citation`);
  assert.ok(schema.citation.includes("https://nexualpha.com/llms-full.txt"), `${label} llms-full citation`);
  const assetUrls = (schema.hasPart || []).map((item) => item.url);
  assert.ok(assetUrls.includes("https://nexualpha.com/research/perp-dex-cost-field-dictionary.json"), `${label} perp JSON asset`);
  assert.ok(assetUrls.includes("https://nexualpha.com/research/regional-funding-verification-matrix.csv"), `${label} regional CSV asset`);
}

test("Wave35 client and worker expose research-desk attribution on high-value comparison and topic pages", async () => {
  const cases = [
    ["/compare/bybit-vs-bitget", "WebPage", "2026-09-22"],
    ["/topics/derivatives", "CollectionPage", "2026-09-22"],
    ["/factbook/binance", "Dataset", FACTBOOK_SOURCE_REVIEW_DATE],
  ];

  for (const [path, type, expectedDate] of cases) {
    const client = findSchema(clientSchemas(path), type);
    const server = findSchema(await serverSchemas(path), type);
    assert.ok(client, `${path} client ${type}`);
    assert.ok(server, `${path} server ${type}`);
    assertTrust(client, `${path} client`, expectedDate);
    assertTrust(server, `${path} worker`, expectedDate);
  }
});

test("Wave35 regional AEO route keeps index policy while exposing source-review trust fields", async () => {
  const metadata = await routeMetadata(new URL("https://nexualpha.com/hk"), { ASSETS: assets() });
  const page = findSchema(metadata.schema, "WebPage");

  assert.equal(metadata.robots, "index,follow");
  assert.equal(metadata.canonical, "https://nexualpha.com/hk");
  assertTrust(page, "/hk worker", "2026-09-15");
});

test("Wave35 llms surfaces expose visible editorial attribution and machine-readable assets", async () => {
  const llms = await readFile(new URL("../public/llms.txt", import.meta.url), "utf8");
  const full = await readFile(new URL("../public/llms-full.txt", import.meta.url), "utf8");

  for (const text of [llms, full]) {
    assert.match(text, /## Editorial attribution for AI citation/);
    assert.match(text, /Publisher: NexuAlpha/);
    assert.match(text, /Research author and reviewer: NexuAlpha Research Desk/);
    assert.match(text, /https:\/\/nexualpha\.com\/methodology/);
    assert.match(text, /https:\/\/nexualpha\.com\/llms-full\.txt/);
    assert.match(text, /perp-dex-cost-field-dictionary\.json/);
    assert.match(text, /regional-funding-verification-matrix\.csv/);
    assert.match(text, /not a personal credential, financial adviser, broker, exchange operator or regulator/i);
  }
});

test("Wave35 worker HTML exposes extractable trust meta without changing index policy", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/topics/derivatives", { headers: { accept: "text/html" } }), { ASSETS: htmlAssets() });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<meta name="robots" content="index,follow"/);
  assert.match(html, /<meta name="author" content="NexuAlpha Research Desk"/);
  assert.match(html, /<meta name="nexualpha-last-reviewed" content="2026-09-22"/);
  assert.match(html, /<meta name="nexualpha-methodology" content="https:\/\/nexualpha\.com\/methodology"/);
  assert.match(html, /<meta name="nexualpha-llms" content="https:\/\/nexualpha\.com\/llms\.txt"/);
  assert.match(html, /<script id="nexualpha-route-schema" type="application\/ld\+json">/);
});

test("Wave54 scopes Treasury discovery and Dataset semantics to its canonical owner", async () => {
  for (const schemas of [clientSchemas("/topics/derivatives"), await serverSchemas("/topics/derivatives")]) {
    const treasuryParts = schemas.flatMap((schema) => schema.hasPart || [])
      .filter((part) => part.url === "https://nexualpha.com/research/wave48-tokenized-treasury-rights-ops.json");
    assert.equal(treasuryParts.length, 0);
  }

  for (const schemas of [clientSchemas("/topics/tokenized-treasuries"), await serverSchemas("/topics/tokenized-treasuries")]) {
    const datasets = schemas.flatMap((schema) => [schema, ...(schema.hasPart || []), schema.subjectOf].filter(Boolean));
    assert.ok(datasets.some((part) => part["@type"] === "Dataset"
      && part.url === "https://nexualpha.com/research/wave48-tokenized-treasury-rights-ops.json"));
  }
});
