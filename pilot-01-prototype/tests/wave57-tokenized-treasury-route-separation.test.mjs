import { committedFileHash } from './r100-test-contracts.mjs';
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
const assetUrl = new URL("../public/research/wave48-tokenized-treasury-rights-ops.json", import.meta.url);
const protectedPartnerRegistrySha = committedFileHash("src/data/partner-registry.js");
const findingPattern = /(?:Wave57 )?finding: the reviewed tokenized Treasury matrix covers five products across four distinct product types/i;

function assets() {
  return {
    fetch: async () => new Response("missing", { status: 404, headers: { "content-type": "text/plain" } }),
  };
}

function schemas(value) {
  const graph = value?.["@graph"] || value || [];
  return Array.isArray(graph) ? graph : [graph];
}

function findDataset(value) {
  return schemas(value)
    .flatMap((schema) => [schema, ...(schema?.hasPart || []), schema?.subjectOf].filter(Boolean))
    .find((schema) => schema?.["@type"] === "Dataset" && schema.url === "https://nexualpha.com/research/wave48-tokenized-treasury-rights-ops.json");
}

test("Wave57 tokenized Treasury finding is derived from the existing rights-and-operations matrix", async () => {
  const asset = JSON.parse(await readFile(assetUrl, "utf8"));
  const finding = asset.findings.find((item) => item.id === "wave57-tokenized-treasury-route-separation");
  const productTypes = new Set(asset.products.map((product) => product.productType));

  assert.ok(finding, "Wave57 finding should be present");
  assert.equal(finding.asOf, "2026-09-16T00:00:00+08:00");
  assert.equal(finding.stats.reviewedProductCount, asset.products.length);
  assert.equal(finding.stats.distinctProductTypeCount, productTypes.size);
  assert.equal(finding.stats.requiredFieldCount, asset.requiredFields.length);
  assert.equal(finding.stats.sourceRegisterCount, asset.sourceRegister.length);
  assert.deepEqual(finding.evidenceProductIds.toSorted(), asset.products.map((product) => product.id).toSorted());
  assert.match(finding.statement, /issuer\/legal wrapper, recordkeeper, custody, redemption, eligibility jurisdiction and yield basis/i);
  assert.match(finding.comparisonBoundary, /Do not collapse fund shares/i);
  assert.doesNotMatch(JSON.stringify(finding), /private commission|invite code|referral route|guaranteed registration|guaranteed redemption/i);
});

test("Wave57 tokenized Treasury finding is exposed in client and Worker Dataset schema", async () => {
  const clientDataset = findDataset(computeRouteSeo({ url: "/topics/tokenized-treasuries", locale: "en" }).schemas);
  const workerDataset = findDataset((await routeMetadata(new URL("https://nexualpha.com/topics/tokenized-treasuries"), { ASSETS: assets() })).schema);

  for (const dataset of [clientDataset, workerDataset]) {
    assert.ok(dataset, "tokenized Treasury Dataset schema should be discoverable");
    assert.equal(dataset.dateModified, "2026-09-16");
    assert.match(dataset.abstract, findingPattern);
    assert.match(dataset.description, /before comparing yield, token addresses or venue access/i);
    assert.ok(dataset.variableMeasured.includes("productType"));
    assert.equal(dataset.isPartOf, "https://nexualpha.com/topics/tokenized-treasuries");
    assert.doesNotMatch(JSON.stringify(dataset), /private commission|invite code|ref=|guaranteed registration|guaranteed redemption/i);
  }
});

// SEO audit 2026-10-11 #9 (owner-approved): llms*.txt list partner invite codes with the commission disclosure and drop
// internal wave labels, so these checks no longer forbid the words "invite code".
test("Wave57 finding is visible on the tokenized Treasuries page source and AI source index", async () => {
  const component = await readFile(new URL("../src/components/v3/TokenizedAssetsPage.jsx", import.meta.url), "utf8");
  assert.match(component, /Citation-ready finding · 2026-09-16/);
  assert.match(component, findingPattern);

  const outputDir = await mkdtemp(join(tmpdir(), "nexualpha-llms-wave57-"));
  try {
    await execFileAsync(process.execPath, ["scripts/generate-public-llms.mjs"], {
      cwd: rootPath,
      env: { ...process.env, NEXUALPHA_LLMS_OUTPUT_DIR: outputDir },
    });
    const llms = await readFile(join(outputDir, "llms.txt"), "utf8");
    const full = await readFile(join(outputDir, "llms-full.txt"), "utf8");
    for (const text of [llms, full]) {
      assert.match(text, findingPattern);
      assert.match(text, /Canonical owner: https:\/\/nexualpha\.com\/topics\/tokenized-treasuries/);
      assert.doesNotMatch(text, /private commission|guaranteed registration|guaranteed redemption/i);
    }
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("Wave57 tokenized Treasury work preserves the protected partner registry", async () => {
  const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(partnerRegistry).digest("hex"), protectedPartnerRegistrySha);
});
