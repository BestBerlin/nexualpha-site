import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

import worker, { routeMetadata } from "../worker/index.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";

const execFileAsync = promisify(execFile);
const datasetJson = "https://nexualpha.com/research/regional-funding-verification-matrix.json";
const datasetCsv = "https://nexualpha.com/research/regional-funding-verification-matrix.csv";
const limitations = /not a live-rate feed, account approval decision, funding availability promise, product-access promise, user-benefit promise or registration outcome/i;

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

function graph(metadata) {
  const schema = metadata.schema?.["@graph"] || metadata.schema || [];
  return Array.isArray(schema) ? schema : [schema];
}

function findDataset(schemas) {
  const nested = [];
  for (const schema of schemas) {
    if (schema?.["@type"] === "Dataset" && schema.url === datasetJson) nested.push(schema);
    for (const part of schema?.hasPart || []) {
      if (part?.["@type"] === "Dataset" && part.url === datasetJson) nested.push(part);
    }
    if (schema?.about?.["@type"] === "Dataset" && schema.about.url === datasetJson) nested.push(schema.about);
  }
  return nested[0] || null;
}

function assertDataset(dataset, label) {
  assert.ok(dataset, `${label} dataset`);
  assert.equal(dataset.name, "Regional funding verification matrix", `${label} name`);
  assert.equal(dataset.dateModified, "2026-09-15", `${label} review date`);
  assert.equal(dataset.sameAs, datasetCsv, `${label} csv sameAs`);
  assert.match(dataset.description, /BR, MX, TW, ID, EU, UK, US, JP, HK, KR, SG and TR/, `${label} coverage`);
  assert.match(dataset.conditionsOfAccess, limitations, `${label} limitations`);
  assert.ok(dataset.variableMeasured.includes("unknowns"), `${label} unknown fields`);
  assert.ok(dataset.distribution.some((item) => item.contentUrl === datasetJson && item.encodingFormat === "application/json"), `${label} JSON distribution`);
  assert.ok(dataset.distribution.some((item) => item.contentUrl === datasetCsv && item.encodingFormat === "text/csv"), `${label} CSV distribution`);
}

function assertRegionalFundingRouteSchemas(schemas, label) {
  const faq = schemas.find((schema) => schema?.["@type"] === "FAQPage" && JSON.stringify(schema).includes("How should international users verify crypto funding routes?"));
  const list = schemas.find((schema) => schema?.["@type"] === "ItemList" && schema.name === "Regional crypto funding route entry points");
  assert.ok(faq, `${label} regional funding FAQ`);
  assert.match(JSON.stringify(faq), /not a live fee quote, account approval promise, funding guarantee, user-benefit promise or registration outcome/i, `${label} bounded answer`);
  assert.ok(list, `${label} regional funding ItemList`);
  assert.ok(list.itemListElement.length >= 12, `${label} regional and comparison links`);
  for (const url of [
    "https://nexualpha.com/hk",
    "https://nexualpha.com/eu",
    "https://nexualpha.com/uk",
    "https://nexualpha.com/us",
    "https://nexualpha.com/jp?locale=ja",
    "https://nexualpha.com/kr?locale=ko",
    "https://nexualpha.com/sg",
    "https://nexualpha.com/tr/markets/turkiye",
    "https://nexualpha.com/br",
    "https://nexualpha.com/mx",
    "https://nexualpha.com/tw",
    "https://nexualpha.com/compare/binance-vs-okx",
    "https://nexualpha.com/compare/bybit-vs-bitget",
    "https://nexualpha.com/compare/hyperliquid-vs-dydx",
  ]) {
    assert.ok(list.itemListElement.some((item) => item.url === url), `${label} includes ${url}`);
  }
  assert.doesNotMatch(JSON.stringify([faq, list]), /nexu888|11350287|partner\.bitget|guaranteed signup|guaranteed account|bonus guaranteed/i);
}

const regionalCases = [
  { path: "/hk", locale: "zh-Hant", market: "HK", canonical: "https://nexualpha.com/hk" },
  { path: "/eu", locale: "en", market: "EU", canonical: "https://nexualpha.com/eu" },
  { path: "/uk", locale: "en", market: "UK", canonical: "https://nexualpha.com/uk" },
  { path: "/jp?locale=ja", locale: "ja", market: "JP", canonical: "https://nexualpha.com/jp" },
  { path: "/kr?locale=ko", locale: "ko", market: "KR", canonical: "https://nexualpha.com/kr" },
  { path: "/tr/markets/turkiye", locale: "tr", market: "TR", canonical: "https://nexualpha.com/tr/markets/turkiye" },
];

test("Wave37 regional hubs expose regional funding matrix as a bounded Dataset without policy changes", async () => {
  for (const item of regionalCases) {
    const client = computeRouteSeo({ url: item.path, locale: item.locale, route: { name: "regionalPreview", market: item.market } });
    const server = await routeMetadata(new URL(`https://nexualpha.com${item.path}`), { ASSETS: assets() });
    assert.equal(client.canonical, item.canonical, item.path);
    assert.equal(server.canonical, item.canonical, item.path);
    assert.equal(client.robots, "index,follow", item.path);
    assert.equal(server.robots, "index,follow", item.path);
    assertDataset(findDataset(client.schemas), `${item.path} client`);
    assertDataset(findDataset(graph(server)), `${item.path} worker`);
  }
});

test("Wave37 methodology exposes the same Dataset in client and worker metadata", async () => {
  const client = computeRouteSeo({ url: "/methodology" });
  const server = await routeMetadata(new URL("https://nexualpha.com/methodology"), { ASSETS: assets() });
  assert.equal(client.canonical, "https://nexualpha.com/methodology");
  assert.equal(server.canonical, "https://nexualpha.com/methodology");
  assert.equal(client.robots, "index,follow");
  assert.equal(server.robots, "index,follow");
  assertDataset(findDataset(client.schemas), "methodology client");
  assertDataset(findDataset(graph(server)), "methodology worker");
  assertRegionalFundingRouteSchemas(client.schemas, "methodology client");
  assertRegionalFundingRouteSchemas(graph(server), "methodology worker");
});

test("Wave37 Worker HTML exposes stable matrix discovery meta only when schema cites the dataset", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/hk", { headers: { accept: "text/html" } }), { ASSETS: htmlAssets() });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<meta name="nexualpha-regional-funding-dataset" content="https:\/\/nexualpha\.com\/research\/regional-funding-verification-matrix\.json"/);
  assert.match(html, /<meta name="nexualpha-regional-funding-dataset-reviewed" content="2026-09-15"/);
  assert.match(html, limitations);
  assert.match(html, /<meta name="robots" content="index,follow"/);
});

test("Wave37 llms generator emits matrix Dataset review date, coverage, limitations and regional entry points", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "nexualpha-llms-wave37-"));
  try {
    await execFileAsync("node", [fileURLToPath(new URL("../scripts/generate-public-llms.mjs", import.meta.url))], {
      env: { ...process.env, NEXUALPHA_LLMS_OUTPUT_DIR: outDir },
      cwd: fileURLToPath(new URL("..", import.meta.url)),
    });
    const llms = await readFile(join(outDir, "llms.txt"), "utf8");
    const full = await readFile(join(outDir, "llms-full.txt"), "utf8");
    for (const text of [llms, full]) {
      assert.match(text, /Regional funding verification matrix/);
      assert.match(text, /Dataset reviewed: 2026-09-15/);
      assert.match(text, /stable JSON: https:\/\/nexualpha\.com\/research\/regional-funding-verification-matrix\.json/);
      assert.match(text, /stable CSV: https:\/\/nexualpha\.com\/research\/regional-funding-verification-matrix\.csv/);
      assert.match(text, /BR, MX, TW, ID, EU, UK, US, JP, HK, KR, SG and TR/);
      assert.match(text, /https:\/\/nexualpha\.com\/tw/);
      assert.match(text, /https:\/\/nexualpha\.com\/us/);
      assert.match(text, limitations);
      assert.match(text, /https:\/\/nexualpha\.com\/jp\?locale=ja/);
      assert.match(text, /https:\/\/nexualpha\.com\/kr\?locale=ko/);
      assert.match(text, /https:\/\/nexualpha\.com\/tr\/markets\/turkiye/);
    }
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});
