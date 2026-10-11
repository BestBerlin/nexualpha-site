import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const execFileAsync = promisify(execFile);
const rootPath = fileURLToPath(new URL("..", import.meta.url));
const protectedPartnerRegistrySha = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";
const perpWave48Json = "https://nexualpha.com/research/wave48-perp-dex-cost-citations.json";
const perpWave48Csv = "https://nexualpha.com/research/wave48-perp-dex-cost-citations.csv";
const perpDictionaryOwner = "https://nexualpha.com/topics/derivatives#perp-cost-field-dictionary";
const tokenizedTreasuryWave48Json = "https://nexualpha.com/research/wave48-tokenized-treasury-rights-ops.json";

function assets() {
  return {
    fetch: async () => new Response("missing", { status: 404, headers: { "content-type": "text/plain" } }),
  };
}

function schemas(value) {
  const graph = value?.["@graph"] || value || [];
  return Array.isArray(graph) ? graph : [graph];
}

function findSchema(value, type) {
  return schemas(value).find((schema) => schema?.["@type"] === type);
}

function hasPartUrls(schema) {
  return (schema?.hasPart || []).map((part) => part.url).filter(Boolean);
}

test("Wave49 keeps Wave48 citation assets owned by derivatives and tokenized Treasuries canonicals", async () => {
  const clientDerivatives = findSchema(computeRouteSeo({ url: "/topics/derivatives", locale: "en" }).schemas, "CollectionPage");
  const workerDerivatives = findSchema((await routeMetadata(new URL("https://nexualpha.com/topics/derivatives"), { ASSETS: assets() })).schema, "CollectionPage");

  for (const schema of [clientDerivatives, workerDerivatives]) {
    assert.ok(schema, "derivatives CollectionPage schema");
    assert.ok(hasPartUrls(schema).includes(perpWave48Json), "Wave48 perp JSON is discoverable");
    assert.ok(hasPartUrls(schema).includes(perpWave48Csv), "Wave48 perp CSV is discoverable");
    const dataset = schema.hasPart.find((part) => part["@type"] === "Dataset" && part.name === "Wave48 Perp DEX cost citations");
    assert.equal(dataset.isPartOf, perpDictionaryOwner);
    assert.match(dataset.conditionsOfAccess, /not a live quote/i);
    assert.doesNotMatch(JSON.stringify(dataset), /\/ref\/|ref=|commission|guaranteed registration|guaranteed eligibility/i);
  }

  const clientTreasuries = findSchema(computeRouteSeo({ url: "/topics/tokenized-treasuries", locale: "en" }).schemas, "CollectionPage");
  const workerTreasuries = findSchema((await routeMetadata(new URL("https://nexualpha.com/topics/tokenized-treasuries"), { ASSETS: assets() })).schema, "CollectionPage");

  for (const schema of [clientTreasuries, workerTreasuries]) {
    assert.ok(schema, "tokenized Treasuries CollectionPage schema");
    assert.equal(schema.url, "https://nexualpha.com/topics/tokenized-treasuries");
    assert.ok(hasPartUrls(schema).includes(tokenizedTreasuryWave48Json), "Wave48 tokenized Treasury JSON is discoverable");
    assert.equal(schema.subjectOf?.["@type"], "Dataset");
    assert.equal(schema.subjectOf?.url, tokenizedTreasuryWave48Json);
    assert.equal(schema.subjectOf?.isPartOf, "https://nexualpha.com/topics/tokenized-treasuries");
    assert.ok(schema.relatedLink.includes(tokenizedTreasuryWave48Json));
    assert.doesNotMatch(JSON.stringify(schema), /direct ownership guarantee|yield guarantee|guaranteed registration|private commission|invite code|\/ref\/|ref=/i);
  }
});

test("Wave49 Perp DEX related links preserve existing canonicals and Wave46 Hyperliquid copy", async () => {
  const hyperliquid = computeRouteSeo({ url: "/exchanges/hyperliquid", locale: "en" });
  const dydx = computeRouteSeo({ url: "/exchanges/dydx", locale: "en" });
  const comparison = computeRouteSeo({ url: "/compare/hyperliquid-vs-dydx", locale: "en" });

  assert.equal(hyperliquid.title, "Hyperliquid Fees, Referral Discount and Funded Account Checks — NexuAlpha");
  assert.match(hyperliquid.description, /rolling 14-day fee tiers/);
  assert.match(hyperliquid.description, /funded-account claim boundaries/);
  assert.equal(comparison.canonical, "https://nexualpha.com/compare/hyperliquid-vs-dydx");

  for (const seo of [hyperliquid, dydx, comparison]) {
    const schema = findSchema(seo.schemas, "WebPage");
    assert.ok(schema.relatedLink.includes(perpDictionaryOwner), `${seo.canonical} should point to dictionary owner`);
    assert.doesNotMatch(schema.relatedLink.join("\n"), /\/ref\/|ref=|register|commission/i);
  }

  const workerComparison = await routeMetadata(new URL("https://nexualpha.com/compare/hyperliquid-vs-dydx"), { ASSETS: assets() });
  const workerSchema = findSchema(workerComparison.schema, "WebPage");
  assert.equal(workerComparison.canonical, "https://nexualpha.com/compare/hyperliquid-vs-dydx");
  assert.ok(workerSchema.relatedLink.includes(perpDictionaryOwner));
});

test("Wave49 llms generator exposes new assets without creating indexable research URLs", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "nexualpha-llms-wave49-"));
  try {
    await execFileAsync(process.execPath, ["scripts/generate-public-llms.mjs"], {
      cwd: rootPath,
      env: { ...process.env, NEXUALPHA_LLMS_OUTPUT_DIR: outputDir },
    });
    const llms = await readFile(join(outputDir, "llms.txt"), "utf8");
    const full = await readFile(join(outputDir, "llms-full.txt"), "utf8");
    for (const text of [llms, full]) {
      assert.match(text, /Perp DEX cost citations/);
      assert.doesNotMatch(text, /\bWave\d+\b/, "llms labels carry no internal wave names (SEO audit 2026-10-11 #9)");
      assert.match(text, /wave48-perp-dex-cost-citations\.json/);
      assert.match(text, /wave48-perp-dex-cost-citations\.csv/);
      assert.match(text, /Tokenized Treasury rights and operations/);
      assert.match(text, /wave48-tokenized-treasury-rights-ops\.json/);
      assert.match(text, /Canonical owner: https:\/\/nexualpha\.com\/topics\/tokenized-treasuries/);
      // Partner invite codes are listed with the commission disclosure since the SEO audit 2026-10-11 #9 (owner-approved).
      assert.doesNotMatch(text, /direct ownership guarantee|yield guarantee|guaranteed registration|private commission|\/ref\//i);
    }

    const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
    const newsSitemap = await readFile(new URL("../public/news-sitemap.xml", import.meta.url), "utf8");
    assert.doesNotMatch(`${sitemap}\n${newsSitemap}`, /wave48-(?:perp-dex-cost-citations|tokenized-treasury-rights-ops)/);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("Wave49 integration preserves protected partner registry SHA", async () => {
  const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(partnerRegistry).digest("hex"), protectedPartnerRegistrySha);
});
