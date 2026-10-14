import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import worker, { routeMetadata } from "../worker/index.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";

const DATA_LICENSE_URL = "https://nexualpha.com/methodology#data-license";
// Freeze the registry bytes currently shipped in this candidate. Any future
// invitation/link edit must intentionally update this gate and receive review.
const protectedPartnerRegistrySha = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";
const shell = "<!doctype html><html><head><title>Base</title><meta name=\"description\" content=\"Base\"></head><body><div id=\"root\"></div></body></html>";
const newsFeed = await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8");
const newsArticles = JSON.parse(newsFeed).articles || [];
const newsFingerprint = createHash("sha256").update(newsFeed).digest("hex");

function graph(schema) {
  const value = schema?.["@graph"] || schema || [];
  return Array.isArray(value) ? value : [value];
}

function collectDatasets(value, out = []) {
  if (!value || typeof value !== "object") return out;
  if (value["@type"] === "Dataset") out.push(value);
  if (Array.isArray(value)) {
    for (const item of value) collectDatasets(item, out);
    return out;
  }
  for (const item of Object.values(value)) collectDatasets(item, out);
  return out;
}

function assertDatasetLicense(dataset, label) {
  assert.ok(typeof dataset.description === "string" && dataset.description.trim().length >= 50, `${label} needs a 50+ character description`);
  assert.equal(dataset.license, DATA_LICENSE_URL, `${label} license`);
  assert.doesNotMatch(JSON.stringify(dataset), /creativecommons|CC BY|CC0/i, `${label} must not claim Creative Commons licensing`);
}

function assets() {
  return {
    async fetch(request) {
      const path = new URL(request.url).pathname;
      if (path === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
      if (path === "/content/news-feed.json") return new Response(newsFeed, { headers: { "content-type": "application/json" } });
      if (path === "/content/news-feed.sha256.txt") return new Response(newsFingerprint, { headers: { "content-type": "text/plain" } });
      if (path === "/prerender-manifest.json") {
        return Response.json({
          routes: {
            "/methodology|en": {
              html: "<main><section id=\"data-license\"><h3>NexuAlpha Data License and Source Boundary</h3><p>Access to NexuAlpha datasets does not grant redistribution rights. Contact contact@nexualpha.com for reuse, republication or licensing requests.</p></section></main>",
            },
          },
        });
      }
      return new Response("missing", { status: 404, headers: { "content-type": "text/plain" } });
    },
  };
}

test("Dataset schemas use the NexuAlpha data-license URL in client and Worker metadata", async () => {
  const cases = [
    "/methodology",
    "/factbook/binance",
    "/topics/derivatives",
    "/topics/tokenized-treasuries",
    "/news/tokenized-treasuries-structure-access-risks",
  ];

  for (const path of cases) {
    const article = path.startsWith("/news/")
      ? newsArticles.find((item) => item.slug === path.replace(/^\/news\//, ""))
      : null;
    const client = computeRouteSeo({ url: path, ...(article ? { article } : {}) });
    const workerMetadata = await routeMetadata(new URL(`https://nexualpha.com${path}`), { ASSETS: assets() });
    const datasets = [
      ...collectDatasets(client.schemas),
      ...collectDatasets(graph(workerMetadata.schema)),
    ];
    assert.ok(datasets.length > 0, `${path} should expose at least one Dataset for this contract`);
    for (const dataset of datasets) assertDatasetLicense(dataset, path);
  }
});

test("Sitemap routes recursively keep every Worker Dataset licensed and described", async () => {
  const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const urls = [...sitemap.matchAll(/<loc>(https:\/\/nexualpha\.com[^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.ok(urls.length > 400, "sitemap route inventory should be complete enough for a recursive contract");

  let datasetCount = 0;
  for (const loc of urls) {
    const metadata = await routeMetadata(new URL(loc), { ASSETS: assets() });
    for (const dataset of collectDatasets(graph(metadata.schema))) {
      datasetCount += 1;
      assertDatasetLicense(dataset, loc);
    }
  }
  assert.ok(datasetCount >= 20, "sitemap contract should find Dataset schemas across methodology, factbook and topic routes");
});

test("Methodology page exposes a visible data-license anchor and Worker HTML keeps it with injected schema", async () => {
  const component = await readFile(new URL("../src/components/v3/MethodologyPage.jsx", import.meta.url), "utf8");
  assert.match(component, /id="data-license"/);
  assert.match(component, /Access to NexuAlpha datasets does not grant redistribution rights/);
  assert.match(component, /访问 NexuAlpha 数据集不等于获得再分发授权/);
  assert.doesNotMatch(component, /Reusable research data|可复用研究数据|可重用研究資料/);

  const response = await worker.fetch(new Request("https://nexualpha.com/methodology", { headers: { accept: "text/html" } }), { ASSETS: assets() });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /id="data-license"/);
  assert.match(html, /does not grant redistribution rights/);
  assert.match(html, /"license":"https:\/\/nexualpha\.com\/methodology#data-license"/);
});

test("Public citation assets and protected partner registry keep the licensing boundary", async () => {
  for (const path of [
    "../public/research/wave48-perp-dex-cost-citations.json",
    "../public/research/wave48-tokenized-treasury-rights-ops.json",
  ]) {
    const asset = JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
    assert.equal(asset.license, DATA_LICENSE_URL);
    assert.match(asset.licenseScope, /Access does not grant redistribution rights/i);
    assert.match(asset.licenseScope, /Third-party source documents/i);
    assert.equal(asset.methodologyUrl, DATA_LICENSE_URL);
    assert.doesNotMatch(`${asset.license} ${asset.licenseScope}`, /creativecommons|CC BY|CC0/i);
  }

  const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(partnerRegistry).digest("hex"), protectedPartnerRegistrySha);
});
