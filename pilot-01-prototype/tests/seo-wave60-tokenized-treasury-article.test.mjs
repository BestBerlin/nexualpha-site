import { committedFileHash } from './r100-test-contracts.mjs';
import { budgetTitle } from '../src/data/meta-description.js';
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import pathModule from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import feed from "../public/content/news-feed.json" with { type: "json" };
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const path = "/news/tokenized-treasuries-structure-access-risks";
const canonical = `https://nexualpha.com${path}`;
const assetUrl = "https://nexualpha.com/research/wave48-tokenized-treasury-rights-ops.json";
const expectedTitle = budgetTitle("Tokenized Treasuries: BUIDL, BENJI, Ownership and Redemption Checks — NexuAlpha");
const expectedDescription = "Check what a tokenized Treasury legally represents before comparing yield: issuer, recordkeeper, custodian, redemption path, wallet controls and eligibility.";
const protectedPartnerRegistrySha = committedFileHash('src/data/partner-registry.js');

function assets() {
  return { fetch: async () => new Response(JSON.stringify(feed), { headers: { "content-type": "application/json" } }) };
}

function graph(schema) {
  return schema?.["@graph"] || (Array.isArray(schema) ? schema : [schema]);
}

async function renderNewsDetailHtml(locale = "en") {
  const dir = await mkdtemp(pathModule.join(root, "tests/.tmp-wave60-news-"));
  try {
    const entry = pathModule.join(dir, "entry.mjs");
    const bundle = pathModule.join(dir, "bundle.cjs");
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import feed from '../../public/content/news-feed.json' with { type: 'json' };
      import { NewsDetailPage } from '../../src/components/v3/news/NewsDetailPage.jsx';
      const html = renderToStaticMarkup(React.createElement(NewsDetailPage, {
        slug: 'tokenized-treasuries-structure-access-risks',
        locale: '${locale}',
        initialArticles: feed.articles,
      }));
      console.log(JSON.stringify({ html }));
    `);
    await build({
      entryPoints: [entry],
      bundle: true,
      platform: "node",
      format: "cjs",
      outfile: bundle,
      loader: {
        ".css": "empty",
        ".json": "json",
        ".svg": "text",
        ".png": "dataurl",
        ".jpg": "dataurl",
        ".jpeg": "dataurl",
      },
      logLevel: "silent",
      define: {
        "import.meta.env.DEV": "false",
        "import.meta.env.PROD": "true",
        "import.meta.env.SSR": "true",
        "import.meta.env.VITE_DATA_SOURCE": "\"local-research\"",
      },
    });
    return JSON.parse(execFileSync(process.execPath, [bundle], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })).html;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("Wave60 keeps the dated article identity frozen and exposes its existing rights-and-operations asset", async () => {
  const article = feed.articles.find((entry) => entry.slug === path.slice(6));
  const client = computeRouteSeo({ url: path, locale: "en", article });
  const worker = await routeMetadata(new URL(canonical), { ASSETS: assets() });

  for (const route of [client, worker]) {
    assert.equal(route.title, expectedTitle);
    assert.equal(route.description, expectedDescription);
    assert.equal(route.canonical, canonical);
    assert.equal(route.robots, "index,follow");
  }

  const clientNews = client.schemas.find((schema) => schema["@type"] === "NewsArticle");
  const workerNews = graph(worker.schema).find((schema) => schema["@type"] === "NewsArticle");
  for (const schema of [clientNews, workerNews]) {
    const dataset = schema.hasPart.find((part) => part["@type"] === "Dataset" && part.url === assetUrl);
    assert.ok(dataset);
    assert.match(dataset.abstract, /five products across four distinct product types/);
    assert.ok(schema.mainEntityOfPage.relatedLink.includes(assetUrl));
  }
});

test("Wave60 binds every tokenized Treasury article FAQ to specific sources in client and Worker", async () => {
  const article = feed.articles.find((entry) => entry.slug === path.slice(6));
  const client = computeRouteSeo({ url: path, locale: "en", article });
  const worker = await routeMetadata(new URL(canonical), { ASSETS: assets() });
  const clientFaq = client.schemas.find((schema) => schema["@type"] === "FAQPage");
  const workerFaq = graph(worker.schema).find((schema) => schema["@type"] === "FAQPage");

  assert.deepEqual(workerFaq.mainEntity, clientFaq.mainEntity);
  assert.ok(clientFaq.mainEntity.length >= 4);
  assert.ok(clientFaq.mainEntity.every((entry) => entry.acceptedAnswer.citation?.includes(assetUrl)));
  assert.ok(clientFaq.mainEntity.every((entry) => entry.acceptedAnswer.citation.length >= 3));
  const definitionAnswer = clientFaq.mainEntity.find((entry) => entry.name === "What are tokenized Treasuries?");
  assert.ok(definitionAnswer);
  assert.match(definitionAnswer.acceptedAnswer.text, /blockchain-recorded products that reference Treasury-bill or Treasury-fund exposure/);
  assert.match(definitionAnswer.acceptedAnswer.text, /token label alone does not prove direct Treasury ownership/);
  assert.match(definitionAnswer.acceptedAnswer.text, /issuer or legal wrapper, recordkeeper, custodian, redemption path/);
  assert.ok(definitionAnswer.acceptedAnswer.citation.some((url) => /buying-a-marketable-security/.test(url)));
  assert.ok(definitionAnswer.acceptedAnswer.citation.some((url) => /tokenized-securities/.test(url)));
  const claimAnswer = clientFaq.mainEntity.find((entry) => /BUIDL and BENJI.*same structure/i.test(entry.name));
  assert.ok(claimAnswer.acceptedAnswer.citation.some((url) => /2094496/.test(url)));
  assert.ok(claimAnswer.acceptedAnswer.citation.some((url) => /9001-PSUM/.test(url)));
});

test("Wave60 makes the matrix finding visible without introducing a new page or commercial claim", async () => {
  const component = await readFile(new URL("../src/components/v3/news/NewsDetailPage.jsx", import.meta.url), "utf8");
  const html = await renderNewsDetailHtml("en");

  assert.match(component, /reviewed matrix covers five products across four product types/);
  assert.match(component, /Open rights and operations matrix/);
  assert.match(component, /\/research\/wave48-tokenized-treasury-rights-ops\.json/);
  assert.doesNotMatch(component, /Canonical tokenized Treasury owner/);
  assert.doesNotMatch(component, /guaranteed yield|guaranteed ownership|private commission/i);

  assert.match(html, /href="\/topics\/tokenized-treasuries#treasury-evidence-checklist"/);
  assert.match(html, /Open tokenized Treasury checklist/);
  assert.doesNotMatch(html, /Canonical tokenized Treasury owner/);
});

test("Wave60 preserves the protected partner registry", async () => {
  const source = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(source).digest("hex"), protectedPartnerRegistrySha);
});
